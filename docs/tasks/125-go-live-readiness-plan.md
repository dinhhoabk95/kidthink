# Task #125 — Cổng go-live: "trẻ mở được chưa", đo trên cả hai trục

> **Loại task:** cổng (M) — tách từ WP113.0b của
> [`Task #113`](113-game-engine-depth-and-seed-diversity-plan.md).
> **Spec sở hữu:** [`go-live-readiness.md`](../specs/08-quality/go-live-readiness.md) — đóng,
> `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:** [`Task #116`](116-engine-vertical-slices-plan.md) (27 engine vẽ được) ·
> [`Task #122`](122-engine-content-depth-plan.md) (sàn nội dung) ·
> [`Task #124`](124-lesson-corpus-depth-plan.md) (126 tiết). Đây là **điểm hợp lưu cuối**.

## 1. Trả lời ngắn

`mvp-scope.md` trả lời câu *"cái gì thuộc MVP"*. Không spec nào trả lời câu *"trẻ mở được
chưa"*. Khoảng trống đó đo được: sàn MVP ≥120 game level **đã đạt ở 228**, trong khi **0 màn
nào vẽ ra hình**.

`go-live-readiness.md` sở hữu câu thứ hai. Task #125 thi công `check:go-live` — cổng đọc corpus
**và** mã nguồn, đo đầu cuối từ `content_pack` tới lệnh vẽ, trên **cả hai trục**.

`BR-GLR-09` là điều khoản quyết định: đạt một trục không cho phép tuyên bố. 27 engine vẽ được
mà chỉ có 81 trên 126 tiết là một chương trình đứt ở tuần chín; 126 tiết mà engine không vẽ là
một lịch học dẫn tới màn hình trống.

## 2. Bằng chứng đã đo (2026-08-29)

| Trục | Phạm vi go-live | Hiện tại |
|---|---|---|
| Game template | **27 / 27** engine vẽ được và đạt sàn nội dung | **0** engine vẽ được |
| Giáo án | **126 / 126** tiết của flow dài nhất | **81** lesson |
| Level phục vụ giáo án | mỗi kỹ năng thư viện có **≥2** level | **23 / 40** kỹ năng có 0 level |

Phạm vi chốt ngày 2026-08-29 (`D-SH`): **không rút**. Bản trước của spec có quy tắc cho phép
bớt engine khỏi phạm vi khi chưa đạt; quy tắc đó **đã bãi bỏ** (`BR-GLR-04`). Đường duy nhất
còn lại khi chưa đạt là **lùi ngày**.

### 2.1 Một chỗ spec tự mâu thuẫn — phải sửa trước

`BR-GLR-04` ở mục 6 viết *"Phạm vi go-live là **27 engine và 222 buổi**"*. Mục 1.1 của cùng
file viết **126 tiết**, và giải thích vì sao con số đổi từ 222 xuống 126 theo `D-SI`.

Con số 222 trong `BR-GLR-04` là **sót** của bản trước. Sửa nó là việc đầu tiên của task này —
một cổng thi công theo rule ghi 222 sẽ đỏ vĩnh viễn, và cổng đỏ vĩnh viễn là cổng sắp bị tắt.

Sửa spec **trước**, trong cùng PR với việc thi công (`Q125-1`).

