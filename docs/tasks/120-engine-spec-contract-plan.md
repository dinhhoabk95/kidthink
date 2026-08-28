# Task #120 — Phiếu engine thành spec đầy đủ: contract và cổng

> **Loại task:** contract + cổng (M) — thay nội dung cũ của #120 ("duyệt 27 phiếu một lượt"),
> theo yêu cầu ngày 2026-08-29: mỗi engine là **một spec**, định nghĩa chi tiết theo SDD trước
> khi lên plan.
> **Spec sở hữu:** [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md) — đóng,
> `status: draft` → `implemented` ở cuối task.
> **Chặn:** toàn bộ 27 task engine `#130`–`#156`. Khuôn phải chốt trước khi engine đầu tiên viết spec.

## 1. Trả lời ngắn

Hai mươi bảy file ở `docs/specs/01-platform/engines/` hôm nay là **phiếu**, không phải spec:

| | Phiếu hôm nay | Spec theo `CONVENTIONS.md` |
|---|---|---|
| Frontmatter | `sheet` · `engine` · `batch` · `status` · `reviewed` | `spec` · `title` · `area` · `status` · `mvp` · `phase` · `reviewed` · `owns` · `depends_on` |
| Mục | 11 mục riêng, tên khác corpus | 11 mục chuẩn, đúng thứ tự |
| Business rule | **Không có** `BR-*` riêng | Mục 6 bắt buộc, mỗi rule kèm lý do |
| Acceptance | Mục 8 văn xuôi | Mục 9 Gherkin, mỗi `BR-*` ≥1 scenario |
| `owns` | Không khai | Bắt buộc — thứ **chỉ** file này định nghĩa |

Hệ quả đo được: không rule nào thuộc sở hữu của một engine, nên khi `GT-006` xếp 5 bước cho trẻ
3 tuổi thì **không `BR-*` nào bị vi phạm** — chỉ có một dòng văn xuôi ở mục 7 của phiếu nói
rằng đó là sai. Văn xuôi không có cổng.

Task #120 chốt **khuôn** spec engine và dựng cổng kiểm khuôn. Nó **không** viết nội dung cho
27 spec — việc đó thuộc `WPn.1` của từng task engine.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Giá trị |
|---|---|
| File ở `engines/` | 27, `GT-001` … `GT-027`, cộng `index.md` sinh tự động |
| Độ dài | 110 – 130 dòng |
| Có đủ 11 mục hiện hành | 27 / 27 |
| Có mục 11 hợp đồng vẽ | 27 / 27 |
| Có `BR-*` riêng engine | **0 / 27** |
| Có Gherkin | **0 / 27** |
| Có `owns` / `depends_on` | **0 / 27** |
| Cổng đối chiếu phiếu ↔ registry | **Không có** |
| `status` | `draft` × 27 |

Nội dung hiện có **không bỏ đi**. Ánh xạ sang khuôn mới:

| Mục phiếu hôm nay | Đi về mục nào của spec |
|---|---|
| 1. Engine này dạy trẻ làm gì | 1. Objective |
| 2. Cơ chế và layout | 3. Entry points + 15. Trường trích |
| 3. Band tuổi và khả năng tiếp cận | 7. Data + 15. Trường trích |
| 4. Hình dạng `content_pack` | 7. Data |
| 5. Trục độ khó | 7. Data |
| 6. Ma trận seed mục tiêu | 13. Ma trận seed |
| 7. Ca sai không bắt được bằng schema | 14. Ca sai |
| 8. Acceptance criteria riêng | 9. Acceptance criteria (viết lại thành Gherkin) |
| 9. Boundaries | 10. Boundaries |
| 10. Câu hỏi còn mở | 11. Open questions |
| 11. Hợp đồng vẽ | 12. Hợp đồng vẽ |

Phần **phải viết mới** ở mỗi engine: frontmatter đầy đủ, mục 2 (Actors), mục 4 (Main flow), mục
5 (Alternative flows), **mục 6 (`BR-E<nnn>-*`)**, mục 8, mục 9 Gherkin, mục 16 (chiều sâu).

