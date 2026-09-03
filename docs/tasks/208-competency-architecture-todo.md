# Task #208 — Danh sách việc: tái kiến trúc `packages/db` quanh trục năng lực

Kế hoạch: [`208-competency-architecture-plan.md`](208-competency-architecture-plan.md)

Quy ước: mỗi mục có **nghiệm thu đo được**. Cấm — NEVER tick khi mới "code xong".

Từ điển thuật ngữ ở mục 0 của kế hoạch. Tài liệu này dùng từ thường:
*nạp dữ liệu nền* (seed) · *phép kiểm tra* (gate) · *test chứng minh bắt lỗi* (negative case) ·
*bộ dựng màn chơi* (projection) · *khuôn trò chơi* (template) · *nhóm kỹ năng* (strand).

---

## G1 — Dọn nợ và chặn rò rỉ

Không đổi hành vi. Chỉ **gỡ**, chưa **dời** file nào.

- [x] Chụp bản đối chiếu trước khi động vào gì: danh sách `trạng-thái | tên-test` của
      `pnpm --filter @mindkid/db test`, ghi ra ngoài repo
- [x] Xoá `@mindkid/emoji` khỏi `packages/db/package.json` — đã đo 0 lần dùng trong toàn package
- [x] Xoá cây rỗng `packages/db/packages/db/tests/gates/fixtures/tmp`
  - Đã kiểm: **không có lỗi code nào để sửa.** `tests/gates/level-generator-kit.test.ts:19,106`
    dùng `path.resolve(import.meta.dirname, "fixtures/tmp")` — đúng. `repoPath()`
    (`packages/config/src/repo-paths.ts:11`) lên 3 cấp từ `packages/config/src` — đúng. Cây rác
    không được git theo dõi, 0 byte, ngày 2026-08-30: rác từ một lệnh chạy tay, không phải từ code
  - Nghiệm thu: `find packages/db/packages` trả rỗng; chạy lại `level-generator-kit.test.ts`
    không dựng lại nó
- [x] Sửa `src/seed-content/cli/cell-generator.ts:8` — `../../../scripts/check-matrix-budget.js`
      sang bí danh `#scripts/check-matrix-budget` (`BR-MPA-08` cấm đường dẫn vượt cấp xuyên cây)
- [x] Chặn rò rỉ nội dung vào bản build: bỏ `export * from "./seed.ts"` và 4 dòng nội dung khỏi
      `src/index.ts`; mở lối vào `"./seed"` trong `package.json`; sửa
      `apps/web/tests/unit/server/tagging-seed.test.ts` sang lối vào mới
  - Nghiệm thu: script đếm module đạt được từ `@mindkid/db` — trước ≈44.000 dòng nội dung, sau **0**
- [x] Nối 4 bộ sinh file ngưỡng vào `packages/db/package.json`: `gen-level-allocation` ·
      `gen-skill-affinity` · `generate-skill-datasets` · `gen-pedagogy-45`
  - Nghiệm thu: chạy `gen-level-allocation` và `gen-skill-affinity`, `diff` với file trong repo ⟹ rỗng
- [x] Xoá 8 bộ chuyển đổi chạy-một-lần đã xong: `apply-reauthored-levels` ·
      `fix-phantom-skill-targets` · `remap-phantom-skills` · `migrate-seed-contracts` ·
      `run-seed-migration` · `restore-montessori-refs` · `standardize-pedagogy` · `count-mfa-rows`
  - Trước khi xoá: gỡ tên chúng khỏi danh sách cho phép ở `tests/gates/taxonomy-refs.ts:36` và
    khỏi lời chú thích ở `src/seed-content/reauthored/builders.ts:6`
- [x] Nối `check-skill-registry` vào đường nạp dữ liệu — nó hiện thực `BR-SDS-07` nhưng chỉ chạy
      trong `tests/gates/eight-gates.test.ts`
  - Nghiệm thu: **test chứng minh bắt lỗi** — thêm một file kỹ năng không đăng ký ⟹ `db:seed` đỏ
