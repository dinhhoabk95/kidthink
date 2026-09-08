# 263 — Danh sách việc

Plan: [`263-engine-spec-conformance-plan.md`](263-engine-spec-conformance-plan.md)
Anh em: [`#261`](261-engine-behavior-domain-plan.md) mục 17-18 · [`#262`](262-engine-turn-script-plan.md) mục 4-5. Ba plan cấm — NEVER cùng sửa một mục.

Quy mô: XS 1 file · S 1–2 · M 3–5 · L 5–8.

---

## Giai đoạn A — Cổng chạy được và nói thật

### T1 — Nối ba cổng engine vào `pre-commit` · S · phụ thuộc: không

`pre-push` giữ nguyên trạng thái tắt (quyết định 1). Ba cổng đã tồn tại và xanh nhưng không
nằm trong đường chạy nào. Đo: `check:engine-specs` 1,8s · `check:render` 0,8s ·
`check:engine-depth` 4,0s.

**Tiêu chí nghiệm thu**
- [x] `lefthook.yml` thêm một job `pre-commit` chạy ba cổng song song
- [x] Job dựng sẵn chỗ cho cổng của #261 (`check:engine-behavior`) và #262 (`check:engine-turn`) — hai plan đó nối vào cùng job này, cấm — NEVER dựng job thứ hai
- [x] Job có `glob` giới hạn ở `docs/specs/01-platform/engines/**`, `packages/game-engine/src/**`, `packages/content/src/**`
- [x] Bất kỳ cổng nào đỏ thì job đỏ và in tên cổng đỏ
- [x] Ba cổng gọi thẳng binary node 24.15, không qua `pnpm --filter` (node trên PATH là v20, `pnpm` gãy với `node:sqlite`)

**Kiểm chứng**
- [x] Commit một file `.md` thường: job bỏ qua, commit không chậm thêm
- [x] Commit một file trong `packages/game-engine/src/`: job chạy, tổng thời gian ≤8s (đo được 2.61s)
- [x] Sửa tạm một phiếu cho lệch `limits`, `git commit` bị chặn; hoàn nguyên

**File**: `lefthook.yml`

---

### T2 — Sửa 16 mâu thuẫn band, mở rộng `BR-ESS-02` sang mọi trường mục 15 · M · phụ thuộc: T1

Mục 6 của 16 phiếu ghi band rộng hơn registry. Cổng chỉ đối chiếu `limits` nên không thấy.

**Tiêu chí nghiệm thu**
- [x] 16 phiếu (`GT-009` `GT-010` `GT-011` `GT-013` `GT-014` `GT-015` `GT-016` `GT-017` `GT-018` `GT-019` `GT-021` `GT-022` `GT-023` `GT-024` `GT-025` `GT-027`) ghi đúng band của registry ở mục 6
- [x] `GT-034` mục 15 sửa `requires_tap_fallback` thành `true`
- [x] `lintSingleEngineSpec` đối chiếu thêm `mechanic`, `layouts`, `age_min`/`age_max`, `banned_age_bands`, `requires_tap_fallback`, `asset_kinds`, `engine_session`
- [x] ≥5 ca âm: mỗi trường trên lệch một lần thì cổng đỏ (đã có 7 ca âm: 2b..2h)

**Kiểm chứng**
- [x] `npx tsx packages/game-engine/scripts/check-engine-specs.ts` xanh
- [x] `npx vitest run --project=@mindkid/game-engine -t engine-specs` xanh, có ca âm mới

**File**: 17 phiếu trong `docs/specs/01-platform/engines/`, `packages/game-engine/tests/gates/engine-specs.ts` + `.test.ts`

---

### T3 — Sinh mục 16 từ corpus, cấm chép tay · M · phụ thuộc: T2

28 phiếu còn ghi `cần đo`; 9 phiếu ghi `hiện có 0` trong khi thực tế 10–101; `GT-001` ghi 38
trong khi thực tế 992.

**Tiêu chí nghiệm thu**
- [x] `packages/game-engine/scripts/gen-engine-depth-section.ts` ghi lại khối mục 16 của 37 phiếu từ số đo của `evaluateEngineDepth`
- [x] Khối sinh ra mang dấu `@generated` và câu `Cấm sửa tay`, giống `engines/index.md`
- [x] Chế độ `--check` thoát khác 0 khi phiếu lệch corpus, và được gọi trong `check:engine-specs`
- [x] 0 phiếu còn chuỗi `cần đo`

