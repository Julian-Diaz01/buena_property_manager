import { BuildingUnitsView } from "@/components/app/buildingUnitsView";

type PageProps = { params: Promise<{ id: string; buildingId: string }> };

export default async function BuildingUnitsPage({ params }: PageProps) {
  const { id, buildingId } = await params;
  return <BuildingUnitsView propertyId={id} buildingId={buildingId} />;
}
