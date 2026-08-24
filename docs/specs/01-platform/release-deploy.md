---
spec: RELEASE-DEPLOY
title: Quy trình phát hành không gián đoạn
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-08-18
owns:
  - Quy trình phát hành và điều kiện dừng của từng bước
  - Nguồn code được phép đi lên máy chủ
  - Cổng khói sau khi đổi bản
depends_on:
  - ENV-CONTRACT
  - SERVER-PROVISIONING
  - PROCESS-SUPERVISION
  - HEALTH-CHECK
  - MONITORING-AND-ALERTING
---

# Phát hành lên máy chủ bằng một lệnh

## 1. Objective

Người vận hành chạy **một lệnh** và bản mới lên máy chủ, hoặc không lên chút nào. Không có trạng
thái giữa — không có "đã copy được nửa", không có "đã chạy migration nhưng chưa đổi bản", không
có "bản mới lên nhưng chết và không ai biết".

Yêu cầu thứ hai, quan trọng ngang: **trạng thái máy phát triển không có đường nào chạm tới máy
chủ.** Không phải bằng nội quy nhắc nhau, mà bằng cấu trúc — nguồn code duy nhất là commit đã đẩy
lên kho, nên tệp chưa commit, thư mục phụ thuộc của máy trạm, tệp cấu hình dev và cơ sở dữ liệu
dev **không có phương tiện** để đi lên.

Đo ngày 2026-08-18: `infra/scripts/deploy.sh` dài 50 dòng và mọi bước thật trong đó đều đang bị
chú thích. Không có quy trình phát hành nào tồn tại.

## 2. Actors

| Actor                     | Quyền cần     | Làm được gì ở đây                   |
| ------------------------- | ------------- | ----------------------------------- |
| Người vận hành            | Khoá SSH      | Chạy lệnh phát hành từ máy trạm     |
| Máy chủ                   | Quyền đọc kho | Tự lấy commit về, tự build          |
| Trình giám sát tiến trình |               | Nạp lại web và worker sau khi đổi bản |
| Kênh thông báo            |               | Nhận tin khi phát hành thất bại     |

## 3. Entry points

| Nơi                                           | Actor          | Ghi chú                                              |
| --------------------------------------------- | -------------- | ---------------------------------------------------- |
| `pnpm deploy --host <tên>`                    | Người vận hành | Lớp bọc SSH; mặc định phát hành nhánh chính trên kho |
| `pnpm deploy init --host <tên> --remote <url>` | Người vận hành | Dựng máy trắng: người dùng hệ thống, cây thư mục, bản sao kho |
| `pnpm deploy --host <tên> --ref <tham chiếu>` | Người vận hành | Thẻ hoặc mã commit                                   |
| `pnpm deploy --host <tên> --dry-run`          | Người vận hành | In kế hoạch, không đổi gì trên máy chủ               |
| `mindkid.sh release --ref <tham chiếu>`       |                | Nội dung thật, chạy trên máy chủ tại `/opt/mindkid/bin/` |
| `/var/log/mindkid/deploy.log`                 | Người vận hành | Bản ghi mọi lần chạy                                 |

## 4. Main flow

```
1. Khoá  — một lần phát hành tại một thời điểm; lần thứ hai thoát ngay
2. Chốt commit  — máy chủ tự lấy về, giải tham chiếu thành mã commit đầy đủ
3. Kiểm biến môi trường  — thiếu, rỗng, sai kiểu thì DỪNG, chưa build gì
4. Bày bản  — bung đúng cây tệp của commit đó vào releases/<mốc>-<sha>
5. Cài phụ thuộc  — trong container build, khoá phiên bản, không dùng thư mục của máy trạm
6. Build  — web runtime, worker và static admin SPA trong cùng container build
7. Migration  — chạy trước khi đổi bản; chỉ migration cộng thêm
8. Đổi bản  — đổi liên kết mềm bằng một thao tác nguyên tử, rồi nạp lại worker và web; Nginx đọc static admin từ release
9. Cổng khói  — gọi endpoint sức khoẻ; không phải 200 thì quay lui và thoát khác 0
10. Dọn  — giữ 5 bản gần nhất
```

Mỗi bước ghi một dòng vào tệp log kèm mốc thời gian. Bước nào lỗi thì dừng cả quy trình; không có
bước nào được bỏ qua để đi tiếp.

## 5. Alternative flows

