# Task #108 — Hợp nhất cổng lint / typecheck / test về một convention

## 1. Vì sao

Yêu cầu: mọi dòng code trong `apps/*` và `packages/*` đi qua **cùng một** convention
định dạng, lint, kiểu và test, lấy từ `@mindkid/config`; và cổng phải chạy tới khi sạch.

Đo ngày 2026-08-28 trước khi sửa, chạy từng cổng riêng lẻ (không qua `&&`):

| Cổng | Exit | Sự thật |
|---|---|---|
| `pnpm lint` (`biome check .`) | 0 | 1.361 file, sạch |
| `pnpm lint:deps` | 0 | 1.576 module, sạch — nhưng một rule không bao giờ khớp, xem mục 3 |
| `pnpm typecheck` | 2 | 1.164 lỗi, chỉ phủ 1 trong 10 project |
| `pnpm test` | 1 | 58 test đỏ / 2.941, 23 file đỏ / 340. Chạy hết **1.587 giây** |

Ba vấn đề tách bạch:

1. **Cổng `pnpm check` đã bị thu hẹp cho tới khi không còn chặn thứ nó nói là chặn.**
2. **Cỗ máy cổng typecheck đã viết xong nhưng chưa được nối vào.**
3. **Convention của workspace chỉ tồn tại trong comment, không có gì đo nó.**

## 2. `pnpm check` thu hẹp qua hai commit

| Commit | `check` sau commit |
|---|---|
| trước `bc4156b` | `lint && lint:deps && typecheck (root + recursive) && typecheck:web:server && typecheck:admin && test` |
| `bc4156b` | `lint && lint:deps && typecheck (chỉ root) && test` |
| `ff0ebde` | `lint && lint:deps && typecheck` |
| HEAD | `lint && lint:deps && typecheck && typecheck:worker` |

`ff0ebde` mang tiêu đề "align check script with testing-strategy contract" trong khi
[`testing-strategy.md`](../specs/08-quality/testing-strategy.md) mục 8 ghi đúng ngược lại:

```
pnpm check            → lint + lint:deps + typecheck + test
```

Ba spec độc lập nói cùng một điều — [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md)
mục 2 và mục 4 bước 6 (`BR-RBS-03`), [`testing-strategy.md`](../specs/08-quality/testing-strategy.md)
mục 8, [`type-safety.md`](../specs/08-quality/type-safety.md) mục 8. Bản kế hoạch
[`103-script-surface-refactor-plan.md`](103-script-surface-refactor-plan.md) mục 4 cũng
chốt đúng dòng đó.

Hệ quả đo được: `lefthook` `pre-push` chạy `pnpm check`, nên **không có test nào chạy khi
push**. Mọi cổng contract (spec corpus, an toàn kiểu, từ vựng, corpus nội dung) là test
vitest theo [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) mục 7.6 —
bỏ `test` khỏi `check` là tắt toàn bộ nhóm cổng đó cùng lúc.

## 3. Cổng đã viết nhưng chưa nối

| Thứ | Trạng thái trước Task này |
|---|---|
| `packages/gates/scripts/typecheck-gate.ts` | Đủ 10 project, có ratchet theo từng file. Không script nào gọi |
| `packages/gates/src/typecheck-baseline.json` | Chưa từng được sinh |
| `packages/gates/tests/lint-workspace-gate.test.ts` | `packages/config/vitest/base.ts` ghi "cổng này giữ bất biến" — file chưa từng tồn tại |
| `nuxt typecheck` ở `apps/web` và `apps/admin` | Vẫn là script `typecheck` của hai app, dù AGENTS.md ghi rõ nó exit 0 im lặng |
| Rule `no-obsolete-auth-provider` | Cấm `nuxt-auth-utils` — thứ [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) mục 1 BẮT BUỘC dùng. Rule không bao giờ khớp nên `lint:deps` xanh giả |

## 4. Việc đã làm

### 4.1 Bề mặt script trung thực

```
typecheck        = node packages/gates/scripts/typecheck-gate.ts        (10 project)
typecheck:update = ... --update
typecheck:root | :worker | :web | :admin = ... --only <tên>
check            = pnpm lint && pnpm lint:deps && pnpm typecheck && pnpm test
```

`--only` khớp theo tiền tố: `--only web` chọn cả bốn project của `apps/web`. Lọc bằng tên
đầy đủ thì "kiểm apps/web" phải nhớ liệt kê đủ bốn, và thiếu một là vùng đó không ai kiểm.

