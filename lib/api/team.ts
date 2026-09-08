import { api, workspacePath } from "./client";
import type { TeamMember as UiTeamMember, TeamRole as UiTeamRole } from "@/lib/mock";

export type ApiTeamMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  email: string;
  full_name: string;
};

/** Used by inbox assignee mapping — keep this export name. */
export type TeamMember = ApiTeamMember;

const ROLE_TO_API: Record<UiTeamRole, string> = {
  Owner: "owner",
  Admin: "admin",
  Editor: "editor",
  "Inbox Agent": "inbox_agent",
  Viewer: "viewer",
};

const ROLE_TO_UI: Record<string, UiTeamRole> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  inbox_agent: "Inbox Agent",
  agent: "Inbox Agent",
  viewer: "Viewer",
};

export function toUiTeamMember(row: ApiTeamMember): UiTeamMember {
  const role = ROLE_TO_UI[row.role] ?? "Viewer";
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role,
    inboxSeat: role !== "Viewer",
    lastActive: "—",
  };
}

export async function listTeam() {
  return api<ApiTeamMember[]>(workspacePath("/team"));
}

export async function listTeamUi() {
  const rows = await listTeam();
  return rows.map(toUiTeamMember);
}

export async function addTeamMember(data: {
  email: string;
  full_name: string;
  role: UiTeamRole;
  password: string;
}) {
  const row = await api<ApiTeamMember>(workspacePath("/team"), {
    method: "POST",
    body: {
      email: data.email,
      full_name: data.full_name,
      role: ROLE_TO_API[data.role] ?? "inbox_agent",
      password: data.password,
    },
  });
  return toUiTeamMember(row);
}

export async function removeTeamMember(membershipId: string) {
  return api<{ detail: string }>(workspacePath(`/team/${membershipId}`), {
    method: "DELETE",
  });
}

export async function patchTeamMemberRole(membershipId: string, role: UiTeamRole) {
  const row = await api<ApiTeamMember>(workspacePath(`/team/${membershipId}`), {
    method: "PATCH",
    body: { role: ROLE_TO_API[role] ?? "inbox_agent" },
  });
  return toUiTeamMember(row);
}
