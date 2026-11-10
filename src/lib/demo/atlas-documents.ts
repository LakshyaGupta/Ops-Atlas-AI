// Synthetic demo corpus for "Atlas Distribution" — entirely fictional company.
// These are ingested through the same real pipeline (storage -> extract -> chunk -> embed).
export type DemoDoc = { fileName: string; title: string; content: string };

export const ATLAS_DEMO_DOCS: DemoDoc[] = [
  {
    fileName: "atlas-return-policy.md",
    title: "Atlas Distribution — Customer Return Policy (v3.2)",
    content: `# Customer Return Policy

SYNTHETIC DEMO DOCUMENT. Atlas Distribution is a fictional company.

# Eligibility Window

Standard merchandise may be returned within 30 calendar days of the delivery date recorded in the order management system. Orders delivered more than 30 days ago are not eligible for a standard return unless an exception is approved by a Customer Operations manager.

# Product Category Exceptions

Perishable goods (category: Food & Beverage) are returnable only within 7 days and only when the item arrived damaged or spoiled. Electronics must be returned within 15 days and must include all original accessories. Custom-configured industrial parts are non-returnable unless defective.

# Condition Requirements

Returned items must be unused and in original packaging. Items with missing serial labels are rejected at the receiving dock. A restocking fee of 12% applies to non-defective electronics returns.

# Refund Timing

Approved refunds are issued to the original payment method within 5 business days after the returned item is scanned at a receiving warehouse. Store credit may be offered instead, at 105% of the item value.

# Damaged-in-Transit Claims

If an order arrives damaged, the customer must report it within 48 hours of delivery with photographs. Damaged-in-transit claims are exempt from the restocking fee and are charged back to the responsible carrier.`,
  },
  {
    fileName: "atlas-supplier-escalation-procedure.md",
    title: "Atlas Distribution — Supplier Escalation Procedure (SOP-PR-014)",
    content: `# Supplier Escalation Procedure

SYNTHETIC DEMO DOCUMENT. Atlas Distribution is a fictional company.

# Scope

This procedure applies to all tier-1 and tier-2 suppliers covered by a Master Supply Agreement. It defines when and how Procurement escalates late or non-conforming deliveries.

# Delay Thresholds

A delivery is considered late when it arrives more than 2 business days after the confirmed ship date on the purchase order. A supplier enters Watch status when its on-time delivery rate falls below 92% over a rolling 30-day period. A supplier enters Escalation status when its on-time delivery rate falls below 85% over a rolling 30-day period, or when three consecutive purchase orders are late.

# Level 1 Escalation

The assigned buyer contacts the supplier account manager within 1 business day of the supplier entering Watch status and requests a written root-cause explanation and recovery plan within 5 business days.

# Level 2 Escalation

If the supplier enters Escalation status, the Procurement Manager schedules a corrective action review within 3 business days. The supplier must submit a Corrective Action Plan (CAP) with dated milestones. New purchase orders above $25,000 require Director approval while a supplier is in Escalation status.

# Level 3 Escalation

If the CAP milestones are missed or on-time performance remains below 85% for 60 days, the VP of Supply Chain may invoke the late-delivery penalty clause (1.5% of invoice value per business day late, capped at 10%) and begin qualifying an alternate supplier.

# Documentation

All escalation communications must be logged in the supplier record within 24 hours.`,
  },
  {
    fileName: "atlas-warehouse-sla.md",
    title: "Atlas Distribution — Warehouse Fulfillment SLA (2026)",
    content: `# Warehouse Fulfillment Service-Level Agreement

SYNTHETIC DEMO DOCUMENT. Atlas Distribution is a fictional company.

# Facilities Covered

This SLA covers the three Atlas fulfillment centers: Reno (WH-RNO), Columbus (WH-CMH), and Savannah (WH-SAV).

# Order Cycle Time

Standard orders received before 2:00 PM local time must ship the same business day. Orders received after 2:00 PM must ship by 12:00 PM the next business day. The target same-day ship rate is 97%.

# Pick Accuracy

Each facility must maintain pick accuracy of at least 99.5%, measured as correctly picked lines divided by total lines shipped, audited weekly by sampling 400 lines.

# Dock-to-Stock

Inbound receipts must be put away and available to sell within 24 hours of the truck being checked in at the dock.

# Breach Handling

If a facility misses the same-day ship target for two consecutive weeks, the Site General Manager must submit a recovery plan to the Director of Fulfillment within 3 business days. Persistent breaches over a full month are reviewed in the monthly operations business review.`,
  },
  {
    fileName: "atlas-procurement-policy.md",
    title: "Atlas Distribution — Procurement Approval Policy (FIN-007)",
    content: `# Procurement Approval Policy

SYNTHETIC DEMO DOCUMENT. Atlas Distribution is a fictional company.

# Approval Limits

Purchase orders up to $5,000 may be approved by the requesting department manager. Orders from $5,000 to $25,000 require Procurement Manager approval. Orders above $25,000 require Director of Supply Chain approval. Orders above $250,000 require CFO approval.

# Competitive Bids

Any non-recurring purchase above $50,000 requires at least three competitive bids, unless the item is single-sourced and the sole-source justification form is approved by Procurement.

# Preferred Suppliers

Buyers must use suppliers on the Approved Supplier List. Suppliers in Escalation status (see SOP-PR-014) may not receive new non-emergency orders above $25,000 without Director approval.

# Expense Reporting

Operational expenses are reported monthly by cost center. Any cost center exceeding its monthly budget by more than 8% must provide a variance explanation to Finance by the 10th of the following month.`,
  },
];
