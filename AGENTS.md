# MindKid — context cho agent

Monorepo pnpm. Nuxt 4.5 + Nitro 2 + h3 v1 · Drizzle + PostgreSQL 17 · Valkey ·
BullMQ · Zod 4 (dòng `zod@3.25`, API cổ điển) · Biome 2 qua `ultracite`.

`apps/web` (bề mặt người dùng + toàn bộ `/api/*`) · `apps/admin` (static SPA) · `apps/worker` ·
`packages/*` (driver dùng chung).

## Runtime boundary — Task #104

- `{domain}` chạy `apps/web` SSR và toàn bộ API. `admin.{domain}` chỉ nhận static files từ
  `apps/admin/.output/public`; không có Nitro server, PM2 process, DB package hay auth module.
- Admin gọi absolute `NUXT_PUBLIC_API_BASE_URL` với `credentials: include`; CSRF token manager
  giữ trong memory. Cookie Manager là host-only trên `{domain}` và được web resolve trong Redis
  namespace `manager`.
- `nuxt-auth-utils` chỉ dùng trong web. Browser auth dùng opaque locator + Redis, không first-party
  JWT hoặc refresh route. Nginx giữ proxy API, rate limit và static admin; Caddy chỉ là nghiên cứu.

## Spec là contract, không phải tài liệu

`docs/specs/` có **162 spec, một outcome một file**. Trước khi sửa hành vi, đọc spec sở
hữu hành vi đó. Tra một `BR-*` về spec nào: `docs/specs/00-foundation/business-rules.md`.

- Đổi hành vi mà spec đã chốt → sửa spec **trước**, trong cùng PR.
- Mỗi rule lint BẮT BUỘC trỏ về một `BR-*`. Không có BR sở hữu thì không thêm rule.
- Không nới rule chỉ để code hiện tại qua được cổng.

## Lỗi: không try/catch trong route

`AppError` và các lớp exception domain nằm ở package `@mindkid/errors` — tất cả đều là **H3Error hạng nhất**: khai
`static __h3_error__` cùng getter `statusCode` / `statusMessage` / `data`. Nên:

```ts
// ĐÚNG — service hoặc route ném trực tiếp lớp domain
throw new TierLockedError({ access_tier: "premium" });
throw new ChildNotFoundError(childUuid);

// SAI — route tự chuyển lỗi domain sang lỗi HTTP
try { ... } catch (err) {
  if (isAppError(err)) { setResponseStatus(...); throw createError({ ... }); }
}
```

`apps/web/server/error.ts` là chỗ **duy nhất** dựng body lỗi cho `/api/*`
(ERROR-CODES §4, §8). Body luôn đúng ba trường `{ code, message, details? }` (§7.1).
Lớp exception theo model nằm ở `@mindkid/errors`
(`ModelNotFoundError`, `ValidationError`, và lớp con cho từng model).

Còn 33 khối `catch` trong `apps/*/server` — tất cả đều có logic thật (retry SQLSTATE
23505, health check, webhook). Đừng bỏ chúng.

## An toàn kiểu — `docs/specs/08-quality/type-safety.md`

| Thứ                               | Luật                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `any` tường minh, mọi nơi         | **CẤM**. Không define `any` trong production code lẫn file test. Khai báo type tường minh đầy đủ.  |
| `unknown`                         | **CẤM define mới**. Bắt buộc khai báo interface/type cụ thể hoặc generic có ràng buộc.             |
| `as T`                            | Không dùng `as any` hay `as unknown as T` để trốn type error. Dùng type guard / narrowing chuẩn.   |
| `as const`                        | Được — làm kiểu hẹp lại, không nói dối                                                              |
| Type declarations                 | BẮT BUỘC khai báo type đầy đủ cho mọi function, parameter, return type, object structure.          |
| Body của route `/api/*`           | Phải Zod parse cùng file. Cổng: `apps/web/tests/security/security-checklist.test.ts` (`BR-SEC-04`), sổ nợ đã rỗng. Query/param ❌ KHÔNG được đo |

## Cổng nào thật, cổng nào nói dối

Đo trước khi tin. Bốn lệnh dưới đây từng xanh giả:

| Lệnh              | Sự thật                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `ultracite check` | **exit 0 dù có lỗi lint.** Dùng `pnpm lint` (`biome check .`)                |
| `nuxt typecheck`  | **exit 0 im lặng.** Không script nào gọi nó nữa — Cấm — NEVER thêm lại       |
| `tsc -p tsconfig.json` một mình | Chỉ là 1/10 project. `apps/*` sinh tsconfig ở `.nuxt/`         |
| `biome check` chạy **không** qua `rtk proxy` | Hook `rtk` **thay output** thành `Lint: No issues found` dù biome báo lỗi và exit 1. Đây là xanh giả **có chữ**, không phải output bị nén |

**Luật đo cổng**: mọi lệnh cổng (`biome`, `vitest`, `depcruise`, `tsc`, script `check:*`)
chạy qua `rtk proxy <lệnh>`. Không phải để dễ đọc — mà vì hook `rtk` lọc dòng lỗi và
in ra một câu xanh của riêng nó. Tin exit code hơn tin dòng chữ; và exit code cũng chỉ
đọc được khi lệnh **không** bị bọc.

