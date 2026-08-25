# Task #107 — Todo

## Giai đoạn 0 — Chốt quyết định (chặn mọi giai đoạn sau)

- [x] Trả lời ba câu hỏi mở ở [`107-design-language-plan.md`](107-design-language-plan.md) §13
      (mascot, dark mode bề mặt người lớn, kho giọng đọc v1). Câu 1 chặn giai đoạn 5,
      câu 2 chặn giai đoạn 2.
      **Đóng 2026-08-25**: Mascot = 🐻 Gấu, dark mode bề mặt người lớn = có, giọng đọc v1 = hoãn.
- [x] Ghi `D-*` cho hướng "Giấy và Gỗ", brand teal, cặp font Baloo 2 với Be Vietnam Pro.
      Ba thứ này thuộc "Ask first" của
      [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) §10.
- [x] `pnpm-workspace.yaml:29` đổi `"@nuxt/ui": ^3.0.0` sang `^4`. Bằng chứng: v1 chạy thật
      với `^4.10.0`. **Đã có `^4.0.0` trong catalog.**
- [x] Sửa [`SPEC.md`](../SPEC.md) §9.2 `band 5–6: 72px` thành `76px` theo `BR-ENG-05` `D-AO`.
- [x] Sửa §7.2 của
      [`design-system-contract.md`](../specs/08-quality/design-system-contract.md): `cta` và
      `retry` từ giá trị phẳng thành thang 11 bậc, thêm họ `info` và `secondary`, ghi ánh xạ
      alias Nuxt UI v4. Đây là đổi cấu trúc token, thuộc "Ask first" của §10 spec đó.

## Giai đoạn 1 — `docs/design-system/`

- [ ] Đọc lại 18 file UX của v1 trước khi viết dòng nào:
      `cd ../tinimath && git show HEAD:specs/reference/ux/<file>`. Bốn ý còn đúng đã liệt ở
      [`107-design-language-plan.md`](107-design-language-plan.md) §5. Bỏ mọi phần mô tả mô
      hình B2B cũ — file chỉ mục của corpus đó tự cảnh báo.
- [ ] `README.md` — chỉ mục và ranh giới với spec. Cấm — **NEVER copy contract**, chỉ liên kết.
- [ ] `01-brand.md` — tên, logo, mascot, giọng nói.
- [ ] `02-color.md` — bảng màu, bảng tương phản đo được, C1–C6, hai thanh ghi.
- [ ] `03-typography.md` — cặp font, thang cỡ chữ, `line-height` từ 1,4, cấm `uppercase`.
- [ ] `04-iconography.md` — ranh giới emoji-nội-dung với SVG-affordance, icon C1–C6,
      brief 12 avatar preset.
- [ ] `05-motion-and-surface.md` — thang chuyển động, độ nâng, noise, công thức clay canvas.
      Ghi lại từ v1 (xem §5): bốn lượt vẽ clay, thang font theo chiều cao canvas
      (`number 0.089`, `display 0.081`, `label 0.052`, `hud 0.044`, `caption 0.036`, sàn 16px),
      cách vẽ emoji bằng hai lần `fillText`, và sáu token `GAME_MOTION`. Đây là brief đầu vào
      cho task engine, không phải phần việc của task này.
- [ ] `06-voice.md` — gom quy tắc copy tiếng Việt đang rải ở sáu spec.
- [ ] Chạy `pnpm --filter @mindkid/gates test` sau mỗi file: C14 và C15 quét toàn bộ `docs/`.
      Tên file trong backtick mà tồn tại dưới `docs/` phải là liên kết.
- [ ] Kiểm số dòng và số byte sau mỗi lần ghi — hook định dạng từng cắt mất thân file.

## Giai đoạn 2 — Bảng token

- [x] **Sinh đủ 11 bậc `50…950`** cho mọi họ dùng làm alias của kit: `brand`, `surface`,
      `cta`, `retry`, `success`, `warning`, `danger`. Nuxt UI v4 dùng bậc thiếu cho hover và
      focus, thiếu là component hỏng lặng lẽ (`BR-DSC-20`).
