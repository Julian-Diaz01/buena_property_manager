import { apiRequest } from "./client";
import type { UnitWithRelations } from "./types";

export async function createAndAssignContract(
  unitId: string,
  body: { name: string },
): Promise<UnitWithRelations> {
  return apiRequest<UnitWithRelations>(`/api/contracts/units/${unitId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function removeContractFromUnit(unitId: string): Promise<UnitWithRelations> {
  return apiRequest<UnitWithRelations>(`/api/contracts/units/${unitId}`, {
    method: "DELETE",
  });
}