- [x] Ghi 2 service chỉ có test gọi (`content-versioning` 317 dòng · `telemetry-retention` 34 dòng)
      vào sổ nợ có tên trong kế hoạch. Cấm — NEVER xoá: `content-versioning` hiện thực spec đã chốt

**Điểm dừng G1**

- [x] `pnpm lint` · `pnpm lint:deps` · `pnpm typecheck` · `pnpm test` thoát 0
- [x] Danh sách `trạng-thái | tên-test` **trùng khít** bản chụp đầu mục. Test nào đổi trạng thái,
      kể cả hỏng→đạt, đều là dấu hiệu hành vi đã đổi — dừng và tìm hiểu
- [x] Người xem lại xác nhận chưa file nào bị **dời**

---

## G2 — Sửa spec và luật ranh giới *(chạy song song G1)*

- [x] `monorepo-package-architecture.md` §7.1 — thêm 5 dòng: `content` · `content-build` ·
      `audit` · `play` · `export`
- [x] `SPEC.md` §8.1 — thêm 5 hàng ranh giới; hàng `packages/db/` bỏ chữ "seed" và bỏ vai nghiệp vụ
- [x] `content-seed-authoring.md` và `skill-dataset-model.md` — đổi đường dẫn
      `packages/db/src/seed-content/…` sang `packages/content/src/…`
- [x] `taxonomy-service.md` — ghi quyết định `Q2`: TypeScript là nguồn sự thật cho danh tính kỹ
      năng, Markdown sinh ra từ đó
- [x] `business-rules.md` — đăng ký prefix mới nếu phát sinh rule
- [x] `.dependency-cruiser.cjs` — thêm 4 luật ranh giới ở mục 4.4 của kế hoạch; mở rộng mẫu
      `^packages/(db|storage)/` ở dòng 79 cho 5 package mới

**Điểm dừng G2**

- [x] Tìm chuỗi `packages/db/src/seed-content` trong `docs/` trả rỗng
- [x] **Test chứng minh bắt lỗi cho từng luật ranh giới**: dựng tạm một import vi phạm, đòi
      `pnpm lint:deps` báo đỏ. Luật không có test chứng minh là luật sẽ trôi

---

## G3 — Chuyển danh tính kỹ năng sang TypeScript

- [x] Khai kiểu đầy đủ cho danh tính một kỹ năng: mã · nhóm kỹ năng · năng lực · tên · tuổi ·
      độ khó · quá trình tư duy · mục tiêu học tập · điều kiện tiên quyết
  - Nghiệm thu: không `any`, không `unknown` mới (`type-safety.md`)
- [x] Bộ chuyển đổi đọc `docs/taxonomy/c1..c6.md`, ghi phần danh tính vào **đúng file kỹ năng
      đang có** ở `skills/c<n>/<nhóm>/<KỸ-NĂNG>.ts`
- [x] Lệnh sinh ngược `docs/taxonomy/*.md` từ TypeScript — chỉ ghi vào vùng đánh dấu, giữ nguyên
      phần văn xuôi (giải thích phạm vi C4, ghi chú sư phạm)
- [x] Gỡ code phân tích Markdown khỏi đường nạp dữ liệu
- [x] Phép kiểm tra chống lệch giữa Markdown và TypeScript

**Điểm dừng G3**

- [x] So **từng trường của từng kỹ năng**: trùng khít **408/408**. Lệch một dòng thì dừng và in ra
- [x] Sinh ngược Markdown cho ra **byte giống hệt** file trong repo
- [x] **Test chứng minh bắt lỗi**: sửa tay một ô trong bảng Markdown ⟹ phép kiểm tra đỏ

---

## G4 — Dựng `packages/content`