- [x] `packages/ui/assets/css/tailwind.css`: neo `brand #1a7f6b`, `cta #c2410c`,
      `surface #57534e`, `retry #d97706`; thêm `surface-0`; dùng `@theme static`.
- [x] Thêm `--font-sans` và `--font-heading` — contract §7.2 liệt kê, CSS chưa từng khai.
- [x] Thêm 5 duration của contract §7.4 vào CSS (hiện chỉ có trong `designTokens.ts`).
- [x] Thêm họ `--color-competency-c1` tới `c6`, thang type, thang spacing.
- [x] Mirror toàn bộ sang `packages/game-engine/src/systems/designTokens.ts`.
- [x] Cập nhật `packages/ui/tests/tokens.test.ts` — hai hex hard-code `#7c3aed` và `#d97706`,
      thêm assert cho font, duration, competency.
- [x] Script kiểm tương phản và mô phỏng deuteranopia, chạy trong test, đỏ khi một cặp rớt sàn
      `BR-A11-02`.
- [x] Ca âm: đặt `cta` về `#f97316` thì script phải đỏ ở 2,83:1.
- [ ] Ca âm: bỏ một bậc `950` khỏi một họ alias thì `BR-DSC-20` phải đỏ.

## Giai đoạn 3 — Nối token vào app

- [x] `packages/ui/nuxt.config.ts` mới — biến `@mindkid/ui` thành Nuxt Layer theo khuôn v1:
      `modules: ["@nuxt/ui"]`, `css: [...]`, `components: [...]`, `alias`.
- [x] `packages/ui/package.json` khai `@nuxt/ui` và `tailwindcss` bằng `catalog:`.
- [x] Viết lại `packages/ui/app.config.ts` theo API Nuxt UI **v4** (`ui.colors.*`,
      `ui.<component>.slots`). Bản hiện tại là cú pháp v3 và bị kit bỏ qua.
- [x] `apps/web/nuxt.config.ts` và `apps/admin/nuxt.config.ts` thêm `extends: ["@mindkid/ui"]`.
- [x] Thêm `@nuxt/fonts`, self-host Baloo 2 và Be Vietnam Pro, chỉ subset `vietnamese` và
      `latin`. Cấm — **NEVER CDN Google** (`BR-LND-04`).
- [x] Tạo `apps/web/app/app.vue` và `app/error.vue` (trang 404 có thương hiệu).
- [x] Tạo `apps/web/app/layouts/{public,account,kid}.vue`; gỡ navbar và footer khỏi 17 trang
      đang tự import; 15 trang hiện không có chrome nào phải nhận layout.
      **Lưu ý**: layout tạo xong, chưa gỡ navbar/footer import khỏi 17 trang cũ (Giai đoạn 4/7).
- [x] Thêm skip-link trỏ `#main-content` — 10 trang đã có id, chưa có link nào tới.
- [x] Thêm style `:focus-visible` toàn cục, offset từ 2px (`BR-A11-05`). Hiện chỉ 8 file có.
- [x] Đo lại ngân sách: `pnpm --filter @mindkid/gates test` phần `perf-budget`. **233/233 pass.**

## Giai đoạn 4 — Codemod và dọn palette

- [ ] Codemod `apps/admin`: `slate-*` sang `surface-*`, `indigo-*` sang `brand-*`.
      52 file, trên 500 dòng nên viết codemod, Cấm — **NEVER sửa tay**.
- [ ] Dọn biến `--un-*` (UnoCSS) còn sót trong `apps/admin`.
- [ ] Thay `emerald-*`, `rose-*`, `amber-*`, `red-*` thô bằng token semantic ở cả hai app.
- [ ] Bổ sung shade còn thiếu trước khi codemod: code đang dùng `danger-50` tới `danger-900`,
      `success-100/800`, `warning-100/800`, `brand-950`, `--color-primary-*`.
- [ ] Chụp danh sách `trạng-thái | tên-test` trước và sau codemod, yêu cầu trùng khít.

