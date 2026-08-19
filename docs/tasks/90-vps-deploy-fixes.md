# Sửa lỗi — Task #90: kết quả review và quyết định

> Bổ sung cho [`90-vps-deploy-plan.md`](90-vps-deploy-plan.md) và [`90-vps-deploy-todo.md`](90-vps-deploy-todo.md).
> File này ghi những gì đo được ngày 2026-08-19 và quyết định đã chốt để sửa, không nhắc lại kế hoạch cũ.

## 1. Vì sao có file này

Todo đánh dấu WP90.1–WP90.10 đã xong. Đo lại trên cây làm việc: quy trình phát hành không dựng
được máy trắng, không khởi động được tiến trình nào, và xoá mất bản đang chạy khi phát hành lại
cùng một commit. Sáu ca âm bắt buộc chưa từng được viết.

## 2. Số đo ngày 2026-08-19

| Thứ                                                        | Số đo                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| Thư mục `infra/scripts/tests/`                             | Không tồn tại; `bash infra/scripts/tests/run.sh` không chạy |
| Nơi gọi `validateEnvFile` ngoài test                       | 0                                                           |
| Thư mục mà `lint:migration-expand` quét thật               | 0 trên 2 đường dẫn khai báo                                 |
| Mục registry không có tham chiếu nào trong repo            | 30 trên 49                                                  |
| Tên biến code đọc nhưng registry không khai                | 26                                                          |
| Mặc định cứng cho địa chỉ site còn lại                     | 1 (`apps/web/server/utils/seo-jsonld.ts`)                   |
| Điểm vào shell của quy trình phát hành                     | 4 script cộng một stub chết                                 |
| Gốc đường dẫn máy chủ trong code so với spec §7.1          | `/srv/mindkid` so với `/opt/mindkid`                        |

## 3. Quyết định đã chốt

1. **Gốc đường dẫn theo spec**: `/opt/mindkid`. Spec là contract; code sai thì code đổi.
2. **Một điểm vào duy nhất**: `infra/scripts/mindkid.sh <verb>`. Mỗi verb là một file trong
   `infra/scripts/lib/cmd-<verb>.sh`, để một khoá, một tệp log, một đích shellcheck.
3. **Tên thư mục bản** theo [`release-deploy.md`](../specs/01-platform/release-deploy.md) §7.1: `<mốc UTC>-<7 ký tự sha>`. Đây là thứ làm
   cho phát hành lại cùng commit không xoá bản đang chạy.
4. **Kiểm biến môi trường gọi validator thật**, không chỉ kiểm tệp có tồn tại. Thiếu thư mục env
   là lỗi, không phải cảnh báo.
5. **Build trong container `node:24-bookworm`** theo `BR-DEP-05`. Không có Docker thì dừng, trừ
   khi chạy trong bộ kiểm thử.
6. **Registry env dựng lại từ số đo**: giữ tên code thật sự đọc, bỏ tên không ai tham chiếu.
   Một registry mô tả sai hệ thống thì validator dựa vào nó cũng sai.
7. **Nginx giữ nguyên trong lần sửa này.** Nghiên cứu thay bằng Caddy nằm ở
   [`90-caddy-vs-nginx.md`](90-caddy-vs-nginx.md); đổi web server là đổi
   [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §4 bước 8–9 và §7.2, làm ở một lần thay đổi riêng.


## 4. Ranh giới

Không đụng tới: mã nghiệp vụ trong `apps/*/server`, lược đồ cơ sở dữ liệu, và 33 khối `catch`
đang có logic thật. Không nới bất kỳ cổng nào để code hiện tại đi qua.
