---
spec: LESSON-EXEMPLAR-SET
title: Bộ tiết học mẫu — chuẩn để đối chiếu
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-08-17
owns:
  - Tiêu chuẩn một tiết học mẫu
  - Ma trận phủ của bộ tiết học mẫu
depends_on:
  - LESSON-MODEL
  - LESSON-SESSION-RUNNER
  - PEDAGOGICAL-EVIDENCE
---

# Bộ tiết học mẫu — chuẩn để đối chiếu

## 1. Objective

[`lesson-model.md`](lesson-model.md) đặt sàn: mọi lesson phải có cung bậc, phải có hoạt động ngoài màn hình,
phải viết cho người lớn không được đào tạo. Sàn trả lời câu "cái này có được phép publish
không". Nó không trả lời câu "cái này trông ra sao khi làm tốt".

**Tiết học mẫu** trả lời câu thứ hai. Nó là bản để đối chiếu — thứ người soạn thứ hai mươi
mở ra trước khi viết bài đầu tiên, và thứ người dùng mới mở ra trước khi tin sản phẩm.

Một tiết học mẫu không phải là một lesson hay hơn một chút. Nó là lesson đã chạy với trẻ
thật, đã ghi lại điều gì xảy ra, và bắc được nhịp giữa hoạt động ngoài màn hình và màn chơi
số — nhịp mà phần lớn lesson viết vội bỏ qua.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn | `content_reviewer` | Đề cử một lesson thành tiết học mẫu |
| Chuyên gia sư phạm mầm non | `content_reviewer` | Duyệt đề cử. Không ai khác duyệt được |
| Người dạy | `requireUserAuth()` | Mở tiết học mẫu, chạy như lesson thường |
| Người soạn mới | — | Đọc tiết học mẫu để biết chuẩn |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/lessons?exemplar=1` | Người dạy | Danh sách bộ tiết học mẫu |
| [`lesson-authoring.md`](../06-admin/lesson-authoring.md) | Người soạn | Nơi đặt cờ đề cử |
| [`content-review-queue.md`](../06-admin/content-review-queue.md) | Chuyên gia | Nơi duyệt đề cử |

## 4. Main flow

1. Một lesson đã publish và đã chạy với trẻ thật theo quy trình playtest của
   [`pedagogical-evidence.md`](../08-quality/pedagogical-evidence.md).
2. Người soạn đề cử nó thành tiết học mẫu, nêu ô nào trong ma trận §7.2 nó lấp.
3. Hệ thống kiểm sáu điều kiện ở §7.1. Thiếu điều kiện nào thì nêu rõ điều kiện đó.
4. Chuyên gia sư phạm mầm non đọc và duyệt.
5. Lesson mang cờ tiết học mẫu, xuất hiện trong danh sách mẫu và trong khuôn soạn bài.
6. Khi chuẩn biên tập đổi, mọi tiết học mẫu vào hàng đợi duyệt lại **trước** các lesson khác.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Ô ma trận đã có mẫu | Đề cử cái thứ hai cho cùng ô | Cho phép, trần 2 mẫu mỗi ô. Vượt trần thì phải gỡ một cái |
| Lesson chưa playtest | Thiếu bằng chứng | Từ chối đề cử, nêu thiếu bằng chứng playtest |
| Lesson thuộc tier trả tiền | Đặt sau cổng thanh toán | Từ chối. Tiết học mẫu luôn ở tier `free` |
| Bản thô do AI sinh | `origin` không phải `human` | Từ chối. Xem `BR-LEX-04` |
| Tiết học mẫu bị archive | Nội dung lỗi thời | Cờ mẫu gỡ cùng lúc. Ô ma trận trở lại trạng thái trống |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LEX-01` | Tiết học mẫu là **cờ trên `lessons`**, không phải bảng riêng | Bảng riêng sinh ra vòng đời thứ hai cho cùng một nội dung, rồi hai bản trôi khỏi nhau |
| `BR-LEX-02` | Tiết học mẫu phải **đã chạy với trẻ thật** và có ghi chép playtest | "Mẫu" mà chưa ai chạy thì là ý tưởng, không phải mẫu. Đây là khác biệt duy nhất đáng giá so với một lesson viết kỹ |
| `BR-LEX-03` | Tiết học mẫu luôn ở tier `free` | Nó là chuẩn để đối chiếu. Chuẩn đặt sau cổng thanh toán thì phần lớn người soạn và người dạy không bao giờ thấy |
| `BR-LEX-04` | `origin` phải là `human` | Bản thô do máy sinh có thể tốt, nhưng nó không dùng làm chuẩn cho máy học lại được — vòng lặp đó khuếch đại lỗi của chính nó |
| `BR-LEX-05` | Mỗi tiết học mẫu **bắc nhịp**: ≥1 hoạt động ngoài màn hình và ≥1 game level, và phần đúc kết nối hai cái đó lại | Đây là kỹ năng khó nhất khi soạn, và là thứ người soạn mới không tự nghĩ ra. Mẫu không thể hiện nó thì mẫu không dạy được gì |
| `BR-LEX-06` | Phần đánh giá của tiết học mẫu kèm **ví dụ đã điền** cho cả ba mức quan sát | `BR-LSM-06` bắt mô tả hành vi quan sát được. Người soạn mới vẫn viết trừu tượng vì chưa thấy bản điền đúng bao giờ |
| `BR-LEX-07` | Bộ mẫu phủ **6 competency × 3 band tuổi**, mỗi ô ≥1 | Đây là chỗ duy nhất trong corpus nội dung mà con số 6 loại hình tư duy được ép thành ràng buộc kiểm được |
| `BR-LEX-08` | Trần **2 mẫu mỗi ô**, tối đa 36 toàn bộ | Bộ mẫu to là bộ mẫu không ai đọc hết, và khi đó nó thành thư viện chứ không còn là chuẩn |
| `BR-LEX-09` | Đổi chuẩn biên tập thì tiết học mẫu **duyệt lại trước** mọi lesson khác | Mẫu sai chuẩn nhân bản cái sai qua mọi bài viết sau nó |
| `BR-LEX-10` | Chỉ chuyên gia sư phạm mầm non duyệt được đề cử | Sàn `BR-LSM` thì kiểm máy được. Câu "cái này có phải mẫu tốt không" thì không |

