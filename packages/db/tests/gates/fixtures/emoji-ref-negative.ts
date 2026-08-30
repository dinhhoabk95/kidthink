/**
 * Mẫu vi phạm cho `emoji-ref-debt.test.ts`: một `ref` là glyph thô thay vì mã
 * `EMJ-<slug>`. Sống ở `fixtures/` chứ không nằm trong file test, vì corpus
 * thật là thứ chính phép đo này đang quét.
 */
export const RAW_GLYPH_LEVEL_FIXTURE = {
  content_pack: {
    options: [{ item_id: "a", asset: { kind: "emoji", ref: "🍎" } }],
  },
};
