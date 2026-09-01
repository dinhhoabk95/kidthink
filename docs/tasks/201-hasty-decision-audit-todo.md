# Todo — Task #201: Soát quyết định vội

> Kế hoạch: [`201-hasty-decision-audit-plan.md`](201-hasty-decision-audit-plan.md).
> Sổ số tạm: [`provisional-values.md`](provisional-values.md).

## Đã làm 2026-09-01
- [x] Soát ba plan `#190` `#191` `#192`, tìm ra **8** quyết định không có phép đo
- [x] **H1** — tra ra nguồn thật của `126`: `CUR-J42` 42 tuần × 3 tiết, **không** phải `3 × (10×4+2)`
- [x] **H1** — gỡ mô hình `42/42/42` khỏi `#192` và todo; ghi rõ `BR-LFM-01/02/03` và `D-SI` đã bác nó
- [x] **H2** — đo tầng vòng: `game_level_rounds` có bảng + spec + trần `6·8·10`, corpus **0/239**
- [x] **H2** — gỡ đích `~700`; tách đợt 5 thành `#199a` lấp round set và `#199b` thêm level
- [x] **H3 H4 H5** — gắn nhãn `CHƯA ĐO` tại chỗ trong `#192`
- [x] **H6 H7** — 9 phiếu engine: mục 15 mang nhãn + luật **khuôn thắng**
- [x] Lập `provisional-values.md` với đủ 8 hàng

## `#202` Đo tầng vòng, suy đích thật *(chặn việc nội dung của `#192`)*
- [ ] Đo trần thực dụng: trần vòng `6·8·10` vs `BR-RSM-12` (≤5 phút một set) vs `BR-RSM-10` (≤200 KB)
- [ ] Suy số vòng dùng được mỗi band, có phép tính kèm
- [ ] Suy: một tiết cần bao nhiêu level × bao nhiêu vòng để chơi lại một tuần không lặp
- [ ] **Trả về:** đích số level go-live **kèm phép tính**, thay `CHƯA ĐO` ở `#192` §3.2
- [ ] Trả về sàn `min_levels_per_skill` thật, đóng H3

## `#204` Sổ số tạm + cổng
- [ ] Cổng quét `docs/` tìm chuỗi `CHƯA ĐO`, đối chiếu với `provisional-values.md`
- [ ] Hàng quá hạn → cổng đỏ
- [ ] **Ca âm 1:** thêm `CHƯA ĐO` không đăng ký → đỏ
- [ ] **Ca âm 2:** hàng quá hạn → đỏ
- [ ] Đặt ở `packages/db/tests/gates/` theo luật cổng của CLAUDE.md

## `#205` Đóng số tạm của 9 phiếu engine
- [ ] `#181`–`#189` thêm bước: dựng `template.ts` theo nhu cầu thật → **sửa phiếu theo** trong cùng PR
- [ ] Mỗi mã đóng xong thì gỡ hàng H6/H7 tương ứng khỏi sổ
- [ ] Khi cả 9 xong, H6 H7 H8 rỗng

## `#206` Nâng `#193` thành chặn cứng
- [ ] Bảng 10 chủ đề vào phạm vi `#193` (đóng H4)
- [ ] Cấu trúc tiết vào phạm vi `#193` (đóng H5)
- [ ] `#194`–`#200` cấm — NEVER khởi động trước khi `#193` xong
