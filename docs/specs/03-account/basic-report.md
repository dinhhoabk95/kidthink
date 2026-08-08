---
spec: BASIC-REPORT
title: Báo cáo cơ bản
area: account
status: approved
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Nội dung báo cáo cơ bản
  - Ranh giới ngôn ngữ báo cáo
depends_on:
  - TELEMETRY-PIPELINE
  - ENTITLEMENT-MODEL
---

# Báo cáo cơ bản

## 1. Objective

Trả lời câu hỏi của phụ huynh: **"con tôi đã chơi gì và có tiến bộ không"**.

Đây là thứ tạo ra quyết định trả tiền. Một phụ huynh thấy giá trị qua báo cáo sẽ nâng gói;
một phụ huynh không thấy gì sẽ rời đi sau hai tuần.

Báo cáo cơ bản đọc dữ liệu tổng hợp từ
[`telemetry-pipeline.md`](../01-platform/telemetry-pipeline.md), **không** đọc
`mastery_state`. Bản đồ tiến bộ và huy hiệu là bề mặt khác, mở rộng ở P3 qua
[`progress-and-mastery.md`](../04-play/progress-and-mastery.md) — spec này cố ý dừng trước
ranh giới đó (`D-AK`).

## 2. Actors

| Actor | Cần entitlement |
|---|---|
| User đã đăng nhập | `view_basic_report` — mọi User có |
| Trẻ | Cấm thấy màn hình này |

## 3. Entry points

`/me/children/{uuid}/report` · `GET /api/users/children/{uuid}/reports/basic`.

## 4. Main flow

1. Chọn trẻ và khoảng thời gian (7 / 30 ngày).
2. Server đọc **bảng rollup**, không quét event thô.
3. Hiện sáu mục §7.1.
4. Mỗi mục kèm một câu **giải thích bằng ngôn ngữ thường**, không thuật ngữ.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Chưa có dữ liệu | Hiện "bé chưa chơi lần nào", gợi ý 3 game phù hợp |
| Ít hơn 3 phiên | Hiện dữ liệu có, kèm "cần thêm dữ liệu để đánh giá" |
| Trẻ đã archive | Xem được, chỉ đọc |
| Trẻ chơi ở nhiều version nội dung | Ghi chú "nội dung đã cập nhật" tại mốc đổi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-BRP-01` | Đọc từ **rollup**, không quét `telemetry_events` | `BR-TLM-01` |
| `BR-BRP-02` | Cấm — **NEVER ngôn ngữ chẩn đoán** — dùng đúng bảng nhãn [`adaptive-engine.md`](../01-platform/adaptive-engine.md) §7.4 | Báo cáo phản ánh **hiệu suất trong hệ thống**, không phải năng lực của đứa trẻ |
| `BR-BRP-03` | Mọi màn hình báo cáo mang câu **miễn trừ** §7.2 | Minh bạch bản chất dữ liệu học tập và tránh việc phụ huynh hiểu nhầm thành chẩn đoán y tế |
| `BR-BRP-04` | Cấm — **NEVER so sánh với trẻ khác** hay với "chuẩn độ tuổi" | `BR-CDC-09` và ranh giới sư phạm |
| `BR-BRP-05` | Ownership kiểm ở DB | Bảo mật thông tin tiến độ học tập của trẻ, ngăn chặn truy cập trái phép từ tài khoản khác |
| `BR-BRP-06` | Dữ liệu < 3 phiên → nhãn `Chưa có đủ dữ liệu` | Kết luận từ 1 phiên là kết luận sai |
| `BR-BRP-07` | Mỗi chỉ số kèm **một câu giải thích thường** | Số không giải thích được là số vô dụng với phụ huynh |
| `BR-BRP-08` | Cấm — **NEVER hiện `p_learn` thô hay phần trăm thành thạo** | Số chính xác giả tạo mời so sánh |

## 7. Data

### 7.1 Sáu mục

| Mục | Nội dung | Câu giải thích mẫu |
|---|---|---|
| Hoạt động | Số phiên · tổng phút · số ngày chơi | "Bé chơi 5 ngày trong tuần qua, tổng 68 phút." |
| Hoàn thành | Tỉ lệ hoàn thành level đã mở | "Bé hoàn thành 12 trên 15 lần chơi." |
| Kỹ năng đã tiếp xúc | Danh sách skill kèm nhãn thành thạo | "Bé đã làm quen 7 kỹ năng." |
| Trò chơi yêu thích | 3 level chơi nhiều nhất | "Bé thích nhất trò đếm quả." |
| Gần đây | 5 phiên gần nhất kèm sao | |
| Gợi ý | 3 hoạt động cho tuần tới, gồm ≥1 ngoài màn hình | "Tuần tới bé có thể thử…" |

### 7.2 Câu miễn trừ

*"Báo cáo phản ánh hoạt động của bé trong ứng dụng, không phải đánh giá năng lực hay chẩn
đoán phát triển. Mỗi bé có nhịp riêng."*

### 7.3 Nhãn được dùng

`Chưa có đủ dữ liệu` · `Mới làm quen` · `Đang phát triển` · `Khá ổn định` ·
`Thành thạo trong phạm vi bài tập`.

Cấm Tuyệt đối không: "chậm", "kém", "có vấn đề", "dưới chuẩn", "IQ", bất kỳ chẩn đoán nào.

## 8. API contract

### `GET /api/users/children/{uuid}/reports/basic`

| | |
|---|---|
| Auth | `requireUserAuth()` + ownership |
| Query | `?period=7d\|30d` |
| 200 | §7.1 |
| 403 | `ENTITLEMENT_REQUIRED` |
| 404 | Trẻ không thuộc caller |

## 9. Acceptance criteria

```gherkin
Scenario: BR-BRP-02 — không có ngôn ngữ chẩn đoán
  When render mọi nhãn và câu giải thích có thể có
  Then không chuỗi nào chứa chậm, kém, có vấn đề, dưới chuẩn, IQ, hay rối loạn

