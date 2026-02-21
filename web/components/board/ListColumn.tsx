"use client";

import type { FormEvent } from "react";
import type { Card, List } from "../../lib/types";
import type { CardDragState, DropHint } from "../pages/viewTypes";

type ListColumnProps = {
  list: List;
  cards: Card[];
  dragState: CardDragState;
  dropHint: DropHint;
  newCardTitle: string;
  onNewCardTitleChange: (value: string) => void;
  onCreateCard: (event: FormEvent, listId: string) => void;
  onOpenCard: (card: Card) => void;
  onDragStart: (cardId: string, fromListId: string) => void;
  onDragEnd: () => void;
  onDragOverIndex: (listId: string, index: number) => void;
  onDropCard: (listId: string, index: number) => void;
};

const formatDateTime = (iso: string | null) => {
  if (!iso) {
    return "";
  }
  return new Date(iso).toLocaleString();
};

export default function ListColumn({
  list,
  cards,
  dragState,
  dropHint,
  newCardTitle,
  onNewCardTitleChange,
  onCreateCard,
  onOpenCard,
  onDragStart,
  onDragEnd,
  onDragOverIndex,
  onDropCard
}: ListColumnProps) {
  return (
    <article className="panel column">
      <div className="column-head">
        <strong>{list.name}</strong>
        <span className="badge">{cards.length}</span>
      </div>

      <div
        className="column-body"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          onDropCard(list.id, cards.length);
        }}
      >
        {cards.map((card, index) => {
          const isDragging = dragState?.cardId === card.id;
          const showDropTarget =
            dropHint?.listId === list.id && dropHint.index === index;
          return (
            <div key={card.id}>
              {showDropTarget ? (
                <div
                  className="drop-target"
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDropCard(list.id, index);
                  }}
                />
              ) : null}
              <div
                draggable
                className={`card ${isDragging ? "dragging" : ""}`}
                onClick={() => onOpenCard(card)}
                onDragStart={() => onDragStart(card.id, list.id)}
                onDragEnd={onDragEnd}
                onDragOver={(event) => {
                  event.preventDefault();
                  onDragOverIndex(list.id, index);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDropCard(list.id, index);
                }}
              >
                <div style={{ marginBottom: 6 }}>{card.title}</div>
                {card.dueAt ? (
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    Due: {formatDateTime(card.dueAt)}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {dropHint?.listId === list.id && dropHint.index === cards.length ? (
          <div
            className="drop-target"
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDropCard(list.id, cards.length);
            }}
          />
        ) : null}
      </div>

      <div className="column-foot">
        <form onSubmit={(event) => onCreateCard(event, list.id)}>
          <div className="inline-form">
            <input
              className="input"
              placeholder="New card title"
              value={newCardTitle}
              onChange={(event) => onNewCardTitleChange(event.target.value)}
            />
            <button className="btn primary" type="submit">
              Add
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}
