import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createAccountant, listAccountants } from "@/lib/api/accountants";
import { createBuilding } from "@/lib/api/buildings";
import { createManager, listManagers } from "@/lib/api/managers";
import { createProperty } from "@/lib/api/properties";
import { queryKeys } from "@/lib/api/query-keys";
import type { PropertyType, UnitNestedInput, UnitType } from "@/lib/api/types";
import { parseOptionalInt } from "@/lib/app/unit-helpers";

import {
  entrancesForApi,
  canAppendOneMoreUnit,
  pickBuildingClientIdForNewUnit,
  totalUnitsForBuilding,
} from "@/components/app/createPropertyWizard/building-rail-helpers";
import { generateBulkLocalUnits } from "./bulk-units";
import { localUnitToNestedInput } from "./local-unit-mappers";
import {
  defaultBuilding,
  defaultUnit,
  newClientId,
  type LocalBuilding,
  type LocalUnit,
} from "./types";
import { useWizardKeyboardShortcuts } from "./use-wizard-keyboard-shortcuts";

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
    setBuildings((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((b) => b.clientId !== clientId);
      setUnits((u) => u.filter((unit) => unit.buildingClientId !== clientId));
      return next;
    });
  }, []);

  const updateBuilding = useCallback((clientId: string, patch: Partial<LocalBuilding>) => {
    setBuildings((prev) => prev.map((b) => (b.clientId === clientId ? { ...b, ...patch } : b)));
  }, []);

  const addUnit = useCallback(() => {
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
    setUnits((prev) => prev.filter((u) => u.clientId !== clientId));
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      next.delete(clientId);
      return next;
    });
  }, []);

  const updateUnit = useCallback((clientId: string, patch: Partial<LocalUnit>) => {
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
    if (!res.ok) return;
    setUnits((prev) => [...prev, ...res.units]);
    setBulkMode(false);
  }, [buildings, bulkFloorEnd, bulkFloorStart, bulkUnitType, bulkUnitsPerFloor, resolvedBulkBuildingId, units]);

  const mapUnitsForBuilding = useCallback(
    (buildingClientId: string): UnitNestedInput[] =>
      units.filter((u) => u.buildingClientId === buildingClientId).map((u) => localUnitToNestedInput(u)),
    [units],
  );

  const submitWizard = useMutation({
    mutationFn: async () => {
      const property = await createProperty({
        name: propertyName.trim(),
        type: propertyType,
        managerId,
        accountantId,
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
  });

  const validateAndSubmit = useCallback(() => {
    submitWizard.mutate();
  }, [submitWizard]);

  const goNext = useCallback(() => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) setStep(3);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  useWizardKeyboardShortcuts(
    true,
    step === 2 ? "buildings" : step === 3 ? "units" : null,
    addBuilding,
    duplicateLastBuildingShortcut,
    addUnit,
    duplicateLastUnit,
  );

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
    goNext,
    goBack,
    canAddSingleUnit,
    addSingleUnitHint,
  };
}
