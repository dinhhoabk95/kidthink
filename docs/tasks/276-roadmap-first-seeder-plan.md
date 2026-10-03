# Task #276 Plan: Lộ trình làm trung tâm — nghiên cứu lại seeder bài học và lật thứ tự sản xuất

> **Mục tiêu**: Người đặt việc yêu cầu (2026-09-20) nghiên cứu lại cấu trúc seeder dữ liệu bài
> học của toàn bộ game đang có, lấy **lộ trình học theo từng lứa tuổi** làm trung tâm trước khi
> tạo game level, và làm cho **mỗi bài học có nhiều chủ đề học, nhiều game template hoạt động
> tương ứng**. Khảo sát cùng ngày trên corpus repo (database dev không chạy được, đo trên nguồn
> sự thật là file seed): kho có **6.384 game level** nhưng **42 cái có mặt trong một lộ trình**,
> và **bốn chương trình theo tuổi có dãy item giống hệt nhau từng phần tử**.

Spec mới: [`learning-roadmap-model.md`](../specs/05-content/learning-roadmap-model.md) ·
[`lesson-topic-composition.md`](../specs/05-content/lesson-topic-composition.md).

Spec liên quan: [`curriculum-model.md`](../specs/05-content/curriculum-model.md) ·
[`lesson-flow-model.md`](../specs/05-content/lesson-flow-model.md) ·
[`concept-topic-model.md`](../specs/05-content/concept-topic-model.md) ·
[`preschool-age-bands.md`](../specs/05-content/preschool-age-bands.md) ·
[`lesson-corpus-depth.md`](../specs/05-content/lesson-corpus-depth.md).

---

## 1. Kiến trúc seeder hiện tại

### 1.1 Thứ tự chạy

`pnpm db:seed` gọi hai lệnh nối nhau:

| Bước | Ở đâu | Làm gì |
|---|---|---|
| A | `packages/db/src/seed.ts` | Entitlement, package, tài khoản, consent |
| B1 | `seed-all.ts` bước 1 | Taxonomy — 6 competency, strand, **443 kỹ năng**, LO, skill dataset |
| B2 | `seed-all.ts` bước 2 | Từ vựng `content_tags` bốn trục `what` · `thinking` · `mechanic` · `theme` |
| B3 | `seed-all.ts` bước 3 | Gợi ý hành động theo kỹ năng |
| B4 | `seed-all.ts` bước 4 | **Nội dung**: 6.384 level, 378 hoạt động, 126 bài học. Tám cổng chạy từng hạt |
| B5 | `seed-all.ts` bước 5 | **Lộ trình**: 5 chương trình, 74 tuần, 222 item |

Bước B5 chạy **sau** B4 và đọc lại thứ B4 vừa ghi. Đó là gốc của mọi số đo dưới đây.

### 1.2 Cách một tiết được gán nội dung

`packages/content-build/src/seed-master/curricula.ts:220-265`

```
slotIdx = weekNo * sessionsPerWeek + sessionNo
sessionNo lẻ  -> lessonsList[slotIdx % lessonsList.length]
sessionNo chẵn -> levelsList[slotIdx % levelsList.length]
```

`lessonsList` và `levelsList` là `SELECT ... ORDER BY id ASC LIMIT 100`.

Ba hệ quả suy thẳng từ công thức:

1. **Không có tuổi trong công thức.** `targetAgeMin` và `targetAgeMax` của chương trình không
   xuất hiện ở bất kỳ vế nào.
2. **Không có kỹ năng, không có mục tiêu tuần.** `weekGoals` được ghi vào `curriculum_weeks`
   rồi không ai đọc lại khi chọn nội dung.
3. **`slotIdx` chỉ phụ thuộc `weekNo`, `sessionNo`, `sessionsPerWeek`.** Bốn chương trình
   `CUR-BE3`, `CUR-BE4`, `CUR-BE5`, `CUR-BE6` đều là 8 tuần × 3 tiết, nên cả bốn sinh ra
   **cùng một dãy `slotIdx`**, đọc **cùng một `lessonsList`**, và cho **cùng một dãy item**.

### 1.3 Chuỗi nối từ lộ trình xuống trò chơi

