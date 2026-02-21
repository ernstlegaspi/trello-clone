import express from "express";

import requireAuth from "../../middleware/authMiddleware.js";
import * as organizationController from "./organization.controller.js";

const router = express.Router();

router.get("/invites/resolve", organizationController.resolveInvite);

router.use(requireAuth);

router.post("/", organizationController.createOrganization);
router.get("/", organizationController.getMyOrganizations);
router.get("/invites/pending", organizationController.getMyPendingInvites);
router.post("/invites/accept", organizationController.acceptInviteByToken);
router.post("/:organizationId/invites", organizationController.inviteByEmail);
router.delete(
  "/:organizationId/invites/:inviteId",
  organizationController.revokeInvite
);
router.post("/invites/:inviteId/accept", organizationController.acceptInvite);
router.patch("/:organizationId", organizationController.updateOrganization);
router.delete("/:organizationId", organizationController.deleteOrganization);
router.post("/:organizationId/leave", organizationController.leaveOrganization);
router.get("/:organizationId/members", organizationController.getOrganizationMembers);
router.delete(
  "/:organizationId/members/:userId",
  organizationController.removeOrganizationMember
);
router.patch(
  "/:organizationId/members/:userId/role",
  organizationController.updateOrganizationMemberRole
);
router.post("/:organizationId/projects", organizationController.createProject);
router.get("/:organizationId/projects", organizationController.getOrganizationProjects);
router.get(
  "/:organizationId/projects/:projectId",
  organizationController.getProject
);
router.patch(
  "/:organizationId/projects/:projectId",
  organizationController.updateProject
);
router.delete(
  "/:organizationId/projects/:projectId",
  organizationController.deleteProject
);

export default router;
