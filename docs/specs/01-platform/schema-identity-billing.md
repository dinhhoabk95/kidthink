---
spec: SCHEMA-IDENTITY-BILLING
title: Schema — danh tính, thanh toán, vận hành
area: platform
status: draft
mvp: true
phase: P0
reviewed: 2026-08-05
owns:
  - Định nghĩa cột module identity, billing, ops
depends_on:
  - DATA-MODEL-OVERVIEW
  - ACTORS
  - ENTITLEMENT-MODEL
  - PAYMENT-FLOW
---

# Schema — danh tính, thanh toán, vận hành

## 1. Objective

Định nghĩa cột cho ba module: `identity`, `billing`, `ops`. Quy tắc chung ở
[`data-model-overview.md`](./data-model-overview.md) — file này ❌ không lặp lại.

## 2. Actors

Dev. Spec tham chiếu kỹ thuật.

## 3. Entry points

`packages/db/src/schema/identity.ts` · `billing.ts` · `ops.ts`.

## 4. Main flow

Không có. Spec cấu trúc.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SIB-01` | ❌ **NEVER cột `role`/`persona`/`tier` trên `users`** | `actors` `BR-ACT-05` |
| `BR-SIB-02` | `entitlements.entitlement_key` là **FK thật** tới `entitlement_keys` | Sai chính tả bị chặn ở FK |
| `BR-SIB-03` | `payment_orders.amount_vnd` là **snapshot** lúc tạo đơn | Giá đổi sau ❌ không ảnh hưởng đơn đã tạo |
| `BR-SIB-04` | 4 bảng auth phụ polymorphic → **bắt buộc** test bắt orphan | `data-model-overview` `BR-DM-04` |
| `BR-SIB-05` | `password_hash` argon2id; ❌ **NEVER** cột mật khẩu dạng khác | |
| `BR-SIB-06` | `consent_logs` · `audit_logs` INSERT-only, ép bằng quyền DB | |
| `BR-SIB-07` | `users.email` UNIQUE **case-insensitive** (`citext` hoặc index trên `lower()`) | `A@x.com` và `a@x.com` là một người |
| `BR-SIB-08` | `users.password_hash` **nullable** — tài khoản chỉ có SNS là hợp lệ | `BR-AUT-16` `BR-SCL-08`. Bất biến thay thế là `login_methods ≥ 1` (`BR-SLK-04`), ép ở tầng service ❌ không ở cột |
| `BR-SIB-09` | `social_identities` có **hai** UNIQUE: `(provider, provider_user_id)` và `(user_id, provider)` | Cái thứ nhất chặn một tài khoản SNS gắn hai User; cái thứ hai chặn hai tài khoản SNS cùng provider trên một User (`BR-SLK-02`) |
| `BR-SIB-10` | `social_identities` ❌ **NEVER có cột token** của nhà cung cấp | `BR-OAP-07`. Cột ❌ không tồn tại thì ❌ không rò được |
| `BR-SIB-11` | Xoá `users` **cascade** xoá `social_identities` | Danh tính mồ côi làm `UNIQUE (provider, provider_user_id)` chặn người dùng đăng ký lại sau khi đã xoá tài khoản |

## 7. Data

### 7.1 `users`

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigserial | PK |
| `uuid` | uuid | UNIQUE, đối ngoại |
| `email` | citext | UNIQUE NOT NULL |
| `password_hash` | text | **NULL được** — argon2id khi có. `BR-SIB-08` |
| `display_name` | varchar(60) | NOT NULL |
| `status` | enum | `pending_verification`\|`active`\|`suspended`\|`deleted` |
| `email_verified_at` | timestamptz | |
| `refresh_token_version` | int | NOT NULL default 0 |
| `suspended_reason` | text | |
| `purge_at` | timestamptz | Đặt khi yêu cầu xoá |
| `created_at` `updated_at` | timestamptz | |

❌ Không `role`, không `package`, không `tier`.

### 7.2 `managers`

`id` · `uuid` · `email` citext UNIQUE · `password_hash` · `display_name` ·
`role` enum (`super_admin`\|`content_reviewer`) NOT NULL · `mfa_enabled` bool ·
`refresh_token_version` · `is_active` · `created_at` `updated_at`.

### 7.3 Bảng auth phụ — polymorphic

| Bảng | Cột đặc thù |
|---|---|
| `active_sessions` | `refresh_token_hash` · `device_label` · `ip_address` · `auth_method` (`password`\|`social`) · `reauth_at` · `last_used_at` · `expires_at` |
| `mfa_settings` | `secret_encrypted` · `confirmed_at` |
| `mfa_recovery_codes` | `code_hash` · `used_at` |
| `verification_tokens` | `purpose` (`email_verify`\|`password_reset`) · `token_hash` · `expires_at` · `used_at` |

Chung: `(account_type, account_id)` — `account_type ∈ {user, manager}`.

`reauth_at` là nguồn sự thật của cửa sổ reauth 5 phút —
[`auth-tokens-sessions.md`](./auth-tokens-sessions.md) §7.4.

### 7.3a `social_identities` — ❌ **không** polymorphic

Chỉ User. Manager ❌ không liên kết SNS (`BR-AUT-15`), nên bảng này FK thẳng tới `users` —
❌ không dùng `(account_type, account_id)` như 4 bảng trên.

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigserial | PK |
| `user_id` | bigint | FK `users(id)` **ON DELETE CASCADE**, NOT NULL |
| `provider` | enum | `google`\|`facebook` — danh sách đóng, `BR-OAP-06` |
| `provider_user_id` | text | NOT NULL — `sub` của provider, ❌ không phải email |
| `email_at_provider` | citext | NULL được — Facebook có thể ❌ không trả |
| `email_verified_at_provider` | bool | NOT NULL default false |
| `display_name_at_provider` | varchar(60) | |
| `linked_at` | timestamptz | NOT NULL |
| `last_login_at` | timestamptz | |
| `created_at` `updated_at` | timestamptz | |

```
UNIQUE (provider, provider_user_id)   -- một tài khoản SNS → đúng một User
UNIQUE (user_id, provider)            -- một User → tối đa một tài khoản mỗi provider
INDEX  (user_id)
```

❌ Không cột `access_token`, `refresh_token`, `id_token`, hay `avatar_url` — `BR-SIB-10`
`BR-OAP-15`.

### 7.4 `consent_logs` — INSERT-only

`id` · `user_id` FK · `consent_type` enum (`terms`\|`privacy`\|`child_data`\|`child_data_withdrawn`) ·
`policy_version` · `ip_address` · `user_agent` · `created_at`.

### 7.5 `entitlement_keys` — Lớp 1

`key` PK varchar · `group` enum (`content`\|`account`\|`report`\|`creator`\|`ai`) ·
`label_vi` · `description_vi` · `is_mvp` bool.

### 7.6 `packages` · `package_entitlements` — Lớp 1, bảng chiếu

| `packages` | |
|---|---|
| `code` PK | `PKG-*` |
| `name_vi` `audience_vi` `description_vi` | |
| `is_public` `is_featured` | bool |
| `status` | `active`\|`retired` |
| `offers` | JSONB — `[{offer_code, billing_period_vi, price_vnd, duration_days}]` |
| `quotas` | JSONB |

`package_entitlements`: `(package_code, entitlement_key)` PK ghép, cả hai FK.

### 7.7 `entitlements`

`id` · `user_id` FK · `entitlement_key` FK · `source` enum ·
`source_ref` uuid · `status` enum (`pending`\|`soft_unlock`\|`active`\|`grace_period`\|`expired`\|`cancelled`) ·
`granted_at` · `expires_at` (NULL = vĩnh viễn) · `granted_by_manager_id` · `grant_reason` ·
`created_at` `updated_at`.

Index `(user_id, status, expires_at)`.

### 7.8 `payment_orders`

`id` · `uuid` UNIQUE · `user_id` FK · `package_code` · `offer_code` ·
`amount_vnd` bigint · `currency` char(3) · `status` enum §`payment-flow` §7.1 ·
`transfer_note` · `bank_txn_ref` · `proof_path` · `submitted_at` · `reviewed_at` ·
`reviewed_by_manager_id` · `admin_note` · `expires_at` · `created_at` `updated_at`.

### 7.9 `quota_usage`

`(user_id, quota_key, period_start)` PK ghép · `used` int · `limit_snapshot` int ·
`period_end` · `updated_at`.

### 7.10 Module `ops`

| Bảng | Cột |
|---|---|
| `audit_logs` | §`audit-log` §7.1 — INSERT-only |
| `error_log` | `id` · `source` (`server`\|`client`) · `level` · `code` · `message` · `context` JSONB · `request_id` · `created_at` |
| `feature_flags` | §`feature-flag-service` §7 |
| `notifications` | §`notification-service` §7.2 |
| `content_seed_batches` | §`content-seed-authoring` §7.4 |
| `backup_log` | §`backup-and-restore` §7.2 |

## 8. API contract

Không có. Cột đặc quyền ❌ không nhận từ payload:
`managers.role` · `users.status` · `users.refresh_token_version` · `entitlements.status` ·
`payment_orders.status` · `payment_orders.amount_vnd`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SIB-01 — users không có cột role
  When đọc định nghĩa bảng users
  Then không cột nào tên role, persona, hay tier

Scenario: BR-SIB-02 — entitlement_key có FK thật
  When chèn một hàng entitlements với key không tồn tại
  Then DB từ chối bằng vi phạm khoá ngoại

Scenario: BR-SIB-07 — email không phân biệt hoa thường
  Given đã có user email a@x.com
  When đăng ký với A@X.com
  Then trả 409 EMAIL_ALREADY_REGISTERED

Scenario: BR-SIB-04 — orphan account_id bị bắt
  Given một hàng active_sessions trỏ tới account_id không tồn tại
  When chạy integration test toàn vẹn
  Then test fail

Scenario: BR-SIB-03 — số tiền là snapshot
  Given một đơn đã tạo với amount_vnd = X
  When PACKAGE_CATALOG đổi giá
  Then amount_vnd của đơn cũ vẫn là X

Scenario: BR-SIB-06 — consent_logs không sửa được
  When chạy UPDATE trên consent_logs bằng role ứng dụng
  Then quyền DB từ chối

Scenario: BR-SIB-08 — password_hash NULL được DB chấp nhận
  When chèn một hàng users không có password_hash
  Then DB chấp nhận

Scenario: BR-SIB-09 — một tài khoản SNS không gắn được hai User
  Given user A đã liên kết google với provider_user_id S
  When chèn social_identities cho user B với cùng provider và S
  Then DB từ chối bằng vi phạm UNIQUE

Scenario: BR-SIB-09 — một User không gắn hai tài khoản cùng provider
  Given user A đã liên kết google
  When chèn social_identities thứ hai cho user A với provider google
  Then DB từ chối bằng vi phạm UNIQUE

Scenario: BR-SIB-10 — không cột token của provider
  When đọc định nghĩa bảng social_identities
  Then không cột nào tên access_token, refresh_token, id_token, hay avatar_url

Scenario: BR-SIB-11 — xoá user cascade xoá danh tính SNS
  Given user A có 2 hàng social_identities
  When xoá hàng users của A
  Then còn 0 hàng social_identities trỏ tới A
  And tài khoản SNS đó liên kết lại được cho user mới
```

## 10. Boundaries

**Always**
- FK thật cho `entitlement_key`.
- `citext` hoặc index `lower()` cho email.
- Test orphan cho 4 bảng auth phụ.
- Hai UNIQUE trên `social_identities`.
- Cascade `users` → `social_identities`.

**Ask first**
- Thêm cột vào `users` hoặc `managers`.
- Đổi enum trạng thái.
- Thêm giá trị vào enum `social_identities.provider`.

**Never**
- Cột `role`/`persona`/`tier` trên `users`.
- Nhận cột đặc quyền từ payload.
- `UPDATE`/`DELETE` trên bảng INSERT-only.
- Cột token của nhà cung cấp OAuth ở bất kỳ bảng nào.
- Làm `social_identities` polymorphic để "dùng chung cho Manager".

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | `offers` để JSONB trên `packages` hay tách bảng `package_offers`? JSONB đơn giản nhưng không join được | P0 |
| 2 | `error_log` client cần sampling ở mức nào? | P1 |
