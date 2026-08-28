# Task #122 — Sàn chiều sâu mỗi engine: cổng bậc thang và 55 level bậc 1

> **Loại task:** cổng + nội dung (M) — tách từ WP113.3 và WP113.7 của
> [`Task #113`](113-game-engine-depth-and-seed-diversity-plan.md).
> **Spec sở hữu:** [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) —
> đóng, `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:** [`Task #117`](117-seed-gate-truth-plan.md) (cổng parse thật) ·
> [`Task #118`](118-band-violation-cleanup-plan.md) (`out_of_band_count` về 0) ·
> [`Task #119`](119-theme-registry-plan.md) (từ vựng `theme` đóng) ·
> [`Task #120`](120-engine-spec-contract-plan.md) (ma trận mục 6 = ngân sách) ·
> [`Task #121`](121-level-generator-kit-plan.md) (bộ sinh).

## 1. Trả lời ngắn

Sàn MVP hôm nay là một con số tổng: **≥120 game level**. Corpus có 228, nên sàn đạt. Nhưng
**17 engine có đúng 3 level**, và một con số tổng không nhìn thấy điều đó — engine đầy che
engine rỗng.

`engine-content-depth.md` thay một con số tổng bằng **sáu số đo cho mỗi engine**, cộng một
bậc thang. Task #122 thi công cổng đó, rồi soạn **55 level** để bật bậc 1.

Bậc 1 không phải đích. Nó là bậc đầu tiên **đạt được** — bật thẳng bậc 2 hôm nay làm đỏ 21
trên 27 engine, và một cổng đỏ thường trực là một cổng sắp bị tắt.

## 2. Bằng chứng đã đo (2026-08-29)

### 2.1 Sáu số đo, phân bố thật

| Số đo | Phân bố hôm nay |
|---|---|
| `level_count` | 6 engine ≥21 · 2 engine =6 · 2 engine =4 · **17 engine =3** |
| `min_band_count` | **4 engine** có band hợp lệ trống hoàn toàn |
| `out_of_band_count` | **42** trên 228 — Task #118 đưa về 0 |
| `thinking_span` | **17 engine = 1** |
| `what_span` | 17 engine = 1; toàn corpus **160 / 239** lượt gắn ngoài từ vựng |
| `theme_span` | 17 engine ≤ 3; toàn corpus **100 / 228** mang giá trị ngoài từ vựng |
| `difficulty_span` | **19 engine ≤ 3** |

Bốn engine có band trống: `GT-014` `GT-016` `GT-017` `GT-027`. Trẻ ở hai lứa còn lại mở engine
ra và không có gì để chơi.

### 2.2 Giá của mỗi bậc

| Bậc | `level_count` | Level cần thêm | Tổng corpus sau đó |
|---|:--:|---:|---:|
| Bậc 0 — đang có | ≥3 | 0 | 228 |
| **Bậc 1 — task này** | **≥6** | **55** | **283** |
| Bậc 2 | ≥12 | 181 | 409 |
| Bậc 3 | ≥20 | 397 | 625 |

### 2.3 Ngân sách cộng dồn — cấm đếm hai lần

Ba task khác cũng sinh nhu cầu soạn level. Ngân sách thật của Task #122 là:

| Nguồn | Level |
|---|---:|
| Bậc 1 của bảng 2.2 | 55 |
| Level thay thế cho đường B của [`Task #118`](118-band-violation-cleanup-plan.md) | đo ở WP118.1 |
| 48 level cho 25 kỹ năng thiếu — [`Task #124`](124-lesson-corpus-depth-plan.md) | 48 |
| **Tổng** | **≥103, chốt sau khi #118 đo xong** |

48 level của Task #124 gắn với kỹ năng cụ thể, nên chúng **cũng** đếm vào `level_count` của
engine tương ứng. Soạn một lần, đếm vào cả hai chỗ — đó là cách duy nhất không làm phồng ngân sách.

