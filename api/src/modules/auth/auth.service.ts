import { randomUUID } from "node:crypto";
import argon2 from "argon2";

import env from "../../config/env.js";
import HttpError from "../../lib/httpError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";
import {
  findUserByEmail,
  findUserById,
  createUser,
  pruneExpiredSessions,
  createSession,
  findSessionById,
  deleteSessionById,
  deleteSessionsByUserId,
  revokeAccessToken,
} from "./auth.repository.js";
import {
  validateRegisterInput,
  validateLoginInput,
} from "./auth.validation.js";
import type { LoginBody, PublicAuthUser, RegisterBody } from "./auth.types.js";

const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const getSessionExpiry = () =>
  new Date(Date.now() + env.REFRESH_COOKIE_MAX_AGE_MS).toISOString();

const toPublicUser = (user: {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}): PublicAuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const issueAuthTokens = async (user: {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}) => {
  const sessionId = randomUUID();
  const accessTokenId = randomUUID();
  const refreshToken = signRefreshToken({
    userId: user.id,
    sessionId,
  });
  const refreshTokenHash = await argon2.hash(refreshToken, ARGON_OPTIONS);

  await createSession({
    id: sessionId,
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: getSessionExpiry(),
  });

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken({
      userId: user.id,
      email: user.email,
      tokenId: accessTokenId,
    }),
    refreshToken,
  };
};

const revokeAccessTokenIfPresent = async (accessToken: string | undefined) => {
  if (!accessToken) {
    return;
  }

  let payload;
  try {
    payload = verifyAccessToken(accessToken);
  } catch {
    // Ignore invalid access tokens at logout to keep operation idempotent.
    return;
  }

  if (typeof payload.exp !== "number") {
    return;
  }

  await revokeAccessToken({
    jti: payload.jti,
    userId: payload.sub,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  });
};

export const register = async (body: RegisterBody | unknown) => {
  await pruneExpiredSessions();
  const input = validateRegisterInput(body);

  const existingUser = await findUserByEmail(input.email);
  if (existingUser) {
    throw new HttpError(409, "Email already in use");
  }

  const passwordHash = await argon2.hash(input.password, ARGON_OPTIONS);
  let user;
  try {
    user = await createUser({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash,
    });
  } catch (error) {
    if (error?.code === "23505") {
      throw new HttpError(409, "Email already in use");
    }
    throw error;
  }

  return issueAuthTokens(user);
};

export const login = async (body: LoginBody | unknown) => {
  await pruneExpiredSessions();
  const input = validateLoginInput(body);

  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isPasswordValid = await argon2.verify(
    user.passwordHash,
    input.password,
  );
  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid email or password");
  }

  return issueAuthTokens(user);
};

export const getMe = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return toPublicUser(user);
};

export const refresh = async (refreshToken: string | undefined) => {
  if (!refreshToken) {
    throw new HttpError(401, "Refresh token is required");
  }

  await pruneExpiredSessions();

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const session = await findSessionById(payload.sid);
  if (!session || session.userId !== payload.sub) {
    throw new HttpError(401, "Refresh session is invalid");
  }

  const tokenMatches = await argon2.verify(session.tokenHash, refreshToken);
  if (!tokenMatches) {
    await deleteSessionById(session.id);
    throw new HttpError(401, "Refresh session is invalid");
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    await deleteSessionById(session.id);
    throw new HttpError(401, "Refresh user no longer exists");
  }

  await deleteSessionById(session.id);
  return issueAuthTokens(user);
};

export const logout = async (
  refreshToken: string | undefined,
  accessToken: string | undefined
) => {
  if (!refreshToken) {
    await revokeAccessTokenIfPresent(accessToken);
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    await deleteSessionById(payload.sid);
  } catch {
    // Ignore invalid tokens at logout to keep operation idempotent.
  }

  await revokeAccessTokenIfPresent(accessToken);
};

export const logoutAll = async (
  userId: string,
  accessToken: string | undefined
) => {
  await deleteSessionsByUserId(userId);
  await revokeAccessTokenIfPresent(accessToken);
};
