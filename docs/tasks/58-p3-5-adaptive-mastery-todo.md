# Checklist — Task #58: P3.5 — Mastery và adaptive

> Kế hoạch: [`58-p3-5-adaptive-mastery-plan.md`](58-p3-5-adaptive-mastery-plan.md).
> Chỉ bắt đầu khi P3.4 (`Task #57`) `implemented`.
> Tuyệt đối: không hai nơi ghi mastery, không cột không có công thức, không bản đồ đi xuống,
> không huy hiệu mất đi, không tinh chỉnh tham số bằng cảm giác.
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] P3.4 tick xong; chỗ nối `selectVariant` tồn tại và có test chống nhảy bước.
- [ ] P1.6 bốn điều kiện §7.3 và route `complete` đã chạy.
- [ ] P1.7 `correct_ratio` tính ở server từ event.
- [ ] P0.9 cây skill, DAG prerequisite và `strength` đã seed.
- [ ] **`content_skill_map.weight` có dữ liệu thật khác `1.0`** — toàn `1.0` thì `BR-ADP-04`
      không kiểm chứng được, **DỪNG**.
- [ ] Event đủ để tính tỉ lệ dùng gợi ý; thiếu thì `hint_rate` bị bỏ theo `D-ML`.
- [ ] Đo lại [`adaptive.ts`](../../packages/db/src/schema/adaptive.ts) và
      [`child.ts`](../../packages/db/src/schema/child.ts).
- [ ] Human approve `D-MH` · `D-MI` · `D-MJ` · `D-MK` · `D-ML` · `D-MM` · `D-MN` · `D-MO` · `D-MP`.
- [ ] `D-MI` chốt rõ phương án (a) bỏ ba cột BKT, hay (b) nâng công thức.
- [ ] Ngưỡng độ trễ cho route `complete` do người sở hữu đặt **trước** Task 4.
- [ ] Nhánh riêng.

---

## Task 1 — Sửa contract trước code

- [ ] Bỏ đường ghi qua job `rollup:session` khỏi
      [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) §3.
- [ ] Ghi rõ chỉ một nơi ghi `mastery_state`.
- [ ] `MasteryState` §7.1 khớp đúng cột sẽ có.
- [ ] `params_version` vào §7.1 và spec schema.
- [ ] Tên `attempts_total` và `last_seen_at` thống nhất giữa spec và cột.
- [ ] Ba cột BKT thừa: bỏ, hoặc có luật cập nhật — theo `D-MI`.
- [ ] `attempts_recent` và `hint_rate` có công thức, hoặc bị bỏ (`D-ML`).
- [ ] Mốc cao nhất cho bản đồ vào spec sở hữu schema (`D-MJ`).
- [ ] Bảng huy hiệu và danh sách mã đóng vào spec sở hữu schema (`D-MK`).
- [ ] §7.3 thêm nhánh "dưới 3 lần".
- [ ] Ngưỡng ZPD và ngưỡng nhãn có tên hằng số riêng.
- [ ] Viết rõ "lên một bậc **độ khó** trong cùng bước".
- [ ] Ranh giới `step = null` ghi vào phần ranh giới adaptive với curriculum (`D-MM`).
- [ ] Bỏ trích dẫn `child_session_summaries.skill_ids` (`D-MO`).
- [ ] Câu hỏi mở số 1 của [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) đóng
      theo `D-MP`.
- [ ] Câu hỏi mở số 2 của
      [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) đóng: 1–2 vùng cho
      trẻ, 6 vùng cho báo cáo người lớn.
- [ ] Không thêm spec mới; không thêm mã lỗi ngoài registry.
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [ ] T1 xanh; human đã đọc diff.
- [ ] `content_skill_map.weight` đã kiểm.
- [ ] Không migration hay code adaptive nào viết trước checkpoint này.

---

## Task 2 — Migration mastery, mốc cao nhất và huy hiệu

