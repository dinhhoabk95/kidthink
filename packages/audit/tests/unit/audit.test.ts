import { describe, expect, it } from "vitest";
import { AuditError, assertCleanAuditPayload } from "../../src/index.js";

describe("@mindkid/audit unit tests", () => {
  it("BR-AUD-05: blocks PII fields like display_name, phone, dob", () => {
    expect(() => {
      assertCleanAuditPayload({ display_name: "Bé An" }, "test");
    }).toThrow(AuditError);

    expect(() => {
      assertCleanAuditPayload({ phone_number: "0901234567" }, "test");
    }).toThrow(AuditError);
  });

  it("BR-AUD-06: blocks secrets like password, token, api_key", () => {
    expect(() => {
      assertCleanAuditPayload({ password_hash: "hash123" }, "test");
    }).toThrow(AuditError);

    expect(() => {
      assertCleanAuditPayload({ access_token: "secret_tok" }, "test");
    }).toThrow(AuditError);
  });

  it("allows clean non-PII, non-secret fields", () => {
    expect(() => {
      assertCleanAuditPayload(
        { child_uuid: "uuid-123", action_count: 5, status: "active" },
        "test"
      );
    }).not.toThrow();
  });
});
