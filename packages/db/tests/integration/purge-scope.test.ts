import { describe, expect, it } from "vitest";
import {
  PURGE_TABLE_CLASSIFICATIONS,
  PURGE_TABLE_MAP,
  validateSchemaTablesClassified,
} from "#src/index";
import { TABLES } from "#tests/global-setup";

const DIF_GATE_VIOLATION_REGEX = /D-IF GATE VIOLATION/;

describe("Task 5 — Purge Scope 3-Group Classification Gate (BR-ADL-01..10, D-IF)", () => {
  it("D-IF: classifies all active schema tables into delete, anonymize, or retain", () => {
    expect(PURGE_TABLE_CLASSIFICATIONS.length).toBeGreaterThanOrEqual(30);

    for (const entry of PURGE_TABLE_CLASSIFICATIONS) {
      expect(["delete", "anonymize", "retain"]).toContain(entry.classification);
      expect(entry.tableName.length).toBeGreaterThan(0);
      expect(entry.reason.length).toBeGreaterThan(0);
      expect(entry.legalBasis.length).toBeGreaterThan(0);
    }
  });

  it("BR-ADL-10: social_identities is strictly classified as 'delete'", () => {
    const entry = PURGE_TABLE_MAP.get("social_identities");
    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("delete");
  });

  it("BR-ADL-04: telemetry_events is strictly classified as 'anonymize'", () => {
    const entry = PURGE_TABLE_MAP.get("telemetry_events");
    expect(entry).toBeDefined();
    expect(entry?.classification).toBe("anonymize");
  });

  it("BR-ADL-05: audit_logs and consent_logs are strictly classified as 'retain'", () => {
    const auditEntry = PURGE_TABLE_MAP.get("audit_logs");
    const consentEntry = PURGE_TABLE_MAP.get("consent_logs");
    const paymentEntry = PURGE_TABLE_MAP.get("payment_orders");

    expect(auditEntry?.classification).toBe("retain");
    expect(consentEntry?.classification).toBe("retain");
    expect(paymentEntry?.classification).toBe("retain");
  });

  it("D-IF Gate: passes cleanly when all discovered schema table names are in the registry (100% 1-to-1 match)", () => {
    const result = validateSchemaTablesClassified(TABLES);
    expect(result.unclassified).toHaveLength(0);
    expect(result.totalClassified).toBe(TABLES.length);
    expect([...PURGE_TABLE_MAP.keys()].sort()).toEqual([...TABLES].sort());
  });

  it("D-IF Gate negative: throws when a new table is added without classification", () => {
    const modifiedTableList = [
      ...Array.from(PURGE_TABLE_MAP.keys()),
      "unclassified_new_table",
    ];

    expect(() => {
      validateSchemaTablesClassified(modifiedTableList);
    }).toThrow(DIF_GATE_VIOLATION_REGEX);
  });
});
