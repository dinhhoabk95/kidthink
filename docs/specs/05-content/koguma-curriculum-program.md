---
spec: KOGUMA-CURRICULUM-PROGRAM
title: Chương trình tư duy 100 học phần Koguma-kai / Kuno Method bản địa hoá mầm non Việt Nam
area: content
status: implemented
mvp: false
phase: P4
reviewed: 2026-11-18
owns:
  - Cấu trúc 5 trụ cột tư duy Kuno (K1..K5) và bảng chuẩn 100 học phần Koguma-VN (KGM-001..KGM-100) cho ba độ tuổi 3-4, 4-5, 5-6
  - Bộ 12 lộ trình Koguma-VN (RM-*-koguma-01 và RM-*-koguma-02 12 tuần; RM-*-koguma-year-01 và RM-*-koguma-year-02 36 tuần) phủ trọn 100/100 học phần gắn với 10 chủ đề Giáo dục Mầm non Việt Nam
  - Siêu dữ liệu lịch tuần chuẩn (scheduled_roadmap_code, scheduled_week_no) trên từng học phần trong @mindkid/taxonomy và @mindkid/content
  - Luật sư phạm Jibutsu Kyoiku (sự vật thật trước ký hiệu) và Taiwa Kyoiku (đối thoại khơi gợi tư duy) khi biên soạn lộ trình và câu dẫn màn chơi
  - Quy tắc bản địa hoá ngôn ngữ và đồ dùng mầm non Việt Nam cho miền K4 và kho vật liệu văn hoá của chương trình
depends_on:
  - CURRICULUM-MODEL
  - LEARNING-ROADMAP-MODEL
  - PRESCHOOL-AGE-BANDS
  - CONTENT-THEME-REGISTRY
  - NUMERACY-REPRESENTATION-LADDER
  - GAME-LEVEL-MODEL
---

# Chương trình tư duy 100 học phần Koguma-kai / Kuno Method bản địa hoá mầm non Việt Nam

## 1. Objective

Trẻ mầm non 3–6 tuổi học tư duy vững nhất khi đi từ vận động cơ thể và thao tác đồ vật thật sang hình ảnh trực quan rồi mới chạm ký hiệu trừu tượng, thay vì làm phiếu tính cơ học sớm trước tuổi. Phương pháp **Koguma-kai / Kuno Method** (Nhật Bản) tổ chức quá trình đó thành **100 học phần tư duy gốc** đan xen xoắn ốc qua ba năm mẫu giáo, nhưng nguyên bản Nhật dùng hệ âm tiết Kana, bối cảnh mùa lễ Nhật và bộ học cụ lớp học riêng.

Spec này định nghĩa cách chuyển thể trọn vẹn **100 học phần Koguma-kai / Kuno Method** thành hệ chương trình chuẩn của MindKid cho trẻ Việt Nam 3–6 tuổi:

- Giữ nguyên **100% mã kỹ năng bất biến `skills.code`** (443 kỹ năng) và **38 khuôn trò chơi `GT-000`…`GT-037`**, không sinh mã kỹ năng hay nhánh năng lực mới.
- Sắp xếp 100 học phần (`KGM-001`…`KGM-100`) vào **5 trụ cột Kuno (`K1`…`K5`)** phủ cân bằng cả 6 miền năng lực `C1`–`C6`, chia theo ba lứa tuổi **Mầm (`3-4`: 28 học phần)**, **Chồi (`4-5`: 34 học phần)** và **Lá (`5-6`: 38 học phần)**, đồng thời xếp lịch dạy trực tiếp **trọn vẹn 100/100 học phần** vào bộ 12 lộ trình Koguma-VN có thể theo học ngay.
- Neo lịch tuần của lộ trình năm học vào **10 chủ đề Giáo dục Mầm non Việt Nam** (Văn bản hợp nhất `01/VBHN-BGDĐT`) và bản địa hoá hoàn toàn miền ngôn ngữ `K4` sang tiếng – vần đồng dao – thanh điệu tiếng Việt cùng chất liệu **"Tuổi thơ Việt × Giấy Gỗ Mộc"** tại [`../../design-system/vn-preschool-identity.md`](../../design-system/vn-preschool-identity.md).

