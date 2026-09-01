# Todo — Task #192: Go-live theo chuẩn sư phạm mầm non

> Kế hoạch: [`192-golive-preschool-pedagogy-plan.md`](192-golive-preschool-pedagogy-plan.md).
> Mốc hiện tại: **239 level · 81 tiết · 243 hoạt động · 12/14 chủ đề dùng · 33/230 kỹ năng có giáo án**.
> Đích go-live: **126 tiết · ≥378 hoạt động · 100% level có round set · ≥10 chủ đề** ·
> số level: `CHƯA ĐO`, chờ [`#202`](201-hasty-decision-audit-plan.md).

## Đợt 0 — neo chuẩn

### `#193` Tra và ghi chuẩn GDMN
- [ ] Đọc **văn bản gốc** của Bộ GD&ĐT: Chương trình Giáo dục Mầm non và Bộ chuẩn phát triển trẻ em 5 tuổi
- [ ] Ghi số hiệu, năm ban hành, văn bản sửa đổi — **kèm nguồn**, cấm — NEVER chép từ trí nhớ
- [ ] Xác nhận số chuẩn / số chỉ số của Bộ chuẩn 5 tuổi từ nguồn gốc
- [ ] Viết `docs/taxonomy/moet-alignment.md`
  - [ ] Bảng C1–C6 ↔ 5 lĩnh vực phát triển
  - [ ] Bảng band `5-6` ↔ từng chỉ số Bộ chuẩn 5 tuổi
  - [ ] Bảng 10 chủ đề năm học ↔ `CONTENT_THEMES`
  - [ ] **Mục "Phạm vi không phủ"**: thể chất · tình cảm–kỹ năng xã hội · thẩm mỹ
- [ ] Review sư phạm bởi người, không phải chỉ review kỹ thuật

### `#194` Hai chủ đề còn thiếu
- [ ] `job` — Nghề nghiệp: 10 danh từ + emoji, `age_floor`
- [ ] `homeland` — Quê hương – Đất nước – Bác Hồ: 10 danh từ + emoji
- [ ] Cập nhật `content-theme-registry.md` (`BR-CTR-*`)
- [ ] Cổng chủ đề: sàn theme có mặt trong corpus nâng lên ≥10
- [ ] **Ca âm:** theme khai thiếu danh từ → cổng đỏ

## Đợt 1 — mở khoá ba chốt cổng

### `#195` Ba mục chặn của `check:go-live`
- [ ] `GT-018` thêm ≥1 level `free` hoặc `login`
- [ ] `GT-022` thêm ≥1 level `free` hoặc `login`
- [ ] `GT-027` thêm ≥1 level `free` hoặc `login`
- [ ] 19 kỹ năng nâng lên sàn 2 level:
      `C1.CNT.02` `C1.NREC.01` `C1.PROB.06` `C1.MEAS.07`
      `C2.ORI.03` `C2.ORI.04` `C2.GEO.02` `C2.CON.04` `C2.MAZ.01`
      `C3.SRT.01` `C3.SRT.02` `C3.RULE.02` `C3.MTX.01`
      `C4.DET.03` `C4.SEN.03` `C4.MEM.02`
      `C5.DES.04` `C6.PLN.02` `C6.PLN.03`

> **CHỐT KIỂM 1** — `check:go-live` chỉ còn chặn ở `BR-LCD-01` (81/126 tiết).

## Đợt 2 — bản đồ năm học

### `#196` `docs/taxonomy/lesson-map.md`
- [ ] Dựng lưới 126 ô = 42 tuần × 3 tiết của flow `CUR-J42` — nguồn: `lesson-corpus-depth.md`
- [ ] Mỗi ô: chủ đề · kỹ năng trọng tâm · ba pha hoạt động
- [ ] Gắn 81 tiết hiện có vào ô của chúng
- [ ] Liệt kê 45 ô trống thành danh sách có tên
- [ ] Kiểm phân bố theo **chủ đề và prerequisite** (`BR-LFM-06`), cấm — NEVER theo hạn ngạch band

## Đợt 3 — 45 tiết còn thiếu

### `#197` Viết cứng 45 giáo án
- [ ] Ưu tiên chủ đề `festival` (Tết) — hiện **0 level, 0 tiết**
- [ ] Ưu tiên hai chủ đề mới `job` · `homeland`
- [ ] Ưu tiên `weather` — theme đã có nhưng chưa dùng
- [ ] Mỗi tiết: `preparation` · `steps[]` có `say_to_child` · `materials` · `estimated_minutes` · `easier` · `harder`
- [ ] **Cấm — NEVER phân vùng theo band.** Tuổi là nhãn đề xuất (`BR-LFM-03`); thư viện dùng chung (`BR-LFM-01`). Lấp theo chỗ `CUR-J42` cần, không theo hạn ngạch tuổi

> **CHỐT KIỂM 2** — trục giáo án của `check:go-live` PASS · 126 tiết published.

## Đợt 4 — chiều sâu hoạt động

### `#198` 243 → ≥378 hoạt động
- [ ] Mọi tiết ≥3 hoạt động
- [ ] Mọi tiết đủ **ba pha**: gây hứng thú → trọng tâm → luyện tập/củng cố
- [ ] Mọi tiết ≥2 kiểu hoạt động khác nhau
- [ ] Mọi tiết ≥1 `digital_game`
- [ ] Cổng mới `check:lesson-shape`
- [ ] **Ca âm 1:** tiết chỉ có `digital_game` → đỏ
- [ ] **Ca âm 2:** tiết thiếu pha củng cố → đỏ

## Đợt 5 — chiều sâu level

### `#199a` Lấp round set — sửa seed, không soạn mới
- [ ] Đo lại: hiện **0/239** level có round set
- [ ] Mọi level published có round set, số vòng trong trần band 6·8·10 (`BR-RSM-03`)
- [ ] `BR-RSM-10` payload cả set ≤200 KB · `BR-RSM-12` ≤5 phút một set

### `#199b` Thêm level — số lượng theo `#202`, seeder viết cứng
- [ ] Mỗi kỹ năng thư viện giáo án dùng: sàn theo phép tính của `#202`
- [ ] Mỗi engine: ≥6 level — `engine-depth` bậc 1
- [ ] ≥10 chủ đề có mặt trong corpus
- [ ] `theme-caps.json` không vỡ ở mốc ~700
- [ ] Mỗi kỹ năng trải ≥2 khuôn
- [ ] **Nâng `min_levels_per_skill` lên con số của `#202` ở CUỐI đợt**, sau khi level đã đủ

## Đợt 6 — đối chiếu Bộ chuẩn 5 tuổi

### `#200` Band `5-6`
- [ ] Mỗi chỉ số app phủ được: ≥1 tiết và ≥2 level
- [ ] Chỉ số không phủ được: ghi tường minh vào `moet-alignment.md`, cấm — NEVER bỏ trống im lặng
- [ ] Hoạt động `assessment` cho các chỉ số đo được trong app

> **CHỐT KIỂM GO-LIVE** — `check:go-live` xanh toàn phần · 126 tiết · ≥378 hoạt động ·
> ~700 level · ≥10 chủ đề · `engine-depth` bậc 1 · `moet-alignment.md` đã review sư phạm.

## Ghi chú phạm vi
- [ ] `#191` (3.290 level) chuyển thành **trần dài hạn**, cấm — NEVER dùng làm điều kiện phát hành
- [ ] Mọi PR nội dung hướng tới go-live gắn `#192`, không gắn `#191`
