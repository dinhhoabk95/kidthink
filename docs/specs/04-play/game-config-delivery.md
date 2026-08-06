---
spec: GAME-CONFIG-DELIVERY
title: Giao cấu hình game cho client
area: play
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Hình dạng payload config
  - Quy tắc cache và preload asset
depends_on:
  - ACCESS-GATING
  - GAME-TEMPLATE-CONTRACT
  - CONTENT-VERSIONING
---

# Giao cấu hình game cho client

## 1. Objective

Một request trả **đủ** thứ engine cần để chạy trọn phiên **không gọi mạng lại** — vì
`BR-ENG-03` cấm network call trong lúc chơi, và vì mạng của người dùng chập chờn.

Payload phải nhỏ (tablet trên 4G) và đã qua gating (không rò nội dung trả phí).

## 2. Actors

| Actor | Nhận gì |
|---|---|
| Guest | Config của level `free` |
| User | Config theo `allowedTiers()` |
| Manager preview | Config mọi bậc, `is_preview = true` |

## 3. Entry points

| Route | |
|---|---|
| `GET /api/guest/levels/{code}/config` | Guest |
| `GET /api/users/levels/{code}/config` | User, có ngữ cảnh trẻ |
| `GET /api/managers/levels/{code}/config?version=` | Preview, chọn được version |

## 4. Main flow

1. Nạp bản `published` mới nhất theo `code` (admin có thể chọn version).
2. `assertContentAccess()` — bảy bước của `access-gating`.
3. Nạp `content_pack` + `difficulty_params`.
4. Áp `computeAdaptiveParams()` nếu có `mastery_state` cho trẻ (P3; P1 dùng tham số gốc).
5. Phân giải asset ref → URL đầy đủ (emoji → mã glyph, ảnh → URL).
6. Trả payload §7.1 kèm `content_version`.
7. Client preload **toàn bộ** asset trước khi bắt đầu.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Bị chặn bậc | 403 + metadata gate, ❌ không có config |
| Level `archived` giữa lúc mở | Vẫn trả nếu client đang có phiên; yêu cầu mới 404 |
| `content_pack` không parse được | **500** + alert — dữ liệu hỏng ở production là sự cố nội dung |
| Asset thiếu | Vẫn trả config, đánh dấu asset lỗi để engine dùng placeholder |
| Preview version cũ | Cho phép với `?version=`, chỉ Manager |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CFG-01` | Config chứa **mọi** thứ cần cho trọn phiên | Engine không được gọi mạng lúc chơi |
| `BR-CFG-02` | `content_version` **luôn** có trong payload | Client ghim vào phiên và mọi event |
| `BR-CFG-03` | Server **parse lại** `content_pack` bằng contract trước khi trả | Dữ liệu hỏng phải chặn ở server, không để engine crash trước mặt trẻ |
| `BR-CFG-04` | Config bậc ≥ `login` gắn `Cache-Control: private, no-store` | `BR-LAD-09` |
| `BR-CFG-05` | Config `free` được cache **public** ngắn (5 phút) | Giảm tải cho lối vào đông nhất |
| `BR-CFG-06` | Payload ❌ **không chứa đáp án ở dạng lộ liễu** khi template cho phép chấm ở server | Xem §11 Q1 |
| `BR-CFG-07` | Asset ref phân giải ở **server**, client ❌ không tự dựng URL | Đổi CDN không phải sửa client |
| `BR-CFG-08` | Payload ≤ **200 KB** gzipped | Tablet trên 4G |

## 7. Data

### 7.1 Payload

```jsonc
{
  "level_code": "G-C1-CNT-007",
  "content_version": 3,
  "template_code": "GT-003",
  "title_vi": "Đếm quả táo",
  "instruction_vi": "Bé hãy kéo đúng số quả táo vào giỏ nhé!",
  "instruction_audio_url": "https://…/instr.mp3",
  "content_pack": { /* đã phân giải asset ref */ },
  "difficulty_params": { /* đã áp adaptive nếu có */ },
  "theme_id": "farm",
  "age_band": "3-4",
  "scoring": { "mode": "rounds", "max_rounds": 5 },
  "session": { "uuid": "…", "started_at": "…" },
  "flags": { "reduced_motion": false, "audio_enabled": true, "tap_fallback": true },
  "assets": [ { "ref": "EMJ-apple-red", "kind": "emoji", "glyph": "🍎" } ],
  "age_mismatch": false,
  "is_preview": false
}
```

### 7.2 Phân giải asset

| Kind | Server trả |
|---|---|
| `emoji` | `{ ref, kind: "emoji", glyph }` — glyph lấy từ registry |
| `image` | `{ ref, kind: "image", url, width, height }` |
| `audio` | `{ ref, kind: "audio", url, duration_ms }` |

Asset không phân giải được → `{ ref, kind, error: "not_found" }`, engine dùng placeholder.

## 8. API contract

### `GET /api/users/levels/{code}/config`

| | |
|---|---|
| Auth | `requireUserAuth()` + `assertActiveChild()` cho bậc ≥ `login` |
| 200 | §7.1 — **đồng thời tạo phiên chơi**, xem `play-session-lifecycle` |
| 403 | `TIER_LOCKED` |
| 404 | `NOT_FOUND` |
| 428 | `NO_ACTIVE_CHILD` |
| 402 | `DAILY_PLAY_CAP_REACHED` |
| 500 | `CONTENT_PACK_INVALID` — dữ liệu hỏng, kèm alert |

## 9. Acceptance criteria

```gherkin
Scenario: BR-CFG-01 — config đủ để chơi trọn phiên
  Given trẻ mở một level
  When engine chạy từ start tới complete
  Then không request mạng nào phát ra ngoài việc gửi event