`pnpm typecheck` chạy **cổng bậc thang** `scripts/typecheck/typecheck-gate.ts`:
cả 10 project TypeScript của repo (root · worker · web:app/server/shared/node ·
admin:app/server/shared/node), so từng file với
`scripts/typecheck/typecheck-baseline.json`. File tăng lỗi hoặc file mới có lỗi → đỏ.
Giảm → xanh kèm nhắc chạy `pnpm typecheck:update`. Đây là **chỗ duy nhất** typecheck
chạy: không app hay package nào còn script `typecheck` riêng.

Nợ theo `typecheck-baseline.json` hiện tại: **3.142 lỗi** — root 1.318 · worker 312 ·
web:app 685 · web:server 680 · admin:app 147 · bốn project còn lại 0. Con số **2.931** ghi
trước đây sai ở mọi hạng mục. Trong 3.142 đó có **+194 lỗi mà Task #124 và #125 ghi THÊM**
vào baseline cho mã vừa viết — bậc thang khi ấy chỉ là lời khuyên. Từ nay `--update` **từ
chối** mọi lần tăng (`scripts/typecheck/ratchet.ts:refuseIncrease`); muốn tăng phải có
`--allow-increase` kèm lý do trong PR. Sau khi sửa `origin` của bộ sinh level, root đo được
**1.139** (−179) → tổng thực đo **2.963**; chưa chốt được vì cây làm việc còn lỗi mới chưa
commit nằm ngoài phạm vi review. Gần như toàn bộ phần còn lại là `TS18048`/`TS2532` do
`noUncheckedIndexedAccess`. `pnpm typecheck --only web` chạy riêng một app; `--only web:app`
chạy riêng một project.

Convention của workspace — `tsconfig.json` extend đúng một base, `vitest.config.ts` đi
qua `defineWorkspaceTest`, script `test`, dependency khai `catalog:`, `pnpm check` đủ
bốn bước — ❌ KHÔNG còn cổng nào đo (gỡ 2026-08-29); giữ bằng lượt review. Workspace ❌ NEVER khai script `typecheck` riêng: lưới `root` đã include
`packages/*/{src,tests,scripts,vitest}`, nên bản sao cấp workspace phủ thêm số không và
đỏ ngay khi chạy vì không có baseline (Task #111). `apps/web`/`apps/admin` không extend base (Nuxt sinh
`compilerOptions` riêng) — `tsconfig.json` của chúng chỉ `references` tới đúng danh sách
project mà cổng typecheck chạy.

## Môi trường

