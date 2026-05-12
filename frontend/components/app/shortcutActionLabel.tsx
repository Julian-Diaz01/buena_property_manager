import { cn } from "@/lib/utils";

type ShortcutActionLabelProps = {
  shortcut: string;
  className?: string;
};

export function ShortcutActionLabel({ shortcut, className }: ShortcutActionLabelProps) {
  return (
    <span
      className={cn(
        "ml-2 shrink-0 text-xs font-normal tabular-nums text-primary-foreground/70",
        "hidden sm:inline",
        className,
      )}
      aria-hidden
    >
      {shortcut}
    </span>
  );
}
