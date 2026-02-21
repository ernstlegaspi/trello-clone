"use client";

import type { DashboardProps } from "./types";

type BoardToolbarProps = Pick<DashboardProps, "workspace" | "board" | "feedback">;

export default function BoardToolbar({
  workspace,
  board,
  feedback
}: BoardToolbarProps) {
  return (
    <div className="board-toolbar">
      <strong>{workspace.selectedProject?.name || "No selected project"}</strong>
      {workspace.selectedOrganization ? (
        <span className="muted">Organization: {workspace.selectedOrganization.name}</span>
      ) : null}
      {board.loadingBoard ? <span className="badge">Loading board...</span> : null}
      {feedback.errorMessage ? (
        <span className="error-box">{feedback.errorMessage}</span>
      ) : null}
      {feedback.successMessage ? <span className="badge">{feedback.successMessage}</span> : null}
    </div>
  );
}
