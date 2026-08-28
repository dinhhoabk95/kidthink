# Task #107 — Ngôn ngữ thiết kế MindKid

> Đo ngày 2026-08-25 trên worktree hiện tại. Mọi số đếm lại được bằng lệnh ở §0.
>
> ```bash
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> cd /Users/macbook/tinimath/mindkid
> ```

## Overview

[`design-system-contract.md`](../specs/08-quality/design-system-contract.md) §1 uỷ quyền "ngôn
ngữ thị giác đầy đủ" cho `docs/design-system/`. Thư mục đó chưa bao giờ tồn tại. Task #26 tick
`[x] Đọc docs/design-system/` cho một thư mục rỗng, rồi khai ngôn ngữ thị giác là "đầu vào,
không phải sản phẩm" của nó. Không task nào sau đó nhận phần đầu vào ấy.

Hệ quả thứ hai, nặng hơn: **token đã khai nhưng không app nào nạp**. `tailwindcss`,
`@nuxt/ui`, `@nuxt/fonts` chỉ nằm trong catalog `pnpm-workspace.yaml`, không `package.json`
nào khai, nên không có trong `pnpm-lock.yaml` và không có trong `node_modules`. Cả hai
`nuxt.config.ts` không có khoá `css:`. `apps/web/app/` không có `app.vue`, `error.vue`,
`layouts/`, `assets/`.

Task này làm ba việc, theo thứ tự:

1. Rút **tư tưởng thiết kế từ yêu cầu sản phẩm** — đối tượng, mô hình kinh doanh, sư phạm,
   ngưỡng a11y, ngân sách hiệu năng (§1).
2. Diễn đạt tư tưởng đó **bằng đúng nguyên thuỷ theming của Nuxt UI v4** — stack đã chốt ở
   [`SPEC.md`](../SPEC.md) §6 (§2, §3).
3. Nối nó vào hai app, đặt cổng bắt được dạng hỏng ở trên, và viết lại thành tài liệu ở đúng
   chỗ contract đã hẹn (§6 tới §9).

v1 `tinimath/` **chỉ là tham khảo** — §5 ghi phần lấy được và phần cấm lấy.

## 0. Đo lại trước khi tin

```bash
# Token khai mà không ai nạp
grep -c "css:" apps/web/nuxt.config.ts apps/admin/nuxt.config.ts     # 0 và 0
ls apps/web/app/                                                      # không có app.vue, layouts/, assets/
python3 -c "s=open('pnpm-lock.yaml').read();print([p for p in ['tailwindcss','@nuxt/ui'] if p+'@' in s])"   # []

# Bậc màu hiện có, so với 11 bậc mà Nuxt UI v4 đòi
python3 -c "
import re;s=open('packages/ui/assets/css/tailwind.css').read()
for f in ['brand','surface','success','warning','danger']:
    print(f, sorted(int(m) for m in re.findall(r'--color-'+f+r'-(\d+):', s)))
"

# Hai bảng màu
grep -rho "slate-[0-9]*" apps/admin --include="*.vue" | wc -l         # ~1404
grep -rho "indigo-[0-9]*" apps/admin --include="*.vue" | wc -l        # ~402

# Tên thương hiệu cũ
grep -rl "TiniMath" apps packages | grep -v node_modules | wc -l      # 13 file, 55 lần
```

---

## 1. Tư tưởng thiết kế — suy từ yêu cầu

Không suy từ v1, không suy từ thẩm mỹ. Mỗi nguyên tắc dưới đây neo vào một ràng buộc đã tồn
tại trong corpus. Ràng buộc đổi thì nguyên tắc phải đổi theo.

### 1.1 Ai dùng, và mua vì gì

| Sự thật | Nguồn |
|---|---|
| Người **chơi** là trẻ 3–6, **chưa đọc chữ**, vận động tinh chưa đủ, không tự xoay xở khi giao diện khó | [`accessibility.md`](../specs/08-quality/accessibility.md) §1 |
| Người **trả tiền** là người lớn, mua bằng niềm tin: *"Sản phẩm cho trẻ em bán bằng niềm tin. Giá mập mờ phá niềm tin nhanh hơn giá cao"* | [`pricing-page.md`](../specs/02-public/pricing-page.md) §1 |
| Hai người này **không bao giờ nhìn cùng một màn hình**: bề mặt trẻ cấm dữ liệu thanh toán, giá, lời mời nâng cấp | `BR-PEN-04`, `BR-PGT-05` |
| Sư phạm neo vào Montessori và Dienes — giáo cụ vật lý, và **kiểm soát lỗi tự thân**: trẻ phải tự nhận ra sai *từ vật liệu* trước khi hệ thống nói gì | `BR-MTB-14` |
| Thiết bị mục tiêu là **tablet Android 2 GB trên 4G**, không phải laptop dev | [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) §7.4 |
| Ngôn ngữ hiển thị **chỉ tiếng Việt** | `D-NM` |

