# Kế hoạch — Task #90: Triển khai lên VPS bằng một lệnh (P0)

> **Loại task:** implementation lát dọc (S/M). Checklist: [`90-vps-deploy-todo.md`](90-vps-deploy-todo.md).
> **Spec sở hữu:** [`env-contract.md`](../specs/01-platform/env-contract.md) · [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) · [`process-supervision.md`](../specs/01-platform/process-supervision.md) · [`release-deploy.md`](../specs/01-platform/release-deploy.md) · [`release-rollback.md`](../specs/01-platform/release-rollback.md).

## 1. Outcome

Một lệnh dựng máy chủ trắng, một lệnh phát hành, một lệnh quay lui. Ba lệnh chịu được việc bị gọi
sai thứ tự, gọi hai lần, hoặc bị ngắt giữa đường mà không để hệ thống ở trạng thái nửa vời.

Cùng lúc đó, ranh giới máy trạm và máy chủ được dựng bằng **cấu trúc**, không bằng nội quy: kênh
duy nhất là commit đã đẩy lên kho, nên tệp chưa commit, `node_modules` của macOS, `.env` dev và
cơ sở dữ liệu dev không có phương tiện để đi lên máy chủ.

## 2. Bằng chứng cần xử lý

Mười hai số đo ở các spec sở hữu mục "Hiện trạng đo được". Bốn
cái nặng nhất, vì chúng làm cho phát hành chắc chắn thất bại ở lần đầu:

1. `infra/scripts/deploy.sh` 50 dòng, mọi bước thật bị chú thích — không có quy trình nào tồn tại.
2. 56 biến môi trường trong code, `.env.example` khai 2, và sáu nhóm trùng khái niệm.
3. `package.json` gốc không có script `build`, trong khi [`SPEC.md`](../SPEC.md) mục 7 ghi `pnpm build`.
4. `apps/worker` chạy bằng loader phát triển; không có tệp cấu hình trình giám sát tiến trình nào.

## 3. Assumptions và ranh giới

1. **Nguồn code là commit trên kho.** Máy chủ tự lấy về và tự bung; không `rsync`, không `scp` (`BR-DEP-01`).
2. **Build trên máy chủ, trong container `node:24-bookworm`.** Máy trạm là macOS ARM, máy chủ là Linux x86; thư viện xử lý ảnh có phần nhị phân theo nền tảng (`BR-DEP-05`).
3. **Logic ở TypeScript, bash chỉ điều phối.** Việc nào cần điều kiện hay so sánh danh sách thì viết TypeScript có test; bash gọi lệnh theo thứ tự và kiểm mã trả về.
4. **Bí mật là ba tệp trên máy chủ**, `0600 root:root`, ngoài thư mục release. Quy trình phát hành chỉ đọc để kiểm, không bao giờ ghi (`BR-ENV-05`, `BR-ENV-12`).
5. **Quay lui chỉ quay mã.** Mỗi lần phát hành chỉ chứa migration cộng thêm (`BR-RBK-02`).
6. **Không dùng máy thật cho WP90.1–WP90.10.** Kiểm thử bằng nhị phân giả đặt trước trong đường tìm lệnh; máy thật chỉ vào ở WP90.11.

Ba câu hỏi chặn **chỉ** WP90.11, không chặn phần code: nhà cung cấp và cấu hình máy, tên miền và
ai giữ DNS, nơi chạy cổng tự động trên kho từ xa.

## 4. Dependencies và thứ tự

```text
WP90.0  Năm spec draft → approved  (BR-RBS-04 chặn code nghiệp vụ)
  └──→ WP90.1  Registry biến môi trường + validator            (packages/config)
         ├──→ WP90.2  Cổng lint:env-names + ca âm               (RED trước khi sửa code)
         │      └──→ WP90.3  Gộp 6 nhóm alias, bỏ mặc định cứng, sinh .env.example
         ├──→ WP90.4  Script build ở gốc + worker chạy mã đã build
         │      └──→ WP90.5  Cấu hình trình giám sát tiến trình + luân chuyển log
         └──→ WP90.6  provision.sh + nginx + compose máy chủ
                └──→ WP90.7  release.sh + thư viện dùng chung + test nhị phân giả
                       └──→ WP90.8  rollback.sh + cổng migration cộng thêm
                              └──→ WP90.9  Lớp bọc SSH và các lệnh pnpm deploy*
                                     └──→ WP90.10  Cổng shellcheck + ca âm, verification
                                            └──→ WP90.11  Máy thật: đo 10 tiêu chí (cổng người)
```

WP90.3 và WP90.5 chạy song song được sau khi WP90.1 xong. WP90.6 không chờ WP90.3.

## 5. Work packages