[`curriculum-model.md`](curriculum-model.md) sở hữu luật bất biến của mọi chương trình (`BR-CRM-*`), [`learning-roadmap-model.md`](learning-roadmap-model.md) sở hữu pipeline lộ trình sinh sổ cầu (`BR-LRM-*`), còn file này sở hữu **cấu trúc học thuật 100 học phần Koguma-VN, danh mục 12 lộ trình `RM-*-koguma-*`, siêu dữ liệu lịch tuần từng học phần và luật bản địa hoá sư phạm Kuno**.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người biên soạn chương trình | `content_author` | Soạn và cập nhật 12 lộ trình `RM-*-koguma-*`, danh mục `KOGUMA_100_UNITS` kèm siêu dữ liệu lịch tuần và kho vật liệu văn hoá Việt trong `packages/content/` cùng `packages/taxonomy/` |
| Người duyệt nội dung | `content_reviewer` | Đối chiếu lộ trình và câu dẫn với [`../../taxonomy/koguma-100-alignment.md`](../../taxonomy/koguma-100-alignment.md) và các quy tắc `BR-KGM-01..11` |
| Cổng kiểm tra nội dung | — | Chạy `roadmap-seed-gate`, `content-demand`, `theme-registry` và bộ kiểm thử chương trình Koguma để chặn học phần bỏ trống lịch, lệch chuẩn độ tuổi, khuôn chơi hoặc chủ đề |
| Phụ huynh / Giáo viên | User đã đăng nhập | Xem cấu trúc 5 trụ cột Kuno, tra cứu tuần học chính xác của từng học phần `KGM-001`…`KGM-100`, chọn lộ trình Koguma 12 tuần (Học kỳ 1 / Học kỳ 2) hoặc 36 tuần (Chặng 1 / Chặng 2) và in phiếu hoạt động đồ vật thật ngoài màn hình (`offscreen`) |
| Trẻ (Child profile) | Hồ sơ trẻ đang hoạt động | Trải nghiệm từng tiết học theo nhịp xoắn ốc qua Chuyến phiêu lưu hôm nay, Bản đồ chủ đề và Hộp đồ chơi cụ thể |

## 3. Entry points

| Route / màn hình / module | Actor | Ghi chú |
|---|---|---|
| [`../../taxonomy/koguma-100-alignment.md`](../../taxonomy/koguma-100-alignment.md) | Người biên soạn, Người duyệt | Bản thiết kế đối chiếu 1:1 cho `KGM-001`…`KGM-100` |
| `packages/taxonomy/src/koguma-*.ts` | Người biên soạn, Web, Admin | Danh mục `KOGUMA_100_UNITS`, `KOGUMA_UNIT_SCHEDULES`, `getKogumaUnitSchedule` và `parseKogumaProgramMeta` dùng chung toàn workspace |
| `packages/content/src/roadmaps/koguma-*.ts` & `rm-*-koguma-*.ts` | Người biên soạn | Nguồn sự thật cho 12 lộ trình `KOGUMA_ROADMAPS` đăng ký vào `ALL_ROADMAPS` |
| `packages/content/src/builders/**` & `inventories/**` | Người biên soạn | Bộ sinh câu dẫn đối thoại Kuno và kho vật phẩm văn hoá Việt Nam |
| `/programs`, `/programs/:code#week-:n` | Guest, User | Trang giới thiệu chương trình và liên kết sâu tới đúng tuần học của từng học phần `KGM-001`…`KGM-100` (thuộc [`../02-public/program-showcase.md`](../02-public/program-showcase.md)) |
| `/play`, `/play/map`, `/play/toybox` | Child (qua phiên của User) | Bề mặt trẻ hiển thị chặng chơi hiện tại theo chủ đề mầm non Việt Nam và bàn thao tác vật thật *Jibutsu* |

