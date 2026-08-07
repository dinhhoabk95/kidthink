---
spec: ENTITLEMENT-MODEL
title: Mô hình quyền sử dụng và hạn mức
area: foundation
status: approved
mvp: true
phase: P0
reviewed: 2026-08-06
owns:
  - Registry entitlement key
  - Quy tắc hợp nhiều gói
  - Định nghĩa quota và cách đếm
depends_on:
  - GLOSSARY
  - ACTORS
  - ACCESS-LADDER
---

# Mô hình quyền sử dụng và hạn mức

## 1. Objective

Năng lực của một User là **hợp của mọi entitlement đang hiệu lực**, không phải tên gói họ
mua. Tách hai thứ ra cho phép đổi cấu trúc gói, chạy khuyến mãi, cấp bù tay, và bán add-on
mà **không sửa một dòng code nào ở tầng tính năng**.

```ts
// WRONG — đổi gói là phải sửa code ở mọi chỗ
if (pkg === "premium") { … }
// CORRECT
if (await hasEntitlement(userId, "play_premium_games")) { … }
```

## 2. Actors

| Actor | Vai trò |
|---|---|
| User | Sở hữu entitlement |
| Manager `super_admin` | Cấp/thu hồi entitlement thủ công, có lý do bắt buộc |
| Hệ thống | Cấp khi duyệt thanh toán; hết hiệu lực khi tới `expires_at` |

## 3. Entry points

| Nơi | Dùng gì |
|---|---|
| Mọi handler gate tính năng | `hasEntitlement(user_id, key)` |
| Gate nội dung | `allowedTiers()` — [`access-ladder.md`](access-ladder.md) §7.2 |
| Gate hạn mức | `consumeQuota(user_id, quota_key, n)` |
| Admin cấp tay | `06-admin/entitlement-grant.md` |

## 4. Main flow — phân giải năng lực

1. Đọc mọi hàng `entitlements` của user với `status ∈ {active, soft_unlock}` và
   (`expires_at IS NULL` hoặc `expires_at > now`).
