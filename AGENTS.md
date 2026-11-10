<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project architecture (OpsAtlas AI)
- Server functions live in `src/lib/api/*.functions.ts`; server-only helpers in `*.server.ts`. Never use a `src/server/` folder — client import protection denies it.
- All workspace data access uses the caller's RLS client (`requireSupabaseAuth`); isolation is enforced by `is_workspace_member` / `can_write_workspace` policies, not app code.
- Retrieval goes through the `hybrid_search` SQL function (pgvector halfvec HNSW + full-text, RRF); embedding column dims must match the embedding model.
- Citations must reference retrieved chunk ids only; `src/lib/rag/citations.ts` is the single verifier and is unit tested.
- Documents become `ready` only after chunks are stored; deleting a document cascades to its chunks.
