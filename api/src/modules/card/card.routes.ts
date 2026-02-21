import express from "express";

import requireAuth from "../../middleware/authMiddleware.js";
import * as cardController from "./card.controller.js";

const router = express.Router();

router.use(requireAuth);

router.post("/lists/:listId/cards", cardController.createCard);
router.get("/lists/:listId/cards", cardController.getListCards);
router.patch("/lists/:listId/cards/reorder", cardController.reorderCards);

router.get("/projects/:projectId/cards", cardController.getProjectCards);
router.get("/projects/:projectId/cards/:cardId", cardController.getProjectCard);
router.patch("/projects/:projectId/cards/:cardId", cardController.updateProjectCard);
router.patch(
  "/projects/:projectId/cards/:cardId/move",
  cardController.moveProjectCard
);
router.patch(
  "/projects/:projectId/cards/:cardId/archive",
  cardController.archiveProjectCard
);
router.patch(
  "/projects/:projectId/cards/:cardId/restore",
  cardController.restoreProjectCard
);
router.delete("/projects/:projectId/cards/:cardId", cardController.deleteProjectCard);

export default router;
