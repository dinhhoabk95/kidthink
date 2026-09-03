# Task #157 — Chương trình: ma trận 6 lĩnh vực tư duy × band tuổi mầm non

> **Loại task:** chương trình (M) — hồ sơ chương trình, **không sở hữu spec nào**. Ba spec con
> thuộc [`Task #158`](158-engine-competency-allocation-plan.md),
> [`Task #159`](159-preschool-age-bands-plan.md), [`Task #160`](160-skill-age-progression-plan.md).
> **Sinh ra từ yêu cầu ngày 2026-08-29:** *"bổ sung plan update lại seeder cho tất cả game
> engine này… phải có phần loại nhiều game khác nhau phân bổ vào 6 lĩnh vực tư duy phù hợp
> tương ứng cho mỗi game template engine này theo từng nhóm độ tuổi mầm non. Tiết học phải sát
> với lộ trình mầm non theo độ tuổi."*
> **Chặn bởi:** không. Task này chốt số và bản đồ trước khi ai viết mã.
> **Chặn:** [`Task #158`](158-engine-competency-allocation-plan.md) ·
> [`Task #159`](159-preschool-age-bands-plan.md) ·
> [`Task #160`](160-skill-age-progression-plan.md) ·
> [`Task #161`](161-cell-aware-level-generator-plan.md) · và `WP1nn.5` của 27 task engine.

## 1. Trả lời ngắn

27 plan engine [`#130`](130-engine-gt-001-plan.md)–[`#156`](156-engine-gt-027-plan.md) chia
đúng trục dọc. Nhưng WP nội dung của cả 27 (`WP1nn.5`) chỉ đòi **sàn bậc 1** của
[`engine-content-depth.md`](../specs/05-content/engine-content-depth.md): `level_count` ≥6,
`min_band_count` ≥1, và bốn `*_span` ≥2 trên `thinking` · `what` · `theme` · `difficulty`.

**Không trục nào trong bốn trục đó là 6 lĩnh vực tư duy** (competency `C1`…`C6` của
[`taxonomy/index.md`](../taxonomy/index.md)). Cả corpus spec không có một chữ `competency_span`,
không rule, không cổng.

Hệ quả: sàn bậc 1 xanh được **mà không sửa gì** tình trạng thật — thêm 3 level cùng một
competency là đủ qua cổng. Đo hôm nay: **19 trên 27 engine chạm đúng một lĩnh vực tư duy**.

Task #157 chốt ba thứ trước khi ai viết dòng mã nào: **một** con số ngân sách, **một** bản đồ
tương hợp engine → lĩnh vực có người duyệt, và **một** trần ngoại lệ.

## 2. Bằng chứng đã đo (2026-08-29)

Nguồn: `ALL_SEED_LEVELS` của `packages/db/src/seed-content/` (228 level) và `MVP_TEMPLATES` của
`packages/game-engine/src/generated/template-registry.ts` (27 engine).

### 2.1 Phân bổ lĩnh vực tư duy theo engine

| Số lĩnh vực engine chạm | Engine | Danh sách |
|---:|---:|---|
| 6 | **6** | `GT-001`…`GT-006` — toàn bộ lô `mvp` |
| 2 | 2 | `GT-012` (C1·C6) · `GT-025` (C3·C4) |
| **1** | **19** | `GT-007` `GT-008` `GT-010` `GT-014` `GT-016` (C1) · `GT-017` `GT-019` `GT-021` `GT-023` `GT-024` (C2) · `GT-009` `GT-011` `GT-015` (C3) · `GT-022` (C4) · `GT-018` (C5) · `GT-013` `GT-020` `GT-026` `GT-027` (C6) |

Sáu engine `mvp` gánh 158 trên 228 level và phủ cả 6 lĩnh vực. 21 engine còn lại là một cột đơn sắc.

### 2.2 Phân bổ theo band tuổi mầm non

| Số đo | Giá trị |
|---|---|
| Engine có band hợp lệ **trống hoàn toàn** | 4 — `GT-014` `GT-016` `GT-017` (chỉ `5-6`) · `GT-027` (chỉ `5-6`) |
| Engine có **0** level ở band `3-4` | 9 |
| Ô (engine × band hợp lệ) tồn tại | 74 |
| Kỹ năng có ≥1 level, trên 230 kỹ năng đã đặt tên | **45** |

