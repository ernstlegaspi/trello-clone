export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  membershipRole: "owner" | "member";
  joinedAt: string;
}

export interface OrganizationMember {
  organizationId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  createdByUserId: string;
  createdByName?: string;
  createdByEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  projectId: string;
  name: string;
  position: number;
  isArchived: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  projectId: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueAt: string | null;
  isArchived: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardMember {
  cardId: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  content: string;
  isCompleted: boolean;
  position: number;
  completedAt: string | null;
  completedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  cardId: string;
  title: string;
  position: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  items: ChecklistItem[];
  progress: {
    total: number;
    completed: number;
  };
}

export interface PendingInvite {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  invitedByUserId: string;
  invitedByName: string;
  invitedByEmail: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface InviteResolution {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  invitedByName: string;
  invitedByEmail: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
  acceptedAt: string | null;
  isExpired: boolean;
}
