---
spec: LIVE-PREVIEW
title: Xem trước bằng engine thật
area: admin
status: approved
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Cơ chế preview trong studio
  - Quy tắc hiển thị lỗi preview
depends_on:
  - GAME-ENGINE-RUNTIME
---

# Xem trước bằng engine thật

## 1. Objective

Manager phải thấy **chính xác thứ trẻ sẽ thấy**, trước khi publish.

Preview xấp xỉ để lọt level không chơi được, và người phát hiện sẽ là một đứa trẻ 4 tuổi
ngồi trước màn hình không hiểu vì sao không bấm được.

Cơ chế preview đứng độc lập, chỉ cần engine thật ở
[`game-engine-runtime.md`](../01-platform/game-engine-runtime.md) để chạy.
[`game-level-studio.md`](game-level-studio.md) **nhúng** nó và khai `depends_on` về đây;
không có chiều ngược lại (`D-AN`).

## 2. Actors

| Actor | Vai trò |
|---|---|
| Manager | Xem, chơi thử |
| Engine | Chạy như với trẻ, `is_preview = true` |

## 3. Entry points

Khung phải của `/studio/levels/{code}/{version}` · `GET /api/managers/levels/{code}/{version}/config`.

## 4. Main flow

1. Field đổi → debounce 300ms → dựng lại config từ dữ liệu form hiện tại.
2. Validate `content_pack` cục bộ; hợp lệ → nạp vào engine.
3. Engine chạy **đầy đủ**: scaffolding, âm thanh, ăn mừng, sàn touch.
4. Manager chơi thử được, kết quả không ghi mastery, không đếm KPI.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| `content_pack` chưa hợp lệ | Hiện **rõ lý do** ở khung preview, không để trống im lặng |
| Asset thiếu | Engine hiện placeholder, preview cảnh báo asset nào |
| Chọn band tuổi khác | Preview dựng lại với sàn touch và scaffolding của band đó |
| Bật `reduced-motion` giả lập | Preview áp ngay |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LPV-01` | Preview dùng **engine thật**, cùng entry point với runtime của trẻ | Preview xấp xỉ để lọt level không chơi được |
| `BR-LPV-02` | Preview kế thừa **toàn bộ** ràng buộc bề mặt trẻ: sàn touch 64–96px, không `dark:`, không đỏ | Nghĩa là preview **có thể trông quá lớn** trong khung 60% màn hình. Đó là **đúng** |
| `BR-LPV-03` | Preview trống Cấm — **NEVER im lặng** — luôn nói lý do | Preview trống không giải thích là chỗ tệ nhất |
| `BR-LPV-04` | Cập nhật khi field đổi, không cần bấm Lưu. Debounce 300ms | Đảm bảo phản hồi xem trước tức thì mà không gây quá tải tài nguyên dựng lại config |
| `BR-LPV-05` | Phiên preview `is_preview = true`, không ghi mastery, không đếm KPI | `BR-PSL-05` |
| `BR-LPV-06` | Preview cho chọn **band tuổi** để kiểm sàn touch và scaffolding | Level cho band 3–4 và 5–6 trông rất khác |
| `BR-LPV-07` | Preview chạy trong **cùng trang**, không popup mới | Mất ngữ cảnh form |

## 7. Data

### 7.1 Điều khiển preview

| Điều khiển | Giá trị |
|---|---|
| Band tuổi | 3-4 · 4-5 · 5-6 |
| Reduced motion | on/off |
| Âm thanh | on/off |
| Chạy lại | nút |
| Tỉ lệ khung | Fit · 100% (960×540 thật) |

Nút "100%" quan trọng: khung 60% màn hình làm mọi thứ trông nhỏ hơn thực tế trên tablet.

### 7.2 Hiển thị lỗi

| Loại | Hiển thị |
|---|---|
| `content_pack` sai schema | Danh sách issue, mỗi issue link tới field tương ứng |
| Asset không resolve | Tên asset + gợi ý chọn lại |
| Vượt `limits` của template | Nêu giới hạn và giá trị hiện tại |
| Engine throw | Thông báo kỹ thuật rút gọn + nút sao chép chi tiết |

## 8. API contract

### `GET /api/managers/levels/{code}/{version}/config`

Giống [`game-config-delivery.md`](../04-play/game-config-delivery.md) §8 nhưng: bỏ qua gating, cho phép `?version=`, đặt
`is_preview = true`, và **không** tạo `play_session` trừ khi Manager bấm chơi thử.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LPV-01 — preview dùng engine thật
  When quét import của component preview
  Then nó import cùng barrel với runtime bề mặt trẻ

Scenario: BR-LPV-03 — preview lỗi luôn nói lý do
  Given content_pack thiếu một field bắt buộc
  When preview dựng lại
  Then khung preview hiện danh sách issue
  And không hiện khung trống

Scenario: BR-LPV-02 — preview giữ sàn touch của trẻ
  Given band tuổi chọn là 3-4
  When đo phần tử chạm được trong preview
  Then không phần tử nào dưới 96px ở tỉ lệ 100%

Scenario: BR-LPV-05 — preview không ghi mastery
  Given manager chơi thử tới hoàn thành
  Then không hàng mastery_state nào đổi
  And level_daily_stats không tăng

Scenario: BR-LPV-04 — cập nhật không cần lưu
  Given manager đổi một emoji trong form
  When chờ 300ms
  Then preview hiện emoji mới
  And chưa có request lưu nào

Scenario: BR-LPV-06 — đổi band đổi scaffolding
  Given preview ở band 5-6
  When đổi sang band 3-4
  Then ngưỡng scaffolding rút ngắn theo bảng band 3-4

Scenario: BR-LPV-02 — không dark mode trong preview
  Given admin đang ở chế độ tối
  When mở preview
  Then khung preview vẫn light-only
```

## 10. Boundaries

**Always**
- Dùng engine thật.
- Nói rõ lý do khi preview không dựng được.
- Giữ ràng buộc bề mặt trẻ trong preview.

**Ask first**
- Thêm điều khiển preview.
- Đổi debounce.

**Never**
- Mock engine hoặc dùng ảnh tĩnh.
- Preview trống không giải thích.
- Ghi mastery hay KPI từ preview.
- Áp dark mode lên khung preview.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Có cần preview trên thiết bị thật (QR mở trên tablet) không? Khung desktop không thay được cảm giác chạm | P2 | Hoãn sang P4 — MVP hỗ trợ xem trước tỉ lệ 100% (960×540px) trực tiếp trên khung studio | người quyết |
