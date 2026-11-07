import { describe, expect, it } from "vitest";
import { isRereadPromptEscalation } from "~/composables/play/hint-narration";

/** Task #313 Phase 2 — hint L3 đọc lại đề (spec §7.2). */
describe("isRereadPromptEscalation", () => {
  it("chỉ scaffold_escalated lên level 3", () => {
    expect(
      isRereadPromptEscalation({
        event_name: "scaffold_escalated",
        timestamp_ms: 0,
        data: { level: 3 },
      })
    ).toBe(true);
    expect(
      isRereadPromptEscalation({
        event_name: "scaffold_escalated",
        timestamp_ms: 0,
        data: { level: 2 },
      })
    ).toBe(false);
    expect(
      isRereadPromptEscalation({
        event_name: "hint_requested",
        timestamp_ms: 0,
        data: { level: 3 },
      })
    ).toBe(false);
  });
});
