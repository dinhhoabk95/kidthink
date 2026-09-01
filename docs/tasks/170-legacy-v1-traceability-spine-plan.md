# Kế hoạch — Task #170: Xương truy vết v1 — registry 60, `legacy_v1_ref`, cổng phủ

> **Loại task:** hạ tầng đo (L) — task con thứ hai của
> [`Task #168`](168-v1-game-list-integration-plan.md), đợt 1.
> **Chặn:** toàn bộ đợt 2, 3, 4. Không có xương này thì "đã tích hợp 60/60" là câu nói, không phải số.
> **Chặn bởi:** [`Task #169`](169-mechanic-vocabulary-enforcement-plan.md).
> **Spec sở hữu:** viết mới `docs/specs/08-quality/legacy-v1-coverage.md`, `status: draft`.
> **Nguồn:** [`../taxonomy/game-type-migration.md`](../taxonomy/game-type-migration.md) — 60 hàng, đã có sẵn trong repo.

## 1. Trả lời ngắn

Grep `LEGACY_GAME_TYPE_MAP`, `legacy_id`, `D1-01`, `C1-01` trên `packages/shared/src`,
`packages/db/src/schema`, `packages/game-engine/src` → **0 kết quả**. `ContentSeedHeader` có 18
trường, không trường nào ghi game type v1 mà một level kế thừa.

Nghĩa là hôm nay câu *"đã tích hợp toàn bộ game cũ chưa"* **cấm — NEVER kiểm chứng được**. Task này
dựng ba thứ để nó kiểm chứng được: một registry, một trường dữ liệu, một cổng.

Có tiền lệ đúng ngay trong file cần sửa. `montessori_ref?: string` được thêm vào header vì
`tests/gates/montessori-corpus.ts` từng đếm bằng cách quét comment, rồi một codemod xoá comment và
cổng tụt 24 → 14 trong khi nội dung không mất gì. Ghi chú trong mã nói thẳng: *"con số có cổng canh
thì phải là dữ liệu"*. `legacy_v1_ref` đi theo đúng khuôn đó.

## 2. Bốn phần

### 2.1 Registry 60 game type v1

`packages/shared/src/constants/legacy-v1-game-types.ts` — 60 hàng, mỗi hàng:

```ts
{ legacy_id: "D1-01", competency_id: "C1-01", name_vi: "Đếm & Kéo vào Rổ",
  template_code: "GT-003", primary_skills: ["C1.CNT.01"] }
```

`template_code` lấy từ ánh xạ ở mục 4.1 của [spec chương trình](168-v1-game-list-integration-spec.md).
9 game type trỏ tới khuôn chưa tồn tại (`GT-028`..`GT-036`) — hợp lệ, và chính là thứ cổng dùng để
biết còn thiếu gì.

Property test: **song ánh** 60 `legacy_id` ↔ 60 `competency_id`, không trùng, không thiếu, mọi
`legacy_id` khớp `^D[1-6]-\d{2}$`, mọi `competency_id` khớp `^C[1-6]-\d{2}$`.

### 2.2 Trường `legacy_v1_ref`

`packages/db/src/seed-content/types.ts` — thêm vào `ContentSeedHeader`:

```ts
/** Mã game type v1 mà level này kế thừa dạng bài, ví dụ `D1-01`. Xem Task #168. */
legacy_v1_ref?: string;
```

Cổng seed ép: giá trị phải thuộc 60 mã của registry. Một mã lạ là lỗi, cấm — NEVER bỏ qua im lặng —
đây đúng là chỗ [`SearchParamsSchema`](../specs/01-platform/content-search.md) từng sai vì thiếu `.strict()`.

Cột DB: quyết ở bước thi công. Nếu `game_levels` chưa có chỗ, dùng cột `legacy_v1_ref text` mới
kèm migration; cấm — NEVER nhét vào `content_pack`, vì cổng phải đọc được nó mà không parse pack.

### 2.3 Cổng phủ v1 với bậc thang

`packages/db/src/seed-content/gates/legacy-v1-coverage.ts` + CLI
`pnpm --filter @mindkid/db check:legacy-v1`.