```
curricula → curriculum_weeks → curriculum_items (đa hình)
                                    ├── lesson → lesson_activities → activity
                                    │                                   └── ref_type=game_level, ref_code → game_levels
                                    └── game_level (trực tiếp)
```

Nối kỹ năng đi đường khác: `content_skill_map` (đa hình) và `skill_codes` khai trong seed.
`game_levels` **không** có khoá ngoại tới `skills`; nó chỉ mang `template_code`, `theme_id`,
`age_min/age_max`, `skill_dataset_id`.

## 2. Số đo ngày 2026-09-20

Nguồn: corpus repo. Database dev không khởi động được (`docker` daemon tắt), nên mọi số đo
dưới đây lấy từ file seed — thứ mà seeder ghi vào database, nên kết luận không đổi.

### 2.1 Kho so với lộ trình

| Đại lượng | Giá trị | Tỉ lệ |
|---|---:|---:|
| Game level trong corpus | 6.384 | 100% |
| Level có mặt trong **một bài học** nào đó | 162 | 2,5% |
| Level có mặt trong **một lộ trình** nào đó | 42 | 0,7% |
| Bài học | 126 | 100% |
| Bài học có mặt trong một lộ trình | 76 | 60,3% |
| Kỹ năng trong taxonomy | 443 | 100% |
| Kỹ năng có ≥1 bài học | 48 | 10,8% |
| Tổng tiết của 5 chương trình | 222 | — |

**6.342 level không có chỗ trong bất kỳ lộ trình nào.** Chúng được sinh ra, qua tám cổng,
vào database, rồi không trẻ nào gặp qua đường lộ trình.

### 2.2 Bốn chương trình theo tuổi

| Chương trình | Nhãn tuổi | Item | Bài học riêng biệt | Level riêng biệt | Tiết có bài đúng band |
|---|---|---:|---:|---:|---|
| `CUR-BE3` | 3–4 | 24 | 16 | 8 | **4/16** |
| `CUR-BE4` | 4–5 | 24 | 16 | 8 | 16/16 |
| `CUR-BE5` | 5–6 | 24 | 16 | 8 | 12/16 |
| `CUR-BE6` | 5–6 | 24 | 16 | 8 | 12/16 |
| `CUR-J42` | 3–6 | 126 | 76 | 42 | 84/84 |

Dãy item của `CUR-BE3`, `CUR-BE4`, `CUR-BE5`, `CUR-BE6` **giống hệt nhau từng phần tử** — đã
so chuỗi, bằng nhau. Band tuổi của 16 bài mà `CUR-BE3` phục vụ: 4 bài band `3-4`, 6 bài band
`4-5`, 6 bài band `5-6`. Trẻ 3 tuổi nhận 12/16 tiết soạn cho trẻ lớn hơn.

### 2.3 Vi phạm `BR-CRM-*` của seeder

| Chương trình | `BR-CRM-02` tuần lệch 2–4 competency | `BR-CRM-07` share lớn nhất (trần 40%) | `BR-CRM-08` competency phủ (cần 6) | `BR-CRM-03` kỹ năng không ôn lại | `BR-CRM-11` kỹ năng mới ở 3 tuần cuối |
|---|---:|---:|---:|---:|---:|
| `CUR-BE3` | 8/8 | 100% | 1/6 | 10/14 | 5 |
| `CUR-BE4` | 8/8 | 100% | 1/6 | 10/14 | 5 |
| `CUR-BE5` | 8/8 | 100% | 1/6 | 10/14 | 5 |
| `CUR-BE6` | 8/8 | 100% | 1/6 | 10/14 | 5 |
| `CUR-J42` | 22/42 | 68,3% | 4/6 | 22/38 | 3 |

Bốn chương trình theo tuổi **chỉ dạy C1**. `slotIdx` cho 8 tuần rơi vào khoảng 4–27, và 40 bài
đầu theo `id` đều là C1, nên không tiết nào chạm C2–C6.

### 2.4 Luật có, cổng không chạy

`packages/shared/src/curriculum-model.ts` cài đủ `BR-CRM-01..11`, có
`packages/shared/tests/curriculum-balance.test.ts` phủ từng rule kèm ca âm. Người gọi nó:

| Người gọi | Có gọi |
|---|---|
| `packages/shared/src/personal-curriculum.ts` | Có |
| `packages/shared/src/publish-checklist.ts` | Có |
| `packages/content-build/src/seed-master/curricula.ts` | **Không** |
| `packages/content-build/src/cli/seed-all.ts` | **Không** |

