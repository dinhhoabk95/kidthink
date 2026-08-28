---
spec: ENGINE-CONTENT-DEPTH
title: Chiều sâu nội dung mỗi engine — sàn theo bậc thang
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-08-29
owns:
  - Sàn số game level tính trên từng engine
  - Ma trận đa dạng bên trong một engine
  - Bậc thang bật sàn theo phase và luật không tụt
depends_on:
  - GAME-LEVEL-MODEL
  - TEMPLATE-COVERAGE-LEVEL-BATCH
  - CONTENT-SEED-AUTHORING
  - CONTENT-TAGGING
  - THINKING-COVERAGE-MATRIX
  - ENGINE-SPEC-SHEET
---

# Chiều sâu nội dung mỗi engine — sàn theo bậc thang

## 1. Objective

[`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md) đo phủ theo trục
**competency**. Nó trả lời được "sáu năng lực đã phủ chưa" và trả lời đúng. Nó cấm —
NEVER trả lời được câu khác: *"engine này có đủ nội dung để trẻ chơi không"*.

Chênh lệch giữa hai câu đó đo được. Ngày 2026-08-29, corpus seed có 228 game level trên 27
engine, mọi ô của ma trận phủ đều đạt sàn — nhưng **21 engine có 3 hoặc 4 level**, và 17
trong số đó có cả ba level cùng một competency, một giá trị trục `what`, một hoặc hai giá trị
trục `thinking`. Ba level là con số mà bước 4 của mục 4 trong
[`game-template-contract.md`](../01-platform/game-template-contract.md) yêu cầu để *chứng minh
contract dùng được*. Nó là bằng chứng kỹ thuật, và nó đang bị dùng như nội dung sản phẩm.

File này sở hữu sàn theo trục **engine**, và ma trận đa dạng **bên trong** một engine. Nó
cộng thêm vào ma trận phủ competency, cấm — NEVER thay thế.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `content_reviewer` | Đọc bảng thiếu để biết soạn engine nào, band nào tiếp |
| Cổng chiều sâu | — | Chạy trên corpus seed, chặn khi engine tụt dưới sàn của bậc đang bật |
| Người quyết | — | Bật bậc tiếp theo. Bậc là quyết định ngân sách biên soạn, không phải quyết định kỹ thuật |
| Dev | — | Thi công cổng. Cấm — NEVER tự nới sàn để cổng xanh |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `pnpm --filter @mindkid/db check:engine-depth` | Cổng chiều sâu | Chạy trong cổng tự động trước khi merge |
| `packages/db/config/engine-depth.json` | Người quyết | Bậc đang bật và sàn của từng bậc. Ngoài mã nguồn, theo `BR-TCM-11` (ngưỡng cấu hình được) |
| `docs/specs/01-platform/engines/GT-<nnn>.md` mục 6 | Người soạn | Ma trận mục tiêu riêng của engine đó |

## 4. Main flow

1. Cổng đọc corpus seed từ `packages/db/src/seed-content/` và registry engine.
2. Nguồn không đọc được, hoặc có level trỏ tới mã engine không tồn tại, thì cổng **dừng với mã
   thoát khác 0**. Cấm — NEVER nhánh trả danh sách rỗng rồi báo xanh.
3. Cổng nhóm level đã `published` theo `template_code`.
4. Với mỗi engine, cổng tính sáu số ở mục 7.2.
5. Cổng đọc bậc đang bật từ tệp cấu hình, so từng số với sàn của bậc đó.
6. Engine nào thủng thì in tên engine, số hiện có, số còn thiếu, và trục nào thiếu.
7. Có engine thủng thì mã thoát khác 0.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Engine `deprecated` | Không nhận level mới | Không tính vào sàn. Level cũ vẫn chạy nên vẫn tính vào ma trận phủ competency |
| Engine có `banned_age_bands` | `GT-006` cấm band 3-4 và 4-5 | Sàn band tính trên **band hợp lệ của engine**, không phải trên cả ba. Ép ba band cho một engine chỉ hợp lệ ở một band là ép soạn nội dung sai lứa |
| Engine vừa thêm, chưa có nội dung | PR thêm engine | Có 3 level mẫu theo bước 4 của mục 4 trong [`game-template-contract.md`](../01-platform/game-template-contract.md) là đủ merge. Sàn bậc đang bật áp từ PR nội dung **kế tiếp** chạm engine đó |
| Level `draft` hoặc `in_review` | Chưa publish | Không tính. Chiều sâu đếm thứ trẻ mở được |
| Archive làm thủng sàn | Gỡ nội dung sai | Cảnh báo, không chặn — cùng lý do với `BR-TCM-08` (archive làm thủng thì cảnh báo) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ECD-01` (sàn theo engine) | Mỗi engine đang `active` đạt sàn số level của bậc đang bật ở mục 7.3 | Sàn theo competency đã có; nó không thấy được engine rỗng vì engine khác che |
| `BR-ECD-02` (sàn theo band hợp lệ) | Mỗi **band tuổi hợp lệ** của một engine đạt sàn số level của bậc đang bật | 3 level dồn vào một band nghĩa là hai lứa còn lại mở engine ra và không có gì để chơi. `GT-014` `GT-016` `GT-017` `GT-027` đang ở đúng trạng thái đó |
| `BR-ECD-03` (đa dạng trục tư duy) | Mỗi engine phủ số giá trị trục `thinking` tối thiểu của bậc đang bật | Một engine chỉ sinh một tiến trình tư duy là một engine chỉ dùng được một lần trong lộ trình học |
| `BR-ECD-04` (đa dạng trục nội dung) | Mỗi engine phủ số giá trị trục `what` tối thiểu của bậc đang bật, và giá trị phải thuộc từ vựng đóng ở mục 7.1 của [`content-tagging.md`](../01-platform/content-tagging.md) | Đo ngày 2026-08-29: **160 trên 239** lượt gắn trục `what` nằm ngoài 14 giá trị đóng, và 17 engine có đúng **một** giá trị. Đo trên từ vựng trôi thì con số không nói gì |
| `BR-ECD-05` (đa dạng chủ đề) | Mỗi engine phủ số giá trị trục `theme` tối thiểu của bậc đang bật, theo từ vựng ở [`content-theme-registry.md`](content-theme-registry.md) | Trẻ chơi mười màn liên tiếp cùng bối cảnh sẽ chán trước khi kỹ năng hình thành. Đo ngày 2026-08-29: `school` chiếm 84 trên 228 level toàn catalog |
| `BR-ECD-06` (trải độ khó) | Mỗi engine có level ở **≥3 mức** `difficulty` khác nhau từ bậc 2 | Một engine chỉ có một mức khó thì bộ chọn thích ứng ở [`adaptive-engine.md`](../01-platform/adaptive-engine.md) không có gì để chọn giữa |
| `BR-ECD-07` (cửa vào không trả phí) | Mỗi engine có **≥1** level `access_tier` là `free` hoặc `login` | Một engine mà mọi màn đều `premium` thì phụ huynh chưa mua không bao giờ thấy nó tồn tại. Đo hôm nay: chỉ 23 trên 228 level là `free` |
| `BR-ECD-08` (bậc thang một chiều) | Bậc đã bật **cấm — NEVER hạ**. Bật bậc mới là quyết định của người quyết, ghi vào tệp cấu hình kèm ngày | Sàn hạ được là sàn sẽ bị hạ vào đúng hôm cổng đỏ trước một buổi phát hành |
| `BR-ECD-09` (không tụt) | Trong một bậc, PR làm giảm số level của một engine đang đạt sàn thì **bị chặn** | Cùng cơ chế với `BR-TCM-08` (publish làm thủng sàn thì bị chặn) |
| `BR-ECD-10` (báo cáo nêu thiếu bao nhiêu) | Báo cáo in **engine thiếu và thiếu bao nhiêu trên trục nào**, cấm — NEVER in tỉ lệ phần trăm tổng | Một con số 84% che được 21 engine ở mức mẫu. Danh sách engine thiếu thì không che được |
| `BR-ECD-11` (cổng có ca âm) | Cổng phải có test ca âm: bớt một level của engine đang sát sàn phải làm cổng đỏ | Cổng không có ca âm là cổng không biết mình hỏng |
| `BR-ECD-12` (chiều sâu không phải bằng chứng sư phạm) | Số đo ở đây cấm — NEVER dùng làm bằng chứng hiệu quả học tập | Cùng ranh giới mà `BR-TCM-10` và `BR-PED-01` (cấm tuyên bố hiệu quả từ số đo catalog) đã đặt |
| `BR-ECD-13` (band level nằm trong band engine) | Level có `age_min` nhỏ hơn hoặc `age_max` lớn hơn band của engine thì cổng **đỏ** | `BR-GTC-05` (band tuổi của template được ép) có kịch bản nghiệm thu ở mục 9 của [`game-template-contract.md`](../01-platform/game-template-contract.md), nhưng kịch bản đó nói về route studio. Đường seeder không đi qua route đó và tám cổng theo hàng không đối chiếu hai nguồn. Đo ngày 2026-08-29: **42 trên 228 level** vi phạm, trong đó 15 màn `GT-006` gắn cho band mà engine bị cấm |

## 7. Data

**Đọc:** `packages/db/src/seed-content/` · registry engine ·
`packages/db/config/engine-depth.json`.
**Ghi:** không ghi vào database. Đầu ra là báo cáo và mã thoát.

### 7.1 Vì sao nguồn là corpus seed

Cùng lý do đã ghi ở mục 7.0 của
[`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md): cơ sở dữ liệu dev
dùng chung `DATABASE_URL` với test tích hợp và chứa hàng rác do test sinh. Corpus seed tất
định, luôn đọc được, và là thứ đi qua PR review.

### 7.2 Sáu số đo của một engine

| Số đo | Định nghĩa | Đo ngày 2026-08-29 |
|---|---|---|
| `level_count` | Số level `published` dùng engine này | 6 engine ≥21 · 2 engine =6 · 2 engine =4 · 17 engine =3 |
| `min_band_count` | Số level ít nhất trong một band tuổi **hợp lệ** của engine | 4 engine có band trống hoàn toàn |
| `out_of_band_count` | Số level có band nằm ngoài band của engine | **42** trên 228 — `BR-ECD-13` |
| `thinking_span` | Số giá trị trục `thinking` khác nhau | 17 engine =1 |
| `what_span` | Số giá trị trục `what` khác nhau | 17 engine =1; toàn corpus 160 trên 239 lượt gắn ngoài từ vựng |
| `theme_span` | Số giá trị trục `theme` khác nhau | 17 engine ≤3; toàn corpus 100 trên 228 level mang giá trị ngoài từ vựng |
| `difficulty_span` | Số mức `difficulty` khác nhau | 19 engine ≤3 |

### 7.3 Bậc thang

| Số đo | Bậc 0 (đang có) | Bậc 1 | Bậc 2 | Bậc 3 |
|---|:--:|:--:|:--:|:--:|
| `level_count` | ≥3 | ≥6 | ≥12 | ≥20 |
| `min_band_count` | ≥0 | ≥1 | ≥3 | ≥5 |
| `thinking_span` | ≥1 | ≥2 | ≥3 | ≥4 |
| `what_span` | ≥1 | ≥2 | ≥3 | ≥4 |
| `theme_span` | ≥1 | ≥2 | ≥3 | ≥5 |
| `difficulty_span` | ≥1 | ≥2 | ≥3 | ≥4 |
| Chặn từ phase | đang chặn | P4 | P5 | sau go-live |

Bậc 0 là mức hôm nay, ghi ra để `BR-ECD-09` (không tụt) có mốc so. Nó **bằng đúng** hạn ngạch
`BR-TCL-01` của [`template-coverage-level-batch.md`](template-coverage-level-batch.md), đã đạt
trên cả 27 engine ngày 2026-08-29. Hai file không đặt hai sàn khác nhau: file kia sở hữu **lô
một lần** đưa engine từ 0 lên 3; file này sở hữu **sàn không tụt** và các bậc sau đó.

### 7.4 Giá phải trả của mỗi bậc

Tính trên 27 engine `active` và phân bố ngày 2026-08-29:

| Bậc | Level cần thêm | Tổng corpus sau đó |
|---|---:|---:|
| Bậc 1 | 55 | 283 |
| Bậc 2 | 181 | 409 |
| Bậc 3 | 397 | 625 |

Con số này là lý do bậc thang tồn tại. Bật thẳng bậc 2 hôm nay làm đỏ 21 trên 27 engine, và
một cổng đỏ thường trực là một cổng sắp bị tắt.

### 7.5 Ba trục người dùng yêu cầu, ánh xạ về trường nào

| Cách nói | Trường | Từ vựng |
|---|---|---|
| "theo từng độ tuổi" | `age_min` · `age_max` gộp thành band | `3-4` · `4-5` · `5-6` |
| "theo loại bài học" | `what_tags` | 14 giá trị đóng, mục 7.1 của [`content-tagging.md`](../01-platform/content-tagging.md) |
| "theo loại chủ đề tư duy" | `thinking_tags` | 12 giá trị đóng, cùng nguồn |

Trục `theme` là trục thứ tư, chưa đóng, và [`content-theme-registry.md`](content-theme-registry.md)
sở hữu việc đóng nó.

### 7.6 Hình dạng báo cáo

```
check:engine-depth  bậc 1
  27 engine active, 6 đạt, 21 thủng
  GT-014  level 3/6  band 5-6:3 4-5:0  thinking 1/2  what 1/2  theme 3/2  diff 3/2
          thiếu 3 level, trong đó ≥1 cho band 4-5, và ≥1 giá trị thinking mới
  GT-016  level 3/6  ...
  exit 1
```

## 8. API contract

Không có. Cổng chạy lúc build, không route nào đọc nó.

Số đo chiều sâu cấm — NEVER lộ ra bề mặt công khai: trang danh mục ở
[`game-catalog-public.md`](../02-public/game-catalog-public.md) nói về nội dung, không nói về
độ đầy của kho.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ECD-01 — engine dưới sàn level làm cổng đỏ
  Given bậc 1 đang bật và GT-014 có 3 level published
  When chạy check:engine-depth
  Then cổng thoát với mã khác 0
  And báo cáo in "GT-014 level 3/6"

Scenario: BR-ECD-02 — band tuổi hợp lệ bị bỏ trống làm cổng đỏ
  Given GT-014 hợp lệ ở band 4-5 và 5-6
  And mọi level của GT-014 đều ở band 5-6
  When chạy check:engine-depth ở bậc 1
  Then cổng thoát với mã khác 0
  And báo cáo nêu band 4-5 đang trống

Scenario: BR-ECD-02 — band bị cấm không tính vào sàn
  Given GT-006 khai banned_age_bands là 3-4 và 4-5
  And GT-006 có đủ level ở band 5-6
  When chạy check:engine-depth
  Then GT-006 không bị báo thiếu band

Scenario: BR-ECD-04 — giá trị what ngoài từ vựng đóng làm cổng đỏ
  Given một level mang what_tags là "mem"
  And "mem" không thuộc 14 giá trị đóng
  When chạy check:engine-depth
  Then cổng thoát với mã khác 0
  And báo cáo nêu tên tag và file chứa nó

Scenario: BR-ECD-07 — engine toàn premium làm cổng đỏ
  Given mọi level của GT-015 có access_tier là premium hoặc standard
  When chạy check:engine-depth
  Then cổng thoát với mã khác 0
  And báo cáo nêu GT-015 không có cửa vào free hoặc login

Scenario: BR-ECD-13 — level ngoài band engine làm cổng đỏ
  Given GT-006 khai age_min là 5
  And corpus có một level GT-006 với age_min là 4
  When chạy check:engine-depth
  Then cổng thoát với mã khác 0
  And báo cáo nêu mã level và cả hai band

Scenario: BR-ECD-13 — 42 vi phạm hiện có đều bị bắt
  Given corpus seed ngày 2026-08-29
  When chạy check:engine-depth
  Then báo cáo liệt kê đúng 42 level ngoài band
  And không level nào trong số đó bị bỏ qua vì engine của nó đạt sàn

Scenario: BR-ECD-09 — PR làm tụt số level bị chặn
  Given GT-001 đang có 37 level và đạt mọi sàn
  When một PR archive 32 level của GT-001
  Then cổng thoát với mã khác 0

Scenario: BR-ECD-11 — cổng có ca âm
  Given bộ test của cổng chiều sâu
  When đọc danh sách test
  Then có một test bớt một level của engine sát sàn và khẳng định cổng đỏ

Scenario: BR-ECD-10 — báo cáo không in phần trăm tổng
  When chạy check:engine-depth trên corpus thủng
  Then đầu ra không chứa một tỉ lệ phần trăm phủ tổng
  And đầu ra liệt kê từng engine thiếu kèm số còn thiếu

Scenario: nguồn không đọc được thì cổng đỏ, không xanh
  Given thư mục seed-content không tồn tại
  When chạy check:engine-depth
  Then cổng thoát với mã khác 0
  And đầu ra không chứa dòng nào báo đạt sàn
```

## 10. Boundaries

**Always**
- Đo trên corpus seed trong repo.
- Tính sàn band trên band hợp lệ của engine.
- In engine thiếu và thiếu bao nhiêu.
- Giữ ca âm trong bộ test của cổng.

**Ask first**
- Bật bậc tiếp theo.
- Thêm một số đo thứ bảy vào mục 7.2.
- Cho một engine miễn trừ sàn.

**Never**
- Hạ một bậc đã bật.
- Nới sàn để cổng xanh.
- Đếm level `draft` vào chiều sâu.
- Dùng số đo ở đây làm bằng chứng hiệu quả sư phạm.
- Lộ số đo chiều sâu ra bề mặt công khai.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Bậc 2 là 12 hay 20 level mỗi engine? Chênh nhau 216 level phải soạn | Bước 5 ở mục 6 của [`113-game-engine-depth-and-seed-diversity-plan.md`](../../tasks/113-game-engine-depth-and-seed-diversity-plan.md) | P5 | Nội dung |
| 2 | 17 engine đang ở 3 level: nâng hết lên sàn, hay `deprecated` bớt? Nâng hết tốn 181 level ở bậc 2 | Bật bậc 2 | P5 | người quyết |
| 3 | Trục `what` có 160 trên 239 lượt gắn ngoài từ vựng, toàn chữ viết tắt tự phát (`mem`, `cnt`, `shp`, …). Gắn lại tag cho corpus, hay nâng danh sách viết tắt thành từ vựng? Trùng câu hỏi 3 ở mục 11 của [`content-tagging.md`](../01-platform/content-tagging.md) | `BR-ECD-04` không đo được | P4 | người quyết |
| 5 | 42 level vi phạm `BR-ECD-13` đã published, mà bản published bất biến theo `BR-CLC-01`. Sửa band là version mới cho cả 42, hay archive rồi soạn lại cho đúng lứa? Mười lăm màn `GT-006` ở band bị cấm không phải lỗi tag — chúng là nội dung soạn sai lứa | Bật `BR-ECD-13` | P4 | người quyết |
| 4 | `BR-ECD-07` yêu cầu mỗi engine có cửa vào không trả phí. Điều đó đụng thang truy cập ở [`access-ladder.md`](../00-foundation/access-ladder.md) không? Cần đối chiếu trước khi bật bậc 1 | Bật bậc 1 | P4 | người quyết |