## 3. Work package

### WP120.1 — Chốt khuôn trong `engine-spec-sheet.md`

**Cỡ:** M · **Ranh giới PR:** `docs/specs/01-platform/engine-spec-sheet.md`

1. Mục 7 của spec đổi từ "hình dạng phiếu" sang **"hình dạng spec engine"**, theo mục 4 của
   [`Task #116`](116-engine-vertical-slices-plan.md).
2. Thêm rule mới, mỗi rule kèm lý do:

| Rule mới | Nội dung |
|---|---|
| `BR-ESS-11` (spec, không phải phiếu) | File engine là spec đủ khuôn `CONVENTIONS.md`, có `owns` và `depends_on` |
| `BR-ESS-12` (rule riêng engine) | Mục 6 có ≥1 `BR-E<nnn>-*`. Rule của engine cấm — NEVER trùng rule của spec lô |
| `BR-ESS-13` (Gherkin bắt buộc) | Mỗi `BR-E<nnn>-*` có ≥1 scenario ở mục 9 |
| `BR-ESS-14` (không sở hữu chồng) | `owns` của spec engine cấm chứa thứ mà spec lô hoặc `game-template-contract` đã sở hữu |

3. Giữ nguyên `BR-ESS-01` … `-10` — chúng vẫn đúng, chỉ đổi đối tượng từ phiếu sang spec.
4. Đánh số mã rule engine: `BR-E001-*` cho `GT-001` … `BR-E027-*` cho `GT-027`. Mã **bất biến**
   theo mục 7 của [`id-conventions.md`](../specs/00-foundation/id-conventions.md).
5. Đăng ký tiền tố `BR-E<nnn>-` vào
   [`business-rules.md`](../specs/00-foundation/business-rules.md) làm registry tra ngược.

**Cấm — NEVER** để một `BR-E<nnn>-*` nói lại điều mà `BR-GTC-*`, `BR-ERC-*`, hay `BR-ECD-*` đã
nói. Rule riêng engine chỉ nói thứ **chỉ đúng với engine đó**.

### WP120.2 — Khuôn mẫu và bộ sinh khung

**Cỡ:** S · **Ranh giới PR:** `packages/game-engine/scripts`

1. `docs/specs/01-platform/engines/TEMPLATE.md` — khuôn spec engine rỗng, 16 mục.
2. `scripts/create-template.ts` sinh khung spec theo khuôn này khi tạo engine mới (`BR-ESS-07`).
3. Khung sinh ra điền sẵn **mục 15** (trường trích từ registry) và **mục 16** (sáu số đo hiện
   tại) — hai mục duy nhất máy điền đúng được. Mọi mục còn lại để trống kèm dòng nhắc.

### WP120.3 — `check:engine-specs`

**Cỡ:** M · **File:** 2 cộng fixture · **Ranh giới PR:** `packages/game-engine`

Đổi tên `check:engine-sheets` → `check:engine-specs`. Phép kiểm:

| Phép kiểm | Rule |
|---|---|
| Song ánh mã ↔ spec | `BR-ESS-01` |
| Frontmatter đủ 9 trường, `owns` và `depends_on` không rỗng | `BR-ESS-11` |
| Trường trích ở mục 15 khớp registry, kèm nguồn dòng | `BR-ESS-02` |
| Spec không khai `content_contract` hay Zod schema | `BR-ESS-03` |
| Spec không khai `skill_id` / `competency_id` | `BR-ESS-04` |
| Mục 6 có ≥1 `BR-E<nnn>-*`, tiền tố khớp mã engine | `BR-ESS-12` |
| Mỗi `BR-E<nnn>-*` có ≥1 scenario ở mục 9 | `BR-ESS-13` |
| `owns` không chồng với spec lô | `BR-ESS-14` |
| Mục 13 ma trận có ô là **số** | `BR-ESS-05` |
| Mục 14 có ≥1 ca sai kèm lý do | `BR-ESS-06` |
| Mục 12 có slot, bảng bốn lớp, trạng thái thị giác | `BR-ESS-10` |
| `index.md` khớp bản sinh lại | `BR-ESS-08` |

