---
spec: SCHEMA-IDENTITY-BILLING
title: Schema — danh tính, thanh toán, vận hành
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-08-07
owns:
  - Định nghĩa cột module identity, billing, ops
depends_on:
  - DATA-MODEL-OVERVIEW
  - ACTORS
  - ENTITLEMENT-MODEL
  - PAYMENT-FLOW
  - AUTH-TOKENS-SESSIONS
---

# Schema — danh tính, thanh toán, vận hành

## 1. Objective

Định nghĩa cột cho ba module: `identity`, `billing`, `ops`. Quy tắc chung ở
[`data-model-overview.md`](data-model-overview.md) — file này không lặp lại.

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
| `BR-SIB-01` (cấm cột role trên users) | Cấm — **NEVER cột `role`/`persona`/`tier` trên `users`** | [`actors.md`](../00-foundation/actors.md) `BR-ACT-05` (một người nhiều vai, không gán cứng) |
| `BR-SIB-02` | `entitlements.entitlement_key` là **FK thật** tới `entitlement_keys` | Sai chính tả bị chặn ở FK |
| `BR-SIB-03` (snapshot giá) | `payment_orders.amount_vnd` là **snapshot** lúc tạo đơn | Giá đổi sau không ảnh hưởng đơn đã tạo |
| `BR-SIB-04` (test orphan bắt buộc) | 4 bảng auth phụ polymorphic → **bắt buộc** test bắt orphan | [`data-model-overview.md`](data-model-overview.md) `BR-DM-04` (polymorphic phải có test toàn vẹn) |
| `BR-SIB-05` (chỉ argon2id) | `password_hash` argon2id; cấm — **NEVER** cột mật khẩu dạng khác | [`auth-tokens-sessions.md`](auth-tokens-sessions.md) `BR-AUT-08`. Ghi ở tầng cột vì đây là chỗ vi phạm để lại dấu vĩnh viễn: một cột `password` plaintext hay `password_md5` lọt vào migration thì mọi hàng đã ghi không hash ngược lại được |
| `BR-SIB-06` (INSERT-only cho log pháp lý) | `consent_logs` · `audit_logs` INSERT-only, ép bằng quyền DB | [`data-model-overview.md`](data-model-overview.md) `BR-DM-05` (bảng INSERT-only). Hai bảng này là bằng chứng pháp lý (Nghị định 13/2023) và vết điều tra — sửa được nghĩa là không chứng minh được điều gì. Quyền DB ép, không phải quy ước code |
| `BR-SIB-07` | `users.email` UNIQUE **case-insensitive** (`citext` hoặc index trên `lower()`) | `A@x.com` và `a@x.com` là một người |
| `BR-SIB-08` (password nullable) | `users.password_hash` **nullable** — tài khoản chỉ có SNS là hợp lệ | [`auth-tokens-sessions.md`](auth-tokens-sessions.md) `BR-AUT-16`, [`social-login.md`](../03-account/social-login.md) `BR-SCL-08`. Bất biến thay thế là `login_methods ≥ 1` ([`social-account-linking.md`](../03-account/social-account-linking.md) `BR-SLK-04`), ép ở tầng service không ở cột |
| `BR-SIB-09` (hai UNIQUE) | `social_identities` có **hai** UNIQUE: `(provider, provider_user_id)` và `(user_id, provider)` | Cái thứ nhất chặn một tài khoản SNS gắn hai User; cái thứ hai chặn hai tài khoản SNS cùng provider trên một User ([`social-account-linking.md`](../03-account/social-account-linking.md) `BR-SLK-02` — một User tối đa một tài khoản mỗi provider) |
| `BR-SIB-10` (cấm cột token provider) | `social_identities` cấm — **NEVER có cột token** của nhà cung cấp | [`oauth-provider-registry.md`](oauth-provider-registry.md) `BR-OAP-07` (không lưu token provider). Cột không tồn tại thì không rò được |
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

Cấm: không `role`, không `package`, không `tier`.

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
[`auth-tokens-sessions.md`](auth-tokens-sessions.md) §7.4.

### 7.3a `social_identities` — không phải polymorphic

Chỉ User. Manager không liên kết SNS ([`auth-tokens-sessions.md`](auth-tokens-sessions.md) `BR-AUT-15`), nên bảng này FK thẳng tới `users` —
không dùng `(account_type, account_id)` như 4 bảng trên.

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigserial | PK |
| `user_id` | bigint | FK `users(id)` **ON DELETE CASCADE**, NOT NULL |
| `provider` | enum | `google`\|`facebook` — danh sách đóng, [`oauth-provider-registry.md`](oauth-provider-registry.md) `BR-OAP-06` (chỉ hai provider) |
| `provider_user_id` | text | NOT NULL — `sub` của provider, không phải email |
| `email_at_provider` | citext | NULL được — Facebook có thể không trả |
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

Cấm cột `access_token`, `refresh_token`, `id_token`, hay `avatar_url` — `BR-SIB-10` (cấm cột token provider),
[`oauth-provider-registry.md`](oauth-provider-registry.md) `BR-OAP-15`.

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
| `offers` | JSONB — `[{offer_code, billing_period, price_vnd, duration_days}]` — `billing_period` ∈ `{yearly, monthly}` (miền đóng, D-AB); MVP chỉ dùng `yearly` ([`package-catalog.md`](../00-foundation/package-catalog.md) §11 Q2) |
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
`amount_vnd` bigint · `currency` char(3) · `status` enum theo [`payment-flow.md`](../00-foundation/payment-flow.md) §7.1 ·
`transfer_note` · `bank_txn_ref` · `proof_path` · `submitted_at` · `reviewed_at` ·
`reviewed_by_manager_id` · `admin_note` · `expires_at` · `created_at` `updated_at`.