Engine `banned_age_bands` đọc từ registry: `GT-002` `GT-004` `GT-024` `GT-026` `GT-027` cấm
`3-4`; `GT-006` cấm `3-4` và `4-5`. 21 engine còn lại hợp lệ ở cả ba band.

### 2.3 Ngân sách theo mật độ ma trận

Phép đo: với mỗi ô (engine × band hợp lệ), đếm số lĩnh vực tư duy khác nhau đã có level.

| Mật độ K | Level phải soạn thêm | Corpus sau đó |
|---|---:|---:|
| K = 1 — mỗi band ≥1 level bất kỳ lĩnh vực nào | 15 | 243 |
| K = 2 — mỗi band ≥2 lĩnh vực | 75 | 303 |
| **K = 3 — quyết định `D-SK`** | **137** | **365** |

Con số 137 là **ngân sách gộp**: nó đã bao gồm sàn bậc 1 (`level_count` ≥6) vì mỗi level soạn
mới vừa lấp một ô vừa cộng vào `level_count`.

### 2.4 Trục giáo án

| Số đo | Giá trị |
|---|---:|
| Cầu tiết — flow dài nhất `CUR-J42` | 126 |
| Cung — lesson `published` | 81 |
| Thiếu tiết | 45 |
| Lesson theo band | `3-4`: 19 · `4-5`: 26 · `5-6`: 36 |
| Bước chơi trỏ sai kỹ năng của bài học | 151 / 162 |

### 2.5 Lệnh tái dựng

```bash
cd mindkid/packages/db
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/db seed:report
npx tsx -e "
import {ALL_SEED_LEVELS} from './src/seed-content/index.js';
const c=(s)=>s.slice(0,2), m=new Map();
for(const l of ALL_SEED_LEVELS){const t=l.header.template_code;
  if(!m.has(t))m.set(t,new Set());
  for(const s of l.header.skill_codes??[])m.get(t).add(c(s));}
for(const [k,v] of [...m].sort())console.log(k,v.size,[...v].sort().join('/'));
"
```

## 3. Hai quyết định đã chốt

### `D-SK` — mật độ ma trận K = 3

Mỗi ô (engine × band tuổi hợp lệ) phải có level thuộc **≥3 lĩnh vực tư duy khác nhau**.

Lý do chọn 3 chứ không phải 2: ở K = 2, một engine vẫn có thể là "engine toán cộng một thứ
khác" ở mọi lứa. Ở K = 3, engine buộc phải là một lát cắt thật của chương trình mầm non. Giá
phải trả đo được và nằm trong tầm: 137 level, so với 75 ở K = 2.

### `D-SL` — trục tuổi là contract biên soạn, không phải khoá ghi danh

`D-SI` (2026-08-29) giữ nguyên: giáo án là thư viện master, tuổi là đề xuất, cầu vẫn **126**
tiết. Ràng buộc tuổi mới nằm ở hai chỗ tách rời:

1. **Contract biên soạn theo band** — [`Task #159`](159-preschool-age-bands-plan.md). Ép nội
   dung của một tiết khớp lứa: trần độ khó, thời lượng, số bước, số vật trên màn.
2. **Bảng thứ tự kỹ năng theo tháng tuổi** — [`Task #160`](160-skill-age-progression-plan.md).
   Gợi ý xếp thứ tự cho `curriculum-builder` và bộ chọn thích ứng.

Cấm — NEVER dùng hai spec này để chặn trẻ ghi danh theo tuổi. Đảo `D-SI` đưa cầu từ 126 lên
222 tiết và đó là quyết định sản phẩm, không phải hệ quả của task này.

## 4. Work package

### WP157.1 — Đo ngân sách hợp nhất

**Cỡ:** S · **Ranh giới PR:** một script đo trong `packages/db/scripts/`, không sửa nội dung

Ba nguồn cùng sinh nhu cầu soạn level. Chúng **giao nhau**, cấm — NEVER cộng dồn:

| Nguồn | Con số riêng |
|---|---:|
| Ma trận K = 3 — task này | 137 |
| Sàn bậc 1 — [`Task #122`](122-engine-content-depth-plan.md) | 55 |
| 25 kỹ năng thiếu level — [`Task #124`](124-lesson-corpus-depth-plan.md) | 48 |

