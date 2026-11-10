import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, Loader2 } from "lucide-react";
import { askAgent, getRun } from "@/lib/api/agent.functions";
import { listDocuments } from "@/lib/api/documents.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { PageHeader } from "@/components/page-header";
import { RunView, type RunData } from "@/components/run-view";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/app/agent")({
  head: () => ({ meta: [{ title: "Agent Workspace — OpsAtlas AI" }, { name: "description", content: "Ask operational questions and get citation-backed answers." }] }),
  component: Agent,
});

const SUGGESTED = [
  "Find policies related to supplier escalation and explain what actions we should take.",
  "Summarize the return policy. Which product categories have shorter return windows?",
  "What happens if a warehouse misses its same-day ship target?",
  "Who must approve a $40,000 purchase order from a supplier in Escalation status?",
  "What is our policy on employee travel reimbursement?",
];

function Agent() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const askFn = useServerFn(askAgent);
  const getRunFn = useServerFn(getRun);
  const docsFn = useServerFn(listDocuments);
  const docs = useQuery({ queryKey: ["documents"], queryFn: () => docsFn() });
  const [q, setQ] = useState("");
  const [runId, setRunId] = useState<string | null>(null);

  const run = useQuery({ queryKey: ["run", runId], queryFn: () => getRunFn({ data: { runId: runId! } }), enabled: !!runId });
  const ask = useMutation({
    mutationFn: (question: string) => askFn({ data: { workspaceId: ws.data!.id, question } }),
    onSuccess: (r) => { setRunId(r.runId); if (r.error) toast.error(r.error); qc.invalidateQueries({ queryKey: ["runs"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Request failed"),
  });
  const readyCount = docs.data?.filter((d) => d.status === "ready").length ?? 0;
  const submit = (text = q) => { const t = text.trim(); if (t.length < 3 || !ws.data) return; setQ(t); ask.mutate(t); };

  return (
    <>
      <PageHeader title="Agent Workspace" description="Retrieves evidence from your workspace, generates an answer, then verifies every citation." />
      <div className="space-y-6 p-6 lg:p-8">
        {docs.data && readyCount === 0 && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">No searchable documents yet. <Link to="/app/knowledge" className="text-primary underline-offset-4 hover:underline">Load the Atlas demo docs or upload files</Link> first.</div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="rounded-xl border border-border bg-card p-3 focus-within:border-primary/60">
          <Textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about your operations, policies, or procedures…" maxLength={2000}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            className="min-h-20 resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0" />
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-xs text-muted-foreground">{readyCount} searchable document{readyCount === 1 ? "" : "s"} · hybrid retrieval · top 8</span>
            <Button type="submit" size="icon" disabled={ask.isPending || q.trim().length < 3 || !ws.data} aria-label="Ask">{ask.isPending ? <Loader2 className="animate-spin" /> : <ArrowUp />}</Button>
          </div>
        </form>
        {!runId && !ask.isPending && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => <button key={s} onClick={() => submit(s)} disabled={!ws.data} className="rounded-full border border-border bg-surface px-3 py-1.5 text-left text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground">{s}</button>)}
          </div>
        )}
        {ask.isPending && (
          <div className="rounded-xl border border-border bg-card p-6 font-mono text-xs text-muted-foreground">
            <p className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />Embedding query → hybrid search → generating answer → verifying citations…</p>
          </div>
        )}
        {run.data && !ask.isPending && (
          <>
            <RunView data={run.data as RunData} />
            <Link to="/app/runs/$id" params={{ id: run.data.run.id }} className="text-xs text-primary">Open in run inspector →</Link>
          </>
        )}
      </div>
    </>
  );
}
