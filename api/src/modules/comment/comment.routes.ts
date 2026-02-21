import express from "express";

import requireAuth from "../../middleware/authMiddleware.js";
import * as commentController from "./comment.controller.js";

const router = express.Router();

router.use(requireAuth);

router.post("/projects/:projectId/cards/:cardId/comments", commentController.createComment);
router.get("/projects/:projectId/cards/:cardId/comments", commentController.getComments);
router.patch(
  "/projects/:projectId/cards/:cardId/comments/:commentId",
  commentController.updateComment
);
router.delete(
  "/projects/:projectId/cards/:cardId/comments/:commentId",
  commentController.deleteComment
);

export default router;
