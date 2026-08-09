---
spec: PERFORMANCE-BUDGETS
title: Ngân sách hiệu năng
area: quality
status: approved
mvp: true
phase: P1
reviewed: 2026-08-08
owns:
  - Ngưỡng hiệu năng theo bề mặt và cách đo
depends_on:
  - GAME-ENGINE-RUNTIME
  - MONITORING-AND-ALERTING
---

# Ngân sách hiệu năng

## 1. Objective

Thiết bị mục tiêu là **tablet Android 2GB trên 4G**, không phải laptop dev trên Wi-Fi.

Ngân sách là **ngưỡng chặn merge**, không phải mục tiêu mong muốn. Hiệu năng không có
ngân sách sẽ trôi mỗi sprint một chút cho tới khi không sửa được.

## 2. Actors

Dev · cổng tự động · giám sát production.

## 3. Entry points

cổng tự động size check · Playwright throttle 4G · k6 · `fps_sample` từ production.

## 4. Main flow

1. cổng tự động đo kích thước bundle mỗi build, so ngân sách §7.1.
2. E2E đo LCP và fps ở 4G throttle.
3. k6 đo API P95.
4. Production gửi `fps_sample`; tụt ngưỡng → alert.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Vượt ngân sách bundle | **cổng tự động fail**, không cảnh báo suông |
| FPS tụt ở production | Giảm hạt và bóng, Cấm — **NEVER giảm sàn touch** |
| API chậm | Alert P1, điều tra query |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PRF-01` | Vượt ngân sách **chặn merge** | Ngân sách không ép là ngân sách không tồn tại |
| `BR-PRF-02` | Đo trên **thiết bị và mạng mục tiêu**, không trên máy dev | Máy dev nhanh gấp 5 lần thiết bị thật |
| `BR-PRF-03` | Suy giảm khi tải nặng: bỏ **hạt và bóng**, Cấm — **NEVER sàn touch hay kênh phản hồi** | Đẹp hy sinh được; dùng được thì không |
| `BR-PRF-04` | Cấm — **NEVER network call trong lúc chơi** | `BR-ENG-03` |
| `BR-PRF-05` | Cấm — **NEVER cấp phát object mỗi frame** | GC pause đọc thành giật |
| `BR-PRF-06` | Trần phân trang ép ở server | `BR-DM-12` |
| `BR-PRF-07` | Báo cáo đọc **rollup**, không quét bảng thô | `BR-TLM-01` |
| `BR-PRF-08` | Ảnh phục vụ dạng **WebP**, ≤960×960, có thumbnail | Giảm dung lượng truyền tải mạng và tối ưu thời gian tải ảnh |

## 7. Data

### 7.1 Ngân sách bundle

| Mục | Ngân sách |
|---|---|
| App shell (JS + CSS, gzipped) | ≤ **180 KB** |
| Mỗi game template | ≤ **80 KB** |
| Payload config một level | ≤ **200 KB** |
| Ảnh mỗi asset | ≤ **120 KB** WebP |
| Trang public đầu tiên (tổng) | ≤ **500 KB** |

### 7.2 Ngưỡng thời gian

| Chỉ số | Ngưỡng | Điều kiện đo |
|---|---|---|
| LCP trang public | < **2,5 s** | 4G throttle |
| Thời gian tới màn hình game đầu | < **2,5 s** | 4G, tablet chuẩn |
| FPS gameplay | **60**, P95 frame < 16 ms | tablet Android 2GB |
| API P95 | < **800 ms** | tải bình thường |
| Truy vấn `skill → LO → asset` P95 | < **100 ms** | dữ liệu MVP đầy đủ |
| Dashboard admin P95 | < **500 ms** | |
| Ingest event P95 | < **200 ms** | |
| CLS | < **0,1** | |

### 7.3 Suy giảm có thứ tự

Khi FPS tụt dưới 45 kéo dài, bỏ theo đúng thứ tự:

1. Hạt ăn mừng
2. Bóng đổ mềm (giữ slab cứng)
3. Hoạt hình nền
4. Nhịp thở của scaffolding

Cấm — **NEVER giảm**: sàn touch · kênh phản hồi âm thanh · trình diễn ghost hand ·
kích thước chữ.

### 7.4 Ràng buộc hạ tầng

t3.small: 2 vCPU, 2 GB RAM, dùng chung cho PG, Valkey, web, worker.
Mọi quyết định thiết kế phải hỏi: **cái này chạy được trên 2 GB không?**

Đây là lý do: không search engine riêng · không read replica ở MVP ·
Puppeteer là câu hỏi mở ([`pdf-export.md`](../07-addon/pdf-export.md) §11 Q1) · rollup thay vì query trực tiếp.

## 8. API contract

Không có. Ràng buộc lên cổng tự động:

```
size-limit        → ngân sách §7.1
playwright perf   → ngưỡng §7.2 với throttle 4G
k6                → API P95
```

## 9. Acceptance criteria

```gherkin
Scenario: BR-PRF-01 — vượt ngân sách chặn merge
  Given một thay đổi làm app shell vượt 180 KB gzipped
  When cổng tự động chạy
  Then merge bị chặn

Scenario: BR-PRF-02 — đo ở 4G
  When chạy test hiệu năng
  Then kết nối được throttle về 4G
  And không đo trên kết nối máy dev

Scenario: FPS đạt mục tiêu
  Given một level chạy trên thiết bị chuẩn
  When đo 60 giây
  Then P95 frame time dưới 16 ms

Scenario: BR-PRF-03 — suy giảm không chạm sàn touch
  Given FPS tụt dưới 45
  When engine suy giảm
  Then hạt bị bỏ
  And mọi phần tử chạm vẫn đạt sàn band tuổi

Scenario: BR-PRF-04 — không network lúc chơi
  Given một phiên chơi
  When ghi lại request mạng
  Then không request nào ngoài gửi event

Scenario: API P95 đạt ngưỡng
  Given tải bình thường trong k6
  Then P95 dưới 800 ms

Scenario: BR-PRF-08 — ảnh đúng định dạng và cỡ
  When kiểm mọi ảnh phục vụ
  Then đều là WebP và không vượt 960x960
```

## 10. Boundaries

**Always**
- Đo ở thiết bị và mạng mục tiêu.
- Ép ngân sách trong cổng tự động.
- Suy giảm theo đúng thứ tự §7.3.

**Ask first**
- Nâng bất kỳ ngân sách nào.
- Thêm dependency lớn.
- Thêm dịch vụ chạy thường trực trên t3.small.

**Never**
- Giảm sàn touch hay kênh phản hồi để lấy hiệu năng.
- Network call trong lúc chơi.
- Cấp phát object mỗi frame.
- Đo hiệu năng trên máy dev rồi kết luận.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Thiết bị chuẩn đo 60 fps là model nào?~~ **Đóng 2026-08-09 (`D-CH`)**: Lenovo Tab M8 bản 2 GB RAM; Chrome ổn định mới nhất, pin >30%, tắt tiết kiệm pin; ba lần chạy lấy median | — | Đã đóng | D-CH |
| 2 | t3.small đủ cho MVP không, hay cần nâng trước go-live? | Ngân sách hạ tầng | Go-live | Infra |
| 3 | CDN trước S3 từ đầu hay sau? | Tốc độ tải 4G | P2 | Infra |
