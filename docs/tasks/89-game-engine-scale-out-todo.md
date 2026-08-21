# Todo — Task #89: Engine mở rộng theo số template, và tiết học mẫu

> Kế hoạch: [`89-game-engine-scale-out-plan.md`](89-game-engine-scale-out-plan.md)

## P0 — Đánh giá và viết spec (xong)

- [x] Đo trục nội dung: 120 game level published, 20 mỗi competency, dùng đủ 6 template
- [x] Đo chi phí thêm template thứ 7: 11 nơi sửa tay, 0 nơi sinh tự động
- [x] Đọc code engine và bề mặt chơi, xác nhận 3 defect ở kế hoạch §2.3
- [x] Xác nhận từ vựng ba trục khai là đóng nhưng cổng seed nhận mọi slug (kế hoạch §2.4)
- [x] Viết [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) — 10 rule `BR-LAY`
- [x] Viết [`deterministic-randomness.md`](../specs/01-platform/deterministic-randomness.md) — 10 rule `BR-RNG`
- [x] Viết [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) — 12 rule `BR-TAK`
- [x] Viết [`lesson-session-runner.md`](../specs/04-play/lesson-session-runner.md) — 11 rule `BR-LSR`
- [x] Viết [`lesson-exemplar-set.md`](../specs/05-content/lesson-exemplar-set.md) — 10 rule `BR-LEX`
- [x] Viết [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) — 10 rule `BR-TCM`
- [x] Đăng ký 6 prefix mới ở [`business-rules.md`](../specs/00-foundation/business-rules.md), thêm mã `LAYOUT_NOT_SUPPORTED` ở [`error-codes.md`](../specs/00-foundation/error-codes.md)
- [x] Cập nhật đếm ở [`index.md`](../specs/index.md) và [`SPEC.md`](../SPEC.md) §14: 139 lên 145 spec, 122 lên 124 MVP
- [x] `pnpm --filter @mindkid/gates test` xanh — 145 spec, 18 check, 0 lỗi, 0 cảnh báo

## P1 — Sửa 3 defect chặn mọi thứ (xong)

- [x] `GameEngine.loop()` gọi `renderSystem.clear(ctx)` rồi `activeSession.render(ctx, renderSystem, now)`
- [x] `GameEngine.start(canvas?)` nhận canvas, gọi `renderSystem.setupCanvas`, giữ `ctx`;
      không canvas thì vẫn tick và phát telemetry, chỉ không vẽ — giữ 55 test headless chạy được
- [x] `destroy()` xoá `ctx`; hai trang chơi đổi `engine.stop()` thành `engine.destroy()`
- [x] `render?` khớp lại chữ ký của [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) §7.4 — thêm tham số `rs: RenderSystem`
- [x] Gộp `createSessionFactory` trùng nhau ở hai trang vào `apps/web/app/utils/game-session-factory.ts`,
      dựng session bằng `(content_pack, difficulty_params)`, bỏ sạch `as never`
- [x] Export 12 kiểu `GT00nContent` / `GT00nDifficulty` ra barrel để ép kiểu ở chỗ gọi
- [x] Hai ca âm: vòng lặp có canvas thì `render` được gọi; không canvas thì không gọi
- [x] `packages/game-engine` 55/55 · `tsc --noEmit` sạch · `biome check` sạch
- [x] Bộ test không cần cơ sở dữ liệu: **662/663**. Ca hỏng duy nhất là
      `packages/db/tests/gates/adaptive-replay.test.ts` với `ECONNREFUSED 127.0.0.1:5433`

**Cảnh báo về bộ test đầy đủ.** Chạy toàn repo cho 2058 test, 1500 xanh, **435 đỏ**,
272 suite đỏ. Postgres cổng 5433 và Valkey cổng 6379 đều không chạy trên máy đo, và
thông báo lỗi áp đảo là lỗi kết nối (`Failed query: insert into` 141 lần, `select` 35,
`ECONNREFUSED` trực tiếp). Chưa lập baseline trước thay đổi nên **không kết luận được**
435 ca đó có sẵn từ trước; chỉ kết luận được rằng mọi thứ chạy không cần cơ sở dữ liệu
đều xanh. Muốn chốt thì phải bật Postgres rồi chạy lại.

**Phát hiện thêm — `nuxt typecheck` là cổng giả.** Nó exit 0 và không in gì, trong khi
`vue-tsc --noEmit -p .nuxt/tsconfig.app.json` báo **605 lỗi kiểu**. Đây là lý do ba defect
trên sống sót. Phân bố: `server/api` 353 · `packages/db` 160 · `app/pages` 35 ·
`packages/shared` 22 · `server/utils` 14 · còn lại 21.