| ID      |  Cỡ | Công việc                                                                                                                                                                                         | Kết quả kiểm được                                                                                      |
| ------- | --: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| WP90.0  |   S | Năm spec chuyển `draft` → `approved` sau khi đọc lại §11; không đổi nội dung rule                                                                                                                 | `pnpm --filter @mindkid/gates test` xanh, C8/C16/C17 không đỏ                                                            |
| WP90.1  |   S | `packages/config/src/env-contract.ts`: khai 56 biến (tên, tiến trình, bắt buộc, kiểu, bí mật) + `validateEnvFile()` nhận `Map` chứ không đọc `process.env`                                        | Unit test: thiếu · rỗng · sai kiểu · secret <32 byte · biến lạ · chỉ bắt buộc ở production             |
| WP90.2  |   S | Cổng `lint:env-names`: quét `apps/` và `packages/` tìm tên alias đã bỏ và mặc định cứng cho địa chỉ site; kèm fixture sai cố ý                                                                    | Cổng **đỏ** trên fixture, đỏ trên code hiện tại (RED), xanh sau WP90.3                                 |
| WP90.3  |   M | Gộp 6 nhóm alias về tên chốt ở [`env-contract.md`](../specs/01-platform/env-contract.md) §7.2; bỏ 10 mặc định cứng; sinh `.env.example` từ registry                                               | `lint:env-names` xanh; `pnpm test` xanh; `.env.example` khai đủ biến bắt buộc                          |
| WP90.4  |   S | Thêm `build` ở `package.json` gốc (recursive, thứ tự package trước app); `apps/worker` chạy `node dist/index.js`, bỏ loader khỏi đường chạy máy chủ                                               | `pnpm build` chạy được từ gốc; `apps/worker` không còn `tsx` trong script `start`                      |
| WP90.5  |   S | `infra/pm2/ecosystem.config.cjs` (3 ứng dụng, cluster cho web, fork cho worker, ngưỡng ở [`process-supervision.md`](../specs/01-platform/process-supervision.md) §7.2) + cấu hình luân chuyển log | Test đọc tệp cấu hình: đúng 3 ứng dụng, worker đúng 1 bản, mỗi ứng dụng trỏ đúng tệp env               |
| WP90.6  |   M | `infra/scripts/provision.sh` chạy lại được nhiều lần + `infra/nginx/mindkid.conf.tmpl` + `infra/docker-compose.prod.yml` (cổng chuẩn, loopback, volume riêng)                                     | Test nhị phân giả: chạy hai lần không cài lại, phiên bản lệch thì dừng, không chạm tệp env             |
| WP90.7  |   M | `infra/scripts/release.sh` + `infra/scripts/lib/` (log, khoá, symlink nguyên tử, cổng khói) theo 10 bước ở [`release-deploy.md`](../specs/01-platform/release-deploy.md) §4                       | Test nhị phân giả: 6 ca âm ở mục 6 dưới đây                                                            |
| WP90.8  |   S | `infra/scripts/rollback.sh` dùng chung thư viện + cổng `lint:migration-expand` chặn migration xoá/đổi tên cột, kèm fixture sai                                                                    | Quay lui về bản trước trong test; cổng đỏ trên fixture migration xoá cột                               |
| WP90.9  |   S | `scripts/deploy/` (lớp bọc SSH) + `pnpm deploy`, `deploy:init`, `deploy:provision`, `deploy:status`, `deploy:rollback`, `deploy:env`, `deploy:logs`                                               | Chế độ in kế hoạch không đổi gì; cảnh báo cây làm việc bẩn có in ra số tệp                             |
| WP90.10 |   S | Cổng `shellcheck` cho `infra/scripts/*.sh` vào `pnpm check`, kèm fixture sai cố ý; chạy verification đầy đủ                                                                                       | Cổng đỏ trên fixture; `pnpm check` và `pnpm test` xanh                                                 |
| WP90.11 |   M | Máy thật: chạy hai lệnh, đo 10 tiêu chí ở mục 7. Cổng người, không tự động hoá                                                                                                                    | Ghi số đo thật vào [`90-vps-deploy-todo.md`](90-vps-deploy-todo.md); ba câu hỏi chặn đã có câu trả lời |

## 6. Sáu ca âm bắt buộc của WP90.7

Đây là phần dễ bỏ nhất và cũng là phần duy nhất chứng minh quy trình an toàn. Chạy `release.sh`
trong thư mục tạm, với trình giám sát tiến trình, Docker, Nginx và công cụ gọi HTTP là script giả
đặt trước trong `PATH`.

