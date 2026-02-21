import { randomUUID } from "node:crypto";

import HttpError from "../../lib/httpError.js";
import { withTransaction } from "../../db/pool.js";
import {
  findCardByIdAndProjectId,
  findProjectById,
  findProjectMembership
} from "../common/projectAccess.repository.js";
import {
  addLabelToCard,
  createLabel,
  deleteLabelByIdAndProjectId,
  findLabelByIdAndProjectId,
  findLabelsByCardId,
  findLabelsByProjectId,
  removeLabelFromCard,
  updateLabelByIdAndProjectId
} from "./label.repository.js";
import {
  validateCreateLabelInput,
  validateUpdateLabelInput,
  validateUuid
} from "./label.validation.js";
import type { CreateLabelBody, UpdateLabelBody } from "./label.types.js";

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

export const createProjectLabel = async (
  projectId: string,
  userId: string,
  body: CreateLabelBody | unknown
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const input = validateCreateLabelInput(body);

  const { membership } = await getProjectWithMembershipOrThrow(validProjectId, userId);
  ensureOwnerOrThrow(membership);

  try {
    return await createLabel({
      id: randomUUID(),
      projectId: validProjectId,
      name: input.name,
      color: input.color,
      createdByUserId: userId
    });
  } catch (error) {
    if (error?.code === "23505") {
      throw new HttpError(409, "A label with this name already exists in this project");
    }
    throw error;
  }
};

export const listProjectLabels = async (projectId: string, userId: string) => {
  const validProjectId = validateUuid(projectId, "projectId");
  await getProjectWithMembershipOrThrow(validProjectId, userId);
  return findLabelsByProjectId(validProjectId);
};

export const updateProjectLabel = async (
  projectId: string,
  labelId: string,
  userId: string,
  body: UpdateLabelBody | unknown
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validLabelId = validateUuid(labelId, "labelId");
  const input = validateUpdateLabelInput(body);

  const { membership } = await getProjectWithMembershipOrThrow(validProjectId, userId);
  ensureOwnerOrThrow(membership);

  const existingLabel = await findLabelByIdAndProjectId({
    labelId: validLabelId,
    projectId: validProjectId
  });
  if (!existingLabel) {
    throw new HttpError(404, "Label not found");
  }

  const nextName = input.name === undefined ? existingLabel.name : input.name;
  const nextColor = input.color === undefined ? existingLabel.color : input.color;
  if (nextName === existingLabel.name && nextColor === existingLabel.color) {
    throw new HttpError(409, "Label did not change");
  }

  try {
    const label = await updateLabelByIdAndProjectId({
      labelId: validLabelId,
      projectId: validProjectId,
      name: input.name,
      color: input.color,
      shouldUpdateName: input.name !== undefined,
      shouldUpdateColor: input.color !== undefined
    });
    if (!label) {
      throw new HttpError(404, "Label not found");
    }
    return label;
  } catch (error) {
    if (error?.code === "23505") {
      throw new HttpError(409, "A label with this name already exists in this project");
    }
    throw error;
  }
};

export const deleteProjectLabel = async (
  projectId: string,
  labelId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validLabelId = validateUuid(labelId, "labelId");

  const { membership } = await getProjectWithMembershipOrThrow(validProjectId, userId);
  ensureOwnerOrThrow(membership);

  const deletedLabel = await deleteLabelByIdAndProjectId({
    labelId: validLabelId,
    projectId: validProjectId
  });
  if (!deletedLabel) {
    throw new HttpError(404, "Label not found");
  }

  return deletedLabel;
};

export const listCardLabelsByProject = async (
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

  return findLabelsByCardId(validCardId);
};

export const attachLabelToCard = async (
  projectId: string,
  cardId: string,
  labelId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");
  const validLabelId = validateUuid(labelId, "labelId");

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

    const label = await findLabelByIdAndProjectId(
      {
        labelId: validLabelId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!label) {
      throw new HttpError(404, "Label not found");
    }

    const link = await addLabelToCard(
      {
        cardId: validCardId,
        labelId: validLabelId
      },
      txQuery
    );
    if (!link) {
      throw new HttpError(409, "Label is already attached to this card");
    }

    return {
      link,
      label
    };
  });
};

export const detachLabelFromCard = async (
  projectId: string,
  cardId: string,
  labelId: string,
  userId: string
) => {
  const validProjectId = validateUuid(projectId, "projectId");
  const validCardId = validateUuid(cardId, "cardId");
  const validLabelId = validateUuid(labelId, "labelId");

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

    const label = await findLabelByIdAndProjectId(
      {
        labelId: validLabelId,
        projectId: validProjectId
      },
      txQuery
    );
    if (!label) {
      throw new HttpError(404, "Label not found");
    }

    const removedLink = await removeLabelFromCard(
      {
        cardId: validCardId,
        labelId: validLabelId
      },
      txQuery
    );
    if (!removedLink) {
      throw new HttpError(404, "Label is not attached to this card");
    }

    return {
      link: removedLink,
      label
    };
  });
};
