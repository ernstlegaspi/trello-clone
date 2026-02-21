"use client";

import AssigneesSection from "./cardDetails/AssigneesSection";
import CardFormSection from "./cardDetails/CardFormSection";
import ChecklistsSection from "./cardDetails/ChecklistsSection";
import CommentsSection from "./cardDetails/CommentsSection";
import LabelsSection from "./cardDetails/LabelsSection";
import type { CardDetailsModalProps } from "./cardDetails/types";

export default function CardDetailsModal({
  workspace,
  cardDetails,
}: CardDetailsModalProps) {
  if (!cardDetails.selectedCard) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={cardDetails.closeCardModal}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <strong>Card details</strong>
          <button className="btn" onClick={cardDetails.closeCardModal}>
            Close
          </button>
        </div>
        <div className="modal-body">
          <section className="stack">
            <CardFormSection
              selectedOrganizationRole={workspace.selectedOrganizationRole}
              cardTitle={cardDetails.cardTitle}
              cardDescription={cardDetails.cardDescription}
              cardDueAt={cardDetails.cardDueAt}
              setCardTitle={cardDetails.setCardTitle}
              setCardDescription={cardDetails.setCardDescription}
              setCardDueAt={cardDetails.setCardDueAt}
              handleUpdateCard={cardDetails.handleUpdateCard}
              handleDeleteCard={cardDetails.handleDeleteCard}
            />
            <CommentsSection
              comments={cardDetails.comments}
              newComment={cardDetails.newComment}
              setNewComment={cardDetails.setNewComment}
              handleAddComment={cardDetails.handleAddComment}
            />
            <ChecklistsSection
              checklists={cardDetails.checklists}
              newChecklistTitle={cardDetails.newChecklistTitle}
              newItemByChecklist={cardDetails.newItemByChecklist}
              setNewChecklistTitle={cardDetails.setNewChecklistTitle}
              handleCreateChecklist={cardDetails.handleCreateChecklist}
              setNewChecklistItem={cardDetails.setNewChecklistItem}
              handleCreateChecklistItem={cardDetails.handleCreateChecklistItem}
              handleToggleChecklistItem={cardDetails.handleToggleChecklistItem}
            />
          </section>

          <aside className="stack">
            {cardDetails.loadingCardDetails ? (
              <div className="badge">Loading details...</div>
            ) : null}
            <LabelsSection
              selectedOrganizationRole={workspace.selectedOrganizationRole}
              cardLabels={cardDetails.cardLabels}
              projectLabels={cardDetails.projectLabels}
              newLabelName={cardDetails.newLabelName}
              newLabelColor={cardDetails.newLabelColor}
              handleAttachLabel={cardDetails.handleAttachLabel}
              handleDetachLabel={cardDetails.handleDetachLabel}
              setNewLabelName={cardDetails.setNewLabelName}
              setNewLabelColor={cardDetails.setNewLabelColor}
              handleCreateLabel={cardDetails.handleCreateLabel}
            />
            <AssigneesSection
              organizationMembers={workspace.organizationMembers}
              cardMembers={cardDetails.cardMembers}
              handleAssignMember={cardDetails.handleAssignMember}
              handleUnassignMember={cardDetails.handleUnassignMember}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
