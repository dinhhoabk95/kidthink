---
spec: BACKUP-AND-RESTORE
title: Sao lưu và khôi phục
area: platform
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-07
owns:
  - Lịch sao lưu và retention
  - Quy trình verify restore
  - RPO và RTO
depends_on:
  - DATA-MODEL-OVERVIEW
  - JOB-QUEUE
---

# Sao lưu và khôi phục

## 1. Objective

Hệ thống giữ **dữ liệu học tập của trẻ**. Mất nó là mất thứ không mua lại được — người lớn
không thể "chơi lại 8 tuần".

v1 vận hành **không có backup nào**. Spec này biến backup thành điều kiện go-live, không
phải việc để sau.

> **Một backup chưa từng restore không phải backup.** Đó là lý do §4 bước 3 tồn tại và là
> lý do file này không tách "backup" khỏi "restore".

## 2. Actors

| Actor | Vai trò |
|---|---|
| Job `backup:postgres` | Dump hàng ngày |
| Job `backup:verify` | Restore thử hàng tuần |
| Vận hành | DR drill hàng quý, khôi phục thật khi cần |

## 3. Entry points

| Nơi | |
|---|---|
| `apps/worker` job `backup:postgres` · `backup:verify` | |
| `infra/scripts/restore.sh` | Khôi phục thủ công |
| `backup_log` | Bản ghi mỗi lần chạy |

## 4. Main flow

```
1. 01:00 ICT — pg_dump toàn bộ, nén, mã hoá
2. Upload S3 s3://mindkid-backups/postgres/YYYY/MM/DD.dump.gz.enc
3. Ghi backup_log { started, finished, bytes, sha256, status }
4. Thứ hai 05:00 ICT — backup:verify:
      restore bản mới nhất vào container tạm
      chạy smoke: đếm hàng các bảng chính, chạy 3 truy vấn nghiệp vụ
      ghi kết quả vào backup_log
      FAIL → alert ngay
5. Hàng quý — DR drill: restore đầy đủ lên staging, đo RTO thật
```

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Dump fail | Retry 2 lần; fail tiếp → **alert**, không bỏ qua |
| Verify fail | **Alert mức cao** — backup không dùng được là tình trạng khẩn cấp |
| S3 không tới được | Giữ dump local, alert, thử lại giờ sau |
| Khôi phục thật | Runbook §7.3, có checklist người ký |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-BAK-01` | Backup **verify hàng tuần** bằng restore thật | Dump không restore được là dump vô dụng, và chỉ phát hiện lúc cần nhất |
| `BR-BAK-02` | Dump **mã hoá at rest**; khoá không nằm cùng chỗ với dump | Một dump là **toàn bộ** dữ liệu trẻ trong một file di chuyển được — nó rời khỏi vành đai bảo vệ của DB. Khoá để cùng chỗ với dump thì mã hoá không mua thêm gì: ai lấy được file cũng lấy được khoá |
| `BR-BAK-03` | Mỗi lần chạy ghi `backup_log` kèm `sha256` | Không có bản ghi thì không chứng minh được đã chạy |
| `BR-BAK-04` | Fail Cấm — **NEVER im lặng** | v1 có `backup_log` rỗng và không ai biết |
| `BR-BAK-05` | Retention **30 daily / 12 weekly / 24 monthly** | Hỏng dữ liệu âm thầm (bug ghi sai, xoá nhầm) thường chỉ lộ ra sau nhiều tuần — chỉ giữ bản mới nhất nghĩa là mọi bản backup đều đã nhiễm lúc phát hiện. Ba tầng thưa dần đổi dung lượng lấy chiều sâu thời gian |
| `BR-BAK-06` | Go-live **không được** khi chưa có ít nhất **một** lần verify restore thành công | Đây là chỗ biến `BR-BAK-01` từ ý định thành cổng. v1 có bảng `backup_log` mà rỗng — nghĩa là "đã có backup" chưa bao giờ được kiểm chứng. Một lần restore thật là bằng chứng rẻ nhất rằng đường khôi phục tồn tại |
| `BR-BAK-07` | Dump Cấm — **NEVER** để trên máy cá nhân hoặc bucket công khai | Chứa dữ liệu trẻ |
| `BR-BAK-08` | DR drill hàng quý, ghi RTO đo được | RTO không đo là RTO không biết |

## 7. Data

### 7.1 Mục tiêu

| Chỉ số | Mục tiêu MVP |
|---|---|
| **RPO** (mất tối đa bao nhiêu dữ liệu) | 24 giờ |
| **RTO** (khôi phục trong bao lâu) | 4 giờ |
| Tần suất dump | hàng ngày |
| Tần suất verify | hàng tuần |
| DR drill | hàng quý |

RPO 24h là đánh đổi có ý thức: WAL archiving cho RPO 5 phút cần hạ tầng và chi phí vượt
mức hợp lý ở giai đoạn này. Đổi lại, mất tối đa một ngày dữ liệu chơi — đau nhưng không
phá sản.

### 7.2 `backup_log`

`id` · `backup_type` (`dump` \| `verify` \| `drill`) · `started_at` `finished_at` · `size_bytes` ·
`checksum` (SHA-256) · `storage_path` (S3 key) · `status` (`started` \| `success` \| `failed`) · `error_message` · `restored_rows` (verify).

### 7.3 Runbook khôi phục

1. Xác nhận phạm vi mất mát và mốc thời gian cần về.
2. Chọn dump gần nhất **đã verify**.
3. Dừng ứng dụng — không restore lên DB đang nhận ghi.
4. `bash infra/scripts/restore.sh <s3_key>`.
5. Chạy smoke: đăng nhập, mở một phiên chơi, mở một báo cáo.
6. Bật lại ứng dụng.
7. Ghi sự cố: nguyên nhân, dữ liệu mất, thời gian thực tế.

## 8. API contract

Không có route công khai. Trạng thái backup hiện trong `06-admin/system-activity.md`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-BAK-01 — verify restore hàng tuần chạy được
  Given có ít nhất một dump trong 7 ngày qua
  When job backup:verify chạy
  Then dump được restore vào container tạm
  And số hàng các bảng chính khác 0
  And backup_log ghi status success

Scenario: BR-BAK-04 — dump fail phát alert
  Given pg_dump thất bại
  When job kết thúc
  Then backup_log ghi status failed
  And một alert được phát

Scenario: BR-BAK-02 — dump được mã hoá
  Given một file dump trên S3
  When tải về và mở mà không có khoá
  Then nội dung không đọc được

Scenario: BR-BAK-06 — go-live bị chặn khi chưa verify
  Given chưa có hàng backup_log nào kind verify status success
  When chạy checklist go-live
  Then checklist fail tại mục backup

Scenario: BR-BAK-05 — retention đúng
  Given hệ thống đã chạy 90 ngày
  When liệt kê object trong bucket backup
  Then có 30 bản daily, 12 weekly, và các bản monthly

Scenario: RTO đo được trong DR drill
  Given một DR drill được thực hiện
  Then backup_log kind drill có finished_at trừ started_at dưới 4 giờ
```

