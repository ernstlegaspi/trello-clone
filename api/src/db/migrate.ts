import { pool } from "./pool.js";
import { initializeDatabase } from "./init.js";

const run = async () => {
  try {
    await initializeDatabase();
    console.log("Database schema is up to date.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
