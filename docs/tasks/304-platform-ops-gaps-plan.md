# Kế hoạch Task #304: Lấp gap vận hành nền tảng (Platform Ops Gaps)

Contract: `docs/specs/01-platform/health-check.md` (`BR-HLT-02`, `BR-HLT-03`, `BR-HLT-05`, `BR-HLT-06`), `docs/specs/01-platform/release-deploy.md` (`BR-DEP-12`, `BR-DEP-13`, `BR-DEP-15`), `docs/specs/01-platform/process-supervision.md` (`BR-SUP-07`, `BR-SUP-08`), `docs/specs/01-platform/backup-and-restore.md` (`BR-BAK-06`).

---

## 1. Bối cảnh & Mục tiêu

Gap có bằng chứng (audit G3 §E, G2 §E):

| Spec | Hụt | Bằng chứng |
|---|---|---|
| health-check | `BR-HLT-02`: sentinel ghi/đọc/xoá ở auth keyspace | `apps/web/server/api/guest/health.get.ts:31-49` có `SELECT 1`, `ping()`, `getWaitingCount()`, timeout 2s/3s — rg `sentinel` trong `apps/web/server`, `packages/cache/src` không thấy. `BR-HLT-02/03/05/06` không có test trỏ mã |
| release-deploy | `BR-DEP-15` (smoke artifact), `BR-DEP-12/13` | Chưa có bước smoke trong `infra/scripts/lib/build.sh` / `smoke.sh`: server `node .output/server/index.mjs` khởi động, SPA admin có CSS entry, chunk client không chứa code server |
| process-supervision | `BR-SUP-08` (số instance web ràng với pool DB), `BR-SUP-07` không anchor | `infra/pm2/ecosystem.config.cjs:58` web `instances: "max"` không tính cùng pool DB |
| backup-and-restore | `BR-BAK-06` (cổng go-live đỏ khi chưa verify backup) | BR-BAK-06 chỉ là chữ ở `apps/admin/app/pages/system/index.vue:48`; rg `BR-BAK-06` không thấy cổng nào. Bảng `backup_log` ở `packages/db/src/schema/ops.ts` |

Mục tiêu: bốn luật vận hành có code và có test/cổng đỏ được.

## 2. Thiết kế

- **Sentinel auth keyspace:** trong `health.get.ts`, ghi một khoá sentinel có TTL ngắn ở namespace auth (Redis `auth:v1:{ns}:…` — dùng helper khoá của `packages/auth`, không tự ghép chuỗi), đọc lại so giá trị, xoá. Thất bại → 503 + `alert()` như các nhánh hiện có; vẫn trong ngân sách thời gian 2s/3s. Body vẫn chỉ `{ status }`.
- **Smoke artifact:** thêm hàm vào `infra/scripts/lib/smoke.sh` (hoặc `build.sh`) chạy sau build: khởi động server trên cổng tạm, chờ `GET /api/guest/health` 200 rồi tắt; kiểm `apps/admin/.output/public` có file CSS entry được `index.html` tham chiếu; quét chunk client không chứa chuỗi đặc trưng server (danh sách chuỗi lấy theo spec). Ca test thêm vào `infra/scripts/tests/run.sh` (phase 4 `test:deploy` đang tắt — test phải chạy được trực tiếp; ghi rõ điều này trong commit).
- **Instance vs pool:** đọc spec `BR-SUP-08` lấy công thức; `ecosystem.config.cjs` dùng số instance cố định từ biến môi trường đã khai trong env-contract, hoặc chia `DB_POOL_MAX` theo `instances`. Test node đọc config và kiểm `instances × pool ≤ max_connections` của spec. `BR-SUP-07` (log không chứa secret): thêm anchor/test nếu spec mô tả kiểm được.
- **Cổng `BR-BAK-06`:** mở rộng `packages/content-build/src/gates/go-live-readiness.ts` (đã chạy ở `scripts/check.sh:173`) hoặc một `check:*` riêng — nhưng cổng go-live đọc DB thật? Đọc spec: nếu cổng go-live hiện chỉ đọc corpus tĩnh thì đặt kiểm `backup_log` ở script triển khai (`scripts/deploy`) thay vì cổng commit. Bắt buộc có ca âm (DB giả không có `verify` thành công → đỏ). Phối hợp với Task #310 (cũng sửa `go-live-readiness.ts`) — ai làm sau thì rebase.

## 3. Lát cắt dọc

- **S1 — Sentinel health-check**
  - Test trước (`apps/web/tests/...health*.test.ts`): Redis auth ghi được mà đọc lại sai → 503; timeout vượt ngân sách → 503; tên `it` gắn `BR-HLT-02/03/05/06`.
  - Xong khi: test xanh; route vẫn ≤ 3s tổng.
- **S2 — Ràng instance web với pool DB**
  - Test trước: config với `instances: "max"` trên máy 16 nhân vượt pool → đỏ.
  - Xong khi: `ecosystem.config.cjs` theo công thức spec; anchor `BR-SUP-07/08`.
- **S3 — Smoke artifact release**
  - Test trước: ca trong `infra/scripts/tests/run.sh` với artifact hỏng (thiếu CSS entry / chunk có code server) → đỏ.
  - Xong khi: smoke chạy trên build thật xanh; ghi `BR-DEP-12/13/15`.
- **S4 — Cổng `BR-BAK-06`**
  - Test trước: ca âm không có lần `verify` thành công → đỏ; có → xanh.
  - Xong khi: cổng nối vào `scripts/check.sh` hoặc quy trình deploy theo spec.
- **S5 — Nghiệm thu**
  - `rtk proxy pnpm lint`, `rtk proxy pnpm typecheck`, test web/worker/infra liên quan qua `rtk proxy`, `rtk proxy pnpm check:go-live`, `rtk proxy pnpm check:test-ratchet`.
  - Spec: 4 file — bỏ `#304` khỏi `open_tasks` + khối "Chưa hoàn thành"; nâng `status: implemented` (process-supervision từ `approved`); `reviewed`.
  - Commit vào `main`.
