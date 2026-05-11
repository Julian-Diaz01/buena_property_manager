"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createAccountant, listAccountants } from "@/lib/api/accountants";
import { createBuilding } from "@/lib/api/buildings";
import { createManager, listManagers } from "@/lib/api/managers";
import { createProperty } from "@/lib/api/properties";
import { queryKeys } from "@/lib/api/query-keys";
import type { PropertyType, UnitNestedInput, UnitType } from "@/lib/api/types";
import {
  parseCoOwnershipShare,
  parseOptionalInt,
  parseOptionalNumber,
} from "@/lib/app/unit-helpers";

import { StepBuildings } from "./stepBuildings";
import { StepGeneral } from "./stepGeneral";
import { StepUnits } from "./stepUnits";
import {
  firstIssueMessage,
  mapArrayIssuesByClientId,
  mapFlatZodFieldErrors,
  mapStep1Issues,
  parseBuildingsStep,
  parseSingleBuilding,
  parseStep1,
  parseUnitsStep,
  summarizeIssues,
  validateSingleUnit,
  validateStep1Field,
  type BuildingFieldErrors,
  type Step1BlurField,
  type Step1FieldErrors,
} from "./schemas";
import {
  defaultBuilding,
  defaultUnit,
  newClientId,
  type LocalBuilding,
  type LocalUnit,
} from "./types";

