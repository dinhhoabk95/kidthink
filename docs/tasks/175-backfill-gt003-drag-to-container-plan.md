# Kế hoạch — Task #175: Backfill `GT-003` — 8 game type v1, 80 level

> **Loại task:** backfill nội dung (L) — đợt 2 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** 8 game type v1 trên `GT-003` kéo vào đích, **80 level** mang `legacy_v1_ref`.
> **Chặn bởi:** chốt kiểm 1 — [`#170`](170-legacy-v1-traceability-spine-plan.md) · [`#171`](171-solver-backed-generators-plan.md) · [`#172`](172-geometry-checked-generators-plan.md) · [`#173`](173-generator-theme-axis-expansion-plan.md) · [`#174`](174-engine-depth-step-1-plan.md).
> **Chạy song song được với** năm task backfill còn lại của đợt 2.
> **Spec sở hữu:** `docs/specs/08-quality/legacy-v1-coverage.md` (viết ở `#170`) · [`game-level-model.md`](../specs/05-content/game-level-model.md).

## 1. Đích

`GT-003` là engine gánh nhiều game type v1 nhất: **8 trên 51**. Sáu trong tám đến từ `D4`
(phân loại), nên rủi ro lớn nhất của task này là 80 level cùng một dạng "kéo vật vào rổ" chỉ khác
nhãn. Trục phân biệt phải là **thuộc tính phân loại**, không phải chủ đề.

| Game type v1 | Tên | Kỹ năng chính | Nguồn v1 | Thuộc tính phân loại |
|---|---|---|---|---|
| `D1-01` | Đếm & Kéo vào Rổ | `C1.CNT.01` | `NumberSenseSession` | số lượng |
| `D1-04` | Nhận diện Chữ số | `C1.NREC.02` | `NumberRecognitionSession` | chữ số |
| `D2-05` | Phân loại Hình | `C3.CLS.02` · `C2.GEO.04` | `Shapes3DSession` | hình dạng |
| `D4-01` | Phân nhóm theo Màu | `C3.CLS.01` | `ClassificationSession` | màu |
| `D4-02` | Phân nhóm theo Hình | `C3.CLS.02` | `ClassificationSession` | hình |
| `D4-03` | Phân nhóm theo Kích thước | `C3.CLS.03` | `ClassificationSession` | kích thước |
| `D4-04` | Phân nhóm Đa thuộc tính | `C3.CLS.06` | `ClassificationSession` | hai thuộc tính cùng lúc |
| `D4-08` | Phân loại Đời thực | `C3.CLS.04` | `ClassificationSession` | công dụng |

80 level trên một engine, trần `engine_max_ratio` 0,5 nghĩa là **không chủ đề nào quá 40 level** —
task này bắt buộc dùng ≥4 chủ đề.

## 2. Cách làm — một work package cho một game type v1

1. Đọc lớp `Session` gốc trong `tinimath/packages/game-engine/src/handlers/` để lấy **dạng bài**:
   trẻ nhìn thấy gì, làm gì, cái gì làm bài khó lên. Cấm — NEVER copy mã, cấm — NEVER nhập `config_params`.
2. Sinh 10 level: `pnpm --filter @mindkid/db gen:levels --engine=<GT> --theme=<chủ đề> --band=<band> --count=<n> --seed=175`.
3. Trải: ≥3 chủ đề khác nhau, mọi band hợp lệ của khuôn, ≥2 mức `difficulty`.
4. Gắn `legacy_v1_ref` đúng mã v1 vào header từng level.
5. Chạy `check:legacy-v1` — số game type đạt ngưỡng phải tăng đúng 1.

## 3. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Mượn **ý tưởng dạng bài**, sinh nội dung mới bằng bộ sinh v2 | 1.105 level v1 dùng một chủ đề `fruits` và 6 skill tag; nhập vào là kéo corpus xuống |
| D2 | Một game type v1 = một work package, đóng dứt điểm rồi mới sang cái sau | Dở dang giữa chừng thì cổng phủ không nói được đang ở đâu |
| D3 | Trừ tín dụng audit trước khi sinh | `#170` có thể đã gắn nhãn cho vài level sẵn có; sinh chồng là lãng phí |
| D4 | `check:theme-registry` chạy **trong** task, cấm — NEVER dồn tới cuối đợt | `engine_max_ratio` 0,5 vỡ giữa chừng thì phải sinh lại, không phải sửa nhãn |

## 4. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | 8 game type v1 đều đạt ≥10 level `published` mang `legacy_v1_ref` | `check:legacy-v1` |
| 2 | Tổng level mới ≥ 80 trừ tín dụng audit | `seed:report` |
| 3 | Mọi level qua `content_contract` | `seed:check` Cổng 1 |
| 4 | Mỗi game type trải ≥3 chủ đề, mọi band hợp lệ, ≥2 mức khó | test theo lô |
| 5 | `engine_max_ratio` 0,5 và `catalog_max_ratio` 0,25 không vỡ | `check:theme-registry` |
| 6 | `check:engine-depth` vẫn xanh | — |
| 7 | **Ca âm:** gỡ 1 level của một game type vừa đủ 10 → `check:legacy-v1` đỏ | chạy tay |
| 8 | `pnpm check` xanh | — |

## 5. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| 10 level na ná nhau | Cao | Nghiệm thu 4; `engine_max_ratio` ép trải chủ đề |
| Gắn nhãn cho level không thật sự kế thừa dạng bài | Cao | Quy tắc `#170`: khớp **dạng bài**, không khớp khuôn. Reviewer đối chiếu mẫu 3 level mỗi game type |
| Vỡ trần chủ đề khi lô lớn đổ vào một engine | Trung bình | D4 — chạy cổng chủ đề trong task |
| Chép `config_params` v1 cho nhanh | Trung bình | D1; review đối chiếu 336 khoá v1 không xuất hiện trong diff |
