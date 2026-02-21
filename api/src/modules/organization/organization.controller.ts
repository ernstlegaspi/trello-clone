import type { NextFunction, Request, Response } from "express";

import * as organizationService from "./organization.service.js";
import type {
  AcceptInviteTokenBody,
  InviteEmailBody,
  OrganizationNameBody,
  UpdateMemberRoleBody
} from "./organization.types.js";

export const createOrganization = async (
  req: Request<{}, {}, OrganizationNameBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const organization = await organizationService.createNewOrganization(
      req.auth.userId,
      req.body
    );
    res.status(201).json({
      message: "Organization created",
      organization
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (
  req: Request<{ organizationId: string }, {}, OrganizationNameBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const organization = await organizationService.renameOrganization(
      req.params.organizationId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Organization updated",
      organization
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (
  req: Request<{ organizationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const organization = await organizationService.deleteOrganization(
      req.params.organizationId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Organization deleted",
      organization
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizations = await organizationService.listOrganizationsByUser(
      req.auth.userId
    );
    res.status(200).json({ organizations });
  } catch (error) {
    next(error);
  }
};

export const leaveOrganization = async (
  req: Request<{ organizationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    await organizationService.leaveOrganization(
      req.params.organizationId,
      req.auth.userId
    );
    res.status(200).json({ message: "Left organization successfully" });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationMembers = async (
  req: Request<{ organizationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const members = await organizationService.listOrganizationMembersByUser(
      req.params.organizationId,
      req.auth.userId
    );
    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
};

export const removeOrganizationMember = async (
  req: Request<{ organizationId: string; userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const membership = await organizationService.removeOrganizationMemberByOwner(
      req.params.organizationId,
      req.params.userId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Member removed",
      membership
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationMemberRole = async (
  req: Request<{ organizationId: string; userId: string }, {}, UpdateMemberRoleBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const membership = await organizationService.updateOrganizationMemberRoleByOwner(
      req.params.organizationId,
      req.params.userId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Member role updated",
      membership
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: Request<{ organizationId: string }, {}, OrganizationNameBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await organizationService.createProjectByOrganization(
      req.params.organizationId,
      req.auth.userId,
      req.body
    );
    res.status(201).json({
      message: "Project created",
      project
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationProjects = async (
  req: Request<{ organizationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const projects = await organizationService.listProjectsByOrganization(
      req.params.organizationId,
      req.auth.userId
    );
    res.status(200).json({ projects });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (
  req: Request<{ organizationId: string; projectId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await organizationService.getProjectByOrganization(
      req.params.organizationId,
      req.params.projectId,
      req.auth.userId
    );
    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request<{ organizationId: string; projectId: string }, {}, OrganizationNameBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await organizationService.renameProjectByOrganization(
      req.params.organizationId,
      req.params.projectId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Project updated",
      project
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request<{ organizationId: string; projectId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const project = await organizationService.deleteProjectByOrganization(
      req.params.organizationId,
      req.params.projectId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Project deleted",
      project
    });
  } catch (error) {
    next(error);
  }
};

export const inviteByEmail = async (
  req: Request<{ organizationId: string }, {}, InviteEmailBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const invite = await organizationService.inviteUserByEmail(
      req.params.organizationId,
      req.auth.userId,
      req.auth.email,
      req.body
    );
    res.status(201).json({
      message: "Invite created",
      invite
    });
  } catch (error) {
    next(error);
  }
};

export const revokeInvite = async (
  req: Request<{ organizationId: string; inviteId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const invite = await organizationService.revokeInviteByOwner(
      req.params.organizationId,
      req.params.inviteId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Invite revoked",
      invite
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPendingInvites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const invites = await organizationService.listPendingInvitesForUser(
      req.auth.userId
    );
    res.status(200).json({ invites });
  } catch (error) {
    next(error);
  }
};

export const resolveInvite = async (
  req: Request<{}, {}, {}, { token: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const invite = await organizationService.resolveInviteByToken(req.query.token);
    res.status(200).json({ invite });
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (
  req: Request<{ inviteId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await organizationService.acceptInvite(
      req.params.inviteId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Invite accepted",
      organization: result.organization,
      membershipRole: result.membershipRole
    });
  } catch (error) {
    next(error);
  }
};

export const acceptInviteByToken = async (
  req: Request<{}, {}, AcceptInviteTokenBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await organizationService.acceptInviteWithToken(
      req.body?.token,
      req.auth.userId
    );
    res.status(200).json({
      message: "Invite accepted",
      organization: result.organization,
      membershipRole: result.membershipRole
    });
  } catch (error) {
    next(error);
  }
};