Đây đúng dạng cổng xanh giả đã gặp nhiều lần: cổng tồn tại, có test, không nối vào đường
chạy thật. `curriculum-model.md` mang
`status: implemented` trong khi seeder vi phạm 5 trên 11 rule của chính nó.

### 2.5 Bố cục một bài học

| Đại lượng | Min | Max | Trung bình |
|---|---:|---:|---:|
| Hoạt động mỗi bài | 3 | 3 | 3,00 |
| Trò chơi số mỗi bài | 2 | 2 | 2,00 |
| Cơ chế chơi riêng biệt mỗi bài | 1 | 2 | 1,70 |

Sàn bằng trần ở cả 126 bài — con số 3 và 2 đến từ bộ sinh, không từ nội dung. 38 bài chỉ có
một cơ chế. Mỗi bài mang **đúng một** `theme_tag` (15 giá trị toàn corpus: `home` 35 bài,
`art` 12, `nature` 11, …), nên "chủ đề" hôm nay là bối cảnh kể chuyện, không phải đơn vị dạy.
Gần với chủ đề học nhất là `what_tags` — 103 giá trị — nhưng chúng không có mã và không neo
strand.

Thêm: **11 hoạt động trò chơi** có `skill_codes` không giao với `skill_codes` của bài chứa nó.

### 2.6 Chỗ đã có sẵn, dùng lại được

| Thứ | Ở đâu | Dùng để |
|---|---|---|
| Ma trận kỹ năng × khuôn | `gates/skill-template-affinity.ts` | Suy bộ khuôn hợp lệ cho một chủ đề (`BR-LTC-04`) |
| Bộ kiểm `BR-CRM-01..11` | `packages/shared/src/curriculum-model.ts` | Chạy trên bản khai lộ trình (`BR-LRM-06`) |
| Trần band tuổi | `packages/db/config/preschool-age-bands.json` | Ép trần tổng bài (`BR-LTC-08`) |
| Mô hình chủ đề | `concept-topic-model.md` `BR-CTM-01..05` | Hình dạng một chủ đề — không viết lại |
| 37 khuôn engine | `packages/game-engine/src/templates/GT-*` | Nguồn khuôn |

Không phải dựng mới bốn thứ đầu. Việc là **nối** chúng vào đường chạy.

## 3. Giả định đã chốt để làm tiếp

Người đặt việc không cần trả lời trước khi bắt đầu. Bốn giả định dưới đây được ghi thành giả
định chứ không hỏi; sai chỗ nào thì sửa chỗ đó, phần còn lại không đổ.

| # | Giả định | Nếu sai thì đổi gì |
|---|---|---|
| G1 | Ba band `3-4` · `4-5` · `5-6` giữ nguyên, khớp `preschool-age-bands.md`. Bốn chương trình theo tuổi gộp về **ba lộ trình band** | `CUR-BE6` tách riêng thì thêm một lộ trình thứ tư, sổ cầu thêm một cột band |
| G2 | Tuổi vẫn là **đề xuất**, không phải khoá ghi danh — `D-SI` và `BR-PAR-04` không đổi. Band trong sổ cầu ép **biên soạn**, không ép **truy cập** | Nếu đổi thành khoá thì đây là quyết định của `lesson-flow-model.md`, không phải của spec này |
| G3 | 6.342 level mồ côi **giữ nguyên trong kho**, gắn `orphan`, không xoá và không gieo vào lộ trình | Nếu quyết định soạn lại theo ô thì thành một chương trình việc riêng, ước lượng theo số ô |
| G4 | Lộ trình soạn tay theo band, **không** sinh máy. Sổ cầu thì sinh máy và xác định | Nếu muốn gợi ý máy cho bản nháp lộ trình thì thêm một bước đề xuất, vẫn cần người duyệt |

## 4. Lát cắt dọc

Mỗi lát là một lát dọc chạy được, theo luật 1 spec = 1 plan = 1 lát dọc. Lát sau không bắt đầu
trước khi lát trước có cổng xanh **kèm ca âm**.

