# Todo — Task #90: Triển khai lên VPS bằng một lệnh (P0)

> Lý do, đồ thị phụ thuộc, work package: [`90-vps-deploy-plan.md`](90-vps-deploy-plan.md).
> Giả định và số đo hiện trạng trong các spec sở hữu.
>
> Mọi lệnh chạy từ thư mục gốc của monorepo, đặt lại đường dẫn Node trước:
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Dùng `pnpm exec biome check .` chứ không `pnpm lint` — hook viết lại lệnh đó thành eslint.
>
> **Chặn WP90.5 trở đi:** thương hiệu đang đổi tên (thư mục đã đổi `MindKid` sang `mindkid`,
> package scope vẫn `@MindKid/*`). Đường dẫn máy chủ, tên người dùng hệ thống và tên tệp cấu
> hình trong năm spec đang mang tên cũ. Chốt tên trước khi viết script, vì đổi tên sau khi máy
> chủ đã chạy là một lần di chuyển dữ liệu, không phải một lần sửa chuỗi.

## Preflight

- [ ] Đọc năm spec sở hữu: [`env-contract.md`](../specs/01-platform/env-contract.md) · [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) · [`process-supervision.md`](../specs/01-platform/process-supervision.md) · [`release-deploy.md`](../specs/01-platform/release-deploy.md) · [`release-rollback.md`](../specs/01-platform/release-rollback.md).
- [ ] Đo lại 12 số đo ở đặc tả task — chúng là trạng thái ngày 2026-08-18, không phải sự thật vĩnh viễn.
- [ ] Xác nhận `pnpm check` và `pnpm test` xanh trước khi sửa dòng đầu tiên.
- [ ] Chốt tên thương hiệu dùng cho đường dẫn máy chủ và người dùng hệ thống.

## WP90.0 — Năm spec draft sang approved

- [ ] Đọc lại §11 của từng spec, xác nhận mọi hàng có `Chặn phase` và `Chủ` thuộc bộ giá trị đóng.
- [ ] Đổi `status: draft` sang `status: approved` cho năm spec.
- [ ] `pnpm lint:specs` xanh (C8 kiểm dependency; C16 và C17 chuyển từ cảnh báo sang lỗi khi approved).

## WP90.1 — Registry biến môi trường và validator

- [ ] Khai 56 biến trong `packages/config/src/env-contract.ts` theo bảng ở [`env-contract.md`](../specs/01-platform/env-contract.md) §7.1.
- [ ] `validateEnvFile(app, parsed)` nhận `Map` đã đọc từ tệp, **không** đọc biến môi trường của tiến trình (`BR-ENV-06`).
- [ ] Unit test sáu loại lệch: thiếu · rỗng · sai kiểu địa chỉ · bí mật dưới 32 byte · biến lạ · chỉ bắt buộc ở máy chủ.
- [ ] Unit test ca âm của `BR-ENV-06`: shell có đủ biến, tệp truyền vào thiếu, validator vẫn báo thiếu.

## WP90.2 — Cổng lint:env-names, viết trước khi sửa code

- [ ] Viết `scripts/lint-env-names.ts`: quét `apps/` và `packages/` tìm sáu nhóm tên đồng nghĩa đã bỏ.
- [ ] Bắt cả giá trị mặc định cứng cho địa chỉ site (`BR-ENV-03`).
- [ ] Fixture sai cố ý trong `scripts/tests/fixtures/`; test khẳng định cổng **đỏ** trên fixture đó.
- [ ] Chạy cổng trên code hiện tại: phải đỏ. Đây là trạng thái RED mong đợi.

## WP90.3 — Gộp tên đồng nghĩa và bỏ mặc định cứng

- [ ] Gộp sáu nhóm về tên chốt ở [`env-contract.md`](../specs/01-platform/env-contract.md) §7.2.
- [ ] Bỏ 10 giá trị mặc định cứng cho địa chỉ site; thiếu biến thì nổ lúc khởi động.
- [ ] Sinh `.env.example` từ registry; không sửa tay tệp đó nữa (`BR-ENV-09`).
- [ ] `pnpm lint:env-names` xanh · `pnpm test` xanh.

## WP90.4 — Script build ở gốc và worker chạy mã đã build

- [ ] Thêm `build` vào `package.json` gốc, thứ tự package trước app.
- [ ] `apps/worker`: lệnh chạy dùng mã trong `dist/`; bỏ loader phát triển khỏi đường chạy máy chủ (`BR-SUP-09`).
- [ ] `pnpm build` chạy được từ gốc, sinh `.output/` cho hai app Nuxt và `dist/` cho worker.

## WP90.5 — Cấu hình trình giám sát tiến trình

