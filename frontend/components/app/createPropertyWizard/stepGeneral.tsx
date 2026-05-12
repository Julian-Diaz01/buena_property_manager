import type { UseMutationResult } from "@tanstack/react-query";

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
import { cn } from "@/lib/utils";
import type { Accountant, Manager, PropertyType } from "@/lib/api/types";

import type { Step1BlurField, Step1FieldErrors } from "./schemas";
import { FieldError } from "./shared";

type CreatePersonInput = { fullName: string };

export type StepGeneralProps = {
  fieldErrors?: Step1FieldErrors;
  onStep1FieldBlur?: (field: Step1BlurField) => void;
  propertyType: PropertyType;
  onPropertyTypeChange: (type: PropertyType) => void;
  propertyName: string;
  onPropertyNameChange: (name: string) => void;
  managerId: string;
  onManagerIdChange: (id: string) => void;
  accountantId: string;
  onAccountantIdChange: (id: string) => void;
  newManagerName: string;
  onNewManagerNameChange: (name: string) => void;
  newAccountantName: string;
  onNewAccountantNameChange: (name: string) => void;
  managers: Manager[];
  accountants: Accountant[];
  createManagerMutation: UseMutationResult<Manager, Error, CreatePersonInput>;
  createAccountantMutation: UseMutationResult<Accountant, Error, CreatePersonInput>;
};

export function StepGeneral({
  fieldErrors,
  onStep1FieldBlur,
  propertyType,
  onPropertyTypeChange,
  propertyName,
  onPropertyNameChange,
  managerId,
  onManagerIdChange,
  accountantId,
  onAccountantIdChange,
  newManagerName,
  onNewManagerNameChange,
  newAccountantName,
  onNewAccountantNameChange,
  managers,
  accountants,
  createManagerMutation,
  createAccountantMutation,
}: StepGeneralProps) {
  return (
    <Card className="border-border space-y-6 p-6">
      <div className="space-y-2">
        <Label htmlFor="mgmt-type">Management type</Label>
        <Select
          value={propertyType}
          onValueChange={(v) => onPropertyTypeChange(v as PropertyType)}
          onOpenChange={(open) => {
            if (!open) onStep1FieldBlur?.("type");
          }}
        >
          <SelectTrigger
            id="mgmt-type"
            className={cn("w-full max-w-md", fieldErrors?.type && "border-destructive")}
            aria-invalid={!!fieldErrors?.type}
            onBlur={() => onStep1FieldBlur?.("type")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WEG">WEG (Wohnungseigentümergemeinschaft)</SelectItem>
            <SelectItem value="MV">MV (Mietverwalter)</SelectItem>
          </SelectContent>
        </Select>
        <FieldError message={fieldErrors?.type} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="prop-name">Property name</Label>
        <Input
          id="prop-name"
          value={propertyName}
          onChange={(e) => onPropertyNameChange(e.target.value)}
          onBlur={() => onStep1FieldBlur?.("name")}
          placeholder="e.g. Musterstraße complex"
          autoComplete="off"
          className={cn(fieldErrors?.name && "border-destructive")}
          aria-invalid={!!fieldErrors?.name}
        />
        <FieldError message={fieldErrors?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="manager">Property manager</Label>
          <Select
            value={managerId}
            onValueChange={onManagerIdChange}
            onOpenChange={(open) => {
              if (!open) onStep1FieldBlur?.("managerId");
            }}
          >
            <SelectTrigger
              id="manager"
              className={cn("w-full", fieldErrors?.managerId && "border-destructive")}
              aria-invalid={!!fieldErrors?.managerId}
              onBlur={() => onStep1FieldBlur?.("managerId")}
            >
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="New manager full name"
              value={newManagerName}
              onChange={(e) => onNewManagerNameChange(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!newManagerName.trim() || createManagerMutation.isPending}
              onClick={() => createManagerMutation.mutate({ fullName: newManagerName.trim() })}
            >
              Add
            </Button>
          </div>
          <FieldError message={fieldErrors?.managerId} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountant">Accountant</Label>
          <Select
            value={accountantId}
            onValueChange={onAccountantIdChange}
            onOpenChange={(open) => {
              if (!open) onStep1FieldBlur?.("accountantId");
            }}
          >
            <SelectTrigger
              id="accountant"
              className={cn("w-full", fieldErrors?.accountantId && "border-destructive")}
              aria-invalid={!!fieldErrors?.accountantId}
              onBlur={() => onStep1FieldBlur?.("accountantId")}
            >
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {accountants.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="New accountant full name"
              value={newAccountantName}
              onChange={(e) => onNewAccountantNameChange(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!newAccountantName.trim() || createAccountantMutation.isPending}
              onClick={() => createAccountantMutation.mutate({ fullName: newAccountantName.trim() })}
            >
              Add
            </Button>
          </div>
          <FieldError message={fieldErrors?.accountantId} />
        </div>
      </div>
    </Card>
  );
}
