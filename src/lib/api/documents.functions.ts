import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runIngestion, sha256Hex } from "./ingestion.server";
import { ATLAS_DEMO_DOCS } from "@/lib/demo/atlas-documents";

const ALLOWED = ["pdf", "txt", "md"];
const MAX = 10 * 1024 * 1024;

export const getMyWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("workspace_members")
      .select("role, workspaces(id, name)")
      .eq("user_id", context.userId)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.workspaces) throw new Error("No workspace found for this account.");
    return { id: data.workspaces.id, name: data.workspaces.name, role: data.role };
  });

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("id, title, file_name, file_type, size_bytes, status, status_detail, version, page_count, chunk_count, is_demo, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const registerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ workspaceId: z.string().uuid(), fileName: z.string().min(1).max(200), size: z.number().int().positive(), sha256: z.string().regex(/^[a-f0-9]{64}$/) }))
  .handler(async ({ data, context }) => {
    const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED.includes(ext)) throw new Error(`Unsupported file type .${ext}. Allowed: PDF, TXT, MD.`);
    if (data.size > MAX) throw new Error("File exceeds the 10 MB limit.");
    const { data: dup } = await context.supabase.from("documents").select("id, title").eq("workspace_id", data.workspaceId).eq("sha256", data.sha256).maybeSingle();
    if (dup) throw new Error(`Duplicate: this file is already in the knowledge base as "${dup.title}".`);
    const id = crypto.randomUUID();
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${data.workspaceId}/${id}/${safeName}`;
    const { error } = await context.supabase.from("documents").insert({
      id, workspace_id: data.workspaceId, title: data.fileName.replace(/\.[^.]+$/, ""), file_name: data.fileName,
      file_type: ext, size_bytes: data.size, sha256: data.sha256, storage_path: storagePath, uploaded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { id, storagePath };
  });

export const processDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ documentId: z.string().uuid() }))
  .handler(async ({ data, context }) => runIngestion(context.supabase, data.documentId));

export const markUploadFailed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ documentId: z.string().uuid(), message: z.string().max(300) }))
  .handler(async ({ data, context }) => {
    await context.supabase.from("documents").update({ status: "failed", status_detail: data.message }).eq("id", data.documentId);
    return { ok: true };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ documentId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase.from("documents").select("storage_path").eq("id", data.documentId).single();
    if (!doc) throw new Error("Document not found");
    // Chunks cascade on delete, so the document stops being retrievable immediately.
    const { error } = await context.supabase.from("documents").delete().eq("id", data.documentId);
    if (error) throw new Error(error.message);
    await context.supabase.storage.from("documents").remove([doc.storage_path]);
    return { ok: true };
  });

export const loadDemoDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ workspaceId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const results: { title: string; status: string; detail?: string }[] = [];
    for (const d of ATLAS_DEMO_DOCS) {
      const bytes = new TextEncoder().encode(d.content);
      const sha = await sha256Hex(bytes);
      const { data: existing } = await sb.from("documents").select("id").eq("workspace_id", data.workspaceId).eq("sha256", sha).maybeSingle();
      if (existing) { results.push({ title: d.title, status: "skipped", detail: "already loaded" }); continue; }
      const id = crypto.randomUUID();
      const path = `${data.workspaceId}/${id}/${d.fileName}`;
      const up = await sb.storage.from("documents").upload(path, new Blob([bytes], { type: "text/markdown" }), { contentType: "text/markdown" });
      if (up.error) { results.push({ title: d.title, status: "failed", detail: up.error.message }); continue; }
      const { error } = await sb.from("documents").insert({
        id, workspace_id: data.workspaceId, title: d.title, file_name: d.fileName, file_type: "md",
        size_bytes: bytes.byteLength, sha256: sha, storage_path: path, uploaded_by: context.userId, is_demo: true,
      });
      if (error) { results.push({ title: d.title, status: "failed", detail: error.message }); continue; }
      const r = await runIngestion(sb, id);
      results.push({ title: d.title, status: r.ok ? "ready" : "failed", detail: r.ok ? `${r.chunks} chunks` : r.error });
    }
    return results;
  });
