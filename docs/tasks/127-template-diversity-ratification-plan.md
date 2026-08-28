# Task #127 — Phê chuẩn ba spec lô khuôn P5: đo trước, lật cờ sau

> **Loại task:** đo + phê chuẩn (S/M) — nối tiếp
> [`Task #102`](102-template-diversity-plan.md).
> **Spec sở hữu:** [`taxonomy-gap-batch.md`](../specs/01-platform/taxonomy-gap-batch.md) ·
> [`lesson-template-variety.md`](../specs/05-content/lesson-template-variety.md) ·
> [`template-coverage-level-batch.md`](../specs/05-content/template-coverage-level-batch.md)
> — cả ba đổi `status: approved` → `implemented` **nếu** đo lại xanh.
> **Chặn bởi:** [`Task #117`](117-seed-gate-truth-plan.md) (`BR-TCL-03`) ·
> [`Task #124`](124-lesson-corpus-depth-plan.md) (`BR-LTV-04`, `BR-LTV-09`).

## 1. Trả lời ngắn

Ba spec này ở trạng thái đáng ngờ: checklist của Task #102 **đã tick hết 53 ô**, nhưng cả ba
spec vẫn mang `status: approved`.

Đo lại cho thấy checklist không sai — nó chỉ đo thứ khác. Ít nhất **hai** business rule của
hai spec đang **thật sự đỏ**:

