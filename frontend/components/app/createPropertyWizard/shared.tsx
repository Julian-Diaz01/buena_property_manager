import { Fragment } from "react";

import { cn } from "@/lib/utils";

export function KeyboardShortcut({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((key, i) => (
        <Fragment key={`${key}-${i}`}>
          {i > 0 ? (
            <span className="text-muted-foreground/70 px-0.5 text-[0.65rem] leading-none" aria-hidden>
              +
            </span>
          ) : null}
          <kbd
            className={cn(
              "bg-muted text-muted-foreground border-border pointer-events-none inline-flex h-5 min-w-[1.125rem] items-center justify-center rounded border px-1 font-sans text-[0.65rem] font-medium shadow-sm",
            )}
          >
            {key}
          </kbd>
        </Fragment>
      ))}
    </span>
  );
}
