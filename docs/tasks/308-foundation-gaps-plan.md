# Kế hoạch Task #308: Lấp gap nền móng (Foundation Gaps)

Contract: `docs/specs/00-foundation/access-ladder.md` (`BR-LAD-07`), `docs/specs/00-foundation/api-error-client.md` (`BR-AEC-02`, `BR-AEC-03`), `docs/specs/00-foundation/content-lifecycle.md` (`BR-CLC-01`), `docs/specs/00-foundation/content-versioning.md` (`BR-VER-03`, cùng `BR-EVT-06` của `event-catalog.md`).

Ghi chú: `repo-bootstrap.md` — đợt #288 lỡ nới `BR-RBS-03` xuống `check:fast` cho khớp `lefthook.yml`; đã khôi phục luật gốc (`pre-push` = `pnpm services` + `pnpm check`) và spec mang `open_tasks: ["#308"]`. Slice S5b dưới đây sửa `lefthook.yml`.

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G1 §A, §E):

| Spec | Hụt | Bằng chứng |
|---|---|---|
| access-ladder | `BR-LAD-07`: allow-list guest = đúng 6 level, 1 mỗi competency, difficulty ≤ 2 | Guest nhận `["free"]` (`packages/shared/src/access-ladder.ts:76-78`) tức **mọi** level tier `free` (rg đếm 573 dòng `access_tier: "free"` trong `packages/content/src`). `FEATURED_GUEST_LEVELS` (`packages/shared/src/public-seo.ts:475`, 6 level C1–C6) chỉ dùng để hiển thị trang chủ |
| api-error-client | `BR-AEC-02`, `BR-AEC-03` | 30 lời gọi `$fetch(` trần trong `apps/web/app/**` (vd `pages/me/settings/index.vue`, `pages/login.vue`) bỏ qua interceptor `use-api.ts:64`. Không có `isApiErrorCode`; `getFieldErrors` (`packages/errors/src/client.ts:114,156,173`) trả `readonly ApiErrorField[]` thay vì `Record<string,string>` như `BR-AEC-03`. Không test nào mang mã `BR-AEC-*` |
| content-lifecycle | `BR-CLC-01` (DB trigger) | Các migration trong `packages/db/src/migrations/` không có `CREATE TRIGGER`; INSERT-only chỉ dựa REVOKE trên role `mindkid_app` (`packages/db/src/client.ts:9`) |
| content-versioning | `BR-VER-03`, `BR-EVT-06` | `telemetry_events.content_version` nullable (`packages/db/src/schema/play.ts:72`) |

## 2. Thiết kế

- **Guest allow-list:** nguồn duy nhất là `FEATURED_GUEST_LEVELS` (hoặc một hằng mới trong `packages/shared` nếu spec muốn tách khỏi SEO — đọc spec §7). `getEffectiveTier`/kiểm quyền ở `access-ladder.ts` cho guest chỉ mở đúng các mã trong allow-list; mọi level `free` khác trả `TierLockedError` qua lớp lỗi domain. Áp ở `apps/web/server/api/guest/levels/[code]/{index,config}.get.ts` và danh sách `guest/levels/index.get.ts`. Kiểm bất biến của allow-list: đúng 6, mỗi competency 1, difficulty ≤ 2, level tồn tại và published (test trên corpus thật).
- **Error client:** chuyển 30 `$fetch(` trần sang `useApi()`. Đây là sửa cơ học nhiều file — nếu diff > 500 dòng, viết codemod (CLAUDE.md "Refactor diện rộng"). `getFieldErrors`: chốt kiểu trả về — spec là contract, nên sửa code về `Record<string, string>` **hoặc** sửa spec trước nếu người gọi hiện tại cần mảng (đo số chỗ gọi rồi quyết; ghi vào spec cùng PR). Thêm `isApiErrorCode(err, code)` là type guard (không `as`). Cổng ngăn `$fetch(` trần mới trong `apps/web/app/**` ở `apps/web/tests/gates/` có ca âm (fixture trong `tests/**/fixtures/`).
- **Trigger `BR-CLC-01`:** migration **mới** tạo hàm + trigger `BEFORE UPDATE` trên `game_levels`, `lessons`, `activities`, `curricula`: từ chối mọi `UPDATE` khi `OLD.status = 'published'`, trừ chuyển `published → archived` (đọc spec để biết cột nào được đổi kèm). Kiểm luồng archive/rollback hiện tại ở `apps/web/server/services/content-lifecycle.ts`, `content-versioning.ts:204-233` vẫn chạy. Không sửa migration cũ (`check:migration-hashes`).
- **`content_version` NOT NULL:** migration mới; trước khi `SET NOT NULL` phải xử lý hàng cũ NULL (backfill hay xoá — đọc spec; event không gắn level có tồn tại không → nếu có, ghi ngoại lệ vào spec **trước**). Cập nhật Zod event ở `packages/play` cho bắt buộc trường.