- [x] Thêm `pnpm typecheck:web` chạy `vue-tsc` thật, để con số nhìn thấy được
- [x] Xác nhận hai trang chơi và file factory mới **sạch** dưới `vue-tsc`
- [x] Sửa lỗi duy nhất của `packages/game-engine` dưới cấu hình chặt (`gt006-session.ts:35`)
- [ ] Dọn 605 lỗi rồi đưa `typecheck:web` vào `pnpm check` — **task riêng**, không gộp vào đây

## P2 — Đóng lỗ hổng từ vựng (chặn, chờ quyết định)

Đo trước khi sửa, và số đo đổi hẳn phạm vi — xem kế hoạch §2.4.

- [x] Viết `pnpm --filter @mindkid/db report:tags` đo độ lệch giữa từ vựng Lớp 1 và tag thật trong seed
- [x] Đo được: trục `what` 120/130 giá trị ngoài từ vựng; trục `thinking` 116/122.
      Một nửa số lượt gắn tag nằm ngoài từ vựng
- [x] Phát hiện hai từ vựng đóng khác nhau, giao **rỗng**: [`content-tagging.md`](../specs/01-platform/content-tagging.md) §7.1 so với
      `seed-master/content-tags.ts`
- [ ] **Chặn:** chốt từ vựng nào thắng — câu hỏi mở 4 ở kế hoạch §7
- [ ] Sau khi chốt: gắn lại tag cho 139 nội dung đã seed
- [ ] Sau đó: `isValidTagForAxis` bỏ nhánh `SLUG_REGEX`
- [ ] Ca âm: tag bịa đặt làm cổng seed đỏ — `BR-TCM-02`

Không bỏ nhánh dự phòng trước khi gắn lại tag: làm vậy chỉ đổi một cổng luôn xanh sai thành
một cổng luôn đỏ, và cổng luôn đỏ cũng không ai đọc.

## P3 — Layout và ngẫu nhiên có seed (chờ approve)

- [ ] `packages/game-engine/src/layout/` — 12 `LayoutId`, hàm thuần, test hình học
- [ ] Ép sàn chạm trong layout qua đúng một hàm — `BR-LAY-03`
- [ ] `packages/game-engine/src/rng/` — `createRng`, `deriveStream`, `shuffle`
- [ ] Lint cấm `Math.random()` trong `packages/game-engine` — `BR-RNG-02`
- [ ] Cột `layout_seed` trên bảng phiên chơi, đưa vào payload config
- [ ] Nối `shuffle_items` · `shuffle_sides` · `shuffle_initial` vào 6 Session class

## P4 — Cổng phủ tư duy (chờ approve)

- [ ] `pnpm --filter @mindkid/db test` dựng 3 ma trận, in ô thiếu và số còn thiếu
- [ ] Nối vào cổng publish của [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md)
- [ ] Hiển thị ma trận trên [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md)

## P5 — Bộ dựng template (chờ approve)

- [ ] 4 nguyên thuỷ cơ chế, port đường tap fallback vào `PlacementMechanic`
- [ ] `pnpm --filter @mindkid/game-engine gen:templates` sinh 6 đầu ra ở [`template-authoring-kit.md`](../specs/01-platform/template-authoring-kit.md) §7.2
- [ ] Kiểm lệch file sinh ra — `BR-TAK-03`
- [ ] Bộ test tuân thủ tự nhận template, 9 kiểm ở §7.4
- [ ] Chuyển 6 template hiện có sang hình dạng file mô tả, không đổi `content_contract`
- [ ] Nạp động Session class theo mã — `BR-TAK-08`

## P6 — Tiết học mẫu (chờ approve)

- [ ] Bảng `lesson_runs` · `lesson_run_steps` · `lesson_run_observations`
- [ ] Bề mặt `/lessons/{code}/run`, một bước một lúc
- [ ] 4 route ở [`lesson-session-runner.md`](../specs/04-play/lesson-session-runner.md) §8
- [ ] Cờ `is_exemplar` cùng 3 field kèm theo trên `lessons`
- [ ] Soạn 18 tiết học mẫu lấp đủ ma trận — chặn bởi câu hỏi mở 1 ở [`lesson-exemplar-set.md`](../specs/05-content/lesson-exemplar-set.md) §11
