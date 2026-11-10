import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";
import { listDocuments } from "@/server/documents.functions";
import { listRuns } from "@/server/agent.functions";
import { PageHeader, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Overview — OpsAtlas AI" }, { name: "description", content: "Workspace overview: knowledge base and agent activity." }] }),
  component: Overview,
});

function Overview() {
  const docsFn = useServerFn(listDocuments);
  const runsFn = useServerFn(listRuns);
  const docs = useQuery({ queryKey: ["documents"], queryFn: () => docsFn() });
  const runs = useQuery({ queryKey: ["runs"], queryFn: () => runsFn() });
  const ready = docs.data?.filter((d) => d.status === "ready") ?? [];
  const chunks = ready.reduce((n, d) => n + d.chunk_count, 0);
  const done = runs.data?.filter((r) => r.status === "completed") ?? [];
  const avgLatency = done.length ? Math.round(done.reduce((n, r) => n + (r.latency_ms ?? 0), 0) / done.length) : null;
  const tokens = done.reduce((n, r) => n + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0);

  const stats = [
    { label: "Searchable documents", value: docs.isLoading ? "…" : ready.length },
    { label: "Indexed chunks", value: docs.isLoading ? "…" : chunks },
    { label: "Agent runs", value: runs.isLoading ? "…" : runs.data?.length ?? 0 },
    { label: "Avg. run latency", value: avgLatency == null ? "–" : `${(avgLatency / 1000).toFixed(1)}s` },
    { label: "Tokens used", value: runs.isLoading ? "…" : tokens.toLocaleString() },
  ];

  return (
    <>
      <PageHeader title="Overview" description="Live figures from your workspace." actions={<Button asChild><Link to="/app/agent">Ask the agent <ArrowRight /></Link></Button>} />
      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        {docs.data && docs.data.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="font-medium">Your knowledge base is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Load the synthetic Atlas Distribution documents or upload your own PDFs and text files.</p>
            <Button asChild className="mt-4" variant="outline"><Link to="/app/knowledge">Go to Knowledge Base</Link></Button>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3 text-sm font-medium">Recent runs <Link to="/app/runs" className="text-xs text-primary">View all</Link></div>
          <ul className="divide-y divide-border">
            {(runs.data ?? []).slice(0, 6).map((r) => (
              <li key={r.id}>
                <Link to="/app/runs/$id" params={{ id: r.id }} className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-surface">
                  <span className="min-w-0 flex-1 truncate">{r.question}</span>
                  <StatusPill status={r.status} />
                  <span className="hidden w-32 text-right text-xs text-muted-foreground sm:block">{new Date(r.created_at).toLocaleString()}</span>
                </Link>
              </li>
            ))}
            {runs.data?.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">No runs yet.</li>}
          </ul>
        </div>
      </div>
    </>
  );
}
