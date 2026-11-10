import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, RefreshCw, Database, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deleteDocument, listDocuments, loadDemoDocuments, markUploadFailed, processDocument, registerDocument } from "@/lib/api/documents.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { PageHeader, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Base — OpsAtlas AI" }, { name: "description", content: "Upload, index and manage searchable business documents." }] }),
  component: Knowledge,
});

const ACCEPT = [".pdf", ".txt", ".md"];
const MAX = 10 * 1024 * 1024;

async function sha256(file: File) {
  const d = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function Knowledge() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const listFn = useServerFn(listDocuments);
  const registerFn = useServerFn(registerDocument);
  const processFn = useServerFn(processDocument);
  const failFn = useServerFn(markUploadFailed);
  const deleteFn = useServerFn(deleteDocument);
  const demoFn = useServerFn(loadDemoDocuments);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploads, setUploads] = useState<Record<string, string>>({});

  const docs = useQuery({
    queryKey: ["documents"],
    queryFn: () => listFn(),
    refetchInterval: (q) => (q.state.data?.some((d) => ["uploaded", "parsing", "chunking", "embedding"].includes(d.status)) ? 1500 : false),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["documents"] });

  async function handleFiles(files: FileList | File[]) {
    if (!ws.data) return;
    for (const file of Array.from(files)) {
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (!ACCEPT.includes(ext)) { toast.error(`${file.name}: unsupported type. Use PDF, TXT or MD.`); continue; }
      if (file.size > MAX) { toast.error(`${file.name}: exceeds 10 MB.`); continue; }
      setUploads((u) => ({ ...u, [file.name]: "Hashing…" }));
      try {
        const hash = await sha256(file);
        setUploads((u) => ({ ...u, [file.name]: "Registering…" }));
        const { id, storagePath } = await registerFn({ data: { workspaceId: ws.data.id, fileName: file.name, size: file.size, sha256: hash } });
        refresh();
        setUploads((u) => ({ ...u, [file.name]: "Uploading…" }));
        const up = await supabase.storage.from("documents").upload(storagePath, file, { contentType: file.type || "application/octet-stream" });
        if (up.error) { await failFn({ data: { documentId: id, message: `Upload failed: ${up.error.message}` } }); throw new Error(up.error.message); }
        setUploads((u) => ({ ...u, [file.name]: "Processing…" }));
        const r = await processFn({ data: { documentId: id } });
        if (r.ok) toast.success(`${file.name} is searchable (${r.chunks} chunks).`);
        else toast.error(`${file.name}: ${r.error}`);
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "failed"}`);
      } finally {
        setUploads((u) => { const n = { ...u }; delete n[file.name]; return n; });
        refresh();
      }
    }
  }

  const reprocess = useMutation({
    mutationFn: (id: string) => processFn({ data: { documentId: id } }),
    onMutate: () => setTimeout(refresh, 300),
    onSettled: (r) => { refresh(); if (r && !r.ok) toast.error(r.error); else if (r) toast.success("Reprocessed."); },
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteFn({ data: { documentId: id } }), onSettled: refresh, onSuccess: () => toast.success("Document and its index removed.") });
  const demo = useMutation({
    mutationFn: () => demoFn({ data: { workspaceId: ws.data!.id } }),
    onMutate: () => setTimeout(refresh, 500),
    onSuccess: (rs) => { const failed = rs.filter((r) => r.status === "failed"); failed.length ? toast.error(`${failed.length} demo document(s) failed: ${failed[0]!.detail}`) : toast.success("Atlas Distribution demo documents loaded."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    onSettled: refresh,
  });

  return (
    <>
      <PageHeader title="Knowledge Base" description="Documents are parsed, chunked, embedded and only marked Ready once searchable."
        actions={<>
          <Button variant="outline" onClick={() => demo.mutate()} disabled={!ws.data || demo.isPending}><Database />{demo.isPending ? "Indexing demo docs…" : "Load Atlas demo docs"}</Button>
          <Button onClick={() => inputRef.current?.click()} disabled={!ws.data}><Upload />Upload</Button>
        </>} />
      <div className="space-y-6 p-6 lg:p-8">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
          className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${drag ? "border-primary bg-primary/5" : "border-border bg-surface"}`}>
          <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm">Drag and drop files, or <button className="text-primary underline-offset-4 hover:underline" onClick={() => inputRef.current?.click()}>browse</button></p>
          <p className="mt-1 text-xs text-muted-foreground">PDF (text-based), TXT, Markdown · up to 10 MB · scanned PDFs are rejected (no OCR yet)</p>
          <input ref={inputRef} type="file" multiple accept={ACCEPT.join(",")} className="hidden" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
          {Object.entries(uploads).map(([n, s]) => <p key={n} className="mt-2 font-mono text-xs text-primary">{n} — {s}</p>)}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr><th className="px-5 py-3 font-medium">Document</th><th className="px-3 py-3 font-medium">Type</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Chunks</th><th className="px-3 py-3 font-medium">Version</th><th className="px-3 py-3 font-medium">Added</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {docs.data?.map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="px-5 py-3">
                    <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0"><p className="font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{d.file_name} · {(d.size_bytes / 1024).toFixed(1)} KB{d.is_demo ? " · synthetic demo" : ""}</p>
                        {d.status_detail && <p className={`mt-1 text-xs ${d.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{d.status_detail}</p>}</div></div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs uppercase">{d.file_type}</td>
                  <td className="px-3 py-3"><StatusPill status={d.status} /></td>
                  <td className="px-3 py-3 tabular-nums">{d.chunk_count}</td>
                  <td className="px-3 py-3">v{d.version}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="Reprocess" disabled={reprocess.isPending} onClick={() => reprocess.mutate(d.id)}><RefreshCw /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { if (confirm(`Delete "${d.title}" and its index?`)) remove.mutate(d.id); }}><Trash2 /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {docs.data?.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">No documents yet.</td></tr>}
              {docs.isLoading && <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
