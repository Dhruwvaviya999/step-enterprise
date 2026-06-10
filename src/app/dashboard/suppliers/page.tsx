import { TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SuppliersManager } from "@/components/suppliers/suppliers-manager";
import type { Supplier } from "@/components/suppliers/supplier-table";

export const metadata = { title: "Suppliers" };

const MANAGE_ROLES = ["ADMIN", "MANAGER"] as const;

export default async function SuppliersPage() {
  // The dashboard layout guarantees an authenticated company user; we read the
  // session here to scope the query to THIS company only (never company code).
  const user = await getCurrentUser();

  if (!user?.companyId) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>No company associated</AlertTitle>
          <AlertDescription>
            Your account isn&apos;t linked to a company, so there are no
            suppliers to manage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const initialSuppliers: Supplier[] = await prisma.supplier.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
    },
    orderBy: { name: "asc" },
  });

  const canManage = (MANAGE_ROLES as readonly string[]).includes(user.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <p className="text-sm text-muted-foreground">
          Manage the suppliers your company purchases stock from.
        </p>
      </div>

      <SuppliersManager
        initialSuppliers={initialSuppliers}
        canManage={canManage}
      />
    </div>
  );
}
