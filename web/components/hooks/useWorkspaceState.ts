"use client";

import { FormEvent, useCallback, useEffect, useMemo } from "react";
import { organizationApi } from "../../lib/api";
import type { User } from "../../lib/types";
import { useWorkspaceStore } from "../../stores/workspaceStore";

type UseWorkspaceStateParams = {
  user: User | null;
  clearFeedback: () => void;
  setError: (error: unknown) => void;
  setSuccess: (message: string) => void;
};

export default function useWorkspaceState({
  user,
  clearFeedback,
  setError,
  setSuccess
}: UseWorkspaceStateParams) {
  const organizations = useWorkspaceStore((state) => state.organizations);
  const selectedOrganizationId = useWorkspaceStore(
    (state) => state.selectedOrganizationId
  );
  const organizationMembers = useWorkspaceStore((state) => state.organizationMembers);
  const newOrganizationName = useWorkspaceStore((state) => state.newOrganizationName);
  const inviteEmail = useWorkspaceStore((state) => state.inviteEmail);
  const projects = useWorkspaceStore((state) => state.projects);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const newProjectName = useWorkspaceStore((state) => state.newProjectName);

  const setOrganizations = useWorkspaceStore((state) => state.setOrganizations);
  const setSelectedOrganizationId = useWorkspaceStore(
    (state) => state.setSelectedOrganizationId
  );
  const setOrganizationMembers = useWorkspaceStore(
    (state) => state.setOrganizationMembers
  );
  const setNewOrganizationName = useWorkspaceStore(
    (state) => state.setNewOrganizationName
  );
  const setInviteEmail = useWorkspaceStore((state) => state.setInviteEmail);
  const setProjects = useWorkspaceStore((state) => state.setProjects);
  const setSelectedProjectId = useWorkspaceStore((state) => state.setSelectedProjectId);
  const setNewProjectName = useWorkspaceStore((state) => state.setNewProjectName);
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace);

  const selectedOrganization = useMemo(
    () => organizations.find((item) => item.id === selectedOrganizationId) || null,
    [organizations, selectedOrganizationId]
  );
  const selectedProject = useMemo(
    () => projects.find((item) => item.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const refreshOrganizations = useCallback(async () => {
    const nextOrganizations = await organizationApi.list();
    const currentSelected = useWorkspaceStore.getState().selectedOrganizationId;

    setOrganizations(nextOrganizations);
    const currentExists = nextOrganizations.some((item) => item.id === currentSelected);
    setSelectedOrganizationId(currentExists ? currentSelected : nextOrganizations[0]?.id || "");
  }, [setOrganizations, setSelectedOrganizationId]);

  const refreshOrganizationContext = useCallback(async (organizationId: string) => {
    const [members, nextProjects] = await Promise.all([
      organizationApi.members(organizationId),
      organizationApi.projects(organizationId)
    ]);
    const currentSelectedProjectId = useWorkspaceStore.getState().selectedProjectId;

    setOrganizationMembers(members);
    setProjects(nextProjects);
    const currentExists = nextProjects.some(
      (item) => item.id === currentSelectedProjectId
    );
    setSelectedProjectId(currentExists ? currentSelectedProjectId : nextProjects[0]?.id || "");
  }, [setOrganizationMembers, setProjects, setSelectedProjectId]);

  useEffect(() => {
    if (!user) {
      resetWorkspace();
      return;
    }

    let alive = true;
    const load = async () => {
      try {
        const nextOrganizations = await organizationApi.list();
        if (!alive) {
          return;
        }

        const currentSelected = useWorkspaceStore.getState().selectedOrganizationId;
        const currentExists = nextOrganizations.some((item) => item.id === currentSelected);
        setOrganizations(nextOrganizations);
        setSelectedOrganizationId(
          currentExists ? currentSelected : nextOrganizations[0]?.id || ""
        );
      } catch (error) {
        if (alive) {
          setError(error);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [resetWorkspace, setError, setOrganizations, setSelectedOrganizationId, user]);

  useEffect(() => {
    if (!user || !selectedOrganizationId) {
      setOrganizationMembers([]);
      setProjects([]);
      setSelectedProjectId("");
      return;
    }

    let alive = true;
    const load = async () => {
      try {
        const [members, nextProjects] = await Promise.all([
          organizationApi.members(selectedOrganizationId),
          organizationApi.projects(selectedOrganizationId)
        ]);
        if (!alive) {
          return;
        }
        const currentSelectedProjectId = useWorkspaceStore.getState().selectedProjectId;
        const currentExists = nextProjects.some(
          (project) => project.id === currentSelectedProjectId
        );
        setOrganizationMembers(members);
        setProjects(nextProjects);
        setSelectedProjectId(
          currentExists ? currentSelectedProjectId : nextProjects[0]?.id || ""
        );
      } catch (error) {
        if (alive) {
          setError(error);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [
    selectedOrganizationId,
    setError,
    setOrganizationMembers,
    setProjects,
    setSelectedProjectId,
    user
  ]);

  const handleCreateOrganization = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!newOrganizationName.trim()) {
        return;
      }
      clearFeedback();
      try {
        await organizationApi.create(newOrganizationName.trim());
        setNewOrganizationName("");
        await refreshOrganizations();
        setSuccess("Organization created.");
      } catch (error) {
        setError(error);
      }
    },
    [
      clearFeedback,
      newOrganizationName,
      refreshOrganizations,
      setNewOrganizationName,
      setError,
      setSuccess
    ]
  );

  const handleCreateProject = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedOrganizationId || !newProjectName.trim()) {
        return;
      }
      clearFeedback();
      try {
        await organizationApi.createProject(selectedOrganizationId, newProjectName.trim());
        setNewProjectName("");
        await refreshOrganizationContext(selectedOrganizationId);
        setSuccess("Project created.");
      } catch (error) {
        setError(error);
      }
    },
    [
      clearFeedback,
      newProjectName,
      refreshOrganizationContext,
      selectedOrganizationId,
      setNewProjectName,
      setError,
      setSuccess
    ]
  );

  const handleInvite = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!selectedOrganizationId || !inviteEmail.trim()) {
        return;
      }
      clearFeedback();
      try {
        await organizationApi.invite(selectedOrganizationId, inviteEmail.trim());
        setInviteEmail("");
        setSuccess("Invitation sent.");
      } catch (error) {
        setError(error);
      }
    },
    [
      clearFeedback,
      inviteEmail,
      selectedOrganizationId,
      setError,
      setInviteEmail,
      setSuccess
    ]
  );

  return {
    organizations,
    selectedOrganizationId,
    selectedOrganization,
    organizationMembers,
    newOrganizationName,
    inviteEmail,
    projects,
    selectedProjectId,
    selectedProject,
    newProjectName,
    setSelectedOrganizationId,
    setNewOrganizationName,
    setInviteEmail,
    setSelectedProjectId,
    setNewProjectName,
    handleCreateOrganization,
    handleInvite,
    handleCreateProject,
    refreshOrganizations,
    refreshOrganizationContext,
    resetWorkspace
  };
}
