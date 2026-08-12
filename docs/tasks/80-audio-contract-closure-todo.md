# Todo — Task #80: Đóng contract audio tiếng Việt

## Preflight

- [ ] Đọc [`SPEC.md`](../SPEC.md) §0, §11, §15;
      [`business-rules.md`](../specs/00-foundation/business-rules.md) §7.3;
      [`CONVENTIONS.md`](../specs/CONVENTIONS.md).
- [ ] Đọc spec runtime/config và Task #33/#47/#49; xác nhận Task #49 chỉ sở hữu ảnh.
- [ ] Ghi baseline query về `audio`, `speechSynthesis`, `vi-VN`, offline và C5.

## WP80.1 — Checkpoint A

- [ ] Lập matrix clip tĩnh/Web Speech/audio asset × online/offline × có/không `vi-VN`.
- [ ] Gắn requirement cho từng engine template và competency; không dùng “có audio” chung chung.
- [ ] Product/Content/Engineering duyệt primary source, fallback và phase authoring.
- [ ] Ghi rõ phương án bị loại và lý do; không để placeholder mở trong implementation task.

## WP80.2 — Runtime contract

- [ ] Xác định một spec owner cho delivery/fallback/accessibility/cache.
- [ ] Viết happy path, empty/error/offline path và hành vi không crash/silent dead-end.
- [ ] Đăng ký BR/error/event mới trước khi tham chiếu.
- [ ] Thêm negative examples: không giọng Việt, asset 404/corrupt, autoplay bị chặn.

## WP80.3 — Authoring/asset contract có điều kiện

- [ ] Nếu P2 authoring được nhận, tách spec owner storage/upload/picker khỏi image pipeline.
- [ ] Chốt MIME, kích thước, quyền sử dụng, moderation, lifecycle và reverse usage.
- [ ] Nếu không nhận, ghi quyết định `not planned` và xóa active promise thu âm/upload.
- [ ] Xác nhận không ghi, lưu hoặc suy luận giọng trẻ.

## WP80.4 — Traceability

- [ ] Cập nhật [`SPEC.md`](../SPEC.md), [`index.md`](../specs/index.md), roadmap và số đếm sau
      khi spec được duyệt.
- [ ] Cập nhật [`business-rules.md`](../specs/00-foundation/business-rules.md) §7.1/registry
      lỗi/event nếu có prefix mới.
- [ ] Cross-link Task #33/#47/#49; không copy contract sang plan.
- [ ] Chạy link check và `pnpm lint:specs`.

## WP80.5 — Handoff implementation

- [ ] Tạo task implementation mới với work package S/M, dependency và negative test RED trước.
- [ ] Có matrix test Lenovo mục tiêu, online/offline, có/không `vi-VN`.
- [ ] Nêu rõ human diff review; không auto-merge/không phát hành asset.

## Gate hoàn tất

- [ ] Checkpoint A có người duyệt.
- [ ] Spec owner được `approved`; không còn audio debt vô chủ.
- [ ] `pnpm lint:specs` và gate repo liên quan xanh.
- [ ] Todo implementation kế tiếp có owner và thứ tự; Task #80 không tự nhận là đã ship audio.
