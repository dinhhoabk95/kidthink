---
spec: RELEASE-ROLLBACK
title: Quay lui bản phát hành
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-30
owns:
  - Quy trình quay lui và giới hạn của nó
  - Số bản giữ lại để quay lui được
  - Ràng buộc migration sinh ra từ việc quay lui
depends_on:
  - RELEASE-DEPLOY
  - PROCESS-SUPERVISION
---

# Quay lui về bản đã chạy được

## 1. Objective

Khi bản vừa phát hành sai — không phải chết hẳn, mà sai theo cách chỉ người dùng thấy — người vận
hành cần đưa hệ thống về bản trước trong **dưới một phút**, bằng một lệnh, không cần build lại và
không cần suy nghĩ.

Việc này là một outcome riêng, không phải một nhánh của phát hành. Cổng khói ở
[`release-deploy.md`](release-deploy.md) chỉ quay lui được lỗi mà máy nhìn thấy ngay sau khi nạp
lại. Lỗi do người phát hiện sau đó — sai giá, sai nội dung hiển thị cho trẻ, sai đường liên kết
trong email — cần một lệnh do người bấm, và nó phải tồn tại độc lập với lần phát hành đã kết thúc.

Spec này cũng là nơi phát ngôn một ràng buộc ngược lên cách viết migration: hệ thống chỉ quay lui
được nếu lược đồ mới vẫn phục vụ được mã cũ.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người vận hành | Khoá SSH | Chạy lệnh quay lui, đọc kết quả |
| Trình giám sát tiến trình | | Nạp lại web và worker với bản cũ |
| Người viết migration | | Chịu ràng buộc cộng thêm ở §6 |

## 3. Entry points

| Nơi | Actor | Ghi chú |
|---|---|---|
| `pnpm deploy rollback --host <tên>` | Người vận hành | Về bản liền trước |
| `pnpm deploy rollback --host <tên> --to <tên bản>` | Người vận hành | Về một bản cụ thể trong 5 bản giữ lại |
| `pnpm deploy status --host <tên>` | Người vận hành | Xem danh sách bản còn giữ và bản đang chạy |
| `mindkid.sh rollback [--to <tên bản>]` | | Nội dung thật, chạy trên máy chủ tại `/opt/mindkid/bin/` |

## 4. Main flow

```
1. Khoá  — dùng chung khoá với phát hành; không quay lui khi đang phát hành
2. Chọn đích  — bản liền trước, hoặc bản được nêu tên nếu còn trong 5 bản giữ lại
3. Kiểm đích  — thư mục bản còn nguyên và có artefact đã build; không thì dừng
4. Đổi bản  — đổi liên kết mềm bằng một thao tác nguyên tử
5. Nạp lại  — worker, web theo đúng thứ tự của phát hành
6. Cổng khói  — endpoint sức khoẻ phải 200
7. Ghi log và phát thông báo: đã quay lui từ bản nào về bản nào, ai chạy
```

