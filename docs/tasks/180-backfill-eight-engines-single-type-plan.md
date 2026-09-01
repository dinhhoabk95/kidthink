# Kế hoạch — Task #180: Backfill `GT-014` `GT-013` `GT-016` `GT-021` `GT-024` `GT-015` `GT-009` `GT-020` — 9 game type v1, 90 level

> **Loại task:** backfill nội dung (L) — đợt 2 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** 9 game type v1 trên tám engine tải mỏng, **90 level** mang `legacy_v1_ref`.
> **Chặn bởi:** chốt kiểm 1 — [`#170`](170-legacy-v1-traceability-spine-plan.md) · [`#171`](171-solver-backed-generators-plan.md) · [`#172`](172-geometry-checked-generators-plan.md) · [`#173`](173-generator-theme-axis-expansion-plan.md) · [`#174`](174-engine-depth-step-1-plan.md).
> **Chạy song song được với** năm task backfill còn lại của đợt 2.
> **Spec sở hữu:** `docs/specs/08-quality/legacy-v1-coverage.md` (viết ở `#170`) · [`game-level-model.md`](../specs/05-content/game-level-model.md).

## 1. Đích

Tám engine, mỗi engine 1–2 game type v1. **Bảy trong tám engine vừa mới có bộ sinh** ở
[`#171`](171-solver-backed-generators-plan.md) và [`#172`](172-geometry-checked-generators-plan.md) —
đây là task đầu tiên chạy chúng ở quy mô thật, nên nó cũng là phép thử của hai task đó.

| Engine | Game type v1 | Tên | Kỹ năng chính | Nguồn v1 |
|---|---|---|---|---|
| `GT-014` cân hai bên | `D5-03` | So sánh Nặng/Nhẹ | `C1.MEAS.03` | `BalanceScaleSession` |
| `GT-014` | `D6-08` | Cân bằng Phương trình Hình | `C1.NCOMP.11` · `C3.DED.02` | `BalanceLogicSession` |
| `GT-013` mê cung | `D6-01` | Mê cung Đơn giản | `C2.MAZ.01` | `MazeLogicSession` |
| `GT-016` đồng hồ | `D5-08` | Thời gian: Đồng hồ | `C1.MEAS.13` | `ClockSession` |
| `GT-021` đối xứng | `D2-03` | Đối xứng Gương | `C2.MIR.01` | `MirrorSession` |
| `GT-024` vẽ theo nét | `D2-09` | Vẽ theo Nét chấm | `C1.NREC.08` · `C2.GEO.01` | `DotTracingSession` |
| `GT-015` lưới không lặp | `D6-02` | Sudoku Hình | `C3.MTX.01` · `C3.MTX.02` | `MiniSudokuSession` |
| `GT-009` loại trừ | `D6-07` | Thám Tử Logic | `C3.DED.01` · `C3.DED.02` | `LogicGridSession` |
| `GT-020` lật thẻ | `D6-11` | Đối Ứng Vị Trí (Memory Grid) | `C6.WM.03` | `MemoryGridSession` |

`GT-014` gánh hai game type rất khác nhau: `D5-03` cân **vật thật** để so nặng nhẹ, `D6-08` cân
**phương trình hình** để suy ra giá trị ẩn. Cùng cơ chế, hai năng lực — giữ khác biệt trong nội dung.

Bảy engine dùng bộ sinh mới nghĩa là mỗi lô 10 level là 10 lần bộ giải hoặc phép kiểm hình học phải
chạy đúng. Lô nào sinh không đủ là dấu hiệu bộ sinh còn thiếu, cấm — NEVER bù bằng soạn tay.

## 2. Cách làm — một work package cho một game type v1

1. Đọc lớp `Session` gốc trong `tinimath/packages/game-engine/src/handlers/` để lấy **dạng bài**.
   Cấm — NEVER copy mã, cấm — NEVER nhập `config_params`.
2. Sinh 10 level: `pnpm --filter @mindkid/db gen:levels --engine=<GT> --theme=<chủ đề> --band=<band> --count=<n> --seed=180`.
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
| 1 | 9 game type v1 đều đạt ≥10 level `published` mang `legacy_v1_ref` | `check:legacy-v1` |
| 2 | Tổng level mới ≥ 90 trừ tín dụng audit | `seed:report` |
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
