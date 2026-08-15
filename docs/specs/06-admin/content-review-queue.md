---
spec: CONTENT-REVIEW-QUEUE
title: Hàng đợi duyệt nội dung
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Hàng đợi và thứ tự ưu tiên duyệt
  - Checklist duyệt
depends_on:
  - CONTENT-LIFECYCLE
  - LIVE-PREVIEW
  - GAME-LEVEL-STUDIO
---

# Hàng đợi duyệt nội dung

## 1. Objective

Cổng người giữa "nội dung được **soạn trong studio**" và "trẻ chơi được".

Phạm vi: nội dung `authored_in = 'studio'`. Nội dung nền `authored_in = 'repo_seed'` Cấm
**không** đi qua hàng đợi này — cổng người của nó là PR review, xem
[`01-platform/content-seed-authoring.md`](../01-platform/content-seed-authoring.md) §4.1.

Hàng đợi phải làm việc duyệt nhanh nhất có thể mà không làm nó cẩu thả.

## 2. Actors

| Actor | Làm gì |
|---|---|
| `content_reviewer` · `super_admin` | Duyệt, từ chối |
| Manager soạn nội dung | Gửi `draft → in_review`, không tự chuyển tiếp |

## 3. Entry points

`/studio/review` · `GET /api/managers/content/review-queue` ·
`POST /api/managers/content/{type}/{id}/transition`.

## 4. Main flow

