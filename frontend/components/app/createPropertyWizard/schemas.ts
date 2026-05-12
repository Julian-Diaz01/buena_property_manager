import { z } from "zod";

import type { PropertyType } from "@/lib/api/types";
import { parseCoOwnershipShare, parseOptionalInt, parseOptionalNumber } from "@/lib/app/unit-helpers";

import {
  entranceSelectOptions,
  isEntranceAllowedForBuilding,
  isFloorWithinBuildingCap,
  maxUnitsCapFromBuilding,
} from "./building-rail-helpers";
import type { LocalBuilding, LocalUnit } from "./types";

/** Align with backend `properties.schemas` and `buildings.schemas` / `units.schemas`. */
export const CONSTRUCTION_YEAR_MIN = 1800;
export const CONSTRUCTION_YEAR_MAX = Math.max(2026, new Date().getFullYear());
export const FLOOR_MIN = -10;
export const FLOOR_MAX = 300;

export const step1Schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Property name is required")
    .max(200, "Property name must be at most 200 characters"),
  type: z.enum(["WEG", "MV"]),
  managerId: z.string().trim().min(1, "Select a property manager"),
  accountantId: z.string().trim().min(1, "Select an accountant"),
});

export const BUILDING_FLOORS_CAP_MAX = 300;

export const localBuildingFormSchema = z
  .object({
    clientId: z.string(),
    name: z
      .string()
      .trim()
      .min(1, "Building display name is required")
      .max(100, "Building name must be at most 100 characters"),
    street: z.string().trim().min(1, "Street is required").max(200, "Street must be at most 200 characters"),
    houseNumber: z
      .string()
      .trim()
      .min(1, "House number is required")
      .max(50, "House number must be at most 50 characters"),
    postalCode: z.string().trim().min(1, "Postal code is required").max(20, "Postal code is too long"),
    city: z.string().trim().min(1, "City is required").max(100, "City must be at most 100 characters"),
    description: z.string().max(1000, "Notes must be at most 1000 characters"),
    floors: z.string(),
    maxApartments: z.string(),
    entrances: z.array(z.string()),
  })
  .superRefine((b, ctx) => {
    const locationLine = [b.postalCode.trim(), b.city.trim()].filter(Boolean).join(" ");
    const combined = [b.description.trim(), locationLine].filter(Boolean).join(" — ");
    if (combined.length > 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message:
          "Notes plus postal code and city (sent as building description) must total at most 1000 characters.",
      });
    }

    if (b.floors.trim()) {
      const n = parseOptionalInt(b.floors);
      if (n === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["floors"], message: "Floors must be a whole number." });
      } else if (n < 1 || n > BUILDING_FLOORS_CAP_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["floors"],
          message: `Floors must be between 1 and ${BUILDING_FLOORS_CAP_MAX}.`,
        });
      }
    }

    if (b.maxApartments.trim()) {
      const n = parseOptionalInt(b.maxApartments);
      if (n === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxApartments"],
          message: "Max units must be a whole number.",
        });
      } else if (n < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxApartments"],
          message: "Max units cannot be negative.",
        });
      }
    }

    for (let i = 0; i < b.entrances.length; i += 1) {
      const line = b.entrances[i]?.trim() ?? "";
      if (line.length > 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["entrances"],
          message: `Entrance ${i + 1} must be at most 50 characters.`,
        });
        break;
      }
    }
  });

export const buildingsStepSchema = z.array(localBuildingFormSchema).min(1, "Add at least one building.");

const unitTypeSchema = z.enum(["APARTMENT", "OFFICE", "GARDEN", "PARKING"]);

