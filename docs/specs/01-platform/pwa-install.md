---
spec: PWA-INSTALL
title: Cài đặt PWA
area: platform
status: approved
mvp: false
phase: P5
reviewed: 2026-08-11
owns:
  - Manifest và tiêu chí mời cài đặt
depends_on:
  - OFFLINE-PLAY
---

# Cài đặt PWA

## 1. Objective

Cho phụ huynh thêm ứng dụng vào màn hình chính tablet, mở toàn màn hình, không thanh
địa chỉ — giảm khả năng trẻ chạm nhầm ra ngoài.

**Ngoài MVP.** Web trong trình duyệt đủ cho P0–P3. Spec viết trước để [`offline-play.md`](offline-play.md) và
service worker không phải làm lại khi tới lúc.

## 2. Actors

| Actor | Vai trò |
|---|---|
| Người lớn | Người duy nhất được thấy lời mời cài đặt |
| Trẻ | Cấm thấy lời mời |

## 3. Entry points

`manifest.webmanifest` · service worker · lời mời trong `/me` (bề mặt người lớn).

## 4. Main flow

1. Trình duyệt phát `beforeinstallprompt`, ứng dụng **giữ lại**, không hiện ngay.
2. Sau khi User đã tạo ≥1 child profile và có ≥3 phiên chơi hoàn thành → hiện lời mời
   trong `/me`.
3. Chấp nhận → gọi `prompt()`. Từ chối → không hỏi lại trong 30 ngày.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| iOS Safari | Không có `beforeinstallprompt` — hiện hướng dẫn thủ công |
| Đã cài | Ẩn lời mời |
| Từ chối 2 lần | Cấm hỏi lại |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PWA-01` | Lời mời **chỉ** trên bề mặt người lớn | Trẻ không nên chạm vào cài đặt hệ thống |
| `BR-PWA-02` | Cấm — **NEVER hiện lời mời trong lúc trẻ đang chơi** | Ngắt phiên |
| `BR-PWA-03` | Chỉ mời sau khi User đã dùng thật (≥3 phiên) | Mời quá sớm bị từ chối và mất cơ hội |
| `BR-PWA-04` | `display: standalone`, `orientation: landscape` cho bề mặt trẻ | Tablet ngang là tư thế chơi |
| `BR-PWA-05` | Từ chối 2 lần thì không hỏi nữa | Tôn trọng trải nghiệm người dùng và tránh gây phiền toái khi họ không có nhu cầu cài đặt |

## 7. Data

```jsonc
{
  "name": "KidThink", "short_name": "KidThink",
  "start_url": "/me", "scope": "/",
  "display": "standalone", "orientation": "any",
  "background_color": "…", "theme_color": "…",
  "icons": [{ "src": "…", "sizes": "192x192" }, { "src": "…", "sizes": "512x512" }]
}
```

`start_url` là `/me` — bề mặt người lớn, không mở thẳng vào khu vực chơi.

`install_prompt_state` lưu localStorage: `{ dismissed_count, last_dismissed_at }`.

## 8. API contract

Không có route.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PWA-01 — lời mời chỉ ở bề mặt người lớn
  Given trẻ đang ở /play
  When beforeinstallprompt được phát
  Then không lời mời nào hiện ra

Scenario: BR-PWA-03 — chỉ mời sau khi dùng thật
  Given user vừa đăng ký, chưa có phiên chơi nào
  When user mở /me
  Then không có lời mời cài đặt

Scenario: BR-PWA-05 — từ chối hai lần thì thôi
  Given user đã từ chối 2 lần
  When user mở /me lần thứ ba
  Then không có lời mời

Scenario: start_url mở vào bề mặt người lớn
  Given ứng dụng đã cài
  When mở từ màn hình chính
  Then trang đầu là /me
```

## 10. Boundaries

**Always**
- Giữ `beforeinstallprompt`, hiện đúng lúc.
- `start_url` là bề mặt người lớn.

**Ask first**
- Đổi tiêu chí mời.
- Thêm khả năng PWA khác (share target, shortcut).

**Never**
- Mời cài đặt trên bề mặt trẻ.
- Mở thẳng vào khu vực chơi từ icon.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Có cần push notification qua PWA không?~~ **Đóng 2026-08-11 (khôi phục quyết định `D-BM`)**: không có PWA push trong scope hiện hành; thông báo cho phụ huynh đi qua email do [`notification-service.md`](notification-service.md) sở hữu. | Đã đóng | Không áp dụng | D-BM |
