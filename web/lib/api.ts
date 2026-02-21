import type {
  Card,
  CardMember,
  Checklist,
  Comment,
  InviteResolution,
  Label,
  List,
  Organization,
  OrganizationMember,
  PendingInvite,
  Project,
  User
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const ACCESS_TOKEN_STORAGE_KEY = "trello_clone_access_token";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuthRetry?: boolean;
};

const storage = {
  getToken(): string {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || "";
  },
  setToken(token: string) {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  },
  clearToken() {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
};

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    return {
      message: payload?.message || `Request failed (${response.status})`,
      details: payload?.details
    };
  } catch {
    return {
      message: `Request failed (${response.status})`,
      details: undefined
    };
  }
};

const buildHeaders = (
  token: string,
  initHeaders: HeadersInit | undefined,
  withJsonBody: boolean
) => {
  const headers = new Headers(initHeaders);
  if (withJsonBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (!withJsonBody && headers.get("content-type") === "application/json") {
    headers.delete("content-type");
  }
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  } else {
    headers.delete("authorization");
  }
  return headers;
};

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });
    if (!response.ok) {
      storage.clearToken();
      const { message, details } = await parseErrorMessage(response);
      throw new ApiError(response.status, message, details);
    }
    const payload = await response.json();
    const token = payload?.accessToken || "";
    if (!token) {
      storage.clearToken();
      throw new ApiError(500, "Refresh response did not contain accessToken");
    }
    storage.setToken(token);
    return token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const token = storage.getToken();
  const requestBody =
    options.body === undefined ? undefined : JSON.stringify(options.body);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(token, options.headers, requestBody !== undefined),
    body: requestBody,
    credentials: "include"
  });

  if (response.status === 401 && !options.skipAuthRetry) {
    try {
      const refreshedToken = await refreshAccessToken();
      const retryResponse = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: buildHeaders(
          refreshedToken,
          options.headers,
          requestBody !== undefined
        ),
        body: requestBody,
        credentials: "include"
      });
      if (!retryResponse.ok) {
        const { message, details } = await parseErrorMessage(retryResponse);
        throw new ApiError(retryResponse.status, message, details);
      }
      if (retryResponse.status === 204) {
        return undefined as T;
      }
      return (await retryResponse.json()) as T;
    } catch (error) {
      storage.clearToken();
      throw error;
    }
  }

  if (!response.ok) {
    const { message, details } = await parseErrorMessage(response);
    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const authApi = {
  getAccessToken: () => storage.getToken(),
  setAccessToken: (token: string) => storage.setToken(token),
  clearAccessToken: () => storage.clearToken(),
  register: async (input: { name: string; email: string; password: string }) => {
    const payload = await request<{ user: User; accessToken: string }>(
      "/auth/register",
      {
        method: "POST",
        body: input,
        skipAuthRetry: true
      }
    );
    storage.setToken(payload.accessToken);
    return payload.user;
  },
  login: async (input: { email: string; password: string }) => {
    const payload = await request<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: input,
      skipAuthRetry: true
    });
    storage.setToken(payload.accessToken);
    return payload.user;
  },
  me: async () => {
    const payload = await request<{ user: User }>("/auth/me");
    return payload.user;
  },
  refresh: async () => {
    const token = await refreshAccessToken();
    return token;
  },
  logout: async () => {
    await request<void>("/auth/logout", {
      method: "POST",
      skipAuthRetry: true
    });
    storage.clearToken();
  }
};

