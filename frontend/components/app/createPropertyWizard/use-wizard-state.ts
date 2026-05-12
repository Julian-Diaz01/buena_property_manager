import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createAccountant, listAccountants } from "@/lib/api/accountants";
import { createBuilding } from "@/lib/api/buildings";
import { createManager, listManagers } from "@/lib/api/managers";
import { createProperty } from "@/lib/api/properties";
import { queryKeys } from "@/lib/api/query-keys";
import type { PropertyType, UnitNestedInput, UnitType } from "@/lib/api/types";
import { parseOptionalInt } from "@/lib/app/unit-helpers";

import { entrancesForApi, canAppendOneMoreUnit, pickBuildingClientIdForNewUnit, totalUnitsForBuilding } from "./building-rail-helpers";
import { generateBulkLocalUnits } from "./bulk-units";
import { localUnitToNestedInput } from "./local-unit-mappers";
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

export type WizardState = ReturnType<typeof useWizardState>;

export function useWizardState() {
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

  const canAddSingleUnit = useMemo(
    () => pickBuildingClientIdForNewUnit(buildings, units) !== null,
    [buildings, units],
  );
  const addSingleUnitHint = canAddSingleUnit ? undefined : "Every building is at its max units limit.";

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
        floors: "",
        maxApartments: "",
        entrances: [],
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
        entrances: [...source.entrances],
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
          entrances: [...last.entrances],
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
    setUnitFieldErrors({});
    setUnits((prev) => {
      const bid = pickBuildingClientIdForNewUnit(buildings, prev);
      if (!bid) return prev;
      const b = buildings.find((x) => x.clientId === bid);
      return [...prev, defaultUnit(bid, b)];
    });
    setBulkMode(false);
  }, [buildings]);

  const duplicateLastUnit = useCallback(() => {
    setUnits((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      const b = buildings.find((x) => x.clientId === last.buildingClientId);
      const countForB = totalUnitsForBuilding(prev, last.buildingClientId);
      if (b && !canAppendOneMoreUnit(b, countForB, 0)) return prev;
      return [
        ...prev,
        {
          ...last,
          clientId: newClientId(),
          number: "",
        },
      ];
    });
  }, [buildings]);

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
    const b = buildings.find((x) => x.clientId === resolvedBulkBuildingId);
    const draftForB = units.filter((u) => u.buildingClientId === resolvedBulkBuildingId).length;
    const res = generateBulkLocalUnits({
      buildingClientId: resolvedBulkBuildingId,
      building: b,
      draftUnitsForBuilding: draftForB,
      persistedUnitsForBuilding: 0,
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
  }, [buildings, bulkFloorEnd, bulkFloorStart, bulkUnitType, bulkUnitsPerFloor, resolvedBulkBuildingId, units]);

  const mapUnitsForBuilding = useCallback(
    (buildingClientId: string): UnitNestedInput[] =>
      units.filter((u) => u.buildingClientId === buildingClientId).map((u) => localUnitToNestedInput(u)),
    [units],
  );

  const submitWizard = useMutation({
    mutationFn: async () => {
      const s1 = parseStep1({ name: propertyName, type: propertyType, managerId, accountantId });
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
        const floors = parseOptionalInt(b.floors);
        const maxApartments = parseOptionalInt(b.maxApartments);
        const entrancesPayload = entrancesForApi(b.entrances);
        await createBuilding({
          propertyId: property.id,
          street: b.street.trim(),
          houseNumber: b.houseNumber.trim(),
          description: descriptionParts.length ? descriptionParts.join(" — ") : undefined,
          ...(floors !== undefined ? { floors } : {}),
          ...(maxApartments !== undefined ? { maxApartments } : {}),
          ...(entrancesPayload ? { entrances: entrancesPayload } : {}),
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
    const s1 = parseStep1({ name: propertyName, type: propertyType, managerId, accountantId });
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

  const goNext = useCallback(() => {
    setFormError(null);
    if (step === 1) {
      const s1 = parseStep1({ name: propertyName, type: propertyType, managerId, accountantId });
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
  }, [accountantId, buildings, managerId, propertyName, propertyType, step]);

  const goBack = useCallback(() => {
    setFormError(null);
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  useEffect(() => {
    if (step !== 1) setStep1FieldErrors({});
  }, [step]);

  useEffect(() => {
    if (step !== 2) setBuildingFieldErrors({});
  }, [step]);

  useEffect(() => {
    if (step !== 3) setUnitFieldErrors({});
  }, [step]);

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

  return {
    stepContainerRef,
    step,
    propertyType,
    setPropertyType,
    propertyName,
    setPropertyName,
    managerId,
    setManagerId,
    accountantId,
    setAccountantId,
    newManagerName,
    setNewManagerName,
    newAccountantName,
    setNewAccountantName,
    buildings,
    units,
    expandedUnits,
    bulkMode,
    setBulkMode,
    bulkFloorStart,
    setBulkFloorStart,
    bulkFloorEnd,
    setBulkFloorEnd,
    bulkUnitsPerFloor,
    setBulkUnitsPerFloor,
    bulkUnitType,
    setBulkUnitType,
    resolvedBulkBuildingId,
    setBulkBuildingId,
    formError,
    step1FieldErrors,
    setStep1FieldErrors,
    buildingFieldErrors,
    unitFieldErrors,
    managers: managersQuery.data ?? [],
    accountants: accountantsQuery.data ?? [],
    createManagerMutation,
    createAccountantMutation,
    addBuilding,
    duplicateBuilding,
    removeBuilding,
    updateBuilding,
    addUnit,
    removeUnit,
    updateUnit,
    toggleExpandUnit,
    generateBulkUnits,
    submitWizard,
    validateAndSubmit,
    handleStep1FieldBlur,
    handleBuildingBlur,
    handleUnitBlur,
    goNext,
    goBack,
    canAddSingleUnit,
    addSingleUnitHint,
  };
}
