import { PropertyUnitsView } from "@/components/app/propertyUnitsView";

type PageProps = { params: Promise<{ id: string }> };

export default async function PropertyUnitsPage({ params }: PageProps) {
  const { id } = await params;
  return <PropertyUnitsView propertyId={id} />;
}