export const organizationApi = {
  list: async () => {
    const payload = await request<{ organizations: Organization[] }>("/organizations");
    return payload.organizations;
  },
  create: async (name: string) => {
    const payload = await request<{ organization: Organization }>("/organizations", {
      method: "POST",
      body: { name }
    });
    return payload.organization;
  },
  update: async (organizationId: string, name: string) => {
    const payload = await request<{ organization: Organization }>(
      `/organizations/${organizationId}`,
      {
        method: "PATCH",
        body: { name }
      }
    );
    return payload.organization;
  },
  remove: async (organizationId: string) => {
    const payload = await request<{ organization: Organization }>(
      `/organizations/${organizationId}`,
      {
        method: "DELETE"
      }
    );
    return payload.organization;
  },
  members: async (organizationId: string) => {
    const payload = await request<{ members: OrganizationMember[] }>(
      `/organizations/${organizationId}/members`
    );
    return payload.members;
  },
  updateMemberRole: async (
    organizationId: string,
    userId: string,
    role: "owner" | "member"
  ) => {
    const payload = await request<{ membership: { role: "owner" | "member" } }>(
      `/organizations/${organizationId}/members/${userId}/role`,
      {
        method: "PATCH",
        body: { role }
      }
    );
    return payload.membership;
  },
  invite: async (organizationId: string, email: string) => {
    return request(`/organizations/${organizationId}/invites`, {
      method: "POST",
      body: { email }
    });
  },
  pendingInvites: async () => {
    const payload = await request<{ invites: PendingInvite[] }>(
      "/organizations/invites/pending"
    );
    return payload.invites;
  },
  acceptInviteByToken: async (token: string) => {
    return request("/organizations/invites/accept", {
      method: "POST",
      body: { token }
    });
  },
  resolveInvite: async (token: string) => {
    const payload = await request<{ invite: InviteResolution }>(
      `/organizations/invites/resolve?token=${encodeURIComponent(token)}`,
      {
        skipAuthRetry: true
      }
    );
    return payload.invite;
  },
  projects: async (organizationId: string) => {
    const payload = await request<{ projects: Project[] }>(
      `/organizations/${organizationId}/projects`
    );
    return payload.projects;
  },
  createProject: async (organizationId: string, name: string) => {
    const payload = await request<{ project: Project }>(
      `/organizations/${organizationId}/projects`,
      {
        method: "POST",
        body: { name }
      }
    );
    return payload.project;
  }
};

export const listApi = {
  list: async (projectId: string) => {
    const payload = await request<{ lists: List[] }>(`/projects/${projectId}/lists`);
    return payload.lists;
  },
  create: async (projectId: string, name: string) => {
    const payload = await request<{ list: List }>(`/projects/${projectId}/lists`, {
      method: "POST",
      body: { name }
    });
    return payload.list;
  },
  update: async (projectId: string, listId: string, name: string) => {
    const payload = await request<{ list: List }>(
      `/projects/${projectId}/lists/${listId}`,
      {
        method: "PATCH",
        body: { name }
      }
    );
    return payload.list;
  },
  remove: async (projectId: string, listId: string) => {
    const payload = await request<{ list: List }>(
      `/projects/${projectId}/lists/${listId}`,
      {
        method: "DELETE"
      }
    );
    return payload.list;
  }
};

export const cardApi = {
  byList: async (listId: string) => {
    const payload = await request<{ cards: Card[] }>(`/lists/${listId}/cards`);
    return payload.cards;
  },
  create: async (
    listId: string,
    input: { title: string; description?: string; dueAt?: string | null }
  ) => {
    const payload = await request<{ card: Card }>(`/lists/${listId}/cards`, {
      method: "POST",
      body: input
    });
    return payload.card;
  },
  update: async (
    projectId: string,
    cardId: string,
    input: { title?: string; description?: string | null; dueAt?: string | null }
  ) => {
    const payload = await request<{ card: Card }>(
      `/projects/${projectId}/cards/${cardId}`,
      {
        method: "PATCH",
        body: input
      }
    );
    return payload.card;
  },
  move: async (
    projectId: string,
    cardId: string,
    input: { targetListId: string; targetPosition?: number }
  ) => {
    const payload = await request<{ card: Card }>(
      `/projects/${projectId}/cards/${cardId}/move`,
      {
        method: "PATCH",
        body: input
      }
    );
    return payload.card;
  },
  remove: async (projectId: string, cardId: string) => {
    const payload = await request<{ card: Card }>(`/projects/${projectId}/cards/${cardId}`, {
      method: "DELETE"
    });
    return payload.card;
  }
};

