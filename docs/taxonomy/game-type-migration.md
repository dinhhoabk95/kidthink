# Game Type Migration — D1–D6 → C1–C6

> Bảng ánh xạ **bất biến** cho 60 game type. Nguồn sự thật cho
> `LEGACY_GAME_TYPE_MAP` trong `packages/shared/src/constants/`.
> Spec sở hữu migration: [`../specs/platform/game-id-migration/SPEC.md`](../specs/platform/game-id-migration/SPEC.md).
> Contract chung: [`../SPEC.md`](../SPEC.md) §2–§3.

**Nguyên tắc ánh xạ:** theo **nội dung nhận thức thực tế** của game, không theo
nhóm D cũ. Vì vậy ba domain cũ bị tách và ba competency mới nhận game từ nhiều
domain khác nhau.

**Bất biến:** bảng này là **song ánh** (bijection) — 60 id cũ ↔ 60 id mới, không
trùng, không thiếu. Có property test khẳng định.

---

## C1 — Mathematical Thinking (22)

| Mới | Cũ | Tên | Template | Skill chính |
|---|---|---|---|---|
| C1-01 | D1-01 | Đếm & Kéo vào Rổ | `tpl-drag-to-container` | C1.CNT.01 |
| C1-02 | D1-02 | Tương ứng 1-1 | `tpl-pair-match` | C1.OTO.01 |
| C1-03 | D1-03 | So sánh Nhiều/Ít | `tpl-tap-select` | C1.CMP.04 · C1.CMP.05 |
| C1-04 | D1-04 | Nhận diện Chữ số | `tpl-drag-to-container` | C1.NREC.02 |
| C1-05 | D1-05 | Chuỗi Số Đặt đúng | `tpl-drag-to-slot` | C1.NREC.09 |
| C1-06 | D1-06 | Flash Đếm Nhanh (Subitizing) | `tpl-flash-recall` | C1.CNT.11 |
| C1-07 | D1-07 | Đoán Nhanh Chấm (Dot Flash) | `tpl-flash-recall` | C1.CNT.09 |
| C1-08 | D1-08 | Ghép đôi Số-Chấm | `tpl-pair-match` | C1.NREC.05 |
| C1-09 | D1-09 | Đếm ngược | `tpl-drag-to-order` | C1.CNT.04 |
| C1-10 | D1-10 | Đếm Nhảy cóc | `tpl-tap-count` | C1.CNT.05 |
| C1-11 | D1-11 | Số Đang Trốn | `tpl-tap-select` | C1.NREC.12 |
| C1-12 | D1-12 | Phép trừ Trực quan | `tpl-drag-to-container` | C1.SUB.01 |
| C1-13 | D5-01 | So sánh Kích thước | `tpl-tap-select` | C1.CMP.01 · C1.MEAS.01 |
| C1-14 | D5-02 | So sánh Cao/Thấp | `tpl-tap-select` | C1.MEAS.02 |
| C1-15 | D5-03 | So sánh Nặng/Nhẹ (Cân) | `tpl-balance` | C1.MEAS.03 |
| C1-16 | D5-04 | Đo bằng Đơn vị phi chuẩn | `tpl-drag-to-order` | C1.MEAS.08 |
| C1-17 | D5-05 | Đo bằng Thước | `tpl-drag-to-slot` | C1.MEAS.09 |
| C1-18 | D5-06 | Sắp xếp Trật tự kích thước | `tpl-drag-to-order` | C1.MEAS.15 |
| C1-19 | D5-07 | Thời gian: Trước/Sau | `tpl-sequence-arrange` | C1.MEAS.10 |
| C1-20 | D5-08 | Thời gian: Đồng hồ | `tpl-clock-set` | C1.MEAS.13 |
| C1-21 | D5-09 | Nhiều/Ít chất lỏng | `tpl-tap-select` | C1.MEAS.05 |
| C1-22 | D5-10 | Tiền xu đơn giản | `tpl-coin-count` | C1.MEAS.14 |

## C2 — Spatial Thinking (11)

