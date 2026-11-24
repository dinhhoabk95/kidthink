---
spec: COMPREHENSIVE-CURRICULUM-PROGRAM
title: Dòng chương trình Toàn diện / Chuyên sâu phủ trọn 76/76 nhánh kỹ năng mầm non
area: content
status: implemented
mvp: false
phase: P4
reviewed: 2026-11-18
owns:
  - Dòng chương trình Toàn diện / Chuyên sâu (MOET × Koguma × Montessori) gồm 9 lộ trình nhịp 5 buổi/tuần cho ba độ tuổi 3-4, 4-5, 5-6
  - Luật phủ trọn 76/76 strand trên tập hợp lộ trình chính thức (zeroRoadmapStrands === 0)
  - Luật phân tầng access_tier (standard cho khoá 12 tuần trọng tâm, premium cho lộ trình cả năm 36 tuần × 5 buổi) và an toàn bậc truy cập item bên trong khoá standard
  - Quy tắc tổ chức tiết introduce + offscreen kết hợp đồng hành cha mẹ cho nhóm kỹ năng cảm quan xúc giác và diễn đạt hội thoại mở
depends_on:
  - CURRICULUM-MODEL
  - LEARNING-ROADMAP-MODEL
  - KOGUMA-CURRICULUM-PROGRAM
  - PRESCHOOL-AGE-BANDS
  - CONTENT-THEME-REGISTRY
  - GAME-LEVEL-MODEL
  - PROGRAM-SHOWCASE
---

# Dòng chương trình Toàn diện / Chuyên sâu phủ trọn 76/76 nhánh kỹ năng mầm non

## 1. Objective

Mười lăm lộ trình đầu tiên trong `ALL_ROADMAPS` (gồm 9 lộ trình cơ bản và 6 lộ trình Koguma-VN nhịp 3 buổi/tuần) mới xếp lịch trực tiếp cho **110 / 443 kỹ năng** và để trống **24 / 76 nhánh kỹ năng (`STRANDS`)**, bao gồm nhiều nhánh nền tảng tiền tiểu học và kỹ năng sống mầm non Việt Nam như tách–gộp cấu tạo số (`C1.NCOMP`), số thứ tự (`C1.ORD`), dữ liệu biểu đồ (`C1.DAT`), bảng 29 chữ cái (`C5.ALP`), thanh điệu & dấu thanh (`C5.TON`, `C5.TMK`), chữ ghép & đọc tiếng–từ (`C5.DGR`, `C5.WRD`), tiền tập viết & khái niệm chữ viết (`C5.WRT`, `C5.PRN`), tư duy tập hợp & thuật toán (`C3.SET`, `C3.ALG`), tự giám sát & khởi xướng (`C6.MON`, `C6.INI`), cùng thế giới sống – an toàn giao thông – quê hương – môi trường (`C4.LIV`, `C4.SAF`, `C4.HOM`, `C4.ECO`, `C4.OBS`, `C4.TAC`, `C4.TOO`).

Spec này thiết lập **Dòng chương trình Toàn diện / Chuyên sâu** (*MOET × Koguma × Montessori*) gồm **9 lộ trình mới nhịp 5 buổi/tuần**:

- **3 lộ trình trọn năm học chuyên sâu (`RM-3-4-toan-dien-year-01`, `RM-4-5-toan-dien-year-01`, `RM-5-6-toan-dien-year-01`):** 36 tuần × 5 buổi/tuần = 180 buổi (`access_tier: "premium"`), bám sát 10 chủ đề năm học Giáo dục Mầm non Việt Nam và phủ sâu ~48–56 kỹ năng mỗi năm học.
- **6 lộ trình ngắn hạn 12 tuần trọng tâm (`access_tier: "standard"`, 12 tuần × 5 buổi/tuần = 60 buổi):** chia thành hai nhánh cân bằng mỗi độ tuổi:
  - **Nhánh A (`RM-{band}-toan-dien-ngon-ngu-kham-pha-01`):** nhấn trọng tâm Tiền đọc viết tiếng Việt & Khám phá Thế giới – An toàn sống, đan xen đủ 6 miền năng lực.
  - **Nhánh B (`RM-{band}-toan-dien-toan-logic-01`):** nhấn trọng tâm Toán cấu tạo số – Dữ liệu & Tư duy Thuật toán – Điều hành, đan xen đủ 6 miền năng lực.
