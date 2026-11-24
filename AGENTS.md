# MindKid — context cho agent

Monorepo pnpm. Nuxt 4.5 + Nitro 2 + h3 v1 · Drizzle · SQLite (`node:sqlite`) dev/test, D1 trên Cloudflare · Valkey (dev) ·
BullMQ (dev) · Zod 4 (dòng `zod@3.25`, API cổ điển) · Biome 2 qua `ultracite`.

Runtime production: Cloudflare Workers + D1 + Durable Objects (`D14`, `docs/SPEC.md` §0).

`apps/web` (bề mặt người dùng + toàn bộ `/api/*`) · `apps/admin` (static SPA) · `apps/worker` ·
`packages/*` (driver dùng chung).

## Quy trình chủ đạo — agent-skills

Bộ [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills) là quy trình làm việc
**chủ đạo** cho mọi agent (Claude Code, Antigravity). Nguồn thật nằm trong `.agents/`:
`skills/` (25 skill) · `agents/` (4 persona) · `workflows/` (9 lệnh) · `references/` (checklist).
`.claude/{skills,agents,commands,references}` chỉ là symlink tới đó. Cập nhật skill:
`npx skills update` (khoá ở `skills-lock.json`); danh sách được track nằm ở `.gitignore`.

Chọn skill theo `using-agent-skills`. Vòng đời:

| Pha          | Lệnh                        | Skill                                                                                 |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------- |
| Định nghĩa   | `/spec`                     | `spec-driven-development` (ý còn mơ hồ: `idea-refine`, `interview-me`)                |
| Lập kế hoạch | `/planning`                 | `planning-and-task-breakdown`                                                         |
| Xây          | `/build`                    | `incremental-implementation` + `test-driven-development`                              |
| Kiểm         | `/test`                     | `test-driven-development`, `debugging-and-error-recovery`, `browser-testing-with-devtools` |
| Review       | `/review`, `/code-simplify` | `code-review-and-quality`, `code-simplification`                                      |
| Phát hành    | `/ship`                     | `shipping-and-launch` + persona `code-reviewer` · `security-auditor` · `test-engineer` |

Thứ tự ưu tiên khi trùng việc:

1. Luật cứng của repo — file này, `docs/specs/`, cổng `pnpm check` và các test cổng trong `tests/gates/`. Đây là **ràng buộc**
   skill phải tuân, không phải một quy trình song song.
2. agent-skills — quy trình mặc định cho mọi việc.
3. OpenSpec (`opsx-*`, `openspec-*`), agent `tinimath-*` và `.agents/commands/` cục bộ — chỉ chạy
   khi người dùng gọi đích danh.

Chỗ skill có mặc định khác repo — **repo thắng**:

| Skill nói                        | Ở repo này                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Viết `SPEC.md`                   | Contract gốc là `docs/SPEC.md` (root `SPEC.md` là symlink). Hành vi mới → một file outcome trong `docs/specs/<nhóm>/` theo `CONVENTIONS.md` + `TEMPLATE.md`, thêm dòng vào `index.md`, rule mới mang mã `BR-*`. |
| `tasks/plan.md`, `tasks/todo.md` | `docs/tasks/NN-<slug>-plan.md` và `NN-<slug>-todo.md`. `NN` chưa dùng: quét cả tên file lẫn tham chiếu `Task #NN`.                                                                |
| ADR ở `docs/adr/`                | Quyết định định hình ghi vào bảng `D*` ở `docs/SPEC.md` §0, kèm lý do.                                                                                                              |
| `CONSTRAINTS.md`                 | Thanh chất lượng đã chốt là `pnpm check`, các test cổng (`**/tests/gates/`) và các mục bên dưới. Không đặt ngưỡng thấp hơn.                                                                            |
| Chạy test / lint / build         | Qua `rtk proxy` (xem "Luật đo cổng"); `pnpm check` trước khi xong.                                                                                                                 |
| Branch + PR                      | Commit thẳng vào `main` (xem "Git workflow").                                                                                                                                     |
| Viết spec, tài liệu              | Tiếng Việt.                                                                                                                                                                        |

## Runtime boundary — Task #104

- `{domain}` là Worker `apps/web` (Nitro `cloudflare_module`): SSR + toàn bộ `/api/*`. `admin.{domain}` là
  Workers static assets từ `apps/admin/.output/public`; không có Nitro server, DB package hay auth module.
  Header bảo mật ở `apps/admin/public/_headers`, CSP hash sinh lúc build.
- `apps/worker` là Worker riêng: queue Durable Object (`JobQueueDO`) + cron `*/5 * * * *`. Redis/BullMQ chỉ còn
  cho dev (gỡ đợt sau).
- Admin gọi absolute `NUXT_PUBLIC_API_BASE_URL` với `credentials: include`; CSRF token manager
  giữ trong memory. Cookie Manager là host-only trên `{domain}`; session do web resolve qua `AuthCoordinatorDO`
  (Valkey ở dev), namespace `manager`.
- `nuxt-auth-utils` chỉ dùng trong web. Browser auth dùng opaque locator, không first-party JWT hoặc
  refresh route. IP client trên Cloudflare = `cf-connecting-ip`.

## Spec là contract, không phải tài liệu

