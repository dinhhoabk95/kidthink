---
spec: FEATURE-FLAG-SERVICE
title: Cờ tính năng
area: platform
status: draft
mvp: true
phase: P2
reviewed: 2026-08-04
owns:
  - Hình dạng cờ và phạm vi áp
  - Quy tắc dọn cờ
depends_on:
  - AUDIT-LOG
  - ENTITLEMENT-MODEL
---

# Cờ tính năng

## 1. Objective

Tắt nhanh một tính năng hỏng mà không cần deploy, và bật dần tính năng mới cho một nhóm nhỏ
trước.

Cờ **không phải** cơ chế phân quyền. Quyền là entitlement. Trộn hai thứ tạo ra hai nguồn
sự thật cho cùng một câu hỏi.

## 2. Actors

| Actor | Làm gì |
|---|---|
| Manager `super_admin` | Bật/tắt, có lý do bắt buộc |
| Manager `content_reviewer` | Cấm thấy |
| Ứng dụng | Đọc cờ, cache ngắn |

## 3. Entry points

| Nơi | |
|---|---|
| `feature_flags` bảng | |
| `06-admin/feature-flags.md` | UI |
| `isEnabled(key, ctx)` | Đọc trong code |

## 4. Main flow

1. Cờ khai báo trong code kèm **mặc định an toàn** và **ngày hết hạn**.
2. Manager bật/tắt qua admin, ghi audit kèm lý do.
3. Ứng dụng đọc qua cache TTL 30 giây.
4. Cờ quá hạn → cảnh báo trong dashboard cho tới khi bị dọn.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Cờ không tồn tại | Trả **mặc định an toàn** khai báo trong code, log cảnh báo |
| DB/cache mất | Trả mặc định an toàn |
| Cờ quá hạn 30 ngày | Alert P1 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-FLG-01` | Cờ Cấm — **NEVER dùng thay entitlement** | Hai nguồn sự thật cho "được dùng không" là hai câu trả lời khác nhau |
| `BR-FLG-02` | Mọi cờ có **mặc định an toàn** — thường là `off` | Cờ thiếu mặc định làm sự cố cache thành sự cố tính năng |
| `BR-FLG-03` | Mọi cờ có **ngày hết hạn** khi tạo | Cờ vĩnh viễn là nhánh code chết không ai dám xoá |
| `BR-FLG-04` | Đổi cờ ghi `audit_logs` kèm **lý do bắt buộc** | |
| `BR-FLG-05` | Cấm — **NEVER cờ trên bề mặt trẻ** làm đổi độ khó hay cách tính điểm giữa chừng | Đổi luật giữa lúc trẻ đang chơi |
| `BR-FLG-06` | Cờ Cấm — **NEVER gate ràng buộc tuân thủ** — [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) không có công tắc | |
| `BR-FLG-07` | Chỉ `super_admin` thấy và đổi | |

## 7. Data

| Field | Ghi chú |
|---|---|
| `key` | `snake_case`, khai báo trong code |
| `enabled` | |
| `scope` | `global` \| `user_ids` \| `percentage` |
| `scope_value` | JSONB |
| `default_value` | Mặc định an toàn từ code |
| `expires_at` | Bắt buộc |
| `updated_by_manager_id` `update_reason` `updated_at` | |

### 7.1 Cờ MVP

| Key | Mặc định | Mục đích |
|---|---|---|
| `ai_content_pipeline` | off | Bật pipeline sinh nội dung |
| `payment_soft_unlock` | on | Tắt khi nghi lạm dụng |
| `weekly_progress_email` | off | Bật khi báo cáo tuần sẵn sàng |
| `studio_publish` | on | Tắt khẩn nếu publish gây sự cố |
| `guest_play` | on | Tắt nếu bị lạm dụng |

## 8. API contract

```ts
isEnabled(key: FlagKey, ctx?: { user_id?: number }): Promise<boolean>;
```

`FlagKey` là union type sinh từ khai báo — key lạ không compile.

### `GET /api/managers/feature-flags` · `PATCH /api/managers/feature-flags/{key}`

Body `{ enabled, scope, scope_value, reason }`. `reason` bắt buộc ≥10 ký tự.

## 9. Acceptance criteria

```gherkin
Scenario: BR-FLG-02 — cache mất thì dùng mặc định an toàn
  Given Valkey và DB không truy cập được
  When isEnabled("ai_content_pipeline") được gọi
  Then trả false

Scenario: BR-FLG-04 — đổi cờ ghi audit kèm lý do
  When manager tắt studio_publish
  Then audit_logs có hàng feature_flag_changed
  And reason không rỗng

Scenario: BR-FLG-03 — cờ quá hạn được cảnh báo
  Given một cờ có expires_at đã qua 30 ngày
  Then dashboard admin hiện cảnh báo về cờ đó

Scenario: BR-FLG-01 — cờ không thay entitlement
  When quét mọi lời gọi isEnabled
  Then không lời gọi nào dùng để quyết định quyền truy cập nội dung trả phí

Scenario: BR-FLG-07 — content_reviewer không thấy cờ
  Given manager role content_reviewer
  When gọi GET /api/managers/feature-flags
  Then trả 403

Scenario: BR-FLG-06 — không có cờ tắt tuân thủ
  When liệt kê mọi cờ
  Then không cờ nào gate consent, danh sách đóng field trẻ, hay ràng buộc telemetry
```

## 10. Boundaries

**Always**
- Khai báo cờ trong code kèm mặc định và hạn.
- Ghi audit + lý do khi đổi.

**Ask first**
- Thêm cờ mới.
- Gia hạn một cờ.

**Never**
- Cờ thay entitlement.
- Cờ gate ràng buộc tuân thủ.
- Cờ đổi độ khó trên bề mặt trẻ giữa phiên.
- Cờ không có hạn.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Cờ `percentage` có cần sticky theo user không? Không sticky thì trải nghiệm nhấp nháy | P2 |
