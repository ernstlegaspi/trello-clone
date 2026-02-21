import app from "./app.js";
import env from "./config/env.js";
import { initializeDatabase } from "./db/init.js";

const start = async () => {
  try {
    await initializeDatabase();
    app.listen(env.PORT, () => {
      console.log(`API listening on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize database", error);
    process.exit(1);
  }
};

start();
