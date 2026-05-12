export type PropertyType = "WEG" | "MV";

export type UnitType = "APARTMENT" | "OFFICE" | "GARDEN" | "PARKING";

export type Manager = {
  id: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
};

export type Accountant = {
  id: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
};

export type PropertyListItem = {
  id: string;
  name: string;
  type: PropertyType;
  buildingIds: string[];
  unitsCount: number;
  rentedUnitsCount: number;
  manager: Pick<Manager, "id" | "fullName">;
  accountant: Pick<Accountant, "id" | "fullName">;
};

export type Contract = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type BuildingSummary = {
  id: string;
  propertyId: string;
  street: string;
  houseNumber: string;
  floors: number | null;
  maxApartments: number | null;
  description: string | null;
  entrances: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { units: number };
};

export type PropertyDetail = {
  id: string;
  name: string;
  type: PropertyType;
  managerId: string;
  accountantId: string;
  createdAt: string;
  updatedAt: string;
  manager: Manager;
  accountant: Accountant;
  buildings: BuildingSummary[];
};

export type UnitWithRelations = {
  id: string;
  buildingId: string;
  contractId: string | null;
  number: string;
  type: UnitType;
  floor: number | null;
  entrance: string | null;
  size: string | number | null;
  coOwnershipShare: string | number | null;
  constructionYear: number | null;
  rooms: number | null;
  createdAt: string;
  updatedAt: string;
  contract: Contract | null;
  building: {
    id: string;
    street: string;
    houseNumber: string;
    propertyId: string;
    property: { id: string; name: string };
  };
};

export type UnitNestedInput = {
  number: string;
  type: UnitType;
  floor?: number;
  entrance?: string;
  size?: number;
  coOwnershipShare?: number;
  constructionYear?: number;
  rooms?: number;
};

export type UnitCreateInput = {
  buildingId: string;
  number: string;
  type: UnitType;
  contractId?: string;
  floor?: number;
  entrance?: string;
  size?: number;
  coOwnershipShare?: number;
  constructionYear?: number;
  rooms?: number;
};

export type BuildingCreateInput = {
  propertyId: string;
  street: string;
  houseNumber: string;
  floors?: number;
  maxApartments?: number;
  description?: string;
  entrances?: string[];
  units?: UnitNestedInput[];
};

export type PropertyCreateInput = {
  name: string;
  type: PropertyType;
  managerId: string;
  accountantId: string;
  buildings?: {
    street: string;
    houseNumber: string;
    floors?: number;
    maxApartments?: number;
    description?: string;
    entrances?: string[];
  }[];
};
