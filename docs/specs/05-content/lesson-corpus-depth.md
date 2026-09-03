---
spec: LESSON-CORPUS-DEPTH
title: Chiều sâu corpus giáo án — cung buổi học so với cầu của chương trình
area: content
status: implemented
mvp: false
phase: P4
reviewed: 2026-08-30
owns:
  - Quan hệ cung cầu giữa số tiết flow đòi và số lesson trong thư viện master
  - Cầu game level suy ra từ kỹ năng của thư viện giáo án
  - Cổng chặn khi thư viện không đủ để lắp flow dài nhất
depends_on:
  - LESSON-FLOW-MODEL
  - CURRICULUM-MODEL
  - LESSON-MODEL
  - LESSON-TEMPLATE-VARIETY
  - ENGINE-CONTENT-DEPTH
  - GO-LIVE-READINESS
---

# Chiều sâu corpus giáo án — cung buổi học so với cầu của chương trình

## 1. Objective

[`curriculum-model.md`](curriculum-model.md) sở hữu ràng buộc sư phạm khi dựng một chương
trình. [`lesson-model.md`](lesson-model.md) sở hữu ràng buộc biên tập của một tiết.
[`lesson-flow-model.md`](lesson-flow-model.md) sở hữu quan hệ giữa thư viện master và một
flow. Không spec nào sở hữu câu cuối: **thư viện có đủ tiết để lắp flow dài nhất không**.

### 1.1 Cầu tính theo flow dài nhất, không theo band

Quyết định của chủ dự án 2026-08-29 (`D-SI`, ghi ở mục 7.1 của
[`lesson-flow-model.md`](lesson-flow-model.md)): giáo án là **thư viện master dùng chung**, và
tuổi là đề xuất chứ không phải khoá. Hệ quả trực tiếp cho phép tính cầu:

| Mô hình | Công thức cầu | Kết quả |
|---|---|---|
| Trước — chương trình khoá theo tuổi | Cộng mọi buổi, phân vùng theo band, cấm bù chéo | 222 buổi, thiếu **141** |
| Sau — thư viện master, flow dùng chung | **Flow dài nhất**, vì lesson dùng lại được giữa các flow | 126 tiết, thiếu **45** |

Chương trình 42 tuần `CUR-J42` là flow dài nhất: 42 × 3 = **126 tiết**. Bốn flow 8 tuần còn
lại mỗi cái 24 tiết, và chúng rút từ cùng thư viện, nên không cộng thêm cầu.

Bỏ khoá tuổi xoá 96 tiết khỏi món nợ nội dung. Đó không phải nới ngưỡng — nó là hệ quả số học
của việc bỏ phân vùng không bù chéo được.

### 1.2 Hai số cầu, đo ngày 2026-08-29

| Số đo | Giá trị |
|---|---|
| Cầu tiết — flow dài nhất `CUR-J42` | **126** |
| Cung — lesson `published` trong thư viện | **81** |
| **Thiếu tiết** | **45** |
| Cầu game level — kỹ năng của thư viện cần ≥2 level mỗi kỹ năng | xem mục 7.4 |
| **Thiếu level** | **48** |

Hai con số 45 và 48 là toàn bộ món nợ nội dung của trục giáo án cho go-live.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `content_reviewer` | Đọc bảng thiếu để biết còn thiếu bao nhiêu tiết và kỹ năng nào chưa đủ level |
| Cổng cung cầu | — | Tính cầu từ cấu hình chương trình, đếm cung từ corpus, chặn khi thiếu |
| Người quyết | — | Đổi `durationWeeks` hoặc `sessionsPerWeek` của flow dài nhất. Đó là quyết định sản phẩm |
| Manager | `content_reviewer` | Lắp flow trong studio. Cấm publish flow chưa đủ giáo án |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `pnpm --filter @mindkid/db check:lesson-supply` | Cổng cung cầu | Chạy trong cổng tự động trước khi merge |
| `packages/db/src/seed-master/curricula.ts` | Dev | Nguồn của cầu: `durationWeeks × sessionsPerWeek` |
| `packages/db/src/seed-content/lessons/` | Người soạn | Nguồn của cung |
| [`curriculum-builder.md`](../06-admin/curriculum-builder.md) | Manager | Studio phải chặn publish khi thiếu |

## 4. Main flow

1. Cổng đọc mọi flow `published` và lấy **cầu tiết** bằng `max(durationWeeks × sessionsPerWeek)`.
2. Cổng đếm lesson `published` trong thư viện master để có **cung tiết**. Không phân theo band.
3. Cổng lấy tập kỹ năng xuất hiện trong thư viện, đếm số game level `published` phục vụ từng
   kỹ năng, và tính **cầu level** theo `BR-LCD-10`.