## 4. Main flow

1. **Đối chiếu học phần từ bảng chuẩn 100 đơn vị:** Mỗi học phần `KGM-001`…`KGM-100` trong [`../../taxonomy/koguma-100-alignment.md`](../../taxonomy/koguma-100-alignment.md) khai báo rõ miền Kuno (`K1`…`K5`), band tuổi đích (`3-4`, `4-5`, `5-6`), đúng một `primary_skill_code` kèm danh sách `support_skill_codes` từ 443 kỹ năng hiện có, danh sách khuôn `GT-*` hợp lệ theo band và chủ đề mầm non Việt Nam.
2. **Đóng gói thành bốn chặng lộ trình mỗi độ tuổi (12 lộ trình trong `KOGUMA_ROADMAPS`):**
   - **Lộ trình Học kỳ 1 và Học kỳ 2 (12 tuần: `RM-{3-4,4-5,5-6}-koguma-01` và `RM-{3-4,4-5,5-6}-koguma-02`):** Mỗi khoá gồm 12 tuần × 3 tiết/tuần = 36 tiết, xoay vòng đều 5 trụ cột `K1`…`K5` và 6 năng lực `C1`…`C6` theo hai nửa năm học mầm non để phụ huynh dễ bắt đầu theo từng học kỳ ngắn.
   - **Lộ trình Năm học Chặng 1 và Chặng 2 (36 tuần: `RM-{3-4,4-5,5-6}-koguma-year-01` và `RM-{3-4,4-5,5-6}-koguma-year-02`):** Mỗi khoá gồm 36 tuần × 3 tiết/tuần = 108 tiết bám sát tiến trình 10 chủ đề năm học của Bộ GD&ĐT Việt Nam; hợp của hai chặng năm học dạy trực tiếp (`introduce`/`practice`) trọn vẹn **100/100 học phần `KGM-001`…`KGM-100`** (**28/28** Mầm, **34/34** Chồi, **38/38** Lá) cùng đầy đủ dây chuyền kỹ năng tiên quyết cùng band và vòng ôn tập xoắn ốc.
3. **Liên kết hai chiều giữa học phần và tuần học:** Mọi phần tử trong `KOGUMA_100_UNITS` và `KogumaUnitSummary` mang sẵn `scheduled_roadmap_code` và `scheduled_week_no` (`1..36`) khớp chính xác tuần dạy `primary_skill_code` trong lộ trình năm học, cho phép trình tra cứu `/programs` dẫn phụ huynh thẳng tới đúng lộ trình và tuần học tương ứng.
4. **Triển khai chu trình ba bước *Jibutsu → Taiwa → Biểu tượng* trong từng cụm tuần:**
   - Tiết mở đầu ưu tiên gợi ý hoạt động thao tác vật thật ngoài màn hình (`offscreen`, ví dụ đếm hạt đậu, xếp đũa tre, gõ phách theo tiếng) hoặc bài làm quen khái niệm `introduce` trên khuôn `GT-000` theo [`concept-intro-model.md`](concept-intro-model.md).
   - Các tiết kế tiếp chuyển sang `practice` hoặc `review` trên khuôn tương tác cụ thể (`GT-001`…`GT-037`) với câu dẫn đối thoại gợi mở tiếng Việt và phản hồi ấm áp không trừng phạt.
5. **Kiểm định qua sổ cầu và cổng lộ trình:** `derive-demand` đọc toàn bộ `ALL_ROADMAPS`, cập nhật `content-demand.json` đạt **0 nợ nội dung** trên mọi ô tiết học và chạy cổng `roadmap-seed-gate` cùng `theme-registry` trước khi `seed-all` ghi vào database.

## 5. Alternative flows

