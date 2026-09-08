"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  listWorkspaces,
  login as apiLogin,
  logout as apiLogout,
  me,
  register as apiRegister,
  type User,
  type Workspace,
} from "@/lib/api/auth";
import { getToken, getWorkspaceId, setWorkspaceId } from "@/lib/api/client";
import { createWorkspace as apiCreateWorkspace } from "@/lib/api/workspaces";

type AuthState = {
  user: User | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    full_name: string;
    password: string;
    workspace_name: string;
  }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
};

const AuthContext = createContext<AuthState | null>(null);

function pickWorkspace(list: Workspace[], preferredId: string | null) {
  if (preferredId) {
    const match = list.find((item) => item.id === preferredId);
    if (match) return match;
  }
  return list[0] ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const applyWorkspaces = useCallback((list: Workspace[], preferredId?: string | null) => {
    const selected = pickWorkspace(list, preferredId ?? getWorkspaceId());
    setWorkspaces(list);
    setWorkspace(selected);
    setWorkspaceId(selected?.id ?? null);
  }, []);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setWorkspace(null);
      setWorkspaces([]);
      setLoading(false);
      return;
    }
    try {
      const [current, list] = await Promise.all([me(), listWorkspaces()]);
      if (getToken() !== token) return;
      setUser(current);
      applyWorkspaces(list);
    } catch {
      if (getToken() !== token) return;
      apiLogout();
      setUser(null);
      setWorkspace(null);
      setWorkspaces([]);
    } finally {
      if (getToken() === token || !getToken()) setLoading(false);
    }
  }, [applyWorkspaces]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      workspace,
      workspaces,
      loading,
      async login(email, password) {
        const result = await apiLogin(email, password);
        setUser(result.user);
        const list = await listWorkspaces();
        applyWorkspaces(list, result.workspace?.id);
      },
      async register(input) {
        const result = await apiRegister(input);
        setUser(result.user);
        applyWorkspaces([result.workspace], result.workspace.id);
      },
      logout() {
        apiLogout();
        setUser(null);
        setWorkspace(null);
        setWorkspaces([]);
      },
      refresh,
      switchWorkspace(id) {
        const next = workspaces.find((item) => item.id === id);
        if (!next || next.id === workspace?.id) return;
        setWorkspace(next);
        setWorkspaceId(next.id);
        window.location.assign("/home");
      },
      async createWorkspace(name) {
        const created = await apiCreateWorkspace(name.trim());
        const list = await listWorkspaces();
        applyWorkspaces(list, created.id);
        return created;
      },
    }),
    [user, workspace, workspaces, loading, refresh, applyWorkspaces],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
