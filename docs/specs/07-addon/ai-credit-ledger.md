---
spec: AI-CREDIT-LEDGER
title: Sổ credit AI
area: addon
status: draft
mvp: false
phase: P4
reviewed: 2026-08-04
owns:
  - Mô hình credit và sổ ghi
depends_on:
  - ENTITLEMENT-MODEL
  - PAYMENT-FLOW
---

# Sổ credit AI

> **Add-on — ❌ không bán ở MVP.** Đây là **điều kiện tiên quyết** để bán `addon_ai`:
> ❌ không đếm được credit thì ❌ không bán được gói AI.

## 1. Objective

Chi phí LLM là **biến phí theo lượt dùng**. Gộp nó vào thuê bao cố định làm mất kiểm soát chi
phí — một User dùng nhiều gấp 100 lần User trung bình là chuyện bình thường.

Credit là cách duy nhất giới hạn mà ❌ không chặn người dùng bình thường.

## 2. Actors

| Actor | Vai trò |
|---|---|
| User | Mua và tiêu credit |
| Hệ thống | Trừ credit, chặn khi hết |
| Manager | Cấp bù credit tay, có lý do |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ACL-01` | Sổ là **append-only** — mọi giao dịch là một hàng, số dư là **tổng** | Số dư lưu trực tiếp sẽ lệch và ❌ không truy được |
| `BR-ACL-02` | Trừ credit **trước** khi gọi LLM; hoàn lại nếu lời gọi fail | Gọi trước trừ sau cho phép lạm dụng bằng cách huỷ request |
| `BR-ACL-03` | Hết credit → **402**, ❌ không degrade âm thầm | `BR-ENT-07` |
| `BR-ACL-04` | Credit **không hết hạn** ở phiên bản đầu | Credit hết hạn tạo khiếu nại nhiều hơn giá trị nó mang lại |
| `BR-ACL-05` | Trừ credit **nguyên tử**, chống chạy đua | Hai request đồng thời ❌ không được vượt số dư |
| `BR-ACL-06` | Credit ❌ **NEVER mở `access_tier`** | `BR-ENT-08` |
| `BR-ACL-07` | Cấp bù tay ghi `audit_logs` + lý do bắt buộc | |
| `BR-ACL-08` | Chi phí thật (USD) ghi **riêng** với credit tiêu | Credit là đơn vị bán; USD là chi phí. Trộn hai cái làm không tính được biên |
| `BR-ACL-09` | Cảnh báo User khi còn **< 20%** credit | |

## 7. Data

### 7.1 `ai_credit_ledger` — append-only

| Field | Ghi chú |
|---|---|
| `id` | |
| `user_id` | FK |
| `delta` | Dương = nạp, âm = tiêu |
| `reason` | `purchase` \| `usage` \| `manual_grant` \| `refund` |
| `ref_type` `ref_id` | Đơn hàng hoặc `ai_usage_log` |
| `feature` | Khi `reason = usage` |
| `granted_by_manager_id` `grant_reason` | Khi cấp tay |
| `created_at` | |

Số dư: `SELECT SUM(delta) FROM ai_credit_ledger WHERE user_id = ?` — có bảng
`ai_credit_balance` làm cache, đồng bộ trong cùng transaction.

### 7.2 Bảng giá tiêu

| Tính năng | Credit |
|---|---:|
| Tóm tắt báo cáo | 1 |
| Giải thích báo cáo | 1 |
| Gợi ý nội dung | 1 |
| Tìm kiếm ngữ nghĩa | 1 |
| Viết lại hướng dẫn | 2 |

Tỉ lệ **chưa chốt** — §11 Q1.

### 7.3 Luồng trừ

```
BEGIN
  SELECT balance FOR UPDATE
  IF balance < cost THEN ROLLBACK, trả 402
  INSERT ledger (delta = -cost, reason = usage)
  UPDATE balance
COMMIT
  → gọi LLM
  → fail? INSERT ledger (delta = +cost, reason = refund)
```

## 8. API contract

| Route | Ghi chú |
|---|---|
| `GET /api/users/ai/credits` | `{ balance, recent_transactions }` |
| `POST /api/managers/users/{uuid}/ai-credits` | Cấp tay, `super_admin`, lý do bắt buộc |

Mua credit đi qua `payment-flow` như một package.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ACL-01 — số dư là tổng của sổ
  Given user có 5 giao dịch trong sổ
  When tính SUM(delta)
  Then bằng balance trong bảng cache

Scenario: BR-ACL-02 — trừ trước khi gọi LLM
  Given user có 3 credit
  When gọi một tính năng tốn 2 credit
  Then ledger có hàng -2 trước khi request tới provider

Scenario: BR-ACL-02 — hoàn lại khi fail
  Given lời gọi LLM thất bại
  Then ledger có thêm hàng +2 với reason refund
  And số dư trở lại 3

Scenario: BR-ACL-05 — trừ nguyên tử
  Given user có 1 credit
  When hai request đồng thời cùng tốn 1 credit
  Then đúng một request thành công
  And số dư không âm

Scenario: BR-ACL-03 — hết credit trả 402
  Given số dư 0
  When gọi tính năng AI
  Then trả 402
  And không có lời gọi LLM nào phát ra

Scenario: BR-ACL-06 — credit không mở tier
  Given user chỉ có credit AI, không có gói nội dung
  When mở một game premium
  Then trả 403

Scenario: BR-ACL-08 — chi phí USD ghi riêng
  When đọc ai_usage_log và ai_credit_ledger
  Then cost_usd_micros nằm ở usage log
  And ledger chỉ có credit
```

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | **Tỉ lệ trừ credit mỗi loại lời gọi** — cần đo chi phí thật trước khi định giá | Lên catalog |
| 2 | Giá gói credit: bao nhiêu credit cho bao nhiêu tiền? | Lên catalog |
| 3 | Credit không hết hạn có tạo nợ dài hạn không? | Kế toán |
