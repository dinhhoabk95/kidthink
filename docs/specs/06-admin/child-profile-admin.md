---
spec: CHILD-PROFILE-ADMIN
title: Hồ sơ trẻ trên bề mặt quản trị
area: admin
status: draft
mvp: true
phase: P2
reviewed: 2026-08-04
owns:
  - Ranh giới dữ liệu trẻ mà admin thấy được
  - Thao tác vận hành trên hồ sơ trẻ
depends_on:
  - CHILD-DATA-COMPLIANCE
  - USER-DETAIL
---

# Hồ sơ trẻ trên bề mặt quản trị

## 1. Objective

Spec này tồn tại chủ yếu để nói **cái gì admin KHÔNG được thấy**.

Vận hành cần biết một tài khoản có mấy hồ sơ trẻ và trạng thái của chúng, để hỗ trợ và để
thực thi yêu cầu xoá. Vận hành **không** cần biết đứa trẻ học đến đâu.

## 2. Actors

| Actor | Quyền |
|---|---|
| `super_admin` | Xem danh sách, thực thi yêu cầu xoá/lưu trữ |
| `content_reviewer` | Cấm **Không truy cập bất kỳ dữ liệu trẻ nào** |

## 3. Entry points

Nhóm "Hồ sơ trẻ" trong `/users/{uuid}`. Không có trang độc lập —
**không có** `/children` liệt kê toàn bộ trẻ trong hệ thống.

## 4. Main flow

1. Mở [`user-detail.md`](user-detail.md), xem nhóm hồ sơ trẻ.
2. Mỗi hồ sơ hiện: `display_name` · `age_band` · trạng thái · ngày tạo.
3. Thao tác duy nhất: **lưu trữ** hồ sơ theo yêu cầu của phụ huynh, kèm lý do.
4. Mọi lần xem ghi audit.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Yêu cầu xoá của phụ huynh | Đi qua luồng của chính User ([`account-deletion.md`](../03-account/account-deletion.md)), admin không xoá thay |
| Hồ sơ `pending_deletion` | Hiện `purge_at`, không thao tác được |
| Tài khoản `deleted` | Hồ sơ hiện chỉ đọc |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CPA-01` | Cấm — **NEVER trang liệt kê toàn bộ trẻ trong hệ thống** | Một danh sách trẻ em là tài sản dữ liệu không có nhu cầu nghiệp vụ nào biện minh được |
| `BR-CPA-02` | Admin thấy **đúng 4 trường**: `display_name` `age_band` `status` `created_at` | `BR-CDC-14` |
| `BR-CPA-03` | Cấm — **NEVER telemetry, mastery, lịch sử chơi, hay `birth_year` chính xác** | |
| `BR-CPA-04` | `content_reviewer` không truy cập | `BR-CDC-13` |
| `BR-CPA-05` | Mỗi lần xem hồ sơ trẻ ghi `audit_logs` | Truy cập dữ liệu trẻ phải truy được |
| `BR-CPA-06` | Admin **không sửa** được `display_name`, `avatar_id`, hay bất kỳ trường nào | Đó là dữ liệu của phụ huynh |
| `BR-CPA-07` | Admin **không xoá** hồ sơ trẻ; chỉ **lưu trữ** theo yêu cầu | Xoá là quyền của chủ thể dữ liệu, có quy trình 30 ngày |
| `BR-CPA-08` | Cấm — **NEVER tìm kiếm trẻ theo tên** trên bề mặt admin | Tìm được theo tên nghĩa là đã có danh sách |

## 7. Data

### 7.1 Trường hiện ra

| Trường | Hiện | Lý do |
|---|:--:|---|
| `display_name` | | Nói chuyện được với phụ huynh |
| `age_band` | | Ngữ cảnh hỗ trợ |
| `status` | | Vận hành |
| `created_at` | | Vận hành |
| `birth_year` | Cấm | Chi tiết hơn `age_band` mà không thêm giá trị vận hành |
| `avatar_id` | Cấm | |
| `current_curriculum_id` | Cấm | |
| `daily_play_cap_minutes` | Cấm | |
| `uuid` | Cấm hiện dạng rút gọn khi cần đối chiếu log | |
| Mọi dữ liệu học tập | Cấm | `BR-CPA-03` |

### 7.2 Thao tác

| Thao tác | Ai | Lý do bắt buộc |
|---|---|:--:|
| Lưu trữ hồ sơ theo yêu cầu | `super_admin` | |

Chỉ **một** thao tác. Mọi thứ khác đi qua luồng của chính User.

## 8. API contract

### `POST /api/managers/children/{uuid}/archive`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `super_admin` |
| Body | `{ reason }` |
| 200 | |
| 422 | `ADMIN_NOTE_REQUIRED` |

Cấm **Không có** `GET /api/managers/children` — dữ liệu trẻ chỉ đến qua [`user-detail.md`](user-detail.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-CPA-01 — không có endpoint liệt kê trẻ
  When quét mọi route admin
  Then không route nào trả danh sách child_profiles không kèm user_id cụ thể

Scenario: BR-CPA-08 — không tìm được trẻ theo tên
  When quét mọi bộ lọc trên bề mặt admin
  Then không bộ lọc nào nhận tên trẻ làm tham số

Scenario: BR-CPA-02 — đúng 4 trường
  When đọc dữ liệu hồ sơ trẻ trong response user-detail
  Then mỗi hồ sơ có đúng display_name, age_band, status, created_at

Scenario: BR-CPA-03 — không dữ liệu học tập
  When đọc mọi response admin
  Then không response nào chứa mastery, p_learn, hay play_session của trẻ

Scenario: BR-CPA-04 — content_reviewer bị chặn
  Given manager role content_reviewer
  When gọi bất kỳ route nào trả dữ liệu trẻ
  Then trả 403

Scenario: BR-CPA-06 — admin không sửa được hồ sơ trẻ
  When quét route admin
  Then không route nào PATCH child_profiles ngoài archive

Scenario: BR-CPA-07 — admin không xoá được
  When quét route admin
  Then không route nào DELETE child_profiles

Scenario: BR-CPA-05 — xem được audit
  When manager mở user-detail của một user có hồ sơ trẻ
  Then audit_logs có hàng ghi việc truy cập
```

## 10. Boundaries

**Always**
- Giới hạn đúng 4 trường.
- Ghi audit mỗi lần xem.
- Lý do bắt buộc khi lưu trữ.

**Ask first**
- Hiện thêm bất kỳ trường nào.
- Thêm thao tác thứ hai.

**Never**
- Trang liệt kê toàn bộ trẻ.
- Tìm kiếm trẻ theo tên.
- Dữ liệu học tập của một trẻ.
- Admin sửa hoặc xoá hồ sơ trẻ.
- Cho `content_reviewer` truy cập.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Khi hỗ trợ cần đối chiếu một phiên chơi cụ thể thì làm sao, nếu admin không thấy lịch sử? Có thể cần luồng "phụ huynh cấp quyền xem tạm" | Hỗ trợ P2 |
