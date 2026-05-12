import type { UnitCreateInput, UnitNestedInput } from "@/lib/api/types";
import { parseCoOwnershipShare, parseOptionalInt, parseOptionalNumber } from "@/lib/app/unit-helpers";

import type { LocalUnit } from "./types";

/** Maps wizard row → nested payload for createBuilding (same as wizard submit). */
export function localUnitToNestedInput(u: LocalUnit): UnitNestedInput {
  const nested: UnitNestedInput = {
    number: u.number.trim(),
    type: u.type,
    floor: parseOptionalInt(u.floor),
    entrance: u.entrance.trim() || undefined,
    size: parseOptionalNumber(u.size),
    coOwnershipShare: parseCoOwnershipShare(u.coOwnershipShare),
    constructionYear: parseOptionalInt(u.constructionYear),
    rooms: parseOptionalInt(u.rooms),
  };
  return nested;
}

/** Maps wizard row → POST /api/units body for an existing building id. */
export function localUnitToCreateInput(apiBuildingId: string, u: LocalUnit): UnitCreateInput {
  const base: UnitCreateInput = {
    buildingId: apiBuildingId,
    number: u.number.trim(),
    type: u.type,
  };
  const floor = parseOptionalInt(u.floor);
  if (floor !== undefined) base.floor = floor;
  const entrance = u.entrance.trim();
  if (entrance) base.entrance = entrance;
  const size = parseOptionalNumber(u.size);
  if (size !== undefined) base.size = size;
  const co = parseCoOwnershipShare(u.coOwnershipShare);
  if (co !== undefined) base.coOwnershipShare = co;
  const cy = parseOptionalInt(u.constructionYear);
  if (cy !== undefined) base.constructionYear = cy;
  const rooms = parseOptionalInt(u.rooms);
  if (rooms !== undefined) base.rooms = rooms;
  return base;
}
