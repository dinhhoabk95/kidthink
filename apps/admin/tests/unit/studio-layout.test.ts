import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateEmojiInput } from "@mindkid/shared/client";
import { describe, expect, it } from "vitest";

const EMJ_PREFIX_REGEX = /^EMJ-/;

describe("Studio Layout & Components (BR-STU, BR-LPV, BR-EPK, BR-SDF)", () => {
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
  const formFieldSource = readFileSync(
    join(
      import.meta.dirname,
      "../../app/components/studio/schema-form-field.vue"
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
    expect(studioCodeSource).toContain("mindkid_level_backup_");
    expect(studioCodeSource).toContain("expected_version");
  });

  it("Scenario: BR-LPV-01..07 — Live Preview Frame Controls, Absolute Web Origin & Iframe Integration", () => {
    expect(livePreviewSource).toContain("useRuntimeConfig");
    expect(livePreviewSource).toContain("apiBaseUrl");
    expect(livePreviewSource).toContain("resolveWebOrigin");
    expect(livePreviewSource).toContain("previewUrl");
    expect(livePreviewSource).toContain("webOrigin.value");
    expect(livePreviewSource).toContain("/play/preview-sandbox");
    expect(livePreviewSource).toContain("event.origin !== webOrigin.value");
    expect(livePreviewSource).not.toContain(', "*"');
    expect(livePreviewSource).toContain("MindKid_STUDIO_UPDATE");
    expect(livePreviewSource).toContain("MindKid_STUDIO_REPLAY");
    expect(livePreviewSource).toContain("300"); // 300ms debounce
    expect(livePreviewSource).toContain("ageBands");
    expect(livePreviewSource).toContain("reducedMotion");
    expect(livePreviewSource).toContain("isMuted");
  });

  it("Scenario: BR-EPK-01..08 — Emoji Picker Specs", () => {
    expect(emojiPickerSource).toContain("w-10 h-10 min-w-10 min-h-10");
    expect(emojiPickerSource).toContain("text-[28px]");
    expect(emojiPickerSource).toContain("mindkid_recent_emojis");
    expect(emojiPickerSource).toContain("Noto Color Emoji");
    expect(emojiPickerSource).toContain("ArrowRight");
    expect(emojiPickerSource).toContain("Escape");
    expect(emojiPickerSource).toContain("Báo thiếu emoji");
  });

  it("Scenario: BR-EPK-03 & BR-SDF-04 — Direct Emoji Glyph Input & Validation in SchemaFormField", () => {
    expect(formFieldSource).toContain("onEmojiDirectInput");
    expect(formFieldSource).toContain("validateEmojiInput");
    expect(formFieldSource).toContain("effectiveError");

    const validBear = validateEmojiInput("🐻");
    expect(validBear).toEqual({ ok: true, glyph: "🐻" });

    const validTrimmed = validateEmojiInput("  🍎  ");
    expect(validTrimmed).toEqual({ ok: true, glyph: "🍎" });

    const cleared = validateEmojiInput("   ");
    expect(cleared).toEqual({ ok: true, glyph: "" });

    const invalidMulti = validateEmojiInput("ab");
    expect(invalidMulti.ok).toBe(false);
    if (!invalidMulti.ok) {
      expect(invalidMulti.error).toContain("BR-EPK-03");
    }

    const invalidTwoEmojis = validateEmojiInput("🍎🍌");
    expect(invalidTwoEmojis.ok).toBe(false);

    const invalidAscii = validateEmojiInput("x");
    expect(invalidAscii.ok).toBe(false);
  });

  it("Scenario: BR-EPK-09 — Stores UTF-8 Glyph and Rejects EMJ-* Slug Codes", () => {
    const validApple = validateEmojiInput("🍎");
    expect(validApple.ok).toBe(true);
    if (validApple.ok) {
      expect(validApple.glyph).toBe("🍎");
      expect(validApple.glyph).not.toMatch(EMJ_PREFIX_REGEX);
    }

    const slugCode = validateEmojiInput("EMJ-apple");
    expect(slugCode.ok).toBe(false);
    if (!slugCode.ok) {
      expect(slugCode.error).toContain("BR-EPK-09");
    }
  });

  it("Scenario: BR-STU-09 — Inline Field Errors in Form Renderer", () => {
    expect(formRendererSource).toContain("getFieldErrorMessage");
    expect(formRendererSource).toContain("errors");
  });
});
