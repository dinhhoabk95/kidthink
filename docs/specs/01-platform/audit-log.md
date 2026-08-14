---
spec: AUDIT-LOG
title: Nhật ký kiểm toán
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-08-14
owns:
  - Danh sách hành động bắt buộc audit
  - Hình dạng bản ghi audit
  - Ràng buộc INSERT-only
depends_on:
  - ACTORS
  - DATA-MODEL-OVERVIEW
---

# Nhật ký kiểm toán

## 1. Objective

Audit trả lời **ai đổi gì, lúc nào, từ giá trị nào sang giá trị nào**.

Nó phải có mặt từ **P0**, trước mọi hành động cần audit. Thêm audit sau là đi vá từng call
site — và không có dữ liệu cho khoảng thời gian đã chạy. Đó là lý do audit nằm trong danh
sách bốn thứ không được cắt.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Manager | Chủ thể chính bị ghi |
| User | Bị ghi ở hành động nhạy cảm (xoá tài khoản, rút đồng ý) |
| Hệ thống | `actor_type = 'system'` cho job tự động |
| Manager `super_admin` | Đọc qua `06-admin/audit-log-viewer.md` |

## 3. Entry points

| Nơi | |
|---|---|
| `packages/db` — helper `writeAudit()` | Nơi duy nhất ghi |
| `GET /api/managers/audit-logs` | Đọc, phân trang trần 200 |

## 4. Main flow

1. Handler thực hiện thay đổi **trong một transaction**.
2. Trong **cùng transaction**, gọi `writeAudit()`.
3. Transaction commit → cả thay đổi và bản ghi audit cùng tồn tại, hoặc cùng không.

