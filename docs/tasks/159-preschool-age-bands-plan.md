# Task #159 — Spec và cổng: contract biên soạn theo band tuổi mầm non

> **Loại task:** spec + cổng (M) — một trong bốn task con của
> [`Task #157`](157-competency-allocation-program-plan.md).
> **Spec sở hữu:** `docs/specs/05-content/preschool-age-bands.md` — **viết mới**,
> `status: draft` → `implemented` ở cuối task.
> **Chặn bởi:**
> - [`Task #157`](157-competency-allocation-program-plan.md) — quyết định `D-SL`
> - [`Task #123`](123-lesson-flow-model-plan.md) — mô hình flow chốt trước
> - [`Task #118`](118-band-violation-cleanup-plan.md) — luật phân loại band

## 1. Trả lời ngắn

Yêu cầu ngày 2026-08-29: *"Tiết học phải sát với lộ trình mầm non theo độ tuổi."*

Hôm nay corpus có đúng **một** ràng buộc tuổi được cưỡng chế: `BR-ECD-13` — band của level phải
nằm trong band của engine. Nó chặn `GT-006` xuất hiện ở band `3-4`. Nó cấm — NEVER nói được gì
về việc một tiết cho trẻ 3 tuổi có **quá dài, quá khó, quá nhiều bước** hay không.

Đo được: `difficulty` 4 xuất hiện ở band `3-4`; 81 tiết dàn 19/26/36 trên ba band mà không có
trần thời lượng nào theo band.

Spec này ép **nội dung** khớp lứa. Nó cấm — NEVER khoá ghi danh: `D-SI` giữ nguyên, phụ huynh
vẫn mua gói rồi đăng ký flow bất kỳ, cầu giáo án vẫn **126** tiết.

Ranh giới đó là điều quan trọng nhất của task. Đảo `D-SI` đưa cầu lên 222 tiết và làm món nợ
nội dung nhảy từ 45 lên 141 tiết. Đó là quyết định sản phẩm, không phải hệ quả của một cổng.

## 2. Bằng chứng đã đo (2026-08-29)

| Số đo | Giá trị |
|---|---|
| Lesson `published` | 81 — band `3-4`: 19 · `4-5`: 26 · `5-6`: 36 |
| Level `published` | 228 |
| Ràng buộc tuổi đang được cưỡng chế | `BR-ECD-13` (band level ⊆ band engine) — và chỉ nó |
| Trần `difficulty` theo band | **không có** |
| Trần thời lượng tiết theo band | **không có** |
| Trần số bước chơi theo band | `BR-LTV-01` đòi đúng 2 bước, **không phân theo band** |
| Trần số vật trên màn theo band | có trong `limits` của từng engine, **không có luật chung theo lứa** |

### 2.1 Ca sai không bắt được bằng cổng hiện có

Một tiết band `3-4` với `estimated_minutes` = 25, hai bước chơi `difficulty` 4, mỗi bước 8 vật
trên màn. Mọi cổng xanh: band ⊆ band engine, đúng 2 bước, hai bước khác khuôn, có hoạt động
ngoài màn hình.

Sai vì trẻ 3 tuổi giữ chú ý có chủ đích khoảng 8–12 phút, và 8 vật vượt xa dung lượng trí nhớ
làm việc của lứa. Tiết đó không hỏng về cấu trúc — nó hỏng về lứa.

### 2.2 Lệnh tái dựng

```bash
cd mindkid
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/db seed:report
pnpm --filter @mindkid/db test -- lesson
```

## 3. Work package

### WP159.1 — Viết spec `PRESCHOOL-AGE-BANDS`

**Cỡ:** M · **Ranh giới PR:** `docs/specs/05-content/preschool-age-bands.md`

