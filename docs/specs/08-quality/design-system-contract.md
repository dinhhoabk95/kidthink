---
spec: DESIGN-SYSTEM-CONTRACT
title: Contract design system
area: quality
status: draft
mvp: true
phase: P1
reviewed: 2026-08-04
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
2. Component dùng token, ❌ không dùng giá trị thô.
3. CI ép bằng `pnpm lint:tokens` và grep hex trong `.vue`.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Cần màu chưa có token | **Ask first** — thêm token, ❌ không dùng hex |
| Canvas cần màu | Lấy từ `designTokens.ts`, ❌ không từ CSS |
| Component thư viện ❌ không đủ | Mở rộng qua `app.config.ts`, ❌ không tạo kit thứ hai |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-DSC-01` | ❌ **NEVER hex literal trong `.vue`** — template, `<style>`, hay inline `:style` | Màu ngoài token phá tính nhất quán và có thể ❌ không đạt contrast |
| `BR-DSC-02` | ❌ **NEVER hex literal trong `packages/game-engine`** ngoài `designTokens.ts` | Ép bằng `pnpm lint:tokens` |
| `BR-DSC-03` | **Nuxt UI v4 là kit duy nhất.** ❌ NEVER tái sinh shadcn-vue (`components/ui/`, `cn()`, `cva`, `clsx`, `tailwind-merge`, `lucide-vue-next`) | Hai kit là hai hệ thống phải bảo trì |
| `BR-DSC-04` | **Một icon library**: `i-lucide-*` qua `<UIcon>`. Icon dạng dữ liệu là **chuỗi** | Truyền component qua `<component :is>` làm ❌ không serialize được |
| `BR-DSC-05` | ❌ **NEVER emoji làm affordance** — nav, button, HUD, trạng thái, empty state đều SVG | Render khác theo OS · ❌ không recolour · ❌ không mang được focus ring |
| `BR-DSC-06` | ❌ **NEVER `dark:` trên bề mặt trẻ** | Light-only mọi breakpoint, bất kể tuỳ chọn hệ thống |
| `BR-DSC-07` | ❌ **NEVER `danger`/đỏ trên bề mặt trẻ** — dùng `retry` hổ phách | Đỏ đọc thành trừng phạt ở tuổi 3–6 |
| `BR-DSC-08` | App-level `@theme` **kế thừa**, ❌ **NEVER định nghĩa lại** token thương hiệu | Hai định nghĩa là hai giá trị |
| `BR-DSC-09` | SFC đúng thứ tự `<template>` → `<script setup>` → `<style scoped>` | |
| `BR-DSC-10` | **Một CTA chính mỗi màn hình** | Hai thứ cùng màu cam thì ❌ không cái nào đọc thành hành động |
| `BR-DSC-11` | Tablet-first: **`active:`** mang phản hồi nhấn, ❌ không phải `hover:` | Tablet ❌ không có hover |
| `BR-DSC-12` | Chỉ animate `transform` và `opacity`. ❌ NEVER `width`/`height`/`top` | Gây reflow |
| `BR-DSC-13` | File `.vue` ≤ **800 dòng** | |
| `BR-DSC-14` | ❌ **NEVER `rounded-md`/`rounded-lg`** — chúng là mặc định shadcn, ngoài hệ thống | |

## 7. Data

### 7.1 Bốn bề mặt

| Bề mặt | Ở đâu | Touch floor | Dark mode | Đỏ |
|---|---|---|---|:--:|
| **Kid** | `components/kid/`, `pages/play/`, gameboard | 64px (chính 76px, band 3–4 96px) | ❌ | ❌ |
| **Account** | `pages/me/**` | 44px | ✅ | ✅ |
| **Public** | trang công khai | 44px | ✅ | ✅ |
| **Admin** | app admin (studio 40px) | 44px | ✅ | ✅ |

### 7.2 Token

| Họ | Token |
|---|---|
| Brand | `brand-50 … brand-900`, core `brand-600` |
| CTA | `cta`, `cta-hover`, `cta-light` |
| Surface | `surface-50 … surface-900` |
| Semantic | `success-` / `warning-` / `danger-` × 400/500/600 |
| Canvas riêng | `retry` (hổ phách) — thay `danger` trên bề mặt trẻ |
| Font | `--font-sans` · `--font-heading` · canvas dùng font chữ số riêng |

`surface-400` **chỉ** là màu viền/placeholder — ❌ không đạt 4,5:1 làm body text.

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

`prefers-reduced-motion` xử lý **toàn cục** ở app stylesheet, ❌ không rải per-component.

### 7.5 Kiểm trước merge

```bash
grep -nE '#[0-9a-fA-F]{6}' <file .vue vừa sửa>
grep -rnE 'lucide-vue-next|class-variance-authority|tailwind-merge|\bcn\(' apps packages
grep -rn 'dark:' apps/web/app/components/kid apps/web/app/pages/play
pnpm lint:tokens
```

## 8. API contract

Không có.

## 9. Acceptance criteria

```gherkin
Scenario: BR-DSC-01 — không hex trong .vue
  When quét mọi file .vue
  Then không có hex literal

Scenario: BR-DSC-02 — không hex trong game-engine
  When chạy pnpm lint:tokens
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

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Bộ avatar preset cho trẻ do ai vẽ và bao nhiêu cái? | `child-profile-crud` Q1 |
| 2 | Font chữ số trên canvas có cần giấy phép riêng không? | P1 |