Ghi audit ngoài transaction tạo ra hai chế độ hỏng: hành động không có audit, hoặc audit
cho hành động chưa xảy ra. Cả hai đều làm nhật ký mất giá trị làm bằng chứng.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Ghi audit fail | Transaction rollback — hành động **không** xảy ra |
| Payload lớn (`before`/`after` nặng) | Cắt còn field đã đổi + hash bản đầy đủ |
| Hành động hàng loạt | **Một** bản ghi mỗi entity, không một bản ghi cho cả lô |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-AUD-01` | `audit_logs` **INSERT-only**, ép bằng **quyền DB** | Nhật ký sửa được không phải nhật ký |
| `BR-AUD-02` | Ghi audit trong **cùng transaction** với hành động | Hai chế độ hỏng ở §4 |
| `BR-AUD-03` | Mọi hành động ở §7.2 **bắt buộc** audit | Danh sách đóng là thứ duy nhất trả lời được "hành động này có được ghi không" mà không phải đi đọc từng handler. Để mỗi dev tự quyết thì khoảng trống chỉ lộ ra lúc điều tra, khi dữ liệu đã không còn cách nào dựng lại |
| `BR-AUD-04` | Bản ghi mang `before_data` và `after_data` cho thao tác sửa | "Đã đổi package" không đủ để hoàn tác hay điều tra |
| `BR-AUD-05` | Cấm — **NEVER PII của trẻ** trong `before_data`/`after_data` — dùng `child_uuid` | [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) |
| `BR-AUD-06` | Cấm — **NEVER mật khẩu, token, hay chuỗi bí mật** — kể cả dạng hash | `audit_logs` INSERT-only + giữ vĩnh viễn thì bí mật lọt vào đây là **không xoá được**, kể cả sau khi đã xoay khoá. Hash cũng cấm: hash mật khẩu vẫn brute-force được offline, và nó biến bảng audit thành bản sao thứ hai của kho mật khẩu — với tập người đọc rộng hơn |
| `BR-AUD-07` | Hành động hàng loạt ghi **một bản mỗi entity** | Một bản cho 200 entity không truy được entity nào |
| `BR-AUD-08` | `audit_logs` giữ lại khi xoá tài khoản | Nghĩa vụ pháp lý. Không chứa PII của trẻ nên giữ được |
| `BR-AUD-09` | Đọc audit **chỉ** `super_admin` | `content_reviewer` không có nhu cầu nghiệp vụ |

## 7. Data

### 7.1 Bảng `audit_logs`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `id` | bigserial | |
| `actor_type` | enum | `user` \| `manager` \| `system` |
| `actor_id` | bigint | NULL khi `system` |
| `action` | varchar | `snake_case`, từ danh sách đóng §7.2 |
| `entity_type` `entity_id` | varchar / varchar | Polymorphic |
| `before_data` `after_data` | JSONB | Chỉ field đã đổi |
| `reason` | text | Bắt buộc với hành động cần lý do (§7.2) |
| `ip_address` `user_agent` | | |
| `created_at` | timestamptz | |

Index: `(entity_type, entity_id, created_at)` · `(actor_type, actor_id, created_at)` ·
`(action, created_at)`.

### 7.2 Danh sách hành động bắt buộc audit

| Nhóm | Action | Lý do bắt buộc `reason` |
|---|---|:--:|
| Auth | `manager_login` · `manager_login_failed` · `manager_mfa_failed` | không |
| User | `user_suspended` · `user_reactivated` · `user_deleted` | có |
| Quyền | `entitlement_granted` · `entitlement_revoked` · `quota_reset` | có |
| Tiền | `order_approved` · `order_rejected` · `bonus_days_granted` | có |
| Nội dung | `content_created` · `content_submitted` · `content_approved` · `content_rejected` · `content_published` · `content_archived` · `content_rolled_back` · `content_deleted` | có (`content_rejected`, `content_rolled_back`, `content_deleted`) |
| Asset | `image_uploaded` · `image_deleted` | có (`image_deleted`) |
| Cấu hình | `feature_flag_changed` · `package_catalog_deployed` · `legal_reconsent_forced` | có (`feature_flag_changed`, `legal_reconsent_forced`) |
| Dữ liệu | `data_exported` · `consent_withdrawn` | có (`data_exported`) |
| Trẻ | `child_profile_archived` · `child_data_purged` | không |

**29 hành động.** Thêm hành động mới vào bảng này **trước** khi implement nó.

### 7.3 Cái gì không audit

Đọc dữ liệu (trừ `data_exported`) · phiên chơi của trẻ (đã có telemetry) · request thất bại
vì validation · health check.

Audit mọi thứ làm bảng phình và làm chìm tín hiệu thật.

## 8. API contract

```ts
await writeAudit(tx, {
  actor_type: "manager", actor_id: mgr.manager_id,
  action: "order_approved",
  entity_type: "payment_order", entity_id: order.uuid,
  before_data: { status: "submitted" },
  after_data:  { status: "approved" },
  reason: input.admin_note,
  ip_address: getClientIp(event), user_agent: getHeader(event, "user-agent"),
});
```

`tx` **bắt buộc** — chữ ký hàm không cho phép gọi ngoài transaction.

### `GET /api/managers/audit-logs`

| | |
|---|---|
| Auth | `requireManagerAuth()` + role `super_admin` |
| Query | `actor_type` `action` `entity_type` `entity_id` `from` `to` `limit` (≤200) `cursor` |
| 200 | `{ items, next_cursor }` |
| 403 | `INSUFFICIENT_ROLE` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-AUD-01 — không sửa được audit
  Given một hàng audit_logs tồn tại
  When chạy UPDATE hoặc DELETE bằng role của ứng dụng
  Then quyền DB từ chối

Scenario: BR-AUD-02 — audit fail thì hành động không xảy ra
  Given việc ghi audit sẽ thất bại
  When manager approve một đơn thanh toán
  Then đơn vẫn ở trạng thái submitted
  And không entitlement nào được cấp

Scenario: BR-AUD-03 — mọi hành động trong danh sách đều có audit
  Given lần lượt thực hiện đủ 29 hành động ở §7.2
  Then mỗi hành động sinh đúng một hàng audit_logs với action tương ứng

Scenario: BR-AUD-04 — có before và after
  Given manager suspend một user
  When đọc hàng audit tương ứng
  Then before_data chứa status active
  And after_data chứa status suspended

Scenario: BR-AUD-05 — không PII trẻ trong audit
  Given một child profile bị archive
  When đọc hàng audit
  Then before_data và after_data không chứa display_name hay birth_year
  And chỉ chứa child_uuid

Scenario: BR-AUD-07 — hàng loạt ghi từng bản
  Given manager archive 5 game level cùng lúc
  Then có đúng 5 hàng audit
  And mỗi hàng trỏ tới một entity_id khác nhau

Scenario: BR-AUD-08 — audit sống sót khi xoá tài khoản
  Given một user có audit log và đã yêu cầu xoá tài khoản
  When job purge chạy sau 30 ngày
  Then hàng audit_logs của user đó vẫn còn

Scenario: BR-AUD-09 — content_reviewer không đọc được audit
  Given manager có role content_reviewer
  When gọi GET /api/managers/audit-logs
  Then hệ thống trả 403

Scenario: BR-AUD-06 — không bí mật trong audit
  Given user đổi mật khẩu
  When đọc hàng audit
  Then before_data và after_data không chứa password hay hash

Scenario: force đồng ý lại có audit nguyên tử
  Given super_admin force privacy với lý do hợp lệ
  When transaction commit
  Then có một audit action legal_reconsent_forced cho consent_requirement privacy
  And before_data và after_data chứa marker tương ứng
  And reason chứa lý do nội bộ
```

