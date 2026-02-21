import HttpError from "../../lib/httpError.js";
import type { CommentBody } from "./comment.types.js";

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

export const validateCommentInput = (body: unknown): CommentBody => {
  const input = (body || {}) as Partial<CommentBody>;
  const errors: string[] = [];

  if (!input.content || typeof input.content !== "string" || !input.content.trim()) {
    errors.push("content is required");
  } else if (input.content.trim().length > 5000) {
    errors.push("content must be at most 5000 characters");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    content: input.content.trim()
  };
};
