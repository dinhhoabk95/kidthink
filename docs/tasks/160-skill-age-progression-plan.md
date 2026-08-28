# Task #160 — Spec và cổng: bảng thứ tự kỹ năng theo tháng tuổi

> **Loại task:** spec + cổng (M) — một trong bốn task con của
> [`Task #157`](157-competency-allocation-program-plan.md).
> **Spec sở hữu:** `docs/specs/05-content/skill-age-progression.md` — **viết mới**,
> `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:**
> - [`Task #157`](157-competency-allocation-program-plan.md) — quyết định `D-SL`
> - [`Task #123`](123-lesson-flow-model-plan.md) — mô hình flow
> - [`Task #124`](124-lesson-corpus-depth-plan.md) — danh sách 45 tiết còn thiếu

## 1. Trả lời ngắn

[`Task #159`](159-preschool-age-bands-plan.md) trả lời *"tiết này có hợp lứa không"*. Nó cấm —
NEVER trả lời được câu tiếp theo: *"tiết này nằm đúng chỗ nào trên lộ trình của lứa đó"*.

`BR-CRM-01` đòi kỹ năng xuất hiện sau mọi prerequisite của nó, và sau `D-SI` nó là **ràng buộc
sư phạm duy nhất còn lại** của lộ trình. Nhưng `skill_prerequisites` chỉ nói *cái nào trước cái
nào*, không nói *khoảng tuổi nào*. Một DAG hợp lệ vẫn xếp được kỹ năng của trẻ 5 tuổi vào tuần
hai của flow mà trẻ 3 tuổi đang chơi.

Spec này sở hữu bảng thứ tự **36–48m · 48–60m · 60–72m** cho kỹ năng trong taxonomy. Nó là
**gợi ý xếp thứ tự** cho `curriculum-builder` và bộ chọn thích ứng, cấm — NEVER là điều kiện
chặn trẻ.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Giá trị |
|---|---:|
| Kỹ năng đã đặt tên trong taxonomy | 230 |
| Kỹ năng có ≥1 game level | **45** |
| Kỹ năng có trong thư viện giáo án | 40 |
| Kỹ năng của thư viện giáo án có **0** level | 23 |
| Bước chơi trỏ sai kỹ năng của bài học | **151 / 162** |
| Bảng thứ tự theo tháng tuổi | **chưa tồn tại** |

Sáu tệp `docs/taxonomy/c1-*.md` … `c6-*.md` đã có cột tuổi cho từng kỹ năng
(`age_min` · `age_max` ∈ [3, 6]). Chúng cho **khoảng năm**, không cho **thứ tự trong khoảng**.
Hai kỹ năng cùng khai `4-5` không nói được cái nào dạy trước.

### 2.1 Ca sai không bắt được bằng cổng hiện có

Flow `CUR-J42` xếp `C1.CNT.01` (đếm tới 5) ở tuần 3 và `C1.CNT.02` (đếm tới 10) ở tuần 4. Hợp
lệ với `BR-CRM-01` vì prerequisite đúng thứ tự. Nhưng cả hai đều khai `3-4`, nên bộ chọn không
biết tuần 3 và tuần 4 có phải là khoảng cách đúng hay không — hay `C1.CNT.02` lẽ ra phải cách
sáu tuần.

`BR-CRM-03` đòi ôn lại trong 2–3 tuần; nó đo **khoảng cách ôn**, không đo **độ dốc giới thiệu**.

### 2.2 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
grep -c '^| `C[1-6]\.' docs/taxonomy/c*.md
pnpm --filter @mindkid/db seed:report
```

## 3. Work package

### WP160.1 — Chốt nguồn của bảng

**Cỡ:** S · **cổng người, không viết mã** · trả lời `Q160-1`

Ba đường, chọn một, ghi lý do:

| Đường | Ưu | Nhược |
|---|---|---|
| Chương trình Giáo dục mầm non hiện hành | Chuẩn được công nhận, phụ huynh và giáo viên đọc hiểu | Chia theo lĩnh vực giáo dục, không khớp 1-1 với sáu competency của corpus |
| Corpus Montessori đang có (`docs/montessori/`) | Đã ở trong repo, đã có ba giai đoạn Khởi đầu · Khám phá · Phát triển | Phủ chưa hết 230 kỹ năng; nghiêng về C1 và C2 |
| Soạn mới từ `age_min` · `age_max` của taxonomy | Phủ 100% kỹ năng ngay | Là suy diễn từ dữ liệu đã có, không thêm thông tin sư phạm nào |

**Đề xuất: Chương trình GDMN làm khung, corpus Montessori làm chi tiết trong khung.** Đường
thứ ba một mình chỉ đổi định dạng của thứ đã biết.

### WP160.2 — Viết spec `SKILL-AGE-PROGRESSION`

**Cỡ:** M · **Ranh giới PR:** `docs/specs/05-content/skill-age-progression.md`

Khuôn 11 mục. `owns` **một** dòng: thứ tự giới thiệu kỹ năng theo tháng tuổi.
`depends_on`: `TAXONOMY-SERVICE` · `CURRICULUM-MODEL` · `LESSON-FLOW-MODEL` ·
`PRESCHOOL-AGE-BANDS`.

Mục 6 — `BR-SAP-*`:

| ID | Rule phải nói gì |
|---|---|
| `BR-SAP-01` | Mỗi kỹ năng có ≥1 lát tuổi trong {36–48m, 48–60m, 60–72m} và một thứ hạng trong lát |
| `BR-SAP-02` | Thứ hạng phải tương thích `skill_prerequisites` — prerequisite xếp trước, cùng lát hoặc lát sớm hơn |
| `BR-SAP-03` | Bảng là **gợi ý xếp thứ tự**; cấm — NEVER dùng để chặn trẻ mở nội dung |
| `BR-SAP-04` | Kỹ năng có level hoặc có tiết mà thiếu dòng trong bảng thì cổng đỏ |
| `BR-SAP-05` | Bảng tương thích `BR-CRM-02` — flow xếp theo bảng vẫn chạm 2–4 competency mỗi tuần |
| `BR-SAP-06` | Nguồn không đọc được thì dừng mã ≠ 0 |
| `BR-SAP-07` | Cổng có ca âm |

`BR-SAP-03` là rule giữ `D-SI`, cùng vai trò `BR-PAR-04` ở
[`Task #159`](159-preschool-age-bands-plan.md).