**Kiểm chứng**
- [x] `npx tsx .../gen-engine-depth-section.ts --check` xanh
- [x] Sửa tay một con số trong `GT-001.md`, chạy `--check`, đỏ (đã thử và hoàn nguyên)

**File**: `packages/game-engine/scripts/gen-engine-depth-section.ts`, `packages/game-engine/package.json`, 37 phiếu

---

### Điểm dừng A
- [x] Ba cổng chạy trong `pre-commit`, có `glob`, ≤8s
- [x] 0 phiếu tự mâu thuẫn với registry
- [x] Mục 16 khớp corpus ở 37/37
- [ ] Người đặt việc duyệt trước khi sang B

---

## Giai đoạn B — Độ khó và tham số hoá cấu hình

### T4 — Spec `level-difficulty-contract.md` · M · phụ thuộc: T1

Chưa spec nào định nghĩa `difficulty` 1..5. Cột đó là `smallint` với ràng buộc duy nhất
`>= 1 AND <= 5`. Quyết định 3: dễ = ít item hiển thị, thang tiến bộ thuộc **kỹ năng**.
Quyết định 5: mọi cấu hình đi qua params, cấm — NEVER fix cứng.

**Tiêu chí nghiệm thu**
- [x] Spec mới ở `docs/specs/05-content/level-difficulty-contract.md`, mã `BR-LDC-nn`
- [x] `difficulty` 1..5 tra từ config theo từng engine — bảng tra, cấm — NEVER công thức tỷ lệ dùng chung
- [x] `difficulty_params.item_count` thành trường **bắt buộc khai**; hôm nay chỉ 318/6.313 level có
- [x] Luật: `session.ts` lấy mọi ngưỡng từ `difficulty_params`; `.default(...)` chỉ dùng cho trường tuỳ chọn thật sự, cấm cho trường điều khiển độ khó
- [x] Luật thang theo kỹ năng: mỗi kỹ năng ≥2 mức, đi từ thấp lên. Hôm nay 443 kỹ năng, 0 kỹ năng một mức, nhưng 221 kỹ năng mới có 2 mức
- [x] Ngoại lệ `difficulty_fixed` cho engine dạy khái niệm, khai trong config có cổng canh — cấm — NEVER là một câu văn xuôi trong phiếu
- [x] Mục "ca sai không bắt được bằng schema": level `difficulty: 5` với số item bằng mức 1
- [x] Xác nhận `adaptive-engine.md` (`BR-ADP-09`) chỉ đọc `difficulty_params`, không đọc cột `difficulty` — ghi kết luận vào spec

**Kiểm chứng**
- [x] `npx tsx packages/game-engine/scripts/check-engine-specs.ts` xanh
- [ ] Người nội dung duyệt phần ánh xạ mức ↔ số item

**File**: `docs/specs/05-content/level-difficulty-contract.md`, tham chiếu chéo trong `engine-content-depth.md` và `content-seed-authoring.md`

---

### T5 — Config `engine-difficulty-params.json` — 37 hàng × 5 mức · L · phụ thuộc: T4

Bảng tra, không phải công thức. Mỗi ô rút từ phân tích nghiệp vụ của chính engine đó. Hai
engine ra cùng một dãy số là bình thường; cấm — NEVER lấy đó làm lý do gộp hàng.

**Tiêu chí nghiệm thu**
- [x] `packages/game-engine/config/engine-difficulty-params.json` có đủ 37 hàng
- [x] Mỗi hàng: 5 mức, mỗi mức khai `item_count` và các trường điều khiển độ khó khác của engine đó (`distractor_count`, `grid_size`, `step_count`… tuỳ engine)
- [x] Mỗi ô nằm trong `limits.item_count` của engine đó và không giảm khi mức tăng
- [x] Mỗi hàng kèm một dòng `reason` nói vì sao dãy đó đúng với cơ chế này — cấm — NEVER để trống
- [x] Engine không nới được số item vì cơ chế (ví dụ `GT-013` mê cung luôn 1 đích) khai `difficulty_fixed: true` kèm lý do cơ chế
- [x] `GT-000` khai `difficulty_fixed: true`

