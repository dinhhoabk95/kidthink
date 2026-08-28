# Task #118 — Bốn mươi hai level gắn band mà engine cấm

> **Loại task:** nợ dữ liệu (S/M) — tách từ WP113.4 của
> [`Task #113`](113-game-engine-depth-and-seed-diversity-plan.md).
> **Spec sở hữu:** không spec mới. Đóng nợ của
> [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) và
> [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md); mở đường bật
> `BR-ECD-13` của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md).
> **Chặn bởi:** [`Task #117`](117-seed-gate-truth-plan.md) — phép kiểm band phải tồn tại ở
> cổng 5 trước, và quyết định người về đường xử lý.

## 1. Trả lời ngắn

Sáu engine khai `banned_age_bands`. **42 level** đang gắn đúng những band đó.

```
GT-002  banned_age_bands: ["3-4"]
GT-004  banned_age_bands: ["3-4"]
GT-006  banned_age_bands: ["3-4", "4-5"]
GT-024  banned_age_bands: ["3-4"]
GT-026  banned_age_bands: ["3-4"]
GT-027  banned_age_bands: ["3-4"]
```

`banned_age_bands` không phải gợi ý. `GT-006` cấm cả `3-4` lẫn `4-5` vì trẻ dưới 5 tuổi chưa
giữ được thứ tự dãy đủ dài; `GT-002` cấm `3-4` vì trẻ 3 tuổi chưa giữ được tiêu chí trong trí
nhớ làm việc qua nhiều lượt chạm. Đây là ràng buộc phát triển, không phải tham số cân bằng.

Nặng nhất là **15 màn `GT-006`** gắn cả hai band engine đang cấm.

Cổng không bắt vì cổng 3 chỉ kiểm band **thuộc tập `3-4 | 4-5 | 5-6`**, không đối chiếu với
`banned_age_bands` của engine. Task #117 thêm phép kiểm đó ở chế độ báo cáo; Task #118 dọn nợ
rồi bật chặn.

## 2. Bằng chứng đã đo (2026-08-29)

| Engine | Band engine cấm | Level vi phạm |
|---|---|---:|
| `GT-006` | `3-4`, `4-5` | 15 |
| `GT-002` | `3-4` | phần còn lại của 42, đo lại theo từng engine ở Preflight |
| `GT-004` | `3-4` | ” |
| `GT-024` | `3-4` | ” |
| `GT-026` | `3-4` | ” |
| `GT-027` | `3-4` | ” |
| **Tổng** | | **42 / 228** |

Con số 42 là tổng đã đo ngày 2026-08-29. Phân bố chi tiết theo engine phải đo lại ở Preflight —
plan này cấm dùng con số tổng để lập kế hoạch sửa.

### 2.1 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
for i in $(seq -w 1 27); do
  grep -m1 "banned_age_bands" packages/game-engine/src/templates/GT-0$i/template.ts \
    && echo "  ^ GT-0$i"
done
pnpm --filter @mindkid/db seed:report   # phân bố band theo engine
```

## 3. Quyết định phải chốt trước khi sửa

### `Q118-1` — sửa band hay soạn lại nội dung

| Đường | Việc | Khi nào đúng |
|---|---|---|
| **A — đổi band thành version mới** | Giữ nội dung, chuyển level sang band engine cho phép | Nội dung vốn hợp lứa lớn hơn, chỉ gắn nhãn sai |
| **B — archive và soạn lại** | Đưa level về `archived`, soạn level mới cho đúng lứa | Nội dung thật sự viết cho trẻ 3 tuổi, và engine không phục vụ được lứa đó |

Hai đường không loại trừ nhau ở mức corpus — mỗi level có thể thuộc đường khác nhau. Nhưng
**Cấm — NEVER** chọn đường theo từng level lúc đang sửa. Chốt luật trước:

**Đề xuất luật.** Đọc `content_pack` của level: nếu số phần tử, độ dài câu hỏi, và số bước đều
nằm trong khoảng engine phục vụ ở band cho phép → đường A. Ngược lại → đường B. Ghi luật vào
todo, áp đều, và ghi từng level thuộc đường nào.

15 màn `GT-006` gần như chắc chắn là đường B: engine cấm cả hai band dưới, nên chuyển sang
`5-6` là đổi lứa hai bậc — nội dung viết cho trẻ 3 tuổi không tự nhiên thành nội dung cho trẻ 6.

**Cấm — NEVER** `UPDATE` bản published. Đường A là INSERT version mới; đường B là INSERT bản
`archived` cộng level mới (`BR-CSA-01`).

## 4. Work package

### WP118.1 — Đo lại và phân loại

**Cỡ:** S · **Ranh giới PR:** không sửa dữ liệu

1. Với mỗi engine có `banned_age_bands`, liệt kê level vi phạm kèm mã, band hiện tại, band
   engine cho phép.
2. Áp luật của `Q118-1` cho từng level, ghi đường A hoặc B.
3. Bảng kết quả vào todo. Người quyết duyệt bảng **trước** khi sửa bản ghi nào.

### WP118.2 — Luật sửa, viết một lần cho 27 task engine

**Cỡ:** S · **không sửa bản ghi nào**

Phạm vi đổi ngày 2026-08-29: việc **dọn** 42 level đã chuyển sang 27 task engine `#130`–`#156`
của [`Task #116`](116-engine-vertical-slices-plan.md), mỗi engine dọn phần của mình ở `WPn.4`.
Sáu engine có `banned_age_bands` là `GT-002` `GT-004` `GT-006` `GT-024` `GT-026` `GT-027`, nên
chỉ sáu task engine có WP này thật; 21 task còn lại chỉ đo và ghi 0.

