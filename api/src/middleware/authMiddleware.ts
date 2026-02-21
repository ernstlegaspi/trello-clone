import type { NextFunction, Request, Response } from "express";

import HttpError from "../lib/httpError.js";
import { verifyAccessToken } from "../lib/jwt.js";
import {
  isAccessTokenRevoked,
  pruneExpiredRevokedAccessTokens,
} from "../modules/auth/auth.repository.js";

const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "Missing bearer token");
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new HttpError(401, "Missing bearer token");
    }

    const payload = verifyAccessToken(token);
    await pruneExpiredRevokedAccessTokens();
    const revoked = await isAccessTokenRevoked(payload.jti);
    if (revoked) {
      throw new HttpError(401, "Access token has been revoked");
    }

    req.auth = {
      userId: payload.sub,
      email: payload.email,
      tokenId: payload.jti,
      tokenExp: payload.exp,
    };
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    next(new HttpError(401, "Invalid or expired access token"));
  }
};

export default requireAuth;
