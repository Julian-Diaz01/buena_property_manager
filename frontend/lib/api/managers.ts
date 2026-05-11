import { apiRequest } from "./client";
import type { Manager } from "./types";

export async function listManagers(): Promise<Manager[]> {
  return apiRequest<Manager[]>("/api/managers");
}

export async function createManager(body: { fullName: string }): Promise<Manager> {
  return apiRequest<Manager>("/api/managers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