Cổng đếm, với mỗi mã trong 60: số level `published` mang `legacy_v1_ref` **và đã qua
`content_contract`** của khuôn. Cấm — NEVER đếm hàng chỉ vì có nhãn.

Ngưỡng ở `packages/db/config/legacy-v1-coverage.json`, cùng khuôn bậc thang với `engine-depth.json`:

| Bậc | `min_levels_per_type` | `min_types_covered` | Bật ở |
|---:|---:|---:|---|
| 0 | 1 | audit đo được | `#170` |
| 1 | 10 | 51 | chốt kiểm 2 |
| 2 | 10 | 57 | chốt kiểm 3 |
| 3 | 10 | **60** | chốt kiểm 4 |

Bậc 0 đặt `min_types_covered` bằng đúng số audit đo được, để cổng đỏ ngay khi ai đó làm tụt.
Cấm — NEVER đặt bằng 0 cho tiện.

### 2.4 Audit 250 level hiện có

Với mỗi level trong `ALL_SEED_LEVELS`, quyết định nó có kế thừa một game type v1 không.

Quy tắc: chỉ gắn khi **dạng bài** khớp, không phải khi khuôn khớp. `GT-003` có 8 game type v1 ánh
xạ tới; một level `GT-003` phân loại theo màu là `D4-01`, phân loại theo hình là `D4-02` — hai mã
khác nhau. Không xác định được thì **để trống**, và nó tính là chưa phủ.

Đầu ra: `docs/tasks/170-legacy-audit-report.md` — bảng 60 hàng, mỗi hàng ghi số level đã gắn và lý
do nếu 0. **Số ở bảng này quyết định kích thước sáu task đợt 2**, nên nó là sản phẩm chính của task.

## 3. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Registry sinh **tay một lần** từ bảng migration rồi khoá bằng property test | Bảng migration là markdown; parse markdown lúc chạy là thêm một chỗ vỡ |
| D2 | `legacy_v1_ref` là trường header, cấm — NEVER nằm trong `content_pack` | Cổng phải đọc được mà không parse pack — 162/228 level từng không parse được |
| D3 | Cổng đếm level **đã qua contract**, không đếm nhãn | Đếm nhãn là cổng xanh giả ngay từ ngày đầu |
| D4 | Bậc 0 đặt bằng số audit thật, không đặt 0 | Bậc thang chỉ có nghĩa khi nó đỏ được lúc tụt |
| D5 | Không xác định được thì để trống | Gắn cho đủ số là tự bịa dữ liệu cho cổng của chính mình |

## 4. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | Registry đủ 60 hàng, property test song ánh xanh | `pnpm --filter @mindkid/shared test` |
| 2 | `legacy_v1_ref` chỉ nhận 1 trong 60 mã | cổng seed, **ca âm:** mã `D9-99` → đỏ |
| 3 | Cổng phủ v1 chạy được, in số thật | `pnpm --filter @mindkid/db check:legacy-v1` |
| 4 | **Ca âm:** gỡ `legacy_v1_ref` của một level đã tính → cổng đỏ | chạy tay |
| 5 | **Ca âm:** level có nhãn nhưng hỏng `content_contract` → **không** được tính | chạy tay |
| 6 | Báo cáo audit đủ 60 hàng, hàng 0 level có lý do | đọc `170-legacy-audit-report.md` |
| 7 | Spec `legacy-v1-coverage.md` đủ 11 mục, `status: draft` | đọc |
| 8 | `pnpm check` xanh | — |

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Audit gắn bừa cho đủ số | Cao | Báo cáo ghi lý do từng hàng; reviewer đối chiếu mẫu ngẫu nhiên 10 level |
| Cổng đếm nhãn thay vì đếm nội dung | Cao | Nghiệm thu 5 là ca âm bắt buộc |
| Migration DB cho cột mới đụng `0000` | Trung bình | Migration mới, cấm — NEVER regenerate `0000` — nó xoá 3 dòng `CREATE EXTENSION` viết tay |
| Bảng migration markdown và registry drift | Trung bình | Property test đối chiếu **số hàng**; đổi bảng mà quên registry thì test đỏ |
