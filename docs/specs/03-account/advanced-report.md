---
spec: ADVANCED-REPORT
title: Báo cáo nâng cao
area: account
status: implemented
mvp: true
phase: P3
reviewed: 2026-08-08
owns:
  - Nội dung báo cáo nâng cao
  - Ngưỡng dữ liệu tối thiểu để kết luận
depends_on:
  - BASIC-REPORT
  - ADAPTIVE-ENGINE
  - ENTITLEMENT-MODEL
---

# Báo cáo nâng cao

## 1. Objective

Đây là **giá trị bán được** của gói trả phí: nhìn sâu theo competency, domain, skill, và xu
hướng theo tuần.

Nó cũng là nơi rủi ro lớn nhất về ngôn ngữ — càng chi tiết càng dễ đọc thành chẩn đoán. Mọi
ràng buộc của [`basic-report.md`](basic-report.md) áp ở đây **chặt hơn**.

## 2. Actors

User có `view_advanced_report` (gói `standard` và `premium`).

## 3. Entry points

`/me/children/{uuid}/report/advanced` ·
`GET /api/users/children/{uuid}/reports/advanced`.

## 4. Main flow

1. Chọn trẻ, khoảng thời gian (30 / 90 ngày).
2. Đọc rollup + `mastery_state`.
3. Hiện bảy mục §7.1.
4. Mỗi mục có ngưỡng dữ liệu tối thiểu; dưới ngưỡng → `Chưa có đủ dữ liệu`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Không có entitlement | **403** kèm mời nâng cấp, hiện **mẫu** báo cáo với dữ liệu ẩn |
| Dữ liệu trải nhiều version nội dung | Ghi chú tại mốc đổi — `BR-VER-05` |
| Skill chỉ chơi 1 lần | Hiện trong "đã tiếp xúc", không trong đánh giá |
| Xuất PDF | Add-on, ngoài MVP |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ARP-01` | Mọi ràng buộc ngôn ngữ của [`basic-report.md`](basic-report.md) áp ở đây | Đảm bảo nhất quán nguyên tắc ngôn ngữ tích cực và tránh gây hoang mang cho người lớn theo `BR-REP-01` |
| `BR-ARP-02` | Ngưỡng dữ liệu tối thiểu §7.2 — dưới ngưỡng **không kết luận** | Chi tiết hơn không có nghĩa là chắc chắn hơn |
| `BR-ARP-03` | Biểu đồ **luôn có nhãn văn bản thay thế** | A11y, và biểu đồ một mình dễ đọc sai |
| `BR-ARP-04` | Xu hướng hiện **hướng đi**, không hiện độ dốc chính xác | Độ dốc chính xác từ dữ liệu thưa là chính xác giả tạo |
| `BR-ARP-05` | Cấm — **NEVER dự đoán tương lai** — không "bé sẽ đạt X vào tháng sau" | Vượt ranh giới của một sản phẩm giáo dục |
| `BR-ARP-06` | Mục "cần củng cố" nói **hành động cụ thể**, không chỉ nêu vấn đề | Nêu thiếu sót mà không nói làm gì tiếp là gây lo lắng vô ích |
| `BR-ARP-07` | Cấm — **NEVER so sánh với chuẩn độ tuổi bên ngoài** | Không có chuẩn nào áp được cho một tập bài tập cụ thể |
| `BR-ARP-08` | Cảnh báo khi dữ liệu trải nhiều version nội dung | `BR-VER-05` |

## 7. Data

### 7.1 Bảy mục

| Mục | Nội dung | Ngưỡng tối thiểu |
|---|---|---|
| Sáu năng lực | Nhãn thành thạo mỗi competency | ≥5 phiên mỗi competency |
| Theo nhánh (strand) | Nhãn mỗi strand đã chạm | ≥3 phiên mỗi strand |
| Theo kỹ năng | Bảng skill + nhãn + số lần | ≥3 phiên mỗi skill |
| Xu hướng theo tuần | Hướng đi của mức hoạt động và tỉ lệ hoàn thành | ≥3 tuần có dữ liệu |
| Mức độ độc lập | Tỉ lệ hoàn thành không cần trợ giúp | ≥10 phiên |
| Cần củng cố | Skill `p_learn < 0.4` + **hành động cụ thể** | ≥3 phiên mỗi skill |
| Sẵn sàng học tiếp | Skill `p_learn ≥ 0.8` có skill kế trong DAG | ≥3 phiên |

### 7.2 Nguyên tắc ngưỡng

Dưới ngưỡng → hiện `Chưa có đủ dữ liệu` kèm số phiên còn thiếu. Cấm — **NEVER** ẩn mục — ẩn đi
làm người lớn tưởng tính năng hỏng.

### 7.3 Mục "cần củng cố" — mẫu

> **Đếm trong phạm vi 5** — Đang phát triển
> Bé đã thử 6 lần, hoàn thành 2 lần không cần trợ giúp.
> **Có thể thử:** cùng bé đếm đồ vật thật khi dọn bàn ăn · trò chơi "Đếm quả táo" (mức dễ hơn)

Cấu trúc cố định: nhãn → dữ liệu → **hành động**. Cấm có mục nào dừng ở "dữ liệu".

## 8. API contract

### `GET /api/users/children/{uuid}/reports/advanced`

| | |
|---|---|
| Auth | `requireUserAuth()` + ownership + `view_advanced_report` |
| Query | `?period=30d\|90d` |
| 200 | §7.1 |
| 403 | `ENTITLEMENT_REQUIRED` kèm `upgrade_package_codes` |
| 404 | Trẻ không thuộc caller |

## 9. Acceptance criteria

```gherkin
Scenario: BR-ARP-02 — dưới ngưỡng không kết luận
  Given một competency chỉ có 2 phiên
  When mở báo cáo nâng cao
  Then mục đó hiện "Chưa có đủ dữ liệu"
  And nêu còn thiếu bao nhiêu phiên

