# Task #121 — Bộ sinh level: tổ hợp có seed, parse trước khi ghi, người đọc từng cái

> **Loại task:** mã (M) — tách từ WP113.6 của
> [`Task #113`](113-game-engine-depth-and-seed-diversity-plan.md).
> **Spec sở hữu:** [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md) —
> đóng, `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:** [`Task #119`](119-theme-registry-plan.md) (vốn từ chủ đề) ·
> [`Task #117`](117-seed-gate-truth-plan.md) (cổng parse contract phải thật trước) ·
> quyết định `Q121-1` (cách sinh).

## 1. Trả lời ngắn

Sàn bậc 2 — 12 hay 20 level mỗi engine, `Q114-2` — nhân với 27 engine là **324 tới 540 level**.
Corpus hiện có 228. Chênh lệch không đóng được bằng tay trong thời gian còn lại của go-live.

Bộ sinh tồn tại để dựng **khung** màn chơi: hình dạng `content_pack`, phân bố tham số độ khó,
và tổ hợp vốn từ chủ đề. Nó **Cấm — NEVER** tự đặt tag ba trục và **Cấm — NEVER** viết câu lệnh
tiếng Việt cho trẻ — hai thứ đó là phán đoán sư phạm, thuộc về người (`BR-LGK-08`, `BR-LGK-10`).

`BR-LGK-10` là ranh giới quan trọng nhất của spec: nếu máy tự gắn `thinking_tags`, thì ma trận
phủ tư duy đang đo chính đầu ra của máy, không đo nội dung. Phép đo tự nói về chính nó.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Giá trị |
|---|---:|
| Level đã seed | 228 |
| Engine | 27 |
| Sàn bậc 2 chưa chốt (`Q114-2`) | 12 hoặc 20 mỗi engine |
| Level phải có ở sàn bậc 2 | 324 – 540 |
| Chênh lệch phải sinh hoặc soạn | **96 – 312** |
| Nguồn ngẫu nhiên tất định đã có | [`deterministic-randomness.md`](../specs/01-platform/deterministic-randomness.md), `src/rng/mulberry32.ts` |
| Vốn từ chủ đề | Chưa có — [`Task #119`](119-theme-registry-plan.md) WP119.5 dựng |

Con số 96–312 là **sau khi** trừ 228 level hiện có, và **chưa** trừ level phải archive ở
[`Task #118`](118-band-violation-cleanup-plan.md). Cộng dồn ngân sách ở
[`Task #122`](122-engine-content-depth-plan.md), đừng đếm hai lần.

## 3. Quyết định phải chốt trước khi viết mã

### `Q121-1` — tổ hợp có seed, hay mô hình ngôn ngữ

| Đường | Ưu | Nhược |
|---|---|---|
| **Tổ hợp có seed** | Tất định, rẻ, tái dựng được, không phụ thuộc nhà cung cấp | Lặp — vốn từ hẹp thì ứng viên giống nhau |
| **Mô hình ngôn ngữ** | Đa dạng hơn | Phải qua cổng 4 (trùng nội dung) và cổng 7 (an toàn trẻ em) chặt hơn; đụng ranh giới của [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md); và `BR-LGK-02` (tất định) khó giữ |

**Đề xuất: tổ hợp có seed.** Lý do đo được: `BR-LGK-02` buộc cùng seed cho cùng đầu ra, và một
lô 300 level không tái dựng được là một lô không so sánh được khi phát hiện lỗi. Đa dạng thiếu
thì mở rộng vốn từ — đó là việc của người soạn và nó có cổng (`BR-CTR-08`). Đa dạng thừa mà
không tái dựng được thì không có đường sửa.

### `Q121-2` — engine nào không sinh máy được

`GT-013` (mê cung) và `GT-015` (lưới không lặp) cần **bộ giải** để bảo đảm có lời giải và lời
giải là duy nhất. Đó là bộ sinh khác hẳn về độ khó thi công.

**Đề xuất:** lô đầu tiên **loại** hai engine này. `maze-system.ts` (11,7 KB) và
`constraint-system.ts` (9,0 KB) đã có logic kiểm hợp lệ — dùng chúng làm bộ lọc chứ không làm
bộ giải: sinh ngẫu nhiên, chạy qua system, giữ cái hợp lệ. Nếu tỉ lệ giữ quá thấp thì mới viết
bộ giải, và đó là task riêng.

## 4. Work package

### WP121.1 — Khung bộ sinh

**Cỡ:** M · **File:** 4 · **Ranh giới PR:** `packages/db` hoặc `packages/game-engine`

1. `gen:levels` — CLI nhận `--engine`, `--count`, `--seed`, `--theme`, `--band`.
2. Một bộ sinh cho **một** engine, nhận kiểu từ `content_contract` qua `z.infer` (`BR-LGK-01`).
3. Nguồn ngẫu nhiên từ `deriveStream()` của `src/rng/mulberry32.ts` (`BR-LGK-02`).
4. Mỗi ứng viên `.parse()` bằng `content_contract` thật, gồm `refine`, **trước khi** ghi file
   (`BR-LGK-03`). Ứng viên trượt thì bỏ và đếm.
5. Đầu ra là **file seed**, không phải bản ghi database (`BR-LGK-04`).
6. Level sinh mang `origin` phân biệt được với `human` (`BR-LGK-06`).
7. Bộ sinh **để trống** `thinking_tags`, `what_tags`, `skill_codes`, `instruction`, `prompt`
   (`BR-LGK-08`, `BR-LGK-10`).

