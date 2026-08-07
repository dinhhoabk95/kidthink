---
spec: PDF-EXPORT
title: Xuất PDF
area: addon
status: draft
mvp: false
phase: P4
reviewed: 2026-08-04
owns:
  - Cơ chế render PDF và giới hạn
depends_on:
  - LESSON-PLAN-CREATOR
  - JOB-QUEUE
  - ENTITLEMENT-MODEL
---

# Xuất PDF

> **Add-on — không bán ở MVP.** Đi kèm `addon_lesson_plan`.

## 1. Objective

Giáo viên cần **bản giấy** mang vào lớp. Màn hình không thay được tờ giấy đặt cạnh bàn khi đang
dạy.

## 2. Actors

| Actor | Cần entitlement |
|---|---|
| User | `export_pdf` + quota |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PDF-01` | Render chạy trong **job nền**, không chạy trong request | Render tốn RAM và thời gian; chặn request là hạ instance |
| `BR-PDF-02` | Trừ quota **trước** khi render; hoàn lại nếu fail | `BR-ACL-02` |
| `BR-PDF-03` | File qua **signed URL ≤60 phút** | |
| `BR-PDF-04` | Watermark ở **chân trang** — cấm đặt trên vùng nội dung | Watermark che nội dung làm bản in vô dụng |
| `BR-PDF-05` | Trần **20 trang** mỗi lần xuất | Trên t3.small render dài là rủi ro vận hành |
| `BR-PDF-06` | **Cấm chứa dữ liệu trẻ** trong PDF giáo án | `BR-LPC-09` |
| `BR-PDF-07` | Font nhúng, dấu tiếng Việt hiển thị đúng | Dấu vỡ là lỗi hay gặp nhất khi render PDF tiếng Việt |
| `BR-PDF-08` | File tự xoá sau **7 ngày** | Dung lượng |
| `BR-PDF-09` | Render fail → thông báo + **hoàn quota** | |

## 7. Data

### 7.1 Loại xuất được

| Loại | Nội dung |
|---|---|
| Giáo án cá nhân | Khung + hoạt động + ghi chú |
| Worksheet | Một trang A4 |
| Lộ trình cá nhân | Bảng tuần × buổi |

### 7.2 Bố cục PDF giáo án

Đầu trang: tiêu đề · độ tuổi · thời lượng · vật liệu.
Thân: từng hoạt động — tên, thời lượng, hướng dẫn, câu nói với trẻ.
Chân: watermark nhẹ + số trang + ngày xuất.

### 7.3 `export_jobs`

`id` · `uuid` · `user_id` · `kind` · `ref_id` · `status` (`queued`\|`processing`\|`done`\|`failed`)
· `file_path` · `page_count` · `expires_at` · `error` · `created_at`.

## 8. API contract

| Route | Ghi chú |
|---|---|
| `POST /api/users/exports` | Body `{ kind, ref_id }`. 202 → `{ job_uuid }` |
| `GET /api/users/exports/{uuid}` | Trạng thái + signed URL khi xong |

403 `ENTITLEMENT_REQUIRED` · 402 `QUOTA_EXCEEDED` · 422 vượt trần trang.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PDF-01 — render trong job nền
  When gọi POST /api/users/exports
  Then trả 202 ngay
  And render diễn ra ở worker

Scenario: BR-PDF-02 — hoàn quota khi fail
  Given render thất bại
  Then quota export_pdf được hoàn lại
  And user thấy thông báo lỗi

Scenario: BR-PDF-07 — dấu tiếng Việt đúng
  Given một giáo án có tiêu đề "Bé đếm quả táo"
  When render PDF
  Then mọi dấu hiển thị đúng, không ô vuông

Scenario: BR-PDF-04 — watermark không che nội dung
  When kiểm PDF xuất ra
  Then watermark chỉ ở chân trang

Scenario: BR-PDF-05 — trần số trang
  Given một giáo án render ra 25 trang
  When xuất
  Then trả 422

Scenario: BR-PDF-03 — link hết hạn
  Given một file đã xuất
  When mở URL sau 61 phút
  Then bị từ chối

Scenario: BR-PDF-06 — không chứa dữ liệu trẻ
  When đọc nội dung PDF giáo án
  Then không có tên hay tiến độ của trẻ nào

Scenario: BR-PDF-08 — file tự xoá
  Given một file xuất 8 ngày trước
  When job dọn chạy
  Then file không còn trên S3
```

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Puppeteer tốn ~300MB RAM mỗi instance — chạy được trên t3.small cùng web và worker không? | P4 hạ tầng |
| 2 | Quota export mỗi tháng là bao nhiêu? | Lên catalog |
