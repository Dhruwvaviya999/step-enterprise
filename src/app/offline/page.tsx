import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — Stocker",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <WifiOff className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">You&apos;re offline</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Stocker can&apos;t reach the network right now. Check your connection
          and try again.
        </p>
      </div>
    </div>
  );
}
