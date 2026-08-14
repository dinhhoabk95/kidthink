# Checklist — Task #59: P3.6 — Gợi ý nội dung kế tiếp

> Kế hoạch: [`59-p3-6-next-game-recommendation-plan.md`](59-p3-6-next-game-recommendation-plan.md).
> Chỉ bắt đầu khi P3.4 (`Task #57`) và P3.5 (`Task #58`) `implemented`.
> Tuyệt đối: không trả danh sách rỗng, không ML, không gợi ý theo hành vi cá nhân của trẻ khác,
> không `Math.random()` trong hàm xếp hạng.
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] P3.4 và P3.5 tick xong.
- [ ] `mastery_state` có dữ liệu thật; ngưỡng ZPD đã chốt.
- [ ] Player trả được cờ `week_blocked_by_tier`.
- [ ] [`access-gating.md`](../specs/04-play/access-gating.md) kiểm được **theo lô**.
- [ ] P0.9 DAG skill và `strength` đã seed.
- [ ] **`level_daily_stats.plays_count` có dữ liệu thật** — toàn 0 thì bậc `popular` không kiểm
      được, **DỪNG**.
- [ ] [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) phân giải được
      `thumbnail_emoji`.
- [ ] Allow-list `free` cho nhánh guest đã có.
- [ ] Ngưỡng thời gian phản hồi bề mặt trẻ do người sở hữu đặt **trước** Task 5.
- [ ] Human approve `D-MQ` · `D-MR` · `D-MS` · `D-MT` · `D-MU` · `D-MV` · `D-MW` · `D-MX`.
- [ ] `D-MT` và `D-MW` duyệt **riêng** — đổi hành vi người dùng.
- [ ] Nhánh riêng.

---

## Task 1 — Sửa contract trước code

- [ ] Thang §4 viết lại theo `D-MQ`: bậc 5 `explore` → bậc 6 `popular` → **bậc 7 `revision`**.
- [ ] Alt flow "hết nội dung phù hợp" khớp thang mới.
- [ ] Bậc 4 và bậc 7 phân biệt rõ điều kiện dù dùng chung `reason_code`.
- [ ] Cửa sổ 7 ngày của bậc 2 ghi rõ; dùng chung hằng số với `revision_mode` của
      [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) §7.3.
- [ ] Alt flow "mọi ứng viên đều khoá" sửa theo `D-MT`.
- [ ] `BR-REC-07` ghi rõ ca nới duy nhất.
- [ ] Ca kiểm `BR-REC-06` viết lại theo `D-MU`: quét theo cột nối, không theo tên bảng.
- [ ] `seed` vào contract hàm xếp hạng.
- [ ] Câu hỏi mở số 2 đóng theo `D-MV`.
- [ ] Câu hỏi mở số 1 đóng: giữ cửa sổ ba level, kèm điều kiện mở lại đo được.
- [ ] Nguồn tuổi cho route guest chốt theo `D-MW`.
- [ ] `BR-REC-08` bỏ tiền tố `P1`.
- [ ] Không thêm spec mới.
- [ ] Không thêm `reason_code` ngoài sáu code đã khai.
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [ ] T1 xanh; human đã đọc diff.
- [ ] `level_daily_stats.plays_count` đã kiểm.
- [ ] Không route hay UI nào viết trước checkpoint này.

---

## Task 2 — Khung thang bậc và gating theo lô

- [ ] Mỗi bậc là một `RecommendationTier` độc lập, test được riêng.
- [ ] Bậc trả rỗng là hợp lệ, không phải lỗi.
- [ ] Gating chạy **theo lô** trên ứng viên của từng bậc.
- [ ] Test đếm truy vấn chứng minh không phải một truy vấn mỗi ứng viên.
- [ ] `BR-REC-03`: ba level gần nhất bị loại ở **mọi** bậc.
- [ ] `BR-REC-04`: lọc band tuổi áp ở mọi bậc của route người dùng.
- [ ] Thang dừng ngay khi đủ `limit`.
- [ ] Hàm thang thuần; không `new Date()`, không `Math.random()`.
- [ ] `pnpm test -- recommendation-tiers` xanh.

## Task 3 — Sáu bậc sinh ứng viên

- [ ] Bậc 1 lấy bước kế tiếp từ player.
- [ ] Bậc 1 trả **rỗng** khi `week_blocked_by_tier` (`D-MS`).
- [ ] `BR-REC-02`: có curriculum thì primary luôn là bậc 1, kể cả khi mọi `p_learn ≥ 0.9`.
- [ ] Bậc 2: chạm **trong** 7 ngày và `p_learn < 0.4`.
- [ ] Bậc 4: chạm **quá** 7 ngày.
- [ ] Hai bậc không chồng, không hở.
- [ ] Bậc 3 đi DAG prerequisite đúng một bước, có trần độ sâu.
- [ ] Bậc 5 và bậc 6 lọc "chưa chơi".
- [ ] Bậc 7 **không** lọc "chưa chơi".
- [ ] Dưới 3 lần chơi thì nhảy thẳng tới bậc 5.
- [ ] Mỗi bậc gắn đúng `reason_code`; không code nào ngoài bảng §7.2.
- [ ] Mỗi bậc có ca dương và ca rỗng.
- [ ] `pnpm test -- recommendation-ladder` xanh.

