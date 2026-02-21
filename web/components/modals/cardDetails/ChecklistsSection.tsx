"use client";

import type { CardDetailsModalCardViewModel } from "./types";

type ChecklistsSectionProps = Pick<
  CardDetailsModalCardViewModel,
  | "checklists"
  | "newChecklistTitle"
  | "newItemByChecklist"
  | "setNewChecklistTitle"
  | "handleCreateChecklist"
  | "setNewChecklistItem"
  | "handleCreateChecklistItem"
  | "handleToggleChecklistItem"
>;

export default function ChecklistsSection({
  checklists,
  newChecklistTitle,
  newItemByChecklist,
  setNewChecklistTitle,
  handleCreateChecklist,
  setNewChecklistItem,
  handleCreateChecklistItem,
  handleToggleChecklistItem
}: ChecklistsSectionProps) {
  return (
    <section className="stack">
      <h3 style={{ margin: "8px 0 0 0" }}>Checklists</h3>
      <form className="inline-form" onSubmit={handleCreateChecklist}>
        <input
          className="input"
          placeholder="Checklist title"
          value={newChecklistTitle}
          onChange={(event) => setNewChecklistTitle(event.target.value)}
        />
        <button className="btn primary" type="submit">
          Add
        </button>
      </form>

      {checklists.map((checklist) => (
        <div key={checklist.id} className="panel" style={{ padding: 10 }}>
          <div className="item-row" style={{ justifyContent: "space-between" }}>
            <strong>{checklist.title}</strong>
            <span className="badge">
              {checklist.progress.completed}/{checklist.progress.total}
            </span>
          </div>

          <div className="stack">
            {checklist.items.map((item) => (
              <label key={item.id} className="item-row">
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={() =>
                    handleToggleChecklistItem(checklist.id, item.id, item.isCompleted)
                  }
                />
                <span
                  style={{
                    textDecoration: item.isCompleted ? "line-through" : "none"
                  }}
                >
                  {item.content}
                </span>
              </label>
            ))}
          </div>

          <form
            className="inline-form"
            style={{ marginTop: 8 }}
            onSubmit={(event) => handleCreateChecklistItem(event, checklist.id)}
          >
            <input
              className="input"
              placeholder="New checklist item"
              value={newItemByChecklist[checklist.id] || ""}
              onChange={(event) =>
                setNewChecklistItem(checklist.id, event.target.value)
              }
            />
            <button className="btn" type="submit">
              Add
            </button>
          </form>
        </div>
      ))}
    </section>
  );
}
