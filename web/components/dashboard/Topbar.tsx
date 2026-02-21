"use client";

import type { DashboardProps } from "./types";

type TopbarProps = Pick<DashboardProps, "user" | "onLogout">;

export default function Topbar({ user, onLogout }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand">Trello Clone</div>
      <div className="item-row">
        <span className="muted">{user.email}</span>
        <button className="btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
