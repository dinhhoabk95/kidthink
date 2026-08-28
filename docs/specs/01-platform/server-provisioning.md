---
spec: SERVER-PROVISIONING
title: Dựng máy chủ từ máy trắng
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-08-18
owns:
  - Trạng thái chuẩn của một máy chủ chạy MindKid
  - Bố cục thư mục và tài khoản hệ thống trên máy chủ
  - Cấu hình Nginx và chứng chỉ TLS
depends_on:
  - REPO-BOOTSTRAP
  - ENV-CONTRACT
  - PROCESS-SUPERVISION
---

# Dựng máy chủ từ máy trắng

## 1. Objective

Một máy chủ vừa mua, chỉ có quyền `root` qua khoá SSH, phải trở thành máy chạy được MindKid bằng
**một lệnh**, và lệnh đó phải chạy lại được nhiều lần mà không hỏng thứ đang chạy.

Yêu cầu này không phải để tiện. Nó là điều kiện để trả lời được câu "máy chủ đang ở trạng thái
nào" — nếu trạng thái máy là kết quả của một chuỗi thao tác tay không ai ghi lại, thì không ai
dựng lại được nó sau sự cố, và mọi khác biệt giữa máy chủ với máy phát triển đều là ẩn số.

Spec này cố ý **không** phụ thuộc nhà cung cấp. Cùng một script chạy được trên EC2 và trên VPS
Việt Nam, vì thứ nó cần chỉ là một bản Ubuntu 24.04 và một khoá SSH.

## 2. Actors

| Actor                         | Quyền cần                | Làm được gì ở đây                                     |
| ----------------------------- | ------------------------ | ----------------------------------------------------- |
| Người vận hành                | Khoá SSH vào `root`      | Chạy lệnh dựng máy, ghi file env cho web và worker    |
| Người dùng hệ thống `mindkid` | Không có shell đăng nhập | Chủ sở hữu tiến trình ứng dụng và thư mục release     |
| `root`                        |                          | Chủ sở hữu file env, cấu hình Nginx, dịch vụ hệ thống |

## 3. Entry points

| Nơi                                  | Actor          | Ghi chú                                      |
| ------------------------------------ | -------------- | -------------------------------------------- |
| `pnpm deploy provision --host <tên>` | Người vận hành | Lớp bọc SSH, chạy từ máy trạm                |
| `infra/scripts/provision.sh`         |                | Nội dung thật, chạy trên máy chủ bằng `root` |
| `infra/nginx/`                       |                | Khuôn cấu hình, biến thay là tên miền        |
| `infra/docker-compose.prod.yml`      |                | PostgreSQL 17 và Valkey 9                    |

## 4. Main flow

```
1. Kiểm điều kiện: Ubuntu 24.04, x86_64, tối thiểu 2 vCPU / 4 GB / 40 GB đĩa
2. Cập nhật gói, đặt múi giờ, đặt tên máy
3. Tạo người dùng hệ thống mindkid, không shell đăng nhập, không mật khẩu
4. Tường lửa: chỉ mở 22, 80, 443; mọi cổng khác đóng
5. Cài Docker, Node 24, pnpm 11, Nginx, certbot, PM2, các gói build
6. Tạo bố cục thư mục §7.1, đặt chủ sở hữu và quyền
7. Dựng PostgreSQL 17 và Valkey 9 bằng docker compose, bind loopback
8. Sinh cấu hình Nginx từ khuôn, kiểm cú pháp, nạp lại
9. Xin chứng chỉ TLS, bật gia hạn tự động
10. Đặt luân chuyển log, giới hạn dung lượng log
11. In báo cáo: phiên bản từng thành phần, việc còn phải làm tay
```

Bước 11 luôn in ra hai việc mà script cố ý không tự làm: trỏ DNS về địa chỉ máy, và ghi các file
env theo [`env-contract.md`](env-contract.md) §7.3.

## 5. Alternative flows