- **Kỹ năng tiền đề nằm ở band tuổi nhỏ hơn:** Khi một học phần ở khối Chồi (`4-5`) hoặc khối Lá (`5-6`) có `prerequisites` thuộc band nhỏ hơn (`skill.age_max < band_low`), cổng lộ trình áp dụng quy tắc miễn lặp lại tiền đề band dưới theo `BR-LRM-11` (tiền đề thuộc band tuổi thấp hơn được giả định đã hoàn thành trước lộ trình hiện tại) trong [`learning-roadmap-model.md`](learning-roadmap-model.md), còn mọi tiền đề cùng band (`skill.age_max >= band_low`) được xếp tuần trước hoặc cùng tuần với kỹ năng phụ thuộc theo `BR-CRM-01` (tôn trọng thứ tự kỹ năng tiên quyết).
- **Trẻ cần ôn lại khái niệm trước khi tăng độ khó:** Bộ chọn `ZPD` (vùng phát triển gần) trong [`../04-play/next-game-recommendation.md`](../04-play/next-game-recommendation.md) giữ nguyên thứ tự tuần sư phạm của lộ trình Koguma và chỉ điều chỉnh biến thể level hoặc chế độ ôn tập trong phạm vi kỹ năng của tiết hiện tại.
- **Học phần Kuno nâng cao cần bàn thao tác mở:** Các hoạt động như gấp giấy đối xứng, tách–gộp hạt sen trên khay 10 ô hoặc cân bập bênh quả quê được kết hợp giữa tiết học trong lộ trình, gợi ý `offscreen` cùng cha mẹ và bàn thao tác mở tại [`../04-play/montessori-toybox.md`](../04-play/montessori-toybox.md) mà không tự sinh thêm `skills.code` mới.

## 6. Business rules