**Ca âm bắt buộc** (`BR-ESS-09`), fixture ở `packages/game-engine/tests/gates/fixtures/`:
- xoá một spec engine → đỏ;
- đổi một giá trị `limits` ở mục 15 cho khác registry → đỏ;
- spec thiếu `owns` → đỏ;
- mục 6 rỗng → đỏ;
- một `BR-E<nnn>-*` không có scenario → đỏ;
- ô ma trận ghi chữ "đa dạng" → đỏ;
- `owns` khai lại thứ `game-template-contract` đã sở hữu → đỏ;
- sửa tay `index.md` → đỏ.

Cổng chạy **bậc thang**: `packages/game-engine/config/engine-spec-ready.json` liệt kê engine đã
nâng khuôn. Mỗi task engine thêm một dòng. Bậc cuối đủ 27 thì **xoá file** và cổng chuyển sang
luật thẳng.

**Cấm — NEVER** dựng cổng ở `packages/gates` — package đã xoá 2026-08-29. Cổng phạm vi một
workspace vào `packages/game-engine/tests/gates/`. Gốc repo từ `repoPath()`, không `process.cwd()`.

### WP120.4 — Đóng spec

**Cỡ:** S

`engine-spec-sheet.md` đổi `status: draft` → `implemented` khi cổng chạy và có đủ tám ca âm.
27 spec engine giữ `draft` — chúng lật ở task của mình.

## 4. Điều kiện nghiệm thu

1. `engine-spec-sheet.md` mô tả khuôn spec engine 16 mục, có `BR-ESS-11` … `-14`.
2. `docs/specs/01-platform/engines/TEMPLATE.md` tồn tại, 16 mục.
3. `create-template.ts` sinh khung spec, điền sẵn mục 15 và 16.
4. `check:engine-specs` chạy, bậc thang khởi đầu **rỗng**.
5. Tám ca âm đều đỏ vì đúng lý do.
6. Tiền tố `BR-E<nnn>-` đã đăng ký ở `business-rules.md`.
7. Ánh xạ 11 mục phiếu → 16 mục spec ghi trong `engine-spec-sheet.md`, để 27 task engine không
   phải tự suy.
8. `engine-spec-sheet.md` mang `status: implemented`; 27 spec engine vẫn `draft`.
9. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 5. Ranh giới

**Always**
- Giữ nguyên nội dung 27 phiếu; khuôn mới **bù** phần thiếu.
- Ca âm trước phép kiểm.
- Bậc thang tăng từng engine.

**Ask first**
- Bỏ một mục khỏi khuôn 16 mục.
- Đổi cách đánh mã `BR-E<nnn>-*`.

**Never**
- Viết nội dung cho 27 spec ở task này — đó là `WPn.1` của từng task engine.
- Dựng cổng ở `packages/gates`.
- Cho một `BR-E<nnn>-*` nói lại điều spec lô đã nói.
- Sửa tay `engines/index.md`.
- Lật `status` của spec engine nào ở task này.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q120-1` | Trường trích ghi nguồn dòng `đường-dẫn:số-dòng` — dòng dịch mỗi lần sửa registry. Cổng so theo số dòng, hay so theo giá trị và chỉ cảnh báo khi dòng lệch? | WP120.3 | Backend |
| `Q120-2` | Spec engine mang `phase` nào (`Q116-3`)? Nó vào frontmatter bắt buộc nên phải chốt trước WP120.1 | WP120.1 | Product |
| `Q120-3` | 27 spec engine nằm trong `docs/specs/01-platform/engines/` — chúng có được đếm vào con số "171 spec" ở [`index.md`](../specs/index.md) không? Hôm nay không. Đổi cách đếm là đổi mọi bảng tổng | `index.md` | Product |