## 3. Lát cắt dọc

- **S1 — Guest đúng 6 level (`BR-LAD-07`)**
  - Test trước: guest gọi level `free` ngoài allow-list → `TIER_LOCKED`; trong allow-list → 200; test bất biến allow-list trên corpus (6, 1/competency, difficulty ≤ 2, published). Tên `it` gắn `BR-LAD-07`.
  - Xong khi: test xanh; trang chủ vẫn hiển thị 6 level.
- **S2 — Error client helper (`BR-AEC-03`)**
  - Test trước (`packages/errors/tests`): `isApiErrorCode` thu hẹp kiểu; `getFieldErrors` đúng kiểu spec.
  - Xong khi: test xanh, chỗ gọi cũ cập nhật, typecheck sạch.
- **S3 — Bỏ `$fetch(` trần (`BR-AEC-02`)**
  - Test trước: cổng `apps/web/tests/gates/` + ca âm; đỏ trên code hiện tại (30 chỗ).
  - Chụp danh sách test web trước/sau — trùng khít ngoài test mới.
  - Xong khi: 0 `$fetch(` trần, cổng xanh.
- **S4 — Trigger `BR-CLC-01`**
  - Test trước (`packages/db/tests`, DB dev `127.0.0.1:5433`): `UPDATE` hàng published bị từ chối kể cả với role có quyền; `published → archived` qua được.
  - Xong khi: test xanh; test lifecycle/versioning web không đổi trạng thái; `check:migration-hashes` xanh.
- **S5 — `content_version` NOT NULL (`BR-VER-03`)**
  - Test trước: insert telemetry thiếu `content_version` → lỗi DB và lỗi Zod.
  - Xong khi: migration mới áp được trên dữ liệu dev có sẵn; test ingest xanh.
- **S5b — `pre-push` chạy `pnpm check` đầy đủ (`BR-RBS-03`)**
  - Sửa job `check` trong `lefthook.yml`: `pnpm services && pnpm check` thay cho `pnpm check:fast`; cập nhật khối chú thích đầu file (bỏ mục "Điểm mù").
  - Ca âm: tạo một test đỏ tạm trong project cần DB, `git push --dry-run` thật (hoặc `lefthook run pre-push --force`) phải exit khác 0; tắt Postgres thì hook đỏ.
  - Xong khi: ca âm đo được, rồi bỏ test đỏ tạm.
- **S6 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, test `@mindkid/shared`, `@mindkid/errors`, `@mindkid/db`, `@mindkid/web` liên quan, `rtk proxy pnpm check:migration-hashes`, `rtk proxy pnpm check:test-ratchet`.
  - Kiểm lại `repo-bootstrap.md` `BR-RBS-03` khớp `lefthook.yml` sau slice S5b.
  - Spec: 4 file — bỏ `#308` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `status: implemented` (`api-error-client` từ `approved`); `reviewed`. Nếu `api-error-client` còn thiếu §9 Gherkin/§10/§11 theo khuôn 11 mục, bổ sung trong cùng commit spec.
  - Commit vào `main`.
