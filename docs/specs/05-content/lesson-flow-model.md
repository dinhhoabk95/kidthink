---
spec: LESSON-FLOW-MODEL
title: Thư viện giáo án master và flow ghi danh — tuổi là đề xuất, không phải khoá
area: content
status: draft
mvp: false
phase: P4
reviewed: 2026-08-29
owns:
  - Quan hệ giữa thư viện giáo án master và một flow ghi danh
  - Vai trò của tuổi là tín hiệu đề xuất, không phải điều kiện ghi danh
  - Điều kiện lắp được một flow từ thư viện
depends_on:
  - LESSON-MODEL
  - CURRICULUM-MODEL
  - CURRICULUM-PLAYER
  - ENTITLEMENT-MODEL
  - ACCESS-LADDER
---

# Thư viện giáo án master và flow ghi danh — tuổi là đề xuất, không phải khoá

## 1. Objective

Quyết định của chủ dự án ngày 2026-08-29: *"sẽ tạo bài giảng master, bài giảng sẽ chỉ là đề
xuất. Còn phụ huynh khi mua gói có thể đăng ký flow các bài giảng này chứ không tính theo tuổi
cố định."*

Mô hình trước đó khoá theo tuổi ở hai chỗ: [`curriculum-player.md`](../04-play/curriculum-player.md)
mục 8 trả **422** khi tuổi trẻ ngoài khoảng của curriculum, và
[`curriculum-model.md`](curriculum-model.md) mục 7 chia năm chương trình theo bốn mốc tuổi.
Hệ quả cho corpus: cầu giáo án bị phân vùng theo band và **không bù chéo được**, nên thiếu 141
tiết dù tổng số chỉ thiếu 45.

File này sở hữu mô hình mới:

| Khái niệm | Nghĩa |
|---|---|
| **Thư viện master** | Toàn bộ lesson `published`. Một kho, không chia theo chương trình |
| **Flow** | Dãy có thứ tự lắp từ thư viện, trẻ ghi danh vào nó |
| **Tuổi** | Tín hiệu **đề xuất** — dùng để xếp hạng gợi ý, cấm — NEVER dùng để chặn ghi danh |
| **Gói** | Quyết định trẻ ghi danh được flow nào, và mở được bao nhiêu tiết trong đó |

Đổi này làm cầu giáo án giảm từ 222 buổi phân vùng xuống **126 tiết dùng chung** — flow dài
nhất mà một trẻ chạy hết. Xem [`lesson-corpus-depth.md`](lesson-corpus-depth.md) mục 7.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Phụ huynh | gói đang hiệu lực | Chọn flow và ghi danh cho trẻ. Cấm — NEVER bị chặn vì tuổi |
| Trẻ | — | Chạy flow đã ghi danh |
| Manager | `content_reviewer` | Dựng flow từ thư viện master. Cấm sửa lesson từ trong flow |
| Bộ đề xuất | — | Xếp hạng flow theo tuổi, tiến độ, và kỹ năng đã thạo |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `GET /api/users/children/{uuid}/flows` | Phụ huynh | Danh sách flow ghi danh được, kèm điểm đề xuất |
| `POST /api/users/children/{uuid}/enrollments` | Phụ huynh | Ghi danh. Route đã có ở [`curriculum-player.md`](../04-play/curriculum-player.md) mục 8; file này bỏ điều kiện tuổi của nó |
| [`curriculum-builder.md`](../06-admin/curriculum-builder.md) | Manager | Lắp flow từ thư viện |

## 4. Main flow

1. Người soạn thêm lesson vào thư viện master qua seeder. Lesson **không** thuộc chương trình
   nào lúc soạn.
2. Manager lắp một flow: chọn dãy lesson từ thư viện, đặt thứ tự.
3. Cổng kiểm flow lắp được: đủ số tiết, không lặp, thứ tự tôn trọng prerequisite.
4. Phụ huynh mua gói, mở trang flow. Bộ đề xuất xếp hạng flow theo tuổi trẻ và kỹ năng đã thạo.
5. Phụ huynh ghi danh. **Tuổi không chặn** — trẻ 3 tuổi ghi danh flow gắn nhãn 5–6 được, hệ
   thống cảnh báo chứ không từ chối.
6. Trẻ chạy flow theo thứ tự. Thang truy cập của [`access-ladder.md`](../00-foundation/access-ladder.md)
   quyết định tiết nào mở được.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Tuổi trẻ ngoài nhãn của flow | Trẻ 3 tuổi ghi danh flow nhãn 5–6 | **Cho ghi danh**, kèm cảnh báo đọc được ở giao diện phụ huynh. Đây là đảo ngược `D-ME` |