4. Nguồn nào không đọc được thì cổng **dừng với mã thoát khác 0**. Cấm — NEVER coi là đủ.
5. Cổng in bốn số: cầu tiết, cung tiết, kỹ năng thiếu level, level cần soạn thêm.
6. Thiếu tiết hoặc thiếu level thì mã thoát khác 0.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Chương trình `draft` | Chưa publish | Không tính vào cổng. Cầu chỉ tính trên chương trình trẻ đăng ký được |
| Một lesson nằm trong nhiều flow | `BR-LFM-01` cho phép | Đếm **một lần** vào cung. Đây là lý do cầu là flow dài nhất chứ không phải tổng mọi flow |
| Flow dài nhất đổi `durationWeeks` | Người quyết rút ngắn | Cầu giảm. Cổng đo lại. Đây là đường hợp lệ duy nhất để giảm cầu |
| Lesson `archived` | Gỡ nội dung | Cung giảm. Nếu thủng thì cảnh báo, không chặn — cùng lý do `BR-TCM-08` |
| Thư viện đủ tiết nhưng lệch kỹ năng | Đủ 126 tiết, thiếu tiết cho một cùm kỹ năng | Cổng đỏ ở phép kiểm thứ hai: flow phải lắp được **và** thoả prerequisite (`BR-LFM-06`). Đủ số không thay được đúng thứ tự |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LCD-01` (đủ giáo án mới publish flow) | Flow `published` phải có **đủ** lesson cho mọi tiết của nó | Trẻ đăng ký `CUR-J42` mà corpus hết nội dung ở tuần chín là một lời hứa không giữ được, và phụ huynh đã trả tiền cho 42 tuần |
| `BR-LCD-02` (cầu là flow dài nhất) | Cầu bằng số tiết của **flow dài nhất** đang `published`, cấm — NEVER cộng dồn mọi flow, cấm phân vùng theo band | Lesson dùng lại được giữa các flow theo `BR-LFM-01`, nên cộng dồn là đếm trùng. Bản trước của rule này phân vùng theo band và cấm bù chéo; nó bị bãi bỏ cùng quyết định `D-SI` |
| `BR-LCD-03` (đếm lesson published) | Chỉ đếm lesson `published`. Bản `draft` và `in_review` không tính | Cùng lập trường với `BR-ECD` và `BR-TCM`: đếm thứ trẻ mở được |
| `BR-LCD-04` (mỗi buổi một lesson thật) | Mỗi buổi của chương trình trỏ tới **một** lesson có thật, cấm — NEVER ô trống, cấm lesson giữ chỗ | Buổi trống trong lịch học là chỗ phụ huynh nhìn thấy đầu tiên |
| `BR-LCD-05` (không nhân bản để đủ số) | Cấm — NEVER lấp tiết bằng cách lặp lại cùng một lesson trong **cùng một** flow. Trùng `BR-LFM-05` | Lặp lesson làm số đếm xanh mà trẻ học lại y hệt. Dùng lại **giữa** hai flow thì hợp lệ |
| `BR-LCD-06` (cổng đỏ khi nguồn hỏng) | Nguồn không đọc được thì đỏ, cấm giá trị mặc định | Bài học `BR-TCM-03` đã trả giá: trả rỗng khi mất kết nối rồi báo mã thoát 0 |
| `BR-LCD-07` (giảm cầu là quyết định người) | Giảm `durationWeeks` hoặc `sessionsPerWeek` để cổng xanh **cần người quyết**, ghi vào PR kèm lý do | Rút chương trình 42 tuần xuống 12 tuần là đổi sản phẩm, không phải sửa cổng |
| `BR-LCD-08` (báo cáo nêu thiếu bao nhiêu) | Báo cáo in từng chương trình kèm số buổi còn thiếu, cấm — NEVER in tỉ lệ phần trăm tổng | Một con số 36% che được việc `CUR-J42` thiếu 126 buổi |
| `BR-LCD-09` (cổng có ca âm) | Cổng có test: bớt một lesson khi thư viện đang sát cầu phải làm cổng đỏ | Cổng không có ca âm là cổng không biết mình hỏng |
| `BR-LCD-10` (mỗi kỹ năng của giáo án có ≥2 level) | Mỗi skill xuất hiện trong thư viện giáo án phải có **≥2** game level `published` phục vụ nó | Mỗi bài học có đúng hai bước chơi và `BR-LTV-02` cấm hai bước cùng khuôn, nên một kỹ năng có dưới hai level thì bài học của nó không lắp được. Đo 2026-08-29: 23 trên 40 kỹ năng có **0** level, 2 kỹ năng có 1 |
| `BR-LCD-11` (soạn level, không nối bừa) | Kỹ năng thiếu level thì **soạn thêm level**, cấm — NEVER nối bước chơi vào level của kỹ năng khác cho đủ số | Quyết định của chủ dự án 2026-08-29. Nối bừa là đúng nguyên nhân của 151 trên 162 liên kết sai kỹ năng hiện nay |

## 7. Data

**Đọc:** `packages/db/src/seed-master/curricula.ts` · `packages/db/src/seed-content/lessons/`.
**Ghi:** không ghi database. Đầu ra là báo cáo và mã thoát.

### 7.1 Công thức cầu

```
cầu tiết = max( durationWeeks × sessionsPerWeek ) trên mọi flow published
```

Lấy **max**, không lấy tổng. Lesson dùng lại được giữa các flow (`BR-LFM-01`), nên một tiết
trong thư viện phục vụ được nhiều flow cùng lúc. Cộng dồn là đếm trùng.

Đo 2026-08-29: `CUR-J42` 42 × 3 = **126**. Bốn flow còn lại mỗi cái 24, đều nhỏ hơn.

### 7.2 Công thức cung

```
cung = số lesson published trong thư viện master
```

Không phân theo band. Tuổi là nhãn đề xuất (`BR-LFM-03`), không phải khoá phân vùng.

Đo 2026-08-29: **81**. Thiếu **45** tiết.

### 7.3 Vì sao không còn bảng phân vùng theo band

Bản trước của file này có bảng chia 126 tiết của `CUR-J42` thành 42/42/42 theo ba band, cộng
với cầu của bốn flow 8 tuần, ra 222 buổi và thiếu 141. Bảng đó dựa trên hai giả định nay đã bị
bác:

| Giả định cũ | Trạng thái |
|---|---|
| Trẻ bị khoá vào flow đúng tuổi | Bác — `BR-LFM-02`, quyết định `D-SI` |
| Lesson của band này không lấp được tiết của band kia | Bác — `BR-LFM-01`, thư viện dùng chung |

Câu hỏi mở về mốc chuyển band của `CUR-J42` cũng đóng theo: không còn mốc chuyển band nào để
chốt, vì flow không phân vùng theo band nữa.

### 7.4 Cầu game level suy ra từ kỹ năng của thư viện

Mỗi bài học có đúng hai bước chơi, và `BR-LTV-02` cấm hai bước cùng `template_code`. Nên mỗi
kỹ năng xuất hiện trong thư viện cần **≥2** game level phục vụ nó.

Đo 2026-08-29 trên 81 lesson:

| Số đo | Giá trị |
|---|---:|
| Kỹ năng xuất hiện trong thư viện giáo án | 40 |
| Kỹ năng có **0** level phục vụ | **23** |
| Kỹ năng có 1 level | 2 |
| Kỹ năng có ≥2 level | 15 |
| **Level cần soạn thêm để mọi kỹ năng đạt ≥2** | **48** |

<!-- taxonomy-refs:historical — phép đo 2026-08 dùng mã taxonomy v1 đã bỏ; giữ nguyên để bản ghi đúng -->
Mười ca thiếu đầu tiên: `C1.CNT.01` `C1.CNT.02` `C1.CNT.03` `C1.CNT.11` `C2.POS.01` `C2.2D.01`
`C2.2D.02` `C3.PAT.01` `C4.LEN.01` `C4.WGT.01` — toàn kỹ năng nền, không phải kỹ năng hiếm.

Con số 48 tính trên thư viện **hiện tại**. Thư viện lên 126 tiết sẽ kéo theo kỹ năng mới, và
mỗi kỹ năng mới cộng thêm 2 level. Vì vậy 48 là **sàn**, không phải tổng cuối.

### 7.5 Vì sao soạn thêm level chứ không nối lại

Quyết định của chủ dự án 2026-08-29: **soạn thêm level**.

Đường thay thế là nối lại 151 bước chơi vào level đã có. Nó rẻ hơn nhưng chỉ làm được ở 15
kỹ năng đang có ≥2 level; 25 kỹ năng còn lại không có level đúng để nối vào. Nối bừa vào level
kỹ năng khác chính là nguyên nhân của 151 liên kết sai hiện nay — `BR-LCD-11` cấm lặp lại.

### 7.6 Hình dạng báo cáo

```
check:lesson-supply
  cầu tiết   126  (flow dài nhất: CUR-J42)
  cung tiết   81                              thiếu 45    CHẶN

  kỹ năng thư viện cần   40
    0 level   23    1 level   2    >=2 level   15
  level cần soạn thêm    48                              CHẶN
  exit 1
