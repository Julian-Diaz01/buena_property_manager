"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAndAssignContract, removeContractFromUnit } from "@/lib/api/contracts";
import { getProperty } from "@/lib/api/properties";
import { listUnits } from "@/lib/api/units";
import { queryKeys } from "@/lib/api/query-keys";
import type { UnitWithRelations } from "@/lib/api/types";
import { unitTypeLabel } from "@/lib/app/unit-helpers";

type PropertyUnitsViewProps = {
  propertyId: string;
};

const RENT_PLACEHOLDER = "—";

export function PropertyUnitsView({ propertyId }: PropertyUnitsViewProps) {
  const queryClient = useQueryClient();
  const [contractModalUnitId, setContractModalUnitId] = useState<string | null>(null);
  const [contractName, setContractName] = useState("Residential lease");

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

  const allUnits: UnitWithRelations[] = useMemo(() => {
    return unitsQueries.flatMap((q) => q.data ?? []);
  }, [unitsQueries]);

  const isUnitsLoading = unitsQueries.some((q) => q.isLoading);

  const createContractMutation = useMutation({
    mutationFn: async ({ unitId, name }: { unitId: string; name: string }) =>
      createAndAssignContract(unitId, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
      for (const id of buildingIds) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.units(id) });
      }
      setContractModalUnitId(null);
    },
  });

  const removeContractMutation = useMutation({
    mutationFn: (unitId: string) => removeContractFromUnit(unitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.property(propertyId) });
      for (const id of buildingIds) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.units(id) });
      }
    },
  });

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

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{property.name}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {property.type} · {property.buildings.length} building
              {property.buildings.length === 1 ? "" : "s"} · {allUnits.length} unit
              {allUnits.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      {isUnitsLoading ? (
        <p className="text-muted-foreground text-sm">Loading units…</p>
      ) : null}

      <div className="border-border overflow-hidden rounded-xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 border-border border-b text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Building</th>
              <th className="px-4 py-3 font-medium">Floor</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Rent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {allUnits.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                  No units for this property yet. Create units from the property wizard when adding a new property, or
                  add buildings/units via the API.
                </td>
              </tr>
            ) : (
              allUnits.map((unit) => {
                const occupied = Boolean(unit.contractId);
                const buildingLabel = `${unit.building.street} ${unit.building.houseNumber}`;
                return (
                  <tr key={unit.id} className="border-border hover:bg-muted/20 border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{unit.number}</td>
                    <td className="text-muted-foreground px-4 py-3">{buildingLabel}</td>
                    <td className="text-muted-foreground px-4 py-3">{unit.floor ?? "—"}</td>
                    <td className="text-muted-foreground px-4 py-3">{unitTypeLabel(unit.type)}</td>
                    <td className="text-muted-foreground px-4 py-3">{RENT_PLACEHOLDER}</td>
                    <td className="px-4 py-3">
                      {occupied ? (
                        <Badge className="border-0 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-100">
                          Occupied
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Vacant</Badge>
                      )}
                    </td>
                    <td className="space-x-2 px-4 py-3 text-right">
                      {occupied ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/tenancies/${unit.id}`}>View tenancy</Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={removeContractMutation.isPending}
                            onClick={() => removeContractMutation.mutate(unit.id)}
                          >
                            Remove contract
                          </Button>
                        </>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={() => setContractModalUnitId(unit.id)}>
                          Create tenancy
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {contractModalUnitId ? (
        <Card
          className="border-border fixed inset-0 z-50 m-auto h-fit max-w-md border p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold">Create contract</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Creates a contract record and attaches it to this unit (backend-supported).
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="contract-name">Contract name</Label>
            <Input
              id="contract-name"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setContractModalUnitId(null);
              }}
            />
          </div>
          {createContractMutation.isError ? (
            <p className="text-destructive mt-2 text-sm">
              {createContractMutation.error instanceof Error
                ? createContractMutation.error.message
                : "Failed to create contract"}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setContractModalUnitId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!contractName.trim() || createContractMutation.isPending}
              onClick={() =>
                createContractMutation.mutate({
                  unitId: contractModalUnitId,
                  name: contractName.trim(),
                })
              }
            >
              {createContractMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </Card>
      ) : null}

      {contractModalUnitId ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40"
          aria-label="Close dialog"
          onClick={() => setContractModalUnitId(null)}
        />
      ) : null}
    </div>
  );
}
