import express from "express";

import requireAuth from "../../middleware/authMiddleware.js";
import * as listController from "./list.controller.js";

const router = express.Router();

router.use(requireAuth);

router.post("/:projectId/lists", listController.createList);
router.get("/:projectId/lists", listController.getProjectLists);
router.patch("/:projectId/lists/reorder", listController.reorderLists);
router.get("/:projectId/lists/:listId", listController.getProjectList);
router.patch("/:projectId/lists/:listId", listController.updateList);
router.patch("/:projectId/lists/:listId/archive", listController.archiveList);
router.patch("/:projectId/lists/:listId/restore", listController.restoreList);
router.delete("/:projectId/lists/:listId", listController.deleteList);

export default router;
