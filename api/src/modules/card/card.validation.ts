import HttpError from "../../lib/httpError.js";
import type {
  CardCreateBody,
  CardMoveBody,
  CardUpdateBody,
  ReorderCardsBody
} from "./card.types.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const throwValidationError = (errors: string[]): never => {
  throw new HttpError(400, "Validation failed", { errors });
};

const normalizeDueAt = (value: unknown, fieldName: string) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throwValidationError([`${fieldName} must be an ISO date string or null`]);
  }
  const raw = (value as string).trim();
  if (!raw) {
    return null;
  }
  const timestamp = Date.parse(raw);
  if (Number.isNaN(timestamp)) {
    throwValidationError([`${fieldName} must be a valid ISO date string`]);
  }
  return new Date(timestamp).toISOString();
};

export const validateUuid = (value: unknown, fieldName: string): string => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || !UUID_REGEX.test(raw)) {
    throwValidationError([`${fieldName} must be a valid UUID`]);
  }
  return raw;
};

export const validateCreateCardInput = (body: unknown): CardCreateBody => {
  const input = (body || {}) as Partial<CardCreateBody>;
  const errors: string[] = [];

  if (!input.title || typeof input.title !== "string" || !input.title.trim()) {
    errors.push("title is required");
  } else if (input.title.trim().length > 200) {
    errors.push("title must be at most 200 characters");
  }

  if (
    input.description !== undefined &&
    input.description !== null &&
    typeof input.description !== "string"
  ) {
    errors.push("description must be a string");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  const dueAt = normalizeDueAt(input.dueAt, "dueAt");
  return {
    title: input.title.trim(),
    description:
      input.description === undefined
        ? undefined
        : input.description === null
          ? null
          : input.description.trim(),
    dueAt
  };
};

export const validateUpdateCardInput = (body: unknown): CardUpdateBody => {
  const input = (body || {}) as Partial<CardUpdateBody>;
  const errors: string[] = [];
  const payload: CardUpdateBody = {};
  let hasAnyField = false;

  if (input.title !== undefined) {
    hasAnyField = true;
    if (typeof input.title !== "string" || !input.title.trim()) {
      errors.push("title must be a non-empty string");
    } else if (input.title.trim().length > 200) {
      errors.push("title must be at most 200 characters");
    } else {
      payload.title = input.title.trim();
    }
  }

  if (input.description !== undefined) {
    hasAnyField = true;
    if (input.description !== null && typeof input.description !== "string") {
      errors.push("description must be a string or null");
    } else {
      payload.description =
        input.description === null ? null : (input.description || "").trim();
    }
  }

  if (input.dueAt !== undefined) {
    hasAnyField = true;
    payload.dueAt = normalizeDueAt(input.dueAt, "dueAt");
  }

  if (!hasAnyField) {
    errors.push("at least one of title, description, dueAt is required");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return payload;
};

export const validateMoveCardInput = (body: unknown): CardMoveBody => {
  const input = (body || {}) as Partial<CardMoveBody>;
  const errors: string[] = [];

  const targetListId =
    typeof input.targetListId === "string" ? input.targetListId.trim() : "";
  if (!targetListId || !UUID_REGEX.test(targetListId)) {
    errors.push("targetListId must be a valid UUID");
  }

  if (input.targetPosition !== undefined) {
    if (
      typeof input.targetPosition !== "number" ||
      !Number.isInteger(input.targetPosition) ||
      input.targetPosition < 1
    ) {
      errors.push("targetPosition must be an integer >= 1");
    }
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    targetListId,
    targetPosition: input.targetPosition
  };
};

export const validateReorderCardsInput = (body: unknown): ReorderCardsBody => {
  const input = (body || {}) as Partial<ReorderCardsBody>;
  const errors: string[] = [];

  if (!Array.isArray(input.orderedCardIds)) {
    errors.push("orderedCardIds must be an array");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  const normalizedIds = input.orderedCardIds
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean);

  if (normalizedIds.length !== input.orderedCardIds.length) {
    throwValidationError(["orderedCardIds must contain only non-empty UUID strings"]);
  }

  const invalidId = normalizedIds.find((id) => !UUID_REGEX.test(id));
  if (invalidId) {
    throwValidationError([`orderedCardIds contains invalid UUID: ${invalidId}`]);
  }

  const uniqueCount = new Set(normalizedIds).size;
  if (uniqueCount !== normalizedIds.length) {
    throwValidationError(["orderedCardIds must not contain duplicates"]);
  }

  return {
    orderedCardIds: normalizedIds
  };
};
