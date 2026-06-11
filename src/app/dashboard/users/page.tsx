import { TriangleAlert, Lock } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { listUsers } from "@/lib/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UsersManager } from "@/components/users/users-manager";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user?.companyId) {
    return (
      <div className="mx-auto max-w-5xl">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>No company associated</AlertTitle>
          <AlertDescription>
            Your account isn&apos;t linked to a company, so there are no users to
            manage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Only ADMIN may manage company users (per the role matrix).
  if (user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-5xl">
        <Alert>
          <Lock />
          <AlertTitle>User management is restricted</AlertTitle>
          <AlertDescription>
            Only administrators can manage users. Please contact an administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const users = await listUsers(user.companyId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage who can sign in to your company workspace and their roles.
        </p>
      </div>

      <UsersManager initialUsers={users} currentUserId={user.id} />
    </div>
  );
}