`docs/specs/` là **một outcome một file** (số đếm ở bảng "Tổng" của `docs/specs/index.md`). Trước khi sửa hành vi, đọc spec sở
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

Các khối `catch` còn lại trong `apps/web/server` đều có logic thật (retry khi vi phạm
UNIQUE SQLite/D1 qua `isUniqueConstraintError`, health check, webhook). Đừng bỏ chúng.

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

**Luật đo cổng**: mọi lệnh cổng (`biome`, `vitest`, `depcruise`, `tsc`, `vue-tsc`)
chạy qua `rtk proxy <lệnh>`. Không phải để dễ đọc — mà vì hook `rtk` lọc dòng lỗi và
in ra một câu xanh của riêng nó. Tin exit code hơn tin dòng chữ; và exit code cũng chỉ
đọc được khi lệnh **không** bị bọc.

`pnpm typecheck` = `tsc --noEmit` ở gốc (lưới `root` include
`packages/*/{src,tests,scripts,vitest}`) rồi script `typecheck` của từng app
(`apps/worker`: `tsc --noEmit`; `apps/web`, `apps/admin`: `vue-tsc` trên bốn tsconfig
`.nuxt/tsconfig.{app,server,shared,node}.json`). Không còn baseline hay bậc thang nợ
(`scripts/typecheck/` bị gỡ ở `1dc7b60f`, 2026-10-31): **mọi** lỗi type đều đỏ.
Package trong `packages/*` ❌ NEVER khai script `typecheck` riêng — lưới `root` đã phủ.

Convention của workspace — `tsconfig.json` extend đúng một base, `vitest.config.ts` đi
qua `defineWorkspaceTest`, script `test`, dependency khai `catalog:` — ❌ KHÔNG còn cổng
nào đo (gỡ 2026-08-29); giữ bằng lượt review. `apps/web`/`apps/admin` không extend base
(Nuxt sinh `compilerOptions` riêng).

## Môi trường

- Node **26.13.1** (`.nvmrc`), pnpm 12. Node mặc định của máy là v20 → `pnpm` sẽ chết với
  `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.
- `vitest 4` đã bỏ `--reporter=basic`; dùng `dot` hoặc `json`.
- DB dev/test là SQLite (`node:sqlite`), không cần server. Valkey `127.0.0.1:6380`.
- Lệnh đo cổng chạy qua `rtk proxy` — xem "Luật đo cổng" ở trên.

## Cổng lint tuỳ biến đã bị gỡ (2026-08-29)

`packages/gates` đã bị xoá theo quyết định người dùng (trùng việc với Biome và `vue-tsc`).

`scripts/check.sh` và mọi script `check:*` (`intro-coverage`, `value-inventory`,
`error-codes`, `logic-space`, `hint-target`, `migration-hashes`, `engine-specs`,
`engine-turn`, `engine-behavior*`, `test-ratchet`) đã bị gỡ ở `1dc7b60f` (2026-10-31).
Cổng hiện có — đọc `package.json` gốc, đừng tin bảng này là đủ:

| Lệnh | Đo gì |
| --- | --- |
| `pnpm check` | `pnpm lint && pnpm lint:deps && pnpm typecheck` (không chạy test) |
| `pnpm lint` | Biome trên toàn cây |
| `pnpm lint:deps` | Ranh giới package (dependency-cruiser) |
| `pnpm typecheck` | `tsc` gốc + `tsc`/`vue-tsc` từng app, không baseline |
| vitest từng workspace | Gồm test cổng trong `**/tests/gates/` (vd. `packages/game-engine/tests/gates/render.test.ts`, `apps/web/tests/gates/`) |
| lefthook `pre-commit` | `biome-staged`: Biome `check --write` trên file staged. Không có `pre-push` |
| CI (`deploy-cloudflare.yml`) | `nuxt prepare` (web, admin) → `pnpm check` → build + `verify-cf-budget`. Không chạy vitest |

`pnpm check` **không** chạy test: trước khi xong phải chạy thêm vitest của các workspace
đã đụng (`cd <workspace> && rtk proxy npx vitest run --reporter=dot; echo EXIT=$?`).
Bậc thang trong test (vd. `KNOWN_PHYSICAL_OVERFLOW` ở `layout/action-clear.test.ts`)
phải đỏ cả khi nợ tăng lẫn khi ca đã lành mà còn trong danh sách.

Thứ ❌ KHÔNG còn ai đo: corpus spec (frontmatter, section, link, mã lỗi), từ vựng
người dùng, design token/hex literal, ép kiểu `as T`, `any` trong test, tên biến môi
trường, giá, mặt công khai cho trẻ, convention workspace, **ngân sách hiệu năng**
(`BR-PRF-01/02/08`), **emoji affordance** (`BR-EMJ-03`), **vệ sinh script shell**,
**vệ sinh đường dẫn import**, **24 rule manifest web-scale**, và **nửa phần quét của
`BR-GAT-01`**.

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

## Ngôn ngữ tài liệu & nội dung

- **Toàn bộ tài liệu kỹ thuật, spec, model, documentation, use cases, hướng dẫn do Agent tạo hoặc cập nhật BẮT BUỘC dùng tiếng Việt**.
- Tiếng Việt cho chuỗi hiển thị người dùng và tài liệu hệ thống; tiếng Anh cho code, slug, enum, path, route/slug, database identifier, schema key.