## Giai đoạn 5 — Tài sản thương hiệu

- [ ] Logo SVG và wordmark. Bố cục tham chiếu `tinimath/apps/web/public/logo.png`, chữ và tên
      vẽ lại.
- [ ] Favicon, `icons/icon-192x192.png`, `icons/icon-512x512.png`. Manifest đang trỏ vào thư
      mục không tồn tại.
- [ ] `manifest.webmanifest` đổi `theme_color` từ `#4f46e5` sang brand mới.
- [ ] 6 icon C1–C6 kèm hình dạng đi kèm.
- [ ] 12 avatar preset SVG (`D-AU`). `AVATAR_PRESET_IDS` ở `packages/shared/src/child-data.ts`
      đang trỏ tới artwork chưa tồn tại; repo có 0 file `.svg`.
- [ ] Mascot: bốn tư thế khớp bảng phản hồi
      [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) §7.1.
      Một bản SVG cho UI, một bản dựng được bằng đường Canvas cho engine. Chặn bởi §13 câu 1.
- [ ] Thay `🧠` ở `public-navbar.vue` và mọi emoji trong `apps/admin/app/composables/nav-config.ts`
      bằng `<UIcon>`.
- [ ] Thay `✓` và `➔` trong `landing-hero.vue` và `landing-benefits.vue` bằng icon SVG.

## Giai đoạn 6 — Cổng

- [ ] Sửa `checkSecondKitInLockfile` ở `packages/gates/src/lint-tokens.ts:218`: định dạng
      lockfile v9 không có dấu gạch chéo trước tên package, nên cả bốn package bị cấm hiện
      không thể khớp. Ca âm đang dùng lockfile giả định dạng pnpm v6.
- [ ] Cùng lúc thu hẹp về **dependency trực tiếp** khai trong `package.json` của workspace.
      Bằng chứng cần thiết: lockfile v1 chứa `tailwind-merge@3.6.0` và `tailwind-variants@3.2.2`
      như dependency gián tiếp của Nuxt UI v4.
- [ ] Ca âm hai chiều: dep trực tiếp `clsx` phải đỏ; dep gián tiếp qua `@nuxt/ui` phải xanh.
- [ ] `BR-DSC-15` — app có `.vue` bắt buộc nạp stylesheet token qua layer. Ca âm: gỡ `extends`.
- [ ] `BR-DSC-16` — mọi `var(--…)` trong `.vue` phải được định nghĩa. Ca âm: `var(--khong-ton-tai)`.
- [ ] `BR-DSC-17` — cấm họ màu Tailwind thô trong `.vue`. Ca âm: `slate-500`.
- [ ] `BR-DSC-18` — `dark:` chỉ hợp lệ khi app có cơ chế color-mode. Ca âm: `dark:` không có
      color-mode. Hiện `dark:` dùng 1.462 lần mà không có công tắc nào.
- [ ] `BR-DSC-19` — mở rộng `BR-DSC-05` sang text của template ở phần tử affordance.
      Ca âm: emoji trong text của `<button>`.
