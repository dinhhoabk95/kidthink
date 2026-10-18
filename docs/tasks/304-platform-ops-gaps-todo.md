# Task #304 Todo: Lấp gap vận hành nền tảng (Platform Ops Gaps)

Plan: [`304-platform-ops-gaps-plan.md`](304-platform-ops-gaps-plan.md).
Spec: [`health-check.md`](../specs/01-platform/health-check.md), [`release-deploy.md`](../specs/01-platform/release-deploy.md), [`process-supervision.md`](../specs/01-platform/process-supervision.md), [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md).

---

## S1 — Sentinel health-check (`BR-HLT-02`)
- [ ] Test đỏ sentinel auth keyspace + timeout (`BR-HLT-02/03/05/06`)
- [ ] Ghi/đọc/xoá sentinel trong `apps/web/server/api/guest/health.get.ts` qua helper khoá của `packages/auth`

## S2 — Instance web vs pool DB (`BR-SUP-08`)
- [ ] Đọc công thức trong spec
- [ ] Test đỏ trên config `instances: "max"`
- [ ] Sửa `infra/pm2/ecosystem.config.cjs`; anchor `BR-SUP-07`

## S3 — Smoke artifact (`BR-DEP-15`)
- [ ] Ca artifact hỏng trong `infra/scripts/tests/run.sh` (đỏ)
- [ ] Smoke server khởi động, CSS entry admin, chunk client sạch code server
- [ ] Chạy trên build thật

## S4 — Cổng `BR-BAK-06`
- [ ] Chọn chỗ đặt cổng theo spec (go-live gate hay quy trình deploy)
- [ ] Ca âm: không có `verify` thành công → đỏ
- [ ] Nối vào `scripts/check.sh` hoặc deploy

## S5 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test liên quan + `rtk proxy pnpm check:go-live` xanh
- [ ] `rtk proxy pnpm check:test-ratchet` xanh
- [ ] Bỏ `#304` khỏi `open_tasks` + khối "Chưa hoàn thành" ở 4 spec; nâng `implemented`; `reviewed`
- [ ] Commit vào `main`
