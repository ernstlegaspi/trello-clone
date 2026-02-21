export interface CardCreateBody {
  title: string;
  description?: string | null;
  dueAt?: string | null;
}

export interface CardUpdateBody {
  title?: string;
  description?: string | null;
  dueAt?: string | null;
}

export interface CardMoveBody {
  targetListId: string;
  targetPosition?: number;
}

export interface ReorderCardsBody {
  orderedCardIds: string[];
}

export interface CardModel {
  id: string;
  projectId: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueAt: string | Date | null;
  isArchived: boolean;
  createdByUserId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
