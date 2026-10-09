"use client";

import { useAuth } from "@/lib/auth/provider";

export function useWorkspaceId() {
  const { workspace } = useAuth();
  return workspace?.id ?? "";
}