Task #118 viết **luật**, một lần, để sáu task kia áp giống nhau:

| Đường | Việc | Ràng buộc |
|---|---|---|
| A — đổi band | INSERT version mới với band hợp lệ; bản cũ không chạm | Chỉ đổi band **lên**. Band lớn hơn có sàn chạm nhỏ hơn nên không phá `BR-ERC-04`; đổi xuống thì có |
| B — archive và soạn lại | Chuyển `archived` bằng version mới; cấm xoá; soạn thay thế đúng lứa | Số thay thế ≥ số archive, để không tụt sàn chiều sâu của engine đó |

Level thay thế của đường B **cộng dồn** vào `WPn.5` của chính task engine đó, và vào ngân sách
55 của [`Task #122`](122-engine-content-depth-plan.md). Soạn một lần, đếm một chỗ.

### WP118.3 — Theo dõi và đóng nợ

**Cỡ:** S · **không sửa bản ghi nào**

1. Bảng 42 level: mã · engine · band hiện tại · band cho phép · đường A hay B — giao cho sáu
   task engine.
2. Bậc thang: tổng `out_of_band_count` chỉ được **giảm**.
3. Mỗi task engine merge làm nó giảm; về 0 thì WP118.4 chạy.

### WP118.4 — Bật chặn

**Cỡ:** S

1. Phép kiểm band ở cổng 5 chuyển từ **báo cáo** sang **chặn**.
2. Ca âm: gắn một level vào band engine cấm → cổng đỏ.
3. Bật `BR-ECD-13` của [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md).

## 5. Điều kiện nghiệm thu

1. `pnpm --filter @mindkid/db seed:report` in `0 level ngoài band engine`.
2. Gắn một level vào band engine cấm → cổng 5 **đỏ**. Hoàn tác sau khi ghi bằng chứng.
3. Không bản ghi published nào bị `UPDATE`; mọi thay đổi là INSERT version mới.
4. Level đường B đã archive có bản thay thế, số lượng không nhỏ hơn số đã archive.
5. Mọi level mới qua đủ tám cổng, kể cả parse `content_contract`.
6. Bảng phân loại WP118.1 có chữ ký người duyệt.
7. `pnpm --filter @mindkid/db test` xanh; danh sách test trùng khít trừ test mới.

## 6. Ranh giới

**Always**
- Chốt luật phân loại trước, áp đều sau.
- INSERT version mới cho mọi thay đổi.
- Cộng số level phải soạn vào ngân sách Task #122.

**Ask first**
- Nới `banned_age_bands` của một engine. Đây là ràng buộc phát triển của trẻ — nới nó để 15
  màn `GT-006` hợp lệ là đúng thứ **Cấm — NEVER**: nới rule cho corpus hiện tại qua cổng.

**Never**
- `UPDATE` hoặc `DELETE` bản ghi đã publish.
- Chọn đường A/B theo từng level lúc đang sửa.
- Bật chặn trước khi nợ về 0.

## 7. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q118-1` | Luật phân loại đường A / đường B | Toàn bộ task | Nội dung + Sư phạm |
| `Q118-2` | 15 màn `GT-006` nếu đi đường B thì cần 15 level mới cho band `5-6`. Ngân sách đó thuộc Task #118 hay Task #122? | Lịch hai task | Product |
