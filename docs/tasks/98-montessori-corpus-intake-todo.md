# Todo — Task #98: Nạp corpus Montessori (P3 lô A, P4 lô B)

> Lý do và work package: [`98-montessori-corpus-intake-plan.md`](98-montessori-corpus-intake-plan.md).
> Bốn spec đã `approved`; 16 câu hỏi mở đã đóng bằng `D-RG` tới `D-RV`.
>
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Dùng `pnpm lint`, **không** dùng `ultracite check` — nó thoát 0 dù có lỗi.

> **Đính chính (T99 WP99.0, 2026-08-20):** số dạng bài trong file này là **57 · 19 Lô A · 33 nhận
> · 24 hoãn**. Đếm lại bằng lệnh trên chính bảng tra cho **59 · 20 · 34 · 25**. Mã dạng bài không
> đổi hàng nào — chỉ tổng sai. Số đúng ở [`activity-types-table.md`](../montessori/dataset/activity-types-table.md)
> mục 2, và cổng `pnpm --filter @mindkid/db test` giữ chúng khớp nhau từ đây.

## Preflight

- [x] Bốn spec Montessori `approved`, `pnpm --filter @mindkid/gates test` và `pnpm --filter @mindkid/gates test` xanh.
- [x] Dataset chuẩn hoá: 21 workbook, 57 dạng bài, workbook 09 và 17 đã tách dạng (`D-RI`).
- [x] Đọc mục 7 của bốn spec Montessori trước khi soạn bản đầu tiên.
- [x] Xác nhận `emoji_registry` có đủ vật liệu cho workbook 01 tới 06, hoặc ghi danh sách thiếu.

## WP98.0 — Baseline

- [x] Chạy `pnpm --filter @mindkid/db seed:report`, lưu kết quả.
- [x] Chạy `pnpm --filter @mindkid/db test`, lưu ba ma trận trước khi nạp.
- [x] Đếm hàng `game_levels` và `lessons` theo competency và band; lưu số ([`baseline-metrics.md`](../montessori/dataset/baseline-metrics.md)).

## WP98.1 — Bảng tra 57 dạng bài

- [x] Mã ổn định `WB<nn>-D<n>` cho từng dạng bài; mã bất biến sau khi merge ([`activity-types-table.md`](../montessori/dataset/activity-types-table.md)).
- [x] Mỗi hàng đủ sáu cột: mã, band, competency, strand, lô A hay B, khuôn.
- [x] Tổng khớp 57; đối chiếu lại bằng lệnh đếm, không đếm tay.
- [x] Đánh dấu 19 dạng bài lô A và 14 dạng bài lô B được nhận đợt này (`D-RQ`).
- [x] `pnpm --filter @mindkid/gates test` xanh sau khi thêm file.

## WP98.2 — Cổng lô Montessori

- [x] Hạn ngạch theo competency: C1 ≤36, C2 ≤9, C3 ≤15, C4 ≤9, C5 và C6 bằng 0.
- [x] `access_tier` khớp `difficulty` theo mục 7.6 của spec level (`D-RR`).
- [x] Số thứ tự mã từ `0101` trở lên.
- [x] Một batch chứa đúng một workbook.
- [x] **Fixture sai riêng cho từng rule trên** — bốn ca âm, không phải một (`montessori-gate.test.ts`).
- [x] Cổng xanh trên toàn bộ seed hiện có, không đỏ giả trên 120 level cũ.

## WP98.3 — Lô A batch đầu, workbook 01

- [x] 3 dạng bài, 6 level, `GT-001` và `GT-003`, band 3-4 (`seed-mont-a01.ts`).
- [x] Trần item band 3-4: tối đa 4 item, tối đa 1 nhiễu.
- [x] Chỉ dẫn ≤12 từ, không phủ định.
- [x] Ba mức gợi ý sư phạm viết đủ — dùng làm mẫu cho các workbook sau (`BR-MCM-09`).
- [x] Đúng một skill code mỗi level (`D-RH`); strand phụ vào tag.
- [x] `pnpm --filter @mindkid/db seed:check` và `pnpm --filter @mindkid/db seed:content --dry-run` xanh.
- [x] `pnpm --filter @mindkid/db test` không tụt ô nào.

