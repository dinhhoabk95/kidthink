---
spec: SCHEMA-IDENTITY-BILLING
title: Schema — danh tính, thanh toán, vận hành
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-14
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
| `BR-SIB-06` (INSERT-only cho log pháp lý) | `consent_logs` · `audit_logs` INSERT-only, ép bằng quyền DB | [`data-model-overview.md`](data-model-overview.md) `BR-DM-05` (bảng INSERT-only). Hai bảng này là bằng chứng pháp lý theo Luật 91/2025/QH15 và Nghị định 13/2023 cùng vết điều tra — sửa được nghĩa là không chứng minh được điều gì. Quyền DB ép, không phải quy ước code |
| `BR-SIB-07` | `users.email` UNIQUE **case-insensitive** (`citext` hoặc index trên `lower()`) | `A@x.com` và `a@x.com` là một người |
| `BR-SIB-08` (password nullable) | `users.password_hash` **nullable** — tài khoản chỉ có SNS là hợp lệ | [`auth-tokens-sessions.md`](auth-tokens-sessions.md) `BR-AUT-16`, [`social-login.md`](../03-account/social-login.md) `BR-SCL-08`. Bất biến thay thế là `login_methods ≥ 1` ([`social-account-linking.md`](../03-account/social-account-linking.md) `BR-SLK-04`), ép ở tầng service không ở cột |
| `BR-SIB-09` (hai UNIQUE) | `social_identities` có **hai** UNIQUE: `(provider, provider_user_id)` và `(user_id, provider)` | Cái thứ nhất chặn một tài khoản SNS gắn hai User; cái thứ hai chặn hai tài khoản SNS cùng provider trên một User ([`social-account-linking.md`](../03-account/social-account-linking.md) `BR-SLK-02` — một User tối đa một tài khoản mỗi provider) |
| `BR-SIB-10` (cấm cột token provider) | `social_identities` cấm — **NEVER có cột token** của nhà cung cấp | [`oauth-provider-registry.md`](oauth-provider-registry.md) `BR-OAP-07` (không lưu token provider). Cột không tồn tại thì không rò được |
| `BR-SIB-11` | Xoá `users` **cascade** xoá `social_identities` | Danh tính mồ côi làm `UNIQUE (provider, provider_user_id)` chặn người dùng đăng ký lại sau khi đã xoá tài khoản |
| `BR-SIB-12` (singleton force marker) | `consent_requirements` có đúng ba khoá `terms` · `privacy` · `child_data`; marker chỉ UPDATE tiến tới, không có policy version | Một hàng cho mỗi loại cho phép kiểm consent bằng một so sánh thời gian, không fan-out theo User và không dựng kho version trá hình |
| `BR-SIB-13` (seed test accounts) | Seeder cung cấp sẵn bộ tài khoản kiểm thử mặc định (2 Manager, 3 User, 5 Child, Package Entitlements) với mật khẩu ngẫu nhiên băm argon2id, không bắt buộc biến `.env` | Cho phép kiểm thử cục bộ và chạy dev trơn tru ngay từ lần seed đầu tiên |

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
| `session_version` | int | NOT NULL default 0; tăng khi revoke-all/đổi credential |
| `suspended_reason` | text | |
| `purge_at` | timestamptz | Đặt khi yêu cầu xoá |
| `created_at` `updated_at` | timestamptz | |

Cấm: không `role`, không `package`, không `tier`.

### 7.2 `managers`

`id` · `uuid` · `email` citext UNIQUE · `password_hash` · `display_name` ·
`role` enum (`super_admin`\|`content_reviewer`) NOT NULL · `mfa_enabled` bool ·
`session_version` · `is_active` · `created_at` `updated_at`.

### 7.3 Bảng auth phụ — polymorphic

| Bảng | Cột đặc thù |
|---|---|
| `active_sessions` | `device_id` UUID UNIQUE · `device_label` · `ip_address` · `auth_method` (`password`\|`social`) · `remembered` · `last_used_at` · `expires_at` · `revoked_at`; **không token/hash** |
| `mfa_settings` | `secret_encrypted` · `confirmed_at` |
| `mfa_recovery_codes` | `code_hash` · `used_at` |
| `verification_tokens` | `purpose` (`email_verify`\|`password_reset`) · `token_hash` · `expires_at` · `used_at` |

