import HttpError from "../../lib/httpError.js";
import type {
  InviteEmailBody,
  OrganizationNameBody,
  UpdateMemberRoleBody
} from "./organization.types.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const throwValidationError = (errors: string[]): never => {
  throw new HttpError(400, "Validation failed", { errors });
};

const validateNameInput = (
  body: unknown,
  field: keyof OrganizationNameBody = "name"
): OrganizationNameBody => {
  const input = (body || {}) as Partial<OrganizationNameBody>;
  const errors = [];

  if (!input[field] || typeof input[field] !== "string" || !input[field].trim()) {
    errors.push(`${field} is required`);
  } else if (input[field].trim().length < 2) {
    errors.push(`${field} must be at least 2 characters`);
  } else if (input[field].trim().length > 120) {
    errors.push(`${field} must be at most 120 characters`);
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    [field]: input[field].trim()
  };
};

export const validateCreateOrganizationInput = (
  body: unknown
): OrganizationNameBody => validateNameInput(body);

export const validateUpdateOrganizationInput = (
  body: unknown
): OrganizationNameBody => validateNameInput(body);

export const validateCreateProjectInput = (
  body: unknown
): OrganizationNameBody => validateNameInput(body);

export const validateUpdateProjectInput = (
  body: unknown
): OrganizationNameBody => validateNameInput(body);

export const validateInviteInput = (body: unknown): InviteEmailBody => {
  const input = (body || {}) as Partial<InviteEmailBody>;
  const errors = [];

  if (!input.email || typeof input.email !== "string" || !input.email.trim()) {
    errors.push("email is required");
  } else if (!EMAIL_REGEX.test(input.email.trim().toLowerCase())) {
    errors.push("email is invalid");
  }

  if (errors.length > 0) {
    throwValidationError(errors);
  }

  return {
    email: input.email.trim().toLowerCase()
  };
};

export const validateUuid = (value: unknown, fieldName: string): string => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || !UUID_REGEX.test(raw)) {
    throwValidationError([`${fieldName} must be a valid UUID`]);
  }
  return raw;
};

export const validateInviteTokenInput = (
  value: unknown,
  fieldName = "token"
): string => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    throwValidationError([`${fieldName} is required`]);
  }
  return raw;
};

export const validateUpdateMemberRoleInput = (
  body: unknown
): UpdateMemberRoleBody => {
  const input = (body || {}) as Partial<UpdateMemberRoleBody>;
  const role = typeof input.role === "string" ? input.role.trim() : "";

  if (!role) {
    throwValidationError(["role is required"]);
  }

  if (role !== "owner" && role !== "member") {
    throwValidationError(["role must be either 'owner' or 'member'"]);
  }

  const normalizedRole: UpdateMemberRoleBody["role"] =
    role === "owner" ? "owner" : "member";
  return { role: normalizedRole };
};
