# Task #315 — Chuyển Thể Chương Trình 100 Học Phần Tư Duy Koguma-kai / Kuno Method & Bản Địa Hoá Giao Diện "Tuổi Thơ Việt × Giấy Gỗ Mộc"

> **Trạng thái:** Hoàn tất toàn bộ Wave 1, Wave 2 & Wave 3 (`/goal` 100% phủ đủ `100/100` học phần Koguma-kai) — `pnpm check` toàn monorepo exit `0`, dữ liệu đã `seed` lên PostgreSQL local (`30` lộ trình / `12` lộ trình Koguma-VN, `2.713` game level, `3.352` mục lộ trình, `0` nợ cầu), và vượt qua kiểm thử Playwright E2E đa khung hình trực tiếp (`goal-auditor` xác nhận 100%)
> **Contract sở hữu:** [`../specs/05-content/koguma-curriculum-program.md`](../specs/05-content/koguma-curriculum-program.md) (`BR-KGM-01..11`) · [`../taxonomy/koguma-100-alignment.md`](../taxonomy/koguma-100-alignment.md) · [`../design-system/vn-preschool-identity.md`](../design-system/vn-preschool-identity.md)
> **Kế thừa nền tảng:** [`314-preschool-kid-world-and-gameplay-redesign-plan.md`](314-preschool-kid-world-and-gameplay-redesign-plan.md)

---

## 1. Bối Cảnh & Mục Tiêu Kiến Trúc

Sau Task #314 (hoàn thiện Phòng chơi Gấu Con, Bản đồ đường mòn, Sân chơi Sticker và Hộp đồ chơi tự do Montessori), Task #315 nâng tầm chiều sâu học thuật và bản sắc văn hoá của MindKid thông qua sự kết hợp hai trụ cột:

1. **Học thuật Koguma-kai / Kuno Method (Nhật Bản — 100 học phần tư duy gốc 3–6 tuổi):**
   - Áp dụng triết lý **Giáo dục sự vật thật trước ký hiệu (*Jibutsu Kyoiku*)** và **Giáo dục đối thoại tư duy (*Taiwa Kyoiku*)** xoay vòng xoắn ốc trên **5 trụ cột Kuno (`K1`…`K5`)**:
     - `K1` Vị trí – Không gian & Đại lượng trực quan (20 học phần)
     - `K2` Số lượng & Cấu tạo số (22 học phần)
     - `K3` Hình học & Cấu trúc khối (16 học phần)
     - `K4` Ngôn ngữ tư duy & Tiền đọc viết Việt (18 học phần)
     - `K5` Logic – Phân loại – Quan sát & Điều hành (24 học phần)
   - Ánh xạ **100% lên 443 mã kỹ năng bất biến `skills.code`** và **38 khuôn `GT-000`…`GT-037`** hiện có theo 3 khối tuổi **Mầm (`3-4`: 28 HP)**, **Chồi (`4-5`: 34 HP)**, **Lá (`5-6`: 38 HP)** — tuyệt đối không sinh mã `skills.code` hay `strand` mới (`BR-CSA-08`, `BR-KGM-01`).
   - Đóng gói thành **12 lộ trình `RoadmapSeed` Koguma-VN** trải trên 2 chặng (`RM-{3-4,4-5,5-6}-koguma-{01,02}` 12 tuần × 3 tiết Học kỳ 1 / Học kỳ 2 và `RM-{3-4,4-5,5-6}-koguma-year-{01,02}` 36 tuần × 3 tiết Chặng 1 / Chặng 2 theo **10 chủ đề Giáo dục Mầm non Việt Nam**), phủ trực tiếp **100 / 100 (`100%`)** học phần gốc `KGM-001`…`KGM-100` (`BR-KGM-11`) và bảo toàn nguyên vẹn toàn bộ lộ trình nền hiện hữu (`ALL_ROADMAPS = 30`, `BR-ID-03`, `BR-KGM-10`).
