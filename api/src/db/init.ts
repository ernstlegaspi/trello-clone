import fs from "node:fs";

import { query } from "./pool.js";

const schemaSql = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
const bootstrapSql = `
CREATE SCHEMA IF NOT EXISTS public;
SET search_path TO public;
`;

let initialized = false;

export const initializeDatabase = async () => {
  if (initialized) {
    return;
  }

  await query(`${bootstrapSql}\n${schemaSql}`);
  initialized = true;
};