- [ ] Chuyển hàm chuẩn hoá mã thẻ từ `services/tagging.ts` sang `@mindkid/taxonomy`;
      `services/tagging.ts` xuất lại để 261 chỗ gọi ở `apps/*` không phải sửa
- [ ] Tạo package — phụ thuộc **chỉ** `shared` · `taxonomy` · `game-engine`
- [ ] Chuyển 408 file kỹ năng và 33 bộ dựng màn chơi. Trên 500 dòng ⟹ **viết bộ chuyển đổi tự
      động, Cấm — NEVER sửa tay**
- [ ] Đổi `projections/` thành `builders/`; danh mục viết cứng thành danh mục sinh từ thư mục
- [ ] Viết `buildLevelsForSkill(skill)` — gọi bộ dựng của khuôn tương ứng cho từng dòng `levels[]`.
      Không khớp hợp đồng của khuôn thì **ném lỗi và dừng**, Cấm — NEVER thử lại
- [ ] Tách `activities/pedagogy-activities-45.ts` (4.529 dòng) và `digital-game-activities.ts`
      (1.964) theo năng lực thành `activities/c1..c6.ts`
- [ ] Gom 15 file `lessons/batch-NN.ts` thành `lessons/c1..c6.ts`
- [ ] Test đi cùng code trong cùng giai đoạn

**Điểm dừng G4**

- [ ] `packages/content` có **0 import** drizzle, `node:*`, `@mindkid/db` — `pnpm lint:deps` xác nhận
- [ ] **Test chứng minh bắt lỗi**: bộ dữ liệu 2 vật dựng cho khuôn đòi ≥4 vật ⟹ ném lỗi, **0** màn
      chơi sinh ra
- [ ] Cùng hạt ngẫu nhiên ⟹ **byte giống hệt** giữa hai lần chạy
- [ ] Số hoạt động và số giáo án trước/sau **bằng nhau**; mã của chúng không đổi

---

## G5 — Dựng `packages/content-build`

- [ ] Chuyển 20 phép kiểm tra, 10 lệnh chạy tay, `seed-master/`, hàm ghi nội dung vào database,
      và 9 file ngưỡng JSON
- [ ] Mọi phép kiểm tra lấy gốc repo từ `repoPath()`. Cấm — NEVER đọc `process.cwd()`: vitest chạy
      với thư mục làm việc là thư mục workspace
- [ ] Mỗi phép kiểm tra giữ đủ hai phần: quét nguồn thật + test chứng minh bắt lỗi.
      Dữ liệu vi phạm đặt trong `tests/**/fixtures/`, Cấm — NEVER viết thẳng vào file test
- [ ] Đưa ngưỡng số lượng từ lời chú thích `gates/skill-quota.ts:7,9` vào `thresholds/quota.json`
- [ ] `packages/db/src/seed.ts` chỉ còn nạp dữ liệu nền phi nội dung: gói cước · quyền lợi ·
      tài khoản · bản ghi đồng ý

**Điểm dừng G5**

- [ ] Chạy **từng** phép kiểm tra, so **từng con số** với bản chạy trước khi chuyển ⟹ trùng khít.
      So mã thoát là không đủ — phép kiểm tra trỏ sai đường dẫn vẫn thoát 0 và báo "đạt"
- [ ] Database rỗng → `pnpm db:migrate && pnpm db:seed` thoát 0; chạy lần hai **không đổi số hàng**
- [ ] Nạp dữ liệu chạy đủ 10 phép kiểm tra. **Test chứng minh bắt lỗi**: dựng một màn chơi vi phạm
      rồi chạy `db:seed` ⟹ mã thoát khác 0 và **0 hàng được ghi**

---

## G6 — Tách logic nghiệp vụ

Thứ tự bắt buộc: `audit` trước (9 service khác phụ thuộc nó), rồi `play` và `export`.

