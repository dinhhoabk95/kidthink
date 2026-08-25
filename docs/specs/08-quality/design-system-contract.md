---
spec: DESIGN-SYSTEM-CONTRACT
title: Contract design system
area: quality
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Token, kit component, quy tắc bốn bề mặt
depends_on:
  - ACCESSIBILITY
---

# Contract design system

## 1. Objective

Một hệ thống, **bốn bề mặt, bốn tiêu chuẩn**. Bề mặt trẻ và bề mặt người lớn có ràng buộc
khác nhau tới mức nếu dùng chung một bộ luật thì một trong hai sẽ sai.

Spec này sở hữu **ràng buộc kỹ thuật** của design system. Ngôn ngữ thị giác đầy đủ ở
`docs/design-system/`.

## 2. Actors

Dev UI · reviewer.

## 3. Entry points

`packages/ui/assets/css/tailwind.css` `@theme` · `packages/ui/app.config.ts` ·
`packages/game-engine/src/systems/designTokens.ts`.

## 4. Main flow

1. Token khai báo ở **một nơi** mỗi tầng: CSS `@theme` cho Vue, `designTokens.ts` cho canvas.
2. Component dùng token, không dùng giá trị thô.
3. cổng tự động ép bằng `pnpm --filter @mindkid/gates test` và grep hex trong `.vue`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Cần màu chưa có token | **Ask first** — thêm token, không dùng hex |
| Canvas cần màu | Lấy từ `designTokens.ts`, không từ CSS |
| Component thư viện không đủ | Mở rộng qua `app.config.ts`, không tạo kit thứ hai |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-DSC-01` | Cấm — **NEVER hex literal trong `.vue`** — template, `<style>`, hay inline `:style` | Màu ngoài token phá tính nhất quán và có thể không đạt contrast |
| `BR-DSC-02` | Cấm — **NEVER hex literal trong `packages/game-engine`** ngoài `designTokens.ts` | Ép bằng `pnpm --filter @mindkid/gates test` |
| `BR-DSC-03` | **Nuxt UI v4 là kit duy nhất.** Cấm — NEVER tái sinh shadcn-vue (`components/ui/`, `cn()`, `cva`, `clsx`, `tailwind-merge`, `lucide-vue-next`) | Hai kit là hai hệ thống phải bảo trì |
| `BR-DSC-04` | **Một icon library**: `i-lucide-*` qua `<UIcon>`. Icon dạng dữ liệu là **chuỗi** | Truyền component qua `<component :is>` làm không serialize được |
| `BR-DSC-05` | Cấm — **NEVER emoji làm affordance** — nav, button, HUD, trạng thái, empty state đều SVG | Render khác theo OS · không recolour · không mang được focus ring |
| `BR-DSC-06` | Cấm — **NEVER `dark:` trên bề mặt trẻ** | Light-only mọi breakpoint, bất kể tuỳ chọn hệ thống |
| `BR-DSC-07` | Cấm — **NEVER `danger`/đỏ trên bề mặt trẻ** — dùng `retry` hổ phách | Đỏ đọc thành trừng phạt ở tuổi 3–6 |
| `BR-DSC-08` | App-level `@theme` **kế thừa**, Cấm — **NEVER định nghĩa lại** token thương hiệu | Hai định nghĩa là hai giá trị |
| `BR-DSC-09` | SFC đúng thứ tự `<template>` → `<script setup>` → `<style scoped>` | Quy chuẩn SFC Vue 3 giúp dễ đọc và nhất quán |
| `BR-DSC-10` | **Một CTA chính mỗi màn hình** | Hai thứ cùng màu cam thì không cái nào đọc thành hành động |
| `BR-DSC-11` | Tablet-first: **`active:`** mang phản hồi nhấn, không phải `hover:` | Tablet không có hover |
| `BR-DSC-12` | Chỉ animate `transform` và `opacity`. Cấm — NEVER `width`/`height`/`top` | Gây reflow |
| `BR-DSC-13` | File `.vue` ≤ **800 dòng** | File quá dài gây khó đọc và bảo trì, nên tách component |
| `BR-DSC-14` | Cấm — **NEVER `rounded-md`/`rounded-lg`** — chúng là mặc định shadcn, ngoài hệ thống | Đảm bảo nhất quán với hệ thống radius thiết kế riêng |

## 7. Data

### 7.1 Bốn bề mặt

Ngưỡng sàn chạm do `BR-A11-04` của [`accessibility.md`](accessibility.md) sở hữu (64px / 76px / 96px cho bề mặt trẻ, 44px người lớn, sàn tuyệt đối 24px).

| Bề mặt | Ở đâu | Touch floor | Dark mode | Đỏ |
|---|---|---|---|:--:|
| **Kid** | `components/kid/`, `pages/play/`, gameboard | `BR-A11-04` | Cấm | Cấm |
| **Account** | `pages/me/**` | `BR-A11-04` | | |
| **Public** | trang công khai | `BR-A11-04` | | |
| **Admin** | app admin (studio 40px) | `BR-A11-04` (studio 40px) | | |

### 7.2 Token

Mỗi họ màu dùng làm alias cho Nuxt UI v4 có đủ 11 bậc `50…950` để component kit không bị hỏng khi hiển thị trạng thái hover, focus hay subtle background.

| Họ / Alias | Token | Neo 600 / Giá trị | Dùng ở đâu |
|---|---|---|---|
| `primary` / `brand` | `brand-50 … brand-950` | `#1a7f6b` (Teal) | Nhận diện, nav đang chọn, link, focus ring |
| `cta` | `cta-50 … cta-950` | `#c2410c` (Cam) | Đúng một hành động chính mỗi màn (`BR-DSC-10`) |
| `neutral` / `surface` | `surface-50 … surface-950` + `surface-0` (`#ffffff`) | `#57534e` (Stone) | Nền, chữ, viền (`surface-400` viền/placeholder) |
| `retry` | `retry-50 … retry-950` | `#d97706` (Hổ phách) | **Chỉ** bề mặt trẻ, thay `danger`/đỏ (`BR-DSC-07`) |
| `success` | `success-50 … success-950` | `#16a34a` (Lá) | Thành công, đạt mục tiêu (bề mặt người lớn) |
| `warning` | `warning-50 … warning-950` | `#ca8a04` (Vàng) | Cảnh báo (bề mặt người lớn) |
| `error` / `danger` | `danger-50 … danger-950` | `#dc2626` (Đỏ) | Lỗi, xoá, cảnh báo nghiêm trọng (bề mặt người lớn) |
| `info` | Ánh xạ về họ `brand` | `#1a7f6b` | Thông tin phụ trợ |
| `secondary` | Ánh xạ về họ `surface` | `#57534e` | Nút phụ, trung tính |
| Năng lực C1–C6 | `competency-c1 … c6` | C1 `#1d4ed8`, C2 `#7c3aed`, C3 `#4d7c0f`, C4 `#0e7490`, C5 `#be185d`, C6 `#a16207` | Màu dữ liệu cho 6 năng lực tư duy |
| Font | `--font-sans`: Be Vietnam Pro · `--font-heading`: Baloo 2 · Canvas dùng font số riêng |

`surface-400` **chỉ** là màu viền/placeholder — không đạt 4,5:1 làm body text.


### 7.3 Radius

| Phần tử | Radius |
|---|---|
| Chip, badge, control nhỏ | 12px `rounded-xl` |
| Button, input, card nhỏ | 16px `rounded-2xl` |
| Card, panel, modal | 24px `rounded-3xl` |
| Avatar, icon button, pill | `rounded-full` |

### 7.4 Motion

| Token | Thời lượng | Dùng cho |
|---|---|---|
| instant | 90ms | nhấn xuống |
| quick | 160ms | fade |
| base | 200ms | phần lớn transition |
| snap | 260ms `cubic-bezier(.34,1.56,.64,1)` | thả, đáp |
| settle | 340ms ease-in-out | về nghỉ |

`prefers-reduced-motion` xử lý **toàn cục** ở app stylesheet, không rải per-component.

### 7.5 Kiểm trước merge

```bash
grep -nE '#[0-9a-fA-F]{6}' <file .vue vừa sửa>
grep -rnE 'lucide-vue-next|class-variance-authority|tailwind-merge|\bcn\(' apps packages
grep -rn 'dark:' apps/web/app/components/kid apps/web/app/pages/play
pnpm --filter @mindkid/gates test
```

## 8. API contract

Không có.

## 9. Acceptance criteria

```gherkin
Scenario: BR-DSC-01 — không hex trong .vue
  When quét mọi file .vue
  Then không có hex literal

Scenario: BR-DSC-02 — không hex trong game-engine
  When chạy pnpm --filter @mindkid/gates test
  Then 0 vi phạm ngoài designTokens.ts

Scenario: BR-DSC-03 — một kit duy nhất
  When quét dependency và source
  Then không có lucide-vue-next, cva, clsx, hay tailwind-merge

Scenario: BR-DSC-06 — không dark trên bề mặt trẻ
  When grep dark: trong components/kid và pages/play
  Then không kết quả nào

Scenario: BR-DSC-07 — không đỏ trên canvas
  When kiểm designTokens.ts
  Then không token nào tên danger được dùng trong render bề mặt trẻ

Scenario: BR-DSC-05 — emoji không làm affordance
  When quét .vue tìm emoji trong aria-label, label, hay icon
  Then không kết quả nào

Scenario: BR-DSC-10 — một CTA mỗi màn hình
  When kiểm mọi trang
  Then mỗi trang có tối đa một nút màu CTA

Scenario: BR-DSC-13 — file .vue đủ nhỏ
  When đếm dòng mọi file .vue
  Then không file nào vượt 800 dòng
```

## 10. Boundaries

**Always**
- Dùng token cho mọi màu và font.
- Giữ Nuxt UI v4 là kit duy nhất.
- `active:` cho phản hồi nhấn.

**Ask first**
- Thêm token mới.
- Thêm component thư viện ngoài kit.
- Đổi thang radius hoặc motion.

**Never**
- Hex literal trong `.vue` hoặc trong engine ngoài `designTokens.ts`.
- Kit component thứ hai · icon library thứ hai.
- Emoji làm affordance.
- `dark:` hoặc đỏ trên bề mặt trẻ.
- Định nghĩa lại token thương hiệu ở app level.
- Animate `width`/`height`/`top`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Bộ avatar preset cho trẻ do ai vẽ và bao nhiêu cái?~~ **Đóng 2026-08-09 (T13, `D-AU`)**: cùng câu hỏi với [`child-profile-crud.md`](../03-account/child-profile-crud.md) Q1 — 12 avatar preset SVG do UI Designer vẽ | Tạo hồ sơ trẻ | Đã đóng | D-AU |
| ~~2~~ | ~~Font chữ số trên canvas có cần giấy phép riêng không?~~ **Đóng 2026-08-09 (T13, `D-DM`)**: dùng Google Fonts open-source (OFL license), không tốn phí bản quyền riêng | Giấy phép font | Đã đóng | D-DM |

