import { describe, expect, it } from "vitest";
import { chunkPages, normalizeText } from "./chunker";
import { verifyCitations } from "./citations";

describe("chunker", () => {
  it("keeps markdown section headings as chunk metadata", () => {
    const chunks = chunkPages([{ page: null, text: "# Returns\n\nItems may be returned within 30 days.\n\n# Shipping\n\nShips in 2 days." }]);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]!.section).toBe("Returns");
    expect(chunks[1]!.section).toBe("Shipping");
    expect(chunks[1]!.content).toBe("Ships in 2 days.");
  });

  it("preserves page numbers per chunk", () => {
    const chunks = chunkPages([
      { page: 1, text: "Page one text." },
      { page: 2, text: "Page two text." },
    ]);
    expect(chunks.map((c) => c.page)).toEqual([1, 2]);
  });

  it("never exceeds the target size for long text", () => {
    const long = "Sentence number one is here. ".repeat(200);
    const chunks = chunkPages([{ page: 1, text: long }], { target: 500, overlap: 100 });
    expect(chunks.length).toBeGreaterThan(5);
    for (const c of chunks) expect(c.content.length).toBeLessThanOrEqual(500 + 2);
  });

  it("normalizes whitespace and null bytes", () => {
    expect(normalizeText("a\u0000b\r\n\n\n\nc  d")).toBe("ab\n\nc d");
  });
});

describe("citation verification", () => {
  it("rejects citations to sources that were not retrieved", () => {
    const r = verifyCitations(
      { answer: "Fact [1] and fake [7].", claims: [{ text: "x", type: "document_fact", source_ids: [1, 7] }], insufficient_evidence: false },
      3,
    );
    expect(r.invalidMarkers).toEqual([7]);
    expect(r.answer).toBe("Fact [1] and fake .");
    expect(r.claims[0]!.source_ids).toEqual([1]);
  });

  it("downgrades a document fact with no valid source to unknown", () => {
    const r = verifyCitations(
      { answer: "Claim.", claims: [{ text: "x", type: "document_fact", source_ids: [9] }], insufficient_evidence: false },
      2,
    );
    expect(r.claims[0]!.type).toBe("unknown");
    expect(r.unsupportedFactClaims).toBe(1);
  });

  it("allows recommendations without sources", () => {
    const r = verifyCitations(
      { answer: "Do this.", claims: [{ text: "x", type: "recommendation", source_ids: [] }], insufficient_evidence: false },
      2,
    );
    expect(r.claims[0]!.verified).toBe(true);
  });
});