export function CreatePropertyWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const stepContainerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState<PropertyType>("WEG");
  const [propertyName, setPropertyName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [accountantId, setAccountantId] = useState("");
  const [newManagerName, setNewManagerName] = useState("");
  const [newAccountantName, setNewAccountantName] = useState("");
  const [buildings, setBuildings] = useState<LocalBuilding[]>(() => [defaultBuilding("")]);
  const [units, setUnits] = useState<LocalUnit[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkFloorStart, setBulkFloorStart] = useState("1");
  const [bulkFloorEnd, setBulkFloorEnd] = useState("3");
  const [bulkUnitsPerFloor, setBulkUnitsPerFloor] = useState("2");
  const [bulkUnitType, setBulkUnitType] = useState<UnitType>("APARTMENT");
  const [bulkBuildingId, setBulkBuildingId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [step1FieldErrors, setStep1FieldErrors] = useState<Step1FieldErrors>({});
  const [buildingFieldErrors, setBuildingFieldErrors] = useState<
    Record<string, Partial<Record<string, string>>>
  >({});
  const [unitFieldErrors, setUnitFieldErrors] = useState<Record<string, Partial<Record<string, string>>>>({});

  const resolvedBulkBuildingId = useMemo(() => {
    if (buildings.some((b) => b.clientId === bulkBuildingId)) return bulkBuildingId;
    return buildings[0]?.clientId ?? "";
  }, [buildings, bulkBuildingId]);

  const managersQuery = useQuery({
    queryKey: queryKeys.managers,
    queryFn: listManagers,
  });

  const accountantsQuery = useQuery({
    queryKey: queryKeys.accountants,
    queryFn: listAccountants,
  });

  const createManagerMutation = useMutation({
    mutationFn: createManager,
    onSuccess: async (m) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.managers });
      setManagerId(m.id);
      setNewManagerName("");
    },
  });

  const createAccountantMutation = useMutation({
    mutationFn: createAccountant,
    onSuccess: async (a) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.accountants });
      setAccountantId(a.id);
      setNewAccountantName("");
    },
  });

  const addBuilding = useCallback(() => {
    setBuildingFieldErrors({});
    setBuildings((prev) => [
      ...prev,
      {
        clientId: newClientId(),
        name: `Building ${prev.length + 1}`,
        street: prev[0]?.street ?? "",
        houseNumber: "",
        postalCode: prev[0]?.postalCode ?? "",
        city: prev[0]?.city ?? "Berlin",
        description: "",
      },
    ]);
  }, []);

  const duplicateBuilding = useCallback((source: LocalBuilding) => {
    setBuildings((prev) => [
      ...prev,
      {
        ...source,
        clientId: newClientId(),
        name: `${source.name} (copy)`,
        houseNumber: "",
      },
    ]);
  }, []);

  const duplicateLastBuildingShortcut = useCallback(() => {
    setBuildings((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      return [
        ...prev,
        {
          ...last,
          clientId: newClientId(),
          name: `${last.name} (copy)`,
          houseNumber: "",
        },
      ];
    });
  }, []);

  const removeBuilding = useCallback((clientId: string) => {
    setBuildingFieldErrors((prev) => {
      const { [clientId]: _, ...rest } = prev;
      return rest;
    });
    setBuildings((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((b) => b.clientId !== clientId);
      setUnits((u) => u.filter((unit) => unit.buildingClientId !== clientId));
      return next;
    });
  }, []);

  const updateBuilding = useCallback((clientId: string, patch: Partial<LocalBuilding>) => {
    setBuildingFieldErrors((prev) => {
      const row = prev[clientId];
      if (!row) return prev;
      const nextRow: Partial<Record<string, string>> = { ...row };
      for (const k of Object.keys(patch) as (keyof LocalBuilding)[]) {
        if (k in nextRow) delete nextRow[k as string];
      }
      if (Object.keys(nextRow).length === 0) {
        const { [clientId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [clientId]: nextRow };
    });
    setBuildings((prev) => prev.map((b) => (b.clientId === clientId ? { ...b, ...patch } : b)));
  }, []);

  const addUnit = useCallback(() => {
    const bid = buildings[0]?.clientId;
    if (!bid) return;
    setUnitFieldErrors({});
    setUnits((prev) => [...prev, defaultUnit(bid)]);
    setBulkMode(false);
  }, [buildings]);

  const duplicateLastUnit = useCallback(() => {
    setUnits((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      return [
        ...prev,
        {
          ...last,
          clientId: newClientId(),
          number: "",
        },
      ];
    });
  }, []);

  const removeUnit = useCallback((clientId: string) => {
    setUnitFieldErrors((prev) => {
      const { [clientId]: _, ...rest } = prev;
      return rest;
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
        const { [clientId]: _, ...rest } = prev;
        return rest;
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

  const generateBulkUnits = useCallback(() => {
    const start = Number.parseInt(bulkFloorStart, 10);
    const end = Number.parseInt(bulkFloorEnd, 10);
    const per = Number.parseInt(bulkUnitsPerFloor, 10);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(per)) {
      setFormError("Bulk generation: enter valid numbers for floors and units per floor.");
      return;
    }
    if (start > end) {
      setFormError("Floor start must be less than or equal to floor end.");
      return;
    }
    if (!resolvedBulkBuildingId) {
      setFormError("Select a building for bulk generation.");
      return;
    }
    const created: LocalUnit[] = [];
    let counter = units.length + 1;
    for (let floor = start; floor <= end; floor += 1) {
      for (let n = 1; n <= per; n += 1) {
        const letter = String.fromCharCode(64 + n);
        created.push({
          clientId: newClientId(),
          buildingClientId: resolvedBulkBuildingId,
          number: String(counter).padStart(2, "0"),
          type: bulkUnitType,
          floor: String(floor),
          entrance: `Entrance ${letter}`,
          size: bulkUnitType === "APARTMENT" ? "65" : bulkUnitType === "PARKING" ? "12" : "25",
          coOwnershipShare: `${650 + counter * 5}/1000`,
          constructionYear: "2023",
          rooms: bulkUnitType === "APARTMENT" ? "2" : bulkUnitType === "OFFICE" ? "1" : "",
          planReference: String(counter).padStart(2, "0"),
          description: "",
        });
        counter += 1;
      }
    }
    setUnits((prev) => [...prev, ...created]);
    setBulkMode(false);
    setFormError(null);
    setUnitFieldErrors({});
  }, [bulkFloorEnd, bulkFloorStart, bulkUnitType, bulkUnitsPerFloor, resolvedBulkBuildingId, units.length]);

  const mapUnitsForBuilding = useCallback(
    (buildingClientId: string): UnitNestedInput[] => {
      return units
        .filter((u) => u.buildingClientId === buildingClientId)
        .map((u) => {
          const nested: UnitNestedInput = {
            number: u.number.trim(),
            type: u.type,
            floor: parseOptionalInt(u.floor),
            entrance: u.entrance.trim() || undefined,
            size: parseOptionalNumber(u.size),
            coOwnershipShare: parseCoOwnershipShare(u.coOwnershipShare),
            constructionYear: parseOptionalInt(u.constructionYear),
            rooms: parseOptionalInt(u.rooms),
          };
          return nested;
        });
    },
    [units],
  );

  const submitWizard = useMutation({
    mutationFn: async () => {
      const s1 = parseStep1({
        name: propertyName,
        type: propertyType,
        managerId,
        accountantId,
      });
      if (!s1.success) throw new Error(firstIssueMessage(s1.error));

      const s2 = parseBuildingsStep(buildings);
      if (!s2.success) throw new Error(firstIssueMessage(s2.error));

      const s3 = parseUnitsStep(units, buildings);
      if (!s3.success) throw new Error(summarizeIssues(s3.error, 10));

      const property = await createProperty({
        name: s1.data.name,
        type: s1.data.type,
        managerId: s1.data.managerId,
        accountantId: s1.data.accountantId,
      });

      for (const b of buildings) {
        const locationLine = [b.postalCode.trim(), b.city.trim()].filter(Boolean).join(" ");
        const descriptionParts = [b.description.trim(), locationLine].filter(Boolean);
        await createBuilding({
          propertyId: property.id,
          street: b.street.trim(),
          houseNumber: b.houseNumber.trim(),
          description: descriptionParts.length ? descriptionParts.join(" — ") : undefined,
          entrances: ["main"],
          units: mapUnitsForBuilding(b.clientId),
        });
      }

      return property.id;
    },
    onSuccess: async (propertyId) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      router.push(`/properties/${propertyId}`);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const validateAndSubmit = useCallback(() => {
    setFormError(null);
    const s1 = parseStep1({
      name: propertyName,
      type: propertyType,
      managerId,
      accountantId,
    });
    if (!s1.success) {
      setStep(1);
      setStep1FieldErrors(mapStep1Issues(s1.error));
      setFormError(firstIssueMessage(s1.error));
      return;
    }
    const s2 = parseBuildingsStep(buildings);
    if (!s2.success) {
      setStep(2);
      setBuildingFieldErrors(mapArrayIssuesByClientId(s2.error, buildings));
      setFormError(firstIssueMessage(s2.error));
      return;
    }
    const s3 = parseUnitsStep(units, buildings);
    if (!s3.success) {
      const byClient = mapArrayIssuesByClientId(s3.error, units);
      setUnitFieldErrors(byClient);
      setExpandedUnits((prev) => {
        const next = new Set(prev);
        for (const id of Object.keys(byClient)) next.add(id);
        return next;
      });
      setFormError(summarizeIssues(s3.error, 8));
      return;
    }
    setStep1FieldErrors({});
    setBuildingFieldErrors({});
    setUnitFieldErrors({});
    submitWizard.mutate();
  }, [accountantId, buildings, managerId, propertyName, propertyType, submitWizard, units]);

  const handleStep1FieldBlur = useCallback(
    (field: Step1BlurField) => {
      const r = validateStep1Field(field, {
        name: propertyName,
        type: propertyType,
        managerId,
        accountantId,
      });
      setStep1FieldErrors((prev) => {
        if (r.success) return { ...prev, [field]: undefined };
        const msg = r.error.issues[0]?.message ?? "Invalid";
        return { ...prev, [field]: msg };
      });
    },
    [accountantId, managerId, propertyName, propertyType],
  );

  const handleBuildingBlur = useCallback(
    (clientId: string) => {
      const b = buildings.find((x) => x.clientId === clientId);
      if (!b) return;
      const r = parseSingleBuilding(b);
      setBuildingFieldErrors((prev) => {
        if (r.success) {
          const { [clientId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [clientId]: mapFlatZodFieldErrors(r.error) as BuildingFieldErrors };
      });
    },
    [buildings],
  );

  const handleUnitBlur = useCallback(
    (clientId: string) => {
      const u = units.find((x) => x.clientId === clientId);
      if (!u) return;
      const r = validateSingleUnit(u, buildings);
      setUnitFieldErrors((prev) => {
        if (r.ok) {
          const { [clientId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [clientId]: r.fieldErrors };
      });
    },
    [units, buildings],
  );

  const goNext = () => {
    setFormError(null);
    if (step === 1) {
      const s1 = parseStep1({
        name: propertyName,
        type: propertyType,
        managerId,
        accountantId,
      });
      if (!s1.success) {
        setStep1FieldErrors(mapStep1Issues(s1.error));
        setFormError(firstIssueMessage(s1.error));
        return;
      }
      setStep1FieldErrors({});
      setStep(2);
      return;
    }
    if (step === 2) {
      const s2 = parseBuildingsStep(buildings);
      if (!s2.success) {
        setBuildingFieldErrors(mapArrayIssuesByClientId(s2.error, buildings));
        setFormError(firstIssueMessage(s2.error));
        return;
      }
      setBuildingFieldErrors({});
      setStep(3);
    }
  };

  const goBack = () => {
    setFormError(null);
    if (step > 1) setStep((s) => s - 1);
  };

  useEffect(() => {
    if (step !== 1) setStep1FieldErrors({});
  }, [step]);

  useEffect(() => {
    if (step !== 2) setBuildingFieldErrors({});
  }, [step]);

  useEffect(() => {
    if (step !== 3) setUnitFieldErrors({});
  }, [step]);

  const focusableSelector = 'input:not([type="hidden"]), select, textarea, button';

  const focusRelative = useCallback((current: Element, direction: 1 | -1) => {
    const root = stepContainerRef.current;
    if (!root) return;
    const list = Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>(
        focusableSelector,
      ),
    ).filter((el) => {
      if (el.hasAttribute("data-skip-focus")) return false;
      if (el.tabIndex === -1) return false;
      return !el.disabled;
    });
    const idx = list.findIndex((el) => el === current);
    if (idx === -1) return;
    const next = list[idx + direction];
    next?.focus();
  }, []);

  const onStepKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (step < 3) goNext();
      else if (!submitWizard.isPending) validateAndSubmit();
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
  };

  useEffect(() => {
    const onWin = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!(e.altKey && !e.metaKey && !e.ctrlKey)) return;
      if (e.code === "KeyB") {
        e.preventDefault();
        if (step === 2) addBuilding();
      }
      if (e.code === "KeyU") {
        e.preventDefault();
        if (step === 3) addUnit();
      }
      if (e.code === "KeyD") {
        e.preventDefault();
        if (step === 2) duplicateLastBuildingShortcut();
        if (step === 3) duplicateLastUnit();
      }
    };
    window.addEventListener("keydown", onWin);
    return () => window.removeEventListener("keydown", onWin);
  }, [addBuilding, addUnit, duplicateLastBuildingShortcut, duplicateLastUnit, step]);

  const managers = managersQuery.data ?? [];
  const accountants = accountantsQuery.data ?? [];

  const stepTitle = useMemo(() => {
    if (step === 1) return "General info";
    if (step === 2) return "Building data";
    return "Units";
  }, [step]);

  return (
    <div ref={stepContainerRef} className="mx-auto max-w-5xl space-y-6" onKeyDown={onStepKeyDown}>
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
                step === n
                  ? "bg-primary text-primary-foreground"
                  : step > n
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {n}
            </div>
            <span
              className={`text-sm font-medium ${step === n ? "text-foreground" : "text-muted-foreground"}`}
            >
              {n === 1 ? "General" : n === 2 ? "Buildings" : "Units"}
            </span>
            {n < 3 ? <div className="bg-border mx-1 hidden h-px w-8 sm:block" /> : null}
          </div>
        ))}
        <span className="text-muted-foreground ml-auto text-xs">{stepTitle}</span>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{formError}</AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? (
        <StepGeneral
          fieldErrors={step1FieldErrors}
          onStep1FieldBlur={handleStep1FieldBlur}
          propertyType={propertyType}
          onPropertyTypeChange={(v) => {
            setPropertyType(v);
            setStep1FieldErrors((e) => ({ ...e, type: undefined }));
          }}
          propertyName={propertyName}
          onPropertyNameChange={(v) => {
            setPropertyName(v);
            setStep1FieldErrors((e) => ({ ...e, name: undefined }));
          }}
          managerId={managerId}
          onManagerIdChange={(id) => {
            setManagerId(id);
            setStep1FieldErrors((e) => ({ ...e, managerId: undefined }));
          }}
          accountantId={accountantId}
          onAccountantIdChange={(id) => {
            setAccountantId(id);
            setStep1FieldErrors((e) => ({ ...e, accountantId: undefined }));
          }}
          newManagerName={newManagerName}
          onNewManagerNameChange={setNewManagerName}
          newAccountantName={newAccountantName}
          onNewAccountantNameChange={setNewAccountantName}
          managers={managers}
          accountants={accountants}
          createManagerMutation={createManagerMutation}
          createAccountantMutation={createAccountantMutation}
        />
      ) : null}

      {step === 2 ? (
        <StepBuildings
          buildings={buildings}
          fieldErrors={buildingFieldErrors}
          onBuildingBlur={handleBuildingBlur}
          onUpdateBuilding={updateBuilding}
          onDuplicateBuilding={duplicateBuilding}
          onRemoveBuilding={removeBuilding}
          onAddBuilding={addBuilding}
        />
      ) : null}

      {step === 3 ? (
        <StepUnits
          buildings={buildings}
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
          resolvedBulkBuildingId={resolvedBulkBuildingId}
          onBulkBuildingIdChange={setBulkBuildingId}
          onGenerateBulkUnits={generateBulkUnits}
          onToggleExpandUnit={toggleExpandUnit}
          onUpdateUnit={updateUnit}
          onRemoveUnit={removeUnit}
          onAddUnit={addUnit}
          onUnitBlur={handleUnitBlur}
        />
      ) : null}

      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <Button type="button" variant="outline" disabled={step === 1} onClick={goBack}>
          Back
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/">Cancel</Link>
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={goNext}>
              Next step
            </Button>
          ) : (
            <Button
              type="button"
              disabled={submitWizard.isPending}
              onClick={() => {
                validateAndSubmit();
              }}
            >
              {submitWizard.isPending ? "Creating…" : "Create property"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
