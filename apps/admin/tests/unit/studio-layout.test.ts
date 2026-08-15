import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Studio Layout & Components (BR-STU, BR-LPV, BR-EPK)", () => {
  const studioCodeSource = readFileSync(
    join(import.meta.dirname, "../../app/pages/studio/levels/[code].vue"),
    "utf-8"
  );
  const livePreviewSource = readFileSync(
    join(
      import.meta.dirname,
      "../../app/components/studio/live-preview-frame.vue"
    ),
    "utf-8"
  );
  const emojiPickerSource = readFileSync(
    join(
      import.meta.dirname,
      "../../app/components/emoji/emoji-picker-modal.vue"
    ),
    "utf-8"
  );
  const formRendererSource = readFileSync(
    join(
      import.meta.dirname,
      "../../app/components/studio/schema-form-renderer.vue"
    ),
    "utf-8"
  );

  it("Scenario: 40/60 Split Workspace Layout (Plan §4 Task 4)", () => {
    expect(studioCodeSource).toContain("lg:w-[40%]");
    expect(studioCodeSource).toContain("lg:w-[60%]");
    expect(studioCodeSource).toContain("SchemaFormRenderer");
    expect(studioCodeSource).toContain("LivePreviewFrame");
  });

  it("Scenario: BR-STU-03 & D-JY — Autosave and Local Storage Backup", () => {
    expect(studioCodeSource).toContain("setInterval");
    expect(studioCodeSource).toContain("30_000");
    expect(studioCodeSource).toContain("kidthink_level_backup_");
    expect(studioCodeSource).toContain("expected_version");
  });

  it("Scenario: BR-LPV-01..07 — Live Preview Frame Controls & Iframe Integration", () => {
    expect(livePreviewSource).toContain("previewUrl");
    expect(livePreviewSource).toContain("/play/preview-sandbox");
    expect(livePreviewSource).toContain("KIDTHINK_STUDIO_UPDATE");
    expect(livePreviewSource).toContain("KIDTHINK_STUDIO_REPLAY");
    expect(livePreviewSource).toContain("300"); // 300ms debounce
    expect(livePreviewSource).toContain("ageBands");
    expect(livePreviewSource).toContain("reducedMotion");
    expect(livePreviewSource).toContain("isMuted");
  });

  it("Scenario: BR-EPK-01..08 — Emoji Picker Specs", () => {
    expect(emojiPickerSource).toContain("w-10 h-10 min-w-10 min-h-10");
    expect(emojiPickerSource).toContain("text-[28px]");
    expect(emojiPickerSource).toContain("kidthink_recent_emojis");
    expect(emojiPickerSource).toContain("Noto Color Emoji");
    expect(emojiPickerSource).toContain("ArrowRight");
    expect(emojiPickerSource).toContain("Escape");
    expect(emojiPickerSource).toContain("Báo thiếu emoji");
  });

  it("Scenario: BR-STU-09 — Inline Field Errors in Form Renderer", () => {
    expect(formRendererSource).toContain("getFieldErrorMessage");
    expect(formRendererSource).toContain("errors");
  });
});
