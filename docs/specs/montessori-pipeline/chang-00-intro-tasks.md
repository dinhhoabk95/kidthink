# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 0: Khởi Hành (WB00)

> **Căn cứ đặc tả:** [`chang-00-intro-spec.md`](./chang-00-intro-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-00-intro/analysis.json` (*A - Giới thiệu.pdf*)  
> **Mục tiêu cốt lõi:** Phổ biến 4 dạng bài mở đầu (`WB00-D1`..`WB00-D4`) vào các game engine hiện tại (`GT-000`, `GT-001`, `GT-008`), cập nhật bảng tra cứu, và tích hợp vào hệ thống seeder kỹ năng `packages/content/src/skills/c1/` và `c2/`.  
> **Bất biến:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori $\ge 0101$ (`BR-MGL-02`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Cập nhật Seeder C1.NREC.01 (GL-C1-NREC-INTRO-0101 / GT-000)
   ├──> Task 4: Cập nhật Seeder C1.OTO.01 (GL-C1-OTO-TAP-0101 / GT-001)
   ├──> Task 5: Cập nhật Seeder C1.NREC.09 (GL-C1-NREC-SLOT-0101 / GT-008)
   └──> Task 6: Cập nhật Seeder C2.SOL.01 (GL-C2-SOL-TAP-0101 / GT-001)
         │
         └──> Task 7: Chạy Cổng Kiểm Thử & Verification Gates (seed:check, typecheck)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Bổ sung 4 hàng dạng bài của Chặng 0 vào Bảng 1 và cập nhật số liệu tổng hợp tại Bảng 2.
- **Hành động cụ thể:**
  1. Thêm 4 hàng mới vào đầu danh mục dạng bài (ngay trước `WB01-D1`):
     - `WB00-D1` | Band: `3-4` | C1 | `C1.NREC` | Lô: `A` | Khuôn: `GT-000` | Trạng thái: **Nhận (Lô A)** | Tên: *Kể chuyện tương tác & Mở màn nhiệm vụ Chuyến Tàu Toán Học*
     - `WB00-D2` | Band: `3-4` | C1 | `C1.OTO` | Lô: `A` | Khuôn: `GT-001` | Trạng thái: **Nhận (Lô A)** | Tên: *Phát hiện lỗi bất tương thích Số - Lượng: Số 2 vs 3 quả táo*
     - `WB00-D3` | Band: `3-4` | C1 | `C1.NREC` | Lô: `B` | Khuôn: `GT-008` | Trạng thái: **Nhận (Lô B - A1)** | Tên: *Khôi phục trật tự dãy số 1–5 trên các bục đá bị đảo lộn*
     - `WB00-D4` | Band: `4-5` | C2 | `C2.SOL` | Lô: `A` | Khuôn: `GT-001` | Trạng thái: **Nhận (Lô A)** | Tên: *Nhận biết & Thu dọn các khối hình 3D ngổn ngang (Lập phương, Cầu, Trụ)*
  2. Cập nhật số liệu thống kê ở Mục 2:
     - Tăng tổng số dạng bài trong nguồn: $59 \rightarrow 63$ (thêm 4 dạng Chặng 0).
     - Tăng số dạng bài Lô A nhận: $20 \rightarrow 23$ (thêm D1, D2, D4).
     - Tăng số dạng bài Lô B nhận: $14 \rightarrow 15$ (thêm D3).
     - Tổng nhận đợt này: $34 \rightarrow 38$.
     - Số workbook: $21 \rightarrow 22$ (tính cả WB00).
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng tra cứu hiển thị đầy đủ 4 mã `WB00-D1`..`WB00-D4`.
  - [ ] Các cột Band, Competency, Strand, Khuôn đề xuất khớp 100% với `chang-00-intro-spec.md`.
  - [ ] Thống kê khớp đúng phép cộng đại số.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Bổ sung hàng Chặng 0 (`WB00`) vào Bảng 7.1.
- **Hành động cụ thể:**
  1. Thêm dòng sau vào đầu bảng ánh xạ ở Mục 7.1:
     ```markdown
     | 00 | Giới thiệu & Khởi hành | 3-4 | C1 | `C1.NREC` · `C1.OTO` · `C2.SOL` | `GT-000` · `GT-001` | `GT-008` kéo vào ô khuyết |
     ```
  2. Bổ sung chú thích giải thích vai trò của Chặng 0 trong việc dẫn dắt cốt truyện 20 Mảnh Đường Ray Ánh Sáng và khôi phục trật tự Vương quốc Số.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng 7.1 có hàng 00 với đầy đủ các strand `C1.NREC`, `C1.OTO`, `C2.SOL` và các khuôn `GT-000`, `GT-001`, `GT-008`.
  - [ ] Không có bất kỳ tham chiếu nào tới từ khóa thương mại bị cấm (IQ, Raven) tuân thủ `BR-MCM-06`.

---

### Task 3: Bổ sung SkillLevelPlan `GL-C1-NREC-INTRO-0101` vào Seeder `C1.NREC.01`
- **Tập tin:** `packages/content/src/skills/c1/nrec/C1.NREC.01.ts`
- **Mục tiêu:** Tích hợp level kể chuyện mở đầu `WB00-D1` trên nền `GT-000`.
- **Hành động cụ thể:**
  1. Khai báo dataset chủ đề mở đầu `CHANG_00_PROLOGUE_DATASET` (hoặc tái sử dụng cấu trúc `SkillDataset`) mang các item: `rainbow_tree`, `magic_letter`, `light_rail`, `bear_logic`, `rabbit_scout`.
  2. Thêm một phần tử vào mảng `C1_NREC_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-NREC-INTRO-0101",
       template: "GT-000",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 1,
       montessori_ref: "WB00-D1",
       dataset: CHANG_00_PROLOGUE_DATASET,
       sequence_no: 1,
       skill_codes: ["C1.NREC.01", "C1.NREC.02"],
     }
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level đúng chuẩn `GL-C1-NREC-INTRO-0101` (sequence $\ge 0101$).
  - [ ] `montessori_ref: "WB00-D1"`.
  - [ ] `access_tier: "free"` khớp `difficulty: 1`.
  - [ ] Chạy `pnpm --filter @mindkid/content typecheck` không có lỗi.