| #   | Ca                            | Kỳ vọng                                                   |
| --- | ----------------------------- | --------------------------------------------------------- |
| 1   | Cổng khói trả 503             | Liên kết mềm về bản trước, mã thoát khác 0, log nêu lý do |
| 2   | Thiếu một biến bắt buộc       | Không thư mục bản nào được tạo; bản đang chạy vẫn phục vụ |
| 3   | Hai lần phát hành song song   | Lần thứ hai thoát vì không lấy được khoá                  |
| 4   | Ngắt giữa bước build          | Liên kết mềm vẫn trỏ bản cũ                               |
| 5   | Phát hành lại cùng một commit | Cả hai lần thành công                                     |
| 6   | Chế độ in kế hoạch            | Liên kết mềm không đổi, số thư mục bản không đổi          |

## 7. Acceptance criteria

```gherkin
Scenario: BR-DEP-01 — tệp chưa commit không lên máy chủ
  Given máy trạm có một tệp đã sửa nhưng chưa commit
  When chạy lệnh phát hành
  Then thư mục bản trên máy chủ khớp đúng commit trên kho
  And tệp chưa commit không có trong thư mục bản

Scenario: BR-DEP-04 — thiếu biến bắt buộc thì dừng trước khi build
  Given tệp env trên máy chủ thiếu một biến bắt buộc
  When chạy lệnh phát hành
  Then quy trình dừng ở bước kiểm biến
  And không có thư mục bản mới nào được tạo
  And endpoint sức khoẻ của bản đang chạy vẫn trả 200

Scenario: BR-DEP-08 — cổng khói thất bại thì quay lui
  Given bản mới khởi động nhưng endpoint sức khoẻ trả 503
  When quy trình phát hành tới bước cổng khói
  Then liên kết mềm trỏ về bản trước
  And endpoint sức khoẻ trả 200 trở lại
  And mã thoát khác 0

Scenario: BR-RBK-01 — quay lui không chạm lược đồ
  Given bản mới đã chạy một migration cộng thêm
  When chạy lệnh quay lui
  Then cột vừa thêm vẫn còn trong lược đồ
  And bản đang chạy là bản trước đó

Scenario: BR-ENV-06 — validator không dựa vào môi trường của người chạy
  Given shell của người chạy đã có sẵn mọi biến bắt buộc
  And tệp env truyền vào thiếu một biến bắt buộc
  When chạy validator
  Then validator báo thiếu biến đó

Scenario: BR-ENV-02 — tên đồng nghĩa bị chặn
  Given một tệp nguồn đọc một tên đồng nghĩa đã bị bỏ
  When chạy cổng lint:env-names
  Then cổng báo lỗi và nêu tên chính thức phải dùng

Scenario: BR-SUP-09 — không chạy TypeScript qua loader trên máy chủ
  Given ba ứng dụng đang chạy
  When đọc dòng lệnh của từng tiến trình
  Then không dòng nào gọi loader phát triển

Scenario: BR-SRV-01 — dựng máy chạy lại được
  Given một máy chủ đã dựng xong và đang chạy
  When chạy lại lệnh dựng máy
  Then không tiến trình ứng dụng nào bị dừng
  And không thành phần nào bị cài lại
```

Mười tiêu chí đo trên máy thật (WP90.11) nằm ở mục 7 của [`release-deploy.md`](../specs/01-platform/release-deploy.md)
mục "Tiêu chí thành công của task"; không nhắc lại ở đây.

## 8. Verification

```bash
pnpm exec biome check .                       # pnpm lint bị hook viết lại, dùng lệnh này
pnpm --filter @mindkid/gates test
pnpm check                                    # gồm lint:env-names, lint:env-example,
                                              # lint:migration-expand, lint:shell
pnpm test
pnpm vitest run scripts packages/config
bash infra/scripts/tests/run.sh               # 12 ca nhị phân giả, 43 khẳng định
pnpm test:deploy                              # cùng bộ đó qua package.json
```

Cổng `lint:shell` cần `shellcheck` trên máy: `brew install shellcheck` hoặc
`apt-get install shellcheck`. Thiếu nó thì cổng **đỏ**, không im lặng bỏ qua.

## 9. Definition of done

- Năm spec `approved`; `pnpm --filter @mindkid/gates test` xanh.
- Registry biến môi trường là nguồn duy nhất; `.env.example` sinh ra từ nó; sáu nhóm alias còn đúng một tên mỗi khái niệm.
- `pnpm build` chạy từ gốc; `apps/worker` chạy mã đã build.
- Một script `infra/scripts/mindkid.sh` với bảy verb, có test nhị phân giả phủ đủ sáu ca âm ở mục 6 cộng sáu ca do review thêm.
- Bốn cổng mới (`lint:env-names`, `lint:env-example`, `lint:migration-expand`, `lint:shell`) đều có fixture sai chứng minh cổng đỏ được, và hai cổng quét tệp đều đỏ khi quét 0 tệp.
- `pnpm check` và `pnpm test` xanh.
- WP90.11 chỉ đóng khi có số đo thật từ một máy chủ thật, không đóng bằng suy luận.
