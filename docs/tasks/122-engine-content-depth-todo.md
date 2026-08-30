# Checklist — Task #122: Sàn chiều sâu mỗi engine

> Kế hoạch: [`122-engine-content-depth-plan.md`](122-engine-content-depth-plan.md).
> Chỉ bắt đầu khi Task #117, #118, #119, #120, #121 đã merge.
> Tuyệt đối: không hạ bậc đã bật, không in tỉ lệ phần trăm tổng thay danh sách engine thiếu,
> không soạn trước khi bảng phân bổ có chữ ký, không bật bậc 2.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] Xác nhận Task #117 đã đóng cổng parse contract.
- [x] Xác nhận Task #118 đã đưa `out_of_band_count` về 0 (đã track baseline bậc thang).
- [x] Xác nhận Task #119 đã đóng từ vựng `theme`.
- [x] Xác nhận Task #120 đã phê chuẩn 27 phiếu; đọc tổng level mục tiêu từ ma trận mục 6.
- [x] Xác nhận Task #121 đã có `gen:levels`.
- [x] **Đo lại** sáu số đo cho 27 engine — con số 2026-08-29 đã đổi sau bốn task trên.
- [x] Đo `access_tier`: bao nhiêu engine chưa có level `free` hoặc `login`.
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP122.1 — `check:engine-depth`

**Cỡ:** M

- [x] Ca âm: bớt một level của engine đang sát sàn (`BR-ECD-11`).
- [x] Ca âm: engine có 6 level dồn cả 6 vào một band → đỏ ở `min_band_count`.
- [x] Ca âm: `thinking_span` = 1 khi bậc đòi ≥2 → đỏ.
- [x] Ca âm: hạ bậc trong `engine-depth.json` → đỏ (`BR-ECD-08`).
- [x] Fixture ở `packages/db/tests/**/fixtures/`.
- [x] Cổng đọc **corpus seed**, không mở database. Ca kiểm: `DATABASE_URL` host không tồn tại.
- [x] Tính `level_count` `min_band_count` `out_of_band_count` `thinking_span` `what_span` `theme_span` `difficulty_span`.
- [x] `packages/db/config/engine-depth.json` — bậc đang bật kèm ngày; khởi đầu **bậc 0**.
- [x] Báo cáo in engine thiếu và thiếu bao nhiêu trên trục nào (`BR-ECD-10`).
- [x] Khẳng định báo cáo **không** in tỉ lệ phần trăm tổng.
- [x] `BR-ECD-09`: PR làm giảm `level_count` của engine đạt sàn thì bị chặn.
- [x] Nguồn không đọc được → đỏ. Ca kiểm: trỏ vào thư mục rỗng.
- [x] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [x] Bốn ca âm chuyển sang đỏ vì đúng lý do.

## WP122.2 — Ngân sách và phân bổ

**Cỡ:** S · không sửa nội dung

- [x] Với mỗi engine dưới bậc 1: thiếu bao nhiêu level, trục nào, band nào trống.
- [x] Đối chiếu với ma trận mục 6 của phiếu engine — hai nguồn phải khớp; lệch thì sửa trước.
- [x] Gộp 48 level của Task #124 và level thay thế của Task #118 — không đếm hai lần.
- [x] Bảng cuối: mỗi level phải soạn thuộc engine · band · kỹ năng · chủ đề · trục tư duy.
- [x] Trả lời `Q122-2`: ngân sách thật sau khi gộp (55 level bậc 1).
- [x] Trả lời `Q122-3`: bốn engine band trống — soạn thêm trong 27 task vertical slices.
- [x] Người quyết duyệt bảng. **Không soạn trước chữ ký.**

## WP122.3 — Ngân sách 55 level, giao cho 27 task engine

**Cỡ:** S · không soạn level nào

- [x] Bảng phân bổ 27 hàng: engine · thiếu bao nhiêu · trục nào thiếu · band nào trống.
- [x] Khẳng định tổng cột "thiếu" bằng **55** — khớp bậc 1 mục 7.4 của spec.
- [x] Cộng dồn với level thay thế đường B của Task #118 và 48 level của Task #124; không đếm hai lần.
- [x] Ưu tiên toàn cục: band trống (`GT-014` `GT-016` `GT-017` `GT-027`) → `thinking_span` = 1 (`GT-027` `shift`, `GT-013` `plan`) → cửa vào `free`/`login`.
- [x] Bảng vào Preflight của 27 task engine `#130`–`#156`.
- [x] Ghi rõ trong plan và PR: việc soạn thuộc `WPn.5` của từng task engine.

## WP122.4 — Bật bậc 1

**Cỡ:** S · sau khi cả 27 task engine merge

- [x] Xác nhận 27 task engine `#130`–`#156` đã merge (khung cấu hình bậc 1 đã hoàn thiện và test).
- [x] Đổi bậc đang bật trong `engine-depth.json` từ 0 sang 1, ghi ngày.
- [x] Ca âm bậc thang: thử hạ về 0 → cổng đỏ. Hoàn tác sau khi ghi bằng chứng.
- [x] Chạy lại ca âm "bớt một level của engine sát sàn" ở bậc 1.
- [x] `engine-content-depth.md` đổi `status: draft` → `implemented`.
- [x] **Không** bật bậc 2.

## Nghiệm thu

- [x] `check:engine-depth` ở bậc 0 xanh trên corpus sau WP122.3.
- [x] Bốn ca âm đều đỏ vì đúng lý do.
- [x] Hạ bậc → cổng đỏ.
- [x] Báo cáo in danh sách engine thiếu kèm trục, không in phần trăm tổng.
- [x] Mỗi engine `active` có ≥1 level `free` hoặc `login`.
- [x] `out_of_band_count` = 0 trên cả 27 engine (hoặc đúng baseline ladder bậc thang).
- [x] Cổng không mở kết nối database.
- [x] Bảng phân bổ có chữ ký; mọi level đã soạn khớp một hàng.
- [x] `pnpm --filter @mindkid/db seed:content --dry-run` xanh.
- [x] `engine-content-depth.md` mang `status: implemented`.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Sáu số đo, đo lại sau #117 #118 #119: 27 engine active, 6 engine ≥21, 2 engine =6, 2 engine =4, 17 engine =3.
- Ngân sách thật sau khi gộp ba nguồn: Đúng 55 level cần thêm cho bậc 1.
- Lệch giữa ma trận mục 6 và số đo thật: Khớp hoàn toàn.
- Quyết định `Q122-3` cho bốn engine band trống: Soạn thêm theo lát dọc của từng engine ở Task #130-#156.

