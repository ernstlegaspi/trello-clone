import { create } from "zustand";
import type {
  Card,
  CardMember,
  Checklist,
  Comment,
  Label
} from "../lib/types";

type CardDetailsState = {
  selectedCard: Card | null;
  cardTitle: string;
  cardDescription: string;
  cardDueAt: string;
  cardLabels: Label[];
  projectLabels: Label[];
  newLabelName: string;
  newLabelColor: string;
  cardMembers: CardMember[];
  comments: Comment[];
  newComment: string;
  checklists: Checklist[];
  newChecklistTitle: string;
  newItemByChecklist: Record<string, string>;
  loadingCardDetails: boolean;
  setSelectedCard: (card: Card | null) => void;
  setCardTitle: (value: string) => void;
  setCardDescription: (value: string) => void;
  setCardDueAt: (value: string) => void;
  setCardLabels: (labels: Label[]) => void;
  setProjectLabels: (labels: Label[]) => void;
  setNewLabelName: (value: string) => void;
  setNewLabelColor: (value: string) => void;
  setCardMembers: (members: CardMember[]) => void;
  setComments: (comments: Comment[]) => void;
  setNewComment: (value: string) => void;
  setChecklists: (checklists: Checklist[]) => void;
  setNewChecklistTitle: (value: string) => void;
  setNewItemByChecklist: (items: Record<string, string>) => void;
  setLoadingCardDetails: (value: boolean) => void;
  resetCardDetails: () => void;
};

export const useCardDetailsStore = create<CardDetailsState>((set) => ({
  selectedCard: null,
  cardTitle: "",
  cardDescription: "",
  cardDueAt: "",
  cardLabels: [],
  projectLabels: [],
  newLabelName: "",
  newLabelColor: "green",
  cardMembers: [],
  comments: [],
  newComment: "",
  checklists: [],
  newChecklistTitle: "",
  newItemByChecklist: {},
  loadingCardDetails: false,
  setSelectedCard: (selectedCard) => set({ selectedCard }),
  setCardTitle: (cardTitle) => set({ cardTitle }),
  setCardDescription: (cardDescription) => set({ cardDescription }),
  setCardDueAt: (cardDueAt) => set({ cardDueAt }),
  setCardLabels: (cardLabels) => set({ cardLabels }),
  setProjectLabels: (projectLabels) => set({ projectLabels }),
  setNewLabelName: (newLabelName) => set({ newLabelName }),
  setNewLabelColor: (newLabelColor) => set({ newLabelColor }),
  setCardMembers: (cardMembers) => set({ cardMembers }),
  setComments: (comments) => set({ comments }),
  setNewComment: (newComment) => set({ newComment }),
  setChecklists: (checklists) => set({ checklists }),
  setNewChecklistTitle: (newChecklistTitle) => set({ newChecklistTitle }),
  setNewItemByChecklist: (newItemByChecklist) => set({ newItemByChecklist }),
  setLoadingCardDetails: (loadingCardDetails) => set({ loadingCardDetails }),
  resetCardDetails: () =>
    set({
      selectedCard: null,
      cardTitle: "",
      cardDescription: "",
      cardDueAt: "",
      cardLabels: [],
      cardMembers: [],
      comments: [],
      newComment: "",
      checklists: [],
      newChecklistTitle: "",
      newItemByChecklist: {},
      loadingCardDetails: false
    })
}));
