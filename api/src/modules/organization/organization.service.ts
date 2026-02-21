import { randomUUID } from "node:crypto";

import HttpError from "../../lib/httpError.js";
import { withTransaction } from "../../db/pool.js";
import {
  buildOrganizationInviteLink,
  signOrganizationInviteToken,
  verifyOrganizationInviteToken
} from "../../lib/inviteToken.js";
import { sendOrganizationInviteEmail } from "../../lib/mailer.js";
import {
  addOrganizationMember,
  countMembersInOrganization,
  countOwnersInOrganization,
  createInvite,
  createOrganization,
  createProject,
  deleteOrganizationById,
  deleteProjectByIdAndOrganizationId,
  findInviteById,
  findInviteDetailsById,
  findInviteByIdForUpdate,
  findMembership,
  findOrganizationById,
  findOrganizationMembers,
  findOrganizationsForUser,
  findPendingInvitesByEmail,
  findProjectByIdAndOrganizationId,
  findProjectViewByIdAndOrganizationId,
  findProjectsByOrganizationId,
  findUserByEmail,
  findUserById,
  markInviteAccepted,
  markInviteRevoked,
  markInviteExpired,
  pruneExpiredInvites,
  removeOrganizationMember,
  updateOrganizationName,
  updateOrganizationMemberRole,
  updateProjectName
} from "./organization.repository.js";
import {
  validateCreateOrganizationInput,
  validateCreateProjectInput,
  validateInviteTokenInput,
  validateInviteInput,
  validateUpdateMemberRoleInput,
  validateUpdateOrganizationInput,
  validateUpdateProjectInput,
  validateUuid
} from "./organization.validation.js";
import type {
  InviteEmailBody,
  OrganizationMembershipModel,
  OrganizationNameBody,
  UpdateMemberRoleBody
} from "./organization.types.js";

const INVITE_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

const getInviteExpiryIso = () =>
  new Date(Date.now() + INVITE_EXPIRES_MS).toISOString();

const getOrganizationWithMembershipOrThrow = async (
  organizationId: string,
  userId: string,
  executor?: any
) => {
  const organization = await findOrganizationById(organizationId, executor);
  if (!organization) {
    throw new HttpError(404, "Organization not found");
  }

  const membership = await findMembership({ organizationId, userId }, executor);
  if (!membership) {
    throw new HttpError(403, "You are not a member of this organization");
  }

  return { organization, membership };
};

const ensureOwnerOrThrow = (membership: OrganizationMembershipModel) => {
  if (membership.role !== "owner") {
    throw new HttpError(403, "Only organization owners can perform this action");
  }
};

export const createNewOrganization = async (
  userId: string,
  body: OrganizationNameBody | unknown
) => {
  const input = validateCreateOrganizationInput(body);

  const organization = await withTransaction(async (txQuery) => {
    const org = await createOrganization(
      {
        id: randomUUID(),
        name: input.name,
        createdByUserId: userId
      },
      txQuery
    );

    await addOrganizationMember(
      {
        organizationId: org.id,
        userId,
        role: "owner"
      },
      txQuery
    );

    return org;
  });

  return {
    ...organization,
    membershipRole: "owner"
  };
};

export const renameOrganization = async (
  organizationId: string,
  userId: string,
  body: OrganizationNameBody | unknown
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const input = validateUpdateOrganizationInput(body);

  const { membership } = await getOrganizationWithMembershipOrThrow(
    validOrganizationId,
    userId
  );
  ensureOwnerOrThrow(membership);

  const organization = await updateOrganizationName({
    organizationId: validOrganizationId,
    name: input.name
  });
  if (!organization) {
    throw new HttpError(404, "Organization not found");
  }

  return {
    ...organization,
    membershipRole: membership.role
  };
};

export const deleteOrganization = async (
  organizationId: string,
  userId: string
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const { membership } = await getOrganizationWithMembershipOrThrow(
    validOrganizationId,
    userId
  );
  ensureOwnerOrThrow(membership);

  const deleted = await deleteOrganizationById(validOrganizationId);
  if (!deleted) {
    throw new HttpError(404, "Organization not found");
  }

  return deleted;
};

export const listOrganizationsByUser = async (userId: string) =>
  findOrganizationsForUser(userId);

