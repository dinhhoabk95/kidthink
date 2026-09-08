# 263 — Đưa 37 game về đúng phiếu engine

Ngày lập: 2026-09-08 · Nguồn: `docs/specs/01-platform/engines/GT-000..GT-036.md`
Nối tiếp: [`#261`](261-engine-behavior-domain-plan.md) miền hành vi · [`#262`](262-engine-turn-script-plan.md) kịch bản lượt chơi
Trạng thái: đề xuất, năm quyết định phạm vi đã chốt

## 1. Câu trả lời ngắn

**Mã game gần như không phải sửa. Thứ lệch là chính phiếu spec, corpus nội dung, và cổng.**

Đo hôm nay trên 37 engine, 6.313 level seed:

| Câu hỏi | Kết quả đo |
|---|---|
| Engine thiếu `render()` hoặc thiếu spec | 0 / 37 |
| `check:engine-specs` · `check:render` · `check:engine-depth` | cả ba xanh |
| Engine phải sửa mã chơi | **1** — `GT-026` |
| Phiếu tự mâu thuẫn với registry | **16** |
| Luật `BR-Exxx` không có test nào chạm | **75 / 105** |
| Engine không đạt ma trận seed của chính nó (mục 13) | **26 / 37** |
| Số đo mục 16 còn đúng | **0 / 37** |
| Engine mà `difficulty` không đổi số item hiển thị | **19 / 37** |
| Trường `difficulty_params` khai trong contract nhưng không mã chơi nào đọc | `hint_after_ms` và `allow_retry` ở **33 / 37** |
| Dòng có số cứng trong 37 `session.ts` | **261** |

Nội dung các phiếu engine **không phải mô tả game hiện tại**. Chúng là hợp đồng chưa ai đối
chiếu. Việc cần làm là đóng khoảng cách, và đóng bằng cổng để nó không mở lại.

## 2. Năm quyết định phạm vi

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Cổng engine chạy ở đâu khi `pre-push` tắt | **Giữ `pre-push` tắt. Cổng chạy ở `pre-commit`.** Ba cổng đo được 1,8s + 0,8s + 4,0s; chạy song song và lọc theo `glob` nên chỉ nổ khi chạm file liên quan |
| 2 | 49 ô thủng mục 13 là corpus thiếu hay mục tiêu đặt quá tay | **Corpus thiếu.** Mục tiêu mục 13 giữ nguyên, soạn bù. Cấm — NEVER hạ số mục tiêu để cổng xanh |
| 3 | `GT-000` toàn `difficulty: 1` là chủ ý hay thiếu sót | **Đặt lại định nghĩa độ khó.** `GT-000` là bài học nên đúng một mức. Thang độ khó thuộc **kỹ năng**, không thuộc engine. Độ khó đo bằng **số item hiển thị**: dễ = ít item |
| 5 | Giá trị cấu hình sống ở đâu | **Mọi cấu hình tham chiếu qua params, cấm — NEVER fix cứng.** Phân tích theo nghiệp vụ từng engine rồi ánh xạ vào config. Hai engine ra cùng một giá trị là bình thường, không phải lý do để gộp hay để suy bằng công thức |
| 4 | Mục 12 hợp đồng vẽ (`BR-ERC-04`, `-07`..`-11`) | **Tách plan riêng.** Ngoài phạm vi 262 |

## 3. Chín phát hiện, kèm số đo

### F1 — Cổng chiều sâu thấp hơn thực tế hai bậc, nên không bảo vệ gì

`packages/content-build/src/thresholds/engine-depth.json` đặt `active_step: 0`
(ngày 2026-08-30). Sàn bậc 0 là `level_count ≥ 3`.

| Bậc | Engine đạt | Engine thủng |
|---|---:|---:|
| 0 (đang bật) | 37 | 0 |
| 1 | 34 | 3 |
| 2 | 32 | 5 |
| 3 | 26 | 11 |

`BR-ECD-09` nói PR làm giảm số level của engine đang đạt sàn thì bị chặn. Với sàn 3 và thực
tế 992 level ở `GT-001`, một PR xoá 989 level vẫn xanh. Cổng đang canh một mốc không còn tồn tại.

Ba engine chặn bậc 1: `GT-000` (`difficulty_span` 1/2 — xử lý ở F8, không phải lỗi nội dung),
`GT-033` và `GT-035` (`what_span` 1/2, chỉ có tag `pattern`).

