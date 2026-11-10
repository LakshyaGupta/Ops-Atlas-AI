import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  uploaded: "bg-muted text-muted-foreground",
  running: "bg-primary/15 text-primary",
  parsing: "bg-primary/15 text-primary",
  chunking: "bg-primary/15 text-primary",
  embedding: "bg-primary/15 text-primary",
  ok: "bg-success/15 text-success",
  error: "bg-destructive/15 text-destructive",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