**Ca kiểm bắt buộc cho `BR-LGK-04`:** chạy `gen:levels` với `DATABASE_URL` trỏ host không tồn
tại. Lệnh phải chạy xong bình thường. Nếu nó lỗi kết nối, nó đang mở kết nối — đỏ.

### WP121.2 — Vốn từ và bộ sinh cho lô đầu

**Cỡ:** M · **Ranh giới PR:** một PR mỗi ba engine

Lô đầu: engine dùng vốn từ chủ đề và tổ hợp phần tử, không cần bộ giải. Từ bảng lát A và lát B
của [`Task #116`](116-engine-vertical-slices-plan.md), loại `GT-013` và `GT-015`:

`GT-001` `GT-002` `GT-003` `GT-004` `GT-005` `GT-006` `GT-007` `GT-008` `GT-010` `GT-011`
`GT-012` `GT-018` `GT-019` `GT-020` `GT-022` `GT-023` `GT-025` `GT-026` `GT-027` — **19 engine**.

Tám engine ngoài lô đầu: `GT-009` `GT-013` `GT-014` `GT-015` `GT-016` `GT-017` `GT-021`
`GT-024` — nội dung của chúng soạn tay ở [`Task #122`](122-engine-content-depth-plan.md), hoặc
sinh ở lô sau nếu bộ lọc đủ tốt.

Mỗi engine: sinh 40 ứng viên, đo tỉ lệ trượt parse và tỉ lệ trùng nhau. **Tỉ lệ trùng là thước
đo vốn từ** — trùng cao nghĩa là vốn từ hẹp, không phải bộ sinh hỏng.

### WP121.3 — Bước người đọc

**Cỡ:** S · **Ranh giới PR:** quy trình, không phải mã

1. PR chứa level sinh máy ghi trong mô tả: ai đọc, bao nhiêu ứng viên bị bỏ (`BR-LGK-07`).
2. Bỏ 0 trên 40 → PR bị trả lại. Con số bị bỏ là bằng chứng có người đọc.
3. `instruction` và `prompt` viết tay ở bước này (`BR-LGK-08`).
4. Tag ba trục gắn tay ở bước này (`BR-LGK-10`).
5. Level đi qua **đủ tám cổng** của [`Task #117`](117-seed-gate-truth-plan.md), không nới
   (`BR-LGK-05`).

### WP121.4 — Cổng cho chính bộ sinh

**Cỡ:** S · **Ranh giới PR:** `packages/db`

| Phép kiểm | Ca âm |
|---|---|
| `gen:levels` không mở database | `DATABASE_URL` trỏ host không tồn tại → vẫn chạy xong |
| Cùng seed cho cùng đầu ra | Chạy hai lần cùng seed, so byte |
| Ứng viên không parse thì không ghi | Fixture vốn từ gây lỗi → 0 file ghi ra |
| Bộ sinh không đặt tag | Đọc file sinh ra, ba trường tag rỗng |
| Level sinh mang `origin` khác `human` | Fixture kiểm trường |

## 5. Điều kiện nghiệm thu

1. `gen:levels --engine GT-001 --count 40 --seed 42` chạy hai lần cho **kết quả trùng byte**.
2. Chạy với `DATABASE_URL` trỏ host không tồn tại — **vẫn chạy xong**.
3. Mọi file sinh ra parse được `content_contract` của engine tương ứng.
4. File sinh ra có `thinking_tags`, `what_tags`, `skill_codes`, `instruction`, `prompt` **rỗng**.
5. `origin` của level sinh phân biệt được với `human`, và giữ nguyên sau khi người sửa.
6. Năm ca âm của WP121.4 đều đỏ vì đúng lý do.
7. Tỉ lệ trùng của mỗi engine trong lô đầu có trong todo — đây là thước đo vốn từ, đầu vào cho
   quyết định mở rộng vốn từ ở Task #122.
8. `level-generator-kit.md` mang `status: implemented`.
9. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 6. Ranh giới

**Always**
- Parse bằng contract thật trước khi ghi.
- Nguồn ngẫu nhiên tất định.
- Ghi số ứng viên bị bỏ trong mô tả PR.

**Ask first**
- Đường mô hình ngôn ngữ (`Q121-1`).
- Viết bộ giải cho `GT-013` / `GT-015`.
- Đưa engine ngoài lô đầu vào lô đầu.

**Never**
- Mở kết nối database trong `gen:levels`.
- Bộ sinh đặt `thinking_tags`, `what_tags`, `skill_codes`.
- Bộ sinh viết `instruction` hoặc `prompt` tiếng Việt cho trẻ.
- Nới cổng cho nội dung sinh máy.
- Sửa vốn từ qua giao diện — vốn từ là dữ liệu Lớp 1, sửa qua PR (`BR-LGK-09`).

## 7. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q121-1` | Tổ hợp có seed hay mô hình ngôn ngữ | WP121.1 | Backend + Product |
| `Q121-2` | `GT-013` và `GT-015`: bộ lọc bằng system có sẵn, hay viết bộ giải | Phạm vi lô đầu | Backend |
| `Q121-3` | Giá trị `origin` cho nội dung sinh máy — trùng nợ với bộ giá trị `origin` mà [`game-level-model.md`](../specs/05-content/game-level-model.md) sở hữu | `BR-LGK-06` | Nội dung |
| `Q121-4` | Bao nhiêu danh từ mỗi chủ đề là đủ? Chỉ lộ ra sau lượt sinh đầu — đo bằng tỉ lệ trùng ở WP121.2 | Ngân sách Task #122 | Nội dung |