export const leaveOrganization = async (organizationId: string, userId: string) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");

  return withTransaction(async (txQuery) => {
    const organization = await findOrganizationById(validOrganizationId, txQuery);
    if (!organization) {
      throw new HttpError(404, "Organization not found");
    }

    const membership = await findMembership(
      {
        organizationId: validOrganizationId,
        userId
      },
      txQuery
    );
    if (!membership) {
      throw new HttpError(403, "You are not a member of this organization");
    }

    if (membership.role === "owner") {
      const ownerCount = await countOwnersInOrganization(validOrganizationId, txQuery);
      const memberCount = await countMembersInOrganization(validOrganizationId, txQuery);
      const isLastOwner = ownerCount <= 1;

      if (isLastOwner && memberCount > 1) {
        throw new HttpError(
          409,
          "You are the last owner. Promote another member before leaving."
        );
      }

      if (isLastOwner && memberCount <= 1) {
        throw new HttpError(
          409,
          "You are the only member. Delete the organization instead."
        );
      }
    }

    const removedMembership = await removeOrganizationMember(
      {
        organizationId: validOrganizationId,
        userId
      },
      txQuery
    );

    if (!removedMembership) {
      throw new HttpError(404, "Membership not found");
    }

    return removedMembership;
  });
};

export const listOrganizationMembersByUser = async (
  organizationId: string,
  userId: string
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  await getOrganizationWithMembershipOrThrow(validOrganizationId, userId);
  return findOrganizationMembers(validOrganizationId);
};

export const removeOrganizationMemberByOwner = async (
  organizationId: string,
  targetUserId: string,
  actingUserId: string
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const validTargetUserId = validateUuid(targetUserId, "userId");

  if (validTargetUserId === actingUserId) {
    throw new HttpError(
      400,
      "Use leave endpoint to remove yourself from the organization"
    );
  }

  return withTransaction(async (txQuery) => {
    const { membership: actingMembership } = await getOrganizationWithMembershipOrThrow(
      validOrganizationId,
      actingUserId,
      txQuery
    );
    ensureOwnerOrThrow(actingMembership);

    const targetMembership = await findMembership(
      {
        organizationId: validOrganizationId,
        userId: validTargetUserId
      },
      txQuery
    );
    if (!targetMembership) {
      throw new HttpError(404, "Member not found");
    }

    if (targetMembership.role === "owner") {
      const ownerCount = await countOwnersInOrganization(validOrganizationId, txQuery);
      if (ownerCount <= 1) {
        throw new HttpError(409, "Cannot remove the last owner");
      }
    }

    const removedMembership = await removeOrganizationMember(
      {
        organizationId: validOrganizationId,
        userId: validTargetUserId
      },
      txQuery
    );

    if (!removedMembership) {
      throw new HttpError(404, "Member not found");
    }

    return removedMembership;
  });
};

export const updateOrganizationMemberRoleByOwner = async (
  organizationId: string,
  targetUserId: string,
  actingUserId: string,
  body: UpdateMemberRoleBody | unknown
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const validTargetUserId = validateUuid(targetUserId, "userId");
  const input = validateUpdateMemberRoleInput(body);

  return withTransaction(async (txQuery) => {
    const { membership: actingMembership } = await getOrganizationWithMembershipOrThrow(
      validOrganizationId,
      actingUserId,
      txQuery
    );
    ensureOwnerOrThrow(actingMembership);

    const targetMembership = await findMembership(
      {
        organizationId: validOrganizationId,
        userId: validTargetUserId
      },
      txQuery
    );
    if (!targetMembership) {
      throw new HttpError(404, "Member not found");
    }

    if (targetMembership.role === input.role) {
      throw new HttpError(409, "Member already has this role");
    }

    if (targetMembership.role === "owner" && input.role === "member") {
      const ownerCount = await countOwnersInOrganization(validOrganizationId, txQuery);
      if (ownerCount <= 1) {
        throw new HttpError(409, "Cannot demote the last owner");
      }
    }

    const updatedMembership = await updateOrganizationMemberRole(
      {
        organizationId: validOrganizationId,
        userId: validTargetUserId,
        role: input.role
      },
      txQuery
    );

    if (!updatedMembership) {
      throw new HttpError(404, "Member not found");
    }

    return updatedMembership;
  });
};

export const createProjectByOrganization = async (
  organizationId: string,
  userId: string,
  body: OrganizationNameBody | unknown
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const input = validateCreateProjectInput(body);

  const { membership } = await getOrganizationWithMembershipOrThrow(
    validOrganizationId,
    userId
  );
  ensureOwnerOrThrow(membership);

  try {
    return await createProject({
      id: randomUUID(),
      organizationId: validOrganizationId,
      name: input.name,
      createdByUserId: userId
    });
  } catch (error) {
    if (error?.code === "23505") {
      throw new HttpError(
        409,
        "A project with this name already exists in this organization"
      );
    }
    throw error;
  }
};