2. **Bản sắc giao diện & thính giác Mầm non Việt Nam ("Tuổi thơ Việt × Giấy Gỗ Mộc"):**
   - Đưa chất liệu **giấy dó, chiếu cói, nan tre ngà, gỗ mộc, quạt nan, hoa sen, đèn ông sao, cánh diều** vào token hệ thống (`designTokens.ts` & `@mindkid/ui`), vẽ procedural nhẹ trên Canvas 2D có kiểm soát hiệu năng qua `ambient_motion_enabled` (giữ cứng 60 fps).
   - Chuẩn hoá âm thanh phản hồi trên **thang âm ngũ cung Việt Nam (*Hò – Xự – Xang – Xê – Cống*)** với âm sắc mộc cầm / đàn T'rưng tre mộc mạc (ramp vào `>= 20ms`, ra `>= 40ms`, trần `<= -1 dBTP`, không còi buzzer khi sai).
   - Chuẩn hoá lời dẫn giọng cô giáo mầm non Việt Nam gợi mở đối thoại Kuno (`<= 12` từ cho câu hướng dẫn màn chơi) và lời khen nhịp **đồng dao Việt Nam** ấm áp.

---

## 2. Các Ràng Buộc Bất Biến Không Thươngượng

1. **Giữ nguyên 12 quyết định cốt lõi (`D1`–`D12`) và toàn bộ mục 7.3 của [`../specs/00-foundation/business-rules.md`](../specs/00-foundation/business-rules.md):**
   - Không mở schema DB mới, không chạm `packages/db/**`, không dùng LLM runtime, không thu thêm dữ liệu trẻ, không nới cổng phân quyền / paywall server-side.
2. **Không phá vỡ mã định danh bất biến:**
   - `0` mã `skills.code` mới, `0` `strand` mới, `0` `GT-*` mới; giữ nguyên 9 lộ trình `RM-*` hiện có.
3. **Kỷ luật UI/UX & Game Engine:**
   - Tuyệt đối không viết hex literal trong `.vue` hoặc ngoài `packages/game-engine/src/systems/designTokens.ts`.
   - Bề mặt trẻ Light-only (`0` lớp `dark:`), `0` màu đỏ `danger`, sàn chạm `64px–96px`, điều hướng bằng SVG `i-lucide-*` (không dùng emoji làm affordance), không import `../` tương đối (`BR-MPA-08`), không dùng `any` / `unknown` (`01-coding-style.md`).

---

## 3. Phân Rã 5 Phân Luồng Thực Thi (Workstreams)

### Workstream 1 — Kiến Trúc Spec, Đối Chiếu 100 Học Phần & Design System (`docs/**`)
- **Phạm vi file:**
  - `docs/taxonomy/koguma-100-alignment.md` (Mới — bảng chuẩn `KGM-001`…`KGM-100` phủ 443/443 skill, ghi nhận ứng viên hậu MVP)
  - `docs/specs/05-content/koguma-curriculum-program.md` (Mới — contract `BR-KGM-01..10`)
  - `docs/specs/index.md` & `docs/specs/00-foundation/business-rules.md` (Đăng ký spec thứ 171 và prefix `BR-KGM`)
  - `docs/SPEC.md` (Cập nhật §1.1 Vision, §1.8, §2.6, §9.1–9.2, §14)
  - `docs/design-system/vn-preschool-identity.md` (Mới), `docs/design-system/01-principles.md`, `docs/design-system/README.md`
  - `docs/tasks/315-koguma-vn-curriculum-and-ui-plan.md` & `315-koguma-vn-curriculum-and-ui-todo.md`

