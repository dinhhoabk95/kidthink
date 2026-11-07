# Task #313 — Todo: game-engine cho trẻ mầm non

Nguồn: `313-game-engine-preschool-plan.md`. Mỗi mục: spec trước (nếu đổi hành vi đã chốt) → test đỏ → sửa → `rtk proxy pnpm check`.

## Phase 0 — Level không thắng được
- [x] Web phát gesture `stroke` từ `trailPoints` (`apps/web/app/composables/play/use-play-gesture.ts`)
- [x] Web phát `adjust` (kéo xoay / kéo mức) cho GT-019, GT-032
- [x] Entity nút `flip` (GT-019) và pad `rest` (GT-034) qua tap
- [x] Gate `packages/game-engine/tests/gates/`: mọi fixture giải được chỉ bằng gesture web phát ra + ca âm trong `tests/**/fixtures/`
- [x] GT-031: hint subset-sum thay greedy (`pickCoinHint` trong `templates/GT-031/template.ts`)
- [x] GT-018: refine schema (select có đúng/sai, sequence hợp lệ, không giải sẵn)
- [x] GT-018: sequence không tự thắng, cần nút nộp (session)
- [x] GT-016: `initial_time ≠ target`; match-mode phải có nghiệm (superRefine trong `GT-016/template.ts`)
- [x] GT-035: gate `isSolvableWithinMaxCommands` (fixture + generator đều đạt; chưa nối vào ingest content)

## Phase 1 — Base flow
- [x] B2 fallback không giọng giữ hint level + `focusIndex` (`systems/scaffolding.ts`)
- [x] B3 validate content mọi round lúc load; lỗi factory → màn lỗi
- [x] B4 modal chiến thắng hiện ngay, tier/sao fetch nền
- [x] B5 pause dừng narration + timer; `game_resumed`; `duration_ms` trừ pause
- [x] B6 cooldown ~400ms sau verdict
- [x] B8 một đồng hồ hint, `hint_after_ms` theo round
- [ ] B9 drag slop theo age band; drop cực ngắn = tap; whoosh khi spring-back
- [ ] B7 bỏ `prepareRound` trùng · B10 `allow_retry:false` cho thấy đáp án trước khi skip · B11 khoá input khi skip round cuối
- [ ] B12 replay gọi `cleanupSession`; `seq` ổn định; thống nhất bảng touch floor; nút GT-000 ≥ 96px

## Phase 2 — Hint/feedback thống nhất
- [ ] Hint ladder L1/L2 ghost hand/L3 đọc lại đề cho mọi template; trả cả nguồn + đích
- [ ] `demo_shown` chỉ khi demo vẽ thật
- [ ] Helper `WrongFlash` dùng chung thay ~15 bản tự viết
- [ ] Retry nói câu khích lệ + mp3 fallback; narration pill Montessori
- [ ] Tách màu hint vs retry, tăng tương phản
- [ ] Helper derangement trong `src/rng/`

## Phase 3 — Spec drift "control of error"
- [ ] 000 · [ ] 007 · [ ] 009 · [ ] 010 · [ ] 012 · [ ] 013 · [ ] 014 · [ ] 015
- [ ] 020 · [ ] 021 · [ ] 022 · [ ] 023 · [ ] 026 · [ ] 029 · [ ] 030 · [ ] 031
- [ ] 032 · [ ] 034 (chấm timing) · [ ] 035 (chạy từng bước) · [ ] 036 · [ ] 037

## Phase 4 — Generator & difficulty
- [ ] Generator 006, 008, 011, 012, 015, 016; band khớp `age_min` (011, 015, 017)
- [ ] Nối/xoá trường difficulty chết theo spec sở hữu
- [ ] Gỡ chữ phải đọc khỏi UI trẻ (008, 009, 019, 023, 028, 029, 032, 035, 036)

## Phase 5 — Đặc sắc từng game
- [ ] Đợt demo: 001, 003, 020, 025, 026, 037
- [ ] Khác biệt hoá cặp trùng: 003↔004, 022/025/037, 028/029/031, 001/012/018
- [ ] Các game còn lại theo cột "Hướng đặc sắc" trong plan §1.3
