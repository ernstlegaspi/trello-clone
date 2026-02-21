"use client";

import type {
  CardDetailsModalCardViewModel,
  CardDetailsModalWorkspace
} from "./types";

type LabelsSectionProps = Pick<
  CardDetailsModalWorkspace,
  "selectedOrganizationRole"
> &
  Pick<
    CardDetailsModalCardViewModel,
    | "cardLabels"
    | "projectLabels"
    | "newLabelName"
    | "newLabelColor"
    | "handleAttachLabel"
    | "handleDetachLabel"
    | "setNewLabelName"
    | "setNewLabelColor"
    | "handleCreateLabel"
  >;

export default function LabelsSection({
  selectedOrganizationRole,
  cardLabels,
  projectLabels,
  newLabelName,
  newLabelColor,
  handleAttachLabel,
  handleDetachLabel,
  setNewLabelName,
  setNewLabelColor,
  handleCreateLabel
}: LabelsSectionProps) {
  return (
    <section>
      <h3 style={{ margin: "0 0 8px 0" }}>Labels on card</h3>
      <div style={{ marginBottom: 10 }}>
        {cardLabels.map((label) => (
          <button
            key={label.id}
            className="label-chip"
            style={{ background: label.color }}
            onClick={() => handleDetachLabel(label.id)}
            type="button"
          >
            {label.name} x
          </button>
        ))}
        {cardLabels.length === 0 ? <span className="muted">No labels attached</span> : null}
      </div>

      <div className="stack">
        {projectLabels.map((label) => {
          const attached = cardLabels.some((item) => item.id === label.id);
          return (
            <button
              key={label.id}
              className="btn"
              style={{
                justifyContent: "space-between",
                display: "flex",
                borderColor: attached ? label.color : undefined
              }}
              onClick={() =>
                attached
                  ? handleDetachLabel(label.id)
                  : handleAttachLabel(label.id)
              }
              type="button"
            >
              <span>{label.name}</span>
              <span className="badge" style={{ background: label.color, color: "#fff" }}>
                {attached ? "Attached" : "Attach"}
              </span>
            </button>
          );
        })}
      </div>

      {selectedOrganizationRole === "owner" ? (
        <form className="stack" style={{ marginTop: 10 }} onSubmit={handleCreateLabel}>
          <input
            className="input"
            placeholder="New label name"
            value={newLabelName}
            onChange={(event) => setNewLabelName(event.target.value)}
          />
          <input
            className="input"
            placeholder="Color (e.g. red, #2563eb)"
            value={newLabelColor}
            onChange={(event) => setNewLabelColor(event.target.value)}
          />
          <button className="btn" type="submit">
            Create label
          </button>
        </form>
      ) : null}
    </section>
  );
}
