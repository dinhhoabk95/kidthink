---
task: 165
title: Một nguồn cho 6 năng lực + số lượng trò chơi lấy thật từ DB
status: planned
created: 2026-08-31
owns_specs:
  - docs/specs/02-public/landing-page.md
  - docs/specs/02-public/game-catalog-public.md
depends_on:
  - TAXONOMY-SERVICE
  - GAME-CATALOG-PUBLIC
  - LANDING-PAGE
---

# Task 165 — Một nguồn cho 6 năng lực + số lượng thật

## 1. Vì sao

Ba lỗi đo được trên `localhost:3000` ngày 2026-08-31.

### 1.1 Bốn bảng nhãn năng lực, không bảng nào đọc từ nguồn

Nguồn sự thật là `docs/taxonomy/index.md` → `packages/taxonomy/src/types.ts:36` →
bảng `competencies`. DB đang đúng:

| Code | name | description |
|---|---|---|
| C1 | Tư duy toán học | Mathematical Thinking |
| C2 | Tư duy không gian | Spatial Thinking |
| C3 | Tư duy logic | Logical Thinking |
| C4 | Tư duy quan sát | Observation Thinking |
| C5 | Tư duy ngôn ngữ | Language Thinking |
| C6 | Chức năng điều hành | Executive Function |

Bề mặt công khai không đọc bảng đó. Bốn bảng viết tay, hai bộ từ vựng khác nhau,
cả hai đều là taxonomy toán v1 đã bỏ:

| File | Bộ |
|---|---|
| `packages/shared/src/public-seo.ts:530` `COMPETENCIES_INFO` | v1 toán |
| `apps/web/app/components/public-footer.vue:25-52` | v1 toán, chép tay lần 2 |
| `apps/web/app/pages/games/index.vue:239` `COMPETENCY_OPTIONS` | v1 toán, chép tay lần 3 |
| `apps/web/server/api/users/play/home.get.ts:19` `COMPETENCY_CARDS` | bộ thứ tư, lệch cả v1 |

Kéo theo: `packages/shared/src/program-showcase.ts`, `apps/web/app/pages/play/index.vue`.

### 1.2 Ba nguồn số lượng trò chơi, chỉ một là DB

Đo trong DB dev ngày 2026-08-31 — `game_levels` `status='published'`:

```
tổng           239
band 3-4        60
band 4-5        84
band 5-6        95
access free     32
C1 66 · C2 40 · C3 36 · C4 36 · C5 25 · C6 36
```

| Chỗ hiện | Đang hiện | Nguồn |
|---|---|---|
| Trang chủ "Xem 24/48/48 trò chơi phù hợp" | 24 · 48 · 48 | số cứng `apps/web/server/api/guest/home.get.ts:23,30,37` |
| Hero + footer "120+ trò chơi" | 120+ | chuỗi cứng `landing-hero.vue:11,25` · `public-footer.vue:63` · `home.get.ts:70,83` |
| Gói Tiêu chuẩn "60+ trò chơi" | 60+ | chuỗi cứng `home.get.ts:52` |
| `/games` "60 / 239 trò chơi" | 239 | DB thật |

### 1.3 Trang chủ trỏ tới một bộ lọc không tồn tại

`apps/web/app/pages/index.vue:135` trỏ `/games?age_band=4-5`.
`SearchParamsSchema` (`packages/db/src/services/content-search.ts:11`) là
`z.object` không `strict`, nên `age_band` bị **loại trong im lặng**;
`apps/web/app/pages/games/index.vue:270` cũng chỉ đọc `age`.
Kết quả: bộ lọc rơi, danh mục trả cả 239 thay vì 84 — đúng như ảnh chụp.

`age` không thay được `age_band`: điều kiện của `age` là "band có chứa tuổi này",
nên `age=4` khớp cả band 3-4 lẫn 4-5 = 144 level, không phải 84 của Lớp Chồi.

## 2. Kết quả mong muốn

1. Đúng **một** bảng nhãn năng lực trong mã, mọi bề mặt dẫn xuất từ nó, và nó
   khớp `docs/taxonomy/index.md`.
2. Mọi số lượng trò chơi hiển thị cho người dùng đến từ truy vấn DB.
3. Link theo lứa tuổi ở trang chủ lọc đúng, hoặc không tồn tại.
4. Có cổng ca âm chặn cả ba lỗi tái diễn.

## 3. Giả định — chốt ở đây, sửa nếu sai

