import express from "express";

import requireAuth from "../../middleware/authMiddleware.js";
import * as authController from "./auth.controller.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", requireAuth, authController.logoutAll);

export default router;