Thêm để lên bậc 2: `GT-027` (11 level, cần 12; `what` 2/3), `GT-033` và `GT-035` (cần 12
level, `what` 3), `GT-036` (`what` 2/3).

### F2 — 26 phiếu có mục 6 là khuôn rỗng, và 16 trong đó nói sai band

`GT-002` tới `GT-027` có đúng hai luật giống hệt nhau từng chữ:

```
| `BR-E0NN-01` | Band hợp lệ: `3-4`, `4-5`, `5-6` | Phù hợp phát triển vận động và nhận thức của lứa tuổi |
| `BR-E0NN-02` | `checkWinCondition()` thuần — không side effect | Tính toán không được ảnh hưởng trạng thái |
```

Luật thứ hai thuộc `game-template-contract.md`, không thuộc engine. Luật thứ nhất là dữ liệu,
và **16 phiếu ghi sai**:

| Engine | Mục 6 nói | Registry |
|---|---|---|
| `GT-009` `GT-010` `GT-013` `GT-018` `GT-019` `GT-021` `GT-022` `GT-023` `GT-025` | `3-4` `4-5` `5-6` | `4-5` `5-6` |
| `GT-011` `GT-014` `GT-015` `GT-016` `GT-017` | `3-4` `4-5` `5-6` | `5-6` |
| `GT-024` `GT-027` | `4-5` `5-6` | `5-6` |

Mỗi phiếu tự mâu thuẫn: mục 15 trích `age_min`/`age_max` đúng, mục 6 ghi sai. Cổng
`BR-ESS-02` chỉ đối chiếu `limits` nên không thấy.

`GT-001` là đối chứng: 4 luật thật, viết riêng cho `tap-select` (`item_count` ≤3 ở band `3-4`,
prompt một mệnh đề, `shuffle_items` từ band `4-5`, `target_count` = 1). Đó là hình dạng mục 6
đáng có.

### F3 — 75 trên 105 luật không có test nào chạm

Quét `BR-E\d{3}-\d+` trong toàn bộ `.ts` của `packages`, `apps`, `scripts`:

| Nhóm | Luật có mã hoặc test trỏ tới |
|---|---|
| `GT-000` | 5 / 10 |
| `GT-001` tới `GT-027` | **0 / 56** |
| `GT-028` tới `GT-036` | 25 / 39 |

Lô `legacy-v1` được thi công theo lối một-luật-một-test. 27 engine còn lại thì không. Đây là
lý do mục 9 (Gherkin) của chúng chưa bao giờ chạy.

### F4 — Ma trận seed mục 13: 26 trên 37 engine không đạt mục tiêu của chính mình

Không có cổng nào đọc mục 13. Đối chiếu 241 ô có số mục tiêu: **49 ô thủng**.

```
GT-030 5-6 count:    có 0, cần 4
GT-031 5-6 solve:    có 0, cần 4
GT-033 5-6 sequence: có 0, cần 4
GT-011 5-6 infer:    có 0, cần 4
GT-032 5-6 verify:   có 0, cần 3
```

Tag hụt nhiều nhất: `verify`, `recall`, `match`, `sort`, `sequence` ở band `5-6`.
Theo quyết định 2, đây là **corpus thiếu** — soạn bù, không hạ mục tiêu.

### F5 — Số đo mục 16 sai ở cả 37 phiếu

- 28 phiếu còn ghi `cần đo` ở 5 trên 6 dòng
- 9 phiếu (`GT-028`…`GT-036`) ghi `level_count: hiện có 0`; thực tế 10 tới 101
- `GT-001` ghi `level_count: 38`; thực tế **992**

Mục 16 là số chép tay lúc viết phiếu. Nó phải là số sinh ra, giống `engines/index.md` đã có
`gen-engine-index.ts` và dòng `@generated` cấm sửa tay.

### F6 — `engine-behavior-domain.md` chưa thi công dòng nào — **đã có chủ ở #261**

Spec đó (`status: draft`, 13 luật `BR-EBD-01..13`, 28 KB) mô tả một config và một cổng, cả hai
đều chưa tồn tại: `packages/game-engine/config/engine-behavior-domain.json` và
`check:engine-behavior` (dù `BR-EBD-13` đòi ≥6 ca âm).

[`#261`](261-engine-behavior-domain-plan.md) sở hữu việc này. Plan 263 **không** làm lại; nó
chỉ nhận hai hệ quả:

