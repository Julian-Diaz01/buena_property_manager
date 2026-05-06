import { DashboardContentSkeleton } from "../components/dashboardContentSkeleton";
import { DashboardShell } from "../components/dashboardShell";

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <DashboardContentSkeleton />
    </DashboardShell>
  );
}
