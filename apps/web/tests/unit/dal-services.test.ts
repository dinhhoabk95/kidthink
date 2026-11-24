import { ValidationError } from "@mindkid/errors/common";
import { ENTITLEMENT_KEYS, PACKAGE_CATALOG } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  escapeCsvField,
  MAX_AUDIT_EXPORT_ROWS,
  validateAuditDateRange,
} from "#server/services/audit-log-service";
import {
  normalizeErrorGroupStatus,
  sanitizeClientErrorContext,
} from "#server/services/error-log-service";
import { listPublicPackages } from "#server/services/packages-service";

describe("DAL Service Layer Pure Logic", () => {
  it("validateAuditDateRange enforces valid ISO bounds, chronological order, and 90-day BR-ALV-03 limit", () => {
    const ok = validateAuditDateRange(
      "2026-10-01T00:00:00.000Z",
      "2026-11-22T00:00:00.000Z"
    );
    expect(ok.fromDate).toStrictEqual(new Date("2026-10-01T00:00:00.000Z"));
    expect(ok.toDate).toStrictEqual(new Date("2026-11-22T00:00:00.000Z"));

    expect(() => validateAuditDateRange("not-a-date", undefined)).toThrow(
      ValidationError
    );
    expect(() =>
      validateAuditDateRange(undefined, "invalid-date", "field")
    ).toThrow(ValidationError);

    expect(() =>
      validateAuditDateRange(
        "2026-11-22T00:00:00.000Z",
        "2026-11-01T00:00:00.000Z"
      )
    ).toThrow(ValidationError);

    expect(() =>
      validateAuditDateRange(
        "2026-01-01T00:00:00.000Z",
        "2026-06-01T00:00:00.000Z"
      )
    ).toThrow("BR-ALV-03");

    expect(MAX_AUDIT_EXPORT_ROWS).toBe(10_000);
  });

  it("escapeCsvField prevents CSV formula injection and quotes special characters safely", () => {
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
    expect(escapeCsvField("plain-value")).toBe("plain-value");
    expect(escapeCsvField("hello, world")).toBe('"hello, world"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("=SUM(A1:A2)")).toBe('"\'=SUM(A1:A2)"');
    expect(escapeCsvField("+1234")).toBe('"\'+1234"');
    expect(escapeCsvField("-cmd")).toBe('"\'-cmd"');
    expect(escapeCsvField("@admin")).toBe('"\'@admin"');
    expect(escapeCsvField("\tcalc")).toBe('"\'\tcalc"');
    expect(escapeCsvField({ key: "val" })).toBe('"{""key"":""val""}"');
  });

  it("ErrorLogService strips non-allowlisted PII keys and normalizes status transitions", () => {
    const sanitized = sanitizeClientErrorContext({
      route: "/play/gt-001",
      app_version: "2.1.0",
      device_type: "tablet",
      browser: "Safari",
      os: "iPadOS",
      dpr: 2,
      viewport: "1024x768",
      email: "leak@example.com",
      user_id: 99,
      child_name: "Bé Bơ",
      token: "secret-token",
    });

    expect(sanitized).toStrictEqual({
      route: "/play/gt-001",
      app_version: "2.1.0",
      device_type: "tablet",
      browser: "Safari",
      os: "iPadOS",
      dpr: 2,
      viewport: "1024x768",
    });
    expect(sanitizeClientErrorContext(undefined)).toStrictEqual({});

    expect(normalizeErrorGroupStatus("new")).toBe("open");
    expect(normalizeErrorGroupStatus("open")).toBe("open");
    expect(normalizeErrorGroupStatus("in_progress")).toBe("ack");
    expect(normalizeErrorGroupStatus("ack")).toBe("ack");
    expect(normalizeErrorGroupStatus("resolved")).toBe("resolved");
    expect(normalizeErrorGroupStatus("ignored")).toBe("resolved");
    expect(normalizeErrorGroupStatus(undefined)).toBe("resolved");
  });

  it("PackagesService.listPublicPackages returns active public catalog packages with mapped benefit labels", () => {
    const result = listPublicPackages();
    const expectedActivePublic = Object.values(PACKAGE_CATALOG).filter(
      (pkg) => pkg.is_public && pkg.status === "active"
    );
    const labelMap = new Map(ENTITLEMENT_KEYS.map((k) => [k.key, k.label]));

    expect(result.packages).toHaveLength(expectedActivePublic.length);
    for (const pkg of result.packages) {
      const def = PACKAGE_CATALOG[pkg.code];
      expect(def?.is_public).toBe(true);
      expect(def?.status).toBe("active");
      expect(pkg.benefits).toStrictEqual(
        pkg.entitlements.map((key) => ({
          entitlement_key: key,
          label: labelMap.get(key) ?? key,
        }))
      );
    }
  });
});
