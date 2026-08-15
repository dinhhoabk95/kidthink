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

- [x] P3.4 và P3.5 tick xong.
- [x] `mastery_state` có dữ liệu thật; ngưỡng ZPD đã chốt.
- [x] Player trả được cờ `week_blocked_by_tier`.
- [x] [`access-gating.md`](../specs/04-play/access-gating.md) kiểm được **theo lô**.
- [x] P0.9 DAG skill và `strength` đã seed.
- [x] **`level_daily_stats.plays_count` có dữ liệu thật** — toàn 0 thì bậc `popular` không kiểm
      được, **DỪNG**.
- [x] [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) phân giải được
      `thumbnail_emoji`.
- [x] Allow-list `free` cho nhánh guest đã có.
- [x] Ngưỡng thời gian phản hồi bề mặt trẻ do người sở hữu đặt **trước** Task 5.
- [x] Human approve `D-MQ` · `D-MR` · `D-MS` · `D-MT` · `D-MU` · `D-MV` · `D-MW` · `D-MX`.
- [x] `D-MT` và `D-MW` duyệt **riêng** — đổi hành vi người dùng.
- [x] Nhánh riêng.

---

## Task 1 — Sửa contract trước code

- [x] Thang §4 viết lại theo `D-MQ`: bậc 5 `explore` → bậc 6 `popular` → **bậc 7 `revision`**.
- [x] Alt flow "hết nội dung phù hợp" khớp thang mới.
- [x] Bậc 4 và bậc 7 phân biệt rõ điều kiện dù dùng chung `reason_code`.
- [x] Cửa sổ 7 ngày của bậc 2 ghi rõ; dùng chung hằng số với `revision_mode` của
      [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) §7.3.
- [x] Alt flow "mọi ứng viên đều khoá" sửa theo `D-MT`.
- [x] `BR-REC-07` ghi rõ ca nới duy nhất.
- [x] Ca kiểm `BR-REC-06` viết lại theo `D-MU`: quét theo cột nối, không theo tên bảng.
- [x] `seed` vào contract hàm xếp hạng.
- [x] Câu hỏi mở số 2 đóng theo `D-MV`.
- [x] Câu hỏi mở số 1 đóng: giữ cửa sổ ba level, kèm điều kiện mở lại đo được.
- [x] Nguồn tuổi cho route guest chốt theo `D-MW`.
- [x] `BR-REC-08` bỏ tiền tố `P1`.
- [x] Không thêm spec mới.
- [x] Không thêm `reason_code` ngoài sáu code đã khai.
- [x] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [x] T1 xanh; human đã đọc diff.
- [x] `level_daily_stats.plays_count` đã kiểm.
- [x] Không route hay UI nào viết trước checkpoint này.

---

## Task 2 — Khung thang bậc và gating theo lô

- [x] Mỗi bậc là một `RecommendationTier` độc lập, test được riêng.
- [x] Bậc trả rỗng là hợp lệ, không phải lỗi.
- [x] Gating chạy **theo lô** trên ứng viên của từng bậc.
- [x] Test đếm truy vấn chứng minh không phải một truy vấn mỗi ứng viên.
- [x] `BR-REC-03`: ba level gần nhất bị loại ở **mọi** bậc.
- [x] `BR-REC-04`: lọc band tuổi áp ở mọi bậc của route người dùng.
- [x] Thang dừng ngay khi đủ `limit`.
- [x] Hàm thang thuần; không `new Date()`, không `Math.random()`.
- [x] `pnpm test -- recommendation-tiers` xanh.

## Task 3 — Sáu bậc sinh ứng viên

- [x] Bậc 1 lấy bước kế tiếp từ player.
- [x] Bậc 1 trả **rỗng** khi `week_blocked_by_tier` (`D-MS`).
- [x] `BR-REC-02`: có curriculum thì primary luôn là bậc 1, kể cả khi mọi `p_learn ≥ 0.9`.
- [x] Bậc 2: chạm **trong** 7 ngày và `p_learn < 0.4`.
- [x] Bậc 4: chạm **quá** 7 ngày.
- [x] Hai bậc không chồng, không hở.
- [x] Bậc 3 đi DAG prerequisite đúng một bước, có trần độ sâu.
- [x] Bậc 5 và bậc 6 lọc "chưa chơi".
- [x] Bậc 7 **không** lọc "chưa chơi".
- [x] Dưới 3 lần chơi thì nhảy thẳng tới bậc 5.
- [x] Mỗi bậc gắn đúng `reason_code`; không code nào ngoài bảng §7.2.
- [x] Mỗi bậc có ca dương và ca rỗng.
- [x] `pnpm test -- recommendation-ladder` xanh.

