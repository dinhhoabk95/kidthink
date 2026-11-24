---
spec: RELEASE-DEPLOY
title: Quy trình phát hành lên Cloudflare
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-11-24
owns:
  - Quy trình phát hành và điều kiện dừng của từng bước
  - Nguồn code được phép đi lên Cloudflare
  - Cổng khói sau khi đổi bản
depends_on:
  - ENV-CONTRACT
  - HEALTH-CHECK
  - MONITORING-AND-ALERTING
---

# Phát hành lên Cloudflare bằng một lần đẩy `main`

## 1. Objective

Một lần đẩy commit lên `main` (hoặc một lần chạy tay `workflow_dispatch`) đưa bản mới lên
Cloudflare, hoặc không lên chút nào. Không có trạng thái giữa — không có "đã áp DDL nhưng chưa đổi
bản", không có "bản mới lên nhưng chết và không ai biết".

Quyết định `D14` ([`SPEC.md`](../../SPEC.md) §0): MVP chỉ có **một** đường phát hành — Cloudflare
Workers + D1 + Durable Objects. Đường VPS (SSH + Nginx + PM2 + `mindkid.sh`) đã gỡ; spec
`server-provisioning` và `process-supervision` bị xoá cùng nó.

Yêu cầu thứ hai: **trạng thái máy phát triển không có đường nào chạm tới Cloudflare production.**
Nguồn code duy nhất là commit đã đẩy lên kho — runner GitHub checkout đúng commit đó, nên tệp chưa
commit, thư mục phụ thuộc của máy trạm, tệp cấu hình dev và cơ sở dữ liệu dev không có phương tiện
để đi lên.

## 2. Actors

| Actor            | Quyền cần                       | Làm được gì ở đây                               |
| ---------------- | ------------------------------- | ----------------------------------------------- |
| Người vận hành   | Quyền đẩy `main` / chạy workflow | Kích hoạt phát hành, đọc log, chạy `wrangler rollback` tay |
| GitHub Actions   | Secret Cloudflare               | Tự checkout, build, áp DDL, deploy, chạy cổng khói |
| Cloudflare       |                                 | Giữ lịch sử version Worker để quay lui          |

## 3. Entry points

