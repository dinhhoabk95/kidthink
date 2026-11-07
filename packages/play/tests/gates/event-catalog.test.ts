import { PayloadTooLargeError, ValidationError } from "@mindkid/errors/common";
import {
  BatchTooLargeError,
  EventOutOfOrderError,
  InvalidSequenceError,
  UnknownEventNameError,
} from "@mindkid/errors/play";
import { ALL_TEMPLATES, GT035CommandSchema } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import {
  ALLOWED_EVENT_NAMES,
  EVENT_PAYLOAD_FIELDS,
  PII_FIELDS,
} from "#src/events/catalog";
import { cleanEventPayload } from "#src/events/sanitize";
import { EVENT_PAYLOAD_SCHEMAS } from "#src/events/schemas";
import {
  TelemetryEventSchema,
  validateBatchPayload,
  validateSequenceNumbers,
  validateTelemetryEvent,
} from "#src/events/validate";

const SPEC_REQUIRED_EVENTS = [
  "game_started",
  "instruction_viewed",
  "game_paused",
  "game_resumed",
  "game_completed",
  "game_abandoned",
  "round_started",
  "question_shown",
  "answer_selected",
  "answer_correct",
  "answer_incorrect",
  "round_completed",
  "round_retried",
  "round_skipped",
  "item_selected",
  "hint_requested",
  "scaffold_escalated",
  "scaffold_resolved",
  "demo_shown",
  "asset_load_failed",
  "fps_sample",
  "parent_gate_shown",
  "parent_gate_passed",
  "parent_gate_failed",
  "payment_webhook_received",
  "subscription_renewed",
  "subscription_cancelled",
  "offline_pack_downloaded",
  "offline_pack_synced",
] as const;