- Xoá bỏ hoàn toàn tình trạng nhánh kỹ năng mồ côi khỏi lịch học: hợp các lộ trình trong `ALL_ROADMAPS` phủ trọn **76 / 76 `STRANDS`** (`0` strand bị bỏ rơi), đồng thời giữ nguyên cấu trúc cơ sở dữ liệu (`0` DB migration) và bảo toàn 100% tính bất biến của 15 lộ trình hiện hữu.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người biên soạn chương trình | `content_author` | Soạn 9 lộ trình `RM-*-toan-dien-*` trong `packages/content/src/roadmaps/` và các `SkillLevelPlan` tương ứng trong `packages/content/src/skills/c1..c6/` |
| Cổng kiểm định nội dung | — | Chạy `check-roadmap-balance`, `derive-demand`, `check-seed-gates`, `check-go-live` và bộ kiểm thử chuyên biệt `comprehensive-roadmaps.test.ts` |
| Khách & Phụ huynh | Guest, User | Duyệt bộ lọc dòng Toàn diện / Chuyên sâu trên `/programs`, xem lịch trình 10 chủ đề năm học kèm gợi ý đồ dùng vật thật và câu hỏi đồng hành cha mẹ |
| Trẻ (Child profile) | Hồ sơ trẻ đang hoạt động | Học tập theo nhịp 5 buổi/tuần (từ Thứ Hai đến Thứ Sáu) với gói `standard` (khoá 12 tuần) hoặc `premium` (lộ trình cả năm 36 tuần) |

## 3. Entry points

| Route / module | Actor | Ghi chú |
|---|---|---|
| `packages/content/src/roadmaps/rm-*-toan-dien-*.ts` | Người biên soạn | 9 lộ trình thuộc `COMPREHENSIVE_ROADMAPS` và `ALL_ROADMAPS` |
| `packages/content/src/skills/c1..c6/*.ts` | Người biên soạn | Bổ sung `SkillLevelPlan` chất lượng cao lấp đủ `content-demand.json` |
| `packages/taxonomy/src/koguma-catalog.ts` | Hệ thống | Nhận diện track hiển thị lộ trình giàu thông tin và 10 chủ đề GDMN |
| `/programs`, `/programs/{code}` | Guest, User | Bộ lọc dòng chương trình Toàn diện / Chuyên sâu và trang chi tiết tuần học |

## 4. Main flow

1. **Thiết kế ma trận kỹ năng 5 buổi/tuần:** Mỗi lộ trình sắp xếp tuần học theo cấu trúc xoắn ốc 5 buổi/tuần:
   - Tuần học mới (`1 .. W-3`): hai cụm học mới (`introduce` + `practice` ở hai miền năng lực khác nhau) kết hợp 1 buổi `offscreen` (hoặc `review` xen kẽ đảm bảo ≥1 `offscreen`/tuần) ôn lại kỹ năng từ 1–3 tuần trước.
   - Ba tuần cuối (`W-2 .. W`): dành trọn cho `review`, `practice` và `offscreen` củng cố kiến thức toàn khoá, không mở kỹ năng mới (`BR-CRM-11`).
2. **Kiểm chứng cổng cân bằng trước khi sinh cầu:** Chạy `roadmap-seed-gate` trên toàn bộ 24 lộ trình để xác minh thứ tự tiên quyết `BR-CRM-01`, biên độ 2–4 năng lực mỗi tuần `BR-CRM-02`, chu kỳ ôn tập `BR-CRM-03`, hoạt động ngoài màn hình `BR-CRM-05`, trần tỷ trọng 40% `BR-CRM-07`, phủ đủ 6 năng lực `BR-CRM-08` và trần độ khó theo tuổi `BR-PAR-01`.
3. **Soạn `SkillLevelPlan` chất lượng cao & suy sổ cầu:** Bổ sung các màn làm quen khái niệm (`GT-000`) và màn thực hành tương tác đa khuôn trong `packages/content/src/skills/c1..c6/` sao cho mọi kỹ năng đưa vào lộ trình có đủ ≥5 game levels phủ trọn band tuổi, lấp kín 100% ô trong `content-demand.json` (`debt_cells = 0`).
4. **Trưng bày lộ trình giàu thông tin trên `/programs`:** Hiển thị bộ lọc dòng Toàn diện / Chuyên sâu và dùng khung hiển thị giàu ngữ cảnh (chủ đề GDMN, đồ dùng vật thật ngoài màn hình, câu hỏi gợi mở cho phụ huynh) mà không thay đổi bảng cơ sở dữ liệu.

