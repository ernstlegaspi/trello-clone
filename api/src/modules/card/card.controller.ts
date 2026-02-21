import type { NextFunction, Request, Response } from "express";

import * as cardService from "./card.service.js";
import type {
  CardCreateBody,
  CardMoveBody,
  CardUpdateBody,
  ReorderCardsBody
} from "./card.types.js";

export const createCard = async (
  req: Request<{ listId: string }, {}, CardCreateBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const card = await cardService.createCardByList(
      req.params.listId,
      req.auth.userId,
      req.body
    );
    res.status(201).json({
      message: "Card created",
      card
    });
  } catch (error) {
    next(error);
  }
};

export const getListCards = async (
  req: Request<{ listId: string }, {}, {}, { includeArchived?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const cards = await cardService.listCardsByList(
      req.params.listId,
      req.auth.userId,
      includeArchived
    );
    res.status(200).json({ cards });
  } catch (error) {
    next(error);
  }
};

export const reorderCards = async (
  req: Request<{ listId: string }, {}, ReorderCardsBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const cards = await cardService.reorderListCards(
      req.params.listId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Cards reordered",
      cards
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectCards = async (
  req: Request<
    { projectId: string },
    {},
    {},
    { includeArchived?: string; listId?: string; q?: string }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const cards = await cardService.listProjectCards(
      req.params.projectId,
      req.auth.userId,
      req.query
    );
    res.status(200).json({ cards });
  } catch (error) {
    next(error);
  }
};

export const getProjectCard = async (
  req: Request<{ projectId: string; cardId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const card = await cardService.getProjectCard(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId
    );
    res.status(200).json({ card });
  } catch (error) {
    next(error);
  }
};

export const updateProjectCard = async (
  req: Request<{ projectId: string; cardId: string }, {}, CardUpdateBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const card = await cardService.updateProjectCard(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Card updated",
      card
    });
  } catch (error) {
    next(error);
  }
};

export const moveProjectCard = async (
  req: Request<{ projectId: string; cardId: string }, {}, CardMoveBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const card = await cardService.moveProjectCard(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Card moved",
      card
    });
  } catch (error) {
    next(error);
  }
};

export const archiveProjectCard = async (
  req: Request<{ projectId: string; cardId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const card = await cardService.archiveProjectCard(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Card archived",
      card
    });
  } catch (error) {
    next(error);
  }
};

export const restoreProjectCard = async (
  req: Request<{ projectId: string; cardId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const card = await cardService.restoreProjectCard(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Card restored",
      card
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProjectCard = async (
  req: Request<{ projectId: string; cardId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const card = await cardService.deleteProjectCard(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Card deleted",
      card
    });
  } catch (error) {
    next(error);
  }
};
