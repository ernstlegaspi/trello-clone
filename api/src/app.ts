import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import env from "./config/env.js";
import HttpError from "./lib/httpError.js";
import authRoutes from "./modules/auth/auth.routes.js";
import organizationRoutes from "./modules/organization/organization.routes.js";
import listRoutes from "./modules/list/list.routes.js";
import cardRoutes from "./modules/card/card.routes.js";
import labelRoutes from "./modules/label/label.routes.js";
import cardMemberRoutes from "./modules/cardMember/cardMember.routes.js";
import commentRoutes from "./modules/comment/comment.routes.js";
import checklistRoutes from "./modules/checklist/checklist.routes.js";
import errorHandler from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/projects", listRoutes);
app.use("/api", cardRoutes);
app.use("/api", labelRoutes);
app.use("/api", cardMemberRoutes);
app.use("/api", commentRoutes);
app.use("/api", checklistRoutes);

app.use((_req, _res, next) => {
  next(new HttpError(404, "Route not found"));
});

app.use(errorHandler);

export default app;
