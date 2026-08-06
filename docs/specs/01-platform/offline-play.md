---
spec: OFFLINE-PLAY
title: Chơi khi mất mạng
area: platform
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Hành vi khi mất mạng giữa phiên
  - Buffer event offline và đồng bộ lại
depends_on:
  - EVENT-CATALOG
  - GAME-ENGINE-RUNTIME
---

# Chơi khi mất mạng

## 1. Objective

Trẻ chơi trên tablet, thường trên Wi-Fi nhà hoặc 4G chập chờn. Mạng rớt giữa chừng ❌ không
được làm mất phiên chơi hay làm đứng màn hình.

Phạm vi MVP: **phiên đang chạy sống sót qua mất mạng**. Tải trước cả thư viện để chơi offline
hoàn toàn là P5.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Engine | Chơi tiếp bằng config đã tải |
| Client storage | Buffer event trong IndexedDB |
| Server | Nhận event trễ, khử trùng theo `(session_uuid, seq)` |

## 3. Entry points

| Nơi | |
|---|---|
| Service worker | Cache shell + asset của phiên hiện tại |
| `packages/game-engine` buffer | |
| `POST /play-sessions/{uuid}/events` | Nhận lô trễ |

## 4. Main flow

1. Mở game → tải config + asset của **mọi round** trước khi bắt đầu.
2. Mất mạng → engine ❌ không gọi mạng (vốn đã vậy — `BR-ENG-03`), tiếp tục bình thường.
3. Event vào buffer bộ nhớ, đồng thời ghi IndexedDB mỗi 10 giây.
4. Có mạng lại → flush theo thứ tự `seq`.
5. Trang đóng khi vẫn offline → buffer còn trong IndexedDB, flush ở lần mở sau.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Offline khi **mở** game | Chỉ chơi được level đã cache; còn lại hiện màn hình "cần kết nối" thân thiện |
| Buffer quá 24 giờ | Bỏ, ❌ không gửi. Ghi log local |
| Buffer quá 5 MB | Bỏ event cũ nhất, giữ `game_started` và `game_completed` |
| Phiên đã bị server đóng (`abandoned`) | Event trễ bị bỏ, trả 200 |
| Xung đột `seq` | Server khử trùng, client xoá buffer đã gửi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-OFF-01` | Phiên đang chạy ❌ **NEVER bị ngắt** vì mất mạng | Cắt ngang lúc trẻ đang chơi là thiệt hại lớn nhất |
| `BR-OFF-02` | Preload **toàn bộ** asset của phiên trước khi bắt đầu | Tải giữa chừng là nơi mất mạng gây hại |
| `BR-OFF-03` | Buffer bền trong **IndexedDB**, không chỉ bộ nhớ | Đóng tab mất bộ nhớ |
| `BR-OFF-04` | Flush theo thứ tự `seq`, server khử trùng | |
| `BR-OFF-05` | Buffer quá **24 giờ** thì bỏ | Dữ liệu chơi quá cũ không còn giá trị phân tích và có thể lệch version nội dung |
| `BR-OFF-06` | Guest cũng được buffer, nhưng ❌ không lưu tiến độ | |
| `BR-OFF-07` | ❌ **NEVER cache nội dung trả phí** trong service worker cho người không có quyền | Cache là đường rò nội dung |
| `BR-OFF-08` | UI báo trạng thái offline **cho người lớn**, ❌ không làm trẻ hoảng | Biểu tượng nhỏ, ❌ không modal chặn màn hình |

## 7. Data

### 7.1 Buffer IndexedDB

| Store | Nội dung |
|---|---|
| `pending_events` | `{ session_uuid, seq, event_name, occurred_at_ms, payload, queued_at }` |
| `session_meta` | Config phiên đang chạy để khôi phục sau reload |

Giới hạn 5 MB, TTL 24 giờ.

### 7.2 Chiến lược cache service worker

| Loại | Chiến lược |
|---|---|
| App shell, JS, CSS | Cache-first, version theo build |
| Asset của phiên hiện tại | Cache-first, xoá khi phiên kết thúc |
| Config game | Network-first, ❌ không cache nội dung trả phí |
| API | ❌ Không cache |

## 8. API contract

Dùng chung `POST /api/{ns}/play-sessions/{uuid}/events`. Server chấp nhận
`occurred_at_ms` trễ tới 24 giờ so với `ingested_at`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-OFF-01 — mất mạng không ngắt phiên
  Given trẻ đang chơi một level
  When mạng bị ngắt
  Then game tiếp tục chạy bình thường
  And trẻ hoàn thành được level

Scenario: BR-OFF-03 — buffer sống sót qua reload
  Given trẻ chơi offline và có 15 event trong buffer
  When tab bị đóng và mở lại khi đã có mạng
  Then 15 event đó được gửi lên server

Scenario: BR-OFF-04 — flush đúng thứ tự và không trùng
  Given buffer có event seq 1 tới 20
  When flush chạy hai lần do lỗi mạng giữa chừng
  Then server ghi đúng 20 hàng
  And thứ tự seq được giữ

Scenario: BR-OFF-05 — buffer quá hạn bị bỏ
  Given buffer có event từ 30 giờ trước
  When có mạng lại
  Then event đó không được gửi

Scenario: BR-OFF-07 — service worker không cache nội dung trả phí
  Given một guest duyệt catalog
  When kiểm cache của service worker
  Then không content_pack của level tier cao nào được lưu

Scenario: BR-OFF-08 — báo offline không làm trẻ hoảng
  Given mạng mất trong lúc trẻ chơi
  Then không modal nào che màn hình
  And chỉ có một chỉ báo nhỏ ở góc

Scenario: offline test dùng chế độ offline thật
  When chạy e2e offline
  Then test dùng Playwright offline mode
  And không mock navigator.onLine
```

## 10. Boundaries

**Always**
- Preload toàn bộ asset phiên trước khi bắt đầu.
- Buffer bền trong IndexedDB.
- Flush theo `seq`, để server khử trùng.

**Ask first**
- Đổi TTL hoặc dung lượng buffer.
- Mở rộng phạm vi offline sang cả thư viện.

**Never**
- Ngắt phiên vì mất mạng.
- Cache nội dung trả phí cho người không có quyền.
- Modal chặn màn hình khi trẻ đang chơi.
- Mock `navigator.onLine` trong test.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có cho tải trước một tuần curriculum để chơi offline không? Kéo theo cache nội dung trả phí | P5 |
| 2 | 5 MB buffer đủ cho một phiên dài chưa? Cần đo | P1 |
