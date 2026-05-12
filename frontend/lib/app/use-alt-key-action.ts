import { useEffect } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Global Alt+letter shortcut (no Ctrl/Meta). Skips when focus is in a field so typing is unaffected.
 */
export function useAltKeyAction(enabled: boolean, code: string, action: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onWin = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!(e.altKey && !e.metaKey && !e.ctrlKey)) return;
      if (e.code !== code) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      action();
    };
    window.addEventListener("keydown", onWin);
    return () => window.removeEventListener("keydown", onWin);
  }, [enabled, code, action]);
}
