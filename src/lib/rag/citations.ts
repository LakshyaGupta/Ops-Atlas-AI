// Citation verification: the model may only cite source markers that were actually retrieved.
export type ClaimType = "document_fact" | "interpretation" | "recommendation" | "unknown";
export type ModelClaim = { text: string; type: ClaimType; source_ids: number[] };
export type ModelAnswer = {
  answer: string;
  claims: ModelClaim[];
  insufficient_evidence: boolean;
};

export type VerifiedClaim = ModelClaim & { verified: boolean; rejected_ids: number[] };
export type VerificationReport = {
  claims: VerifiedClaim[];
  citedIds: number[];
  invalidMarkers: number[];
  unsupportedFactClaims: number;
  answer: string;
};

/**
 * - Drops source ids that do not exist in the retrieved set.
 * - A document_fact claim with no valid source is downgraded to "unknown" and flagged.
 * - Inline [n] markers in the answer text that point to non-retrieved ids are removed.
 */
export function verifyCitations(model: ModelAnswer, retrievedCount: number): VerificationReport {
  const valid = (n: number) => Number.isInteger(n) && n >= 1 && n <= retrievedCount;
  const cited = new Set<number>();
  const invalid = new Set<number>();
  let unsupported = 0;

  const claims: VerifiedClaim[] = model.claims.map((c) => {
    const ok = c.source_ids.filter(valid);
    const bad = c.source_ids.filter((n) => !valid(n));
    bad.forEach((n) => invalid.add(n));
    ok.forEach((n) => cited.add(n));
    if (c.type === "document_fact" && ok.length === 0) {
      unsupported++;
      return { ...c, type: "unknown", source_ids: [], verified: false, rejected_ids: bad };
    }
    return { ...c, source_ids: ok, verified: c.type !== "document_fact" || ok.length > 0, rejected_ids: bad };
  });

  const answer = model.answer.replace(/\[(\d+)\]/g, (m, d) => {
    const n = Number(d);
    if (valid(n)) {
      cited.add(n);
      return m;
    }
    invalid.add(n);
    return "";
  });

  return {
    claims,
    citedIds: [...cited].sort((a, b) => a - b),
    invalidMarkers: [...invalid].sort((a, b) => a - b),
    unsupportedFactClaims: unsupported,
    answer,
  };
}