2. Gom `entitlement_key` thành một `Set`.
3. Trả lời `hasEntitlement` bằng phép kiểm thuộc tập.
4. Cache theo `user_id`, TTL **60 giây**, **invalidate ngay** khi entitlement đổi.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Hai gói cùng cấp một key | Key có hiệu lực; `expires_at` hiệu lực là **muộn nhất** |
| Gói hết hạn | Key biến khỏi tập. Dữ liệu **giữ nguyên** — `BR-ENT-05` |
| Manager thu hồi | Invalidate cache ngay, không chờ TTL |
| Đơn thanh toán bị từ chối | Entitlement sinh từ đơn đó hết hiệu lực **trong cùng transaction** |
| Quota cạn | Trả **402** `QUOTA_EXCEEDED`, không degrade âm thầm |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ENT-01` | Gate bằng **entitlement key**, không bằng `package_code` | Đổi cấu trúc gói không được kéo theo sửa code tính năng |
| `BR-ENT-02` | Năng lực = **hợp** của mọi entitlement hiệu lực. Không gói nào ghi đè gói khác | Một người vừa là phụ huynh vừa là giáo viên là ca dùng chính |
| `BR-ENT-03` | `entitlement_keys` là **Lớp 1** — admin không tạo/sửa/xoá qua UI | Key là hằng số mà code tham chiếu. Sửa từ UI làm code gate một key không tồn tại |
| `BR-ENT-04` | Key được khai báo nhưng **không gói MVP nào cấp** vẫn hợp lệ (key add-on) | Khai báo trước giữ contract ổn định; nhưng không được bán |
| `BR-ENT-05` | Hết hạn **không xoá dữ liệu**. `child_profiles`, `mastery_state`, `lesson_plans` giữ nguyên | Mua lại là mở lại, không phải bắt đầu lại |
| `BR-ENT-06` | Đọc năng lực từ **DB/cache**, không từ JWT | JWT sống 15 phút; thu hồi phải có hiệu lực ngay |
| `BR-ENT-07` | Quota cạn → **402**, không degrade âm thầm | Degrade im lặng biến vấn đề thanh toán thành báo cáo lỗi chất lượng |
| `BR-ENT-08` | Add-on là **trục độc lập** — không mở `access_tier` nào | Chi phí add-on là biến phí; gộp vào tier cố định mất kiểm soát chi phí |
| `BR-ENT-09` | Mọi thao tác cấp/thu hồi ghi `audit_logs` kèm lý do bắt buộc | Cấp quyền tay là đường lạm dụng dễ nhất |
| `BR-ENT-10` | Quota reset theo **múi giờ ICT (UTC+7)**, mốc 00:00 | Lỗi múi giờ chỉ hiện ra một giờ trong ngày — đúng giờ trẻ hay chơi |

## 7. Data

### 7.1 Registry `entitlement_keys` — Lớp 1

| Key | Nhóm | MVP | Gói cấp |
|---|---|:--:|---|
| `play_free_games` | content | Có | ngầm định, mọi tác nhân |
| `play_login_games` | content | Có | mọi User đã đăng nhập |
| `play_standard_games` | content | Có | `standard`, `premium` |
| `play_premium_games` | content | Có | `premium` |
| `access_premium_curriculum` | content | Có | `premium` |
| `manage_children` | account | Có | mọi User đã đăng nhập |
| `view_basic_report` | report | Có | mọi User đã đăng nhập |
| `view_advanced_report` | report | Có | `standard`, `premium` |
| `create_lesson_plan` | creator | Không | `addon_lesson_plan` |
| `duplicate_lesson` | creator | Không | `addon_lesson_plan` |
| `customize_lesson` | creator | Không | `addon_lesson_plan` |
| `export_pdf` | creator | Không | `addon_lesson_plan` |
| `create_custom_curriculum` | creator | Không | `addon_curriculum` |
| `create_custom_game` | creator | Không | `addon_custom_game` |
| `use_ai_analysis` | ai | Không | `addon_ai` |
| `use_ai_search` | ai | Không | `addon_ai` |

**16 key. 8 mở được ở MVP, 8 khai báo trước.** Key add-on tồn tại trong registry nhưng
`package_entitlements` không có hàng nào cấp chúng ở MVP.

### 7.2 Bảng `entitlements`

| Field | Ghi chú |
|---|---|
| `user_id` | FK |
| `entitlement_key` | FK `entitlement_keys` — **FK thật**, sai chính tả bị chặn |
| `source` | `payment_order` \| `manual_grant` \| `promo` \| `default` |
| `source_ref` | uuid đơn hàng, hoặc null |
| `status` | `pending` \| `soft_unlock` \| `active` \| `grace_period` \| `expired` \| `cancelled` |
| `granted_at` `expires_at` | `expires_at NULL` = vĩnh viễn |
| `granted_by_manager_id` `grant_reason` | Bắt buộc khi `source = manual_grant` |

Index: `(user_id, status, expires_at)`.

### 7.3 Quota

| Quota key | Đơn vị | Chu kỳ | Free/Login | standard | premium |
|---|---|---|---:|---:|---:|
| `child_profiles` | hồ sơ | không reset | 1 | 3 | 5 |
| `daily_play_minutes` | phút / trẻ | ngày (ICT) | 30 | 60 | 90 |
| `data_export` | lượt | 24h | 1 | 1 | 1 |
| `lesson_plans_per_month` | giáo án | tháng | — | — | — *(add-on)* |
| `custom_games_saved` | game | không reset | — | — | — *(add-on)* |
| `ai_calls` | lượt | tháng | — | — | — *(add-on)* |
| `upload_mb` | MB | không reset | — | — | — *(add-on)* |

Quota **không phải** entitlement. Entitlement trả lời "có được không"; quota trả lời
"còn bao nhiêu". Một tính năng có thể cần cả hai.

```ts
// Sai: coi quota là entitlement
if (await hasEntitlement(uid, "child_profiles_3")) …
// Đúng
if (!(await hasEntitlement(uid, "manage_children"))) throw forbidden();
const { remaining } = await checkQuota(uid, "child_profiles");
if (remaining <= 0) throw quotaExceeded("child_profiles");
```

### 7.4 Bảng `quota_usage`

| Field | Ghi chú |
|---|---|
| `user_id` `quota_key` `period_start` | PK ghép |
| `used` | Tăng nguyên tử qua `sql\`used + ${n}\`` |
| `limit_snapshot` | Hạn mức tại thời điểm mở chu kỳ — đổi gói giữa chu kỳ không hồi tố |

## 8. API contract

