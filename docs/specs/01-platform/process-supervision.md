---
spec: PROCESS-SUPERVISION
title: Giám sát tiến trình và luân chuyển log
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-30
owns:
  - Mô hình tiến trình của web và worker trên máy chủ
  - Chính sách khởi động lại và khởi động cùng máy
  - Luân chuyển log của tiến trình ứng dụng
depends_on:
  - REPO-BOOTSTRAP
  - ENV-CONTRACT
  - HEALTH-CHECK
  - JOB-QUEUE
---

# Giám sát tiến trình ứng dụng trên máy chủ

## 1. Objective

Hai tiến trình runtime — `web` và `worker` — phải chạy liên tục, tự sống lại sau khi chết, tự lên
lại sau khi máy khởi động, và nạp bản mới **không cắt** yêu cầu đang xử lý. `admin` là static SPA,
được Nginx phục vụ từ release và không có tiến trình runtime riêng. Hiện chưa có định
nghĩa nào cho việc đó: đo ngày 2026-08-18, kho không có tệp cấu hình trình giám sát tiến trình
nào và không có dịch vụ hệ thống nào.

Không có mô hình tiến trình viết ra thì ba câu hỏi vận hành cơ bản không có câu trả lời: chạy mấy
bản của `web`, một tiến trình chết thì ai dựng lại, và log của tiến trình đi đâu. Cả ba câu đều
chỉ lộ ra vào lúc tệ nhất — lúc máy vừa khởi động lại, hoặc lúc đĩa vừa đầy.

## 2. Actors

| Actor                     | Quyền cần                      | Làm được gì ở đây                                                         |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| Trình giám sát tiến trình | Chạy dưới người dùng `mindkid` | Giữ web và worker sống, nạp lại bản mới, ghi log                         |
| Dịch vụ hệ thống          | `root`                         | Dựng trình giám sát khi máy khởi động                                     |
| Người vận hành            | SSH                            | Xem trạng thái, xem log, nạp lại thủ công                                 |
| Quy trình phát hành       |                                | Gọi nạp lại sau khi đổi bản, xem [`release-deploy.md`](release-deploy.md) |

## 3. Entry points

| Nơi                                         | Actor            | Ghi chú                                 |
| ------------------------------------------- | ---------------- | --------------------------------------- |
| `infra/pm2/ecosystem.config.cjs`            | Người phát triển | Định nghĩa web và worker, nằm trong kho  |
| `pnpm deploy status --host <tên>`           | Người vận hành   | Trạng thái hai tiến trình, bản đang chạy |
| `pnpm deploy logs --host <tên> --app <tên>` | Người vận hành   | Log một ứng dụng                        |
| `/var/log/mindkid/<app>/`                   |                  | Log ra tệp, có luân chuyển              |

## 4. Main flow

```
1. Máy khởi động  →  dịch vụ hệ thống dựng trình giám sát dưới người dùng mindkid
2. Trình giám sát đọc ecosystem.config.cjs trong thư mục current
3. Mỗi tiến trình nạp file env của riêng nó (web.env | worker.env); admin dùng config public lúc build
4. Ứng dụng khởi động, tự kiểm danh mục biến của mình, thiếu thì thoát ngay
5. web       chạy nhiều bản, chế độ cluster, số bản theo số vCPU
   worker    chạy một bản, chế độ fork — song song do hàng đợi tự quản
6. Tiến trình chết  →  trình giám sát dựng lại, có giãn cách tăng dần
7. Chết liên tục quá ngưỡng  →  ngừng dựng lại, phát thông báo
8. Phát hành bản mới  →  nạp lại từng bản một, không cắt kết nối đang mở
```

## 5. Alternative flows

| Nhánh                       | Điều kiện                               | Hành vi                                                                                 |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| Thiếu biến bắt buộc         | Ứng dụng thoát lúc khởi động            | Trình giám sát thử lại tới ngưỡng rồi ngừng và phát thông báo; không thử vô hạn         |
| Vượt ngưỡng bộ nhớ          | Một tiến trình phình bộ nhớ             | Trình giám sát dựng lại tiến trình đó và ghi log lý do                                  |
| `worker` chết giữa một việc | Việc đang xử lý                         | Hàng đợi trả việc về, xem [`job-queue.md`](job-queue.md); tiến trình không tự xử lý lại |
| Nạp lại thất bại            | Bản mới không lên được                  | Bản cũ vẫn phục vụ; quy trình phát hành đưa liên kết mềm về bản trước                   |
| Máy khởi động lại           | Sau mất điện hoặc nâng cấp hệ điều hành | Hai tiến trình runtime tự lên; Nginx phục vụ admin static                          |

