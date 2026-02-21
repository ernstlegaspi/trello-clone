import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const NODE_ENV = process.env.NODE_ENV || "development";

const parseNumber = (
  value: string | undefined,
  fallback: number
): number => {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (
  value: string | undefined,
  fallback = false
): boolean => {
  if (value === undefined || value === "") {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
};

const env = {
  NODE_ENV,
  PORT: parseNumber(process.env.PORT, 4000),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_this",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_this",
  JWT_INVITE_SECRET:
    process.env.JWT_INVITE_SECRET || "dev_invite_secret_change_this",
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || "15m",
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || "7d",
  INVITE_TOKEN_TTL: process.env.INVITE_TOKEN_TTL || "7d",
  REFRESH_COOKIE_MAX_AGE_MS: parseNumber(
    process.env.REFRESH_COOKIE_MAX_AGE_MS,
    7 * 24 * 60 * 60 * 1000
  ),
  INVITE_PAGE_URL:
    process.env.INVITE_PAGE_URL ||
    `${process.env.CLIENT_URL || "http://localhost:3000"}/invitation`,
  DATABASE_URL: process.env.DATABASE_URL,
  PGHOST: process.env.PGHOST || "localhost",
  PGPORT: parseNumber(process.env.PGPORT, 5432),
  PGUSER: process.env.PGUSER || "postgres",
  PGPASSWORD: process.env.PGPASSWORD || "postgres",
  PGDATABASE: process.env.PGDATABASE || "trello_clone",
  PGSSL: parseBoolean(process.env.PGSSL, false),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseNumber(process.env.SMTP_PORT, 587),
  SMTP_SECURE: parseBoolean(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM:
    process.env.SMTP_FROM || "Trello Clone <no-reply@trelloclone.local>",
  SMTP_MOCK: parseBoolean(process.env.SMTP_MOCK, NODE_ENV !== "production")
};

if (env.PORT <= 0) {
  throw new Error("PORT must be a positive number");
}

if (env.PGPORT <= 0) {
  throw new Error("PGPORT must be a positive number");
}

if (env.SMTP_PORT <= 0) {
  throw new Error("SMTP_PORT must be a positive number");
}

if (env.REFRESH_COOKIE_MAX_AGE_MS <= 0) {
  throw new Error("REFRESH_COOKIE_MAX_AGE_MS must be positive");
}

if (!env.INVITE_PAGE_URL) {
  throw new Error("INVITE_PAGE_URL must be provided");
}

if (
  env.NODE_ENV === "production" &&
  (env.JWT_ACCESS_SECRET.includes("change_this") ||
    env.JWT_REFRESH_SECRET.includes("change_this") ||
    env.JWT_INVITE_SECRET.includes("change_this"))
) {
  throw new Error("Set strong JWT secrets in production");
}

export default env;