| # | Giả định | Vì sao |
|---|---|---|
| A1 | Nhãn tiếng Việt lấy nguyên văn `docs/taxonomy/index.md`, Cấm — NEVER đặt lại tên | Skill code khoá theo competency; đổi tên là đổi contract L1 |
| A2 | `emoji` và câu mô tả tiếng Việt cho bề mặt công khai là **dữ liệu trình bày mới**, chưa từng có nguồn — task này soạn và đặt cạnh nhãn | UI cần ba trường, taxonomy chỉ có hai |
| A3 | Câu mô tả tả **hoạt động**, Cấm — NEVER hứa kết quả học tập (`BR-LND-06`) | Ràng buộc pháp lý đã chốt |
| A4 | Bộ lọc lứa tuổi của `/games` chuyển sang **band** (3-4 · 4-5 · 5-6); `age` giữ lại ở API cho tương thích | Nội dung chỉ tồn tại ở ba band; `age=4` là câu hỏi khác |
| A5 | Footer bỏ con số, chỉ còn "Thư viện trò chơi" | Footer nằm trên mọi trang, không đáng thêm một lần fetch chỉ để in số |
| A6 | "120+" đổi thành số thật làm tròn xuống bội của 10 (`Math.floor(239/10)*10` → "230+") | Giữ được sắc thái tiếp thị mà không nói sai |

## 4. Ràng buộc kỹ thuật đã đo

- `packages/taxonomy` phụ thuộc `@mindkid/shared`. Đặt bảng nhãn ở `shared` rồi
  cho `taxonomy` dẫn xuất là **không tạo chu trình**; làm ngược lại thì
  `no-circular` của dependency-cruiser đỏ.
- Component Vue Cấm — NEVER import `@mindkid/shared` (barrel `.` kéo `node:` builtin
  xuống trình duyệt). Dùng `@mindkid/shared/client`, và bảng nhãn mới phải được
  re-export ở `packages/shared/src/client.ts`.
- `total` của `/api/guest/levels` = `facets.total`, đã tính theo mọi bộ lọc trừ
  `cursor`. Thêm `age_band` vào `buildBasicConditions` là đủ để "60 / 84" đúng.
- Cổng mới đặt ở `apps/web/tests/gates/`, Cấm — NEVER dựng lại `packages/gates`.
  Mẫu vi phạm sống ở `apps/web/tests/gates/fixtures/`, Cấm — NEVER viết thẳng
  vào file test.

## 5. Đồ thị phụ thuộc

```
P1 bảng nhãn (shared)
 ├─> P2 taxonomy dẫn xuất  ──> (seeder không đổi hành vi, chỉ đổi đường dữ liệu)
 └─> P3 bề mặt công khai đọc bảng nhãn
P4 bộ lọc age_band (db → api → page)  ──> P5 số lượng thật (home API)
P3 + P5 ──> P6 cổng ca âm
```

P1 chặn P2 và P3. P4 chặn P5 (số của trang chủ chỉ đúng khi link tới nó lọc đúng).
P6 chạy cuối vì nó khoá kết quả của P3 và P5.

## 6. Lát cắt dọc

Mỗi lát là một đường hoàn chỉnh từ dữ liệu tới thứ người dùng thấy, chạy được và
kiểm được một mình.

### P1 — Bảng nhãn năng lực, một nguồn

Thêm `packages/shared/src/competency-catalog.ts`:

```ts
export interface CompetencyCatalogEntry {
  readonly code: CompetencyCode;
  readonly name: string;        // vi — nguyên văn docs/taxonomy
  readonly description: string; // en — nguyên văn docs/taxonomy
  readonly emoji: string;       // trình bày
  readonly tagline: string;     // vi, một câu, tả hoạt động
}
export const COMPETENCY_CATALOG: readonly CompetencyCatalogEntry[];
export const COMPETENCY_TIERS: readonly CompetencyTier[]; // dẫn xuất
```

Re-export ở `index.ts` và `client.ts`.

**Nghiệm thu:** `COMPETENCY_CATALOG.map(c => c.name)` trùng khít cột `name` của
`docs/taxonomy/index.md`. `import { COMPETENCY_CATALOG } from "@mindkid/shared/client"`
chạy được trong file `.vue`.

### P2 — `@mindkid/taxonomy` dẫn xuất, thôi tự khai

`packages/taxonomy/src/types.ts`: `COMPETENCIES` = `COMPETENCY_TIERS` từ shared.

**Nghiệm thu:** `pnpm --filter @mindkid/taxonomy test` xanh; chạy lại
`pnpm db:seed` rồi `select code,name,description from competencies order by position`
trả **đúng sáu dòng như trước** — đường dữ liệu đổi, dữ liệu không đổi.

### P3 — Bốn bề mặt công khai đọc bảng nhãn

| Bề mặt | Việc |
|---|---|
| `packages/shared/src/public-seo.ts` | Xoá `COMPETENCIES_INFO`; sửa consumer |
| `apps/web/server/api/guest/home.get.ts` | `competencies` dẫn xuất từ `COMPETENCY_CATALOG` |
| `apps/web/app/components/public-footer.vue` | Bỏ sáu `<li>` cứng, `v-for` trên catalog |
| `apps/web/app/pages/games/index.vue` | `COMPETENCY_OPTIONS` dẫn xuất từ catalog |
| `apps/web/server/api/users/play/home.get.ts` | `COMPETENCY_CARDS` dẫn xuất từ catalog |
| `apps/web/app/pages/play/index.vue` | đọc từ payload đã sửa |
| `packages/shared/src/program-showcase.ts` | nhãn dẫn xuất từ catalog |