Scenario: BR-BRP-03 — câu miễn trừ luôn có
  When mở báo cáo
  Then câu miễn trừ hiển thị

Scenario: BR-BRP-04 — không so sánh
  When đọc toàn bộ nội dung báo cáo
  Then không có so sánh với trẻ khác hay với chuẩn độ tuổi

Scenario: BR-BRP-06 — ít dữ liệu thì nói rõ
  Given trẻ mới chơi 2 phiên
  When mở báo cáo
  Then nhãn thành thạo là "Chưa có đủ dữ liệu"

Scenario: BR-BRP-08 — không hiện số thành thạo
  When đọc response
  Then không có p_learn hay phần trăm thành thạo

Scenario: BR-BRP-01 — không quét event thô
  When đọc truy vấn phục vụ báo cáo
  Then không truy vấn nào SELECT từ telemetry_events

Scenario: BR-BRP-05 — không xem được trẻ người khác
  Given trẻ X thuộc user B
  When user A gọi báo cáo của X
  Then trả 404

Scenario: BR-BRP-07 — mỗi chỉ số có giải thích
  When mở báo cáo có dữ liệu
  Then mỗi trong sáu mục có một câu tiếng Việt giải thích

Scenario: chưa chơi lần nào
  Given trẻ chưa có phiên nào
  When mở báo cáo
  Then hiện thông báo thân thiện và 3 gợi ý game
```

## 10. Boundaries

**Always**
- Đọc từ rollup.
- Dùng đúng bảng nhãn chuẩn.
- Kèm câu miễn trừ và câu giải thích.

**Ask first**
- Thêm mục vào báo cáo.
- Đổi bảng nhãn.

**Never**
- Ngôn ngữ chẩn đoán hay so sánh.
- Hiện `p_learn` thô.
- Quét event thô.
- Kết luận từ dưới 3 phiên.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có gửi báo cáo tuần qua email không, và mặc định bật hay tắt? | Kênh thông báo | P1 | Chốt: Gửi email tổng kết tuần (weekly digest); mặc định bật khi đăng ký, có thể tắt trong cài đặt (`notification-service.md`) |
| 2 | Gợi ý hoạt động ngoài màn hình lấy từ đâu khi `lessons` chưa có ở P1? | Nội dung gợi ý | P1 | Chốt D-BB (khớp với [`healthy-play-limits.md`](../04-play/healthy-play-limits.md) Q3): Dùng danh sách tĩnh 12 hoạt động ngoài màn hình dạng seed file |

