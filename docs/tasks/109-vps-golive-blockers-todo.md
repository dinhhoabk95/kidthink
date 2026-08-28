# Todo — Task #109: Gỡ chốt chặn go-live trên VPS (P0)

> Lý do, bằng chứng đo được, đồ thị phụ thuộc: [`109-vps-golive-blockers-plan.md`](109-vps-golive-blockers-plan.md).
> Tiền nhiệm còn mở: WP90.11 của [`90-vps-deploy-todo.md`](90-vps-deploy-todo.md).
>
> Mọi lệnh chạy từ thư mục gốc của monorepo, đặt lại đường dẫn Node trước:
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Dùng `pnpm exec biome check .` chứ không `pnpm lint` — hook viết lại lệnh đó thành eslint.

## Preflight

- [x] Đọc lại bốn spec sở hữu: [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) · [`release-deploy.md`](../specs/01-platform/release-deploy.md) · [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) · [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md).
- [x] Xác nhận lại bảy số đo ở mục 2 của plan trên cây mã hiện tại (chúng đo ngày 2026-08-28).
- [ ] Chốt nhà cung cấp VPS và cấu hình máy — câu hỏi mở số 1 của [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §11. Chặn WP109.9, không chặn phần còn lại.
- [ ] Chốt tên miền thật và ai giữ DNS. Chặn WP109.9.
- [ ] Chốt đích sao lưu ngoài máy (nhà cung cấp bucket, vùng). Chặn WP109.5.

## WP109.1 — Ảnh PostgreSQL có pgvector

- [x] Đổi `infra/docker-compose.prod.yml` sang ảnh cùng dòng với dev, có sẵn `pgvector`.
- [x] Test mới ở `packages/gates`: dòng ảnh PostgreSQL của `docker-compose.yml` và `infra/docker-compose.prod.yml` cùng major, và cả hai đều cung cấp `pgvector`.
- [x] Fixture sai cố ý dùng `postgres:17-bookworm`; khẳng định cổng **đỏ** trên fixture đó.
- [x] Xác nhận `mk_prov_datastores` vẫn đọc đúng major 17 từ ảnh mới (chuỗi `postgres --version` không đổi dạng).

**Checkpoint 1** — dừng lại, chạy `pnpm --filter @mindkid/gates test`. Không sang WP109.2 khi cổng này chưa đỏ được trên fixture.

## WP109.2 — Khởi tạo TLS hai pha

- [x] Tách khuôn Nginx thành phần cổng 80 (luôn kết xuất được) và phần TLS (chỉ kết xuất khi chứng chỉ tồn tại).
- [x] `mk_prov_web_server` pha một: kết xuất phần cổng 80, `nginx -t`, nạp lại. Đây là trạng thái `certbot` cần để làm việc.
- [x] `mk_prov_tls` dùng `certbot certonly --webroot -w /var/www/html` thay cho `--nginx`: không sửa cấu hình của người khác, và không cần cấu hình TLS có sẵn.
- [x] `mk_prov_web_server` pha hai: chứng chỉ đã có thì kết xuất khuôn đầy đủ, `nginx -t`, nạp lại. `nginx -t` đỏ ở pha hai là lỗi dừng, **không** phải cảnh báo.
- [x] Bỏ dòng cảnh báo "chuyện này bình thường khi chưa có chứng chỉ" — sau thay đổi này nó không còn đúng.
- [x] Ca nhị phân giả 14: máy trắng chạy hết provision, `nginx -t` xanh ở bước cuối, `certbot` được gọi đúng một lần cho mỗi tên miền.
- [x] Ca nhị phân giả 20 phần chứng chỉ: chạy lần hai không gọi lại `certbot`.

**Checkpoint 2** — `bash infra/scripts/tests/run.sh` xanh với hai ca mới.

## WP109.3 — Cổng env đo cây mới và quyền sở hữu cây release

- [x] `cmd_release` gọi `validate_env_files "${release_dir}"` sau `export_commit_tree`, trước `build_release`, trong **mọi** trường hợp; bỏ nhánh `validator_source` phân biệt máy trắng.
- [x] Cây release bị dọn khi cổng env đỏ (đường thoát này đã có, giữ nguyên hành vi).
- [x] Sau `build_release` thành công: `chown -R ${MK_SYSTEM_USER}:${MK_SYSTEM_USER}` cây release — container build chạy bằng `root` nên mọi tệp sinh ra thuộc `root`.
- [x] `mk_init_layout` đặt tường minh `chmod 0755 ${MK_ROOT}`: `useradd --create-home` để lại mode phụ thuộc `HOME_MODE` của máy, và `0700` thì Nginx không đi qua được để phục vụ `/_nuxt/` lẫn cây tĩnh của admin.
- [x] Ca nhị phân giả 15: commit thêm biến bắt buộc mới, tệp env chưa có thì dừng trước `pnpm install`, cây release bị dọn, liên kết mềm không đổi.
- [x] Ca nhị phân giả mới: sau phát hành, cây release thuộc người dùng hệ thống, không thuộc `root`.

**Checkpoint 3** — `pnpm check` xanh. WP109.4, WP109.6, WP109.7 chạy song song được từ đây.

## WP109.4 — Máy chủ có công cụ sao lưu, và sao lưu ghi ngoài cây release

- [x] `mk_prov_base_system` thêm kho PGDG và cài `postgresql-client-17`. Client lệch major thì `pg_dump` từ chối chạy với máy chủ 17, nên `postgresql-client` mặc định của Debian không đủ.
- [x] Bước báo cáo của provision in phiên bản `pg_dump`; lệch major thì dừng, cùng cách `mk_prov_check_version` đang xử lý các thành phần khác.
- [x] `mk_init_layout` tạo `/var/lib/mindkid/backups`, chủ `mindkid`, mode `0700`.
- [x] Hằng số đường dẫn sao lưu về `packages/config`; `apps/worker/src/consumers/backup-postgres.ts` và `apps/worker/src/backup/restore.ts` đọc từ đó, không tự ghép `process.cwd()`.
- [x] Unit test: đường ghi của job sao lưu không nằm dưới `/opt/mindkid/releases` và không phụ thuộc `cwd`.
- [x] Ca nhị phân giả 16: sáu lần phát hành rồi dọn bản cũ, tệp sao lưu vẫn còn.

## WP109.5 — Bản sao lưu rời khỏi máy chủ

- [x] Thêm `BACKUP_S3_BUCKET`, `BACKUP_S3_PREFIX`, `BACKUP_S3_REGION` vào `packages/config/src/env-contract.ts` ở mức `production`, ứng dụng `worker`.
- [x] Sinh lại `.env.example` từ registry (cổng `lint:env-example` chặn sửa tay).
- [x] Job sao lưu tải tệp đã mã hoá lên bucket theo đường `postgres/YYYY/MM/DD` của [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) §4 bước 2.
- [x] Ghi `sha256` và khoá đối tượng vào `backup_log` (`BR-BAK-03`).
- [x] Tải lên hỏng: giữ tệp local, phát cảnh báo, ghi trạng thái `failed`. Cấm — NEVER ghi `completed` khi tệp chưa rời máy.
- [x] Retention ba tầng 30 daily / 12 weekly / 24 monthly (`BR-BAK-05`), thay cho hằng số một tầng hiện có.
- [x] Khoá mã hoá Cấm — NEVER được tải lên cùng bucket với dump (`BR-BAK-02`); thêm ca âm khẳng định điều đó.
- [x] Ca âm 17: đích tải lên không tới được thì `backup_log.status` là `failed` và có đúng một cảnh báo.
- [x] Cổng env: thiếu biến bucket ở production thì validator đỏ.

## WP109.6 — Cảnh báo tới người thật

- [x] `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `OPERATIONS_ALERT_EMAIL` lên mức `production` trong registry.
- [x] ĐỔI QUYẾT ĐỊNH so với plan: `EmailAlertAdapter` **không** gửi thư thật, vì repo không có transport thư nào — đường thông báo kết thúc ở `LocalFileEmailAdapter`. Giả vờ có kênh thư là lặp lại đúng lỗi task này đi sửa. Thay vào đó kênh dự phòng mặc định của Telegram đổi sang **Healthchecks** (một request HTTPS thật), và `HEALTHCHECKS_PING_URL` lên mức `production`.
- [x] `isLogOnly()` trả đúng sự thật cho từng adapter: một adapter chỉ ghi log Cấm — NEVER khai `false`.
- [x] Ca âm 18: cấu hình cảnh báo rỗng ở production thì `pnpm deploy env` đỏ và không bản nào được build.
- [x] Ca âm: `LogOnlyAlertAdapter` bị cổng từ chối ở production.
- [x] Test: kênh chính trả 500 thì kênh dự phòng nhận, và có bản ghi sự cố.
- [x] `assertAlertingReachable()` chặn `apps/worker` khởi động ở production khi không kênh nào tới được người; ca âm khẳng định nó ném lỗi.
- [x] Cập nhật [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) "Hiện trạng đo được": trước task này mọi cảnh báo dừng ở `console.warn` dù spec ghi `status: implemented`.

## WP109.7 — Trần bộ nhớ và vùng nhớ tráo đổi

- [x] Prod Valkey đặt `--maxmemory` và `--maxmemory-policy noeviction`, khớp chính sách `infra/monitoring/alerts.yml` xếp vào P0.
- [x] Test đọc compose: prod và dev cùng chính sách eviction.
- [x] `mk_prov_preflight` tạo tệp tráo đổi 4 GB khi RAM dưới 8 GB và tệp chưa tồn tại — đây là câu trả lời cho câu hỏi mở số 4 của [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §11.
- [x] Ghi câu trả lời đó vào §11 của spec trong cùng thay đổi, kèm số đo bộ nhớ đỉnh lúc build.
- [ ] Ca nhị phân giả 20 phần tráo đổi (cần root; đo ở WP109.9): chạy provision hai lần chỉ tạo một tệp.

## WP109.8 — Cổng khói thật và cổng tự động

- [x] `MK_HEALTH_URL` mặc định đi qua Nginx bằng tên miền thật; giữ biến ghi đè cho môi trường chưa có DNS.
- [x] Cổng khói thêm một lượt gọi trang gốc của admin — đường tĩnh đó không có tiến trình nào canh, nên không lượt gọi nào khác chạm tới.
- [x] `test:deploy` vào `pnpm check`.
- [x] Sửa `pm2.sh` mục thứ tự nạp lại: `worker` rồi `web`, admin không còn tiến trình.
- [x] Sửa cùng chỗ trôi đó trong [`90-vps-deploy-todo.md`](90-vps-deploy-todo.md) WP90.7 và [`release-deploy.md`](../specs/01-platform/release-deploy.md) §7.2.
- [x] Bỏ `MK_PORT_WORKER` khỏi biến truyền cho tiến trình worker, hoặc ghi rõ vì sao một tiến trình bị `BR-JOB-04` cấm mở HTTP lại nhận `PORT`.
- [x] [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) §3 trỏ `infra/scripts/restore.sh` — tệp không tồn tại. Viết tệp đó, hoặc sửa spec về đúng điểm vào thật.
- [x] Ca âm 19: Nginx trả 502 trong khi cổng 3000 trả 200 thì phát hành quay lui, mã thoát khác 0.

### Phát hiện thêm khi nối `test:deploy` vào cổng

Bộ harness đã **đỏ từ trước**, và không cổng nào chạy nó nên không ai biết. Ba nguyên nhân, cả ba
đều là lỗi thật chứ không phải nhiễu:

- [x] Fixture không sao chép `packages/config/package.json`, nên `#src/env-contract` — cách
      validator import từ sau Task #105 — không resolve được. Mọi lần phát hành trong harness
      chết ở cổng env với một lỗi resolution **trông y hệt** vi phạm hợp đồng.
- [x] `make-env.ts` sinh `https://` cho mọi biến `kind: "url"`, trong khi `BR-ENV-13` ràng buộc
      giao thức theo từng biến. `DATABASE_URL=https://...` luôn đỏ. Nay nó đọc `urlProtocols`
      và `enumValues` từ chính registry.
- [x] `@mindkid/config` không có trong `devDependencies` của gốc, nên `node` không resolve được
      nó. `tsx` thì được (qua `paths` của tsconfig), vì thế `pnpm services` vẫn xanh và chỗ hỏng
      chỉ lộ ra ở đường chạy bằng `node` thuần.
- [x] `release_dir_name` chỉ phân giải tới giây: hai lần phát hành cùng commit trong một giây
      trùng tên thư mục và lần sau bung đè lên lần trước. Nay có hậu tố số; `validateReleaseName`
      nhận thêm dạng đó và có ca âm cho hậu tố không hợp lệ.

**Checkpoint 4** — `pnpm check` xanh, `bash infra/scripts/tests/run.sh` đủ 18 ca / 64 khẳng định. Chỉ sau đây mới đụng máy thật.

## WP109.9 — Máy thật, cổng người (đóng luôn WP90.11)

- [ ] Ghi `/etc/mindkid/env/{web,admin,worker}.env` và `compose/datastore.env`, quyền `0600 root:root`.
- [ ] `pnpm deploy init --host <tên> --remote <url>` trên máy trắng; ghi thời gian thật: ...
- [ ] `pnpm deploy provision --host <tên> --site-domain <d> --admin-domain <d>`; ghi thời gian thật: ...
- [ ] Khẳng định HTTPS sống trên cả hai tên miền sau đúng một lần provision; ghi kết quả `nginx -t`: ...
- [ ] `pnpm deploy --host <tên> --ref main`; ghi thời gian thật và gián đoạn đo được: ...
- [ ] Chạy lại provision lần hai; khẳng định không tiến trình nào bị dừng (`BR-SRV-01`).
- [ ] Chạy một lần sao lưu thật; khẳng định tệp có mặt trên bucket ngoài máy; ghi kích thước và `sha256`: ...
- [ ] Chạy một lần verify restore thật để đóng `BR-BAK-06`; ghi thời gian khôi phục đo được (RTO thật): ...
- [ ] Gửi một cảnh báo thử; khẳng định nó tới kênh thật, không dừng ở tệp log.
- [ ] Đo 10 tiêu chí ở [`release-deploy.md`](../specs/01-platform/release-deploy.md); ghi số đo vào đây, Cấm — NEVER ghi "đã xong" thay cho số đo.
- [ ] Đánh dấu WP90.11 của [`90-vps-deploy-todo.md`](90-vps-deploy-todo.md) đóng, dẫn về mục này.
- [ ] Mở PR cho người review diff, không tự merge.

## Dọn dẹp kèm theo (không chặn go-live)

- [ ] `/Users/macbook/tinimath/infra/` và `/Users/macbook/tinimath/tinimath-tf/` là hạ tầng v1 (AWS EC2, tên miền `mamnon.site`, `terraform.tfstate` rỗng nghĩa là đã huỷ). Xoá hoặc chuyển vào kho lưu trữ để không ai đọc nhầm là hạ tầng đang chạy.
- [x] `scripts/deploy/remote-exec.ts` chú thích "không có shell đầu kia phân tích lại" — `ssh` luôn ghép tham số rồi giao cho shell đăng nhập. Thứ giữ an toàn là lớp kiểm giá trị ngay trên đó; sửa chú thích cho đúng lý do.
- [x] `scripts/deploy/cli.ts` chú thích về chế độ in kế hoạch bị đảo: kế hoạch phát hành in **trên máy chủ**, các verb khác mới in tại máy trạm.
