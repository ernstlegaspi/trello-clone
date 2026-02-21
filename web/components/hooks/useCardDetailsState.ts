"use client";

import { FormEvent, useCallback, useEffect } from "react";
import {
  cardApi,
  cardMemberApi,
  checklistApi,
  commentApi,
  labelApi
} from "../../lib/api";
import type { Card } from "../../lib/types";
import { useCardDetailsStore } from "../../stores/cardDetailsStore";

type UseCardDetailsStateParams = {
  selectedProjectId: string;
  clearFeedback: () => void;
  setError: (error: unknown) => void;
  setSuccess: (message: string) => void;
  refreshProjectBoard: (projectId: string) => Promise<void>;
};

const toLocalDatetimeInput = (iso: string | null) => {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoOrNull = (input: string) => {
  if (!input.trim()) {
    return null;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

export default function useCardDetailsState({
  selectedProjectId,
  clearFeedback,
  setError,
  setSuccess,
  refreshProjectBoard
}: UseCardDetailsStateParams) {
  const selectedCard = useCardDetailsStore((state) => state.selectedCard);
  const cardTitle = useCardDetailsStore((state) => state.cardTitle);
  const cardDescription = useCardDetailsStore((state) => state.cardDescription);
  const cardDueAt = useCardDetailsStore((state) => state.cardDueAt);
  const cardLabels = useCardDetailsStore((state) => state.cardLabels);
  const projectLabels = useCardDetailsStore((state) => state.projectLabels);
  const newLabelName = useCardDetailsStore((state) => state.newLabelName);
  const newLabelColor = useCardDetailsStore((state) => state.newLabelColor);
  const cardMembers = useCardDetailsStore((state) => state.cardMembers);
  const comments = useCardDetailsStore((state) => state.comments);
  const newComment = useCardDetailsStore((state) => state.newComment);
  const checklists = useCardDetailsStore((state) => state.checklists);
  const newChecklistTitle = useCardDetailsStore((state) => state.newChecklistTitle);
  const newItemByChecklist = useCardDetailsStore((state) => state.newItemByChecklist);
  const loadingCardDetails = useCardDetailsStore((state) => state.loadingCardDetails);

  const setSelectedCard = useCardDetailsStore((state) => state.setSelectedCard);
  const setCardTitle = useCardDetailsStore((state) => state.setCardTitle);
  const setCardDescription = useCardDetailsStore((state) => state.setCardDescription);
  const setCardDueAt = useCardDetailsStore((state) => state.setCardDueAt);
  const setCardLabels = useCardDetailsStore((state) => state.setCardLabels);
  const setProjectLabels = useCardDetailsStore((state) => state.setProjectLabels);
  const setNewLabelName = useCardDetailsStore((state) => state.setNewLabelName);
  const setNewLabelColor = useCardDetailsStore((state) => state.setNewLabelColor);
  const setCardMembers = useCardDetailsStore((state) => state.setCardMembers);
  const setComments = useCardDetailsStore((state) => state.setComments);
  const setNewComment = useCardDetailsStore((state) => state.setNewComment);
  const setChecklists = useCardDetailsStore((state) => state.setChecklists);
  const setNewChecklistTitle = useCardDetailsStore((state) => state.setNewChecklistTitle);
  const setNewItemByChecklist = useCardDetailsStore((state) => state.setNewItemByChecklist);
  const setLoadingCardDetails = useCardDetailsStore(
    (state) => state.setLoadingCardDetails
  );
  const resetCardDetails = useCardDetailsStore((state) => state.resetCardDetails);

  const closeCardModal = useCallback(() => {
    resetCardDetails();
    clearFeedback();
  }, [clearFeedback, resetCardDetails]);

  const loadCardDetails = useCallback(
    async (card: Card) => {
      if (!selectedProjectId) {
        return;
      }
      setLoadingCardDetails(true);
      try {
        const [labels, members, cardComments, cardChecklists] = await Promise.all([
          labelApi.card(selectedProjectId, card.id),
          cardMemberApi.list(selectedProjectId, card.id),
          commentApi.list(selectedProjectId, card.id),
          checklistApi.list(selectedProjectId, card.id)
        ]);
        setCardLabels(labels);
        setCardMembers(members);
        setComments(cardComments);
        setChecklists(cardChecklists);
      } catch (error) {
        setError(error);
      } finally {
        setLoadingCardDetails(false);
      }
    },
    [selectedProjectId, setError]
  );

  const openCardModal = useCallback(
    async (card: Card) => {
      clearFeedback();
      setSelectedCard(card);
      setCardTitle(card.title);
      setCardDescription(card.description || "");
      setCardDueAt(toLocalDatetimeInput(card.dueAt));
      await loadCardDetails(card);
    },
    [clearFeedback, loadCardDetails]
  );

  useEffect(() => {
    resetCardDetails();

    if (!selectedProjectId) {
      setProjectLabels([]);
      return;
    }

    let alive = true;
    const load = async () => {
      try {
        const labels = await labelApi.project(selectedProjectId);
        if (alive) {
          setProjectLabels(labels);
        }
      } catch (error) {
        if (alive) {
          setError(error);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [selectedProjectId, setError]);

  const handleUpdateCard = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedCard || !selectedProjectId) {
        return;
      }
      clearFeedback();
      try {
        const updatedCard = await cardApi.update(selectedProjectId, selectedCard.id, {
          title: cardTitle.trim(),
          description: cardDescription.trim() || null,
          dueAt: toIsoOrNull(cardDueAt)
        });
        setSelectedCard(updatedCard);
        await refreshProjectBoard(selectedProjectId);
        setSuccess("Card updated.");
      } catch (error) {
        setError(error);
      }
    },
    [
      cardDescription,
      cardDueAt,
      cardTitle,
      clearFeedback,
      refreshProjectBoard,
      selectedCard,
      selectedProjectId,
      setError,
      setSuccess
    ]
  );

  const handleDeleteCard = useCallback(async () => {
    if (!selectedCard || !selectedProjectId) {
      return;
    }
    clearFeedback();
    try {
      await cardApi.remove(selectedProjectId, selectedCard.id);
      closeCardModal();
      await refreshProjectBoard(selectedProjectId);
      setSuccess("Card deleted.");
    } catch (error) {
      setError(error);
    }
  }, [
    clearFeedback,
    closeCardModal,
    refreshProjectBoard,
    selectedCard,
    selectedProjectId,
    setError,
    setSuccess
  ]);

  const handleCreateLabel = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedProjectId || !newLabelName.trim()) {
        return;
      }
      clearFeedback();
      try {
        await labelApi.create(selectedProjectId, {
          name: newLabelName.trim(),
          color: newLabelColor.trim()
        });
        setNewLabelName("");
        const labels = await labelApi.project(selectedProjectId);
        setProjectLabels(labels);
        setSuccess("Label created.");
      } catch (error) {
        setError(error);
      }
    },
    [
      clearFeedback,
      newLabelColor,
      newLabelName,
      selectedProjectId,
      setError,
      setSuccess
    ]
  );

  const handleAttachLabel = useCallback(
    async (labelId: string) => {
      if (!selectedCard || !selectedProjectId) {
        return;
      }
      clearFeedback();
      try {
        await labelApi.attach(selectedProjectId, selectedCard.id, labelId);
        const labels = await labelApi.card(selectedProjectId, selectedCard.id);
        setCardLabels(labels);
      } catch (error) {
        setError(error);
      }
    },
    [clearFeedback, selectedCard, selectedProjectId, setError]
  );

  const handleDetachLabel = useCallback(
    async (labelId: string) => {
      if (!selectedCard || !selectedProjectId) {
        return;
      }
      clearFeedback();
      try {
        await labelApi.detach(selectedProjectId, selectedCard.id, labelId);
        const labels = await labelApi.card(selectedProjectId, selectedCard.id);
        setCardLabels(labels);
      } catch (error) {
        setError(error);
      }
    },
    [clearFeedback, selectedCard, selectedProjectId, setError]
  );

  const handleAssignMember = useCallback(
    async (memberUserId: string) => {
      if (!selectedCard || !selectedProjectId) {
        return;
      }
      clearFeedback();
      try {
        await cardMemberApi.assign(selectedProjectId, selectedCard.id, memberUserId);
        const members = await cardMemberApi.list(selectedProjectId, selectedCard.id);
        setCardMembers(members);
      } catch (error) {
        setError(error);
      }
    },
    [clearFeedback, selectedCard, selectedProjectId, setError]
  );

  const handleUnassignMember = useCallback(
    async (memberUserId: string) => {
      if (!selectedCard || !selectedProjectId) {
        return;
      }
      clearFeedback();
      try {
        await cardMemberApi.unassign(selectedProjectId, selectedCard.id, memberUserId);
        const members = await cardMemberApi.list(selectedProjectId, selectedCard.id);
        setCardMembers(members);
      } catch (error) {
        setError(error);
      }
    },
    [clearFeedback, selectedCard, selectedProjectId, setError]
  );

  const handleAddComment = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedCard || !selectedProjectId || !newComment.trim()) {
        return;
      }
      clearFeedback();
      try {
        await commentApi.create(selectedProjectId, selectedCard.id, newComment.trim());
        setNewComment("");
        const nextComments = await commentApi.list(selectedProjectId, selectedCard.id);
        setComments(nextComments);
      } catch (error) {
        setError(error);
      }
    },
    [clearFeedback, newComment, selectedCard, selectedProjectId, setError]
  );

  const handleCreateChecklist = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedCard || !selectedProjectId || !newChecklistTitle.trim()) {
        return;
      }
      clearFeedback();
      try {
        await checklistApi.create(selectedProjectId, selectedCard.id, newChecklistTitle.trim());
        setNewChecklistTitle("");
        const nextChecklists = await checklistApi.list(selectedProjectId, selectedCard.id);
        setChecklists(nextChecklists);
      } catch (error) {
        setError(error);
      }
    },
    [clearFeedback, newChecklistTitle, selectedCard, selectedProjectId, setError]
  );

  const handleCreateChecklistItem = useCallback(
    async (event: FormEvent, checklistId: string) => {
      event.preventDefault();
      if (!selectedCard || !selectedProjectId) {
        return;
      }
      const content = (newItemByChecklist[checklistId] || "").trim();
      if (!content) {
        return;
      }
      clearFeedback();
      try {
        await checklistApi.createItem(
          selectedProjectId,
          selectedCard.id,
          checklistId,
          content
        );
        const currentItems = useCardDetailsStore.getState().newItemByChecklist;
        setNewItemByChecklist({ ...currentItems, [checklistId]: "" });
        const nextChecklists = await checklistApi.list(selectedProjectId, selectedCard.id);
        setChecklists(nextChecklists);
      } catch (error) {
        setError(error);
      }
    },
    [
      clearFeedback,
      newItemByChecklist,
      selectedCard,
      selectedProjectId,
      setChecklists,
      setError,
      setNewItemByChecklist
    ]
  );

  const handleToggleChecklistItem = useCallback(
    async (checklistId: string, itemId: string, currentValue: boolean) => {
      if (!selectedCard || !selectedProjectId) {
        return;
      }
      clearFeedback();
      try {
        await checklistApi.updateItem(
          selectedProjectId,
          selectedCard.id,
          checklistId,
          itemId,
          { isCompleted: !currentValue }
        );
        const nextChecklists = await checklistApi.list(selectedProjectId, selectedCard.id);
        setChecklists(nextChecklists);
      } catch (error) {
        setError(error);
      }
    },
    [clearFeedback, selectedCard, selectedProjectId, setError]
  );

  const setNewChecklistItem = useCallback((checklistId: string, value: string) => {
    const currentItems = useCardDetailsStore.getState().newItemByChecklist;
    setNewItemByChecklist({ ...currentItems, [checklistId]: value });
  }, [setNewItemByChecklist]);

  return {
    selectedCard,
    cardTitle,
    cardDescription,
    cardDueAt,
    cardLabels,
    projectLabels,
    newLabelName,
    newLabelColor,
    cardMembers,
    comments,
    newComment,
    checklists,
    newChecklistTitle,
    newItemByChecklist,
    loadingCardDetails,
    setCardTitle,
    setCardDescription,
    setCardDueAt,
    setNewLabelName,
    setNewLabelColor,
    setNewComment,
    setNewChecklistTitle,
    setNewChecklistItem,
    openCardModal,
    closeCardModal,
    handleUpdateCard,
    handleDeleteCard,
    handleCreateLabel,
    handleAttachLabel,
    handleDetachLabel,
    handleAssignMember,
    handleUnassignMember,
    handleAddComment,
    handleCreateChecklist,
    handleCreateChecklistItem,
    handleToggleChecklistItem,
    resetCardDetails
  };
}