| Flow không đủ tiết trong thư viện | Thư viện thiếu | Manager không publish được flow đó. Cổng ở [`lesson-corpus-depth.md`](lesson-corpus-depth.md) chặn |
| Gói không phủ hết tiết của flow | Gói `free` với flow 126 tiết | Ghi danh được; tiết ngoài quyền hiện dạng khoá theo thang truy cập. Không chặn ghi danh |
| Trẻ đã có enrollment `active` | Ghi danh flow thứ hai | Giữ nguyên `409 ALREADY_ENROLLED` — tối đa một flow `active` mỗi trẻ |
| Lesson bị archive khi đang trong flow đã ghi danh | Nội dung gỡ | Flow đã ghi danh ghim version, trẻ chạy tiếp. Flow chưa ghi danh phải lắp lại |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LFM-01` (thư viện là một kho) | Lesson thuộc **thư viện master**, không thuộc riêng một flow. Một lesson xuất hiện trong nhiều flow | Gắn lesson cứng vào một chương trình là lý do cầu bị phân vùng và thiếu 141 thay vì 45 |
| `BR-LFM-02` (tuổi không chặn ghi danh) | Ghi danh cấm — NEVER từ chối vì tuổi trẻ ngoài nhãn của flow | Quyết định của chủ dự án. Trẻ cùng tuổi chênh nhau rất xa về nền, và phụ huynh là người biết con mình |
| `BR-LFM-03` (tuổi là tín hiệu đề xuất) | `target_age_min`/`target_age_max` của lesson và flow dùng để **xếp hạng gợi ý**, và để hiện cảnh báo | Bỏ khoá tuổi không có nghĩa là bỏ thông tin tuổi. Nó chuyển từ điều kiện sang lời khuyên |
| `BR-LFM-04` (cảnh báo đọc được) | Ghi danh lệch nhãn tuổi phải hiện cảnh báo nêu **rõ lệch bao nhiêu**, cấm — NEVER cảnh báo chung chung | "Flow này gợi ý cho trẻ 5–6 tuổi, bé nhà bạn 3 tuổi" là thông tin dùng được. "Có thể không phù hợp" thì không |
| `BR-LFM-05` (không lặp trong một flow) | Một flow cấm — NEVER chứa cùng một lesson hai lần | Lặp làm số tiết đủ mà trẻ học lại y hệt. Dùng lại **giữa** hai flow thì hợp lệ theo `BR-LFM-01` |
| `BR-LFM-06` (thứ tự tôn trọng prerequisite) | Thứ tự lesson trong flow phải thoả `BR-CRM-01` (skill xuất hiện sau mọi prerequisite của nó) | Bỏ khoá tuổi làm thứ tự prerequisite thành **ràng buộc sư phạm duy nhất** còn lại. Nó không được nới theo |
| `BR-LFM-07` (gói quyết định quyền, không quyết định ghi danh) | Gói quyết định tiết nào **mở được**, không quyết định flow nào **ghi danh được** | Phụ huynh phải thấy được toàn bộ lộ trình trước khi quyết mua thêm. Chặn ghi danh làm mất cả đường xem trước |
| `BR-LFM-08` (flow publish được khi lắp đủ) | Flow chỉ `published` khi mọi tiết của nó trỏ tới lesson `published` có thật | Flow có buổi trống là chỗ phụ huynh nhìn thấy đầu tiên. Cùng lập trường `BR-LCD-04` |
| `BR-LFM-09` (đề xuất không thay quyết định người) | Bộ đề xuất xếp hạng, cấm — NEVER tự ghi danh thay phụ huynh | Ghi danh là hành động của người lớn, và nó gắn với tiền |

## 7. Data

**Đọc:** thư viện lesson `published` · định nghĩa flow · hồ sơ trẻ · gói đang hiệu lực.
**Ghi:** `curriculum_enrollments` — bảng đã có, không đổi hình dạng.

### 7.1 Đổi gì so với mô hình cũ

| Điểm | Trước 2026-08-29 | Sau |
|---|---|---|
| Ghi danh khi tuổi ngoài khoảng | **422**, `D-ME` | Cho ghi danh kèm cảnh báo — `BR-LFM-02`, quyết định `D-SI` |
| Lesson thuộc về | Một chương trình | Thư viện master, dùng chung — `BR-LFM-01` |
| Cầu giáo án | 222 buổi phân vùng theo band | **126 tiết dùng chung** — flow dài nhất |
| `program_type = 'age_based'` | Phân loại cứng | Nhãn đề xuất. Chương trình vẫn khai band, nhưng band không chặn |
| Điều kiện sư phạm còn lại | prerequisite cộng band tuổi | **chỉ prerequisite** — `BR-LFM-06` |

### 7.2 Điều kiện lắp được một flow

Flow `published` phải thoả cả bốn:

| # | Điều kiện | Rule |
|---|---|---|
| 1 | Mọi tiết trỏ tới lesson `published` có thật | `BR-LFM-08` |
| 2 | Không lesson nào xuất hiện hai lần | `BR-LFM-05` |
| 3 | Thứ tự thoả prerequisite | `BR-LFM-06` |
| 4 | Chương trình nhãn `age_based` phủ đủ 6 competency | `BR-CRM-08`, không đổi |

### 7.3 Cảnh báo lệch tuổi

Tính bằng khoảng cách từ tuổi trẻ tới khoảng nhãn của flow:

| Lệch | Hiện gì |
|---|---|
| Trong khoảng | Không cảnh báo |
| Lệch 1 tuổi | Ghi chú nhẹ, không chặn nút ghi danh |
| Lệch ≥2 tuổi | Cảnh báo nêu rõ số tuổi lệch, nút ghi danh vẫn bấm được |

Cấm — NEVER thêm bước xác nhận thứ hai. Cảnh báo là thông tin, không phải rào.

## 8. API contract

### `GET /api/users/children/{uuid}/flows`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| 200 | `{ flows: [{ code, title, session_count, age_label, recommend_score, age_gap }] }` |

`age_gap` bằng 0 khi tuổi trẻ trong khoảng nhãn; khác 0 thì giao diện dựng cảnh báo ở mục 7.3.

### `POST /api/users/children/{uuid}/enrollments`

Route đã có ở [`curriculum-player.md`](../04-play/curriculum-player.md) mục 8. File này bỏ **một**
điều kiện lỗi của nó:

| Trước | Sau |
|---|---|
| **422** khi tuổi trẻ ngoài khoảng curriculum (`D-ME`) | Bỏ. Ghi danh thành công, response mang `age_gap` |
| **422** khi không mở được item bắt buộc nào | Giữ nguyên |
| **409** `ALREADY_ENROLLED` | Giữ nguyên |

## 9. Acceptance criteria

```gherkin
Scenario: BR-LFM-02 — trẻ 3 tuổi ghi danh flow nhãn 5-6
  Given một trẻ 3 tuổi và một flow gắn nhãn 5-6
  When phụ huynh gọi POST enrollments
  Then trả 201
  And response mang age_gap khác 0

