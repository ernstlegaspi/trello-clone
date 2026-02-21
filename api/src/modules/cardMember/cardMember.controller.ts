import type { NextFunction, Request, Response } from "express";

import * as cardMemberService from "./cardMember.service.js";

export const getCardMembers = async (
  req: Request<{ projectId: string; cardId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const members = await cardMemberService.listCardMembers(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId
    );
    res.status(200).json({ members });
  } catch (error) {
    next(error);
  }
};

export const assignMember = async (
  req: Request<{ projectId: string; cardId: string; userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const member = await cardMemberService.assignCardMember(
      req.params.projectId,
      req.params.cardId,
      req.params.userId,
      req.auth.userId
    );
    res.status(201).json({
      message: "Member assigned to card",
      member
    });
  } catch (error) {
    next(error);
  }
};

export const unassignMember = async (
  req: Request<{ projectId: string; cardId: string; userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const member = await cardMemberService.unassignCardMember(
      req.params.projectId,
      req.params.cardId,
      req.params.userId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Member unassigned from card",
      member
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAssignedCards = async (
  req: Request<{ projectId: string }, {}, {}, { includeArchived?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const cards = await cardMemberService.listMyAssignedCards(
      req.params.projectId,
      req.auth.userId,
      includeArchived
    );
    res.status(200).json({ cards });
  } catch (error) {
    next(error);
  }
};
