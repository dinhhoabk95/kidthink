# Kế hoạch Task #291: Vá các gap nhỏ ở trang công khai và báo cáo cơ bản (Public & Account Small Gaps)

Contract: `docs/specs/03-account/basic-report.md` §3, §8, §9 (`BR-BRP-01..08`), `docs/specs/02-public/seo-and-structured-data.md` (`BR-SEO2-01`, `BR-SEO2-09`), `docs/specs/02-public/faq-and-help.md` (`BR-FAQ-04`), `docs/specs/03-account/subscription-view.md` (`BR-SBV-02`), `docs/specs/03-account/member-dashboard.md` (link báo cáo).

---

## 1. Bối cảnh & bằng chứng gap

| Spec | Bằng chứng | Thiếu |
| --- | --- | --- |
| basic-report | rg không thấy `reports/basic` trong `apps/`; gần nhất là `apps/web/server/api/users/children/[uuid]/progress.get.ts` (không có `?period`, không trang nào gọi); `app/pages/me/children/[uuid]/` chỉ có `report/advanced.vue` | Route `GET /api/users/children/{uuid}/reports/basic` (§8) và trang `/me/children/{uuid}/report`. `server/api/users/dashboard.get.ts:99` luôn trỏ `report_url` về `/report/advanced` |
| basic-report (test) | `packages/db/tests/integration/report-dashboard-library.test.ts` chỉ import `vitest`, assert trên hằng số tự khai | Test `BR-BRP-*` đếm là có nhưng không đo code |
| seo-and-structured-data | `server/routes/robots.txt.ts` chỉ `Disallow: /play/ /me/`; rg `noindex` trong `app/` chỉ thấy `programs/[code].vue:421`; rg không thấy `hreflang` | `BR-SEO2-01` (noindex cho `/me/**`, `/play/**` — Disallow ≠ noindex), `BR-SEO2-09` (`hreflang vi-VN`) |
| seo (test) | `packages/db/tests/integration/public-site-seo-legal.test.ts` chỉ assert hằng số tự khai (BR-SEO2/GCP/GDP/LND/LGL/FAQ/CKB) | Test giả |
| faq-and-help | `app/pages/faq.vue:122` và `server/api/guest/home.get.ts:147` đọc `FAQ_ITEMS` từ `@mindkid/shared/client`; enum `seo_page_type` (`packages/db/src/schema/content.ts:253-259`) **không có** giá trị `faq` | `BR-FAQ-04`: FAQ đọc từ `seo_pages` `page_type='faq'`, admin sửa được |
| subscription-view | rg không thấy câu "dữ liệu không mất khi hết hạn" trong `app/pages/me/subscription.vue` | `BR-SBV-02` |

## 2. Thiết kế

### 2.1 Báo cáo cơ bản
- Spec là contract: thêm `apps/web/server/api/users/children/[uuid]/reports/basic.get.ts` với `?period=7d|30d` (Zod parse query trong file), kiểm sở hữu hồ sơ trẻ, trả đúng shape §8. Tái dùng truy vấn của `progress.get.ts`; nếu `progress.get.ts` không còn caller sau đó thì đề xuất gỡ ở slice nghiệm thu (hỏi trước).
- Trang `app/pages/me/children/[uuid]/report/index.vue` (layout account), không có điểm so sánh giữa trẻ.
- `dashboard.get.ts:99`: `report_url` trỏ báo cáo cơ bản khi gia đình không có entitlement `view_advanced_report`.

### 2.2 SEO
- `apps/web/nuxt.config.ts` `routeRules`: `/me/**`, `/play/**` gắn header `X-Robots-Tag: noindex, nofollow` (bao cả SSR lẫn API không cần); thêm `useSeoMeta({ robots: "noindex" })` ở layout `account`/`kid` nếu header không phủ hết.
- `hreflang`: `<link rel="alternate" hreflang="vi-VN" …>` + `x-default` ở `app.vue`/layout public, URL tuyệt đối từ cùng nguồn `siteUrl()` (`server/utils/seo-jsonld.ts:8`).

### 2.3 FAQ
- **Điểm chốt với người dùng (S3 bắt đầu bằng câu hỏi):** (a) thêm `faq` vào enum `seo_page_type` (migration mới), seed từ `FAQ_ITEMS`, `faq.vue` + `home.get.ts` đọc `seo_pages`; hoặc (b) sửa spec chấp nhận FAQ code-owned (bỏ `BR-FAQ-04`). Mặc định đề xuất (a) vì spec hiện là contract. Đổi spec thì sửa spec trước.

### 2.4 Subscription view
- Thêm câu `BR-SBV-02` (tiếng Việt, đúng chữ spec) vào `me/subscription.vue`, hiện ở trạng thái sắp hết hạn/đã hết hạn.

### 2.5 Thay test giả
- Viết lại `report-dashboard-library.test.ts` và `public-site-seo-legal.test.ts` để gọi code thật (route handler / hàm build sitemap / robots / JSON-LD), hoặc xoá phần tautology và chuyển ca thật về `apps/web/tests/api/…`. Sàn `minTotalSuites` của `check:test-ratchet`: không được làm tụt số suite — thay, không xoá.

## 3. Lát cắt (Slices)

- **S1 — Route báo cáo cơ bản.** Test trước (`apps/web/tests/api/basic-report.test.ts`): 200 với `period=7d|30d`, 422 period lạ, 404 hồ sơ của gia đình khác, shape đúng §8, gắn mã `BR-BRP-*`. Code §2.1 phần route.
- **S2 — Trang báo cáo cơ bản + link dashboard.** Test component trang; test `dashboard.get.ts` trả `report_url` cơ bản khi không có entitlement.
- **S3 — FAQ (`BR-FAQ-04`).** Hỏi người dùng chọn (a)/(b). (a): test `faq.vue`/`home.get.ts` đọc từ `seo_pages`; migration enum + seed; (b): sửa spec, giữ test.
- **S4 — SEO noindex + hreflang.** Test: response `/me`, `/play` có `X-Robots-Tag: noindex`; trang public có `hreflang vi-VN` (`BR-SEO2-01`, `BR-SEO2-09`).
- **S5 — `BR-SBV-02` + thay test giả.** Test component `me/subscription.vue` có câu; viết lại hai file test tautology để import code thật; số suite không tụt.
- **S6 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/basic-report.test.ts tests/component` + `rtk proxy pnpm --filter @mindkid/db test`; `rtk proxy pnpm check:test-ratchet`.
  - Bỏ `"#291"` khỏi `open_tasks` + khối "Chưa hoàn thành" ở `basic-report`, `seo-and-structured-data`, `faq-and-help`, `subscription-view`; nâng `status: implemented`.
  - Commit lên `main`.