## 6. Business rules

| ID          | Rule                                                                                     | Vì sao                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BR-SUP-01` | Web và worker phải tự lên lại sau khi máy khởi động                                     | Máy chủ sẽ khởi động lại, có kế hoạch hoặc không. Admin static không cần supervisor                                                      |
| `BR-SUP-02` | Đổi bản dùng **nạp lại** chứ không dừng rồi bật                                          | Dừng rồi bật cắt mọi yêu cầu đang xử lý. Nạp lại từng bản một giữ site sống suốt lần phát hành                                                                                               |
| `BR-SUP-03` | `worker` chạy chế độ fork một bản, không chạy cluster                                    | Song số việc do hàng đợi quản. Nhân bản tiến trình tiêu thụ là cách nhân đôi công việc và nhân đôi email gửi ra                                                                              |
| `BR-SUP-04` | Mỗi ứng dụng chỉ nạp file env của chính nó                                               | Thi hành `BR-ENV-04` ở tầng tiến trình. Một tệp env chung là cách nhanh nhất để mọi tiến trình biết mọi bí mật                                                                               |
| `BR-SUP-05` | Chết liên tục quá ngưỡng thì **ngừng** dựng lại và phát thông báo                        | Dựng lại vô hạn một tiến trình chết ngay khi lên là vòng lặp ăn hết đĩa bằng log, và nó che mất nguyên nhân thật                                                                             |
| `BR-SUP-06` | Log ra tệp trong `/var/log/mindkid/<app>/`, có luân chuyển và giới hạn dung lượng        | Log không giới hạn làm đầy đĩa, và đĩa đầy dừng cả cơ sở dữ liệu trên cùng máy                                                                                                               |
| `BR-SUP-07` | Log của tiến trình cấm chứa giá trị biến bí mật                                          | Thi hành `BR-ENV-08` tại nơi log thật sự được ghi                                                                                                                                            |
| `BR-SUP-08` | Số bản của `web` và kích thước pool kết nối phải tính cùng nhau                          | Mỗi tiến trình dựng một pool riêng. Nhân số tiến trình mà không chia lại pool là cách vượt giới hạn kết nối của cơ sở dữ liệu, xem [`repo-bootstrap.md`](../00-foundation/repo-bootstrap.md) |
| `BR-SUP-09` | Tiến trình chạy **mã đã build**, cấm chạy TypeScript qua loader trong đường chạy máy chủ | Đo 2026-08-18: `apps/worker` có lệnh chạy bằng loader phát triển. Loader biên dịch lúc chạy, nên lỗi kiểu và lỗi cú pháp nổ ở máy chủ chứ không nổ ở cổng kiểm                               |
| `BR-SUP-10` | Danh sách ứng dụng và tham số của chúng nằm trong kho, không nằm trên máy chủ            | Cấu hình sửa tay trên máy chủ mất khi dựng lại máy, và không ai biết nó đã từng khác                                                                                                         |

## 7. Data

### 7.0 Người dùng của tiến trình

Trình giám sát chạy bằng `root` và hạ từng ứng dụng xuống người dùng `mindkid`. Đây là cách duy
nhất để `BR-SRV-02` và `BR-ENV-05` cùng đúng: chỉ `root` đọc được tệp env `0600 root:root`, còn
tiến trình phục vụ người dùng thì không được là `root`. Trình giám sát đọc tệp và truyền giá trị
xuống tiến trình con; tiến trình con không bao giờ mở tệp env.


**Đọc:** tệp định nghĩa ứng dụng trong kho, hai file env trên máy chủ.
**Ghi:** log ứng dụng, trạng thái tiến trình của trình giám sát. Không ghi cơ sở dữ liệu.

### 7.1 Hai tiến trình runtime

| Ứng dụng | Cổng | Chế độ  | Số bản                    | Lệnh chạy                          |
| -------- | ---- | ------- | ------------------------- | ---------------------------------- |
| `web`    | 3000 | cluster | theo số vCPU, tối thiểu 2 | mã Nitro đã build                  |
| `worker` | 3099 | fork    | 1                         | mã đã biên dịch, không dùng loader |

### 7.2 Ngưỡng

| Tham số                          | Giá trị                    | Ghi chú                                                     |
| -------------------------------- | -------------------------- | ----------------------------------------------------------- |
| Ngưỡng bộ nhớ mỗi tiến trình     | 700 MB                     | Vượt thì dựng lại; con số chốt lại sau khi đo trên máy thật |
| Số lần dựng lại liên tiếp tối đa | 5                          | Vượt thì ngừng và phát thông báo                            |
| Giãn cách giữa hai lần dựng lại  | tăng dần, tối đa 30 giây   | Tránh vòng lặp dựng lại nhanh                               |
| Thời gian chờ tắt êm             | 10 giây                    | Đủ để yêu cầu đang xử lý xong                               |
| Luân chuyển log                  | mỗi ngày, giữ 14 ngày, nén | Giới hạn cứng để đĩa không đầy                              |

## 8. API contract

Không có route công khai. Trạng thái sống của ứng dụng được đọc qua endpoint sức khoẻ do
[`health-check.md`](health-check.md) sở hữu; spec này chỉ nói tiến trình nào phải sống.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SUP-01 — tự lên sau khi máy khởi động
  Given web và worker đang chạy
  When khởi động lại máy chủ
  Then web và worker lên lại không cần người can thiệp
  And endpoint sức khoẻ trả 200

Scenario: BR-SUP-02 — nạp lại không cắt yêu cầu
  Given một vòng lặp gọi trang công khai 10 lần mỗi giây
  When nạp lại web và worker
  Then không có yêu cầu nào trả mã 5xx

Scenario: BR-SUP-05 — chết liên tục thì ngừng dựng lại
  Given một ứng dụng thoát ngay mỗi lần khởi động
  When trình giám sát đã dựng lại tới ngưỡng
  Then nó ngừng dựng lại
  And một thông báo được phát

Scenario: BR-SUP-03 — worker chỉ một bản
  Given web và worker đang chạy
  When liệt kê tiến trình
  Then worker có đúng một bản

Scenario: BR-SUP-04 — tiến trình không thấy bí mật của tiến trình khác
  Given worker đang chạy
  When đọc danh mục biến môi trường của tiến trình worker
  Then không có biến bí mật nào của web trong đó

Scenario: BR-SUP-09 — không chạy TypeScript qua loader
  Given web và worker đang chạy
  When đọc dòng lệnh của từng tiến trình
  Then không dòng nào gọi loader phát triển

Scenario: BR-SUP-06 — log có giới hạn
  Given ứng dụng đã chạy hơn 14 ngày
  When liệt kê tệp log
  Then tệp cũ hơn 14 ngày không còn
  And tệp cũ đã được nén
```

