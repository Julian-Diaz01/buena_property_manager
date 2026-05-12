import { useEffect } from "react";

/**
 * Alt+B / Alt+D on buildings step, Alt+U / Alt+D on units step (same as create-property wizard).
 * Use `enabled` so overlays/dialogs only listen while open.
 * Pass no-op functions for handlers that are irrelevant to the current `scope` (e.g. buildings-only callbacks when scope is `"units"`).
 */
export function useWizardKeyboardShortcuts(
  enabled: boolean,
  scope: "buildings" | "units" | null,
  addBuilding: () => void,
  duplicateLastBuilding: () => void,
  addUnit: () => void,
  duplicateLastUnit: () => void,
) {
  useEffect(() => {
    if (!enabled || !scope) return;
    const onWin = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!(e.altKey && !e.metaKey && !e.ctrlKey)) return;
      if (scope === "buildings") {
        if (e.code === "KeyB") {
          e.preventDefault();
          addBuilding();
        } else if (e.code === "KeyD") {
          e.preventDefault();
          duplicateLastBuilding();
        }
      } else {
        if (e.code === "KeyU") {
          e.preventDefault();
          addUnit();
        } else if (e.code === "KeyD") {
          e.preventDefault();
          duplicateLastUnit();
        }
      }
    };
    window.addEventListener("keydown", onWin);
    return () => window.removeEventListener("keydown", onWin);
  }, [enabled, scope, addBuilding, duplicateLastBuilding, addUnit, duplicateLastUnit]);
}
