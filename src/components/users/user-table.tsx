"use client";

import { MoreHorizontal, Pencil, UserCheck, UserX, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type UserRow, ROLE_META, formatDate } from "./types";

export function UserTable({
  users,
  currentUserId,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  users: UserRow[];
  currentUserId: string;
  onEdit: (u: UserRow) => void;
  onToggleActive: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[1%] text-right whitespace-nowrap">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            const role = ROLE_META[u.role] ?? ROLE_META.STAFF;
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {u.name ?? "—"}
                    {isSelf && (
                      <Badge variant="secondary" className="text-[10px]">
                        You
                      </Badge>
                    )}
                  </div>
                  {u.email && (
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {u.username ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={role.className}>
                    {role.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "default" : "outline"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(u.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${u.name ?? u.username}`}
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onEdit(u)}>
                        <Pencil className="size-4 text-muted-foreground" /> Edit
                      </DropdownMenuItem>

                      {!isSelf && (
                        <>
                          <DropdownMenuItem onClick={() => onToggleActive(u)}>
                            {u.isActive ? (
                              <>
                                <UserX className="size-4 text-muted-foreground" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="size-4 text-muted-foreground" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(u)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
