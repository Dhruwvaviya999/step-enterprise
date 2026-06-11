import { UserRole } from "@prisma/client";

export interface UserRow {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export const COMPANY_ROLES: Exclude<UserRole, "SUPER_ADMIN">[] = [
  "ADMIN",
  "MANAGER",
  "STAFF",
];

export const ROLE_META: Record<string, { label: string; className: string }> = {
  ADMIN: {
    label: "Admin",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  MANAGER: {
    label: "Manager",
    className:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  STAFF: {
    label: "Staff",
    className: "bg-muted text-muted-foreground border-transparent",
  },
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
