import express from "express";

import requireAuth from "../../middleware/authMiddleware.js";
import * as labelController from "./label.controller.js";

const router = express.Router();

router.use(requireAuth);

router.post("/projects/:projectId/labels", labelController.createLabel);
router.get("/projects/:projectId/labels", labelController.getProjectLabels);
router.patch("/projects/:projectId/labels/:labelId", labelController.updateLabel);
router.delete("/projects/:projectId/labels/:labelId", labelController.deleteLabel);

router.get("/projects/:projectId/cards/:cardId/labels", labelController.getCardLabels);
router.post(
  "/projects/:projectId/cards/:cardId/labels/:labelId",
  labelController.attachLabelToCard
);
router.delete(
  "/projects/:projectId/cards/:cardId/labels/:labelId",
  labelController.detachLabelFromCard
);

export default router;