- [ ] **Test âm trước:** ghi `mastery_state` thiếu `params_version` là **ĐỎ**.
- [ ] **Test âm trước:** `UPDATE` hoặc `DELETE` trên bảng huy hiệu là **ĐỎ**.
- [ ] `params_version` `NOT NULL`.
- [ ] Tên cột khớp tên spec sau `D-MI`.
- [ ] Ba cột BKT thừa bị bỏ, hoặc có luật cập nhật.
- [ ] Cột hoặc bảng mốc cao nhất chỉ tăng; ràng buộc ép ở tầng DB.
- [ ] `child_badges` unique `(child_profile_id, badge_code)`.
- [ ] `child_badges` INSERT-only, không `expires_at`.
- [ ] Mã huy hiệu là danh sách đóng đã đăng ký.
- [ ] `pnpm db:migrate` trên DB rỗng xanh.
- [ ] Ca lỗi rollback cả transaction.

## Task 3 — `packages/adaptive` thuần

- [ ] `bkt.ts` · `zpd-selector.ts` · `level-params.ts` · `masteryLabel`.
- [ ] `BR-ADP-01`: quét import — không `drizzle-orm`, không `packages/db`.
- [ ] `BR-ADP-02`: quét source — không `new Date()`, không `Date.now()`.
- [ ] `BR-ADP-03`: property test `fast-check` 1000 chuỗi, `p_learn` luôn trong `[0,1]`.
- [ ] `BR-ADP-04`: `weight` 0.3 tăng ít hơn rõ rệt so với `weight` 1.0.
- [ ] Bốn nhánh ZPD có ca kiểm.
- [ ] Nhánh "dưới 3 lần" có ca kiểm.
- [ ] `revision_mode` bật khi quá 7 ngày, dùng `now` truyền vào.
- [ ] Ánh xạ nhãn §7.4 là **một** hàm.
- [ ] Không nhãn nào chứa từ chậm, kém, có vấn đề, IQ, rối loạn.
- [ ] Chuyển `numeric` sang `number` tường minh, có test biên.
- [ ] `pnpm test -- adaptive-engine` xanh.

## Checkpoint B — State và package thuần

- [ ] Migration mastery/badge + adaptive property tests cùng xanh.
- [ ] Package không DB/clock; full gate hiện tại xanh.

## Task 4 — Đường ghi trong transaction `complete`

- [ ] Ghi `mastery_state` trong cùng transaction đóng phiên.
- [ ] Không job nào ghi `mastery_state`.
- [ ] Bốn điều kiện §7.3 kiểm một lần, một chỗ.
- [ ] `BR-ADP-06` · `BR-PRG-01`: phiên guest không đổi hàng nào.
- [ ] Phiên preview của Manager không đổi hàng nào.
- [ ] `BR-ADP-07` · `BR-PRG-06`: client gửi `p_learn` thì bị bỏ qua, server tính lại.
- [ ] Phiên `abandoned` cập nhật theo round đã xong, `attempts_total` tăng.
- [ ] Level không gắn skill: không ghi, log cảnh báo, không lỗi cho người dùng.
- [ ] Gọi `complete` hai lần: lần hai 409, không cập nhật mastery lần hai.
- [ ] Tầng API map **từng field**; không `set(u)` nguyên khối.
- [ ] Độ trễ thêm đo được và dưới ngưỡng đã đặt.
- [ ] `pnpm test -- mastery-write` xanh.

## Task 5 — Chọn biến thể trong bước

- [ ] `selectVariant` của `D-MF` thay bằng bản thật; chữ ký không đổi.
- [ ] **Trả nợ Task #57:** `p_learn ≥ 0.9` mọi skill tuần 3 vẫn trả item tuần 3.
- [ ] Không trỏ tuần 4 trong ca đó.
- [ ] `BR-ADP-09`: chỉ đổi biến thể và `difficulty_params`.
- [ ] Không đổi `(week_no, session_no, position)`.
- [ ] `D-MM`: `step = null` trả `null`.
- [ ] `computeAdaptiveParams` ghi `level_params`; hai biểu diễn hợp nhất hoặc mỗi cái có chủ rõ.
- [ ] `next_suggestion` tính trên trạng thái **sau** cập nhật.
- [ ] `pnpm test -- zpd-selector curriculum-adaptive` xanh.

## Checkpoint C — Đường ghi và seam curriculum

- [ ] Transaction idempotent, guest/preview âm và latency xanh.
- [ ] Adaptive không đổi bước; human review transaction/selector.

## Task 6 — Bản đồ trẻ và huy hiệu

