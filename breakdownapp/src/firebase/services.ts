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
  role: UserRole = "manager"
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
  role: UserRole = "manager"
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
  technician: { uid: string; name: string },
  breakdownData?: BreakdownRecord
) {
  const db = getFirebaseDatabase();
  const breakdownRef = ref(db, `breakdowns/${breakdownId}`);
  await update(breakdownRef, {
    assignedTechnician: technician,
    "timestamps/updatedAt": serverTimestamp()
  });

  // Send email notification if breakdown data is provided
  if (breakdownData) {
    try {
      // Get technician email from user profile
      const technicianProfile = await fetchUserProfile(technician.uid);
      const technicianEmail = technicianProfile?.email || '';
      
      if (technicianEmail) {
        // Send email notification using EmailJS
        await sendTaskAssignmentEmail(technicianEmail, {
          technicianName: technician.name,
          taskDescription: breakdownData.message,
          reporterName: breakdownData.reporterName,
          reporterEmail: breakdownData.reporterEmail,
          priority: breakdownData.priority,
          taskId: breakdownId,
          createdAt: breakdownData.timestamps?.createdAt 
            ? new Date(breakdownData.timestamps.createdAt).toLocaleString() 
            : new Date().toLocaleString()
        });
      }
    } catch (error) {
      console.error('Error sending assignment email:', error);
      // Don't throw error to prevent breaking the assignment process
    }
  }
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

// EmailJS configuration
const emailjsConfig = {
  serviceId: "service_13xst74",
  templateId: "template_vp34whe",
  publicKey: "IplMJPtelGI6fL9UO"
};

// EmailJS email sending function
async function sendTaskAssignmentEmail(technicianEmail: string, taskDetails: {
  technicianName: string;
  taskDescription: string;
  reporterName: string;
  reporterEmail: string;
  priority: string;
  taskId: string;
  createdAt: string;
}) {
  try {
    // Dynamically import EmailJS
    const emailjs = await import('@emailjs/browser');
    
    // Initialize EmailJS
    emailjs.init(emailjsConfig.publicKey);
    
    const templateParams = {
      to_email: technicianEmail,
      technician_name: taskDetails.technicianName,
      task_description: taskDetails.taskDescription,
      reporter_name: taskDetails.reporterName,
      reporter_email: taskDetails.reporterEmail,
      priority: taskDetails.priority,
      task_id: taskDetails.taskId,
      created_at: taskDetails.createdAt
    };

    console.log('📧 Sending task assignment email...', templateParams);

    const result = await emailjs.send(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      templateParams
    );

    console.log('✅ Task assignment email sent successfully:', result);
    
    // Show notification to user
    if (typeof window !== 'undefined') {
      // Create a notification element
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      `;
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 18px;">📧</span>
          <div>
            <div style="font-weight: bold;">Email Sent!</div>
            <div style="font-size: 12px; opacity: 0.9;">Task assignment notification sent to technician</div>
          </div>
        </div>
      `;
      
      // Add animation styles
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(notification);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error sending task assignment email:', error);
    
    // Show error notification to user
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      `;
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 18px;">❌</span>
          <div>
            <div style="font-weight: bold;">Email Failed!</div>
            <div style="font-size: 12px; opacity: 0.9;">Could not send notification to technician</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);
    }
    
    return false;
  }
}

function inferDisplayName(email: string | null | undefined) {
  return email?.split("@")[0] ?? "User";
}