### Workstream 2 — Bộ 6 Lộ Trình Xoắn Ốc Koguma-VN & Danh Mục 100 Học Phần (`packages/content/src/roadmaps/**`)
- **Phạm vi file:**
  - `packages/content/src/roadmaps/koguma-*.ts` & `packages/content/src/roadmaps/index.ts`
  - Xuất danh mục kiểu tĩnh `KOGUMA_DOMAINS`, `MOET_PRESCHOOL_THEMES`, `KOGUMA_100_UNITS`, `KOGUMA_ROADMAPS`
  - Biên soạn 6 lộ trình `RM-{3-4,4-5,5-6}-koguma-01` (12w × 3s) và `RM-{3-4,4-5,5-6}-koguma-year-01` (36w × 3s) khớp 10 chủ đề Bộ GD&ĐT và thứ tự tiên quyết `BR-CRM-01` / `BR-LRM-11`
  - Đồng bộ `packages/content/src/roadmaps/content-demand.json` và kiểm thử cổng tại `packages/content/tests/koguma-roadmaps.test.ts` + `packages/content-build/tests/gates/`

### Workstream 3 — Bộ Sinh Câu Dẫn Sư Phạm Kuno & Kho Vật Phẩm Văn Hoá Việt (`packages/content/src/{builders,inventories}/**`)
- **Phạm vi file:**
  - `packages/content/src/inventories/**` & `packages/content/src/builders/**`
  - Bổ sung kho từ vựng, đồ vật truyền thống gần gũi trẻ Việt, vần đồng dao Việt Nam và mẫu câu dẫn đối thoại *Taiwa Kyoiku* (`<= 12` từ nhiệm vụ, sự vật cụ thể trước ký hiệu cho *Jibutsu Kyoiku*)
  - Kiểm thử bất biến sư phạm tại `packages/content/tests/vn-pedagogy-builders.test.ts`

### Workstream 4 — Sân Khấu Canvas 2D "Giấy Gỗ Mộc" & Âm Thanh Ngũ Cung (`packages/game-engine/src/**`)
- **Phạm vi file:**
  - `packages/game-engine/src/systems/designTokens.ts` (Token tre ngà, chiếu cói, gỗ mộc, lá sen, đất nung)
  - `packages/game-engine/src/systems/{scene-background,scene-decor,scene-themes-*,shared-render,container-shapes}.ts` (Khung đốt tre, vân chiếu cói nhẹ, hoạ tiết cánh diều / hoa sen / đèn lồng kiểm soát bởi `ambient_motion_enabled`)
  - `packages/game-engine/src/systems/sfx-engine.ts` (Thang âm ngũ cung mộc cầm / tre mộc, ramp `>= 20ms` / `>= 40ms`, trần `-1 dBTP`)
  - Kiểm thử đơn vị và cổng token của `@mindkid/game-engine`

### Workstream 5 — Bề Mặt Thế Giới Trẻ `/play/**` & Giới Thiệu Chương Trình Koguma-VN (`apps/web/app/**`)
- **Phạm vi file:**
  - `apps/web/app/pages/play/**`, `apps/web/app/components/kid/**`, và khu vực giới thiệu chương trình học thuật (`/programs`)
  - Hiển thị chủ đề mầm non Việt Nam đang học, thẻ gợi ý hoạt động đồ vật thật cùng cha mẹ (`offscreen`), lời khích lệ đồng dao của Gấu Con, bộ chọn lộ trình Koguma-VN 12 tuần / 36 tuần rõ ràng cho phụ huynh
  - Đạt chuẩn Light-only, `0` hex literal trong `.vue`, `0` emoji làm nút điều hướng, sàn chạm `>= 64px`

