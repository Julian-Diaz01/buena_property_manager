import type { UnitType } from "@/lib/api/types";

export const UNIT_TYPE_OPTIONS: { value: UnitType; label: string }[] = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "OFFICE", label: "Office" },
  { value: "GARDEN", label: "Garden" },
  { value: "PARKING", label: "Parking" },
];

export function unitTypeLabel(type: UnitType): string {
  return UNIT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function parseCoOwnershipShare(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const slash = trimmed.split("/");
  if (slash.length === 2) {
    const num = Number(slash[0]);
    const den = Number(slash[1]);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      return num / den;
    }
  }
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function parseOptionalInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
}

export function parseOptionalNumber(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}