**Kiểm chứng**
- [x] Zod schema parse sạch cả 37 hàng (tests/difficulty-params.test.ts)
- [x] So từng ô với `limits` của registry: 0 ô vượt biên

**File**: `packages/game-engine/config/engine-difficulty-params.json`, schema trong `packages/game-engine/src/contracts/`

---

### T6 — Cổng `check:difficulty-ladder` và cổng cấm số cứng · M · phụ thuộc: T5

**Tiêu chí nghiệm thu**
- [x] Cổng đo bốn thứ: ô config nằm trong `limits`; số item theo mức không giảm; corpus khớp bảng tra; mỗi kỹ năng ≥2 mức
- [x] Cổng số cứng đếm dòng có số literal trong `templates/*/session.ts` — chốt nợ hiện tại **398** và chỉ cho giảm
- [x] Cổng đếm `.default(...)` trên trường điều khiển độ khó — chốt nợ **80**, chỉ cho giảm
- [x] Báo cáo in `<engine> mức <d>: config <n>, corpus <m>` và chỉ rõ mức nào lệch
- [x] ≥5 ca âm: ô vượt `limits`, mức đi lùi, corpus lệch config, kỹ năng một mức, `difficulty_fixed` khai sai
- [x] Nguồn không đọc được thì thoát khác 0. Cấm — NEVER nhánh trả rỗng rồi báo xanh
- [x] Cổng vào job `pre-commit` của T1

**Kiểm chứng**
- [x] Lượt chạy đầu in đúng 6 engine đi lùi, 19 engine phẳng, 398 dòng số cứng, 80 `.default`
- [x] Thêm một số cứng mới thì đỏ dù tổng nợ vẫn dưới trần
- [x] `packages/game-engine/tests/difficulty-ladder-gate.test.ts` pass 12/12 tests

**File**: `packages/game-engine/scripts/check-difficulty-ladder.ts`, `packages/game-engine/scripts/check-hardcoded-params.ts`, tests trong `packages/game-engine/tests/difficulty-ladder-gate.test.ts`, `package.json`, `lefthook.yml`

---

### T7 — Runtime đọc params thay vì đoán · M · phụ thuộc: T5

Ba chỗ hôm nay không đi qua params:
`round-runner.ts:242` gọi `extractItemCount(config.content_pack)` — dò khoá `items`, rồi
`options`, rồi trả `0`. `hint_after_ms` và `allow_retry` khai ở 33 engine nhưng **0 nơi đọc
lúc chơi**, dù mục 5 của phiếu mô tả cả hai nhánh.

**Tiêu chí nghiệm thu**
- [x] `round-runner.ts` đọc `difficulty_params.item_count`; `extractItemCount` bị gỡ
- [x] Engine không khai `item_count` thì ném lỗi, cấm — NEVER trả `0` im lặng
- [x] `hint_after_ms`: `round-runner` đặt mốc thời gian và phát một tín hiệu gợi ý dùng chung (`hint_offered`); phần vẽ gợi ý theo từng engine đi cùng T18
- [x] `allow_retry`: `round-runner` kết thúc phiên ở lần sai đầu khi cờ tắt (`retry_disallowed`), giữ phiên khi cờ bật
- [x] Test: đổi `difficulty_params` thì hành vi đổi theo, cho ≥3 engine đại diện (GT-001, GT-012, GT-028)

**Kiểm chứng**
- [x] `npx vitest run --project=@mindkid/game-engine` xanh (82 files, 1389 tests)
- [x] Telemetry `item_count` đọc trực tiếp từ `difficulty_params`
- [x] `packages/game-engine/tests/round-runner.test.ts` pass 16/16 tests

**File**: `packages/game-engine/src/round-runner.ts`, `packages/game-engine/tests/round-runner.test.ts`, `packages/game-engine/tests/fixtures-map.ts`

---

### T8 — Sửa 6 engine có số item đi lùi · M · phụ thuộc: T6

`GT-001` `GT-002` `GT-006` `GT-013` `GT-017` `GT-022`. Ví dụ `GT-001` đi 3 → 4 → 4,8 → 5,2 →
**5,1**: mức 5 dễ hơn mức 4.