- `BR-EBD-11` là căn cứ của F7 dưới đây (`GT-026` phải có lối không đếm giờ)
- cổng `check:engine-behavior` của #261 phải vào cùng job `pre-commit` mà T1 dựng

### F7 — Một engine phải sửa mã thật: `GT-026`

`BR-EBD-11` nói engine `thời-gian-thật` nhận band `4-5` thì **phải** có cửa sổ dung sai nới và
một lối chơi không tính giờ. Mục 17 và 18 của `GT-026` khai đúng như vậy:

> band `4-5` dùng cửa sổ phản ứng rộng nhất và có biến thể **không đếm giờ** — kích thích
> đứng yên tới khi trẻ quyết định. Giá trị cụ thể ở `difficulty_params` của mục 7.

Nhưng `GT026DifficultySchema` chỉ có `stimulus_window_ms` với `min(1000)`. Không có trường nào
tắt đồng hồ, và `InhibitionSystem` luôn chạy cửa sổ. Corpus có **13 level band `4-5`** của
`GT-026` đang publish. Cả 13 đang vi phạm, và hợp đồng hiện tại **không diễn đạt được** cách sửa.

`GT-034` cũng `thời-gian-thật` nhưng chỉ có 30 level band `5-6` nên không vướng.
Ngoài ra `GT-034` mục 15 ghi `requires_tap_fallback: false`, registry ghi `true`.

### F8 — `difficulty` là nhãn trang trí ở 19 engine

Quyết định 3 đặt luật: **dễ = ít item hiển thị**, và thang độ khó thuộc **kỹ năng**.
Đối chiếu luật đó với corpus, so số item trung bình theo từng mức `difficulty`:

| Nhóm | Số engine | Nghĩa |
|---|---:|---|
| Số item **tăng** theo mức | 11 | Đúng luật: `GT-003` `GT-005` `GT-008` `GT-012` `GT-018` `GT-019` `GT-020` `GT-021` `GT-028` `GT-029` `GT-036` |
| Số item **phẳng** qua mọi mức | **19** | Nhãn vô nghĩa: `GT-004` `GT-007` `GT-009` `GT-010` `GT-011` `GT-014` `GT-015` `GT-016` `GT-023` `GT-024` `GT-025` `GT-026` `GT-027` `GT-030` `GT-031` `GT-032` `GT-033` `GT-034` `GT-035` |
| Số item **giảm** ở đâu đó | **6** | Ngược luật: `GT-001` `GT-002` `GT-006` `GT-013` `GT-017` `GT-022` |
| Đúng một mức | 1 | `GT-000` — đúng, vì là bài học |

Ví dụ cụ thể: `GT-031` có 101 level trải đủ 5 mức `difficulty`, và cả 5 mức đều đúng 4 item.
`GT-001` đi 3 → 4 → 4,8 → 5,2 → **5,1**: mức 5 dễ hơn mức 4.

Phần thang theo kỹ năng thì đã lành: 443 kỹ năng, **0 kỹ năng chỉ có một mức**, 6.313/6.313
level đều có `skill_codes`. Nhưng 221 trên 443 kỹ năng mới chỉ có 2 mức.

Chưa spec nào định nghĩa `difficulty` 1..5 nghĩa là gì. Cột đó là `smallint` với ràng buộc
duy nhất `>= 1 AND <= 5`. Và chỉ **318 trên 6.313** level khai `difficulty_params.item_count`;
số còn lại phải suy từ hình dạng `content_pack`.

`BR-ECD-06` hiện đo `difficulty_span` trên trục **engine**. Theo quyết định 3, trục đó sai:
thang độ khó thuộc kỹ năng. Luật cần chuyển trục, và engine loại `concept-intro` cần một
ngoại lệ khai tường minh.

### F9 — Tham số có trong hợp đồng, mã chơi thì fix cứng

Quyết định 5 nói mọi cấu hình phải đi qua params. Đo khoảng cách tới đó:

| Số đo | Giá trị |
|---|---|
| Trường `difficulty_params` khai trong `template.ts` mà `session.ts` không đọc | mọi engine đều có ≥2 |
| `hint_after_ms` · `allow_retry` — số nơi đọc lúc chơi | **0** |
| `.default(...)` trong 37 `DifficultySchema` | **80** |
| Dòng có số cứng trong 37 `session.ts` | **261** |
| Level khai `difficulty_params.item_count` | 318 / 6.313 |

Ba ca cụ thể:

