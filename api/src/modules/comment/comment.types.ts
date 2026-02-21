export interface CommentBody {
  content: string;
}

export interface CommentModel {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