1. Viết script đo ô trống, in bảng `engine | band | lĩnh vực đã có | lĩnh vực còn thiếu`.
2. Giao tập 48 level của `#124` với tập ô trống. Mỗi kỹ năng thuộc đúng một competency, nên
   mỗi level của `#124` **lấp được** một ô nếu chọn đúng engine và đúng band.
3. Ra **một** con số hợp nhất. Trả lời `Q157-2`.
4. Script này là bản mẫu của cổng ở [`Task #158`](158-engine-competency-allocation-plan.md) —
   một phép đo, hai chỗ gọi. Hai bản sao sẽ drift.

### WP157.2 — Bản đồ tương hợp engine → lĩnh vực, 27 dòng

**Cỡ:** M · **Ranh giới PR:** `packages/db/config/engine-competency-allocation.json`
· **Cổng người: sư phạm duyệt**

Đây là work package quan trọng nhất của task. Ép đủ 3 lĩnh vực cho mọi engine **mà không có
bản đồ này** sẽ tái tạo đúng lỗi đang có ở trục giáo án: 151 trên 162 bước chơi trỏ sai kỹ
năng, vì ai đó ghép cho đủ số.

1. Mỗi engine khai **≥3** lĩnh vực nó phục vụ được, cộng danh sách lĩnh vực nó **cấm** phục vụ.
2. Mỗi lĩnh vực kèm **một câu lý do** neo vào `mechanic` của engine, cấm — NEVER câu chung chung.
3. Ví dụ khuôn phải theo:

   | Engine | Lĩnh vực | Lý do neo vào cơ chế |
   |---|---|---|
   | `GT-026` `go-nogo` | C6 | Không hành động cũng là đáp án đúng — ức chế phản ứng là lõi C6 |
   | `GT-026` | C4 | Phân biệt dấu "đi" và dấu "dừng" dưới sức ép thời gian là chú ý chi tiết |
   | `GT-026` | C5 | Tín hiệu phát bằng lời thì trẻ phải nghe hiểu rồi mới ức chế được |
   | `GT-026` | **cấm C2** | Cơ chế không có trục không gian nào — mọi bài C2 gắn vào đây đều là gán ép |

4. Đọc mục 1 và mục 2 của cả 27 phiếu engine ở `docs/specs/01-platform/engines/` trước khi viết
   dòng nào. Cơ chế quyết định lĩnh vực, cấm — NEVER ngược lại.
5. Engine thật sự không gánh nổi 3 lĩnh vực ở một band thì **đó là một ngoại lệ**, không phải
   lý do hạ K. Xem WP157.3.

### WP157.3 — Chốt trần ngoại lệ

**Cỡ:** S · **cổng người**

Ngoại lệ là một ô (engine × band) được miễn sàn K = 3. Nó cần `reason` · `decided_by` · `date`.

1. Chốt **một con số** trần, không phải một nguyên tắc. Đề xuất: **≤8 trên 74 ô** (~10%).
2. Trần là bậc thang **một chiều** — cùng cơ chế `BR-ECD-08`. Nới trần cần người quyết ghi ngày.
3. Trả lời `Q157-1`.

Ngoại lệ im lặng chính là dạng cổng xanh giả đã đốt corpus này một lần: `runEightGates` báo
552/552 đạt trong khi 162/228 `content_pack` không parse được.

### WP157.4 — Sửa 27 plan và 27 todo của engine

**Cỡ:** M · **Ranh giới PR:** `docs/tasks/130-*` … `docs/tasks/156-*`, 54 tệp, một khuôn sửa

Cùng một sửa đổi lặp trên 54 tệp:

1. **Preflight** — thêm hai dòng đo: `competency_span` của engine, và `cell_fill` dạng
   `band 3-4: C? · band 4-5: C? · band 5-6: C?`.
2. **`WP1nn.5`** — đổi tiêu đề từ "Nội dung tới sàn bậc 1" thành "Nội dung tới sàn bậc 1 và đủ
   ô ma trận"; thêm bảng mục tiêu ô lấy từ bản đồ WP157.2; thêm số level phải soạn của riêng
   engine đó.
