# Task #291 Todo: Vá các gap nhỏ ở trang công khai và báo cáo cơ bản

Plan: [`291-public-account-small-gaps-plan.md`](291-public-account-small-gaps-plan.md).
Spec: [`basic-report.md`](../specs/03-account/basic-report.md), [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md), [`faq-and-help.md`](../specs/02-public/faq-and-help.md), [`subscription-view.md`](../specs/03-account/subscription-view.md) — `BR-BRP-*`, `BR-SEO2-01/09`, `BR-FAQ-04`, `BR-SBV-02`.

---

## S1 — Route báo cáo cơ bản
- [ ] Test đỏ `tests/api/basic-report.test.ts`: period 7d/30d, 422 period lạ, 404 hồ sơ lạ, shape §8
- [ ] Tạo `server/api/users/children/[uuid]/reports/basic.get.ts` (Zod parse query trong file)

## S2 — Trang báo cáo + dashboard
- [ ] Test đỏ component `me/children/[uuid]/report/index.vue`
- [ ] Test đỏ: `dashboard.get.ts` trả `report_url` cơ bản khi không có `view_advanced_report`
- [ ] Tạo trang + sửa `dashboard.get.ts:99`

## S3 — FAQ (`BR-FAQ-04`)
- [ ] Hỏi người dùng: (a) `seo_pages` `page_type='faq'` hay (b) sửa spec code-owned
- [ ] (a) Test đỏ đọc FAQ từ `seo_pages`; migration mới thêm `faq` vào enum; seed từ `FAQ_ITEMS`; sửa `faq.vue` + `home.get.ts:147`
- [ ] (b) Sửa spec trước, bỏ `BR-FAQ-04`

## S4 — SEO
- [ ] Test đỏ: `/me`, `/play` có `X-Robots-Tag: noindex` (`BR-SEO2-01`)
- [ ] Test đỏ: trang public có `hreflang vi-VN` + `x-default` (`BR-SEO2-09`)
- [ ] `routeRules` + link alternate

## S5 — Subscription view + test giả
- [ ] Test đỏ: `me/subscription.vue` có câu `BR-SBV-02`
- [ ] Thêm câu vào trang
- [ ] Viết lại `report-dashboard-library.test.ts` và `public-site-seo-legal.test.ts` để đo code thật (không tụt số suite)

## S6 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test web + db liên quan xanh; `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Bỏ `"#291"` khỏi `open_tasks` + khối "Chưa hoàn thành" ở 4 spec, nâng `status: implemented`
- [ ] Commit lên `main`
