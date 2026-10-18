# Task #295 Todo: Bài làm quen chạy theo phân đoạn và quay lại đúng mốc

Plan: [`295-concept-intro-segments-plan.md`](295-concept-intro-segments-plan.md).
Spec: [`concept-intro-runner.md`](../specs/04-play/concept-intro-runner.md) `BR-CIR-17/18`, [`concept-intro-model.md`](../specs/05-content/concept-intro-model.md) `BR-CIM-03`, [`concept-intro-gate.md`](../specs/04-play/concept-intro-gate.md) `BR-CIG-12`.

---

## S1 — `BR-CIM-03`
- [ ] Test đỏ: segment dạy > 3 asset bị từ chối
- [ ] Đo content GT-000 vi phạm; sửa builder/dữ liệu (phiên bản mới, không sửa bản đã publish)
- [ ] `GT000SegmentSchema.asset_ids` `.max(3)` (`template.ts:76`); xử lý segment ôn theo spec
- [ ] Chạy lại seed GT-000

## S2 — Runner theo phân đoạn (`BR-CIR-17`)
- [ ] Test đỏ: hết segment 0 phát `intro_segment_completed` với `segment_id`/`segment_index` thật
- [ ] Bỏ `flatMap` (`session.ts:129`) và `"seg_0"` cứng (`:159-161`, `:724-726`)
- [ ] Mốc ăn mừng nhẹ cuối mỗi segment

## S3 — Resume (`BR-CIR-18`)
- [ ] Test đỏ engine: khởi tạo từ `resume_segment_index`
- [ ] Test đỏ server: config trả `resume_segment_index` theo mốc cuối đã xong
- [ ] Tính mốc trong `concept-intro-runtime.ts`, đưa vào config GT-000

## S4 — Ma trận gate (`BR-CIG-12`)
- [ ] Ma trận §7.3 + ca âm miễn cổng trong `packages/shared/tests/access-gating.test.ts` (fixture ở `tests/**/fixtures/`)
- [ ] Test tích hợp `concept-intro-runtime`
- [ ] Gắn mã các `BR-CIG-*` còn thiếu vào test đo đúng hành vi

## S5 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test game-engine/shared/web liên quan xanh; `check:intro-coverage`, `check:engine-specs` xanh
- [ ] Bỏ `open_tasks` + khối "Chưa hoàn thành" ở 3 spec, nâng `status: implemented`
- [ ] Commit lên `main`
