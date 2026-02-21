import { randomUUID } from "node:crypto";

import HttpError from "../../lib/httpError.js";
import { withTransaction } from "../../db/pool.js";
import {
  findCardByIdAndProjectId,
  findProjectById,
  findProjectMembership
} from "../common/projectAccess.repository.js";
import {
  createChecklist,
  createChecklistItem,
  deleteChecklistByIdAndCardId,
  deleteChecklistItem,
  findChecklistByIdAndCardId,
  findChecklistItemByIdAndChecklistId,
  findChecklistItemsByChecklistId,
  findChecklistsByCardId,
  getNextChecklistItemPosition,
  getNextChecklistPosition,
  updateChecklistItem,
  updateChecklistItemPosition,
  updateChecklistPosition,
  updateChecklistTitle
} from "./checklist.repository.js";
import {
  validateChecklistItemInput,
  validateChecklistItemUpdateInput,
  validateChecklistTitleInput,
  validateUuid
} from "./checklist.validation.js";
import type {
  ChecklistItemBody,
  ChecklistItemUpdateBody,
  ChecklistTitleBody
} from "./checklist.types.js";

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

const getCardContextOrThrow = async (
  projectId: string,
  cardId: string,
  userId: string,
  executor?: any
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");

  await getProjectWithMembershipOrThrow(validProjectId, userId, executor);

  const card = await findCardByIdAndProjectId(
    {
      cardId: validCardId,
      projectId: validProjectId
    },
    executor
  );
  if (!card) {
    throw new HttpError(404, "Card not found");
  }

  return {
    projectId: validProjectId,
    cardId: validCardId,
    card
  };
};

const ensureChecklistContextOrThrow = async (
  projectId: string,
  cardId: string,
  checklistId: string,
  userId: string,
  executor?: any
) => {
  const context = await getCardContextOrThrow(projectId, cardId, userId, executor);
  const validChecklistId = validateUuid(checklistId, "checklistId");

  const checklist = await findChecklistByIdAndCardId(
    {
      checklistId: validChecklistId,
      cardId: context.cardId
    },
    executor
  );
  if (!checklist) {
    throw new HttpError(404, "Checklist not found");
  }

  return {
    ...context,
    checklistId: validChecklistId,
    checklist
  };
};

const reorderChecklists = async (cardId: string, executor: any) => {
  const checklists = await findChecklistsByCardId(cardId, executor);
  for (let index = 0; index < checklists.length; index += 1) {
    await updateChecklistPosition(
      {
        checklistId: checklists[index].id,
        cardId,
        position: index + 1
      },
      executor
    );
  }
};

const reorderChecklistItems = async (checklistId: string, executor: any) => {
  const items = await findChecklistItemsByChecklistId(checklistId, executor);
  for (let index = 0; index < items.length; index += 1) {
    await updateChecklistItemPosition(
      {
        itemId: items[index].id,
        checklistId,
        position: index + 1
      },
      executor
    );
  }
};

const hydrateChecklistsWithItems = async (cardId: string, executor?: any) => {
  const checklists = await findChecklistsByCardId(cardId, executor);
  const withItems = await Promise.all(
    checklists.map(async (checklist) => {
      const items = await findChecklistItemsByChecklistId(checklist.id, executor);
      const completedCount = items.filter((item) => item.isCompleted).length;
      return {
        ...checklist,
        items,
        progress: {
          total: items.length,
          completed: completedCount
        }
      };
    })
  );
  return withItems;
};

export const createChecklistOnCard = async (
  projectId: string,
  cardId: string,
  userId: string,
  body: ChecklistTitleBody | unknown
) => {
  const input = validateChecklistTitleInput(body);

  return withTransaction(async (txQuery) => {
    const context = await getCardContextOrThrow(
      projectId,
      cardId,
      userId,
      txQuery
    );
    const nextPosition = await getNextChecklistPosition(context.cardId, txQuery);
    return createChecklist(
      {
        id: randomUUID(),
        cardId: context.cardId,
        title: input.title,
        position: nextPosition,
        createdByUserId: userId
      },
      txQuery
    );
  });
};

export const listCardChecklists = async (
  projectId: string,
  cardId: string,
  userId: string
) => {
  const context = await getCardContextOrThrow(projectId, cardId, userId);
  return hydrateChecklistsWithItems(context.cardId);
};

