"use client";

import type {
  CardDetailsModalCardViewModel,
  CardDetailsModalWorkspace
} from "./types";

type CardFormSectionProps = Pick<
  CardDetailsModalWorkspace,
  "selectedOrganizationRole"
> &
  Pick<
    CardDetailsModalCardViewModel,
    | "cardTitle"
    | "cardDescription"
    | "cardDueAt"
    | "setCardTitle"
    | "setCardDescription"
    | "setCardDueAt"
    | "handleUpdateCard"
    | "handleDeleteCard"
  >;

export default function CardFormSection({
  selectedOrganizationRole,
  cardTitle,
  cardDescription,
  cardDueAt,
  setCardTitle,
  setCardDescription,
  setCardDueAt,
  handleUpdateCard,
  handleDeleteCard
}: CardFormSectionProps) {
  return (
    <form className="stack" onSubmit={handleUpdateCard}>
      <input
        className="input"
        value={cardTitle}
        onChange={(event) => setCardTitle(event.target.value)}
        placeholder="Title"
      />
      <textarea
        className="textarea"
        value={cardDescription}
        onChange={(event) => setCardDescription(event.target.value)}
        placeholder="Description"
      />
      <input
        className="input"
        type="datetime-local"
        value={cardDueAt}
        onChange={(event) => setCardDueAt(event.target.value)}
      />
      <div className="item-row">
        <button className="btn primary" type="submit">
          Save card
        </button>
        {selectedOrganizationRole === "owner" ? (
          <button className="btn danger" type="button" onClick={handleDeleteCard}>
            Delete card
          </button>
        ) : null}
      </div>
    </form>
  );
}