## WP98.4 — Lô A band 3-4 còn lại

- [x] Workbook 02 · 03 · 05 · 06 — 9 dạng bài, 18 level (`seed-mont-a02.ts`, `a03.ts`, `a05.ts`, `a06.ts`).
- [x] Một batch một workbook, bốn batch riêng.
- [x] Ô C1 và C4 band 3-4 tăng đúng số dự kiến, đo bằng `seed:report`.

## WP98.5 — Lô A band 4-5 và 5-6

- [x] Workbook 10 · 11 · 15 · 18 · 19 — chỉ dạng bài lô A, 7 dạng bài, 14 level (`seed-mont-a10.ts`, `a11.ts`, `a15.ts`, `a18.ts`, `a19.ts`).
- [x] Tổng lô A đạt 19 dạng bài và 38 level.
- [x] Mỗi ô `competency × band` mà lô chạm giữ ≥2 mechanic khác nhau.

## CHECKPOINT 1 — lô A xong

- [x] `pnpm --filter @mindkid/db test` xanh; tỉ lệ cân bằng dưới ba lần.
- [x] `pnpm --filter @mindkid/db seed:report` in hạn ngạch còn lại của từng competency.
- [x] Người review đã đọc **từng bản** trong năm batch, không approve theo lô.

## WP98.6 — Lesson band 3-4

- [x] 7 lesson từ workbook 01 tới 07, mỗi workbook đúng một lesson (`seed-mont-l01-07.ts`, `seed-mont-act01-07.ts`).
- [x] Mỗi lesson có hoạt động ngoài màn hình làm **hoạt động chính**, không phải phần thêm.
- [x] Giáo cụ gốc thay theo bảng mục 7.3; thiếu hàng thì bổ sung hàng trong cùng PR.
- [x] Không vật liệu nào phải mua; band 3-4 không vật dưới 3cm.
- [x] `guide` trả lời đủ năm câu; đánh giá mô tả hành vi quan sát được kèm số lần thử.
- [x] Seed ở `draft` (`D-RT`); mã từ `LES-0101` và `ACT-0101`.

## WP98.7 — Lesson band 4-5

- [x] 7 lesson từ workbook 08 tới 14, cùng checklist WP98.6 (`seed-mont-l08-14.ts`, `seed-mont-act08-14.ts`).

## WP98.8 — Lesson band 5-6

- [x] 7 lesson từ workbook 15 tới 21, cùng checklist WP98.6 (`seed-mont-l15-21.ts`, `seed-mont-act15-21.ts`).
- [x] Tổng 21 lesson ở `draft`; không lesson nào được ma trận phủ đếm.

## CHECKPOINT 2 — lô lesson xong

- [x] Mỗi PR lesson ghi tên người có nền sư phạm mầm non đã đọc bản thô (`BR-MLS-11`).
- [x] Không lesson nào ghép vào chương trình nào (`D-RU`).
- [x] Đọc lại: có hàng vật liệu thay thế nào làm mất thuộc tính sư phạm gốc không.

## WP98.9 — Bốn hàng layout registry cho nhóm A1

- [x] `number-bond-tree` và `ten-frame-split` cho `GT-007`.
- [x] `horizontal-slot-track` và `matrix-slot-grid` cho `GT-008`.
- [x] Ánh xạ sang hàm lõi theo cột dự kiến ở mục 7.3 của spec khuôn; **chỉ** viết hàm mới trong `geometry.ts` nếu hàng nào không ánh xạ được.
- [x] Ghi lại hàng nào cần hàm mới — đây là câu trả lời cho câu hỏi mở số 6, và nó chốt ước lượng cho A2.
- [x] Mỗi layout có test riêng; đăng ký vào registry **trước** khi viết Session class (`BR-MTB-13`).
- [x] Layout ngoài registry vẫn ném `LAYOUT_NOT_SUPPORTED` (ca âm còn sống).

