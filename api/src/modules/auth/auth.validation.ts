import HttpError from "../../lib/httpError.js";
import type { LoginBody, RegisterBody } from "./auth.types.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const throwValidationError = (errors: string[]): never => {
  throw new HttpError(400, "Validation failed", { errors });
};

export const validateRegisterInput = (body: unknown): RegisterBody => {
  const input = (body || {}) as Partial<RegisterBody>;
  const errors = [];

  if (!input.name || typeof input.name !== "string" || !input.name.trim()) {
    errors.push("name is required");
  } else if (input.name.trim().length < 2) {
    errors.push("name must be at least 2 characters");
  }

  if (!input.email || typeof input.email !== "string" || !input.email.trim()) {
    errors.push("email is required");
  } else if (!EMAIL_REGEX.test(input.email.trim().toLowerCase())) {
    errors.push("email is invalid");
  }

  if (
    !input.password ||
    typeof input.password !== "string" ||
    input.password.length < 8
  ) {
    errors.push("password must be at least 8 characters");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };
};

export const validateLoginInput = (body: unknown): LoginBody => {
  const input = (body || {}) as Partial<LoginBody>;
  const errors = [];

  if (!input.email || typeof input.email !== "string" || !input.email.trim()) {
    errors.push("email is required");
  } else if (!EMAIL_REGEX.test(input.email.trim().toLowerCase())) {
    errors.push("email is invalid");
  }

  if (!input.password || typeof input.password !== "string") {
    errors.push("password is required");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };
};
