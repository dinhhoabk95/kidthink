# Task #158 — Spec và cổng: ma trận phân bổ lĩnh vực tư duy theo engine và band tuổi

> **Loại task:** spec + cổng (M) — một trong bốn task con của
> [`Task #157`](157-competency-allocation-program-plan.md).
> **Spec sở hữu:** `docs/specs/05-content/engine-competency-allocation.md` — **viết mới**,
> `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:**
> - [`Task #157`](157-competency-allocation-program-plan.md) — bản đồ tương hợp và trần ngoại lệ
> - [`Task #117`](117-seed-gate-truth-plan.md) — cổng parse `content_pack` nói thật
> - [`Task #119`](119-theme-registry-plan.md) — từ vựng `theme` đóng
> - [`Task #120`](120-engine-spec-contract-plan.md) — khuôn spec engine

## 1. Trả lời ngắn

[`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) sở hữu câu *"engine
này có đủ nội dung không"* và trả lời đúng. Nó cấm — NEVER trả lời được câu khác: *"trẻ ba
tuổi mở engine này ra thì gặp mấy kiểu tư duy khác nhau"*.

Sáu số đo của `BR-ECD` đo `thinking` · `what` · `theme` · `difficulty`. Không số nào đo
**competency** — 6 lĩnh vực tư duy `C1`…`C6` là bộ xương của
[`taxonomy/index.md`](../taxonomy/index.md), là thứ `BR-CRM-08` đòi chương trình theo tuổi phải
phủ đủ, và là thứ phụ huynh đọc thấy trên trang giới thiệu.

Spec này sở hữu **phân bổ**: engine nào phục vụ lĩnh vực nào, và mỗi ô (engine × band tuổi hợp
lệ) phải có bao nhiêu lĩnh vực khác nhau. Nó cộng thêm vào
[`engine-content-depth.md`](../specs/05-content/engine-content-depth.md), cấm — NEVER thay thế.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Giá trị |
|---|---:|
| Engine chạm đúng **1** lĩnh vực | **19 / 27** |
| Engine chạm 2 lĩnh vực | 2 / 27 |
| Engine chạm cả 6 | 6 / 27 — toàn bộ lô `mvp` |
| Ô (engine × band hợp lệ) | 74 |
| Ô đạt K = 3 hôm nay | 15 |
| Ô thiếu ở K = 3 | **137 lượt lấp** |
| Kỹ năng có ≥1 level, trên 230 | 45 |

### 2.1 Ca sai không bắt được bằng cổng hiện có

`GT-014` (`balance-scale`, cân hai bên) có 3 level, cả ba ở band `5-6`, cả ba gắn `C1.MEA.*`.
Corpus parse sạch. `thinking_span` = 1, nên **bậc 1 của `BR-ECD-03` đã bắt được** phần đó.

Nhưng thêm đúng 3 level `C1` nữa với ba giá trị `thinking` khác nhau là **đủ qua bậc 1**, và
engine vẫn là engine đo lường thuần tuý ở đúng một lứa. Trẻ 4 tuổi mở ra vẫn không có gì.

Đây là lý do spec cần trục riêng: `thinking_span` đo **quá trình**, `competency` đo **lĩnh
vực**. Hai engine có `thinking_span` = 4 vẫn có thể cùng nằm gọn trong C1.

### 2.2 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/db seed:report
grep -c '"engine"' packages/db/config/engine-competency-allocation.json
```

## 3. Work package

### WP158.1 — Viết spec `ENGINE-COMPETENCY-ALLOCATION`

**Cỡ:** M · **Ranh giới PR:** `docs/specs/05-content/engine-competency-allocation.md`

Khuôn 11 mục của [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §4. Frontmatter: `area: content`,
`mvp: false`, `phase: P4`, `owns` ba dòng, `depends_on` gồm `ENGINE-CONTENT-DEPTH` ·
`TAXONOMY-SERVICE` · `CONTENT-TAGGING` · `GAME-TEMPLATE-CONTRACT`.

`owns` phải là ba thứ **chỉ** spec này định nghĩa:

- Bản đồ tương hợp engine → lĩnh vực tư duy.
- Sàn K lĩnh vực trên mỗi ô (engine × band tuổi hợp lệ).
- Khuôn và trần ngoại lệ ô.

Cấm — NEVER `owns` chồng với `ENGINE-CONTENT-DEPTH`: sàn **số level** thuộc về file kia.

Mục 6 — `BR-ECA-*` phải phủ ít nhất chín rule:

| ID | Rule phải nói gì |
|---|---|
| `BR-ECA-01` | Bản đồ tương hợp là nguồn sự thật duy nhất; cấm suy ra lĩnh vực từ mã hay từ tag |
| `BR-ECA-02` | Mỗi ô (engine × band hợp lệ) có ≥ K lĩnh vực khác nhau; K đọc từ cấu hình |
| `BR-ECA-03` | Level gắn `skill_codes` thuộc lĩnh vực **ngoài** bản đồ của engine thì cổng đỏ |
| `BR-ECA-04` | Band bị `banned_age_bands` không tính vào sàn — cùng lập trường `BR-ECD-02` |
| `BR-ECA-05` | Ngoại lệ phải có `reason` · `decided_by` · `date`; thiếu một trường thì đỏ |
| `BR-ECA-06` | Cổng in **mọi** ngoại lệ ở mỗi lần chạy, kể cả khi xanh |
| `BR-ECA-07` | Trần ngoại lệ là bậc thang một chiều; nới cần người quyết ghi ngày |
| `BR-ECA-08` | Nguồn không đọc được thì dừng mã ≠ 0; cấm — NEVER nhánh trả rỗng rồi báo xanh |
| `BR-ECA-09` | Báo cáo in **ô nào thiếu lĩnh vực nào**; cấm — NEVER in tỉ lệ phần trăm tổng |

Mỗi rule kèm **vì sao**. Mục 9 — Gherkin, mỗi `BR-ECA-*` ít nhất một scenario fail được.

### WP158.2 — Cấu hình `engine-competency-allocation.json`

**Cỡ:** S · **Ranh giới PR:** `packages/db/config/engine-competency-allocation.json`

Ngoài mã nguồn, cùng lập trường `BR-TCM-11` (ngưỡng cấu hình được). Chứa:

1. `k` — mật độ đang bật. Giá trị khởi tạo **3** (`D-SK`).
2. `affinity` — 27 dòng của WP157.2: `engine` · `allows` · `forbids` · `reasons`.
3. `exceptions` — danh sách ô miễn, mỗi ô đủ bốn trường của `BR-ECA-05`.
4. `exception_cap` — trần đã chốt ở WP157.3.

Tệp này là đầu ra đã duyệt của [`Task #157`](157-competency-allocation-program-plan.md); task
này chỉ **chuyển thể** nó sang JSON và thêm schema kiểm.

### WP158.3 — Cổng `check:engine-allocation`

**Cỡ:** M · **Ranh giới PR:** `packages/db/src/seed-content/gates/allocation.ts` +
một dòng script trong `packages/db/package.json`

1. Đọc corpus seed và registry engine. Nguồn hỏng thì dừng mã ≠ 0 (`BR-ECA-08`).
2. Nhóm level `published` theo `template_code`, rồi theo band, rồi theo competency suy từ
   tiền tố `skill_codes`.
3. So từng ô với `k`, trừ ô có ngoại lệ hợp lệ.
4. In mọi ngoại lệ (`BR-ECA-06`), rồi in ô thiếu theo dạng:

   ```
   check:engine-allocation  K=3
     27 engine, 74 ô, 15 đạt, 59 thủng
     GT-014  band 4-5  có: —            thiếu 3  (bản đồ cho phép C1 · C3 · C4)
     GT-014  band 5-6  có: C1           thiếu 2  (bản đồ cho phép C3 · C4)
     ngoại lệ đang bật: 0 / 8
     exit 1
   ```

5. Phép đo dùng chung với [`Task #161`](161-cell-aware-level-generator-plan.md) — xuất một hàm,
   hai chỗ gọi. Hai bản sao sẽ drift.

**Cấm — NEVER** viết cổng chỉ đếm số hàng qua được. `runEightGates` báo 552/552 đạt trong khi
162/228 `content_pack` không parse được, vì `checkGameLevelGate1` chỉ kiểm
`typeof content_pack === "object"`. Thân hàm phải làm đúng việc mục 4 của spec mô tả.

### WP158.4 — Ba ca âm

**Cỡ:** S · **Ranh giới PR:** `packages/db/tests/gates/`

Cổng không có ca âm là cổng không biết mình hỏng.

1. Đổi `skill_codes` của một level đang giữ ô duy nhất → cổng **đỏ**.
2. Thêm ngoại lệ thiếu `reason` → cổng **đỏ**.
3. Trỏ đường dẫn corpus sang thư mục rỗng → cổng **đỏ**, cấm — NEVER in "0 vi phạm".

Thêm ca âm thứ tư nếu chốt được `Q158-1`: level gắn hai kỹ năng khác lĩnh vực.

### WP158.5 — Đóng spec

**Cỡ:** S

1. Chạy cổng trên corpus hôm nay: phải **đỏ**, và số ô thiếu phải khớp con số của WP157.1.
   Cổng xanh ngay từ lần chạy đầu là cổng không đo gì.
2. Đưa `check:engine-allocation` vào chuỗi cổng trước merge.
3. Spec `status: draft` → `implemented`, ghi ngày.

## 4. Điều kiện nghiệm thu

1. Spec đủ 11 mục; chín `BR-ECA-*` mỗi rule kèm vì sao; mỗi rule ≥1 scenario Gherkin.
2. `engine-competency-allocation.json` có 27 dòng `affinity`, mỗi dòng ≥3 lĩnh vực và có `reasons`.
3. `check:engine-allocation` chạy trên corpus hôm nay: **đỏ**, số ô thiếu khớp WP157.1.
4. Báo cáo in đúng dạng ô-thiếu-lĩnh-vực-nào, không phần trăm.
5. Ba ca âm đều làm cổng đỏ; mỗi ca có test.
6. Ngoại lệ được in ở mọi lần chạy, kể cả khi cổng xanh.
7. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh; danh sách `trạng-thái | tên-test` trùng
   khít trừ test mới.

## 5. Ranh giới

**Always**
- Một WP một PR.
- Phép đo ô trống xuất ra một hàm, dùng chung với [`Task #161`](161-cell-aware-level-generator-plan.md).
- Ngưỡng nằm trong tệp cấu hình, không nằm trong mã.

**Ask first**
- Đổi `k`.
- Nới `exception_cap`.
- Thêm rule `BR-ECA-*` thứ mười.

**Never**
- Sửa [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md) ngoài việc thêm
  một link.
- Chép `BR-ECD-*` vào spec mới.
- Soạn hay sửa level trong task này.
- Cho cổng xanh khi nguồn không đọc được.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q158-1` | Level gắn hai kỹ năng khác lĩnh vực thì tính cho **cả hai** ô hay ô đầu tiên? Ảnh hưởng trực tiếp con số 137 | WP158.3 | Sư phạm + Nội dung |
| `Q158-2` | Level `draft` có tính vào ô không? `BR-ECD-03` và `BR-LCD-03` đều chỉ đếm `published` — spec này nên theo, nhưng phải ghi rõ | WP158.1 | Nội dung |
