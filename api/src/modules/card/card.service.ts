import { randomUUID } from "node:crypto";

import HttpError from "../../lib/httpError.js";
import { withTransaction } from "../../db/pool.js";
import {
  createCard,
  deleteCardByIdAndProjectId,
  findCardByIdAndProjectId,
  findCardsByListId,
  findCardsByProjectId,
  findListById,
  findListByIdAndProjectId,
  findProjectById,
  findProjectMembership,
  getNextCardPositionByList,
  updateCardArchiveState,
  updateCardByIdAndProjectId,
  updateCardPlacement
} from "./card.repository.js";
import {
  validateCreateCardInput,
  validateMoveCardInput,
  validateReorderCardsInput,
  validateUpdateCardInput,
  validateUuid
} from "./card.validation.js";
import type {
  CardCreateBody,
  CardMoveBody,
  CardUpdateBody,
  ReorderCardsBody
} from "./card.types.js";

const ensureOwnerOrThrow = (membership: { role: string }) => {
  if (membership.role !== "owner") {
    throw new HttpError(403, "Only organization owners can perform this action");
  }
};

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

const reorderActiveCardsInList = async (
  listId: string,
  projectId: string,
  executor: any
) => {
  const activeCards = await findCardsByListId(
    {
      listId,
      includeArchived: false
    },
    executor
  );

  for (let index = 0; index < activeCards.length; index += 1) {
    const card = activeCards[index];
    await updateCardPlacement(
      {
        cardId: card.id,
        projectId,
        listId,
        position: index + 1
      },
      executor
    );
  }
};

const normalizeComparableDueAt = (value: string | Date | null | undefined) => {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
};

const normalizeComparableDescription = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }
  return value;
};

export const createCardByList = async (
  listId: string,
  userId: string,
  body: CardCreateBody | unknown
) => {
  const validListId = validateUuid(listId, "listId");
  const input = validateCreateCardInput(body);

  return withTransaction(async (txQuery) => {
    const list = await findListById(validListId, txQuery);
    if (!list) {
      throw new HttpError(404, "List not found");
    }
    if (list.isArchived) {
      throw new HttpError(409, "Cannot add cards to an archived list");
    }

    await getProjectWithMembershipOrThrow(list.projectId, userId, txQuery);

    const nextPosition = await getNextCardPositionByList(validListId, txQuery);
    return createCard(
      {
        id: randomUUID(),
        projectId: list.projectId,
        listId: validListId,
        title: input.title,
        description:
          input.description === undefined || input.description === null
            ? null
            : input.description,
        position: nextPosition,
        dueAt: input.dueAt === undefined ? null : input.dueAt,
        createdByUserId: userId
      },
      txQuery
    );
  });
};

export const listCardsByList = async (
  listId: string,
  userId: string,
  includeArchived = false
) => {
  const validListId = validateUuid(listId, "listId");
  const list = await findListById(validListId);
  if (!list) {
    throw new HttpError(404, "List not found");
  }

  await getProjectWithMembershipOrThrow(list.projectId, userId);
  return findCardsByListId({
    listId: validListId,
    includeArchived
  });
};

export const listProjectCards = async (
  projectId: string,
  userId: string,
  query: {
    includeArchived?: string;
    listId?: string;
    q?: string;
  }
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  await getProjectWithMembershipOrThrow(validProjectId, userId);

  const includeArchived = query.includeArchived === "true";
  const listId = query.listId?.trim();
  const search = query.q?.trim();

  if (listId) {
    const validListId = validateUuid(listId, "listId");
    const list = await findListByIdAndProjectId({
      listId: validListId,
      projectId: validProjectId
    });
    if (!list) {
      throw new HttpError(404, "List not found in this project");
    }
  }

  return findCardsByProjectId({
    projectId: validProjectId,
    listId: listId || undefined,
    includeArchived,
    search: search || undefined
  });
};

export const getProjectCard = async (
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
  return card;
};

