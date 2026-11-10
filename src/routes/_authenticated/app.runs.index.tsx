import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listRuns } from "@/lib/api/agent.functions";
import { PageHeader, StatusPill } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/app/runs/")({
  head: () => ({ meta: [{ title: "Agent Runs — OpsAtlas AI" }, { name: "description", content: "Execution history for every agent run." }] }),
  component: Runs,
});

function Runs() {
  const fn = useServerFn(listRuns);
  const runs = useQuery({ queryKey: ["runs"], queryFn: () => fn() });
  return (
    <>
      <PageHeader title="Agent Runs" description="Every question, its steps, latency and token usage." />
      <div className="p-6 lg:p-8">
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr><th className="px-5 py-3 font-medium">Question</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Latency</th><th className="px-3 py-3 font-medium">Tokens</th><th className="px-3 py-3 font-medium">Model</th><th className="px-5 py-3 font-medium">When</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.data?.map((r) => (
                <tr key={r.id} className="hover:bg-surface">
                  <td className="max-w-md px-5 py-3"><Link to="/app/runs/$id" params={{ id: r.id }} className="line-clamp-1 hover:text-primary">{r.question}</Link>{r.error && <p className="text-xs text-destructive">{r.error}</p>}</td>
                  <td className="px-3 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-3 py-3 font-mono text-xs">{r.latency_ms != null ? `${(r.latency_ms / 1000).toFixed(2)}s` : "–"}</td>
                  <td className="px-3 py-3 font-mono text-xs">{r.input_tokens != null ? `${r.input_tokens} / ${r.output_tokens}` : "–"}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{r.model}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {runs.data?.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No runs yet. <Link to="/app/agent" className="text-primary">Ask the agent</Link>.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
