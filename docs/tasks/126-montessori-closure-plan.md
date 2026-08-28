# Task #126 — Đóng đuôi bốn spec Montessori

> **Loại task:** đóng đuôi (S/M) — nối tiếp [`Task #98`](98-montessori-corpus-intake-plan.md)
> và [`Task #99`](99-montessori-template-designs-plan.md).
> **Spec sở hữu:** [`montessori-corpus-mapping.md`](../specs/05-content/montessori-corpus-mapping.md) ·
> [`montessori-game-level-batch.md`](../specs/05-content/montessori-game-level-batch.md) ·
> [`montessori-lesson-batch.md`](../specs/05-content/montessori-lesson-batch.md) ·
> [`montessori-template-batch.md`](../specs/01-platform/montessori-template-batch.md) —
> cả bốn đổi `status: approved` → `implemented` ở cuối task.
> **Chặn bởi:** quyết định `Q126-1` — trần hạn ngạch C1 và C4.

## 1. Trả lời ngắn

Bốn spec Montessori mang `status: approved`. Hai plan sở hữu chúng gần xong:

| Plan | Todo | Còn lại |
|---|---:|---|
| [`98-montessori-corpus-intake`](98-montessori-corpus-intake-todo.md) | 77 / 78 | Chỉ còn mở PR |
| [`99-montessori-template-designs`](99-montessori-template-designs-todo.md) | 68 / 74 | 6 việc, chặn bởi trần C1 |

Chặn thật nằm ở **hạn ngạch nội dung**, không ở chi phí engine:

| Competency | Trần | Đã dùng | Còn lại |
|---|---:|---:|---:|
| C1 | 36 | 36 | **0 — hết trần** |
| C2 | 9 | 4 | 5 |
| C3 | 15 | 0 | 15 |
| C4 | 9 | **10** | **−1 — vượt trần** |

Bốn khuôn `GT-010` `GT-012` `GT-014` `GT-016` chỉ phục vụ workbook C1. Build xong hôm nay là
build một khuôn không seed được nội dung nào.

Hai hàng phải xử lý trước khi seed thêm, và cả hai là quyết định người. `BR-MGL-01` là **trần
cứng** — **Cấm — NEVER** để C4 vượt trần rồi seed tiếp.

## 2. Bằng chứng đã đo

### 2.1 Sáu việc còn lại của Task #99

1. Đọc mục 4 của plan cho khuôn sắp làm, trước khi mở editor.
2. Chạy `seed:report` và cổng hạn ngạch.
3. Điều kiện nghiệm thu 12 — ngân sách hiệu năng band thấp nhất — chưa đo.
4. Nội dung C3 seed được (WP99.6) — chưa làm.
5. Điều kiện nghiệm thu 7 (journey E2E) và 12 chưa đo.
6. Mở PR.

C3 còn **15** chỗ chưa chạm. Đó là đường ra khỏi bế tắc trần C1: nội dung C3 seed được mà
không cần quyết định nới trần nào.

### 2.2 Mẫu số lệch 2

Phép chia 33 nhận trên 24 hoãn của `D-RQ` tính trên **57**; bảng tra có **59** mã. Một trong
hai sai, và hạn ngạch phụ thuộc vào nó. Phải đối chiếu **trước** khi seed lô tiếp.

### 2.3 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/db seed:report
pnpm --filter @mindkid/db test -- montessori
```

## 3. Work package

### WP126.1 — Đối chiếu mẫu số

**Cỡ:** S · **không sửa nội dung**

1. Đếm mã trong bảng tra: 57 hay 59.
2. Nếu 59, phép chia của `D-RQ` sai và mọi hạn ngạch phải tính lại.
3. Ghi con số đúng, người quyết xác nhận. Hạn ngạch tính lại **trước** WP126.2.

### WP126.2 — C4 vượt trần

**Cỡ:** S · **cổng người**

Hai đường, chọn một:

| Đường | Việc |
|---|---|
| A | Gỡ một level C4 khỏi lô — chuyển `archived` bằng version mới |
| B | Nới trần C4 kèm lý do, ghi vào quyết định có mã |

**Cấm — NEVER** để nguyên và seed tiếp. `BR-MGL-01` là trần cứng.

### WP126.3 — Nội dung C3

**Cỡ:** M · **Ranh giới PR:** một PR mỗi năm level

C3 còn 15 chỗ. Soạn nội dung C3 để bốn khuôn `GT-010` `GT-012` `GT-014` `GT-016` có nội dung
seed được, hoặc xác nhận rằng bốn khuôn đó **không** phục vụ C3 được và bế tắc trần C1 phải
giải bằng quyết định nới trần (`Q126-1`).

Level C3 đi qua đủ tám cổng của [`Task #117`](117-seed-gate-truth-plan.md), và đếm vào ngân
sách của [`Task #122`](122-engine-content-depth-plan.md) — soạn một lần, đếm hai chỗ.

### WP126.4 — Hai điều kiện nghiệm thu chưa đo

**Cỡ:** S

1. **Điều kiện 12** — ngân sách hiệu năng band thấp nhất. Đo trên thiết bị hoặc profile mô
   phỏng band `3-4`. Ràng buộc ngân sách khung hình thuộc
   [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md).
2. **Điều kiện 7** — journey E2E. Chạy được sau khi
   [`Task #115`](115-render-contract-core-plan.md) cài `render()` — trước đó journey chạy trên
   canvas trống và không chứng minh gì.

### WP126.5 — Phê chuẩn bốn spec

**Cỡ:** S · **Ranh giới PR:** `docs/specs`

Bốn spec đổi `status: approved` → `implemented`, ghi ngày. Điều kiện: mọi acceptance criteria
của chúng đã xanh — **đo lại**, không tin checklist.

Đây là chỗ dễ lặp lại lỗi mà [`Task #114`](114-next-roadmap-plan.md) mục 8 câu 2 đang phải đi
đo: ba spec P5 có checklist tick hết mà cờ chưa lật. Ở đây làm ngược lại: đo trước, lật sau.

## 4. Điều kiện nghiệm thu

1. Mẫu số đã đối chiếu; hạn ngạch tính trên con số đúng.
2. C4 không còn vượt trần — đường A hoặc B đã thực hiện, có quyết định ghi lại.
3. Cổng hạn ngạch xanh trên cả bốn competency.
4. Điều kiện nghiệm thu 7 và 12 của Task #99 đã đo, kết quả ghi trong PR.
5. Mọi acceptance criteria của bốn spec **đo lại** và xanh — không tin checklist.
6. Bốn spec mang `status: implemented`.
7. Level C3 mới đếm vào ngân sách Task #122, không đếm hai lần.
8. `pnpm --filter @mindkid/db test` xanh.

## 5. Ranh giới

**Always**
- Đo lại acceptance criteria trước khi lật cờ.
- Đối chiếu mẫu số trước khi tính hạn ngạch.

**Ask first**
- Nới trần C1 hoặc C4 (`Q126-1`).

**Never**
- Seed tiếp khi C4 còn vượt trần.
- Lật `status` theo checklist mà không đo.
- Chạy journey E2E trên canvas trống rồi coi là đạt.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q126-1` | Trần C1 đã hết. Nới trần, hay bốn khuôn `GT-010` `GT-012` `GT-014` `GT-016` chuyển sang phục vụ C3? | WP126.3 | Nội dung + Product |
| `Q126-2` | C4 vượt trần 1 level: gỡ một level, hay nới trần? | WP126.2 | Nội dung |
| `Q126-3` | Mẫu số 57 hay 59 — con số nào đúng, và hạn ngạch nào phải tính lại theo? | WP126.1 | Nội dung |
