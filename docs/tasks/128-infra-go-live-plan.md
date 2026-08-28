# Task #128 — Năm spec phát hành P0: chạy trên máy thật

> **Loại task:** hạ tầng (M) — nối tiếp [`Task #90`](90-vps-deploy-plan.md) WP90.11 và
> [`Task #109`](109-vps-golive-blockers-plan.md) WP109.9.
> **Spec sở hữu:** [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) ·
> [`env-contract.md`](../specs/01-platform/env-contract.md) ·
> [`process-supervision.md`](../specs/01-platform/process-supervision.md) ·
> [`release-deploy.md`](../specs/01-platform/release-deploy.md) ·
> [`release-rollback.md`](../specs/01-platform/release-rollback.md) — cả năm đổi
> `status: approved` → `implemented` ở cuối task.
> **Chặn bởi:** **ba quyết định người**, `Q114-3`. Không quyết thì task này không bắt đầu được.

## 1. Trả lời ngắn

Năm spec phát hành P0 mang `status: approved`, không phải vì mã thiếu — mã đã có và đã qua bảy
chốt của [`Task #109`](109-vps-golive-blockers-plan.md). Chúng `approved` vì **chưa ai chạy
chúng trên một máy thật**.

Task #109 dừng ở 60 / 77. Mười bảy việc còn lại chia đúng hai nhóm:

| Nhóm | Số việc | Chặn bởi |
|---|---:|---|
| Ba quyết định người | 3 | Nhà cung cấp VPS · tên miền thật · đích sao lưu ngoài máy |
| Chạy trên máy trắng (WP109.9) | 13 | Ba quyết định trên |
| Dọn hạ tầng v1 | 1 | Không chặn |

Không có việc nào ở đây là "viết thêm mã". Task #128 là **một buổi vận hành có kịch bản**, và
kịch bản đã viết sẵn ở `109-vps-golive-blockers-todo.md`.

## 2. Ba quyết định chặn

| Mã | Câu hỏi | Chặn |
|---|---|---|
| `Q128-1` | Nhà cung cấp VPS và cấu hình máy — câu hỏi mở số 1 của [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) | Toàn bộ WP128.2 |
| `Q128-2` | Tên miền thật và ai giữ DNS | Bước TLS; hai tên miền `{domain}` và `admin.{domain}` |
| `Q128-3` | Đích sao lưu ngoài máy — nhà cung cấp bucket và vùng | `BR-BAK-02`, `BR-BAK-06`; WP109.5 |

`Q128-3` là quyết định nặng nhất về hệ quả: `BR-BAK-02` cấm khoá nằm cùng chỗ với dump. Không
có bucket ngoài máy nghĩa là máy chết là mất cả cơ sở dữ liệu lẫn bản sao lưu.

**Cấm — NEVER** bắt đầu WP128.2 trước khi cả ba có câu trả lời. Provision một máy rồi đổi tên
miền là provision lại từ đầu.

## 3. Work package

### WP128.1 — Chuẩn bị

**Cỡ:** S · **trước khi chạm máy**

1. Ba quyết định `Q128-1` `Q128-2` `Q128-3` có câu trả lời ghi lại.
2. Ghi `/etc/mindkid/env/{web,admin,worker}.env` và `compose/datastore.env` theo giá trị thật.
3. Ca nhị phân giả 20 phần tráo đổi (WP109.9, cần root) — chạy trên máy có root trước khi chạy
   trên máy sẽ dùng thật.
4. Đọc lại thứ tự `MK_RELOAD_ORDER=(worker web)` — tài liệu ở `pm2.sh:9` và
   [`90-vps-deploy-todo.md`](90-vps-deploy-todo.md) còn ghi thứ tự cũ `worker, admin, web`.

### WP128.2 — Chạy trên máy trắng

**Cỡ:** M · **cổng người, ghi thời gian thật**

Theo đúng kịch bản của [`109-vps-golive-blockers-todo.md`](109-vps-golive-blockers-todo.md)
mục WP109.9:

1. `pnpm deploy init --host <tên> --remote <url>` trên máy trắng; ghi thời gian thật.
2. `pnpm deploy provision --host <tên> --site-domain <d> --admin-domain <d>`.
3. Khẳng định **HTTPS sống trên cả hai tên miền sau đúng một lần provision** — đây là chốt số 2
   của Task #109, và nó chỉ chứng minh được trên máy thật.
