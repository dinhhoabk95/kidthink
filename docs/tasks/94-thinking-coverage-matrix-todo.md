# Todo — Task #94: Ma trận phủ tư duy (P3)

> Lý do và work package: [`94-thinking-coverage-matrix-plan.md`](94-thinking-coverage-matrix-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Cần PostgreSQL 17 sống và seed Lớp 1 đã chạy.

## Preflight

- [ ] Đọc [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) §6, §7, §11.
- [ ] Đo số nội dung đã publish có tag trục tư duy, theo từng trục. Số đo ngày 2026-08-18: không trục nào có nội dung.
- [ ] Đọc §11 Q1 của [`content-tagging.md`](../specs/01-platform/content-tagging.md) — cùng câu hỏi, đừng trả lời hai lần khác nhau.

## WP94.0 — Câu hỏi người

- [ ] Chọn đường đi: gắn tag bù trước, hay bật cổng với ngưỡng tắt rồi mở dần.
- [ ] Chốt sàn: theo dải tuổi hay theo strand (§11 Q2).
- [ ] Chốt: lesson và màn chơi có chung sàn không (§11 Q3).
- [ ] Ghi ba quyết định vào §11 của spec.

## WP94.1 — Script đo

- [ ] `scripts/lint-thinking-coverage.ts` đọc sáu bảng ở §7.
- [ ] In ma trận năng lực nhân trục tư duy kèm số nội dung mỗi ô.
- [ ] Khẳng định script chỉ đọc, không ghi.

## WP94.2 — Ngưỡng và ca âm

- [ ] Ngưỡng đọc từ tệp cấu hình, không hằng số trong mã.
- [ ] Fixture một ô dưới ngưỡng; test khẳng định cổng đỏ.
- [ ] Thông báo phân biệt "chưa có nội dung" với "chưa gắn tag".

## WP94.3 — Đưa ma trận về trạng thái dùng được

- [ ] Theo đường đã chọn: gắn tag bù, hoặc mở ngưỡng từng bước.
- [ ] Ghi số ô bằng 0 trước và sau, đo bằng chính cổng.

## WP94.4 — Đóng task

- [ ] Thêm cổng vào `pnpm check`.
- [ ] 11 rule có test gọi tên mã.
- [ ] Lật `status` sang `implemented`.
- [ ] `pnpm check` · `pnpm check:progress` xanh.
- [ ] Mở PR cho người review diff, không tự merge.
