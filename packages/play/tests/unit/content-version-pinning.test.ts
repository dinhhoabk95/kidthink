import { playSessions, telemetryEvents } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  TelemetryEventRecordSchema,
  validateTelemetryEventRecord,
} from "#src/index";

const SAMPLE_SESSION_UUID = "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("BR-VER-03 & BR-EVT-06: content_version pinning in play_sessions and telemetry_events", () => {
  it("BR-VER-03 / BR-EVT-06: Drizzle schema enforces NOT NULL on play_sessions.content_version and telemetry_events.content_version", () => {
    const playCols = getTableColumns(playSessions);
    const telemetryCols = getTableColumns(telemetryEvents);

    expect(playCols.contentVersion.name).toBe("content_version");
    expect(playCols.contentVersion.notNull).toBe(true);

    expect(telemetryCols.contentVersion.name).toBe("content_version");
    expect(telemetryCols.contentVersion.notNull).toBe(true);
  });

  it("BR-VER-03 / BR-EVT-06: TelemetryEventRecordSchema requires positive integer content_version and rejects missing or non-positive values", () => {
    const valid = TelemetryEventRecordSchema.safeParse({
      session_uuid: SAMPLE_SESSION_UUID,
      seq: 1,
      event_name: "game_started",
      content_version: 3,
      occurred_at_ms: 0,
    });
    expect(valid.success).toBe(true);

    const missingVersion = TelemetryEventRecordSchema.safeParse({
      session_uuid: SAMPLE_SESSION_UUID,
      seq: 1,
      event_name: "game_started",
      occurred_at_ms: 0,
    });
    expect(missingVersion.success).toBe(false);

    const zeroVersion = TelemetryEventRecordSchema.safeParse({
      session_uuid: SAMPLE_SESSION_UUID,
      seq: 1,
      event_name: "game_started",
      content_version: 0,
      occurred_at_ms: 0,
    });
    expect(zeroVersion.success).toBe(false);
  });

  it("BR-VER-03: validateTelemetryEventRecord throws ValidationError when content_version is non-positive", () => {
    expect(() =>
      validateTelemetryEventRecord({
        session_uuid: SAMPLE_SESSION_UUID,
        seq: 1,
        event_name: "game_started",
        content_version: 0,
        occurred_at_ms: 0,
      })
    ).toThrow(ValidationError);

    const parsed = validateTelemetryEventRecord({
      session_uuid: SAMPLE_SESSION_UUID,
      seq: 1,
      event_name: "game_started",
      content_version: 2,
      occurred_at_ms: 120,
    });
    expect(parsed.content_version).toBe(2);
  });
});
