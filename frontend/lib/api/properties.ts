import { apiRequest } from "./client";
import type { PropertyCreateInput, PropertyDetail, PropertyListItem } from "./types";

export type ListPropertiesQuery = {
  type?: string;
  managerId?: string;
  accountantId?: string;
  search?: string;
};

export async function listProperties(
  query: ListPropertiesQuery = {},
): Promise<PropertyListItem[]> {
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  if (query.managerId) params.set("managerId", query.managerId);
  if (query.accountantId) params.set("accountantId", query.accountantId);
  if (query.search) params.set("search", query.search);
  const qs = params.toString();
  return apiRequest<PropertyListItem[]>(`/api/properties${qs ? `?${qs}` : ""}`);
}

export async function getProperty(id: string): Promise<PropertyDetail> {
  return apiRequest<PropertyDetail>(`/api/properties/${id}`);
}

export async function createProperty(body: PropertyCreateInput): Promise<PropertyDetail> {
  return apiRequest<PropertyDetail>("/api/properties", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
