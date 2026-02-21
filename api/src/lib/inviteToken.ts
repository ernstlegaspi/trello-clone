import jwt, { type SignOptions } from "jsonwebtoken";

import env from "../config/env.js";
import HttpError from "./httpError.js";

type OrganizationInviteTokenPayload = {
  inviteId: string;
  email: string;
  type: "organization_invite";
  exp?: number;
};

const getJwtPayloadObject = (payload: string | jwt.JwtPayload) => {
  if (typeof payload === "string") {
    throw new HttpError(401, "Invalid invitation token payload");
  }
  return payload;
};

export const signOrganizationInviteToken = ({
  inviteId,
  email
}: {
  inviteId: string;
  email: string;
}) =>
  jwt.sign(
    {
      inviteId,
      email,
      type: "organization_invite"
    },
    env.JWT_INVITE_SECRET,
    { expiresIn: env.INVITE_TOKEN_TTL as SignOptions["expiresIn"] }
  );

export const verifyOrganizationInviteToken = (
  token: string
): OrganizationInviteTokenPayload => {
  try {
    const rawPayload = jwt.verify(token, env.JWT_INVITE_SECRET);
    const payload = getJwtPayloadObject(
      rawPayload
    ) as OrganizationInviteTokenPayload;
    if (payload.type !== "organization_invite") {
      throw new HttpError(401, "Invalid invitation token type");
    }
    if (!payload.inviteId || typeof payload.inviteId !== "string") {
      throw new HttpError(401, "Invalid invitation token payload");
    }
    if (!payload.email || typeof payload.email !== "string") {
      throw new HttpError(401, "Invalid invitation token payload");
    }
    return payload;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(401, "Invalid or expired invitation token");
  }
};

export const buildOrganizationInviteLink = (token) => {
  const separator = env.INVITE_PAGE_URL.includes("?") ? "&" : "?";
  return `${env.INVITE_PAGE_URL}${separator}token=${encodeURIComponent(token)}`;
};
