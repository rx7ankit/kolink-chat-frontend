"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { TablePagination, usePagination } from "@/components/table-pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { addTeamMember, listTeamUi, removeTeamMember } from "@/lib/api/team";
import { useI18n } from "@/lib/i18n/provider";
import type { TeamMember, TeamRole } from "@/lib/mock";
import { initials } from "@/lib/utils";

const roles: TeamRole[] = ["Admin", "Editor", "Inbox Agent", "Viewer"];

export function TeamManager() {
  const { t } = useI18n();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<TeamRole>("Inbox Agent");
  const [saving, setSaving] = useState(false);
  const pager = usePagination(members, 5);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await listTeamUi());
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function addMember() {
    if (!name.trim() || !email.trim() || password.length < 8) {
      toast.error("Name, email, and password (8+ chars) are required");
      return;
    }
    setSaving(true);
    try {
      await addTeamMember({
        email: email.trim(),
        full_name: name.trim(),
        role,
        password,
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("Inbox Agent");
      setOpen(false);
      toast.success(t("team.added"));
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not add member");
    } finally {
      setSaving(false);
    }
  }

  async function onRemove(id: string) {
    const target = members.find((item) => item.id === id);
    if (target?.role === "Owner") {
      toast.error(t("team.ownerLocked"));
      return;
    }
    try {
      await removeTeamMember(id);
      toast.success(t("team.removed"));
      await reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "Could not remove member");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("team.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("team.subtitle")}</p>
        </div>
        <Button onClick={() => setOpen(true)}>{t("team.add")}</Button>
      </div>
      <div className="glass overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("team.name")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("team.role")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("team.active")}</TableHead>
              <TableHead className="text-right">{t("team.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              pager.slice.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{initials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{member.role}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {member.lastActive}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={member.role === "Owner"}
                      onClick={() => void onRemove(member.id)}
                    >
                      {t("common.remove")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          page={pager.page}
          pageCount={pager.pageCount}
          total={pager.total}
          pageSize={pager.pageSize}
          onPageChange={pager.setPage}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("team.add")}</DialogTitle>
            <DialogDescription>{t("team.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="member-name">{t("team.name")}</Label>
              <Input id="member-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">{t("team.email")}</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-password">Temp password</Label>
              <Input
                id="member-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("team.role")}</Label>
              <Select value={role} onValueChange={(value) => setRole(value as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button disabled={saving} onClick={() => void addMember()}>
                {t("common.add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
