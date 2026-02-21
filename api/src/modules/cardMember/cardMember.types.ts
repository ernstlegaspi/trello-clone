export interface CardMemberModel {
  cardId: string;
  userId: string;
  addedByUserId: string;
  createdAt: string | Date;
}

export interface CardMemberView {
  cardId: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string | Date;
}
