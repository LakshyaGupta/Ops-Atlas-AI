// Structure-aware chunker. Pure and deterministic so it can be unit tested.
export type PageText = { page: number | null; text: string };
export type Chunk = {
  index: number;
  page: number | null;
  section: string | null;
  content: string;
  tokenEstimate: number;
};

export const CHUNK_TARGET_CHARS = 1200;
export const CHUNK_OVERLAP_CHARS = 200;

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const HEADING = /^(#{1,6})\s+(.+)$/;

/** Split into sections on markdown headings, then pack paragraphs into chunks with overlap. */
export function chunkPages(
  pages: PageText[],
  opts: { target?: number; overlap?: number } = {},
): Chunk[] {
  const target = opts.target ?? CHUNK_TARGET_CHARS;
  const overlap = opts.overlap ?? CHUNK_OVERLAP_CHARS;
  if (overlap >= target) throw new Error("overlap must be smaller than target");
  const chunks: Chunk[] = [];
  let section: string | null = null;

  const push = (page: number | null, sec: string | null, content: string) => {
    const c = content.trim();
    if (!c) return;
    chunks.push({ index: chunks.length, page, section: sec, content: c, tokenEstimate: estimateTokens(c) });
  };

  for (const { page, text } of pages) {
    const paragraphs = normalizeText(text).split(/\n\n+/);
    let buf = "";
    for (const para of paragraphs) {
      const m = para.match(HEADING);
      if (m) {
        // Heading starts a new section: flush buffer at the structural boundary.
        push(page, section, buf);
        buf = "";
        section = m[2]!.trim();
        continue;
      }
      const pieces = para.length > target ? splitLong(para, target, overlap) : [para];
      for (const piece of pieces) {
        if (buf && buf.length + piece.length + 2 > target) {
          push(page, section, buf);
          const tail = buf.slice(-overlap);
          const cut = tail.indexOf(" ");
          const carried = cut >= 0 ? tail.slice(cut + 1) : tail;
          // Only carry overlap when it still fits within the target size.
          buf = carried.length + piece.length + 2 <= target ? carried + "\n\n" + piece : piece;
        } else {
          buf = buf ? buf + "\n\n" + piece : piece;
        }
      }
    }
    push(page, section, buf);
  }
  return chunks;
}

function splitLong(text: string, target: number, overlap: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length + s.length > target) {
      out.push(cur.trim());
      cur = cur.slice(-overlap) + s;
    } else cur += s;
    while (cur.length > target) {
      out.push(cur.slice(0, target));
      cur = cur.slice(target - overlap);
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