### 1.2 Sáu nguyên tắc

| # | Nguyên tắc | Neo vào | Nó cấm điều gì |
|---|---|---|---|
| N1 | **Hình dạng mang nghĩa trước màu.** Mọi thứ phân biệt được bằng ít nhất hai kênh | `BR-A11-03`, `BR-MTB-14` | Chip chỉ khác nhau ở màu; phản hồi đúng-sai chỉ bằng màu |
| N2 | **Vật liệu, không phải trang trí.** Vật thể trên bề mặt trẻ trông cầm nắm được — dày, có khối, bóng đổ một hướng | Montessori; `BR-ENG-08` pop tại điểm chạm | Phẳng vô danh; hiệu ứng không nói gì về việc chạm được hay không |
| N3 | **Bình tĩnh là tính năng bán hàng.** Bề mặt người lớn điềm đạm, nhiều khoảng thở, một CTA mỗi màn | [`landing-page.md`](../specs/02-public/landing-page.md) §7.2; `BR-DSC-10` | Kẹo ngọt, gradient tím, "đột phá", hai nút cùng nổi |
| N4 | **Không có gì giục.** Không đếm ngược, không streak, không điểm trước mặt trẻ | `BR-ENG-11`, `BR-HPL-05`, `BR-BRP-08` | Đồng hồ, huy hiệu chuỗi ngày, phần trăm thành thạo |
| N5 | **Sai không bị phạt.** "Chưa đúng" là hổ phách, có chuyển động, có âm, và cường độ không tăng theo số lần | `BR-DSC-07`, `BR-FBK-01`, `BR-FBK-07` | Đỏ, buzzer, rung, trừ điểm, im lặng |
| N6 | **Nhẹ là ràng buộc thiết kế.** Mọi lựa chọn thị giác phải trả lời được: cái này chạy trên 2 GB không | `BR-PRF-01`, §7.4 | Ảnh nền nặng, gradient nhiều lớp, font nhiều trục, bóng đổ động hàng loạt |

### 1.3 Hai thanh ghi, một hệ token

Contract đã nói "bốn bề mặt, bốn tiêu chuẩn". Về mặt thị giác chúng gom thành hai:

| Thanh ghi | Bề mặt | Hình dạng | Chữ | Màu |
|---|---|---|---|---|
| **Người lớn** | public, account, admin | Bo vừa, viền mảnh, nhiều khoảng trắng | Nhiều cấp, đọc dài được | Trung tính ấm, một accent, `danger` dùng được |
| **Trẻ** | `/play`, canvas | Bo lớn, viền dày, khối đặc, sàn chạm 64–96px | Ít chữ, cỡ lớn, không mang chỉ dẫn một mình | Light-only, không đỏ, `retry` hổ phách thay `danger` |

Cùng một bảng token, khác cách dùng. Cấm — **NEVER dựng hai hệ token**.

### 1.4 Hướng được chọn: "Giấy và Gỗ"

Nền giấy ấm thay nền xám lạnh; vật thể như giáo cụ gỗ; một accent duy nhất; kết cấu bằng một
lớp nhiễu nhẹ chứ không bằng ảnh.

Vì sao hướng này trả lời được sáu nguyên tắc:

- **N1, N2** — vật liệu gỗ và giấy có hình dạng và bề mặt tự nhiên, nên hình dạng dễ mang nghĩa
  hơn màu. Đây cũng là ngôn ngữ của chính giáo cụ mà sư phạm sản phẩm dựa vào.
- **N3** — giấy ấm cộng một accent đọc thành đáng tin, không đọc thành trò chơi điện tử. Đây là
  bề mặt người lớn phải quyết định trả tiền.
- **N6** — nền phẳng cộng một lớp nhiễu SVG nội tuyến là thứ rẻ nhất tạo được kết cấu. Không
  ảnh nền, không gradient nhiều lớp.
- Nó là phản đề của violet bão hoà — màu mặc định của sản phẩm sinh bởi AI, và là `brand-600`
  hiện tại.

Ràng buộc phủ định đi kèm: `BR-LND-07` cấm ảnh trẻ em thật, và
[`montessori-corpus-mapping.md`](../specs/05-content/montessori-corpus-mapping.md) §7.4 cấm
chép bối cảnh và hình vẽ từ nguồn. Nên minh hoạ **buộc phải** là vector tự dựng.

---

## 2. Hệ thống phải diễn đạt được bằng Nuxt UI v4

Stack đã chốt: [`SPEC.md`](../SPEC.md) §6 và `BR-DSC-03` — **Nuxt UI v4 là kit duy nhất**,
Tailwind v4, icon `i-lucide-*` qua `<UIcon>`. Ngôn ngữ thiết kế không được sống ngoài kit; nó
phải nằm trong `@theme` và trong `app.config.ts`. Ràng buộc cứng, không phải sở thích.

### 2.1 Cách Nuxt UI v4 nhận màu

