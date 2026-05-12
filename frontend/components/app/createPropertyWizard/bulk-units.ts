import type { UnitType } from "@/lib/api/types";

import { floorCountCapFromBuilding, isFloorWithinBuildingCap, maxUnitsCapFromBuilding } from "./building-rail-helpers";
import { newClientId, type LocalBuilding, type LocalUnit } from "./types";

export type BulkGenerateParams = {
  buildingClientId: string;
  /** Building row for rails (optional if unknown). */
  building: LocalBuilding | undefined;
  /** Draft units already in the form for this building. */
  draftUnitsForBuilding: number;
  /** Units already saved in the backend for this building (e.g. building page). */
  persistedUnitsForBuilding: number;
  bulkFloorStart: string;
  bulkFloorEnd: string;
  bulkUnitsPerFloor: string;
  bulkUnitType: UnitType;
};

/** Same rules as CreatePropertyWizard bulk generation — returns new rows to append. */
export function generateBulkLocalUnits(
  p: BulkGenerateParams,
): { ok: true; units: LocalUnit[] } | { ok: false; error: string } {
  const start = Number.parseInt(p.bulkFloorStart, 10);
  const end = Number.parseInt(p.bulkFloorEnd, 10);
  const per = Number.parseInt(p.bulkUnitsPerFloor, 10);
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(per)) {
    return { ok: false, error: "Bulk generation: enter valid numbers for floors and units per floor." };
  }
  if (start > end) {
    return { ok: false, error: "Floor start must be less than or equal to floor end." };
  }
  if (!p.buildingClientId) {
    return { ok: false, error: "Select a building for bulk generation." };
  }

  const b = p.building;
  const floorCap = b ? floorCountCapFromBuilding(b) : undefined;
  if (floorCap !== undefined) {
    if (!isFloorWithinBuildingCap(b!, String(start)) || !isFloorWithinBuildingCap(b!, String(end))) {
      return {
        ok: false,
        error: `Bulk generation: floors must be between 1 and ${floorCap} for this building.`,
      };
    }
  }

  const planned = (end - start + 1) * per;
  const cap = b ? maxUnitsCapFromBuilding(b) : undefined;
  const already = p.draftUnitsForBuilding + p.persistedUnitsForBuilding;
  if (cap !== undefined) {
    const room = cap - already;
    if (room <= 0) {
      return { ok: false, error: "This building is already at its max units limit." };
    }
    if (planned > room) {
      return {
        ok: false,
        error: `Bulk generation would create ${planned} units but only ${room} slot(s) remain for this building (max ${cap}).`,
      };
    }
  }

  const created: LocalUnit[] = [];
  for (let floor = start; floor <= end; floor += 1) {
    for (let i = 0; i < per; i += 1) {
      created.push({
        clientId: newClientId(),
        buildingClientId: p.buildingClientId,
        number: "",
        type: p.bulkUnitType,
        floor: String(floor),
        entrance: "",
        size: "",
        coOwnershipShare: "",
        constructionYear: "",
        rooms: "",
        planReference: "",
        description: "",
      });
    }
  }
  return { ok: true, units: created };
}