| Rule | Nội dung | Vì sao |
|---|---|---|
| `BR-KGM-01` | Toàn bộ 100 học phần `KGM-001`…`KGM-100` phải ánh xạ 100% lên tập 443 mã `skills.code`, 76 `strands` và 38 khuôn `GT-000`…`GT-037` đã khoá theo `BR-CSA-08` (cấm tự phát minh mã kỹ năng ngoài danh mục chuẩn); tuyệt đối không tạo mã kỹ năng, nhánh năng lực hay mã khuôn mới | Bảo toàn tính bất biến của kho taxonomy, lịch sử `mastery_state` và telemetry toàn hệ thống |
| `BR-KGM-02` | Phân bổ 100 học phần phải giữ đúng tỷ trọng ba độ tuổi (**28** học phần Mầm `3-4`, **34** học phần Chồi `4-5`, **38** học phần Lá `5-6`) và phủ đủ **5 trụ cột Kuno (`K1`…`K5`)** tương ứng đủ 6 miền năng lực `C1`–`C6` trong mỗi band tuổi, không miền năng lực nào vượt trần 40% theo `BR-CRM-07` (trần tỷ trọng một miền năng lực trong chương trình) | Giữ đúng đường cong phát triển nhận thức 3–6 tuổi của Koguma-kai và tránh lệch chương trình sang riêng toán số |
| `BR-KGM-03` | Mỗi học phần ở band `B` phải có `primary_skill_code` thoả mãn đồng thời khoảng tuổi và trần độ khó của `BR-PAR-01` (ràng buộc biên soạn theo band tuổi mầm non: `3-4` tối đa độ khó `2`, `4-5` tối đa độ khó `3`, `5-6` tối đa độ khó `5`) và chỉ tham chiếu các khuôn `GT-*` được phép hoạt động ở band `B` theo [`../01-platform/engines/index.md`](../01-platform/engines/index.md) | Ngăn việc giao cơ chế thao tác quá sức vận động tinh hoặc quá tải trí nhớ làm việc cho trẻ nhỏ |
| `BR-KGM-04` | Các lộ trình năm học `RM-{band}-koguma-year-01` và `RM-{band}-koguma-year-02` (36 tuần × 3 tiết = 108 tiết) phải phân bổ tuần theo tiến trình **10 chủ đề Giáo dục Mầm non Việt Nam**; mọi mã `theme` gắn vào tuần và game level của band `B` phải có `age_floor` hợp lệ theo `BR-CTR-09` (ràng buộc sàn độ tuổi của chủ đề nội dung) trong [`content-theme-registry.md`](content-theme-registry.md) | Đồng bộ trải nghiệm ở nhà với chủ đề bé đang học trên lớp mầm non Việt Nam mà không vi phạm cổng chủ đề theo tuổi |
| `BR-KGM-05` | Tuân thủ nguyên lý *Jibutsu Kyoiku* (sự vật thật trước ký hiệu): ở band `3-4` và nửa đầu band `4-5`, học phần lượng số (`K2`) không hiển thị biểu thức dấu toán học trừu tượng (`+`, `-`, `=`) đứng một mình mà phải đi qua vật đếm cụ thể hoặc khung chấm theo `BR-NRL-02` (chữ số không đứng một mình dưới 5 tuổi) | Trẻ mầm non cần xây biểu tượng lượng từ thao tác thêm vào, bớt đi và tách–gộp đồ vật trước khi đọc ký hiệu toán học |
| `BR-KGM-06` | Trong mỗi lộ trình thuộc `KOGUMA_ROADMAPS`, tối thiểu 15% tổng số tiết là hoạt động `offscreen` thao tác đồ vật thật cùng cha mẹ hoặc tiết `introduce` làm quen khái niệm cụ thể, và không xếp quá 2 tiết `offscreen` trong cùng một tuần theo `BR-LRM-07` (giới hạn tần suất tiết ngoài màn hình mỗi tuần) | Giữ tinh thần bàn học cụ thật của lớp Koguma mà vẫn đảm bảo trẻ luôn có hoạt động tương tác trực tiếp trong tuần |
| `BR-KGM-07` | Tuân thủ nguyên lý *Taiwa Kyoiku* (đối thoại tư duy): câu dẫn nhiệm vụ (`instruction`) hướng tới trẻ dùng giọng cô giáo mầm non Việt Nam ấm áp, gợi mở quan sát và giữ độ dài tối đa 12 từ theo `BR-GLM-06` (giới hạn độ dài câu hướng dẫn màn chơi cho trẻ mầm non); câu hỏi suy ngẫm mở rộng cho phụ huynh đặt ở gợi ý đồng hành chứ không nhồi chữ dài lên canvas | Trẻ chưa biết đọc nghe câu ngắn sẽ nắm ngay việc cần làm, đồng thời phụ huynh có gợi ý hỏi "Vì sao?" đúng phương pháp Kuno |
| `BR-KGM-08` | Toàn bộ học phần thuộc trụ cột `K4` (Ngôn ngữ tư duy & Tiền đọc viết) phải bản địa hoá 100% sang cấu trúc tiếng Việt (tách tiếng theo nhịp phách, vần đồng dao Việt Nam, 6 thanh điệu, 29 chữ cái tiếng Việt), tuyệt đối không dịch máy các bài ghép âm tiết Kana tiếng Nhật như *Shiritori* theo ký tự đầu–cuối ngoại lai | Cấu trúc âm vị tiếng Việt là đơn lập có thanh điệu và vần; sao chép bài tập Kana sẽ sai bản chất ngôn ngữ trẻ Việt thụ đắc |
| `BR-KGM-09` | Kho vật phẩm minh hoạ trong câu dẫn và bộ dữ liệu bài tập Koguma-VN ưu tiên đồ vật gần gũi đời sống trẻ em Việt Nam (hạt đậu, đũa tre, chiếc nón, bánh chưng, đèn ông sao, hoa sen, con trâu, giỏ mây) và tuân thủ hệ màu – chất liệu – âm thanh ngũ cung tại [`../../design-system/vn-preschool-identity.md`](../../design-system/vn-preschool-identity.md) | Giúp trẻ nhận diện ngay sự vật quen thuộc mà không tốn tải nhận thức giải mã bối cảnh xa lạ |
| `BR-KGM-10` | Bổ sung 12 mã lộ trình `RM-{3-4,4-5,5-6}-koguma-{01,02,year-01,year-02}` theo hình thức cộng thêm thuần tuý; tuyệt đối không xoá, đổi tên hoặc sửa danh sách tiết của 9 mã lộ trình chuẩn hiện hữu (`RM-3-4-mam-*`, `RM-4-5-chi-*`, `RM-5-6-la-*`) theo `BR-ID-03` (mã chương trình đã phát hành là bất biến) | Bảo toàn tiến độ của mọi hồ sơ trẻ đang theo học lộ trình hiện hữu và giữ tính tương thích ngược cho `seed-all` |
| `BR-KGM-11` | Trọn vẹn **100/100** học phần `KGM-001`…`KGM-100` (**28/28** Mầm `3-4`, **34/34** Chồi `4-5`, **38/38** Lá `5-6`) bắt buộc có `primary_skill_code` được dạy trực tiếp bằng vai trò `introduce` hoặc `practice` trong `KOGUMA_ROADMAPS`, đồng thời khai báo chính xác `scheduled_roadmap_code` và `scheduled_week_no` khớp tuần dạy thật trong lộ trình tương ứng và đạt **0 ô nợ** trong `content-demand.json` | Đảm bảo cam kết chương trình 100 học phần là thực chất 100%, không để học phần nào chỉ nằm trên danh mục giới thiệu mà trẻ không thể học |