---

### Task 4: Bổ sung SkillLevelPlan `GL-C1-OTO-TAP-0101` vào Seeder `C1.OTO.01`
- **Tập tin:** `packages/content/src/skills/c1/oto/C1.OTO.01.ts`
- **Mục tiêu:** Tích hợp bài toán sửa lỗi Số 2 vs 3 quả táo (`WB00-D2`) trên nền `GT-001`.
- **Hành động cụ thể:**
  1. Bổ sung các item quả táo đỏ và bục đá số 2 vào dataset kỹ năng `C1.OTO.01` (hoặc định nghĩa `CHANG_00_APPLES_MISMATCH_DATASET`).
  2. Thêm một phần tử vào mảng `C1_OTO_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-OTO-TAP-0101",
       template: "GT-001",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB00-D2",
     }
     ```
  3. Cung cấp câu hỏi prompt tiếng Việt: *"Bục đá mang số 2. Bé hãy chọn đĩa có đúng 2 quả táo để giúp bạn Thỏ nhé!"*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level đúng chuẩn `GL-C1-OTO-TAP-0101`.
  - [ ] `montessori_ref: "WB00-D2"`.
  - [ ] `access_tier: "free"`, `difficulty: 1`.
  - [ ] Mồi nhử và đáp án đúng phân biệt rõ ràng (đĩa 1, 2, 3 quả táo).

---

### Task 5: Bổ sung SkillLevelPlan `GL-C1-NREC-SLOT-0101` vào Seeder `C1.NREC.09`
- **Tập tin:** `packages/content/src/skills/c1/nrec/C1.NREC.09.ts`
- **Mục tiêu:** Tích hợp thử thách kéo thả khôi phục trật tự 5 bục đá 1–5 (`WB00-D3`) trên nền `GT-008`.
- **Hành động cụ thể:**
  1. Kiểm tra kho inventory `numeralItem` các số từ `1` đến `5`.
  2. Thêm một phần tử vào mảng `C1_NREC_09_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-NREC-SLOT-0101",
       template: "GT-008",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "railway",
       rounds: 2,
       montessori_ref: "WB00-D3",
     }
     ```
  3. Cấu hình prompt: *"Bão Lộn Xộn làm đảo lộn bục đá! Bé hãy kéo các con số vào 5 bục đá theo đúng thứ tự từ 1 đến 5 nhé!"*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level đúng chuẩn `GL-C1-NREC-SLOT-0101`.
  - [ ] `montessori_ref: "WB00-D3"`.
  - [ ] `access_tier: "login"` khớp `difficulty: 2`.
  - [ ] Bố cục 5 bục đá ngang (`horizontal-slot-track`), hỗ trợ đầy đủ tap-tap fallback.

