import { describe, expect, it } from "vitest";
import { runTelemetryPiiGate, scanSchemaForPii } from "./telemetry-pii.ts";

describe("BR-TLM-03 & D-GA: PII Scanner Gate", () => {
  it("passes clean telemetry schema without PII", () => {
    const cleanSchema = `
      export const telemetryEvents = pgTable("telemetry_events", {
        sessionUuid: uuid("session_uuid").notNull(),
        childUuid: uuid("child_uuid"),
        eventName: varchar("event_name", { length: 100 }).notNull(),
      });
    `;
    const res = scanSchemaForPii(cleanSchema);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("negative test: flags schema containing child_name PII field (D-GA)", () => {
    const dirtySchema = `
      export const telemetryEvents = pgTable("telemetry_events", {
        sessionUuid: uuid("session_uuid").notNull(),
        childName: varchar("child_name", { length: 100 }),
      });
    `;
    const res = scanSchemaForPii(dirtySchema);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0]).toContain("child_name");
  });
});

describe("Cổng telemetry-pii trên schema thật (BR-TLM-03)", () => {
  it("packages/db/src/schema/play.ts không có field PII nào", () => {
    const result = runTelemetryPiiGate();

    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});
