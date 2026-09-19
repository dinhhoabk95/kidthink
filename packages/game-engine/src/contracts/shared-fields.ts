import { z } from "zod";

/**
 * Task #202 (D-EB, D-EC): Emoji reference is real UTF-8 glyph, e.g. "🍎".
 * No code lookup, no regex pattern. Data is plain text `z.string().min(1)`.
 */
export const EmojiRef = z.string().min(1);

/**
 * Asset reference shared by every template's content contract.
 *
 * Returns a FRESH schema per call on purpose: `zod-to-json-schema` dedupes by
 * object identity, so a single shared const would turn repeated occurrences
 * (e.g. GT-005 left/right) into `$ref`s and change the published JSON Schema.
 */
export const assetSchema = () =>
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("emoji"),
      ref: EmojiRef,
      audio_path: assetAudioPath(),
    }),
    z.object({ kind: z.literal("image"), path: z.string() }),
    z.object({
      kind: z.literal("text"),
      text: z.string().min(1),
      audio_path: assetAudioPath(),
    }),
  ]);

/**
 * mp3 đọc tên vật khi trẻ chạm lại hình minh hoạ — tuỳ chọn; thiếu thì đọc
 * `spokenLabel` bằng TTS (`play-narration.md` §7, Task #274 S7b). Chuỗi rỗng
 * bị từ chối: nó trông như "có mp3" mà không phát được gì.
 */
function assetAudioPath() {
  return z.string().min(1).optional();
}

/** `prompt`, present on every template content contract. */
export const promptFields = () => ({
  prompt: z.string().min(4).max(80),
});