| Mới | Cũ | Tên | Template | Skill chính |
|---|---|---|---|---|
| C2-01 | D2-01 | Ghép hình vào Lỗ | `tpl-drag-to-slot` | C2.GEO.01 · C2.CON.01 |
| C2-02 | D2-02 | Tangram Ghép hình | `tpl-construct` | C2.CON.02 |
| C2-03 | D2-03 | Đối xứng Gương | `tpl-mirror-complete` | C2.MIR.01 |
| C2-04 | D2-04 | Xoay Mảnh ghép | `tpl-rotate-transform` | C2.ROT.01 |
| C2-05 | D2-05 | Phân loại Hình | `tpl-drag-to-container` | C3.CLS.02 · C2.GEO.04 |
| C2-06 | D2-06 | Hình 3D → 2D | `tpl-tap-select` | C2.PER.03 |
| C2-07 | D2-07 | Lắp ghép Robot/Nhà | `tpl-construct` | C2.CON.03 |
| C2-08 | D2-09 | Vẽ theo Nét chấm | `tpl-trace-path` | C1.NREC.08 · C2.GEO.01 |
| C2-09 | D2-10 | Lật hình (Reflection) | `tpl-rotate-transform` | C2.MIR.02 |
| C2-10 | D6-01 | Mê cung Đơn giản | `tpl-maze-route` | C2.MAZ.01 |
| C2-11 | D6-10 | Xếp Khối (Tower Stacking) | `tpl-construct` | C2.CON.04 |

## C3 — Logical Thinking (20)

| Mới | Cũ | Tên | Template | Skill chính |
|---|---|---|---|---|
| C3-01 | D3-01 | Tiếp nối Quy luật Màu | `tpl-drag-to-slot` | C1.PAT.10 · C3.RULE.02 |
| C3-02 | D3-02 | Điền Chỗ trống trong Chuỗi | `tpl-drag-to-slot` | C3.RULE.02 |
| C3-03 | D3-03 | Sắp xếp Thứ tự (Seriation) | `tpl-drag-to-order` | C3.SRT.01 |
| C3-04 | D3-04 | Quy luật Âm thanh (Nghe-Tap) | `tpl-listen-respond` | C1.PAT.01 · C4.MEM.04 |
| C3-05 | D3-05 | Tự Tạo Quy luật | `tpl-free-create` | C3.RULE.02 |
| C3-06 | D3-06 | Tạo Nhịp (Beat Maker) | `tpl-free-create` | C1.PAT.01 |
| C3-07 | D3-07 | Dệt Hoa văn (Weaving) | `tpl-drag-to-slot` | C1.PAT.05 |
| C3-08 | D3-08 | Chạm Nhạc cụ (Tap Pattern) | `tpl-listen-respond` | C4.MEM.04 |
| C3-09 | D4-01 | Phân nhóm theo Màu | `tpl-drag-to-container` | C3.CLS.01 |
| C3-10 | D4-02 | Phân nhóm theo Hình | `tpl-drag-to-container` | C3.CLS.02 |
| C3-11 | D4-03 | Phân nhóm theo Kích thước | `tpl-drag-to-container` | C3.CLS.03 |
| C3-12 | D4-04 | Phân nhóm Đa thuộc tính | `tpl-drag-to-container` | C3.CLS.06 |
| C3-13 | D4-05 | Tìm Kẻ lạ (Odd One Out) | `tpl-tap-select` | C3.DED.01 |
| C3-14 | D4-06 | Sắp xếp Thứ tự | `tpl-drag-to-order` | C3.SRT.02 |
| C3-15 | D4-07 | Thuộc về / Không thuộc | `tpl-tap-select` | C3.CLS.04 |
| C3-16 | D4-08 | Phân loại Đời thực | `tpl-drag-to-container` | C3.CLS.04 |
| C3-17 | D6-02 | Sudoku Hình (2×2, 3×3) | `tpl-grid-fill` | C3.MTX.01 · C3.MTX.02 |
| C3-18 | D6-03 | Nhân-Quả | `tpl-pair-match` | C3.INF.03 · C5.STO.04 |
| C3-19 | D6-07 | Thám Tử Logic (Logic Grid) | `tpl-logic-grid` | C3.DED.01 · C3.DED.02 |
| C3-20 | D6-08 | Cân bằng Phương trình Hình | `tpl-balance` | C1.NCOMP.11 · C3.DED.02 |

## C4 — Observation Thinking (3)

| Mới | Cũ | Tên | Template | Skill chính |
|---|---|---|---|---|
| C4-01 | D2-08 | Tìm hình Ẩn | `tpl-hidden-object` | C4.VIS.03 |
| C4-02 | D6-04 | Hoàn thiện Bức tranh | `tpl-drag-to-slot` | C4.VIS.04 · C3.INF.01 |
| C4-03 | D6-06 | Tìm Mẫu vật Ẩn | `tpl-hidden-object` | C4.VIS.03 |

## C5 — Language Thinking (1)

| Mới | Cũ | Tên | Template | Skill chính |
|---|---|---|---|---|
| C5-01 | D6-09 | Bài toán Có lời văn (Audio) | `tpl-listen-respond` | C5.LIS.03 · C1.PROB.06 |

## C6 — Executive Function (3)

