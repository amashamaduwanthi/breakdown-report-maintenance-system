export type UserRole = "reporter" | "manager" | "technician";
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: number;
}

export type BreakdownStatus =
  | "pending"
  | "approved"
  | "in_progress"
  | "resolved"
  | "rejected";

export type BreakdownPriority = "low" | "medium" | "high";

export interface BreakdownUpdate {
  authorUid: string;
  authorName: string;
  message: string;
  status?: BreakdownStatus;
  createdAt?: number;
}

export interface BreakdownAssignment {
  uid: string;
  name: string;
}

export interface BreakdownTimestamps {
  createdAt?: number;
  updatedAt?: number;
  approvedAt?: number | null;
  resolvedAt?: number | null;
}

export interface BreakdownData {
  reporterUid: string;
  reporterName: string;
  reporterEmail: string;
  message: string;
  status: BreakdownStatus;
  priority: BreakdownPriority;
  assignedTechnician: BreakdownAssignment | null;
  fixDetails: string | null;
  updates?: Record<string, BreakdownUpdate> | null;
  timestamps?: BreakdownTimestamps;
}

export type BreakdownRecord = BreakdownData & { id: string };