4. `pnpm deploy --host <tên> --ref main`; ghi thời gian thật và **gián đoạn thật**.
5. Chạy lại provision lần hai; khẳng định **không tiến trình nào bị dừng** (`BR-*` idempotent).
6. Chạy một lần sao lưu thật; khẳng định tệp có mặt trên bucket ngoài máy.
7. Chạy một lần **verify restore thật** để đóng `BR-BAK-06`; ghi thời gian khôi phục.
8. Gửi một cảnh báo thử; khẳng định nó **tới kênh thật**, không dừng ở tệp log — đây là chốt
   số 6 của Task #109.
9. Đo 10 tiêu chí của [`release-deploy.md`](../specs/01-platform/release-deploy.md).

**Cấm — NEVER** bỏ qua bước 5 và bước 7. Provision không idempotent và backup chưa từng restore
là hai thứ chỉ lộ ra khi cần tới chúng nhất.

### WP128.3 — Rollback

**Cỡ:** S · **cùng buổi với WP128.2**

[`release-rollback.md`](../specs/01-platform/release-rollback.md) là spec duy nhất trong năm
spec chưa có bước nào trong kịch bản WP109.9. Nó phải được chứng minh trong cùng buổi:

1. Phát hành bản thứ hai.
2. Rollback về bản thứ nhất; ghi thời gian và gián đoạn thật.
3. Khẳng định cơ sở dữ liệu ở trạng thái nhất quán sau rollback — migration lùi được, hoặc
   migration là forward-only và bản cũ vẫn chạy được trên lược đồ mới.

Điểm thứ 3 là câu hỏi phải trả lời **trước** khi rollback, không phải sau (`Q128-4`).

### WP128.4 — Đóng đuôi và dọn

**Cỡ:** S

1. Đánh dấu WP90.11 của [`90-vps-deploy-todo.md`](90-vps-deploy-todo.md) đã đóng.
2. Tick 17 ô còn lại của [`109-vps-golive-blockers-todo.md`](109-vps-golive-blockers-todo.md).
3. `/Users/macbook/tinimath/infra/` và `/Users/macbook/tinimath/tinimath-tf/` là hạ tầng v1
   (AWS EC2, tên miền `mamnon.site`, `terraform.tfstate` rỗng). Xoá hoặc chuyển vào kho lưu
   trữ để không ai đọc nhầm là hạ tầng đang chạy.
4. Năm spec đổi `status: approved` → `implemented`, ghi ngày, kèm số đo thật của buổi vận hành.

**Cấm — NEVER** lật cờ trước khi bước 3 của WP128.3 có kết quả — rollback chưa chứng minh thì
`release-rollback.md` chưa `implemented`.

## 4. Điều kiện nghiệm thu

1. Một máy Ubuntu trắng lên được bằng `init` → `provision` → `deploy`, không lệnh tay nào ngoài
   hai việc spec tuyên bố là thủ công (trỏ DNS, ghi tệp env).
2. HTTPS sống trên **cả hai** tên miền sau đúng một lần provision.
3. Provision lần hai không dừng tiến trình nào.
4. Một bản sao lưu có mặt trên bucket **ngoài máy chủ**.
5. Một lần verify restore thật đã chạy — `BR-BAK-06` đóng, thời gian khôi phục ghi lại.
6. Một cảnh báo thử tới kênh thật, không dừng ở tệp log.
7. Rollback về bản trước đã chạy; cơ sở dữ liệu nhất quán sau rollback.
8. 10 tiêu chí của `release-deploy.md` đã đo, kết quả ghi lại.
9. Năm spec mang `status: implemented`, kèm số đo thật.
10. Thư mục hạ tầng v1 đã xoá hoặc chuyển kho lưu trữ.

## 5. Ranh giới

**Always**
- Ghi thời gian thật và gián đoạn thật, không ghi ước lượng.
- Chạy provision hai lần.
- Chạy verify restore trước khi lật cờ.

**Ask first**
- Bắt đầu WP128.2 khi còn một trong ba quyết định chưa có.
- Rollback khi chưa trả lời `Q128-4`.

**Never**
- Provision khi tên miền chưa chốt.
- Bỏ qua bước idempotent hoặc bước verify restore.
- Lật `status` của `release-rollback.md` khi chưa chạy rollback thật.
- Coi cảnh báo dừng ở tệp log là cảnh báo đã tới.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q128-1` | Nhà cung cấp VPS và cấu hình máy | WP128.2 | Product |
| `Q128-2` | Tên miền thật và ai giữ DNS | WP128.2 bước TLS | Product |
| `Q128-3` | Đích sao lưu ngoài máy — nhà cung cấp bucket và vùng | `BR-BAK-02`, `BR-BAK-06` | Product |
| `Q128-4` | Migration lùi được, hay forward-only? Nếu forward-only thì rollback mã phải chạy được trên lược đồ mới — đó là ràng buộc lên mọi migration sau này, không chỉ lên buổi vận hành này | WP128.3 | Backend |
