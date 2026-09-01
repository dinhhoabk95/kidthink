# Todo — Task #191: Seeder toàn corpus level

> Kế hoạch: [`191-full-corpus-seeder-plan.md`](191-full-corpus-seeder-plan.md).
> Đích: **3.290 level** · 230/230 skill đạt hạn ngạch · ≥658 cặp `(skill, khuôn)`.
> Mốc hiện tại: 239 level · 46/230 skill · 26 skill một khuôn.

## Đợt 0 — nền · chặn tất cả

### `#192` Đóng từ vựng `thinking`
- [ ] Đo lại: giá trị `thinking` trong `docs/taxonomy/c*.md` so với union `ThinkingProcess`
- [ ] Quyết `construct`: vào union, hay 3 skill đổi sang `create` — ghi lý do vào PR
- [ ] Cổng đối chiếu taxonomy ↔ union, đặt ở `packages/db/tests/gates/`
- [ ] **Ca âm:** thêm một giá trị lạ vào một hàng skill → cổng đỏ
- [ ] `pnpm check` xanh

### `#193` Ma trận `skill × khuôn` — hòn đá móng
- [ ] Luật suy diễn: khuôn hợp lệ cho skill khi `(giao thinking ≠ rỗng) ∧ (band skill không nằm trong banned_age_bands)`
- [ ] Sinh `packages/db/config/skill-template-affinity.json` — dữ liệu, cấm — NEVER viết tay tự do
- [ ] Đo: mỗi skill C1 có bao nhiêu khuôn hợp lệ; **liệt kê skill dưới 4**
- [ ] Đo riêng band `3-4`: 62 skill tuổi 3 có đủ khuôn không
- [ ] Báo cáo skill một-khuôn (dự kiến có `C1.MEAS.09` `C1.MEAS.13` `C1.MEAS.14`) kèm đề xuất
- [ ] Cổng: mọi skill có ≥1 khuôn hợp lệ; danh sách ngoại lệ là **dữ liệu**, không phải comment
- [ ] **Ca âm:** đổi `banned_age_bands` của một khuôn → ma trận đổi theo, cổng bắt được

### `#194` Mở trục chủ đề bộ sinh 5 → ≥8
- [ ] Gỡ dòng `axes.theme` viết cứng ở 19 file bộ sinh
- [ ] Mỗi bộ sinh khai ≥8 chủ đề trong 14 của `CONTENT_THEMES`
- [ ] Mọi cặp `(band, theme)` sinh được và qua `content_contract`
- [ ] **Ca âm:** bộ sinh khai 5 chủ đề → cổng đỏ

### `#195` Tính lại `theme-caps.json` cho đích 3.290
- [ ] Tính caps theo **đích**, không theo corpus hiện tại
- [ ] `stepwise_caps.school` chỉ giảm (`BR-CTR-09`), ghi `history`
- [ ] Đối chiếu: `catalog_max_ratio` 0,25 × 3.290 = 822 level/chủ đề
- [ ] **Ca âm:** nới một ngưỡng lên → cổng đỏ

### `#196` Cổng hạn ngạch + đa dạng `check:skill-quota`
- [ ] Đếm level/skill — **chỉ** level đã qua `content_contract`
- [ ] Đếm khuôn/skill: C1 ≥4, C khác ≥2
- [ ] Trần cứng: mỗi cặp `(skill, khuôn)` ≤5 level
- [ ] Đếm cặp riêng biệt, sàn 658
- [ ] **Ca âm 1:** skill thiếu level → đỏ
- [ ] **Ca âm 2:** skill đủ level nhưng dồn 1 khuôn → đỏ
- [ ] **Ca âm 3:** cặp vượt 5 level → đỏ
- [ ] **Ca âm 4:** level không parse được `content_pack` mà vẫn được đếm → đỏ

> **CHỐT KIỂM 0** — `check:skill-quota` chạy trên corpus 239 và **đỏ đúng chỗ**:
> 184 skill thiếu, 26 skill một khuôn. Cổng xanh ở đây là cổng hỏng, cấm — NEVER đi tiếp.

