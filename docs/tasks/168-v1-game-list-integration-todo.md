# Todo chương trình — Task #168: Tích hợp toàn bộ 60 game type v1 vào v2

> Kế hoạch: [`168-v1-game-list-integration-plan.md`](168-v1-game-list-integration-plan.md).
> Spec: [`168-v1-game-list-integration-spec.md`](168-v1-game-list-integration-spec.md).
>
> **Đây là bảng theo dõi chương trình.** Việc chi tiết nằm trong todo của từng task con.
> **Cả 21 task con đã có plan + todo** (viết 2026-08-31).
> Đặt lại đường dẫn Node trước mọi lệnh: `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`.
> Dùng `pnpm lint`, **không** dùng `ultracite check`.

## Mức nghiệm thu

**60 game type v1 × ≥10 game level = 600 level mang `legacy_v1_ref`.**

## Preflight — đã đo 2026-08-31

- [x] v1: 60 game type · 50 lớp `Session` · 1.105 level · **1** chủ đề (`fruits`) · 6 skill tag · 336 khoá `config_params`.
- [x] v1 thang khó là nhãn: `easy` tb 5,0 vật · `medium` 5,1 · nhiễu tb 0,0–0,1 cả bốn bậc.
- [x] v2: 27 template · **19/27** bộ sinh · **5/14** chủ đề · 250 level · `engine-depth` bậc 0.
- [x] v2 **không có** đường truy vết nguồn v1 — grep `LEGACY_GAME_TYPE_MAP` `legacy_id` `D1-01` `C1-01` → 0 kết quả.
- [x] `GameMechanic` lệch hai chiều: 5 mồ côi, 3 đang chạy mà thiếu; không nơi nào dùng kiểu.
- [x] Vốn từ đủ: cả 14 chủ đề đều 10 danh từ.
- [x] Trần đang canh: `catalog_max_ratio` 0,25 · `engine_max_ratio` 0,5 · `min_themes_count` 8 · `stepwise_caps.school` 0,37.
- [x] Ánh xạ 60 → 18 khuôn cũ + 9 khuôn mới đã lập, tổng khớp 51 + 9 = 60.
- [ ] Docker daemon chạy để `seed:report` và `check:engine-depth` đọc được Postgres `127.0.0.1:5433`.

## Đợt 1 — nền

- [ ] [`#169`](169-mechanic-vocabulary-enforcement-plan.md) Từ vựng `mechanic` khớp registry và ép bằng kiểu — M
- [ ] [`#170`](170-legacy-v1-traceability-spine-plan.md) Xương truy vết v1: registry 60 · `legacy_v1_ref` · cổng phủ · audit 250 level — L
- [ ] [`#171`](171-solver-backed-generators-plan.md) Bốn bộ sinh cần bộ giải: `GT-009` `GT-013` `GT-014` `GT-015` — L
- [ ] [`#172`](172-geometry-checked-generators-plan.md) Bốn bộ sinh cần kiểm hình học: `GT-016` `GT-017` `GT-021` `GT-024` — L
- [ ] [`#173`](173-generator-theme-axis-expansion-plan.md) Mở trục chủ đề 19 bộ sinh, 5 → ≥8 — M
- [ ] [`#174`](174-engine-depth-step-1-plan.md) Bật `engine-depth` bậc 1 — M

### ═══ CHỐT KIỂM 1 ═══

- [ ] `ALL_LEVEL_GENERATORS` đủ **27** khoá.
- [ ] Không bộ sinh nào khai dưới **8** chủ đề; ≥12/14 chủ đề được dùng.
- [ ] `LEGACY_V1_GAME_TYPES` đủ **60** hàng, property test song ánh xanh.
- [ ] Cổng phủ v1 in số thật, kể cả 0/60.
- [ ] **Audit trả lời: bao nhiêu trong 250 level hiện có gắn được `legacy_v1_ref`.**
      Số này quyết định kích thước sáu task đợt 2 — **viết plan đợt 2 sau chốt kiểm này**.
- [ ] `check:engine-depth` xanh bậc 1 · `pnpm check` xanh.

## Đợt 2 — backfill 51 game type, 510 level