Scenario: BR-CFG-02 — payload luôn có content_version
  When gọi config của bất kỳ level nào
  Then payload chứa content_version

Scenario: BR-CFG-03 — content_pack hỏng bị chặn ở server
  Given một level published có content_pack không parse được
  When client gọi config
  Then trả 500 CONTENT_PACK_INVALID
  And một alert được phát
  And engine không nhận payload hỏng

Scenario: BR-CFG-04 — config trả phí không cache
  Given user premium gọi config một level premium
  Then header Cache-Control chứa no-store

Scenario: BR-CFG-05 — config free được cache ngắn
  Given guest gọi config một level free
  Then header Cache-Control là public với max-age không quá 300

Scenario: BR-CFG-07 — asset phân giải ở server
  When đọc payload config
  Then mọi asset có url hoặc glyph đầy đủ
  And client không cần biết tên bucket

Scenario: BR-CFG-08 — payload đủ nhỏ
  When đo kích thước gzipped của config mọi level đã seed
  Then không level nào vượt 200 KB

Scenario: asset thiếu không chặn phiên
  Given một ảnh trong content_pack đã bị xoá khỏi S3
  When client gọi config
  Then trả 200
  And asset đó mang error not_found
  And engine hiện placeholder
```

## 10. Boundaries

**Always**
- Parse lại `content_pack` trước khi trả.
- Gắn `content_version` và `session.uuid`.
- Phân giải asset ở server.
- `no-store` cho bậc ≥ `login`.

**Ask first**
- Đổi hình dạng payload.
- Nâng trần kích thước payload.
- Cho client tự dựng URL asset.

**Never**
- Trả config cho nội dung bị chặn bậc.
- Để engine nhận `content_pack` chưa parse.
- Cache config bậc ≥ `login`.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Đáp án đúng nằm trong payload — trẻ 3–6 không mở devtools, nhưng người lớn thì có. Có cần chấm ở server cho một số template không? | Chống gian lận, P4 |
| 2 | Adaptive params áp ở P3 — P1 dùng tham số gốc, đúng chưa? | P1 phạm vi |
