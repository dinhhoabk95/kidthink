# Task #206 — Todo: bài làm quen bắt buộc trước khi chơi

Kế hoạch: [`206-pre-play-concept-intro-plan.md`](206-pre-play-concept-intro-plan.md)

## M0 — chốt thiết kế (đang ở đây)

- [x] Đo hiện trạng: 36 engine, 0 engine dạy; 3.156 chỉ dẫn bằng chữ, 0 audio; 0 kiểm sư phạm ở đường chơi
- [x] Viết `docs/specs/05-content/concept-intro-model.md` (`BR-CIM`, `draft`)
- [x] Viết `docs/specs/04-play/concept-intro-runner.md` (`BR-CIR`, `draft`)
- [x] Viết `docs/specs/04-play/concept-intro-gate.md` (`BR-CIG`, `draft`)
- [x] Đăng ký 3 prefix ở `00-foundation/business-rules.md` §7.1 và 3 dòng ở `specs/index.md`
- [x] Người đặt việc chốt §7 của plan (5 giả định) và 3 câu hỏi mở của mỗi spec: Đã chốt theo Strand
- [x] Chốt `A-206-01`: gắn theo strand (71 bài)

## M1 — delta vào spec đang có (chỉ sau khi M0 chốt)

- [x] `04-play/access-gating.md` §4 — thêm bước 8, giữ nguyên bảy bước và `BR-GAT-02`
- [x] `00-foundation/error-codes.md` — `INTRO_REQUIRED` → 428, `details.intro_level_code`
- [x] `00-foundation/event-catalog.md` — 5 event mục 7.2 của runner
- [x] `01-platform/game-template-contract.md` — cột `game_templates.kind` (`assess` \| `teach`)
- [x] Ba spec mới `draft` → `approved`

## M2 — engine `GT-000`

- [x] Migration: `game_templates.kind`, mặc định `assess` cho 36 template đang có
- [x] `packages/game-engine/src/templates/GT-000/` — session ba nhịp
- [x] Đăng ký vào `generated/template-registry.ts` + contract `content_pack` mục 7.1 của `concept-intro-model.md`
- [x] Phiếu `docs/specs/01-platform/engines/GT-000.md` — viết **sau** khi template có trong registry (bốn mục là trích từ registry, có cổng đối chiếu)
- [x] `pnpm test` cổng engine spec xanh

## M3 — runner

- [x] Ba nhịp + nhánh mục 5 (12 giây im lặng · ba lần sai · thiếu TTS · thoát giữa chừng)
- [x] 5 event mới, đẩy qua đường `play-event-ingestion` đang có (`ALLOWED_EVENT_NAMES` + `EVENT_PAYLOAD_FIELDS`)
- [x] Bỏ nhánh ghi `mastery_state` khi `kind = 'teach'` (`BR-CIR-11`)
- [x] Template `GT-000` Session hỗ trợ 3 band tuổi (3-4, 4-5, 5-6)
- [x] Ca âm: không có `getUserMedia` hay ghi âm sinh trắc (`BR-CIR-09`)

## M4 — bước 8

- [x] Bước 8 trong `assertContentAccess` (`packages/shared/src/access-gating.ts`)
- [x] `428 INTRO_REQUIRED` + `details.{intro_level_code, return_level_code, primary_skill_code, intro_queue, intro_remaining}`
- [x] `GET /api/users/levels/[code]/readiness` & `GET /api/guest/levels/[code]/readiness`
- [x] Bỏ qua kiểm tra bài làm quen cho preview / lessonRun / chính level teach
- [x] Client `/play/[code].vue` bắt 428 `INTRO_REQUIRED`, chuyển sang bài làm quen qua modal CTA và quay lại level ban đầu khi hoàn thành qua `return_to`

## M5 — cổng bậc thang độ phủ

- [x] Script `scripts/check-intro-coverage.ts` đếm kỹ năng có level `assess` published nhưng thiếu bài làm quen
- [x] Baseline khởi điểm `scripts/intro-coverage-baseline.json`: 230
- [x] Hỗ trợ cờ `--update` để hạ baseline khi có thêm bài làm quen được publish

## M6 — soạn nội dung

- [x] Đợt 1: C1 (`GL-C1-INTRO-0001`, `GL-C1-INTRO-0002` cho nhận biết số và đếm)
- [x] Đợt 2: C5 (`GL-C5-INTRO-0001` cho chữ cái & từ vựng)
- [x] Đợt 3: C2 (`GL-C2-INTRO-0001` cho hình học cơ bản)
- [x] Wire seed batches vào `C1_SEED_LEVELS`, `C5_SEED_LEVELS`, `C2_SEED_LEVELS`
