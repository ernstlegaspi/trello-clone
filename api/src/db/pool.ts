import pg from "pg";

import env from "../config/env.js";

const { Pool } = pg;

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: env.PGSSL ? { rejectUnauthorized: false } : undefined
    }
  : {
      host: env.PGHOST,
      port: env.PGPORT,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE,
      ssl: env.PGSSL ? { rejectUnauthorized: false } : undefined
    };

const pool = new Pool(poolConfig);

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});

export const query = (text, params = []) => pool.query(text, params);

export const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const txQuery = (text, params = []) => client.query(text, params);
    const result = await callback(txQuery);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export { pool };