## 7. Data

Spec này **không thêm bảng mới và không đổi cột database** (`packages/db/` giữ nguyên). Toàn bộ cấu trúc Koguma-VN biểu diễn bằng kiểu dữ liệu tĩnh chặt chẽ trong `@mindkid/taxonomy` cùng `@mindkid/content` và nạp vào bảng `curricula` / `curriculum_items` hiện hành qua pipeline chuẩn của [`learning-roadmap-model.md`](learning-roadmap-model.md):

- **`KogumaPillarCode`:** `"K1" | "K2" | "K3" | "K4" | "K5"` — 5 trụ cột Kuno chuẩn hoá.
- **`KogumaTrack` & `KogumaStage` & `KogumaVariantCode`:** `koguma_track` giữ `"core_12w" | "year_36w"`, kết hợp `koguma_stage: 1 | 2` và `koguma_variant: "01" | "02" | "year-01" | "year-02"` để phân biệt rõ Học kỳ 1, Học kỳ 2, Năm học Chặng 1 và Năm học Chặng 2.
- **`MoetPreschoolThemeId`:** 10 chủ đề năm học Giáo dục Mầm non Việt Nam (`"mam_non"`, `"ban_than"`, `"gia_dinh"`, `"nghe_nghiep"`, `"thuc_vat"`, `"dong_vat"`, `"giao_thong"`, `"hien_tuong_tu_nhien"`, `"que_huong"`, `"tieu_hoc"`), mỗi chủ đề ánh xạ tường minh sang một hoặc nhiều `ContentThemeCode` hợp lệ theo `age_floor`.
- **`KogumaUnitDef` (`KOGUMA_100_UNITS` — đúng 100 phần tử):**
  - `unit_code`: `"KGM-001"` … `"KGM-100"`
  - `pillar`: `KogumaPillarCode`
  - `age_band`: `"3-4" | "4-5" | "5-6"`
  - `title_vi`: tên học phần tiếng Việt
  - `kuno_concept_ja`: thuật ngữ gốc Kuno để đối chiếu học thuật
  - `primary_skill_code`: mã `skills.code` chính (duy nhất cho mỗi học phần trong 100 đơn vị)
  - `support_skill_codes`: mảng mã `skills.code` bổ trợ cùng cụm
  - `recommended_templates`: mảng mã `GT-000`…`GT-037` hợp lệ trong `age_band`
  - `moet_theme`: `MoetPreschoolThemeId`
  - `content_theme`: `ContentThemeCode`
  - `concrete_manipulative_vi`: gợi ý đồ dùng thật ngoài màn hình cho hoạt động *Jibutsu*
  - `scheduled_roadmap_code`: mã lộ trình năm học nơi học phần được dạy trực tiếp (`"RM-{band}-koguma-year-01"` hoặc `"RM-{band}-koguma-year-02"`)
  - `scheduled_week_no`: số thứ tự tuần (`1..36`) dạy học phần trong `scheduled_roadmap_code`
  - `scheduled_core_roadmap_code` & `scheduled_core_week_no`: mã lộ trình 12 tuần và tuần học tương ứng nếu học phần góp mặt trong khoá Học kỳ 1 hoặc Học kỳ 2 (`null` nếu chỉ nằm ở lộ trình năm học)