Ba mảnh. Thiếu một là kit rơi về mặc định — primary xanh lá, neutral slate.

```css
/* packages/ui/assets/css/tailwind.css */
@import "tailwindcss";
@import "@nuxt/ui";          /* bắt buộc, hiện đang thiếu */

@theme static {
  --color-brand-50: …;  /* … */  --color-brand-950: …;
}
```

```ts
// packages/ui/nuxt.config.ts — alias ngoài bảy cái mặc định phải khai ở đây
ui: { theme: { colors: ["primary","secondary","success","info","warning","error","neutral","cta","retry"] } }
```

```ts
// packages/ui/app.config.ts — ánh xạ alias sang họ màu
ui: { colors: { primary: "brand", neutral: "surface", cta: "cta", … } }
```

Hai luật của v4 quyết định toàn bộ bảng màu:

1. **Mỗi họ màu dùng làm alias phải có đủ 11 bậc `50` tới `950`.** Kit dùng các bậc đó cho
   hover, focus ring, nền nhạt, chữ trên nền nhạt. Thiếu bậc là component hỏng lặng lẽ.
2. **Mảng `ui.theme.colors` thay thế danh sách mặc định**, không cộng thêm. Khai thiếu một
   alias mặc định là mất alias đó.

### 2.2 Từ vựng token của v2 chưa khớp v4 — đây là việc phải làm

| Alias v4 | v2 hiện có gì | Vấn đề |
|---|---|---|
| `primary` | `brand-50…900` | **Thiếu bậc 950** |
| `neutral` | `surface-50…900` | **Thiếu bậc 950** |
| `success` | `success-400/500/600` | **Thiếu 8 bậc** |
| `warning` | `warning-400/500/600` | **Thiếu 8 bậc** |
| `error` | `danger-400/500/600` | Thiếu 8 bậc, **và tên khác**: v4 gọi `error`, contract gọi `danger` |
| `info` | không có | **Không tồn tại** |
| `secondary` | không có | **Không tồn tại** |
| `cta` | `cta`, `cta-hover`, `cta-light` | **Ba giá trị phẳng, không phải thang** — không dùng làm alias được |
| `retry` | `retry` | **Một giá trị phẳng** — không dùng làm alias được |

Nghĩa là: đổi `cta` và `retry` từ giá trị phẳng sang thang 11 bậc, và thêm hai họ mới. Đây là
thay đổi **cấu trúc** của §7.2 contract, thuộc "Ask first" — phải sửa spec trong cùng PR.

Ánh xạ chốt:

| Alias v4 | Họ màu v2 | Dùng ở đâu |
|---|---|---|
| `primary` | `brand` teal | Nhận diện, nav đang chọn, link, focus ring |
| `cta` | `cta` cam | Đúng một hành động chính mỗi màn (`BR-DSC-10`) |
| `neutral` | `surface` stone ấm | Chữ, viền, nền |
| `success` · `warning` · `error` | `success` · `warning` · `danger` | Bề mặt người lớn |
| `retry` | `retry` hổ phách | **Chỉ** bề mặt trẻ, thay `error` (`BR-DSC-07`) |
| `info` | dùng lại `brand` | Không tạo màu thứ hai chỉ để có tên |
| `secondary` | dùng lại `surface` | Nút phụ là nút trung tính, không phải màu nhấn thứ hai |

`info` và `secondary` cố tình trỏ về họ đã có: `BR-DSC-10` chỉ cho một CTA mỗi màn, thêm màu
nhấn thứ hai là mở cửa cho việc vi phạm nó.

### 2.3 Ba cấp tuỳ biến, và luật dùng

| Cấp | Cú pháp | Khi nào |
|---|---|---|
| Toàn cục | `app.config.ts` → `ui.<component>.{slots, variants, compoundVariants, defaultVariants}` | **Mặc định.** Mọi quyết định hệ thống sống ở đây |
| Một chỗ | `:ui="{ slot: 'class' }"` trên thẻ | Ngoại lệ có lý do, ghi comment |
| Thô | `class="…"` trên thẻ | Chỉ bố cục và khoảng cách. Cấm — **NEVER màu, radius, hay font** |

Hình dạng của thanh ghi trẻ, viết ở cấp toàn cục:

```ts
ui: {
  button: {
    slots: { base: "font-heading rounded-2xl transition-[transform,box-shadow]" },
    variants: {
      size: { xl: { base: "min-h-19 text-lg" } },   // 76px, BR-A11-04
    },
    defaultVariants: { color: "cta" },
  },
}
```

### 2.4 Hệ quả

- Sàn chạm `BR-A11-04` (64 / 76 / 96 / 44 / 40px) phải thành **`variants.size`** của kit, đọc
  từ hằng số `TOUCH_FLOORS` đã có ở `packages/ui/src/index.ts`. Cấm — **NEVER lặp con số vào
  từng component**.
- Thang radius §7.3 và thang chuyển động §7.4 phải thành token `@theme`, rồi thành `slots` —
  không phải thành class rời rạc rải khắp file `.vue`.