| Nơi                                       | Actor          | Ghi chú                                                                                                                                                                                              |
| ----------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/deploy-cloudflare.yml` | GitHub Actions | Kích hoạt khi đẩy `main` hoặc `workflow_dispatch`. `pnpm check` → Terraform → D1 DDL cộng thêm → build web + admin + `verify-cf-budget` → `wrangler deploy` worker, web, admin → smoke `/api/guest/health` |
| `npx wrangler rollback --config apps/<app>/wrangler.jsonc` | Người vận hành | Quay lui tay, xem [`release-rollback.md`](release-rollback.md)                                                                                                                       |
| `pnpm verify:cf-budget`                   | Người vận hành / CI | Kiểm kích thước bundle Worker so với trần gói Free                                                                                                                                              |

## 4. Main flow

```
1. Khoá  — nhóm concurrency `mindkid-cloudflare-prod`, không huỷ lần đang chạy
2. Chốt commit  — actions/checkout đúng commit kích hoạt
3. Cài phụ thuộc  — `pnpm install --frozen-lockfile`, Node theo `.nvmrc`
4. Cổng tĩnh  — `pnpm check` (lint, ranh giới package, typecheck)
5. Terraform  — áp biên Cloudflare (WAF, cache) và 3 D1 (`core`, `logs`, `blobs`)
6. Đồng bộ ID D1 vào `wrangler.jsonc` và xuất DDL
7. Migration  — áp DDL cộng thêm lên D1, trước khi đổi bản
8. Build  — web (Nitro `cloudflare_module`) và admin static SPA, rồi `verify-cf-budget`
9. Đổi bản  — `wrangler deploy` worker, web, admin
10. Cổng khói  — gọi `/api/guest/health`; không phải 200 thì `wrangler rollback` web + worker, thoát khác 0
```

Mỗi bước là một step của workflow; bước nào lỗi thì job dừng, không bước nào được bỏ qua để đi tiếp.

## 5. Alternative flows

| Nhánh                              | Điều kiện                                | Hành vi                                                                                                                  |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Máy trạm có tệp chưa commit        | Cây làm việc bẩn                         | Không ảnh hưởng: runner chỉ thấy commit đã đẩy                                                                           |
| Thiếu biến bắt buộc                | Xem [`env-contract.md`](env-contract.md) | `createWebEnv()` chạy lúc `nuxt build` và dừng ở bước 8; bản đang chạy nguyên vẹn                                       |
| Khoá phiên bản lệch tệp mô tả gói  | Bước 3 tự thất bại                       | Dừng; đây là hành vi muốn có, không phải lỗi cần nới                                                                     |
| Build hết bộ nhớ                   | Runner thiếu heap                        | Dừng ở bước 8; bản đang chạy nguyên vẹn. Workflow đặt `NODE_OPTIONS=--max-old-space-size=10240`                          |
| Migration thất bại                 | Bước 7                                   | Dừng trước khi đổi bản; bản cũ vẫn phục vụ cơ sở dữ liệu ở trạng thái sau DDL một phần (DDL chỉ cộng thêm nên bản cũ chạy được) |
| Cổng khói thất bại                 | Bước 10                                  | `wrangler rollback` web và worker, thoát khác 0                                                                          |
| Phát hành đang chạy                | Bước 1                                   | Lần thứ hai xếp hàng theo nhóm concurrency, không chạy song song                                                         |
| Runner bị ngắt giữa đường          | Mất runner                               | Worker vẫn chạy version cũ cho tới khi `wrangler deploy` hoàn tất; chạy lại workflow                                     |

## 6. Business rules

| ID          | Rule                                                                                                                                       | Vì sao                                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BR-DEP-01` | Nguồn code lên Cloudflare **chỉ** là commit đã có trên kho; cấm mọi đường deploy từ máy trạm cho production                              | Đây là điều làm cho "code dev không ảnh hưởng production" thành sự thật kiểm được. Không có kênh truyền tệp từ máy trạm thì tệp chưa commit không có cách nào đi lên                                                                                       |
| `BR-DEP-03` | Cấm workflow tự commit, tự đẩy, hay tự sửa mã                                                                                              | Một quy trình vừa được phép sửa mã vừa được phép phát hành là một quy trình có thể phát hành thứ chưa ai đọc                                                                                                                                              |
| `BR-DEP-04` | Kiểm biến môi trường chạy **trước** khi có artifact deploy: `createWebEnv()` dừng `nuxt build` khi thiếu biến production (`BR-ENV-15`)     | Dừng sau khi deploy là để người dùng phát hiện dòng thiếu. Dừng ở build thì Cloudflare chưa mất gì                                                                                                                                                        |
| `BR-DEP-06` | DDL D1 chạy **trước** `wrangler deploy`, và chỉ được là DDL cộng thêm                                                                      | Đổi bản trước DDL nghĩa là mã mới nói chuyện với lược đồ cũ. Ràng buộc cộng thêm là điều kiện để quay lui được, xem [`release-rollback.md`](release-rollback.md)                                                                                           |
| `BR-DEP-08` | Sau khi deploy phải chạy cổng khói; không phải 200 thì **quay lui** web và worker                                                          | Phát hành xong mà không kiểm nghĩa là để người dùng làm người kiểm. Luật gốc là `BR-HLT-06` của [`health-check.md`](health-check.md)                                                                                                                      |
| `BR-DEP-09` | Một lần phát hành tại một thời điểm, cưỡng chế bằng `concurrency.group` và `cancel-in-progress: false`                                     | Hai lần phát hành song song ghi chồng nhau ở bước DDL và bước deploy. Không huỷ lần đang chạy vì huỷ giữa `wrangler deploy` để lại ba Worker ở ba version khác nhau                                                                                        |
| `BR-DEP-10` | Log workflow cấm chứa giá trị biến bí mật; mọi giá trị bí mật đi qua `secrets.*`                                                           | Không có bản ghi thì không truy được lần phát hành nào làm hỏng; nhưng bản ghi chứa bí mật là sự cố mới. Thi hành `BR-ENV-08` tại nơi log được ghi                                                                                                        |
| `BR-DEP-11` | Thất bại phải thấy được: job đỏ trên GitHub là kênh tối thiểu; kênh [`monitoring-and-alerting.md`](monitoring-and-alerting.md) là kênh chủ động | Một lần phát hành thất bại lúc 23 giờ mà không ai biết là một đêm site chạy bản cũ trong khi người ta tin bản mới đã lên. Phần chủ động (Telegram từ workflow) chưa làm — xem §11                                                                         |
| `BR-DEP-12` | Phát hành lại cùng một commit phải cho cùng kết quả, không được lỗi                                                                        | Đây là tính chất rẻ nhất để kiểm rằng quy trình không dựa vào trạng thái còn sót của lần trước. Terraform idempotent, `wrangler deploy` ghi đè version                                                                          |
| `BR-DEP-15` | Cổng build phải kiểm **artifact**, không chỉ mã thoát: bundle Worker khởi động được dưới trần Free, static SPA có entry CSS, chunk client không chứa code máy chủ | `nuxt build` trả 0 trong khi server chết ngay lúc khởi động vì native addon bị inline (`BR-MPA-10`), và `nuxt generate` trả 0 trong khi không sinh byte CSS nào vì layer thiết kế bị bỏ qua (`BR-DSC-21`). Cả hai đã xảy ra thật 2026-08-29                |

