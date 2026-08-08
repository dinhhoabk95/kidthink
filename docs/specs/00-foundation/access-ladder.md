---
spec: ACCESS-LADDER
title: Bậc truy cập nội dung
area: foundation
status: approved
mvp: true
phase: P0
reviewed: 2026-08-06
owns:
  - Enum access_tier và thứ tự bao hàm
  - Quy tắc mặc-định-đóng
  - Hình dạng response khi bị chặn
depends_on:
  - GLOSSARY
  - ACTORS
---

# Bậc truy cập nội dung

## 1. Objective

`access_tier` là thuộc tính của **content**, trả lời "nội dung này ở bậc nào".
Entitlement là thuộc tính của **người**, trả lời "người này mở được tới bậc nào".
Hai trục tách bạch, gặp nhau ở đúng một hàm.

Mục tiêu thương mại: guest chơi đủ để thấy giá trị, **không** đủ để không cần đăng ký.

## 2. Actors

| Actor | Bậc cao nhất mở được |
|---|---|
| Guest | `free` |
| User đã đăng nhập, không gói | `login` |
| User có `standard` | `standard` |
| User có `premium` | `premium` |
| Manager (preview) | mọi bậc — nhưng phiên preview không ghi `mastery_state` |

## 3. Entry points

Mọi handler trả nội dung: `/api/guest/levels/**` · `/api/users/levels/**` ·
`/api/users/lessons/**` · `/api/users/curricula/**`.

## 4. Main flow — phân giải một yêu cầu nội dung

1. Nạp content, đọc `access_tier`.
2. Nếu content không `published` → **404**.
3. Tính `allowedTiers(caller)` — xem §7.2.
4. Nếu `access_tier ∉ allowedTiers` → dựng **response chặn** §7.3, trả **403**.
5. Nếu content có ràng buộc tuổi và `active_child_id` nằm ngoài `[age_min, age_max]` →
   vẫn cho chơi, nhưng gắn cờ `age_mismatch: true` để UI cảnh báo người lớn.
