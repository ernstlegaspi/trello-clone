export interface ChecklistTitleBody {
  title: string;
}

export interface ChecklistItemBody {
  content: string;
}

export interface ChecklistItemUpdateBody {
  content?: string;
  isCompleted?: boolean;
}

export interface ChecklistModel {
  id: string;
  cardId: string;
  title: string;
  position: number;
  createdByUserId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ChecklistItemModel {
  id: string;
  checklistId: string;
  content: string;
  isCompleted: boolean;
  position: number;
  completedAt: string | Date | null;
  completedByUserId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