### 2.4 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/db seed:report
pnpm --filter @mindkid/db report:tags
```

## 3. Work package

### WP122.1 — `check:engine-depth`

**Cỡ:** M · **File:** 3 cộng fixture · **Ranh giới PR:** `packages/db`

1. Đọc **corpus seed**, không đọc database (mục 7.1 của spec). Lý do đã ghi ở
   [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) mục 7.0:
   database dev dùng chung `DATABASE_URL` với test tích hợp và chứa hàng rác test sinh.
2. Tính sáu số đo cho mỗi engine, cộng `out_of_band_count`.
3. Cấu hình bậc ở `packages/db/config/engine-depth.json`, bậc đang bật ghi kèm **ngày**
   (`BR-ECD-08`).
4. Báo cáo in **engine thiếu và thiếu bao nhiêu trên trục nào** (`BR-ECD-10`). **Cấm — NEVER**
   in tỉ lệ phần trăm tổng — một con số 84 % che được 17 engine ở mức mẫu.
5. `BR-ECD-09`: PR làm giảm `level_count` của engine đang đạt sàn thì bị chặn.
6. Nguồn không đọc được → **đỏ**, cấm trả danh sách rỗng rồi báo xanh.

**Ca âm bắt buộc** (`BR-ECD-11`), fixture ở `packages/db/tests/**/fixtures/`:
- bớt một level của engine đang sát sàn → đỏ;
- engine có 6 level nhưng dồn cả 6 vào một band → đỏ ở `min_band_count`;
- engine có `thinking_span` = 1 khi bậc 1 đòi ≥2 → đỏ;
- hạ bậc trong `engine-depth.json` → đỏ (`BR-ECD-08`, bậc thang một chiều).

Cổng khởi đầu ở **bậc 0** — mức hôm nay, để `BR-ECD-09` có mốc so. Bật bậc 1 ở WP122.4.

### WP122.2 — Ngân sách và phân bổ

**Cỡ:** S · **Ranh giới PR:** không sửa nội dung

1. Đo lại sáu số đo sau khi Task #117, #118, #119 merge — con số 2026-08-29 sẽ đổi.
2. Với mỗi engine dưới bậc 1, liệt kê: thiếu bao nhiêu level, thiếu trên trục nào, band nào trống.
3. Đối chiếu với ma trận mục 6 của phiếu engine (Task #120 WP120.3) — hai nguồn phải khớp.
   Lệch thì một trong hai sai; sửa trước khi soạn.
4. Gộp với 48 level của Task #124 và level thay thế của Task #118. Bảng cuối: mỗi level phải
   soạn thuộc engine nào, band nào, kỹ năng nào, chủ đề nào, trục tư duy nào.
5. Người quyết duyệt bảng.

**Cấm — NEVER** bắt đầu soạn trước khi bảng có chữ ký. 55 level soạn sai trục là 55 level phải
soạn lại.

### WP122.3 — Ngân sách 55 level, giao cho 27 task engine

**Cỡ:** S · **không soạn level nào**

Phạm vi đổi ngày 2026-08-29: việc **soạn** 55 level đã chuyển sang 27 task engine `#130`–`#156`
của [`Task #116`](116-engine-vertical-slices-plan.md), mỗi engine soạn phần của mình ở `WPn.5`.
Lý do: nội dung của một engine đòi hiểu cơ chế engine đó, và nó thuộc cùng lát dọc với `render()`
và spec của engine.

Phân bổ đo được — tổng đúng **55**, khớp bậc 1 ở mục 7.4 của spec:

| Nhóm | Engine | Thiếu mỗi engine | Cộng |
|---|---|---:|---:|
| Đủ sàn | `GT-001`…`GT-008` | 0 | 0 |
| Bốn level | `GT-012` · `GT-025` | 2 | 4 |
| Ba level | 17 engine còn lại | 3 | 51 |
| **Tổng** | **27** | | **55** |

Task #122 giữ ba việc:

1. Phân bổ trên, kèm **trục nào thiếu** cho từng engine — đầu vào Preflight của 27 task engine.
2. Cộng dồn với level thay thế đường B của [`Task #118`](118-band-violation-cleanup-plan.md) và
   48 level của [`Task #124`](124-lesson-corpus-depth-plan.md), để **không đếm hai lần**.