Chung: `(account_type, account_id)` — `account_type ∈ {user, manager}`.

`active_sessions` chỉ là metadata/audit thiết bị; Redis là session authority và giữ reauth
state — [`auth-tokens-sessions.md`](auth-tokens-sessions.md) §7.2, §7.5.

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

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigserial | PK; dùng làm tie-break cùng `created_at` |
| `user_id` | bigint | FK `users(id)`, NOT NULL |
| `consent_type` | enum | `terms` \| `privacy` \| `child_data` |
| `action` | enum | `accepted` \| `withdrawn` |
| `ip_address` | inet | NOT NULL |
| `user_agent` | text | NOT NULL |
| `created_at` | timestamptz | NOT NULL, DB clock |

Cấm cột `policy_version`, `version`, `requirement_id` hay document snapshot. Validity do
[`consent-management.md`](../03-account/consent-management.md) mục 4 tính từ action mới nhất và
singleton marker.

Migration cutover map `child_data_withdrawn` cũ thành
`consent_type='child_data', action='withdrawn'`; ba consent type còn lại thành
`action='accepted'`, rồi mới drop `policy_version`. Không UPDATE/DELETE hàng log sau cutover.

### 7.4a `consent_requirements` — singleton mutable

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `consent_type` | enum | PK; đúng ba giá trị của mục 7.4 |
| `reconsent_required_at` | timestamptz | NULL khi chưa từng force; chỉ DB sinh, marker mới phải lớn hơn marker cũ |
| `notice` | varchar(500) | NULL trước lần force đầu; 20–500 ký tự khi có marker |
| `updated_at` | timestamptz | NOT NULL |

Seed đúng ba hàng, marker NULL. Bảng này **không** INSERT-only: force hợp lệ UPDATE đúng một
hàng trong cùng transaction với audit. Cấm FK/User list, `policy_version`, nội dung document,
manager id hay reason nội bộ; manager và reason nằm ở `audit_logs`.

### 7.5 `entitlement_keys` — Lớp 1

`key` PK varchar · `group` enum (`content`\|`account`\|`report`\|`creator`\|`ai`) ·
`label` · `description` · `is_mvp` bool.

### 7.6 `packages` · `package_entitlements` — Lớp 1, bảng chiếu

| `packages` | |
|---|---|
| `code` PK | `PKG-*` |
| `name` `audience` `description` | |
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

### 7.10 Module `ops` — P0, vào migration nền

Các bảng dưới đây thuộc schema P0 (bước 8 theo [`roadmap.md`](../roadmap.md)). **Điều kiện chặn (D-AD):**
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
| `notifications` | [`notification-service.md`](notification-service.md) §7.2 — logical event | [`notification-service.md`](notification-service.md) (`D-AF`, P2→P0) |
| `notification_deliveries` | [`notification-service.md`](notification-service.md) §7.3 — một hàng mỗi channel | [`notification-service.md`](notification-service.md), Task #83 |