- Node **24** (`.nvmrc`). Node mặc định của máy là v20 → `pnpm` sẽ chết với
  `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.
- `vitest 4` đã bỏ `--reporter=basic`; dùng `dot` hoặc `json`.
- Postgres dev ở `127.0.0.1:5433`, Valkey `6380` (container giữ cổng mặc định).
- `rtk` bọc lệnh KHÔNG chỉ nén output — nó thay hẳn kết quả (`biome check .` có 1 lỗi
  vẫn in `Lint: No issues found`). Mọi lệnh đo cổng chạy qua `rtk proxy <lệnh>`.

## Cổng lint tuỳ biến đã bị gỡ (2026-08-29)

`packages/gates` — 97 file, 10.713 dòng, 253 test cưỡng chế 96 rule `BR-*` và 18 rule
`C1`–`C18` — đã bị xoá theo quyết định người dùng: trùng việc với Biome và `vue-tsc`.

Cổng còn lại, **đây là toàn bộ**:

| Lệnh | Đo gì | Phase của `check.sh` |
| --- | --- | --- |
| `pnpm lint` | Biome trên toàn cây | 1 |
| `pnpm lint:deps` | Ranh giới package (dependency-cruiser) | 1 |
| `pnpm check:intro-coverage` | Bậc thang độ phủ bài làm quen (`BR-CIG-18`) | 1 |
| `pnpm check:value-inventory` | Kho giá trị kỹ năng hai chiều (`BR-SVI-01..05`) | 1 |
| `pnpm check:error-codes` | Bậc thang mã lỗi | 1 |
| `pnpm check:logic-space` | Mỗi `LayoutInput` trong thân `computeSlots` phải có `logic:` | 1 |
| `pnpm check:hint-target` | 37 template phải cài `getHintTargetIndex` thật, không stub | 1 |
| `pnpm check:migration-hashes` | Migration đã apply Cấm — NEVER bị sửa nội dung | 1 |
| `pnpm check:engine-specs` | 37 mã engine có phiếu đủ khuôn SDD, 0 mồ côi (`BR-ESS-*`) | 1 |
| `pnpm check:engine-turn` | Mục 4 và mục 5 của 37 phiếu theo bảy nhịp `N1`…`N7` và tám nhánh (`BR-ETS-*`) | 1 |
| `pnpm check:engine-behavior` | Miền hành vi theo registry, bậc thang kênh thắng cuộc (`BR-EBD-*`) | 1 |
| `pnpm check:engine-behavior-corpus` | Nửa corpus của `BR-EBD-04`: miền phải có level thật để chơi | 1 |
| `pnpm typecheck` | `tsc` + `vue-tsc` trên 10 project, bậc thang nợ | 2 |
| `pnpm check:test-ratchet` | Toàn bộ vitest, không `--bail`; file đỏ mới hoặc số suite tụt → đỏ | 3 |
| `pnpm test:deploy` | Script hạ tầng | 4 (đang tắt) |

`pnpm check --fast` chỉ chạy `--project=@mindkid/game-engine` và **nói rõ** đó là tập con.
Chế độ đầy đủ gặp `pnpm services` exit 1 thì **đỏ**, không lặng lẽ hạ xuống tập con.

Ba cổng bậc thang mới nhất (`logic-space`, `hint-target`, `test-ratchet`) đều từ chối
`--update` khi nợ **tăng**; muốn nới phải `--force` để diff nhìn thấy. `test-baseline.json`
có thêm sàn `minTotalSuites`: xoá test hay `describe.skip` làm số suite tụt → đỏ, vì
không có sàn thì nợ giảm được bằng cách bỏ đo.

Thứ ❌ KHÔNG còn ai đo: corpus spec (frontmatter, section, link, mã lỗi), từ vựng
người dùng, design token/hex literal, ép kiểu `as T`, `any` trong test, tên biến môi
trường, giá, mặt công khai cho trẻ, convention workspace, **ngân sách hiệu năng**
(`BR-PRF-01/02/08`), **emoji affordance** (`BR-EMJ-03`), **vệ sinh script shell**,
**vệ sinh đường dẫn import**, **24 rule manifest web-scale**, và **nửa phần quét của
`BR-GAT-01`**. Năm khoản in đậm KHÔNG có trong danh sách §4 của
`112-gates-package-removal-plan.md` — bổ sung 2026-08-30.

Đã khôi phục: `BR-ARB-04` (`apps/admin/tests/gates/`) và `BR-MFA-13`
(`apps/web/tests/gates/mfa-key-custody.ts`). Bảng đủ 17 khoản:
`docs/specs/08-quality/runtime-gates.md` §3.
Chúng vẫn là luật trong `docs/specs/` — nhưng luật không có cổng thì trôi.

Cổng mới ❌ NEVER dựng lại ở `packages/gates` — hỏi trước. Cổng phạm vi một workspace
thì vào `<workspace>/tests/gates/`, và BẮT BUỘC có **hai** phần: quét nguồn thật và
**ca âm** (một mẫu vi phạm phải làm test đỏ). Fixture vi phạm sống trong
`tests/**/fixtures/` — ❌ NEVER viết mẫu vi phạm thẳng vào file test, vì `apps/` và
`packages/` là thứ các cổng khác đang quét.

Cổng ❌ NEVER đọc `process.cwd()`: vitest chạy với cwd là thư mục workspace. Gốc repo
lấy từ `REPO_ROOT` / `repoPath()` của `@mindkid/config/paths`.

Config vitest dùng chung ở `@mindkid/config/vitest` (`defineWorkspaceTest`); bảng
alias tự quét `packages/*`, ❌ NEVER khai tay trong từng app.

## Test

`pnpm test` gom mọi workspace. Chạy riêng từng workspace thì xanh; chạy gộp ở gốc thì
test tích hợp DB timeout 30s (tranh cùng dữ liệu) — đo trước khi tin. Khi refactor,
đừng lấy "test xanh" làm cổng — hãy chụp danh sách `trạng-thái | tên-test` trước và
sau, rồi yêu cầu **trùng khít**. Bất kỳ test đổi trạng thái, kể cả fail→pass, đều là
dấu hiệu đổi hành vi.

## Refactor diện rộng

Trên 500 dòng thì viết codemod, đừng sửa tay. Bài học đã trả giá:

- Neo theo thụt lề rồi nhảy bằng regex sẽ **ghép sai cặp** `try`↔`catch` khi gặp
  `} catch {` không tham số. Quét theo dòng, tìm dòng đóng ở đúng cột.
- Chuẩn hoá chuỗi để so whitelist thì cả hai bên phải đi qua **cùng một hàm**.
- Đếm `any` / `as` trên nguồn thô sẽ bắt cả chữ trong văn xuôi tiếng Việt và tên
  biến. Bỏ comment và chuỗi trước khi đếm.
- Cây làm việc thường đang có thay đổi dở của người khác → **đừng** dùng
  `git checkout` để hoàn tác. Sao lưu file ra ngoài repo trước khi ghi.

## Git workflow — Luôn commit vào nhánh main

- **Tất cả code phải commit trực tiếp vào nhánh `main`** — làm việc trực tiếp trên `main` hoặc merge mọi branch vào `main` trước khi hoàn tất task và push lên remote.
- Không để code dở dang hoặc tồn đọng ở branch riêng mà chưa merge vào `main`.

