---
spec: RELEASE-ROLLBACK
title: Quay lui bản phát hành
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-11-24
owns:
  - Quy trình quay lui và giới hạn của nó
  - Cửa sổ quay lui bằng lịch sử version Worker
  - Ràng buộc migration sinh ra từ việc quay lui
depends_on:
  - RELEASE-DEPLOY
---

# Quay lui về bản đã chạy được

## 1. Objective

Khi bản vừa phát hành sai — không phải chết hẳn, mà sai theo cách chỉ người dùng thấy — người vận
hành cần đưa hệ thống về version Worker trước trong **dưới một phút**, bằng một lệnh, không cần
build lại và không cần suy nghĩ.

Việc này là một outcome riêng, không phải một nhánh của phát hành. Cổng khói ở
[`release-deploy.md`](release-deploy.md) chỉ quay lui được lỗi mà máy nhìn thấy ngay sau khi deploy.
Lỗi do người phát hiện sau đó — sai giá, sai nội dung hiển thị cho trẻ, sai đường liên kết trong
email — cần một lệnh do người bấm, và nó phải tồn tại độc lập với lần phát hành đã kết thúc.

Spec này cũng là nơi phát ngôn một ràng buộc ngược lên cách viết migration: hệ thống chỉ quay lui
được nếu lược đồ mới vẫn phục vụ được mã cũ.

## 2. Actors

| Actor          | Quyền cần                        | Làm được gì ở đây                  |
| -------------- | -------------------------------- | ---------------------------------- |
| Người vận hành | Token Cloudflare hoặc quyền workflow | Chạy lệnh quay lui, đọc kết quả |
| GitHub Actions | Secret Cloudflare                | Tự quay lui khi cổng khói thất bại |
| Người viết migration |                            | Chịu ràng buộc cộng thêm ở §6      |

## 3. Entry points

| Nơi                                                         | Actor          | Ghi chú                                                                 |
| ----------------------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| `npx wrangler rollback --config apps/web/wrangler.jsonc`    | Người vận hành | Về version liền trước của web                                           |
| `npx wrangler rollback --config apps/worker/wrangler.jsonc` | Người vận hành | Về version liền trước của worker; chạy cùng web để hai bên khớp lược đồ |
| `npx wrangler deployments list --config apps/<app>/wrangler.jsonc` | Người vận hành | Xem version còn giữ và version đang chạy                         |
| Bước "Gate 6" của `.github/workflows/deploy-cloudflare.yml` | GitHub Actions | Tự quay lui web và worker khi `/api/guest/health/deep` không trả 200         |

## 4. Main flow

```
1. Chọn đích  — version liền trước, hoặc version nêu tên trong lịch sử của Worker
2. Quay lui  — `wrangler rollback` đổi version đang phục vụ, không build lại
3. Cổng khói  — `/api/guest/health/deep` (kèm `x-health-token`) phải 200
4. Ghi lại và báo  — ai quay lui, từ version nào về version nào
```

Không có bước build và không có bước DDL. Đó là lý do quy trình này đo bằng giây thay vì bằng phút.

## 5. Alternative flows

| Nhánh                                   | Điều kiện                       | Hành vi                                                                                                                                  |
| --------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Chỉ có một version                      | Worker vừa tạo, deploy lần đầu  | `wrangler rollback` báo lỗi; chưa có bản nào để quay về                                                                                  |
| Version đích đã ra khỏi lịch sử         | Cloudflare chỉ giữ số version giới hạn | Muốn về đó thì phát hành lại đúng commit của nó                                                                                      |
| Cổng khói vẫn thất bại sau khi quay lui | Sự cố không nằm ở mã            | Giữ nguyên bản cũ, báo mức cao — nguyên nhân nằm ở D1, Durable Object, hoặc mạng, không ở bản phát hành                                  |
| Đang có lần phát hành chạy              | Workflow đang chạy              | Chờ workflow xong rồi mới quay lui; quay lui tay trong lúc `wrangler deploy` chạy là hai tiến trình cùng đổi version                    |

## 6. Business rules

