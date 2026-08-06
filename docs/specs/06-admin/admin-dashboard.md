---
spec: ADMIN-DASHBOARD
title: Bảng điều khiển vận hành
area: admin
status: draft
mvp: true
phase: P2
reviewed: 2026-08-04
owns:
  - Danh sách KPI hiện trên dashboard
  - Ngưỡng cảnh báo trên dashboard
depends_on:
  - ADMIN-AUTH
  - TELEMETRY-PIPELINE
---

# Bảng điều khiển vận hành

## 1. Objective

Một màn hình trả lời **"hôm nay phải làm gì"** trong một lần nhìn.

Đây ❌ **không phải BI**. Nó là danh sách việc: đơn chờ duyệt, nội dung chờ duyệt, cảnh báo
hệ thống. Số liệu tăng trưởng chỉ đủ để biết xu hướng, ❌ không để phân tích sâu.

> Tách khỏi `user-management` có chủ đích. v1 gộp hai thứ vào một spec và không trả lời được
> "phần nào xong". Dashboard chỉ đọc; quản lý User là bề mặt khác, có mutation và có audit
> riêng.

## 2. Actors

| Actor | Thấy gì |
|---|---|
| `super_admin` | Toàn bộ §7 |
| `content_reviewer` | **Chỉ** nhóm nội dung §7.3 |

## 3. Entry points

`/` của admin app. `GET /api/managers/dashboard`.

## 4. Main flow

1. Manager đăng nhập → landing là dashboard.
2. Server gom số liệu từ **bảng rollup**, ❌ không quét bảng thô.
3. Hiện 4 nhóm §7, mỗi thẻ có **link tới nơi hành động**.
4. Thẻ vượt ngưỡng đổi màu cảnh báo.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chưa có dữ liệu | Hiện "chưa có dữ liệu", ❌ không hiện 0 gây hiểu nhầm |
| Rollup chậm | Hiện `as_of` — thời điểm số liệu, ❌ không giả vờ realtime |
| `content_reviewer` | Ẩn hoàn toàn nhóm §7.1, §7.2, §7.4 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-DSH-01` | Dashboard **chỉ đọc**. ❌ Không mutation nào từ màn hình này | Trang tổng quan có nút sửa là chỗ dễ bấm nhầm nhất |
| `BR-DSH-02` | Mỗi thẻ có **link tới nơi hành động** | Số không kèm hành động là số vô dụng |
| `BR-DSH-03` | Đọc từ **rollup**, ❌ không quét `telemetry_events` | `BR-TLM-01` |
| `BR-DSH-04` | Hiện `as_of` khi số liệu không realtime | Số liệu vận hành sai tệ hơn số liệu chậm |
| `BR-DSH-05` | ❌ **NEVER hiện dữ liệu học tập của một trẻ cụ thể** | `BR-CDC-14` |
| `BR-DSH-06` | `content_reviewer` ❌ không thấy số liệu tiền và User | Tách nhiệm vụ |

## 7. Data — bốn nhóm thẻ

### 7.1 Việc cần làm (ưu tiên cao nhất, trên cùng)

| Thẻ | Ngưỡng cảnh báo | Link tới |
|---|---|---|
| Đơn thanh toán chờ duyệt | > 20 hoặc cũ nhất > 24h | `payment-queue` |
| Nội dung chờ duyệt | > 50 | `content-review-queue` |
| Cảnh báo hệ thống đang mở | ≥ 1 | `system-activity` |

### 7.2 Tăng trưởng

User mới 7 ngày · User hoạt động 7 ngày · Child profile hoạt động · Subscription đang hiệu
lực · Doanh thu tháng này. Mỗi thẻ kèm so sánh kỳ trước.

### 7.3 Nội dung

Level `published` · Level `draft` · Lesson `published` · **Skill chưa có level nào** ·
**Level tỉ lệ bỏ > 40%** · **Tuần curriculum chưa đủ hoạt động**.

Ba thẻ sau là đường phản hồi từ dữ liệu về biên soạn — chúng quan trọng hơn ba thẻ đầu.

### 7.4 Hệ thống

Backup gần nhất (`as_of` + trạng thái verify) · Backlog job · Lỗi 5xx 24h · Chi phí LLM
tháng.

## 8. API contract

### `GET /api/managers/dashboard`

| | |
|---|---|
| Auth | `requireManagerAuth()` |
| 200 | `{ as_of, todo: {...}, growth: {...}, content: {...}, system: {...} }` |

`content_reviewer` → chỉ `content` và `as_of`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-DSH-01 — dashboard không có mutation
  When quét mọi lời gọi API từ trang dashboard
  Then không có POST, PATCH, PUT, hay DELETE

Scenario: BR-DSH-03 — không quét bảng thô
  When đọc truy vấn phục vụ dashboard
  Then không truy vấn nào SELECT từ telemetry_events

Scenario: BR-DSH-05 — không hiện dữ liệu một trẻ
  When render dashboard
  Then không có tên trẻ, mastery, hay lịch sử chơi của cá nhân nào

Scenario: BR-DSH-06 — content_reviewer thấy hạn chế
  Given manager role content_reviewer
  When gọi GET /api/managers/dashboard
  Then response chỉ chứa nhóm content và as_of

Scenario: BR-DSH-02 — mọi thẻ có link hành động
  When render dashboard
  Then mỗi thẻ trong nhóm "việc cần làm" có link tới trang xử lý

Scenario: BR-DSH-04 — hiện as_of
  Given rollup chạy lúc 02:00
  When mở dashboard lúc 09:00
  Then hiển thị as_of là 02:00

Scenario: dashboard load nhanh
  Given DB có dữ liệu quy mô MVP
  When gọi API dashboard 50 lần
  Then P95 dưới 500 ms
```

## 10. Boundaries

**Always**
- Đọc từ rollup.
- Kèm link hành động mỗi thẻ.
- Hiện `as_of`.

**Ask first**
- Thêm thẻ KPI.
- Đổi ngưỡng cảnh báo.
- Thêm cache cho dashboard.

**Never**
- Mutation từ dashboard.
- Quét bảng thô.
- Dữ liệu học tập của một trẻ cụ thể.
- Cho `content_reviewer` thấy số liệu tiền.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Doanh thu tháng tính theo đơn `approved` hay theo ngày hiệu lực entitlement? | Kế toán |
| 2 | Có cần biểu đồ xu hướng ngay ở MVP không, hay chỉ số + mũi tên là đủ? | P2 |