export const updateProjectCard = async (
  projectId: string,
  cardId: string,
  userId: string,
  body: CardUpdateBody | unknown
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");
  const input = validateUpdateCardInput(body);

  await getProjectWithMembershipOrThrow(validProjectId, userId);

  const existingCard = await findCardByIdAndProjectId({
    cardId: validCardId,
    projectId: validProjectId
  });
  if (!existingCard) {
    throw new HttpError(404, "Card not found");
  }

  const nextTitle = input.title === undefined ? existingCard.title : input.title;
  const nextDescription =
    input.description === undefined ? existingCard.description : input.description;
  const nextDueAt = input.dueAt === undefined ? existingCard.dueAt : input.dueAt;

  if (
    nextTitle === existingCard.title &&
    normalizeComparableDescription(nextDescription) ===
      normalizeComparableDescription(existingCard.description) &&
    normalizeComparableDueAt(nextDueAt) === normalizeComparableDueAt(existingCard.dueAt)
  ) {
    throw new HttpError(409, "Card did not change");
  }

  const card = await updateCardByIdAndProjectId({
    cardId: validCardId,
    projectId: validProjectId,
    title: input.title,
    description: input.description,
    dueAt: input.dueAt
  });
  if (!card) {
    throw new HttpError(404, "Card not found");
  }
  return card;
};

