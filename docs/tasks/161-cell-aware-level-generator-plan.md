# Task #161 — Bộ sinh level theo ô ma trận: `--cell` và `--report`

> **Loại task:** mã (M) — một trong bốn task con của
> [`Task #157`](157-competency-allocation-program-plan.md).
> **Spec sở hữu:** không spec mới. Task này **thêm một mục** vào
> [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md) và
> cấm — NEVER đổi `BR-LGK-*` đang có.
> **Chặn bởi:**
> - [`Task #158`](158-engine-competency-allocation-plan.md) — hàm đo ô trống
> - [`Task #121`](121-level-generator-kit-plan.md) — bộ sinh nền

## 1. Trả lời ngắn

[`Task #158`](158-engine-competency-allocation-plan.md) cho biết **ô nào trống**. 137 lượt lấp
là con số không soạn tay hết trong thời gian còn lại nếu mỗi lần soạn phải tự tra engine nào
thiếu lĩnh vực nào ở band nào.

Bộ sinh của [`Task #121`](121-level-generator-kit-plan.md) sinh theo **engine**. Task này thêm
một chiều: sinh theo **ô** — một bộ ba `engine / band / lĩnh vực`.

Ranh giới của [`Task #121`](121-level-generator-kit-plan.md) giữ nguyên từng chữ: máy dựng
**khung** `content_pack`, còn tag ba trục và câu lệnh tiếng Việt **viết tay** (`BR-LGK-08`,
`BR-LGK-10`). Nếu máy tự gắn `thinking_tags` hay tự suy `skill_codes`, thì ma trận ở
[`Task #158`](158-engine-competency-allocation-plan.md) đang đo chính đầu ra của máy — phép đo
tự nói về chính nó.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Giá trị |
|---|---:|
| Ô (engine × band hợp lệ) | 74 |
| Ô đạt K = 3 | 15 |
| Lượt lấp còn thiếu | **137** |
| Engine bộ sinh chưa phủ được — cần bộ giải | 2 — `GT-013` mê cung · `GT-015` lưới không lặp |
| Nguồn ngẫu nhiên tất định đã có | `packages/game-engine/src/rng/mulberry32.ts` |

`GT-013` và `GT-015` đã bị loại khỏi lô đầu ở `Q121-2`. Ô trống của hai engine này soạn tay
trong task engine tương ứng ([`#142`](142-engine-gt-013-plan.md), [`#144`](144-engine-gt-015-plan.md)).

### 2.1 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/db check:engine-allocation -- --report
```

## 3. Work package

### WP161.1 — `gen:levels --report`

**Cỡ:** S · **Ranh giới PR:** `packages/db/src/seed-content/cli/`

In mọi ô trống, sắp theo engine, mỗi dòng kèm lĩnh vực mà bản đồ tương hợp **cho phép** nhưng
ô chưa có.

Bắt buộc: gọi **đúng hàm** mà cổng của [`Task #158`](158-engine-competency-allocation-plan.md)
gọi. Cấm — NEVER viết lại phép đo. Hai bản sao của cùng một phép đếm sẽ drift, và lần drift đầu
tiên không ai phát hiện được vì cả hai đều in ra một con số trông hợp lý.

Nghiệm thu của WP này là một phép so: `--report` và `check:engine-allocation` in **cùng** danh
sách ô, cùng thứ tự.

### WP161.2 — `gen:levels --cell <engine>/<band>/<lĩnh vực>`

**Cỡ:** M · **Ranh giới PR:** `packages/db/src/seed-content/cli/`

Ví dụ: `gen:levels --cell GT-014/4-5/C3`.

1. Từ chối nếu lĩnh vực nằm ngoài `allows` của engine trong bản đồ tương hợp (`BR-ECA-03`).
2. Từ chối nếu band nằm trong `banned_age_bands` của engine.
3. Từ chối nếu ô đã đạt K — cấm — NEVER sinh thừa vào ô đã đủ trong khi ô khác trống.
4. Sinh khung `content_pack` và `difficulty_params` theo `limits` của engine, tôn trọng trần
   của band ở [`Task #159`](159-preschool-age-bands-plan.md).