Scenario: BR-LFM-04 — cảnh báo nêu rõ số tuổi lệch
  Given trẻ 3 tuổi và flow nhãn 5-6
  When phụ huynh mở trang flow
  Then cảnh báo nêu cả tuổi trẻ và khoảng nhãn của flow

Scenario: BR-LFM-05 — flow lặp lesson thì không publish được
  Given một flow chứa LES-0001 ở tiết 3 và tiết 9
  When manager publish flow
  Then trả 422
  And lý do nêu lesson bị lặp

Scenario: BR-LFM-01 — một lesson nằm trong nhiều flow
  Given LES-0001 thuộc CUR-BE3 và CUR-J42
  When kiểm cả hai flow
  Then không vi phạm nào được báo

Scenario: BR-LFM-06 — thứ tự sai prerequisite thì không publish được
  Given một flow đặt skill so sánh trước skill đếm là prerequisite của nó
  When manager publish flow
  Then trả 422

Scenario: BR-LFM-07 — gói không phủ hết flow vẫn ghi danh được
  Given trẻ ở gói free và một flow 126 tiết
  When phụ huynh ghi danh
  Then trả 201
  And tiết ngoài quyền hiện trạng thái khoá, không biến mất

Scenario: BR-LFM-09 — bộ đề xuất không tự ghi danh
  When kiểm mọi đường ghi curriculum_enrollments
  Then mọi đường đều xuất phát từ một request của phụ huynh
```

## 10. Boundaries

**Always**
- Cho ghi danh bất kể tuổi, kèm cảnh báo đọc được.
- Giữ thứ tự prerequisite làm ràng buộc sư phạm.
- Cho một lesson dùng lại giữa nhiều flow.
- Hiện tiết ngoài quyền dạng khoá, không ẩn.

**Ask first**
- Thêm một điều kiện chặn ghi danh mới.
- Đổi ngưỡng cảnh báo lệch tuổi ở mục 7.3.
- Cho một flow bỏ qua `BR-CRM-08`.

**Never**
- Chặn ghi danh vì tuổi.
- Lặp lesson trong cùng một flow.
- Nới thứ tự prerequisite.
- Để bộ đề xuất tự ghi danh.
- Thêm bước xác nhận thứ hai cho cảnh báo lệch tuổi.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Bộ đề xuất xếp hạng flow theo công thức nào? Tuổi, kỹ năng đã thạo, và tiến độ đều là đầu vào hợp lý nhưng trọng số chưa có. Trùng nợ với [`adaptive-engine.md`](../01-platform/adaptive-engine.md) | Trường `recommend_score` ở mục 8 | P4 | Nội dung |
| 2 | Bỏ khoá tuổi thì `BR-CRM-08` (chương trình theo tuổi phủ đủ 6 competency) còn nghĩa gì? Nhãn `age_based` giờ là gợi ý, nhưng luật phủ vẫn treo vào nó | `BR-CRM-08` | P4 | người quyết |
| 3 | Trẻ đang chạy flow rồi phụ huynh muốn đổi sang flow khác: rút rồi ghi danh lại, hay cho phép hai enrollment `active`? Luật một enrollment `active` (`D-MB`) có trước quyết định flow | Luồng đổi flow | P4 | người quyết |
