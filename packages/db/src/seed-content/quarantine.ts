/**
 * Hạt giống level chưa diễn đạt được bằng engine hiện có.
 *
 * **Danh sách rỗng từ 2026-08-30.** Task 162 gặp 73 mã ở đây: chúng viết theo
 * thế hệ template đặt tên theo chủ đề, và cơ chế chơi của chúng không có engine
 * nào nhận. Cả 73 đã được **soạn lại** trong
 * `seed-content/reauthored/authoring.ts` — so sánh hai vật thành `GT-001`,
 * so sánh số lượng thành `GT-014` cân thăng bằng, quy luật lặp thành `GT-011`
 * ô vuông Latinh, dãy có thứ tự thành `GT-008`, vị trí thành `GT-022` có toạ
 * độ, và nhìn chớp thành `GT-012` đếm nhanh.
 *
 * Danh sách chỉ được **ngắn đi**; cổng
 * `packages/db/tests/gates/seed-quarantine.test.ts` chặn mọi lần dài thêm và
 * chặn cả mã đã hết lý do cách ly mà còn nằm lại. Trần 0 nghĩa là từ nay một
 * level không parse được contract làm cổng đỏ ngay, thay vì chui vào một hạn
 * ngạch còn chỗ trống.
 */
export const QUARANTINED_LEVEL_CODES: readonly string[] = [];

export const QUARANTINED_LEVEL_SET: ReadonlySet<string> = new Set(
  QUARANTINED_LEVEL_CODES
);
