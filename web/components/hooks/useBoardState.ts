"use client";

import { FormEvent, useCallback, useEffect } from "react";
import { boardApi, cardApi, listApi } from "../../lib/api";
import type { Card, User } from "../../lib/types";
import { useBoardStore } from "../../stores/boardStore";

type UseBoardStateParams = {
  user: User | null;
  selectedProjectId: string;
  clearFeedback: () => void;
  setError: (error: unknown) => void;
  setSuccess: (message: string) => void;
};

const moveCardInState = (
  current: Record<string, Card[]>,
  cardId: string,
  fromListId: string,
  toListId: string,
  targetIndex: number
) => {
  const next: Record<string, Card[]> = {};
  Object.entries(current).forEach(([key, value]) => {
    next[key] = [...value];
  });

  const source = next[fromListId] || [];
  const sourceIndex = source.findIndex((card) => card.id === cardId);
  if (sourceIndex < 0) {
    return current;
  }

  const [card] = source.splice(sourceIndex, 1);
  const movedCard = {
    ...card,
    listId: toListId
  };

  const target = next[toListId] || [];
  const boundedIndex = Math.max(0, Math.min(target.length, targetIndex));
  target.splice(boundedIndex, 0, movedCard);

  next[fromListId] = source.map((item, index) => ({
    ...item,
    position: index + 1
  }));
  next[toListId] = target.map((item, index) => ({
    ...item,
    position: index + 1
  }));

  return next;
};

export default function useBoardState({
  user,
  selectedProjectId,
  clearFeedback,
  setError,
  setSuccess
}: UseBoardStateParams) {
  const lists = useBoardStore((state) => state.lists);
  const cardsByList = useBoardStore((state) => state.cardsByList);
  const newListName = useBoardStore((state) => state.newListName);
  const newCardByList = useBoardStore((state) => state.newCardByList);
  const loadingBoard = useBoardStore((state) => state.loadingBoard);
  const dragState = useBoardStore((state) => state.dragState);
  const dropHint = useBoardStore((state) => state.dropHint);
  const setLists = useBoardStore((state) => state.setLists);
  const setCardsByList = useBoardStore((state) => state.setCardsByList);
  const setNewListName = useBoardStore((state) => state.setNewListName);
  const setNewCardByList = useBoardStore((state) => state.setNewCardByList);
  const setLoadingBoard = useBoardStore((state) => state.setLoadingBoard);
  const setDragState = useBoardStore((state) => state.setDragState);
  const setDropHint = useBoardStore((state) => state.setDropHint);
  const resetBoard = useBoardStore((state) => state.resetBoard);

  const refreshProjectBoard = useCallback(async (projectId: string) => {
    setLoadingBoard(true);
    try {
      const board = await boardApi.load(projectId);
      setLists(board.lists);
      setCardsByList(board.cardsByList);
    } finally {
      setLoadingBoard(false);
    }
  }, [setCardsByList, setLists, setLoadingBoard]);

  useEffect(() => {
    if (!user || !selectedProjectId) {
      setLists([]);
      setCardsByList({});
      setDragState(null);
      setDropHint(null);
      return;
    }

    let alive = true;
    const load = async () => {
      setLoadingBoard(true);
      try {
        const board = await boardApi.load(selectedProjectId);
        if (!alive) {
          return;
        }
        setLists(board.lists);
        setCardsByList(board.cardsByList);
      } catch (error) {
        if (alive) {
          setError(error);
        }
      } finally {
        if (alive) {
          setLoadingBoard(false);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [
    selectedProjectId,
    setCardsByList,
    setDropHint,
    setDragState,
    setError,
    setLists,
    setLoadingBoard,
    user
  ]);

  const handleCreateList = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedProjectId || !newListName.trim()) {
        return;
      }
      clearFeedback();
      try {
        await listApi.create(selectedProjectId, newListName.trim());
        setNewListName("");
        await refreshProjectBoard(selectedProjectId);
        setSuccess("List created.");
      } catch (error) {
        setError(error);
      }
    },
    [
      clearFeedback,
      newListName,
      refreshProjectBoard,
      selectedProjectId,
      setError,
      setNewListName,
      setSuccess
    ]
  );

  const handleCreateCard = useCallback(
    async (event: FormEvent, listId: string) => {
      event.preventDefault();
      const title = (newCardByList[listId] || "").trim();
      if (!title) {
        return;
      }
      clearFeedback();
      try {
        await cardApi.create(listId, { title });
        const currentCardsByList = useBoardStore.getState().newCardByList;
        setNewCardByList({ ...currentCardsByList, [listId]: "" });
        if (selectedProjectId) {
          await refreshProjectBoard(selectedProjectId);
        }
        setSuccess("Card created.");
      } catch (error) {
        setError(error);
      }
    },
    [
      clearFeedback,
      newCardByList,
      refreshProjectBoard,
      selectedProjectId,
      setError,
      setNewCardByList,
      setSuccess
    ]
  );

  const handleDragStart = useCallback((cardId: string, fromListId: string) => {
    setDragState({ cardId, fromListId });
  }, [setDragState]);

  const handleDragEnd = useCallback(() => {
    setDragState(null);
    setDropHint(null);
  }, [setDragState, setDropHint]);

  const handleDragOverIndex = useCallback(
    (listId: string, index: number) => {
      if (!dropHint || dropHint.listId !== listId || dropHint.index !== index) {
        setDropHint({ listId, index });
      }
    },
    [dropHint, setDropHint]
  );

  const handleDropCard = useCallback(
    async (listId: string, index: number) => {
      if (!dragState || !selectedProjectId) {
        return;
      }
      const { cardId, fromListId } = dragState;
      setDropHint(null);
      setDragState(null);

      const sourceCards = cardsByList[fromListId] || [];
      const sourceIndex = sourceCards.findIndex((card) => card.id === cardId);
      if (sourceIndex < 0) {
        return;
      }

      if (fromListId === listId) {
        const boundedIndex = Math.max(0, Math.min(sourceCards.length - 1, index));
        if (boundedIndex === sourceIndex) {
          return;
        }
      }

      const before = cardsByList;
      const optimistic = moveCardInState(before, cardId, fromListId, listId, index);
      setCardsByList(optimistic);

      try {
        await cardApi.move(selectedProjectId, cardId, {
          targetListId: listId,
          targetPosition: index + 1
        });
        await refreshProjectBoard(selectedProjectId);
      } catch (error) {
        setCardsByList(before);
        setError(error);
      }
    },
    [
      cardsByList,
      dragState,
      refreshProjectBoard,
      selectedProjectId,
      setCardsByList,
      setDropHint,
      setDragState,
      setError
    ]
  );

  const setNewCardTitleForList = useCallback((listId: string, value: string) => {
    const currentCardsByList = useBoardStore.getState().newCardByList;
    setNewCardByList({ ...currentCardsByList, [listId]: value });
  }, [setNewCardByList]);

  return {
    lists,
    cardsByList,
    newListName,
    newCardByList,
    loadingBoard,
    dragState,
    dropHint,
    setNewListName,
    setNewCardTitleForList,
    refreshProjectBoard,
    handleCreateList,
    handleCreateCard,
    handleDragStart,
    handleDragEnd,
    handleDragOverIndex,
    handleDropCard,
    resetBoard
  };
}