- [ ] Thêm `BR-DSC-15` tới `BR-DSC-19` vào §6 của
      [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) trong
      **cùng PR**. Prefix `BR-DSC` đã đăng ký, không cần sửa
      [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Mỗi ca âm sống ở `packages/gates/tests/fixtures/`, Cấm — **NEVER viết mẫu vi phạm thẳng
      vào file test**.

## Giai đoạn 7 — Áp lên bề mặt

- [ ] Public: `landing-hero.vue`, `landing-benefits.vue`, `landing-pricing.vue`,
      `public-navbar.vue`, `public-footer.vue`, `pages/index.vue`.
- [ ] Public: `pages/pricing.vue` — bề mặt chuyển đổi, KPI visitor sang đăng ký từ 8%.
- [ ] Account: `pages/me/index.vue` và báo cáo cơ bản.
- [ ] Kid: sảnh `/play` với sáu thẻ competency — nơi C1–C6 lần đầu có mặt thật.
- [ ] Admin: shell `layouts/manager.vue` và studio.
- [ ] Sửa nav chết của admin: `MANAGER_NAV_ITEMS` trỏ `/content-review` và `/levels`, đường
      thật là `/studio/review` và `/studio/levels`.
- [ ] Thêm chỉ báo trang hiện tại cho nav — hiện chỉ có 1 `aria-current` trong toàn `apps/web`.
- [ ] Đổi `hover:` sang `active:` ở phần tử chạm chính (`BR-DSC-11`). Tỉ lệ hiện tại 501 với 46.

## Giai đoạn 8 — Dọn tên thương hiệu

- [ ] `packages/auth/src/totp.ts` — issuer TOTP hiện trong app authenticator của người dùng
      thật. Ưu tiên cao nhất.
- [ ] `packages/notification/src/mjml-renderer.ts` — 10 template email, cả tên lẫn màu `#4f46e5`.
- [ ] `packages/db/src/services/{pdf-renderer,worksheet-renderer}.ts`.
- [ ] `apps/web/app/pages/pricing.vue`, `apps/web/app/pages/me/index.vue`.
- [ ] 4 route còn lại ở `apps/web/server/api/**`.
- [ ] `docs/taxonomy/*` — còn tên cũ và còn trỏ tới đường dẫn spec v1 không tồn tại.
- [ ] Đếm lại: `grep -rl "TiniMath" apps packages | grep -v node_modules | wc -l` phải về 0
      (hiện 13 file, 55 lần).

## Cổng ra Task #107

- [ ] `pnpm --filter @mindkid/gates test` xanh, gồm 5 rule mới và ca âm của chúng.
- [ ] `pnpm --filter @mindkid/ui test` xanh, gồm script tương phản và mù màu.
- [ ] `pnpm lint && pnpm lint:deps` xanh.
- [ ] `pnpm typecheck:web` không tăng quá 685 lỗi nền.
- [ ] `pnpm typecheck:admin` và `pnpm --filter @mindkid/admin build` xanh.
- [ ] Năm ca âm ở [`107-design-language-plan.md`](107-design-language-plan.md) §9 đều cho đúng kết quả
      khi cố ý vi phạm.
- [ ] Ảnh chụp trước và sau cho ba layout web và shell admin.
- [ ] Trang public: LCP dưới 2,5 giây ở 4G throttle, tổng dưới 500 KB.
- [ ] Tab qua toàn trang: mọi control có focus ring.
- [ ] Bật giảm chuyển động của hệ điều hành: chuyển động giảm, không mất kênh phản hồi.
- [ ] Người review diff. Cấm — **NEVER merge tự động**.

## Ghi nợ có địa chỉ

- [ ] Canvas không vẽ gì: `render()` chưa được hiện thực ở cả 27 template, bốn hàm vẽ clay của
      `render-system.ts` có 0 call site, không có `fillText` hay `drawImage`. Mở task riêng
      thuộc [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md). Ngôn ngữ
      thị giác cho canvas viết xong vẫn chưa hiện ra pixel nào cho tới khi task đó chạy.
      Đầu vào cho task đó: `tinimath/packages/game-engine/src/systems/renderSystem.ts`
      (3.879 dòng, 65 hàm vẽ) và `src/systems/render/entities.ts`. Cả hai **untracked và không
      compile** — chúng tham chiếu `GAME_LEGACY_COLORS` và `resolveLegacyFont` không tồn tại.
      Port là đọc và viết lại theo token v2, Cấm — **NEVER copy nguyên khối**.
- [ ] `themes.css` bốn theme của v1 là code chết (0 chỗ đọc `var(--theme-*)`). Nếu v2 muốn
      theme thị giác theo hồ sơ trẻ, phải có người đọc biến đó trong cùng PR — nếu không thì
      không thêm.
- [ ] `packages/ui/tests/tokens.test.ts` kiểm bằng `readFileSync` chính file token — sau giai
      đoạn 3 phải đổi sang kiểm đường dẫn tiêu thụ, không chỉ nội dung file.
