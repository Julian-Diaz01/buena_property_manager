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
import type { Accountant, Manager, PropertyType } from "@/lib/api/types";

type CreatePersonInput = { fullName: string };

export type StepGeneralProps = {
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
        <Select value={propertyType} onValueChange={(v) => onPropertyTypeChange(v as PropertyType)}>
          <SelectTrigger id="mgmt-type" className="w-full max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WEG">WEG (Wohnungseigentümergemeinschaft)</SelectItem>
            <SelectItem value="MV">MV (Mietverwalter)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="prop-name">Property name</Label>
        <Input
          id="prop-name"
          value={propertyName}
          onChange={(e) => onPropertyNameChange(e.target.value)}
          placeholder="e.g. Musterstraße complex"
          autoComplete="off"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="manager">Property manager</Label>
          <Select value={managerId} onValueChange={onManagerIdChange}>
            <SelectTrigger id="manager" className="w-full">
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountant">Accountant</Label>
          <Select value={accountantId} onValueChange={onAccountantIdChange}>
            <SelectTrigger id="accountant" className="w-full">
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
        </div>
      </div>
    </Card>
  );
}