- [ ] `/play/map` đọc mốc cao nhất, không đọc `p_learn` hiện tại.
- [ ] Property test: chuỗi `p_learn` giảm không làm chặng nào xuống hạng.
- [ ] `BR-PRG-02`: response không chứa `p_learn`, phần trăm hay điểm; test quét response.
- [ ] Ba trạng thái chặng đúng §7.1.
- [ ] Chặng chưa chạm không dùng khoá đáng sợ.
- [ ] Huy hiệu trao đúng ba điều kiện §7.2.
- [ ] "5 ngày khác nhau" **không** yêu cầu liên tiếp.
- [ ] `BR-PRG-04`: nghỉ 60 ngày, huy hiệu còn nguyên.
- [ ] `BR-PRG-07`: quét hai bề mặt, không chuỗi ngày nào mất khi nghỉ.
- [ ] `BR-PRG-05`: tài khoản 3 trẻ, không bề mặt nào so sánh.
- [ ] Bề mặt trẻ hiện 1–2 vùng đang học; 6 vùng chỉ ở báo cáo người lớn.
- [ ] Không giả định trẻ biết đọc.
- [ ] Đạt [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] `pnpm test:e2e -- play-map` xanh.

## Task 7 — Nhãn thành thạo cho người lớn

- [ ] `requireUserAuth()` + ownership.
- [ ] 403 `ENTITLEMENT_REQUIRED` khi thiếu `view_basic_report`.
- [ ] `BR-PRG-08`: render toàn bộ nhãn có thể có, mọi nhãn thuộc bảng §7.4.
- [ ] "Skill đã tiếp xúc" lấy theo `D-MO`, không đọc cột không tồn tại.
- [ ] "Skill cần củng cố": `p_learn < 0.4` và `attempts_total ≥ 3`.
- [ ] "Skill sẵn sàng học tiếp": `p_learn ≥ 0.8` và có skill kế trong DAG.
- [ ] Dưới 3 lần chơi hiện `Chưa có đủ dữ liệu`.
- [ ] Danh sách từ cấm mang nghĩa chẩn đoán kiểm bằng test.
- [ ] `pnpm test -- child-progress-report` xanh.

## Checkpoint D — Hai bề mặt tiến độ

- [ ] Child map/badges và adult labels giữ DTO/rule đúng.
- [ ] A11y/language/ownership/entitlement gates xanh.

## Task 8 — Replay và cổng trôi tham số

- [ ] `replay-adaptive.ts` chạy trên dữ liệu thật hoặc mẫu đã ghim.
- [ ] **Ca âm:** bộ tham số cố ý lệch làm replay **ĐỎ** và in mức lệch.
- [ ] Đổi `α`, `β` hoặc ngưỡng ZPD mà không tăng `params_version` làm cổng **ĐỎ**.
- [ ] Báo cáo cảnh báo khi trộn dữ liệu hai `params_version`.
- [ ] Chủ sở hữu và lịch chạy ghi rõ trong spec.
- [ ] Chạy thử replay một lần và lưu kết quả làm evidence.
- [ ] `pnpm test -- adaptive-replay` xanh.

## Checkpoint E — Độ ổn định thuật toán

- [ ] Replay âm + `params_version` gate + owner/lịch chạy có evidence.
- [ ] Full gate và human review evidence xanh.

## Task 9 — Evidence và promote P3.5

- [ ] Mỗi `BR-ADP-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Mỗi `BR-PRG-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Nợ ca kiểm của Task #57 đã trả và tick ở đúng chỗ.
- [ ] [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) → `implemented`.
- [ ] [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) → `implemented`.
- [ ] Tick **P3.5** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

## Cổng dừng cuối

- [ ] `pnpm check` xanh.
- [ ] `pnpm test` xanh.
- [ ] `pnpm test:e2e` xanh.
- [ ] `pnpm lint:specs` xanh.
- [ ] `pnpm check:progress` xanh.
- [ ] Human review diff migration, package thuần, đường ghi và bề mặt trẻ.
- [ ] Không phạm vi P3.6 lọt vào: không gợi ý nội dung ngoài curriculum.
- [ ] Không xếp hạng, không so sánh giữa trẻ, không streak.
- [ ] Không auto-merge, không migration ngoài local.
