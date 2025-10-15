import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import {
  child,
  equalTo,
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
  set,
  update
} from "firebase/database";

import {
  type BreakdownRecord,
  type BreakdownStatus,
  type BreakdownUpdate,
  type UserProfile,
  type UserRole
} from "../types/firebase";
import { getFirebaseAuth, getFirebaseDatabase } from "./client";

export async function registerReporter(
  email: string,
  password: string,
  displayName?: string,
  role: UserRole = "reporter"
) {
  const auth = getFirebaseAuth();
  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(credentials.user, { displayName });
  }
  await ensureUserProfile(credentials.user, displayName, role);
  return credentials.user;
}

export async function loginUser(email: string, password: string) {
  const auth = getFirebaseAuth();
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  return credentials.user;
}

export async function logoutUser() {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export async function ensureUserProfile(
  user: User,
  displayName?: string,
  role: UserRole = "reporter"
) {
  const db = getFirebaseDatabase();
  const profileRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(profileRef);
  const fallbackDisplay = displayName || user.displayName || inferDisplayName(user.email);

  if (!snapshot.exists()) {
    await set(profileRef, {
      uid: user.uid,
      email: user.email,
      displayName: fallbackDisplay,
      role,
      createdAt: serverTimestamp()
    });
    return;
  }

  const existing = snapshot.val() as Partial<UserProfile>;
  const updates: Record<string, unknown> = {};

  if (fallbackDisplay && existing.displayName !== fallbackDisplay) {
    updates.displayName = fallbackDisplay;
  }

  if (existing.role !== role && role) {
    updates.role = role;
  }

  if (Object.keys(updates).length) {
    await update(profileRef, updates);
  }
}

export async function fetchUserProfile(uid: string) {
  const db = getFirebaseDatabase();
  const snapshot = await get(ref(db, `users/${uid}`));
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.val() as UserProfile;
}

export async function verifyRole(uid: string, allowedRoles: UserProfile["role"][]) {
  const profile = await fetchUserProfile(uid);
  if (!profile) {
    throw new Error("User profile missing. Contact administrator.");
  }
  if (!allowedRoles.includes(profile.role)) {
    throw new Error("You do not have permission to access this application.");
  }
  return profile;
}

export function subscribeReporterBreakdowns(
  uid: string,
  callback: (records: BreakdownRecord[]) => void
) {
  const db = getFirebaseDatabase();
  const reportsQuery = query(ref(db, "breakdowns"), orderByChild("reporterUid"), equalTo(uid));

  return onValue(reportsQuery, (snapshot) => {
    const records: BreakdownRecord[] = [];
    snapshot.forEach((childSnapshot) => {
      records.push({ id: childSnapshot.key as string, ...(childSnapshot.val() as BreakdownRecord) });
    });
    callback(records);
  });
}

export async function submitBreakdownReport(
  uid: string,
  reporterName: string,
  reporterEmail: string,
  message: string,
  priority: "low" | "medium" | "high"
) {
  const db = getFirebaseDatabase();
  const breakdownRef = push(ref(db, "breakdowns"));
  await set(breakdownRef, {
    reporterUid: uid,
    reporterName,
    reporterEmail,
    message,
    status: "pending",
    priority,
    assignedTechnician: null,
    fixDetails: null,
    updates: null,
    timestamps: {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      approvedAt: null,
      resolvedAt: null
    }
  });
}

export function subscribeAllBreakdowns(callback: (records: BreakdownRecord[]) => void) {
  const db = getFirebaseDatabase();
  const reportsRef = ref(db, "breakdowns");
  return onValue(reportsRef, (snapshot) => {
    const records: BreakdownRecord[] = [];
    snapshot.forEach((childSnapshot) => {
      records.push({ id: childSnapshot.key as string, ...(childSnapshot.val() as BreakdownRecord) });
    });
    callback(records);
  });
}

export function subscribeTechnicians(callback: (profiles: UserProfile[]) => void) {
  const db = getFirebaseDatabase();
  const usersRef = ref(db, "users");
  return onValue(usersRef, (snapshot) => {
    const list: UserProfile[] = [];
    snapshot.forEach((childSnapshot) => {
      const profile = childSnapshot.val() as UserProfile;
      if (profile.role === "technician") {
        list.push(profile);
      }
    });
    callback(list);
  });
}

export async function assignTechnician(
  breakdownId: string,
  technician: { uid: string; name: string }
) {
  const db = getFirebaseDatabase();
  const breakdownRef = ref(db, `breakdowns/${breakdownId}`);
  await update(breakdownRef, {
    assignedTechnician: technician,
    "timestamps/updatedAt": serverTimestamp()
  });
}

export async function updateBreakdownStatus(
  breakdownId: string,
  status: BreakdownStatus,
  fixDetails?: string | null
) {
  const db = getFirebaseDatabase();
  const updates: Record<string, unknown> = {
    status,
    "timestamps/updatedAt": serverTimestamp()
  };

  if (status === "approved") {
    updates["timestamps/approvedAt"] = serverTimestamp();
  }
  if (status === "resolved") {
    updates["timestamps/resolvedAt"] = serverTimestamp();
  }
  if (typeof fixDetails !== "undefined") {
    updates["fixDetails"] = fixDetails;
  }

  await update(ref(db, `breakdowns/${breakdownId}`), updates);
}

export async function appendBreakdownUpdate(
  breakdownId: string,
  updateData: BreakdownUpdate
) {
  const db = getFirebaseDatabase();
  const updatesRef = ref(db, `breakdowns/${breakdownId}/updates`);
  const newUpdateRef = push(updatesRef);
  await set(newUpdateRef, {
    ...updateData,
    createdAt: serverTimestamp()
  });
}

function inferDisplayName(email: string | null | undefined) {
  return email?.split("@")[0] ?? "User";
}