### Workstream 6 (Wave 2) — Tích Hợp Đầu Cuối `@mindkid/taxonomy`, API Server, Admin Catalog, Live Gameplay & `seed` Local (`backend-seed` · `engine-live-play` · `explorer-admin-ui` · `qa-gatekeeper`)
- **Phạm vi file:**
  - `packages/taxonomy/src/koguma-*.ts` (Xuất browser-safe `KOGUMA_100_UNITS` `KGM-001`…`KGM-100`, `KOGUMA_DOMAINS` `K1`…`K5`, `MOET_PRESCHOOL_THEMES` 10 chủ đề tuần 1..36, giáo cụ *Jibutsu*, câu hỏi *Taiwa* và bộ helper tra cứu)
  - `apps/web/server/api/{guest/curricula,users/curricula,users/play,managers/curricula}/**` (Bổ sung metadata `is_koguma`, `koguma_track`, `moet_themes`, `koguma_unit`, `current_koguma_unit` tương thích ngược, giữ nguyên `BR-PSH-02` và `FORBIDDEN_PUBLIC_KEYS`)
  - `packages/game-engine/src/**` & `apps/web/app/{pages/play,components/kid}/**` (Đấu nối thang âm ngũ cung `marimba_1..5` + `bamboo_clack` + `trung_chime` + `dan_tranh_pluck` vào `RoundRunner` và `AudioController`, nền 16 chủ đề nội dung + 10 chủ đề Bộ GD&ĐT không cấp phát mỗi frame, cùng góc phụ huynh `KidKogumaParentCorner`)
  - `apps/web/app/{pages,components}/**` & `apps/admin/app/{pages/curriculum,components}/**` (Bộ khám phá tương tác 100 học phần `KogumaUnitExplorer`, chi tiết 36 tuần × 3 buổi `KogumaRoadmapView`, bảng chọn nhanh `KogumaEnrollmentPanel` / `KogumaMeCompanionPanel`, và danh mục Admin chỉ đọc theo quyết định `D1`)

### Workstream 7 (Wave 3 `/goal`) — Phủ Trọn 100/100 Học Phần Trên Lộ Trình Chơi Được, Giáo Cụ Vật Thật *Jibutsu* Toybox, Deep-Link `#week-N` & Phiếu In Gia Đình Kuno (`koguma-100-complete` · `koguma-toybox-vn` · `koguma-journey-ui` · `infra-db-api` · `goal-auditor`)
- **Phạm vi file & hạng mục hoàn tất:**
  - `docs/specs/05-content/koguma-curriculum-program.md` (`BR-KGM-11`), `packages/content/src/roadmaps/rm-{3-4,4-5,5-6}-koguma-{02,year-02}.ts`, `packages/taxonomy/src/koguma-{schedules,types,catalog}.ts` và `packages/content/src/skills/**`: Mở rộng từ 6 lên **12 lộ trình Koguma-VN** (`ALL_ROADMAPS = 30`), bảo đảm **100 / 100 (`KGM-001`…`KGM-100`: `28/28` Mầm, `34/34` Chồi, `38/38` Lá)** mã `primary_skill_code` đều được dạy trực tiếp (`introduce`/`practice`), đính kèm siêu dữ liệu `scheduled_roadmap_code` + `scheduled_week_no` khớp từng tuần học, sửa `GL-C1-NREC-SLOT-0105` đạt `BR-CTR-09` và tái sinh `content-demand.json` đạt **2.304 / 2.304 ô cầu (`0` nợ)**.
  - `apps/web/app/components/kid/toybox/{mirror-blocks-toy,number-rods-toy,balance-scale-toy,toybox-kuno-parent-card}.vue` & `apps/web/app/pages/play/toybox/**`: Làm sâu 3 bàn giáo cụ *Jibutsu* theo phương pháp Kuno & chất liệu "Giấy Gỗ Mộc" — chế độ **Gấp Giấy Dó Hoa Sen / Ông Sao** (*Origami Tenkai* `K3` đối xứng 1 trục / 2 trục), **Khay Tre 5 Ô / 10 Ô Hạt Sen Tách–Gộp** (`K2`), **Cân Gỗ Bập Bênh Quả Quê** (*Omosa Hikaku* `K1` với bưởi, cam, xoài, chanh, bánh chưng) và thẻ thu gọn 1 chạm **"Gợi ý Ba Mẹ hỏi bé (Phương pháp Kuno)"** (`0` chấm điểm đúng/sai theo `BR-TBX-01..06`).
  - `apps/web/app/components/{koguma-unit-explorer,koguma-roadmap-view,koguma-printable-family-sheet,koguma-enrollment-panel,koguma-me-companion-panel}.vue`, `apps/web/app/pages/{index.vue,programs/**,curricula/**,me/**}` và `apps/admin/app/{pages/curriculum/index.vue,components/curriculum-koguma-detail-modal.vue}`: Gắn deep-link chính xác `/programs/${scheduled_roadmap_code}#week-${scheduled_week_no}` trên toàn bộ 100 thẻ học phần, tự cuộn và đánh dấu `#week-N` không lệch SSR hydration, bộ chuyển đổi 4 nhánh lộ trình (`01`, `02`, `year-01`, `year-02`), nút **"In Phiếu Thực Hành Vật Thật Tại Nhà (Kuno Jibutsu và Taiwa)"** chuẩn `@media print`, và số đếm lộ trình động từ API.
  - `apps/web/server/api/{guest,users,managers}/curricula/**` & `apps/web/server/api/users/play/{home,adventure,theme-map}.get.ts`: Tổng quát hoá metadata `koguma_stage` (`1 | 2`), `koguma_variant` (`01 | 02 | year-01 | year-02`), `koguma_track_label_vi`, chủ đề Bộ GD&ĐT Học kỳ 2 cho `RM-*-koguma-02`, và `seed` lại PostgreSQL + Valkey local.

