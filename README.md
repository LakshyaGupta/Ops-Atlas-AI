# OpsAtlas AI

A production-grade AI agent for operations teams: upload your policies, SOPs and
reference documents, then ask questions and get answers that cite the exact
passage they came from. Answers that aren't supported by your documents are
refused instead of invented.

Live app: https://pixel-perfect-replay-89099.lovable.app

Portfolio: https://laksh-gupta.vercel.app/

## What it does today

- **Sign in** with email or Google. Every account gets its own private workspace;
  access between workspaces is blocked at the database level (row-level security),
  not by app code.
- **Upload knowledge** as PDF, TXT or Markdown (up to 10 MB). Files are hashed with
  SHA-256, so the same document can't be ingested twice. Extraction, chunking,
  embedding and storage run as a background job; a document only shows as *Ready*
  once its chunks are actually stored.
- **Ask the agent** a question. Retrieval is hybrid — semantic similarity plus
  keyword search, merged with reciprocal rank fusion — and every answer is checked
  against the passages that were retrieved. A citation that doesn't point at a
  real retrieved chunk is rejected before the answer reaches you. If nothing
  relevant is found, the agent says so rather than guessing.
- **Inspect every run**: the question, the retrieved passages, the citations, the
  latency and the token usage, in a run history.
- **Synthetic demo data**: four sample documents about a fictional company,
  *Atlas Distribution*, are seeded so the app is usable immediately. They are
  labelled synthetic in the UI and are not real customer data.

## Roadmap

- [x] Milestone 1 — landing, auth, private workspaces, document ingestion,
      embeddings, hybrid retrieval, verified citations, agent workspace, run
      history and inspector, synthetic demo documents
- [ ] Milestone 2 — CSV datasets, deterministic analytics tools, tool calling,
      charts, report drafts
- [ ] Milestone 3 — observability, cost tracking and budgets, retries and reliability
- [ ] Milestone 4 — evaluation engine (golden set), prompt-injection test suite
- [ ] Milestone 5 — polish: public `/demo` sandbox, `/architecture`, `/case-study`,
      `/docs`, settings, team members, DOCX export

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, Vite) — file-based routing,
  server functions
- Tailwind CSS v4, shadcn/ui primitives
- Lovable Cloud (Postgres + pgvector, row-level security, auth, private storage)
- Lovable AI Gateway — `openai/gpt-6-astra` for generation,
  `google/gemini-embedding-2` for 3072-dimension embeddings
- `unpdf` for PDF text extraction (no OCR: scanned-only PDFs are rejected)
- Vitest for unit and routing tests

## Where the code lives

| Path | Purpose |
| --- | --- |
| `src/routes/` | Pages: landing, auth, and the signed-in app under `_authenticated/` |
| `src/lib/api/*.functions.ts` | Server functions (documents, agent, runs) |
| `src/lib/api/ingestion.server.ts` | Background ingest pipeline: extract → chunk → embed → store |
| `src/lib/ai/gateway.server.ts` | Server-only AI gateway calls (embeddings, structured generation) |
| `src/lib/rag/` | Chunking, citation verification, PDF/text extraction |
| `src/lib/demo/atlas-documents.ts` | Synthetic demo documents |
| `public/` | Favicon and app icons |

## Running it locally

You need Node.js and npm.

```sh
git clone <this-repository-url>
cd opsatlas-ai
npm i
npm run dev
```

Then open http://localhost:8080.

Environment values (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`) are generated for the connected backend and live in
`.env`. The AI gateway key is a server-side secret managed by Lovable — it is
never committed and never read from browser code.

## Checks

```sh
npm run test     # vitest: chunking, citation verification, routing
npm run lint     # eslint
npm run build    # production build
```

## Notes

- Database schema and migrations are managed by Lovable Cloud; don't hand-edit
  `supabase/migrations/` or `drizzle/`.
- Files whose headers say they are auto-generated (Supabase clients, route tree)
  are regenerated, not edited by hand.
- See `AGENTS.md` for the architecture rules this project follows.
