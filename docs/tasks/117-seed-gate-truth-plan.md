# Task #117 — Cổng seed nói thật, và 162 level không parse được

> **Loại task:** cổng + nợ dữ liệu (M) — tách từ WP113.2a và WP113.4a của
> [`Task #113`](113-game-engine-depth-and-seed-diversity-plan.md).
> **Spec sở hữu:** không spec mới. Task này đóng nợ của
> [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) và
> [`game-template-contract.md`](../specs/01-platform/game-template-contract.md), và mở đường
> đo cho [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md).
> **Chặn bởi:** quyết định `Q114-1` — sửa nội dung hay sửa contract.

## 1. Trả lời ngắn

Bộ tám cổng seed báo **552 / 552 đạt**. Con số đó không sai; nó chỉ không đo thứ nó tự nhận đo.

Hai chỗ đo được, đọc thẳng mã nguồn:

**Cổng 1 — "Schema".** Với game level, toàn bộ phép kiểm là bốn dòng ở
`packages/db/src/seed-content/gates/runner.ts:129`:

```ts
if (!gl.content_pack || typeof gl.content_pack !== "object") { ... }
if (!gl.difficulty_params || typeof gl.difficulty_params !== "object") { ... }
```

`typeof x === "object"` — hết. Không nạp `content_contract` của engine, không gọi `parse`.
Một `content_pack` là `{}` rỗng vẫn qua cổng "Schema".

Khi nạp `content_contract` thật và parse: **162 / 228 level trượt**; `difficulty_params`:
**170 / 228 trượt**.

**Cổng 5 — "Tagging".** Nó gọi `isValidTagForAxis`, và hàm đó kết thúc bằng
`packages/db/src/seed-content/vocabulary.ts:34`:

```ts
return SLUG_REGEX.test(tag);   // /^[a-z0-9_]{2,50}$/
```

Bất kỳ chuỗi chữ thường nào cũng là tag hợp lệ. Từ vựng đóng bị vô hiệu bởi dòng cuối của hàm
kiểm tra từ vựng.

Task #117 làm hai việc, đúng thứ tự đó: **sửa cổng cho nói thật**, rồi **xử lý 162 bản ghi mà
cổng thật sẽ bắt**. Không được bật cổng trước khi có đường xử lý — bật trước là làm đỏ toàn bộ
seed và chặn mọi task khác.

## 2. Bằng chứng đã đo (2026-08-29)

### 2.1 Tám cổng đo gì, thật sự

| Cổng | Tên | Đo gì thật | Có ca âm |
|---:|---|---|:--:|
| 0 | Mã và trùng lặp | Regex mã, mã trùng trong lô | Không |
| 1 | Schema | `typeof === "object"` — **không parse contract** | Không |
| 2 | Liên kết | FK về activity, lesson, level | Không |
| 3 | Band tuổi | Band thuộc tập hợp lệ — **không đối chiếu band engine** | Không |
| 4 | Trùng nội dung | Heuristic tiêu đề gần giống | Không |
| 5 | Tagging | Tag không rỗng, "thuộc từ vựng" — **vô hiệu bởi `SLUG_REGEX`** | Không |
| 6 | Chất lượng văn bản | Độ dài, khoảng trắng | Không |
| 7 | An toàn trẻ em | Blocklist từ cấm, `access_tier` hợp lệ | Không |

Không cổng nào trong tám cổng có ca âm. Đó là dấu hiệu chung của mọi cổng xanh giả: không ai
từng chứng minh nó biết đỏ.

### 2.2 Con số trượt khi cổng nói thật

| Phép kiểm | Trượt / tổng | Thiếu gì nhiều nhất |
|---|---:|---|
| `content_pack` parse `content_contract` | **162 / 228** | `prompt` (157) · `items` (73) · `target_item` (34) |
| `difficulty_params` parse `difficulty_contract` | **170 / 228** | `hint_after_ms` (169) · `allow_retry` (169) |
| Band level thuộc band engine | **42 / 228** | 15 màn `GT-006` gắn band engine đang cấm |

Sáu engine MVP trượt **100 %** phép kiểm `content_pack`. Nghĩa là không phải vài bản ghi lỗi —
nghĩa là khuôn nội dung và khuôn contract chưa bao giờ khớp nhau, và không ai biết vì cổng
không nhìn.

42 level ngoài band thuộc [`Task #118`](118-band-violation-cleanup-plan.md); tách ra vì cách
sửa khác hẳn.