Các luật `BR-DEP-02`, `-05`, `-07`, `-13`, `-14` thuộc đường VPS (cây làm việc bẩn trên máy trạm,
build trong container, đổi liên kết mềm, thư mục bản đang phục vụ, in kế hoạch) đã gỡ theo `D14`;
số thứ tự giữ nguyên để không vỡ tham chiếu lịch sử.

## 7. Data

**Đọc:** commit trên kho, secret và variable của GitHub, output Terraform.
**Ghi:** D1 (`core`, `logs`, `blobs`) qua DDL cộng thêm; version Worker trên Cloudflare; không ghi
gì lên kho.

### 7.1 Thứ tự deploy

| Thứ tự | Ứng dụng | Vì sao                                                                                      |
| ------ | -------- | ------------------------------------------------------------------------------------------- |
| 1      | `worker` | Không phục vụ người dùng; lên trước để mã tiêu thụ việc khớp lược đồ mới                    |
| 2      | `web`    | Bề mặt công khai và toàn bộ `/api/*`                                                        |
| 3      | `admin`  | Static SPA (Workers Static Assets); header bảo mật lấy từ `apps/admin/public/_headers`      |

### 7.2 Header bảo mật của admin

Admin không có Nitro server nên `nuxt-security` không chạy. Header (CSP, HSTS, `X-Frame-Options:
DENY`, `nosniff`, `Referrer-Policy`, COOP, `Permissions-Policy`, cache `immutable` cho `/_nuxt/*`)
nằm ở `apps/admin/public/_headers`; build admin phải sinh `.output/public/_headers`.

## 8. API contract

Không có route công khai. Quy trình phát hành **gọi** endpoint sức khoẻ do
[`health-check.md`](health-check.md) sở hữu; spec này không định nghĩa lại endpoint đó.

## 9. Acceptance criteria

