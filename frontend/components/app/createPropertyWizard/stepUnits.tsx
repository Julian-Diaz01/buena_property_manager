import { Fragment, useMemo } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { UnitType } from "@/lib/api/types";
import { parseOptionalInt, UNIT_TYPE_OPTIONS } from "@/lib/app/unit-helpers";

import {
  defaultEntranceForNewUnit,
  entranceSelectOptions,
  MAIN_ENTRANCE_LABEL,
  maxUnitsCapFromBuilding,
  remainingUnitSlots,
} from "@/components/app/createPropertyWizard/building-rail-helpers";
import type { LocalBuilding, LocalUnit } from "./types";
import { KeyboardShortcut } from "./shared";

export type StepUnitsProps = {
  singleBuildingContext?: boolean;
  buildings: LocalBuilding[];
  units: LocalUnit[];
  expandedUnits: Set<string>;
  bulkMode: boolean;
  onBulkModeChange: (bulk: boolean) => void;
  bulkFloorStart: string;
  onBulkFloorStartChange: (v: string) => void;
  bulkFloorEnd: string;
  onBulkFloorEndChange: (v: string) => void;
  bulkUnitsPerFloor: string;
  onBulkUnitsPerFloorChange: (v: string) => void;
  bulkUnitType: UnitType;
  onBulkUnitTypeChange: (t: UnitType) => void;
  resolvedBulkBuildingId: string;
  onBulkBuildingIdChange: (id: string) => void;
  onGenerateBulkUnits: () => void;
  onToggleExpandUnit: (clientId: string) => void;
  onUpdateUnit: (clientId: string, patch: Partial<LocalUnit>) => void;
  onRemoveUnit: (clientId: string) => void;
  onAddUnit: () => void;
  persistedUnitCountByBuildingClientId?: Record<string, number>;
  disableAddSingleUnit?: boolean;
  addSingleUnitHint?: string;
};