| Nhánh                     | Điều kiện                         | Hành vi                                                                           |
| ------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| Chạy lại trên máy đã dựng | Thành phần đã có đúng phiên bản   | Bỏ qua, in dòng "đã có", không cài lại                                            |
| Phiên bản lệch            | Ví dụ PostgreSQL 16 thay vì 17    | Dừng và báo, không tự nâng cấp — nâng cấp cơ sở dữ liệu là việc có kế hoạch riêng |
| Chưa trỏ DNS              | Tên miền chưa phân giải về máy    | Bỏ qua bước xin chứng chỉ, in việc cần làm, các bước còn lại vẫn xong             |
| Thiếu file env            | Chưa ghi `/etc/mindkid/env/*.env` | Dựng máy xong, nhưng in cảnh báo rằng lần phát hành đầu sẽ dừng ở bước kiểm env   |
| Đĩa thiếu chỗ             | Dưới ngưỡng                       | Dừng trước khi cài, vì cài nửa vời khó dọn hơn không cài                          |

## 6. Business rules

| ID          | Rule                                                                                     | Vì sao                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BR-SRV-01` | Script dựng máy phải chạy lại được nhiều lần với cùng kết quả                            | Máy chủ sống nhiều năm và sẽ được sửa nhiều lần. Script chỉ chạy đúng một lần trên máy trắng là script không ai dám chạy lần thứ hai, và trạng thái máy quay về chỗ không ai biết            |
| `BR-SRV-02` | Ứng dụng chạy bằng người dùng hệ thống `mindkid`, không phải `root`                      | Một lỗi trong tiến trình web chạy bằng `root` là toàn quyền máy chủ. Chi phí của luật này bằng không                                                                                         |
| `BR-SRV-03` | PostgreSQL và Valkey chỉ bind `127.0.0.1`                                                | Valkey không đặt mật khẩu mà lộ ra mạng là đường chiếm máy cổ điển. Ứng dụng chạy cùng máy nên không có lý do nào cần lộ                                                                     |
| `BR-SRV-04` | Tường lửa chỉ mở 22, 80, 443                                                             | Mọi cổng mở thêm phải có người xin và có lý do ghi lại. Mặc định đóng là cách duy nhất giữ được danh sách cổng đúng theo thời gian                                                           |
| `BR-SRV-05` | Phiên bản PostgreSQL và Valkey trên máy chủ phải khớp phiên bản chính của máy phát triển | Kiểm thử trên phiên bản khác production là kiểm thử sai thứ. Luật này đã có ở [`repo-bootstrap.md`](../00-foundation/repo-bootstrap.md) `BR-RBS-07`; spec này chỉ thi hành nó ở phía máy chủ |
| `BR-SRV-06` | File env do `root` sở hữu, quyền `0600`, nằm ngoài thư mục release                       | Xem [`env-contract.md`](env-contract.md) `BR-ENV-05`. Người dùng `mindkid` đọc được qua trình giám sát tiến trình, không cần quyền ghi                                                       |
| `BR-SRV-07` | Script cấm ghi hay xoá file env, cấm chạm dữ liệu trong volume của cơ sở dữ liệu         | Một script dựng máy chạy lại được phải an toàn khi chạy lại. Nếu nó có thể xoá dữ liệu thì "chạy lại được" trở thành "xoá được production bằng một lệnh"                                     |
| `BR-SRV-08` | Chứng chỉ TLS gia hạn tự động, có kiểm gia hạn                                           | Chứng chỉ hết hạn là sự cố toàn site, và luôn xảy ra vào lúc không ai chờ                                                                                                                    |
| `BR-SRV-09` | Log có luân chuyển và có giới hạn dung lượng ngay từ lúc dựng máy                        | Đĩa đầy vì log là nguyên nhân chết máy chủ phổ biến nhất, và nó chết cả cơ sở dữ liệu cùng lúc                                                                                               |
| `BR-SRV-10` | Script in phiên bản thật của từng thành phần khi kết thúc                                | Không có bản in đó thì "máy đã dựng" là lời khai, không phải bằng chứng                                                                                                                      |
| `BR-SRV-11` | Cấm cài trình biên dịch hay công cụ phát triển vào đường chạy của ứng dụng               | Ứng dụng chạy mã đã build. Công cụ build sống trong container build, xem [`release-deploy.md`](release-deploy.md) §4 bước 5                                                                  |

## 7. Data

**Đọc:** tệp cấu hình máy chủ trên máy trạm (tên máy, tên miền, địa chỉ, người dùng SSH).
**Ghi:** thư mục và tệp cấu hình trên máy chủ. Không ghi cơ sở dữ liệu nào.

### 7.1 Bố cục trên máy chủ

```
/opt/mindkid/
├── repo.git/                bản sao chỉ-đọc của kho, máy chủ tự lấy về
├── releases/<mốc>-<sha>/    một thư mục mỗi lần phát hành
├── current -> releases/...  liên kết mềm trỏ bản đang chạy
├── shared/                  thứ sống lâu hơn một release
├── bin/                     mindkid.sh · lib/ · tests/
└── compose/                 docker-compose.prod.yml · datastore.env · nginx/ · pm2/
/etc/mindkid/env/           web.env · worker.env  (0600 root)
/etc/mindkid/deploy.conf    đích thông báo của quy trình phát hành (0600 root)
/var/log/mindkid/           deploy.log · log từng ứng dụng
```

Chủ sở hữu: `/opt/mindkid` thuộc `mindkid`, `/etc/mindkid` thuộc `root`, `/var/log/mindkid`
thuộc `mindkid` với quyền ghi cho trình giám sát tiến trình.

`compose/datastore.env` chứa mật khẩu PostgreSQL của container, `0600 root:root`. Nó không nằm
trong `/etc/mindkid/env/` vì các tệp ở đó thuộc các tiến trình runtime (`BR-ENV-04`); admin
static nhận public API origin lúc build, còn cơ sở dữ liệu không phải một tiến trình ứng dụng.

Ba lệnh của spec này và của hai spec phát hành đi qua **một** điểm vào: `bin/mindkid.sh <verb>`.
Một script nghĩa là một khoá, một tệp log, và một đích cho cổng kiểm cú pháp shell.

### 7.2 Thành phần và phiên bản

| Thành phần | Phiên bản             | Cách chạy                                            |
| ---------- | --------------------- | ---------------------------------------------------- |
| Ubuntu     | 24.04 LTS             | Hệ điều hành máy chủ                                 |
| Node       | 24                    | Chỉ để chạy trình giám sát tiến trình và mã đã build |
| pnpm       | 11                    | Cài phụ thuộc trong container build                  |
| PostgreSQL | 17                    | Docker, bind loopback, volume riêng                  |
| Valkey     | 9                     | Docker, bind loopback, volume riêng                  |
| Nginx      | bản của bản phân phối | Chạy trên máy, không trong Docker                    |
| certbot    | bản của bản phân phối | Gia hạn tự động                                      |

### 7.3 Cổng

| Cổng        | Ai nghe             | Lộ ra ngoài                                             |
| ----------- | ------------------- | ------------------------------------------------------- |
| 80 · 443    | Nginx               | Có                                                      |
| 22          | SSH                 | Có, nên giới hạn theo địa chỉ nếu nhà cung cấp cho phép |
| 3000        | `web`               | Không                                                   |
| 3099        | `worker`            | Không                                                   |
| 5432 · 6379 | PostgreSQL · Valkey | Không                                                   |

## 8. API contract

Không có route công khai trong spec này. Nginx là thứ duy nhất nhận yêu cầu từ ngoài; nó phục vụ
admin static trực tiếp, và chuyển API cùng SSR web tới cổng 3000. Cổng 3099 được **giữ chỗ** cho
`worker` trong bảng §7.3 nhưng không có socket nào lắng nghe ở đó: `BR-JOB-04` cấm `apps/worker`
mở HTTP, và nó không mở. Giữ số đó ở đây để thứ khác không chiếm rồi gọi là vô tình.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SRV-01 — chạy lại không đổi gì
  Given một máy chủ đã dựng xong và đang chạy
  When chạy lại lệnh dựng máy
  Then không tiến trình ứng dụng nào bị dừng
  And không thành phần nào bị cài lại
  And mã thoát là 0

Scenario: BR-SRV-02 — ứng dụng không chạy bằng root
  Given web và worker đang chạy
  When liệt kê tiến trình kèm chủ sở hữu
  Then cả hai thuộc người dùng mindkid

Scenario: BR-SRV-03 — cơ sở dữ liệu không lộ ra ngoài
  Given máy chủ đã dựng xong
  When quét cổng 5432 và 6379 từ một máy khác
  Then cả hai cổng không phản hồi

Scenario: BR-SRV-05 — phiên bản lệch thì dừng
  Given trên máy có PostgreSQL phiên bản chính khác 17
  When chạy lệnh dựng máy
  Then script dừng và nêu phiên bản đo được

Scenario: BR-SRV-07 — không chạm file env và dữ liệu
  Given các file env đã có nội dung và cơ sở dữ liệu đã có dữ liệu
  When chạy lại lệnh dựng máy
  Then nội dung các file env không đổi
  And số hàng các bảng chính không đổi

Scenario: BR-SRV-04 — chỉ cổng công khai cần thiết mở
  Given máy chủ đã dựng xong
  When liệt kê luật tường lửa
  Then chỉ có 22, 80, 443 được cho vào

Scenario: BR-SRV-10 — có bản in phiên bản
  Given lệnh dựng máy vừa kết thúc
  Then đầu ra chứa phiên bản thật của Node, pnpm, PostgreSQL, Valkey, Nginx
```

