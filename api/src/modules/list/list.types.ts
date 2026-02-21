export interface ListNameBody {
  name: string;
}

export interface ReorderListsBody {
  orderedListIds: string[];
}

export interface ListModel {
  id: string;
  projectId: string;
  name: string;
  position: number;
  isArchived: boolean;
  createdByUserId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