6. Trả nội dung đầy đủ.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Content thiếu `access_tier` | Coi như **`premium`** — `BR-LAD-02` |
| Content `archived` | 404 |
| Entitlement hết hạn giữa phiên đang chơi | Phiên đang mở tiếp tục; yêu cầu nội dung **mới** bị chặn |
| Guest gọi nội dung `login` | 403 kèm CTA đăng ký |
| User đăng nhập nhưng chưa chọn trẻ, gọi nội dung `login` | 428 trước, gating sau |
| Nội dung nằm trong curriculum `premium` nhưng bản thân là `free` | Bậc hiệu lực = **max** của hai — `BR-LAD-05` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LAD-01` | Ladder **bao hàm**: `premium ⊃ standard ⊃ login ⊃ free`. Vào được bậc N thì vào được mọi bậc dưới | Người trả nhiều tiền hơn không bao giờ được thấy ít hơn |
| `BR-LAD-02` | Content thiếu `access_tier` coi là **`premium`** | Mặc định phải là **đóng**. Quên gán tier là cho không nội dung |
| `BR-LAD-03` | Kiểm ở **server handler**, không ở component | Ẩn bằng CSS không phải paywall (cơ chế chặn nội dung, yêu cầu trả phí mới xem được) |
| `BR-LAD-04` | Khi chặn: **strip** `content_pack` và `difficulty_params` khỏi response | Gửi nội dung rồi ẩn là đã gửi nội dung |
| `BR-LAD-05` | Nội dung nằm trong một curriculum có tier cao hơn → bậc hiệu lực là **max** | Không được lách curriculum trả phí bằng cách mở từng level lẻ |
| `BR-LAD-06` | Guest **không giới hạn lượt** trên allow-list | Quota theo cookie thiết bị chỉ làm phiền người thật |
| `BR-LAD-07` | Allow-list guest = đúng **6 game level**, 1 mỗi competency, difficulty ≤ 2 | Hẹp mới tạo lý do đăng ký; rộng thì không ai trả tiền |
| `BR-LAD-08` | Phiên chơi đang mở **không bị ngắt** khi gói hết hạn | Cắt ngang lúc trẻ đang chơi thiệt hại lớn hơn doanh thu một lượt |
| `BR-LAD-09` | **NEVER cache** response chứa nội dung trả phí | Cache là đường rò nội dung sang người chưa trả tiền |
| `BR-LAD-10` | Phiên preview của Manager không ghi `mastery_state`, không đếm vào KPI (chỉ số đo hiệu quả) | Lượt test làm nhiễu dữ liệu học tập của trẻ |

## 7. Data

### 7.1 Enum

```ts
type AccessTier = "free" | "login" | "standard" | "premium";
const TIER_ORDER: Record<AccessTier, number> = { free: 0, login: 1, standard: 2, premium: 3 };
```

Áp lên: `game_levels` · `lessons` · `activities` · `curricula` · `worksheets`.

### 7.2 Ánh xạ entitlement → bậc

| Bậc | Entitlement key cần | Điều kiện thêm |
|---|---|---|
| `free` | — | không |
| `login` | `play_login_games` | đã đăng nhập **và** có `active_child_id` hợp lệ |
| `standard` | `play_standard_games` | |
| `premium` | `play_premium_games` | |

```ts
async function allowedTiers(caller): Promise<AccessTier[]> {
  if (caller.kind === "guest") return ["free"];
  const keys = await activeEntitlementKeys(caller.user_id);
  const highest = keys.includes("play_premium_games")  ? "premium"
                : keys.includes("play_standard_games") ? "standard"
                : caller.active_child_id               ? "login"
                :                                        "free";
  return TIERS.filter((t) => TIER_ORDER[t] <= TIER_ORDER[highest]);
}
```

Hàm này là **nơi duy nhất** ánh xạ entitlement sang bậc. Mọi handler gọi nó.

### 7.3 Response khi bị chặn — hình dạng cố định

```json
{
  "code": "TIER_LOCKED",
  "access_tier": "premium",
  "required_entitlement": "play_premium_games",
  "upgrade_package_codes": ["PKG-premium"],
  "preview": {
    "title_vi": "Phân loại vật lớn và vật nhỏ",
    "competency": "C1",
    "age_min": 4, "age_max": 6,
    "thumbnail_emoji": "🍎"
  }
}
```

**Không** `content_pack`, **không** `difficulty_params`, **không** đáp án.
`preview` chỉ chứa metadata đủ để UI mời nâng cấp — không đủ để chơi.

## 8. API contract

Không sở hữu route. Ràng buộc áp lên mọi route trả nội dung:

| | |
|---|---|
| 200 | Nội dung đầy đủ, đã qua `allowedTiers` |
| 403 | `TIER_LOCKED` + body §7.3 |
| 404 | Content không `published`, hoặc không tồn tại |
| 428 | `NO_ACTIVE_CHILD` — kiểm **trước** gating |
| Header | `Cache-Control: private, no-store` cho mọi response bậc ≥ `login` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-LAD-01 — ladder bao hàm
  Given user có entitlement play_premium_games
  When user gọi một level access_tier = standard
  Then hệ thống trả 200 kèm content_pack đầy đủ

Scenario: BR-LAD-02 — mặc định đóng
  Given một game level được ghi vào DB không có access_tier
  When guest gọi level đó
  Then hệ thống trả 403 TIER_LOCKED
  And required_entitlement là play_premium_games

Scenario: BR-LAD-04 — response bị chặn không mang nội dung
  Given user standard gọi một level premium
  When đọc body của response 403
  Then body không chứa key content_pack
  And body không chứa key difficulty_params
  And body chứa access_tier và required_entitlement

Scenario: BR-LAD-05 — bậc hiệu lực là max của level và curriculum
  Given một level access_tier = free
  And level đó nằm trong một curriculum access_tier = premium
  When user standard mở level qua đường curriculum
  Then hệ thống trả 403

Scenario: BR-LAD-06 — guest không bị giới hạn lượt
  Given guest chưa từng đăng nhập
  When guest chơi 20 lượt liên tiếp một level trong allow-list
  Then không lượt nào bị chặn

Scenario: BR-LAD-08 — phiên đang mở không bị ngắt
  Given trẻ đang trong một phiên chơi level premium
  And entitlement premium của user vừa hết hạn
  When client gửi event tiếp theo của phiên đó
  Then hệ thống nhận event bình thường
  And yêu cầu mở một level premium mới trả 403

Scenario: BR-LAD-03 — bỏ token ở client không mở thêm gì
  Given guest gọi API bằng curl không kèm cookie nào
  When guest gọi mọi level access_tier != free
  Then mọi response đều 403

Scenario: BR-LAD-09 — không cache nội dung trả phí
  Given user premium gọi một level premium
  When đọc header response
  Then Cache-Control chứa no-store
```

## 10. Boundaries

**Always**
- Gọi `allowedTiers()` — nơi duy nhất ánh xạ entitlement sang bậc.
- Strip nội dung khi chặn, trả metadata gate.
- `Cache-Control: private, no-store` cho bậc ≥ `login`.
- Property test tính bao hàm trên mọi tổ hợp entitlement.

**Ask first**
- Đổi allow-list guest.
- Đổi `access_tier` của nội dung đã publish.
- Thêm bậc thứ năm.

**Never**
- Kiểm bậc ở client.
- Gửi `content_pack` của nội dung bị chặn.
- Coi content thiếu tier là `free`.
- Cache response bậc ≥ `login`.
- Ghi `mastery_state` từ phiên guest hoặc phiên preview của Manager.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | **6 game level nào vào allow-list guest?** Cần 1 mỗi competency, difficulty ≤ 2 | P1 gating | Hoãn, chặn phase P1 | nội dung |
| 2 | Guest chơi xong bao nhiêu lượt thì hiện lời mời đăng ký? | P1 conversion | P1 | Chốt D-AY: 5 lượt chơi mượt |

| ~~3~~ | ~~Gộp bậc `login` vào `standard`?~~ **Đóng 2026-08-06 (T10)**: **giữ enum 4 bậc** — `free`, `login`, `standard`, `premium`. Bỏ bậc sau khi có dữ liệu là migration + sửa ma trận 20 ô. Giữ `login` để có chỗ gate lưu tiến độ miễn phí. **Sửa 2026-08-07 (Checkpoint C)**: bản ghi cũ liệt kê giá trị đầu là `guest` — **sai**, `guest` là tên *actor*, tên *bậc* là `free` (§7.1 `type AccessTier`, `BR-LAD-01`, mục Access tier của [`glossary.md`](glossary.md)). Kết luận không đổi, chỉ sửa tên giá trị viết nhầm | — | Đã đóng | D-X (T10) |