## 10. Boundaries

**Always**

- Giữ script chạy lại được nhiều lần.
- Chạy ứng dụng bằng người dùng hệ thống không có shell.
- Bind cơ sở dữ liệu và cache vào loopback.
- In phiên bản thật khi kết thúc.

**Ask first**

- Mở thêm cổng, hoặc đổi luật tường lửa.
- Nâng phiên bản chính của PostgreSQL hay Valkey.
- Thêm dịch vụ mới vào tệp compose của máy chủ.
- Đổi nhà cung cấp hoặc cấu hình máy.

**Never**

- Chạy ứng dụng bằng `root`.
- Ghi hay xoá file env trong script dựng máy.
- Chạm dữ liệu trong volume cơ sở dữ liệu.
- Dùng lại tệp compose của môi trường phát triển cho máy chủ.
- Cài công cụ build vào đường chạy của ứng dụng.

## 11. Open questions

| #   | Câu hỏi                                                                                                                                                                   | Chặn gì                                       | Chặn phase | Chủ                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------- | ---------------------------------------- |
| 1   | Nhà cung cấp và cấu hình máy thật: EC2 vùng Singapore, hay VPS trong nước? Độ trễ tới người dùng Việt Nam đổi lấy việc ở cùng vùng với kho ảnh và dịch vụ email đang dùng | Chọn cấu hình, và bước kiểm thử trên máy thật | go-live    | người quyết                              |
| 2   | Số vCPU quyết định số tiến trình và kích thước pool kết nối. Câu hỏi 9 của [`repo-bootstrap.md`](../00-foundation/repo-bootstrap.md) vẫn đang hoãn vì lý do này           | Tinh chỉnh, không chặn lần phát hành đầu      | chờ P1     | hoãn — mở lại khi biết cấu hình máy      |
| 3   | Tên miền thật và ai giữ quyền quản trị DNS                                                                                                                                | Bước xin chứng chỉ TLS                        | go-live    | người quyết                              |
| 4   | ĐÃ TRẢ LỜI (Task #109): cần vùng nhớ tráo đổi. `provision` tạo tệp tráo đổi 4 GB khi RAM dưới 8 GB, ghi vào `/etc/fstab` để nó sống qua khởi động lại. Số đo bộ nhớ đỉnh lúc build vẫn phải lấy trên máy thật ở WP109.9 | Không còn chặn                                | đóng       | Infra                                    |
| 5   | Có dựng máy thứ hai cho môi trường thử trước khi phát hành hay không                                                                                                      | Không chặn                                    | chờ P2     | hoãn — thêm khi có người thứ hai cần thử |