---

## 4. Cổng Kiểm Định Hoàn Tất & Kết Quả Thực Tế (Verification Gates — Wave 3 Final)

Toàn bộ cổng kiểm định Wave 1, Wave 2 và Wave 3 đã đạt `exit 0`:

1. **Đối chiếu độc lập 100/100 học phần Koguma-kai, sổ cầu & cơ sở dữ liệu (`wave3-audit` — exit `0`):**
   - `KOGUMA_100_UNITS` (`KGM-001`…`KGM-100`): **100 / 100 (`100%`)** học phần (`28/28` Mầm `3-4`, `34/34` Chồi `4-5`, `38/38` Lá `5-6`) được dạy trực tiếp trong `KOGUMA_ROADMAPS` (`12` lộ trình) và khớp tuyệt đối `scheduled_roadmap_code` + `scheduled_week_no` trong `@mindkid/taxonomy`.
   - `packages/content/src/roadmaps/content-demand.json`: **30 / 30** lộ trình, **2.304 / 2.304** ô cầu đủ level, **`0` nợ**.
   - PostgreSQL local (`127.0.0.1:5433`) & Valkey (`127.0.0.1:6380`): `pnpm db:migrate`, `pnpm db:seed`, `check-seed-gates.ts` và `seed-check.ts --against-db` đều xanh với đủ **30 lộ trình** (`12` lộ trình `CUR-RM-{3-4,4-5,5-6}-koguma-{01,02,year-01,year-02}`), **2.713 game level** và **3.352 mục lộ trình** (`0` độ lệch DB).