---

### Task 6: Bổ sung SkillLevelPlan `GL-C2-SOL-TAP-0101` vào Seeder `C2.SOL.01`
- **Tập tin:** `packages/content/src/skills/c2/sol/C2.SOL.01.ts`
- **Mục tiêu:** Tích hợp thử thách thu dọn khối hình 3D (Lập phương, Cầu, Trụ) (`WB00-D4`) trên nền `GT-001`.
- **Hành động cụ thể:**
  1. Bổ sung các item 3D: `cube_blue` (Khối lập phương xanh), `sphere_purple` (Khối cầu tím), `cylinder_gold` (Khối trụ vàng).
  2. Thêm một phần tử vào mảng `C2_SOL_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C2-SOL-TAP-0101",
       template: "GT-001",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB00-D4",
     }
     ```
  3. Cấu hình prompt: *"Bé hãy chạm vào khối lập phương màu xanh lam để cất vào hòm đồ nhé!"*.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level đúng chuẩn `GL-C2-SOL-TAP-0101`.
  - [ ] `montessori_ref: "WB00-D4"`.
  - [ ] `access_tier: "login"` khớp `difficulty: 2`.
  - [ ] 3 khối hình 3D phân biệt rõ ràng về hình dạng và màu sắc.

---

### Task 7: Xác Thực và Kiểm Thử Tự Động (Verification Gates)
- **Tập tin liên quan:** Toàn bộ codebase
- **Mục tiêu:** Đảm bảo toàn bộ seed level mới vượt qua các cổng chất lượng và không phá vỡ bất kỳ quy tắc nào.
- **Lệnh thực thi:**
  1. Typecheck toàn bộ workspace:
     ```bash
     pnpm check
     ```
  2. Kiểm tra seeder builder và bộ cổng Montessori:
     ```bash
     pnpm --filter @mindkid/content-build seed:check
     ```
  3. Chạy vitest cổng Montessori:
     ```bash
     pnpm --filter @mindkid/content-build test tests/gates/montessori-corpus.test.ts
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] `pnpm check` exit 0 (zero errors, zero warnings).
  - [ ] `seed:check` pass xanh 100%, không vi phạm quota limits hay tier mismatch.
  - [ ] `montessori-corpus.test.ts` pass xanh.

---

## 3. Bảng Phân Công & Tình Trạng Nghiệm Thu

| Task | Hạng mục | Người thực hiện | Trạng thái | Ghi chú |
|---|---|---|:---:|---|
| Task 1 | Cập nhật `activity-types-table.md` | `montessori_code_implementer` | Sẵn sàng | Thêm `WB00-D1`..`WB00-D4` |
| Task 2 | Cập nhật `montessori-corpus-mapping.md` | `montessori_code_implementer` | Sẵn sàng | Thêm hàng WB00 |
| Task 3 | Seeder `GL-C1-NREC-INTRO-0101` (`GT-000`) | `montessori_code_implementer` | Sẵn sàng | Free tier, Diff 1 |
| Task 4 | Seeder `GL-C1-OTO-TAP-0101` (`GT-001`) | `montessori_code_implementer` | Sẵn sàng | Free tier, Diff 1 |
| Task 5 | Seeder `GL-C1-NREC-SLOT-0101` (`GT-008`) | `montessori_code_implementer` | Sẵn sàng | Login tier, Diff 2 |
| Task 6 | Seeder `GL-C2-SOL-TAP-0101` (`GT-001`) | `montessori_code_implementer` | Sẵn sàng | Login tier, Diff 2 |
| Task 7 | Chạy Verification Gates | `montessori_code_implementer` | Sẵn sàng | `seed:check` & `pnpm check` |
