import { Fragment, useState, type ReactNode } from "react";
import { FileText, X, AlertTriangle } from "lucide-react";
import { StatusPill } from "@/components/page-header";

type Citation = { marker: number; document_title: string; document_version: number; page_number: number | null; section: string | null; passage: string; chunk_id: string | null };
type Step = { id: string; step_index: number; kind: string; name: string; status: string; duration_ms: number | null; input: unknown; output: unknown };
type Claim = { text: string; type: string; source_ids: number[]; verified: boolean };
type Answer = { text: string; claims: Claim[]; insufficient_evidence: boolean; invalid_markers: number[]; unsupported_fact_claims: number };
export type RunData = {
  run: { id: string; question: string; status: string; answer: unknown; error: string | null; model: string; latency_ms: number | null; input_tokens: number | null; output_tokens: number | null; prompt_version: string; created_at: string };
  steps: Step[];
  citations: Citation[];
};

const CLAIM_LABEL: Record<string, string> = {
  document_fact: "Document fact",
  interpretation: "Interpretation",
  recommendation: "Recommendation",
  unknown: "Unknown / unsupported",
};
const CLAIM_STYLE: Record<string, string> = {
  document_fact: "bg-success/15 text-success",
  interpretation: "bg-primary/15 text-primary",
  recommendation: "bg-warning/15 text-warning",
  unknown: "bg-muted text-muted-foreground",
};

export function RunView({ data }: { data: RunData }) {
  const answer = data.run.answer as Answer | null;
  const [active, setActive] = useState<number | null>(null);
  const cit = active != null ? data.citations.find((c) => c.marker === active) : undefined;
  const byMarker = new Map(data.citations.map((c) => [c.marker, c]));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Question</p>
          <p className="mt-1">{data.run.question}</p>
        </div>

        {data.run.status === "failed" && (
          <div className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <p>{data.run.error ?? "The run failed."}</p>
          </div>
        )}

        {answer && (
          <div className="rounded-xl border border-border bg-card p-6">
            {answer.insufficient_evidence && (
              <div className="mb-4 flex gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning"><AlertTriangle className="h-4 w-4 shrink-0" />Evidence in your documents is insufficient for a complete answer.</div>
            )}
            <Markdown text={answer.text} onCite={(n) => setActive(n)} known={byMarker} />
            {(answer.invalid_markers.length > 0 || answer.unsupported_fact_claims > 0) && (
              <p className="mt-4 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                Verifier removed {answer.invalid_markers.length} citation(s) to sources that were not retrieved and downgraded {answer.unsupported_fact_claims} unsupported fact claim(s).
              </p>
            )}
          </div>
        )}

        {answer && answer.claims.length > 0 && (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3 text-sm font-medium">Claim grounding</div>
            <ul className="divide-y divide-border">
              {answer.claims.map((c, i) => (
                <li key={i} className="flex flex-wrap items-start gap-3 px-5 py-3 text-sm">
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${CLAIM_STYLE[c.type] ?? CLAIM_STYLE.unknown}`}>{CLAIM_LABEL[c.type] ?? c.type}</span>
                  <span className="min-w-0 flex-1">{c.text}</span>
                  <span className="flex gap-1">{c.source_ids.map((n) => <CiteBtn key={n} n={n} onClick={() => setActive(n)} />)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3 text-sm">
            <span className="font-medium">Execution timeline</span>
            <span className="font-mono text-xs text-muted-foreground">
              {data.run.model} · {data.run.prompt_version} · {data.run.latency_ms ?? "–"}ms · {data.run.input_tokens ?? "–"} in / {data.run.output_tokens ?? "–"} out tokens
            </span>
          </div>
          <ol className="divide-y divide-border">
            {data.steps.map((s) => (
              <li key={s.id} className="px-5 py-3">
                <details>
                  <summary className="flex cursor-pointer list-none items-center gap-3 text-sm">
                    <span className="w-6 font-mono text-xs text-muted-foreground">{s.step_index + 1}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{s.kind}</span>
                    <span className="font-mono">{s.name}</span>
                    <span className="ml-auto flex items-center gap-3"><span className="font-mono text-xs text-muted-foreground">{s.duration_ms}ms</span><StatusPill status={s.status} /></span>
                  </summary>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <JsonBlock label="Input" value={s.input} />
                    <JsonBlock label="Output" value={s.output} />
                  </div>
                </details>
              </li>
            ))}
            {data.steps.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">No steps recorded.</li>}
          </ol>
        </div>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3 text-sm font-medium">
            Source inspector
            {cit && <button onClick={() => setActive(null)} aria-label="Close source"><X className="h-4 w-4 text-muted-foreground" /></button>}
          </div>
          {cit ? (
            <div className="space-y-3 p-5 text-sm">
              <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="font-medium">{cit.document_title}</p></div>
              <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div><dt>Source</dt><dd className="font-mono text-foreground">[{cit.marker}]</dd></div>
                <div><dt>Version</dt><dd className="text-foreground">v{cit.document_version}</dd></div>
                <div><dt>Page</dt><dd className="text-foreground">{cit.page_number ?? "n/a"}</dd></div>
                <div><dt>Section</dt><dd className="text-foreground">{cit.section ?? "n/a"}</dd></div>
              </dl>
              <blockquote className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border-l-2 border-primary bg-surface p-3 text-[13px] leading-relaxed">{cit.passage}</blockquote>
              <p className="font-mono text-[10px] text-muted-foreground">chunk {cit.chunk_id ?? "deleted"}</p>
            </div>
          ) : (
            <div className="p-5 text-sm text-muted-foreground">
              {data.citations.length ? (
                <ul className="space-y-2">
                  {data.citations.map((c) => (
                    <li key={c.marker}><button className="flex w-full items-start gap-2 text-left hover:text-foreground" onClick={() => setActive(c.marker)}><CiteBtn n={c.marker} /><span className="line-clamp-2">{c.document_title}{c.section ? ` — ${c.section}` : ""}</span></button></li>
                  ))}
                </ul>
              ) : "No verified citations for this run."}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function CiteBtn({ n, onClick }: { n: number; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-primary/15 px-1 font-mono text-[11px] text-primary hover:bg-primary/25">{n}</button>;
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <pre className="max-h-64 overflow-auto rounded-md bg-surface p-3 font-mono text-[11px] leading-relaxed">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

/** Minimal, safe markdown: headings, bullets, bold, and [n] citation markers. No raw HTML. */
function Markdown({ text, onCite, known }: { text: string; onCite: (n: number) => void; known: Map<number, Citation> }) {
  const inline = (s: string): ReactNode[] =>
    s.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((p, i) => {
      const b = p.match(/^\*\*(.+)\*\*$/);
      if (b) return <strong key={i}>{b[1]}</strong>;
      const c = p.match(/^\[(\d+)\]$/);
      if (c && known.has(Number(c[1]))) return <Fragment key={i}> <CiteBtn n={Number(c[1])} onClick={() => onCite(Number(c[1]))} /></Fragment>;
      return <Fragment key={i}>{p}</Fragment>;
    });
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      {blocks.map((blk, i) => {
        const lines = blk.split("\n");
        if (lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l))) {
          return <ul key={i} className="list-disc space-y-1 pl-5">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-*]|\d+\.)\s+/, ""))}</li>)}</ul>;
        }
        const h = blk.match(/^#{1,4}\s+(.+)$/);
        if (h) return <h3 key={i} className="pt-2 font-semibold">{inline(h[1]!)}</h3>;
        return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}</p>;
      })}
    </div>
  );
}
