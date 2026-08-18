# Kế hoạch — Task #26: P1.1 — Ràng buộc chất lượng & thiết kế UI

> Viết 2026-08-09. Bước sở hữu: **P1.1** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) — bước **đầu tiên**
> của P1.
> Spec sở hữu: [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) ·
> [`accessibility.md`](../specs/08-quality/accessibility.md) ·
> [`performance-budgets.md`](../specs/08-quality/performance-budgets.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

P1 mở đầu bằng ba spec **không giao màn hình nào**. Đó là lý do bước này dễ bị bỏ qua và là lý
do nó phải đi trước: cả ba đều là **ngưỡng chặn merge**, và ngưỡng thêm sau khi đã có 30 file
`.vue` là đi vá 30 file.

Ba spec, ba loại ngưỡng:

1. [`accessibility.md`](../specs/08-quality/accessibility.md) sở hữu **ngưỡng** — 13 `BR-A11-*`,
   sàn chạm theo bề mặt, 0 violation axe.
2. [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) sở hữu **cách
   hiện thực hoá ngưỡng** — token, một kit, 14 `BR-DSC-*`. Nó khai `depends_on: ACCESSIBILITY`;
   chiều ngược lại **không** tồn tại (`D-AH`).
3. [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) sở hữu **ngân sách** —
   bundle, thời gian, thứ tự suy giảm.

Kết quả bước này là **cổng**, không phải giao diện: `pnpm lint:tokens` mở rộng, axe chạy được,
ngân sách bundle đo được. Mỗi cổng phải có **ca âm** — một commit cố tình vi phạm phải làm cổng
đỏ. Bài học `ultracite check` exit 0 dù có lỗi áp thẳng vào đây.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `REPO-BOOTSTRAP` · `MONOREPO-PACKAGE-ARCHITECTURE` | P0.1 đã xong | catalog là nguồn version duy nhất (`BR-RBS-06`) |
| `TESTING-STRATEGY` | P0.0 đã xong | vùng nhạy cảm, ca âm bắt buộc |
| Cổng ra P0 | **phải xong** | P1.1 không bắt đầu khi P0 còn spec `approved` |
| `GAME-ENGINE-RUNTIME` | P1.2 — **sau** | xem `D-FB` |
| `MONITORING-AND-ALERTING` | P1.16 — **sau** | xem `D-FB` |

## 1. Đo được

### 1.1 Đã có

| Thứ | Nơi |
|---|---|
| `pnpm lint:tokens` | [`scripts/lint-tokens.ts`](../../scripts/lint-tokens.ts), đã nằm trong `pnpm check` |
| `apps/web` khung Nuxt 4.5 | `apps/web/nuxt.config.ts` |
| catalog version | `pnpm-workspace.yaml` — `nuxt ^4.5.1`, `vue-tsc ^3.3.9` |

### 1.2 Chưa có

`packages/ui/src/index.ts` và `packages/game-engine/src/index.ts` đều là `export {};` — **không
có token, không có kit, không có `designTokens.ts`**. Trong catalog **chưa** có Nuxt UI,
Tailwind, Playwright, `@axe-core/playwright`, công cụ đo bundle, hay k6.

Nghĩa là P1.1 làm việc trên nền trống — đây là **thời điểm rẻ nhất** để dựng ràng buộc, và là
lý do bước này đứng trước P1.2.

### 1.3 Ba `BR-*` không đo được ở P1.1

`BR-PRF-03` (thứ tự suy giảm), `BR-PRF-04` (không network lúc chơi), `BR-PRF-05` (không cấp phát
mỗi frame) đều nói về engine. Engine ở P1.2. Xem `D-FB`.

## 2. Quyết định

**D-FB — [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) giao làm hai
phần, không dời cả spec.** Spec đó khai `depends_on: GAME-ENGINE-RUNTIME` (P1.2) và
`MONITORING-AND-ALERTING` (P1.16) nhưng roadmap xếp nó ở P1.1. Cạnh là thật, nhưng **không** đảo
được: ngân sách phải tồn tại trước dòng UI đầu tiên, nếu không nó chỉ là mục tiêu mong muốn
(`BR-PRF-01`). Cách xử: P1.1 giao **bảng ngân sách dạng dữ liệu + cổng đo được ngay** (bundle
size, LCP, CLS, API P95 trên endpoint đã có). Ngưỡng FPS và `BR-PRF-03/04/05` gắn vào cổng ở
**P1.2** cùng engine; `fps_sample` từ production và alert gắn ở **P1.16**. Spec chỉ sang
`implemented` khi P1.16 đóng — P1.1 **không** tick nó.

**D-FC — mỗi cổng mới phải có ca âm trong cùng PR.** Không chấp nhận "cổng đã cài, xanh".
Cổng xanh trên repo không có vi phạm chứng minh **không** điều gì. Mỗi cổng của bước này
(`lint:tokens` mở rộng, axe, ngân sách bundle) phải kèm một fixture vi phạm và một test khẳng
định cổng **đỏ** trên fixture đó.

**D-FD — quy tắc grep của §7.5 và §7.3 thành lệnh, không thành thói quen của reviewer.** Hai
spec liệt kê 5 lệnh `grep` để chạy trước merge. Lệnh nằm trong tài liệu là lệnh không ai chạy.
Gộp hết vào `pnpm lint:tokens` (mở rộng phạm vi: hex trong `.vue`, kit thứ hai, `dark:` trên bề
mặt trẻ, emoji làm affordance, `rounded-md`/`rounded-lg`, `.vue` > 800 dòng).

**D-FE — Nuxt UI v4 + Tailwind v4 vào catalog ở P1.1, không ở P1.2.** `BR-DSC-03` khai Nuxt UI
v4 là kit **duy nhất**. Nếu P1.2 dựng UI trước khi kit có mặt, mỗi component viết ra là một lần
phải viết lại. Ngoại lệ có chủ đích với quy tắc "chỉ liệt kê thứ ĐÃ cài" của catalog: ở đây
package **được cài trong chính PR này**.

**D-FF — sàn chạm là một nguồn duy nhất.** `BR-A11-04` sở hữu ba con số (64/76/96px trẻ, 44px
người lớn, 24px sàn tuyệt đối); [`design-system-contract.md`](../specs/08-quality/design-system-contract.md)
§7.1 **trỏ về** nó chứ không chép lại. Khai thành hằng số trong `packages/ui`, mọi test đọc từ
đó. Chép số vào component là tạo nguồn thứ hai.

## 3. Đồ thị

```
T1 token + designTokens.ts (một nguồn mỗi tầng)
      ├──→ T2 lint:tokens mở rộng + ca âm mọi rule quét được
      └──→ T3 kit Nuxt UI v4 + app.config.ts + hằng số sàn chạm
                └──→ T4 axe harness + page object mẫu + ca âm
                          └──→ T5 checklist bề mặt trẻ §7.2 thành test
  T6 ngân sách bundle + LCP/CLS + ca âm vượt ngân sách
                              ── Cổng dừng ──
  T7 evidence, promote 2 spec, ghi nợ phần P1.2/P1.16 của ngân sách
```

## 4. Task

### Task 1 — Token, hai tầng một nguồn

**Tiêu chí nghiệm thu**
- [ ] Họ token §7.2 khai đủ trong `packages/ui` CSS `@theme`: `brand-*`, `cta*`, `surface-*`, semantic, `retry`, font.
- [ ] `packages/game-engine/src/systems/designTokens.ts` tồn tại, chứa **cùng** giá trị màu cho canvas.
- [ ] Thang radius §7.3 và thang motion §7.4 khai thành token, không phải giá trị rời.
- [ ] `BR-DSC-08`: app-level `@theme` **kế thừa**; ca âm — định nghĩa lại một token thương hiệu ở `apps/web` làm cổng đỏ.
- [ ] `prefers-reduced-motion` xử lý **một chỗ** ở app stylesheet (`BR-A11-10`), giảm chứ không bỏ.
- [ ] `surface-400` đánh dấu rõ **chỉ** dùng cho viền/placeholder.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/ui test -- tokens` xanh, assertion tham chiếu `BR-DSC-08`.
- [ ] Test đối chiếu giá trị màu giữa `@theme` và `designTokens.ts` — lệch là đỏ.

**Phụ thuộc:** không · **Cỡ:** M

### Task 2 — `pnpm lint:tokens` mở rộng, mỗi rule một ca âm

**Tiêu chí nghiệm thu**
- [ ] `BR-DSC-01`: hex literal trong `.vue` (template, `<style>`, inline `:style`) → đỏ.
- [ ] `BR-DSC-02`: hex trong `packages/game-engine` ngoài `designTokens.ts` → đỏ.
- [ ] `BR-DSC-03`: quét `lucide-vue-next`, `class-variance-authority`, `clsx`, `tailwind-merge`, `cn(`, thư mục `components/ui/` → đỏ.
- [ ] `BR-DSC-05`: emoji trong `aria-label`/`label`/vị trí icon → đỏ.
- [ ] `BR-DSC-06`: `dark:` trong `components/kid` và `pages/play` → đỏ.
- [ ] `BR-DSC-13`: `.vue` > 800 dòng → đỏ.
- [ ] `BR-DSC-14`: `rounded-md`/`rounded-lg` → đỏ.
- [ ] `BR-A11-09`: `text-transform: uppercase` áp lên phần tử tiếng Việt → đỏ.
- [ ] **Ca âm cho từng rule** (`D-FC`): fixture vi phạm + test khẳng định exit code ≠ 0.
- [ ] Cổng exit code **thật** — không phải in cảnh báo rồi exit 0.

**Kiểm chứng**
- [ ] `pnpm lint:tokens` xanh trên repo sạch, đỏ trên mỗi fixture.
- [ ] `node scripts/tests/lint-tokens.test.ts` (hoặc vitest tương đương) phủ đủ 8 rule.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Kit và hằng số ngưỡng

**Tiêu chí nghiệm thu**
- [ ] Nuxt UI v4 + Tailwind v4 vào **catalog** (`D-FE`), `apps/web` khai `catalog:`, không version rời (`BR-RBS-06`).
- [ ] `packages/ui/app.config.ts` là nơi mở rộng kit duy nhất; không thư mục `components/ui/` thủ công.
- [ ] `BR-DSC-04`: icon dạng dữ liệu là **chuỗi** `i-lucide-*` qua `<UIcon>`; ca âm — truyền component qua `<component :is>` bị chặn ở type.
- [ ] `BR-A11-04` khai thành hằng số một nguồn (`D-FF`): 96 / 76 / 64 / 44 / 40 / 24.
- [ ] Bảng bốn bề mặt §7.1 khai dạng **dữ liệu** (bề mặt → sàn chạm, dark, đỏ), không rải `if`.
- [ ] `BR-DSC-11`: quy ước `active:` cho phản hồi nhấn; ca âm — `hover:` làm phản hồi nhấn duy nhất bị bắt trong review checklist.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/ui test -- surfaces` xanh, assertion tham chiếu `BR-A11-04` `BR-DSC-04`.
- [ ] `pnpm check` xanh (gồm `lint:deps` — kit không rò ngược vào `packages/game-engine`).

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 4 — Harness axe

**Tiêu chí nghiệm thu**
- [ ] Playwright + `@axe-core/playwright` vào catalog và chạy được trong CI local.
- [ ] Một **page object mẫu** cho mỗi bề mặt (kid, account, public, admin) — có thể là trang rỗng dựng từ kit.
- [ ] `BR-A11-01`: 0 violation trên mọi page object; **danh sách page object là bắt buộc mở rộng** — trang mới không có page object là lỗi cổng, không phải mặc định bỏ qua.
- [ ] `BR-A11-05` `BR-A11-06` `BR-A11-12` `BR-A11-13` có test: focus ring offset ≥2px, icon-only có `aria-label`, modal trap và **trả** focus, tab order khớp thứ tự thị giác.
- [ ] Ca âm (`D-FC`): một page object cố tình thiếu `aria-label` → cổng **đỏ**.
- [ ] Bỏ qua rule axe phải ghi lý do **tại chỗ**, cấm tắt toàn cục (§5).

**Kiểm chứng**
- [ ] `pnpm test:a11y` xanh trên 4 page object, đỏ trên fixture vi phạm.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Tám ràng buộc bề mặt trẻ §7.2

**Tiêu chí nghiệm thu**
- [ ] Tám mục §7.2 khai thành **test**, không thành checklist người: kênh chỉ dẫn, phản hồi không chỉ bằng màu, sàn chạm đo ở tỉ lệ 100%, không cử chỉ đa điểm, drag có fallback tap-tap, reduced-motion giữ kênh phản hồi, không chữ < 16px, không đỏ.
- [ ] `BR-A11-03`: ca âm giả lập màn hình đơn sắc — vẫn phân biệt được đúng/sai.
- [ ] `BR-A11-11`: cấu trúc dữ liệu chỉ dẫn **bắt buộc** có trường âm thanh hoặc hình; chỉ có chữ là lỗi kiểu, không phải cảnh báo.
- [ ] `BR-DSC-07`: token `danger`/đỏ không dùng được trên đường render bề mặt trẻ; ca âm ở tầng type nếu làm được.
- [ ] Ghi rõ: test này chạy **rỗng** ở P1.1 (chưa có level) nhưng phải **đỏ** khi P1.2 vi phạm — có fixture chứng minh.

**Kiểm chứng**
- [ ] `pnpm test -- kid-surface` xanh; fixture vi phạm mỗi mục làm đỏ.

**Phụ thuộc:** T4 · **Cỡ:** M

### Task 6 — Ngân sách hiệu năng, phần đo được ngay

**Tiêu chí nghiệm thu**
- [ ] Bảng §7.1 khai dạng dữ liệu: shell ≤180 KB, template ≤80 KB, config level ≤200 KB, ảnh ≤120 KB, trang public ≤500 KB (gzipped).
- [ ] `BR-PRF-01`: vượt ngân sách **chặn merge** — exit code ≠ 0, không phải cảnh báo.
- [ ] Ca âm (`D-FC`): thêm dependency đẩy shell qua 180 KB → cổng đỏ.
- [ ] `BR-PRF-02`: đo LCP và CLS dưới **4G throttle** trong Playwright; cấu hình throttle khai tường minh, không dựa mặc định máy dev.
- [ ] Thiết bị chuẩn ghi vào cấu hình theo `D-CH`: Lenovo Tab M8 2 GB, median của ba lần chạy.
- [ ] Ngưỡng API P95 (<800 ms) và ingest (<200 ms) khai sẵn trong cấu hình k6, chạy được trên endpoint P0 đã có (`/health`).
- [ ] `BR-PRF-08`: quy tắc ảnh WebP ≤960×960 khai thành cổng, kể cả khi chưa có ảnh nào.
- [ ] Ghi nợ tường minh (`D-FB`): ngưỡng FPS, `BR-PRF-03/04/05` → **P1.2**; `fps_sample` và alert → **P1.16**.

**Kiểm chứng**
- [ ] `pnpm perf:budget` xanh trên repo sạch, đỏ trên fixture vượt ngân sách.
- [ ] `pnpm test -- perf-budget` assertion tham chiếu `BR-PRF-01` `BR-PRF-02` `BR-PRF-08`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Cổng dừng

- [ ] Mỗi cổng mới đều có **ít nhất một ca âm** làm nó đỏ (`D-FC`) — kiểm tay từng cái.
- [ ] Không có nguồn thứ hai cho sàn chạm hay token màu.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Không có file `.vue` nào chứa hex; không có kit thứ hai trong `pnpm-lock.yaml`.
- [ ] Human review diff — đây là bước dựng cổng, cổng sai làm hỏng cả P1.

### Task 7 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-DSC-*` và `BR-A11-*` có ít nhất một test tham chiếu mã rule (`check:progress` ép điều này khi promote).
- [ ] [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) và [`accessibility.md`](../specs/08-quality/accessibility.md) sang `implemented`.
- [ ] [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) **giữ** `approved` — promote ở P1.16 (`D-FB`); ghi nợ vào todo của P1.2 và P1.16.
- [ ] Câu hỏi mở còn lại nêu lại ở cổng ra P1: kiểm thử với trẻ thật (a11y §11 Q1, chặn go-live), t3.small (perf §11 Q2, chặn go-live), CDN (perf §11 Q3, chặn P2).
- [ ] Tick **P1.1** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Cổng cài xong nhưng chưa từng đỏ | Cổng giả — lặp lại đúng lỗi `ultracite check` exit 0 | `D-FC` — ca âm cho **từng** rule, trong cùng PR |
| Ngân sách hiệu năng dời sang P1.2 "cho tiện" | `BR-PRF-01` mất hiệu lực đúng lúc bundle bắt đầu phình | `D-FB` — giao phần đo được ngay, ghi nợ phần còn lại có địa chỉ |
| Sàn chạm chép vào component | Hai nguồn, lệch lúc nào không biết | `D-FF` — hằng số một nguồn, test đọc từ đó |
| Kit thứ hai lẻn vào qua dependency gián tiếp | `BR-DSC-03` vỡ âm thầm | T2 quét cả `pnpm-lock.yaml`, không chỉ source |
| Bề mặt trẻ chưa có nội dung nên test §7.2 rỗng | Cổng xanh vì không có gì để kiểm | T5 — fixture vi phạm chứng minh cổng biết đỏ |
| Playwright + axe nặng cho t3.small | Cổng không chạy nổi trên hạ tầng | Chạy ở CI/local, **không** thường trực trên t3.small (`BR-PRF` §7.4) |
| Token canvas và token CSS lệch nhau | Cùng một màu hai giá trị trên hai tầng | T1 — test đối chiếu giá trị |

## 6. Giả định

1. **Cổng ra P0 đã đóng.** 35 spec P0 `implemented`, ba câu hỏi chặn go-live đã có chủ trả lời.
2. **Ngôn ngữ thị giác đầy đủ ở `docs/design-system/`** là đầu vào, không phải sản phẩm của bước này — P1.1 chỉ sở hữu ràng buộc kỹ thuật.
3. **Chưa giao màn hình sản phẩm nào.** Page object của T4 là khung để cổng chạy, không phải trang thật.
4. **12 avatar preset SVG (`D-AU`) và font Google OFL (`D-DM`)** đã chốt, không mở lại.
5. **Đo hiệu năng chạy ở CI và máy dev có throttle**, không chạy trên t3.small production.

## 7. Ngoài phạm vi

- Sáu game template và runtime — [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md), P1.2.
- `fps_sample` production, alert, dashboard — [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md), P1.16.
- Trang public thật và SEO — P1.13.
- Ngôn ngữ thị giác, bộ avatar, minh hoạ — `docs/design-system/`, không phải spec.
- Kiểm thử với trẻ thật và người dùng công nghệ trợ giúp — chặn go-live, chủ là người quyết.