| Lát | Nội dung | Cổng đóng lát | Ca âm bắt buộc |
|---|---|---|---|
| **S1** | Cổng `check:roadmap-balance` — nối `validateCurriculumBalance` vào `seed-all`, chạy trên 5 chương trình đang có | Cổng đỏ, in đúng 5 dòng vi phạm của §2.3 | Sửa một chương trình cho xanh → cổng phải xanh |
| **S2** | Khuôn lộ trình `packages/content/src/roadmaps/` + một lộ trình thật band `3-4` thoả `BR-CRM-01..11` | `check:roadmap-balance` xanh trên lộ trình mới | Lộ trình khai 1 competency → đỏ ở `BR-CRM-08` |
| **S3** | `derive-demand.ts` → `content-demand.json`, nối `skill-template-affinity` để điền `template_codes` | Sinh lại trùng từng byte; số ô khớp số tiết của lộ trình | Sửa một tuần trong lộ trình → sổ cầu đổi |
| **S4** | Bỏ `insertCurriculumItemForSession`; `curriculum_items` lấy thẳng từ lộ trình. Lật thứ tự B4/B5 | `BR-LRM-02` xanh: không còn phép chia lấy dư trong `seed-master/` | Đưa lại hàm cũ → cổng đỏ, nêu tên hàm |
| **S5** | `topics[]` trong `LessonSeed` + cổng `check:lesson-topics` cho `BR-LTC-01..09` | Cổng đỏ trên 126 bài hiện tại, in đúng số bài 1 chủ đề | Bài 2 chủ đề × 2 khuôn → xanh |
| **S6** | Chuyển 126 bài sang `topics[]` — ánh xạ máy phần `what_tags` neo được strand, soạn tay phần còn lại | `check:lesson-topics` xanh; `BR-LTC-05` sàn ≠ trần | 11 hoạt động lệch kỹ năng của §2.5 phải hết |
| **S7** | `gen-levels` đọc sổ cầu, chỉ sinh ô thiếu; level ngoài sổ gắn `orphan` | `BR-LRM-09`: báo cáo in ô đã lấp / tổng ô | Sinh một level không có ô → cổng đỏ |
| **S8** | Ba lộ trình band đầy đủ + lấp sổ cầu tới ngưỡng bậc thang đợt 1 | Độ phủ ô tăng thật, đo theo ô | Hạ một ô → nợ tăng, không xanh giả |

Lát S1 đứng trước vì nó biến §2.3 từ một bảng trong tài liệu thành một cổng đỏ trong CI. Cổng
đỏ trước, sửa sau — ngược lại là sửa mù.

## 5. Cấm

- **Cấm — NEVER** sinh thêm game level trước khi S3 có sổ cầu. Kho đang thừa 6.342 level chưa
  có chỗ; thêm nữa là thêm nợ.
- **Cấm — NEVER** tạo hàng `skills` hay `strands` mới để đặt tên cho một ô lộ trình hay một
  chủ đề — ranh giới `BR-CTM-01` và `AGENTS.md`.
- **Cấm — NEVER** nới `BR-CRM-07` hay `BR-CRM-08` để lộ trình cũ xanh. Lộ trình cũ **phải** đỏ
  ở S1; đó là điều kiện nghiệm thu của lát đó.
- **Cấm — NEVER** đóng một lát bằng cổng chưa có ca âm. Cột "ca âm bắt buộc" ở §4 là bắt buộc,
  không phải gợi ý.
- **Cấm — NEVER** đổi `status` của `curriculum-model.md` thành `implemented` lần nữa trước khi
  `check:roadmap-balance` xanh thật trên mọi chương trình published.

## 6. Cách tái lập số đo §2

Database dev không cần chạy. Script đo đặt ở
`packages/content-build/scripts/` khi làm S1; trong lúc chưa có, tái lập bằng ba bước:

1. Bài học: đọc `packages/content/src/lessons/c*.ts`, tách theo `code: "LES-`, lấy
   `target_age_min/max`, `skill_codes`, `activity_codes`, `what_tags`, `theme_tag`.
2. Level: `grep -hoE '"GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-[0-9]{4}"'` trên `packages/`, trừ
   `tests/`, rồi `sort -u`.
3. Lộ trình: chạy lại đúng công thức §1.2 với `lessonPool = lessons[0..99]` và
   `levelPool = levels[0..99]`.

Ba bước này cho lại đúng các số ở §2.1–§2.3.