Khuôn 11 mục của [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §4. `depends_on` gồm
`LESSON-MODEL` · `LESSON-FLOW-MODEL` · `CURRICULUM-MODEL` · `GAME-LEVEL-MODEL` ·
`TAXONOMY-SERVICE`.

`owns` **một** dòng: ràng buộc biên soạn của nội dung theo band tuổi mầm non.

Mục 7 phải có bảng ba band, mỗi ô là một con số đo được:

| Ràng buộc | `3-4` | `4-5` | `5-6` |
|---|:--:|:--:|:--:|
| Trần `difficulty` của level | chốt ở `Q159-1` | | |
| Trần `estimated_minutes` của tiết | | | |
| Trần số bước chơi trong một tiết | | | |
| Trần `item_count` hiển thị cùng lúc | | | |
| Trần số tiêu chí phải giữ cùng lúc | | | |

Các con số này là **phán đoán sư phạm**, không suy ra được từ mã. Chúng phải do người sư phạm
chốt, kèm nguồn, trước khi cổng viết ra. Đó là `Q159-1`.

Mục 6 — `BR-PAR-*` phải phủ:

| ID | Rule phải nói gì |
|---|---|
| `BR-PAR-01` | Level và tiết vượt trần của band mình thì cổng đỏ |
| `BR-PAR-02` | Kỹ năng phải thuộc lớp tuổi của nó trong taxonomy (`age_min` · `age_max`) |
| `BR-PAR-03` | `age_min ≤ age_max`, cả hai trong [3, 6], và band ⊆ band engine — link `BR-ECD-13`, cấm chép |
| `BR-PAR-04` | Contract này ép **biên soạn**; cấm — NEVER dùng để chặn ghi danh theo tuổi |
| `BR-PAR-05` | Nguồn không đọc được thì dừng mã ≠ 0 |
| `BR-PAR-06` | Báo cáo in từng bản ghi lệch kèm trần bị vượt; cấm — NEVER phần trăm tổng |
| `BR-PAR-07` | Cổng có ca âm |

`BR-PAR-04` là rule giữ `D-SI`. Nó phải xuất hiện trong spec bằng chữ, và có một scenario
Gherkin khẳng định **không** route nào chặn ghi danh vì tuổi.

### WP159.2 — Cổng `check:age-band-fit`

**Cỡ:** M · **Ranh giới PR:** `packages/db/src/seed-content/gates/age-band-fit.ts`

1. Chạy trên 228 level **và** 81 tiết hiện có.
2. Với mỗi bản ghi, đối chiếu từng trần của band nó khai.
3. In danh sách lệch dạng `mã | band | trần bị vượt | giá trị hiện có`.
4. Nguồn hỏng → mã thoát ≠ 0.

Cổng chạy lần đầu **phải đỏ**. Nếu xanh ngay, hoặc trần đặt quá lỏng, hoặc cổng không đo.

### WP159.3 — Ba ca âm

**Cỡ:** S · **Ranh giới PR:** `packages/db/tests/gates/`

1. Hạ `age_min` của một tiết `5-6` xuống 3 → cổng **đỏ**.
2. Nâng `estimated_minutes` của một tiết `3-4` vượt trần → cổng **đỏ**.
3. Trỏ nguồn sang thư mục rỗng → cổng **đỏ**, cấm — NEVER "0 vi phạm".

Cộng thêm một **ca dương bắt buộc**: khẳng định không có rule nào trong spec này chặn ghi danh
theo tuổi (`BR-PAR-04`). Đây là ca duy nhất bảo vệ `D-SI` khỏi bị đảo nhầm.

### WP159.4 — Đo món nợ và đóng spec

**Cỡ:** S

1. Chạy cổng, ghi lại **số bản ghi lệch** trên 228 level và 81 tiết. Con số này là đầu vào của
   WP mới trong [`Task #124`](124-lesson-corpus-depth-plan.md).
2. Cấm — NEVER sửa nội dung trong task này. Sửa thuộc task của engine hoặc của giáo án.
3. Spec `status: draft` → `implemented`, ghi ngày.

## 4. Điều kiện nghiệm thu

1. Spec đủ 11 mục; bảng ba band có đủ con số, mỗi con số có nguồn.
2. Bảy `BR-PAR-*` mỗi rule kèm vì sao; mỗi rule ≥1 scenario Gherkin fail được.
3. `check:age-band-fit` chạy trên corpus hôm nay: **đỏ**, in danh sách lệch theo bản ghi.
4. Ba ca âm đều làm cổng đỏ, mỗi ca là một test.
5. Ca dương `BR-PAR-04` xanh: không rule nào chặn ghi danh theo tuổi.
6. Con số nợ (bản ghi lệch band) đã ghi và chuyển sang
   [`Task #124`](124-lesson-corpus-depth-plan.md).
7. `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.

## 5. Ranh giới

**Always**
- Trần nằm trong tệp cấu hình, không nằm trong mã.
- Mỗi con số trần có nguồn sư phạm ghi kèm.

**Ask first**
- Đổi bất kỳ con số trần nào sau khi đã duyệt.
- Thêm một chiều ràng buộc thứ sáu vào bảng.

**Never**
- Chặn ghi danh theo tuổi — đảo `D-SI` là quyết định sản phẩm riêng.
- Chép `BR-ECD-13` vào spec này; link tới nó.
- Sửa nội dung level hay tiết trong task này.
- Đặt trần lỏng tới mức cổng xanh ngay lần chạy đầu.

## 6. Câu hỏi mở

| # | Câu hỏi | Chặn gì | Chủ |
|---|---|---|---|
| `Q159-1` | Năm con số trần cho mỗi band là bao nhiêu, và lấy nguồn ở đâu? | WP159.1 | Sư phạm |
| `Q159-2` | Bản ghi lệch band hôm nay sửa bằng đổi band hay đổi nội dung? Hai đường có giá khác nhau | WP159.4 · [`#124`](124-lesson-corpus-depth-plan.md) | Nội dung |
