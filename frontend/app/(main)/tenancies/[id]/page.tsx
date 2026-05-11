import { TenancyDashboardView } from "@/components/app/tenancyDashboardView";

type PageProps = { params: Promise<{ id: string }> };

export default async function TenancyPage({ params }: PageProps) {
  const { id } = await params;
  return <TenancyDashboardView unitId={id} />;
}