export const listProjectsByOrganization = async (
  organizationId: string,
  userId: string
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  await getOrganizationWithMembershipOrThrow(validOrganizationId, userId);
  return findProjectsByOrganizationId(validOrganizationId);
};

export const getProjectByOrganization = async (
  organizationId: string,
  projectId: string,
  userId: string
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const validProjectId = validateUuid(projectId, "projectId");

  await getOrganizationWithMembershipOrThrow(validOrganizationId, userId);

  const project = await findProjectViewByIdAndOrganizationId({
    projectId: validProjectId,
    organizationId: validOrganizationId
  });
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  return project;
};

export const renameProjectByOrganization = async (
  organizationId: string,
  projectId: string,
  userId: string,
  body: OrganizationNameBody | unknown
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const validProjectId = validateUuid(projectId, "projectId");
  const input = validateUpdateProjectInput(body);

  const { membership } = await getOrganizationWithMembershipOrThrow(
    validOrganizationId,
    userId
  );
  ensureOwnerOrThrow(membership);

  const existingProject = await findProjectByIdAndOrganizationId({
    projectId: validProjectId,
    organizationId: validOrganizationId
  });
  if (!existingProject) {
    throw new HttpError(404, "Project not found");
  }

  try {
    const project = await updateProjectName({
      projectId: validProjectId,
      organizationId: validOrganizationId,
      name: input.name
    });
    if (!project) {
      throw new HttpError(404, "Project not found");
    }
    return project;
  } catch (error) {
    if (error?.code === "23505") {
      throw new HttpError(
        409,
        "A project with this name already exists in this organization"
      );
    }
    throw error;
  }
};

export const deleteProjectByOrganization = async (
  organizationId: string,
  projectId: string,
  userId: string
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const validProjectId = validateUuid(projectId, "projectId");

  const { membership } = await getOrganizationWithMembershipOrThrow(
    validOrganizationId,
    userId
  );
  ensureOwnerOrThrow(membership);

  const deletedProject = await deleteProjectByIdAndOrganizationId({
    projectId: validProjectId,
    organizationId: validOrganizationId
  });
  if (!deletedProject) {
    throw new HttpError(404, "Project not found");
  }

  return deletedProject;
};

export const inviteUserByEmail = async (
  organizationId: string,
  inviterUserId: string,
  inviterEmail: string,
  body: InviteEmailBody | unknown
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const input = validateInviteInput(body);
  await pruneExpiredInvites();

  const organization = await findOrganizationById(validOrganizationId);
  if (!organization) {
    throw new HttpError(404, "Organization not found");
  }

  const inviterMembership = await findMembership({
    organizationId: validOrganizationId,
    userId: inviterUserId
  });
  if (!inviterMembership) {
    throw new HttpError(403, "You are not a member of this organization");
  }
  if (inviterMembership.role !== "owner") {
    throw new HttpError(403, "Only organization owners can invite users");
  }

  const inviter = await findUserById(inviterUserId);
  if (!inviter) {
    throw new HttpError(404, "Inviter user not found");
  }

  if (input.email === inviterEmail.toLowerCase()) {
    throw new HttpError(400, "You cannot invite yourself");
  }

  const existingUser = await findUserByEmail(input.email);
  if (existingUser) {
    const existingMembership = await findMembership({
      organizationId: validOrganizationId,
      userId: existingUser.id
    });
    if (existingMembership) {
      throw new HttpError(409, "User is already a member of this organization");
    }
  }

  try {
    const invite = await createInvite({
      id: randomUUID(),
      organizationId: validOrganizationId,
      email: input.email,
      invitedByUserId: inviterUserId,
      expiresAt: getInviteExpiryIso()
    });

    const inviteToken = signOrganizationInviteToken({
      inviteId: invite.id,
      email: invite.email
    });
    const invitationLink = buildOrganizationInviteLink(inviteToken);

    try {
      await sendOrganizationInviteEmail({
        toEmail: invite.email,
        organizationName: organization.name,
        invitedByName: inviter.name,
        invitationLink,
        expiresAt: invite.expiresAt
      });
    } catch (error) {
      await markInviteRevoked(invite.id);
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, "Failed to send invitation email", {
        reason: error?.message
      });
    }

    return {
      ...invite,
      organizationName: organization.name,
      invitationLink
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error?.code === "23505") {
      throw new HttpError(
        409,
        "A pending invite for this email already exists in this organization"
      );
    }
    throw error;
  }
};

