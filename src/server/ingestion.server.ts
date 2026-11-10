// Document ingestion pipeline: download -> extract -> normalize/chunk -> embed -> store.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { chunkPages } from "@/lib/rag/chunker";
import { extractText, ExtractionError, type AllowedType } from "@/lib/rag/extract.server";
import { embedTexts, EMBEDDING_MODEL, GatewayError } from "@/lib/ai/gateway.server";

type Sb = SupabaseClient<Database>;
type Status = Database["public"]["Enums"]["document_status"];

async function setStatus(sb: Sb, id: string, status: Status, detail: string | null = null, extra: Record<string, unknown> = {}) {
  await sb.from("documents").update({ status, status_detail: detail, ...extra }).eq("id", id);
}

export async function runIngestion(sb: Sb, documentId: string) {
  const { data: doc, error } = await sb.from("documents").select("*").eq("id", documentId).single();
  if (error || !doc) throw new Error("Document not found");

  try {
    await setStatus(sb, doc.id, "parsing");
    const { data: blob, error: dlErr } = await sb.storage.from("documents").download(doc.storage_path);
    if (dlErr || !blob) throw new ExtractionError("Stored file could not be read.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const { pages, pageCount } = await extractText(bytes, doc.file_type as AllowedType);

    await setStatus(sb, doc.id, "chunking", null, { page_count: pageCount });
    const chunks = chunkPages(pages);
    if (chunks.length === 0) throw new ExtractionError("No text content after normalization.");
    if (chunks.length > 400) throw new ExtractionError("Document too large for this milestone (over 400 chunks).");

    await setStatus(sb, doc.id, "embedding", `${chunks.length} chunks`);
    // Embed with the section title prefixed so headings contribute to semantics.
    const vectors = await embedTexts(chunks.map((c) => (c.section ? `${c.section}\n${c.content}` : c.content)));

    // Reprocess = replace this version's chunks atomically enough for MVP.
    await sb.from("document_chunks").delete().eq("document_id", doc.id);
    const rows = chunks.map((c, i) => ({
      workspace_id: doc.workspace_id,
      document_id: doc.id,
      document_version: doc.version,
      chunk_index: c.index,
      page_number: c.page,
      section: c.section,
      content: c.content,
      token_estimate: c.tokenEstimate,
      embedding: JSON.stringify(vectors[i]),
      embedding_model: EMBEDDING_MODEL,
    }));
    for (let i = 0; i < rows.length; i += 50) {
      const { error: insErr } = await sb.from("document_chunks").insert(rows.slice(i, i + 50));
      if (insErr) throw new Error(`Storing chunks failed: ${insErr.message}`);
    }
    // Only mark ready once chunks are stored and searchable.
    await setStatus(sb, doc.id, "ready", null, { chunk_count: rows.length });
    return { ok: true as const, chunks: rows.length };
  } catch (e) {
    const msg =
      e instanceof ExtractionError || e instanceof GatewayError ? e.message : e instanceof Error ? e.message : "Processing failed";
    await sb.from("document_chunks").delete().eq("document_id", doc.id);
    await setStatus(sb, doc.id, "failed", msg, { chunk_count: 0 });
    return { ok: false as const, error: msg };
  }
}

export async function sha256Hex(bytes: Uint8Array) {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
