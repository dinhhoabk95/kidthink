# Task #111 — Bề mặt script: bỏ bản sao, gọi bằng pnpm

## 1. Vì sao

Task #103 đã cắt 47 script gốc xuống 24 bằng cách chuyển cổng `lint:*` thành test vitest.
Phần còn lại của bề mặt vẫn phình ở chỗ khác. Đo ngày 2026-08-29: **72 mục `scripts`**
trong 21 file `package.json`, cộng **20 file `.ts`** nằm dưới các thư mục `scripts/`.

Ba loại thừa, đo được chứ không phải cảm giác:

1. **18 script `typecheck` giống hệt nhau, không ai gọi, và đỏ khi chạy.**
   15 package cộng 3 app đều khai `tsc --noEmit` (apps/web và apps/admin khai
   `node ../../packages/gates/scripts/typecheck-gate.ts --only <app>`).
   - Không cổng nào gọi chúng: `pnpm check` gọi `pnpm typecheck`, và lệnh đó chạy cổng
     bậc thang trên 10 project tsconfig — nó gọi thẳng binary `tsc`/`vue-tsc`, Cấm — NEVER
     đi qua script của workspace. `lefthook.yml` cũng không gọi.
   - Chúng phủ thêm **số không**: `include` của `tsconfig.json` gốc đã có
     `packages/*/src`, `packages/*/tests`, `packages/*/scripts`, `packages/*/vitest`.
     Project `root` của cổng bậc thang chính là lưới đó.
   - Chạy thử thì đỏ vì không có baseline: `packages/db` **970** lỗi,
     `packages/shared` **315**, `packages/gates` **15**, `packages/config` 0.
     Một script trông như cổng mà chưa ai chạy được là bề mặt lừa người đọc.
   - Rule ép chúng tồn tại (`REQUIRED_WORKSPACE_SCRIPTS` trong
     `packages/gates/src/lint-workspace-gate.ts`) **không có `BR-*` nào sở hữu**, trong
     khi `AGENTS.md` nói mỗi rule lint bắt buộc trỏ về một BR. Lý do ghi trong comment —
     "mọi workspace phải gọi được cổng bằng cùng một tên" — không còn đúng.

2. **Bốn biến thể `typecheck:<app>` ở gốc.** `typecheck:root`, `typecheck:worker`,
   `typecheck:web`, `typecheck:admin` chỉ là `--only <tên>`. `AGENTS.md` đã dạy dạng cờ
   (`pnpm typecheck --only web`) ngay trong cùng đoạn. Thêm `format` là tập con của
   `lint:fix` (`biome check --write .` đã bao `biome format --write .`).

3. **Công cụ bảo trì gọi bằng `node <đường dẫn dài>`.** Ba script trong
   `packages/gates/scripts/` không có lối vào pnpm nào, nên tài liệu phải viết
   `node packages/gates/scripts/....ts`. Một script nữa —
   `rewrite-import-paths.ts`, 8,3 KB — là codemod một lần của Task #105, đã đánh dấu
   xong, không file nào import.

## 2. Quyết định

- **Bỏ** 18 script `typecheck` cấp workspace. Chỗ duy nhất typecheck chạy là
  `pnpm typecheck`.
- **Bỏ** `typecheck:root|worker|web|admin` và `format` ở gốc. Giữ `typecheck:update` vì
  chính thông báo lỗi của cổng bảo người đọc chạy nó.
- **Giữ** `db:*`, `dev:*`, `test:watch`, `test:coverage`: chúng có hơn 120 tham chiếu
  trong tài liệu và mỗi cái là một lối vào thật, không phải bản sao của cái khác.
- **Bỏ** `packages/gates/scripts/rewrite-import-paths.ts`.
- **Thêm** ba lối vào pnpm cho công cụ bảo trì còn lại, để hết `node <đường dẫn dài>`:
  `progress`, `snapshot:imports`, `baseline:type-safety` trong `packages/gates`.
- **Nới** `lint:deps` sang `depcruise apps packages scripts` — `scripts/` trước đó không
  nằm trong bất kỳ lượt quét ranh giới nào.
- **Sửa** `REQUIRED_WORKSPACE_SCRIPTS` còn `["test"]`. Ca âm giữ nguyên: fixture `bad`
  thiếu `test` nên rule `missing-script` vẫn đỏ.

Kết quả: bỏ **23** mục (18 `typecheck` cấp workspace + 4 biến thể `typecheck:<app>` +
`format`), thêm **3** lối vào pnpm cho công cụ bảo trì, xoá **1** file script chết.
Còn **63** mục trên 19 file `package.json`, và mọi mục gọi được bằng `pnpm`.

## 3. Ranh giới

Cấm — NEVER đụng `packages/gates/scripts/typecheck-gate.ts`: nó là cổng bậc thang giữ
2.965 lỗi nợ, không thay được bằng `tsc -b`.
Cấm — NEVER đụng `packages/config/scripts/validate-env-file.ts`: kịch bản phát hành chép
nó theo đúng đường dẫn và chạy trước `pnpm install`.
Cấm — NEVER sinh lại `packages/gates/src/import-graph-snapshot.json`: nó đã lệch 62 mục
đổi và 361 mục mới **trước** task này do việc đang dở của người khác trong cây làm việc;
không test nào đọc nó, nên bốn dòng chết của codemod vừa xoá là vô hại. Sinh lại là nuốt
việc dở của người khác vào thay đổi này.

## 4. Việc

| # | Việc | File |
| - | ---- | ---- |
| T1 | Bỏ 18 script `typecheck` cấp workspace | `apps/*/package.json`, `packages/*/package.json` |
| T2 | Nới rule `missing-script` còn `test` | `packages/gates/src/lint-workspace-gate.ts` |
| T3 | Gọn `package.json` gốc, nới `lint:deps` | `package.json` |
| T4 | Xoá codemod chết, thêm ba lối vào pnpm | `packages/gates/` |
| T5 | Cập nhật tài liệu | `AGENTS.md`, `docs/SPEC.md`, `docs/specs/08-quality/type-safety.md` |
