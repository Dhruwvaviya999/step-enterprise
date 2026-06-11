import { TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CompanySettingsForm,
  type CompanySettings,
} from "@/components/settings/company-settings-form";

export const metadata = {
  title: "Company Settings",
};

export default async function SettingsPage() {
  // The dashboard layout already guarantees an authenticated company user, but
  // we read the session here to scope the query to THIS company only.
  const user = await getCurrentUser();

  if (!user?.companyId) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>No company associated</AlertTitle>
          <AlertDescription>
            Your account isn&apos;t linked to a company, so there are no
            settings to manage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch only the logged-in company's record (companyId from the session —
  // never the company code).
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: {
      id: true,
      name: true,
      code: true,
      logoUrl: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      country: true,
      isActive: true,
    },
  });

  if (!company) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Company not found</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load your company details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Only ADMINs may edit; MANAGER/STAFF get a read-only view of the same form.
  const canEdit = user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Company Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your company profile, contact details and status.
        </p>
      </div>

      <CompanySettingsForm
        company={company as CompanySettings}
        canEdit={canEdit}
      />
    </div>
  );
}
