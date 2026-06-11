import { Skeleton } from "@/components/ui/skeleton";
import { CompanySettingsSkeleton } from "@/components/settings/company-settings-skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <CompanySettingsSkeleton />
    </div>
  );
}
