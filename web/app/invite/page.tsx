"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, authApi, organizationApi } from "../../lib/api";
import type { InviteResolution, User } from "../../lib/types";

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
};

export default function InvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [user, setUser] = useState<User | null>(null);
  const [invite, setInvite] = useState<InviteResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        if (!token) {
          throw new Error("Missing invitation token");
        }

        const [resolvedInvite, me] = await Promise.all([
          organizationApi.resolveInvite(token),
          (async () => {
            const accessToken = authApi.getAccessToken();
            if (!accessToken) {
              return null;
            }
            try {
              return await authApi.me();
            } catch {
              return null;
            }
          })()
        ]);

        if (!alive) {
          return;
        }

        setInvite(resolvedInvite);
        setUser(me);
      } catch (error) {
        if (alive) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!token) {
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await organizationApi.acceptInviteByToken(token);
      setSuccessMessage("Invitation accepted. You can return to dashboard.");
      const resolved = await organizationApi.resolveInvite(token);
      setInvite(resolved);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <main className="auth-wrap">
      <div className="panel auth-card stack">
        <h2 style={{ margin: 0 }}>Organization Invitation</h2>

        {loading ? <div>Loading invite...</div> : null}
        {errorMessage ? <div className="error-box">{errorMessage}</div> : null}
        {successMessage ? <div className="badge">{successMessage}</div> : null}

        {invite ? (
          <div className="stack">
            <div>
              <strong>Organization:</strong> {invite.organizationName}
            </div>
            <div>
              <strong>Invited email:</strong> {invite.email}
            </div>
            <div>
              <strong>Status:</strong> {invite.status}
            </div>
            <div className="muted">
              Expires at: {new Date(invite.expiresAt).toLocaleString()}
            </div>
          </div>
        ) : null}

        {!user ? (
          <div className="stack">
            <div className="muted">Sign in first to accept this invitation.</div>
            <Link className="btn primary" href="/">
              Go to Sign In
            </Link>
          </div>
        ) : null}

        {user && invite?.status === "pending" ? (
          <button className="btn primary" onClick={handleAccept}>
            Accept Invitation
          </button>
        ) : null}

        <Link className="btn" href="/">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
