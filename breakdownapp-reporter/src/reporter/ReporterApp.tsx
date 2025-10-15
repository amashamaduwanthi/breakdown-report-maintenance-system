import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  appendBreakdownUpdate,
  ensureUserProfile,
  loginUser,
  logoutUser,
  registerReporter,
  subscribeReporterBreakdowns,
  submitBreakdownReport,
  verifyRole
} from "../firebase/services";
import { getFirebaseAuth } from "../firebase/client";
import type { BreakdownRecord } from "../types/firebase";
import "./reporter.css";

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

interface FormState {
  email: string;
  password: string;
  displayName: string;
  error: string;
  submitting: boolean;
}

interface ReportFormState {
  message: string;
  priority: "low" | "medium" | "high";
  error: string;
  submitting: boolean;
}

export default function ReporterApp() {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reports, setReports] = useState<BreakdownRecord[]>([]);
  const unsubscribeRef = useRef<ReturnType<typeof subscribeReporterBreakdowns> | null>(null);

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    displayName: "",
    error: "",
    submitting: false
  });

  const [reportForm, setReportForm] = useState<ReportFormState>({
    message: "",
    priority: "medium",
    error: "",
    submitting: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        cleanupSubscription();
        setAuthChecked(true);
        return;
      }

      try {
        await ensureUserProfile(user);
        await verifyRole(user.uid, ["reporter"]);
        setCurrentUser(user);
        attachSubscription(user.uid);
      } catch (error) {
        setForm((state) => ({ ...state, error: (error as Error).message }));
        await logoutUser();
        cleanupSubscription();
        setCurrentUser(null);
      } finally {
        setAuthChecked(true);
      }
    });

    return () => {
      unsubscribe();
      cleanupSubscription();
    };
  }, [auth]);

  const cleanupSubscription = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setReports([]);
  };

  const attachSubscription = (uid: string) => {
    cleanupSubscription();
    unsubscribeRef.current = subscribeReporterBreakdowns(uid, setReports);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setForm((state) => ({ ...state, error: "" }));
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForm((state) => ({ ...state, error: "", submitting: true }));

    try {
      if (mode === "login") {
        await loginUser(form.email.trim(), form.password.trim());
      } else {
        const user = await registerReporter(form.email.trim(), form.password.trim(), form.displayName);
        await ensureUserProfile(user, form.displayName);
      }
    } catch (error) {
      setForm((state) => ({ ...state, error: (error as Error).message }));
    } finally {
      setForm((state) => ({ ...state, submitting: false }));
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleReportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportForm((state) => ({ ...state, error: "", submitting: true }));

    const message = reportForm.message.trim();
    if (message.length < 10) {
      setReportForm((state) => ({
        ...state,
        submitting: false,
        error: "Please describe the issue with at least 10 characters."
      }));
      return;
    }

    if (!currentUser) {
      setReportForm((state) => ({ ...state, submitting: false, error: "Session expired." }));
      return;
    }

    try {
      await submitBreakdownReport(
        currentUser.uid,
        currentUser.displayName || inferDisplayName(currentUser.email),
        currentUser.email || "",
        message,
        reportForm.priority
      );
      setReportForm({ message: "", priority: "medium", error: "", submitting: false });
    } catch (error) {
      setReportForm((state) => ({ ...state, submitting: false, error: (error as Error).message }));
    }
  };

  const handlePostUpdate = async (report: BreakdownRecord, message: string) => {
    if (!currentUser || !message.trim()) {
      return;
    }
    try {
      await appendBreakdownUpdate(report.id, {
        authorUid: currentUser.uid,
        authorName: currentUser.displayName || inferDisplayName(currentUser.email),
        message: message.trim()
      });
    } catch (error) {
      setReportForm((state) => ({ ...state, error: (error as Error).message }));
    }
  };

  if (!authChecked) {
    return (
      <div className="loading-state">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="reporter-page">
      <header className="reporter-header">
        <div className="reporter-header__content">
          <h1>Breakdown Reporter</h1>
          <p>Submit issues and monitor progress in real time.</p>
        </div>
        {currentUser ? (
          <div className="reporter-header__user">
            <span>{currentUser.email}</span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : null}
      </header>

      <main className="reporter-main">
        {!currentUser ? (
          <section className="card auth-card">
            <h2>{mode === "login" ? "Login" : "Register"}</h2>
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
                  required
                  minLength={6}
                />
              </label>
              {mode === "register" ? (
                <label>
                  Display name
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(event) =>
                      setForm((state) => ({ ...state, displayName: event.target.value }))
                    }
                    minLength={2}
                  />
                </label>
              ) : null}

              <button type="submit" disabled={form.submitting}>
                {form.submitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
              </button>
            </form>
            <p className="form-toggle">
              <span>{mode === "login" ? "Don't have an account?" : "Already have an account?"}</span>
              <button type="button" className="link" onClick={toggleMode}>
                {mode === "login" ? "Register" : "Login"}
              </button>
            </p>
            <p className="error-text">{form.error}</p>
          </section>
        ) : (
          <div className="reporter-grid">
            <section className="card report-card">
              <h2>Submit Breakdown</h2>
              <form onSubmit={handleReportSubmit} className="form">
                <label>
                  Issue description
                  <textarea
                    rows={4}
                    value={reportForm.message}
                    onChange={(event) =>
                      setReportForm((state) => ({ ...state, message: event.target.value }))
                    }
                    minLength={10}
                    required
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={reportForm.priority}
                    onChange={(event) =>
                      setReportForm((state) => ({
                        ...state,
                        priority: event.target.value as ReportFormState["priority"]
                      }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <button type="submit" disabled={reportForm.submitting}>
                  {reportForm.submitting ? "Submitting..." : "Submit Report"}
                </button>
                <p className="error-text">{reportForm.error}</p>
              </form>
            </section>

            <section className="card report-list-card">
              <ReportList reports={reports} onPostUpdate={handlePostUpdate} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ReportList({
  reports,
  onPostUpdate
}: {
  reports: BreakdownRecord[];
  onPostUpdate: (report: BreakdownRecord, message: string) => void;
}) {
  if (!reports.length) {
    return (
      <div className="report-empty">
        <p>No reports yet. Submit a new breakdown to get started.</p>
      </div>
    );
  }

  const sorted = [...reports].sort(
    (a, b) => (b.timestamps?.createdAt || 0) - (a.timestamps?.createdAt || 0)
  );

  return (
    <div className="report-list">
      {sorted.map((report) => (
        <ReportListItem key={report.id} report={report} onPostUpdate={onPostUpdate} />
      ))}
    </div>
  );
}

function ReportListItem({
  report,
  onPostUpdate
}: {
  report: BreakdownRecord;
  onPostUpdate: (report: BreakdownRecord, message: string) => void;
}) {
  const [updateMessage, setUpdateMessage] = useState("");
  const createdAt = report.timestamps?.createdAt
    ? formatter.format(new Date(report.timestamps.createdAt))
    : "Just now";

  const updates = report.updates ? Object.values(report.updates) : [];

  const handleSubmitUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!updateMessage.trim()) {
      return;
    }
    await onPostUpdate(report, updateMessage);
    setUpdateMessage("");
  };

  return (
    <article className="report-item">
      <header className="report-item__header">
        <div>
          <h3>{report.message}</h3>
          <p className="report-item__meta">Priority: {report.priority}</p>
        </div>
        <span className={`status status--${report.status}`}>
          {STATUS_LABELS[report.status] || report.status}
        </span>
      </header>

      <div className="report-item__details">
        <p>
          Created: <strong>{createdAt}</strong>
        </p>
        {report.assignedTechnician ? (
          <p>
            Assigned technician: <strong>{report.assignedTechnician.name}</strong>
          </p>
        ) : null}
        {report.fixDetails ? (
          <p>
            Fix details: <strong>{report.fixDetails}</strong>
          </p>
        ) : null}
      </div>

      <section className="report-item__updates">
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
      </section>

      <form className="update-form" onSubmit={handleSubmitUpdate}>
        <label>
          Add update
          <textarea
            rows={2}
            value={updateMessage}
            onChange={(event) => setUpdateMessage(event.target.value)}
            placeholder="Optional progress update for managers"
          />
        </label>
        <button type="submit">Post update</button>
      </form>
    </article>
  );
}

function inferDisplayName(email: string | null | undefined) {
  return email?.split("@")[0] ?? "User";
}
