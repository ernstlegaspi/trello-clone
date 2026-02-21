import type { NextFunction, Request, Response } from "express";

import * as checklistService from "./checklist.service.js";
import type {
  ChecklistItemBody,
  ChecklistItemUpdateBody,
  ChecklistTitleBody
} from "./checklist.types.js";

export const createChecklist = async (
  req: Request<{ projectId: string; cardId: string }, {}, ChecklistTitleBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const checklist = await checklistService.createChecklistOnCard(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId,
      req.body
    );
    res.status(201).json({
      message: "Checklist created",
      checklist
    });
  } catch (error) {
    next(error);
  }
};

export const getChecklists = async (
  req: Request<{ projectId: string; cardId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const checklists = await checklistService.listCardChecklists(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId
    );
    res.status(200).json({ checklists });
  } catch (error) {
    next(error);
  }
};

export const updateChecklist = async (
  req: Request<
    { projectId: string; cardId: string; checklistId: string },
    {},
    ChecklistTitleBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const checklist = await checklistService.updateCardChecklist(
      req.params.projectId,
      req.params.cardId,
      req.params.checklistId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Checklist updated",
      checklist
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChecklist = async (
  req: Request<{ projectId: string; cardId: string; checklistId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const checklist = await checklistService.deleteCardChecklist(
      req.params.projectId,
      req.params.cardId,
      req.params.checklistId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Checklist deleted",
      checklist
    });
  } catch (error) {
    next(error);
  }
};

export const createChecklistItem = async (
  req: Request<
    { projectId: string; cardId: string; checklistId: string },
    {},
    ChecklistItemBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await checklistService.createChecklistItemOnCard(
      req.params.projectId,
      req.params.cardId,
      req.params.checklistId,
      req.auth.userId,
      req.body
    );
    res.status(201).json({
      message: "Checklist item created",
      item
    });
  } catch (error) {
    next(error);
  }
};

export const updateChecklistItem = async (
  req: Request<
    { projectId: string; cardId: string; checklistId: string; itemId: string },
    {},
    ChecklistItemUpdateBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await checklistService.updateChecklistItemOnCard(
      req.params.projectId,
      req.params.cardId,
      req.params.checklistId,
      req.params.itemId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Checklist item updated",
      item
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChecklistItem = async (
  req: Request<
    { projectId: string; cardId: string; checklistId: string; itemId: string }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await checklistService.deleteChecklistItemOnCard(
      req.params.projectId,
      req.params.cardId,
      req.params.checklistId,
      req.params.itemId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Checklist item deleted",
      item
    });
  } catch (error) {
    next(error);
  }
};
