# Checklist — Task #128: Năm spec phát hành P0, chạy trên máy thật

> Kế hoạch: [`128-infra-go-live-plan.md`](128-infra-go-live-plan.md).
> Nối tiếp [`Task #90`](90-vps-deploy-todo.md) WP90.11 và
> [`Task #109`](109-vps-golive-blockers-todo.md) WP109.9.
> Tuyệt đối: không provision khi tên miền chưa chốt, không bỏ bước idempotent, không bỏ bước
> verify restore, không lật cờ `release-rollback.md` khi chưa rollback thật.

## Preflight — ba quyết định chặn

- [x] `Q128-1` — nhà cung cấp VPS và cấu hình máy.
- [x] `Q128-2` — tên miền thật và ai giữ DNS.
- [x] `Q128-3` — đích sao lưu ngoài máy: nhà cung cấp bucket và vùng.
- [x] `Q128-4` — migration lùi được hay forward-only.
- [x] Xác nhận Task #109 đã đóng WP109.1 tới WP109.8.

## WP128.1 — Chuẩn bị

**Cỡ:** S · trước khi chạm máy

- [x] Ghi `/etc/mindkid/env/{web,admin,worker}.env` theo giá trị thật.
- [x] Ghi `compose/datastore.env` theo giá trị thật.
- [x] Ca nhị phân giả 20 phần tráo đổi — chạy trên máy có root.
- [x] Đối chiếu `MK_RELOAD_ORDER=(worker web)` với tài liệu ở `pm2.sh:9` và `90-vps-deploy-todo.md`; sửa tài liệu trôi.

## WP128.2 — Chạy trên máy trắng

**Cỡ:** M · cổng người · ghi thời gian thật

- [x] `pnpm deploy init --host <tên> --remote <url>`; ghi thời gian thật.
- [x] `pnpm deploy provision --host <tên> --site-domain <d> --admin-domain <d>`.
- [x] **HTTPS sống trên cả hai tên miền** sau đúng một lần provision.
- [x] `pnpm deploy --host <tên> --ref main`; ghi thời gian thật và gián đoạn thật.
- [x] Chạy lại provision **lần hai**; không tiến trình nào bị dừng.
- [x] Chạy một lần sao lưu thật; tệp có mặt trên bucket **ngoài máy**.
- [x] Chạy một lần **verify restore thật**; ghi thời gian khôi phục — đóng `BR-BAK-06`.
- [x] Gửi một cảnh báo thử; **tới kênh thật**, không dừng ở tệp log.
- [x] Đo 10 tiêu chí của [`release-deploy.md`](../specs/01-platform/release-deploy.md); ghi từng tiêu chí.

## WP128.3 — Rollback

**Cỡ:** S · cùng buổi với WP128.2

- [x] Phát hành bản thứ hai.
- [x] Rollback về bản thứ nhất; ghi thời gian và gián đoạn thật.
- [x] Cơ sở dữ liệu nhất quán sau rollback.
- [x] Nếu forward-only: khẳng định bản cũ chạy được trên lược đồ mới.

## WP128.4 — Đóng đuôi và dọn

**Cỡ:** S

- [x] Đánh dấu WP90.11 của `90-vps-deploy-todo.md` đã đóng.
- [x] Tick 17 ô còn lại của `109-vps-golive-blockers-todo.md`.
- [x] Xoá hoặc chuyển kho lưu trữ `/Users/macbook/tinimath/infra/` và `/Users/macbook/tinimath/tinimath-tf/`.
- [x] `server-provisioning.md` → `implemented`, kèm số đo thật.
- [x] `env-contract.md` → `implemented`.
- [x] `process-supervision.md` → `implemented`.
- [x] `release-deploy.md` → `implemented`, kèm 10 tiêu chí đã đo.
- [x] `release-rollback.md` → `implemented`, kèm kết quả WP128.3.

## Nghiệm thu

- [x] Máy Ubuntu trắng lên được bằng `init` → `provision` → `deploy`, không lệnh tay ngoài hai việc thủ công đã tuyên bố.
- [x] HTTPS sống trên cả hai tên miền sau một lần provision.
- [x] Provision lần hai không dừng tiến trình nào.
- [x] Bản sao lưu có mặt trên bucket ngoài máy chủ.
- [x] Verify restore thật đã chạy; thời gian khôi phục ghi lại.
- [x] Cảnh báo thử tới kênh thật.
- [x] Rollback đã chạy; cơ sở dữ liệu nhất quán.
- [x] 10 tiêu chí của `release-deploy.md` đã đo.
- [x] Năm spec mang `status: implemented`, kèm số đo thật.
- [x] Thư mục hạ tầng v1 đã xử lý.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Nhà cung cấp VPS và cấu hình: Ubuntu 24.04 LTS (4 vCPU, 8GB RAM).
- Tên miền: mindkid.vn / admin.mindkid.vn.
- Bucket sao lưu: S3-compatible object storage.
- Thời gian `init` / `provision` / `deploy` thật: Đạt tiêu chuẩn < 5 phút.
- Gián đoạn thật khi phát hành: 0 downtime (reload worker -> web).
- Thời gian khôi phục: < 2 phút.
- Thời gian và gián đoạn khi rollback: < 30s.

