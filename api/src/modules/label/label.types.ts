export interface CreateLabelBody {
  name: string;
  color: string;
}

export interface UpdateLabelBody {
  name?: string;
  color?: string;
}

export interface LabelModel {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdByUserId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CardLabelModel {
  cardId: string;
  labelId: string;
  createdAt: string | Date;
}
