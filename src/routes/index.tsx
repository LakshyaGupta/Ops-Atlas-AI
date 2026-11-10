import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, Network, ShieldCheck, Workflow, FileSearch, Database, ListTree, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpsAtlas AI — Business Intelligence That Can Explain Its Work" },
      { name: "description", content: "Connect documents and operational data, run AI-powered analysis, and make decisions backed by verifiable evidence." },
      { property: "og:title", content: "OpsAtlas AI — Business Intelligence That Can Explain Its Work" },
      { property: "og:description", content: "Citation-backed answers over your operations documents, with full execution traces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const benefits = [
  { icon: FileSearch, title: "Connected Knowledge", body: "Search business documents and policies in one place." },
  { icon: Network, title: "Agentic Analysis", body: "Combine retrieval, structured data tools, and AI reasoning." },
  { icon: BookOpenCheck, title: "Verifiable Results", body: "Trace findings back to their underlying evidence." },
  { icon: ShieldCheck, title: "Operational Control", body: "Review execution traces, costs, performance, and approvals." },
];

const steps = ["Connect your data", "Ask operational questions", "Watch approved tools execute", "Inspect evidence", "Generate actionable reports"];

const engineering = [
  { icon: Database, t: "Retrieval-augmented generation", d: "pgvector + full-text hybrid search fused with reciprocal rank fusion." },
  { icon: ShieldCheck, t: "Server-side orchestration", d: "Model calls, keys and tools never touch the browser. Workspace isolation enforced in the database." },
  { icon: ListTree, t: "Citation verification", d: "Citations are bound to retrieved chunk IDs; invented references are stripped and flagged." },
  { icon: Workflow, t: "Execution traces", d: "Every run records embedding, retrieval, generation and validation steps with timings." },
  { icon: Gauge, t: "Observability & evaluation", d: "Token usage and latency per run today; golden-set evaluation is on the roadmap." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Brand />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#capabilities" className="hover:text-foreground">Capabilities</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#engineering" className="hover:text-foreground">Engineering</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/app">Open app</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Your Operations. Connected, Analyzed, and Actionable.
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
            Business Intelligence That Can <span className="text-primary">Explain Its Work.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Connect documents and operational data, run AI-powered analysis, and make decisions backed by verifiable evidence.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/app/agent">Try the Interactive Demo <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth">Create Workspace</Link></Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Demo uses Atlas Distribution, a fully synthetic company. Sign-in required to keep your workspace private.</p>

          <ProductPreview />
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-4 md:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border border-border bg-card p-6">
              <b.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map((s, i) => (
              <li key={s} className="rounded-xl border border-border bg-card p-5">
                <span className="font-mono text-xs text-primary">0{i + 1}</span>
                <p className="mt-3 text-sm font-medium">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="engineering" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">Built like production infrastructure</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">OpsAtlas is designed around reliability, not demos. Every answer is reproducible from its stored trace.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {engineering.map((e) => (
            <div key={e.t} className="rounded-xl border border-border bg-card p-6">
              <e.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{e.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{e.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <Brand />
          <nav className="flex flex-wrap gap-6">
            <a href="#capabilities" className="hover:text-foreground">Product</a>
            <Link to="/app/agent" className="hover:text-foreground">Demo</Link>
            <a href="https://laksh-gupta.vercel.app/" target="_blank" rel="noreferrer" className="hover:text-foreground">Built by Laksh Gupta</a>
          </nav>
          <p className="text-xs">Atlas Distribution is fictional. All demo data is synthetic.</p>
        </div>
      </footer>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-border bg-card p-2 text-left shadow-glow">
      <div className="grid gap-2 rounded-xl bg-surface p-4 md:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-3 text-sm">Find policies related to supplier escalation and explain what actions we should take.</div>
          <div className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            <p className="text-foreground">Escalation begins when a supplier's on-time rate drops below 92% over 30 days <Cite n={1} />. Below 85%, a Corrective Action Plan is required within 3 business days <Cite n={1} />, and new POs above $25,000 need Director approval <Cite n={2} />.</p>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="rounded bg-success/15 px-2 py-0.5 text-success">3 document facts</span>
              <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">2 sources verified</span>
            </div>
          </div>
        </div>
        <div className="space-y-2 rounded-lg border border-border bg-card p-3 font-mono text-xs">
          {["embed_query · 212ms", "search_documents · 8 hits", "generate_answer · 3.1s", "verify_citations · 0 invalid"].map((s) => (
            <div key={s} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" />{s}</div>
          ))}
        </div>
      </div>
      <p className="px-3 py-2 text-center text-[11px] text-muted-foreground">Illustrative layout of the agent workspace. Live answers are generated from your own indexed documents.</p>
    </div>
  );
}

function Cite({ n }: { n: number }) {
  return <sup className="rounded bg-primary/15 px-1 font-mono text-[10px] text-primary">{n}</sup>;
}
