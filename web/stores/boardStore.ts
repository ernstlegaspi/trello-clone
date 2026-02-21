import { create } from "zustand";
import type { Card, List } from "../lib/types";
import type { CardDragState, DropHint } from "../components/pages/viewTypes";

type BoardState = {
  lists: List[];
  cardsByList: Record<string, Card[]>;
  newListName: string;
  newCardByList: Record<string, string>;
  loadingBoard: boolean;
  dragState: CardDragState;
  dropHint: DropHint;
  setLists: (lists: List[]) => void;
  setCardsByList: (cardsByList: Record<string, Card[]>) => void;
  setNewListName: (value: string) => void;
  setNewCardByList: (newCardByList: Record<string, string>) => void;
  setLoadingBoard: (value: boolean) => void;
  setDragState: (dragState: CardDragState) => void;
  setDropHint: (dropHint: DropHint) => void;
  resetBoard: () => void;
};

export const useBoardStore = create<BoardState>((set) => ({
  lists: [],
  cardsByList: {},
  newListName: "",
  newCardByList: {},
  loadingBoard: false,
  dragState: null,
  dropHint: null,
  setLists: (lists) => set({ lists }),
  setCardsByList: (cardsByList) => set({ cardsByList }),
  setNewListName: (newListName) => set({ newListName }),
  setNewCardByList: (newCardByList) => set({ newCardByList }),
  setLoadingBoard: (loadingBoard) => set({ loadingBoard }),
  setDragState: (dragState) => set({ dragState }),
  setDropHint: (dropHint) => set({ dropHint }),
  resetBoard: () =>
    set({
      lists: [],
      cardsByList: {},
      newListName: "",
      newCardByList: {},
      loadingBoard: false,
      dragState: null,
      dropHint: null
    })
}));
