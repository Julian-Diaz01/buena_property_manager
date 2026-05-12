import { PropertyBuildingsView } from "@/components/app/propertyBuildingsView";

type PageProps = { params: Promise<{ id: string }> };

export default async function PropertyBuildingsPage({ params }: PageProps) {
  const { id } = await params;
  return <PropertyBuildingsView propertyId={id} />;
}
