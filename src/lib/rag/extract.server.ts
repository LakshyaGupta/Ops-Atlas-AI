// Safe text extraction. Kept separate from AI generation.
import type { PageText } from "./chunker";

export const ALLOWED_TYPES = ["pdf", "txt", "md"] as const;
export type AllowedType = (typeof ALLOWED_TYPES)[number];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class ExtractionError extends Error {}

export async function extractText(bytes: Uint8Array, type: AllowedType): Promise<{ pages: PageText[]; pageCount: number | null }> {
  if (type === "pdf") {
    const { extractText: pdfExtract, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const { totalPages, text } = await pdfExtract(pdf, { mergePages: false });
    const pages = (text as string[]).map((t, i) => ({ page: i + 1, text: t }));
    const chars = pages.reduce((n, p) => n + p.text.trim().length, 0);
    if (chars < 40) {
      throw new ExtractionError(
        "No extractable text found. This looks like a scanned/image PDF; OCR is not implemented, so it cannot be searched.",
      );
    }
    return { pages, pageCount: totalPages };
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (!text.trim()) throw new ExtractionError("File is empty.");
  return { pages: [{ page: null, text }], pageCount: null };
}