## 5. Alternative flows

- **Nhóm kỹ năng cảm quan xúc giác & hội thoại mở (`C4.TAC`, `C5.DES`, `C5.PRA`):** Do Phase 1 không thu âm giọng nói và màn hình cảm ứng 2D không tái tạo được độ nhám/nhiệt độ/trọng lượng thật, các kỹ năng này đi qua màn làm quen trực quan (`introduce`) kết hợp tiết thực hành vật thật cùng cha mẹ (`offscreen`) kèm gợi ý đồ dùng gia đình trong mục tiêu tuần và metadata đồng hành.
- **Người dùng gói `PKG-standard` xem lộ trình cả năm `premium`:** Trang `/programs/{code}` hiển thị đầy đủ tổng quan phân bố năng lực và chi tiết 2 tuần đầu theo `BR-PSH-02`, các tuần tiếp theo hiển thị mục tiêu tóm tắt kèm CTA nâng cấp gói `Premium`.
- **Người dùng gói `PKG-standard` ghi danh khoá 12 tuần `standard`:** Toàn bộ game level lấp vào các ô của 6 khoá 12 tuần bắt buộc có `access_tier` thuộc `["free", "login", "standard"]` để trẻ hoàn thành trọn vẹn 60 buổi không bị chặn khoá giữa chừng.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CMP-01` | Hợp các `skill_code` xuất hiện trong `ALL_ROADMAPS` BẮT BUỘC phủ đủ **76 / 76 `STRANDS`** của hệ thống (`zeroRoadmapStrands === 0`), sử dụng 100% mã `skills.code` và khuôn `GT-000`…`GT-037` bất biến | Đảm bảo không nhánh năng lực mầm non nào trong khung chuẩn bị bỏ rơi khỏi chương trình học có định hướng |
| `BR-CMP-02` | Ba lộ trình cả năm `RM-{3-4,4-5,5-6}-toan-dien-year-01` có `duration_weeks = 36`, `sessions_per_week = 5`, `access_tier = "premium"`, bám sát tiến trình 10 chủ đề năm học Giáo dục Mầm non Việt Nam và thoả toàn bộ `BR-CRM-01..11` | Cung cấp lộ trình học tập hàng ngày (Thứ Hai – Thứ Sáu) cho trẻ theo dõi sâu và hiện thực hoá quyền lợi `access_premium_curriculum` của gói `PKG-premium` |
| `BR-CMP-03` | Sáu lộ trình ngắn hạn `RM-{band}-toan-dien-ngon-ngu-kham-pha-01` và `RM-{band}-toan-dien-toan-logic-01` có `duration_weeks = 12`, `sessions_per_week = 5`, `access_tier = "standard"`, mỗi lộ trình phủ đủ 6/6 miền năng lực (`BR-CRM-08`) và không miền nào vượt 40% (`BR-CRM-07`) | Giúp phụ huynh gói Tiêu chuẩn tiếp cận đầy đủ các nhánh Tiền đọc viết, Khám phá – An toàn, Toán cấu tạo số và Tư duy thuật toán qua các khoá 3 tháng cân bằng |
| `BR-CMP-04` | Mọi `game_level` được gán trong `filled_by` của `content-demand.json` cho bất kỳ lộ trình nào có `access_tier = "standard"` BẮT BUỘC có `access_tier` thuộc `["free", "login", "standard"]` | Ngăn lỗi khoá giữa chừng trong `curriculum-player` khi học sinh gói `PKG-standard` gặp phải item đơn lẻ mang bậc `premium` |
| `BR-CMP-05` | Các kỹ năng thuộc `C4.TAC` (xúc giác – trọng giác), `C5.DES` (miêu tả lời nói) và `C5.PRA` (giao tiếp hội thoại) khi đưa vào lộ trình phải gắn với tiết `introduce` và `offscreen` kèm mô tả hoạt động tương tác thực tế cùng người lớn trong mục tiêu tuần | Trung thực với giới hạn của màn hình cảm ứng 2D ở Phase 1, biến thiết bị thành cầu nối khơi gợi tương tác đời thực giữa cha mẹ và trẻ |
| `BR-CMP-06` | Bổ sung `COMPREHENSIVE_ROADMAPS` (9 phần tử) theo nguyên tắc cộng thêm thuần tuý; CẤM xoá, đổi mã hoặc sửa danh sách tiết của 15 lộ trình đã phát hành (`BR-LRM-10`, `BR-KGM-10`) và không tạo DB migration mới | Bảo toàn lịch sử ghi danh của trẻ đang học và an toàn tuyệt đối cho vận hành cơ sở dữ liệu |
| `BR-CMP-07` | Toàn bộ 24 lộ trình trong `ALL_ROADMAPS` BẮT BUỘC đạt `debt_cells = 0` trong `content-demand.json` và 100% game levels mới bổ sung phải vượt qua Cổng 0..9 của `check-seed-gates` | Không cho phép phát hành lộ trình rỗng hoặc màn chơi kém chất lượng để chạy theo số lượng |
| `BR-CMP-08` | Toàn bộ `title`, `description` và `week.goal` của 9 lộ trình mới chỉ mô tả hoạt động khám phá, thực hành và đồng hành, CẤM dùng từ ngữ cam kết thành tựu hay hứa hẹn tăng trí thông minh (`BR-PSH-06`, `BR-LND-06`, `BR-PED-01`) | Giữ chuẩn mực trung thực khoa học và tuân thủ cổng kiểm duyệt ngôn ngữ trang công khai |

## 7. Data

Không thay đổi schema cơ sở dữ liệu (`packages/db/`). Cấu trúc dữ liệu tĩnh bổ sung tại `@mindkid/content` và `@mindkid/taxonomy`:

- **`COMPREHENSIVE_ROADMAPS` (`readonly RoadmapSeed[]` — 9 phần tử trong `@mindkid/content`):**
  - `RM-3-4-toan-dien-year-01`, `RM-4-5-toan-dien-year-01`, `RM-5-6-toan-dien-year-01` (`36w × 5b`, `premium`)
  - `RM-3-4-toan-dien-ngon-ngu-kham-pha-01`, `RM-4-5-toan-dien-ngon-ngu-kham-pha-01`, `RM-5-6-toan-dien-ngon-ngu-kham-pha-01` (`12w × 5b`, `standard`)
  - `RM-3-4-toan-dien-toan-logic-01`, `RM-4-5-toan-dien-toan-logic-01`, `RM-5-6-toan-dien-toan-logic-01` (`12w × 5b`, `standard`)
- **Mở rộng nhận diện chương trình giàu ngữ cảnh tại `@mindkid/taxonomy`:**
  - Bổ sung hàm `isComprehensiveProgramCode(code)` và `isEnrichedSyllabusProgramCode(code)` để giao diện `/programs` phân nhóm bộ lọc và hiển thị lịch trình 10 chủ đề GDMN kèm gợi ý vật thật cho cả dòng Koguma-VN lẫn dòng Toàn diện / Chuyên sâu mà giữ nguyên chữ ký hàm `isKogumaProgramCode` hiện hữu.

## 8. API contract

Không thêm route mới; sử dụng nguyên vẹn `GET /api/guest/curricula`, `GET /api/guest/curricula/{code}` và các endpoint ghi danh/học tập của `curriculum-player`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CMP-01 — 24 lộ trình phủ trọn 76/76 nhánh kỹ năng
  When tập hợp toàn bộ skill_code từ các tiết trong ALL_ROADMAPS
  Then tất cả 76 mã strand trong STRANDS đều có ít nhất một kỹ năng xuất hiện

Scenario: BR-CMP-02 & BR-CMP-03 — 9 lộ trình mới vượt qua cổng cân bằng sư phạm
  When chạy check-roadmap-balance trên ALL_ROADMAPS
  Then toàn bộ 24 lộ trình đều đạt trạng thái passed với 0 vi phạm BR-CRM-* và BR-PAR-01

Scenario: BR-CMP-04 & BR-CMP-07 — Sổ cầu 0 nợ và an toàn bậc truy cập cho khoá standard
  When chạy derive-demand --check trên ALL_ROADMAPS
  Then mọi lộ trình trong summary có debt_cells = 0
  And mọi game level thuộc filled_by của lộ trình access_tier = "standard" có access_tier khác "premium"

Scenario: BR-CMP-06 — Bảo toàn 15 lộ trình đã phát hành
  When kiểm tra danh sách mã lộ trình trong ALL_ROADMAPS
  Then 15 mã lộ trình gốc giữ nguyên vẹn cấu trúc tuần và tiết học
```