export const moveProjectCard = async (
  projectId: string,
  cardId: string,
  userId: string,
  body: CardMoveBody | unknown
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");
  const input = validateMoveCardInput(body);

  return withTransaction(async (txQuery) => {
    await getProjectWithMembershipOrThrow(validProjectId, userId, txQuery);

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
    if (card.isArchived) {
      throw new HttpError(409, "Archived cards cannot be moved");
    }

    const targetList = await findListByIdAndProjectId(
      {
        listId: input.targetListId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!targetList) {
      throw new HttpError(404, "Target list not found");
    }
    if (targetList.isArchived) {
      throw new HttpError(409, "Cannot move card to an archived list");
    }

    const sourceCards = await findCardsByListId(
      {
        listId: card.listId,
        includeArchived: false
      },
      txQuery
    );
    const sourceOrder = sourceCards.map((item) => item.id);
    if (!sourceOrder.includes(validCardId)) {
      throw new HttpError(409, "Card is not in active state for moving");
    }

    if (card.listId === input.targetListId) {
      const withoutCard = sourceOrder.filter((id) => id !== validCardId);
      const requestedPosition = input.targetPosition || withoutCard.length + 1;
      const insertionIndex = Math.max(
        0,
        Math.min(withoutCard.length, requestedPosition - 1)
      );
      const reordered = [...withoutCard];
      reordered.splice(insertionIndex, 0, validCardId);

      if (reordered.join(",") === sourceOrder.join(",")) {
        throw new HttpError(409, "Card position did not change");
      }

      for (let index = 0; index < reordered.length; index += 1) {
        const itemId = reordered[index];
        await updateCardPlacement(
          {
            cardId: itemId,
            projectId: validProjectId,
            listId: card.listId,
            position: index + 1
          },
          txQuery
        );
      }
    } else {
      const targetCards = await findCardsByListId(
        {
          listId: input.targetListId,
          includeArchived: false
        },
        txQuery
      );

      const sourceWithoutCard = sourceOrder.filter((id) => id !== validCardId);
      const targetOrder = targetCards.map((item) => item.id);

      const requestedPosition = input.targetPosition || targetOrder.length + 1;
      const insertionIndex = Math.max(
        0,
        Math.min(targetOrder.length, requestedPosition - 1)
      );
      const targetWithCard = [...targetOrder];
      targetWithCard.splice(insertionIndex, 0, validCardId);

      for (let index = 0; index < sourceWithoutCard.length; index += 1) {
        const itemId = sourceWithoutCard[index];
        await updateCardPlacement(
          {
            cardId: itemId,
            projectId: validProjectId,
            listId: card.listId,
            position: index + 1
          },
          txQuery
        );
      }

      for (let index = 0; index < targetWithCard.length; index += 1) {
        const itemId = targetWithCard[index];
        await updateCardPlacement(
          {
            cardId: itemId,
            projectId: validProjectId,
            listId: input.targetListId,
            position: index + 1
          },
          txQuery
        );
      }
    }

    const movedCard = await findCardByIdAndProjectId(
      {
        cardId: validCardId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!movedCard) {
      throw new HttpError(404, "Card not found");
    }
    return movedCard;
  });
};

export const reorderListCards = async (
  listId: string,
  userId: string,
  body: ReorderCardsBody | unknown
) => {
  const validListId = validateUuid(listId, "listId");
  const input = validateReorderCardsInput(body);

  return withTransaction(async (txQuery) => {
    const list = await findListById(validListId, txQuery);
    if (!list) {
      throw new HttpError(404, "List not found");
    }

    await getProjectWithMembershipOrThrow(list.projectId, userId, txQuery);

    const activeCards = await findCardsByListId(
      {
        listId: validListId,
        includeArchived: false
      },
      txQuery
    );

    if (activeCards.length === 0) {
      throw new HttpError(409, "No active cards to reorder");
    }

    if (input.orderedCardIds.length !== activeCards.length) {
      throw new HttpError(
        400,
        "orderedCardIds must include every active card exactly once"
      );
    }

    const activeCardIds = activeCards.map((card) => card.id);
    const activeSet = new Set(activeCardIds);
    const unknownId = input.orderedCardIds.find((id) => !activeSet.has(id));
    if (unknownId) {
      throw new HttpError(400, `orderedCardIds contains unknown card id: ${unknownId}`);
    }

    const currentOrder = activeCardIds.join(",");
    const requestedOrder = input.orderedCardIds.join(",");
    if (currentOrder === requestedOrder) {
      throw new HttpError(409, "Card order did not change");
    }

    for (let index = 0; index < input.orderedCardIds.length; index += 1) {
      const cardId = input.orderedCardIds[index];
      await updateCardPlacement(
        {
          cardId,
          projectId: list.projectId,
          listId: validListId,
          position: index + 1
        },
        txQuery
      );
    }

    return findCardsByListId(
      {
        listId: validListId,
        includeArchived: false
      },
      txQuery
    );
  });
};

export const archiveProjectCard = async (
  projectId: string,
  cardId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");

  return withTransaction(async (txQuery) => {
    await getProjectWithMembershipOrThrow(validProjectId, userId, txQuery);

    const existingCard = await findCardByIdAndProjectId(
      {
        cardId: validCardId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!existingCard) {
      throw new HttpError(404, "Card not found");
    }
    if (existingCard.isArchived) {
      throw new HttpError(409, "Card is already archived");
    }

    const archivedCard = await updateCardArchiveState(
      {
        cardId: validCardId,
        projectId: validProjectId,
        isArchived: true
      },
      txQuery
    );
    if (!archivedCard) {
      throw new HttpError(404, "Card not found");
    }

    await reorderActiveCardsInList(existingCard.listId, validProjectId, txQuery);
    return archivedCard;
  });
};

export const restoreProjectCard = async (
  projectId: string,
  cardId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");

  return withTransaction(async (txQuery) => {
    await getProjectWithMembershipOrThrow(validProjectId, userId, txQuery);

    const existingCard = await findCardByIdAndProjectId(
      {
        cardId: validCardId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!existingCard) {
      throw new HttpError(404, "Card not found");
    }
    if (!existingCard.isArchived) {
      throw new HttpError(409, "Card is already active");
    }

    const list = await findListByIdAndProjectId(
      {
        listId: existingCard.listId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!list) {
      throw new HttpError(404, "List not found");
    }
    if (list.isArchived) {
      throw new HttpError(409, "Cannot restore card while list is archived");
    }

    const nextPosition = await getNextCardPositionByList(existingCard.listId, txQuery);
    const restoredCard = await updateCardArchiveState(
      {
        cardId: validCardId,
        projectId: validProjectId,
        isArchived: false,
        position: nextPosition
      },
      txQuery
    );
    if (!restoredCard) {
      throw new HttpError(404, "Card not found");
    }
    return restoredCard;
  });
};

export const deleteProjectCard = async (
  projectId: string,
  cardId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");

  return withTransaction(async (txQuery) => {
    const { membership } = await getProjectWithMembershipOrThrow(
      validProjectId,
      userId,
      txQuery
    );
    ensureOwnerOrThrow(membership);

    const existingCard = await findCardByIdAndProjectId(
      {
        cardId: validCardId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!existingCard) {
      throw new HttpError(404, "Card not found");
    }

    const deletedCard = await deleteCardByIdAndProjectId(
      {
        cardId: validCardId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!deletedCard) {
      throw new HttpError(404, "Card not found");
    }

    if (!existingCard.isArchived) {
      await reorderActiveCardsInList(existingCard.listId, validProjectId, txQuery);
    }

    return deletedCard;
  });
};