## Checkpoint B — Thang ứng viên

- [ ] Tier framework + sáu nguồn + batch gating cùng xanh.
- [ ] Mỗi bậc có ca dương/rỗng; curriculum ưu tiên; không N+1.

## Task 4 — Xếp hạng có hạt giống và ca biên

- [ ] Hàm xếp hạng nhận `seed`.
- [ ] Cùng `seed` cho cùng thứ tự; khác `seed` cho thứ tự khác.
- [ ] Production dùng hạt giống theo trẻ và theo ngày; thứ tự ổn định trong ngày.
- [ ] `popular` chỉ đọc `level_daily_stats`.
- [ ] Test quét chứng minh không nối `play_sessions` hay `telemetry_events` theo trẻ khác.
- [ ] **Ca hết nội dung:** đã chơi hết nội dung hợp tuổi vẫn nhận primary `revision`.
- [ ] **Ca mọi thứ đều khoá:** trả đúng một item khoá, không item mở.
- [ ] Không ca nào trả quá một item khoá.
- [ ] Không ca nào trả danh sách rỗng.
- [ ] `pnpm test -- recommendation-ranking` xanh.

## Task 5 — Route người dùng

- [ ] `requireUserAuth()` + `assertActiveChild()`.
- [ ] Thiếu trẻ đang chọn → 428 `NO_ACTIVE_CHILD`.
- [ ] `limit` có trần; vượt trần bị ép, không lỗi.
- [ ] Response đúng §7.1: `primary` + tối đa 4 `alternatives`.
- [ ] `BR-REC-05`: mỗi item có `reason_code` và `reason` không rỗng.
- [ ] `thumbnail_emoji` phân giải qua registry; emoji thiếu không hỏng cả response.
- [ ] Response **không** chứa `p_learn` hay con số mastery nào.
- [ ] Thời gian phản hồi dưới ngưỡng đã đặt, đo với catalog đầy đủ.
- [ ] `pnpm test -- recommendation-api` xanh.

## Checkpoint C — Xếp hạng và route người dùng

- [ ] Ranking deterministic + ca biên + user route cùng xanh.
- [ ] Không mastery thô; latency/query budget và human review xanh.

## Task 6 — Route guest

- [ ] Chỉ trả nội dung trong allow-list `free`.
- [ ] **Test âm:** một level `standard` không lọt vào response guest.
- [ ] Nguồn tuổi đúng `D-MW`; tham số sai hoặc thiếu không gây 500.
- [ ] Không đọc và không ghi mastery cho guest.
- [ ] Chỉ dùng `explore` và `popular`.
- [ ] Không đặt cookie định danh mới ngoài thứ đã có ở P0.
- [ ] `pnpm test -- recommendation-guest` xanh.

## Task 7 — Bề mặt trẻ và lý do cho người lớn

- [ ] Màn tổng kết phiên hiện đúng một gợi ý chính.
- [ ] Sảnh trẻ hiện 3–5 gợi ý.
- [ ] Item khoá hiện ổ khoá trung tính; không giá, không nút mua.
- [ ] Lời mời nâng cấp nằm sau cổng người lớn.
- [ ] Người lớn thấy `reason` trong báo cáo.
- [ ] Nội dung lý do không mang nghĩa chẩn đoán.
- [ ] Không so sánh với trẻ khác ở bất kỳ bề mặt nào.
- [ ] Bề mặt trẻ không giả định trẻ biết đọc.
- [ ] Đạt [`accessibility.md`](../specs/08-quality/accessibility.md).
- [ ] `pnpm test:e2e -- recommendations` xanh.

## Checkpoint D — Hai bề mặt recommendation

- [ ] Guest/user sources đúng; child/adult UI giữ ranh giới.
- [ ] Accessibility/language/full gate và human review xanh.

## Task 8 — Evidence và promote P3.6

- [ ] Mỗi `BR-REC-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [ ] Bảy bậc đều có ca dương và ca rỗng.
- [ ] Hai ca biên của Task 4 xanh.
- [ ] [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) →
      `implemented`.
- [ ] Tick **P3.6** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

## Cổng dừng cuối

- [ ] `pnpm check` xanh.
- [ ] `pnpm test` xanh.
- [ ] `pnpm test:e2e` xanh.
- [ ] `pnpm lint:specs` xanh.
- [ ] `pnpm check:progress` xanh.
- [ ] Human review diff thang bậc, hàm xếp hạng và bề mặt trẻ.
- [ ] Không ML, không embedding, không học xếp hạng.
- [ ] Không phạm vi P3.7 lọt vào: không báo cáo phân tích lý do theo thời gian.
- [ ] Không auto-merge, không migration ngoài local.