- 7.344 class tiện ích trong `apps/web` sẽ tự sống lại khi Tailwind được cài, nhưng chúng
  **không** phải là hệ thống. Giai đoạn 9 rà chúng về `slots` và token.
- `apps/admin` có 51 trên 52 file `.vue` viết bằng class thuần, không `<style>` — nó là ứng
  viên tốt nhất để chạy kit trước.

---

## 3. Bảng màu, chữ, chuyển động

### 3.1 Màu

**Neo màu.** Mỗi họ sinh đủ 11 bậc `50…950` từ neo dưới đây, rồi **bắt buộc chạy script kiểm**
tương phản và mô phỏng mù màu. Không chốt bằng mắt.

| Họ | Neo `600` | Chữ trắng trên nó | Ghi chú |
|---|---|---:|---|
| `brand` teal | `#1a7f6b` | **5,0:1** | Thay violet `#7c3aed` |
| `cta` cam | `#c2410c` | **5,2:1** | Sửa defect: `#f97316` hiện chỉ 2,83:1 |
| `surface` stone ấm | `#57534e` | 7,5:1 | Thay zinc lạnh; `surface-400` vẫn chỉ dùng cho viền |
| `retry` hổ phách | `#d97706` | 3,21:1 vật thể | Giữ giá trị, nâng thành thang |
| `success` · `warning` · `danger` | giữ neo hiện tại | | Nâng thành thang đủ bậc |

**Vì sao đổi brand.** Violet bão hoà không mang nghĩa nào cho tư duy trẻ mầm non và là màu mặc
định của sản phẩm sinh bởi AI. Teal đọc thành bình tĩnh và tăng trưởng (N3), bù trừ với cam
CTA, và đạt sàn `BR-A11-02`.

**Vì sao đổi CTA là bắt buộc, không phải thẩm mỹ.** `#f97316` với chữ trắng cho **2,83:1** —
dưới cả sàn 4,5:1 lẫn sàn 3:1. Mọi nút hành động chính hiện dưới chuẩn.

**Vì sao `retry` giữ nguyên dù gần `cta` về sắc độ.** Nó chỉ sống trên bề mặt trẻ, nơi
`BR-PEN-04` cấm CTA thương mại xuất hiện. Hai màu không bao giờ đứng cạnh nhau.

**C1–C6 — họ token mới.** N1 bắt mỗi năng lực mang ba kênh, không chỉ màu.

| Mã | Năng lực | Neo | Icon | Hình |
|---|---|---|---|---|
| C1 | Tư duy toán học | `#1d4ed8` | `i-lucide-hash` | tròn |
| C2 | Tư duy không gian | `#7c3aed` | `i-lucide-box` | vuông |
| C3 | Tư duy logic | `#4d7c0f` | `i-lucide-git-branch` | tam giác |
| C4 | Tư duy quan sát | `#0e7490` | `i-lucide-scan-eye` | thoi |
| C5 | Tư duy ngôn ngữ | `#be185d` | `i-lucide-messages-square` | giọt |
| C6 | Chức năng điều hành | `#a16207` | `i-lucide-target` | lục giác |

C2 nhận lại đúng `#7c3aed` — màu brand cũ thành màu của một năng lực, không vứt đi. Sáu họ này
**không** cần là alias của kit; chúng là màu dữ liệu, dùng qua class và qua `designTokens.ts`
cho canvas.

[`game-catalog-public.md`](../specs/02-public/game-catalog-public.md) §7 đã ghi "Chip màu theo
token", và hai spec khác yêu cầu mỗi năng lực một biểu tượng — cả ba đang trỏ vào chỗ trống.

### 3.2 Chữ

| Vai | Font | Vì sao |
|---|---|---|
| `--font-heading` | Baloo 2 variable | Bo tròn, ấm, có subset `vietnamese` |
| `--font-sans` | Be Vietnam Pro variable | Thiết kế riêng cho dấu tiếng Việt — đúng vấn đề `BR-A11-09` nêu (`line-height` từ 1,4, cấm `uppercase`) |
| Chữ số canvas | Baloo 2 `tabular-nums` | Đóng phần bỏ trống của `D-DM`, vốn chỉ chốt "Google Fonts OFL" mà không chốt font |

Self-host bằng `@nuxt/fonts`. Cấm — **NEVER CDN Google**: `BR-LND-04` cấm request bên thứ ba
trên trang có link chính sách trẻ em, và self-host cắt một round-trip khỏi LCP. Chỉ nạp subset
`vietnamese` và `latin`, chỉ trục thật dùng (N6).

Thang cỡ chữ chưa tồn tại — 7.344 class hiện tại dùng `text-sm` và `text-xs` mặc định của
Tailwind. Thang mới đi vào `@theme`, sàn 16px trên mobile (`BR-A11-08`).

### 3.3 Chuyển động và bề mặt

