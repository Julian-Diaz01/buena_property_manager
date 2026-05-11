import { apiRequest } from "./client";
import type { UnitWithRelations } from "./types";

export type ListUnitsQuery = {
  buildingId?: string;
  type?: string;
  floor?: string;
  entrance?: string;
};

export async function listUnits(query: ListUnitsQuery = {}): Promise<UnitWithRelations[]> {
  const params = new URLSearchParams();
  if (query.buildingId) params.set("buildingId", query.buildingId);
  if (query.type) params.set("type", query.type);
  if (query.floor) params.set("floor", query.floor);
  if (query.entrance) params.set("entrance", query.entrance);
  const qs = params.toString();
  return apiRequest<UnitWithRelations[]>(`/api/units${qs ? `?${qs}` : ""}`);
}

export async function getUnit(id: string): Promise<UnitWithRelations> {
  return apiRequest<UnitWithRelations>(`/api/units/${id}`);
}