export const updateCardChecklist = async (
  projectId: string,
  cardId: string,
  checklistId: string,
  userId: string,
  body: ChecklistTitleBody | unknown
) => {
  const input = validateChecklistTitleInput(body);
  const context = await ensureChecklistContextOrThrow(
    projectId,
    cardId,
    checklistId,
    userId
  );

  if (context.checklist.title === input.title) {
    throw new HttpError(409, "Checklist title did not change");
  }

  const checklist = await updateChecklistTitle({
    checklistId: context.checklistId,
    cardId: context.cardId,
    title: input.title
  });
  if (!checklist) {
    throw new HttpError(404, "Checklist not found");
  }

  return checklist;
};

export const deleteCardChecklist = async (
  projectId: string,
  cardId: string,
  checklistId: string,
  userId: string
) => {
  return withTransaction(async (txQuery) => {
    const context = await ensureChecklistContextOrThrow(
      projectId,
      cardId,
      checklistId,
      userId,
      txQuery
    );

    const deletedChecklist = await deleteChecklistByIdAndCardId(
      {
        checklistId: context.checklistId,
        cardId: context.cardId
      },
      txQuery
    );
    if (!deletedChecklist) {
      throw new HttpError(404, "Checklist not found");
    }

    await reorderChecklists(context.cardId, txQuery);
    return deletedChecklist;
  });
};

export const createChecklistItemOnCard = async (
  projectId: string,
  cardId: string,
  checklistId: string,
  userId: string,
  body: ChecklistItemBody | unknown
) => {
  const input = validateChecklistItemInput(body);

  return withTransaction(async (txQuery) => {
    const context = await ensureChecklistContextOrThrow(
      projectId,
      cardId,
      checklistId,
      userId,
      txQuery
    );

    const nextPosition = await getNextChecklistItemPosition(
      context.checklistId,
      txQuery
    );
    return createChecklistItem(
      {
        id: randomUUID(),
        checklistId: context.checklistId,
        content: input.content,
        position: nextPosition
      },
      txQuery
    );
  });
};

export const updateChecklistItemOnCard = async (
  projectId: string,
  cardId: string,
  checklistId: string,
  itemId: string,
  userId: string,
  body: ChecklistItemUpdateBody | unknown
) => {
  const input = validateChecklistItemUpdateInput(body);
  const validItemId = validateUuid(itemId, "itemId");

  return withTransaction(async (txQuery) => {
    const context = await ensureChecklistContextOrThrow(
      projectId,
      cardId,
      checklistId,
      userId,
      txQuery
    );

    const item = await findChecklistItemByIdAndChecklistId(
      {
        itemId: validItemId,
        checklistId: context.checklistId
      },
      txQuery
    );
    if (!item) {
      throw new HttpError(404, "Checklist item not found");
    }

    const nextContent = input.content === undefined ? item.content : input.content;
    const nextCompleted =
      input.isCompleted === undefined ? item.isCompleted : input.isCompleted;
    if (nextContent === item.content && nextCompleted === item.isCompleted) {
      throw new HttpError(409, "Checklist item did not change");
    }

    const updatedItem = await updateChecklistItem(
      {
        itemId: validItemId,
        checklistId: context.checklistId,
        shouldUpdateContent: input.content !== undefined,
        content: input.content,
        shouldUpdateCompleted: input.isCompleted !== undefined,
        isCompleted: input.isCompleted,
        completedAt:
          input.isCompleted === undefined
            ? item.completedAt
            : input.isCompleted
              ? new Date().toISOString()
              : null,
        completedByUserId:
          input.isCompleted === undefined
            ? item.completedByUserId
            : input.isCompleted
              ? userId
              : null
      },
      txQuery
    );
    if (!updatedItem) {
      throw new HttpError(404, "Checklist item not found");
    }

    return updatedItem;
  });
};

export const deleteChecklistItemOnCard = async (
  projectId: string,
  cardId: string,
  checklistId: string,
  itemId: string,
  userId: string
) => {
  const validItemId = validateUuid(itemId, "itemId");

  return withTransaction(async (txQuery) => {
    const context = await ensureChecklistContextOrThrow(
      projectId,
      cardId,
      checklistId,
      userId,
      txQuery
    );

    const deletedItem = await deleteChecklistItem(
      {
        itemId: validItemId,
        checklistId: context.checklistId
      },
      txQuery
    );
    if (!deletedItem) {
      throw new HttpError(404, "Checklist item not found");
    }

    await reorderChecklistItems(context.checklistId, txQuery);
    return deletedItem;
  });
};