### 2.3 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
sed -n '129,143p' packages/db/src/seed-content/gates/runner.ts   # cổng 1 cho game level
sed -n '25,36p'  packages/db/src/seed-content/vocabulary.ts      # SLUG_REGEX fallback
pnpm --filter @mindkid/db seed:check
```

## 3. Quyết định phải chốt trước khi viết mã

### `Q117-1` (= `Q114-1`) — sửa nội dung hay sửa contract

162 bản ghi không parse. Hai đường, và chúng loại trừ nhau:

| Đường | Việc phải làm | Rủi ro |
|---|---|---|
| **A — sửa nội dung** | 162 version mới của `content_pack`, thêm `prompt`/`items`/`target_item` cho vừa contract hiện tại | Khối lượng soạn thảo lớn; cần người review nội dung |
| **B — sửa contract** | Nới `content_contract` của 6 engine MVP cho vừa nội dung đang có | Breaking change `BR-GTC-*`; và nó là **nới rule để mã hiện tại qua cổng** — thứ AGENTS.md xếp vào Cấm |

**Đề xuất: đường A**, kèm một ngoại lệ hẹp. Lý do: nội dung thiếu `prompt` nghĩa là màn chơi
không có câu hỏi đọc cho trẻ nghe. Đó không phải khác biệt hình thức giữa hai khuôn — đó là
nội dung thiếu thật. Nới contract để chấp nhận màn chơi không có câu hỏi là hợp thức hoá lỗ hổng.

Ngoại lệ hẹp cần người quyết riêng: `hint_after_ms` và `allow_retry` thiếu ở 169 bản ghi. Hai
trường này có mặc định hợp lý ở tầng engine. Nếu chúng đáng lẽ `optional` với mặc định thay vì
bắt buộc, thì đó là contract sai chứ không phải dữ liệu sai. Đo trước: đọc `difficulty_contract`
của một engine, xem hai trường có `.default()` không.

**Cấm — NEVER** `UPDATE` bản đã publish. Mọi cách sửa là INSERT version mới (`BR-CSA-01`).

## 4. Work package

### WP117.1 — Ca âm cho cả tám cổng

**Cỡ:** M · **File:** 1 test cộng 8 fixture · **Ranh giới PR:** `packages/db`

Làm **trước** mọi thay đổi logic. Lý do: nếu viết ca âm sau khi sửa cổng, không ai biết cổng cũ
có bắt được ca đó không, và ta mất mất cơ sở so sánh.

Mỗi cổng một fixture vi phạm ở `packages/db/tests/**/fixtures/`, chạy qua `runEightGates`, kỳ
vọng cổng tương ứng **đỏ**:

| Cổng | Fixture vi phạm |
|---:|---|
| 0 | Mã sai định dạng, và mã trùng trong cùng lô |
| 1 | `content_pack` là `{}` — **ca này sẽ XANH trên cổng hôm nay**; ghi lại làm bằng chứng |
| 2 | FK trỏ mã không tồn tại |
| 3 | Band ngoài tập hợp lệ |
| 4 | Hai bản ghi tiêu đề trùng khít |
| 5 | Tag `khong_co_trong_tu_vung` — **cũng sẽ XANH hôm nay** |
| 6 | Tiêu đề rỗng, khoảng trắng thừa |
| 7 | Từ trong blocklist, `access_tier` bịa |

Hai ca xanh sai ở cổng 1 và cổng 5 là **đầu ra chính** của WP này. Chúng là bằng chứng đo được
cho phần còn lại của task.

**Cấm — NEVER** viết mẫu vi phạm thẳng vào file test — `packages/` là thứ cổng khác đang quét.

### WP117.2 — Cổng 1 nạp contract thật

**Cỡ:** M · **File:** 2 · **Ranh giới PR:** `packages/db`

1. `checkGameLevelGate1` nạp `content_contract` và `difficulty_contract` từ registry engine
   theo `template_code` của bản ghi, gọi `.parse()`, gom `ZodError.issues` thành `GateIssue[]`
   (`BR-CSA-16`).
2. `template_code` không có trong registry → **đỏ**, mã lỗi `TEMPLATE_CODE_UNKNOWN`. Cấm bỏ qua.
3. Registry không nạp được → **đỏ**. Cấm trả danh sách rỗng rồi báo xanh.
4. Thông báo lỗi nêu đường dẫn trường Zod, không nêu cả object — người soạn cần biết thiếu
   trường nào.

**Cấm — NEVER** bật cổng này trên corpus thật trước khi WP117.4 xong. Trong khi chờ, cổng chạy
ở chế độ **báo cáo**: in danh sách trượt, thoát 0, và một test khẳng định con số trượt **đúng
bằng** con số đã chốt ở WP117.3. Con số đó chỉ được **giảm**.

### WP117.3 — Bỏ `SLUG_REGEX`, đóng cổng 5

**Cỡ:** S · **File:** 2 · **Ranh giới PR:** `packages/db`

1. Bỏ `return SLUG_REGEX.test(tag)` ở `vocabulary.ts:34`; hàm trả `false` khi tag không thuộc
   tập từ vựng của trục (`BR-TCM-01`).
2. Đo ngay: bao nhiêu bản ghi trượt sau khi bỏ dòng đó. Ghi con số vào todo.
3. Đổi tên cổng 5 từ `"Tagging"` thành `"Sư phạm"` và thêm bốn phép kiểm:
   - FK `skill_codes` về taxonomy;
   - FK `learning_objective_codes` về taxonomy;
   - `difficulty ∈ [1, 5]`;
   - band level thuộc band engine — chỉ **báo cáo** ở task này, [`Task #118`](118-band-violation-cleanup-plan.md) xử lý.
