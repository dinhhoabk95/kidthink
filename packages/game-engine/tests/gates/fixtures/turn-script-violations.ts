/**
 * Mẫu vi phạm của cổng `check:engine-turn` (`BR-ETS-*`).
 *
 * Sống ở `tests/**\/fixtures/` theo luật của repo: mẫu vi phạm Cấm — NEVER viết
 * thẳng vào file test, vì `packages/` là thứ các cổng khác đang quét.
 */

/** Trường lời đọc đã khai tử ở Task #262 — phiếu trỏ vào đây phải làm cổng đỏ. */
export const DEAD_NARRATION_FIELD = "prompt_audio_ref";

/** Trường lời đọc còn sống, duy nhất, ở cấp vòng. */
export const LIVE_NARRATION_FIELD = "instruction_audio_path";

/**
 * JSON Schema giả của một `content_pack` khai lại đường âm thanh thứ hai cho
 * lời đề. Dùng cho ca âm của phép kiểm "một nguồn lời đọc".
 */
export const CONTENT_PACK_WITH_SECOND_NARRATION_SOURCE = {
  properties: {
    prompt: { type: "string" },
    [DEAD_NARRATION_FIELD]: { type: "string" },
    audio_prompt: {
      properties: { text: { type: "string" }, audio_url: {} },
    },
    instruction_audio_ref: { type: "string" },
  },
} as const;
