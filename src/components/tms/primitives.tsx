import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tms";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-info/12 text-info",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/18 text-warn",
  danger: "bg-signal/12 text-signal",
  primary: "bg-primary/12 text-primary",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1 rounded-xs px-2 py-1 leading-none",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display-title text-3xl leading-none text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: Tone;
}) {
  const valueTone: Record<Tone, string> = {
    neutral: "text-foreground",
    info: "text-info",
    ok: "text-ok",
    warn: "text-warn",
    danger: "text-signal",
    primary: "text-primary",
  };
  return (
    <div className="panel flex items-start justify-between gap-3 p-5">
      <div>
        <p className="label-mono text-muted-foreground">{label}</p>
        <p className={cn("display-title mt-3 text-3xl leading-none", valueTone[tone])}>{value}</p>
      </div>
      {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="label-mono text-foreground">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-5 py-16 text-center">
      <p className="label-mono text-muted-foreground">{title}</p>
      {hint ? <p className="mt-2 text-sm text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

export function TableShell({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/60">
            {columns.map((c) => (
              <th
                key={c}
                className="label-mono px-5 py-3 text-left font-semibold text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}