4. Ca âm cổng 5 ở WP117.1 chuyển từ xanh sai sang **đỏ**.

Trục `theme` **không** đóng ở đây — nó thuộc [`Task #119`](119-theme-registry-plan.md). Trục
`what` cũng chưa đóng; câu hỏi 3 mục 11 của
[`content-tagging.md`](../specs/01-platform/content-tagging.md) chưa có trả lời.

### WP117.4 — Đo theo engine và giao việc sửa

**Cỡ:** S · **chỉ sau khi `Q117-1` có quyết định** · **không sửa bản ghi nào**

Phạm vi đổi ngày 2026-08-29: việc **sửa** 162 bản ghi đã chuyển sang 27 task engine
`#130`–`#156` của [`Task #116`](116-engine-vertical-slices-plan.md), mỗi engine sửa phần của
mình ở `WPn.3`. Lý do: sửa `content_pack` đòi hiểu cơ chế engine, và nó thuộc cùng PR với
`render()` của engine đó.

Task #117 giữ ba việc:

1. Đo lại chính xác trường thiếu **theo từng engine**, không dùng con số tổng. Bảng này là đầu
   vào Preflight của 27 task engine.
2. Kiểm giả thuyết `hint_after_ms` / `allow_retry`: đọc `difficulty_contract` của
   `GT-001`…`GT-006`, xem hai trường có `.default()` không. Nếu có, đó là lỗi đọc contract chứ
   không phải dữ liệu thiếu — **sửa cổng ở đây**, không giao 169 bản ghi cho 27 task.
3. Giữ bậc thang: tổng số trượt chỉ được **giảm**. Mỗi task engine merge làm nó giảm một phần.

Về 0 → cổng 1 chuyển từ **báo cáo** sang **chặn**, xoá bậc thang. Việc lật đó thuộc task engine
cuối cùng, `#156`.

Nếu đường B: phạm vi task này đổi hẳn — nó thành task sửa spec, phải đi qua cổng người và sửa
`game-template-contract.md` **trước**, trong cùng PR. Viết lại plan này chứ không lách.

### WP117.5 — Đóng vòng

**Cỡ:** S

1. `pnpm --filter @mindkid/db seed:check` in số thật: `228 game level, 0 trượt contract`.
2. `BR-GTC-10` (round-trip toàn bộ level đã seed) lần đầu có nghĩa — chạy và ghi kết quả.
3. Ghi vào [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) mục
   cổng: tám cổng đều có ca âm, ngày đóng.

## 5. Điều kiện nghiệm thu

1. Tám cổng, mỗi cổng có **ít nhất một** ca âm; xoá logic của một cổng bất kỳ → test đỏ.
2. `content_pack` của **228 / 228** level parse được `content_contract` của engine tương ứng.
3. `difficulty_params` của **228 / 228** parse được, hoặc contract đã sửa đúng với lý do ghi rõ.
4. Tag ngoài từ vựng làm cổng 5 đỏ — `SLUG_REGEX` không còn trong `vocabulary.ts`.
5. `template_code` lạ làm cổng 1 đỏ.
6. Registry không nạp được làm cổng đỏ, không trả rỗng rồi xanh.
7. `pnpm --filter @mindkid/db test` xanh; danh sách `trạng-thái | tên-test` trùng khít trừ test mới.
8. Không bản ghi published nào bị `UPDATE` — mọi thay đổi là INSERT version mới.
9. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 6. Ranh giới

**Always**
- Ca âm trước, logic sau.
- Cổng chạy chế độ báo cáo với bậc thang trong lúc nợ chưa về 0.
- INSERT version mới cho mọi sửa nội dung.

**Ask first**
- Đường B của `Q117-1` — nới contract.
- Cho `hint_after_ms` / `allow_retry` thành `optional` có mặc định.

**Never**
- Bật cổng chặn trước khi có đường xử lý nợ.
- `UPDATE` bản ghi đã publish.
- Nới một rule chỉ để corpus hiện tại qua cổng.
- Trả danh sách rỗng rồi báo xanh khi nguồn không đọc được.
- Đóng trục `theme` ở task này — đó là Task #119.

## 7. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q117-1` | Sửa nội dung (A) hay sửa contract (B) cho 162 bản ghi | WP117.4, 27 task engine `#130`–`#156`, và Task #118 #122 #125 | Product + Backend |
| `Q117-2` | `hint_after_ms` và `allow_retry` đáng lẽ có mặc định? Đo `difficulty_contract` trước khi trả lời | 169 bản ghi | Backend |
| `Q117-3` | Trục `what` đóng về bộ giá trị nào — câu hỏi 3 mục 11 của [`content-tagging.md`](../specs/01-platform/content-tagging.md). Chưa trả lời thì cổng 5 chỉ đóng được trục `thinking` | Mức đóng của cổng 5 | Nội dung |
