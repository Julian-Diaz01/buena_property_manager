import { Plus, Trash2 } from "lucide-react";

import { MAIN_ENTRANCE_LABEL } from "./building-rail-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type BuildingEntrancesFieldProps = {
  value: string[];
  onChange: (next: string[]) => void;
  idPrefix?: string;
  errorMessage?: string;
};

export function BuildingEntrancesField({
  value,
  onChange,
  idPrefix = "ent",
  errorMessage,
}: BuildingEntrancesFieldProps) {
  const updateAt = (index: number, text: string) => {
    const next = [...value];
    next[index] = text;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...value, ""]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Label>Entrances</Label>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Optional. Leave empty to use the default main entrance for new units.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          Add entrance
        </Button>
      </div>
      {value.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No custom entrances — units default to &quot;{MAIN_ENTRANCE_LABEL}&quot;.
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((row, i) => (
            <li key={i} className="flex gap-2">
              <Input
                id={`${idPrefix}-${i}`}
                value={row}
                onChange={(e) => updateAt(i, e.target.value)}
                placeholder={`e.g. Entrance ${i + 1}`}
                maxLength={50}
                className="flex-1"
                aria-label={`Entrance ${i + 1}`}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeAt(i)} aria-label="Remove entrance">
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {errorMessage ? <p className="text-destructive text-xs">{errorMessage}</p> : null}
    </div>
  );
}
