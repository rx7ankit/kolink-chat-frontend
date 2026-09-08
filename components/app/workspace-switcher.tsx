"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/provider";
import { cn, initials } from "@/lib/utils";

export function WorkspaceSwitcher({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  const { workspace, workspaces, switchWorkspace, createWorkspace } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const name = workspace?.name ?? "Workspace";

  async function submitCreate() {
    const value = newName.trim();
    if (!value) {
      toast.error("Enter a workspace name");
      return;
    }
    setCreating(true);
    try {
      const created = await createWorkspace(value);
      setCreateOpen(false);
      setNewName("");
      toast.success(`Created “${created.name}”`);
      window.location.assign("/home");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not create workspace");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center rounded-xl text-left transition hover:bg-white/40",
              collapsed
                ? "h-9 w-9 shrink-0 justify-center p-0"
                : "min-w-0 flex-1 gap-2.5 px-2 py-1.5",
              className,
            )}
            aria-label={`Workspace: ${name}`}
          >
            <Avatar className="h-8 w-8 shrink-0 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary/15 text-[11px] font-semibold text-primary">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed ? (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-tight">
                    {name}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    Workspace
                  </span>
                </span>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </>
            ) : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="w-60">
          <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
          {workspaces.map((item) => {
            const active = item.id === workspace?.id;
            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => switchWorkspace(item.id)}
                className="gap-2"
              >
                <Avatar className="h-6 w-6 shrink-0 rounded-md">
                  <AvatarFallback className="rounded-md bg-primary/12 text-[10px] font-semibold text-primary">
                    {initials(item.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {active ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setNewName("");
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Spin up another workspace for a brand, client, or team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g. Studio North"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void submitCreate();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button disabled={creating || !newName.trim()} onClick={() => void submitCreate()}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