Thang chuyển động contract §7.4 đã chốt (90 / 160 / 200 / 260 / 340ms) nhưng chỉ sống trong
`designTokens.ts`. Đưa vào `@theme` thành `--duration-*` để `slots` dùng được.

- Chỉ animate `transform` và `opacity` (`BR-DSC-12`).
- Tablet-first: phản hồi nhấn ở `active:`, không phải `hover:` (`BR-DSC-11`). Tỉ lệ hiện tại
  501 với 46, lệch sai hướng.
- Bóng đổ nhuộm theo nền ấm, một hướng sáng duy nhất.
- Kết cấu: **một** lớp nhiễu SVG data-URI cố định, `pointer-events: none`, chỉ trên thanh ghi
  người lớn.
- `prefers-reduced-motion` xử lý một chỗ ở stylesheet của layer (`BR-A11-10`), giảm chứ không bỏ.

---

## 4. Chẩn đoán v2 hiện tại

### 4.1 Cổng xanh vì quét sai chỗ

`packages/ui/tests/tokens.test.ts` `readFileSync` chính file token rồi assert chuỗi — nó xanh
trong khi không app nào nạp file đó. Cổng kiểm nội dung file, không kiểm đường dẫn tiêu thụ.

### 4.2 Thiếu so với chính contract

- `--font-sans` và `--font-heading`: §7.2 liệt kê, CSS không khai. Code dùng `font-heading`
  332 lần và `var(--font-heading)` 17 lần.
- 5 duration của §7.4 không có trong CSS.
- Không có thang type, spacing, shadow, z-index.
- Không có token C1–C6.
- Code dùng token không tồn tại: `--color-surface-0`, `--color-primary-*`, `success-100/800`,
  `warning-100/800`, `brand-950`, `danger-50` tới `danger-900`.

### 4.3 Ba giá trị thương hiệu, hai tên

| Nơi | Màu | Tên |
|---|---|---|
| `packages/ui` + `packages/game-engine` | `#7c3aed` violet | MindKid |
| `apps/web/public/manifest.webmanifest` `theme_color` | `#4f46e5` indigo | MindKid |
| `packages/notification/src/mjml-renderer.ts`, 10 template email | `#4f46e5` | **TiniMath** |

55 chuỗi `TiniMath` trong 13 file, gồm issuer TOTP (`packages/auth/src/totp.ts`, hiện trong app
authenticator của người dùng thật), email, PDF worksheet, `pricing.vue`, `me/index.vue`. D8 đổi
tên từ 2026-08-04. Manifest trỏ `/icons/icon-192x192.png` và `512` — thư mục `icons/` không tồn
tại. Repo có **0 file `.svg`**, nên 12 avatar preset của `D-AU` và mascot của `D-DB` là quyết
định không có tài sản.

### 4.4 Cổng chết — `BR-DSC-03` không thể đỏ

`packages/gates/src/lint-tokens.ts:230` tìm chuỗi `` `/${pkg}@` `` trong `pnpm-lock.yaml`.
Lockfile của repo là `lockfileVersion: '9.0'`, trong đó khoá package **không có dấu gạch chéo
đứng trước** (`  tailwind-merge@3.6.0:`); dạng `/tên@` chỉ còn xuất hiện với package có scope.
Cả bốn package bị cấm đều không scope, nên **không cái nào khớp được**. Ca âm xanh vì nó tự
viết một lockfile giả theo định dạng pnpm v6.

Sau khi sửa định dạng, rule sẽ đỏ thật — Nuxt UI v4 kéo `tailwind-merge` và `tailwind-variants`
làm dependency gián tiếp. Nên phải sửa hai việc cùng lúc: đúng định dạng, và thu hẹp về
**dependency trực tiếp khai trong `package.json` của workspace**. Ý định của `BR-DSC-03` là cấm
dựng lại shadcn-vue trong source, không phải cấm dependency gián tiếp của chính kit mà spec bắt
dùng.

### 4.5 Khoảng cách contract với thực tế

| Rule | Thực tế |
|---|---|
| `BR-DSC-05` cấm emoji làm affordance | Logo là `🧠` (`public-navbar.vue:5`); mọi mục sidebar admin là emoji (`nav-config.ts`); `✓` và `➔` trong CTA và list. Cổng chỉ quét emoji trong `aria-label=` và `label=` |
| `BR-DSC-11` tablet-first `active:` | `hover:` 501, `active:` 46 |
| `BR-A11-05` focus ring mọi control | `focus-visible` chỉ ở 8 file; 30 file CSS thủ công không có `:focus-visible` nào |
| `BR-A11-10` reduced-motion toàn cục | Viết rồi, không được nạp |
| `BR-DSC-06` cấm `dark:` bề mặt trẻ | Giữ được, 0 vi phạm. Nhưng `dark:` dùng 1.462 lần ở nơi khác **mà không có cơ chế color-mode nào** |

---

## 5. v1 — chỉ là tham khảo

