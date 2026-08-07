---
spec: ACCESS-GATING
title: Chặn quyền truy cập nội dung
area: play
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Thứ tự bảy bước kiểm quyền
  - Ma trận gating phải test
depends_on:
  - ACCESS-LADDER
  - ENTITLEMENT-MODEL
  - ACTORS
---

# Chặn quyền truy cập nội dung

## 1. Objective

Nơi ladder và entitlement gặp nhau trong một request thật. Đây là **cổng doanh thu** — bug ở
đây cho không toàn bộ thư viện, và không sửa ngược được sau khi nội dung đã phát tán.

[`access-ladder.md`](../00-foundation/access-ladder.md) sở hữu *luật*. Spec này sở hữu *thứ tự
thực thi* và *ma trận test*.

## 2. Actors

| Actor | Trạng thái người gọi |
|---|---|
| Guest | không token |
| User đăng nhập, chưa chọn trẻ | token, không `active_child_id` |
| User đăng nhập, đã chọn trẻ, không gói | token + trẻ |
| User `standard` | + entitlement standard |
| User `premium` | + entitlement premium |

Năm trạng thái × bốn bậc = **20 ô** phải có test.

## 3. Entry points

Middleware `assertContentAccess(event, content)` — gọi trong **mọi** handler trả nội dung.

## 4. Main flow — bảy bước, đúng thứ tự

```
1. Content tồn tại và status = published?      → không: 404
2. Content thuộc curriculum tier cao hơn?      → lấy max(tier)   [BR-LAD-05]
3. Caller là ai? (guest | user)                → dựng ngữ cảnh
4. Route cần trẻ và chưa chọn trẻ?             → 428  (TRƯỚC gating)
5. allowedTiers(caller) ⊇ tier hiệu lực?       → không: 403 + metadata gate
6. Quota còn? (phút chơi trong ngày)           → hết: 402
7. Content phù hợp tuổi của trẻ?               → không khớp: 200 + cờ age_mismatch
```

Thứ tự có ý nghĩa: **404 trước 403 trước 428 trước 402**. Trả 403 cho nội dung không tồn tại
là rò rỉ thông tin; trả 402 trước khi kiểm quyền là nói với người dùng "hết lượt" khi thật
ra họ không có quyền.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Nội dung `archived` | 404 |
| Entitlement hết hạn giữa phiên | Phiên đang mở tiếp tục; yêu cầu mới bị chặn (`BR-LAD-08`) |
| Manager preview | Bỏ qua bước 5–6, đặt `is_preview = true` |
| `active_child_id` không thuộc User | **404** — không phải 403 |
| Tuổi trẻ ngoài khoảng nội dung | Vẫn cho chơi, gắn `age_mismatch` để UI cảnh báo **người lớn** |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-GAT-01` | Việc kiểm quyền chạy ở **server handler**. Không kiểm ở component, không kiểm ở middleware phía client. | Ẩn nội dung bằng CSS không phải là paywall. Người dùng mở DevTools là thấy hết. |
| `BR-GAT-02` | Thứ tự §4 là **cố định** | Đảo thứ tự làm mã lỗi nói sai lý do |
| `BR-GAT-03` | Response 403 strip `content_pack` và `difficulty_params` | `BR-LAD-04` |
| `BR-GAT-04` | Ownership của `active_child_id` phải kiểm bằng **DB query**. Không tin giá trị trong cookie. | Cookie do client gửi lên nên sửa được. Rule `BR-ACT-07` của [`actors.md`](../00-foundation/actors.md) mục 6 nêu cùng lý do. |
| `BR-GAT-05` | **20 ô** của ma trận §7.1 đều phải có test | Gating là ma trận; test vài ô sẽ để lọt ô còn lại |
| `BR-GAT-06` | Property test khẳng định **tính bao hàm** trên mọi tổ hợp entitlement | Ví dụ không chứng minh được bao hàm |
| `BR-GAT-07` | Bỏ token hoặc bỏ cookie ở phía client **không mở thêm quyền nào**. | Người gọi không có token là guest, và guest chỉ thấy nội dung tier `free`. |
| `BR-GAT-08` | Preview của Manager không ghi `mastery_state`, và không đếm KPI (chỉ số hiệu suất theo dõi). | |

## 7. Data

### 7.1 Ma trận gating — 20 ô

| Người gọi \ Bậc | `free` | `login` | `standard` | `premium` |
|---|:--:|:--:|:--:|:--:|
| Guest | 200 | 403 | 403 | 403 |
| User, chưa chọn trẻ | 200 | **428** | **428** | **428** |
| User, đã chọn trẻ, không gói | 200 | 200 | 403 | 403 |
| User `standard` | 200 | 200 | 200 | 403 |
| User `premium` | 200 | 200 | 200 | 200 |

Ô 428 quan trọng: chưa chọn trẻ thì **không phải** vấn đề quyền — nói 403 làm người dùng đi
mua gói mà họ đã có.

### 7.2 Metadata gate

Xem mục 7.3 của [`access-ladder.md`](../00-foundation/access-ladder.md). Bổ sung ở đây:
`upgrade_package_codes` lấy từ `package_entitlements` — gói nào cấp `required_entitlement`.

## 8. API contract

```ts
async function assertContentAccess(
  event: H3Event,
  content: { code: string; access_tier: AccessTier; status: ContentStatus; age_min: number; age_max: number },
  opts?: { requiresChild?: boolean }
): Promise<{ child_id: number | null; is_preview: boolean; age_mismatch: boolean }>;
```

Throw `NOT_FOUND` 404 · `NO_ACTIVE_CHILD` 428 · `TIER_LOCKED` 403 ·
`DAILY_PLAY_CAP_REACHED` 402.

## 9. Acceptance criteria

```gherkin
Scenario Outline: BR-GAT-05 — ma trận gating đủ 20 ô
  Given người gọi ở trạng thái <caller>
  When gọi nội dung access_tier <tier>
  Then hệ thống trả <status>

  Examples:
    | caller              | tier     | status |
    | guest               | free     | 200 |
    | guest               | login    | 403 |
    | guest               | standard | 403 |
    | guest               | premium  | 403 |
    | user_no_child       | free     | 200 |
    | user_no_child       | login    | 428 |
    | user_no_child       | standard | 428 |
    | user_no_child       | premium  | 428 |
    | user_child_no_pkg   | free     | 200 |
    | user_child_no_pkg   | login    | 200 |
    | user_child_no_pkg   | standard | 403 |
    | user_child_no_pkg   | premium  | 403 |
    | user_standard       | free     | 200 |
    | user_standard       | login    | 200 |
    | user_standard       | standard | 200 |
    | user_standard       | premium  | 403 |
    | user_premium        | free     | 200 |
    | user_premium        | login    | 200 |
    | user_premium        | standard | 200 |
    | user_premium        | premium  | 200 |

