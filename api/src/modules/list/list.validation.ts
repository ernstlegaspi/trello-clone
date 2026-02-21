import HttpError from "../../lib/httpError.js";
import type { ListNameBody, ReorderListsBody } from "./list.types.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const throwValidationError = (errors: string[]): never => {
  throw new HttpError(400, "Validation failed", { errors });
};

const validateNameInput = (body: unknown): ListNameBody => {
  const input = (body || {}) as Partial<ListNameBody>;
  const errors: string[] = [];

  if (!input.name || typeof input.name !== "string" || !input.name.trim()) {
    errors.push("name is required");
  } else if (input.name.trim().length < 2) {
    errors.push("name must be at least 2 characters");
  } else if (input.name.trim().length > 120) {
    errors.push("name must be at most 120 characters");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    name: input.name.trim()
  };
};

export const validateCreateListInput = (body: unknown): ListNameBody =>
  validateNameInput(body);

export const validateUpdateListInput = (body: unknown): ListNameBody =>
  validateNameInput(body);

export const validateUuid = (value: unknown, fieldName: string): string => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || !UUID_REGEX.test(raw)) {
    throwValidationError([`${fieldName} must be a valid UUID`]);
  }
  return raw;
};

export const validateReorderListsInput = (body: unknown): ReorderListsBody => {
  const input = (body || {}) as Partial<ReorderListsBody>;
  const errors: string[] = [];

  if (!Array.isArray(input.orderedListIds)) {
    errors.push("orderedListIds must be an array");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  const normalizedIds = input.orderedListIds
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean);

  if (normalizedIds.length !== input.orderedListIds.length) {
    throwValidationError(["orderedListIds must contain only non-empty UUID strings"]);
  }

  const invalidId = normalizedIds.find((id) => !UUID_REGEX.test(id));
  if (invalidId) {
    throwValidationError([`orderedListIds contains invalid UUID: ${invalidId}`]);
  }

  const uniqueCount = new Set(normalizedIds).size;
  if (uniqueCount !== normalizedIds.length) {
    throwValidationError(["orderedListIds must not contain duplicates"]);
  }

  return {
    orderedListIds: normalizedIds
  };
};
