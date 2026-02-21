export type AuthMode = "login" | "register";

export type CardDragState = {
  cardId: string;
  fromListId: string;
} | null;

export type DropHint = {
  listId: string;
  index: number;
} | null;
