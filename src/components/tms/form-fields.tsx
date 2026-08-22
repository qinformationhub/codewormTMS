import type { ReactNode } from "react";

export const field =
  "h-11 w-full rounded-xs bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground";

export function Field({
  label,
  children,
  full,
  hint,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
  hint?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="label-mono text-muted-foreground">{label}</label>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CheckChip({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`label-mono rounded-xs px-3 py-2 transition-colors ${
        checked ? "bg-signal/15 text-signal" : "bg-secondary text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="sm:col-span-2">
      <p className="label-mono text-foreground">{title}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}