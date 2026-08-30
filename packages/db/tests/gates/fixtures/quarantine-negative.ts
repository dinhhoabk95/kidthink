/**
 * Mẫu vi phạm cho `seed-quarantine.test.ts`.
 *
 * `content_pack` thiếu `prompt`, `target_item`, `options` — đúng hình dạng nội
 * dung tiền-contract mà task 162 dọn. Mẫu sống ở đây chứ không nằm trong file
 * test: `packages/` là thứ các cổng khác đang quét.
 */
export const INVALID_CONTRACT_FIXTURE = {
  header: {
    code: "GL-C1-XXX-XXXX-9999",
    template_code: "GT-001",
  },
  content_pack: { items: [{ id: "a1", emoji: "🍎" }], target_count: 1 },
  difficulty_params: { count_limit: 5 },
};