```gherkin
Scenario: BR-DEP-15 — artifact chạy được, không chỉ build xanh
  Given bước build vừa xong với mã thoát 0
  Then .output/public/_nuxt của apps/admin có đúng một entry CSS lớn hơn 100KB
  And không chunk nào trong .output/public/_nuxt chứa node-gyp-build
  And .output/public/_headers của apps/admin tồn tại
  And verify-cf-budget báo bundle Worker dưới trần
  And Cấm — NEVER coi mã thoát 0 của lệnh build là đã qua cổng này

Scenario: BR-DEP-01 — tệp chưa commit không lên Cloudflare
  Given máy trạm có một tệp đã sửa nhưng chưa commit
  When đẩy commit khác lên main
  Then bản trên Cloudflare khớp đúng commit đã đẩy
  And tệp chưa commit không có trong bundle

Scenario: BR-DEP-04 — thiếu biến thì dừng trước khi deploy
  Given secret production thiếu một biến bắt buộc
  When workflow chạy
  Then bước build dừng với tên biến thiếu
  And không có wrangler deploy nào chạy
  And endpoint sức khoẻ của bản đang chạy vẫn trả 200

Scenario: BR-DEP-08 — cổng khói thất bại thì quay lui
  Given bản mới lên nhưng endpoint sức khoẻ trả 503
  When workflow tới bước cổng khói
  Then web và worker được wrangler rollback về version trước
  And mã thoát khác 0

Scenario: BR-DEP-09 — hai lần phát hành song song
  Given một lần phát hành đang chạy
  When đẩy commit thứ hai lên main
  Then lần thứ hai chờ, không chạy song song và không huỷ lần đầu

Scenario: BR-DEP-12 — phát hành lại cùng commit
  Given một lần phát hành thành công với commit X
  When chạy lại workflow cho đúng commit X
  Then lần thứ hai thành công

Scenario: BR-DEP-06 — DDL chạy trước khi đổi bản
  Given một bản mới có một DDL cộng thêm
  When phát hành thành công
  Then thứ tự step là d1 execute trước, wrangler deploy sau

Scenario: BR-DEP-10 — log không lộ bí mật
  Given một lần phát hành thành công
  When tìm giá trị của các secret trong log workflow
  Then không có kết quả nào
```

## 10. Boundaries

**Always**

- Lấy code từ kho, bằng commit kích hoạt workflow.
- Để `createWebEnv()` kiểm biến môi trường lúc build.
- Nếu đổi `MFA_ENCRYPTION_KEY`: chạy `npx tsx packages/db/scripts/count-mfa-rows.ts` trên
  production, kiểm số hàng `mfa_settings` đã `confirmed_at`. Có hàng → re-encrypt hoặc re-enroll
  trước khi đổi khoá (`BR-MFA-13`).
- Áp DDL trước khi `wrangler deploy`.
- Chạy cổng khói và quay lui khi thất bại.

**Ask first**

- Bỏ qua cổng khói cho một lần phát hành.
- Phát hành từ nhánh không phải `main`.
- Thêm bước mới vào workflow.
- Thêm lại một đường phát hành thứ hai (VPS hay nơi khác) — đó là quyết định `D14` mới.

**Never**

- `wrangler deploy` production từ máy trạm.
- Tự commit, tự đẩy, hay tự sửa mã trong workflow.
- Deploy trước khi áp DDL.
- Bỏ qua thất bại của một bước để đi tiếp.
- In giá trị biến bí mật ra log.

## 11. Open questions

| #   | Câu hỏi                                                                                                                                                                                  | Chặn gì                      | Chặn phase | Chủ         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------- | ----------- |
| 1   | DDL thất bại giữa đường để lược đồ ở trạng thái một phần. D1 chạy `--file` theo batch nên có thể một phần; chấp nhận xử lý tay theo log hay thêm bước kiểm?                              | Điều kiện go-live            | go-live    | người quyết |
| 2   | Workflow đã chạy `pnpm check` nhưng chưa chạy vitest. Có thêm `pnpm test` vào workflow trước `wrangler deploy` không? Đổi thời gian phát hành lấy độ chắc                               | Mức bảo vệ của lần phát hành | go-live    | người quyết |
| 3   | Gửi thông báo Telegram chủ động từ workflow khi thất bại (phần chủ động của `BR-DEP-11`) chưa làm                                                                                        | Không chặn                   | chờ P1     | Infra       |
| 4   | **NEEDS-VALIDATION** — rate limit ở biên: xem mục NEEDS-VALIDATION trong [`rate-limiting.md`](rate-limiting.md) §11. Mất giới hạn theo IP của Nginx khi gỡ VPS; cần rule WAF hoặc xác nhận limiter trong app trước go-live | Điều kiện go-live            | go-live    | người quyết |
| 5   | Smoke artifact admin (entry CSS > 100KB, chunk không chứa `node-gyp-build`) của `BR-DEP-15` từng nằm trong `infra/scripts/lib/smoke.sh` đã xoá; hiện chỉ phần bundle Worker (`verify-cf-budget`) và `_headers` còn cổng. Cần cổng thay thế trước go-live | Điều kiện go-live            | go-live    | người quyết |