| Nhánh                             | Điều kiện                                | Hành vi                                                                                                                            |
| --------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Tham chiếu không có trên kho      | Nhánh chưa đẩy lên                       | Dừng ở bước 2, chưa tạo thư mục bản nào, in cách xử lý                                                                             |
| Máy trạm có tệp chưa commit       | Cây làm việc bẩn                         | Vẫn phát hành đúng commit trên kho, in cảnh báo kèm số tệp khác biệt. Cấm tự commit, cấm tự đẩy                                    |
| Thiếu biến bắt buộc               | Xem [`env-contract.md`](env-contract.md) | Dừng ở bước 3; bản đang chạy nguyên vẹn                                                                                            |
| Khoá phiên bản lệch tệp mô tả gói | Bước 5 tự thất bại                       | Dừng; đây là hành vi muốn có, không phải lỗi cần nới                                                                               |
| Build hết bộ nhớ                  | Máy thiếu vùng nhớ                       | Dừng ở bước 6; bản đang chạy nguyên vẹn                                                                                            |
| Migration thất bại                | Bước 7                                   | Dừng trước khi đổi bản; bản cũ vẫn phục vụ cơ sở dữ liệu ở trạng thái sau migration một phần, và bản ghi log nêu rõ để người xử lý |
| Cổng khói thất bại                | Bước 9                                   | Đưa liên kết mềm về bản trước, nạp lại, phát thông báo, thoát khác 0                                                               |
| Phát hành đang chạy               | Bước 1                                   | Lần thứ hai thoát ngay, không xếp hàng chờ                                                                                         |
| Bị ngắt giữa đường                | Mất kết nối SSH                          | Liên kết mềm vẫn trỏ bản cũ; thư mục bản dở dang bị dọn ở lần chạy sau                                                             |

## 6. Business rules