**D-AP (2026-08-08):** `notifications` chuyển từ §7.10b (hoãn) sang bảng trên. §7.10b viết
trước `D-AF` (Task #5) chuyển [`notification-service.md`](notification-service.md) từ P2 sang
P0 — bảng đó bị bỏ quên trong danh sách hoãn khi phase của spec sở hữu nó đổi.
`BR-NOT-04` ("INSERT `notifications` trong cùng transaction với sự kiện") áp dụng cho
[`password-recovery.md`](../03-account/password-recovery.md) và
[`email-verification.md`](../03-account/email-verification.md) — cả hai P0, cả hai cần gửi
email thật ở migration #1. Bảng phải tồn tại từ đầu, không hoãn theo tính năng UI quản lý nó.

**D-ND (2026-08-13):** channel không còn nằm trên `notifications`. Logical event và trạng thái
provider tách thành `notifications` + `notification_deliveries`; producer ghi cả hai trong cùng
transaction. Migration Task #83 phải backfill theo `channel/status` cũ, có test rollback local và
không được xoá dữ liệu delivery trước khi đối chiếu count. `notification_reads` và
`notification_endpoints` là P5, tạo cùng Task #84 theo hai spec sở hữu.

### 7.10a `content_review_log` — polymorphic, INSERT-only

Cột chuyển từ [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §7.2 sang đây theo **D-AC** (2026-08-07) — [`data-model-overview.md`](data-model-overview.md) §7 xếp
bảng này vào module `ops`, sở hữu cột chuyển sang schema-*; [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) giữ quyền
định nghĩa **ngữ nghĩa** state machine, không định nghĩa cột.

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigserial | PK |
| `entity_type` | enum | Loại nội dung Lớp 2 được review (`game_level`\|`lesson`\|`activity`\|`worksheet`\|`curriculum`) |
| `entity_id` | bigint | FK hàng version cụ thể của nội dung đó — polymorphic, `(entity_type, entity_id)` là 1 trong 9 FK polymorphic đóng ở [`data-model-overview.md`](data-model-overview.md) §7.2 (`BR-DM-13` — danh sách polymorphic đóng, D-AE; số chỗ 7→9 ở `D-AQ`) |
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
`content_seed_batches` (content-seed-authoring), `notification_reads`
([`../03-account/notification-inbox.md`](../03-account/notification-inbox.md)) và
`notification_endpoints` ([`browser-push.md`](browser-push.md)). `notifications` và
`notification_deliveries` ở §7.10; xem `D-AP` và `D-ND`.

### 7.10c `notification_reads` — P5, tạo cùng Task #84

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `notification_id` | bigint | PK + FK `notifications(id)` ON DELETE CASCADE |
| `read_at` | timestamptz | NOT NULL; lần mark đầu tiên được giữ, gọi lại idempotent |
| `created_at` · `updated_at` | timestamptz | NOT NULL |

Không lặp `user_id`: ownership luôn join qua recipient của `notifications`, tránh hai owner id có
thể lệch nhau. Chỉ logical notification `recipient_type = user` được tạo read row; integration test
bắt Manager/Child/cross-user write.

### 7.10d `notification_endpoints` — P5, tạo cùng Task #84

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | bigserial | PK |
| `uuid` | uuid | UNIQUE NOT NULL, public id |
| `user_id` | bigint | FK `users(id)` ON DELETE CASCADE, NOT NULL |
| `provider` | enum | Chỉ `fcm_web` trong P5 hiện hành |
| `client_installation_id` | uuid | NOT NULL, UNIQUE `(user_id, client_installation_id)` |
| `token_encrypted` | bytea | NOT NULL; không trả qua API |
| `token_fingerprint` | text | HMAC, UNIQUE NOT NULL; không token thô |
| `status` | enum | `active`\|`invalid`\|`revoked` |
| `last_seen_at` · `invalidated_at` | timestamptz | Lifecycle; không dùng làm tracking hành vi |
| `created_at` · `updated_at` | timestamptz | NOT NULL |

Cấm cột IP history, browser fingerprint, location hay FCM read receipt. Token rotate của cùng
installation cập nhật ciphertext/fingerprint trong transaction; endpoint cũ không cùng lúc active.

## 8. API contract

Không có. Cột đặc quyền không nhận từ payload:
`managers.role` · `users.status` · `users.session_version` · `entitlements.status` ·
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

Scenario: BR-SIB-12 — consent requirements đúng ba singleton
  When chạy migration consent singleton
  Then consent_requirements có đúng ba hàng terms, privacy, child_data
  And mọi reconsent_required_at ban đầu là NULL
  And không cột nào tên policy_version, version hay user_id

Scenario: BR-SIB-12 — marker không đi lùi
  Given privacy có reconsent_required_at A
  When role ứng dụng cố UPDATE marker về thời điểm trước A
  Then DB hoặc service transaction từ chối
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