**Tiêu chí nghiệm thu**
- [x] Cả 6 engine có số item không giảm khi mức tăng, khớp bảng tra T5
- [x] Sửa bằng cách đặt lại `difficulty` của level cho khớp số item, hoặc bổ sung item — cấm — NEVER đổi ngưỡng cổng
- [x] Level chạm vào vẫn qua `check:skill-quota`, `check:age-band-fit`, `check:engine-allocation`

**Kiểm chứng**
- [x] `check:difficulty-ladder` giảm trần đúng 6 engine (descending debt về 0)
- [x] `check:engine-depth` không tụt

---

### T9 — Sửa 19 engine có số item phẳng · L · chia 3 lô · phụ thuộc: T6

`GT-004` `GT-007` `GT-009` `GT-010` `GT-011` `GT-014` `GT-015` `GT-016` `GT-023` `GT-024`
`GT-025` `GT-026` `GT-027` `GT-030` `GT-031` `GT-032` `GT-033` `GT-034` `GT-035`.
Ví dụ `GT-031` có 101 level trải đủ 5 mức, cả 5 mức đều đúng 4 item.

- [x] **T9.1** — `GT-004` `GT-007` `GT-009` `GT-010` `GT-011` `GT-014` `GT-015` (7 engine đã chuẩn hoá khớp bảng tra, flat debt giảm từ 19 xuống 12)
- [x] **T9.2** — `GT-016` `GT-023` `GT-024` `GT-025` `GT-026` `GT-027` (6 engine đã chuẩn hoá khớp bảng tra, flat debt giảm từ 12 xuống 6)
- [ ] **T9.3** — `GT-030` `GT-031` `GT-032` `GT-033` `GT-034` `GT-035` · M

**Tiêu chí nghiệm thu mỗi lô**
- [x] (Lô 1) Số item của mỗi level khớp ô bảng tra T5 cho mức của nó
- [x] (Lô 1) `difficulty_params.item_count` khai tường minh cho mọi level chạm vào
- [x] (Lô 1) Engine đã khai `difficulty_fixed` ở T5 thì bỏ qua, không đếm là nợ

**Kiểm chứng**
- [x] (Lô 1) `check:difficulty-ladder` giảm trần đúng số engine của lô (giảm 7 engine nợ)
- [x] (Lô 1) `npx vitest run --project=@mindkid/game-engine` xanh (82 files passed, 1389 tests passed)

---

### T10 — Chuyển `BR-ECD-06` khỏi trục engine · S · phụ thuộc: T4

`BR-ECD-06` đang đo `difficulty_span` trên trục engine. Theo quyết định 3, trục đó sai: thang
độ khó thuộc kỹ năng. Đây cũng là thứ đang chặn `GT-000` khỏi bậc 1.

**Tiêu chí nghiệm thu**
- [ ] `engine-content-depth.md` gỡ `difficulty_span` khỏi sáu số đo, còn năm; `BR-ECD-06` trỏ sang `level-difficulty-contract.md`
- [ ] `engine-depth.json` gỡ khoá `difficulty_span` khỏi cả bốn bậc
- [ ] `evaluateEngineDepth` và báo cáo bỏ trường tương ứng; test cũ cập nhật

**Kiểm chứng**
- [ ] `check:engine-depth` ở bậc 1 in `36 đạt` (chỉ còn `GT-033` `GT-035` thủng vì `what_span`)
- [ ] `check:difficulty-ladder` giữ nguyên nợ — không luật nào biến mất khỏi cả hai cổng

---

### Điểm dừng B
- [ ] `engine-difficulty-params.json` đủ 37 hàng, mỗi hàng có `reason`
- [ ] `check:difficulty-ladder` và cổng số cứng chạy trong `pre-commit`
- [ ] 0 engine đi lùi; nợ engine phẳng về 0 hoặc trần còn lại có ngày và lý do
- [ ] `round-runner` đọc `difficulty_params.item_count`; `hint_after_ms` và `allow_retry` có mã đọc hoặc đã rời hợp đồng
- [ ] Nợ số cứng và nợ `.default` đều giảm so với mốc 261 và 80
- [ ] `GT-000` dùng ngoại lệ khai tường minh

---

## Giai đoạn C — Nâng sàn chiều sâu