- [ ] `infra/pm2/ecosystem.config.cjs`: ba ứng dụng, cluster cho `web`, fork một bản cho `worker` (`BR-SUP-03`).
- [ ] Mỗi ứng dụng trỏ đúng tệp env của nó (`BR-SUP-04`).
- [ ] Ngưỡng bộ nhớ, số lần dựng lại, thời gian tắt êm theo [`process-supervision.md`](../specs/01-platform/process-supervision.md) §7.2.
- [ ] Luân chuyển log: mỗi ngày, giữ 14 ngày, nén (`BR-SUP-06`).
- [ ] Test đọc tệp cấu hình khẳng định đúng ba ứng dụng và `worker` đúng một bản.

## WP90.6 — Dựng máy chủ

- [ ] `infra/scripts/provision.sh` theo 11 bước ở [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §4.
- [ ] Khuôn cấu hình Nginx cộng snippet header bảo mật trong `infra/nginx/`.
- [ ] `infra/docker-compose.prod.yml`: PostgreSQL 17 và Valkey 9, cổng chuẩn, bind loopback, volume riêng (`BR-SRV-03`).
- [ ] Test nhị phân giả: chạy hai lần không cài lại gì, phiên bản lệch thì dừng, không chạm tệp env và volume (`BR-SRV-01`, `BR-SRV-07`).

## WP90.7 — Phát hành

- [ ] `infra/scripts/lib/`: log có mốc thời gian, khoá chống chạy song song, đổi liên kết mềm nguyên tử, cổng khói.
- [ ] `infra/scripts/release.sh` theo 10 bước ở [`release-deploy.md`](../specs/01-platform/release-deploy.md) §4.
- [ ] Ca âm 1 — cổng khói 503: quay lui, mã thoát khác 0, log nêu lý do.
- [ ] Ca âm 2 — thiếu biến bắt buộc: không tạo thư mục bản nào.
- [ ] Ca âm 3 — hai lần phát hành song song: lần thứ hai thoát vì khoá.
- [ ] Ca âm 4 — ngắt giữa bước build: liên kết mềm vẫn trỏ bản cũ.
- [ ] Ca âm 5 — phát hành lại cùng một commit: cả hai lần thành công.
- [ ] Ca âm 6 — chế độ in kế hoạch: không đổi liên kết mềm, không thêm thư mục bản.
- [ ] Khẳng định không giá trị bí mật nào xuất hiện trong log (`BR-DEP-10`).

## WP90.8 — Quay lui và cổng migration cộng thêm

- [ ] `infra/scripts/rollback.sh` dùng chung thư viện của WP90.7, không build, không migration.
- [ ] `scripts/lint-migration-expand.ts`: chặn migration xoá hoặc đổi tên cột (`BR-RBK-02`).
- [ ] Fixture migration xoá cột; test khẳng định cổng đỏ trên fixture.
- [ ] Test quay lui: về bản trước, cổng khói xanh, có dòng log nêu bản nguồn và bản đích.

## WP90.9 — Lệnh phía máy trạm

- [ ] `scripts/deploy/` lớp bọc SSH; tệp cấu hình máy chủ không chứa bí mật.
- [ ] Bảy lệnh phát hành và vận hành ở [`release-deploy.md`](../specs/01-platform/release-deploy.md) §3 và [`release-rollback.md`](../specs/01-platform/release-rollback.md) §3.
- [ ] Cây làm việc bẩn: in cảnh báo kèm số tệp khác biệt, vẫn phát hành đúng commit trên kho (`BR-DEP-02`).
- [ ] Tham chiếu chưa đẩy lên kho: dừng, in cách xử lý.

## WP90.10 — Cổng kiểm cú pháp shell và verification

- [ ] Thêm cổng kiểm cú pháp shell cho `infra/scripts/` vào `pnpm check`.
- [ ] Fixture shell sai cố ý; test khẳng định cổng đỏ.
- [ ] `pnpm exec biome check .` · `pnpm lint:specs` · `pnpm check` · `pnpm test` xanh.

## WP90.11 — Máy thật, cổng người

- [ ] Có câu trả lời cho ba câu hỏi chặn: nhà cung cấp và cấu hình máy, tên miền và ai giữ DNS, nơi chạy cổng tự động.
- [ ] Dựng máy trắng, chạy lệnh dựng máy, ghi thời gian thật.
- [ ] Chạy lệnh phát hành, ghi thời gian thật và gián đoạn đo được.
- [ ] Đo 10 tiêu chí ở [`release-deploy.md`](../specs/01-platform/release-deploy.md); ghi số đo vào đây, không ghi "đã xong".
- [ ] Mở PR cho người review diff, không tự merge.
