# Checklist — Task #26: P1.1 — Ràng buộc chất lượng & thiết kế UI

> Kế hoạch: [`26-p1-1-ui-quality-contract-plan.md`](26-p1-1-ui-quality-contract-plan.md).
> Bước **đầu tiên của P1**. Sản phẩm là **cổng**, không phải màn hình.
> Quy tắc xuyên suốt: cổng nào chưa từng đỏ thì chưa tính là cổng (`D-FC`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **Cổng ra P0 đã đóng** — 35 spec, đọc §11 của [`security-checklist.md`](../specs/08-quality/security-checklist.md), không mục đỏ.
- [x] Human approve kế hoạch và năm quyết định D-FB · D-FC · D-FD · D-FE · D-FF.
- [x] Đọc `docs/design-system/` — ngôn ngữ thị giác là đầu vào, không viết lại ở đây.
- [x] Đối chiếu `BR-DSC-*` `BR-A11-*` `BR-PRF-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Token, hai tầng một nguồn

- [x] `@theme` trong `packages/ui`: `brand-50…900` (core `brand-600`), `cta`/`cta-hover`/`cta-light`, `surface-50…900`, semantic 400/500/600, `retry`, font.
- [x] `packages/game-engine/src/systems/designTokens.ts` — cùng giá trị màu cho canvas.
- [x] Thang radius 12 / 16 / 24 / full khai thành token.
- [x] Thang motion instant 90 · quick 160 · base 200 · snap 260 · settle 340 khai thành token.
- [x] `prefers-reduced-motion` xử lý **một chỗ** ở app stylesheet, giảm chứ không bỏ (`BR-A11-10`).
- [x] `surface-400` ghi rõ chỉ dùng viền/placeholder — không đạt 4,5:1 cho body.
- [x] Test đối chiếu `@theme` ↔ `designTokens.ts`, lệch là đỏ.
- [x] Ca âm `BR-DSC-08`: định nghĩa lại token thương hiệu ở `apps/web` → cổng đỏ.

### Task 2 — `pnpm --filter @mindkid/gates test` mở rộng

- [x] `BR-DSC-01` hex trong `.vue` → đỏ (template, `<style>`, inline `:style`).
- [x] `BR-DSC-02` hex trong `packages/game-engine` ngoài `designTokens.ts` → đỏ.
- [x] `BR-DSC-03` `lucide-vue-next` · `class-variance-authority` · `clsx` · `tailwind-merge` · `cn(` · `components/ui/` → đỏ.
- [x] `BR-DSC-05` emoji trong `aria-label`/`label`/vị trí icon → đỏ.
- [x] `BR-DSC-06` `dark:` trong `components/kid`, `pages/play` → đỏ.
- [x] `BR-DSC-13` `.vue` > 800 dòng → đỏ.
- [x] `BR-DSC-14` `rounded-md`/`rounded-lg` → đỏ.
- [x] `BR-A11-09` `uppercase` trên phần tử tiếng Việt → đỏ.
- [x] **Mỗi rule một fixture vi phạm + test khẳng định exit ≠ 0** (`D-FC`).
- [x] Quét cả `pnpm-lock.yaml` cho kit thứ hai, không chỉ source.

### Task 3 — Kit và hằng số ngưỡng

- [x] Nuxt UI v4 + Tailwind v4 vào **catalog**; app khai `catalog:` (`BR-RBS-06`).
- [x] `packages/ui/app.config.ts` là chỗ mở rộng kit duy nhất.
- [x] `BR-DSC-04` icon là **chuỗi** `i-lucide-*` qua `<UIcon>`; ca âm `<component :is>` bị chặn.
- [x] `BR-A11-04` hằng số một nguồn: 96 / 76 / 64 / 44 / 40 / 24 (`D-FF`).
- [x] Bảng bốn bề mặt khai dạng dữ liệu: bề mặt → sàn chạm, dark, đỏ.
- [x] `BR-DSC-09` thứ tự SFC `<template>` → `<script setup>` → `<style scoped>`.
- [x] `BR-DSC-10` một CTA chính mỗi màn hình — quy ước ghi rõ, kiểm ở review.
- [x] `BR-DSC-11` `active:` mang phản hồi nhấn, không `hover:`.
- [x] `BR-DSC-12` chỉ animate `transform` và `opacity`.
- [x] `pnpm lint:deps` xanh — kit không rò ngược vào `packages/game-engine`.

### Task 4 — Harness axe

- [x] Playwright + `@axe-core/playwright` vào catalog, chạy được local.
- [x] Page object mẫu cho **bốn** bề mặt: kid · account · public · admin.
- [x] `BR-A11-01` 0 violation trên mọi page object.
- [x] Trang mới không có page object → **lỗi cổng**, không mặc định bỏ qua.
- [x] `BR-A11-05` focus ring thấy rõ, offset ≥2px.
- [x] `BR-A11-06` icon-only có `aria-label`.
- [x] `BR-A11-12` modal trap focus và **trả** focus khi đóng.
- [x] `BR-A11-13` tab order khớp thứ tự thị giác.
- [x] Ca âm: page object thiếu `aria-label` → cổng **đỏ** (`D-FC`).
- [x] Bỏ qua rule axe ghi lý do tại chỗ; **không** tắt toàn cục.

### Task 5 — Tám ràng buộc bề mặt trẻ §7.2

- [x] Chỉ dẫn có kênh âm thanh hoặc hình (`BR-A11-11`) — cấu trúc dữ liệu ép, không nhắc suông.
- [x] Phản hồi đúng/sai không chỉ bằng màu (`BR-A11-03`), ca âm màn hình đơn sắc.
- [x] Sàn chạm đo ở **tỉ lệ 100%**, theo band tuổi.
- [x] Không cử chỉ hai ngón, pinch, xoay, drag chính xác.
- [x] Mọi mechanic drag có fallback **tap-tap** cho band 3–4.
- [x] `reduced-motion` vẫn giữ kênh phản hồi.
- [x] Không chữ < 16px (`BR-A11-08`).
- [x] Không đỏ làm tín hiệu (`BR-DSC-07`) — chặn ở tầng type nếu làm được.
- [x] Fixture vi phạm mỗi mục → đỏ, chứng minh test biết đỏ khi P1.2 vi phạm.

### Task 6 — Ngân sách hiệu năng, phần đo được ngay

- [x] Bảng ngân sách §7.1 khai dạng dữ liệu (180 / 80 / 200 / 120 / 500 KB).
- [x] `BR-PRF-01` vượt ngân sách → exit ≠ 0, **chặn merge**.
- [x] Ca âm: dependency đẩy shell qua 180 KB → cổng đỏ.
- [x] `BR-PRF-02` LCP < 2,5 s và CLS < 0,1 đo dưới **4G throttle** khai tường minh.
- [x] Thiết bị chuẩn theo `D-CH`: Lenovo Tab M8 2 GB, median ba lần chạy.
- [x] Cấu hình k6: API P95 < 800 ms, ingest < 200 ms — chạy được trên `/health`.
- [x] `BR-PRF-08` ảnh WebP ≤960×960 có cổng, kể cả khi chưa có ảnh.
- [x] **Ghi nợ** (`D-FB`): FPS + `BR-PRF-03/04/05` → P1.2; `fps_sample` + alert → P1.16.

## Cổng dừng

- [x] Từng cổng mới đã được **chứng minh đỏ** bằng ca âm.
- [x] Không nguồn thứ hai cho sàn chạm hay màu.
- [x] Không `.vue` nào chứa hex; không kit thứ hai trong lockfile.
- [x] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.
- [x] Human review diff.

---

## Task 7 — Evidence và promote

- [x] Mỗi `BR-DSC-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-A11-*` có test tham chiếu mã rule.
- [x] [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) → `implemented`.
- [x] [`accessibility.md`](../specs/08-quality/accessibility.md) → `implemented`.
- [x] [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) **giữ** `approved` — promote ở P1.16.
- [x] Nợ ngân sách ghi vào todo của P1.2 và P1.16, có địa chỉ rõ.
- [x] Tick **P1.1** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Kiểm thử với trẻ thật và người dùng công nghệ trợ giúp — a11y §11 Q1, **chặn go-live**, chủ là người quyết.
- [ ] t3.small đủ cho MVP không — perf §11 Q2, **chặn go-live**, chủ là Infra.
- [ ] CDN trước S3 từ đầu hay sau — perf §11 Q3, chặn P2, chủ là Infra.