describe("Event Catalog Invariants Gates (Task #209 / #251)", () => {
  it("BR-EVT-01: ALLOWED_EVENT_NAMES and EVENT_PAYLOAD_FIELDS match 1-to-1", () => {
    const allowed = Array.from(ALLOWED_EVENT_NAMES).sort();
    const fields = Object.keys(EVENT_PAYLOAD_FIELDS).sort();

    const allowedMinusFields = allowed.filter(
      (name) => !(name in EVENT_PAYLOAD_FIELDS)
    );
    const fieldsMinusAllowed = fields.filter(
      (name) => !ALLOWED_EVENT_NAMES.has(name)
    );

    expect(
      allowedMinusFields,
      `Events in ALLOWED_EVENT_NAMES but missing from EVENT_PAYLOAD_FIELDS: ${allowedMinusFields.join(", ")}`
    ).toEqual([]);

    expect(
      fieldsMinusAllowed,
      `Events in EVENT_PAYLOAD_FIELDS but missing from ALLOWED_EVENT_NAMES: ${fieldsMinusAllowed.join(", ")}`
    ).toEqual([]);
  });

  it("BR-EVT-01: ALLOWED_EVENT_NAMES and EVENT_PAYLOAD_SCHEMAS match 1-to-1", () => {
    const allowed = Array.from(ALLOWED_EVENT_NAMES).sort();
    const schemas = Object.keys(EVENT_PAYLOAD_SCHEMAS).sort();

    const allowedMinusSchemas = allowed.filter(
      (name) => !(name in EVENT_PAYLOAD_SCHEMAS)
    );
    const schemasMinusAllowed = schemas.filter(
      (name) => !ALLOWED_EVENT_NAMES.has(name)
    );

    expect(
      allowedMinusSchemas,
      `Events in ALLOWED_EVENT_NAMES but missing from EVENT_PAYLOAD_SCHEMAS: ${allowedMinusSchemas.join(", ")}`
    ).toEqual([]);

    expect(
      schemasMinusAllowed,
      `Events in EVENT_PAYLOAD_SCHEMAS but missing from ALLOWED_EVENT_NAMES: ${schemasMinusAllowed.join(", ")}`
    ).toEqual([]);
  });

  it("BR-EVT-01: all canonical events in event-catalog.md §7.1–§7.4 are registered", () => {
    for (const eventName of SPEC_REQUIRED_EVENTS) {
      expect(ALLOWED_EVENT_NAMES.has(eventName), eventName).toBe(true);
      expect(eventName in EVENT_PAYLOAD_FIELDS, eventName).toBe(true);
      expect(eventName in EVENT_PAYLOAD_SCHEMAS, eventName).toBe(true);
    }
    expect(EVENT_PAYLOAD_FIELDS.round_completed?.has("omissions")).toBe(true);
    expect(EVENT_PAYLOAD_FIELDS.round_completed?.has("commissions")).toBe(true);
    expect(EVENT_PAYLOAD_FIELDS.round_completed?.has("order")).toBe(true);
    expect(EVENT_PAYLOAD_FIELDS.item_selected?.has("commission")).toBe(true);
  });

  it("BR-EVT-02 & BR-EVT-08: PII fields and raw touch coordinates are stripped from event payloads", () => {
    for (const forbidden of [
      "name",
      "age",
      "child_uuid",
      "email",
      "phone",
      "ip",
      "x",
      "y",
      "client_x",
      "client_y",
      "touch_x",
      "touch_y",
    ]) {
      expect(PII_FIELDS.has(forbidden), forbidden).toBe(true);
    }

    const cleaned = cleanEventPayload("item_selected", {
      item_id: "apple_01",
      is_correct: true,
      commission: false,
      round_index: 0,
      name: "Bé An",
      age: 4,
      child_uuid: "00000000-0000-0000-0000-000000000000",
      x: 120,
      y: 340,
      client_x: 120,
      client_y: 340,
    });

    expect(cleaned).toEqual({
      item_id: "apple_01",
      is_correct: true,
      commission: false,
      round_index: 0,
    });
  });

  it("BR-EVT-03 & BR-EVT-05: validateBatchPayload and validateSequenceNumbers enforce limits and ordering", () => {
    const overLimit = Array.from({ length: 101 }, (_, idx) => ({
      seq: idx + 1,
      event_name: "game_started",
    }));
    expect(() => validateBatchPayload(overLimit)).toThrow(BatchTooLargeError);

    expect(() =>
      validateBatchPayload([{ seq: 1, event_name: "unknown_event_xyz" }])
    ).toThrow(UnknownEventNameError);

    const hugePayload = Array.from({ length: 50 }, (_, idx) => ({
      seq: idx + 1,
      event_name: "game_started",
      payload: {
        template_code: "x".repeat(1500),
      },
    }));
    expect(() => validateBatchPayload(hugePayload)).toThrow(
      PayloadTooLargeError
    );

    expect(() =>
      validateSequenceNumbers(
        [{ seq: 0, event_name: "game_started" }],
        0,
        new Set()
      )
    ).toThrow(InvalidSequenceError);

    expect(() =>
      validateSequenceNumbers(
        [{ seq: 2, event_name: "round_started" }],
        5,
        new Set([1, 5])
      )
    ).toThrow(EventOutOfOrderError);
  });

  it("BR-EVT-06: TelemetryEventSchema validates session_uuid, seq, and event_name", () => {
    const valid = TelemetryEventSchema.safeParse({
      session_uuid: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      seq: 1,
      event_name: "game_started",
      occurred_at_ms: 0,
      payload: { device: "tablet" },
    });
    expect(valid.success).toBe(true);

    const invalidSeq = TelemetryEventSchema.safeParse({
      session_uuid: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      seq: 0,
      event_name: "game_started",
    });
    expect(invalidSeq.success).toBe(false);

    expect(() =>
      validateTelemetryEvent({
        session_uuid: "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        seq: 0,
        event_name: "game_started",
      })
    ).toThrow(ValidationError);
  });

  it("BR-E000-07 / BR-CIR-21: all template.events match ALLOWED_EVENT_NAMES with negative test", () => {
    const unallowedEvents: { template: string; event: string }[] = [];
    for (const [code, tmpl] of Object.entries(ALL_TEMPLATES)) {
      for (const ev of tmpl.events) {
        if (!ALLOWED_EVENT_NAMES.has(ev)) {
          unallowedEvents.push({ template: code, event: ev });
        }
      }
    }
    expect(
      unallowedEvents,
      `Templates declared events not in ALLOWED_EVENT_NAMES: ${JSON.stringify(unallowedEvents)}`
    ).toEqual([]);

    // Ca âm: thêm tên lạ vào danh sách phát thì cổng bắt lỗi
    const fakeEvents = ["random_unregistered_event_xyz"];
    const negativeMatches = fakeEvents.filter((ev) =>
      ALLOWED_EVENT_NAMES.has(ev)
    );
    expect(negativeMatches.length).toBe(0);
  });

  it("BR-E035-15: command_added/command_removed nhận đủ mọi lệnh GT-035, kể cả go_*", () => {
    for (const name of ["command_added", "command_removed"]) {
      const schema = EVENT_PAYLOAD_SCHEMAS[name];
      expect(schema).toBeDefined();
      for (const command of GT035CommandSchema.options) {
        expect(
          schema?.safeParse({ command, command_index: 0 }).success,
          `${name} từ chối lệnh ${command}`
        ).toBe(true);
      }
      // Ca âm: lệnh lạ vẫn bị từ chối.
      expect(
        schema?.safeParse({ command: "teleport", command_index: 0 }).success
      ).toBe(false);
    }
  });
  it("BR-E000-07: sáu event engine mới được nhận đủ field và giữ nguyên qua cleanEventPayload", () => {
    const cases = [
      ["payment_wrong", { current_total: 3, target_amount: 5 }],
      ["pour_confirm_wrong", {}],
      ["timing_missed", { misses: 1, tolerance_ms: 250 }],
      ["program_stopped", { at_step: 2, command_count: 4, round_index: 0 }],
      ["explore_action", { kind: "pan_item_changed", count: 2 }],
      [
        "control_of_error",
        { side: "left", left_weight: 2, right_weight: 3, micro_sandbox: false },
      ],
      ["control_of_error", { mismatch_index: -1, micro_sandbox: true }],
      [
        "control_of_error",
        { candidate_id: "c1", violated_clue_id: null, micro_sandbox: false },
      ],
      [
        "control_of_error",
        {
          mode: "match",
          card_id: "card_a",
          card_time: "03:30",
          expected_time: "04:00",
          micro_sandbox: false,
        },
      ],
    ] as const;
    for (const [name, payload] of cases) {
      expect(ALLOWED_EVENT_NAMES.has(name), name).toBe(true);
      expect(
        EVENT_PAYLOAD_SCHEMAS[name]?.safeParse(payload).success,
        name
      ).toBe(true);
      expect(cleanEventPayload(name, payload), name).toEqual(payload);
      expect(() =>
        validateBatchPayload([{ seq: 1, event_name: name, payload }])
      ).not.toThrow();
    }
  });

  it("BR-E000-07 ca âm: field lạ bị bỏ, kiểu sai bị loại, tên gõ sai không lọt", () => {
    expect(
      cleanEventPayload("timing_missed", {
        misses: 1,
        tolerance_ms: 250,
        child_uuid: "x",
        hack: 1,
      })
    ).toEqual({ misses: 1, tolerance_ms: 250 });
    expect(
      EVENT_PAYLOAD_SCHEMAS.program_stopped?.safeParse({
        at_step: -1,
        command_count: 4,
      }).success
    ).toBe(false);
    expect(
      EVENT_PAYLOAD_SCHEMAS.control_of_error?.safeParse({ side: "up" }).success
    ).toBe(false);
    expect(ALLOWED_EVENT_NAMES.has("program_stoped")).toBe(false);
    // BR-EVT-02: chuỗi chỉ là giờ HH:MM hoặc slug, không nhận văn bản tự do.
    expect(
      EVENT_PAYLOAD_SCHEMAS.control_of_error?.safeParse({
        mode: "read",
        chosen_time: "bé tên An",
      }).success
    ).toBe(false);
    expect(
      EVENT_PAYLOAD_SCHEMAS.explore_action?.safeParse({
        kind: "Bé kéo quả táo",
        count: 1,
      }).success
    ).toBe(false);
  });
});