- **`KOGUMA_ROADMAPS` (12 phần tử `RoadmapSeed` đăng ký vào `ALL_ROADMAPS`):**
  - Học kỳ 1 (12 tuần × 3 tiết): `RM-3-4-koguma-01`, `RM-4-5-koguma-01`, `RM-5-6-koguma-01`
  - Học kỳ 2 (12 tuần × 3 tiết): `RM-3-4-koguma-02`, `RM-4-5-koguma-02`, `RM-5-6-koguma-02`
  - Năm học Chặng 1 (36 tuần × 3 tiết): `RM-3-4-koguma-year-01`, `RM-4-5-koguma-year-01`, `RM-5-6-koguma-year-01`
  - Năm học Chặng 2 (36 tuần × 3 tiết): `RM-3-4-koguma-year-02`, `RM-4-5-koguma-year-02`, `RM-5-6-koguma-year-02`

## 8. API contract

Không mở endpoint HTTP mới và không phá vỡ tương thích ngược của schema phản hồi hiện hành:

- `GET /api/guest/curricula`, `GET /api/guest/curricula/:code` và `GET /api/users/curricula` tự động phục vụ đầy đủ 12 chương trình Koguma-VN đã phát hành thông qua bảng `curricula` hiện có theo [`../02-public/program-showcase.md`](../02-public/program-showcase.md) và [`../04-play/curriculum-player.md`](../04-play/curriculum-player.md), kèm siêu dữ liệu `is_koguma`, `koguma_track`, `koguma_stage`, `koguma_variant` từ `parseKogumaProgramMeta`.
- `GET /api/users/play/adventure` và `GET /api/users/play/home` tiếp tục chọn chặng chơi kế tiếp từ bất kỳ lộ trình Koguma Học kỳ 1, Học kỳ 2, Năm học Chặng 1 hoặc Năm học Chặng 2 mà trẻ đang theo học theo [`../04-play/daily-adventure-flow.md`](../04-play/daily-adventure-flow.md).
- Mọi kiểm soát phân quyền, kiểm tra bậc truy cập (`BR-GAT-01` — kiểm quyền truy cập nội dung tại tầng server) và ẩn `content_pack` khi bị chặn (`BR-GAT-03` — phản hồi bị chặn không trả `content_pack`) giữ nguyên không đổi.

## 9. Acceptance criteria

