---
spec: LEARNING-ROADMAP-MODEL
title: Lộ trình học theo lứa tuổi là nguồn cầu nội dung — soạn lộ trình trước, sinh level sau
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-09-20
owns:
  - Lộ trình theo lứa tuổi là hiện vật được soạn, không phải kết quả phụ của seeder
  - Thứ tự bắt buộc của pipeline gieo hạt — lộ trình trước, level sau
  - Sổ cầu nội dung (demand ledger) và luật suy nó ra từ lộ trình
  - Luật cấm gán nội dung vào tiết bằng chỉ số vòng
depends_on:
  - CURRICULUM-MODEL
  - LESSON-FLOW-MODEL
  - PRESCHOOL-AGE-BANDS
  - LESSON-MODEL
  - GAME-LEVEL-MODEL
  - TAXONOMY-SERVICE
---

# Lộ trình học theo lứa tuổi là nguồn cầu nội dung — soạn lộ trình trước, sinh level sau

## 1. Objective

Hôm nay kho nội dung được soạn trước, lộ trình lắp sau bằng phép chia lấy dư. Hệ quả đo ngày
2026-09-20 trên corpus repo: **6.384 game level tồn tại, 42 cái (0,7%) có mặt trong một lộ
trình nào đó**; **48 trên 443 kỹ năng (10,8%) có bài học**; và **bốn chương trình theo tuổi
`CUR-BE3`, `CUR-BE4`, `CUR-BE5`, `CUR-BE6` có dãy item giống hệt nhau từng phần tử** vì
`slotIdx` chỉ suy từ `week_no`, `session_no`, `sessions_per_week` — ba giá trị bằng nhau ở cả
bốn chương trình. Trẻ 3 tuổi và trẻ 6 tuổi nhận đúng một nội dung; nhãn tuổi là trang trí.

File này lật thứ tự: **lộ trình là hiện vật được soạn, và cầu nội dung suy ra từ nó.** Không
một game level nào được sinh trước khi có một ô trong lộ trình gọi tên nó.