```

## 8. API contract

Không có. Cổng chạy lúc build.

Bề mặt người dùng cấm — NEVER lộ số buổi còn thiếu. Trang chương trình ở
[`program-showcase.md`](../02-public/program-showcase.md) nói về nội dung, không nói về độ đầy
của kho.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LCD-01 — thư viện thiếu tiết bị chặn
  Given CUR-J42 khai 42 tuần và 3 buổi mỗi tuần
  And thư viện có 81 lesson published
  When chạy check:lesson-supply
  Then cổng thoát với mã khác 0
  And báo cáo in "cầu tiết 126" và "thiếu 45"

Scenario: BR-LCD-02 — cầu lấy max, không cộng dồn
  Given 5 flow published với 24, 24, 24, 24 và 126 tiết
  When chạy check:lesson-supply
  Then cầu tiết bằng 126
  And không bằng 222

Scenario: BR-LCD-02 — lesson không bị phân vùng theo band
  Given một lesson nhãn 5-6 và một flow đang thiếu tiết
  When chạy check:lesson-supply
  Then lesson đó vẫn tính vào cung
  And không phép kiểm nào so band của lesson với band của flow

Scenario: BR-LCD-10 — kỹ năng dưới 2 level làm cổng đỏ
  Given C1.CNT.02 xuất hiện trong thư viện giáo án
  And không game level published nào phục vụ C1.CNT.02
  When chạy check:lesson-supply
  Then cổng thoát với mã khác 0
  And báo cáo nêu C1.CNT.02 kèm số level còn thiếu

Scenario: BR-LCD-04 — tiết không có lesson bị chặn
  Given một flow published có một tiết không trỏ lesson nào
  When chạy check:lesson-supply
  Then cổng thoát với mã khác 0

Scenario: BR-LCD-05 — lặp lesson trong cùng flow bị chặn
  Given CUR-BE3 trỏ cùng một lesson ở tiết 3 và tiết 7
  When chạy check:lesson-supply
  Then cổng thoát với mã khác 0
  And lý do nêu lesson bị lặp

Scenario: BR-LCD-05 — dùng lại giữa hai flow thì hợp lệ
  Given LES-0001 xuất hiện trong CUR-BE3 và CUR-J42
  When chạy check:lesson-supply
  Then không vi phạm nào được báo

Scenario: BR-LCD-06 — nguồn không đọc được thì đỏ
  Given thư mục lessons không tồn tại
  When chạy check:lesson-supply
  Then cổng thoát với mã khác 0
  And không dòng nào báo đủ

Scenario: BR-LCD-09 — cổng có ca âm
  When đọc bộ test của cổng cung cầu
  Then có một test bớt một lesson khi thư viện sát cầu và khẳng định cổng đỏ
```