Không có bước build và không có bước migration. Đó là lý do quy trình này đo bằng giây thay vì
bằng phút.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Chỉ có một bản | Máy vừa dựng, mới phát hành lần đầu | Dừng và nói rõ chưa có bản nào để quay về |
| Bản đích đã bị dọn | Cũ hơn 5 bản | Dừng; muốn về đó thì phát hành lại đúng mã commit của nó |
| Bản đích thiếu artefact | Thư mục còn nhưng build dở | Dừng ở bước 3, không đổi liên kết mềm |
| Cổng khói vẫn thất bại sau khi quay lui | Sự cố không nằm ở mã | Giữ nguyên bản cũ, phát thông báo mức cao — nguyên nhân nằm ở cơ sở dữ liệu, cache, hoặc mạng, không ở bản phát hành |
| Đang có lần phát hành chạy | Khoá đang bị giữ | Dừng ngay, không xếp hàng |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RBK-01` | Quay lui **chỉ** đổi mã đang chạy, cấm chạm lược đồ cơ sở dữ liệu | Quay lui lược đồ là mất dữ liệu đã ghi bằng mã mới. Một lần quay lui đúng nghĩa phải là thao tác không mất gì, nếu không thì không ai dám bấm |
| `BR-RBK-02` | Mỗi lần phát hành chỉ được chứa migration **cộng thêm**: thêm bảng, thêm cột cho phép rỗng, thêm chỉ mục | Đây là điều kiện làm `BR-RBK-01` khả thi. Nếu lược đồ mới xoá cột mà mã cũ còn đọc, thì quay lui mã là làm site chết theo cách khác |
| `BR-RBK-03` | Xoá hoặc đổi tên cột phải chia thành **hai** lần phát hành, cách nhau ít nhất một lần phát hành thành công | Lần một để mã mới ngừng dùng cột đó; lần hai mới xoá. Giữa hai lần luôn tồn tại một bản chạy được với cả hai phiên bản lược đồ |
| `BR-RBK-04` | Giữ **5** bản gần nhất kèm artefact đã build | Quay lui không được phụ thuộc vào việc build lại: build cần mạng, cần phụ thuộc bên ngoài, và cần vài phút mà lúc đó không có |
| `BR-RBK-05` | Quay lui dùng chung khoá với phát hành | Quay lui trong lúc đang phát hành là hai tiến trình cùng đổi một liên kết mềm; kết quả không xác định được |
| `BR-RBK-06` | Sau khi quay lui vẫn phải chạy cổng khói | Quay lui cũng là một lần đổi bản. Không kiểm thì không biết mình vừa đổi sang một bản cũng hỏng |
| `BR-RBK-07` | Mỗi lần quay lui phải ghi log và phát thông báo | Quay lui là tín hiệu có sự cố. Một lần quay lui im lặng nghĩa là nguyên nhân gốc không được ai điều tra |
| `BR-RBK-08` | Cấm sửa tệp trong thư mục bản để "vá nhanh" | Bản đã bày là bằng chứng về một commit. Sửa tay làm bản đó không còn tương ứng commit nào, và lần dựng lại máy tiếp theo sẽ mất bản vá đó mà không ai nhớ |
| `BR-RBK-09` | Quay lui cấm chạy migration ngược | Migration ngược tự động là cách mất dữ liệu nhanh nhất và không kiểm thử được thật. Nếu bắt buộc phải sửa lược đồ, đó là một lần phát hành mới có người xem xét |

## 7. Data

**Đọc:** danh sách thư mục bản, liên kết mềm bản hiện hành.
**Ghi:** liên kết mềm bản hiện hành, tệp log phát hành. Không ghi cơ sở dữ liệu.

### 7.1 Cửa sổ quay lui

| Chỉ số | Giá trị | Ghi chú |
|---|---|---|
| Số bản giữ lại | 5 | Cùng con số với chính sách dọn của phát hành |
| Thời gian quay lui mục tiêu | dưới 60 giây | Không có build, không có migration |
| Phạm vi | mã ứng dụng | Không gồm lược đồ, không gồm dữ liệu, không gồm tệp env |

### 7.2 Bảng phân định trách nhiệm

| Loại sự cố | Quay lui giải được | Ai giải |
|---|---|---|
| Mã mới lỗi logic hoặc lỗi hiển thị | Có | Lệnh quay lui |
| Bản mới không khởi động được | Có, và cổng khói của phát hành tự làm | [`release-deploy.md`](release-deploy.md) |
| Thiếu hoặc sai biến môi trường | Không | Sửa file env rồi phát hành lại, xem [`env-contract.md`](env-contract.md) |
| Lược đồ đã xoá cột mã cũ cần | Không | Vi phạm `BR-RBK-03`; chỉ còn đường phát hành tiếp bản sửa |
| Cơ sở dữ liệu hoặc cache chết | Không | Sự cố hạ tầng, không phải sự cố bản phát hành |
| Dữ liệu bị ghi sai | Không | Khôi phục dữ liệu, xem [`backup-and-restore.md`](backup-and-restore.md) |

## 8. API contract

Không có route công khai. Quy trình gọi endpoint sức khoẻ do [`health-check.md`](health-check.md)
sở hữu.

## 9. Acceptance criteria

```gherkin
Scenario: BR-RBK-01 — quay lui không chạm lược đồ
  Given bản mới đã chạy một migration cộng thêm
  When chạy lệnh quay lui
  Then cột vừa thêm vẫn còn trong lược đồ
  And bản đang chạy là bản trước đó

Scenario: Quay lui trong dưới 60 giây
  Given hai bản đang được giữ
  When chạy lệnh quay lui
  Then endpoint sức khoẻ trả 200 trong vòng 60 giây
  And không có bước build nào trong log

Scenario: BR-RBK-04 — bản thứ sáu không quay về được
  Given sáu lần phát hành đã diễn ra
  When yêu cầu quay lui về bản đầu tiên
  Then lệnh dừng và nói rõ bản đó đã bị dọn

Scenario: BR-RBK-05 — không quay lui khi đang phát hành
  Given một lần phát hành đang chạy
  When chạy lệnh quay lui
  Then lệnh thoát ngay với thông báo khoá đang bị giữ

Scenario: BR-RBK-06 — cổng khói chạy sau khi quay lui
  Given bản đích cũng hỏng
  When chạy lệnh quay lui
  Then cổng khói thất bại
  And một thông báo mức cao được phát

Scenario: BR-RBK-07 — mỗi lần quay lui đều có bản ghi
  Given một lần quay lui thành công
  Then tệp log có dòng nêu bản nguồn, bản đích, và thời điểm
  And một thông báo được phát

Scenario: BR-RBK-02 — migration xoá cột bị chặn
  Given một lần phát hành chứa migration xoá một cột
  When chạy cổng kiểm migration
  Then cổng báo lỗi và nêu luật hai lần phát hành
```

## 10. Boundaries

**Always**
- Giữ 5 bản kèm artefact đã build.
- Chạy cổng khói sau khi quay lui.
- Ghi log và phát thông báo mỗi lần quay lui.
- Viết migration cộng thêm.

**Ask first**
- Quay lui về bản cũ hơn bản liền trước.
- Đổi số bản giữ lại.
- Phát hành một migration có xoá hoặc đổi tên cột.

**Never**
- Chạy migration ngược trong lúc quay lui.
- Sửa tệp trực tiếp trong thư mục bản.
- Quay lui song song với phát hành.
- Coi quay lui là cách xử lý sai biến môi trường hoặc sự cố hạ tầng.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Luật migration cộng thêm cần một cổng tự động đọc tệp migration, hay dựa vào người xem xét? Không có cổng thì `BR-RBK-02` là ý định, không phải ràng buộc | Độ tin của quay lui | go-live | người quyết |
| 2 | Năm bản là bao nhiêu ngày trong thực tế? Phụ thuộc nhịp phát hành, mà nhịp đó chưa có | Không chặn | chờ P1 | Infra |
| 3 | Có cần lệnh quay lui chạy được ngay trên máy chủ khi máy trạm không dùng được | Xử lý sự cố ngoài giờ | chờ P2 | hoãn — script đã nằm trên máy chủ, chỉ cần viết lại hướng dẫn |
