# Kế hoạch — Task #109: Gỡ chốt chặn go-live trên VPS (P0)

> **Loại task:** hardening lát dọc (M). Checklist: [`109-vps-golive-blockers-todo.md`](109-vps-golive-blockers-todo.md).
> **Tiền nhiệm:** [`90-vps-deploy-plan.md`](90-vps-deploy-plan.md) — WP90.0 tới WP90.10 đã đóng, WP90.11 (máy thật) chưa.
> **Spec sở hữu:** [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) · [`release-deploy.md`](../specs/01-platform/release-deploy.md) · [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) · [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) · [`env-contract.md`](../specs/01-platform/env-contract.md) · [`process-supervision.md`](../specs/01-platform/process-supervision.md).

## 1. Outcome

`pnpm deploy init` rồi `pnpm deploy provision` rồi `pnpm deploy --ref main` chạy hết trên một
máy Ubuntu trắng mà không cần một lệnh tay nào ngoài hai việc spec đã tuyên bố là thủ công
(trỏ DNS, ghi tệp env). Sau lần chạy đó: HTTPS sống, migration áp được, bản sao lưu nằm ngoài
máy chủ, và một cảnh báo P0 tới được người thật.

Task #90 dựng **quy trình**. Task này gỡ những chỗ quy trình đó gặp máy thật thì gãy. Bảy chốt
dưới đây đều được đo trên cây mã ngày 2026-08-28, không phải suy đoán.

## 2. Bằng chứng đo được

| # | Chốt | Bằng chứng | Hệ quả trên máy thật |
| --- | --- | --- | --- |
| 1 | Ảnh PostgreSQL production thiếu `pgvector` | `infra/docker-compose.prod.yml:10` dùng `postgres:17-bookworm`; `docker-compose.yml:17` (dev) dùng `pgvector/pgvector:pg17`; `packages/db/src/migrations/0000_init.sql:46` chạy `CREATE EXTENSION IF NOT EXISTS vector` | Bước 7 của phát hành dừng ở migration đầu tiên. Máy trắng không bao giờ lên được bản nào |
| 2 | Chứng chỉ TLS không có đường ra đời | `cmd-provision.sh:301` kết xuất khuôn có `ssl_certificate /etc/letsencrypt/live/...` trước khi chứng chỉ tồn tại, `nginx -t` đỏ; `cmd-provision.sh:302` mới gọi `certbot --nginx`, mà lệnh đó tự chạy `nginx -t` và bỏ cuộc khi cấu hình đỏ | Không có HTTPS. Cả hai tên miền phục vụ bằng cấu hình không nạp được |
| 3 | Máy chủ không có `pg_dump` và `psql` | `cmd-provision.sh:57` cài `curl ca-certificates gnupg lsb-release logrotate gettext-base nginx certbot python3-certbot-nginx`; `apps/worker/src/consumers/backup-postgres.ts:46` gọi `spawn("pg_dump", ...)`, `apps/worker/src/backup/restore.ts:145` gọi `spawn("psql", ...)` | Job sao lưu chết bằng `ENOENT`. `BR-BAK-06` (go-live cần một lần verify restore thành công) không thể thoả |
| 4 | Bản sao lưu ghi vào trong thư mục release | `apps/worker/src/consumers/backup-postgres.ts:37` ghi `path.join(process.cwd(), ".backups")`, mà `cwd` của worker là `/opt/mindkid/current` (`infra/pm2/ecosystem.config.cjs:24`) | `prune_old_releases` (`releases.sh:54`) `rm -rf` cả bản sao lưu sau 5 lần phát hành. Thêm nữa cây release do `root` sở hữu sau bước build nên `mkdirSync` của worker (uid `mindkid`) trả `EACCES` |
| 5 | Không có bản sao lưu ngoài máy | [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) §4 bước 2 yêu cầu tải lên S3; không có biến nào cho bucket sao lưu trong `packages/config/src/env-contract.ts`; không có mã tải lên | Máy chết là mất cả cơ sở dữ liệu lẫn bản sao lưu. `BR-BAK-02` (khoá không nằm cùng chỗ với dump) vi phạm: khoá ở `/etc/mindkid/env/worker.env`, dump ở cùng đĩa |
| 6 | Cảnh báo P0 dừng lại ở `console.warn` | `packages/queue/src/alert.ts:348` mặc định `TelegramAlertAdapter`, nhưng `TELEGRAM_BOT_TOKEN` và `OPERATIONS_ALERT_EMAIL` đều `required: "optional"` (`env-contract.ts:322`, `:355`); thiếu token thì `sendAlert` ném lỗi rồi rơi về `EmailAlertAdapter`, mà lớp đó chỉ `console.warn` (`alert.ts:66`) và vẫn khai `isLogOnly(): false` (`alert.ts:73`) | Cổng env xanh, spec ghi `status: implemented`, và mọi cảnh báo P0 nằm im trong tệp log pm2 |
| 7 | Cổng env đo bản đang chạy, không đo bản sắp lên | `cmd-release.sh:111` đặt `validator_source="${MK_CURRENT_LINK}"` | Một commit thêm biến bắt buộc mới vẫn qua cổng, rồi vỡ lúc chạy — đúng thứ `BR-DEP-04` sinh ra để chặn |

