import HttpError from "../../lib/httpError.js";
import type { CreateLabelBody, UpdateLabelBody } from "./label.types.js";

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

export const validateCreateLabelInput = (body: unknown): CreateLabelBody => {
  const input = (body || {}) as Partial<CreateLabelBody>;
  const errors: string[] = [];

  if (!input.name || typeof input.name !== "string" || !input.name.trim()) {
    errors.push("name is required");
  } else if (input.name.trim().length < 2) {
    errors.push("name must be at least 2 characters");
  } else if (input.name.trim().length > 80) {
    errors.push("name must be at most 80 characters");
  }

  if (!input.color || typeof input.color !== "string" || !input.color.trim()) {
    errors.push("color is required");
  } else if (input.color.trim().length > 40) {
    errors.push("color must be at most 40 characters");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    name: input.name.trim(),
    color: input.color.trim().toLowerCase()
  };
};

export const validateUpdateLabelInput = (body: unknown): UpdateLabelBody => {
  const input = (body || {}) as Partial<UpdateLabelBody>;
  const errors: string[] = [];
  const payload: UpdateLabelBody = {};

  if (input.name !== undefined) {
    if (typeof input.name !== "string" || !input.name.trim()) {
      errors.push("name must be a non-empty string");
    } else if (input.name.trim().length < 2) {
      errors.push("name must be at least 2 characters");
    } else if (input.name.trim().length > 80) {
      errors.push("name must be at most 80 characters");
    } else {
      payload.name = input.name.trim();
    }
  }

  if (input.color !== undefined) {
    if (typeof input.color !== "string" || !input.color.trim()) {
      errors.push("color must be a non-empty string");
    } else if (input.color.trim().length > 40) {
      errors.push("color must be at most 40 characters");
    } else {
      payload.color = input.color.trim().toLowerCase();
    }
  }

  if (input.name === undefined && input.color === undefined) {
    errors.push("at least one of name or color is required");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return payload;
};
