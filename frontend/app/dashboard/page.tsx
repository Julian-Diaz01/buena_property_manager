import { ApiHealthNotice } from "../components/apiHealthNotice";
import { DashboardPlaceholder, DashboardShell } from "../components/dashboardShell";
import { getApiHealthState } from "../lib/healthApi";
import { WifiOff } from "lucide-react";

export default async function DashboardPage() {
  const healthState = await getApiHealthState();

  return (
    <DashboardShell>
      <div className="space-y-5">
        <ApiHealthNotice status={healthState.status} message={healthState.message} />
        {healthState.status === "online" ? (
          <DashboardPlaceholder />
        ) : (
          <section className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-muted-foreground/20 bg-muted/30 p-6 text-center">
            <WifiOff className="h-10 w-10 text-muted-foreground grayscale" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              No connection to the server. Try again later.
            </p>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