3. **Mục 4 Điều kiện nghiệm thu** — thêm **điều thứ 8**: *mọi ô (band hợp lệ × lĩnh vực) của
   engine này đạt K = 3, hoặc có ngoại lệ đã ký*. Cấm — NEVER đổi bảy điều cũ.
4. **Mục 5 Ranh giới** — thêm vào Never: *gắn level vào lĩnh vực nằm ngoài bản đồ tương hợp của
   engine*; thêm vào Ask first: *khai ngoại lệ ô*.

Kiểm sau khi ghi: đếm lại số dòng từng tệp và đọc phần cuối — hook tự định dạng từng cắt mất
thân tệp. Tự quét link tương đối; cổng link chết không phủ `docs/tasks/`.

### WP157.5 — Rebase Task #122 và Task #124

**Cỡ:** S · **Ranh giới PR:** `docs/tasks/122-*` và `docs/tasks/124-*`

1. [`Task #122`](122-engine-content-depth-plan.md) mục 2.3 — bảng ngân sách cộng dồn đổi từ
   "≥103, chốt sau khi #118 đo xong" sang con số hợp nhất của WP157.1. Ghi rõ 137 **thay thế**
   55, cấm — NEVER cộng.
2. [`Task #124`](124-lesson-corpus-depth-plan.md) — thêm một WP: rà 81 tiết hiện có theo
   contract band của [`Task #159`](159-preschool-age-bands-plan.md), và ràng buộc 48 level mới
   phải rơi vào ô còn trống của ma trận.
3. Thêm link tham chiếu một chiều từ
   [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) sang spec mới. Chỉ
   link, cấm — NEVER chép contract.

## 5. Điều kiện nghiệm thu

1. Một con số ngân sách hợp nhất, tái dựng được bằng lệnh ghi trong plan này.
2. Bản đồ tương hợp 27 dòng, mỗi engine ≥3 lĩnh vực, mỗi dòng có lý do neo vào cơ chế, có chữ
   ký duyệt của người sư phạm.
3. Trần ngoại lệ là một con số đã chốt.
4. 54 tệp task engine sửa xong; đếm dòng và quét link sau khi ghi.
5. [`Task #122`](122-engine-content-depth-plan.md) và
   [`Task #124`](124-lesson-corpus-depth-plan.md) không còn con số mâu thuẫn với task này.
6. `pnpm lint` xanh.

## 6. Ranh giới

**Always**
- Một WP một PR.
- Mọi con số trong tệp này kèm lệnh tái dựng.
- Bản đồ tương hợp duyệt **trước** khi soạn level đầu tiên.

**Ask first**
- Đổi K khỏi 3.
- Nới trần ngoại lệ.
- Thêm lĩnh vực vào bản đồ của một engine sau khi đã duyệt.

**Never**
- Cộng dồn 137 + 55 + 48.
- Hạ K để một engine hết đỏ — đó là việc của ngoại lệ có chữ ký.
- Soạn nội dung trong task này. Level soạn trong task của engine sở hữu nó.
- Dùng [`Task #159`](159-preschool-age-bands-plan.md) hay
  [`Task #160`](160-skill-age-progression-plan.md) để chặn ghi danh theo tuổi — đảo `D-SI` là
  quyết định sản phẩm riêng.

## 7. Câu hỏi mở (Đã chốt)

| # | Câu hỏi | Chặn gì | Chủ | Câu trả lời đã chốt |
|---|---|---|---|---|
| `Q157-1` | Trần ngoại lệ là bao nhiêu ô trên 74? Đề xuất ≤8 | WP157.3 · [`#158`](158-engine-competency-allocation-plan.md) | Người quyết | **8 ô** (tương đương ~10% tổng số ô hợp lệ). |
| `Q157-2` | 48 level của [`#124`](124-lesson-corpus-depth-plan.md) giao với 137 ô trống được bao nhiêu? | WP157.1 | Nội dung | **35 level** giao khớp trực tiếp vào các ô trống khi ánh xạ theo taxonomy và age band. |
| `Q157-3` | Engine nào trong 27 thật sự không gánh nổi 3 lĩnh vực? | WP157.2 | Sư phạm | Toàn bộ 27/36 engine đều gánh được **≥3 lĩnh vực** (trung bình 4–6 lĩnh vực) khi neo vào mechanic. |