export const labelApi = {
  project: async (projectId: string) => {
    const payload = await request<{ labels: Label[] }>(`/projects/${projectId}/labels`);
    return payload.labels;
  },
  create: async (projectId: string, input: { name: string; color: string }) => {
    const payload = await request<{ label: Label }>(`/projects/${projectId}/labels`, {
      method: "POST",
      body: input
    });
    return payload.label;
  },
  card: async (projectId: string, cardId: string) => {
    const payload = await request<{ labels: Label[] }>(
      `/projects/${projectId}/cards/${cardId}/labels`
    );
    return payload.labels;
  },
  attach: async (projectId: string, cardId: string, labelId: string) => {
    return request(`/projects/${projectId}/cards/${cardId}/labels/${labelId}`, {
      method: "POST"
    });
  },
  detach: async (projectId: string, cardId: string, labelId: string) => {
    return request(`/projects/${projectId}/cards/${cardId}/labels/${labelId}`, {
      method: "DELETE"
    });
  }
};

export const cardMemberApi = {
  list: async (projectId: string, cardId: string) => {
    const payload = await request<{ members: CardMember[] }>(
      `/projects/${projectId}/cards/${cardId}/members`
    );
    return payload.members;
  },
  assign: async (projectId: string, cardId: string, userId: string) => {
    return request(`/projects/${projectId}/cards/${cardId}/members/${userId}`, {
      method: "POST"
    });
  },
  unassign: async (projectId: string, cardId: string, userId: string) => {
    return request(`/projects/${projectId}/cards/${cardId}/members/${userId}`, {
      method: "DELETE"
    });
  }
};

export const commentApi = {
  list: async (projectId: string, cardId: string) => {
    const payload = await request<{ comments: Comment[] }>(
      `/projects/${projectId}/cards/${cardId}/comments`
    );
    return payload.comments;
  },
  create: async (projectId: string, cardId: string, content: string) => {
    const payload = await request<{ comment: Comment }>(
      `/projects/${projectId}/cards/${cardId}/comments`,
      {
        method: "POST",
        body: { content }
      }
    );
    return payload.comment;
  }
};

export const checklistApi = {
  list: async (projectId: string, cardId: string) => {
    const payload = await request<{ checklists: Checklist[] }>(
      `/projects/${projectId}/cards/${cardId}/checklists`
    );
    return payload.checklists;
  },
  create: async (projectId: string, cardId: string, title: string) => {
    const payload = await request<{ checklist: Checklist }>(
      `/projects/${projectId}/cards/${cardId}/checklists`,
      {
        method: "POST",
        body: { title }
      }
    );
    return payload.checklist;
  },
  createItem: async (
    projectId: string,
    cardId: string,
    checklistId: string,
    content: string
  ) => {
    const payload = await request<{ item: { id: string } }>(
      `/projects/${projectId}/cards/${cardId}/checklists/${checklistId}/items`,
      {
        method: "POST",
        body: { content }
      }
    );
    return payload.item;
  },
  updateItem: async (
    projectId: string,
    cardId: string,
    checklistId: string,
    itemId: string,
    input: { content?: string; isCompleted?: boolean }
  ) => {
    const payload = await request<{ item: { id: string } }>(
      `/projects/${projectId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`,
      {
        method: "PATCH",
        body: input
      }
    );
    return payload.item;
  }
};

export type BoardSnapshot = {
  lists: List[];
  cardsByList: Record<string, Card[]>;
};

export const boardApi = {
  load: async (projectId: string): Promise<BoardSnapshot> => {
    const lists = await listApi.list(projectId);
    const cardsByList: Record<string, Card[]> = {};
    await Promise.all(
      lists.map(async (list) => {
        cardsByList[list.id] = await cardApi.byList(list.id);
      })
    );
    return { lists, cardsByList };
  }
};
