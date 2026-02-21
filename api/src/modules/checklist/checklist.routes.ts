import express from "express";

import requireAuth from "../../middleware/authMiddleware.js";
import * as checklistController from "./checklist.controller.js";

const router = express.Router();

router.use(requireAuth);

router.post(
  "/projects/:projectId/cards/:cardId/checklists",
  checklistController.createChecklist
);
router.get(
  "/projects/:projectId/cards/:cardId/checklists",
  checklistController.getChecklists
);
router.patch(
  "/projects/:projectId/cards/:cardId/checklists/:checklistId",
  checklistController.updateChecklist
);
router.delete(
  "/projects/:projectId/cards/:cardId/checklists/:checklistId",
  checklistController.deleteChecklist
);

router.post(
  "/projects/:projectId/cards/:cardId/checklists/:checklistId/items",
  checklistController.createChecklistItem
);
router.patch(
  "/projects/:projectId/cards/:cardId/checklists/:checklistId/items/:itemId",
  checklistController.updateChecklistItem
);
router.delete(
  "/projects/:projectId/cards/:cardId/checklists/:checklistId/items/:itemId",
  checklistController.deleteChecklistItem
);

export default router;
