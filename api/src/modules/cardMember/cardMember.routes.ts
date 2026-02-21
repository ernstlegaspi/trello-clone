import express from "express";

import requireAuth from "../../middleware/authMiddleware.js";
import * as cardMemberController from "./cardMember.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get(
  "/projects/:projectId/cards/assigned/me",
  cardMemberController.getMyAssignedCards
);
router.get(
  "/projects/:projectId/cards/:cardId/members",
  cardMemberController.getCardMembers
);
router.post(
  "/projects/:projectId/cards/:cardId/members/:userId",
  cardMemberController.assignMember
);
router.delete(
  "/projects/:projectId/cards/:cardId/members/:userId",
  cardMemberController.unassignMember
);

export default router;