export const revokeInviteByOwner = async (
  organizationId: string,
  inviteId: string,
  userId: string
) => {
  const validOrganizationId = validateUuid(organizationId, "organizationId");
  const validInviteId = validateUuid(inviteId, "inviteId");

  return withTransaction(async (txQuery) => {
    const { membership } = await getOrganizationWithMembershipOrThrow(
      validOrganizationId,
      userId,
      txQuery
    );
    ensureOwnerOrThrow(membership);

    const invite = await findInviteById(validInviteId, txQuery);
    if (!invite || invite.organizationId !== validOrganizationId) {
      throw new HttpError(404, "Invite not found");
    }

    if (invite.status !== "pending") {
      throw new HttpError(409, "Only pending invites can be revoked");
    }

    const revokedInvite = await markInviteRevoked(validInviteId, txQuery);
    if (!revokedInvite) {
      throw new HttpError(409, "Only pending invites can be revoked");
    }

    return revokedInvite;
  });
};

export const listPendingInvitesForUser = async (userId: string) => {
  await pruneExpiredInvites();
  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return findPendingInvitesByEmail(user.email.toLowerCase());
};

export const resolveInviteByToken = async (token: string | undefined) => {
  const rawToken = validateInviteTokenInput(token);
  const payload = verifyOrganizationInviteToken(rawToken);
  await pruneExpiredInvites();

  const invite = await findInviteDetailsById(payload.inviteId);
  if (!invite) {
    throw new HttpError(404, "Invite not found");
  }

  if (invite.email !== payload.email.toLowerCase()) {
    throw new HttpError(401, "Invitation token is invalid");
  }

  const expiresAtMs = new Date(invite.expiresAt).getTime();
  const isExpired = !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now();
  if (invite.status === "pending" && isExpired) {
    await markInviteExpired(invite.id);
    invite.status = "expired";
  }

  return {
    id: invite.id,
    organizationId: invite.organizationId,
    organizationName: invite.organizationName,
    email: invite.email,
    invitedByName: invite.invitedByName,
    invitedByEmail: invite.invitedByEmail,
    status: invite.status,
    expiresAt: invite.expiresAt,
    acceptedAt: invite.acceptedAt,
    isExpired: invite.status === "expired"
  };
};

const acceptInviteById = async ({
  inviteId,
  userId,
  expectedEmail
}: {
  inviteId: string;
  userId: string;
  expectedEmail?: string;
}) =>
  withTransaction(async (txQuery) => {
    await pruneExpiredInvites(txQuery);

    const user = await findUserById(userId, txQuery);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const invite = await findInviteByIdForUpdate(inviteId, txQuery);
    if (!invite) {
      throw new HttpError(404, "Invite not found");
    }

    if (expectedEmail && invite.email !== expectedEmail) {
      throw new HttpError(401, "Invitation token is invalid");
    }

    if (invite.status !== "pending") {
      throw new HttpError(409, "Invite is no longer pending");
    }

    const inviteExpiresAtMs = new Date(invite.expiresAt).getTime();
    if (!Number.isFinite(inviteExpiresAtMs) || inviteExpiresAtMs <= Date.now()) {
      await markInviteExpired(invite.id, txQuery);
      throw new HttpError(410, "Invite has expired");
    }

    if (invite.email !== user.email.toLowerCase()) {
      throw new HttpError(403, "This invite does not belong to your account");
    }

    const organization = await findOrganizationById(invite.organizationId, txQuery);
    if (!organization) {
      throw new HttpError(404, "Organization not found");
    }

    const existingMembership = await findMembership(
      {
        organizationId: invite.organizationId,
        userId
      },
      txQuery
    );

    if (!existingMembership) {
      await addOrganizationMember(
        {
          organizationId: invite.organizationId,
          userId,
          role: "member"
        },
        txQuery
      );
    }

    await markInviteAccepted(invite.id, txQuery);

    return {
      organization: {
        id: organization.id,
        name: organization.name
      },
      membershipRole: existingMembership?.role || "member"
    };
  });

export const acceptInvite = async (inviteId: string, userId: string) => {
  const validInviteId = validateUuid(inviteId, "inviteId");
  return acceptInviteById({ inviteId: validInviteId, userId });
};

export const acceptInviteWithToken = async (
  token: string | undefined,
  userId: string
) => {
  const rawToken = validateInviteTokenInput(token);
  const payload = verifyOrganizationInviteToken(rawToken);
  const validInviteId = validateUuid(payload.inviteId, "inviteId");

  return acceptInviteById({
    inviteId: validInviteId,
    userId,
    expectedEmail: payload.email.toLowerCase()
  });
};
