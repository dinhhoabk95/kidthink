# Todo — Task #100: Chuỗi vòng trong một màn chơi (P1 vá + P2 tính năng)

> Lý do và work package: [`100-round-sequence-plan.md`](100-round-sequence-plan.md).
> Không bị task nào chặn. Chặn [`Task #101`](101-legacy-v1-templates-plan.md).
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.

## Preflight

- [x] Đọc [`round-set-model.md`](../specs/05-content/round-set-model.md) §6, §7, §11.
- [x] Đọc [`round-sequence-play.md`](../specs/04-play/round-sequence-play.md) §6, §7, §11.
- [ ] Chụp snapshot `trạng-thái | tên-test` của 17 khuôn **trước** khi chạm engine.
- [ ] Đếm baseline `pnpm test` và `pnpm typecheck:web` để so delta sau.
- [ ] Xác nhận không session production nào phát `round_started` — đo lại, đừng tin bản ghi cũ.

## WP100.0 — Vá điểm, ship độc lập

- [x] Viết test đỏ trước: phiên không có `round_started`, trả lời đúng hết, hiện chỉ được 1 sao.
- [x] Vá `first_try_ratio` khi `rounds_total = 0` trong [`packages/shared/src/scoring.ts`](../../packages/shared/src/scoring.ts).
- [x] Test chuyển xanh; kiểm không phiên nào đang có bị đổi điểm theo hướng giảm.
- [x] Ghi quyết định vào câu hỏi còn mở số 2 của [`round-sequence-play.md`](../specs/04-play/round-sequence-play.md).
- [ ] **CHECKPOINT A** — dừng lại, xác nhận sao đã đúng trước khi mở WP100.1.

## WP100.1 — Ba quyết định người (cổng người)

- [ ] `game_level_rounds` là bảng con hay cột `rounds` jsonb? Ghi vào câu hỏi còn mở số 1 của [`round-set-model.md`](../specs/05-content/round-set-model.md).
- [ ] Migration: expand-contract rồi drop cột cũ, hay giữ cột cũ làm vòng 0?
- [ ] Câu chữ mục 7.2 của [`event-catalog.md`](../specs/00-foundation/event-catalog.md): "khuôn một vòng không phát nó" chỉ nói về trường `round_index`, đúng không?
- [ ] Cả ba ghi vào spec kèm lý do; không để lửng.

## WP100.2 — Bảng vòng và migration

- [ ] Tạo `game_level_rounds` theo mục 7.2 của [`round-set-model.md`](../specs/05-content/round-set-model.md); UNIQUE `(game_level_id, round_index)`.
- [ ] Migration expand: copy `content_pack`, `difficulty_params`, `instruction` của mọi level thành `round_index = 0`.
- [ ] `pnpm lint:migration-expand` xanh.
- [ ] Đọc một level cũ trước và sau migration, so từng field: phải y hệt.
- [ ] Cập nhật mục 7.4 của [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) — bảng mới phải khớp hai chiều với [`data-model-overview.md`](../specs/01-platform/data-model-overview.md).

## WP100.3 — Cổng publish cho 13 rule biên tập

- [ ] Fixture vi phạm cho **từng** rule `BR-RSM-01` tới `BR-RSM-13`.
- [ ] Cổng đỏ trên mỗi fixture, kèm `round_index` vi phạm trong `details.fields[]`.
- [ ] Cổng xanh trên toàn bộ corpus level hiện có.
- [ ] Ca âm bắt buộc theo `BR-TYP-07` — cổng không có ca âm là cổng chưa xong.
- [ ] **CHECKPOINT B** — dữ liệu đúng, chưa ai chơi được. Xác nhận trước khi mở WP100.4.

## WP100.4 — Config delivery

- [ ] Payload trả `rounds[]` đầy đủ và `scoring.mode`.
- [ ] Asset của **mọi** vòng phân giải ở server (`BR-CFG-07`), không để client dựng URL.
- [ ] Đo trần 200 KB gzipped trên **cả set**, không phải trên một vòng.
- [ ] Set vượt trần bị chặn kèm số byte đo được.
- [ ] Một vòng không parse được thì trả `422 CONTENT_PACK_INVALID` mang `round_index`.

## WP100.5 — RoundRunner

- [ ] `RoundRunner` bọc `TemplateGameSession`; **không** sửa `game-session.ts`.
- [ ] Mỗi vòng dựng session mới; `destroy()` session cũ **trước** khi dựng session kế.
- [ ] Phát `round_started` và `round_completed` cho **mọi** vòng, kể cả set một vòng.
- [ ] Scaffolding reset mỗi vòng; `hint_count` cộng dồn cả phiên.
- [ ] Kẹt một vòng thì phát `round_skipped` và sang vòng kế, không chặn.
- [ ] Chạy headless hết set 4 vòng; `getNetworkRequestCount()` trả 0.
- [ ] So snapshot hành vi 17 khuôn: **trùng khít**. Bất kỳ test đổi trạng thái, kể cả đỏ sang xanh, đều là dấu hiệu đổi hành vi.
- [ ] **CHECKPOINT C** — engine chạy hết set headless. Xác nhận trước khi chạm bề mặt.

## WP100.6 — Bề mặt chơi

- [ ] Chuyển vòng do trẻ chạm hoặc tự chuyển sau pop; **không** đếm ngược.
- [ ] Chỉ báo tiến độ bằng hình; **không** chữ số.
- [ ] Ăn mừng lớn chỉ sau vòng cuối; vòng giữa chỉ pop nhỏ tại điểm chạm.
- [ ] Chuyển cảnh giữ đúng một phần tử động tại một thời điểm.
- [ ] `pnpm lint:kid-surface` xanh.

## WP100.7 — Cổng chống hồi quy

- [ ] `complete` trả `422 VALIDATION_FAILED` khi `scoring.mode` là `rounds` mà thiếu `round_started`.
- [ ] Client gửi `rounds_correct` trong body thì giá trị đó bị bỏ qua.
- [ ] Ca âm: chuỗi event thiếu vòng phải làm cổng đỏ.

## WP100.8 — Verification

- [ ] 27 rule có test mang ID rule trong tên test.
- [ ] `pnpm lint`, `pnpm lint:specs`, `pnpm check` xanh.
- [ ] `pnpm test` và `pnpm typecheck:web` không tăng so baseline đã đếm ở Preflight.
- [ ] Lật `status` của hai spec sang `implemented`.
- [ ] Ghi lại số đo thật vào câu hỏi còn mở số 3 của [`round-set-model.md`](../specs/05-content/round-set-model.md) nếu đã chơi thử với trẻ.