| ID          | Rule                                                                                                 | Vì sao                                                                                                                                                                                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BR-DEP-01` | Nguồn code lên máy chủ **chỉ** là commit đã có trên kho; cấm mọi hình thức truyền tệp từ máy trạm    | Đây là điều làm cho "code dev không ảnh hưởng máy chủ" thành sự thật kiểm được, thay vì một lời hứa. Không có kênh truyền tệp thì tệp chưa commit không có cách nào đi lên                                                                                                                        |
| `BR-DEP-02` | Cây làm việc bẩn trên máy trạm **không** chặn phát hành, nhưng phải in cảnh báo                      | Chặn thì người ta sẽ commit rác để qua cổng. In cảnh báo giữ được sự thật: cái đang lên là commit nào                                                                                                                                                                                             |
| `BR-DEP-03` | Cấm quy trình phát hành tự commit, tự đẩy, hay tự sửa mã                                             | Một quy trình vừa được phép sửa mã vừa được phép phát hành là một quy trình có thể phát hành thứ chưa ai đọc                                                                                                                                                                                      |
| `BR-DEP-04` | Kiểm biến môi trường chạy **trước** bước build                                                       | Dừng sau khi build là tốn vài phút để phát hiện một dòng thiếu. Dừng trước khi build thì máy chủ chưa mất gì                                                                                                                                                                                      |
| `BR-DEP-05` | Cài phụ thuộc và build diễn ra **trên máy chủ, trong container**, không trên máy trạm                | Máy trạm là macOS trên chip ARM, máy chủ là Linux trên x86. Thư viện xử lý ảnh có phần nhị phân theo nền tảng, nên artefact build ở máy trạm không dùng được — xem [`repo-bootstrap.md`](../00-foundation/repo-bootstrap.md). Build trong container cũng cắt luôn khác biệt phiên bản của máy chủ |
| `BR-DEP-06` | Migration chạy **trước** khi đổi bản, và chỉ được là migration cộng thêm                             | Đổi bản trước migration nghĩa là mã mới nói chuyện với lược đồ cũ. Ràng buộc cộng thêm là điều kiện để quay lui được, xem [`release-rollback.md`](release-rollback.md)                                                                                                                            |
| `BR-DEP-07` | Đổi bản bằng **một** thao tác nguyên tử                                                              | Nếu có khoảnh khắc liên kết mềm không trỏ đâu, thì có khoảnh khắc site trả lỗi. Một thao tác nguyên tử làm khoảnh khắc đó không tồn tại                                                                                                                                                           |
| `BR-DEP-08` | Sau khi nạp lại phải chạy cổng khói; không phải 200 thì **quay lui**                                 | Phát hành xong mà không kiểm nghĩa là để người dùng làm người kiểm. Luật gốc là `BR-HLT-06` của [`health-check.md`](health-check.md)                                                                                                                                                              |
| `BR-DEP-09` | Một lần phát hành tại một thời điểm, cưỡng chế bằng khoá trên máy chủ                                | Hai lần phát hành song song ghi chồng nhau ở bước migration và bước đổi bản. Hàng đợi chờ không giúp gì: lần sau sẽ chạy lại từ đầu với commit mới hơn                                                                                                                                            |
| `BR-DEP-10` | Mọi bước ghi log kèm mốc thời gian; log cấm chứa giá trị biến bí mật                                 | Không có bản ghi thì không truy được lần phát hành nào làm hỏng. Thi hành `BR-ENV-08` tại nơi log được ghi                                                                                                                                                                                        |
| `BR-DEP-11` | Thất bại phải phát thông báo qua kênh của [`monitoring-and-alerting.md`](monitoring-and-alerting.md) | Một lần phát hành thất bại lúc 23 giờ mà không ai biết là một đêm site chạy bản cũ trong khi người ta tin bản mới đã lên                                                                                                                                                                          |
| `BR-DEP-12` | Phát hành hai lần cùng một commit phải cho cùng kết quả, không được lỗi                              | Đây là tính chất rẻ nhất để kiểm rằng quy trình không dựa vào trạng thái còn sót của lần trước                                                                                                                                                                                                    |
| `BR-DEP-13` | Cấm build hay chạy `pnpm` trong thư mục bản đang phục vụ                                             | Cài phụ thuộc trực tiếp vào bản đang chạy làm nó thay đổi dưới chân tiến trình đang phục vụ. Bản đã bày phải là thứ chỉ-đọc                                                                                                                                                                       |
| `BR-DEP-14` | Chế độ in kế hoạch phải không đổi gì trên máy chủ                                                    | Người vận hành cần một cách xem sắp làm gì mà không phải tin lời mô tả                                                                                                                                                                                                                            |

## 7. Data

**Đọc:** kho trên máy chủ, hai file env runtime, public API build config và tệp cấu hình máy chủ trên máy trạm.
**Ghi:** thư mục bản mới, liên kết mềm bản hiện hành, tệp log phát hành. Cơ sở dữ liệu chỉ bị ghi
bởi bước migration.

### 7.1 Tên và vòng đời của một bản

| Field           | Kiểu         | Ràng buộc                                                       |
| --------------- | ------------ | --------------------------------------------------------------- |
| Tên thư mục bản | text         | Mốc thời gian theo giờ quốc tế cộng bảy ký tự đầu của mã commit |
| Mã commit       | text         | Bốn mươi ký tự, giải từ tham chiếu ở bước 2                     |
| Số bản giữ lại  | số           | 5                                                               |
| Bản hiện hành   | liên kết mềm | Trỏ vào một thư mục trong `releases/`                           |

### 7.2 Thứ tự nạp lại

| Thứ tự | Ứng dụng | Vì sao trước                                                             |
| ------ | -------- | ------------------------------------------------------------------------ |
| 1      | `worker` | Không phục vụ người dùng; nạp trước để mã tiêu thụ việc khớp lược đồ mới |
| 2      | `web`    | Bề mặt công khai, nạp cuối                                               |

### 7.3 Nội dung một dòng log

Mốc thời gian quốc tế, tên bước, kết quả, và khi thất bại thì thêm nguyên nhân. Cấm giá trị bí
mật. Tệp log luân chuyển cùng chính sách ở [`process-supervision.md`](process-supervision.md).

## 8. API contract

Không có route công khai. Quy trình phát hành **gọi** endpoint sức khoẻ do
[`health-check.md`](health-check.md) sở hữu; spec này không định nghĩa lại endpoint đó.

## 9. Acceptance criteria

```gherkin
Scenario: BR-DEP-01 — tệp chưa commit không lên máy chủ
  Given máy trạm có một tệp đã sửa nhưng chưa commit
  When chạy lệnh phát hành
  Then thư mục bản trên máy chủ khớp đúng commit trên kho
  And tệp chưa commit không có trong thư mục bản

