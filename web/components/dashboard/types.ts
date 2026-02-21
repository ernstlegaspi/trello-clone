import type { FormEvent } from "react";
import type {
  Card,
  CardMember,
  Checklist,
  Comment,
  Label,
  List,
  Organization,
  OrganizationMember,
  Project,
  User
} from "../../lib/types";
import type { CardDragState, DropHint } from "../pages/viewTypes";

export type FeedbackViewModel = {
  errorMessage: string;
  successMessage: string;
};

export type WorkspaceViewModel = {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  selectedOrganizationId: string;
  organizationMembers: OrganizationMember[];
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectId: string;
  newOrganizationName: string;
  inviteEmail: string;
  newProjectName: string;
  setSelectedOrganizationId: (organizationId: string) => void;
  setNewOrganizationName: (value: string) => void;
  setInviteEmail: (value: string) => void;
  setSelectedProjectId: (projectId: string) => void;
  setNewProjectName: (value: string) => void;
  handleCreateOrganization: (event: FormEvent) => void;
  handleInvite: (event: FormEvent) => void;
  handleCreateProject: (event: FormEvent) => void;
};

export type BoardViewModel = {
  lists: List[];
  cardsByList: Record<string, Card[]>;
  loadingBoard: boolean;
  dragState: CardDragState;
  dropHint: DropHint;
  newListName: string;
  newCardByList: Record<string, string>;
  setNewListName: (value: string) => void;
  setNewCardTitleForList: (listId: string, value: string) => void;
  handleCreateList: (event: FormEvent) => void;
  handleCreateCard: (event: FormEvent, listId: string) => void;
  handleDragStart: (cardId: string, fromListId: string) => void;
  handleDragEnd: () => void;
  handleDragOverIndex: (listId: string, index: number) => void;
  handleDropCard: (listId: string, index: number) => void;
};

export type CardDetailsViewModel = {
  selectedCard: Card | null;
  loadingCardDetails: boolean;
  cardTitle: string;
  cardDescription: string;
  cardDueAt: string;
  comments: Comment[];
  newComment: string;
  checklists: Checklist[];
  newChecklistTitle: string;
  newItemByChecklist: Record<string, string>;
  cardLabels: Label[];
  projectLabels: Label[];
  newLabelName: string;
  newLabelColor: string;
  cardMembers: CardMember[];
  setCardTitle: (value: string) => void;
  setCardDescription: (value: string) => void;
  setCardDueAt: (value: string) => void;
  setNewComment: (value: string) => void;
  setNewChecklistTitle: (value: string) => void;
  setNewChecklistItem: (checklistId: string, value: string) => void;
  setNewLabelName: (value: string) => void;
  setNewLabelColor: (value: string) => void;
  openCardModal: (card: Card) => void;
  closeCardModal: () => void;
  handleUpdateCard: (event: FormEvent) => void;
  handleDeleteCard: () => void;
  handleAddComment: (event: FormEvent) => void;
  handleCreateChecklist: (event: FormEvent) => void;
  handleCreateChecklistItem: (event: FormEvent, checklistId: string) => void;
  handleToggleChecklistItem: (
    checklistId: string,
    itemId: string,
    currentValue: boolean
  ) => void;
  handleAttachLabel: (labelId: string) => void;
  handleDetachLabel: (labelId: string) => void;
  handleCreateLabel: (event: FormEvent) => void;
  handleAssignMember: (userId: string) => void;
  handleUnassignMember: (userId: string) => void;
};

export type DashboardProps = {
  user: User;
  onLogout: () => void;
  workspace: WorkspaceViewModel;
  board: BoardViewModel;
  cardDetails: CardDetailsViewModel;
  feedback: FeedbackViewModel;
};