v1 `tinimath/` không định hình hướng thiết kế. Nó có giá trị ở ba chỗ, và có bẫy ở một chỗ.

**Đọc được gì.** `specs/reference/ux/` còn **18 file trong git HEAD** của v1, đã xoá khỏi
worktree: `cd ../tinimath && git show HEAD:specs/reference/ux/<file>`. File chỉ mục tự cảnh báo
phần lớn nội dung mô tả mô hình B2B cũ, đã bỏ ở pivot 2026-06-28 — đọc có chọn lọc. Bốn ý còn
đúng: bảng màu tách đôi trẻ với người lớn và *"loại bỏ màu Đỏ gắt gây sợ hãi"*; cấm dùng
`box-shadow` động hàng loạt trên gameboard mà phải bake vào asset tĩnh; cấm nút chứa chữ trên
bề mặt trẻ; và **First-Touch Lock** — chỉ ghi nhận ngón chạm đầu tiên, bỏ mọi điểm dập sau do
lòng bàn tay tì đè. Ý cuối v2 chưa có rule nào.
`docs/design-system/MASTER.md` mà v1 trỏ tới thì **chưa từng tồn tại trong commit nào** — v2
thừa kế đúng con trỏ hỏng đó.

**Dùng lại được gì.** 745 file mp3 giọng đọc tiếng Việt (`public/audio/voice/`: số 0–30, tên
hình, câu dẫn) — hợp `BR-ENG-10`, chờ trả lời §13 câu 3. Bảng bốn tư thế mascot làm brief: chờ
và vẫy, nhảy mừng, khích lệ và suy nghĩ, ăn mừng — khớp đúng bảng phản hồi
[`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) §7.1.
`renderSystem.ts` của v1 (3.879 dòng, 65 hàm vẽ, polyfill `roundRect`, cách vẽ emoji bằng hai
lần `fillText`) là đầu vào cho task engine ở §10, không phải cho task này.

**Xác nhận được gì.** v1 chạy thật với `@nuxt/ui ^4.10.0` và `tailwindcss ^4.2.2`, và
`packages/ui` của nó là **Nuxt Layer** có `modules: ["@nuxt/ui"]`. Điều đó đóng xung đột
version: [`SPEC.md`](../SPEC.md) §6 ghi v4 và đúng, `pnpm-workspace.yaml:29` pin `^3.0.0` và sai.

**Bẫy.** `app.config.ts` của v1 đặt `colors: { neutral: "slate", primary: "indigo" }` — palette
mặc định của kit, không phải token thương hiệu. Đó là nguồn gốc của 1.404 `slate-*` và 402
`indigo-*` còn sót trong `apps/admin` của v2. Ngoài ra v1 vi phạm chính các rule v2 viết ra để
sửa nó: `dark:` trên bề mặt trẻ, đồng hồ đếm ngược, tab sticker và nhiệm vụ, hai `@theme` chồng
nhau, `uppercase` tiếng Việt, ba danh sách avatar cạnh tranh, font nạp qua CDN, và bốn theme
trong `themes.css` **không một dòng code nào đọc**. Cấm port bất cứ thứ nào trong số đó.

---

## 6. Increment plan

1. **Chốt và ghi quyết định.** Ba câu hỏi §13. Ghi `D-*` cho hướng "Giấy và Gỗ", brand teal,
   cặp font. Catalog `@nuxt/ui` `^3.0.0` sang `^4`. Sửa [`SPEC.md`](../SPEC.md) §9.2 `72px`
   thành `76px` theo `BR-ENG-05`.
2. **Sửa cấu trúc token cho khớp v4** (§2.2): 11 bậc cho mọi họ alias, `cta` và `retry` từ giá
   trị phẳng thành thang, thêm `info` và `secondary` bằng cách trỏ về họ đã có. Sửa §7.2 của
   contract trong cùng PR.
3. **Bảng token** (§3): màu, font, duration, thang type, thang spacing, C1–C6. Mirror sang
   `designTokens.ts`. Script kiểm tương phản và mù màu.
4. **Biến `@mindkid/ui` thành Nuxt Layer**: `nuxt.config.ts` với `modules: ["@nuxt/ui"]` và
   `ui.theme.colors`; `@import "@nuxt/ui"` trong CSS; viết lại `app.config.ts` theo API v4;
   hai app `extends`.
5. **Dựng shell còn thiếu**: `app.vue`, `error.vue`, ba layout, skip-link, focus ring toàn cục.
6. **Codemod admin**: `slate-*` sang `surface-*`, `indigo-*` sang `brand-*`, dọn `--un-*`.
7. **Tài sản thương hiệu**: logo SVG, favicon, PWA icon, 6 icon C1–C6, 12 avatar preset, mascot.
8. **Cổng**: sửa `BR-DSC-03` (§4.4) và thêm `BR-DSC-15` tới `BR-DSC-20` (§8).
9. **Áp lên bề mặt**: admin trước vì thuần class, rồi public, account, sảnh trẻ.
10. **Viết `docs/design-system/`** (§7) — viết sau khi token chạy thật, để tài liệu mô tả cái
    đang chạy chứ không mô tả ý định.
11. **Dọn tên**: 55 chuỗi `TiniMath`, `theme_color` manifest, `docs/taxonomy/`.

## 7. `docs/design-system/`

Bảy file. Chúng bị **C14** (cấm ký hiệu emoji trong văn xuôi) và **C15** (tên file trong
backtick phải là liên kết) quét, vì hai check đó đi qua toàn bộ `docs/`.

| File | Sở hữu |
|---|---|
| [`README.md`](../design-system/README.md) | Chỉ mục và ranh giới: spec giữ ràng buộc kỹ thuật, thư mục này giữ ngôn ngữ thị giác |
| [`01-principles.md`](../design-system/01-principles.md) | Sáu nguyên tắc §1.2 và hai thanh ghi, kèm neo về rule |
| [`02-color.md`](../design-system/02-color.md) | 11 bậc mỗi họ, bảng tương phản đo được, ánh xạ alias v4, C1–C6 |
| [`03-typography.md`](../design-system/03-typography.md) | Cặp font, thang cỡ chữ, quy tắc tiếng Việt |
| [`04-iconography.md`](../design-system/04-iconography.md) | Ranh giới emoji-nội-dung với SVG-affordance, icon C1–C6, brief 12 avatar |
| [`05-motion-and-surface.md`](../design-system/05-motion-and-surface.md) | Thang chuyển động, độ nâng, nhiễu, và brief renderer canvas cho task ở §10 |
| [`06-voice.md`](../design-system/06-voice.md) | Gom quy tắc copy tiếng Việt đang rải ở sáu spec |

Cấm — **NEVER copy contract từ spec sang đây**. Chỉ liên kết.

## 8. Rule mới cho [`design-system-contract.md`](../specs/08-quality/design-system-contract.md)

Prefix `BR-DSC` đã đăng ký ở [`business-rules.md`](../specs/00-foundation/business-rules.md)
§7.1, không cần sửa registry. Sáu rule vào §6 của spec trong **cùng PR** với code.

| ID | Rule | Vì sao |
|---|---|---|
| `BR-DSC-15` | App có `.vue` bắt buộc nạp token qua layer `@mindkid/ui` | Token khai mà không app nào nạp thì cổng xanh trong khi màn hình không có màu |
| `BR-DSC-16` | Mọi `var(--…)` dùng trong `.vue` phải được định nghĩa trong file token | Biến không tồn tại trả về rỗng và không báo lỗi |
| `BR-DSC-17` | Cấm — **NEVER họ màu Tailwind thô trong `.vue`** — chỉ dùng họ token | Hai bảng màu song song là hai hệ phải bảo trì |
| `BR-DSC-18` | `dark:` chỉ hợp lệ khi app có cơ chế color-mode | 1.462 lần `dark:` hiện không có công tắc nào |
| `BR-DSC-19` | Mở rộng `BR-DSC-05` sang text của template ở phần tử affordance | Cổng cũ chỉ quét `aria-label=` nên logo emoji lọt |
| `BR-DSC-20` | Mọi họ màu dùng làm alias của kit phải có đủ 11 bậc `50…950` | Nuxt UI v4 dùng bậc thiếu cho hover và focus; thiếu bậc là component hỏng lặng lẽ |

## 9. Verification

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
cd /Users/macbook/tinimath/mindkid

pnpm --filter @mindkid/gates test    # C1–C18, lint-tokens, BR-DSC-15..20 và ca âm
pnpm --filter @mindkid/ui test       # token, 11 bậc, tương phản, mù màu
pnpm lint && pnpm lint:deps          # biome thật, Cấm — NEVER dùng ultracite check
pnpm typecheck:web                   # cổng delta: đếm 685 trước, không được tăng
pnpm typecheck:admin
pnpm --filter @mindkid/admin build
```

Ca âm bắt buộc, chạy tay trước khi merge:

```
1. bỏ một bậc 950 khỏi một họ alias          -> BR-DSC-20 đỏ
2. gỡ extends của một app                     -> BR-DSC-15 đỏ
3. thêm var(--khong-ton-tai) vào một .vue     -> BR-DSC-16 đỏ
4. thêm class slate-500 vào một .vue          -> BR-DSC-17 đỏ
5. thêm emoji vào text của một button         -> BR-DSC-19 đỏ
6. thêm clsx làm dependency trực tiếp         -> BR-DSC-03 đỏ
7. tailwind-merge gián tiếp qua @nuxt/ui      -> BR-DSC-03 xanh
```

Kiểm bằng mắt, không thay được bằng test:

```bash
pnpm dev        # 375 / 768 / 1024 / 1440, không scroll ngang
pnpm dev:admin
```

- `<UButton>` và `<UCard>` render đúng màu thương hiệu, không phải xanh lá và slate mặc định.
  Đây là phép thử duy nhất chứng minh `ui.colors` đã ăn.
- Trang public có màu và có font. LCP dưới 2,5 giây ở 4G throttle, tổng dưới 500 KB.
- Tab qua toàn trang: mọi control có focus ring, offset từ 2px.
- Bật giảm chuyển động của hệ điều hành: chuyển động giảm, không mất kênh phản hồi.
- Sảnh trẻ: không `dark:`, không đỏ, sáu thẻ competency có icon và hình riêng.
- Cài PWA: icon hiện đúng, `theme_color` khớp brand.

## 10. Ngoài phạm vi

- **Canvas không vẽ gì.** `render()` là optional trên `GameSession` và 0 trên 27 template hiện
  thực nó; bốn hàm vẽ của `render-system.ts` có 0 call site; không có `fillText` hay `drawImage`
  nào. Đây là defect của
  [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) và cần task riêng.
  Ngôn ngữ thị giác cho canvas vẫn viết được và vẫn đúng, nhưng nó chưa hiện ra pixel nào cho
  tới khi task đó xong — phải nói rõ khi báo cáo tiến độ. Task đó nhận
  [`05-motion-and-surface.md`](../design-system/05-motion-and-surface.md) làm đầu vào.
- Kiểm thử với trẻ thật và người dùng công nghệ trợ giúp —
  [`accessibility.md`](../specs/08-quality/accessibility.md) §11, chặn go-live.
- Layout màn hình dọc — [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) §11.
- Nợ P0.12, P0.13, P1.17, P3.3, P3.9, P3.10.

## 11. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| `ui.theme.colors` thay thế danh sách mặc định, khai thiếu là mất alias | Ca âm: render `<UAlert color="info">` và khẳng định nó không rơi về mặc định |
| Sửa `BR-DSC-03` xong thì nó đỏ vì `tailwind-merge` gián tiếp của kit | Sửa định dạng và thu hẹp về dependency trực tiếp trong cùng thay đổi, ca âm hai chiều (§9 mục 6 và 7) |
| Sinh 11 bậc bằng thuật toán rồi một bậc rớt sàn tương phản | Script kiểm chạy trong test, chặn merge; không chốt bằng mắt |
| Font vượt ngân sách 180 KB shell | Chỉ subset `vietnamese` và `latin`, đo bằng `perf-budget.test.ts` trước khi merge |
| Codemod `slate` sang `surface` trên 52 file admin làm hỏng lớp không liên quan | Chụp danh sách trạng-thái và tên-test trước và sau, yêu cầu trùng khít; fail sang pass cũng là dấu hiệu đổi hành vi |
| Nạp CSS lần đầu làm lộ hàng loạt lỗi layout đang ẩn | Đó là mục tiêu, không phải tác dụng phụ. Làm từng layout một, có ảnh chụp |
| Hook định dạng cắt mất thân file khi ghi `docs/` | Kiểm số dòng và số byte sau mỗi lần ghi |
| Đưa tài liệu ra trước khi token chạy thật | §6 xếp `docs/design-system/` sau bước 9 đúng vì lý do này |

## 12. Giả định

1. Đổi brand sang teal được chấp nhận. Phương án lùi là giữ `#7c3aed` nhưng giảm bão hoà và
   làm ấm — rẻ hơn, không giải quyết được vấn đề nhận diện ở N3.
2. Sửa `cta` là bắt buộc bất kể chọn brand nào: 2,83:1 vi phạm `BR-A11-02`.
3. Nuxt UI v4 thắng catalog v3.
4. `info` và `secondary` trỏ về họ đã có, không tạo màu nhấn thứ hai.
5. Mọi chuỗi hiển thị là tiếng Việt; mọi route và slug là tiếng Anh kebab-case.
6. Task #107 không đụng [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md),
   giống mọi task từ #98 tới #106, nên không kích hoạt cổng check-progress.

## 13. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Mascot nào? `D-DB` chốt **Thỏ Tini**, nhưng v1 để lại ba phương án chồng nhau: spec viết "Cú xanh", tài sản đã vẽ là Gấu Con bốn tư thế, component đặt tên "Cowy" nhưng render 🦉 và 😿, runtime hiện 🐻. Tên "Tini" có phải tàn dư thương hiệu cũ cần bỏ? | Vẽ mascot, 12 avatar preset, khối ăn mừng | P1 | người quyết |
| 2 | Bề mặt người lớn có giữ dark mode không? Contract cho phép, nhưng hiện 1.462 lần `dark:` không có cơ chế nào, và giữ nó là nhân đôi số cặp màu phải kiểm tương phản | `BR-DSC-18`, bảng màu, ngân sách kiểm | P1 | người quyết |
| 3 | 745 file giọng đọc tiếng Việt của v1 có tái dùng được về bản quyền và chất lượng không, hay thu lại? | Kênh chỉ dẫn bằng âm của `BR-ENG-10` | P1 | người quyết |
