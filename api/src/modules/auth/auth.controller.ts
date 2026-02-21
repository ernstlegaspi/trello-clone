import type { NextFunction, Request, Response } from "express";

import {
  refreshCookieName,
  refreshCookieBaseOptions,
  refreshCookieOptions
} from "../../config/cookie.js";
import * as authService from "./auth.service.js";
import type { LoginBody, RegisterBody } from "./auth.types.js";

const getBearerToken = (req: Request): string => {
  const authHeader = req.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }
  return authHeader.slice(7).trim();
};

export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.register(req.body);
    res.cookie(refreshCookieName, result.refreshToken, refreshCookieOptions);
    res.status(201).json({
      message: "Registered successfully",
      user: result.user,
      accessToken: result.accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.login(req.body);
    res.cookie(refreshCookieName, result.refreshToken, refreshCookieOptions);
    res.status(200).json({
      message: "Logged in successfully",
      user: result.user,
      accessToken: result.accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.auth.userId);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentRefreshToken = req.cookies[refreshCookieName];
    const result = await authService.refresh(currentRefreshToken);
    res.cookie(refreshCookieName, result.refreshToken, refreshCookieOptions);
    res.status(200).json({
      message: "Token refreshed",
      user: result.user,
      accessToken: result.accessToken
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentRefreshToken = req.cookies[refreshCookieName];
    const accessToken = getBearerToken(req);
    await authService.logout(currentRefreshToken, accessToken);
    res.clearCookie(refreshCookieName, refreshCookieBaseOptions);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = getBearerToken(req);
    await authService.logoutAll(req.auth.userId, accessToken);
    res.clearCookie(refreshCookieName, refreshCookieBaseOptions);
    res.status(200).json({ message: "Logged out from all sessions" });
  } catch (error) {
    next(error);
  }
};
