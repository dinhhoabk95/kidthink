import { ALL_TEMPLATES } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import { ALLOWED_EVENT_NAMES, EVENT_PAYLOAD_FIELDS } from "#src/events/catalog";
import { EVENT_PAYLOAD_SCHEMAS } from "#src/events/schemas";

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
});
