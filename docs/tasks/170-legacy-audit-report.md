# Báo cáo Audit Phủ Game Type V1 — Task #170 (Bậc 0)

> **Chương trình:** [`Task #168`](168-v1-game-list-integration-plan.md) — Tích hợp 60 game type v1 vào v2.  
> **Kế hoạch:** [`170-legacy-v1-traceability-spine-plan.md`](170-legacy-v1-traceability-spine-plan.md).  
> **Spec sở hữu:** [`docs/specs/08-quality/legacy-v1-coverage.md`](../specs/08-quality/legacy-v1-coverage.md).  
> **Ngày thực hiện:** 2026-09-01  
> **Trạng thái cổng Bậc 0:** ĐẠT 20 / 60 game types (ngưỡng sàn: 20/60).

---

## 1. Tổng quan số đo Bậc 0

| Chỉ số | Giá trị | Ghi chú |
|---|---|---|
| **Tổng game types v1** | **60** | Định nghĩa tại `packages/shared/src/constants/legacy-v1-game-types.ts` |
| **Số game types đã có level hợp lệ (≥1 level)** | **20 / 60** (33.3%) | 90 levels từ `seed-gt028`..`seed-gt036` + 35 levels từ `c1`..`c6/levels.ts` |
| **Tổng số level mang `legacy_v1_ref` hợp lệ** | **125** | 100% qua `content_contract` của template |
| **Số game types chưa có level (0 level)** | **40 / 60** | Sẽ được sinh qua 6 task đợt 2 (Task #175–#180) |
| **Ngưỡng Bậc 0 kích hoạt** | **20** | `packages/db/config/legacy-v1-coverage.json` |

---

## 2. Bảng chi tiết 60 Game Types V1

| Mã v1 | Mã v2 | Template | Số level hợp lệ | Trạng thái Bậc 0 | Lý do nếu 0 level |
|---|---|---|---|---|---|
| `D1-01` | `C1-01` | `GT-003` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-003 (Task #175) |
| `D1-02` | `C1-02` | `GT-005` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-005 (Task #176) |
| `D1-03` | `C1-03` | `GT-001` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-001 (Task #175) |
| `D1-04` | `C1-04` | `GT-003` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-003 (Task #175) |
| `D1-05` | `C1-05` | `GT-008` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-008 (Task #175) |
| `D1-06` | `C1-06` | `GT-012` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-012 (Task #177) |
| `D1-07` | `C1-07` | `GT-012` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-012 (Task #177) |
| `D1-08` | `C1-08` | `GT-005` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-005 (Task #176) |
| `D1-09` | `C1-09` | `GT-006` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-006 (Task #176) |
| `D1-10` | `C1-10` | `GT-028` | 10 | ✅ ĐẠT | 10 level chuẩn từ `seed-gt028.ts` |
| `D1-11` | `C1-11` | `GT-001` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-001 (Task #175) |
| `D1-12` | `C1-12` | `GT-029` | 10 | ✅ ĐẠT | 10 level chuẩn từ `seed-gt029.ts` |
| `D5-01` | `C1-13` | `GT-001` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-001 (Task #175) |
| `D5-02` | `C1-14` | `GT-001` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-001 (Task #175) |
| `D5-03` | `C1-15` | `GT-014` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-014 (Task #178) |
| `D5-04` | `C1-16` | `GT-030` | 10 | ✅ ĐẠT | 10 level chuẩn từ `seed-gt030.ts` |
| `D5-05` | `C1-17` | `GT-008` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-008 (Task #175) |
| `D5-06` | `C1-18` | `GT-006` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-006 (Task #176) |
| `D5-07` | `C1-19` | `GT-006` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-006 (Task #176) |
| `D5-08` | `C1-20` | `GT-016` | 3 | ✅ ĐẠT | 3 level từ `c1/levels.ts` (GL-C1-CLK-HND-0037..0039) |
| `D5-09` | `C1-21` | `GT-032` | 10 | ✅ ĐẠT | 10 level chuẩn từ `seed-gt032.ts` |
| `D5-10` | `C1-22` | `GT-031` | 10 | ✅ ĐẠT | 10 level chuẩn từ `seed-gt031.ts` |
| `D2-01` | `C2-01` | `GT-008` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-008 (Task #175) |
| `D2-02` | `C2-02` | `GT-023` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-023 (Task #178) |
| `D2-03` | `C2-03` | `GT-021` | 3 | ✅ ĐẠT | 3 level từ `c2/levels.ts` (GL-C2-MIR-COMP-0024..0026) |
| `D2-04` | `C2-04` | `GT-019` | 3 | ✅ ĐẠT | 3 level từ `c2/levels.ts` (GL-C2-ROT-TRANS-0021..0023) |
| `D2-05` | `C2-05` | `GT-003` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-003 (Task #175) |
| `D2-06` | `C2-06` | `GT-001` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-001 (Task #175) |
| `D2-07` | `C2-07` | `GT-023` | 3 | ✅ ĐẠT | 3 level từ `c2/levels.ts` (GL-C2-CON-SHP-0027..0029) |
| `D2-09` | `C2-08` | `GT-024` | 3 | ✅ ĐẠT | 3 level từ `c2/levels.ts` (GL-C2-TRC-PTH-0030..0032) |
| `D2-10` | `C2-09` | `GT-019` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-019 (Task #177) |
| `D6-01` | `C2-10` | `GT-013` | 3 | ✅ ĐẠT | 3 level từ `c6/levels.ts` (GL-C6-PLN-MAZE-0021..0023) |
| `D6-10` | `C2-11` | `GT-023` | 3 | ✅ ĐẠT | 3 level từ `c2/levels.ts` (GL-C2-BLK-STK-0033..0035) |
| `D3-01` | `C3-01` | `GT-008` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-008 (Task #175) |
| `D3-02` | `C3-02` | `GT-008` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-008 (Task #175) |
| `D3-03` | `C3-03` | `GT-006` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-006 (Task #176) |
| `D3-04` | `C3-04` | `GT-018` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-018 (Task #177) |
| `D3-05` | `C3-05` | `GT-036` | 10 | ✅ ĐẠT | 10 level chuẩn từ `seed-gt036.ts` |
| `D3-06` | `C3-06` | `GT-034` | 10 | ✅ ĐẠT | 10 level chuẩn từ `seed-gt034.ts` |
| `D3-07` | `C3-07` | `GT-033` | 10 | ✅ ĐẠT | 10 level chuẩn từ `seed-gt033.ts` |
| `D3-08` | `C3-08` | `GT-018` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-018 (Task #177) |
| `D4-01` | `C3-09` | `GT-003` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-003 (Task #175) |
| `D4-02` | `C3-10` | `GT-003` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-003 (Task #175) |
| `D4-03` | `C3-11` | `GT-003` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-003 (Task #175) |
| `D4-04` | `C3-12` | `GT-003` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-003 (Task #175) |
| `D4-05` | `C3-13` | `GT-001` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-001 (Task #175) |
| `D4-06` | `C3-14` | `GT-006` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-006 (Task #176) |
| `D4-07` | `C3-15` | `GT-001` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-001 (Task #175) |
| `D4-08` | `C3-16` | `GT-003` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-003 (Task #175) |
| `D6-02` | `C3-17` | `GT-015` | 3 | ✅ ĐẠT | 3 level từ `c3/levels.ts` (GL-C3-SUD-MIN-0027..0029) |
| `D6-03` | `C3-18` | `GT-005` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-005 (Task #176) |
| `D6-07` | `C3-19` | `GT-009` | 3 | ✅ ĐẠT | 3 level từ `c3/levels.ts` (GL-C3-CLU-DED-0021..0023) |
| `D6-08` | `C3-20` | `GT-014` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-014 (Task #178) |
| `D2-08` | `C4-01` | `GT-022` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-022 (Task #178) |
| `D6-04` | `C4-02` | `GT-008` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-008 (Task #175) |
| `D6-06` | `C4-03` | `GT-022` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-022 (Task #178) |
| `D6-09` | `C5-01` | `GT-018` | 3 | ✅ ĐẠT | 3 level từ `c5/levels.ts` (GL-C5-LIS-AUDIO-0021..0023) |
| `D1-13` | `C6-01` | `GT-012` | 0 | ❌ Chưa phủ | Chờ sinh batch GT-012 (Task #177) |
| `D6-05` | `C6-02` | `GT-035` | 10 | ✅ ĐẠT | 10 level chuẩn từ `seed-gt035.ts` |
| `D6-11` | `C6-03` | `GT-020` | 5 | ✅ ĐẠT | 5 level từ `c2`..`c6/levels.ts` (GL-C6-MEM-CMP-0015, etc.) |

---

## 3. Kế hoạch hoàn thiện 40 Game Types còn lại (Đợt 2: Task #175–#180)

1. **Task #175 (Lô GT-001, GT-003, GT-008 — 21 game types):**
   - `GT-003`: D1-01, D1-04, D2-05, D4-01, D4-02, D4-03, D4-04, D4-08 (80 levels)
   - `GT-001`: D1-03, D1-11, D5-01, D5-02, D2-06, D4-05, D4-07 (70 levels)
   - `GT-008`: D1-05, D5-05, D2-01, D3-01, D3-02, D6-04 (60 levels)
2. **Task #176 (Lô GT-005, GT-006 — 8 game types):**
   - `GT-005`: D1-02, D1-08, D6-03 (30 levels)
   - `GT-006`: D1-09, D5-06, D5-07, D3-03, D4-06 (50 levels)
3. **Task #177 (Lô GT-012, GT-018, GT-019 — 8 game types):**
   - `GT-012`: D1-06, D1-07, D1-13 (30 levels)
   - `GT-018`: D3-04, D3-08, D6-09 (30 levels)
   - `GT-019`: D2-04, D2-10 (20 levels)
4. **Task #178 (Lô GT-009, GT-013, GT-014, GT-015, GT-016, GT-020..024 — 14 game types):**
   - Phủ đủ ≥10 level cho các engine solver/geometry/logic còn lại.
