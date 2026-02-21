import HttpError from "../../lib/httpError.js";
import type {
  ChecklistItemBody,
  ChecklistItemUpdateBody,
  ChecklistTitleBody
} from "./checklist.types.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const throwValidationError = (errors: string[]): never => {
  throw new HttpError(400, "Validation failed", { errors });
};

export const validateUuid = (value: unknown, fieldName: string): string => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || !UUID_REGEX.test(raw)) {
    throwValidationError([`${fieldName} must be a valid UUID`]);
  }
  return raw;
};

export const validateChecklistTitleInput = (
  body: unknown
): ChecklistTitleBody => {
  const input = (body || {}) as Partial<ChecklistTitleBody>;
  const errors: string[] = [];

  if (!input.title || typeof input.title !== "string" || !input.title.trim()) {
    errors.push("title is required");
  } else if (input.title.trim().length < 2) {
    errors.push("title must be at least 2 characters");
  } else if (input.title.trim().length > 120) {
    errors.push("title must be at most 120 characters");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    title: input.title.trim()
  };
};

export const validateChecklistItemInput = (body: unknown): ChecklistItemBody => {
  const input = (body || {}) as Partial<ChecklistItemBody>;
  const errors: string[] = [];

  if (!input.content || typeof input.content !== "string" || !input.content.trim()) {
    errors.push("content is required");
  } else if (input.content.trim().length > 300) {
    errors.push("content must be at most 300 characters");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    content: input.content.trim()
  };
};

export const validateChecklistItemUpdateInput = (
  body: unknown
): ChecklistItemUpdateBody => {
  const input = (body || {}) as Partial<ChecklistItemUpdateBody>;
  const errors: string[] = [];
  const payload: ChecklistItemUpdateBody = {};

  if (input.content !== undefined) {
    if (typeof input.content !== "string" || !input.content.trim()) {
      errors.push("content must be a non-empty string");
    } else if (input.content.trim().length > 300) {
      errors.push("content must be at most 300 characters");
    } else {
      payload.content = input.content.trim();
    }
  }

  if (input.isCompleted !== undefined) {
    if (typeof input.isCompleted !== "boolean") {
      errors.push("isCompleted must be a boolean");
    } else {
      payload.isCompleted = input.isCompleted;
    }
  }

  if (input.content === undefined && input.isCompleted === undefined) {
    errors.push("at least one of content or isCompleted is required");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return payload;
};