```gherkin
Scenario: Danh mục 100 học phần Koguma-VN khớp tuyệt đối kho kỹ năng và giới hạn độ tuổi
  Given danh mục KOGUMA_100_UNITS và tài liệu docs/taxonomy/koguma-100-alignment.md
  When chạy bộ kiểm thử đối chiếu chương trình Koguma
  Then danh mục có đúng 100 mã duy nhất từ "KGM-001" đến "KGM-100"
  And số lượng học phần theo band lần lượt là 28 cho "3-4", 34 cho "4-5" và 38 cho "5-6"
  And mọi primary_skill_code và support_skill_codes đều tồn tại trong 443 kỹ năng chuẩn
  And mọi primary_skill_code đều đạt kiểm tra độ tuổi và độ khó tối đa của band tương ứng theo BR-PAR-01

Scenario: Trọn vẹn 100 trên 100 học phần Koguma-VN được xếp lịch dạy trực tiếp không nợ nội dung
  Given 12 lộ trình trong KOGUMA_ROADMAPS được đăng ký vào ALL_ROADMAPS cùng các lộ trình chuẩn hiện có
  When chạy cổng roadmap-seed-gate, theme-registry, content-demand và kiểm thử BR-KGM-11
  Then toàn bộ 12 lộ trình Koguma-VN đều đạt 0 vi phạm về thứ tự tiên quyết, tỷ trọng miền năng lực, trần chủ đề và tần suất tiết offscreen
  And cả 100 học phần từ "KGM-001" đến "KGM-100" đều có tiết "introduce" hoặc "practice" đúng tại scheduled_roadmap_code và scheduled_week_no đã khai báo
  And sổ cầu content-demand.json đạt 100% số ô được lấp đầy với 0 ô nợ

Scenario: Câu dẫn và chất liệu miền K4 tuân thủ bản địa hoá tiếng Việt và giới hạn từ mầm non
  Given các bài tập sinh từ bộ builder ngôn ngữ, quan sát và câu chuyện toán Koguma-VN
  When kiểm tra chuỗi hiển thị cho trẻ trên từng màn chơi
  Then câu hướng dẫn nhiệm vụ không vượt quá 12 từ tiếng Việt và không chứa ký hiệu phép tính trần ở band "3-4"
  And nội dung tiền đọc viết chỉ sử dụng âm tiết, vần đồng dao, thanh điệu và bảng chữ cái tiếng Việt
```

## 10. Boundaries

### Always

- Tra cứu [`../../taxonomy/koguma-100-alignment.md`](../../taxonomy/koguma-100-alignment.md) trước khi thêm hoặc điều chỉnh bất kỳ tuần học nào trong `RM-*-koguma-*`.
- Cập nhật đồng bộ `KOGUMA_UNIT_SCHEDULES` và chạy lại `derive-demand` cùng bộ kiểm thử cổng trong `@mindkid/taxonomy`, `@mindkid/content` và `@mindkid/content-build` mỗi khi thay đổi `KOGUMA_ROADMAPS`.
- Phối hợp đồng bộ với hướng dẫn mỹ thuật, chất liệu và âm sắc ngũ cung tại [`../../design-system/vn-preschool-identity.md`](../../design-system/vn-preschool-identity.md) cho mọi màn hình thuộc bề mặt trẻ.

### Ask first

- Thay đổi phân bổ số lượng học phần giữa ba khối Mầm / Chồi / Lá hoặc thay đổi mã định danh `RM-*-koguma-*` sau khi lộ trình đã được gieo vào môi trường dùng thật.
- Mở rộng thêm gói lộ trình chuyên đề mới ngoài bộ 12 lộ trình Koguma-VN chuẩn (6 lộ trình 12 tuần và 6 lộ trình 36 tuần).

### Never

- Để bất kỳ học phần nào trong `KGM-001`…`KGM-100` không có tuần dạy trực tiếp trong `KOGUMA_ROADMAPS` hoặc để `scheduled_week_no` lệch với tuần học thật.
- Tự sinh mã `skills.code`, `strand` hoặc `GT-*` mới để ép khớp một bài tập giấy của Nhật.
- Xoá hoặc sửa danh sách tiết của 9 lộ trình nền `RM-3-4-mam-*`, `RM-4-5-chi-*`, `RM-5-6-la-*`.
- Đưa đồng hồ đếm ngược gây áp lực, sắc đỏ báo lỗi trừng phạt, bảng xếp hạng cạnh tranh hoặc bài tính nhẩm ký hiệu trần vào học phần của trẻ 3–4 tuổi.

## 11. Open questions

Không có.