| Mới | Cũ | Tên | Template | Skill chính |
|---|---|---|---|---|
| C6-01 | D1-13 | Ghi Nhớ (Flash Memory) | `tpl-flash-recall` | C6.WM.04 |
| C6-02 | D6-05 | Code Đường đi (Unplugged) | `tpl-maze-route` | C6.PLN.01 |
| C6-03 | D6-11 | Đối Ứng Vị Trí (Memory Grid) | `tpl-memory-flip` | C6.WM.03 |

---

## Game Template Library — trạng thái

21 template phủ được toàn bộ 60 game type hiện có. Trước migration, 60 game type
có **59 `mechanic` khác nhau** — tức gần như không tái sử dụng gì.

| Template | Base class engine | Game type dùng | Ghi chú |
|---|---|---:|---|
| `tpl-drag-to-container` | `DragDropSession` | 8 | Template dùng nhiều nhất |
| `tpl-drag-to-slot` | `DragDropSession` | 8 | |
| `tpl-drag-to-order` | `DragDropSession` | 5 | |
| `tpl-tap-select` | `TapSelectSession` | 8 | |
| `tpl-pair-match` | `DragDropSession` + `lineConnector` | 4 | Ví dụ kinh điển của tái sử dụng đa competency |
| `tpl-construct` | `DragDropSession` + `stackSystem` | 3 | |
| `tpl-flash-recall` | `TapSelectSession` + `timerSystem` | 3 | |
| `tpl-listen-respond` | `audioController` | 3 | |
| `tpl-rotate-transform` | `transformSystem` | 2 | |
| `tpl-balance` | `balanceSystem` | 2 | |
| `tpl-free-create` | `freeCreateSystem` | 2 | |
| `tpl-hidden-object` | `TapSelectSession` | 2 | |
| `tpl-maze-route` | `mazeSystem` | 2 | |
| `tpl-tap-count` | `TapSelectSession` | 1 | C1-10 (Đếm Nhảy cóc) |
| `tpl-memory-flip` | `cardSystem` | 1 | |
| `tpl-trace-path` | `trailSystem` | 1 | |
| `tpl-mirror-complete` | `mirrorSystem` | 1 | |
| `tpl-clock-set` | `clockSystem` | 1 | |
| `tpl-coin-count` | `DragDropSession` | 1 | Nên gộp vào `tpl-drag-to-container` sau |
| `tpl-grid-fill` | `slotSystem` | 1 | |
| `tpl-logic-grid` | `slotSystem` | 1 | |

**Template cần xây mới** để phủ khoảng trống taxonomy:

| Template | Phục vụ | Cần engine mới? |
|---|---|---|
| `tpl-spot-difference` | C4.VIS.01 và +12 skill C4 | Không — `tap-select` + hai canvas |
| `tpl-matrix-fill` | C3.MTX.* mở rộng | Không — `slotSystem` |
| `tpl-sequence-arrange` | C1.MEAS.10 · C5.STO.02 | Không — `DragDropSession` |
| `tpl-go-nogo` | C6.INH.03 · C6.INH.04 | **Có** — cần phản hồi khi trẻ *không* hành động |
| `tpl-rule-switch` | C6.FLX.01 · C6.FLX.02 · C6.FLX.03 | **Có** — cần đổi `validateAction` giữa session |

⇒ Tổng **26** template (21 đang dùng + 5 xây mới). Chỉ **2** trong số đó cần mở rộng
engine. 24 template còn lại chỉ cần `content_pack` + theme mới. Xem cảnh báo thiết kế trong
[`c6-executive-function.md`](c6-executive-function.md).

---

## Checklist thực thi migration

- [ ] Sinh `LEGACY_GAME_TYPE_MAP` từ bảng này (60 entry) → `packages/shared/src/constants/legacy-game-types.ts`
- [ ] Property test: song ánh, không id trùng, mọi id khớp regex `^C[1-6]-\d{2}$`
- [ ] Migration DB: `game_types.legacy_id` + đổi PK + cập nhật FK `game_levels.game_type_id`
- [ ] Codemod `scripts/migrate-game-ids.ts`: rename `handlers/d1..d6` → `c1..c6`, rewrite id literal, `registerD{n}Methods` → `registerC{n}Methods`
- [ ] Sửa regex `^(D\d+)` tại `packages/game-engine/src/gameTypeRegistry.ts:40`
- [ ] API resolver: id cũ → 301 sang id mới
- [ ] Đổi tên 98 file e2e `apps/web/tests/e2e/gameboard/d*-*.spec.ts` → `c*-*.spec.ts`
- [ ] Đổi tên 6 file `packages/db/src/seed-levels/d*-*.ts` → `c*-*.ts`
- [ ] `pnpm check` xanh · toàn bộ e2e xanh · 0 tham chiếu `D<n>-NN` còn sót ngoài map
