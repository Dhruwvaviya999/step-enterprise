import { getCurrentUser } from "@/lib/session";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  // The layout guarantees a user, but we read it here for the greeting.
  const user = await getCurrentUser();
  const label = user?.name || user?.username || "there";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {label}
        </h1>
        <p className="text-sm text-muted-foreground">
          You&apos;re signed in to your company workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Inventory, products and reports will appear here in later steps.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
