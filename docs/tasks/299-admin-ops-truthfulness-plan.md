# Kế hoạch Task #299: Màn vận hành admin nói thật (Admin Ops Truthfulness)

Contract: `docs/specs/06-admin/system-activity.md` (`BR-SYS-01`, `BR-SYS-06`), `docs/specs/06-admin/data-export.md` (`BR-EXP-05`, `BR-EXP-07`, §8 `from`/`to`), `docs/specs/06-admin/notification-admin.md` (`BR-NTA-03`, `BR-NTA-06`, `BR-NTA-07`), `docs/specs/06-admin/legal-consent-admin.md` (`BR-LCA-06..09`, §8 409/422/201).

Chủ đề chung: bốn route trả kết quả "trông như đúng" mà không làm việc thật — báo xanh khi không đo, cắt dữ liệu im lặng, PATCH không lưu, kiểm tra đồng thời bị bỏ qua.

---

## 1. Bối cảnh & bằng chứng gap

| Spec | Bằng chứng | BR |
| --- | --- | --- |
| system-activity | `apps/web/server/api/managers/system/status.get.ts:86-104` gán cứng `status: "ok"`, `latency_ms: 2`, `waiting_count: 0` cho `valkey`, `queue`, `jobs`; Postgres (`:72-80`) và backup đo thật | `BR-SYS-01` |
| data-export | `apps/web/server/api/managers/exports/[kind].get.ts:33-50` rate limit là `Map` trong bộ nhớ (mất khi restart, không chia giữa instance); `:80,99,…` `.limit(MAX_EXPORT_ROWS)` nên 422 "vượt trần" không bao giờ xảy ra, dữ liệu bị cắt im lặng; query `from`/`to` (§8) không dùng | `BR-EXP-07`, `BR-EXP-05` |
| notification-admin | `apps/web/server/api/managers/notification-templates/[code]/[version].patch.ts:99-136` chỉ ghi audit rồi trả object dựng tay; template vẫn ở `TEMPLATE_REGISTRY` (`packages/notification/src/mjml-renderer.ts`); admin không gọi PATCH | `BR-NTA-03` |
| legal-consent-admin | `apps/web/server/api/managers/legal-consent-forces/index.post.ts`: `expected_requirement_at` parse rồi bỏ qua → không bao giờ 409 `CONSENT_REQUIREMENT_CHANGED`; `confirm_deployed`/`confirm_all_users` `.optional()` (`:16-17`); marker = `new Date()` của app, không do DB sinh, không kiểm lớn hơn marker cũ; response thiếu `affected_user_count`, khác §8 | `BR-LCA-07`, §8 |

## 2. Thiết kế

- **System status.** Valkey: `PING` thật qua `@mindkid/cache`, đo latency; queue/jobs: đọc `getJobCounts()` của BullMQ qua `@mindkid/queue` cho từng queue. Lỗi hoặc timeout (ngưỡng ngắn) → `status: "unknown"`/`"down"` theo spec, **không bao giờ** `ok` khi không đo được. Không try/catch dựng body: hàm đo trả kết quả có cấu trúc `{ status, latency_ms?, error? }`.
- **Data export.** Đếm trước (`count(*)` với cùng điều kiện) → > `MAX_EXPORT_ROWS` (100k) ném lỗi domain 422 (`BR-EXP-05`); bỏ `.limit` im lặng. Rate limit qua `checkRateLimit` (`packages/cache/src/token-bucket.ts:121`, Redis) theo manager (`BR-EXP-07`). Áp `from`/`to` (Zod parse query trong file, `from ≤ to`, khoảng tối đa theo spec).
- **Notification template — điểm chốt với người dùng (S0).** (a) Lưu template vào DB và đi vòng đời nội dung (`content-lifecycle`): bảng mới + migration, PATCH tạo phiên bản draft, renderer đọc bản published, fallback registry; hoặc (b) sửa spec: template là code-owned, gỡ PATCH giả + test của nó, giữ list/preview. Mặc định đề xuất (b) nếu không có nhu cầu sửa template không qua deploy — vì (a) cỡ L. Đổi spec thì sửa spec trước.
- **Legal consent force.** Zod `confirm_deployed: z.literal(true)`, `confirm_all_users: z.literal(true)`; trong một transaction: đọc marker hiện tại `FOR UPDATE`, so `expected_requirement_at` → khác thì ném `ConsentRequirementChangedError` (409); marker mới = `now()` của DB và phải lớn hơn marker cũ (`BR-LCA-07`); đếm `affected_user_count`; trả 201 `{ consent_type, requirement_at, affected_user_count }` đúng §8. Super_admin + reauth giữ nguyên.

## 3. Lát cắt (Slices)

- **S0 — Chốt notification template (a)/(b).**
- **S1 — System status đo thật (`BR-SYS-01`).** Test trước (`apps/web/tests/api/…system-status…`): Valkey down (mock) → không `ok`; queue counts phản ánh job thật đã enqueue; ca bình thường trả latency đo được. Code `status.get.ts:86-104`.
- **S2 — Data export (`BR-EXP-05`, `BR-EXP-07`, §8).** Test trước (`apps/web/tests/api/flags-export-notify.test.ts` hoặc file mới): > 100k dòng → 422 (fixture nhỏ với trần cấu hình hạ trong test); rate limit giữ qua hai instance handler (Redis); `from`/`to` lọc đúng. Code.
- **S3 — Legal consent force (`BR-LCA-06..09`).** Test trước: thiếu `confirm_*` → 422; `expected_requirement_at` cũ → 409 `CONSENT_REQUIREMENT_CHANGED`; marker mới > marker cũ và do DB sinh; response 201 có `affected_user_count`. Code.
- **S4 — Notification template theo S0.** (b): test PATCH → 404/405, list/preview còn chạy; gỡ route + sửa spec. (a): test PATCH lưu draft, publish đổi nội dung render; bảng + migration + renderer.
- **S5 — Nghiệm thu.**
  - `rtk proxy pnpm lint` exit 0; `rtk proxy pnpm typecheck` exit 0.
  - `rtk proxy pnpm --filter @mindkid/web exec vitest run tests/api/flags-export-notify.test.ts tests/api/notifications-api.test.ts` + test mới của status và legal consent; `rtk proxy pnpm --filter @mindkid/admin test`; `rtk proxy pnpm check:error-codes` (mã lỗi mới); `rtk proxy pnpm check:test-ratchet`.
  - Bỏ `open_tasks` + khối "Chưa hoàn thành" ở 4 spec, nâng `status: implemented`.
  - Commit lên `main`.
