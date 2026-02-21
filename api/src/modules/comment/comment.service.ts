import { randomUUID } from "node:crypto";

import HttpError from "../../lib/httpError.js";
import {
  findCardByIdAndProjectId,
  findProjectById,
  findProjectMembership
} from "../common/projectAccess.repository.js";
import {
  createComment,
  deleteCommentByIdAndCardId,
  findCommentByIdAndCardId,
  findCommentsByCardId,
  updateCommentByIdAndCardId
} from "./comment.repository.js";
import { validateCommentInput, validateUuid } from "./comment.validation.js";
import type { CommentBody } from "./comment.types.js";

const getProjectWithMembershipOrThrow = async (
  projectId: string,
  userId: string,
  executor?: any
) => {
  const project = await findProjectById(projectId, executor);
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const membership = await findProjectMembership({ projectId, userId }, executor);
  if (!membership) {
    throw new HttpError(403, "You are not a member of this project organization");
  }

  return { project, membership };
};

const getCommentContextOrThrow = async (
  projectId: string,
  cardId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");

  const { membership } = await getProjectWithMembershipOrThrow(
    validProjectId,
    userId
  );

  const card = await findCardByIdAndProjectId({
    cardId: validCardId,
    projectId: validProjectId
  });
  if (!card) {
    throw new HttpError(404, "Card not found");
  }

  return {
    projectId: validProjectId,
    cardId: validCardId,
    membership
  };
};

export const createCardComment = async (
  projectId: string,
  cardId: string,
  userId: string,
  body: CommentBody | unknown
) => {
  const input = validateCommentInput(body);
  const context = await getCommentContextOrThrow(projectId, cardId, userId);

  return createComment({
    id: randomUUID(),
    cardId: context.cardId,
    userId,
    content: input.content
  });
};

export const listCardComments = async (
  projectId: string,
  cardId: string,
  userId: string
) => {
  const context = await getCommentContextOrThrow(projectId, cardId, userId);
  return findCommentsByCardId(context.cardId);
};

export const updateCardComment = async (
  projectId: string,
  cardId: string,
  commentId: string,
  userId: string,
  body: CommentBody | unknown
) => {
  const input = validateCommentInput(body);
  const validCommentId = validateUuid(commentId, "commentId");
  const context = await getCommentContextOrThrow(projectId, cardId, userId);

  const comment = await findCommentByIdAndCardId({
    commentId: validCommentId,
    cardId: context.cardId
  });
  if (!comment) {
    throw new HttpError(404, "Comment not found");
  }

  const canEdit = comment.userId === userId || context.membership.role === "owner";
  if (!canEdit) {
    throw new HttpError(403, "You can only edit your own comments");
  }

  if (comment.content === input.content) {
    throw new HttpError(409, "Comment did not change");
  }

  const updatedComment = await updateCommentByIdAndCardId({
    commentId: validCommentId,
    cardId: context.cardId,
    content: input.content
  });
  if (!updatedComment) {
    throw new HttpError(404, "Comment not found");
  }

  return updatedComment;
};

export const deleteCardComment = async (
  projectId: string,
  cardId: string,
  commentId: string,
  userId: string
) => {
  const validCommentId = validateUuid(commentId, "commentId");
  const context = await getCommentContextOrThrow(projectId, cardId, userId);

  const comment = await findCommentByIdAndCardId({
    commentId: validCommentId,
    cardId: context.cardId
  });
  if (!comment) {
    throw new HttpError(404, "Comment not found");
  }

  const canDelete = comment.userId === userId || context.membership.role === "owner";
  if (!canDelete) {
    throw new HttpError(403, "You can only delete your own comments");
  }

  const deletedComment = await deleteCommentByIdAndCardId({
    commentId: validCommentId,
    cardId: context.cardId
  });
  if (!deletedComment) {
    throw new HttpError(404, "Comment not found");
  }

  return deletedComment;
};