## Đợt 1 — bộ sinh

### `#197` Tám bộ sinh còn thiếu
- [ ] `GT-009` clue-deduction
- [ ] `GT-013` maze-route
- [ ] `GT-014` balance-scale
- [ ] `GT-015` sudoku-mini
- [ ] `GT-016` clock-hands
- [ ] `GT-017` block-stack
- [ ] `GT-021` mirror-complete
- [ ] `GT-024` trace-path
- [ ] Mỗi bộ sinh ≥8 chủ đề, mọi band hợp lệ, qua `content_contract`

### `#198` Bảng phân bổ 3.290 level
- [ ] Sinh `packages/db/config/level-allocation.json` từ `#193`
- [ ] Mỗi hàng: `skill · khuôn · số level · band · dải chủ đề · dải difficulty`
- [ ] Kiểm **trên giấy**: tổng 3.290, mọi luật D3 thoả, caps chưa vỡ
- [ ] `difficulty` trải theo cột `Khó` của skill, không phẳng

> **CHỐT KIỂM 1** — 27/27 bộ sinh; bảng phân bổ thoả toàn bộ luật trước khi sinh level nào.

## Đợt 2 — C1 lõi · 940 level
- [ ] `#199` `C1.NREC` — 12 skill → 240
- [ ] `#200` `C1.CNT` — 11 skill → 220
- [ ] `#201` `C1.OTO` — 7 skill → 140
- [ ] `#202` `C1.CMP` — 15 skill → 300

## Đợt 3 — C1 còn lại · 1.040 level
- [ ] `#203` `C1.NCOMP` — 12 → 240
- [ ] `#204` `C1.MEAS` — 15 → 300 *(chứa các skill một-khuôn, làm sau `#193`)*
- [ ] `#205` `C1.PAT` — 10 → 200
- [ ] `#206` `C1.ADD` — 6 → 120
- [ ] `#207` `C1.SUB` — 5 → 100
- [ ] `#208` `C1.PROB` — 6 → 120

> **CHỐT KIỂM 2** — C1 đủ 1.980 level, 99/99 skill đạt ≥20 và ≥4 khuôn, caps chưa vỡ.
> Ghi nợ LO tự sinh vào PR chốt kiểm này.

## Đợt 4 — C2 + C3 · 740 level
- [ ] `#209`–`#216` C2: `ORI`(100) `GEO`(80) `DIR`(70) `CON`(50) `ROT`(40) `PER`(40) `MIR`(30) `MAZ`(30)
- [ ] `#217`–`#224` C3: `CLS`(60) `SRT`(50) `SEQ`(40) `ANA`(30) `RULE`(30) `MTX`(30) `DED`(30) `INF`(30)

## Đợt 5 — C4 + C5 + C6 · 570 level
- [ ] `#225`–`#228` C4: `VIS` `DET` `MEM` `SEN` — mỗi strand 40
- [ ] `#229`–`#233` C5: `VOC`(50) `QUE`(50) `STO`(40) `DES`(40) `LIS`(30) — đợt duy nhất chạm `asset_kinds: audio`
- [ ] `#234`–`#239` C6: `WM`(40) `INH`(40) `ATT`(30) `FLX`(30) `PLN`(30) `MON`(30)

## Đợt 6 — hợp lưu `#168`
- [ ] `#181`–`#189`: 9 engine mới (phiếu spec đã có từ [`#190`](190-engine-spec-first-authoring-spec.md))
- [ ] 600 level `legacy_v1_ref` tính **vào** hạn ngạch skill, không cộng ngoài
- [ ] `check:legacy-v1` đạt 60/60

> **CHỐT KIỂM 3** — 3.290 level · 230/230 skill · ≥658 cặp · `engine-depth` bậc 2 · mọi caps xanh.

## Nợ ghi nhận, không chặn
- [ ] LO đang sinh tự động bằng `generateDefaultLOs()` — 3.290 level sẽ trỏ vào mục tiêu học tập máy đặt tên
- [ ] 112/230 skill trạng thái `chờ` vẫn nhận hạn ngạch theo D1 — rà lại sau chốt kiểm 3
