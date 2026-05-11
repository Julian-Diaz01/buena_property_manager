import { apiRequest } from "./client";
import type { BuildingCreateInput } from "./types";

export async function createBuilding(body: BuildingCreateInput): Promise<unknown> {
  return apiRequest("/api/buildings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
