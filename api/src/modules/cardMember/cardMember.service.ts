import HttpError from "../../lib/httpError.js";
import { withTransaction } from "../../db/pool.js";
import {
  findCardByIdAndProjectId,
  findProjectById,
  findProjectMembership,
  findUserById
} from "../common/projectAccess.repository.js";
import {
  addCardMember,
  findAssignedCardsByProjectAndUser,
  findCardMembersByCardId,
  removeCardMember
} from "./cardMember.repository.js";
import { validateUuid } from "./cardMember.validation.js";

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

export const listCardMembers = async (
  projectId: string,
  cardId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");

  await getProjectWithMembershipOrThrow(validProjectId, userId);

  const card = await findCardByIdAndProjectId({
    cardId: validCardId,
    projectId: validProjectId
  });
  if (!card) {
    throw new HttpError(404, "Card not found");
  }

  return findCardMembersByCardId(validCardId);
};

export const assignCardMember = async (
  projectId: string,
  cardId: string,
  targetUserId: string,
  actingUserId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");
  const validTargetUserId = validateUuid(targetUserId, "userId");

  return withTransaction(async (txQuery) => {
    await getProjectWithMembershipOrThrow(validProjectId, actingUserId, txQuery);

    const card = await findCardByIdAndProjectId(
      {
        cardId: validCardId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!card) {
      throw new HttpError(404, "Card not found");
    }

    const targetUser = await findUserById(validTargetUserId, txQuery);
    if (!targetUser) {
      throw new HttpError(404, "Target user not found");
    }

    const targetMembership = await findProjectMembership(
      {
        projectId: validProjectId,
        userId: validTargetUserId
      },
      txQuery
    );
    if (!targetMembership) {
      throw new HttpError(409, "Target user is not a member of this project organization");
    }

    const member = await addCardMember(
      {
        cardId: validCardId,
        userId: validTargetUserId,
        addedByUserId: actingUserId
      },
      txQuery
    );
    if (!member) {
      throw new HttpError(409, "User is already assigned to this card");
    }

    return member;
  });
};

export const unassignCardMember = async (
  projectId: string,
  cardId: string,
  targetUserId: string,
  actingUserId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");
  const validTargetUserId = validateUuid(targetUserId, "userId");

  return withTransaction(async (txQuery) => {
    await getProjectWithMembershipOrThrow(validProjectId, actingUserId, txQuery);

    const card = await findCardByIdAndProjectId(
      {
        cardId: validCardId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!card) {
      throw new HttpError(404, "Card not found");
    }

    const member = await removeCardMember(
      {
        cardId: validCardId,
        userId: validTargetUserId
      },
      txQuery
    );
    if (!member) {
      throw new HttpError(404, "User is not assigned to this card");
    }

    return member;
  });
};

export const listMyAssignedCards = async (
  projectId: string,
  userId: string,
  includeArchived = false
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  await getProjectWithMembershipOrThrow(validProjectId, userId);
  return findAssignedCardsByProjectAndUser({
    projectId: validProjectId,
    userId,
    includeArchived
  });
};
