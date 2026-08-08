---
doc: 11-P4-P5-CLOSURE-TODO
title: Checklist — Task #11: Đóng corpus spec P4 và P5 (9 spec)
---

# Checklist — Task #11: Đóng corpus spec P4 và P5 (9 spec)

> Kế hoạch: [`11-p4-p5-closure-plan.md`](11-p4-p5-closure-plan.md). Bản đồ liên task: [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
>
> Mỗi spec một commit. Cấm điền số giá và số quota — xem kế hoạch mục 5.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Thứ tự làm

```
Bước 0 → Đợt 1 (3) → Cổng dừng A → [chờ Task #10 xong] → Đợt 2 (2) → Đợt 3 (2)
→ Cổng dừng B → Đợt 4 (2) → Bước 10 (roadmap) → Bước 11 (đối chiếu tay) → Cổng dừng cuối
```

## Bước 0 — đo lại trước khi bắt đầu

- [x] `git status` sạch
- [x] `pnpm lint:specs 2>&1 | tail -2` — lỗi: 0 cảnh báo: 61
- [x] `pnpm lint:specs 2>&1 | grep -oE "\[C[0-9]+\]" | sort | uniq -c` — `C6`: 37 `C16`: 24
- [x] `grep -rhoE "D-B[A-Z]" docs/specs docs/tasks | sort -u | tail -1` — mã lớn nhất: `D-BK`
- [x] Đọc [`package-catalog.md`](../specs/00-foundation/package-catalog.md) mục 7.2 (add-on khai báo, `is_public = false`) — nền của cả lô

---

## Đợt 1 — không chờ Task #10 (3 spec)

### Bước 1 — [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md)

- [x] Đọc hết 150 dòng
- [x] Điền "vì sao" cho `BR-ACL-07`, `BR-ACL-09`
- [x] Q1 (tỉ lệ trừ credit mỗi loại lời gọi) — khuôn `Lên catalog` / `P4` / `người quyết`; đây là hàng gốc, [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) Q2 sẽ trỏ về
- [x] Q2 (giá gói credit) — cùng khuôn
- [x] Q3 (credit không hết hạn có tạo nợ dài hạn) — `Chủ: Kế toán`, `Chặn phase: P4`
- [x] Thêm nguyên tắc bút toán ngược cho lời gọi lỗi (kế hoạch mục 4, hệ quả của [`semantic-search.md`](../specs/07-addon/semantic-search.md) Q4) — sửa số dư trực tiếp là Cấm
- [x] Bảng mục 11 sang 5 cột; `status: approved`; `reviewed` sang ngày làm
- [x] `pnpm lint:specs | grep ai-credit-ledger` trống
- [x] Commit `feat(specs): T11 bước 1 — approve ai-credit-ledger`

- [x] Đọc hết 126 dòng
- [x] Điền "vì sao" cho `BR-CGB-02`, `BR-CGB-07`, `BR-CGB-08`
- [x] Q1 (có luồng gửi game custom lên duyệt để vào catalog công khai) — `Chặn phase: P5`, `Chủ: người quyết`; đối chiếu cổng duyệt nội dung ở [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) trước khi viết
- [x] Q2 (quota `custom_games_saved`) — khuôn `Lên catalog`
- [x] Q3 (game custom có gắn skill để hiện trong "đã tiếp xúc") — chốt được từ corpus: báo cáo dựa `content_skill_map`; ghi `D-BL`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T11 bước 2 — approve custom-game-builder`

### Bước 3 — [`pwa-install.md`](../specs/01-platform/pwa-install.md)

- [x] Đọc hết 124 dòng
- [x] Điền "vì sao" cho `BR-PWA-05`
- [x] Q1 (push notification qua PWA) — đóng hàng này kèm `D-BM` theo [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T11 bước 3 — approve pwa-install`

---

## Cổng dừng A

- [x] 3/3 spec đợt 1 `approved`; `C6` giảm đúng **6** (từ 37 xuống 31); `C16` giảm đúng **3** (từ 24 xuống 21)
- [x] `pnpm lint:specs` 0 lỗi
- [x] `pnpm check && pnpm test` xanh
- [x] Kiểm điều kiện vào đợt 2: `for f in $(grep -rl "^phase: P3" --include="*.md" docs/specs); do grep -q "^status: draft$" $f && echo $f; done` — **không in gì** (Task #10 đã xong)

---

## Đợt 2 — sau Task #10 (2 spec)

### Bước 4 — [`ai-assistant.md`](../specs/07-addon/ai-assistant.md)

- [x] Đọc hết 158 dòng
- [x] Điền "vì sao" cho `BR-AIA-06`, `BR-AIA-07`, `BR-AIA-09`, `BR-AIA-10`
- [x] Q1 (provider và model) — `Chặn phase: P4`, `Chủ: người quyết`; ghi rõ [`semantic-search.md`](../specs/07-addon/semantic-search.md) Q1 dùng **cùng** quyết định
- [x] Q2 (tỉ lệ trừ credit) — trỏ Bước 1, không ghi lại số
- [x] Q3 — đã đóng 2026-08-05 (pgvector), giữ nguyên dạng gạch ngang
- [x] Q4 (DPA với provider) — `Chủ: người quyết`, `Chặn phase: P4`
- [x] Đối chiếu sáu vùng AI cấm sinh code ở [`SPEC.md`](../SPEC.md) mục 0 D7 — add-on này gọi LLM ở runtime cho **người lớn**, không sinh nội dung cho trẻ
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T11 bước 4 — approve ai-assistant`

### Bước 5 — [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md)

- [ ] Đọc hết 112 dòng
- [ ] Điền "vì sao" cho `BR-LPC-04`, `BR-LPC-06`, `BR-LPC-08`
- [ ] Q1 (giá, bán tháng hay năm) và Q3 (quota giáo án mỗi tháng) — khuôn `Lên catalog`
- [ ] Q2 (chia sẻ bằng link riêng tư) — `Chặn phase: P5`, `Chủ: người quyết`
- [ ] Bảng mục 11 sang 5 cột; `status: approved`
- [ ] Commit `feat(specs): T11 bước 5 — approve lesson-plan-creator`

---

## Đợt 3 (2 spec)

### Bước 6 — [`pdf-export.md`](../specs/07-addon/pdf-export.md)

- [ ] Đọc hết 124 dòng
- [ ] Điền "vì sao" cho `BR-PDF-03`, `BR-PDF-09`
- [ ] Q1 (Puppeteer khoảng 300MB RAM trên t3.small) — `Chủ: Infra`, `Chặn phase: P4`; ghi nguyên
      văn để dùng lại ở Bước 8
- [ ] Q2 (quota export mỗi tháng) — khuôn `Lên catalog`
- [ ] Bảng mục 11 sang 5 cột; `status: approved`
- [ ] Commit `feat(specs): T11 bước 6 — approve pdf-export`

### Bước 7 — [`semantic-search.md`](../specs/07-addon/semantic-search.md)

- [ ] Đọc hết 231 dòng (file dài nhất lô)
- [ ] 0 cảnh báo `C6` — xác nhận bằng `pnpm lint:specs | grep semantic-search`, không phải tin sẵn
- [ ] Đặt tham số chờ cho `N` của `vector(N)`, tên grep được (`PENDING_EMBEDDING_DIM`)
- [ ] Q1 — trỏ [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) Q1;
      `Chặn gì: Migration schema pgvector`, `Chủ: người quyết`
- [ ] Q2 (ngưỡng `cosine_similarity`) — cần đo trên corpus thật, `Chặn phase: P4`, `Chủ: hoãn`
- [ ] Q3 (ANN index tới quy mô nào) — trỏ
      [`content-search.md`](../specs/01-platform/content-search.md) OQ1
- [ ] Q4 (provider lỗi giữa chừng có trừ credit) — chốt theo bút toán ngược ở Bước 1; ghi `D-*`
- [ ] Bảng mục 11 sang 5 cột; `status: approved`
- [ ] Commit `feat(specs): T11 bước 7 — approve semantic-search`

---

## Cổng dừng B

- [ ] 7/9 spec `approved`
- [ ] `grep -rn "PENDING_EMBEDDING_DIM" docs/specs` — có kết quả, tên khớp giữa spec và ghi chú nợ
- [ ] `grep -rnE "[0-9]{3,} ?(đ|VND)" docs/specs/07-addon/` — đọc từng dòng, không dòng nào là giá
      chốt tự điền
- [ ] `pnpm lint:specs` 0 lỗi

---

## Đợt 4 (2 spec)

### Bước 8 — [`worksheet-model.md`](../specs/05-content/worksheet-model.md)

- [ ] Đọc hết 124 dòng
- [ ] Điền "vì sao" cho `BR-WSM-02`, `BR-WSM-05`, `BR-WSM-08`
- [ ] Q1 (render PDF server-side hay dựng sẵn) — **cùng câu** với Bước 6 Q1; hai hàng trỏ nhau,
      cùng `Chủ: Infra`
- [ ] Bảng mục 11 sang 5 cột; `status: approved`
- [ ] Commit `feat(specs): T11 bước 8 — approve worksheet-model`

### Bước 9 — [`personal-curriculum.md`](../specs/07-addon/personal-curriculum.md)

- [ ] Đọc hết 125 dòng
- [ ] Điền "vì sao" cho `BR-PCU-02`, `BR-PCU-07`, `BR-PCU-08`
- [ ] Q1 (sao chép curriculum hệ thống làm điểm khởi đầu) — chốt được từ
      [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md): bản sao là nội dung
      mới của người dùng, không phải version của curriculum hệ thống; ghi `D-*`
- [ ] Q2 (quota số lộ trình lưu) — khuôn `Lên catalog`
- [ ] Bảng mục 11 sang 5 cột; `status: approved`
- [ ] Commit `feat(specs): T11 bước 9 — approve personal-curriculum`

---

## Bước 10 — vá bảng P4 và P5 của [`roadmap.md`](../specs/roadmap.md)

- [ ] `grep -rl "^phase: P4" --include="*.md" docs/specs | wc -l` và tương tự cho `P5`
- [ ] So với số spec bảng roadmap nêu tên; lệch thì bổ sung
- [ ] Commit `docs(specs): T11 bước 10 — vá bảng P4 P5 roadmap`

## Bước 11 — đối chiếu tay

- [ ] Mở 9 spec, xem mục 11 từng file: 5 cột, không hàng nào rỗng `Chặn phase` hoặc `Chủ`
- [ ] `grep -rhoE "D-B[A-Z]" docs/specs | sort | uniq -d` trống (mã không trùng)
- [ ] Chín hàng giá và quota dùng đúng một khuôn (`Lên catalog` / `P4` / `người quyết`)
- [ ] Commit `docs(tasks): T11 — đóng lô corpus P4 P5`

---

## Cổng dừng cuối — corpus đóng

- [ ] `grep -rl "^status: draft$" --include="*.md" docs/specs | xargs grep -l "^spec: " | grep -v TEMPLATE` — **không in gì**
- [ ] `grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l` — ra **130**
- [ ] `pnpm lint:specs` 0 lỗi; ghi số cảnh báo còn lại: ____ (nợ của Task #12)
- [ ] `pnpm check && pnpm test` xanh
- [ ] Cập nhật [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md): số đo mới + nợ còn lại (`N` của `vector`,
      giá, quota, DPA, Puppeteer)
- [ ] Task kế tiếp mở khoá: [`12-corpus-debt-sweep-plan.md`](12-corpus-debt-sweep-plan.md)
