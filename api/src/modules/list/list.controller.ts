import type { NextFunction, Request, Response } from "express";

import * as listService from "./list.service.js";
import type { ListNameBody, ReorderListsBody } from "./list.types.js";

export const createList = async (
  req: Request<{ projectId: string }, {}, ListNameBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const list = await listService.createProjectList(
      req.params.projectId,
      req.auth.userId,
      req.body
    );
    res.status(201).json({
      message: "List created",
      list
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectLists = async (
  req: Request<{ projectId: string }, {}, {}, { includeArchived?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const lists = await listService.listProjectLists(
      req.params.projectId,
      req.auth.userId,
      includeArchived
    );
    res.status(200).json({ lists });
  } catch (error) {
    next(error);
  }
};

export const getProjectList = async (
  req: Request<{ projectId: string; listId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const list = await listService.getProjectList(
      req.params.projectId,
      req.params.listId,
      req.auth.userId
    );
    res.status(200).json({ list });
  } catch (error) {
    next(error);
  }
};

export const updateList = async (
  req: Request<{ projectId: string; listId: string }, {}, ListNameBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const list = await listService.renameProjectList(
      req.params.projectId,
      req.params.listId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "List updated",
      list
    });
  } catch (error) {
    next(error);
  }
};

export const reorderLists = async (
  req: Request<{ projectId: string }, {}, ReorderListsBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const lists = await listService.reorderProjectLists(
      req.params.projectId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Lists reordered",
      lists
    });
  } catch (error) {
    next(error);
  }
};

export const archiveList = async (
  req: Request<{ projectId: string; listId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const list = await listService.archiveProjectList(
      req.params.projectId,
      req.params.listId,
      req.auth.userId
    );
    res.status(200).json({
      message: "List archived",
      list
    });
  } catch (error) {
    next(error);
  }
};

export const restoreList = async (
  req: Request<{ projectId: string; listId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const list = await listService.restoreProjectList(
      req.params.projectId,
      req.params.listId,
      req.auth.userId
    );
    res.status(200).json({
      message: "List restored",
      list
    });
  } catch (error) {
    next(error);
  }
};

export const deleteList = async (
  req: Request<{ projectId: string; listId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const list = await listService.deleteProjectList(
      req.params.projectId,
      req.params.listId,
      req.auth.userId
    );
    res.status(200).json({
      message: "List deleted",
      list
    });
  } catch (error) {
    next(error);
  }
};
