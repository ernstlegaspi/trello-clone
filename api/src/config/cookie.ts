import type { CookieOptions } from "express";

import env from "./env.js";

const isProduction = env.NODE_ENV === "production";

export const refreshCookieName = "refresh_token";

export const refreshCookieBaseOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/api/auth"
};

export const refreshCookieOptions: CookieOptions = {
  ...refreshCookieBaseOptions,
  maxAge: env.REFRESH_COOKIE_MAX_AGE_MS
};
