# Todo — Task #96: Bộ tiết học mẫu (P4)

> Lý do và work package: [`96-lesson-exemplar-set-plan.md`](96-lesson-exemplar-set-plan.md).
> Chặn bởi [`Task #95`](95-lesson-session-runner-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Cần PostgreSQL 17 sống: `docker compose up -d`.

## Preflight

- [x] [`Task #95`](95-lesson-session-runner-plan.md) đã đóng; bảng bản ghi lượt chạy tồn tại.
- [x] Đọc [`lesson-exemplar-set.md`](../specs/05-content/lesson-exemplar-set.md) §6, §7, §11.
- [x] Xác nhận lược đồ nội dung chưa có cờ mẫu.
- [x] Đọc §11 Q1 của [`lesson-model.md`](../specs/05-content/lesson-model.md) — cùng một nợ, đừng trả lời khác nhau ở hai chỗ.

## WP96.0 — Hai câu hỏi người

- [x] Ai đóng vai chuyên gia sư phạm mầm non ký điều kiện người? (Đã chốt: `content_reviewer` / `super_admin` trên bảng `managers`)
- [x] Nơi lưu ghi chép chơi thử thuộc spec nào? Nếu chưa có chủ, ghi rõ đang chặn điều kiện số 2. (Đã chốt: bảng `lesson_runs` completed từ Task #95)
- [x] Ghi hai quyết định vào §11 của spec.

## WP96.1 — Migration cờ mẫu

- [x] Cờ mẫu và bốn cột kèm theo, theo §7 (`is_exemplar`, `exemplar_competency`, `exemplar_age_band`, `exemplar_approved_by_id`, `exemplar_approved_at`).
- [x] Chỉ cộng thêm; chạy trên cơ sở dữ liệu đã có dữ liệu.

## WP96.2 — Đề cử trong màn soạn

- [x] Hiện đủ sáu điều kiện và trạng thái từng điều kiện.
- [x] Chặn đề cử khi thiếu điều kiện kiểm được bằng máy.
- [x] Test: thiếu bản ghi lượt chạy thì không đề cử được.

## WP96.3 — Duyệt trong hàng đợi review

- [x] Bản ký của người là điều kiện bật cờ mẫu (`LessonExemplarService.approveExemplar`).
- [x] Bỏ cờ mẫu cũng đi qua duyệt, có ghi log kiểm toán (`LessonExemplarService.revokeExemplar`).
- [x] Test: không có đường nào bật cờ ngoài duyệt.

## WP96.4 — Cổng ma trận và sàn

- [x] Cổng đọc ma trận 18 ô, sáu năng lực nhân ba dải tuổi (`scripts/lint-lesson-exemplar-matrix.ts`).
- [x] Sàn 18 tiết học mẫu.
- [x] Fixture thiếu một ô; test khẳng định cổng đỏ (`scripts/tests/lint-lesson-exemplar-matrix.test.ts`).

## WP96.5 — Đóng task

- [x] 11 rule `BR-LEX` có test gọi tên mã.
- [x] Lật `status` sang `implemented`.
- [x] `pnpm check` · `pnpm test` · `pnpm check:progress` xanh.
- [x] Mở PR cho người review diff, không tự merge.

