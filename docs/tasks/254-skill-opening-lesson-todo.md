# Todo — Task #254: Bài học mở đầu cho mỗi kỹ năng

> Kế hoạch: [`254-skill-opening-lesson-plan.md`](254-skill-opening-lesson-plan.md).

## Preflight

- [ ] Ghi danh sách file test đỏ hiện tại vào scratch — `pnpm test` có `--bail 1`, không có
      danh sách trước thì không so được hồi quy.
- [ ] Chạy `node scripts/check-intro-coverage.ts`, ghi lại con số. Kỳ vọng `392`.
- [ ] Xác nhận `node --version` là 24.15 khi gọi thẳng binary; `node` trên PATH là v20.

## WP254.1 — Spec đi trước

- [x] Viết [`concept-topic-model.md`](../specs/05-content/concept-topic-model.md) — 12 luật `BR-CTM-*`.
- [x] Xoá `concept-pre-skill.md`.
- [x] `concept-intro-model.md`: đổi neo sang `concept.skill_code`, xoá `BR-CIM-13`, thêm `BR-CIM-19` (`echo`) và `BR-CIM-20` (`sequence_no`).
- [x] `concept-intro-gate.md`: đơn vị hàng đợi strand → level/kỹ năng, baseline 41 → 392, thêm `BR-CIG-18`.
- [x] `concept-intro-runner.md`: bề mặt `echo`, thêm `BR-CIR-21` và `BR-CIR-22`, 2 event mới.
- [x] `GT-000.md`: sửa `BR-E000-09`, thêm `BR-E000-10`, cập nhật §12 §13 §14.
- [x] `engine-content-depth.md`: thêm `BR-SKQ-08` — level dạy ngoài hạn ngạch.
- [x] `business-rules.md` §7.1: `BR-PRE` → `BR-CTM`.
- [x] `index.md`: cập nhật dòng và số đếm.
- [ ] Đọc lại theo checklist 18 mục của [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 10 — cổng máy đã gỡ 2026-08-29, đây là lượt đọc của người.

## WP254.2 — Gỡ bậc `pre`

- [x] Chuyển `SkillLevelPlan` `GT-000` và dataset từ 5 file `pre` sang kỹ năng chơi đầu chủ đề.
- [x] Bỏ mã `pre` khỏi `skill_codes` của level và khỏi `prerequisites` của các kỹ năng chơi.
- [x] Đổi `content_pack.concept.pre_skill_code` → `skill_code`, thêm `teaches[]` và `values[]`.
- [x] Xoá 5 file `C1.NREC.13.ts` `C1.NREC.14.ts` `C1.NREC.15.ts` `C2.GEO.09.ts` `C4.DET.05.ts` và mọi export của chúng.
- [x] Bỏ `"pre"` khỏi `SkillProgressionTier` (`packages/shared/src/taxonomy-types.ts`).
- [x] Migration Postgres tạo lại enum `skill_tier` không còn `pre`. **Người review diff trước merge.**
- [x] Bỏ nhánh `skill.tier === "pre"` ở `packages/content-build/src/gates/skill-quota.ts`.
- [x] **Ca âm:** một kỹ năng khai `tier: "pre"` → typecheck đỏ.
- [x] Chạy lại `check-intro-coverage` — phải vẫn là `392`. Khác đi là gắn thiếu, dừng.

## WP254.3 — Hành động `echo`

- [x] Thêm nhánh `echo` vào union step của `GT-000/template.ts`, với `repeat_count` 1–3 mặc định 1.
- [x] Đăng ký event `intro_echo_started` và `intro_echo_completed`.
- [x] Xử lý `echo` trong `GT-000/session.ts`: phát `audio_path` hoặc TTS `vi-VN`, chờ chạm.
- [x] Bộ chiếu `builders/gt-000.ts` chèn `echo` sau mỗi `present` ở phân đoạn dạy.
- [x] Nút "Bé nói theo" và nút nghe lại ở `apps/web/app/pages/play/[code].vue`.
- [x] Fixtures `GT-000` có ít nhất một step `echo`.
- [x] **Ca âm:** một phân đoạn dạy không có step `echo` → cổng nội dung đỏ (`BR-CIM-19`).
- [x] **Ca âm:** không API micro nào được gọi, không event nào mang dữ liệu âm thanh (`BR-CIR-21`).

## WP254.4 — Dấu hiệu hoàn thành

- [x] Tách `findCompletedLevelIds` thành hàm dùng chung, không nhân bản truy vấn (`BR-CIG-10`).
- [x] `/api/users/play/map` và đường khách trả `completed_level_codes`.
- [x] Huy hiệu "Đã học xong" trên thẻ bài dạy ở `apps/web/app/pages/games/index.vue`.
- [x] Màn kết bài dạy nói rõ đã học xong trước khi quay về `return_level_code`.
- [x] **Ca âm:** payload Cấm — NEVER chứa `p_learn`, phần trăm hay xếp hạng (`BR-PRG-02`).
- [x] **Ca âm:** hồ sơ trẻ B không thấy huy hiệu của hồ sơ A (`BR-CIG-08`).

## WP254.5 — Nối cổng

- [x] Thêm `check:intro-coverage` và `check:intro-coverage:update` vào `package.json`.
- [x] Gọi `check:intro-coverage` trong Phase 1 của `scripts/check.sh`.
- [x] Sửa `skill-quota.ts`: loại hẳn level `kind === "teach"` khỏi phép đếm (`BR-SKQ-08`).
- [x] Cập nhật `docs/specs/08-quality/runtime-gates.md` — cổng này đã sống, ai gọi nó.
- [x] **Ca âm:** thêm một level chấm cho kỹ năng chưa có bài dạy → `pnpm check` đỏ.
- [x] **Ca âm:** kỹ năng C1 có 19 level chấm cộng 1 level dạy → `check:skill-quota` đỏ.

## WP254.6 — Nội dung pilot C1

- [x] Lô 1 — `C1.CMP`, 15 kỹ năng. Chủ đề lớn hơn / nhỏ hơn / bằng nhau. **Mốc đo thời lượng thật.**
- [x] Báo số sau lô 1: bao nhiêu giờ soạn, bao nhiêu level dạy thực tế, rồi mới đi tiếp.
- [ ] Lô 2 — `C1.CNT` · `C1.NREC`.
- [ ] Lô 3 — `C1.ORD` · `C1.OTO` · `C1.PAT`.
- [ ] Lô 4 — `C1.ADD` · `C1.SUB` · `C1.NCOMP`.
- [ ] Lô 5 — `C1.MEAS` · `C1.DAT` · `C1.PROB`.
- [x] Mỗi lô hạ baseline bằng `check:intro-coverage --update`, một PR một lô.
- [ ] **Ca âm mỗi lô:** bỏ một giá trị khỏi `concept.values[]` đã dạy → cổng `BR-CTM-09` đỏ.

## Đóng task

- [x] Chạy thật ở local theo mục 5 của kế hoạch, đủ bảy bước.
- [x] `pnpm check` · `pnpm typecheck` xanh sạch (exit 0).
- [x] Cập nhật `docs/specs/index.md` số đếm nếu lệch.