## Checkpoint B — Thang ứng viên

- [x] Tier framework + sáu nguồn + batch gating cùng xanh.
- [x] Mỗi bậc có ca dương/rỗng; curriculum ưu tiên; không N+1.

## Task 4 — Xếp hạng có hạt giống và ca biên

- [x] Hàm xếp hạng nhận `seed`.
- [x] Cùng `seed` cho cùng thứ tự; khác `seed` cho thứ tự khác.
- [x] Production dùng hạt giống theo trẻ và theo ngày; thứ tự ổn định trong ngày.
- [x] `popular` chỉ đọc `level_daily_stats`.
- [x] Test quét chứng minh không nối `play_sessions` hay `telemetry_events` theo trẻ khác.
- [x] **Ca hết nội dung:** đã chơi hết nội dung hợp tuổi vẫn nhận primary `revision`.
- [x] **Ca mọi thứ đều khoá:** trả đúng một item khoá, không item mở.
- [x] Không ca nào trả quá một item khoá.
- [x] Không ca nào trả danh sách rỗng.
- [x] `pnpm test -- recommendation-ranking` xanh.

## Task 5 — Route người dùng

- [x] `requireUserAuth()` + `assertActiveChild()`.
- [x] Thiếu trẻ đang chọn → 428 `NO_ACTIVE_CHILD`.
- [x] `limit` có trần; vượt trần bị ép, không lỗi.
- [x] Response đúng §7.1: `primary` + tối đa 4 `alternatives`.
- [x] `BR-REC-05`: mỗi item có `reason_code` và `reason` không rỗng.
- [x] `thumbnail_emoji` phân giải qua registry; emoji thiếu không hỏng cả response.
- [x] Response **không** chứa `p_learn` hay con số mastery nào.
- [x] Thời gian phản hồi dưới ngưỡng đã đặt, đo với catalog đầy đủ.
- [x] `pnpm test -- recommendation-api` xanh.

## Checkpoint C — Xếp hạng và route người dùng

- [x] Ranking deterministic + ca biên + user route cùng xanh.
- [x] Không mastery thô; latency/query budget và human review xanh.

## Task 6 — Route guest

- [x] Chỉ trả nội dung trong allow-list `free`.
- [x] **Test âm:** một level `standard` không lọt vào response guest.
- [x] Nguồn tuổi đúng `D-MW`; tham số sai hoặc thiếu không gây 500.
- [x] Không đọc và không ghi mastery cho guest.
- [x] Chỉ dùng `explore` và `popular`.
- [x] Không đặt cookie định danh mới ngoài thứ đã có ở P0.
- [x] `pnpm test -- recommendation-guest` xanh.

## Task 7 — Bề mặt trẻ và lý do cho người lớn

- [x] Màn tổng kết phiên hiện đúng một gợi ý chính.
- [x] Sảnh trẻ hiện 3–5 gợi ý.
- [x] Item khoá hiện ổ khoá trung tính; không giá, không nút mua.
- [x] Lời mời nâng cấp nằm sau cổng người lớn.
- [x] Người lớn thấy `reason` trong báo cáo.
- [x] Nội dung lý do không mang nghĩa chẩn đoán.
- [x] Không so sánh với trẻ khác ở bất kỳ bề mặt nào.
- [x] Bề mặt trẻ không giả định trẻ biết đọc.
- [x] Đạt [`accessibility.md`](../specs/08-quality/accessibility.md).
- [x] `pnpm test:e2e -- recommendations` xanh.

## Checkpoint D — Hai bề mặt recommendation

- [x] Guest/user sources đúng; child/adult UI giữ ranh giới.
- [x] Accessibility/language/full gate và human review xanh.

## Task 8 — Evidence và promote P3.6

- [x] Mỗi `BR-REC-*` có ít nhất một test tham chiếu bằng mã rule trong tên test.
- [x] Bảy bậc đều có ca dương và ca rỗng.
- [x] Hai ca biên của Task 4 xanh.
- [x] [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) →
      `implemented`.
- [x] Tick **P3.6** trong Task #14 chỉ khi `pnpm check:progress` tự xanh.

## Cổng dừng cuối

- [x] `pnpm check` xanh.
- [x] `pnpm test` xanh.
- [x] `pnpm test:e2e` xanh.
- [x] `pnpm lint:specs` xanh.
- [x] `pnpm check:progress` xanh.
- [x] Human review diff thang bậc, hàm xếp hạng và bề mặt trẻ.
- [x] Không ML, không embedding, không học xếp hạng.
- [x] Không phạm vi P3.7 lọt vào: không báo cáo phân tích lý do theo thời gian.
- [x] Không auto-merge, không migration ngoài local.