**Nghiệm thu:** `grep -rn "Số & Lượng" apps packages` trả rỗng.
`GET /api/guest/home` trả sáu `name` khớp DB. Trang chủ, footer, `/games`, `/play`
hiện cùng sáu tên.

### P4 — Bộ lọc `age_band` chạy thật

1. `SearchParamsSchema` thêm `age_band: z.enum(["3-4","4-5","5-6"]).optional()`.
2. `buildBasicConditions` dịch band → `eq(ageMin,min)` + `eq(ageMax,max)`.
3. `buildGameLevelFacets` thêm trục `age_band`, xoá `age_band` khi đếm chính trục đó.
4. `apps/web/app/pages/games/index.vue`: dropdown tuổi chuyển sang ba band, đọc/ghi
   `age_band` trong URL, `age` vẫn đọc được nếu có sẵn trong link cũ.
5. Sửa spec `game-catalog-public.md` §3 và §7.1 **trong cùng PR**.

**Nghiệm thu:** `/games?age_band=4-5` hiện "60 / 84 trò chơi";
`?age_band=3-4` → 60; `?age_band=5-6` → 95; không tham số → 239.

### P5 — Số lượng lấy từ DB

1. Thêm service `countPublishedLevels(db)` ở `packages/db/src/services/` trả
   `{ total, by_age_band, by_access_tier }`.
2. `home.get.ts` thành async, dùng service: `programs[].levels_count`, chuỗi hero,
   bullet của hai gói. Giữ `Cache-Control: public, max-age=300`.
3. `landing-hero.vue` nhận số qua prop thay vì chuỗi cứng.
4. `public-footer.vue` bỏ con số (A5).
5. Thêm `BR-LND-09` vào `docs/specs/02-public/landing-page.md`:
   *Mọi số lượng nội dung trên trang chủ lấy từ DB — Cấm NEVER viết số cứng.*

**Nghiệm thu:** trang chủ hiện 60 · 84 · 95; tổng ba số bằng `total` của `/games`.
Đổi `status` một level trong DB rồi tải lại sau 300s → số đổi theo.

### P6 — Cổng ca âm

`apps/web/tests/gates/public-competency-labels.ts` + `.test.ts`:

- **Quét thật:** không file nào dưới `apps/web/app`, `apps/web/server`,
  `packages/shared/src` được chứa chuỗi nhãn năng lực không có trong
  `COMPETENCY_CATALOG`; và không được chứa literal dạng `\d+\+ trò chơi`.
- **Ca âm:** `apps/web/tests/gates/fixtures/competency-labels/bad-label.vue.txt`
  và `bad-count.ts.txt` — quét hai file này phải ra vi phạm, nếu không thì đỏ.

Neo về `BR-LND-09` và `BR-TAX-*` (nhãn L1 do taxonomy sở hữu).

**Nghiệm thu:** `pnpm --filter @mindkid/web test tests/gates` xanh; sửa fixture
thành nhãn hợp lệ → test đỏ.

## 7. Checkpoint

| Sau | Kiểm |
|---|---|
| P2 | `pnpm db:seed` rồi so bảng `competencies` — sáu dòng trùng khít trước/sau |
| P3 | `pnpm lint` + `pnpm typecheck` không tăng nợ; chụp danh sách test trước/sau, đòi trùng khít |
| P4 | Ba URL band trả 60/84/95, không tham số trả 239 |
| P5 | Trang chủ khớp ba số trên |
| P6 | Cổng đỏ khi fixture hợp lệ hoá |

## 8. Rủi ro

| Rủi ro | Xử |
|---|---|
| Test đang khoá nhãn cũ (`public-site-p1-13.test.ts:66`, `play-map.test.ts:91`) | Đọc từng cái: fixture tự dựng thì giữ, assert bề mặt thật thì sửa theo nhãn mới |
| `pnpm typecheck` là bậc thang, tăng lỗi là đỏ | Chạy `--only web` sau mỗi lát, Cấm — NEVER dùng `--allow-increase` |
| Đổi `home.get.ts` sang async ảnh hưởng prerender `BR-LND-03` | Route đã là handler Nitro; kiểm lại trang hiện đủ khi tắt JS |
| Barrel shared rò xuống client | Bảng nhãn Cấm — NEVER import gì ngoài type; kiểm bằng import trong `.vue` |

## 9. Ngoài phạm vi

- Soạn thêm nội dung để cân số lượng giữa sáu năng lực (C5 mới 25 level).
- Trang `/programs`, `/curricula` — cùng vết nhãn nhưng không nằm trong ảnh chụp;
  ghi vào todo như việc theo sau.
- Sinh trang SEO theo competency.
