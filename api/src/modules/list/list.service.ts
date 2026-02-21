import { randomUUID } from "node:crypto";

import HttpError from "../../lib/httpError.js";
import { withTransaction } from "../../db/pool.js";
import {
  createList,
  deleteListByIdAndProjectId,
  findListByIdAndProjectId,
  findListsByProjectId,
  findProjectById,
  findProjectMembership,
  getNextListPosition,
  updateListArchivedState,
  updateListName,
  updateListPosition
} from "./list.repository.js";
import {
  validateCreateListInput,
  validateReorderListsInput,
  validateUpdateListInput,
  validateUuid
} from "./list.validation.js";
import type { ListNameBody, ReorderListsBody } from "./list.types.js";

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

const ensureOwnerOrThrow = (membership: { role: string }) => {
  if (membership.role !== "owner") {
    throw new HttpError(403, "Only organization owners can perform this action");
  }
};

export const createProjectList = async (
  projectId: string,
  userId: string,
  body: ListNameBody | unknown
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const input = validateCreateListInput(body);

  return withTransaction(async (txQuery) => {
    const { membership } = await getProjectWithMembershipOrThrow(
      validProjectId,
      userId,
      txQuery
    );
    ensureOwnerOrThrow(membership);

    const nextPosition = await getNextListPosition(validProjectId, txQuery);
    return createList(
      {
        id: randomUUID(),
        projectId: validProjectId,
        name: input.name,
        position: nextPosition,
        createdByUserId: userId
      },
      txQuery
    );
  });
};

export const listProjectLists = async (
  projectId: string,
  userId: string,
  includeArchived = false
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  await getProjectWithMembershipOrThrow(validProjectId, userId);
  return findListsByProjectId({
    projectId: validProjectId,
    includeArchived
  });
};

export const getProjectList = async (
  projectId: string,
  listId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validListId = validateUuid(listId, "listId");

  await getProjectWithMembershipOrThrow(validProjectId, userId);

  const list = await findListByIdAndProjectId({
    listId: validListId,
    projectId: validProjectId
  });
  if (!list) {
    throw new HttpError(404, "List not found");
  }

  return list;
};

export const renameProjectList = async (
  projectId: string,
  listId: string,
  userId: string,
  body: ListNameBody | unknown
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validListId = validateUuid(listId, "listId");
  const input = validateUpdateListInput(body);

  const { membership } = await getProjectWithMembershipOrThrow(
    validProjectId,
    userId
  );
  ensureOwnerOrThrow(membership);

  const existingList = await findListByIdAndProjectId({
    listId: validListId,
    projectId: validProjectId
  });
  if (!existingList) {
    throw new HttpError(404, "List not found");
  }

  if (existingList.name === input.name) {
    throw new HttpError(409, "List name did not change");
  }

  const updatedList = await updateListName({
    listId: validListId,
    projectId: validProjectId,
    name: input.name
  });
  if (!updatedList) {
    throw new HttpError(404, "List not found");
  }

  return updatedList;
};

export const reorderProjectLists = async (
  projectId: string,
  userId: string,
  body: ReorderListsBody | unknown
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const input = validateReorderListsInput(body);

  return withTransaction(async (txQuery) => {
    const { membership } = await getProjectWithMembershipOrThrow(
      validProjectId,
      userId,
      txQuery
    );
    ensureOwnerOrThrow(membership);

    const activeLists = await findListsByProjectId(
      {
        projectId: validProjectId,
        includeArchived: false
      },
      txQuery
    );

    if (activeLists.length === 0) {
      throw new HttpError(409, "No active lists to reorder");
    }

    if (input.orderedListIds.length !== activeLists.length) {
      throw new HttpError(
        400,
        "orderedListIds must include every active list exactly once"
      );
    }

    const activeListIds = activeLists.map((list) => list.id);
    const activeSet = new Set(activeListIds);
    const unknownId = input.orderedListIds.find((id) => !activeSet.has(id));
    if (unknownId) {
      throw new HttpError(400, `orderedListIds contains unknown list id: ${unknownId}`);
    }

    const currentOrder = activeListIds.join(",");
    const requestedOrder = input.orderedListIds.join(",");
    if (currentOrder === requestedOrder) {
      throw new HttpError(409, "List order did not change");
    }

    for (let index = 0; index < input.orderedListIds.length; index += 1) {
      const listId = input.orderedListIds[index];
      await updateListPosition(
        {
          listId,
          projectId: validProjectId,
          position: index + 1
        },
        txQuery
      );
    }

    return findListsByProjectId(
      {
        projectId: validProjectId,
        includeArchived: false
      },
      txQuery
    );
  });
};

export const archiveProjectList = async (
  projectId: string,
  listId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validListId = validateUuid(listId, "listId");

  return withTransaction(async (txQuery) => {
    const { membership } = await getProjectWithMembershipOrThrow(
      validProjectId,
      userId,
      txQuery
    );
    ensureOwnerOrThrow(membership);

    const list = await findListByIdAndProjectId(
      {
        listId: validListId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!list) {
      throw new HttpError(404, "List not found");
    }
    if (list.isArchived) {
      throw new HttpError(409, "List is already archived");
    }

    const updatedList = await updateListArchivedState(
      {
        listId: validListId,
        projectId: validProjectId,
        isArchived: true
      },
      txQuery
    );
    if (!updatedList) {
      throw new HttpError(404, "List not found");
    }
    return updatedList;
  });
};

export const restoreProjectList = async (
  projectId: string,
  listId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validListId = validateUuid(listId, "listId");

  return withTransaction(async (txQuery) => {
    const { membership } = await getProjectWithMembershipOrThrow(
      validProjectId,
      userId,
      txQuery
    );
    ensureOwnerOrThrow(membership);

    const list = await findListByIdAndProjectId(
      {
        listId: validListId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!list) {
      throw new HttpError(404, "List not found");
    }
    if (!list.isArchived) {
      throw new HttpError(409, "List is already active");
    }

    const nextPosition = await getNextListPosition(validProjectId, txQuery);
    const updatedList = await updateListArchivedState(
      {
        listId: validListId,
        projectId: validProjectId,
        isArchived: false,
        position: nextPosition
      },
      txQuery
    );
    if (!updatedList) {
      throw new HttpError(404, "List not found");
    }
    return updatedList;
  });
};

export const deleteProjectList = async (
  projectId: string,
  listId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validListId = validateUuid(listId, "listId");

  const { membership } = await getProjectWithMembershipOrThrow(
    validProjectId,
    userId
  );
  ensureOwnerOrThrow(membership);

  const deletedList = await deleteListByIdAndProjectId({
    listId: validListId,
    projectId: validProjectId
  });
  if (!deletedList) {
    throw new HttpError(404, "List not found");
  }

  return deletedList;
};
