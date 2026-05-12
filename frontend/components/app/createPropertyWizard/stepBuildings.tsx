import { Building2, Copy, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";

import { BuildingEntrancesField } from "./buildingEntrancesField";
import type { BuildingFieldErrors } from "./schemas";
import { FieldError } from "./shared";
import type { LocalBuilding } from "./types";

export type StepBuildingsProps = {
  /** `single` = one building card (add-building / inline flows); hides add row and duplicate/remove. */
  variant?: "wizard" | "single";
  buildings: LocalBuilding[];
  fieldErrors?: Record<string, BuildingFieldErrors>;
  onBuildingBlur?: (clientId: string) => void;
  onUpdateBuilding: (clientId: string, patch: Partial<LocalBuilding>) => void;
  onDuplicateBuilding: (source: LocalBuilding) => void;
  onRemoveBuilding: (clientId: string) => void;
  onAddBuilding: () => void;
};

export function StepBuildings({
  variant = "wizard",
  buildings,
  fieldErrors,
  onBuildingBlur,
  onUpdateBuilding,
  onDuplicateBuilding,
  onRemoveBuilding,
  onAddBuilding,
}: StepBuildingsProps) {
  const isWizard = variant === "wizard";
  return (
    <div className="space-y-4">
      {buildings.map((b) => {
        const fe = fieldErrors?.[b.clientId];
        return (
        <Card key={b.clientId} className="border-border space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                <Building2 className="text-muted-foreground h-5 w-5" />
              </div>
              <Input
                value={b.name}
                onChange={(e) => onUpdateBuilding(b.clientId, { name: e.target.value })}
                onBlur={() => onBuildingBlur?.(b.clientId)}
                className={cn("h-9 w-44 font-medium", fe?.name && "border-destructive")}
                aria-label="Building display name"
                aria-invalid={!!fe?.name}
              />
            </div>
            {isWizard ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onDuplicateBuilding(b)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
                {buildings.length > 1 ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => onRemoveBuilding(b.clientId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          <FieldError message={fe?.name} />
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2 space-y-2">
              <Label>Street</Label>
              <Input
                value={b.street}
                onChange={(e) => onUpdateBuilding(b.clientId, { street: e.target.value })}
                onBlur={() => onBuildingBlur?.(b.clientId)}
                placeholder="Musterstraße"
                className={cn(fe?.street && "border-destructive")}
                aria-invalid={!!fe?.street}
              />
              <FieldError message={fe?.street} />
            </div>
            <div className="space-y-2">
              <Label>House no.</Label>
              <Input
                value={b.houseNumber}
                onChange={(e) => onUpdateBuilding(b.clientId, { houseNumber: e.target.value })}
                onBlur={() => onBuildingBlur?.(b.clientId)}
                placeholder="42"
                className={cn(fe?.houseNumber && "border-destructive")}
                aria-invalid={!!fe?.houseNumber}
              />
              <FieldError message={fe?.houseNumber} />
            </div>
            <div className="space-y-2">
              <Label>Postal</Label>
              <Input
                value={b.postalCode}
                onChange={(e) => onUpdateBuilding(b.clientId, { postalCode: e.target.value })}
                onBlur={() => onBuildingBlur?.(b.clientId)}
                placeholder="10115"
                className={cn(fe?.postalCode && "border-destructive")}
                aria-invalid={!!fe?.postalCode}
              />
              <FieldError message={fe?.postalCode} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={b.city}
                onChange={(e) => onUpdateBuilding(b.clientId, { city: e.target.value })}
                onBlur={() => onBuildingBlur?.(b.clientId)}
                placeholder="Berlin"
                className={cn(fe?.city && "border-destructive")}
                aria-invalid={!!fe?.city}
              />
              <FieldError message={fe?.city} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={b.description}
                onChange={(e) => onUpdateBuilding(b.clientId, { description: e.target.value })}
                onBlur={() => onBuildingBlur?.(b.clientId)}
                placeholder="Optional building notes"
                className={cn(fe?.description && "border-destructive")}
                aria-invalid={!!fe?.description}
              />
              <FieldError message={fe?.description} />
            </div>
          </div>
          <div className="border-border grid gap-4 border-t pt-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Floors (optional)</Label>
              <Input
                inputMode="numeric"
                value={b.floors}
                onChange={(e) => onUpdateBuilding(b.clientId, { floors: e.target.value })}
                onBlur={() => onBuildingBlur?.(b.clientId)}
                placeholder="e.g. 5"
                className={cn(fe?.floors && "border-destructive")}
                aria-invalid={!!fe?.floors}
              />
              <p className="text-muted-foreground text-xs">Unit floors must stay between 1 and this value when set.</p>
              <FieldError message={fe?.floors} />
            </div>
            <div className="space-y-2">
              <Label>Max units (optional)</Label>
              <Input
                inputMode="numeric"
                value={b.maxApartments}
                onChange={(e) => onUpdateBuilding(b.clientId, { maxApartments: e.target.value })}
                onBlur={() => onBuildingBlur?.(b.clientId)}
                placeholder="e.g. 20"
                className={cn(fe?.maxApartments && "border-destructive")}
                aria-invalid={!!fe?.maxApartments}
              />
              <p className="text-muted-foreground text-xs">Caps draft + saved units for this building.</p>
              <FieldError message={fe?.maxApartments} />
            </div>
            <div className="sm:col-span-2">
              <BuildingEntrancesField
                value={b.entrances}
                onChange={(next) => onUpdateBuilding(b.clientId, { entrances: next })}
                idPrefix={`ent-${b.clientId}`}
                errorMessage={fe?.entrances}
              />
            </div>
          </div>
        </Card>
        );
      })}
      {isWizard ? (
        <Button type="button" variant="outline" className="w-full" onClick={onAddBuilding}>
          <Plus className="mr-2 h-4 w-4" />
          Add another building (Alt+B)
        </Button>
      ) : null}
    </div>
  );
}
