import { parseOptionalInt } from "@/lib/app/unit-helpers";

import type { LocalBuilding } from "./types";

export const MAIN_ENTRANCE_LABEL = "Main Entrance";

export function trimEntranceList(raw: string[]): string[] {
  return raw.map((s) => s.trim()).filter(Boolean);
}

export function entrancesForApi(entrances: string[]): string[] | undefined {
  const t = trimEntranceList(entrances);
  return t.length ? t : undefined;
}

export function maxUnitsCapFromBuilding(b: LocalBuilding): number | undefined {
  const n = parseOptionalInt(b.maxApartments);
  if (n === undefined) return undefined;
  if (n < 0) return undefined;
  return n;
}

export function floorCountCapFromBuilding(b: LocalBuilding): number | undefined {
  const n = parseOptionalInt(b.floors);
  if (n === undefined || n < 1) return undefined;
  return n;
}

export function totalUnitsForBuilding(units: { buildingClientId: string }[], buildingClientId: string): number {
  return units.filter((u) => u.buildingClientId === buildingClientId).length;
}

export function remainingUnitSlots(
  b: LocalBuilding,
  draftCountForBuilding: number,
  persistedCountForBuilding: number,
): number | null {
  const cap = maxUnitsCapFromBuilding(b);
  if (cap === undefined) return null;
  return Math.max(0, cap - persistedCountForBuilding - draftCountForBuilding);
}

export function canAppendOneMoreUnit(
  b: LocalBuilding,
  draftCountForBuilding: number,
  persistedCountForBuilding: number,
): boolean {
  const rem = remainingUnitSlots(b, draftCountForBuilding, persistedCountForBuilding);
  return rem === null || rem > 0;
}

/** When the list is empty, unit entrance is free text defaulting to {MAIN_ENTRANCE_LABEL}. */
export function entranceSelectOptions(b: LocalBuilding): string[] | null {
  const list = trimEntranceList(b.entrances);
  return list.length ? list : null;
}

export function defaultEntranceForNewUnit(b: LocalBuilding): string {
  const opts = entranceSelectOptions(b);
  return opts ? opts[0]! : MAIN_ENTRANCE_LABEL;
}

export function isEntranceAllowedForBuilding(b: LocalBuilding, entrance: string): boolean {
  const opts = entranceSelectOptions(b);
  if (!opts) return true;
  const t = entrance.trim();
  return opts.includes(t);
}

export function isFloorWithinBuildingCap(b: LocalBuilding, floorRaw: string): boolean {
  const cap = floorCountCapFromBuilding(b);
  if (cap === undefined) return true;
  const f = parseOptionalInt(floorRaw);
  if (f === undefined) return true;
  return f >= 1 && f <= cap;
}

export function pickBuildingClientIdForNewUnit(
  buildings: LocalBuilding[],
  units: { buildingClientId: string }[],
  persistedCountByClientId: Record<string, number> = {},
): string | null {
  for (const b of buildings) {
    const draft = totalUnitsForBuilding(units, b.clientId);
    const persisted = persistedCountByClientId[b.clientId] ?? 0;
    const rem = remainingUnitSlots(b, draft, persisted);
    if (rem === null || rem > 0) return b.clientId;
  }
  return null;
}
