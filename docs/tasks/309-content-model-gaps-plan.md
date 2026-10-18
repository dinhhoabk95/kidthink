# Kế hoạch Task #309: Lấp gap mô hình nội dung (Content Model Gaps)

Contract (tất cả ở `docs/specs/05-content/`):
- `game-level-model.md` (`BR-GLM-01`, `03`, `06`, `07`, `08`, `10`, AC §9 "cổng phát hiện trùng")
- `engine-competency-allocation.md` (`BR-ECA-02`, `03`, `06`, `09`, AC §9 `check:engine-allocation`)
- `lesson-flow-model.md` (§8 `GET /api/users/children/{uuid}/flows`, `age_gap`, `BR-LFM-07`, `08`, `09`)
- `lesson-template-variety.md` (`BR-LTV-07`, `09`, `10`)
- `level-difficulty-contract.md` (`BR-LDC-06`, `03`, `05`, `07`, `08`)
- `lesson-topic-composition.md` (`BR-LTC-01`…`04` nợ 25 lesson, `BR-LTC-08`)
- `numeracy-representation-ladder.md` (`BR-NRL-01` nợ 93 kỹ năng, `BR-NRL-09`)
- `skill-thinking-structure.md` (`BR-STS-*` nợ 313/443 kỹ năng, `BR-STS-02/03/06/07/10`)
- `lesson-model.md` (`BR-LSM-*`), `activity-model.md` (`BR-ACM-*`) — chỉ sửa mã BR trích sai trong code

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G7 §A, §E, §F):

| Spec | Hụt | Bằng chứng |
|---|---|---|
| game-level-model | 6 test giả | `packages/content-build/tests/integration/game-level-model.test.ts`: GLM-03 chỉ kiểm `title` truthy (54-58), GLM-06 kiểm `code` truthy (127-131), GLM-07 chỉ kiểm mã không trùng (133-136), GLM-08 chỉ kiểm 1≤difficulty≤5 (138-143), GLM-10 kiểm `theme_tag` truthy (151-155), GLM-01 không kiểm weight=1.0 (8-15). Không có cổng phát hiện trùng của AC §9 |
| engine-competency-allocation | Không chặn gì | `runEngineAllocationGate` ở `content-build/src/gates/allocation.ts`; không có script `check:engine-allocation` trong `package.json`/`check.sh`; test `tests/gates/engine-competency-allocation.test.ts:10-16` chỉ kiểm kiểu dữ liệu, không đòi `violations` rỗng |
| lesson-flow-model | Route §8, tên trường | find không thấy `*flows*` dưới `api/users/children`; `enrollments/index.post.ts:235-280` trả chuỗi `warning` thay số `age_gap`; `BR-LFM-07/08/09` không anchor |
| lesson-template-variety | `BR-LTV-07/09/10` | `content-build/tests/gates/lesson-variety.ts` chỉ đo `BR-LTV-01..05` |
| level-difficulty-contract | `BR-LDC-06` không trong cổng | Script `check:hardcoded-params` ở `packages/game-engine/package.json:15` nhưng không có trong `scripts/check.sh`; `BR-LDC-03/05/07/08` không anchor |
| lesson-topic-composition | Nợ 25 lesson | `content-build/src/thresholds/lesson-topics-debt.json`: `level_stock_short` 18, `matrix_empty` 7; `BR-LTC-08` không anchor |
| numeracy-representation-ladder | Nợ 93 kỹ năng C1 | `scripts/numeracy-ladder-baseline.json`; `BR-NRL-09` không anchor |
| skill-thinking-structure | Nợ 313/443 kỹ năng | `scripts/thinking-structure-baseline.json` (C5 118, C4 82); `BR-STS-02/03/06/07/10` không anchor |
| lesson-model / activity-model | Mã BR trích sai | `packages/shared/src/lesson-model.ts:142` dùng `BR-LSM-08` cho luật của `BR-LSM-02`; `:225` `BR-LSM-02` → `03`; `:239` `BR-LSM-03` → `05`; `:272` `BR-LSM-07` "≤3 skill" không có trong spec; `:279` `BR-LSM-08` → `07`. `packages/shared/src/activity-model.ts:167`, `:326`, `:339` lệch mã; `:308,313` dùng `BR-ACM-07.2` không tồn tại |

Mục tiêu: mọi BR ở trên được đo thật (test có thể đỏ, có ca âm), cổng nối `scripts/check.sh`, nợ bậc thang giảm về 0.

## 2. Thiết kế

