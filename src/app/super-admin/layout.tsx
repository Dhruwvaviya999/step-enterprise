import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";
import { Toaster } from "@/components/ui/sonner";
import { SuperAdminHeader } from "./_components/super-admin-header";

export default async function SuperAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  // Only Super Admins may access this area. The middleware already bounces
  // unauthenticated visitors to the super-admin login; here we enforce the role.
  if (!user) redirect("/super-admin/login");
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-svh bg-muted/30">
      <SuperAdminHeader email={user.email ?? null} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      <Toaster />
    </div>
  );
}