## 10. Boundaries

**Always**
- Verify restore hàng tuần.
- Mã hoá dump, tách khoá khỏi dump.
- Ghi `backup_log` mọi lần chạy.
- Alert mọi lần fail.

**Ask first**
- Đổi RPO/RTO hoặc retention.
- Đổi vị trí lưu dump.
- Bỏ qua verify một tuần.

**Never**
- Go-live khi chưa verify restore thành công lần nào.
- Dump không mã hoá, hoặc để bucket công khai.
- Restore lên DB đang nhận ghi.
- Bỏ im lặng lỗi backup.

## 11. Open questions

> Lưu ý: Trước 2026-08-07 bảng này có **hai dòng cùng đánh số 3** — "Q3" thành tham chiếu mơ hồ.
> Đã đánh số lại: câu hỏi `pgvector` giữ **3**, câu hỏi cross-region thành **4**.
>
> Không câu nào chặn migration #1: cả 4 đều là quyết định vận hành/chi phí, không
> đụng cột nào ở §7.2 `backup_log`. Điều kiện chặn của **D-AD** là spec này `approved` — đã
> đạt.
>
| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Ai sở hữu khoá mã hoá backup và quy trình xoay khoá? Không có chủ thì `BR-BAK-02` không thi hành được — và mất khoá = mất toàn bộ backup | Go-live | go-live, không hoãn thêm được | người quyết |
| 2 | RPO 24h có chấp nhận được về mặt thương mại không, hay cần WAL archiving? | Ngân sách hạ tầng | chờ P1 | hoãn — §7.1 đã ghi rõ đánh đổi; mở lại nếu thương mại bác RPO 24h |
| 3 | Nếu `07-addon/semantic-search` triển khai (extension `pgvector`), container restore tạm ở §4 bước 4 cần `CREATE EXTENSION vector` trước khi restore — bổ sung bước nào, và `backup:verify` có cần smoke query trên cột `vector` không? | Khi [`semantic-search.md`](../07-addon/semantic-search.md) chuyển `implemented` | chờ P4 | hoãn — điều kiện kích hoạt viết bằng câu đo được: mở lại **khi** [`semantic-search.md`](../07-addon/semantic-search.md) rời `draft` |
| 4 | Backup S3 có cần cross-region không? | Chi phí | chờ P2 | hoãn — mở lại khi có ước tính chi phí S3 thật |
