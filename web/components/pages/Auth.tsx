"use client";

import type { FormEvent } from "react";
import type { AuthMode } from "./viewTypes";

type AuthProps = {
  authMode: AuthMode;
  authName: string;
  authEmail: string;
  authPassword: string;
  errorMessage: string;
  successMessage: string;
  onAuthNameChange: (value: string) => void;
  onAuthEmailChange: (value: string) => void;
  onAuthPasswordChange: (value: string) => void;
  onAuthModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent) => void;
};

export default function Auth({
  authMode,
  authName,
  authEmail,
  authPassword,
  errorMessage,
  successMessage,
  onAuthNameChange,
  onAuthEmailChange,
  onAuthPasswordChange,
  onAuthModeChange,
  onSubmit
}: AuthProps) {
  return (
    <main className="auth-wrap">
      <form className="panel auth-card stack" onSubmit={onSubmit}>
        <h2 style={{ margin: 0 }}>
          {authMode === "login" ? "Sign in" : "Create account"}
        </h2>

        {authMode === "register" ? (
          <input
            className="input"
            placeholder="Full name"
            value={authName}
            onChange={(event) => onAuthNameChange(event.target.value)}
            required
          />
        ) : null}

        <input
          className="input"
          type="email"
          placeholder="Email"
          value={authEmail}
          onChange={(event) => onAuthEmailChange(event.target.value)}
          required
        />

        <input
          className="input"
          type="password"
          placeholder="Password"
          value={authPassword}
          onChange={(event) => onAuthPasswordChange(event.target.value)}
          required
        />

        {errorMessage ? <div className="error-box">{errorMessage}</div> : null}
        {successMessage ? <div className="badge">{successMessage}</div> : null}

        <button className="btn primary" type="submit">
          {authMode === "login" ? "Sign in" : "Create account"}
        </button>

        <button
          className="btn ghost"
          type="button"
          onClick={() =>
            onAuthModeChange(authMode === "login" ? "register" : "login")
          }
        >
          {authMode === "login"
            ? "Need an account? Register"
            : "Already registered? Sign in"}
        </button>
      </form>
    </main>
  );
}