## 7. Data

**Đọc:** `lessons` · `lesson_activities` · ghi chép playtest.
**Ghi:** cờ mẫu và ô ma trận trên `lessons`.

### 7.1 Sáu điều kiện của một tiết học mẫu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | Đã publish và qua toàn bộ sàn `BR-LSM` | Cổng publish |
| 2 | Có ghi chép playtest với trẻ thật | Máy kiểm có bản ghi |
| 3 | Tier `free` | Máy kiểm |
| 4 | `origin` là `human` | Máy kiểm |
| 5 | Có ≥1 hoạt động ngoài màn hình và ≥1 game level | Máy kiểm |
| 6 | Phần đánh giá có ví dụ điền cho cả ba mức | Chuyên gia đọc |

Năm điều kiện đầu máy kiểm được. Điều kiện 6 và câu hỏi "đây có phải mẫu tốt không" thì
người đọc — đó là lý do `BR-LEX-10` tồn tại.

### 7.2 Ma trận phủ

| | Band 3–4 | Band 4–5 | Band 5–6 |
|---|:--:|:--:|:--:|
| C1 | ≥1 | ≥1 | ≥1 |
| C2 | ≥1 | ≥1 | ≥1 |
| C3 | ≥1 | ≥1 | ≥1 |
| C4 | ≥1 | ≥1 | ≥1 |
| C5 | ≥1 | ≥1 | ≥1 |
| C6 | ≥1 | ≥1 | ≥1 |

18 ô, sàn 18 tiết học mẫu, trần 36. Ô trống là nợ nội dung nhìn thấy được, không phải một
con số ẩn trong báo cáo.

