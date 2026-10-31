# Danh Sách Nhiệm Vụ Triển Khai (Tasks) — Chặng 4: Quảng Trường Số Lượng (WB04)

> **Căn cứ đặc tả:** [`chang-04-spec.md`](./chang-04-spec.md)  
> **Dữ liệu nguồn:** `docs/montessori/extracted/chang-04/analysis.json` (*Chuyến Tàu Toán Học Tập 4 - Quảng Trường Số Lượng*, 23 trang)  
> **Mục tiêu cốt lõi:** Phổ biến 3 dạng bài (`WB04-D1`, `WB04-D2`, `WB04-D3`) vào các game engine hiện tại (`GT-001`, `GT-028`, `GT-022`, `GT-000`), cập nhật bảng tra cứu dạng bài, bảng ánh xạ corpus, và tích hợp 11 level plans mới vào seeder kỹ năng `packages/content/src/skills/c1/`.  
> **Bất biến:** TUYỆT ĐỐI KHÔNG TẠO MỚI `GT-038+`. Không chứa từ khóa thương mại đo trí tuệ (IQ/Raven) theo `BR-MCM-06`. Mọi mã level Montessori $\ge 0101$ (`BR-MGL-02`). `access_tier` khớp `difficulty` (1: `free`, 2: `login`, 3: `standard`, 4/5: `premium`).

---

## 1. Sơ Đồ Trình Tự Thực Thi

```
Task 1: Cập nhật Bảng tra dạng bài (activity-types-table.md)
   │
   ├──> Task 2: Cập nhật Bảng ánh xạ corpus (montessori-corpus-mapping.md)
   │
   ├──> Task 3: Bổ sung Seeder C1.CNT.01 (GL-C1-CNT-TAP-0121, GL-C1-CNT-TCNT-0122, GL-C1-CNT-HIDE-0129)
   ├──> Task 4: Bổ sung Seeder C1.CNT.06 (GL-C1-CNT-TAP-0123)
   ├──> Task 5: Bổ sung Seeder C1.CNT.07 (GL-C1-CNT-TAP-0124, GL-C1-CNT-TCNT-0125, GL-C1-CNT-HIDE-0130)
   ├──> Task 6: Bổ sung Seeder C1.CMP.04 (GL-C1-CMP-TAP-0126, GL-C1-CMP-TAP-0127)
   └──> Task 7: Bổ sung Seeder C1.OTO.01 (GL-C1-OTO-TAP-0128, GL-C1-OTO-INTRO-0131)
         │
         └──> Task 8: Chạy Cổng Kiểm Thử & Verification Gates (typecheck, tests)
```

---

## 2. Danh Sách Nhiệm Vụ Chi Tiết

### Task 1: Cập nhật Bảng Tra Dạng Bài Montessori (`activity-types-table.md`)
- **Tập tin:** `docs/montessori/dataset/activity-types-table.md`
- **Mục tiêu:** Chuyển đổi định tuyến `WB04-D1`, `WB04-D2`, `WB04-D3` từ *Hoãn Lô B (GT-012)* sang **Nhận Lô A (`GT-001`, `GT-028`, `GT-022`, `GT-000`)** dựa trên phân tích thực tế 23 trang PDF.
- **Hành động cụ thể:**
  1. Cập nhật 3 dòng `WB04-D1`, `WB04-D2`, `WB04-D3` ở Bảng 1 thành:
     - `| WB04-D1 | 3-4 | C1 | C1.CNT | A | GT-001 · GT-028 | **Nhận (Lô A)** | Đếm đồ vật và chọn số đúng trong 3 thẻ số (1–12) |`
     - `| WB04-D2 | 3-4 | C1 | C1.CMP | A | GT-001 | **Nhận (Lô A)** | Nhìn số ở giữa và chọn nhóm có số lượng đúng (1–6) |`
     - `| WB04-D3 | 3-4 | C1 | C1.CNT | A | GT-022 · GT-000 | **Nhận (Lô A)** | Bức tranh Quảng trường: Đếm phân loại và khôi phục biển số |`
  2. Cập nhật số liệu thống kê Mục 2:
     - Dạng bài Lô A nhận tăng thêm 3: từ 20 (hoặc 23) $\rightarrow$ cộng thêm 3 dạng của WB04.
     - Dạng bài hoãn giảm tương ứng 3 dạng.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Hàng `WB04-D1`, `WB04-D2`, `WB04-D3` phản ánh chính xác khuôn `GT-001`, `GT-028`, `GT-022`, `GT-000`.
  - [ ] Trạng thái chuyển thành **Nhận (Lô A)**.
  - [ ] Phép tính tổng hợp ở Mục 2 khớp đúng.

