"use client";

import CardDetailsModal from "../modals/CardDetailsModal";
import BoardCanvas from "../dashboard/BoardCanvas";
import BoardToolbar from "../dashboard/BoardToolbar";
import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";
import type { DashboardProps } from "../dashboard/types";

export default function Dashboard({
  user,
  onLogout,
  workspace,
  board,
  cardDetails,
  feedback,
}: DashboardProps) {
  return (
    <main className="app-shell">
      <Topbar user={user} onLogout={onLogout} />

      <div className="main-grid">
        <Sidebar workspace={workspace} />

        <section className="board-area">
          <BoardToolbar
            workspace={workspace}
            board={board}
            feedback={feedback}
          />
          <BoardCanvas
            workspace={workspace}
            board={board}
            cardDetails={cardDetails}
          />
        </section>
      </div>

      <CardDetailsModal
        workspace={{
          selectedOrganizationRole: workspace.selectedOrganization?.membershipRole,
          organizationMembers: workspace.organizationMembers,
        }}
        cardDetails={cardDetails}
      />
    </main>
  );
}