## 10. Boundaries

**Always**
- Tính cầu bằng `max(durationWeeks × sessionsPerWeek)` trên mọi flow, không hệ số hao hụt.
- Đếm cung trên toàn thư viện, không phân theo band.
- In số tiết còn thiếu và số level còn thiếu.
- Đỏ khi nguồn không đọc được.

**Ask first**
- Đổi `durationWeeks` hoặc `sessionsPerWeek` của flow dài nhất.
- Đổi sàn 2 level mỗi kỹ năng ở `BR-LCD-10`.
- Cho một flow publish khi còn thiếu tiết.

**Never**
- Cộng dồn cầu của mọi flow.
- Phân vùng cung theo band tuổi.
- Lặp lesson trong cùng một flow để đủ số.
- Nối bước chơi vào level sai kỹ năng cho đủ số.
- Tiết trống hoặc lesson giữ chỗ.
- Lộ số buổi còn thiếu ra bề mặt công khai.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Tỉ lệ phân bổ band của `CUR-J42` chia đều 14 tuần mỗi band — mốc chuyển band theo tuần hay theo tuổi thật?~~ **Đóng 2026-08-29 (T113, `D-SI`)**: không còn mốc chuyển band nào để chốt. Thư viện master dùng chung và tuổi là đề xuất, nên flow không phân vùng theo band — xem mục 7.3 | — | Đã đóng | D-SI |
| 2 | 141 giáo án còn thiếu soạn trong bao lâu, và ai soạn? Trùng nợ ở câu hỏi 1 mục 11 của [`lesson-model.md`](lesson-model.md) | Lịch go-live trục giáo án | P4 | người quyết |
| 3 | `BR-LFM-05` cho một lesson dùng lại giữa hai flow, nhưng nếu một phụ huynh cho trẻ chạy lần lượt `CUR-BE5` rồi `CUR-BE6` thì trẻ gặp lại tiết đã học. Có cần luật "hai flow cùng nhãn tuổi giao nhau không quá k%" không? | Chất lượng trải nghiệm khi mua nhiều gói | P5 | Nội dung |
| 4 | Con số 48 level tính trên thư viện 81 tiết. Thư viện lên 126 tiết kéo theo kỹ năng mới, mỗi kỹ năng cộng 2 level. Ước lượng tổng level phải soạn cần biết 45 tiết mới phủ thêm bao nhiêu kỹ năng — chỉ đo được sau khi chốt danh sách tiết mới | Kế hoạch biên soạn level | P4 | Nội dung |