### WP160.3 — Bảng dữ liệu

**Cỡ:** M · **Ranh giới PR:** `packages/db/config/skill-age-progression.json`

1. Phủ **100%** kỹ năng đang có level hoặc có tiết — 45 ∪ 40, đo lại lúc chạy.
2. Kỹ năng còn lại của 230 phủ dần, không chặn task này.
3. Mỗi dòng: `skill_code` · `age_slice` · `rank_in_slice` · `source`.
4. `source` bắt buộc — dòng không có nguồn là dòng đoán.

### WP160.4 — Cổng `check:skill-progression`

**Cỡ:** M · **Ranh giới PR:** `packages/db/src/seed-content/gates/skill-progression.ts`

1. Kỹ năng có level hoặc tiết mà thiếu dòng → đỏ (`BR-SAP-04`).
2. Thứ hạng vi phạm `skill_prerequisites` → đỏ (`BR-SAP-02`).
3. Với mỗi flow `published`, kiểm thứ tự tiết so với bảng; lệch thì **cảnh báo**, không chặn —
   bảng là gợi ý (`BR-SAP-03`).
4. Nguồn hỏng → mã thoát ≠ 0.

Ranh giới đỏ / cảnh báo ở đây là ranh giới của cả spec. Kiểm 1 và 2 là **tính nhất quán của
bảng** nên chặn được. Kiểm 3 là **lựa chọn biên soạn** nên chỉ cảnh báo.

### WP160.5 — Ba ca âm và đóng spec

**Cỡ:** S

1. Đảo hai dòng liền kề vi phạm prerequisite → cổng **đỏ**.
2. Xoá dòng của một kỹ năng đang có level → cổng **đỏ**.
3. Trỏ nguồn sang thư mục rỗng → cổng **đỏ**, cấm — NEVER "0 vi phạm".
4. Ca dương: flow xếp lệch bảng chỉ **cảnh báo**, mã thoát 0.
5. Spec `status: draft` → `implemented`, ghi ngày.

## 4. Điều kiện nghiệm thu

1. `Q160-1` đã trả lời, nguồn của bảng ghi trong spec.
2. Spec đủ 11 mục; bảy `BR-SAP-*` mỗi rule kèm vì sao; mỗi rule ≥1 scenario Gherkin.
3. `skill-age-progression.json` phủ 100% kỹ năng đang có level hoặc tiết; mỗi dòng có `source`.
4. `check:skill-progression` chạy được; kiểm 1 và 2 chặn, kiểm 3 chỉ cảnh báo.
5. Ba ca âm đều làm cổng đỏ; ca dương cảnh báo với mã thoát 0.
6. `BR-SAP-03` có scenario khẳng định bảng không chặn trẻ mở nội dung.
7. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 5. Ranh giới

**Always**
- Mỗi dòng bảng có `source`.
- Kiểm tính nhất quán thì chặn; kiểm lựa chọn biên soạn thì cảnh báo.

**Ask first**
- Đổi ba lát tuổi 36–48m · 48–60m · 60–72m thành cách chia khác.
- Nâng kiểm 3 từ cảnh báo lên chặn.

**Never**
- Dùng bảng để chặn trẻ mở nội dung — đảo `D-SI` là quyết định sản phẩm riêng.
- Chép `BR-CRM-*` vào spec này; link tới chúng.
- Sinh bảng bằng máy từ `age_min` · `age_max` rồi gọi đó là nguồn sư phạm.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q160-1` | Bảng lấy nguồn từ đâu — Chương trình GDMN, corpus Montessori, hay soạn mới? | WP160.1 | Sư phạm + Người quyết |
| `Q160-2` | Kỹ năng trải hai lát tuổi thì khai hai dòng hay một dòng có khoảng? | WP160.3 | Sư phạm |
| `Q160-3` | Bộ chọn thích ứng ở [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) đọc bảng này ở bước nào? | sau khi đóng spec | Backend |
