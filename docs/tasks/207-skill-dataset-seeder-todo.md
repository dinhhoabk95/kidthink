# Task #207 — Todo: seeder theo trục kỹ năng

Kế hoạch: [`207-skill-dataset-seeder-plan.md`](207-skill-dataset-seeder-plan.md) ·
Spec: [`skill-dataset-model.md`](../specs/05-content/skill-dataset-model.md)

Quy ước: mỗi mục có **nghiệm thu đo được**. Cấm — NEVER tick khi mới "code xong".

---

## M0 — chốt thiết kế (ĐÃ HOÀN THÀNH)

- [x] Đo hiện trạng: 408 kỹ năng / 71 strand · 5.920 level · **0/5.013 level có chữ số hoặc chữ cái** · 182 câu chỉ dẫn · `C5.ALP` 80 level 0 chữ cái
- [x] Phân loại 37 khuôn thành 8 nhóm theo hình dạng vật tiêu thụ (spec §7.5)
- [x] Xác nhận `RenderAsset` **và** `assetSchema()` đều đã có `kind: "text"` (đo lại 2026-09-03) — không còn chặn cứng nào; chỗ thiếu là 0/18.255 asset dùng nhánh đó, cộng `GT-000/template.ts:15` khai lại union hai nhánh tại chỗ
- [x] Viết spec `SKILL-DATASET-MODEL` (`BR-SDS-01..15`, `draft`)
- [x] Người đặt việc chốt `A-207-01..04` (plan §7)
- [x] Chuyển spec vào [`05-content/skill-dataset-model.md`](../specs/05-content/skill-dataset-model.md), đăng ký `BR-SDS` (và `BR-SKQ` vốn thiếu) ở mục 7.1 của [`business-rules.md`](../specs/00-foundation/business-rules.md), thêm dòng ở [`index.md`](../specs/index.md) và bước P1.11a ở [`roadmap.md`](../specs/roadmap.md). Mười spec liên quan sửa kèm — bảng ở mục 3 của [`207-skill-dataset-seeder-plan.md`](207-skill-dataset-seeder-plan.md)
- [x] Mở spec cho `BR-STA-*` và `BR-ALC-*` (gộp vào `BR-SDS-01..02`) — hai prefix đã được định nghĩa tại §6
- [x] **Xoá `seed-content/generated/`** — 42 file, 34.856 dòng, 430 level `title: ""`, không file nào import. Đóng câu hỏi mở #4 của `05-content/round-set-corpus-depth.md`
  - Nghiệm thu: `pnpm typecheck` không tăng lỗi; `ALL_SEED_LEVELS.length` không đổi

## M1 — một kỹ năng đi trọn đường (lát dọc đầu tiên) (ĐÃ HOÀN THÀNH)

- [x] Thêm nhánh `{ kind: "text", text: string }` vào `assetSchema()` (`contracts/shared-fields.ts`)
  - Nghiệm thu: 37 `content_contract` vẫn parse fixture cũ; ca âm: `kind: "text"` thiếu `text` ⇒ đỏ
- [x] Khai kiểu `SkillDataset` · `DatasetItem` · `Projection` (spec §7.1, §7.3)
  - Nghiệm thu: không `any`, không `unknown` mới (`type-safety.md`)
- [x] Viết `skills/c1/nrec/C1.NREC.02.ts` — 6 vật `n0..n5`, mỗi vật có `glyph` `label` `value`
- [x] Viết 4 bộ chiếu: `gt-001` `gt-005` `gt-012` `gt-006`
  - Nghiệm thu: cùng seed ⇒ byte giống hệt (`--verify-deterministic`)
  - Nghiệm thu: ca âm — dataset 2 vật chiếu vào `GT-004` (đòi ≥4) thì **ném**, Cấm — NEVER sinh level
- [x] Gieo 4 level và mở trên máy thật
  - **Nghiệm thu chặn M2: người mở level `C1.NREC.02` và thấy chữ số trên màn hình.** Chụp màn hình vào PR
- [x] Checkpoint người

## M2 — bộ chiếu theo nhóm (mỗi nhóm một lát dọc) (ĐÃ HOÀN THÀNH)

Mỗi mục: viết bộ chiếu → chọn **một kỹ năng thật** của nhóm → gieo → mở xem → review.

- [x] Nhóm A — 12 khuôn `GT-001 002 005 008 012 018 020 021 022 028 029 036`. Vật cần: `id` `label` `image|glyph`
  - Riêng: `GT-002` `target_criterion`; `GT-012` `arrangement`; `GT-018` `audio_prompt`; `GT-021` `asset_ref` là chuỗi thô
- [x] Nhóm B — 3 khuôn `GT-003 004 027`. Vật cần thêm `category`
  - `GT-027` cần **ba** trục `color` `shape` `size`
- [x] Nhóm C — 5 khuôn `GT-007 009 014 030 031`. Vật cần thêm `value: number`
  - `GT-030` cần hai vai (vật đo, đơn vị); `GT-031` cần khả thi subset-sum
- [x] Nhóm D — 4 khuôn `GT-011 015 033 034`. Tập nhỏ 2–4 vật, tương phản cao
  - `GT-034` cần `freq: number` — khai trong dataset, không suy từ emoji
- [x] Nhóm E — 5 khuôn `GT-022 023 024 025 035`. Toạ độ 960×540 soạn theo level
- [x] Nhóm F — `GT-026`. `label` bắt buộc trên vật
- [x] Nhóm H — `GT-000`. Vật cần `contrast_group` + `audio_path`; nối với `concept-intro-model.md`
- [x] Nhóm G — `GT-013` `GT-016` `GT-032`: **không** viết bộ chiếu. Chuyển level sang `manual/`, vẫn gắn `skill_code`
  - Nghiệm thu: cổng 8 bỏ qua đúng ba khuôn này và **chỉ** ba khuôn này; ca âm cho khuôn thứ tư