Scenario: BR-ARP-02 — không ẩn mục
  Given nhiều mục dưới ngưỡng
  Then mọi mục vẫn hiển thị với trạng thái chưa đủ dữ liệu

Scenario: BR-ARP-05 — không dự đoán
  When đọc toàn bộ nội dung
  Then không câu nào dự đoán kết quả tương lai

Scenario: BR-ARP-06 — cần củng cố kèm hành động
  Given một skill p_learn dưới 0.4 với đủ dữ liệu
  Then mục đó có ít nhất một gợi ý hành động cụ thể

Scenario: BR-ARP-03 — biểu đồ có nhãn thay thế
  When render mọi biểu đồ
  Then mỗi biểu đồ có mô tả văn bản tương đương

Scenario: BR-ARP-07 — không so chuẩn ngoài
  When đọc nội dung
  Then không có so sánh với chuẩn độ tuổi hay trẻ khác

Scenario: không có entitlement thì mời nâng cấp
  Given user không có view_advanced_report
  When mở báo cáo nâng cao
  Then trả 403
  And UI hiện mẫu báo cáo với dữ liệu ẩn và nút nâng cấp

Scenario: BR-ARP-08 — cảnh báo khi nội dung đã đổi
  Given dữ liệu trải qua hai version của một level
  Then biểu đồ có chỉ báo tại mốc đổi version
```

## 10. Boundaries

**Always**
- Áp ngưỡng dữ liệu tối thiểu.
- Hiện mục dưới ngưỡng thay vì ẩn.
- Kèm hành động cụ thể cho mục "cần củng cố".
- Nhãn văn bản cho mọi biểu đồ.

**Ask first**
- Thêm mục hoặc đổi ngưỡng.
- Thêm biểu đồ mới.

**Never**
- Dự đoán tương lai.
- So sánh với chuẩn ngoài hay trẻ khác.
- Kết luận dưới ngưỡng dữ liệu.
- Nêu thiếu sót mà không nói làm gì tiếp.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Ngưỡng 3–10 phiên đã đủ để kết luận chưa? Cần kiểm chứng thống kê trên dữ liệu thật~~ **Đóng 2026-08-11 (P3.7, `D-NA`)**: giữ ngưỡng 3–10 phiên cho MVP; theo dõi độ biến động dữ liệu thực tế để tinh chỉnh ở P4 | Đã đóng | Hoãn tinh chỉnh sang P4 | D-NA |
| ~~2~~ | ~~Gợi ý hành động lấy từ đâu — soạn tay theo skill, hay sinh từ activity `home_activity`?~~ **Đóng 2026-08-11 (P3.7, `D-MY`)**: soạn tay theo từng skill, quản lý qua bảng `skill_action_suggestions` và seed theo lô (không sinh tự động runtime theo quyết định `D-STRUCTURED` / D7) | Đã đóng | Bảng `skill_action_suggestions` | D-MY |