2. **Cổng chất lượng, bất biến tĩnh & kiểu tĩnh toàn monorepo (`pnpm check` — exit `0`):**
   - `pnpm lint` (`biome check .`): Kiểm tra **`3.874` file** toàn monorepo, **`0` lỗi** (bảo toàn nguyên vẹn toàn bộ WIP Task #316 và `packages/db/src/**`).
   - `pnpm lint:deps` (`depcruise`): Quét **`3.111` module** và **`11.097` phụ thuộc**, **`0` vi phạm** ranh giới package.
   - `pnpm typecheck` (`tsc --noEmit` + `vue-tsc` trên `apps/web`, `apps/admin` và `tsc` trên `apps/worker`): **`0` lỗi kiểu tĩnh**, quét AST trên toàn bộ **`450` file `.ts`/`.vue`** chạm trong repo đạt `0` `any`/`unknown`, `0` import tương đối `../`, `0` hex literal trong `.vue` và ngoài `designTokens.ts`, `0` vi phạm bề mặt trẻ (`dark:`, `danger`, `rounded-md/lg`, `uppercase`, `%`), toàn bộ file `<= 800` dòng, đúng thứ tự SFC `<template>` → `<script setup lang="ts">` → `<style scoped>`, và `0` ký hiệu cấm trong spec/task.
3. **Cổng Vitest tuần tự theo từng workspace:**
   - `@mindkid/shared`: **`51/51` file** (`495/495` test pass).
   - `@mindkid/taxonomy`: **`2/2` file** (`26/26` test pass).
   - `@mindkid/content`: **`13/13` file** (`89/89` test pass, gồm `koguma-roadmaps.test.ts` `BR-KGM-01..11` và `vn-pedagogy-builders.test.ts`).
   - `@mindkid/content-build` (cổng lộ trình, sổ cầu, `theme-registry` `BR-CTR-09` & `BR-CTR-12`, `roadmap-seed-gate`, `comprehensive-roadmaps`, `eight-gates`, `corpus-truth`): **`13/13` suite cổng** (`147/147` test pass).
   - `@mindkid/game-engine`: **`364/364` file** (`5.606/5.606` test pass, gồm `shell-frame-capacity.test.ts` trên toàn bộ `2.713` level).
   - `@mindkid/admin`: **`14/14` file** (`80/80` test pass, gồm `curriculum-catalog-page.test.ts`).
   - `@mindkid/web`: **`56/56` file** (`273/273` test pass trên toàn bộ `tests/gates/*`, `tests/component/*` gồm `koguma-toybox-vn.test.ts` & `koguma-explorer-and-enrollment.test.ts`, các suite API `curricula`, `play`, `kid-world`, `guest/curricula`, `guest/health` và `unit/play-*`).
4. **Kiểm chứng E2E trình duyệt trực tiếp bằng Playwright headless đa khung hình (`768×1024` Tablet, `375×667` Mobile, `1024×768` Landscape):**
   - `GET /api/guest/health` (`200`), `GET /api/guest/curricula` (`200`, trả đủ **30 lộ trình** gồm **12 nhánh Koguma-VN**), `GET /api/guest/curricula/RM-3-4-koguma-year-01` và `RM-3-4-koguma-year-02` (`200`, đủ `36` tuần và `10` chủ đề Bộ GD&ĐT).
   - `/programs` (hiển thị đủ 100/100 thẻ `KGM-001`…`KGM-100` kèm deep-link `#week-N` chính xác), `/programs/RM-3-4-koguma-year-01#week-8` và `/programs/RM-3-4-koguma-year-02#week-8` (tự đánh dấu `Đang mở Tuần 8`, đủ `36` tuần, thanh cân bằng 5 trụ cột Kuno, thẻ *Jibutsu / Taiwa* và nút in phiếu gia đình Kuno).
   - `/play`, `/play/map` (hiển thị trọn **10/10 vùng đất chủ đề Mầm non Việt Nam** cho hồ sơ trẻ đang theo học), `/play/toybox`, `/play/toybox/mirror-blocks` (chế độ Gấp Giấy Dó đối xứng + góc Ba Mẹ Kuno), `/play/toybox/number-rods` (Khay hạt sen tách–gộp + góc Ba Mẹ Kuno), `/play/toybox/balance-scale` (quả quê Việt Nam + góc Ba Mẹ Kuno) và `/play/GL-C1-CMP-INTRO-0001` (Canvas 2D trực tiếp): đạt **`0` lỗi console, `0` lỗi SSR hydration, `0` ngoại lệ trang (`pageerror`) và `0` tràn ngang (`scrollWidth <= innerWidth`) trên cả 30 lượt kiểm khung hình × đường dẫn**, sau đó dừng gọn server tạm và dọn sạch script kiểm thử.