Scenario: BR-GAT-02 — 404 trước 403
  Given một game level ở trạng thái draft
  When guest gọi level đó
  Then trả 404
  And không trả 403

Scenario: BR-GAT-04 — cookie trẻ giả mạo không mở dữ liệu
  Given user A đã đăng nhập
  And cookie active_child_id trỏ tới trẻ của user B
  When user A mở một level tier login
  Then trả 404

Scenario: BR-GAT-06 — property test bao hàm
  Given mọi tổ hợp entitlement có thể có
  When kiểm canAccess cho mọi bậc
  Then canAccess(tier_n) luôn kéo theo canAccess(tier_m) với mọi m < n

Scenario: BR-GAT-07 — bỏ cookie không mở thêm gì
  Given một user premium
  When gọi lại toàn bộ catalog bằng curl không kèm cookie nào
  Then mọi nội dung tier khác free đều trả 403

Scenario: BR-GAT-03 — 403 không mang nội dung
  Given user standard gọi level premium
  Then body không chứa content_pack
  And body không chứa difficulty_params
  And body chứa required_entitlement và upgrade_package_codes

Scenario: BR-GAT-08 — preview của manager không ghi mastery
  Given manager mở preview một level
  When preview hoàn tất
  Then không hàng mastery_state nào thay đổi
  And play_sessions.is_preview là true
```

## 10. Boundaries

**Always**
- Gọi `assertContentAccess` trong mọi handler trả nội dung.
- Giữ đúng thứ tự bảy bước.
- Kiểm ownership trẻ bằng DB query.
- Test đủ 20 ô + property test bao hàm.

**Ask first**
- Đổi thứ tự bảy bước.
- Thêm bậc hoặc thêm trạng thái người gọi.

**Never**
- Kiểm bậc ở client.
- Gửi `content_pack` khi chặn.
- Tin cookie `active_child_id`.
- Ghi mastery từ phiên preview.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Nội dung `login` có gộp vào `standard` được không? Bậc `login` chỉ khác `free` ở chỗ lưu tiến độ | Đơn giản hoá ladder |
| 2 | `age_mismatch` hiện cảnh báo ở đâu — trước khi vào game hay chỉ trong báo cáo? | UI P1 |