5. **Parse `content_contract` trước khi ghi ra tệp.** Ghi rồi mới kiểm là cách 162 trên 228
   `content_pack` hiện tại lọt vào corpus.
6. Chừa **trống** các trường người phải viết: `title` · `instruction` · `skill_codes` ·
   `what_tags` · `thinking_tags` · `theme_tag`. Trường trống là trường chưa xong, cấm — NEVER
   điền giá trị giữ chỗ trông như thật.
7. Cùng seed cho cùng đầu ra (`BR-LGK-02`).

### WP161.3 — Thêm mục vào spec bộ sinh

**Cỡ:** S · **Ranh giới PR:** `docs/specs/01-platform/level-generator-kit.md`

1. Thêm mục mô tả chiều sinh theo ô, link tới spec ma trận.
2. Thêm rule mới **chỉ** cho chiều này, đánh số tiếp `BR-LGK-*`. Cấm — NEVER sửa rule đang có.
3. Rule mới phải nói: bộ sinh từ chối ô ngoài bản đồ, từ chối ô đã đủ, và chừa trống sáu trường
   của người.

### WP161.4 — Test

**Cỡ:** S · **Ranh giới PR:** `packages/db/tests/`

1. Sinh 5 khung cho 5 ô khác nhau — cả 5 parse `content_contract` sạch.
2. Cùng seed → cùng đầu ra, chạy 100 lần.
3. `--cell GT-026/4-5/C2` → **từ chối**, vì bản đồ cấm C2 cho `GT-026`.
4. `--cell GT-002/3-4/C1` → **từ chối**, vì `GT-002` cấm band `3-4`.
5. `--cell` vào ô đã đạt K → **từ chối**.
6. Khung sinh ra có sáu trường của người **trống**; test khẳng định không trường nào có giá trị
   giữ chỗ.
7. `--report` và `check:engine-allocation` in cùng danh sách ô.

## 4. Điều kiện nghiệm thu

1. `--report` và `check:engine-allocation` dùng chung một hàm đo và in cùng danh sách ô.
2. `--cell` từ chối đúng ba trường hợp: lĩnh vực ngoài bản đồ, band bị cấm, ô đã đủ.
3. Năm khung sinh thử parse `content_contract` sạch **trước** khi ghi tệp.
4. Cùng seed cho cùng đầu ra qua 100 lần chạy.
5. Sáu trường của người để trống; không giá trị giữ chỗ nào.
6. `BR-LGK-08` và `BR-LGK-10` không bị sửa một chữ.
7. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 5. Ranh giới

**Always**
- Một phép đo, hai chỗ gọi.
- Parse contract trước khi ghi.
- Chừa trống mọi trường thuộc phán đoán sư phạm.

**Ask first**
- Thêm `GT-013` hoặc `GT-015` vào lô sinh máy — cần bộ giải, đó là task khác.
- Cho bộ sinh đề xuất `skill_codes` kể cả dưới dạng gợi ý có đánh dấu.

**Never**
- Máy gắn `thinking_tags` · `what_tags` · `theme_tag` (`BR-LGK-08`).
- Máy viết câu lệnh tiếng Việt cho trẻ (`BR-LGK-10`).
- Sửa `BR-LGK-*` đang có.
- Sinh vào ô đã đủ K trong khi ô khác còn trống.
- Ghi tệp trước khi parse contract.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q161-1` | Khung sinh ra ghi thẳng vào `packages/db/src/seed-content/c{1..6}/` hay ra thư mục nháp cho người soạn duyệt rồi mới chuyển? | WP161.2 | Nội dung |
| `Q161-2` | Ô của `GT-013` và `GT-015` soạn tay trong task engine — có cần cờ đánh dấu để `--report` không đề xuất sinh máy? | WP161.1 | Backend |
