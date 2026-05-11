export const queryKeys = {
  managers: ["managers"] as const,
  accountants: ["accountants"] as const,
  properties: ["properties"] as const,
  property: (id: string) => ["property", id] as const,
  units: (buildingId: string) => ["units", buildingId] as const,
  unit: (id: string) => ["unit", id] as const,
};
