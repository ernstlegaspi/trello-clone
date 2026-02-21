import type { NextFunction, Request, Response } from "express";

import * as commentService from "./comment.service.js";
import type { CommentBody } from "./comment.types.js";

export const createComment = async (
  req: Request<{ projectId: string; cardId: string }, {}, CommentBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const comment = await commentService.createCardComment(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId,
      req.body
    );
    res.status(201).json({
      message: "Comment created",
      comment
    });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (
  req: Request<{ projectId: string; cardId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const comments = await commentService.listCardComments(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId
    );
    res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (
  req: Request<
    { projectId: string; cardId: string; commentId: string },
    {},
    CommentBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const comment = await commentService.updateCardComment(
      req.params.projectId,
      req.params.cardId,
      req.params.commentId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Comment updated",
      comment
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
  req: Request<{ projectId: string; cardId: string; commentId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const comment = await commentService.deleteCardComment(
      req.params.projectId,
      req.params.cardId,
      req.params.commentId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Comment deleted",
      comment
    });
  } catch (error) {
    next(error);
  }
};
