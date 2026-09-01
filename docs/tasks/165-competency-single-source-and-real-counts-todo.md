---
task: 165
title: Todo — một nguồn cho 6 năng lực + số lượng thật
plan: 165-competency-single-source-and-real-counts-plan.md
status: done
created: 2026-08-31
---

# Task 165 — Todo

Thứ tự bắt buộc: P1 → P2 → P3 → P4 → P5 → P6. P3 và P4 độc lập nhau, làm song
song được; P5 phải sau P4.

## P1 — Bảng nhãn năng lực (chặn P2, P3)

- [x] `packages/shared/src/competency-catalog.ts` — `CompetencyCatalogEntry`,
      `COMPETENCY_CATALOG` (6 mục), `COMPETENCY_TIERS` dẫn xuất
- [x] `name` + `description` chép nguyên văn `docs/taxonomy/index.md`
- [x] `tagline` tả hoạt động, Cấm — NEVER hứa kết quả (`BR-LND-06`)
- [x] Re-export ở `packages/shared/src/index.ts`
- [x] Re-export ở `packages/shared/src/client.ts`
- [x] Test: `COMPETENCY_CATALOG` có đúng 6 mục, code `C1`..`C6`, không trùng emoji

Nghiệm thu: import được từ `@mindkid/shared/client` trong file `.vue`.

## P2 — taxonomy dẫn xuất

- [x] `packages/taxonomy/src/types.ts` — `COMPETENCIES` = `COMPETENCY_TIERS`
- [x] `pnpm --filter @mindkid/taxonomy test`
- [x] `pnpm db:seed` rồi so `select code,name,description from competencies order by position`

Nghiệm thu: sáu dòng trùng khít trước/sau khi đổi.

## P3 — Bề mặt công khai đọc một nguồn

- [x] Xoá `COMPETENCIES_INFO` khỏi `packages/shared/src/public-seo.ts`
- [x] `apps/web/server/api/guest/home.get.ts` — `competencies` từ catalog
- [x] `apps/web/app/components/public-footer.vue` — `v-for` trên catalog
- [x] `apps/web/app/pages/games/index.vue` — `COMPETENCY_OPTIONS` từ catalog
- [x] `apps/web/server/api/users/play/home.get.ts` — `COMPETENCY_CARDS` từ catalog
- [x] `apps/web/app/pages/play/index.vue` — đọc payload đã sửa
- [x] `packages/shared/src/program-showcase.ts` — nhãn từ catalog
- [x] Đọc và xử `apps/web/tests/api/guest/public-site-p1-13.test.ts:66`
- [x] Đọc và xử `apps/web/tests/api/play-map.test.ts:91`
- [x] Đọc và xử `packages/shared/src/program-showcase.test.ts:133,135`

Nghiệm thu: `grep -rn "Số & Lượng" apps packages` rỗng; bốn trang hiện cùng sáu tên.

## P4 — Bộ lọc age_band (chặn P5)

- [x] `content-search.ts` — `SearchParamsSchema.age_band` enum ba band
- [x] `content-search.ts` — `buildBasicConditions` dịch band → `eq` hai đầu
- [x] `content-search.ts` — facet `age_band`
- [x] `apps/web/app/pages/games/index.vue` — dropdown ba band, đọc/ghi URL
- [x] Spec `docs/specs/02-public/game-catalog-public.md` §3 + §7.1 **cùng PR**
- [x] Test `SearchParamsSchema.age_band` (`packages/db/tests/unit/search-params-age-band.test.ts`) — test tích hợp đếm bị bỏ: `mindkid_test` rỗng nên assert số sẽ xanh giả

Nghiệm thu: `/games?age_band=4-5` hiện "60 / 84 trò chơi".

## P5 — Số lượng thật

- [x] `packages/db/src/services/` — `countPublishedLevels(db)` trả
      `{ total, by_age_band, by_access_tier }`
- [x] `apps/web/server/api/guest/home.get.ts` — async, `levels_count` thật
- [x] `home.get.ts` — hero + bullet hai gói dùng số thật
- [x] `apps/web/app/components/landing-hero.vue` — nhận số qua prop
- [x] `apps/web/app/components/public-footer.vue` — bỏ con số
- [x] `apps/web/app/pages/index.vue` — chuỗi SEO ở `:283,299,303` dùng số thật
- [x] Spec `docs/specs/02-public/landing-page.md` — thêm `BR-LND-09`
- [x] Giữ `Cache-Control: public, max-age=300`

Nghiệm thu: trang chủ hiện 60 · 84 · 95; tổng bằng `total` của `/games`.

## P6 — Cổng ca âm

- [x] `apps/web/tests/gates/public-competency-labels.ts` — hàm quét
- [x] `apps/web/tests/gates/fixtures/competency-labels/bad-label.vue.txt`
- [x] `apps/web/tests/gates/fixtures/competency-labels/bad-count.ts.txt`
- [x] `apps/web/tests/gates/public-competency-labels.test.ts` — quét thật + ca âm
- [x] Neo mỗi rule về `BR-LND-09` / `BR-TAX-*`

Nghiệm thu: sửa fixture thành hợp lệ → test đỏ.

## Cổng cuối

- [x] `pnpm lint`
- [x] `pnpm typecheck` — Cấm — NEVER `--allow-increase`
- [x] `pnpm test` theo từng workspace — 17 test đỏ còn lại đều là vai `mindkid_app` không tồn tại trong container dev (`select rolname from pg_roles where rolname like 'mindkid%'` rỗng), không dính tới thay đổi này
- [x] `pnpm lint:deps`

## Việc theo sau (ngoài task này)

- [ ] `/programs`, `/curricula` cùng vết nhãn năng lực
- [ ] C5 mới 25 level — thiếu nội dung, không phải lỗi mã