## 10. Boundaries

**Always**

- Dựng trình giám sát khi máy khởi động.
- Nạp lại từng bản một khi đổi bản.
- Cho mỗi ứng dụng đúng file env của nó.
- Giới hạn dung lượng log.

**Ask first**

- Đổi số bản của `web`, hoặc đổi ngưỡng bộ nhớ.
- Cho `worker` chạy nhiều bản.
- Thêm ứng dụng thứ tư vào máy chủ.

**Never**

- Dừng rồi bật khi nạp lại làm được.
- Chạy TypeScript qua loader trên máy chủ.
- Sửa danh sách ứng dụng trực tiếp trên máy chủ.
- Ghi log không giới hạn dung lượng.
- Cho một tệp env chung cho web và worker.

## 11. Open questions

| #   | Câu hỏi                                                                                                                                              | Chặn gì                                  | Chặn phase | Chủ                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------- | --------------------------------------------------- |
| 1   | Số bản `web` và ngưỡng bộ nhớ 700 MB đều là số tạm, phải đo trên máy thật                                                                            | Tinh chỉnh, không chặn lần phát hành đầu | chờ P1     | Infra                                               |
| 2   | Khi có máy thứ hai, `worker` chạy ở máy nào? Một bản duy nhất toàn hệ thống là ràng buộc của `BR-SUP-03`, và nó cần một nơi phát ngôn khi có hai máy | Kiến trúc nhiều máy                      | chờ P5     | hoãn — mở lại khi tách máy                          |
| 3   | Có cần lưu log ra ngoài máy chủ, hay giữ 14 ngày trên đĩa là đủ?                                                                                     | Điều tra sự cố sau khi máy chết          | chờ P2     | hoãn — mở lại khi có sự cố cần điều tra quá 14 ngày |
