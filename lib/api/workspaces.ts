import { api, workspacePath } from "./client";
import type { Workspace } from "./auth";

export async function createWorkspace(name: string, timezone?: string) {
  return api<Workspace>("/workspaces", {
    method: "POST",
    body: { name, timezone },
  });
}

export async function patchWorkspace(data: { name?: string; timezone?: string }) {
  return api<Workspace>(workspacePath(), { method: "PATCH", body: data });
}
