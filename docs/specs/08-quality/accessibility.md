---
spec: ACCESSIBILITY
title: Tiêu chuẩn tiếp cận
area: quality
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
owns:
  - Ngưỡng a11y theo bề mặt
depends_on:
  - DESIGN-SYSTEM-CONTRACT
---

# Tiêu chuẩn tiếp cận

## 1. Objective

Sàn **WCAG 2.1 AA** cho bề mặt người lớn, và một bộ ràng buộc **riêng, chặt hơn** cho bề mặt
trẻ — vì trẻ 3–6 chưa đọc, vận động tinh chưa đủ, và ❌ không tự xoay xở khi giao diện khó.

Nhiều ràng buộc a11y ở đây trùng với ràng buộc "dùng được cho trẻ". Đó ❌ không phải trùng
lặp — nó là cùng một điều: thiết kế cho người có năng lực khác nhau.

## 2. Actors

Trẻ 3–6 · người lớn · người dùng công nghệ trợ giúp.

## 3. Entry points

`@axe-core/playwright` trên mọi page object · checklist review UI.

## 4. Main flow

1. Mọi page object có test axe.
2. CI fail khi có violation.
3. Ràng buộc bề mặt trẻ §7.2 kiểm bằng DOM snapshot và test riêng.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Axe báo false positive | Ghi lý do trong code, ❌ không tắt rule toàn cục |
| Canvas ❌ không kiểm được bằng axe | Kiểm bằng test riêng §7.2 |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-A11-01` | **0 violation** axe trên mọi page object | |
| `BR-A11-02` | Contrast ≥ **4,5:1** body, ≥ **3:1** chữ lớn và viền UI | |
| `BR-A11-03` | ❌ **NEVER màu là kênh duy nhất** — kèm hình, icon, chuyển động, hoặc chữ | Trẻ mù màu và màn hình kém |
| `BR-A11-04` | Sàn chạm: trẻ **64px** (chính **76px**, band 3–4 **96px**), người lớn **44px**, sàn tuyệt đối **24px** | Vận động tinh của trẻ 3 tuổi |
| `BR-A11-05` | Focus ring **thấy rõ** trên mọi control, offset ≥2px | |
| `BR-A11-06` | Icon-only control **bắt buộc** `aria-label` | |
| `BR-A11-07` | Biểu đồ **bắt buộc** có nhãn văn bản tương đương | `BR-ARP-03` |
| `BR-A11-08` | Body ≥ **16px** trên mobile; input ≥16px | Dưới đó iOS tự zoom |
| `BR-A11-09` | Tiếng Việt: `line-height` ≥ **1,4**; ❌ **NEVER `uppercase`** | Dấu xếp cao; uppercase làm mất dấu về thị giác |
| `BR-A11-10` | `prefers-reduced-motion` xử lý **toàn cục**, giảm chứ ❌ không bỏ | `BR-ENG-*` |
| `BR-A11-11` | Bề mặt trẻ: chỉ dẫn **❌ không bao giờ chỉ bằng chữ** | Người dùng chưa đọc |
| `BR-A11-12` | Modal trap focus và **trả focus** khi đóng | |
| `BR-A11-13` | Tab order khớp thứ tự thị giác | |

## 7. Data

### 7.1 Bốn bề mặt, bốn ngưỡng

| Bề mặt | Sàn chạm | Dark mode | Chỉ dẫn |
|---|---|---|---|
| Kid (`/play`, gameboard) | 64px · chính 76px · band 3–4 **96px** | ❌ light only | Âm thanh + hình, ❌ không chỉ chữ |
| Account | 44px | ✅ | Chữ được |
| Public | 44px | ✅ | Chữ được |
| Admin | 44px (studio 40px) | ✅ | Chữ được |

Sàn tuyệt đối mọi nơi **24×24px** (WCAG 2.2 AA 2.5.8).

### 7.2 Bề mặt trẻ — kiểm riêng, ❌ axe ❌ không bắt được

- [ ] Mọi chỉ dẫn có kênh **âm thanh hoặc hình**
- [ ] Phản hồi đúng/sai ❌ không chỉ bằng màu
- [ ] Mọi phần tử chạm đạt sàn band tuổi, đo ở tỉ lệ 100%
- [ ] ❌ Không cử chỉ hai ngón, pinch, xoay, hay drag chính xác
- [ ] Mọi mechanic drag có **fallback tap-tap** cho band 3–4
- [ ] `reduced-motion` vẫn giữ được kênh phản hồi
- [ ] ❌ Không chữ dưới 16px
- [ ] ❌ Không đỏ làm tín hiệu

### 7.3 Kiểm tra trước merge UI

```bash
grep -nE '#[0-9a-fA-F]{6}' <file vừa sửa>            # hex literal
grep -rn 'dark:' apps/web/app/pages/play             # dark trên bề mặt trẻ
grep -rnE '(aria-label|label)="[^"]*[\x{1F300}-\x{1FAFF}]'  # emoji làm affordance
```

- [ ] Touch target đạt sàn của bề mặt
- [ ] Icon-only có `aria-label`
- [ ] Focus ring thấy rõ
- [ ] Contrast kiểm ở cả light và dark (bề mặt người lớn)
- [ ] Responsive 375 / 768 / 1024 / 1440, ❌ không scroll ngang

## 8. API contract

Không có.

## 9. Acceptance criteria

```gherkin
Scenario: BR-A11-01 — 0 violation axe
  When chạy axe trên mọi page object
  Then không violation nào

Scenario: BR-A11-04 — sàn chạm bề mặt trẻ
  Given một level cho band 3-4
  When đo mọi phần tử chạm được ở tỉ lệ 100%
  Then không phần tử nào nhỏ hơn 96px

Scenario: BR-A11-03 — màu không phải kênh duy nhất
  Given giả lập màn hình đơn sắc
  When trẻ thao tác đúng và sai
  Then vẫn phân biệt được qua chuyển động hoặc hình

Scenario: BR-A11-11 — chỉ dẫn không chỉ bằng chữ
  When kiểm mọi level published
  Then mỗi level có chỉ dẫn âm thanh hoặc trình diễn hình

Scenario: BR-A11-09 — tiếng Việt không uppercase
  When quét CSS tìm text-transform uppercase
  Then không áp lên phần tử chứa tiếng Việt

Scenario: BR-A11-06 — icon-only có nhãn
  When quét component tìm control chỉ có icon
  Then mỗi cái có aria-label

Scenario: BR-A11-10 — reduced-motion giảm không bỏ
  Given prefers-reduced-motion bật
  When trẻ hoàn thành level
  Then vẫn có phản hồi ăn mừng

Scenario: BR-A11-12 — modal trả focus
  When mở rồi đóng một modal
  Then focus trở về phần tử đã mở nó
```

## 10. Boundaries

**Always**
- Axe trên mọi page object.
- Kiểm bề mặt trẻ bằng test riêng §7.2.
- Đo touch target ở tỉ lệ 100%.

**Ask first**
- Tắt một rule axe.
- Hạ sàn chạm của bất kỳ bề mặt nào.

**Never**
- Màu là kênh duy nhất.
- Chỉ dẫn chỉ bằng chữ trên bề mặt trẻ.
- `uppercase` trên tiếng Việt.
- Bỏ hoàn toàn chuyển động khi reduced-motion.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có kiểm thử với trẻ thật và với người dùng công nghệ trợ giúp trước go-live không? | Chất lượng |
| 2 | Sàn 96px cho band 3–4 dựa trên nguồn nào? Cần đối chiếu tài liệu | P1 |
