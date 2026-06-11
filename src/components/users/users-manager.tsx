"use client";

import { useMemo, useState } from "react";
import { Plus, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserSearch } from "./user-search";
import { UserTable } from "./user-table";
import { UserForm } from "./user-form";
import { type UserRow, COMPANY_ROLES, ROLE_META } from "./types";

interface ApiError {
  message?: string;
}

export function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | UserRole>("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (!q) return true;
      return [u.name ?? "", u.username ?? "", ROLE_META[u.role]?.label ?? u.role]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [users, search, roleFilter]);

  function upsert(u: UserRow) {
    setUsers((prev) => {
      const exists = prev.some((x) => x.id === u.id);
      return exists ? prev.map((x) => (x.id === u.id ? u : x)) : [...prev, u];
    });
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(u: UserRow) {
    setEditing(u);
    setFormOpen(true);
  }

  async function toggleActive(u: UserRow) {
    setBusyId(u.id);
    try {
      const res = await axiosInstance.patch<{ data: UserRow }>(`/users/${u.id}`, {
        name: u.name ?? "",
        email: u.email ?? "",
        role: u.role,
        isActive: !u.isActive,
      });
      upsert(res.data.data);
      toast.success(res.data.data.isActive ? "User activated" : "User deactivated");
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not update the user.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await axiosInstance.delete(`/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success("User deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not delete the user.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <UserSearch value={search} onChange={setSearch} />
          <NativeSelect
            className="w-full sm:w-36"
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "" | UserRole)}
          >
            <NativeSelectOption value="">All roles</NativeSelectOption>
            {COMPANY_ROLES.map((r) => (
              <NativeSelectOption key={r} value={r}>
                {ROLE_META[r].label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button onClick={openCreate} className="sm:w-auto">
          <Plus className="size-4" />
          Add user
        </Button>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        users.length === 0 ? (
          <Empty className="rounded-lg border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No users yet</EmptyTitle>
              <EmptyDescription>
                Add team members and assign them a role.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add user
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No users match your search or filter.
          </div>
        )
      ) : (
        <UserTable
          users={filtered}
          currentUserId={currentUserId}
          onEdit={openEdit}
          onToggleActive={toggleActive}
          onDelete={setDeleteTarget}
        />
      )}

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        onSaved={upsert}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name ?? deleteTarget?.username}
              </span>
              . They will no longer be able to sign in. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!!busyId}
              onClick={confirmDelete}
            >
              {busyId === deleteTarget?.id && <Spinner />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
