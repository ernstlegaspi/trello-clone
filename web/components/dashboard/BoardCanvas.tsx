"use client";

import ListColumn from "../board/ListColumn";
import type { DashboardProps } from "./types";

type BoardCanvasProps = Pick<DashboardProps, "workspace" | "board" | "cardDetails">;

export default function BoardCanvas({
  workspace,
  board,
  cardDetails
}: BoardCanvasProps) {
  const sortedLists = [...board.lists].sort((a, b) => a.position - b.position);

  return (
    <div className="list-row">
      {sortedLists.map((list) => (
        <ListColumn
          key={list.id}
          list={list}
          cards={[...(board.cardsByList[list.id] || [])].sort((a, b) => a.position - b.position)}
          dragState={board.dragState}
          dropHint={board.dropHint}
          newCardTitle={board.newCardByList[list.id] || ""}
          onNewCardTitleChange={(value) => board.setNewCardTitleForList(list.id, value)}
          onCreateCard={board.handleCreateCard}
          onOpenCard={cardDetails.openCardModal}
          onDragStart={board.handleDragStart}
          onDragEnd={board.handleDragEnd}
          onDragOverIndex={board.handleDragOverIndex}
          onDropCard={board.handleDropCard}
        />
      ))}

      {workspace.selectedProject ? (
        <article className="panel column" style={{ gridTemplateRows: "1fr" }}>
          <div style={{ padding: 12 }}>
            <strong>Create list</strong>
            <form
              className="stack"
              style={{ marginTop: 8 }}
              onSubmit={board.handleCreateList}
            >
              <input
                className="input"
                placeholder="List name"
                value={board.newListName}
                onChange={(event) => board.setNewListName(event.target.value)}
              />
              <button className="btn primary" type="submit">
                Add list
              </button>
            </form>
          </div>
        </article>
      ) : null}
    </div>
  );
}