[`curriculum-model.md`](curriculum-model.md) sở hữu **luật sư phạm** của một chương trình
(`BR-CRM-01..11`). File này sở hữu **thứ tự sản xuất** làm cho những luật đó có thể đạt được,
và **sổ cầu** nối lộ trình xuống level. Hai file không chồng contract: `curriculum-model.md`
nói *một lộ trình đúng trông như thế nào*, file này nói *lộ trình được soạn lúc nào và nó bắt
kho nội dung phải có gì*.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn lộ trình | `content_author` | Soạn `roadmap.<band>.ts` — tuần, mục tiêu, kỹ năng mục tiêu, chủ đề |
| Người duyệt | `content_reviewer` | Đối chiếu lộ trình với `BR-CRM-01..11` trước khi mở cầu |
| Bộ suy cầu | — | Đọc lộ trình, in `content-demand.json`, không tự sinh nội dung |
| Bộ sinh level | — | Đọc sổ cầu, sinh đúng những ô còn thiếu. Cấm — NEVER sinh ô không có trong sổ |
| Cổng gieo hạt | — | Chặn `db:seed` khi lộ trình thiếu hoặc sổ cầu lệch corpus |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/content/src/roadmaps/**` | Người soạn | Nguồn sự thật của lộ trình. Mới — chưa tồn tại |
| `packages/content-build/src/cli/derive-demand.ts` | Dev | Suy sổ cầu từ lộ trình. Mới |
| `packages/content-build/src/cli/gen-levels.ts` | Dev | Có sẵn — phải đổi để đọc sổ cầu |
| `packages/content-build/src/cli/seed-all.ts` | Dev | Có sẵn — phải đổi thứ tự bước 4 và bước 5 |
| `packages/content-build/src/seed-master/curricula.ts` | Dev | Có sẵn — `insertCurriculumItemForSession` phải bỏ |

## 4. Main flow

1. Người soạn viết một lộ trình cho một band tuổi: dãy tuần, mỗi tuần một mục tiêu cho người
   lớn, và **danh sách kỹ năng mục tiêu** của tuần đó lấy từ taxonomy.
2. Mỗi tuần khai các tiết. Mỗi tiết khai **vai trò** (`introduce` · `practice` · `review` ·
   `offscreen`) theo cấu trúc tuần chuẩn của `curriculum-model.md` mục 7.1.
3. Cổng lộ trình chạy `BR-CRM-01..11` trên bản khai — **trước** khi có bất kỳ nội dung nào.
   Lộ trình đỏ thì dừng ở đây; chưa tốn một level nào.
4. Bộ suy cầu đọc lộ trình đã xanh và in `content-demand.json`: mỗi dòng là một ô
   `(band, tuần, tiết, vai trò, kỹ năng, chủ đề, khuôn)` cần được lấp, kèm số lượng.
5. Bộ sinh level đọc sổ cầu, đối chiếu corpus hiện có, và chỉ sinh **phần còn thiếu**.
6. `db:seed` gieo theo thứ tự: taxonomy → bản ghi chương trình và tuần từ lộ trình → bài học
   → level → `curriculum_items`. Bản ghi chương trình mang mã `CUR-` + mã lộ trình (cột
   `curricula.code` đòi tiền tố `CUR-`). `curriculum_items` lấy thẳng từ sổ cầu: tra id theo
   mã nội dung sau khi nội dung đã gieo, **không chọn, không tính toán lại**; mã chưa gieo
   thì ném lỗi.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Lộ trình gọi kỹ năng chưa có trong taxonomy | Mã kỹ năng không khớp `skills` | Dừng, exit ≠ 0, in tên mã sai. Cấm — NEVER tự tạo kỹ năng |
| Sổ cầu có ô mà corpus chưa lấp | Thư viện còn thiếu | Cổng in nợ theo ô, chạy theo bậc thang. Cấm — NEVER lấp bằng level của kỹ năng khác |
| Corpus có level không nằm trong sổ cầu | Nội dung thừa từ đời trước | Level giữ nguyên trong kho, gắn `orphan`, Cấm — NEVER gieo vào `curriculum_items` |
| Một kỹ năng xuất hiện ở hai band | Kỹ năng trải khoảng tuổi rộng | Mỗi band có ô riêng; trần độ khó theo `BR-PAR-01` của band đó |
| Chạy `MINDKID_SEED_MASTER_ONLY=1` | Cố tình chỉ gieo master | Lộ trình vẫn gieo; `curriculum_items` rỗng là đúng |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LRM-01` (lộ trình là hiện vật) | Lộ trình BẮT BUỘC là file được soạn trong `packages/content/src/roadmaps/`, có mã, có version. Cấm — NEVER suy lộ trình ra từ nội dung đang có | Lộ trình suy từ kho thì nó kể lại kho, không dạy gì. Đó chính là trạng thái hôm nay: 4 chương trình giống hệt nhau vì cả bốn cùng đọc 100 hàng đầu của `lessons` |
| `BR-LRM-02` (cấm gán bằng chỉ số vòng) | Cấm — NEVER chọn nội dung cho một tiết bằng phép chia lấy dư, `LIMIT`, hay thứ tự `id`. Mỗi ô lộ trình BẮT BUỘC nêu tên kỹ năng và chủ đề nó dạy | `slotIdx % lessonsList.length` không biết tuổi, không biết kỹ năng, không biết mục tiêu tuần. Nó luôn chạy xanh và luôn sai |
| `BR-LRM-03` (lộ trình trước level) | Trong `seed-all`, bước gieo lộ trình (chương trình + tuần) BẮT BUỘC chạy **trước** bước gieo game level, và bước đó không đọc `lessons`/`game_levels`. `curriculum_items` gieo **sau** nội dung vì chỉ tra id theo mã trong sổ cầu. Cấm — NEVER để bước lộ trình đọc bảng `game_levels` để tự chọn | Thứ tự cũ ngược: level gieo trước, lộ trình nhặt lại thứ đã có. Lật thứ tự là cách duy nhất làm cầu quyết định cung |
| `BR-LRM-04` (mỗi ô nêu tên band) | Mỗi ô của sổ cầu BẮT BUỘC mang đúng một band trong `3-4` · `4-5` · `5-6`, và nội dung lấp ô đó BẮT BUỘC khai band trùng | Không có cột band thì bốn chương trình tuổi khác nhau lấp được bằng cùng một hàng — đo được hôm nay ở `CUR-BE3`: 12 trên 16 tiết là bài của band khác |
| `BR-LRM-05` (một tiết, một vai trò) | Mỗi tiết khai đúng một vai trò `introduce` · `practice` · `review` · `offscreen` | `BR-CRM-03` (ôn lại) và `BR-CRM-05` (ngoài màn hình) không đo được nếu tiết không tự khai nó đang làm gì |
| `BR-LRM-06` (cổng lộ trình chạy trước nội dung) | `BR-CRM-01..11` BẮT BUỘC chạy trên bản khai lộ trình trước bước sinh level, và mã thoát ≠ 0 chặn cả pipeline | Chạy luật sư phạm sau khi đã sinh 6.384 level là chạy quá muộn để sửa được gì |
| `BR-LRM-07` (sổ cầu là file kiểm tra được) | `content-demand.json` BẮT BUỘC được commit và tái sinh xác định — cùng lộ trình cho cùng sổ cầu | Cầu không ghi ra file thì không diff được, và không ai thấy được hôm nay thêm nợ hay bớt nợ |
| `BR-LRM-08` (cấm level mồ côi vào lộ trình) | `curriculum_items` chỉ nhận thực thể có ô tương ứng trong sổ cầu | Không có luật này thì 6.342 level mồ côi hôm nay vẫn lọt vào lộ trình bằng đường vòng |
| `BR-LRM-09` (cổng đếm ô, không đếm hàng) | Cổng độ phủ BẮT BUỘC đo **ô sổ cầu đã lấp / tổng ô**, Cấm — NEVER đo tổng số level trong kho | Đếm hàng cho 6.384 — một con số lớn và vô nghĩa. Đếm ô cho 42/222, là con số thật |
| `BR-LRM-10` (mã lộ trình bất biến) | Mã lộ trình theo dạng `RM-<band>-<slug>`, bất biến sau khi publish; đổi nội dung thì tăng version | Ghi danh, tiến độ và báo cáo neo vào mã. Mã đổi là mất lịch sử học của trẻ |
| `BR-LRM-12` (mỗi band có lộ trình cả năm) | Mỗi band BẮT BUỘC có ít nhất một lộ trình **cả năm** `duration_weeks = 36`, mã dạng `RM-<band>-year-NN`, theo bảng 10 chủ đề năm học ở 7.1a. Lộ trình 12 tuần `RM-<band>-01` được giữ làm lộ trình khởi động; hai loại cùng tồn tại, không thay nhau | Trường mầm non chạy năm học khoảng 35 tuần theo 10 chủ đề. Lộ trình 12 tuần chỉ là một lát cắt, cha mẹ và giáo viên không có chương trình đi hết năm. Mã `RM-<band>-01` đã publish nên bất biến (`BR-LRM-10`): thêm lộ trình mới, không nới lộ trình cũ |
| `BR-LRM-11` (prerequisite dưới band được miễn) | Khi kiểm `BR-CRM-01` trên lộ trình của một band, prerequisite có `age_max` thấp hơn tuổi thấp nhất của band được coi là trẻ đã học ở band trước và KHÔNG bắt buộc xuất hiện trong lộ trình. Prerequisite nằm trong band vẫn BẮT BUỘC xuất hiện ở tuần không muộn hơn kỹ năng phụ thuộc | Taxonomy khai tuổi từng kỹ năng bằng một tuổi đơn, nên gần như mọi kỹ năng 4–5 và 5–6 đều có tiền đề ở band dưới. Bắt chúng lặp lại trong lộ trình band trên thì lộ trình 12 tuần không còn chỗ cho kỹ năng mới |

## 7. Data

### 7.1 Hình dạng một lộ trình

```
RoadmapSeed
  code              RM-3-4-mam-01                    (BR-LRM-10)
  version           số nguyên ≥1                     (BR-LRM-10)
  band              "3-4" | "4-5" | "5-6"
  title             một dòng tiếng Việt
  description       một đoạn tiếng Việt cho người lớn
  access_tier       "free" | "login" | "standard" | "premium"
  sessions_per_week mặc định 3                       (curriculum-model.md 7.1)
  duration_weeks    số tuần
  weeks[]
    week_no         1..duration_weeks
    goal            một câu cho người lớn            (BR-CRM-10)
    target_skills   string[]  mã kỹ năng thật, là hợp skill_code của các tiết trong tuần
    sessions[]
      session_no    1..sessions_per_week
      role          introduce | practice | review | offscreen   (BR-LRM-05)
      skill_code    kỹ năng tiết này dạy             (BR-LRM-02)
      topics[]      mã chủ đề, mỗi chủ đề một strand (BR-CTM-02) — tuỳ chọn tới khi
                    lesson-topic-composition được cài
```

Vai trò quyết định loại nội dung lấp tiết và cờ ngoài màn hình:

| Vai trò | Lấp bằng | `is_offline` | Ghi chú |
|---|---|---|---|
| `introduce` | bài học | không | Kỹ năng mới lần đầu có tiết `introduce` |
| `practice` | game level | không | Theo bậc độ khó của band |
| `review` | bài học | không | Kỹ năng đã gặp ở tuần trước |
| `offscreen` | bài học có hoạt động ngoài màn hình | có | Cho phép nêu một kỹ năng chưa `introduce` ở tuần đầu như làm quen thực tế; kỹ năng đó phải `introduce` ngay tuần sau |

Hệ quả suy được: `BR-CRM-05` đo bằng vai trò `offscreen`, không cần cờ riêng. Kỹ năng của tiết
phải có `age_min`/`age_max` giao band của lộ trình và `difficulty` ≤ trần band
(`preschool-age-bands.json`), cộng toàn bộ prerequisite của nó cũng có mặt trong lộ trình.

### 7.1a Lộ trình cả năm 36 tuần (`BR-LRM-12`)

Ba lộ trình `RM-3-4-mam-year-01` · `RM-4-5-chi-year-01` · `RM-5-6-la-year-01`, mỗi tuần 3 tiết,
đi qua 10 chủ đề năm học theo Chương trình GDMN:

| # | Chủ đề | Tuần | Số tuần |
|---|---|---|---:|
| 1 | Trường mầm non | 1–3 | 3 |
| 2 | Bản thân | 4–7 | 4 |
| 3 | Gia đình | 8–10 | 3 |
| 4 | Nghề nghiệp | 11–14 | 4 |
| 5 | Thực vật | 15–18 | 4 |
| 6 | Động vật | 19–22 | 4 |
| 7 | Phương tiện giao thông | 23–25 | 3 |
| 8 | Hiện tượng tự nhiên | 26–29 | 4 |
| 9 | Quê hương – Đất nước – Bác Hồ | 30–33 | 4 |
| 10 | Mùa hè và ôn tập cuối năm (band 3–4, 4–5) · Bé sắp vào lớp Một (band 5–6) | 34–36 | 3 |

Chủ đề nằm trong câu `goal` của tuần (`Chủ đề «<tên>»: …`), không thêm cột mới vào
`RoadmapSeed`. Cấu trúc một tuần:

- **Tuần học mới:** tiết 1 `introduce` kỹ năng mới · tiết 2 `practice` đúng kỹ năng đó · tiết 3
  `offscreen` một kỹ năng vừa học khác năng lực, để chạm 2 năng lực mỗi tuần (`BR-CRM-02`).
- **Tuần ôn cuối chủ đề:** `review` · `practice` · `offscreen` trên các kỹ năng vừa học của chủ
  đề, không kỹ năng mới. Chín chủ đề đầu kết bằng tuần ôn; chủ đề 10 là ba tuần ôn cả năm
  (`BR-CRM-11`).
- Mọi tuần chạy cùng cổng `BR-CRM-01..11` như lộ trình 12 tuần. Kỹ năng nhiều hơn 12 tuần nên
  chương trình cả năm phải kéo theo toàn bộ prerequisite trong band (`BR-LRM-11`).

Nợ nội dung của ba lộ trình cả năm ghi trong sổ cầu như mọi ô khác. Cấm — NEVER thu nhỏ lộ trình
xuống dưới 36 tuần để giảm nợ.

### 7.2 Hình dạng một ô sổ cầu

| Cột | Nghĩa | Bắt buộc |
|---|---|---|
| `roadmap_code` | Lộ trình sinh ra ô này | Có |
| `band` | `3-4` · `4-5` · `5-6` | Có |
| `week_no` · `session_no` | Vị trí trong lộ trình | Có |
| `role` | Vai trò tiết | Có |
| `skill_code` | Kỹ năng ô này dạy | Có |
| `topic_code` | Chủ đề trong kỹ năng đó | Có khi lộ trình khai `topics[]`; `null` tới khi sổ đăng ký chủ đề tồn tại |
| `template_codes` | Khuôn hợp lệ, lấy từ ma trận tương hợp | ≥1 cho ô `practice` |
| `level_quota` | Số nội dung cần cho ô: 3 level cho `practice`, 1 bài học cho vai trò còn lại | ≥1 |
| `filled_by` | Mảng mã nội dung đang lấp ô; ô lấp khi đủ `level_quota`, thiếu thì còn nợ | Không |

`template_codes` **không** do người soạn gõ tay — nó lấy từ
`packages/content-build/src/gates/skill-template-affinity.ts`, thứ đã suy được khuôn hợp lệ
cho một kỹ năng bằng giao `thinking_processes` và khoảng tuổi.

Sổ cầu nằm ở `packages/content/src/roadmaps/content-demand.json`, sinh bằng `pnpm derive:demand`
và kiểm bằng `pnpm check:content-demand` (so theo giá trị vì Biome định dạng lại file).

Cách lấp ô là phép tra xác định, không có phép chia lấy dư:

- Ứng viên phải liệt kê đúng `skill_code` của ô và phủ trọn band của ô (`age_min ≤ tuổi thấp
  của band` và `age_max ≥ tuổi cao của band`). Level còn phải có `difficulty` ≤ trần band.
- `practice` lấy level; `introduce`, `review`, `offscreen` lấy bài học. `offscreen` chỉ nhận bài
  có ít nhất một hoạt động không phải `digital_game`.
- Một nội dung chỉ lấp một ô trong một lộ trình (`BR-CRM-09`). Cấp theo thứ tự vai trò
  `introduce` → `practice` → `review` → `offscreen`, trong vai trò theo vị trí tiết; ứng viên xếp
  theo mã (level: độ khó rồi mã).
- Thiếu ứng viên thì ô còn nợ. Cấm — NEVER mượn nội dung của kỹ năng khác để che nợ.

### 7.3 Đo được ngày 2026-09-20 — trạng thái trước khi có spec này

| Đại lượng | Giá trị | Nguồn |
|---|---:|---|
| Game level trong corpus | 6.384 | mã `GL-*` duy nhất trong `packages/` |
| Level có mặt trong một lộ trình | 42 | mô phỏng `seedCurriculumItemsData` |
| Level có mặt trong một bài học | 162 | `ref_code` của activity `digital_game` |
| Bài học | 126 | `packages/content/src/lessons/c*.ts` |
| Bài học có mặt trong một lộ trình | 76 | mô phỏng như trên |
| Kỹ năng trong taxonomy | 443 | `packages/content/src/skills/**` |
| Kỹ năng có ≥1 bài học | 48 | `skill_codes` của lesson |
| Tiết của cả 5 chương trình | 222 | 74 tuần × 3 |
| Band tuổi của bài học | 3-4: 20 · 4-5: 41 · 5-6: 65 | `target_age_*` của lesson |

### 7.4 Vi phạm `BR-CRM-*` của seeder hiện tại

| Chương trình | `BR-CRM-02` tuần lệch 2–4 competency | `BR-CRM-07` share lớn nhất | `BR-CRM-08` competency phủ | `BR-CRM-03` kỹ năng không ôn lại | `BR-CRM-11` kỹ năng mới ở 3 tuần cuối |
|---|---:|---:|---:|---:|---:|
| `CUR-BE3` | 8/8 | 100% | 1/6 | 10/14 | 5 |
| `CUR-BE4` | 8/8 | 100% | 1/6 | 10/14 | 5 |
| `CUR-BE5` | 8/8 | 100% | 1/6 | 10/14 | 5 |
| `CUR-BE6` | 8/8 | 100% | 1/6 | 10/14 | 5 |
| `CUR-J42` | 22/42 | 68,3% | 4/6 | 22/38 | 3 |

Trần của `BR-CRM-07` là 40%; của `BR-CRM-08` là 6/6. Bộ kiểm
`packages/shared/src/curriculum-model.ts` **có** cài đủ `BR-CRM-01..11` và **có** test, nhưng
người gọi nó chỉ là `personal-curriculum.ts` và `publish-checklist.ts` — `seed-master/curricula.ts`
chưa từng gọi. Luật tồn tại, cổng không chạy.

## 8. API contract

Không sở hữu route. Lộ trình publish ra ngoài qua route đã có của
[`curriculum-player.md`](../04-play/curriculum-player.md) và
[`lesson-flow-model.md`](lesson-flow-model.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-LRM-01 — lộ trình là hiện vật được soạn
  When đọc mọi lộ trình published
  Then mỗi lộ trình có một file nguồn trong packages/content/src/roadmaps/
  And không lộ trình nào được dựng bằng cách đọc bảng lessons hay game_levels

Scenario: BR-LRM-02 — cấm gán bằng chỉ số vòng
  When quét packages/content-build/src/seed-master/
  Then không chỗ nào chọn lesson hay game_level bằng phép chia lấy dư
  And mỗi curriculum_item truy ngược được về một ô sổ cầu nêu tên kỹ năng

Scenario: BR-LRM-02 — ca âm, seeder cũ phải đỏ
  Given hàm gán nội dung dùng slotIdx % lessonsList.length
  When chạy cổng lộ trình
  Then cổng trả mã thoát ≠ 0 và nêu tên hàm vi phạm

Scenario: BR-LRM-03 — lộ trình gieo trước level
  When chạy seed-all
  Then bước gieo lộ trình hoàn tất trước bước gieo game level

Scenario: BR-LRM-04 — band khớp
  When kiểm mọi curriculum_item của một lộ trình band 3-4
  Then mọi lesson và game_level của nó khai band 3-4

Scenario: BR-LRM-04 — ca âm, band lệch phải đỏ
  Given một lộ trình band 3-4 có một tiết trỏ bài học band 5-6
  When chạy cổng lộ trình
  Then cổng trả mã thoát ≠ 0 và in mã bài học lệch band

Scenario: BR-LRM-06 — luật sư phạm chạy trước nội dung
  Given một lộ trình vi phạm BR-CRM-08, chỉ phủ 1 trên 6 competency
  When chạy pipeline gieo hạt
  Then pipeline dừng trước bước sinh level
  And không game level nào được sinh trong lần chạy đó

Scenario: BR-LRM-07 — sổ cầu tái sinh xác định
  Given content-demand.json đã commit
  When chạy lại derive-demand trên cùng lộ trình
  Then file sinh ra trùng từng byte với file đã commit

Scenario: BR-LRM-08 — cấm level mồ côi
  Given một game level không có ô nào trong sổ cầu
  When chạy db:seed
  Then không curriculum_item nào trỏ vào level đó

Scenario: BR-LRM-09 — cổng đếm ô
  When cổng độ phủ in báo cáo
  Then báo cáo in số ô đã lấp trên tổng ô
  And báo cáo không dùng tổng số hàng game_levels làm tử số hay mẫu số

Scenario: BR-LRM-11 — prerequisite dưới band được miễn, trong band thì không
  Given một kỹ năng band 4-5 chỉ có prerequisite ở band 3-4
  When cổng lộ trình chạy trên lộ trình 4-5 không chứa prerequisite đó
  Then cổng xanh
  But khi kỹ năng có prerequisite nằm trong band 4-5 mà lộ trình không chứa
  Then cổng đỏ BR-CRM-01 và in mã kỹ năng thiếu
```

## 10. Boundaries

**Always**
- Soạn lộ trình trước, sinh level sau.
- Mỗi ô nêu tên kỹ năng, chủ đề và band.
- Chạy `BR-CRM-01..11` trên bản khai lộ trình trước khi sinh nội dung.
- Commit `content-demand.json` và diff nó như diff code.

**Ask first**
- Đổi số band tuổi khỏi ba band `3-4` · `4-5` · `5-6`.
- Đổi cấu trúc tuần chuẩn của `curriculum-model.md` mục 7.1.
- Cho một ô được lấp bằng nội dung của kỹ năng lân cận.

**Never**
- Chọn nội dung cho một tiết bằng phép chia lấy dư, `LIMIT`, hay thứ tự `id`.
- Để bước gieo lộ trình đọc bảng `game_levels` để tự chọn.
- Sinh game level cho một kỹ năng không có ô nào trong sổ cầu.
- Đếm độ phủ bằng tổng số hàng trong kho.
- Tạo hàng `skills` mới để đặt tên cho một ô lộ trình — ranh giới của `BR-CTM-01`.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | 6.342 level mồ côi xử lý thế nào — giữ làm kho tự chọn, hay soạn lại theo ô? | P4 | Giữ trong kho, gắn `orphan`, không gieo vào lộ trình; soạn lại theo ô ở đợt sau | người quyết |
| 2 | Một band cần bao nhiêu tuần để phủ đủ 6 competency theo `BR-CRM-08` mà không phá `BR-CRM-02`? | P4 | **Đã chốt:** lộ trình 12 tuần đủ phủ 6 competency; chương trình trọn năm là 36 tuần (`BR-LRM-12`) | Nội dung |
| 3 | `CUR-J42` 42 tuần trải cả 3–6 tuổi — nó là một lộ trình hay ba lộ trình nối? | P4 | Ba lộ trình band nối nhau, giữ một mã `RM-J42` làm vỏ | người quyết |
| 4 | Bài học dùng lại được ở hai band không, hay mỗi band một bản? | P4 | Dùng lại được khi khoảng tuổi bài học phủ cả hai band; `BR-PAR-01` vẫn ép trần band nhỏ hơn | Nội dung |