`apps/web` và `apps/admin` bỏ `nuxt typecheck`, trỏ thẳng vào cổng bậc thang.

### 4.2 Cổng convention của workspace

`packages/gates/src/lint-workspace-gate.ts` + test có ca âm. Bảy rule:

| Rule | Nguồn |
|---|---|
| `catalog-version` | `BR-RBS-06` — dependency chỉ khai `catalog:` hoặc `workspace:` |
| `check-composition` | `BR-RBS-03` — `check` đủ bốn bước, `lefthook` gọi `pnpm check` |
| `missing-script` | Mọi workspace có `test` và `typecheck` |
| `test-file-location` | File test chỉ ở `src/` hoặc `tests/` — khớp `WORKSPACE_TEST_INCLUDE` |
| `tsconfig-base` | Extend đúng một trong ba base hợp lệ |
| `tsconfig-flag-duplication` | Không khai lại flag đã có ở `tsconfig.base.json` |
| `nuxt-tsconfig-references` | `tsconfig.json` của app Nuxt `references` đúng danh sách project cổng chạy |

Chín vi phạm tìm thấy và đã sửa:

| Vi phạm | Sửa |
|---|---|
| `apps/web`, `apps/admin` không có `tsconfig.json` | Thêm, `references` tới bốn project `.nuxt/` |
| `argon2 ^0.45.1` khai rời ở `packages/auth` và `apps/worker` | Vào catalog, hai nơi khai `catalog:` |
| `tsx ^4.23.11` khai rời ở `apps/worker`, gốc dùng mà không khai | Vào catalog, gốc khai `catalog:` |
| `apps/worker/tsconfig.json` khai lại `module` và `moduleResolution` | Bỏ. Đo lại: vẫn đúng 301 lỗi, không đổi hành vi |
| `packages/storage` không có `test` lẫn `vitest.config.ts` | Thêm cả hai, cộng test cho hàm thuần (`detectImageMimeType`, `isSvgContent`, `url`, kho ảnh) |

### 4.3 Định dạng tự động

`lefthook` `pre-commit` thêm job `format` chạy `biome check --write` trên `{staged_files}`
kèm `stage_fixed: true`. Chỉ chạm file đã stage: `--write` trên cả cây sẽ nuốt thay đổi dở
của người khác vào commit.

### 4.4 Rule ranh giới auth sửa lại theo spec

