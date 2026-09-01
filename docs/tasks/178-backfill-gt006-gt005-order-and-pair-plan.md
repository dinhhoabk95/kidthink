# Kế hoạch — Task #178: Backfill `GT-006` + `GT-005` — 8 game type v1, 80 level

> **Loại task:** backfill nội dung (L) — đợt 2 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** 8 game type v1 trên `GT-006` sắp xếp thứ tự và `GT-005` ghép cặp, **80 level** mang `legacy_v1_ref`.
> **Chặn bởi:** chốt kiểm 1 — [`#170`](170-legacy-v1-traceability-spine-plan.md) · [`#171`](171-solver-backed-generators-plan.md) · [`#172`](172-geometry-checked-generators-plan.md) · [`#173`](173-generator-theme-axis-expansion-plan.md) · [`#174`](174-engine-depth-step-1-plan.md).
> **Chạy song song được với** năm task backfill còn lại của đợt 2.
> **Spec sở hữu:** `docs/specs/08-quality/legacy-v1-coverage.md` (viết ở `#170`) · [`game-level-model.md`](../specs/05-content/game-level-model.md).

## 1. Đích

Hai engine gộp một task vì cả hai đều nhỏ hơn một task riêng và **không engine nào phải viết mã** —
đây là task soạn nội dung, nên luật "một lát dọc một engine" giữ ở mức work package.

**`GT-006` sắp xếp thứ tự — 5 game type.** Khuôn chỉ hợp band `5-6` (`banned_age_bands`
`3-4` và `4-5`), nên trải band không mở được; trục phân biệt phải là **tiêu chí sắp xếp**.

| Game type v1 | Tên | Kỹ năng chính | Nguồn v1 | Tiêu chí |
|---|---|---|---|---|
| `D1-09` | Đếm ngược | `C1.CNT.04` | `NumberSequenceSession` | số giảm dần |
| `D5-06` | Sắp xếp Trật tự kích thước | `C1.MEAS.15` | `SizeOrderingSession` | kích thước |
| `D5-07` | Thời gian: Trước/Sau | `C1.MEAS.10` | `MeasurementSession` | thời gian trong ngày |
| `D3-03` | Sắp xếp Thứ tự (Seriation) | `C3.SRT.01` | `OrderingSession` | thuộc tính liên tục |
| `D4-06` | Sắp xếp Thứ tự | `C3.SRT.02` | `SortableSession` | thứ hạng theo nhóm |

**`GT-005` ghép cặp — 3 game type.** Trục phân biệt là **quan hệ giữa hai vế**.

| Game type v1 | Tên | Kỹ năng chính | Nguồn v1 | Quan hệ |
|---|---|---|---|---|
| `D1-02` | Tương ứng 1-1 | `C1.OTO.01` | `LineConnectorSession` | một đối một |
| `D1-08` | Ghép đôi Số-Chấm | `C1.NREC.05` | `CardNumberSenseSession` | ký hiệu ↔ lượng |
| `D6-03` | Nhân-Quả | `C3.INF.03` · `C5.STO.04` | `CauseEffectSession` | nguyên nhân ↔ kết quả |

`D6-03` là ca đáng giữ nhất: nó dùng cùng cơ chế ghép cặp nhưng dạy suy luận nhân quả, không dạy
tương ứng số lượng. Đó chính là ví dụ "một khuôn phục vụ nhiều năng lực" mà chương trình theo đuổi.

## 2. Cách làm — một work package cho một game type v1

1. Đọc lớp `Session` gốc trong `tinimath/packages/game-engine/src/handlers/` để lấy **dạng bài**.
   Cấm — NEVER copy mã, cấm — NEVER nhập `config_params`.
2. Sinh 10 level: `pnpm --filter @mindkid/db gen:levels --engine=<GT> --theme=<chủ đề> --band=<band> --count=<n> --seed=178`.
3. Trải: ≥3 chủ đề khác nhau, mọi band hợp lệ của khuôn, ≥2 mức `difficulty`.
4. Gắn `legacy_v1_ref` đúng mã v1 vào header từng level.
5. Chạy `check:legacy-v1` — số game type đạt ngưỡng phải tăng đúng 1.

## 3. Quyết định

| # | Quyết định | Vì sao |
|---|---|---|
| D1 | Mượn **ý tưởng dạng bài**, sinh nội dung mới bằng bộ sinh v2 | 1.105 level v1 dùng một chủ đề `fruits` và 6 skill tag |
| D2 | Một game type v1 = một work package, đóng dứt điểm rồi mới sang cái sau | Dở dang thì cổng phủ không nói được đang ở đâu |
| D3 | Trừ tín dụng audit trước khi sinh | Tránh sinh chồng lên level `#170` đã gắn nhãn |
| D4 | `check:theme-registry` chạy **trong** task | Vỡ trần giữa chừng thì phải sinh lại, không phải sửa nhãn |

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
| Gắn nhãn cho level không thật sự kế thừa dạng bài | Cao | Reviewer đối chiếu mẫu 3 level mỗi game type |
| Vỡ trần chủ đề khi lô lớn đổ vào một engine | Trung bình | D4 |
| Chép `config_params` v1 cho nhanh | Trung bình | D1; review đối chiếu diff |
