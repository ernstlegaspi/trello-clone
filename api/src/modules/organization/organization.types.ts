export interface OrganizationNameBody {
  name: string;
}

export interface InviteEmailBody {
  email: string;
}

export interface AcceptInviteTokenBody {
  token: string;
}

export interface UpdateMemberRoleBody {
  role: "owner" | "member";
}

export interface OrganizationModel {
  id: string;
  name: string;
  createdByUserId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface OrganizationMembershipModel {
  organizationId: string;
  userId: string;
  role: "owner" | "member";
  createdAt?: string | Date;
}

export interface OrganizationMemberView {
  organizationId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string | Date;
  name: string;
  email: string;
}

export interface ProjectModel {
  id: string;
  organizationId: string;
  name: string;
  createdByUserId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ProjectView extends ProjectModel {
  createdByName: string;
  createdByEmail: string;
}
