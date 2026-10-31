# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 13: Học Viện Thám Tử Số Học (WB13)

> **Căn cứ đặc tả:** [`chang-13-spec.md`](./chang-13-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-13/analysis.json` (*13 - Hoc vien tham tu so hoc.pdf*, 23 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 3 dạng bài chuẩn (`WB13-D1`, `WB13-D2`, `WB13-D3`) vào các game engine hiện tại (`GT-007` number-bond, `GT-008` drag-to-slot, `GT-003` drag-to-container), cập nhật bảng tra cứu dạng bài, bảng ánh xạ corpus, và tích hợp vào hệ thống database seeder kỹ năng `packages/content/src/skills/c1/` (`C1.NCOMP.08`, `C1.NCOMP.09`, `C1.NCOMP.10`, `C1.ADD.05`, `C1.SUB.05`).  
> **Bất biến cốt lõi:** **TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`**. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori sequence $\ge 0101$ (`BR-MGL-02`). Phân tầng `access_tier` khớp đúng `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4/5: `premium`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Cập nhật Seeder C1.NCOMP.09 (Tách số 10: CONT-0101, SLOT-0106, sửa access_tier 0129, 0130)
   ├──> Task 4: Cập nhật Seeder C1.NCOMP.08 (Tách số 9: BOND-0131, SLOT-0105)
   ├──> Task 5: Cập nhật Seeder C1.NCOMP.10 (Gộp số: CONT-0102, BOND-0134)
   ├──> Task 6: Cập nhật Seeder C1.ADD.05 (Cộng phạm vi 10: SLOT-0102, BOND-0101)
   └──> Task 7: Cập nhật Seeder C1.SUB.05 (Tìm số còn lại: SLOT-0101, BOND-0101)
         │
         └──> Task 8: Chạy Cổng Kiểm Thử & Verification Gates (typecheck, lint, montessori-gate)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết Cho `montessori_code_implementer`

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Đồng bộ và cập nhật các hàng `WB13-D1`, `WB13-D2`, `WB13-D3` tại Mục 1 của tài liệu để phản ánh đúng nội dung chiến lược Make-10 trong phạm vi 20 từ PDF Chặng 13.
- **Hành động cụ thể:**
  1. Cập nhật các dòng của WB13 trong Bảng Mục 1:
     - `WB13-D1` | Band: `4-6` | C1 | `C1.NCOMP` · `C1.SUB` | Lô: `B` | Khuôn: `GT-007` · `GT-008` · `GT-003` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Phân rã 4 bước đưa về 10 tường minh (Chiến lược Make-10 trong phạm vi 20)*
     - `WB13-D2` | Band: `4-6` | C1 | `C1.NCOMP` · `C1.SUB` | Lô: `B` | Khuôn: `GT-007` · `GT-008` · `GT-003` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Điền khuyết dấu vết & Sơ đồ phân nhánh Number Bond (Faded Scaffolding Schema)*
     - `WB13-D3` | Band: `4-6` | C1 | `C1.SUB` · `C1.NCOMP` | Lô: `B` | Khuôn: `GT-007` · `GT-008` · `GT-001` | Trạng thái: **Nhận (Lô B - A2)** | Tên: *Tự kiểm chứng hai dòng, Phân định Đúng/Sai & Sửa một con số ghi sai trong hồ sơ*
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Các hàng `WB13-D1`, `WB13-D2`, `WB13-D3` phản ánh chính xác các khuôn `GT-007`, `GT-008`, `GT-003` (kèm `GT-001` bổ trợ).
  - [ ] Tuyệt đối không chứa bất kỳ mã khuôn `GT-038+` nào.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật hàng 13 tại Mục 7.1 phản ánh đúng các khuôn hiện hữu chạy được cho Chặng 13.
- **Hành động cụ thể:**
  1. Sửa dòng số 13 trong Bảng 7.1:
     ```markdown
     | 13 | Học viện thám tử số học — Trừ qua 10 phạm vi 20 | 4-6 | C1 | `C1.NCOMP` · `C1.SUB` | — | `GT-007` cây tách gộp · `GT-008` kéo vào ô khuyết · `GT-003` kéo vào giỏ |
     ```
  2. Cập nhật phần diễn giải năng lực số hóa: Khai thác kết hợp giữa `GT-007` (Number Bond phân nhánh số trừ), `GT-008` (Kéo thẻ số vào 4 dòng phân rã Make-10 và nhập mật mã 6 ô tủ chứng cứ), và `GT-003` (Kéo phân loại vật phẩm manh mối vào rổ chạm 10 và rổ trừ tiếp).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng 13 ghi nhận đầy đủ 3 khuôn `GT-007`, `GT-008`, `GT-003`.
  - [ ] Tuân thủ `BR-MCM-06`, không đề cập đến bất kỳ thuật ngữ thương mại đo IQ nào.

---

### Task 3: Cập nhật Seeder `C1.NCOMP.09` (Tách số 10)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.09.ts`
- **Mục tiêu:** Bổ sung ngữ liệu vật phẩm thám tử Chặng 13, bổ sung `access_tier` cho 2 level cũ, và khai báo 2 level plans mới.
- **Hành động cụ thể:**
  1. Bổ sung các vật phẩm thám tử Chặng 13 vào dataset items:
     - `wb13_magnifying_glass` (kính lúp điều tra: 🔍)
     - `wb13_case_clipboard` (kẹp hồ sơ phá án: 📋)
     - `wb13_golden_pin` (ghim vàng manh mối: 📌)
     - `wb13_ten_milestone` (mốc tròn 10 thám tử: 🔟)
     - `wb13_arithmetic_gem` (Viên Ngọc Số Học tím: 💎)
  2. Bổ sung quan hệ `decomposition` mở khóa mốc 10.
  3. Cập nhật mảng `levels` trong `C1_NCOMP_09_SEED`:
     - Sửa `GL-C1-NCOMP-BOND-0129`: thêm `access_tier: "standard"`.
     - Sửa `GL-C1-NCOMP-BOND-0130`: thêm `access_tier: "premium"`.
     - Bổ sung 2 level plans mới:
       ```typescript
       {
         code: "GL-C1-NCOMP-CONT-0101",
         template: "GT-003",
         band: "4-5",
         difficulty: 2,
         access_tier: "login",
         theme: "job",
         rounds: 3,
         montessori_ref: "WB13-D1",
       },
       {
         code: "GL-C1-NCOMP-SLOT-0106",
         template: "GT-008",
         band: "5-6",
         difficulty: 3,
         access_tier: "standard",
         theme: "job",
         rounds: 3,
         montessori_ref: "WB13-D2",
       }
       ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mọi level Montessori đều có `access_tier` khớp `difficulty`.
  - [ ] Mã level sequence $\ge 0101$.
  - [ ] TypeScript compile thành công.

---

### Task 4: Cập nhật Seeder `C1.NCOMP.08` (Tách số 9)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.08.ts`
- **Mục tiêu:** Bổ sung ngữ liệu phân rã số trừ 9 và khai báo 2 level plans chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung các vật phẩm thám tử Chặng 13 vào dataset items (`wb13_case_folder`, `wb13_number_stamp`).
  2. Thêm các quan hệ phân rã số 9 ($9 = 1+8, 2+7, 3+6, 4+5, 5+4, 6+3, 7+2, 8+1$).
  3. Bổ sung 2 level plans vào `C1_NCOMP_08_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-NCOMP-BOND-0131",
       template: "GT-007",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "job",
       rounds: 3,
       montessori_ref: "WB13-D1",
     },
     {
       code: "GL-C1-NCOMP-SLOT-0105",
       template: "GT-008",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "job",
       rounds: 3,
       montessori_ref: "WB13-D2",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Level sequence `0131` và `0105` không trùng lặp.
  - [ ] `access_tier` khớp đúng (3 = `standard`, 4 = `premium`).

---

### Task 5: Cập nhật Seeder `C1.NCOMP.10` (Gộp số)
- **Tập tin:** `packages/content/src/skills/c1/ncomp/C1.NCOMP.10.ts`
- **Mục tiêu:** Bổ sung ngữ liệu kiểm tra gộp hoàn nguyên số trừ và khai báo 2 level plans chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung ngữ liệu hồ sơ thám tử vào dataset.
  2. Bổ sung 2 level plans vào `C1_NCOMP_10_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-NCOMP-CONT-0102",
       template: "GT-003",
       band: "4-5",
       difficulty: 1,
       access_tier: "free",
       theme: "job",
       rounds: 3,
       montessori_ref: "WB13-D1",
     },
     {
       code: "GL-C1-NCOMP-BOND-0134",
       template: "GT-007",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "job",
       rounds: 3,
       montessori_ref: "WB13-D2",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Level `GL-C1-NCOMP-CONT-0102` đạt `difficulty: 1` và `access_tier: "free"`.
  - [ ] Level `GL-C1-NCOMP-BOND-0134` đạt `difficulty: 2` và `access_tier: "login"`.

---

### Task 6: Cập nhật Seeder `C1.ADD.05` (Cộng trong phạm vi 10)
- **Tập tin:** `packages/content/src/skills/c1/add/C1.ADD.05.ts`
- **Mục tiêu:** Bổ sung bài toán cộng bù mốc 10 và khai báo 2 level plans chuẩn Montessori.
- **Hành động cụ thể:**
  1. Bổ sung ngữ liệu thám tử Chặng 13 vào dataset items.
  2. Bổ sung 2 level plans vào `C1_ADD_05_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-ADD-SLOT-0102",
       template: "GT-008",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "job",
       rounds: 3,
       montessori_ref: "WB13-D2",
     },
     {
       code: "GL-C1-ADD-BOND-0101",
       template: "GT-007",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "job",
       rounds: 3,
       montessori_ref: "WB13-D1",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `access_tier` khớp `difficulty` (3 = `standard`, 4 = `premium`).
  - [ ] Sequence $\ge 0101$.

---

### Task 7: Cập nhật Seeder `C1.SUB.05` (Tìm số còn lại)
- **Tập tin:** `packages/content/src/skills/c1/sub/C1.SUB.05.ts`
- **Mục tiêu:** Bổ sung bài toán trừ từ 10 tìm số còn lại và phát hiện sửa số sai trong hồ sơ.
- **Hành động cụ thể:**
  1. Bổ sung ngữ liệu thám tử Chặng 13 và chuỗi mật mã 6 số ($5-4-7-3-8-6$).
  2. Bổ sung 2 level plans vào `C1_SUB_05_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-SUB-SLOT-0101",
       template: "GT-008",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "job",
       rounds: 3,
       montessori_ref: "WB13-D2",
     },
     {
       code: "GL-C1-SUB-BOND-0101",
       template: "GT-007",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "job",
       rounds: 3,
       montessori_ref: "WB13-D3",
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `montessori_ref: "WB13-D3"` cho bài kiểm tra sửa số sai.
  - [ ] `access_tier` khớp đúng (3 = `standard`, 4 = `premium`).

---

### Task 8: Chạy Cổng Kiểm Thử & Verification Gates
- **Hành động cụ thể:**
  1. Chạy lint an toàn: `pnpm lint:safe`.
  2. Chạy typecheck toàn bộ workspace: `pnpm check:types` hoặc `pnpm --filter @mindkid/content typecheck`.
  3. Chạy cổng kiểm tra seeder: `pnpm --filter @mindkid/content-build seed:check`.
  4. Chạy vitest cổng Montessori corpus: `pnpm vitest run packages/content-build/tests/gates/montessori-corpus.test.ts`.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Tất cả các lệnh kiểm tra kết thúc với mã thoát 0 (exit code 0).
  - [ ] 0 lỗi typecheck, 0 lỗi lint.
  - [ ] Cổng corpus Montessori xanh 100%.
