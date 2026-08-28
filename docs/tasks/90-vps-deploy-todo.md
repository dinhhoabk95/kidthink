# Todo — Task #90: Triển khai lên VPS bằng một lệnh (P0)

> Lý do, đồ thị phụ thuộc, work package: [`90-vps-deploy-plan.md`](90-vps-deploy-plan.md).
> Kết quả review ngày 2026-08-19 và quyết định sửa: [`90-vps-deploy-fixes.md`](90-vps-deploy-fixes.md).
> So sánh nginx với Caddy: [`90-caddy-vs-nginx.md`](90-caddy-vs-nginx.md).
>
> Mọi lệnh chạy từ thư mục gốc của monorepo, đặt lại đường dẫn Node trước:
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Dùng `pnpm exec biome check .` chứ không `pnpm lint` — hook viết lại lệnh đó thành eslint.

## Preflight

- [x] Đọc năm spec sở hữu: [`env-contract.md`](../specs/01-platform/env-contract.md) · [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) · [`process-supervision.md`](../specs/01-platform/process-supervision.md) · [`release-deploy.md`](../specs/01-platform/release-deploy.md) · [`release-rollback.md`](../specs/01-platform/release-rollback.md).
- [x] Đo lại 12 số đo ở đặc tả task.
- [x] Chốt tên thương hiệu dùng cho đường dẫn máy chủ và người dùng hệ thống (`mindkid`).
- [x] Chốt gốc đường dẫn máy chủ theo [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §7.1: `/opt/mindkid`.

## WP90.0 — Năm spec draft sang approved

- [x] Đổi `status: draft` sang `status: approved` cho năm spec.
- [x] `pnpm --filter @mindkid/gates test` xanh.

## WP90.1 — Registry biến môi trường và validator

- [x] `packages/config/src/env-contract.ts`: 45 biến, mỗi biến có mã đọc thật (đo 2026-08-19).
- [x] `packages/config/src/env-file.ts`: bộ đọc tệp env dùng chung cho cổng và test.
- [x] `validateEnvFile(app, parsed, isProduction)` nhận `Map`, **không** đọc `process.env` (`BR-ENV-06`).
- [x] Thêm mức `optional` vào enum `required`; cập nhật [`env-contract.md`](../specs/01-platform/env-contract.md) §7.1 trong cùng thay đổi.
- [x] 18 unit test: thiếu · rỗng · secret dưới 32 byte · URL sai · cổng sai · chỉ bắt buộc ở production · biến lạ chỉ cảnh báo · `BR-ENV-04` · `BR-ENV-06` · năm ca của bộ đọc tệp.

## WP90.2 — Cổng lint:env-names

- [x] `packages/gates/src/lint-env-names.ts` bắt tên đồng nghĩa ở **bốn** dạng đọc: thuộc tính, ngoặc vuông, `requireEnv()`, và giải cấu trúc.
- [x] Bắt mặc định cứng cho biến quyết định danh tính hoặc tính xác thực (`BR-ENV-03`).
- [x] Fixture sai cố ý ở `packages/gates/tests/fixtures/env-names/`; test khẳng định cổng **đỏ** trên fixture và **xanh** trên fixture đúng.
- [x] Cổng quét toàn cây trong 0,6 giây (regex biên dịch một lần, có bộ lọc dòng).

## WP90.3 — Gộp tên đồng nghĩa và bỏ mặc định cứng

- [x] Gộp sáu nhóm về tên chốt ở [`env-contract.md`](../specs/01-platform/env-contract.md) §7.2.
- [x] Bỏ **22** mặc định cứng còn sót: 10 địa chỉ site, 5 khoá mã hoá MFA, khoá ký URL tài sản, tên hai bucket, hai bí mật OAuth, mật khẩu admin gieo dữ liệu, hai chuỗi kết nối Valkey.
- [x] `packages/config/src/require-env.ts`: `requireEnv` · `optionalEnv` · `requireFirstEnv` · `devFallbackEnv` (chỉ `devFallbackEnv` được phép đứng cạnh chuỗi cứng, và nó ném lỗi ở production).
- [x] Sinh `.env.example` từ registry; cổng `lint:env-example` chặn sửa tay (`BR-ENV-09`).

## WP90.4 — Script build ở gốc và worker chạy mã đã build

- [x] `build` ở `package.json` gốc, thứ tự theo đồ thị workspace.
- [x] `apps/worker` chạy `node dist/index.js`; không loader nào trong đường chạy máy chủ (`BR-SUP-09`).

## WP90.5 — Cấu hình trình giám sát tiến trình

- [x] `infra/pm2/ecosystem.config.cjs`: ba ứng dụng, cluster cho `web`, fork một bản cho `worker` (`BR-SUP-03`).
- [x] `cwd` trỏ `/opt/mindkid/current` — thiếu nó thì đường dẫn tương đối giải ra `infra/pm2/apps/...` và không ứng dụng nào khởi động.
- [x] `uid`/`gid` là `mindkid` (`BR-SRV-02`); trình giám sát giữ quyền `root` để đọc tệp env `0600` (`BR-ENV-05`).
- [x] Giãn cách dựng lại tăng dần thay cho 5 giây cố định (`BR-SUP-05`).
- [x] Cổng loopback theo [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §7.3.
- [x] Luân chuyển log mỗi ngày, giữ 14 ngày, nén, trần 200 MB, có `postrotate` nạp lại log.
- [x] 10 test đọc tệp cấu hình.

## WP90.6 — Dựng máy chủ

- [x] `mindkid.sh init`: người dùng hệ thống, cây thư mục, bản sao kho, gieo `bin/` và `compose/` — chạy được trên máy trắng, không phụ thuộc bản phát hành nào.
- [x] `mindkid.sh provision` theo 11 bước ở [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §4: tiền kiểm phần cứng · gói nền · cây thư mục · tường lửa · runtime · dữ liệu · web server · TLS · log · báo cáo.
- [x] Bỏ `ufw --force reset`: nó xoá cả luật SSH trong lúc dựng lại, ngược với `BR-SRV-01`.
- [x] Dừng khi phiên bản lệch, không tự nâng cấp (`BR-SRV-05`).
- [x] Khuôn Nginx được kết xuất, kiểm cú pháp và nạp lại thật; snippet header nằm trong `infra/nginx/`.
- [x] `infra/docker-compose.prod.yml`: PostgreSQL 17 và **Valkey 9**, bind loopback, volume riêng, mật khẩu bắt buộc.
- [x] Bước 11 in hai việc còn phải làm tay: trỏ DNS và ghi ba tệp env.

## WP90.7 — Phát hành

- [x] `infra/scripts/mindkid.sh` là **điểm vào duy nhất**; `deploy.sh`, `release.sh`, `rollback.sh`, `provision.sh` cũ đã xoá.
- [x] Thư viện dùng chung: `paths` · `log` · `lock` · `atomic` · `smoke` · `notify` · `pm2` · `envcheck` · `git` · `releases` · `build`.
- [x] Khoá là **thư mục** trong `/opt/mindkid`, không phải tệp trong `/tmp`: `mkdir` nguyên tử ở mọi hệ tệp, và người dùng thường không tạo trước hay trỏ liên kết mềm vào tệp khác được.
- [x] Tên thư mục bản `<mốc UTC>-<7 ký tự sha>` ([`release-deploy.md`](../specs/01-platform/release-deploy.md) §7.1) — đây là thứ làm cho phát hành lại cùng commit không xoá bản đang chạy.
- [x] Bước kiểm env gọi validator thật, trước khi cài và build (`BR-DEP-04`).
- [x] Cài và build trong container `node:24-bookworm` (`BR-DEP-05`), kho pnpm dùng chung ở `shared/`.
- [x] Nạp lại theo thứ tự worker → web ([`release-deploy.md`](../specs/01-platform/release-deploy.md) §7.2). Admin không có tiến trình để nạp lại từ khi `BR-ARB-01` biến nó thành cây tĩnh — sửa lại dòng này ở Task #109.
- [x] Thông báo khi thất bại (`BR-DEP-11`) qua `/etc/mindkid/deploy.conf`.
- [x] Ghi `/var/log/mindkid/deploy.log` với mốc thời gian quốc tế.

## WP90.8 — Quay lui và cổng migration cộng thêm

- [x] `mindkid.sh rollback` dùng chung khoá với phát hành (`BR-RBK-05`), không build, không migration.
- [x] Chọn đích bằng `--to <tên bản>` theo [`release-rollback.md`](../specs/01-platform/release-rollback.md) §3.
- [x] Từ chối bản đích không có artefact đã build (§4 bước 3).
- [x] Chạy cổng khói sau khi quay lui (`BR-RBK-06`) và phát thông báo (`BR-RBK-07`).
- [x] `packages/db/tests/gates/migration-expand.ts` quét đúng `packages/db/src/migrations` — đường dẫn cũ không tồn tại nên cổng xanh mà không đọc tệp nào.
- [x] Cổng **đỏ khi quét 0 tệp**: một cổng không đọc gì thì xanh vĩnh viễn.
- [x] Chặn thêm `DROP INDEX` · `DROP CONSTRAINT` · `DROP VIEW` · `DROP TYPE` · `SET NOT NULL` · `ALTER COLUMN TYPE` · `TRUNCATE`.
- [x] Fixture migration xoá cột; 10 test khẳng định cổng đỏ trên fixture, xanh trên fixture cộng thêm.

## WP90.9 — Lệnh phía máy trạm

- [x] `scripts/deploy/cli.ts` cho bảy lệnh; `scripts/deploy/remote-exec.ts` kiểm mọi giá trị trước khi gửi.
- [x] Gửi **mảng tham số** qua SSH, không ghép chuỗi: shell đầu kia chạy bằng `root`.
- [x] `pnpm deploy init` — lệnh còn thiếu khiến máy trắng không dựng được.
- [x] Tham chiếu chưa đẩy lên kho: dừng tại máy trạm, in cách xử lý (`BR-DEP-01`).
- [x] Cây làm việc bẩn: in cảnh báo kèm số tệp, vẫn phát hành commit trên kho (`BR-DEP-02`).
- [x] `pnpm deploy status` liệt kê các bản còn giữ và bản nào quay lui được.
- [x] 6 test với 20 chuỗi tấn công cho lớp kiểm tham số.

## WP90.10 — Cổng kiểm cú pháp shell và verification

- [x] Cổng dùng **shellcheck** ở mức `info`, không phải `bash -n`: `SC2086` là mức info và là cách phổ biến nhất một script phát hành làm hỏng đường dẫn có dấu cách.
- [x] Cổng **đỏ khi thiếu shellcheck** và khi quét 0 tệp.
- [x] Fixture shell sai cố ý mà `bash -n` chấp nhận; test khẳng định cổng đỏ.
- [x] `pnpm exec biome check .` xanh · `pnpm --filter @mindkid/gates test` xanh · `pnpm --filter @mindkid/gates test` xanh.
- [x] `bash infra/scripts/tests/run.sh`: **43 khẳng định, 12 ca, 0 lỗi**.

### Sáu ca âm bắt buộc của plan §6, cộng sáu ca review thêm

| Ca | Nội dung | Kết quả |
| --- | --- | --- |
| 1 | Cổng khói trả 503 | Liên kết mềm về bản trước, mã thoát khác 0, log nêu lý do |
| 2 | Thiếu một biến bắt buộc | Không thư mục bản nào được tạo, bản đang chạy vẫn phục vụ |
| 3 | Hai lần phát hành song song | Lần thứ hai thoát, không xếp hàng |
| 4 | Ngắt giữa bước build | Liên kết mềm giữ bản cũ, thư mục dở dang bị dọn, khoá được trả |
| 5 | Phát hành lại cùng commit | Hai thư mục bản riêng biệt, bản cũ còn nguyên |
| 6 | Chế độ in kế hoạch | Không đổi liên kết mềm, không thêm thư mục bản |
| 7 | Tham chiếu chưa đẩy lên kho | Dừng, không tạo thư mục nào |
| 8 | Quay lui | Về bản trước, không chạy migration nào |
| 9 | Thứ tự nạp lại | worker, web |
| 10 | Dọn bản cũ | Bản đang phục vụ không bị xoá dù nằm ngoài cửa sổ giữ lại |
| 11 | Bí mật trong log | Không giá trị bí mật nào trong output và trong `deploy.log` |
| 12 | Bản đích thiếu artefact | Quay lui từ chối, liên kết mềm không đổi |

## WP90.11 — Máy thật, cổng người

- [ ] Có câu trả lời cho ba câu hỏi chặn: nhà cung cấp và cấu hình máy, tên miền và ai giữ DNS, nơi chạy cổng tự động.
- [ ] Ghi `/etc/mindkid/env/{web,admin,worker}.env` và `compose/datastore.env`, quyền `0600 root:root`.
- [ ] `pnpm deploy init --host <tên> --remote <url>` trên máy trắng, ghi thời gian thật.
- [ ] `pnpm deploy provision --host <tên> --site-domain <d> --admin-domain <d>`, ghi thời gian thật.
- [ ] `pnpm deploy --host <tên> --ref main`, ghi thời gian thật và gián đoạn đo được.
- [ ] Chạy lại lệnh dựng máy lần hai, khẳng định không tiến trình nào bị dừng (`BR-SRV-01`).
- [ ] Đo 10 tiêu chí ở [`release-deploy.md`](../specs/01-platform/release-deploy.md); ghi số đo vào đây, không ghi "đã xong".
- [ ] Mở PR cho người review diff, không tự merge.