3. Ưu tiên toàn cục, để 27 task engine biết cái nào chạy trước:
   - bốn engine có band trống — `GT-014` `GT-016` `GT-017` `GT-027`;
   - engine có `thinking_span` = 1, đặc biệt `GT-027` (`shift`) và `GT-013` (`plan`) là nguồn
     duy nhất của hai giá trị đó;
   - engine chưa có cửa vào `free`/`login` (`BR-ECD-07`) — hôm nay chỉ 23 / 229 level là `free`.

### WP122.4 — Bật bậc 1

**Cỡ:** S · **sau khi cả 27 task engine merge**

1. Sau khi 27 task engine merge, đổi bậc đang bật trong `engine-depth.json` từ 0 sang **1**,
   ghi ngày. `engine-depth.json` là file dùng chung — **Cấm — NEVER** sửa nó trong task engine.
2. Ca âm bậc thang: thử hạ về 0 → cổng đỏ.
3. Chạy lại ca âm "bớt một level của engine sát sàn" ở bậc 1.
4. `engine-content-depth.md` đổi `status: draft` → `implemented`.

**Cấm — NEVER** bật bậc 2 ở task này. Bậc 2 cần thêm 181 level; nó là quyết định người riêng
(`Q114-2`) và một task riêng sau go-live.

## 4. Điều kiện nghiệm thu

1. `check:engine-depth` ở bậc 1 **xanh** trên corpus sau WP122.3.
2. Bốn ca âm đều đỏ vì đúng lý do.
3. Hạ bậc trong `engine-depth.json` → cổng đỏ.
4. Báo cáo in danh sách engine thiếu kèm trục thiếu, **không** in tỉ lệ phần trăm tổng.
5. Mỗi engine `active` có **≥1** level `free` hoặc `login` (`BR-ECD-07`).
6. `out_of_band_count` = 0 trên cả 27 engine.
7. Cổng đọc corpus seed, không mở kết nối database — ca kiểm với `DATABASE_URL` host không tồn tại.
8. Bảng phân bổ WP122.2 có chữ ký người duyệt, và mọi level đã soạn khớp một hàng của bảng.
9. `pnpm --filter @mindkid/db seed:content --dry-run` xanh.
10. `engine-content-depth.md` mang `status: implemented`.
11. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 5. Ranh giới

**Always**
- Đọc corpus seed, không đọc database.
- Ca âm trước phép kiểm.
- Bảng phân bổ có chữ ký trước khi soạn.
- Cộng dồn ngân sách với Task #118 và #124, soạn một lần.

**Ask first**
- Bật bậc 2.
- Đổi ma trận mục 6 của phiếu engine sau khi Task #120 đã phê chuẩn.
- Chuyển một engine sang `deprecated` thay vì soạn nội dung cho nó.

**Never**
- Hạ bậc đã bật (`BR-ECD-08`).
- In tỉ lệ phần trăm tổng thay cho danh sách engine thiếu (`BR-ECD-10`).
- Dùng số đo chiều sâu làm bằng chứng hiệu quả học tập (`BR-ECD-12`).
- Trả danh sách rỗng rồi báo xanh khi nguồn không đọc được.
- Soạn trước khi bảng phân bổ có chữ ký.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q122-1` (= `Q114-2`) | Sàn bậc 2 là 12 hay 20 level mỗi engine — nó quyết ngân sách 181 hay 397 level | Task sau go-live | Product |
| `Q122-2` | Ngân sách thật sau khi #118 đo xong là bao nhiêu? 55 + 48 + level thay thế; ba nguồn có chồng lấn không | WP122.2 | Nội dung |
| `Q122-3` | Bốn engine có band trống: soạn cho band trống, hay thu hẹp band hợp lệ của engine trong registry? Thu hẹp band là đổi contract engine — phải hỏi, không tự chọn | WP122.3 ưu tiên 1 | Sư phạm |