- [ ] [`#175`](175-backfill-gt003-drag-to-container-plan.md) `GT-003` — 8 game type, 80 level
- [ ] [`#176`](176-backfill-gt001-tap-select-plan.md) `GT-001` — 7 game type, 70 level
- [ ] [`#177`](177-backfill-gt008-drag-to-slot-plan.md) `GT-008` — 6 game type, 60 level
- [ ] [`#178`](178-backfill-gt006-gt005-order-and-pair-plan.md) `GT-006` + `GT-005` — 8 game type, 80 level
- [ ] [`#179`](179-backfill-five-engines-mid-load-plan.md) `GT-012` `GT-018` `GT-023` `GT-019` `GT-022` — 13 game type, 130 level
- [ ] [`#180`](180-backfill-eight-engines-single-type-plan.md) tám engine tải mỏng — 9 game type, 90 level

### ═══ CHỐT KIỂM 2 ═══

- [ ] Cổng phủ v1: **51/60** ở mức ≥10 level.
- [ ] ≥**510** level mang `legacy_v1_ref`, tất cả qua Cổng 1.
- [ ] `check:theme-registry` xanh; `stepwise_caps.school` đã hạ theo tỉ lệ mới.
- [ ] `check:engine-depth` vẫn xanh.

## Đợt 3 — sáu khuôn mới, nguyên thuỷ sẵn có

- [x] [`#181`](181-engine-gt-028-tap-count-plan.md) `GT-028` `tap-count` ← `D1-10` — 10 level
- [x] [`#182`](182-engine-gt-029-remove-from-set-plan.md) `GT-029` `remove-from-set` ← `D1-12` — 10 level
- [x] [`#183`](183-engine-gt-030-measure-with-unit-plan.md) `GT-030` `measure-with-unit` ← `D5-04` — 10 level
- [x] [`#184`](184-engine-gt-031-coin-compose-plan.md) `GT-031` `coin-compose` ← `D5-10` — 10 level
- [x] [`#185`](185-engine-gt-032-pour-quantity-plan.md) `GT-032` `pour-quantity` ← `D5-09` — 10 level
- [x] [`#186`](186-engine-gt-033-weave-grid-plan.md) `GT-033` `weave-grid` ← `D3-07` — 10 level

### ═══ CHỐT KIỂM 3 ═══

- [ ] 33 template · 33 phiếu · 33 bộ sinh · `check:engine-specs` xanh.
- [ ] Cổng phủ v1: **57/60**, ≥**570** level.
- [ ] Câu hỏi mở 1 và 2 đã trả lời. Chưa thì **dừng**.

## Đợt 4 — ba khuôn cần hệ thống mới

- [x] [`#187`](187-engine-gt-034-beat-sequence-plan.md) `GT-034` `beat-sequence` ← `D3-06` — 10 level
- [x] [`#188`](188-engine-gt-035-command-sequence-plan.md) `GT-035` `command-sequence` ← `D6-05` — 10 level
- [x] [`#189`](189-engine-gt-036-free-create-plan.md) `GT-036` `free-create` ← `D3-05` — 10 level

### ═══ CHỐT KIỂM 4 — đóng chương trình ═══

- [ ] Cổng phủ v1: **60/60**, ≥**600** level.
- [ ] 36 template · 36 phiếu · 36 bộ sinh · mồ côi 0.
- [ ] `pnpm check` xanh.
- [ ] `grep -rn "tinimath" packages apps --exclude-dir=node_modules` → 0 kết quả trong mã.
- [ ] PR riêng: 9 khuôn `draft` → `published`; bật `engine-depth` **bậc 2**; hạ `stepwise_caps.school` theo tỉ lệ mới; `RESERVED_MECHANICS` đã rỗng.

## Câu hỏi mở — đã đóng 2026-08-31

| # | Quyết | Ảnh hưởng |
|---|---|---|
| 1 | `GT-036` chấm theo quy luật trẻ tự đặt, thang 100 chuẩn | `#189` mở được |
| 2 | `GT-034` dựng `BeatSystem` trên `NoteRecipe[]` của `sfx-engine` | `#187` mở được |
| 3 | `GT-032` lượng tử hoá thành `fill_levels`, giữ bẫy bảo toàn | `#185` mở được |
| 4 | Chốt kiểm 4 bật `engine-depth` **bậc 2**, không phải bậc 3 | chốt kiểm 4 |

Sáu task đợt 2 viết ở cỡ đầy đủ **510 level**; tín dụng audit của `#170` chỉ **giảm**, cấm — NEVER tăng.