---

### Task 2: Cập nhật Bảng Ánh Xạ Corpus Montessori (`montessori-corpus-mapping.md`)
- **Tập tin:** `docs/specs/05-content/montessori-corpus-mapping.md`
- **Mục tiêu:** Cập nhật hàng 04 trong Bảng 7.1 từ thiếu khuôn sang khuôn Lô A đã sẵn sàng.
- **Hành động cụ thể:**
  1. Sửa dòng 04 tại Mục 7.1:
     - Cũ: `| 04 | Đếm nhanh chọn đúng | 3-4 | C1 | C1.CNT | — | GT-012 nhìn chớp rồi nhớ lại |`
     - Mới: `| 04 | Quảng trường số lượng | 3-4 | C1 | C1.CNT · C1.CMP · C1.OTO | GT-001 · GT-028 · GT-022 · GT-000 | — |`
  2. Bổ sung ghi chú giải thích: Dữ liệu phân tích PDF 2026 xác nhận Chặng 4 khai thác trực tiếp cơ chế đếm tích luỹ, chọn đáp án và tìm vật thể ẩn trên các engine Lô A hiện có.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Bảng 7.1 có hàng 04 với tên "Quảng trường số lượng", khuôn Lô A `GT-001 · GT-028 · GT-022 · GT-000`, không còn cơ chế Lô B còn thiếu.
  - [ ] Không có từ khóa thương mại IQ/Raven tuân thủ `BR-MCM-06`.

---