1. **`hint_after_ms` và `allow_retry` không ai đọc lúc chơi.** 33 engine khai hai trường này.
   Bộ sinh level ghi chúng, `custom-game` và endpoint quản trị nhận chúng, test nhắc chúng —
   nhưng không `session.ts` nào, không `round-runner.ts`, không trang chơi nào đọc. Mục 5 của
   `GT-001` mô tả nhánh "hết giờ gợi ý → highlight thẻ đúng" và nhánh "chạm sai, `allow_retry`
   tắt → phiên kết thúc". Cả hai nhánh không tồn tại trong mã.

2. **`round-runner.ts` đoán số item thay vì đọc params.** Dòng 242 gọi
   `extractItemCount(config.content_pack)`, và hàm đó dò khoá `items`, rồi `options`, rồi
   trả `0`. Engine nào không dùng hai tên khoá đó thì telemetry ghi `item_count: 0` — trong
   khi `difficulty_params` là chỗ đúng để đọc.

3. **80 lời gọi `.default(...)`** là giá trị cứng nằm trong contract. Level bỏ trống một
   trường thì nhận số do schema cấp, không do người soạn quyết. `GT-034` `GT-035` `GT-036`
   mỗi engine 6 trường đều có `.default`, và ba session đó cũng là ba session nhiều số cứng
   nhất (27, 37, 28 dòng).

Đây là lý do F8 tồn tại: khi số item không đến từ params, không ai đặt được nó theo mức khó.

## 4. Quyết định kiến trúc

1. **Cổng vào `pre-commit`, lọc bằng `glob`.** Ba cổng cộng lại ~6,6s tuần tự, ~4s song song.
   `glob` giới hạn ở `docs/specs/01-platform/engines/**`, `packages/game-engine/src/**`,
   `packages/content/src/**` nên commit không chạm engine thì không trả giá. Lưu ý lefthook 2.x:
   job có `glob` tự bỏ qua khi không khớp, và các cổng này quét cả cây chứ không nhận
   `{staged_files}`, nên không dính bẫy "staged rỗng thì chạy cả cây".

2. **Mục 16 sinh ra, cấm chép tay.** Một script `gen-engine-depth-section.ts` ghi lại khối mục
   16, kèm dòng `@generated` và chế độ `--check` cho cổng. Cùng cơ chế `engines/index.md`.

3. **Mục 13 là dữ liệu, không phải văn xuôi.** Cổng đọc thẳng bảng markdown mục 13 — không
   nhân bản sang JSON. Bảng đã máy đọc được (`≥n` theo band × tag) và `BR-ESS-05` đã cấm chữ
   "đa dạng" trong đó. Thêm JSON song song là tạo nguồn sự thật thứ hai.

4. **Độ khó có spec riêng: `docs/specs/05-content/level-difficulty-contract.md`.**
   Nó sở hữu ba thứ, và chỉ ba thứ:
   - `difficulty` 1..5 ánh xạ về **số item hiển thị**, tra từ config theo từng engine
   - `difficulty_params.item_count` là **bắt buộc khai**, cấm — NEVER suy từ `content_pack`
   - Thang tiến bộ nằm trên trục **kỹ năng**: mỗi kỹ năng có ≥2 mức, đi từ thấp lên
   Ngoại lệ `concept-intro`: engine dạy khái niệm khai `difficulty_fixed: true`, và ngoại lệ
   phải nằm trong config có cổng canh, không phải một câu trong phiếu.

5. **Ánh xạ mức ↔ số item là bảng tra, không phải công thức** (quyết định 5).
   `packages/game-engine/config/engine-difficulty-params.json` giữ 37 hàng × 5 mức, mỗi ô là
   giá trị rút từ **phân tích nghiệp vụ của chính engine đó**, nằm trong `limits.item_count`
   của nó. Bảng tra thắng công thức tỷ lệ vì cùng một con số "4 item" có nghĩa khác nhau ở
   `GT-001` (bốn thẻ để chọn) và ở `GT-014` (hai bên cân, mỗi bên hai vật). Hai engine ra
   cùng một dãy số là bình thường và **cấm — NEVER** lấy đó làm lý do gộp hàng hay thay bằng
   công thức: giá trị trùng nhau hôm nay có thể tách ra ngày mai vì lý do sư phạm.