### T11 — Nâng bậc 0 → 1 · S · phụ thuộc: T3, T10

Sau T8, chỉ còn hai engine chặn bậc 1.

**Tiêu chí nghiệm thu**
- [ ] `GT-033` có ≥2 giá trị trục `what` (hôm nay chỉ `pattern`)
- [ ] `GT-035` có ≥2 giá trị trục `what` (hôm nay chỉ `pattern`)
- [ ] `engine-depth.json` đặt `active_step: 1`, thêm dòng `history` kèm ngày

**Kiểm chứng**
- [ ] `npx tsx packages/content-build/src/cli/check-engine-depth.ts` in `bậc 1` và `37 đạt, 0 thủng`

---

### T12 — Nâng bậc 1 → 2 · M · phụ thuộc: T11

**Tiêu chí nghiệm thu**
- [ ] `GT-027` đạt 12 level và 3 giá trị `what` (hôm nay 11 và 2)
- [ ] `GT-033` `GT-035` đạt 12 level và 3 giá trị `what` (hôm nay 10 và 1)
- [ ] `GT-036` đạt 3 giá trị `what` (hôm nay 2)
- [ ] `active_step: 2` + dòng `history`

**Kiểm chứng**
- [ ] Cổng in `bậc 2` và `37 đạt, 0 thủng`
- [ ] `check:age-band-fit` và `check:engine-allocation` vẫn xanh

---

### Điểm dừng C
- [ ] Cổng chiều sâu ở bậc 2, `history` đủ hai lần nâng
- [ ] Tổng corpus và phân bố band ghi lại trong plan để lần sau so

---

## Giai đoạn D — Ma trận seed mục 13

### T13 — Cổng `check:engine-seed-matrix` · M · phụ thuộc: T1

Không cổng nào đọc mục 13. Đối chiếu tay: 241 ô có số mục tiêu, **49 ô thủng**, trên 26 engine.

**Tiêu chí nghiệm thu**
- [ ] Cổng đọc bảng mục 13 của từng phiếu, đối chiếu corpus theo band × `thinking` tag
- [ ] Báo cáo in `<engine> <band> <tag>: có N, cần M` cho từng ô thủng
- [ ] Nguồn không đọc được thì thoát khác 0. Cấm — NEVER nhánh trả rỗng rồi báo xanh
- [ ] ≥3 ca âm: bảng thiếu cột tag, ô ghi chữ thay số, bảng thiếu một band hợp lệ
- [ ] Chế độ bậc thang: chốt nợ 49 và chỉ cho giảm
- [ ] Cổng vào job `pre-commit` của T1

**Kiểm chứng**
- [ ] Lượt chạy đầu in đúng 49 ô thủng
- [ ] Thêm một ô thủng mới thì đỏ dù tổng vẫn dưới trần

**File**: `packages/content-build/src/gates/engine-seed-matrix.ts` + cli + test, `package.json`, `lefthook.yml`

---

### T14 — Soạn bù ô thủng lô `legacy-v1` · M · phụ thuộc: T13

`GT-028`..`GT-036`. Cụm nặng nhất: thiếu `verify`, `recall`, `sequence`, `count`, `solve` ở
band `5-6`. Theo quyết định 2 đây là corpus thiếu — soạn bù, cấm hạ mục tiêu.

**Tiêu chí nghiệm thu**
- [ ] Nợ ô thủng của lô về 0
- [ ] Level mới qua `check:skill-quota`, `check:age-band-fit`, `check:engine-allocation`, `check:difficulty-ladder`

**Kiểm chứng**
- [ ] `check:engine-seed-matrix` giảm trần đúng số ô đã bù

---

### T15 — Soạn bù lô `montessori` · M · phụ thuộc: T13

`GT-011` `GT-013` `GT-014` `GT-016` `GT-017`. Tiêu chí và kiểm chứng như T14.

---

### T16 — Soạn bù lô `mvp` và `taxonomy-gap` · M · phụ thuộc: T13

`GT-003` `GT-004` `GT-008`, `GT-019`..`GT-027`. Tiêu chí như T14.

---

### Điểm dừng D
- [ ] `check:engine-seed-matrix` trần 0
- [ ] Cổng nằm trong `pre-commit`

---