### 7.9 `quota_usage`

`(user_id, quota_key, period_start)` PK ghép · `used` int · `limit_snapshot` int ·
`period_end` · `updated_at`.

### 7.10 Module `ops` — P0, vào migration #1

Ba bảng dưới đây **vào migration #1** (bước 8 theo [`roadmap.md`](../roadmap.md)). **Điều kiện chặn (D-AD):**
[`audit-log.md`](audit-log.md) và [`backup-and-restore.md`](backup-and-restore.md) phải
`status: approved` **trước khi** migration #1 chạy — cột của `audit_logs`/`backup_log` do hai
spec đó sở hữu.

> Đã thoả 2026-08-07 (Task #3, bước 12): cả hai `approved`.
>
> Cảnh báo: **D-AD ghi thiếu một spec.** Điều kiện viết là 2 spec, nhưng đồ thị `depends_on` bắt **3**:
> [`backup-and-restore.md`](backup-and-restore.md) `depends_on` [`job-queue.md`](job-queue.md) (§2/§3 — backup chạy bằng job
> `backup:postgres`/`backup:verify` ở `apps/worker`), nên C8 không cho approve
> [`backup-and-restore.md`](backup-and-restore.md) khi [`job-queue.md`](job-queue.md) còn `draft`. Đã approve [`job-queue.md`](job-queue.md) cùng lượt. Bài học:
> điều kiện chặn nên phát biểu bằng **bao đóng `depends_on`**, không phải liệt kê tay.

| Bảng | Cột | Sở hữu |
|---|---|---|
| `audit_logs` | [`audit-log.md`](audit-log.md) §7.1 — INSERT-only | [`audit-log.md`](audit-log.md) `approved` 2026-08-07 |
| `content_review_log` | xem §7.10a dưới | [`schema-identity-billing.md`](schema-identity-billing.md) (file này, D-AC) |
| `backup_log` | [`backup-and-restore.md`](backup-and-restore.md) §7.2 | [`backup-and-restore.md`](backup-and-restore.md) `approved` 2026-08-07 |

### 7.10a `content_review_log` — polymorphic, INSERT-only

Cột chuyển từ [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §7.2 sang đây theo **D-AC** (2026-08-07) — [`data-model-overview.md`](data-model-overview.md) §7 xếp
bảng này vào module `ops`, sở hữu cột chuyển sang schema-*; [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) giữ quyền
định nghĩa **ngữ nghĩa** state machine, không định nghĩa cột.

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigserial | PK |
| `entity_type` | enum | Loại nội dung Lớp 2 được review (`game_level`\|`lesson`\|`activity`\|`worksheet`\|`curriculum`) |
| `entity_id` | bigint | FK hàng version cụ thể của nội dung đó — polymorphic, `(entity_type, entity_id)` là 1 trong 7 FK polymorphic đóng ở [`data-model-overview.md`](data-model-overview.md) §7.2 (`BR-DM-13` — danh sách polymorphic đóng, D-AE) |
| `content_version` | int | Snapshot version tại thời điểm review — cột thông tin, không phải FK riêng (đã ngầm định trong `entity_id`) |
| `from_status` `to_status` | enum | Theo [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §7.1 — 6 giá trị |
| `actor_manager_id` | bigint | FK `managers(id)` |
| `actor_role` | enum | Vai trò của actor lúc thực hiện — snapshot, không đổi theo role hiện tại |
| `reason` | text | Bắt buộc ≥10 ký tự khi `to_status = 'rejected'` ([`content-lifecycle.md`](../00-foundation/content-lifecycle.md) `BR-CLC-05` — từ chối phải ghi lý do) |
| `checklist_snapshot` | JSONB | Kết quả checklist publish ([`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §7.3) tại thời điểm chuyển |
| `created_at` | timestamptz | NOT NULL |

INSERT-only ([`data-model-overview.md`](data-model-overview.md) `BR-DM-05` — bảng INSERT-only, [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) `BR-CLC-06`) — cấm `UPDATE`/`DELETE`.

### 7.10b Module `ops` — hoãn (P1+, tạo cùng tính năng)

Bảng **không** tạo ở P0 — tạo cùng lúc với tính năng sở hữu:
`error_log` (Observability), `feature_flags` (feature-flag-service),
`notifications` (notification-service), `content_seed_batches` (content-seed-authoring).

## 8. API contract

Không có. Cột đặc quyền không nhận từ payload:
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
- Làm `social_identities` polymorphic để dùng chung cho Manager.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~`offers` để JSONB trên `packages` hay tách bảng `package_offers`?~~ **Đóng 2026-08-07 (D-AB)**: giữ JSONB `offers[]`. Một package **nhiều** offer buộc tách bảng `package_offers` mới join được — việc P2, MVP chỉ bán năm ([`package-catalog.md`](../00-foundation/package-catalog.md) §11 Q2) chưa cần | — | đã đóng | D-AB |
| 2 | `error_log` client cần sampling ở mức nào? | Vận hành | chờ P1+ (bảng chưa tạo, xem §7.10b) | hoãn — chốt cùng lúc [`error-log-viewer.md`](../06-admin/error-log-viewer.md) vào phase của nó; bảng không nằm trong migration #1 (D-AD) nên không chặn bước 8 |
