import { TriangleAlert, Lock } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { resolveWindow } from "@/lib/reports/date-range";
import { getReportData } from "@/lib/reports/report-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata = { title: "Reports" };

// Reports are an ADMIN/MANAGER capability (per the role matrix); STAFF is blocked.
const ALLOWED_ROLES = ["ADMIN", "MANAGER"] as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user?.companyId) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>No company associated</AlertTitle>
          <AlertDescription>
            Your account isn&apos;t linked to a company, so there are no reports
            to show.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!(ALLOWED_ROLES as readonly string[]).includes(user.role)) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert>
          <Lock />
          <AlertTitle>Reports are restricted</AlertTitle>
          <AlertDescription>
            You don&apos;t have access to reports. Please contact an administrator
            or manager.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const window = resolveWindow(await searchParams);
  const data = await getReportData(user.companyId, window);

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Stock, sales, purchase and low-stock insights for your company.
        </p>
      </div>

      <ReportsView data={data} />
    </div>
  );
}
