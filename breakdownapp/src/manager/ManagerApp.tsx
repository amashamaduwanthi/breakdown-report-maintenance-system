import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  appendBreakdownUpdate,
  assignTechnician,
  loginUser,
  logoutUser,
  registerReporter,
  subscribeAllBreakdowns,
  subscribeTechnicians,
  updateBreakdownStatus,
  verifyRole
} from "../firebase/services";
import { getFirebaseAuth } from "../firebase/client";
import type { BreakdownRecord, UserProfile, UserRole } from "../types/firebase";
import "./manager.css";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected"
};

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short"
});

interface AuthState {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  error: string;
  submitting: boolean;
}

export default function ManagerApp() {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof auth.currentUser> | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState<AuthState>({
    email: "",
    password: "",
    displayName: "",
    role: "",
    error: "",
    submitting: false
  });

  const [breakdowns, setBreakdowns] = useState<BreakdownRecord[]>([]);
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const breakdownsUnsub = useRef<ReturnType<typeof subscribeAllBreakdowns> | null>(null);
  const techniciansUnsub = useRef<ReturnType<typeof subscribeTechnicians> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        cleanupSubscriptions();
        setCurrentUser(null);
        setProfile(null);
        setAuthChecked(true);
        return;
      }

      try {
        const verified = await verifyRole(user.uid, ["manager", "technician"]);
        setCurrentUser(user);
        setProfile(verified);
        attachSubscriptions();
      } catch (error) {
        setForm((state) => ({ ...state, error: (error as Error).message }));
        await logoutUser();
        cleanupSubscriptions();
        setCurrentUser(null);
        setProfile(null);
      } finally {
        setAuthChecked(true);
      }
    });

    return () => {
      unsubscribe();
      cleanupSubscriptions();
    };
  }, [auth]);

  const cleanupSubscriptions = () => {
    if (breakdownsUnsub.current) {
      breakdownsUnsub.current();
      breakdownsUnsub.current = null;
    }
    if (techniciansUnsub.current) {
      techniciansUnsub.current();
      techniciansUnsub.current = null;
    }
    setBreakdowns([]);
    setTechnicians([]);
  };

  const attachSubscriptions = () => {
    cleanupSubscriptions();
    breakdownsUnsub.current = subscribeAllBreakdowns(setBreakdowns);
    techniciansUnsub.current = subscribeTechnicians(setTechnicians);
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForm((state) => ({ ...state, submitting: true, error: "" }));
    try {
      if (mode === "login") {
        await loginUser(form.email.trim(), form.password.trim());
      } else {
        if (!form.displayName.trim()) {
          throw new Error("Display name is required.");
        }
        await registerReporter(
          form.email.trim(),
          form.password.trim(),
          form.displayName.trim(),
          form.role
        );
      }
    } catch (error) {
      setForm((state) => ({ ...state, error: (error as Error).message }));
    } finally {
      setForm((state) => ({ ...state, submitting: false }));
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setForm((state) => ({
      ...state,
      error: "",
      submitting: false
    }));
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const stats = useMemo(() => ({
    pending: breakdowns.filter((item) => item.status === "pending").length,
    approved: breakdowns.filter((item) => item.status === "approved").length,
    inProgress: breakdowns.filter((item) => item.status === "in_progress").length,
    resolved: breakdowns.filter((item) => item.status === "resolved").length
  }), [breakdowns]);

  if (!authChecked) {
    return (
      <div className="manager-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="manager-page">
      <header className="manager-header">
        <div>
          <h1>Maintenance Manager</h1>
          <p>Real-time tracking for breakdown reports across the organization.</p>
        </div>
        {currentUser && profile ? (
          <div className="manager-header__user">
            <div className="manager-header__identity">
              <span>{currentUser.email}</span>
              <span className="role">{profile.role}</span>
            </div>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : null}
      </header>

      <main className="manager-main">
        {!currentUser || !profile ? (
          <section className="card auth-card">
            <h2>{mode === "login" ? "Manager / Technician Login" : "Register Manager / Technician"}</h2>
            <form onSubmit={handleAuthSubmit} className="form">
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
                  minLength={6}
                  required
                />
              </label>
              {mode === "register" ? (
                <>
                  <label>
                    Display name
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={(event) =>
                        setForm((state) => ({ ...state, displayName: event.target.value }))
                      }
                      minLength={2}
                      required
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={form.role}
                      onChange={(event) =>
                        setForm((state) => ({
                          ...state,
                          role: event.target.value as UserRole
                        }))
                      }
                    >
                      <option value="manager">Manager</option>
                      <option value="technician">Technician</option>
                    </select>
                  </label>
                </>
              ) : null}
              <button type="submit" disabled={form.submitting}>
                {form.submitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login"
                    : "Create account"}
              </button>
            </form>
            <p className="error-text">{form.error}</p>
            <p className="info">
              {mode === "login"
                ? "Need to create an account?"
                : "Already registered?"}
              <button type="button" className="link-button" onClick={toggleMode}>
                {mode === "login" ? "Register" : "Back to login"}
              </button>
            </p>
          </section>
        ) : (
          <div className="manager-grid">
            <section className="card summary-card">
              <h2>Dashboard</h2>
              <div className="summary-grid">
                <SummaryItem label="Pending" value={stats.pending} tone="warning" />
                <SummaryItem label="Approved" value={stats.approved} tone="info" />
                <SummaryItem label="In Progress" value={stats.inProgress} tone="primary" />
                <SummaryItem label="Resolved" value={stats.resolved} tone="success" />
              </div>
            </section>

            <ReportBoard
              breakdowns={breakdowns}
              technicians={technicians}
              profile={profile}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryItem({ label, value, tone }: { label: string; value: number; tone: "warning" | "info" | "primary" | "success" }) {
  return (
    <div className={`summary-item summary-item--${tone}`}>
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value}</span>
    </div>
  );
}

function ReportBoard({
  breakdowns,
  technicians,
  profile
}: {
  breakdowns: BreakdownRecord[];
  technicians: UserProfile[];
  profile: UserProfile;
}) {
  const pending = breakdowns.filter((item) => item.status === "pending");
  const active = breakdowns.filter((item) => item.status === "approved" || item.status === "in_progress");
  const resolved = breakdowns.filter((item) => item.status === "resolved" || item.status === "rejected");

  return (
    <div className="board-grid">
      <BoardSection
        title="Pending Reports"
        empty="No pending reports."
        items={pending}
        technicians={technicians}
        profile={profile}
      />
      <BoardSection
        title="Active Reports"
        empty="No active reports."
        items={active}
        technicians={technicians}
        profile={profile}
      />
      <BoardSection
        title="Resolved / Rejected"
        empty="No resolved reports yet."
        items={resolved}
        technicians={technicians}
        profile={profile}
      />
    </div>
  );
}

function BoardSection({
  title,
  empty,
  items,
  technicians,
  profile
}: {
  title: string;
  empty: string;
  items: BreakdownRecord[];
  technicians: UserProfile[];
  profile: UserProfile;
}) {
  const sorted = [...items].sort((a, b) => (b.timestamps?.createdAt || 0) - (a.timestamps?.createdAt || 0));
  return (
    <section className="card board-section">
      <h2>{title}</h2>
      {!sorted.length ? (
        <p className="empty">{empty}</p>
      ) : (
        <div className="board-list">
          {sorted.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              technicians={technicians}
              profile={profile}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReportCard({
  report,
  technicians,
  profile
}: {
  report: BreakdownRecord;
  technicians: UserProfile[];
  profile: UserProfile;
}) {
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [fixDetails, setFixDetails] = useState(report.fixDetails || "");
  const [updateMessage, setUpdateMessage] = useState("");

  const createdAt = report.timestamps?.createdAt ? formatter.format(new Date(report.timestamps.createdAt)) : "Just now";
  const approvedAt = report.timestamps?.approvedAt ? formatter.format(new Date(report.timestamps.approvedAt)) : null;
  const resolvedAt = report.timestamps?.resolvedAt ? formatter.format(new Date(report.timestamps.resolvedAt)) : null;

  const updates = report.updates ? Object.values(report.updates) : [];

  const isManager = profile.role === "manager";
  const isTechnician = profile.role === "technician";
  const canAssign = isManager && report.status === "pending";
  const canApprove = isManager && report.status === "pending";
  const canReject = isManager && report.status === "pending";
  const canStart = (isManager || (isTechnician && report.assignedTechnician?.uid === profile.uid)) && report.status === "approved";
  const canResolve = (isManager || (isTechnician && report.assignedTechnician?.uid === profile.uid)) && (report.status === "approved" || report.status === "in_progress");

  const handleAssign = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const technician = technicians.find((tech) => tech.uid === event.target.value);
    if (!technician) {
      return;
    }
    setAssigning(true);
    try {
      await assignTechnician(report.id, { uid: technician.uid, name: technician.displayName }, report);
    } catch (error) {
      console.error(error);
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (status: "approved" | "rejected" | "in_progress" | "resolved") => {
    setUpdatingStatus(true);
    try {
      await updateBreakdownStatus(report.id, status, fixDetails);
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePostUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!updateMessage.trim()) {
      return;
    }
    try {
      await appendBreakdownUpdate(report.id, {
        authorUid: profile.uid,
        authorName: profile.displayName,
        message: updateMessage.trim()
      });
      setUpdateMessage("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <article className="report-card">
      <header className="report-card__header">
        <div>
          <h3>{report.message}</h3>
          <p className="meta">
            Reporter: {report.reporterName} ({report.reporterEmail})
          </p>
        </div>
        <span className={`status status--${report.status}`}>
          {STATUS_LABELS[report.status] || report.status}
        </span>
      </header>

      <div className="report-card__body">
        <p className="meta">Created: {createdAt}</p>
        {approvedAt ? <p className="meta">Approved: {approvedAt}</p> : null}
        {resolvedAt ? <p className="meta">Resolved: {resolvedAt}</p> : null}
        <p className="meta">Priority: {report.priority}</p>
        {report.assignedTechnician ? (
          <p className="meta">Technician: {report.assignedTechnician.name}</p>
        ) : (
          <p className="meta">Technician: Not assigned</p>
        )}
      </div>

      <div className="report-card__actions">
        {canAssign ? (
          <label className="assign">
            Assign technician
            <select onChange={handleAssign} disabled={assigning} value={report.assignedTechnician?.uid || ""}>
              <option value="">-- Select technician --</option>
              {technicians.map((tech) => (
                <option key={tech.uid} value={tech.uid}>
                  {tech.displayName}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="action-buttons">
          {canApprove ? (
            <button type="button" onClick={() => handleStatusUpdate("approved")} disabled={updatingStatus}>
              Approve
            </button>
          ) : null}
          {canReject ? (
            <button
              type="button"
              className="danger"
              onClick={() => handleStatusUpdate("rejected")}
              disabled={updatingStatus}
            >
              Reject
            </button>
          ) : null}
          {canStart ? (
            <button type="button" onClick={() => handleStatusUpdate("in_progress")} disabled={updatingStatus}>
              Start progress
            </button>
          ) : null}
          {canResolve ? (
            <button type="button" className="success" onClick={() => handleStatusUpdate("resolved")} disabled={updatingStatus}>
              Mark resolved
            </button>
          ) : null}
        </div>
      </div>

      <div className="report-card__notes">
        <label>
          Fix details / Notes
          <textarea value={fixDetails} onChange={(event) => setFixDetails(event.target.value)} rows={3} />
        </label>
      </div>

      <section className="report-card__updates">
        <h4>Updates</h4>
        {!updates.length ? (
          <p className="empty">No updates yet.</p>
        ) : (
          <ul>
            {updates
              .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
              .map((update, index) => (
                <li key={`${update.createdAt}-${index}`}>
                  <div className="update-meta">
                    <span>{update.authorName || update.authorUid}</span>
                    <span>{update.createdAt ? formatter.format(new Date(update.createdAt)) : "Now"}</span>
                  </div>
                  <p>{update.message}</p>
                </li>
              ))}
          </ul>
        )}
        <form className="update-form" onSubmit={handlePostUpdate}>
          <label>
            Add update
            <textarea
              rows={2}
              value={updateMessage}
              onChange={(event) => setUpdateMessage(event.target.value)}
              placeholder="Share progress or notes"
            />
          </label>
          <button type="submit">Post update</button>
        </form>
      </section>
    </article>
  );
}
