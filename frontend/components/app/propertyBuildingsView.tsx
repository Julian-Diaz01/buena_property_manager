"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepBuildings } from "@/components/app/createPropertyWizard/stepBuildings";
import {
  firstIssueMessage,
  mapArrayIssuesByClientId,
  mapFlatZodFieldErrors,
  parseBuildingsStep,
  parseSingleBuilding,
  type BuildingFieldErrors,
} from "@/components/app/createPropertyWizard/schemas";
import { defaultBuilding, type LocalBuilding } from "@/components/app/createPropertyWizard/types";
import { createBuilding } from "@/lib/api/buildings";
import { getProperty } from "@/lib/api/properties";
import { listUnits } from "@/lib/api/units";
import { queryKeys } from "@/lib/api/query-keys";
import type { BuildingSummary } from "@/lib/api/types";
import { parseOptionalInt } from "@/lib/app/unit-helpers";

import { entrancesForApi } from "@/components/app/createPropertyWizard/building-rail-helpers";
import { ShortcutActionLabel } from "@/components/app/shortcutActionLabel";
import { useAltKeyAction } from "@/lib/app/use-alt-key-action";

type PropertyBuildingsViewProps = {
  propertyId: string;
};

export function PropertyBuildingsView({ propertyId }: PropertyBuildingsViewProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [dialogBuildings, setDialogBuildings] = useState<LocalBuilding[]>([]);
  const [buildingFieldErrors, setBuildingFieldErrors] = useState<Record<string, BuildingFieldErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const propertyQuery = useQuery({
    queryKey: queryKeys.property(propertyId),
    queryFn: () => getProperty(propertyId),
  });

  const buildingIds = useMemo(
    () => propertyQuery.data?.buildings.map((b) => b.id) ?? [],
    [propertyQuery.data?.buildings],
  );

  const unitsQueries = useQueries({
    queries: buildingIds.map((buildingId) => ({
      queryKey: queryKeys.units(buildingId),
      queryFn: () => listUnits({ buildingId }),
      enabled: Boolean(propertyQuery.data) && buildingIds.length > 0,
    })),
  });

  const unitsByBuildingIndex = useMemo(() => {
    return unitsQueries.map((q) => q.data ?? []);
  }, [unitsQueries]);

  const isUnitsLoading = unitsQueries.some((q) => q.isLoading);

  const createBuildingMutation = useMutation({
    mutationFn: async () => {
      const b = dialogBuildings[0];
      if (!b) throw new Error("No building data");
      const locationLine = [b.postalCode.trim(), b.city.trim()].filter(Boolean).join(" ");
      const descriptionParts = [b.description.trim(), locationLine].filter(Boolean);
      const floors = parseOptionalInt(b.floors);
      const maxApartments = parseOptionalInt(b.maxApartments);
      const entrancesPayload = entrancesForApi(b.entrances);
      await createBuilding({
        propertyId,
        street: b.street.trim(),
        houseNumber: b.houseNumber.trim(),
        description: descriptionParts.length ? descriptionParts.join(" — ") : undefined,
        ...(floors !== undefined ? { floors } : {}),
        ...(maxApartments !== undefined ? { maxApartments } : {}),
        ...(entrancesPayload ? { entrances: entrancesPayload } : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      setAddOpen(false);
      setDialogBuildings([]);
      setBuildingFieldErrors({});
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const openAddDialog = useCallback(() => {
    const seed = propertyQuery.data?.buildings[0]?.street ?? "";
    setDialogBuildings([defaultBuilding(seed)]);
    setBuildingFieldErrors({});
    setFormError(null);
    setAddOpen(true);
  }, [propertyQuery.data?.buildings]);

  useAltKeyAction(!addOpen, "KeyB", openAddDialog);

  const updateDialogBuilding = useCallback((clientId: string, patch: Partial<LocalBuilding>) => {
    setBuildingFieldErrors((prev) => {
      const row = prev[clientId];
      if (!row) return prev;
      const nextRow: Partial<Record<string, string>> = { ...row };
      for (const k of Object.keys(patch) as (keyof LocalBuilding)[]) {
        if (k in nextRow) delete nextRow[k as string];
      }
      if (Object.keys(nextRow).length === 0) {
        if (!(clientId in prev)) return prev;
        const next = { ...prev };
        delete next[clientId];
        return next;
      }
      return { ...prev, [clientId]: nextRow };
    });
    setDialogBuildings((prev) => prev.map((b) => (b.clientId === clientId ? { ...b, ...patch } : b)));
  }, []);

  const handleBuildingBlur = useCallback(
    (clientId: string) => {
      const b = dialogBuildings.find((x) => x.clientId === clientId);
      if (!b) return;
      const r = parseSingleBuilding(b);
      setBuildingFieldErrors((prev) => {
        if (r.success) {
          if (!(clientId in prev)) return prev;
          const next = { ...prev };
          delete next[clientId];
          return next;
        }
        return { ...prev, [clientId]: mapFlatZodFieldErrors(r.error) as BuildingFieldErrors };
      });
    },
    [dialogBuildings],
  );

  const handleSaveNewBuilding = useCallback(() => {
    setFormError(null);
    const r = parseBuildingsStep(dialogBuildings);
    if (!r.success) {
      setBuildingFieldErrors(
        mapArrayIssuesByClientId(r.error, dialogBuildings) as unknown as Record<string, BuildingFieldErrors>,
      );
      setFormError(firstIssueMessage(r.error));
      return;
    }
    setBuildingFieldErrors({});
    createBuildingMutation.mutate();
  }, [dialogBuildings, createBuildingMutation]);

  if (propertyQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[12rem] items-center justify-center text-sm">
        Loading property…
      </div>
    );
  }

  if (propertyQuery.isError || !propertyQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load property</AlertTitle>
        <AlertDescription>
          {propertyQuery.error instanceof Error ? propertyQuery.error.message : "Unknown error"}
        </AlertDescription>
      </Alert>
    );
  }

  const property = propertyQuery.data;
  const buildings = property.buildings;

  const totalUnits = buildings.reduce((sum, b) => sum + (b._count?.units ?? 0), 0);

  const rowForBuilding = (building: BuildingSummary, index: number) => {
    const units = unitsByBuildingIndex[index] ?? [];
    const unitTotal = building._count?.units ?? units.length;
    const occupied = units.filter((u) => u.contractId !== null).length;
    const address = `${building.street} ${building.houseNumber}`;
    return { building, unitTotal, occupied, address };
  };

  return (
    <div className="space-y-8">
      <nav className="text-muted-foreground mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/" className="hover:text-foreground">
          Properties
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground font-medium">{property.name}</span>
      </nav>

      <div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">Buildings - {property.name}</h2>
              <Badge variant="outline">{property.type}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {buildings.length} {buildings.length === 1 ? "building" : "buildings"} · {totalUnits} total units
            </p>
          </div>
        </div>
      </div>

      {isUnitsLoading ? (
        <p className="text-muted-foreground text-sm">Loading occupancy…</p>
      ) : null}

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 border-border border-b text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Building</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Units</th>
              <th className="px-4 py-3 font-medium">Occupancy</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {buildings.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground px-4 py-10 text-center">
                  No buildings yet. Add a building to start adding units.
                </td>
              </tr>
            ) : (
              buildings.map((building, index) => {
                const { unitTotal, occupied, address } = rowForBuilding(building, index);
                const full = unitTotal > 0 && occupied === unitTotal;
                const displayName = building.description?.trim() || address;
                return (
                  <tr key={building.id} className="border-border hover:bg-muted/20 border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                          <Building2 className="text-muted-foreground h-5 w-5" />
                        </div>
                        <span className="font-medium">{displayName}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">{address}</td>
                    <td className="text-muted-foreground px-4 py-3">—</td>
                    <td className="text-muted-foreground px-4 py-3">
                      {unitTotal} {unitTotal === 1 ? "unit" : "units"}
                    </td>
                    <td className="px-4 py-3">
                      {unitTotal === 0 ? (
                        <Badge variant="outline" className="text-muted-foreground border-dashed">
                          No units
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {occupied}/{unitTotal}
                          </span>
                          {full ? (
                            <Badge className="border-0 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-100">
                              Full
                            </Badge>
                          ) : (
                            <Badge className="border-0 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100">
                              Available
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/properties/${propertyId}/buildings/${building.id}`}>View units</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {addOpen ? (
        <Card
          className="fixed inset-0 z-50 m-auto flex max-h-[min(90vh,calc(100%-2rem))] w-[min(40rem,calc(100%-2rem))] flex-col p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold">Add building</h3>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <StepBuildings
              variant="single"
              buildings={dialogBuildings}
              fieldErrors={buildingFieldErrors}
              onBuildingBlur={handleBuildingBlur}
              onUpdateBuilding={updateDialogBuilding}
              onDuplicateBuilding={() => {}}
              onRemoveBuilding={() => {}}
              onAddBuilding={() => {}}
            />
          </div>
          {formError ? <p className="text-destructive mt-3 text-sm">{formError}</p> : null}
          <div className="mt-6 flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setDialogBuildings([]);
                setFormError(null);
                setBuildingFieldErrors({});
              }}
            >
              Cancel
            </Button>
            <Button type="button" disabled={createBuildingMutation.isPending} onClick={handleSaveNewBuilding}>
              {createBuildingMutation.isPending ? "Saving…" : "Save building"}
            </Button>
          </div>
        </Card>
      ) : null}
      {addOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40"
          aria-label="Close dialog"
          onClick={() => {
            setAddOpen(false);
            setDialogBuildings([]);
            setFormError(null);
            setBuildingFieldErrors({});
          }}
        />
      ) : null}
    </div>
  );
}
