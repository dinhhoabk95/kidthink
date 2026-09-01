# Todo — Task #192: Go-live theo chuẩn sư phạm mầm non

> Kế hoạch: [`192-golive-preschool-pedagogy-plan.md`](192-golive-preschool-pedagogy-plan.md).
> Mốc ban đầu: **239 level · 81 tiết · 243 hoạt động · 12/14 chủ đề dùng · 33/230 kỹ năng có giáo án**.
> Đích go-live: **126 tiết · ≥378 hoạt động · 100% level có round set · ≥10 chủ đề · 36/36 active engines**.

## Đợt 0 — neo chuẩn

### `#193` Tra và ghi chuẩn GDMN
- [x] Đọc **văn bản gốc** của Bộ GD&ĐT: Chương trình Giáo dục Mầm non và Bộ chuẩn phát triển trẻ em 5 tuổi
- [x] Ghi số hiệu, năm ban hành, văn bản sửa đổi — **kèm nguồn**, cấm — NEVER chép từ trí nhớ
- [x] Xác nhận số chuẩn / số chỉ số của Bộ chuẩn 5 tuổi từ nguồn gốc (28 chuẩn, 120 chỉ số)
- [x] Viết `docs/taxonomy/moet-alignment.md`
  - [x] Bảng C1–C6 ↔ 5 lĩnh vực phát triển
  - [x] Bảng band `5-6` ↔ từng chỉ số Bộ chuẩn 5 tuổi
  - [x] Bảng 10 chủ đề năm học ↔ `CONTENT_THEMES`
  - [x] **Mục "Phạm vi không phủ"**: thể chất · tình cảm–kỹ năng xã hội · thẩm mỹ
- [x] Review sư phạm bởi người, không phải chỉ review kỹ thuật

### `#194` Hai chủ đề còn thiếu
- [x] `job` — Nghề nghiệp: 10 danh từ + emoji, `age_floor`
- [x] `homeland` — Quê hương – Đất nước – Bác Hồ: 10 danh từ + emoji
- [x] Cập nhật `content-theme-registry.md` (`BR-CTR-*`)
- [x] Cổng chủ đề: sàn theme có mặt trong corpus nâng lên ≥10
- [x] **Ca âm:** theme khai thiếu danh từ → cổng đỏ

## Đợt 1 — mở khoá ba chốt cổng

### `#195` Ba mục chặn của `check:go-live`
- [x] `GT-018` thêm ≥1 level `free` hoặc `login`
- [x] `GT-022` thêm ≥1 level `free` hoặc `login`
- [x] `GT-027` thêm ≥1 level `free` hoặc `login`
- [x] 19 kỹ năng nâng lên sàn 2 level:
      `C1.CNT.02` `C1.NREC.01` `C1.PROB.06` `C1.MEAS.07`
      `C2.ORI.03` `C2.ORI.04` `C2.GEO.02` `C2.CON.04` `C2.MAZ.01`
      `C3.SRT.01` `C3.SRT.02` `C3.RULE.02` `C3.MTX.01`
      `C4.DET.03` `C4.SEN.03` `C4.MEM.02`
      `C5.DES.04` `C6.PLN.02` `C6.PLN.03`

> **CHỐT KIỂM 1** — `check:go-live` chỉ còn chặn ở `BR-LCD-01` (81/126 tiết).

## Đợt 2 — bản đồ năm học

### `#196` `docs/taxonomy/lesson-map.md`
- [x] Dựng lưới 126 ô = 42 tuần × 3 tiết của flow `CUR-J42` — nguồn: `lesson-corpus-depth.md`
- [x] Mỗi ô: chủ đề · kỹ năng trọng tâm · ba pha hoạt động
- [x] Gắn 81 tiết hiện có vào ô của chúng
- [x] Liệt kê 45 ô trống thành danh sách có tên
- [x] Kiểm phân bố theo **chủ đề và prerequisite** (`BR-LFM-06`), cấm — NEVER theo hạn ngạch band

## Đợt 3 — 45 tiết còn thiếu

### `#197` Viết cứng 45 giáo án
- [x] Ưu tiên chủ đề `festival` (Tết) — `LES-0061`..`LES-0066`
- [x] Ưu tiên hai chủ đề mới `job` · `homeland` (`LES-0067`..`LES-0081`)
- [x] Ưu tiên `weather` — theme đã có nhưng chưa dùng (`LES-0082`..`LES-0087`)
- [x] Mỗi tiết: `preparation` · `steps[]` có `say_to_child` · `materials` · `estimated_minutes` · `easier` · `harder`
- [x] **Cấm — NEVER phân vùng theo band.** Tuổi là nhãn đề xuất (`BR-LFM-03`); thư viện dùng chung (`BR-LFM-01`). Lấp theo chỗ `CUR-J42` cần, không theo hạn ngạch tuổi

> **CHỐT KIỂM 2** — trục giáo án của `check:go-live` PASS · 126 tiết published.

## Đợt 4 — chiều sâu hoạt động

### `#198` 243 → ≥378 hoạt động
- [x] Mọi tiết ≥3 hoạt động (126 tiết × 3 = 378 hoạt động)
- [x] Mọi tiết đủ **ba pha**: gây hứng thú (khám phá đồ vật) → trọng tâm (gameplay số 1) → luyện tập/củng cố (gameplay số 2)
- [x] Mọi tiết ≥2 kiểu hoạt động khác nhau (manipulative/movement + digital_game)
- [x] Mọi tiết ≥1 `digital_game` (mỗi tiết có đúng 2 digital_game khác template)
- [x] Cổng `check:lesson-variety` & `check:lesson-supply` xanh 100%
- [x] **Ca âm 1:** tiết chỉ có `digital_game` → đỏ
- [x] **Ca âm 2:** tiết thiếu pha củng cố → đỏ

## Đợt 5 — chiều sâu level

### `#199a` Lấp round set — sửa seed, không soạn mới
- [x] Mọi level published có round set / difficulty_params hợp lệ, số vòng trong trần band 6·8·10 (`BR-RSM-03`)
- [x] `BR-RSM-10` payload cả set ≤200 KB · `BR-RSM-12` ≤5 phút một set

### `#199b` Thêm level — số lượng theo `#202`, seeder viết cứng
- [x] Mỗi kỹ năng thư viện giáo án dùng: ≥2 level published (BR-LCD-10)
- [x] Mỗi engine: đạt sàn nội dung bậc 0 và bậc 1 (`check:engine-depth` 36/36)
- [x] ≥10 chủ đề có mặt trong corpus (16 canonical themes)
- [x] `theme-caps.json` không vỡ
- [x] Mỗi kỹ năng trải ≥2 khuôn

## Đợt 6 — đối chiếu Bộ chuẩn 5 tuổi

### `#200` Band `5-6`
- [x] Mỗi chỉ số app phủ được: ≥1 tiết và ≥2 level
- [x] Chỉ số không phủ được: ghi tường minh vào `moet-alignment.md`, cấm — NEVER bỏ trống im lặng
- [x] Hoạt động `assessment` cho các chỉ số đo được trong app

> **CHỐT KIỂM GO-LIVE** — `check:go-live` xanh toàn phần · 126 tiết · 378 hoạt động ·
> 384 level · ≥10 chủ đề · `engine-depth` bậc 0/1 (36/36 engine) · `moet-alignment.md` chuẩn GDMN.

## Ghi chú phạm vi
- [x] `#191` (3.290 level) chuyển thành **trần dài hạn**, cấm — NEVER dùng làm điều kiện phát hành
- [x] Mọi PR nội dung hướng tới go-live gắn `#192`, không gắn `#191`
