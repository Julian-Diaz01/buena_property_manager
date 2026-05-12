"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserPlus } from "lucide-react";

import { canAppendOneMoreUnit, totalUnitsForBuilding } from "@/components/app/createPropertyWizard/building-rail-helpers";
import { generateBulkLocalUnits } from "@/components/app/createPropertyWizard/bulk-units";
import { StepUnits } from "@/components/app/createPropertyWizard/stepUnits";
import { localUnitToCreateInput } from "@/components/app/createPropertyWizard/local-unit-mappers";
import {
  mapArrayIssuesByClientId,
  parseUnitsStep,
  summarizeIssues,
  validateSingleUnit,
  type UnitFieldErrors,
} from "@/components/app/createPropertyWizard/schemas";
import { useWizardKeyboardShortcuts } from "@/components/app/createPropertyWizard/use-wizard-keyboard-shortcuts";
import { defaultUnit, newClientId, type LocalBuilding, type LocalUnit } from "@/components/app/createPropertyWizard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAndAssignContract, removeContractFromUnit } from "@/lib/api/contracts";
import { getProperty } from "@/lib/api/properties";
import { createUnit, listUnits } from "@/lib/api/units";
import { queryKeys } from "@/lib/api/query-keys";
import type { UnitType } from "@/lib/api/types";
import { unitTypeLabel } from "@/lib/app/unit-helpers";

type BuildingUnitsViewProps = {
  propertyId: string;
  buildingId: string;
};

const RENT_PLACEHOLDER = "—";

/** Synthetic client id — all draft units belong to the building page context. */
const CONTEXT_BUILDING_CLIENT_ID = "__context_building__";

const noop = () => {};