export function StepUnits({
  singleBuildingContext = false,
  buildings,
  units,
  expandedUnits,
  bulkMode,
  onBulkModeChange,
  bulkFloorStart,
  onBulkFloorStartChange,
  bulkFloorEnd,
  onBulkFloorEndChange,
  bulkUnitsPerFloor,
  onBulkUnitsPerFloorChange,
  bulkUnitType,
  onBulkUnitTypeChange,
  resolvedBulkBuildingId,
  onBulkBuildingIdChange,
  onGenerateBulkUnits,
  onToggleExpandUnit,
  onUpdateUnit,
  onRemoveUnit,
  onAddUnit,
  persistedUnitCountByBuildingClientId = {},
  disableAddSingleUnit = false,
  addSingleUnitHint,
}: StepUnitsProps) {
  const colCount = singleBuildingContext ? 7 : 8;

  const bulkBuilding = useMemo(
    () => buildings.find((b) => b.clientId === resolvedBulkBuildingId),
    [buildings, resolvedBulkBuildingId],
  );
  const bulkCapacityHint = useMemo(() => {
    if (!bulkBuilding) return null;
    const persistedN = persistedUnitCountByBuildingClientId[resolvedBulkBuildingId] ?? 0;
    const draftN = units.filter((u) => u.buildingClientId === resolvedBulkBuildingId).length;
    const cap = maxUnitsCapFromBuilding(bulkBuilding);
    const rem = cap !== undefined ? remainingUnitSlots(bulkBuilding, draftN, persistedN) : null;
    const floorCap = parseOptionalInt(bulkBuilding.floors);
    const parts: string[] = [];
    if (rem !== null) {
      parts.push(`${draftN} draft + ${persistedN} saved = ${draftN + persistedN} / ${cap} units`);
    }
    if (floorCap !== undefined) {
      parts.push(`floors rail: unit floors 1–${floorCap}`);
    }
    return parts.length ? parts.join(" · ") : null;
  }, [bulkBuilding, persistedUnitCountByBuildingClientId, resolvedBulkBuildingId, units]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={!bulkMode ? "default" : "outline"} size="sm" onClick={() => onBulkModeChange(false)}>
          Single unit
        </Button>
        <Button type="button" variant={bulkMode ? "default" : "outline"} size="sm" onClick={() => onBulkModeChange(true)}>
          Bulk create
        </Button>
      </div>

      {units.length > 0 ? (
        <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-1.5 text-xs">
          <span>Duplicate last unit</span>
          <KeyboardShortcut keys={["Alt", "D"]} />
        </p>
      ) : null}

      {bulkMode ? (
        <Card className="border-primary/30 bg-primary/5 space-y-4 border p-6">
          <p className="font-medium">Bulk unit creation</p>
          <div className={cn("grid gap-4", singleBuildingContext ? "sm:grid-cols-3" : "sm:grid-cols-4")}>
            {!singleBuildingContext ? (
              <div className="space-y-2">
                <Label>Building</Label>
                <Select value={resolvedBulkBuildingId} onValueChange={onBulkBuildingIdChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.clientId} value={b.clientId}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Floor start</Label>
              <Input type="number" value={bulkFloorStart} onChange={(e) => onBulkFloorStartChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Floor end</Label>
              <Input type="number" value={bulkFloorEnd} onChange={(e) => onBulkFloorEndChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Units / floor</Label>
              <Input
                type="number"
                value={bulkUnitsPerFloor}
                onChange={(e) => onBulkUnitsPerFloorChange(e.target.value)}
                placeholder=""
              />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Unit type</Label>
              <Select value={bulkUnitType} onValueChange={(v) => onBulkUnitTypeChange(v as UnitType)}>
                <SelectTrigger className="w-full min-w-[10rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={onGenerateBulkUnits}>
              Generate units
            </Button>
          </div>
          {bulkCapacityHint ? (
            <p className="text-muted-foreground text-xs">{bulkCapacityHint}</p>
          ) : null}
        </Card>
      ) : null}

      {units.length > 0 ? (
        <div className="border-border overflow-hidden rounded-xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/40 border-border border-b">
              <tr>
                <th className="w-10 px-2 py-2" />
                <th className="px-2 py-2 text-left font-medium">Nr.</th>
                <th className="px-2 py-2 text-left font-medium">Type</th>
                {!singleBuildingContext ? (
                  <th className="px-2 py-2 text-left font-medium">Building</th>
                ) : null}
                <th className="px-2 py-2 text-left font-medium">Floor / entrance</th>
                <th className="px-2 py-2 text-left font-medium">Size m²</th>
                <th className="px-2 py-2 text-left font-medium">MEA</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {units.map((u, rowIndex) => {
                const expanded = expandedUnits.has(u.clientId);
                const building = buildings.find((b) => b.clientId === u.buildingClientId);
                const isLastUnit = rowIndex === units.length - 1;
                return (
                  <Fragment key={u.clientId}>
                    <tr className="border-border hover:bg-muted/20 border-b">
                      <td className="px-2 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-expanded={expanded}
                          onClick={() => {
                            onToggleExpandUnit(u.clientId);
                          }}
                        >
                          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </td>
                      <td className="text-muted-foreground px-2 py-2">{u.number || "—"}</td>
                      <td className="px-2 py-2">
                        <Badge variant="outline">{UNIT_TYPE_OPTIONS.find((o) => o.value === u.type)?.label}</Badge>
                      </td>
                      {!singleBuildingContext ? (
                        <td className="text-muted-foreground px-2 py-2">{building?.name ?? "—"}</td>
                      ) : null}
                      <td className="text-muted-foreground px-2 py-2">
                        {[u.floor, u.entrance].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="text-muted-foreground px-2 py-2">{u.size || "—"}</td>
                      <td className="text-muted-foreground px-2 py-2 font-mono text-xs">{u.coOwnershipShare || "—"}</td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isLastUnit ? (
                            <span
                              className="text-muted-foreground mr-0.5 inline-flex"
                              title="Duplicate last unit"
                            >
                              <KeyboardShortcut keys={["Alt", "D"]} />
                            </span>
                          ) : null}
                          <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveUnit(u.clientId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr>
                        <td colSpan={colCount} className="bg-muted/30 px-4 py-4">
                          <div className="grid max-w-4xl gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Nr.</Label>
                              <Input
                                value={u.number}
                                onChange={(e) => onUpdateUnit(u.clientId, { number: e.target.value })}
                                tabIndex={-1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={u.type}
                                onValueChange={(v) => onUpdateUnit(u.clientId, { type: v as UnitType })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIT_TYPE_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {!singleBuildingContext ? (
                              <div className="space-y-2">
                                <Label className="text-xs">Building</Label>
                                <Select
                                  value={u.buildingClientId}
                                  onValueChange={(v) => {
                                    const nb = buildings.find((b) => b.clientId === v);
                                    onUpdateUnit(u.clientId, {
                                      buildingClientId: v,
                                      ...(nb ? { entrance: defaultEntranceForNewUnit(nb) } : {}),
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {buildings.map((b) => (
                                      <SelectItem key={b.clientId} value={b.clientId}>
                                        {b.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : null}
                            <div className="space-y-2">
                              <Label className="text-xs">Plan ref.</Label>
                              <Input
                                value={u.planReference}
                                onChange={(e) => onUpdateUnit(u.clientId, { planReference: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Floor (integer)</Label>
                              <Input
                                value={u.floor}
                                onChange={(e) => onUpdateUnit(u.clientId, { floor: e.target.value })}
                                placeholder="2"
                                type="number"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Entrance</Label>
                              {(() => {
                                const opts = building ? entranceSelectOptions(building) : null;
                                const trimmed = u.entrance.trim();
                                const unknown = Boolean(opts?.length && trimmed && !opts.includes(trimmed));
                                const selectValues =
                                  opts && opts.length
                                    ? unknown
                                      ? [...opts, trimmed]
                                      : opts
                                    : null;
                                if (selectValues?.length) {
                                  return (
                                    <Select
                                      value={trimmed || selectValues[0]!}
                                      onValueChange={(v) => onUpdateUnit(u.clientId, { entrance: v })}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {selectValues.map((opt) => (
                                          <SelectItem key={opt} value={opt}>
                                            {opt}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  );
                                }
                                return (
                                  <Input
                                    value={u.entrance}
                                    onChange={(e) => onUpdateUnit(u.clientId, { entrance: e.target.value })}
                                    placeholder={MAIN_ENTRANCE_LABEL}
                                  />
                                );
                              })()}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Size (m²)</Label>
                              <Input
                                value={u.size}
                                onChange={(e) => onUpdateUnit(u.clientId, { size: e.target.value })}
                                type="number"
                                placeholder="65"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Rooms</Label>
                              <Input
                                value={u.rooms}
                                onChange={(e) => onUpdateUnit(u.clientId, { rooms: e.target.value })}
                                type="number"
                                placeholder="2"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Construction year</Label>
                              <Input
                                value={u.constructionYear}
                                onChange={(e) => onUpdateUnit(u.clientId, { constructionYear: e.target.value })}
                                type="number"
                                placeholder="2020"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">MEA (decimal or n/d)</Label>
                              <Input
                                className="font-mono"
                                value={u.coOwnershipShare}
                                onChange={(e) => onUpdateUnit(u.clientId, { coOwnershipShare: e.target.value })}
                                placeholder="100/1000"
                              />
                            </div>
                            <div className="sm:col-span-3 space-y-2">
                              <Label className="text-xs">Description</Label>
                              <Textarea
                                rows={2}
                                value={u.description}
                                onChange={(e) => onUpdateUnit(u.clientId, { description: e.target.value })}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/30 border-border border-t">
              <tr>
                <td colSpan={colCount} className="text-muted-foreground px-2 py-3 text-right text-sm font-medium">
                  Total: {units.length} {units.length === 1 ? "unit" : "units"} to create
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <Card className="border-muted-foreground/30 border-dashed p-10 text-center text-sm text-muted-foreground">
          No units yet. Use bulk create or add a single unit (Alt+U).
        </Card>
      )}

      {!bulkMode ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onAddUnit}
          disabled={disableAddSingleUnit}
          title={addSingleUnitHint}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add single unit (Alt+U)
        </Button>
      ) : null}
      {!bulkMode && addSingleUnitHint && disableAddSingleUnit ? (
        <p className="text-muted-foreground text-center text-xs">{addSingleUnitHint}</p>
      ) : null}
    </div>
  );
}
