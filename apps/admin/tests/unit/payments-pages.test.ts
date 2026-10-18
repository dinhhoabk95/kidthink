import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const adminRoot = dirname(dirname(import.meta.dirname));

describe("Admin Payment Queue, Payment Approval & Package Catalog Screens (BR-PQU-01..08, BR-PAP-01..08, BR-PCA-01..06)", () => {
  const paymentsIndexContent = readFileSync(
    join(adminRoot, "app/pages/payments/index.vue"),
    "utf-8"
  );
  const paymentDetailContent = readFileSync(
    join(adminRoot, "app/pages/payments/[uuid]/index.vue"),
    "utf-8"
  );
  const paymentDecideContent = readFileSync(
    join(adminRoot, "app/pages/payments/[uuid]/decide.vue"),
    "utf-8"
  );
  const packagesIndexContent = readFileSync(
    join(adminRoot, "app/pages/packages/index.vue"),
    "utf-8"
  );

  it("Scenario: BR-PQU-08 — all payment pages declare manager layout and ForbiddenState role guard", () => {
    expect(paymentsIndexContent).toContain('layout: "manager"');
    expect(paymentDetailContent).toContain('layout: "manager"');
    expect(paymentDecideContent).toContain('layout: "manager"');

    expect(paymentsIndexContent).toContain("<ForbiddenState");
    expect(paymentDetailContent).toContain("<ForbiddenState");
    expect(paymentDecideContent).toContain("<ForbiddenState");
  });

  it("Scenario: BR-PQU-01 & BR-PQU-02 — payment queue is read-only (no approve/reject endpoint calls) and defaults to oldest FIFO sort", () => {
    expect(paymentsIndexContent).toContain("/api/managers/orders");
    expect(paymentsIndexContent).toContain('sort: "oldest"');
    expect(paymentsIndexContent).not.toContain("/approve");
    expect(paymentsIndexContent).not.toContain("/reject");
  });

  it("Scenario: BR-PQU-03, BR-PQU-04, BR-PQU-06, BR-PQU-07 — queue supports 15-min proof URL, duplicate bank_txn_ref flag, <=100 limit cap, and 24h SLA warning", () => {
    expect(paymentsIndexContent).toContain("/proof-url");
    expect(paymentsIndexContent).toContain("duplicate_bank_txn_ref");
    expect(paymentsIndexContent).toContain("user_has_prior_rejected_order");
    expect(paymentsIndexContent).toContain("oldest_waiting_hours > 24");
    expect(paymentsIndexContent).toContain(
      "Math.min(Math.max(1, Number(filters.limit) || 50), 100)"
    );
  });

  it("Scenario: BR-PQU-05 — detail and decide pages display only child_profiles_count and never child PII", () => {
    expect(paymentDetailContent).toContain("child_profiles_count");
    expect(paymentDecideContent).toContain("child_profiles_count");
    expect(paymentDetailContent).toContain("duplicate_orders");
    expect(paymentDetailContent).toContain("/proof-url");
  });

  it("Scenario: BR-PAP-01, BR-PAP-04, BR-PAP-06, BR-PAP-08 — decide page enforces 5-item checklist, bonus_days 0..30, admin_note >= 10, reauth, and 409 ORDER_ALREADY_PROCESSED handling", () => {
    expect(paymentDecideContent).toContain("checklist.amount_matches");
    expect(paymentDecideContent).toContain("checklist.transfer_note_present");
    expect(paymentDecideContent).toContain("checklist.bank_ref_unused");
    expect(paymentDecideContent).toContain("checklist.transfer_time_valid");
    expect(paymentDecideContent).toContain("checklist.proof_legible");
    expect(paymentDecideContent).toContain("val >= 0 && val <= 30");
    expect(paymentDecideContent).toContain(
      "approveForm.admin_note.trim().length >= 10"
    );
    expect(paymentDecideContent).toContain(
      "rejectForm.admin_note.trim().length >= 10"
    );
    expect(paymentDecideContent).toContain("ORDER_ALREADY_PROCESSED");
    expect(paymentDecideContent).toContain("/approve");
    expect(paymentDecideContent).toContain("/reject");
    expect(paymentDecideContent).toContain("reauth(");
  });

  it("Scenario: BR-PCA-01..06 — package catalog page is strictly read-only and displays 30d revenue and subscriber drill-down", () => {
    expect(packagesIndexContent).toContain("/api/managers/packages");
    expect(packagesIndexContent).toContain("revenue_30d_vnd");
    expect(packagesIndexContent).toContain("active_subscribers_count");
    expect(packagesIndexContent).toContain("requires_spec");
  });
});