export const localUnitFormSchema = z
  .object({
    clientId: z.string(),
    buildingClientId: z.string().min(1, "Select a building"),
    number: z
      .string()
      .trim()
      .min(1, "Unit number is required")
      .max(100, "Unit number must be at most 100 characters"),
    type: unitTypeSchema,
    floor: z.string(),
    entrance: z.string(),
    size: z.string(),
    coOwnershipShare: z.string(),
    constructionYear: z.string(),
    rooms: z.string(),
    planReference: z.string(),
    description: z.string(),
  })
  .superRefine((u, ctx) => {
    if (u.floor.trim()) {
      const n = parseOptionalInt(u.floor);
      if (n === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["floor"], message: "Floor must be a whole number." });
      } else if (n < FLOOR_MIN || n > FLOOR_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["floor"],
          message: `Floor must be between ${FLOOR_MIN} and ${FLOOR_MAX}.`,
        });
      }
    }

    const entrance = u.entrance.trim();
    if (entrance.length > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entrance"],
        message: "Entrance must be at most 50 characters.",
      });
    }

    if (u.size.trim()) {
      const n = parseOptionalNumber(u.size);
      if (n === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["size"], message: "Size must be a valid number." });
      } else if (n < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["size"], message: "Size cannot be negative." });
      }
    }

    if (u.coOwnershipShare.trim()) {
      const p = parseCoOwnershipShare(u.coOwnershipShare);
      if (p === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["coOwnershipShare"],
          message: "MEA must be a non-negative decimal or a fraction like 100/1000.",
        });
      } else if (p < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["coOwnershipShare"],
          message: "MEA cannot be negative.",
        });
      }
    }

    if (u.constructionYear.trim()) {
      const y = parseOptionalInt(u.constructionYear);
      if (y === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["constructionYear"],
          message: "Construction year must be a whole number.",
        });
      } else if (y < CONSTRUCTION_YEAR_MIN || y > CONSTRUCTION_YEAR_MAX) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["constructionYear"],
          message: `Construction year must be between ${CONSTRUCTION_YEAR_MIN} and ${CONSTRUCTION_YEAR_MAX}.`,
        });
      }
    }

    if (u.rooms.trim()) {
      const r = parseOptionalInt(u.rooms);
      if (r === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rooms"], message: "Rooms must be a whole number." });
      } else if (r < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["rooms"], message: "Rooms cannot be negative." });
      }
    }
  });

export function unitsStepSchema(
  validBuildingClientIds: Set<string>,
  buildings: LocalBuilding[],
  persistedUnitCountByBuildingClientId: Record<string, number> = {},
) {
  const byId = new Map(buildings.map((b) => [b.clientId, b] as const));
  return z
    .array(localUnitFormSchema)
    .min(1, "Add at least one unit.")
    .superRefine((arr, ctx) => {
      arr.forEach((u, i) => {
        if (!validBuildingClientIds.has(u.buildingClientId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, "buildingClientId"],
            message: "Each unit must belong to one of the buildings on this property.",
          });
        }
      });

      for (const b of buildings) {
        const cap = maxUnitsCapFromBuilding(b);
        if (cap === undefined) continue;
        const draft = arr.filter((u) => u.buildingClientId === b.clientId).length;
        const persisted = persistedUnitCountByBuildingClientId[b.clientId] ?? 0;
        if (draft + persisted > cap) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [],
            message: `Building “${b.name.trim() || "Building"}” exceeds its max units limit (${cap}, including saved units).`,
          });
        }
      }

      arr.forEach((u, i) => {
        const b = byId.get(u.buildingClientId);
        if (!b) return;
        if (u.floor.trim() && !isFloorWithinBuildingCap(b, u.floor)) {
          const fc = parseOptionalInt(b.floors);
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, "floor"],
            message:
              fc !== undefined
                ? `Floor must be between 1 and ${fc} for this building (set on the building).`
                : "Floor is outside the allowed range for this building.",
          });
        }
        if (u.entrance.trim() && !isEntranceAllowedForBuilding(b, u.entrance)) {
          const opts = entranceSelectOptions(b);
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, "entrance"],
            message: opts?.length
              ? `Entrance must be one of: ${opts.join(", ")}.`
              : "Entrance is not allowed for this building.",
          });
        }
      });
    });
}

export type Step1FieldErrors = Partial<Record<"name" | "type" | "managerId" | "accountantId", string>>;

export type BuildingFieldErrors = Partial<
  Record<
    | "name"
    | "street"
    | "houseNumber"
    | "postalCode"
    | "city"
    | "description"
    | "floors"
    | "maxApartments"
    | "entrances",
    string
  >
>;

export type UnitFieldErrors = Partial<
  Record<
    | "number"
    | "type"
    | "buildingClientId"
    | "floor"
    | "entrance"
    | "size"
    | "coOwnershipShare"
    | "constructionYear"
    | "rooms",
    string
  >
>;

