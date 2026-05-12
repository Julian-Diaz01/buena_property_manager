import { Building2, Copy, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { BuildingEntrancesField } from "./buildingEntrancesField";
import { KeyboardShortcut } from "./shared";
import type { LocalBuilding } from "./types";

export type StepBuildingsProps = {
  variant?: "wizard" | "single";
  buildings: LocalBuilding[];
  onUpdateBuilding: (clientId: string, patch: Partial<LocalBuilding>) => void;
  onDuplicateBuilding: (source: LocalBuilding) => void;
  onRemoveBuilding: (clientId: string) => void;
  onAddBuilding: () => void;
};

export function StepBuildings({
  variant = "wizard",
  buildings,
  onUpdateBuilding,
  onDuplicateBuilding,
  onRemoveBuilding,
  onAddBuilding,
}: StepBuildingsProps) {
  const isWizard = variant === "wizard";
  return (
    <div className="space-y-4">
      {buildings.map((b, i) => {
        const isLastBuilding = i === buildings.length - 1;
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
                  className="h-9 w-44 font-medium"
                  aria-label="Building display name"
                />
              </div>
              {isWizard ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onDuplicateBuilding(b)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </Button>
                  {isLastBuilding ? (
                    <span
                      className="text-muted-foreground inline-flex items-center gap-1 text-xs"
                      title="Duplicate last building"
                    >
                      <KeyboardShortcut keys={["Alt", "D"]} />
                    </span>
                  ) : null}
                  {buildings.length > 1 ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => onRemoveBuilding(b.clientId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2 space-y-2">
                <Label>Street</Label>
                <Input
                  value={b.street}
                  onChange={(e) => onUpdateBuilding(b.clientId, { street: e.target.value })}
                  placeholder="Musterstraße"
                />
              </div>
              <div className="space-y-2">
                <Label>House no.</Label>
                <Input
                  value={b.houseNumber}
                  onChange={(e) => onUpdateBuilding(b.clientId, { houseNumber: e.target.value })}
                  placeholder="42"
                />
              </div>
              <div className="space-y-2">
                <Label>Postal</Label>
                <Input
                  value={b.postalCode}
                  onChange={(e) => onUpdateBuilding(b.clientId, { postalCode: e.target.value })}
                  placeholder="10115"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={b.city}
                  onChange={(e) => onUpdateBuilding(b.clientId, { city: e.target.value })}
                  placeholder="Berlin"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={b.description}
                  onChange={(e) => onUpdateBuilding(b.clientId, { description: e.target.value })}
                  placeholder="Optional building notes"
                />
              </div>
            </div>
            <div className="border-border grid gap-4 border-t pt-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Floors (optional)</Label>
                <Input
                  inputMode="numeric"
                  value={b.floors}
                  onChange={(e) => onUpdateBuilding(b.clientId, { floors: e.target.value })}
                  placeholder="e.g. 5"
                />
                <p className="text-muted-foreground text-xs">
                  Unit floors must stay between 1 and this value when set.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Max units (optional)</Label>
                <Input
                  inputMode="numeric"
                  value={b.maxApartments}
                  onChange={(e) => onUpdateBuilding(b.clientId, { maxApartments: e.target.value })}
                  placeholder="e.g. 20"
                />
                <p className="text-muted-foreground text-xs">Caps draft + saved units for this building.</p>
              </div>
              <div className="sm:col-span-2">
                <BuildingEntrancesField
                  value={b.entrances}
                  onChange={(next) => onUpdateBuilding(b.clientId, { entrances: next })}
                  idPrefix={`ent-${b.clientId}`}
                />
              </div>
            </div>
          </Card>
        );
      })}
      {isWizard ? (
        <div className="space-y-2">
          {buildings.length > 0 ? (
            <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <span>Duplicate last building</span>
              <KeyboardShortcut keys={["Alt", "D"]} />
            </p>
          ) : null}
          <Button type="button" variant="outline" className="w-full" onClick={onAddBuilding}>
            <Plus className="mr-2 h-4 w-4" />
            Add another building (Alt+B)
          </Button>
        </div>
      ) : null}
    </div>
  );
}