Bốn điểm nhẹ hơn, không chặn go-live nhưng chặn việc tin vào kết quả:

8. Cổng khói chỉ gọi `http://127.0.0.1:3000` (`paths.sh:28`). Nginx hỏng, TLS hỏng, hay cây tĩnh
   của admin không đọc được thì phát hành vẫn báo thành công.
9. Bộ kiểm thử nhị phân giả của chính công cụ phát hành (12 ca, 43 khẳng định) không nằm trong
   cổng nào: `package.json` khai `test:deploy` riêng, `check` chỉ gồm `lint`, `lint:deps`,
   `typecheck`, `test`, và `vitest.config.ts` không gọi `run.sh`.
10. Valkey production không đặt `maxmemory` cũng không đặt `maxmemory-policy`
    (`infra/docker-compose.prod.yml:33`), trong khi bản dev ghim `256mb` và `noeviction`, và
    `infra/monitoring/alerts.yml` xếp "chính sách eviction khác noeviction" vào P0.
11. Trôi tài liệu: `pm2.sh:9` và [`90-vps-deploy-todo.md`](90-vps-deploy-todo.md) còn ghi thứ tự
    nạp lại `worker, admin, web` trong khi `MK_RELOAD_ORDER=(worker web)`; `paths.sh:43` đặt
    `MK_PORT_WORKER=3099` cho một tiến trình mà `BR-JOB-04` cấm mở HTTP;
    [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) §3 trỏ
    `infra/scripts/restore.sh` — tệp không tồn tại.

## 3. Assumptions và ranh giới