6. **Mã chơi đọc params, cấm số cứng.** `session.ts` lấy mọi ngưỡng từ `difficulty_params`.
   `round-runner.ts` đọc `difficulty_params.item_count` thay vì dò hình dạng `content_pack`.
   `.default(...)` trong `DifficultySchema` chỉ được dùng cho trường **tuỳ chọn thật sự**;
   trường điều khiển độ khó thì bắt buộc khai, để một level thiếu trường là lỗi parse chứ
   không phải một giá trị lặng lẽ do schema cấp.

7. **`BR-ECD-06` chuyển trục.** Bỏ `difficulty_span` khỏi sàn theo engine; thay bằng sàn theo
   kỹ năng trong spec độ khó. `engine-depth.json` giữ nguyên năm số đo còn lại.

8. **Bậc thang chiều sâu nâng theo `BR-ECD-08`** — ghi ngày vào `history`, cấm hạ.

9. **`GT-026` thêm trường, không thêm engine.** `untimed: z.boolean().default(false)` trong
   `GT026DifficultySchema`. `BR-GTC-08` coi đổi contract đã publish là breaking, nhưng thêm
   trường có `default` là bổ sung tương thích ngược — 18 level hiện có parse nguyên vẹn.

10. **Luật engine viết theo khuôn `GT-001`**: mỗi luật nêu một ràng buộc riêng của cơ chế này,
   có lý do sư phạm, có đúng một `Scenario` mục 9 và một test mang mã luật. Cấm — NEVER giữ
   luật `checkWinCondition() thuần`: nó thuộc `game-template-contract.md`.

## 5. Đồ thị phụ thuộc

```
T1 nối cổng vào pre-commit
 │
 ├── T2 sửa 16 mâu thuẫn band + mở rộng BR-ESS-02 sang mọi trường mục 15
 │     ├── T3 sinh mục 16 tự động
 │     └── T18 thay 52 luật khuôn bằng luật thật  (4 lô, song song)
 │
 ├── T4 spec hợp đồng độ khó
 │     ├── T5 config engine-difficulty-params.json (37 x 5, phân tích nghiệp vụ)
 │     │     ├── T6 cổng check:difficulty-ladder + cổng cấm số cứng
 │     │     │     ├── T8 sửa 6 engine đi lùi
 │     │     │     └── T9 sửa 19 engine phẳng  (3 lô)
 │     │     └── T7 runtime đọc params: extractItemCount, hint_after_ms, allow_retry
 │     └── T10 BR-ECD-06 chuyển trục ──────────┐
 │                                              │
 ├── T11 nâng bậc chiều sâu 0 → 1 ◄────────────┘
 │     └── T12 nâng 1 → 2
 │
 ├── T13 cổng ma trận mục 13
 │     └── T14·T15·T16 soạn bù 49 ô, chia lô
 │
 └── T17 GT-026 lối không đếm giờ              (độc lập; cần BR-EBD-11 của #261)
```

Hai plan anh em chạy song song, cùng chạm 37 phiếu:

| Plan | Sở hữu mục nào của phiếu | Giao với 263 ở đâu |
|---|---|---|
| [`#261`](261-engine-behavior-domain-plan.md) | mục 17, 18 — miền hành vi, độ mở | `BR-EBD-11` là căn cứ của T17; cổng `check:engine-behavior` vào job `pre-commit` của T1 |
| [`#262`](262-engine-turn-script-plan.md) | mục 4, 5 — bảy nhịp, tám nhánh | Cùng bệnh bản sao với mục 6 của T18; cổng `check:engine-turn` vào job `pre-commit` của T1 |
| **263** | mục 6, 13, 15, 16 — luật, ma trận seed, trường trích, chiều sâu | — |

Ba plan **cấm — NEVER** cùng sửa một mục của một phiếu. Nếu đụng, 263 nhường.

## 6. Sáu giai đoạn

**A — Cổng chạy được và nói thật (T1–T3).** Không đổi một dòng nội dung. Kết thúc: mỗi commit
chạm engine là thấy đủ mọi lệch giữa phiếu và registry.

**B — Độ khó và tham số hoá cấu hình (T4–T10).** Giai đoạn nặng nhất và là điều kiện của C.
Kết thúc: `difficulty` là số đo được, mọi ngưỡng đến từ params, 0 số cứng mới.

**C — Nâng sàn chiều sâu (T11–T12).** Rẻ, vì bậc 1 và 2 gần như đã đạt sẵn.

**D — Ma trận seed (T13–T16).** Soạn bù 49 ô.

**E — Sửa mã chơi (T17).**