| ID          | Rule                                                                                                                                     | Vì sao                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BR-RBK-01` | Quay lui **chỉ** đổi mã đang chạy, cấm chạm lược đồ D1                                                                                   | Quay lui lược đồ là mất dữ liệu đã ghi bằng mã mới. Một lần quay lui đúng nghĩa phải là thao tác không mất gì, nếu không thì không ai dám bấm                                                |
| `BR-RBK-02` | Mỗi lần phát hành chỉ được chứa migration **cộng thêm**: thêm bảng, thêm cột cho phép rỗng, thêm chỉ mục                                | Đây là điều kiện làm `BR-RBK-01` khả thi. Nếu lược đồ mới xoá cột mà mã cũ còn đọc, thì quay lui mã là làm site chết theo cách khác. Cổng: `packages/content-build/tests/gates/migration-expand.ts` |
| `BR-RBK-03` | Xoá hoặc đổi tên cột phải chia thành **hai** lần phát hành, cách nhau ít nhất một lần phát hành thành công                              | Lần một để mã mới ngừng dùng cột đó; lần hai mới xoá. Giữa hai lần luôn tồn tại một bản chạy được với cả hai phiên bản lược đồ                                                              |
| `BR-RBK-04` | Quay lui không phụ thuộc build lại: chỉ dùng version đã deploy mà Cloudflare còn giữ                                                     | Build cần mạng, cần phụ thuộc bên ngoài, và cần vài phút mà lúc đó không có                                                                                                                  |
| `BR-RBK-05` | Không quay lui song song với phát hành                                                                                                   | Quay lui trong lúc đang phát hành là hai tiến trình cùng đổi version của một Worker; kết quả không xác định được                                                                              |
| `BR-RBK-06` | Sau khi quay lui vẫn phải chạy cổng khói                                                                                                 | Quay lui cũng là một lần đổi bản. Không kiểm thì không biết mình vừa đổi sang một bản cũng hỏng                                                                                               |
| `BR-RBK-07` | Mỗi lần quay lui phải để lại dấu vết (log workflow, hoặc ghi chú của người vận hành) và báo qua kênh của [`monitoring-and-alerting.md`](monitoring-and-alerting.md) | Quay lui là tín hiệu có sự cố. Một lần quay lui im lặng nghĩa là nguyên nhân gốc không được ai điều tra                                                                                      |
| `BR-RBK-09` | Quay lui cấm chạy migration ngược                                                                                                        | Migration ngược tự động là cách mất dữ liệu nhanh nhất và không kiểm thử được thật. Nếu bắt buộc phải sửa lược đồ, đó là một lần phát hành mới có người xem xét                              |

`BR-RBK-08` (cấm sửa tệp trong thư mục bản) thuộc đường VPS, đã gỡ theo `D14`; Worker không có thư
mục bản để sửa tay. Số thứ tự giữ nguyên.

## 7. Data

**Đọc:** lịch sử deployment của Worker.
**Ghi:** version đang phục vụ của Worker. Không ghi D1.

### 7.1 Cửa sổ quay lui

| Chỉ số                      | Giá trị                | Ghi chú                                          |
| --------------------------- | ---------------------- | ------------------------------------------------ |
| Số version giữ lại          | do Cloudflare quyết định | Không đặt cam kết số bản trong repo            |
| Thời gian quay lui mục tiêu | dưới 60 giây           | Không có build, không có DDL                     |
| Phạm vi                     | mã Worker              | Không gồm lược đồ, không gồm dữ liệu D1, không gồm secret |

### 7.2 Bảng phân định trách nhiệm

| Loại sự cố                           | Quay lui giải được                             | Ai giải                                                                                |
| ------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Mã mới lỗi logic hoặc lỗi hiển thị   | Có                                             | Lệnh quay lui                                                                          |
| Bản mới không khởi động được         | Có, và cổng khói của phát hành tự làm          | [`release-deploy.md`](release-deploy.md)                                               |
| Thiếu hoặc sai biến môi trường       | Không                                          | Sửa secret/variable rồi phát hành lại, xem [`env-contract.md`](env-contract.md)        |
| Lược đồ đã xoá cột mã cũ cần         | Không                                          | Vi phạm `BR-RBK-03`; chỉ còn đường phát hành tiếp bản sửa                              |
| D1 hoặc Durable Object lỗi           | Không                                          | Sự cố hạ tầng, không phải sự cố bản phát hành                                          |
| Dữ liệu bị ghi sai                   | Không                                          | Khôi phục dữ liệu, xem [`backup-and-restore.md`](backup-and-restore.md)                |

## 8. API contract

Không có route công khai. Quy trình gọi endpoint sức khoẻ do [`health-check.md`](health-check.md)
sở hữu.

## 9. Acceptance criteria

```gherkin
Scenario: BR-RBK-01 — quay lui không chạm lược đồ
  Given bản mới đã áp một DDL cộng thêm
  When chạy wrangler rollback
  Then cột vừa thêm vẫn còn trong D1
  And version đang chạy là version trước đó

Scenario: Quay lui trong dưới 60 giây
  Given hai version đang được giữ
  When chạy wrangler rollback
  Then endpoint sức khoẻ trả 200 trong vòng 60 giây
  And không có bước build nào được chạy

Scenario: BR-RBK-06 — cổng khói chạy sau khi quay lui
  Given version đích cũng hỏng
  When chạy wrangler rollback
  Then cổng khói thất bại
  And một thông báo mức cao được phát

Scenario: BR-RBK-02 — migration xoá cột bị chặn
  Given một lần phát hành chứa migration xoá một cột
  When chạy cổng kiểm migration
  Then cổng báo lỗi và nêu luật hai lần phát hành
```

## 10. Boundaries

**Always**

- Quay lui web và worker cùng nhau để khớp lược đồ.
- Chạy cổng khói sau khi quay lui.
- Để lại dấu vết và báo mỗi lần quay lui.
- Viết migration cộng thêm.

**Ask first**

- Quay lui về version cũ hơn version liền trước.
- Phát hành một migration có xoá hoặc đổi tên cột.

**Never**

- Chạy migration ngược trong lúc quay lui.
- Quay lui song song với phát hành.
- Coi quay lui là cách xử lý sai biến môi trường hoặc sự cố hạ tầng.

## 11. Open questions

| # | Câu hỏi                                                                                                                                         | Chặn gì                  | Chặn phase | Chủ         |
| - | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------- | ----------- |
| 1 | Luật migration cộng thêm đã có cổng `migration-expand`; cần xác nhận cổng đọc cả DDL D1 sinh từ squashed migration, không chỉ thư mục migration Postgres | Độ tin của quay lui      | go-live    | người quyết |
| 2 | Bước quay lui của workflow chỉ gồm web và worker, chưa gồm admin (static assets). Admin có cần quay lui cùng không?                             | Không chặn               | chờ P1     | Infra       |
