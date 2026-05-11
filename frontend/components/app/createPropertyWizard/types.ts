import type { UnitType } from "@/lib/api/types";

export const newClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export type LocalBuilding = {
  clientId: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  description: string;
};

export type LocalUnit = {
  clientId: string;
  buildingClientId: string;
  number: string;
  type: UnitType;
  floor: string;
  entrance: string;
  size: string;
  coOwnershipShare: string;
  constructionYear: string;
  rooms: string;
  planReference: string;
  description: string;
};

export function defaultBuilding(seedStreet: string): LocalBuilding {
  return {
    clientId: newClientId(),
    name: "Building 1",
    street: seedStreet,
    houseNumber: "",
    postalCode: "",
    city: "Berlin",
    description: "",
  };
}

export function defaultUnit(buildingClientId: string): LocalUnit {
  return {
    clientId: newClientId(),
    buildingClientId,
    number: "",
    type: "APARTMENT",
    floor: "",
    entrance: "Main Entrance",
    size: "",
    coOwnershipShare: "",
    constructionYear: "",
    rooms: "",
    planReference: "",
    description: "",
  };
}