**F — Luật engine thật (T18, chia 4 lô).**

## 7. Điểm dừng

| Sau | Điều kiện qua |
|---|---|
| A | Ba cổng chạy trong `pre-commit`; 0 phiếu mâu thuẫn registry; mục 16 khớp corpus ở 37/37 |
| B | `engine-difficulty-params.json` đủ 37 hàng; `check:difficulty-ladder` và cổng số cứng xanh; 0 engine đi lùi; `round-runner` đọc `difficulty_params.item_count`; `hint_after_ms` và `allow_retry` có mã chơi đọc hoặc rời hợp đồng; `GT-000` dùng ngoại lệ khai tường minh |
| C | `engine-depth.json` ở bậc 2, 37/37 đạt, `history` đủ hai dòng |
| D | 49 ô thủng về 0 |
| E | `GT-026` chơi được hai lối có test |
| F | 0 phiếu còn luật khuôn; mọi `BR-Exxx` có ≥1 test |

## 8. Rủi ro

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| Cổng ở `pre-commit` làm commit chậm, người ta dùng `--no-verify` | Cao | `glob` lọc theo đường dẫn; ba cổng chạy song song (~4s) và chỉ khi chạm engine. Đo lại thời gian sau T1, nếu quá 8s thì tách cổng chậm nhất (`check:engine-depth`) sang một job riêng |
| Gỡ 261 số cứng khỏi 37 session làm đổi hành vi chơi mà test không bắt | Cao | Cổng số cứng chạy chế độ bậc thang, gỡ theo lô; mỗi engine gỡ xong phải có ≥1 test chứng minh đổi `difficulty_params` thì hành vi đổi theo |
| Bật `hint_after_ms` và `allow_retry` là thêm hành vi chơi mới cho 33 engine | Cao | Chúng đã nằm trong mục 5 của phiếu nên không phải phạm vi mới, nhưng thi công một lần cho 33 engine thì quá lớn: T7 chỉ làm phần dùng chung ở `round-runner`, phần vẽ gợi ý theo engine đi cùng T18 từng lô |
| Bảng tra 37 x 5 chép sai một ô thì không ai thấy | Trung bình | Mọi ô phải nằm trong `limits.item_count` của engine đó và không giảm khi mức tăng — cổng T6 kiểm cả hai, và cả hai đều có ca âm |
| Sửa 19 engine phẳng chạm 3.000+ level | Cao | T7 chia theo lô, mỗi lô một PR, cổng T5 chạy ở chế độ bậc thang nên nợ chỉ giảm dần chứ không phải về 0 trong một lần |
| Đổi ý nghĩa `difficulty` làm hỏng bộ chọn thích ứng | Cao | `adaptive-engine.md` `BR-ADP-09` chỉ đọc `difficulty_params`, không đọc cột `difficulty`. Xác nhận lại trong T4 trước khi sửa corpus |
| Nâng bậc chiều sâu làm đỏ cổng trước một buổi phát hành rồi bị hạ | Trung bình | `BR-ECD-08` cấm hạ; nâng từng bậc một PR, chỉ nâng khi 37/37 đã xanh sẵn |
| Cổng mục 13 đọc markdown nên vỡ khi ai đó đổi định dạng bảng | Trung bình | Ca âm bắt buộc: bảng thiếu cột, ô ghi chữ thay số, bảng thiếu band |
| Sửa 16 phiếu bằng thay thế hàng loạt làm hỏng phần khác | Trung bình | Sửa từng phiếu, chạy `check:engine-specs` sau mỗi lô 5 phiếu |
| 52 luật viết mới là công sư phạm, không phải công kỹ thuật | Cao | T17 chia theo lô `mvp` / `montessori` / `legacy-v1` / `taxonomy-gap`, mỗi lô một PR, người nội dung duyệt |

## 9. Ngoài phạm vi

- Mục 12 hợp đồng vẽ — `BR-ERC-04`, `-07`..`-11` chưa đo. **Tách plan riêng** (quyết định 4)
- Mục 17, 18 miền hành vi — thuộc [`#261`](261-engine-behavior-domain-plan.md)
- Mục 4, 5 kịch bản lượt chơi và hai trường lời đọc — thuộc [`#262`](262-engine-turn-script-plan.md)
- `engine-play-language.md` — 0 luật có mã trỏ tới; chưa khảo sát trong plan này
- Gỡ duck-typing `InteractiveSession` ở trang chơi — thuộc chương trình engine-input