export function mapStep1Issues(error: z.ZodError): Step1FieldErrors {
  const out: Step1FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "name" || key === "type" || key === "managerId" || key === "accountantId") {
      if (!out[key]) out[key] = issue.message;
    }
  }
  return out;
}

export function mapArrayIssuesByClientId<T extends { clientId: string }>(
  error: z.ZodError,
  rows: T[],
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const issue of error.issues) {
    const idx = issue.path[0];
    const field = issue.path[1];
    if (typeof idx !== "number" || typeof field !== "string") continue;
    const row = rows[idx];
    if (!row) continue;
    const id = row.clientId;
    if (!out[id]) out[id] = {};
    if (!out[id][field]) out[id][field] = issue.message;
  }
  return out;
}

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Validation failed.";
}

export function summarizeIssues(error: z.ZodError, max = 8): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const issue of error.issues) {
    const path = issue.path.length ? issue.path.map(String).join(".") : "form";
    const line = `${path}: ${issue.message}`;
    if (seen.has(line)) continue;
    seen.add(line);
    lines.push(line);
    if (lines.length >= max) break;
  }
  if (error.issues.length > max) {
    lines.push(`…and ${error.issues.length - max} more.`);
  }
  return lines.join("\n");
}

export type Step1BlurField = "name" | "type" | "managerId" | "accountantId";

export function validateStep1Field(
  field: Step1BlurField,
  values: { name: string; type: PropertyType; managerId: string; accountantId: string },
) {
  if (field === "name") return step1Schema.pick({ name: true }).safeParse({ name: values.name });
  if (field === "type") return step1Schema.pick({ type: true }).safeParse({ type: values.type });
  if (field === "managerId") return step1Schema.pick({ managerId: true }).safeParse({ managerId: values.managerId });
  return step1Schema.pick({ accountantId: true }).safeParse({ accountantId: values.accountantId });
}

/** Map Zod issues whose first path segment is a field name (single-object schemas). */
export function mapFlatZodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = issue.path[0];
    if (typeof k === "string" && out[k] === undefined) out[k] = issue.message;
  }
  return out;
}

export function parseSingleBuilding(b: LocalBuilding) {
  return localBuildingFormSchema.safeParse(b);
}

export function validateSingleUnit(u: LocalUnit, buildings: LocalBuilding[]) {
  const parsed = localUnitFormSchema.safeParse(u);
  if (!parsed.success) {
    return { ok: false as const, fieldErrors: mapFlatZodFieldErrors(parsed.error) as UnitFieldErrors };
  }
  const ids = new Set(buildings.map((b) => b.clientId));
  if (!ids.has(u.buildingClientId)) {
    return {
      ok: false as const,
      fieldErrors: {
        buildingClientId: "Each unit must belong to one of the buildings on this property.",
      } satisfies UnitFieldErrors,
    };
  }
  const b = buildings.find((x) => x.clientId === u.buildingClientId);
  const fieldErrors: UnitFieldErrors = {};
  if (b && u.floor.trim() && !isFloorWithinBuildingCap(b, u.floor)) {
    const fc = parseOptionalInt(b.floors);
    fieldErrors.floor =
      fc !== undefined
        ? `Floor must be between 1 and ${fc} for this building (set on the building).`
        : "Floor is outside the allowed range for this building.";
  }
  if (b && u.entrance.trim() && !isEntranceAllowedForBuilding(b, u.entrance)) {
    const opts = entranceSelectOptions(b);
    fieldErrors.entrance = opts?.length
      ? `Entrance must be one of: ${opts.join(", ")}.`
      : "Entrance is not allowed for this building.";
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false as const, fieldErrors };
  }
  return { ok: true as const, fieldErrors: {} as UnitFieldErrors };
}

export function parseStep1(values: {
  name: string;
  type: PropertyType;
  managerId: string;
  accountantId: string;
}) {
  return step1Schema.safeParse(values);
}

export function parseBuildingsStep(buildings: LocalBuilding[]) {
  return buildingsStepSchema.safeParse(buildings);
}

export function parseUnitsStep(
  units: LocalUnit[],
  buildings: LocalBuilding[],
  persistedUnitCountByBuildingClientId: Record<string, number> = {},
) {
  const ids = new Set(buildings.map((b) => b.clientId));
  return unitsStepSchema(ids, buildings, persistedUnitCountByBuildingClientId).safeParse(units);
}
