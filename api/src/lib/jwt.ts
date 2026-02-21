import jwt, { type SignOptions } from "jsonwebtoken";

import env from "../config/env.js";
import HttpError from "./httpError.js";

type AccessTokenPayload = {
  sub: string;
  email: string;
  type: "access";
  jti: string;
  exp?: number;
};

type RefreshTokenPayload = {
  sub: string;
  sid: string;
  type: "refresh";
  exp?: number;
};

const getJwtPayloadObject = (payload: string | jwt.JwtPayload) => {
  if (typeof payload === "string") {
    throw new HttpError(401, "Invalid token payload");
  }
  return payload;
};

export const signAccessToken = ({
  userId,
  email,
  tokenId
}: {
  userId: string;
  email: string;
  tokenId: string;
}) =>
  jwt.sign(
    {
      sub: userId,
      email,
      type: "access",
      jti: tokenId
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"] }
  );

export const signRefreshToken = ({
  userId,
  sessionId
}: {
  userId: string;
  sessionId: string;
}) =>
  jwt.sign(
    {
      sub: userId,
      sid: sessionId,
      type: "refresh"
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"] }
  );

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const rawPayload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  const payload = getJwtPayloadObject(rawPayload) as AccessTokenPayload;

  if (payload.type !== "access") {
    throw new HttpError(401, "Invalid access token type");
  }
  if (!payload.jti || typeof payload.jti !== "string") {
    throw new HttpError(401, "Invalid access token id");
  }
  return payload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const rawPayload = jwt.verify(token, env.JWT_REFRESH_SECRET);
  const payload = getJwtPayloadObject(rawPayload) as RefreshTokenPayload;

  if (payload.type !== "refresh") {
    throw new HttpError(401, "Invalid refresh token type");
  }
  return payload;
};