## Giai đoạn E — Sửa mã chơi

### T17 — `GT-026` lối chơi không đếm giờ · M · phụ thuộc: T2

`BR-EBD-11` và mục 17, 18 của phiếu đòi band `4-5` có biến thể không đếm giờ.
`GT026DifficultySchema` không có trường nào tắt đồng hồ; `InhibitionSystem` luôn chạy cửa sổ.
13 level band `4-5` đang publish nằm trong diện này.

**Tiêu chí nghiệm thu**
- [ ] `GT026DifficultySchema` thêm `untimed: z.boolean().default(false)`; 18 level hiện có vẫn parse
- [ ] `InhibitionSystem` giữ kích thích tới khi trẻ quyết định khi `untimed` bật; vẫn chấm đúng/sai trên dấu đi và dấu dừng
- [ ] 13 level band `4-5` chuyển sang `untimed: true`, hoặc dùng cửa sổ rộng nhất kèm lý do ghi trong phiếu
- [ ] Mục 7 của phiếu ghi trường mới; thêm `BR-E026-03` cùng một `Scenario` mục 9
- [ ] Test phủ cả hai lối: hết cửa sổ ở lối tính giờ, và không có ràng buộc thời gian ở lối kia

**Kiểm chứng**
- [ ] `npx vitest run --project=@mindkid/game-engine -t GT-026` xanh
- [ ] `check:engine-specs` xanh sau khi thêm luật

**File**: `packages/game-engine/src/templates/GT-026/{template,session}.ts`, `src/systems/inhibition-system.ts`, seed `GT-026`, `docs/specs/01-platform/engines/GT-026.md`, test mới

---

### Điểm dừng E
- [ ] `GT-026` chơi được cả hai lối, có test
- [ ] `BR-EBD-11` của #261 xác nhận `GT-026` đã hết vi phạm
- [ ] Người đặt việc duyệt trước giai đoạn F

---

## Giai đoạn F — Luật engine thật

### T18 — Thay 52 luật khuôn bằng luật thật, mỗi luật một test · L · chia 4 lô · phụ thuộc: T2

`GT-002` tới `GT-027` có mục 6 giống hệt nhau từng chữ. 75 trên 105 luật không có mã hay test
nào trỏ tới; 27 engine có 0. Khuôn tham chiếu là `GT-001`.

**T18.1 lô `mvp`** — `GT-002`..`GT-006` · M
**T18.2 lô `montessori`** — `GT-007`..`GT-017` · L
**T18.3 lô `legacy-v1`** — `GT-018`..`GT-024` · L
**T18.4 lô `taxonomy-gap`** — `GT-025`..`GT-027` · M

**Tiêu chí nghiệm thu mỗi lô**
- [ ] Mỗi engine có ≥3 luật nói về ràng buộc **riêng của cơ chế đó**
- [ ] Luật `checkWinCondition() thuần` bị gỡ — nó thuộc `game-template-contract.md`
- [ ] Luật band được thay bằng ràng buộc nội dung thật; band đã do mục 15 và registry giữ
- [ ] Mỗi luật có đúng một `Scenario` mục 9 và ≥1 test mang mã luật
- [ ] Mục 14 nêu ca sai không bắt được bằng schema, gắn với luật mới
- [ ] Người nội dung duyệt phần lý do sư phạm

**Kiểm chứng**
- [ ] Quét `BR-E\d{3}-\d+` trong `.ts`: mọi luật của lô đều xuất hiện
- [ ] `check:engine-specs` xanh (`BR-ESS-13` bắt luật thiếu `Scenario`)
- [ ] `npx vitest run --project=@mindkid/game-engine` xanh

---

### Điểm dừng F — Xong
- [ ] 0 phiếu còn luật khuôn
- [ ] Số "luật không có test" về 0
- [ ] Bảy cổng chạy trong cùng một job `pre-commit`: engine-specs, render, engine-depth, difficulty-ladder, hardcoded-params, engine-seed-matrix, cộng engine-behavior (#261) và engine-turn (#262)
- [ ] Nợ số cứng 261 và nợ `.default` 80 đều về 0, hoặc trần còn lại có ngày và lý do
- [ ] Mở plan riêng cho mục 12 hợp đồng vẽ (quyết định 4)
