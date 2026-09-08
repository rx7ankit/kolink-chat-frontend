import { api, setToken, setWorkspaceId } from "./client";

export type User = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  plan: string;
};

export type Token = {
  access_token: string;
  token_type: string;
};

export async function login(email: string, password: string) {
  const token = await api<Token>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  setToken(token.access_token);
  const workspaces = await api<Workspace[]>("/workspaces");
  const preferred =
    workspaces.find((item) => item.slug === "studio-north") ??
    workspaces.find((item) => item.slug === "bloom-and-co") ??
    workspaces[0];
  if (preferred) setWorkspaceId(preferred.id);
  const user = await api<User>("/auth/me");
  return { user, workspace: preferred ?? workspaces[0] ?? null, token };
}

export async function register(input: {
  email: string;
  full_name: string;
  password: string;
  workspace_name: string;
}) {
  const data = await api<{
    user: User;
    workspace: Workspace;
    token: Token;
  }>("/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
  setToken(data.token.access_token);
  setWorkspaceId(data.workspace.id);
  return data;
}

export async function me() {
  return api<User>("/auth/me");
}

export async function listWorkspaces() {
  return api<Workspace[]>("/workspaces");
}

export function logout() {
  setToken(null);
  setWorkspaceId(null);
}