```ts
async function hasEntitlement(userId: number, key: EntitlementKey): Promise<boolean>;
async function activeEntitlementKeys(userId: number): Promise<Set<EntitlementKey>>;
async function checkQuota(userId: number, key: QuotaKey): Promise<{ used: number; limit: number; remaining: number; resets_at: Date }>;
async function consumeQuota(userId: number, key: QuotaKey, n: number): Promise<void>; // throw QUOTA_EXCEEDED
```

### `GET /api/users/entitlements`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| 200 | `{ keys: string[], quotas: { key, used, limit, remaining, resets_at }[], packages: { code, expires_at }[] }` |

Dùng để UI hiện đúng trạng thái. **Client không được tin làm nguồn quyết định** — server
vẫn kiểm lại ở mọi hành động.

| Mã lỗi | HTTP |
|---|---|
| `ENTITLEMENT_REQUIRED` | 403 |
| `QUOTA_EXCEEDED` | 402 |
| `UNKNOWN_ENTITLEMENT_KEY` | 500 — lỗi lập trình, key không có trong registry |

## 9. Acceptance criteria

```gherkin
Scenario: BR-ENT-02 — hợp của nhiều gói
  Given user có entitlement play_standard_games từ gói standard
  And user có entitlement create_lesson_plan từ một add-on
  When phân giải năng lực
  Then tập key chứa cả hai
  And không key nào bị gói kia ghi đè

Scenario: BR-ENT-06 — thu hồi có hiệu lực ngay, không chờ JWT hết hạn
  Given user đang giữ access token còn hạn 10 phút
  And user có entitlement play_premium_games
  When manager thu hồi entitlement đó
  Then request tiếp theo tới nội dung premium trả 403
  And user không cần đăng nhập lại

Scenario: BR-ENT-05 — hết hạn không xoá dữ liệu
  Given user có 5 child profile dưới gói premium
  When entitlement premium hết hạn
  Then số hàng child_profiles vẫn là 5
  And số hàng mastery_state không đổi
  And user không tạo thêm được profile thứ 6

Scenario: BR-ENT-07 — quota cạn trả 402, không degrade
  Given user đã dùng hết quota data_export trong 24h
  When user gọi GET /api/users/data-export
  Then hệ thống trả 402 QUOTA_EXCEEDED
  And body chứa resets_at
  And hệ thống không trả một bản export rút gọn

Scenario: BR-ENT-03 — admin không sửa được registry key
  Given manager super_admin đã đăng nhập
  When manager gọi POST /api/managers/entitlement-keys
  Then route không tồn tại hoặc trả 405

Scenario: BR-ENT-08 — add-on không mở tier game
  Given user chỉ có entitlement create_lesson_plan
  When user gọi một game level access_tier = standard
  Then hệ thống trả 403

Scenario: BR-ENT-10 — quota reset đúng nửa đêm ICT
  Given user đã dùng hết daily_play_minutes lúc 23:50 ICT
  When đồng hồ sang 00:01 ICT ngày hôm sau
  Then remaining trở lại đầy đủ
  And không reset lúc 00:00 UTC
```

## 10. Boundaries

**Always**
- Gate bằng entitlement key.
- `entitlement_key` là **FK thật** tới registry.
- Invalidate cache ngay khi entitlement đổi.
- Ghi `audit_logs` + lý do khi cấp/thu hồi tay.
- Reset quota theo ICT.

**Ask first**
- Thêm entitlement key mới.
- Đổi hạn mức quota của một gói.
- Đổi TTL cache năng lực.
- Cấp một key add-on cho gói MVP.

**Never**
- `if (package === …)` ở tầng tính năng.
- Đọc năng lực từ JWT.
- Cho admin sửa `entitlement_keys` qua UI.
- Degrade âm thầm khi quota cạn.
- Xoá dữ liệu khi gói hết hạn.
- Coi quota là entitlement.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | `daily_play_minutes` 30/60/90 đã đúng chưa? Cần đối chiếu khuyến nghị thời gian màn hình cho trẻ 3–6 | [`healthy-play-limits.md`](../04-play/healthy-play-limits.md) | Hoãn, chặn phase P1 | hoãn |
| 2 | `grace_period` kéo dài bao lâu sau `expires_at`? | Luồng gia hạn | Hoãn, chặn phase P1 | hoãn |
| 3 | Có cần ledger cho quota kiểu credit (`ai_calls`) không, hay counter là đủ? | P4 add-on AI | Hoãn, chặn phase P4 | hoãn |
