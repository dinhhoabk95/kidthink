import { z } from "zod";

/**
 * `BR-CTR-08` — asset emoji tham chiếu bằng **mã** `EMJ-<slug>`, không phải
 * glyph. `packages/emoji/src/query.ts:getByCode` chỉ tra theo mã, nên một glyph
 * thô lọt qua contract sẽ hỏng lúc render với `not_found` — quá muộn để ai đó
 * nhìn thấy. `z.string().min(1)` cũ nhận mọi thứ, kể cả "🍎".
 */
export const EMOJI_REF_PATTERN = /^EMJ-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Contract vẫn nhận chuỗi bất kỳ — **tạm thời**, và con số đã được đo lại.
 *
 * Corpus seed đã sạch: task 162 đổi 239 `ref` sang mã và bổ sung 15 emoji còn
 * thiếu vào registry, nên `packages/db/tests/gates/emoji-ref-debt.test.ts` giờ
 * đo **0** glyph thô và giữ nó ở 0.
 *
 * Chưa siết được thành `.regex(EMOJI_REF_PATTERN)` vì nợ còn ở chỗ khác: 27
 * file `templates/GT-0xx/fixtures.ts` và các test engine vẫn dùng glyph thô.
 * Siết ngay làm đỏ toàn bộ `packages/game-engine/tests`. Dọn nốt fixture rồi
 * đổi dòng dưới — đó là việc của một task riêng, không phải hiệu ứng phụ.
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
    z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
    z.object({ kind: z.literal("image"), path: z.string() }),
  ]);

/** `prompt` + `prompt_audio_ref`, present on every template content contract. */
export const promptFields = () => ({
  prompt: z.string().min(4).max(80),
  prompt_audio_ref: z.string().optional(),
});
