import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { getCurrentUser } from "@/lib/session";
import { DashboardHeader } from "./_components/dashboard-header";

// Only company users may reach the dashboard. (Super Admin has its own area.)
const ALLOWED_ROLES: UserRole[] = ["ADMIN", "MANAGER", "STAFF"];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Defense in depth: proxy.ts already blocks unauthenticated access, but we
  // re-check here so the layout can rely on a real user and enforce role.
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!ALLOWED_ROLES.includes(user.role)) redirect("/login");

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <DashboardHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
