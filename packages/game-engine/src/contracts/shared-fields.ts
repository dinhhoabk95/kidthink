import { z } from "zod";

/**
 * `BR-CTR-08` — asset emoji tham chiếu bằng **mã** `EMJ-<slug>`, không phải
 * glyph. `packages/emoji/src/query.ts:getByCode` chỉ tra theo mã, nên một glyph
 * thô lọt qua contract sẽ hỏng lúc render với `not_found` — quá muộn để ai đó
 * nhìn thấy. `z.string().min(1)` cũ nhận mọi thứ, kể cả "🍎".
 */
export const EMOJI_REF_PATTERN = /^EMJ-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * `EMJ-<slug>`, ❌ NEVER glyph thô.
 *
 * `packages/emoji/src/query.ts:getByCode` chỉ tra theo mã, nên một glyph lọt
 * qua đây resolve ra `not_found` lúc render: trẻ thấy ô trống, và không cổng
 * nào bắt được vì nội dung vẫn "hợp lệ".
 *
 * Trường này từng nhận chuỗi bất kỳ vì nợ quá lớn để chặn tại contract: 57
 * trên 228 level seed dùng glyph, cộng 27 file `templates/GT-0xx/fixtures.ts`
 * và các test engine. Nợ được đo bằng bậc thang riêng thay vì chặn ở đây.
 * Task 162 dọn hết — 239 `ref` trong corpus, 243 trong fixture engine, 50
 * trong test — và bổ sung 23 emoji còn thiếu vào registry, nên bậc thang về 0
 * và chỗ chặn đúng đắn quay lại đây.
 */
export const EmojiRef = z.string().regex(EMOJI_REF_PATTERN);

/**
 * Asset reference shared by every template's content contract.
 *
 * Returns a FRESH schema per call on purpose: `zod-to-json-schema` dedupes by
 * object identity, so a single shared const would turn repeated occurrences
 * (e.g. GT-005 left/right) into `$ref`s and change the published JSON Schema.
 */
export const assetSchema = () =>
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
    z.object({ kind: z.literal("image"), path: z.string() }),
  ]);

/** `prompt` + `prompt_audio_ref`, present on every template content contract. */
export const promptFields = () => ({
  prompt: z.string().min(4).max(80),
  prompt_audio_ref: z.string().optional(),
});
