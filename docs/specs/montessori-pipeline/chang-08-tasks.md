# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 8: Thành Phố Mật Mã (WB08)

> **Căn cứ đặc tả:** [`chang-08-spec.md`](./chang-08-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-08/analysis.json` (*8 - Tach va gop pham vi 10.pdf*, 23 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 3 dạng bài chuẩn (`WB08-D1`, `WB08-D2`, `WB08-D3`) vào các game engine hiện tại (`GT-005` pair-match, `GT-007` number-bond, `GT-008` drag-to-slot, `GT-010` symbol-substitution), cập nhật bảng tra cứu dạng bài, bảng ánh xạ corpus, và tích hợp vào hệ thống database seeder kỹ năng `packages/content/src/skills/c1/` và `c3/` (`C1.ADD.01`, `C1.NCOMP.04`, `C1.NCOMP.10`, `C1.NCOMP.12`, `C3.RULE.01`, `C3.INF.01`).  
> **Bất biến cốt lõi:** **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori sequence $\ge 0101$ (`BR-MGL-02`). Phân tầng `access_tier` khớp đúng `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4: `premium`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Cập nhật Seeder C1.ADD.01 (Cộng bằng đồ vật: GL-C1-ADD-SLOT-0101)
   ├──> Task 4: Cập nhật Seeder C1.NCOMP.04 (Tách số 5: GL-C1-NCOMP-BOND-0131, GL-C1-NCOMP-PAIR-0101)
   ├──> Task 5: Cập nhật Seeder C1.NCOMP.10 (Gộp số: GL-C1-NCOMP-SLOT-0103, GL-C1-NCOMP-BOND-0132)
   ├──> Task 6: Cập nhật Seeder C1.NCOMP.12 (Number Bond: GL-C1-NCOMP-BOND-0133, GL-C1-NCOMP-SLOT-0104)
   ├──> Task 7: Cập nhật Seeder C3.RULE.01 (Tìm quy luật giao hoán & cân bằng: GL-C3-RULE-SLOT-0101)
   └──> Task 8: Cập nhật Seeder C3.INF.01 (Đoán ẩn số chung hệ ràng buộc: GL-C3-INF-SUB-0101)
         │
         └──> Task 9: Chạy Cổng Kiểm Thử & Verification Gates (typecheck, lint, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết Cho `montessori_code_implementer`

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ và cập nhật các hàng `WB08-D1`, `WB08-D2`, `WB08-D3` tại Mục 1 của tài liệu.
- **Hành động cụ thể:**
  1. Cập nhật các dòng của WB08 trong bảng:
     - `WB08-D1` | Band: `4-5` | C1 | `C1.NCOMP` | Lô: `B` | Khuôn: `GT-007` · `GT-008` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Cây tách gộp Number Bond phạm vi 10 (khuyết 1 nhánh con) & Mô hình Nhà số, Toa tàu số*
     - `WB08-D2` | Band: `4-5` | C1 | `C1.ADD` | Lô: `B` | Khuôn: `GT-008` · `GT-007` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Đếm trực quan từng phần & Gộp thành tổng (Phép gộp vật phẩm cơ khí Thành Phố Mật Mã)*
     - `WB08-D3` | Band: `4-5` | C3 | `C3.RULE` · `C3.INF` | Lô: `B` | Khuôn: `GT-005` · `GT-007` · `GT-008` · `GT-010` | Trạng thái: **Nhận (Lô B - A2)** | Tên: *Gộp hai phần tìm tổng, Ghép cặp biểu thức tương đương & Ẩn số chung tiền đại số*
  2. Cập nhật phần thống kê Lô A và Lô B ở Mục 2:
     - WB08 chuyển sang trạng thái đã nhận toàn bộ 3 dạng bài (chuyển WB08-D3 từ *Hoãn* sang *Nhận*).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng `WB08-D1`, `WB08-D2`, `WB08-D3` phản ánh chính xác các khuôn `GT-005`, `GT-007`, `GT-008`, `GT-010`.
  - [ ] Tuyệt đối không chứa mã khuôn `GT-038+`.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật hàng 08 tại Mục 7.1 phản ánh đúng các khuôn hiện hữu chạy được cho Chặng 8.
- **Hành động cụ thể:**
  1. Sửa dòng số 08 trong Bảng 7.1:
     ```markdown
     | 08 | Tách gộp phạm vi 10 & Thành phố mật mã | 4-5 | C1 | `C1.NCOMP` | `GT-005` ghép cặp chìa khóa | `GT-007` cây tách gộp · `GT-008` kéo vào ô khuyết · `GT-010` ẩn số chung |
     ```
  2. Bổ sung diễn giải năng lực số hóa: kết hợp giữa `GT-007` (Number Bond phân nhánh khuyết phần hoặc khuyết tổng), `GT-008` (Toa tàu số, Ngôi nhà số, Bàn cân thăng bằng), `GT-005` (Ghép cặp biểu thức cùng tổng) và `GT-010` (Đường dây mật mã tìm ẩn số chung).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 08 ghi nhận đầy đủ 4 khuôn `GT-005`, `GT-007`, `GT-008`, `GT-010`.
  - [ ] Tuân thủ `BR-MCM-06`, không đề cập đến bất kỳ thuật ngữ thương mại đo IQ nào.

---

### Task 3: Cập nhật Seeder `C1.ADD.01` (Cộng bằng đồ vật)
- **Tập tin:** `packages/content/src/skills/c1/add/C1.ADD.01.ts`
- **Mục tiêu:** Bổ sung ngữ liệu vật phẩm cơ khí Thành Phố Mật Mã vào dataset và khai báo 1 level plan chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung các item Chặng 8 vào dataset (ngọc kim cương lam 2 + hồng ngọc 1 = 3, chìa vàng 1 + chìa tím 3 = 4, bánh răng cam 2 + bánh răng lam 2 = 4, sao vàng 3 + sao tím 2 = 5).
  2. Cập nhật phrasing câu thoại của Thám tử Gấu Logic & Thỏ Quan Sát:
     - Prompt: *"Bé đếm từng nhóm rồi kéo số vào ô kết quả nhé!"*
     - Hint L2: *"Đếm từng nhóm vật phẩm trước rồi đếm tất cả nhé!"*
  3. Khai báo 1 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-ADD-SLOT-0101",
       template: "GT-008",
       band: "4-5",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB08-D2",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-ADD-SLOT-0101` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB08-D2"`.
  - [ ] `access_tier` khớp `difficulty` (1 = `free`).
  - [ ] Compile không lỗi typecheck.

---

### Task 4: Cập nhật Seeder `C1.NCOMP.04` (Tách số 5)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.04.ts`
- **Mục tiêu:** Bổ sung ngữ liệu ổ khóa số 5 và khai báo 2 level plan chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung quan hệ subset với ổ khóa số 5:
     ```typescript
     {
       type: "subset",
       source_id: "wb08_gold_star",
       target_id: "wb08_padlock_brass",
       metadata: { bond_id: "bond_5_2_3", part_a: 2, part_b: 3, whole: 5 }
     }
     ```
  2. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-NCOMP-BOND-0131",
       template: "GT-007",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "school",
       rounds: 3,
       montessori_ref: "WB08-D1",
     },
     {
       code: "GL-C1-NCOMP-PAIR-0101",
       template: "GT-005",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "school",
       rounds: 3,
       montessori_ref: "WB08-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-NCOMP-BOND-0131` và `GL-C1-NCOMP-PAIR-0101` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB08-D1"` và `"WB08-D3"`.
  - [ ] `access_tier: "login"` khớp `difficulty: 2`.

---

### Task 5: Cập nhật Seeder `C1.NCOMP.10` (Gộp số)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.10.ts`
- **Mục tiêu:** Bổ sung quan hệ gộp hai phần tìm tổng ở đỉnh và khai báo 2 level plan tương ứng.
- **Hành động cụ thể:**
  1. Bổ sung quan hệ subset tìm tổng đỉnh:
     ```typescript
     {
       type: "subset",
       source_id: "wb08_gold_key",
       target_id: "wb08_reasoning_gem",
       metadata: { bond_id: "bond_7_2_5", part_a: 2, part_b: 5, whole: 7 }
     }
     ```
  2. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-NCOMP-SLOT-0103",
       template: "GT-008",
       band: "4-5",
       difficulty: 1,
       access_tier: "free",
       theme: "art",
       rounds: 3,
       montessori_ref: "WB08-D2",
     },
     {
       code: "GL-C1-NCOMP-BOND-0132",
       template: "GT-007",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "school",
       rounds: 3,
       montessori_ref: "WB08-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-NCOMP-SLOT-0103` (diff 1, free) và `GL-C1-NCOMP-BOND-0132` (diff 2, login).
  - [ ] `montessori_ref: "WB08-D2"` và `"WB08-D3"`.

---

### Task 6: Cập nhật Seeder `C1.NCOMP.12` (Number Bond)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.12.ts`
- **Mục tiêu:** Bổ sung kho ngữ liệu Thành Phố Mật Mã và khai báo 2 level plan phạm vi 10 chuẩn mực.
- **Hành động cụ thể:**
  1. Bổ sung các item Chặng 8 vào dataset (Viên Ngọc Suy Luận, ổ khóa mạ đồng, bánh răng, chìa khóa mật).
  2. Bổ sung các quan hệ subset tạo thành 10:
     ```typescript
     {
       type: "subset",
       source_id: "wb08_orange_gear",
       target_id: "wb08_reasoning_gem",
       metadata: { bond_id: "bond_10_6_4", part_a: 6, part_b: 4, whole: 10 }
     },
     {
       type: "subset",
       source_id: "wb08_purple_key",
       target_id: "wb08_reasoning_gem",
       metadata: { bond_id: "bond_10_7_3", part_a: 7, part_b: 3, whole: 10 }
     }
     ```
  3. Cập nhật phrasing câu thoại:
     - Prompt: *"Biết tổng và một phần... bé hãy tìm phần còn lại để mở khóa nhé!"*
     - Hint L2: *"Đếm tiếp từ phần đã biết đến số trên mái nhà nhé!"*
  4. Khai báo 2 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C1-NCOMP-BOND-0133",
       template: "GT-007",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "school",
       rounds: 3,
       montessori_ref: "WB08-D1",
     },
     {
       code: "GL-C1-NCOMP-SLOT-0104",
       template: "GT-008",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "vehicle",
       rounds: 3,
       montessori_ref: "WB08-D1",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C1-NCOMP-BOND-0133` và `GL-C1-NCOMP-SLOT-0104` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB08-D1"`.
  - [ ] `access_tier: "standard"` khớp `difficulty: 3`.

---

### Task 7: Cập nhật Seeder `C3.RULE.01` (Tìm quy luật)
- **Tập tin:** `packages/content/src/skills/c3/rule/C3.RULE.01.ts`
- **Mục tiêu:** Bổ sung level plan quy luật giao hoán $a+b=b+a$ và bàn cân thăng bằng phương trình hai vế.
- **Hành động cụ thể:**
  1. Khai báo 1 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C3-RULE-SLOT-0101",
       template: "GT-008",
       band: "4-5",
       difficulty: 3,
       access_tier: "standard",
       theme: "school",
       rounds: 3,
       montessori_ref: "WB08-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C3-RULE-SLOT-0101` sequence $\ge 0101$.
  - [ ] `montessori_ref: "WB08-D3"`.
  - [ ] `access_tier: "standard"` khớp `difficulty: 3`.

---

### Task 8: Cập nhật Seeder `C3.INF.01` (Đoán vật/số còn thiếu)
- **Tập tin:** `packages/content/src/skills/c3/inf/C3.INF.01.ts`
- **Mục tiêu:** Khai báo 1 level plan Đường dây mật mã tìm ẩn số chung thỏa mãn hệ ràng buộc hai phương trình qua template `GT-010`.
- **Hành động cụ thể:**
  1. Khai báo 1 level plan mới vào mảng `levels`:
     ```typescript
     {
       code: "GL-C3-INF-SUB-0101",
       template: "GT-010",
       band: "4-5",
       difficulty: 4,
       access_tier: "premium",
       theme: "space",
       rounds: 3,
       montessori_ref: "WB08-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level `GL-C3-INF-SUB-0101` sequence $\ge 0101$.
  - [ ] `template: "GT-010"`.
  - [ ] `montessori_ref: "WB08-D3"`.
  - [ ] `access_tier: "premium"` khớp `difficulty: 4`.

---

### Task 9: Chạy Cổng Kiểm Thử & Verification Gates
- **Tập tin:** Không sửa đổi, chỉ chạy kiểm tra toàn hệ thống.
- **Mục tiêu:** Xác thực không có lỗi typecheck, linter hoặc vi phạm quy tắc Montessori.
- **Lệnh chạy:**
  ```bash
  pnpm check
  pnpm --filter @mindkid/content-build test tests/gates/montessori-corpus.test.ts
  ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Toàn bộ lệnh kiểm thử exit code 0.
  - [ ] Không có cảnh báo lỗi type `any` hay `unknown`.

---

## 3. Bảng Ma Trận Phân Bổ Game Level Kỹ Thuật

| STT | Mã Level (`code`) | Template | Skill Code | Band | Diff | Access Tier | Montessori Ref | Theme |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `GL-C1-ADD-SLOT-0101` | `GT-008` | `C1.ADD.01` | 4-5 | 1 | `free` | `WB08-D2` | `nature` |
| 2 | `GL-C1-NCOMP-SLOT-0103` | `GT-008` | `C1.NCOMP.10` | 4-5 | 1 | `free` | `WB08-D2` | `art` |
| 3 | `GL-C1-NCOMP-BOND-0131` | `GT-007` | `C1.NCOMP.04` | 4-5 | 2 | `login` | `WB08-D1` | `school` |
| 4 | `GL-C1-NCOMP-PAIR-0101` | `GT-005` | `C1.NCOMP.04` | 4-5 | 2 | `login` | `WB08-D3` | `school` |
| 5 | `GL-C1-NCOMP-BOND-0132` | `GT-007` | `C1.NCOMP.10` | 4-5 | 2 | `login` | `WB08-D3` | `school` |
| 6 | `GL-C1-NCOMP-BOND-0133` | `GT-007` | `C1.NCOMP.12` | 4-5 | 3 | `standard` | `WB08-D1` | `school` |
| 7 | `GL-C1-NCOMP-SLOT-0104` | `GT-008` | `C1.NCOMP.12` | 4-5 | 3 | `standard` | `WB08-D1` | `vehicle` |
| 8 | `GL-C3-RULE-SLOT-0101` | `GT-008` | `C3.RULE.01` | 4-5 | 3 | `standard` | `WB08-D3` | `school` |
| 9 | `GL-C3-INF-SUB-0101` | `GT-010` | `C3.INF.01` | 4-5 | 4 | `premium` | `WB08-D3` | `space` |

---

## 4. Hướng Dẫn Rollout & Definition of Done (DoD)

1. **Rollout Checklist**:
   - [ ] Hoàn thành Task 1 & Task 2 (đồng bộ tài liệu tra cứu corpus).
   - [ ] Hoàn thành Task 3..8 (cập nhật 6 file seeder kỹ năng).
   - [ ] Kiểm tra tính toàn vẹn của mã level: 100% mã có tiền tố `GL-`, hậu tố sequence $\ge 0101$.
   - [ ] Kiểm tra phân tầng `access_tier` khớp đúng `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4: `premium`).
   - [ ] Đảm bảo 100% không phát sinh engine mới `GT-038+`.
2. **Definition of Done (DoD)**:
   - File seeder biên dịch thành công, không có lỗi typecheck.
   - Thử nghiệm hiển thị giao diện qua web gameboard chạy mượt mà trên canvas logic 960x540 với tốc độ 60fps.
   - Hoàn tất và gửi báo cáo nghiệm thu cho Technical Lead.