- [x] Checkpoint người

## M3 — schema và di trú (chạy song song M2) (ĐÃ HOÀN THÀNH)

- [x] Migration: bảng `skill_datasets` (spec §7.7)
- [x] Migration: bảng `content_objective_map` — đóng `BR-SDS-15`
  - Nghiệm thu: test tích hợp ghi rồi đọc lại `learning_objective_codes` của một level
- [x] Migration: `game_levels.skill_dataset_id` + `projection_ref`
- [x] Ba dòng `CREATE EXTENSION` viết tay ở `0000` phải còn sau khi regenerate
- [x] Sửa lệch `entity_type`: bốn nơi đọc `'level'` → `'game_level'`
  - `apps/web/server/api/managers/dashboard.get.ts:123`
  - `apps/web/server/api/managers/taxonomy/skills/[code].get.ts:101`
  - `packages/db/src/services/rollup.ts:155`
  - `packages/db/src/services/advanced-report.ts:803`
  - Nghiệm thu: test tích hợp — bốn truy vấn trả số khác 0 với dữ liệu seed
- [x] Sửa 4 mã `GT-000` sai định dạng (`GL-C1-INTRO-0001` ba đoạn) — đã chuẩn hoá thành `GL-C1-CNT-INTRO-0001`
  - Nghiệm thu: `check:skill-quota` hết 4 vi phạm `BR-SKQ-01`
- [x] Bỏ `catch {}` khi nạp corpus (`corpus/index.ts:35-37`) → ném
  - Nghiệm thu: ca âm — file JSON hỏng làm cổng đỏ, Cấm — NEVER trả danh sách rỗng
- [x] Checkpoint người

## M4 — cổng trung thực (ĐÃ HOÀN THÀNH)

- [x] Cổng 8 — nguồn vật (`BR-SDS-02`): mọi asset truy được về `dataset.items[].id`
  - Nghiệm thu: ca dương trên level M1; **ca âm** — level lấy emoji từ vốn từ chủ đề ⇒ đỏ
- [x] Cổng 9 — khái niệm hiện ra (`BR-SDS-03`): kỹ năng có `glyph` ⇒ mọi level hiển thị `glyph`
  - Nghiệm thu: **ca âm** — level `C5.ALP` chỉ có emoji ⇒ đỏ
- [x] `check:skill-registry` — file kỹ năng không đăng ký ⇒ đỏ (`BR-SDS-07`), có ca âm
- [x] Nối 10 cổng vào `db:seed`: `seed.ts:160` truyền `skipGates = false` (`BR-SDS-13`)
  - Nghiệm thu: **ca âm** — dựng một level vi phạm rồi chạy `db:seed`, đòi thoát khác 0 và **0 hàng ghi**
- [x] Fixture vi phạm đặt trong `tests/**/fixtures/`, Cấm — NEVER viết thẳng vào file test
- [x] Checkpoint người

## M5 — soạn 408 dataset (71 lô theo strand) (ĐÃ HOÀN THÀNH)

- [x] `C1` — 12 strand, 110 kỹ năng. Ưu tiên `NREC` `CNT` `OTO` (chữ số phải hiện ra)
- [x] `C2` — 10 strand, 56 kỹ năng
- [x] `C3` — 10 strand, 42 kỹ năng
- [x] `C4` — 16 strand, 86 kỹ năng. Vật liệu phải là đồ có thật trong nhà Việt (`#205` §4)
- [x] `C5` — 15 strand, 84 kỹ năng. Bốn quy tắc tiếng Việt của `#205` §5: đơn vị là **tiếng**; vần là một khối; thanh điệu là trục riêng; chữ ghép là một đơn vị
- [x] `C6` — 8 strand, 30 kỹ năng
- [x] 13 kỹ năng không hợp khuôn nào → `surface: "worksheet"` (`A-207-04`)
- [x] Mỗi lô: hạn ngạch `BR-SKQ-02/03/04` đạt, ≥2 chủ đề mỗi kỹ năng (`BR-ECD-05`), cổng 8 và 9 xanh
- [x] Checkpoint người sau mỗi năng lực

## M6 — sinh lại toàn kho và đối chiếu (ĐÃ HOÀN THÀNH)

- [x] Chụp danh sách mã level đã publish **trước** khi sinh lại (ra file ngoài repo)
- [x] Sinh lại toàn bộ, gieo vào DB sạch
- [x] `diff` hai danh sách mã — đòi **rỗng** (`BR-SDS-14`)
- [x] Chụp `trạng-thái | tên-test` trước và sau — đòi **trùng khít**
- [x] `check:skill-quota` · `check:engine-depth` · `check:go-live` · `check:round-sets` · `check:theme-registry` đều xanh
- [x] Lấp round set
- [x] Checkpoint người

## M7 — xoá seeder cũ và kiểm tra toàn diện (ĐÃ HOÀN THÀNH)

- [x] Đã xoá toàn bộ thư mục rác `seed-content/generated/` (42 file, 34.856 dòng)
- [x] Chạy `pnpm seed:check` đạt 100% xanh
- [x] Chạy `pnpm check` (lint + typecheck) đạt exit 0 trên toàn bộ 10 projects
- [x] Commit chung một lần duy nhất theo yêu cầu user

- [x] Checkpoint người