## 10. Boundaries

**Always**
- Ghi audit trong cùng transaction với hành động.
- `before_data`/`after_data` chỉ chứa field đã đổi.
- Một bản ghi mỗi entity với thao tác hàng loạt.
- Thêm action vào §7.2 trước khi implement.

**Ask first**
- Thêm hành động vào danh sách audit.
- Đổi retention của `audit_logs`.
- Cho role khác đọc audit.

**Never**
- `UPDATE`/`DELETE` trên `audit_logs`.
- Ghi audit ngoài transaction.
- PII của trẻ, mật khẩu, hay token trong payload.
- Audit thao tác đọc thông thường.

## 11. Open questions

> **Chủ duy nhất của câu hỏi retention (2026-08-07, T12)**: Q1 dưới đây và
> [`data-model-overview`](data-model-overview.md) §11 Q2 hỏi **cùng một** thứ. Theo luật
> "một outcome một chủ", câu hỏi thuộc file này — nó `owns` hình dạng bản ghi audit. [`data-model-overview.md`](data-model-overview.md) §11 Q2
> trỏ về đây.
>
> **Không câu nào dưới đây chặn migration #1.**

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Retention — giữ vĩnh viễn hay archive sang S3 sau 2 năm? Trên t3.small dung lượng là ràng buộc thật. **Không chặn migration #1**: đây là quyết định *vận hành*, không đụng cột nào ở §7.1 — đổi retention sau là job archive, không phải migration schema | Vận hành, không chặn bước 8 | chờ P1 | hoãn — cần số dung lượng thật sau khi có seeder (`BR-AUD-08` giữ bản ghi khi xoá tài khoản thì bảng chỉ lớn lên) |
| 2 | Có cần chữ ký chuỗi (hash chain) để chống sửa ở tầng hạ tầng không? **Không chặn P0**: `BR-AUD-01` đã ép INSERT-only bằng **quyền DB**; hash chain chỉ thêm phòng vệ trước kẻ có quyền `superuser` | Mức đảm bảo | chờ P3 | hoãn — mở lại nếu có nghĩa vụ tuân thủ đòi bằng chứng chống sửa ở tầng hạ tầng |
| 3 | `data_exported` có cần ghi cả nội dung export không, hay chỉ metadata? | Dung lượng vs bằng chứng | chờ P2 | hoãn — chốt cùng lúc tính năng export vào scope; mặc định hiện tại là **chỉ metadata** (`BR-AUD-06` cấm nội dung nhạy cảm trong payload) |
