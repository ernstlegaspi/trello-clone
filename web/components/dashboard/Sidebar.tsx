"use client";

import type { DashboardProps } from "./types";

type SidebarProps = Pick<DashboardProps, "workspace">;

export default function Sidebar({ workspace }: SidebarProps) {
  const organizationOwnersOnly = workspace.selectedOrganization?.membershipRole === "owner";

  return (
    <aside className="sidebar">
      <section className="section">
        <h3>Organizations</h3>
        {workspace.organizations.length > 0 ? (
          <select
            className="select"
            value={workspace.selectedOrganizationId}
            onChange={(event) => workspace.setSelectedOrganizationId(event.target.value)}
          >
            {workspace.organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name} ({organization.membershipRole})
              </option>
            ))}
          </select>
        ) : (
          <div className="muted">No organizations yet.</div>
        )}

        <form
          className="inline-form"
          style={{ marginTop: 8 }}
          onSubmit={workspace.handleCreateOrganization}
        >
          <input
            className="input"
            placeholder="New organization"
            value={workspace.newOrganizationName}
            onChange={(event) => workspace.setNewOrganizationName(event.target.value)}
          />
          <button className="btn primary" type="submit">
            Add
          </button>
        </form>
      </section>

      {workspace.selectedOrganization ? (
        <>
          <section className="section">
            <h3>Selected Organization</h3>
            <div className="item-row" style={{ justifyContent: "space-between" }}>
              <strong>{workspace.selectedOrganization.name}</strong>
              <span className="badge">{workspace.selectedOrganization.membershipRole}</span>
            </div>
          </section>

          <section className="section">
            <h3>Members</h3>
            <div className="stack">
              {workspace.organizationMembers.map((member) => (
                <div key={member.userId} className="item-row">
                  <span className="badge">{member.role}</span>
                  <span>{member.name}</span>
                </div>
              ))}
            </div>
          </section>

          {organizationOwnersOnly ? (
            <section className="section">
              <h3>Invite</h3>
              <form className="inline-form" onSubmit={workspace.handleInvite}>
                <input
                  className="input"
                  type="email"
                  placeholder="email@example.com"
                  value={workspace.inviteEmail}
                  onChange={(event) => workspace.setInviteEmail(event.target.value)}
                />
                <button className="btn primary" type="submit">
                  Send
                </button>
              </form>
            </section>
          ) : null}

          <section className="section">
            <h3>Projects</h3>
            <div className="stack">
              {workspace.projects.map((project) => (
                <button
                  key={project.id}
                  className={`item-button ${project.id === workspace.selectedProjectId ? "active" : ""}`}
                  onClick={() => workspace.setSelectedProjectId(project.id)}
                >
                  {project.name}
                </button>
              ))}
            </div>
            {organizationOwnersOnly ? (
              <form
                className="inline-form"
                style={{ marginTop: 8 }}
                onSubmit={workspace.handleCreateProject}
              >
                <input
                  className="input"
                  placeholder="New project"
                  value={workspace.newProjectName}
                  onChange={(event) => workspace.setNewProjectName(event.target.value)}
                />
                <button className="btn primary" type="submit">
                  Add
                </button>
              </form>
            ) : null}
          </section>
        </>
      ) : (
        <section className="section">
          <div className="muted">Select an organization to see members, invite, and projects.</div>
        </section>
      )}
    </aside>
  );
}