### Task 3: Bổ sung Dataset & Level Plans vào Seeder `C1.CNT.01`
- **Tập tin:** `packages/content/src/skills/c1/cnt/C1.CNT.01.ts`
- **Mục tiêu:** Tích hợp 3 level plans (`GL-C1-CNT-TAP-0121`, `GL-C1-CNT-TCNT-0122`, `GL-C1-CNT-HIDE-0129`) và bổ sung vật phẩm gian hàng trái cây/rau củ vào dataset.
- **Hành động cụ thể:**
  1. Thêm các item Chặng 4 (`cnt01_wb04_apple_pair`, `cnt01_wb04_banana_trio`, `cnt01_wb04_pear_four`, `cnt01_wb04_tomato_five`) vào `C1_CNT_01_DATASET.items`.
  2. Bổ sung 3 phần tử vào mảng `C1_CNT_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-CNT-TAP-0121",
       template: "GT-001",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB04-D1",
     },
     {
       code: "GL-C1-CNT-TCNT-0122",
       template: "GT-028",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB04-D1",
     },
     {
       code: "GL-C1-CNT-HIDE-0129",
       template: "GT-022",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "town",
       rounds: 3,
       montessori_ref: "WB04-D3",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level $\ge 0101$, có `montessori_ref: "WB04-D1"` và `"WB04-D3"`.
  - [ ] `access_tier` khớp `difficulty` (1: `free`, 2: `login`).

---

### Task 4: Bổ sung Level Plan vào Seeder `C1.CNT.06`
- **Tập tin:** `packages/content/src/skills/c1/cnt/C1.CNT.06.ts`
- **Mục tiêu:** Tích hợp level đếm nhóm thú cưng & bánh ngọt phạm vi 1–8 (`GL-C1-CNT-TAP-0123`).
- **Hành động cụ thể:**
  1. Thêm level plan vào mảng `C1_CNT_06_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-CNT-TAP-0123",
       template: "GT-001",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "animal",
       rounds: 3,
       montessori_ref: "WB04-D1",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C1-CNT-TAP-0123`, `montessori_ref: "WB04-D1"`.
  - [ ] `difficulty: 2`, `access_tier: "login"`.

---

### Task 5: Bổ sung Dataset & Level Plans vào Seeder `C1.CNT.07`
- **Tập tin:** `packages/content/src/skills/c1/cnt/C1.CNT.07.ts`
- **Mục tiêu:** Tích hợp 3 level plans (`GL-C1-CNT-TAP-0124`, `GL-C1-CNT-TCNT-0125`, `GL-C1-CNT-HIDE-0130`) và bổ sung vật phẩm dải 6–12 vào dataset.
- **Hành động cụ thể:**
  1. Thêm các item thể thao/lễ hội (`cnt07_wb04_soccer_nine`, `cnt07_wb04_basket_ten`, `cnt07_wb04_egg_eleven`, `cnt07_wb04_bell_twelve`) vào `C1_CNT_07_DATASET.items`.
  2. Bổ sung 3 phần tử vào mảng `C1_CNT_07_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-CNT-TAP-0124",
       template: "GT-001",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB04-D1",
     },
     {
       code: "GL-C1-CNT-TCNT-0125",
       template: "GT-028",
       band: "5-6",
       difficulty: 4,
       access_tier: "premium",
       theme: "festival",
       rounds: 3,
       montessori_ref: "WB04-D1",
     },
     {
       code: "GL-C1-CNT-HIDE-0130",
       template: "GT-022",
       band: "5-6",
       difficulty: 3,
       access_tier: "standard",
       theme: "town",
       rounds: 3,
       montessori_ref: "WB04-D3",
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã level $\ge 0101$, `montessori_ref` chuẩn xác.
  - [ ] `difficulty: 3` gắn `access_tier: "standard"`; `difficulty: 4` gắn `access_tier: "premium"`.

---

### Task 6: Bổ sung Dataset & Level Plans vào Seeder `C1.CMP.04`
- **Tập tin:** `packages/content/src/skills/c1/cmp/C1.CMP.04.ts`
- **Mục tiêu:** Tích hợp 2 level plans đối chiếu 2 nhóm D2 (`GL-C1-CMP-TAP-0126`, `GL-C1-CMP-TAP-0127`) và dataset chuyên biệt `CHANG_04_D2_DATASET`.
- **Hành động cụ thể:**
  1. Khai báo dataset `CHANG_04_D2_DATASET` chứa các cặp tương phản hoa quả, côn trùng, nhà cửa theo đúng cấu trúc D2 của PDF.
  2. Bổ sung 2 phần tử vào mảng `C1_CMP_04_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-CMP-TAP-0126",
       template: "GT-001",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "food",
       rounds: 3,
       montessori_ref: "WB04-D2",
       dataset: CHANG_04_D2_DATASET,
     },
     {
       code: "GL-C1-CMP-TAP-0127",
       template: "GT-001",
       band: "4-5",
       difficulty: 2,
       access_tier: "login",
       theme: "nature",
       rounds: 3,
       montessori_ref: "WB04-D2",
       dataset: CHANG_04_D2_DATASET,
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C1-CMP-TAP-0126` (diff 1, free) và `GL-C1-CMP-TAP-0127` (diff 2, login).
  - [ ] `montessori_ref: "WB04-D2"`.

---

### Task 7: Bổ sung Level Plans vào Seeder `C1.OTO.01`
- **Tập tin:** `packages/content/src/skills/c1/oto/C1.OTO.01.ts`
- **Mục tiêu:** Tích hợp level đối chiếu số lượng D2 (`GL-C1-OTO-TAP-0128`) và level mở đầu/mừng công D3 (`GL-C1-OTO-INTRO-0131`).
- **Hành động cụ thể:**
  1. Thêm 2 phần tử vào mảng `C1_OTO_01_SEED.levels`:
     ```typescript
     {
       code: "GL-C1-OTO-TAP-0128",
       template: "GT-001",
       band: "3-4",
       difficulty: 2,
       access_tier: "login",
       theme: "town",
       rounds: 3,
       montessori_ref: "WB04-D2",
     },
     {
       code: "GL-C1-OTO-INTRO-0131",
       template: "GT-000",
       band: "3-4",
       difficulty: 1,
       access_tier: "free",
       theme: "town",
       rounds: 1,
       montessori_ref: "WB04-D3",
       sequence_no: 4,
     },
     ```
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Mã `GL-C1-OTO-TAP-0128` (diff 2, login, WB04-D2).
  - [ ] Mã `GL-C1-OTO-INTRO-0131` (diff 1, free, WB04-D3, template `GT-000`).

---

### Task 8: Chạy Cổng Kiểm Thử & Verification Gates
- **Tập tin:** Toàn bộ repo
- **Mục tiêu:** Đảm bảo toàn bộ thay đổi vượt qua cổng kiểm tra chất lượng tự động.
- **Các lệnh kiểm thử:**
  1. `pnpm --filter @mindkid/content typecheck` — Xác nhận không có lỗi type (`strict: true`, không `any`, không `unknown`).
  2. `pnpm --filter @mindkid/content test` — Kiểm tra round-trip các builder và seeder.
  3. `pnpm --filter @mindkid/content-build test packages/content-build/tests/gates/montessori-corpus.test.ts` — Xác nhận gate đối chiếu corpus Montessori pass xanh.
  4. `pnpm lint:safe` — Đảm bảo định dạng mã nguồn theo Biome 2.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria):**
  - [ ] Tất cả lệnh chạy exit 0, không có warning hoặc error.