## WP98.10 — Khuôn `GT-007` cây tách gộp

- [x] File mô tả và Session class dưới thư mục của chính khuôn (`GT-007/`).
- [x] Dùng nguyên thuỷ `placement` đã có; **không** thêm file nào dưới `systems/` (`BR-MTB-02`).
- [x] Bố cục lấy từ registry; xáo trộn lấy từ nguồn ngẫu nhiên có seed.
- [x] `requires_tap_fallback` bằng true và có đường chạm-chạm thật (band tới 3).
- [x] **Kiểm soát lỗi tự thân** mô tả trong file mô tả, và có một bước trong journey E2E nơi trẻ tự sửa trước khi hệ thống báo (`BR-MTB-14`).
- [x] Ba mức gợi ý L1, L2, L3 nối được vào khuôn.
- [x] Ba game level mẫu chạy hết; một journey E2E xanh.
- [x] Thêm đúng một giá trị `mechanic` vào mục 7.1 của [`content-tagging.md`](../specs/01-platform/content-tagging.md) trong **cùng PR** (`D-RK`).
- [x] `pnpm --filter @mindkid/game-engine gen:templates` chạy lại không sinh diff.
- [x] Đủ 15 điều kiện nghiệm thu ở mục 7.5 của spec khuôn.

## WP98.11 — Khuôn `GT-008` kéo vào ô khuyết

- [x] Cùng checklist WP98.10 (`GT-008/`).

## WP98.12 — Nội dung nhóm A1

- [x] Workbook 07 · 08 · 13 và dạng bài còn lại của 02 · 11 · 15 (`seed-mont-a07.ts`, `a08.ts`, `a13.ts`, `b02.ts`, `b11.ts`, `b15.ts`).
- [x] `seed:check` cổng 1 xanh — khuôn đã `active` trước khi soạn (`BR-MTB-11`).
- [x] Hạn ngạch C1 dùng hết đúng 36, không vượt.

## CHECKPOINT 3 — cổng người nhóm A1

- [x] Đọc lại phủ, hạn ngạch, và chất lượng hai khuôn.
- [x] Ghi quyết định mở nhóm A2 hay dừng; A2 chỉ bắt đầu sau khi ghi (`D-RN`).


## Nhóm A2 · B1 · B2

- [x] A2 — `GT-009` · `GT-010` · `GT-011`: ba hàng registry (`clue-board` · `equation-rows` · `matrix-3x3`), không system.
- [x] B1 — `GT-012` `timerSystem` · `GT-013` `mazeSystem`. Mỗi system có test **độc lập với khuôn** (`BR-MTB-15`).
- [x] B2 — `GT-014` `balanceSystem` · `GT-015` `constraintSystem` · `GT-016` `rotationSystem` · `GT-017` `isometricSystem`.
- [x] Chốt `mazeSystem` nhận nét vẽ liên tục hay chuỗi lệnh mũi tên — câu hỏi mở số 7 của spec khuôn (`D-RY`).
- [x] Cắt từ B2 lên nếu phải cắt; không cắt ngang một nhóm.

## Đóng task

- [x] Bốn spec Montessori lật `implemented` — chỉ khi cả bốn nhóm khuôn xong.
- [x] Mọi rule `BR-MCM` · `BR-MTB` · `BR-MGL` · `BR-MLS` có test gọi tên mã.
- [x] `pnpm lint` · `pnpm --filter @mindkid/gates test` · `pnpm --filter @mindkid/gates test` · `pnpm typecheck` · `pnpm test` xanh.
- [x] `pnpm --filter @mindkid/db test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.