- [ ] `@mindkid/audit` — `services/audit.ts`. Dùng bởi web + worker + 9 service khác
- [ ] `@mindkid/play` — `services/play-session.ts` (1.456 dòng). Dùng bởi web + worker
- [ ] `@mindkid/export` — `pdf-export` + `pdf-renderer` + `worksheet-renderer`. Dùng bởi web + worker
- [ ] `notification-dispatch` → `packages/notification` **đã có sẵn**
- [ ] 20 file chỉ web dùng → `apps/web/server/services/`
- [ ] `payment-jobs` · `rollup` (chỉ worker dùng) → `apps/worker/src/services/`
- [ ] Thay danh sách 79 bảng viết cứng ở `tests/global-setup.ts:35-116` bằng đọc từ `schema/`
      lúc chạy — việc này đóng luôn lỗi thiếu `skill_datasets` và `content_objective_map`
- [ ] Thay 22 đường dẫn schema viết tay ở `src/index.ts:9-24` bằng danh mục sinh có kiểm tra

**Điểm dừng G6**

- [ ] Script so danh sách tên xuất ra trước/sau: **không tên nào trong 138 tên biến mất**, chỉ đổi
      đường nhập
- [ ] Danh sách bảng cần xoá suy ra lúc chạy có đủ **82** bảng. **Test chứng minh bắt lỗi**: thêm
      một bảng giả vào `schema/` ⟹ nó xuất hiện trong danh sách
- [ ] `pnpm lint:deps` xác nhận không có vòng phụ thuộc
- [ ] `packages/db/src` còn khoảng 5.000 dòng (từ 133.277)

---

## G7 — Nối đường sinh màn chơi theo kỹ năng

- [ ] **Chụp bản lưu trước**: xuất kho màn chơi sinh máy (71 file, 8,5 MB) và danh sách mã màn
      chơi đã phát hành ra **ngoài repo**; ghi đường dẫn bản lưu vào PR
- [ ] Bộ chuyển đổi đọc từng màn chơi cũ trong `c1..c6/` · `backfill/` ·
      `pedagogy-missing-skills.ts` · `reauthored/`; tra kỹ năng; ghi một dòng
      `{ khuôn, nhóm tuổi, bậc khó, chủ đề, số vòng }` vào đúng file kỹ năng
  - Màn chơi không tra được về kỹ năng nào ⟹ **dừng và in danh sách**. Cấm — NEVER đoán
- [ ] `montessori_ref` và `legacy_v1_ref` giữ nguyên **trong dữ liệu**, Cấm — NEVER chuyển thành
      lời chú thích: đã có lần một bộ chuyển đổi xoá sạch chú thích và con số tụt từ 24 xuống 14
- [ ] Sinh lại toàn bộ màn chơi qua `buildLevelsForSkill`, nạp vào database sạch
- [ ] Xoá `corpus/*.json` (71 file) và `cli/gen-corpus.ts`

**Điểm dừng G7 — cổng chặn của cả task**

- [ ] So danh sách mã màn chơi trước và sau ⟹ **rỗng** (`BR-SDS-14`: mã đã phát hành không được đổi)
- [ ] Phép kiểm tra *nguồn vật* xanh: mọi vật trong màn chơi truy được về vốn liệu của chính kỹ
      năng đó. **Test chứng minh bắt lỗi**: một màn chơi lấy vật từ vốn từ chủ đề ⟹ đỏ
- [ ] Phép kiểm tra *khái niệm hiện ra* xanh: kỹ năng có ký tự thì mọi màn chơi hiển thị ký tự đó.
      **Test chứng minh bắt lỗi**: một màn chơi `C5.ALP` chỉ có emoji người ⟹ đỏ
- [ ] **Người mở một màn chơi của `C5.ALP.01` trên máy thật và thấy chữ cái trên màn hình.**
      Chụp màn hình vào PR
- [ ] `pnpm lint` · `pnpm lint:deps` · `pnpm typecheck` · `pnpm test` thoát 0
