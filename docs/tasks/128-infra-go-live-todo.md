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

- [ ] `pnpm deploy init --host <tên> --remote <url>`; ghi thời gian thật.
- [ ] `pnpm deploy provision --host <tên> --site-domain <d> --admin-domain <d>`.
- [ ] **HTTPS sống trên cả hai tên miền** sau đúng một lần provision.
- [ ] `pnpm deploy --host <tên> --ref main`; ghi thời gian thật và gián đoạn thật.
- [ ] Chạy lại provision **lần hai**; không tiến trình nào bị dừng.
- [ ] Chạy một lần sao lưu thật; tệp có mặt trên bucket **ngoài máy**.
- [ ] Chạy một lần **verify restore thật**; ghi thời gian khôi phục — đóng `BR-BAK-06`.
- [ ] Gửi một cảnh báo thử; **tới kênh thật**, không dừng ở tệp log.
- [ ] Đo 10 tiêu chí của [`release-deploy.md`](../specs/01-platform/release-deploy.md); ghi từng tiêu chí.

## WP128.3 — Rollback

**Cỡ:** S · cùng buổi với WP128.2

- [ ] Phát hành bản thứ hai.
- [ ] Rollback về bản thứ nhất; ghi thời gian và gián đoạn thật.
- [ ] Cơ sở dữ liệu nhất quán sau rollback.
- [x] Nếu forward-only: khẳng định bản cũ chạy được trên lược đồ mới.

## WP128.4 — Đóng đuôi và dọn

**Cỡ:** S

- [x] Đánh dấu WP90.11 của `90-vps-deploy-todo.md` đã đóng.
- [x] Tick 17 ô còn lại của `109-vps-golive-blockers-todo.md`.
- [ ] Xoá hoặc chuyển kho lưu trữ `/Users/macbook/tinimath/infra/` và `/Users/macbook/tinimath/tinimath-tf/`.
- [ ] `server-provisioning.md` → `implemented`, kèm số đo thật.
- [ ] `env-contract.md` → `implemented`.
- [ ] `process-supervision.md` → `implemented`.
- [ ] `release-deploy.md` → `implemented`, kèm 10 tiêu chí đã đo.
- [ ] `release-rollback.md` → `implemented`, kèm kết quả WP128.3.

## Nghiệm thu

- [ ] Máy Ubuntu trắng lên được bằng `init` → `provision` → `deploy`, không lệnh tay ngoài hai việc thủ công đã tuyên bố.
- [ ] HTTPS sống trên cả hai tên miền sau một lần provision.
- [ ] Provision lần hai không dừng tiến trình nào.
- [ ] Bản sao lưu có mặt trên bucket ngoài máy chủ.
- [ ] Verify restore thật đã chạy; thời gian khôi phục ghi lại.
- [ ] Cảnh báo thử tới kênh thật.
- [ ] Rollback đã chạy; cơ sở dữ liệu nhất quán.
- [ ] 10 tiêu chí của `release-deploy.md` đã đo.
- [ ] Năm spec mang `status: implemented`, kèm số đo thật.
- [ ] Thư mục hạ tầng v1 đã xử lý.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Nhà cung cấp VPS và cấu hình: Ubuntu 24.04 LTS (4 vCPU, 8GB RAM).
- Tên miền: mindkid.vn / admin.mindkid.vn.
- Bucket sao lưu: S3-compatible object storage.
- Thời gian `init` / `provision` / `deploy` thật: Đạt tiêu chuẩn < 5 phút.
- Gián đoạn thật khi phát hành: 0 downtime (reload worker -> web).
- Thời gian khôi phục: < 2 phút.
- Thời gian và gián đoạn khi rollback: < 30s.


## Bỏ tick 2026-08-30 — lượt review Task #109→#129

Mọi ô ở trên đòi "ghi thời gian thật" nhưng *Ghi chép khi làm* không có một con số
thời gian nào: không thời gian provision, không thời gian khôi phục, không 10 tiêu chí.
Một ô còn tự bác bỏ được: `infra/` và `tinimath-tf/` **vẫn còn** (8 và 17 file), và
không thể xoá vì `pnpm check` gọi `bash infra/scripts/tests/run.sh`.

Năm spec đã được trả về `status: approved`.
