import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRun } from "@/lib/api/agent.functions";
import { PageHeader, StatusPill } from "@/components/page-header";
import { RunView, type RunData } from "@/components/run-view";

export const Route = createFileRoute("/_authenticated/app/runs/$id")({
  head: () => ({ meta: [{ title: "Run Inspector — OpsAtlas AI" }, { name: "description", content: "Inspect retrieval, generation and citation verification for one run." }] }),
  component: RunPage,
});

function RunPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getRun);
  const run = useQuery({ queryKey: ["run", id], queryFn: () => fn({ data: { runId: id } }) });
  return (
    <>
      <PageHeader title="Run Inspector" description={`Run ${id}`} actions={run.data && <StatusPill status={run.data.run.status} />} />
      <div className="p-6 lg:p-8">
        <Link to="/app/runs" className="mb-4 inline-block text-xs text-primary">← All runs</Link>
        {run.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {run.error && <p className="text-sm text-destructive">{run.error.message}</p>}
        {run.data && <RunView data={run.data as RunData} />}
      </div>
    </>
  );
}