export function BuildingUnitsView({ propertyId, buildingId }: BuildingUnitsViewProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [contractForUnitId, setContractForUnitId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");

  const [units, setUnits] = useState<LocalUnit[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkFloorStart, setBulkFloorStart] = useState("1");
  const [bulkFloorEnd, setBulkFloorEnd] = useState("3");
  const [bulkUnitsPerFloor, setBulkUnitsPerFloor] = useState("2");
  const [bulkUnitType, setBulkUnitType] = useState<UnitType>("APARTMENT");
  const [unitFieldErrors, setUnitFieldErrors] = useState<Record<string, UnitFieldErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const propertyQuery = useQuery({
    queryKey: queryKeys.property(propertyId),
    queryFn: () => getProperty(propertyId),
  });

  const unitsQuery = useQuery({
    queryKey: queryKeys.units(buildingId),
    queryFn: () => listUnits({ buildingId }),
    enabled: Boolean(propertyQuery.data?.buildings.some((b) => b.id === buildingId)),
  });

  const building = useMemo(() => {
    return propertyQuery.data?.buildings.find((b) => b.id === buildingId);
  }, [propertyQuery.data?.buildings, buildingId]);

  const buildingLabel = building ? `${building.street} ${building.houseNumber}` : "Building";

  const localBuildingsForStep = useMemo((): LocalBuilding[] => {
    if (!building) return [];
    return [
      {
        clientId: CONTEXT_BUILDING_CLIENT_ID,
        name: buildingLabel,
        street: building.street,
        houseNumber: building.houseNumber,
        postalCode: "",
        city: "Berlin",
        description: building.description ?? "",
        floors: building.floors != null ? String(building.floors) : "",
        maxApartments: building.maxApartments != null ? String(building.maxApartments) : "",
        entrances: building.entrances?.length ? [...building.entrances] : [],
      },
    ];
  }, [building, buildingLabel]);

  const canAddSingleUnit = useMemo(() => {
    const b = localBuildingsForStep[0];
    if (!b) return false;
    const draft = totalUnitsForBuilding(units, CONTEXT_BUILDING_CLIENT_ID);
    const live = unitsQuery.data?.length ?? 0;
    return canAppendOneMoreUnit(b, draft, live);
  }, [localBuildingsForStep, units, unitsQuery.data?.length]);

  const removeContractMutation = useMutation({
    mutationFn: (unitId: string) => removeContractFromUnit(unitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.units(buildingId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.properties });
    },
  });

  const assignContractMutation = useMutation({
    mutationFn: ({ unitId, name }: { unitId: string; name: string }) =>
      createAndAssignContract(unitId, { name }),
    onSuccess: async (_data, { unitId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.units(buildingId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      setContractForUnitId(null);
      setTenantName("");
      router.push(`/tenancies/${unitId}`);
    },
  });

  const { mutate: persistDraftUnits, isPending: isSavingDraftUnits } = useMutation({
    mutationFn: async (rows: LocalUnit[]) => {
      for (const u of rows) {
        await createUnit(localUnitToCreateInput(buildingId, u));
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.units(buildingId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      setAddOpen(false);
      resetAddDialog();
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const resetAddDialog = useCallback(() => {
    setUnits([]);
    setExpandedUnits(new Set());
    setBulkMode(false);
    setBulkFloorStart("1");
    setBulkFloorEnd("3");
    setBulkUnitsPerFloor("2");
    setBulkUnitType("APARTMENT");
    setUnitFieldErrors({});
    setFormError(null);
  }, []);

  const openAddDialog = useCallback(() => {
    resetAddDialog();
    setAddOpen(true);
  }, [resetAddDialog]);

  const addUnit = useCallback(() => {
    setUnitFieldErrors({});
    const b = localBuildingsForStep[0];
    if (!b) return;
    const live = unitsQuery.data?.length ?? 0;
    setUnits((prev) => {
      const draft = totalUnitsForBuilding(prev, CONTEXT_BUILDING_CLIENT_ID);
      if (!canAppendOneMoreUnit(b, draft, live)) return prev;
      return [...prev, defaultUnit(CONTEXT_BUILDING_CLIENT_ID, b)];
    });
    setBulkMode(false);
  }, [localBuildingsForStep, unitsQuery.data?.length]);

  const duplicateLastUnit = useCallback(() => {
    setUnits((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      const b = localBuildingsForStep.find((x) => x.clientId === last.buildingClientId);
      const countForB = totalUnitsForBuilding(prev, last.buildingClientId);
      const live = unitsQuery.data?.length ?? 0;
      if (b && !canAppendOneMoreUnit(b, countForB, live)) return prev;
      return [
        ...prev,
        {
          ...last,
          clientId: newClientId(),
          number: "",
        },
      ];
    });
  }, [localBuildingsForStep, unitsQuery.data?.length]);

  useWizardKeyboardShortcuts(addOpen, "units", noop, noop, addUnit, duplicateLastUnit);

  const removeUnit = useCallback((clientId: string) => {
    setUnitFieldErrors((prev) => {
      if (!(clientId in prev)) return prev;
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
    setUnits((prev) => prev.filter((u) => u.clientId !== clientId));
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      next.delete(clientId);
      return next;
    });
  }, []);

  const updateUnit = useCallback((clientId: string, patch: Partial<LocalUnit>) => {
    setUnitFieldErrors((prev) => {
      const row = prev[clientId];
      if (!row) return prev;
      const nextRow: Partial<Record<string, string>> = { ...row };
      for (const k of Object.keys(patch) as (keyof LocalUnit)[]) {
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
    setUnits((prev) => prev.map((u) => (u.clientId === clientId ? { ...u, ...patch } : u)));
  }, []);

  const toggleExpandUnit = useCallback((clientId: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }, []);

  const handleUnitBlur = useCallback(
    (clientId: string) => {
      const u = units.find((x) => x.clientId === clientId);
      if (!u) return;
      const r = validateSingleUnit(u, localBuildingsForStep);
      setUnitFieldErrors((prev) => {
        if (r.ok) {
          if (!(clientId in prev)) return prev;
          const next = { ...prev };
          delete next[clientId];
          return next;
        }
        return { ...prev, [clientId]: r.fieldErrors };
      });
    },
    [units, localBuildingsForStep],
  );

  const onGenerateBulkUnits = useCallback(() => {
    const b = localBuildingsForStep[0];
    const draftForB = totalUnitsForBuilding(units, CONTEXT_BUILDING_CLIENT_ID);
    const live = unitsQuery.data?.length ?? 0;
    const res = generateBulkLocalUnits({
      buildingClientId: CONTEXT_BUILDING_CLIENT_ID,
      building: b,
      draftUnitsForBuilding: draftForB,
      persistedUnitsForBuilding: live,
      bulkFloorStart,
      bulkFloorEnd,
      bulkUnitsPerFloor,
      bulkUnitType,
    });
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setUnits((prev) => [...prev, ...res.units]);
    setBulkMode(false);
    setFormError(null);
    setUnitFieldErrors({});
  }, [
    bulkFloorEnd,
    bulkFloorStart,
    bulkUnitType,
    bulkUnitsPerFloor,
    localBuildingsForStep,
    units,
    unitsQuery.data?.length,
  ]);

  const handleSaveDraftUnits = useCallback(() => {
    setFormError(null);
    const s3 = parseUnitsStep(units, localBuildingsForStep, {
      [CONTEXT_BUILDING_CLIENT_ID]: unitsQuery.data?.length ?? 0,
    });
    if (!s3.success) {
      const byClient = mapArrayIssuesByClientId(s3.error, units) as Record<string, UnitFieldErrors>;
      setUnitFieldErrors(byClient);
      setExpandedUnits((prev) => {
        const next = new Set(prev);
        for (const id of Object.keys(byClient)) next.add(id);
        return next;
      });
      setFormError(summarizeIssues(s3.error, 8));
      return;
    }
    setUnitFieldErrors({});
    persistDraftUnits(units);
  }, [units, localBuildingsForStep, persistDraftUnits, unitsQuery.data?.length]);

  if (propertyQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[12rem] items-center justify-center text-sm">
        Loading…
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

  if (!building) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Building not found</AlertTitle>
        <AlertDescription>This building does not belong to this property.</AlertDescription>
      </Alert>
    );
  }

  const property = propertyQuery.data;
  const liveUnits = unitsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <nav className="text-muted-foreground mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href="/" className="hover:text-foreground">
          Properties
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/properties/${propertyId}`} className="hover:text-foreground">
          {property.name}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground font-medium">{buildingLabel}</span>
      </nav>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Units - {buildingLabel}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {liveUnits.length} {liveUnits.length === 1 ? "unit" : "units"}
          </p>
        </div>
        <Button type="button" className="shrink-0" onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add new unit
        </Button>
      </div>

      {unitsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading units…</p>
      ) : null}

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 border-border border-b text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Floor</th>
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Monthly rent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {liveUnits.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                  No units in this building yet. Use Add new unit to create one or bulk-create in the dialog.
                </td>
              </tr>
            ) : (
              liveUnits.map((unit) => {
                const occupied = Boolean(unit.contractId);
                return (
                  <tr key={unit.id} className="border-border hover:bg-muted/20 border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{unit.number}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-normal">
                        {unitTypeLabel(unit.type)}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">{unit.floor ?? "—"}</td>
                    <td className="text-muted-foreground px-4 py-3">{unit.contract?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{RENT_PLACEHOLDER}</td>
                    <td className="px-4 py-3">
                      {occupied ? (
                        <Badge className="border-0 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-100">
                          Occupied
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Vacant</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {occupied ? (
                          <>
                            <Button asChild variant="outline" size="sm" className="shrink-0">
                              <Link href={`/tenancies/${unit.id}`}>View tenancy</Link>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                              disabled={removeContractMutation.isPending}
                              onClick={() => removeContractMutation.mutate(unit.id)}
                            >
                              Remove contract
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="shrink-0"
                            disabled={
                              assignContractMutation.isPending &&
                              assignContractMutation.variables?.unitId === unit.id
                            }
                            onClick={() => {
                              setTenantName("");
                              setContractForUnitId(unit.id);
                            }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add tenant
                          </Button>
                        )}
                      </div>
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
          className="border-border fixed inset-0 z-50 m-auto flex max-h-[min(92vh,calc(100%-1rem))] w-[min(56rem,calc(100%-1rem))] flex-col border p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold">Add units</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Same layout as the create-property wizard (step 3): single units, bulk generate, then save all to this
            building.
          </p>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <StepUnits
              singleBuildingContext
              buildings={localBuildingsForStep}
              units={units}
              unitFieldErrors={unitFieldErrors}
              expandedUnits={expandedUnits}
              bulkMode={bulkMode}
              onBulkModeChange={setBulkMode}
              bulkFloorStart={bulkFloorStart}
              onBulkFloorStartChange={setBulkFloorStart}
              bulkFloorEnd={bulkFloorEnd}
              onBulkFloorEndChange={setBulkFloorEnd}
              bulkUnitsPerFloor={bulkUnitsPerFloor}
              onBulkUnitsPerFloorChange={setBulkUnitsPerFloor}
              bulkUnitType={bulkUnitType}
              onBulkUnitTypeChange={setBulkUnitType}
              resolvedBulkBuildingId={CONTEXT_BUILDING_CLIENT_ID}
              onBulkBuildingIdChange={() => {}}
              onGenerateBulkUnits={onGenerateBulkUnits}
              onToggleExpandUnit={toggleExpandUnit}
              onUpdateUnit={updateUnit}
              onRemoveUnit={removeUnit}
              onAddUnit={addUnit}
              onUnitBlur={handleUnitBlur}
              persistedUnitCountByBuildingClientId={{ [CONTEXT_BUILDING_CLIENT_ID]: unitsQuery.data?.length ?? 0 }}
              disableAddSingleUnit={!canAddSingleUnit}
              addSingleUnitHint={
                canAddSingleUnit ? undefined : "This building is already at its max units limit."
              }
            />
          </div>
          {formError ? <p className="text-destructive mt-3 shrink-0 text-sm">{formError}</p> : null}
          <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                resetAddDialog();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={units.length === 0 || isSavingDraftUnits}
              onClick={handleSaveDraftUnits}
            >
              {isSavingDraftUnits
                ? "Saving…"
                : `Save ${units.length} unit${units.length === 1 ? "" : "s"}`}
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
            resetAddDialog();
          }}
        />
      ) : null}

      {contractForUnitId ? (
        <Card
          className="border-border fixed inset-0 z-50 m-auto h-fit max-w-md border p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold">Add tenant</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Creates a contract for this unit. You can open the tenancy page next for rent and documents (demo).
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="tenant-name">Tenant / contract name</Label>
            <Input
              id="tenant-name"
              value={tenantName}
              maxLength={200}
              placeholder="e.g. Maria Schmidt"
              onChange={(e) => setTenantName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setContractForUnitId(null);
                  setTenantName("");
                }
              }}
            />
          </div>
          {assignContractMutation.isError ? (
            <p className="text-destructive mt-2 text-sm">
              {assignContractMutation.error instanceof Error
                ? assignContractMutation.error.message
                : "Could not add tenant"}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContractForUnitId(null);
                setTenantName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!tenantName.trim() || assignContractMutation.isPending}
              onClick={() =>
                assignContractMutation.mutate({
                  unitId: contractForUnitId,
                  name: tenantName.trim(),
                })
              }
            >
              {assignContractMutation.isPending ? "Saving…" : "Save & open tenancy"}
            </Button>
          </div>
        </Card>
      ) : null}
      {contractForUnitId ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40"
          aria-label="Close dialog"
          onClick={() => {
            setContractForUnitId(null);
            setTenantName("");
          }}
        />
      ) : null}
    </div>
  );
}
