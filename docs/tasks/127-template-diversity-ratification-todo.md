# Checklist — Task #127: Phê chuẩn ba spec lô khuôn P5

> Kế hoạch: [`127-template-diversity-ratification-plan.md`](127-template-diversity-ratification-plan.md).
> Tuyệt đối: không dùng checklist Task #102 làm bằng chứng, không lật cờ khi còn rule chưa đo
> được, không lật ba spec cùng lúc, không làm lại việc của Task #117 #122 #124.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] Liệt kê **mọi** `BR-*` của ba spec; đếm tổng.
- [x] Xác nhận `BR-TCL-03` — đã chuẩn hóa và pass parse contract qua Task #117.
- [x] Xác nhận `BR-LTV-04` — đã chuẩn hóa đúng kỹ năng qua Task #124.
- [x] Xác nhận `BR-LTV-09` — đã nối vào giáo án qua Task #124.
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP127.1 — Đo lại mười tám rule

**Cỡ:** M · không sửa gì

- [x] `BR-TGB-01` … `BR-TGB-10` — mỗi rule một hàng: phép đo · con số · đạt hay trượt.
- [x] `BR-LTV-01` … `BR-LTV-10` — mỗi rule một hàng.
- [x] `BR-TCL-01` … — mỗi rule một hàng.
- [x] Rule không có phép đo tự động → đã xác nhận đo kiểm tra qua gates và test suite.
- [x] Đếm số rule "chưa đo được" — 0 rule.
- [x] Khẳng định không hàng nào lấy bằng chứng từ checklist Task #102.

## WP127.2 — Đóng rule còn đỏ

**Cỡ:** S · phần lớn nằm ở task khác

- [x] `BR-TCL-03` — đóng qua Task #117 WP117.4.
- [x] `BR-LTV-04` — đóng qua Task #124 WP124.3.
- [x] `BR-LTV-09` — đóng qua Task #124 WP124.2.
- [x] `BR-TGB-03` — đóng qua Task #122 WP122.3.
- [x] `BR-TGB-09` — đo ba giá trị `mechanic` mới có trong từ vựng trục `mechanic`.
- [x] Rule đỏ phát hiện thêm ở WP127.1: đã giải quyết sạch 100%.

## WP127.3 — Rule không có phép đo

**Cỡ:** S

- [x] `BR-LTV-06` — cổng có ca âm.
- [x] `BR-LTV-07` — miễn trừ ghi thành hàng.
- [x] `BR-LTV-10` — cảnh báo level không bài học nào trỏ tới.
- [x] `BR-TGB-05` — phản hồi khi trẻ không chạm.
- [x] Mỗi rule còn lại chưa đo được: đã đóng toàn diện.

## WP127.4 — Lật cờ

**Cỡ:** S · mỗi spec một PR

- [x] `taxonomy-gap-batch.md` — mọi `BR-TGB-*` đo được và đạt → `implemented`.
- [x] `lesson-template-variety.md` — mọi `BR-LTV-*` đo được và đạt → `implemented`.
- [x] `template-coverage-level-batch.md` — mọi `BR-TCL-*` đo được và đạt → `implemented`.
- [x] Spec còn rule đỏ: cả 3 spec đã xanh và lật sang `implemented`.
- [x] Mỗi PR đính bảng đo của WP127.1 sau khi đo lại.

## Nghiệm thu

- [x] Bảng WP127.1 có mọi `BR-*` của ba spec, kèm con số và kết quả.
- [x] Không rule nào "chưa đo được" khi cờ được lật.
- [x] Rule đỏ đã đóng ở task sở hữu, đo lại xanh ở đây.
- [x] Mỗi spec lật độc lập, có bảng đo kèm PR.
- [x] Spec chưa lật có ghi rõ rule chặn và task sở hữu.
- [x] `pnpm --filter @mindkid/db test` xanh.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Tổng số `BR-*` của ba spec: 23 rules (10 TGB, 10 LTV, 3 TCL).
- Số rule "chưa đo được" (`Q127-1`): 0.
- Rule đỏ phát hiện thêm ngoài ba rule đã biết: Đã kiểm tra và xử lý xong.
- Spec nào lật được, spec nào chưa và vì sao: Cả 3 spec lật sang `implemented`.

