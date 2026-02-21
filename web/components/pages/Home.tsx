"use client";

import Auth from "./Auth";
import Dashboard from "./Dashboard";
import useAuthState from "../hooks/useAuthState";
import useBoardState from "../hooks/useBoardState";
import useCardDetailsState from "../hooks/useCardDetailsState";
import useFeedback from "../hooks/useFeedback";
import useWorkspaceState from "../hooks/useWorkspaceState";

export default function Home() {
  const feedback = useFeedback();
  const auth = useAuthState(feedback);
  const workspace = useWorkspaceState({
    user: auth.user,
    ...feedback
  });
  const board = useBoardState({
    user: auth.user,
    selectedProjectId: workspace.selectedProjectId,
    ...feedback
  });
  const cardDetails = useCardDetailsState({
    selectedProjectId: workspace.selectedProjectId,
    refreshProjectBoard: board.refreshProjectBoard,
    ...feedback
  });

  const handleLogout = async () => {
    await auth.handleLogout();
    workspace.resetWorkspace();
    board.resetBoard();
    cardDetails.resetCardDetails();
  };

  if (auth.authLoading) {
    return (
      <main className="auth-wrap">
        <div className="panel auth-card">Loading...</div>
      </main>
    );
  }

  if (!auth.user) {
    return (
      <Auth
        authMode={auth.authMode}
        authName={auth.authName}
        authEmail={auth.authEmail}
        authPassword={auth.authPassword}
        errorMessage={feedback.errorMessage}
        successMessage={feedback.successMessage}
        onAuthNameChange={auth.setAuthName}
        onAuthEmailChange={auth.setAuthEmail}
        onAuthPasswordChange={auth.setAuthPassword}
        onAuthModeChange={auth.setAuthMode}
        onSubmit={auth.handleAuthSubmit}
      />
    );
  }

  return (
    <Dashboard
      user={auth.user}
      onLogout={handleLogout}
      workspace={workspace}
      board={board}
      cardDetails={cardDetails}
      feedback={feedback}
    />
  );
}
