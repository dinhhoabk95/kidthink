# Checklist — Task #26: P1.1 — Ràng buộc chất lượng & thiết kế UI

> Kế hoạch: [`26-p1-1-ui-quality-contract-plan.md`](26-p1-1-ui-quality-contract-plan.md).
> Bước **đầu tiên của P1**. Sản phẩm là **cổng**, không phải màn hình.
> Quy tắc xuyên suốt: cổng nào chưa từng đỏ thì chưa tính là cổng (`D-FC`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **Cổng ra P0 đã đóng** — 35 spec, đọc §11 của [`security-checklist.md`](../specs/08-quality/security-checklist.md), không mục đỏ.
- [ ] Human approve kế hoạch và năm quyết định D-FB · D-FC · D-FD · D-FE · D-FF.
- [ ] Đọc `docs/design-system/` — ngôn ngữ thị giác là đầu vào, không viết lại ở đây.
- [ ] Đối chiếu `BR-DSC-*` `BR-A11-*` `BR-PRF-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Token, hai tầng một nguồn

- [ ] `@theme` trong `packages/ui`: `brand-50…900` (core `brand-600`), `cta`/`cta-hover`/`cta-light`, `surface-50…900`, semantic 400/500/600, `retry`, font.
- [ ] `packages/game-engine/src/systems/designTokens.ts` — cùng giá trị màu cho canvas.
- [ ] Thang radius 12 / 16 / 24 / full khai thành token.
- [ ] Thang motion instant 90 · quick 160 · base 200 · snap 260 · settle 340 khai thành token.
- [ ] `prefers-reduced-motion` xử lý **một chỗ** ở app stylesheet, giảm chứ không bỏ (`BR-A11-10`).
- [ ] `surface-400` ghi rõ chỉ dùng viền/placeholder — không đạt 4,5:1 cho body.
- [ ] Test đối chiếu `@theme` ↔ `designTokens.ts`, lệch là đỏ.
- [ ] Ca âm `BR-DSC-08`: định nghĩa lại token thương hiệu ở `apps/web` → cổng đỏ.

### Task 2 — `pnpm lint:tokens` mở rộng

- [ ] `BR-DSC-01` hex trong `.vue` → đỏ (template, `<style>`, inline `:style`).
- [ ] `BR-DSC-02` hex trong `packages/game-engine` ngoài `designTokens.ts` → đỏ.
- [ ] `BR-DSC-03` `lucide-vue-next` · `class-variance-authority` · `clsx` · `tailwind-merge` · `cn(` · `components/ui/` → đỏ.
- [ ] `BR-DSC-05` emoji trong `aria-label`/`label`/vị trí icon → đỏ.
- [ ] `BR-DSC-06` `dark:` trong `components/kid`, `pages/play` → đỏ.
- [ ] `BR-DSC-13` `.vue` > 800 dòng → đỏ.
- [ ] `BR-DSC-14` `rounded-md`/`rounded-lg` → đỏ.
- [ ] `BR-A11-09` `uppercase` trên phần tử tiếng Việt → đỏ.
- [ ] **Mỗi rule một fixture vi phạm + test khẳng định exit ≠ 0** (`D-FC`).
- [ ] Quét cả `pnpm-lock.yaml` cho kit thứ hai, không chỉ source.

### Task 3 — Kit và hằng số ngưỡng

- [ ] Nuxt UI v4 + Tailwind v4 vào **catalog**; app khai `catalog:` (`BR-RBS-06`).
- [ ] `packages/ui/app.config.ts` là chỗ mở rộng kit duy nhất.
- [ ] `BR-DSC-04` icon là **chuỗi** `i-lucide-*` qua `<UIcon>`; ca âm `<component :is>` bị chặn.
- [ ] `BR-A11-04` hằng số một nguồn: 96 / 76 / 64 / 44 / 40 / 24 (`D-FF`).
- [ ] Bảng bốn bề mặt khai dạng dữ liệu: bề mặt → sàn chạm, dark, đỏ.
- [ ] `BR-DSC-09` thứ tự SFC `<template>` → `<script setup>` → `<style scoped>`.
- [ ] `BR-DSC-10` một CTA chính mỗi màn hình — quy ước ghi rõ, kiểm ở review.
- [ ] `BR-DSC-11` `active:` mang phản hồi nhấn, không `hover:`.
- [ ] `BR-DSC-12` chỉ animate `transform` và `opacity`.
- [ ] `pnpm lint:deps` xanh — kit không rò ngược vào `packages/game-engine`.

### Task 4 — Harness axe

- [ ] Playwright + `@axe-core/playwright` vào catalog, chạy được local.
- [ ] Page object mẫu cho **bốn** bề mặt: kid · account · public · admin.
- [ ] `BR-A11-01` 0 violation trên mọi page object.
- [ ] Trang mới không có page object → **lỗi cổng**, không mặc định bỏ qua.
- [ ] `BR-A11-05` focus ring thấy rõ, offset ≥2px.
- [ ] `BR-A11-06` icon-only có `aria-label`.
- [ ] `BR-A11-12` modal trap focus và **trả** focus khi đóng.
- [ ] `BR-A11-13` tab order khớp thứ tự thị giác.
- [ ] Ca âm: page object thiếu `aria-label` → cổng **đỏ** (`D-FC`).
- [ ] Bỏ qua rule axe ghi lý do tại chỗ; **không** tắt toàn cục.

### Task 5 — Tám ràng buộc bề mặt trẻ §7.2

- [ ] Chỉ dẫn có kênh âm thanh hoặc hình (`BR-A11-11`) — cấu trúc dữ liệu ép, không nhắc suông.
- [ ] Phản hồi đúng/sai không chỉ bằng màu (`BR-A11-03`), ca âm màn hình đơn sắc.
- [ ] Sàn chạm đo ở **tỉ lệ 100%**, theo band tuổi.
- [ ] Không cử chỉ hai ngón, pinch, xoay, drag chính xác.
- [ ] Mọi mechanic drag có fallback **tap-tap** cho band 3–4.
- [ ] `reduced-motion` vẫn giữ kênh phản hồi.
- [ ] Không chữ < 16px (`BR-A11-08`).
- [ ] Không đỏ làm tín hiệu (`BR-DSC-07`) — chặn ở tầng type nếu làm được.
- [ ] Fixture vi phạm mỗi mục → đỏ, chứng minh test biết đỏ khi P1.2 vi phạm.

### Task 6 — Ngân sách hiệu năng, phần đo được ngay

- [ ] Bảng ngân sách §7.1 khai dạng dữ liệu (180 / 80 / 200 / 120 / 500 KB).
- [ ] `BR-PRF-01` vượt ngân sách → exit ≠ 0, **chặn merge**.
- [ ] Ca âm: dependency đẩy shell qua 180 KB → cổng đỏ.
- [ ] `BR-PRF-02` LCP < 2,5 s và CLS < 0,1 đo dưới **4G throttle** khai tường minh.
- [ ] Thiết bị chuẩn theo `D-CH`: Lenovo Tab M8 2 GB, median ba lần chạy.
- [ ] Cấu hình k6: API P95 < 800 ms, ingest < 200 ms — chạy được trên `/health`.
- [ ] `BR-PRF-08` ảnh WebP ≤960×960 có cổng, kể cả khi chưa có ảnh.
- [ ] **Ghi nợ** (`D-FB`): FPS + `BR-PRF-03/04/05` → P1.2; `fps_sample` + alert → P1.16.

## Cổng dừng

- [ ] Từng cổng mới đã được **chứng minh đỏ** bằng ca âm.
- [ ] Không nguồn thứ hai cho sàn chạm hay màu.
- [ ] Không `.vue` nào chứa hex; không kit thứ hai trong lockfile.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human review diff.

---

## Task 7 — Evidence và promote

- [ ] Mỗi `BR-DSC-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-A11-*` có test tham chiếu mã rule.
- [ ] [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) → `implemented`.
- [ ] [`accessibility.md`](../specs/08-quality/accessibility.md) → `implemented`.
- [ ] [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) **giữ** `approved` — promote ở P1.16.
- [ ] Nợ ngân sách ghi vào todo của P1.2 và P1.16, có địa chỉ rõ.
- [ ] Tick **P1.1** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Kiểm thử với trẻ thật và người dùng công nghệ trợ giúp — a11y §11 Q1, **chặn go-live**, chủ là người quyết.
- [ ] t3.small đủ cho MVP không — perf §11 Q2, **chặn go-live**, chủ là Infra.
- [ ] CDN trước S3 từ đầu hay sau — perf §11 Q3, chặn P2, chủ là Infra.
