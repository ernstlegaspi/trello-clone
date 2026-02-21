import type { NextFunction, Request, Response } from "express";

import * as labelService from "./label.service.js";
import type { CreateLabelBody, UpdateLabelBody } from "./label.types.js";

export const createLabel = async (
  req: Request<{ projectId: string }, {}, CreateLabelBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const label = await labelService.createProjectLabel(
      req.params.projectId,
      req.auth.userId,
      req.body
    );
    res.status(201).json({
      message: "Label created",
      label
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectLabels = async (
  req: Request<{ projectId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const labels = await labelService.listProjectLabels(
      req.params.projectId,
      req.auth.userId
    );
    res.status(200).json({ labels });
  } catch (error) {
    next(error);
  }
};

export const updateLabel = async (
  req: Request<{ projectId: string; labelId: string }, {}, UpdateLabelBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const label = await labelService.updateProjectLabel(
      req.params.projectId,
      req.params.labelId,
      req.auth.userId,
      req.body
    );
    res.status(200).json({
      message: "Label updated",
      label
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLabel = async (
  req: Request<{ projectId: string; labelId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const label = await labelService.deleteProjectLabel(
      req.params.projectId,
      req.params.labelId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Label deleted",
      label
    });
  } catch (error) {
    next(error);
  }
};

export const getCardLabels = async (
  req: Request<{ projectId: string; cardId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const labels = await labelService.listCardLabelsByProject(
      req.params.projectId,
      req.params.cardId,
      req.auth.userId
    );
    res.status(200).json({ labels });
  } catch (error) {
    next(error);
  }
};

export const attachLabelToCard = async (
  req: Request<{ projectId: string; cardId: string; labelId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await labelService.attachLabelToCard(
      req.params.projectId,
      req.params.cardId,
      req.params.labelId,
      req.auth.userId
    );
    res.status(201).json({
      message: "Label attached to card",
      label: result.label,
      link: result.link
    });
  } catch (error) {
    next(error);
  }
};

export const detachLabelFromCard = async (
  req: Request<{ projectId: string; cardId: string; labelId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await labelService.detachLabelFromCard(
      req.params.projectId,
      req.params.cardId,
      req.params.labelId,
      req.auth.userId
    );
    res.status(200).json({
      message: "Label detached from card",
      label: result.label,
      link: result.link
    });
  } catch (error) {
    next(error);
  }
};