1. Mở hàng đợi, mặc định lọc `in_review`.
2. Chọn một bản → mở màn hình duyệt: **preview engine thật** + checklist §7.2 + metadata.
3. Người duyệt **phải mở preview** trước khi nút duyệt hoạt động.
4. Duyệt → `approved`. Từ chối → `rejected` kèm **lý do bắt buộc**.
5. Lý do từ chối lưu `content_review_log`, hiện lại cho người soạn ở lần sửa sau.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Bản soạn có AI hỗ trợ (`origin = ai_assisted`) | Gắn nhãn rõ ràng; checklist thêm mục "đối chiếu mục tiêu học tập" |
| Bản là version mới của một hàng `authored_in = repo_seed` | Gắn nhãn "tách khỏi seeder"; nhắc sửa seeder file trong repo, Cấm nếu không môi trường dựng mới sẽ mất bản sửa (`BR-CSA-11`) |
| Duyệt xong nhưng chưa publish | Ở `approved`, chờ [`publish-and-version.md`](publish-and-version.md) |
| Người duyệt là người tạo | Cho phép ở MVP (một người), ghi rõ cả hai vai |
| Hàng đợi > 50 | Cảnh báo trên dashboard |
| Bản bị sửa sau khi vào hàng đợi | Quay về `draft`, rời hàng đợi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CRQ-01` | Cấm — **NEVER duyệt theo lô.** Mỗi bản một quyết định | Duyệt hàng loạt là bỏ qua cổng người |
| `BR-CRQ-02` | Nút duyệt **chỉ bật sau khi mở preview** (với game level) hoặc **mở bản xem thử cho người dạy** (với lesson và activity, theo `D-LI`) | Duyệt không xem là duyệt mù |
| `BR-CRQ-03` | Từ chối **bắt buộc lý do** ≥10 ký tự | Từ chối không lý do làm người soạn lặp lại đúng lỗi cũ |
| `BR-CRQ-04` | Bản `origin = ai_assisted` gắn **nhãn rõ ràng** | Người duyệt cần biết để soi kỹ hơn |
| `BR-CRQ-05` | Bản là version mới của hàng `authored_in = repo_seed` gắn **nhãn cảnh báo lệch seeder** | Sửa trong studio mà quên seeder = môi trường dựng mới mất bản sửa (`BR-CSA-11`) |
| `BR-CRQ-06` | Mọi quyết định ghi `content_review_log` + `audit_logs` | Đảm bảo khả năng truy vết và giải trình trách nhiệm của người duyệt theo `BR-AUD-01` đối với mọi quyết định phát hành nội dung |
| `BR-CRQ-07` | Checklist §7.2 hiện **đầy đủ bộ mục của họ thực thể**, không rút gọn theo từng bản (`D-LJ`) | Rút gọn checklist tuỳ tiện là cách bỏ sót có hệ thống |
| `BR-CRQ-08` | Hàng đợi ưu tiên theo §7.1, không theo thứ tự tạo | Nội dung chặn một tuần curriculum quan trọng hơn nội dung lẻ |

## 7. Data

### 7.1 Thứ tự ưu tiên

1. Nội dung nằm trong tuần curriculum **chưa đủ hoạt động**.
2. Nội dung của skill **chưa có level nào published**.
3. Version mới của nội dung đang `published` (bản đang chạy có lỗi cần sửa).
4. Nội dung lẻ, cũ nhất trước.

### 7.2 Checklist duyệt — theo họ thực thể

#### Họ Game Level (`game_levels`)

| Nhóm | Mục |
|---|---|
| **Sư phạm** | Mục tiêu học tập khớp skill đã gắn · độ khó hợp band tuổi · mechanic phù hợp tuổi |
| **Nội dung** | Đáp án đúng và duy nhất · không câu hỏi mơ hồ · vật gây nhiễu hợp lý |
| **Ngôn ngữ** | Câu ngắn, đọc thành tiếng được · từ vựng trong tầm tuổi · không lỗi chính tả/dấu |
| **Hình ảnh** | Emoji/ảnh đúng nghĩa · nhìn rõ ở cỡ thật · không gây sợ |
| **An toàn** | Không nội dung đáng sợ, bạo lực, phân biệt, thương hiệu |
| **Kỹ thuật** | Preview chạy được · asset load đủ · sàn touch đạt |

#### Họ Bài học & Hoạt động (`lessons` · `activities`)

| Nhóm | Mục |
|---|---|
| **Sư phạm** | Khớp learning objectives · cung bậc đầy đủ · thời lượng phù hợp band tuổi |
| **Ngôn ngữ cho trẻ** | Câu nói với trẻ ngắn gọn, tự nhiên · không giả định trẻ biết đọc chữ |
| **An toàn vật liệu** | Đồ dùng sẵn có trong gia đình/lớp · không yêu cầu vật liệu nguy hiểm |
| **Khả thi tại nhà** | Hướng dẫn rõ ràng cho phụ huynh/giáo viên thực hiện |
| **Đánh giá quan sát** | Tiêu chí đánh giá cụ thể qua hành vi quan sát được, không trừu tượng |
| **Vòng đời tham chiếu** | Hoạt động thành phần ở trạng thái published · không mồ côi liên kết |

Người duyệt tick từng nhóm; kết quả lưu `checklist_snapshot`.

### 7.3 Bộ lọc hàng đợi

`entity_type` · `status` · `origin` · `authored_in` · `competency` · `age_band` ·
`created_from/to` · `created_by_manager_id`.

Lọc theo `created_by_manager_id` cho phép xử lý cả một lô của một người soạn cùng lúc — **từ
chối** hàng loạt được, nhưng **duyệt** thì không (`BR-CRQ-01`).

## 8. API contract

### `GET /api/managers/content/review-queue`

200 → `{ items: [{ entity_type, code, version, title, origin, authored_in, competency, age_band, waiting_since }], next_cursor }`. Trần 50.

Hàng đợi **chỉ** chứa `status = in_review`; nội dung `authored_in = repo_seed` chưa từng qua
studio không bao giờ xuất hiện ở đây (§1).

### `POST /api/managers/content/{type}/{id}/transition`

Xem [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §8. Bổ sung: body `{ checklist }` bắt buộc khi `to_status = approved`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CRQ-01 — không duyệt theo lô
  Given hàng đợi có 20 bản
  When mở giao diện hàng đợi
  Then không có nút duyệt tất cả

Scenario: BR-CRQ-02 — phải mở preview trước khi duyệt
  Given một bản trong hàng đợi
  When mở màn hình duyệt và chưa mở preview
  Then nút duyệt bị vô hiệu
  When mở preview
  Then nút duyệt bật

Scenario: BR-CRQ-03 — từ chối bắt buộc lý do
  When từ chối với reason rỗng
  Then trả 422
  And trạng thái không đổi

Scenario: BR-CRQ-04 — bản soạn có AI hỗ trợ có nhãn
  Given một bản origin = ai_assisted
  When mở trong hàng đợi
  Then có nhãn AI hiển thị rõ

Scenario: BR-CRQ-05 — version tách khỏi seeder có nhãn cảnh báo
  Given một game level authored_in = repo_seed đang published
  And manager tạo version mới của nó trong studio
  When bản mới vào hàng đợi
  Then có nhãn cảnh báo lệch seeder
  And nhãn nêu đường dẫn seeder file cần sửa

Scenario: nội dung seed không vào hàng đợi
  Given một batch seed vừa ghi 30 game level published
  When mở hàng đợi duyệt
  Then không bản nào trong 30 bản đó xuất hiện

Scenario: BR-CRQ-08 — ưu tiên nội dung chặn curriculum
  Given hàng đợi có một bản thuộc tuần curriculum thiếu hoạt động
  And nhiều bản lẻ cũ hơn
  Then bản thuộc curriculum xếp trên

Scenario: BR-CRQ-07 — checklist đầy đủ
  When mở màn hình duyệt bất kỳ loại nội dung nào
  Then đủ 6 nhóm checklist hiện ra

Scenario: từ chối hàng loạt một lô cùng người soạn
  Given 30 bản của cùng một created_by_manager_id sai cùng một lỗi
  When lọc theo created_by_manager_id và từ chối hàng loạt kèm lý do
  Then cả 30 bản chuyển rejected
  And mỗi bản có một hàng content_review_log riêng
```

## 10. Boundaries

**Always**
- Bắt buộc mở preview trước khi duyệt.
- Lý do bắt buộc khi từ chối.
- Ghi `checklist_snapshot`.
- Hiện lý do từ chối cho người soạn ở lần sửa sau.

**Ask first**
- Đổi checklist.
- Đổi thứ tự ưu tiên hàng đợi.

**Never**
- Duyệt theo lô.
- Rút gọn checklist theo loại nội dung.
- Duyệt mà không mở preview.
- Từ chối không lý do.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | **Một người duyệt được bao nhiêu bản/ngày?** Đây là ràng buộc thật của đường găng | P2 | Ước tính 30–50 bản/ngày/người ở MVP; bổ sung quy trình mở rộng ở P3 | người quyết |
| 2 | Khi có ≥2 manager, có chặn tự duyệt bản mình tạo không? | P2 | Đã hoãn ở [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) Q1 — MVP 1 manager nên cho phép tự duyệt; khi có ≥2 manager sẽ bật 4-eyes principle | người quyết |
| 3 | Có cần duyệt hai vòng cho nội dung `origin = ai_assisted` không? | P2 | Đã hoãn ở [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) Q5 — MVP 1 vòng duyệt có gắn nhãn `ai_assisted` để soi kỹ checklist | người quyết |
