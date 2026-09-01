# Kế hoạch — Task #179: Backfill `GT-012` `GT-018` `GT-023` `GT-019` `GT-022` — 13 game type v1, 130 level

> **Loại task:** backfill nội dung (L) — đợt 2 của [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** 13 game type v1 trên năm engine tải trung bình, **130 level** mang `legacy_v1_ref`.
> **Chặn bởi:** chốt kiểm 1 — [`#170`](170-legacy-v1-traceability-spine-plan.md) · [`#171`](171-solver-backed-generators-plan.md) · [`#172`](172-geometry-checked-generators-plan.md) · [`#173`](173-generator-theme-axis-expansion-plan.md) · [`#174`](174-engine-depth-step-1-plan.md).
> **Chạy song song được với** năm task backfill còn lại của đợt 2.
> **Spec sở hữu:** `docs/specs/08-quality/legacy-v1-coverage.md` (viết ở `#170`) · [`game-level-model.md`](../specs/05-content/game-level-model.md).

## 1. Đích

Năm engine, mỗi engine 2–3 game type v1. Task lớn nhất đợt 2 về số level nhưng đơn giản nhất về
rủi ro: không engine nào phải viết mã, và mỗi engine chỉ gánh 20–30 level nên trần chủ đề rộng rãi.

| Engine | Game type v1 | Trục phân biệt trong engine |
|---|---|---|
| `GT-012` nhìn chớp rồi nhớ lại | `D1-06` `D1-07` `D1-13` | cái phải nhớ: số lượng · vị trí chấm · danh tính vật |
| `GT-018` nghe rồi làm | `D3-04` `D3-08` `D6-09` | thứ phải nghe: quy luật âm · chuỗi nhạc cụ · lời văn bài toán |
| `GT-023` lắp ghép hình thể | `D2-02` `D2-07` `D6-10` | đích lắp: hình mẫu · vật thể · tháp chồng |
| `GT-019` xoay và lật mảnh | `D2-04` `D2-10` | phép biến hình: xoay · lật |
| `GT-022` tìm vật thể ẩn | `D2-08` `D6-06` | cái bị ẩn: hình trong hình · vật trong cảnh |

| Game type v1 | Tên | Kỹ năng chính | Nguồn v1 |
|---|---|---|---|
| `D1-06` | Flash Đếm Nhanh (Subitizing) | `C1.CNT.11` | `SubitizingSession` |
| `D1-07` | Đoán Nhanh Chấm | `C1.CNT.09` | `TapNumberSenseSession` |
| `D1-13` | Ghi Nhớ (Flash Memory) | `C6.WM.04` | `FlashMemorySession` |
| `D3-04` | Quy luật Âm thanh | `C1.PAT.01` · `C4.MEM.04` | `SoundPatternSession` |
| `D3-08` | Chạm Nhạc cụ | `C4.MEM.04` | `TapPatternSession` |
| `D6-09` | Bài toán Có lời văn | `C5.LIS.03` · `C1.PROB.06` | `AudioDragSession` |
| `D2-02` | Tangram Ghép hình | `C2.CON.02` | `TangramSession` |
| `D2-07` | Lắp ghép Robot/Nhà | `C2.CON.03` | `AssemblySession` |
| `D6-10` | Xếp Khối (Tower Stacking) | `C2.CON.04` | `PhysicsStackSession` |
| `D2-04` | Xoay Mảnh ghép | `C2.ROT.01` | `RotationSession` |
| `D2-10` | Lật hình (Reflection) | `C2.MIR.02` | `FlipSession` |
| `D2-08` | Tìm hình Ẩn | `C4.VIS.03` | `HiddenObjectSession` |
| `D6-06` | Tìm Mẫu vật Ẩn | `C4.VIS.03` | `HiddenObjectSession` |

`D2-08` và `D6-06` cùng kỹ năng `C4.VIS.03` và cùng engine — đây là cặp dễ trùng nhất toàn chương
trình. Phân biệt bằng **loại nền**: hình ẩn trong hình khác, so với vật ẩn trong một cảnh có nhiều
vật. Cấm — NEVER để hai lô chỉ khác chủ đề.

`GT-018` chỉ dùng `AudioController` sẵn có, không micro. `D6-09` là bài toán lời văn nên nội dung
phải có `prompt_audio_ref`; nếu thiết bị không có giọng Việt thì `speakPrompt` rơi về gợi ý hình ảnh
theo `BR-ENG-10` — nội dung phải soạn sao cho vẫn chơi được ở nhánh đó.

## 2. Cách làm — một work package cho một game type v1

1. Đọc lớp `Session` gốc trong `tinimath/packages/game-engine/src/handlers/` để lấy **dạng bài**.
   Cấm — NEVER copy mã, cấm — NEVER nhập `config_params`.
2. Sinh 10 level: `pnpm --filter @mindkid/db gen:levels --engine=<GT> --theme=<chủ đề> --band=<band> --count=<n> --seed=179`.
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
| 1 | 13 game type v1 đều đạt ≥10 level `published` mang `legacy_v1_ref` | `check:legacy-v1` |
| 2 | Tổng level mới ≥ 130 trừ tín dụng audit | `seed:report` |
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