| Rule | Spec | Trạng thái đo được |
|---|---|---|
| `BR-TCL-03` — `content_pack` parse được bằng `content_contract` | `template-coverage-level-batch` | **Đỏ** — 162 / 228 level không parse ([Task #117](117-seed-gate-truth-plan.md) mục 2.2) |
| `BR-LTV-04` — bước chơi trỏ level có skill đúng cụm | `lesson-template-variety` | **Đỏ** — 151 / 162 bước chơi sai kỹ năng ([Task #124](124-lesson-corpus-depth-plan.md) mục 2) |
| `BR-LTV-09` — mỗi engine có level được ≥1 bài học dùng | `lesson-template-variety` | **Đỏ** — `GT-007` và `GT-008` có 27 level, 0 liên kết giáo án |

Nói cách khác: cờ chưa lật là **đúng**. Task #127 không phải task lật cờ — nó là task **đo lại
từng rule**, đóng cái nào còn đỏ, rồi mới lật.

Đây chính là ca mà [`Task #114`](114-next-roadmap-plan.md) mục 8 câu 2 đặt ra: checklist tick
hết mà cờ chưa lật là quên lật, hay acceptance chưa từng chạy? Câu trả lời đo được là **thứ ba**
— acceptance chạy rồi, và nó đỏ.

## 2. Bằng chứng đã đo (2026-08-29)

### 2.1 Ba spec, mười tám business rule

| Spec | Số `BR-*` | Rule đo được là đỏ |
|---|---:|---|
| `taxonomy-gap-batch` | 10 (`BR-TGB-01` … `-10`) | Chưa phát hiện — cần đo `BR-TGB-03` và `BR-TGB-09` |
| `lesson-template-variety` | 10 (`BR-LTV-01` … `-10`) | `BR-LTV-04`, `BR-LTV-09` |
| `template-coverage-level-batch` | ≥3 (`BR-TCL-01` … ) | `BR-TCL-03` |

`BR-TCL-01` (mỗi khuôn ≥3 level) ghi trong spec là **đạt 2026-08-29 trên cả 27 khuôn** — và
đó là con số đúng: 17 engine có đúng 3 level. Rule này đạt; nó chỉ đạt ở mức tối thiểu, và đó
là chủ ý của lô một-lần này. Sàn không tụt sau đó thuộc
[`engine-content-depth.md`](../specs/05-content/engine-content-depth.md), không thuộc file này.

### 2.2 Hai rule của `taxonomy-gap-batch` phải đo

| Rule | Phải đo gì |
|---|---|
| `BR-TGB-03` | Mỗi giá trị `inhibit` và `shift` của trục `thinking` có ≥1 level thật. `GT-026` phục vụ `inhibit`, `GT-027` phục vụ `shift`; cả hai đang ở 3 level mẫu |
| `BR-TGB-09` | Ba giá trị `mechanic` mới có trong từ vựng trục `mechanic` **trước** khi seed. Trục `mechanic` đã đóng thật từ 2026-08-22 — kiểm ba giá trị có mặt |

### 2.3 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/db report:tags
pnpm --filter @mindkid/db seed:report
pnpm --filter @mindkid/db test -- template
```

## 3. Work package

### WP127.1 — Đo lại mười tám rule

**Cỡ:** M · **không sửa gì**

Với **mỗi** `BR-*` của ba spec: chạy phép đo, ghi kết quả đạt hay trượt, kèm con số. Bảng vào
todo.

**Cấm — NEVER** dùng checklist của Task #102 làm bằng chứng. Checklist ghi việc đã làm; rule đo
trạng thái hiện tại. Hai thứ khác nhau, và chênh lệch giữa chúng là toàn bộ lý do task này tồn tại.

Rule nào không có phép đo tự động thì ghi rõ **"chưa đo được"** — đó cũng là kết quả, và nó
chặn việc lật cờ y như một rule đỏ.

### WP127.2 — Đóng rule còn đỏ

**Cỡ:** S · **phần lớn nằm ở task khác**

| Rule | Đóng ở đâu |
|---|---|
| `BR-TCL-03` | [`Task #117`](117-seed-gate-truth-plan.md) WP117.4 |
| `BR-LTV-04` | [`Task #124`](124-lesson-corpus-depth-plan.md) WP124.3 |
| `BR-LTV-09` | [`Task #124`](124-lesson-corpus-depth-plan.md) WP124.2 |
| `BR-TGB-03` | [`Task #122`](122-engine-content-depth-plan.md) WP122.3 — `GT-026` và `GT-027` là ưu tiên 2 |
| Rule phát hiện thêm ở WP127.1 | Task này, nếu nhỏ; task riêng, nếu không |

Task #127 **không** làm lại việc của bốn task kia. Nó chờ, rồi đo lại.

### WP127.3 — Rule không có phép đo

**Cỡ:** S

`BR-LTV-06` đòi cổng có ca âm; `BR-LTV-07` đòi miễn trừ ghi thành hàng; `BR-LTV-10` đòi cảnh
báo khi level không bài học nào trỏ tới.

Với mỗi rule chưa có phép đo: hoặc thi công phép đo ở đây (nếu ≤1 file), hoặc mở một hàng nợ
ghi rõ rule nào chưa ai đo. **Cấm — NEVER** lật cờ với rule chưa đo được.

### WP127.4 — Lật cờ

**Cỡ:** S · **Ranh giới PR:** `docs/specs`

Mỗi spec lật độc lập, khi **mọi** rule của nó đo được và đạt:

- [`taxonomy-gap-batch.md`](../specs/01-platform/taxonomy-gap-batch.md)
- [`lesson-template-variety.md`](../specs/05-content/lesson-template-variety.md)
- [`template-coverage-level-batch.md`](../specs/05-content/template-coverage-level-batch.md)

PR ghi bảng WP127.1 sau khi đo lại, cột "đạt" phải đủ. Không lật ba cái cùng lúc chỉ vì chúng
cùng lô.

## 4. Điều kiện nghiệm thu

1. Bảng WP127.1 có **mọi** `BR-*` của ba spec, kèm con số đo và kết quả.
2. Không rule nào ở trạng thái "chưa đo được" khi cờ được lật.
3. Rule đỏ đã đóng ở task sở hữu nó, và đo lại xanh ở đây.
4. Mỗi spec lật độc lập, có bảng đo kèm PR.
5. Ba spec mang `status: implemented`, hoặc — nếu còn rule đỏ — giữ `approved` và ghi rõ rule
   nào chặn, chặn bởi task nào.
6. `pnpm --filter @mindkid/db test` xanh.

## 5. Ranh giới

**Always**
- Đo lại từng rule, không tin checklist.
- Ghi "chưa đo được" là một kết quả.
- Lật từng spec độc lập.

**Ask first**
- Lật cờ khi còn một rule chưa đo được.

**Never**
- Dùng checklist Task #102 làm bằng chứng.
- Lật ba spec cùng lúc vì chúng cùng lô.
- Làm lại việc của Task #117, #122, #124.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q127-1` | Có bao nhiêu rule trong ba spec **chưa có phép đo nào**? Đây là con số quan trọng nhất của task; nó chỉ lộ ra ở WP127.1 | WP127.3 | Backend |
| `Q127-2` | Nếu một rule không đo tự động được — ví dụ `BR-TGB-05` (phản hồi khi trẻ không chạm) — thì bằng chứng thay thế là gì? Test thủ công có ghi lại, hay rule đó phải viết lại cho đo được? | WP127.3 | Backend + Sư phạm |