### 2.2 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
grep -n "222" docs/specs/08-quality/go-live-readiness.md
pnpm --filter @mindkid/game-engine check:render
pnpm --filter @mindkid/db seed:report
```

## 3. Work package

### WP125.1 — Sửa `BR-GLR-04`

**Cỡ:** S · **Ranh giới PR:** `docs/specs`

1. `BR-GLR-04` đổi `222 buổi` → `126 tiết`, khớp mục 1.1.
2. Quét toàn file tìm mọi chỗ còn ghi 222; mỗi chỗ hoặc sửa, hoặc ghi rõ đó là số lịch sử.
3. Đây là sửa spec, đi qua cổng người trước khi viết mã.

### WP125.2 — `check:go-live`

**Cỡ:** M · **File:** 3 cộng fixture · **Ranh giới PR:** `packages/db` hoặc `scripts/`

Cổng đọc **hai** nguồn — corpus seed và mã nguồn engine — và đo đầu cuối (`BR-GLR-02`):

| Phép kiểm trục game | Nguồn |
|---|---|
| 27 / 27 engine `active` cài `render()` | mã nguồn, qua `check:render` |
| 27 / 27 engine đạt sàn nội dung bậc đang bật | corpus, qua `check:engine-depth` |
| Mọi `content_pack` parse được `content_contract` | corpus, qua cổng 1 của Task #117 |
| Mỗi engine có ≥1 cửa vào `free` hoặc `login` | corpus |

| Phép kiểm trục giáo án | Nguồn |
|---|---|
| Cung lesson ≥ 126 | corpus, qua `check:lesson-supply` |
| Mọi kỹ năng thư viện có ≥2 level | corpus |
| `CUR-J42` publish được — mọi tiết trỏ lesson thật | corpus |

Ràng buộc thi công:

1. **`BR-GLR-09`** — cổng chỉ xanh khi **cả hai** trục đạt. Cấm cấu hình cho phép xanh một trục.
2. **`BR-GLR-08`** — ngưỡng và danh sách engine trong phạm vi nằm ở tệp cấu hình ngoài mã:
   `config/go-live.json`. Mỗi lần đổi là một diff đọc được.
3. **`BR-GLR-03`** — mục chặn cứng ở mục 7.2 của spec **Cấm — NEVER** miễn trừ, kể cả tạm thời.
   Cổng **Cấm — NEVER** có cờ `--skip`, `--allow-failing`, hay danh sách miễn trừ.
4. **`BR-GLR-05`** — mọi engine `active` nằm trong phạm vi. Cổng đỏ nếu có engine `active`
   ngoài danh sách phạm vi.
5. **`BR-GLR-06`** — nguồn không đọc được → **đỏ**, cấm giá trị mặc định.

**Ca âm bắt buộc:**
- một engine mất `render()` → đỏ;
- một engine tụt dưới sàn nội dung → đỏ;
- cung lesson tụt xuống 125 → đỏ;
- một kỹ năng tụt xuống 1 level → đỏ;
- trục game đạt, trục giáo án không → **đỏ** (`BR-GLR-09`);
- nguồn không đọc được → đỏ, không trả rỗng rồi xanh;
- thêm engine `active` ngoài danh sách phạm vi → đỏ (`BR-GLR-05`).

### WP125.3 — Chạy thật và ghi kết quả

**Cỡ:** S

1. Chạy `check:go-live` trên corpus và mã sau khi #116, #122, #124 merge.
2. Ghi kết quả từng phép kiểm vào todo — kể cả phép kiểm xanh.
3. Nếu đỏ: **lùi ngày**, ghi lý do. **Cấm — NEVER** rút phạm vi hay hạ ngưỡng (`BR-GLR-04`).

### WP125.4 — Đóng spec

**Cỡ:** S

`go-live-readiness.md` đổi `status: draft` → `implemented` khi cổng đã chạy và có đủ bảy ca âm.
Spec `implemented` nghĩa là **cổng tồn tại và biết đỏ** — không nghĩa là cổng đang xanh.

## 4. Điều kiện nghiệm thu

1. `check:go-live` chạy được và in kết quả **từng phép kiểm**, không in một con số tổng.
2. Bảy ca âm đều đỏ vì đúng lý do.
3. Cổng không có cờ bỏ qua, không có danh sách miễn trừ.
4. `config/go-live.json` chứa ngưỡng và danh sách phạm vi; sửa nó là một diff đọc được.
5. Trục game đạt mà trục giáo án không → cổng **đỏ**.
6. Engine `active` ngoài danh sách phạm vi → cổng đỏ.
7. Nguồn không đọc được → đỏ; ca kiểm với thư mục rỗng.
8. `BR-GLR-04` không còn ghi 222; mọi chỗ khác ghi 222 đã xử lý.
9. `go-live-readiness.md` mang `status: implemented`.
10. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 5. Ranh giới

**Always**
- Đo đầu cuối, từ corpus tới lệnh vẽ.
- Ngưỡng ở tệp cấu hình ngoài mã.
- In kết quả từng phép kiểm.

**Ask first**
- Lùi ngày go-live — đó là quyết định người, cổng chỉ đưa số.

**Never**
- Cờ bỏ qua, danh sách miễn trừ, hay miễn trừ tạm thời (`BR-GLR-03`).
- Rút phạm vi hoặc hạ ngưỡng (`BR-GLR-04`).
- Cho cổng xanh khi chỉ một trục đạt (`BR-GLR-09`).
- Trạng thái "có level published nhưng chưa sẵn sàng" cho engine (`BR-GLR-05`).
- Trả giá trị mặc định khi nguồn hỏng (`BR-GLR-06`).
- Dùng bảng này làm bằng chứng hiệu quả học tập (`BR-GLR-07`).

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q125-1` | `BR-GLR-04` ghi 222, mục 1.1 ghi 126. Sửa rule là đúng — nhưng cần chữ ký người quyết vì nó là con số phạm vi go-live | WP125.1, và toàn bộ cổng | Product |
| `Q125-2` | Sàn nội dung dùng cho `check:go-live` là bậc nào của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) — bậc 1 hay bậc 2? Bậc 2 cần thêm 181 level | Ngày go-live | Product |
| `Q125-3` | Cổng chạy ở đâu — `pnpm test` mỗi PR, hay chỉ trước phát hành? Chạy mỗi PR thì nó đỏ suốt cho tới khi ba task kia xong | Nhịp CI | Backend |