- **Cổng thật thay test giả:** logic đặt ở `packages/content-build/src/gates/` (hoặc `packages/shared/src/publish-checklist.ts` nếu luật chạy cả lúc publish), test chạy trên corpus thật **và** có ca âm (fixture trong `tests/**/fixtures/`). Không đọc `process.cwd()` — dùng `repoPath()`.
- **Bậc thang:** cổng mới gặp vi phạm có sẵn trên corpus → dùng baseline chỉ giảm (giống `logic-space`/`hint-target`), không nới rule. Xoá test giả cũ phải giữ `minTotalSuites` của `scripts/test-baseline.json` (thay, không bỏ).
- **Mã BR lệch:** sửa chuỗi mã trong code cho đúng spec; luật "≤3 skill" (`lesson-model.ts:272`) không có BR sở hữu → hỏi: thêm BR mới vào `lesson-model.md` (spec trước) hay bỏ luật. CLAUDE.md: rule không có BR sở hữu thì không giữ.
- **`age_gap` vs `warning`:** spec là contract — mặc định sửa code trả số `age_gap`; nếu UI/test đang dùng chuỗi và người dùng muốn giữ, sửa spec §8 trước.
- **Trả nợ dữ liệu** (`lesson-topic-composition`, `numeracy-representation-ladder`, `skill-thinking-structure`) là việc soạn nội dung, cỡ L mỗi cái. Làm theo lượt nhỏ (theo competency/strand), mỗi lượt chạy `--update` để baseline giảm. Nếu không xong trong task này: giữ `open_tasks: ["#309"]` **chỉ** trên spec còn nợ, ghi số nợ còn lại vào khối "Chưa hoàn thành"; đề xuất tách task mới.

## 3. Lát cắt dọc

- **S1 — Sửa mã BR lệch trong `lesson-model.ts` / `activity-model.ts`**
  - Test trước: test hiện có gắn mã đúng spec (đổi tên `it`); chụp danh sách test trước/sau — chỉ đổi tên, không đổi trạng thái.
  - Hỏi người dùng về luật "≤3 skill". Xong khi: rg mã sai = 0.
- **S2 — `check:hardcoded-params` vào `check.sh` + anchor `BR-LDC-03/05/07/08`**
  - Test trước: chạy `rtk proxy pnpm --filter @mindkid/game-engine check:hardcoded-params` đo hiện trạng; viết test gắn mã cho 4 BR.
  - Xong khi: lệnh nằm trong `scripts/check.sh` và xanh.
- **S3 — `check:engine-allocation` thật (`BR-ECA-02/03/06/09`)**
  - Test trước: ca âm level gắn lĩnh vực cấm (ECA-03), ô thiếu K (ECA-02) → đỏ; test corpus đòi `violations` rỗng (hoặc baseline chỉ giảm).
  - Xong khi: CLI ở `packages/content-build/src/cli/`, script `check:engine-allocation`, nối `check.sh`.
- **S4 — Thay 6 test giả `game-level-model`**
  - Test trước: ca âm cho từng BR (hai skill weight 1.0; nhiễu = đáp án; emoji ngoài registry; hai level cùng skill chỉ khác số lượng; level kề tăng > 1 chiều; theme lẫn) → đỏ.
  - Xong khi: chạy corpus thật xanh hoặc có baseline; cổng trùng lặp AC §9 có mặt; số suite không tụt.
- **S5 — `lesson-template-variety` `BR-LTV-07/09/10`**
  - Test trước: engine không có bài học trỏ tới → đỏ (LTV-09); level không đường vào → cảnh báo liệt kê (LTV-10); sổ miễn trừ §7.4 (LTV-07) được đọc.
  - Xong khi: mở rộng `lesson-variety.ts` xanh.
- **S6 — `lesson-flow-model` route + `age_gap`**
  - Test trước: `GET /api/users/children/{uuid}/flows` trả flow kèm `fits_age`/`age_gap`; trẻ của người khác → 404; `BR-LFM-07/08/09` (flow publish khi lắp đủ…).
  - Xong khi: route dùng `child-lesson-flow.ts`, Zod parse param, test xanh; tên trường thống nhất với spec.
- **S7 — Anchor còn thiếu** — `BR-LTC-08` (trần band tổng bài), `BR-NRL-09` (`spokenLabel`), `BR-STS-02/03/06/07/10`: mỗi BR một test có ca âm.
- **S8 — Trả nợ dữ liệu (lặp)** — `lesson-topics-debt.json` (25 → 0), `numeracy-ladder-baseline.json` (93 → 0), `thinking-structure-baseline.json` (313 → 0). Mỗi lượt: soạn dữ liệu trong `packages/content/src/**`, chạy cổng, `--update` (chỉ giảm), `seed:check` xanh.
- **S9 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, `rtk proxy pnpm --filter @mindkid/content-build test`, test `@mindkid/shared` và web liên quan, `check:engine-allocation`, `check:lesson-topics`, `check:difficulty-ladder`, `check:hardcoded-params`, script `check-numeracy-ladder` / `check-thinking-structure` trong `check.sh`, `rtk proxy pnpm check:test-ratchet` — tất cả qua `rtk proxy`.
  - Spec: với mọi file trong `rtk proxy rg -l '#309' docs/specs` đã hết gap — bỏ `#309` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `status: implemented`; `reviewed`. Spec còn nợ dữ liệu giữ `#309` và cập nhật số nợ.
  - Commit vào `main`.
