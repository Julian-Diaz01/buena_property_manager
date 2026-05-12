"use client";

import { useCallback } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { StepBuildings } from "./stepBuildings";
import { StepGeneral } from "./stepGeneral";
import { StepUnits } from "./stepUnits";
import { useWizardState } from "./use-wizard-state";

const FOCUSABLE_SELECTOR = 'input:not([type="hidden"]), select, textarea, button';

const STEP_LABELS: Record<number, string> = { 1: "General", 2: "Buildings", 3: "Units" };
const STEP_TITLES: Record<number, string> = { 1: "General info", 2: "Building data", 3: "Units" };

export function CreatePropertyWizard() {
  const w = useWizardState();

  const focusRelative = useCallback((current: Element, direction: 1 | -1) => {
    const root = w.stepContainerRef.current;
    if (!root) return;
    const list = Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>(
        FOCUSABLE_SELECTOR,
      ),
    ).filter((el) => {
      if (el.hasAttribute("data-skip-focus")) return false;
      if (el.tabIndex === -1) return false;
      return !el.disabled;
    });
    const idx = list.findIndex((el) => el === current);
    if (idx === -1) return;
    list[idx + direction]?.focus();
  }, [w.stepContainerRef]);

  const onStepKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (e.key === "Enter" && e.altKey && !e.metaKey && !e.ctrlKey) {
      if (e.repeat) return;
      if (w.step < 3) {
        if (!w.canGoNext) return;
        e.preventDefault();
        w.goNext();
      } else {
        if (w.submitWizard.isPending || !w.canSubmitWizard) return;
        e.preventDefault();
        w.validateAndSubmit();
      }
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      if (w.step < 3) {
        if (!w.canGoNext) return;
        e.preventDefault();
        w.goNext();
      } else {
        if (w.submitWizard.isPending || !w.canSubmitWizard) return;
        e.preventDefault();
        w.validateAndSubmit();
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      if (target.tagName === "TEXTAREA") return;
      if (target.tagName === "BUTTON") return;
      if (target.tagName === "SELECT") return;
      e.preventDefault();
      focusRelative(target, 1);
    }
    if (e.key === "Enter" && e.shiftKey) {
      if (target.tagName === "TEXTAREA") return;
      e.preventDefault();
      focusRelative(target, -1);
    }
  }, [
    focusRelative,
    w.canGoNext,
    w.canSubmitWizard,
    w.goNext,
    w.step,
    w.submitWizard.isPending,
    w.validateAndSubmit,
  ]);

  return (
    <div ref={w.stepContainerRef} className="mx-auto max-w-5xl space-y-6" onKeyDown={onStepKeyDown}>
      <div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
        <h2 className="text-2xl font-semibold tracking-tight">Create new property</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                w.step === n
                  ? "bg-primary text-primary-foreground"
                  : w.step > n
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {n}
            </div>
            <span
              className={`text-sm font-medium ${w.step === n ? "text-foreground" : "text-muted-foreground"}`}
            >
              {STEP_LABELS[n]}
            </span>
            {n < 3 ? <div className="bg-border mx-1 hidden h-px w-8 sm:block" /> : null}
          </div>
        ))}
      </div>

      {w.formError ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{w.formError}</AlertDescription>
        </Alert>
      ) : null}

      {w.step === 1 ? (
        <StepGeneral
          fieldErrors={w.step1FieldErrors}
          onStep1FieldBlur={w.handleStep1FieldBlur}
          propertyType={w.propertyType}
          onPropertyTypeChange={(v) => {
            w.setPropertyType(v);
            w.setStep1FieldErrors((e) => ({ ...e, type: undefined }));
          }}
          propertyName={w.propertyName}
          onPropertyNameChange={(v) => {
            w.setPropertyName(v);
            w.setStep1FieldErrors((e) => ({ ...e, name: undefined }));
          }}
          managerId={w.managerId}
          onManagerIdChange={(id) => {
            w.setManagerId(id);
            w.setStep1FieldErrors((e) => ({ ...e, managerId: undefined }));
          }}
          accountantId={w.accountantId}
          onAccountantIdChange={(id) => {
            w.setAccountantId(id);
            w.setStep1FieldErrors((e) => ({ ...e, accountantId: undefined }));
          }}
          newManagerName={w.newManagerName}
          onNewManagerNameChange={w.setNewManagerName}
          newAccountantName={w.newAccountantName}
          onNewAccountantNameChange={w.setNewAccountantName}
          managers={w.managers}
          accountants={w.accountants}
          createManagerMutation={w.createManagerMutation}
          createAccountantMutation={w.createAccountantMutation}
        />
      ) : null}

      {w.step === 2 ? (
        <StepBuildings
          buildings={w.buildings}
          fieldErrors={w.buildingFieldErrors}
          onBuildingBlur={w.handleBuildingBlur}
          onUpdateBuilding={w.updateBuilding}
          onDuplicateBuilding={w.duplicateBuilding}
          onRemoveBuilding={w.removeBuilding}
          onAddBuilding={w.addBuilding}
        />
      ) : null}

      {w.step === 3 ? (
        <StepUnits
          buildings={w.buildings}
          units={w.units}
          unitFieldErrors={w.unitFieldErrors}
          expandedUnits={w.expandedUnits}
          bulkMode={w.bulkMode}
          onBulkModeChange={w.setBulkMode}
          bulkFloorStart={w.bulkFloorStart}
          onBulkFloorStartChange={w.setBulkFloorStart}
          bulkFloorEnd={w.bulkFloorEnd}
          onBulkFloorEndChange={w.setBulkFloorEnd}
          bulkUnitsPerFloor={w.bulkUnitsPerFloor}
          onBulkUnitsPerFloorChange={w.setBulkUnitsPerFloor}
          bulkUnitType={w.bulkUnitType}
          onBulkUnitTypeChange={w.setBulkUnitType}
          resolvedBulkBuildingId={w.resolvedBulkBuildingId}
          onBulkBuildingIdChange={w.setBulkBuildingId}
          onGenerateBulkUnits={w.generateBulkUnits}
          onToggleExpandUnit={w.toggleExpandUnit}
          onUpdateUnit={w.updateUnit}
          onRemoveUnit={w.removeUnit}
          onAddUnit={w.addUnit}
          onUnitBlur={w.handleUnitBlur}
          disableAddSingleUnit={!w.canAddSingleUnit}
          addSingleUnitHint={w.addSingleUnitHint}
        />
      ) : null}

      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <Button type="button" variant="outline" disabled={w.step === 1} onClick={w.goBack}>
          Back
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/">Cancel</Link>
          </Button>
          {w.step < 3 ? (
            <Button type="button" disabled={!w.canGoNext} onClick={w.goNext}>
              Next step (Alt+Enter)
            </Button>
          ) : (
            <Button
              type="button"
              disabled={w.submitWizard.isPending || !w.canSubmitWizard}
              onClick={w.validateAndSubmit}
            >
              {w.submitWizard.isPending ? "Creating…" : "Create property (Alt+Enter)"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