Ma trận này đo **nội dung**. Ma trận đo **toàn bộ catalog** theo trục tư duy nằm ở
[`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md) — hai thứ khác nhau, đừng gộp.

### 7.3 Field

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `is_exemplar` | boolean | Mặc định `false` |
| `exemplar_competency` | text | `^C[1-6]$`, bắt buộc khi `is_exemplar` |
| `exemplar_age_band` | text | `3-4` `4-5` `5-6`, bắt buộc khi `is_exemplar` |
| `exemplar_approved_by` | bigint | FK manager, bắt buộc khi `is_exemplar` |

## 8. API contract

Không sở hữu route. Cờ mẫu đặt qua luồng duyệt của
[`content-review-queue.md`](../06-admin/content-review-queue.md); danh sách đọc qua route lesson sẵn có với tham số lọc.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LEX-02 — chưa playtest thì không thành mẫu
  Given một lesson đã publish nhưng không có ghi chép playtest
  When người soạn đề cử nó thành tiết học mẫu
  Then hệ thống từ chối
  And nêu thiếu bằng chứng playtest

Scenario: BR-LEX-03 — tiết học mẫu luôn miễn phí
  When đọc mọi lesson có is_exemplar bằng true
  Then mọi lesson đó có access_tier là free

Scenario: BR-LEX-04 — bản thô do máy sinh không làm mẫu
  Given một lesson có origin khác human
  When đề cử thành tiết học mẫu
  Then hệ thống từ chối và nêu lý do origin

Scenario: BR-LEX-05 — mẫu phải bắc nhịp hai loại hoạt động
  When đọc mọi tiết học mẫu
  Then mỗi cái có ít nhất một activity ngoài màn hình
  And mỗi cái có ít nhất một activity kiểu game level

Scenario: BR-LEX-07 — ma trận phủ đủ 18 ô
  When đếm tiết học mẫu theo competency và band tuổi
  Then mỗi ô trong 18 ô có ít nhất một tiết học mẫu

Scenario: BR-LEX-08 — trần hai mẫu mỗi ô
  Given ô C1 band 3-4 đã có 2 tiết học mẫu
  When đề cử cái thứ ba cho cùng ô
  Then hệ thống từ chối và yêu cầu gỡ một cái trước

Scenario: BR-LEX-09 — đổi chuẩn thì mẫu duyệt lại trước
  Given chuẩn biên tập lesson vừa đổi
  When mở hàng đợi duyệt lại
  Then mọi tiết học mẫu đứng trên các lesson khác

Scenario: BR-LEX-10 — chỉ chuyên gia duyệt được đề cử
  Given một manager không phải chuyên gia sư phạm mầm non
  When duyệt một đề cử tiết học mẫu
  Then hệ thống trả 403 INSUFFICIENT_ROLE

Scenario: BR-LEX-01 — mẫu là cờ, không phải bảng riêng
  When đọc schema nội dung
  Then không có bảng riêng cho tiết học mẫu
  And cờ nằm trên bảng lessons
```

## 10. Boundaries

**Always**
- Playtest với trẻ thật trước khi đề cử.
- Giữ tiết học mẫu ở tier `free`.
- Cho mỗi mẫu bắc nhịp giữa ngoài màn hình và màn chơi số.
- Duyệt lại mẫu trước khi duyệt lại phần còn lại.

**Ask first**
- Nới trần 2 mẫu mỗi ô.
- Thêm một chiều vào ma trận phủ.
- Cho một mẫu nằm ở tier khác `free`.

**Never**
- Đặt cờ mẫu cho bản thô do máy sinh.
- Dựng bảng riêng cho tiết học mẫu.
- Để một ô ma trận trống mà không ghi thành nợ nội dung.
- Cho người không phải chuyên gia sư phạm mầm non duyệt đề cử.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Ai đóng vai chuyên gia sư phạm mầm non trong `BR-LEX-10`? Trùng nợ ở [`lesson-model.md`](lesson-model.md) §11 câu hỏi 1 và ở [`mvp-scope.md`](../00-foundation/mvp-scope.md) | Toàn bộ luồng duyệt | P4 | người quyết |
| 2 | 18 ô có phải chiều chia đúng không, hay nên chia theo strand cho sát hơn? 41 strand thì trần 36 không đủ | Hình dạng ma trận | P4 | Nội dung |
| 3 | Ghi chép playtest lưu ở đâu? [`pedagogical-evidence.md`](../08-quality/pedagogical-evidence.md) mô tả quy trình nhưng không sở hữu nơi lưu | Điều kiện 2 ở §7.1 | P4 | Nội dung |
