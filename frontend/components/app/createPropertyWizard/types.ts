import type { UnitType } from "@/lib/api/types";

export const INITIAL_LOCAL_BUILDING_CLIENT_ID = "__local-building-initial__";

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
  floors: string;
  maxApartments: string;
  entrances: string[];
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
    clientId: INITIAL_LOCAL_BUILDING_CLIENT_ID,
    name: "Building 1",
    street: seedStreet,
    houseNumber: "",
    postalCode: "",
    city: "Berlin",
    description: "",
    floors: "",
    maxApartments: "",
    entrances: [],
  };
}

export function defaultUnit(buildingClientId: string, building?: LocalBuilding): LocalUnit {
  const entranceList = building?.entrances.map((s) => s.trim()).filter(Boolean) ?? [];
  const entrance = entranceList.length ? entranceList[0]! : "Main Entrance";
  return {
    clientId: newClientId(),
    buildingClientId,
    number: "",
    type: "APARTMENT",
    floor: "",
    entrance,
    size: "",
    coOwnershipShare: "",
    constructionYear: "",
    rooms: "",
    planReference: "",
    description: "",
  };
}