`no-obsolete-auth-provider` giờ cấm đúng danh sách của
[`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) mục 1 — Supabase
Auth, Better-Auth, Sidebase AuthJS, `next-auth` — và rule mới
`no-nuxt-auth-utils-credential-helpers` cấm nhánh OAuth/WebAuthn của `nuxt-auth-utils`.

## 5. Nợ kiểu: 3.003 lỗi, và vì sao là bậc thang

`pnpm typecheck` sau khi nối đủ 10 project:

| Project | Lỗi |
|---|---|
| root (`packages/*` + `scripts/` + `infra/`) | 1.164 |
| worker | 301 |
| web:app | 686 |
| web:server | 677 |
| admin:app | 175 |
| web:shared · web:node · admin:server · admin:shared · admin:node | 0 |

Phân bố theo mã lỗi ở project root: `TS18048` 834 · `TS2532` 217 · `TS2345` 57 ·
`TS2322` 39 · `TS2769` 9 · `TS2538` 8. Gần như toàn bộ đến từ `noUncheckedIndexedAccess`,
flag vừa bật ở `tsconfig.base.json` để khớp đúng luật Nuxt đã ép cho `apps/*`.

Chốt "phải sạch ngay" là cổng đỏ vĩnh viễn, và cổng đỏ vĩnh viễn thì người ta tắt nó —
cùng lý do `BR-TYP-02` chọn sổ nợ. Nên cổng là **bậc thang theo từng file**: file tăng lỗi
hoặc file mới có lỗi là đỏ; giảm là xanh kèm nhắc chốt mức mới. Đường tới sạch 100% là
burndown có cổng giữ, Cấm — NEVER là một lần sửa 3.003 chỗ.

## 6. Trạng thái sau khi sửa

| Cổng | Exit | Số |
|---|---|---|
| `pnpm lint` | 0 | 1.384 file, sạch |
| `pnpm lint:deps` | 0 | 1.584 module, sạch, hai rule auth giờ trỏ đúng spec |
| `pnpm typecheck` | 0 | 10/10 project khớp baseline `packages/gates/src/typecheck-baseline.json` |
| `packages/gates` | 1 đỏ | duy nhất `lint-type-safety`: `packages/shared/src/activity-model.ts` 3 → 4 ép kiểu, tới từ thay đổi dở của người khác trong cây làm việc, không thuộc Task này |

`pnpm test` chạy đủ hai lượt, so theo luật của AGENTS.md ("chụp danh sách trạng thái trước
và sau, yêu cầu trùng khít"):

| | File | Test | Thời gian |
|---|---|---|---|
| Trước | 23 đỏ / 340 | 58 đỏ / 2.941 | 1.587 giây |
| Sau | 23 đỏ / 342 | 58 đỏ / 2.961 | 2.414 giây |

**Tập file đỏ trùng khít**: 23 file, không file nào đổi trạng thái theo chiều nào. 20 test
tăng thêm đúng bằng test mới (15 của `packages/storage`, 5 của `lint-workspace-gate`).
Hai file tăng thêm là hai file test mới đó. Fixture ca âm không còn bị vitest nhặt —
`WORKSPACE_TEST_EXCLUDE` của `@mindkid/config/vitest` loại `**/fixtures/**`.

Nợ kiểu giảm **3.003 → 2.965** (root 1.164 → 1.126): `packages/gates` từ 53 xuống 15,
15 chỗ còn lại đều ở file test.
`src/` và `scripts/` của `packages/gates` giờ sạch kiểu. Trong đó có một đơn giản hoá thật:
`extractModuleSpecifiers` có ba vòng lặp là ba bản sao của cùng sáu dòng, gom thành
`collectSpecifiers` với cờ `dedupe` giữ nguyên hành vi từng nhánh.

### 6.1 Ca âm đã đo

Hook và cổng không có ca âm là hook chưa tồn tại (repo-bootstrap mục 4 bước 6). Ba ca đo được:

| Ca | Kết quả |
|---|---|
| Thêm `export const broken: string = 123;` vào `packages/config/src/` | `pnpm typecheck --only root` báo `1127 lỗi (baseline 1126, +1)`, exit 1. Xoá file thì về `=`, exit 0 |
| Stage một file `.ts` sai định dạng, chạy `lefthook run pre-commit` | Job `format` sửa file **và** `git show :<file>` trả bản đã định dạng — `stage_fixed` hoạt động |
| Không stage file nào khớp glob | Lefthook 2.1.10 in `format (skip) no files for inspection`. Quan trọng: `{staged_files}` rỗng sẽ biến lệnh thành `biome check --write .` và ghi cả 1.384 file — đo được là lefthook **không** để chuyện đó xảy ra. `skip_empty` không còn là khoá hợp lệ ở schema jobs của v2 |

Cổng `lint-workspace-gate` có fixture `bad` làm đỏ đủ bảy rule và fixture `good` xanh.

## 7. Còn lại

- [ ] Chốt `typecheck-baseline.json` rồi burndown theo cụm. Cụm lớn nhất là
      `packages/db/tests` (695) và `packages/db/src` (171).
- [ ] `verifySignedUrlToken` của `packages/storage` gọi `crypto.timingSafeEqual` trên hai
      buffer có thể lệch độ dài — chữ ký ngắn làm nó **ném** thay vì trả `false`. Không sửa
      trong Task này vì đổi hành vi; cần một task riêng có spec sở hữu.
- [ ] **Tách suite — điều kiện đóng của câu hỏi mở đã đạt.**
      [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) mục 11 câu 1 chốt
      "giữ một suite; chỉ tách khi P95 của 10 lần chạy vượt 120 giây", đo năm 2026-08-09 khi
      suite là 22 file / 278 test / 4,15 giây. Nay là 342 file / 2.961 test, đo hai lần:
      **1.587 giây** và **2.414 giây**. Cả hai vượt ngưỡng gấp hơn 13 lần, nên điều kiện tách
      đã thoả và `pre-push` hiện tốn 26 tới 40 phút. Đây là việc phải sửa **spec trước**
      (mục 11 câu 1 cần mở lại), Cấm — NEVER lặng lẽ gỡ `test` khỏi `check` lần nữa: đó đúng
      là cách nó bị tắt hai lần ở mục 2.
- [ ] 23 file test đỏ có từ trước Task này chưa được chạm tới — nặng nhất
      `apps/web/tests/api/lesson-exemplar.test.ts` (8) và `lesson-session-runner.test.ts` (7).
- [ ] `packages/shared/src/activity-model.ts` tăng 3 → 4 ép kiểu, tới từ thay đổi chưa commit
      của phiên khác. Cần chủ của thay đổi đó xử lý hoặc hạ baseline có lý do.