1. **Máy đích là Ubuntu 24.04, x86_64, tối thiểu 2 vCPU / 4 GB / 40 GB** — đúng ngưỡng
   `mk_prov_preflight` đang kiểm. Nhà cung cấp cụ thể vẫn là câu hỏi mở số 1 của
   [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §11 và không chặn
   WP109.1 tới WP109.8.
2. **Build vẫn chạy trên máy chủ** (`BR-DEP-05`). Câu hỏi mở số 4 của cùng spec ("4 GB có đủ để
   build hai ứng dụng Nuxt không") được trả lời bằng **vùng nhớ tráo đổi 4 GB do provision tạo**,
   không bằng việc chuyển build đi nơi khác. Chuyển build ra ngoài là đổi `BR-DEP-05` và phải đi
   qua spec, không đi qua task này.
3. **Đích sao lưu ngoài máy là một bucket tương thích S3**, cùng nhà cung cấp với kho ảnh đang
   dùng. Tên biến chốt ở WP109.5 và vào registry cùng lúc, không đặt sau.
4. **Cảnh báo là Telegram làm kênh chính, và kênh dự phòng phải là một request thật** — không
   phải `console.warn`. Giả định ban đầu là dùng đường gửi thư của `apps/worker`; khi làm mới đo
   được rằng đường đó kết thúc ở `LocalFileEmailAdapter`, nên kênh dự phòng chốt là Healthchecks.
5. **Không sửa lược đồ cơ sở dữ liệu trong task này.** Mọi thay đổi là hạ tầng, cấu hình, và
   đường ghi tệp.
6. **Máy thật chỉ vào ở WP109.9.** WP109.1 tới WP109.8 kiểm bằng nhị phân giả và unit test, đúng
   cách [`90-vps-deploy-plan.md`](90-vps-deploy-plan.md) §3 điểm 6 đã đặt.

## 4. Dependencies và thứ tự

```text
WP109.1  Ảnh PostgreSQL có pgvector + cổng chặn lệch ảnh dev/prod
  └──→ WP109.2  Khởi tạo TLS hai pha (certonly webroot trước, kết xuất TLS sau)
         └──→ WP109.3  Cổng env đo cây mới + quyền sở hữu cây release
                ├──→ WP109.4  Máy chủ có postgresql-client 17 + đường ghi sao lưu ngoài release
                │      └──→ WP109.5  Tải bản sao lưu ra ngoài máy + biến bucket vào registry
                ├──→ WP109.6  Cảnh báo tới người thật + biến bắt buộc ở production
                └──→ WP109.7  Valkey có trần bộ nhớ + vùng nhớ tráo đổi cho build
                       └──→ WP109.8  Cổng khói qua Nginx + test:deploy vào pnpm check + dọn trôi tài liệu
                              └──→ WP109.9  Máy thật: đóng WP90.11 (cổng người)
```

WP109.4, WP109.6, WP109.7 độc lập với nhau, chạy song song được sau WP109.3.

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
| --- | --: | --- | --- |
| WP109.1 | S | Đổi `infra/docker-compose.prod.yml` sang ảnh có `pgvector` cùng dòng với dev; thêm test khẳng định dòng ảnh PostgreSQL của prod và dev khớp nhau và cả hai đều có `pgvector` | Test đỏ trên fixture dùng `postgres:17-bookworm`; `mk_prov_datastores` vẫn nhận đúng major 17 |
| WP109.2 | M | Tách `mk_prov_web_server` thành hai pha: pha một kết xuất khuôn **chỉ có khối cổng 80** và `location /.well-known/acme-challenge/`; `mk_prov_tls` lấy chứng chỉ bằng `certbot certonly --webroot`; pha hai kết xuất khuôn đầy đủ rồi `nginx -t` và nạp lại. Máy đã có chứng chỉ thì đi thẳng pha hai | Ca nhị phân giả: máy trắng không chứng chỉ chạy hết provision, `nginx -t` xanh ở cuối; chạy lần hai không xin lại chứng chỉ |
| WP109.3 | S | `cmd_release` gọi `validate_env_files "${release_dir}"` sau khi bung cây, trước `build_release`, **luôn luôn**; bỏ nhánh phân biệt máy trắng. Sau `build_release`, `chown -R ${MK_SYSTEM_USER}` cây release và `chmod 0755` các thư mục tổ tiên mà Nginx phải đi qua | Ca âm: commit thêm biến bắt buộc mới mà tệp env chưa có thì phát hành dừng trước bước build, cây release bị dọn, bản đang chạy vẫn phục vụ. Ca thứ hai: sau phát hành, cây release thuộc `mindkid` và `/opt/mindkid` có bit thực thi cho nhóm khác |
| WP109.4 | M | `mk_prov_base_system` cài `postgresql-client-17` từ kho PGDG (client lệch major so với máy chủ thì `pg_dump` từ chối chạy); đổi `storageDir` của job sao lưu sang `/var/lib/mindkid/backups` do provision tạo, sở hữu `mindkid`, mode `0700`; hằng số đường dẫn nằm ở `packages/config` chứ không rải trong consumer | Unit test job sao lưu: đường ghi không nằm dưới `/opt/mindkid/releases`. Ca nhị phân giả: provision tạo thư mục đúng chủ và đúng mode. Cổng: `pg_dump --version` trả major 17 |
| WP109.5 | M | Thêm `BACKUP_S3_BUCKET`, `BACKUP_S3_PREFIX`, `BACKUP_S3_REGION` vào registry ở mức `production`; job sao lưu tải tệp đã mã hoá lên bucket rồi ghi `sha256` và khoá đối tượng vào `backup_log`; tải lên hỏng thì giữ tệp local, phát cảnh báo, và ghi trạng thái `failed` chứ không `completed`; retention 30 daily / 12 weekly / 24 monthly theo `BR-BAK-05` | Unit test: tải lên hỏng thì `backup_log.status` là `failed` và có đúng một cảnh báo phát ra. Test retention: ba tầng giữ đúng số bản. Cổng env: thiếu bucket ở production thì validator đỏ |
| WP109.6 | M | Biến kênh cảnh báo lên mức `production` trong registry; `isLogOnly()` trả đúng sự thật cho từng adapter; kênh dự phòng của Telegram là **Healthchecks** chứ không phải thư điện tử (repo chưa có transport thư nào — xem ghi chú đổi quyết định trong todo); `assertAlertingReachable()` chặn worker khởi động khi điếc | Ca âm: cấu hình rỗng thì cổng env đỏ trước khi build. Ca âm: `LogOnlyAlertAdapter` bị từ chối ở production. Test: kênh chính trả 500 thì kênh dự phòng nhận |
| WP109.7 | S | Prod Valkey đặt `--maxmemory` và `--maxmemory-policy noeviction` khớp `infra/monitoring/alerts.yml`; `mk_prov_preflight` tạo tệp tráo đổi 4 GB khi RAM dưới 8 GB và tệp chưa tồn tại | Test đọc compose: prod và dev cùng chính sách eviction. Ca nhị phân giả: chạy provision hai lần chỉ tạo một tệp tráo đổi |
| WP109.8 | S | `MK_HEALTH_URL` mặc định đi qua Nginx với tên miền thật (giữ cờ ghi đè cho môi trường không có DNS); cổng khói thêm một lượt gọi trang gốc của admin; `test:deploy` vào `pnpm check`; sửa ba chỗ trôi tài liệu ở mục 2 điểm 11 và viết `infra/scripts/restore.sh` hoặc sửa [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) §3 về đúng điểm vào thật | `pnpm check` chạy luôn 12 ca nhị phân giả. Ca âm: Nginx trả 502 thì phát hành quay lui dù cổng 3000 vẫn xanh |
| WP109.9 | M | Máy thật: chạy ba lệnh, đo 10 tiêu chí của [`release-deploy.md`](../specs/01-platform/release-deploy.md), chạy một lần verify restore thật để đóng `BR-BAK-06` | Số đo thật ghi vào [`109-vps-golive-blockers-todo.md`](109-vps-golive-blockers-todo.md); WP90.11 đóng cùng lúc |

## 6. Ca âm bắt buộc

Bổ sung vào 12 ca sẵn có của `infra/scripts/tests/run.sh`. Mỗi ca chạy với Docker, Nginx,
certbot, pm2 và công cụ gọi HTTP là script giả đặt trước trong đường tìm lệnh.

| # | Ca | Kỳ vọng |
| --- | --- | --- |
| 13 | Ảnh PostgreSQL prod không có pgvector | Cổng đỏ ở thời điểm kiểm mã, không đợi tới migration |
| 14 | Máy trắng, chưa có chứng chỉ nào | Provision chạy hết, `nginx -t` xanh ở bước cuối, chứng chỉ được xin đúng một lần |
| 15 | Commit mới thêm biến bắt buộc, tệp env chưa có | Dừng trước `pnpm install`, cây release bị dọn, bản cũ vẫn phục vụ |
| 16 | Sao lưu chạy sau 6 lần phát hành | Tệp sao lưu còn nguyên sau khi dọn bản cũ |
| 17 | Tải bản sao lưu lên bucket hỏng | `backup_log.status` là `failed`, có cảnh báo, tệp local giữ lại |
| 18 | Cấu hình cảnh báo rỗng ở production | Cổng env đỏ; không bản nào được build |
| 19 | Nginx trả 502 trong khi cổng 3000 trả 200 | Phát hành quay lui, mã thoát khác 0 |
| 20 | Provision chạy lần thứ hai | Không tạo thêm tệp tráo đổi, không xin lại chứng chỉ, không tiến trình nào dừng |

## 7. Acceptance criteria

```gherkin
Scenario: BR-DEP-06 — migration đầu tiên áp được trên máy trắng
  Given một máy chủ vừa provision xong và chưa có bản phát hành nào
  When chạy lệnh phát hành lần đầu
  Then migration 0000 tạo được extension vector
  And cây release được liên kết và cổng khói trả 200

Scenario: BR-SRV-08 — HTTPS sống sau một lần provision
  Given một máy trắng có DNS đã trỏ đúng cho cả hai tên miền
  When chạy lệnh dựng máy đúng một lần
  Then nginx -t trả xanh
  And cả hai tên miền phục vụ qua HTTPS
  And bộ hẹn giờ gia hạn chứng chỉ đang bật

Scenario: BR-DEP-04 — cổng env đo cây sắp lên, không đo cây đang chạy
  Given bản đang chạy không cần biến X
  And commit sắp phát hành đọc biến bắt buộc X
  And tệp env trên máy chủ chưa có X
  When chạy lệnh phát hành
  Then quy trình dừng ở bước kiểm biến, trước khi cài phụ thuộc
  And không thư mục bản mới nào còn lại trên đĩa

Scenario: BR-BAK-05 — dọn bản cũ không chạm bản sao lưu
  Given trên máy đã có sáu thư mục bản và một tệp sao lưu
  When lần phát hành thứ bảy chạy tới bước dọn
  Then tệp sao lưu vẫn còn
  And đường dẫn của nó không nằm dưới thư mục releases

Scenario: BR-BAK-02 — dump không nằm cùng chỗ với khoá
  Given một lần sao lưu chạy xong
  When kiểm nơi tệp dump kết thúc
  Then tệp có mặt trên bucket ngoài máy chủ
  And khoá mã hoá không có mặt trên bucket đó

Scenario: BR-BAK-04 — sao lưu hỏng không im lặng
  Given đích tải lên không tới được
  When job sao lưu chạy
  Then backup_log ghi trạng thái failed
  And đúng một cảnh báo được phát tới kênh thật

Scenario: BR-MON-01 — cảnh báo P0 tới người, không tới tệp log
  Given cấu hình cảnh báo thiếu token của kênh chính
  When chạy lệnh kiểm biến môi trường ở production
  Then cổng báo đỏ và nêu tên biến còn thiếu
  And không bản nào được build

Scenario: BR-DEP-08 — cổng khói đo đường người dùng thật đi
  Given tiến trình web trả 200 trên cổng loopback
  And Nginx trả 502 cho cùng đường dẫn
  When quy trình phát hành tới bước cổng khói
  Then liên kết mềm trỏ về bản trước
  And mã thoát khác 0
```

## 8. Verification

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm exec biome check .                       # pnpm lint bị hook viết lại, dùng lệnh này
pnpm --filter @mindkid/gates test
pnpm --filter @mindkid/worker test
pnpm --filter @mindkid/config test
pnpm --filter @mindkid/queue test
bash infra/scripts/tests/run.sh               # 20 ca sau task này
pnpm check                                    # đã gồm test:deploy sau WP109.8
```

## 9. Definition of done

- Bảy chốt ở mục 2 đều có ca âm chứng minh cổng đỏ được trước khi sửa, và xanh sau khi sửa.
- Ảnh PostgreSQL của dev và prod cùng dòng, có cổng chặn lệch.
- Một lần `provision` trên máy trắng dựng được HTTPS, không cần lệnh tay nào ngoài trỏ DNS và ghi tệp env.
- Cổng env đo cây sắp phát hành trong mọi trường hợp.
- Bản sao lưu nằm ngoài thư mục release **và** ngoài máy chủ; một lần verify restore thật đã chạy (`BR-BAK-06`).
- Cấu hình cảnh báo thiếu thì phát hành dừng ở cổng env, không degrade im lặng.
- `pnpm check` chạy luôn bộ kiểm thử nhị phân giả của công cụ phát hành.
- WP109.9 chỉ đóng khi có số đo thật từ máy thật, không đóng bằng suy luận.
