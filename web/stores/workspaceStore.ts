import { create } from "zustand";
import type { Organization, OrganizationMember, Project } from "../lib/types";

type WorkspaceState = {
  organizations: Organization[];
  selectedOrganizationId: string;
  organizationMembers: OrganizationMember[];
  newOrganizationName: string;
  inviteEmail: string;
  projects: Project[];
  selectedProjectId: string;
  newProjectName: string;
  setOrganizations: (organizations: Organization[]) => void;
  setSelectedOrganizationId: (organizationId: string) => void;
  setOrganizationMembers: (members: OrganizationMember[]) => void;
  setNewOrganizationName: (value: string) => void;
  setInviteEmail: (value: string) => void;
  setProjects: (projects: Project[]) => void;
  setSelectedProjectId: (projectId: string) => void;
  setNewProjectName: (value: string) => void;
  resetWorkspace: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  organizations: [],
  selectedOrganizationId: "",
  organizationMembers: [],
  newOrganizationName: "",
  inviteEmail: "",
  projects: [],
  selectedProjectId: "",
  newProjectName: "",
  setOrganizations: (organizations) => set({ organizations }),
  setSelectedOrganizationId: (selectedOrganizationId) => set({ selectedOrganizationId }),
  setOrganizationMembers: (organizationMembers) => set({ organizationMembers }),
  setNewOrganizationName: (newOrganizationName) => set({ newOrganizationName }),
  setInviteEmail: (inviteEmail) => set({ inviteEmail }),
  setProjects: (projects) => set({ projects }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setNewProjectName: (newProjectName) => set({ newProjectName }),
  resetWorkspace: () =>
    set({
      organizations: [],
      selectedOrganizationId: "",
      organizationMembers: [],
      newOrganizationName: "",
      inviteEmail: "",
      projects: [],
      selectedProjectId: "",
      newProjectName: ""
    })
}));
