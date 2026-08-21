# Todo — Task #100: Chuỗi vòng trong một màn chơi (P1 vá + P2 tính năng)

> Lý do và work package: [`100-round-sequence-plan.md`](100-round-sequence-plan.md).
> Không bị task nào chặn. Chặn [`Task #101`](101-legacy-v1-templates-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.

## Preflight

- [x] Đọc [`round-set-model.md`](../specs/05-content/round-set-model.md) §6, §7, §11.
- [x] Đọc [`round-sequence-play.md`](../specs/04-play/round-sequence-play.md) §6, §7, §11.
- [x] Chụp snapshot `trạng-thái | tên-test` của 17 khuôn **trước** khi chạm engine.
- [x] Đếm baseline `pnpm test` và `pnpm typecheck:web` để so delta sau.
- [x] Xác nhận không session production nào phát `round_started` — đo lại, đừng tin bản ghi cũ.

## WP100.0 — Vá điểm, ship độc lập

- [x] Viết test đỏ trước: phiên không có `round_started`, trả lời đúng hết, hiện chỉ được 1 sao.
- [x] Vá `first_try_ratio` khi `rounds_total = 0` trong [`packages/shared/src/scoring.ts`](../../packages/shared/src/scoring.ts).
- [x] Test chuyển xanh; kiểm không phiên nào đang có bị đổi điểm theo hướng giảm.
- [x] Ghi quyết định vào câu hỏi còn mở số 2 của [`round-sequence-play.md`](../specs/04-play/round-sequence-play.md).
- [x] **CHECKPOINT A** — dừng lại, xác nhận sao đã đúng trước khi mở WP100.1.

## WP100.1 — Ba quyết định người (cổng người)

- [x] `game_level_rounds` là bảng con hay cột `rounds` jsonb? Ghi vào câu hỏi còn mở số 1 của [`round-set-model.md`](../specs/05-content/round-set-model.md).
- [x] Migration: expand-contract rồi drop cột cũ, hay giữ cột cũ làm vòng 0?
- [x] Câu chữ mục 7.2 của [`event-catalog.md`](../specs/00-foundation/event-catalog.md): "khuôn một vòng không phát nó" chỉ nói về trường `round_index`, đúng không?
- [x] Cả ba ghi vào spec kèm lý do; không để lửng.

## WP100.2 — Bảng vòng và migration

- [x] Tạo `game_level_rounds` theo mục 7.2 của [`round-set-model.md`](../specs/05-content/round-set-model.md); UNIQUE `(game_level_id, round_index)`.
- [x] Migration expand: copy `content_pack`, `difficulty_params`, `instruction` của mọi level thành `round_index = 0`.
- [x] `pnpm --filter @mindkid/db test` xanh.
- [ ] Đọc một level cũ trước và sau migration, so từng field: phải y hệt.
- [x] Cập nhật mục 7.4 của [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) — bảng mới phải khớp hai chiều với [`data-model-overview.md`](../specs/01-platform/data-model-overview.md).

## WP100.3 — Cổng publish cho 13 rule biên tập

- [x] Fixture vi phạm cho **từng** rule `BR-RSM-01` tới `BR-RSM-13`.
- [x] Cổng đỏ trên mỗi fixture, kèm `round_index` vi phạm trong `details.fields[]`.
- [x] Cổng xanh trên toàn bộ corpus level hiện có.
- [x] Ca âm bắt buộc theo `BR-TYP-07` — cổng không có ca âm là cổng chưa xong.
- [x] **CHECKPOINT B** — dữ liệu đúng, chưa ai chơi được. Xác nhận trước khi mở WP100.4.

## WP100.4 — Config delivery

- [x] Payload trả `rounds[]` đầy đủ và `scoring.mode`.
- [x] Asset của **mọi** vòng phân giải ở server (`BR-CFG-07`), không để client dựng URL.
- [x] Đo trần 200 KB gzipped trên **cả set**, không phải trên một vòng.
- [x] Set vượt trần bị chặn kèm số byte đo được.
- [ ] Một vòng không parse được thì trả `422 CONTENT_PACK_INVALID` mang `round_index`.

## WP100.5 — RoundRunner

- [x] `RoundRunner` bọc `TemplateGameSession`; **không** sửa `game-session.ts`.
- [x] Mỗi vòng dựng session mới; `destroy()` session cũ **trước** khi dựng session kế.
- [x] Phát `round_started` và `round_completed` cho **mọi** vòng, kể cả set một vòng.
- [x] Scaffolding reset mỗi vòng; `hint_count` cộng dồn cả phiên.
- [x] Kẹt một vòng thì phát `round_skipped` và sang vòng kế, không chặn.
- [x] Chạy headless hết set 4 vòng; `getNetworkRequestCount()` trả 0.
- [x] So snapshot hành vi 17 khuôn: **trùng khít**. 68 tests pass (4 per template × 17).
- [x] **CHECKPOINT C** — engine chạy hết set headless. Bề mặt đã viết.

## WP100.6 — Bề mặt chơi

- [x] Chuyển vòng do trẻ chạm hoặc tự chuyển sau pop; **không** đếm ngược.
- [x] Chỉ báo tiến độ bằng hình; **không** chữ số. (`round-progress-indicator.vue`)
- [x] Ăn mừng lớn chỉ sau vòng cuối; vòng giữa chỉ pop nhỏ tại điểm chạm.
- [x] Chuyển cảnh giữ đúng một phần tử động tại một thời điểm.
- [x] `pnpm --filter @mindkid/gates test` xanh.

## WP100.7 — Cổng chống hồi quy

- [x] `complete` trả `422 VALIDATION_FAILED` khi `scoring.mode` là `rounds` mà thiếu `round_started`.
- [x] Client gửi `rounds_correct` trong body thì giá trị đó bị bỏ qua.
- [x] Ca âm: chuỗi event thiếu vòng phải làm cổng đỏ.

## WP100.8 — Verification

- [x] 27 rule có test mang ID rule trong tên test.
- [x] `pnpm lint`, `pnpm --filter @mindkid/gates test`, `pnpm check` xanh.
- [x] `pnpm test` và `pnpm typecheck:web` không tăng so baseline đã đếm ở Preflight.
- [x] Lật `status` của hai spec sang `implemented`.
- [ ] Ghi lại số đo thật vào câu hỏi còn mở số 3 của [`round-set-model.md`](../specs/05-content/round-set-model.md) nếu đã chơi thử với trẻ.