Scenario: BR-DEP-02 — cây làm việc bẩn được cảnh báo
  Given máy trạm có ba tệp chưa commit
  When chạy lệnh phát hành
  Then đầu ra chứa cảnh báo nêu số tệp khác biệt
  And lần phát hành vẫn tiếp tục

Scenario: BR-DEP-04 — thiếu biến thì dừng trước khi build
  Given file env trên máy chủ thiếu một biến bắt buộc
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
  And một thông báo được phát

Scenario: BR-DEP-09 — hai lần phát hành song song
  Given một lần phát hành đang chạy
  When chạy lệnh phát hành lần thứ hai
  Then lần thứ hai thoát ngay với thông báo đang có lần phát hành khác

Scenario: BR-DEP-12 — phát hành lại cùng commit
  Given một lần phát hành thành công với commit X
  When phát hành lại đúng commit X
  Then lần thứ hai thành công
  And endpoint sức khoẻ trả 200 suốt quá trình

Scenario: BR-DEP-14 — in kế hoạch không đổi gì
  Given một máy chủ đang chạy
  When chạy lệnh phát hành ở chế độ in kế hoạch
  Then liên kết mềm bản hiện hành không đổi
  And số thư mục trong releases không đổi

Scenario: BR-DEP-06 — migration chạy trước khi đổi bản
  Given một bản mới có một migration cộng thêm
  When phát hành thành công
  Then thứ tự trong log là migration trước, đổi bản sau

Scenario: BR-DEP-10 — log không lộ bí mật
  Given một lần phát hành thành công
  When tìm giá trị của các biến bí mật trong tệp log
  Then không có kết quả nào
```

## 10. Boundaries

**Always**

- Lấy code từ kho, bằng mã commit đầy đủ.
- Kiểm biến môi trường trước khi build.
- Nếu đổi `MFA_ENCRYPTION_KEY`: chạy `npx tsx packages/db/scripts/count-mfa-rows.ts` trên
  production, kiểm số hàng `mfa_settings` đã `confirmed_at`. Có hàng → re-encrypt hoặc re-enroll
  trước khi đổi khoá (`BR-MFA-13`).
- Chạy migration trước khi đổi bản.
- Đổi bản bằng thao tác nguyên tử rồi nạp lại theo thứ tự ở §7.2.
- Chạy cổng khói và quay lui khi thất bại.
- Ghi log từng bước.

**Ask first**

- Bỏ qua cổng khói cho một lần phát hành.
- Phát hành một tham chiếu không phải nhánh chính.
- Đổi số bản giữ lại.
- Thêm bước mới vào quy trình.

**Never**

- Truyền tệp từ máy trạm lên máy chủ.
- Tự commit, tự đẩy, hay tự sửa mã trong quy trình phát hành.
- Cài phụ thuộc hay build trong thư mục bản đang phục vụ.
- Đổi bản trước khi chạy migration.
- Bỏ qua thất bại của một bước để đi tiếp.
- In giá trị biến bí mật ra log hay ra màn hình.

## 11. Open questions

| #   | Câu hỏi                                                                                                                                                                                                                                                       | Chặn gì                      | Chặn phase | Chủ                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------- | ---------------------------------------------------------- |
| 1   | Migration thất bại giữa đường để lược đồ ở trạng thái một phần. Có cần bọc mỗi lần migration trong một giao dịch duy nhất, hay chấp nhận xử lý tay theo bản ghi log?                                                                                          | Điều kiện go-live            | go-live    | người quyết                                                |
| 2   | Cổng lint và kiểm thử của kho hiện chưa có nơi chạy tự động trên kho từ xa. Quy trình phát hành có phải tự chạy `pnpm check` và `pnpm test` trên máy chủ trước khi build, hay tin vào cổng chạy ở máy trạm? Hai phương án đổi thời gian phát hành lấy độ chắc | Mức bảo vệ của lần phát hành | go-live    | người quyết                                                |
| 3   | Thời gian gián đoạn mục tiêu khi nạp lại là bao nhiêu? Chưa đo được vì chưa có máy chủ thật                                                                                                                                                                   | Không chặn                   | chờ P1     | Infra                                                      |
| 4   | Có cần một bước hâm nóng bản mới trước khi đổi liên kết mềm, để yêu cầu đầu tiên không gánh chi phí khởi động?                                                                                                                                                | Không chặn                   | chờ P2     | hoãn — mở lại nếu đo thấy yêu cầu đầu tiên chậm quá ngưỡng |
