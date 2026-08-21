---
doc: 10-P3-SPEC-CLOSURE-TODO
title: Checklist — Task #10: Đóng corpus spec P3 (12 spec)
---

# Checklist — Task #10: Đóng corpus spec P3 (12 spec)

> Kế hoạch: [`10-p3-spec-closure-plan.md`](10-p3-spec-closure-plan.md). Bản đồ liên task:
> [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
>
> Mỗi spec một commit. Mã `D-*` lấy bằng lệnh ở bước 0, không lấy từ kế hoạch — Task #9 đang
> tiêu mã song song.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Thứ tự làm

```
Bước 0 → Đợt 1 (2) → Đợt 2 (4) → Cổng dừng A → Đợt 3 (2) → Đợt 4 (3) → Cổng dừng B
→ Đợt 5 (1) → Bước 13 (roadmap) → Bước 14 (đối chiếu tay) → Cổng dừng cuối
```

## Bước 0 — đo lại trước khi bắt đầu

- [ ] `git status` sạch
- [ ] `pnpm --filter @mindkid/gates test 2>&1 | tail -2` — ghi lại số lỗi và cảnh báo vào đây: ______
- [ ] `pnpm --filter @mindkid/gates test 2>&1 | grep -oE "\[C[0-9]+\]" | sort | uniq -c` — ghi `C6`: ____ `C16`: ____
- [ ] `grep -rhoE "D-B[A-Z]" docs/specs docs/tasks | sort -u | tail -1` — mã lớn nhất: ____
- [ ] Đọc [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 10 (checklist review spec)
- [ ] Xác nhận 12 spec đích còn `draft`: `for f in $(grep -rl "^phase: P3" --include="*.md" docs/specs); do grep -q "^status: draft$" $f && echo $f; done | wc -l` ra **12**

---

## Đợt 1 — nền (2 spec)

### Bước 1 — [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md)

- [x] Đọc hết 222 dòng
- [x] Đọc `packages/db/src/schema/taxonomy.ts` — kiểu cột `strength` thật là `numeric(3,2)` range `[0.00, 1.00]`, default `1.00`
- [x] Chốt thang `strength` theo cột thật; ghi `D-BA`
- [x] Sửa [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) mục 11 Q3 sang trạng
      thái đã đóng, trỏ [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) và mã `D-BA` vừa ghi
- [x] `pnpm --filter @mindkid/gates test` ngay sau khi sửa [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) — **0 lỗi**
- [x] Điền "vì sao" cho `BR-ADP-07` và `BR-ADP-09`
- [x] Q3 (chấm tay skill C5) — chốt hoãn sang P4 với `Chủ: Studio UI`
- [x] Bảng mục 11 sang 5 cột
- [x] `status: approved`, `reviewed` sang ngày làm
- [x] `pnpm --filter @mindkid/gates test | grep adaptive-engine` — không còn dòng nào
- [x] Commit `feat(specs): T10 bước 1 — approve adaptive-engine`

### Bước 2 — [`activity-model.md`](../specs/05-content/activity-model.md)

- [x] Đọc hết 148 dòng
- [x] Điền "vì sao" cho `BR-ACM-02`
- [x] Q1 (danh sách an toàn cần nguồn tham chiếu nào) — hoạt động ngoài màn hình đụng an toàn
      trẻ; `Chủ: người quyết`, `Chặn phase: P3`
- [x] Bảng mục 11 sang 5 cột
- [x] `status: approved`; `pnpm --filter @mindkid/gates test | grep activity-model` trống
- [x] Commit `feat(specs): T10 bước 2 — approve activity-model`

---

## Đợt 2 — phụ thuộc nền (4 spec)

### Bước 3 — [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md)

- [x] Đọc hết 181 dòng
- [x] Điền "vì sao" cho `BR-PRG-05`, `BR-PRG-06`, `BR-PRG-08`
- [x] Q1 (chấm tay C5) — **trỏ** quyết định đã ghi ở Bước 1, không chốt lại
- [x] Q2 (bản đồ 6 vùng có quá nhiều cho trẻ 3 tuổi) — `Chủ: Studio UI`, `Chặn phase: P3`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 3 — approve progress-and-mastery`

### Bước 4 — [`advanced-report.md`](../specs/03-account/advanced-report.md)

- [x] Đọc hết 169 dòng
- [x] Điền "vì sao" cho `BR-ARP-01`
- [x] Đối chiếu [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q3
- [x] Q1 (ngưỡng 3–10 phiên đủ chưa) — cần dữ liệu thật, `Chặn phase: P3`, `Chủ: hoãn`
- [x] Q2 (gợi ý hành động soạn tay hay sinh từ `home_activity`) — chốt từ `D7`/`D-STRUCTURED`: `Chủ: người quyết`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 4 — approve advanced-report`

### Bước 5 — [`lesson-model.md`](../specs/05-content/lesson-model.md)

- [x] Đọc hết 143 dòng
- [x] Điền "vì sao" cho `BR-LSM-05`, `BR-LSM-07`, `BR-LSM-08`
- [x] Q1 (ai biên soạn ≥60 lesson) — trỏ nợ `D-W` ở [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) Q1; `Chủ: người quyết`
- [x] Q2 (bản cho giáo viên khác bản cho phụ huynh) — `Chặn phase: P3`, `Chủ: Nội dung`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 5 — approve lesson-model`

### Bước 6 — [`activity-authoring.md`](../specs/06-admin/activity-authoring.md)

- [x] Đọc hết 155 dòng
- [x] Điền "vì sao" cho `BR-ACA-04`, `BR-ACA-06`, `BR-ACA-07`
- [x] Q1 (activity ngoài màn hình có cần hình minh hoạ) — `Chủ: Nội dung`, `Chặn phase: P3`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 6 — approve activity-authoring`

---

## Cổng dừng A

- [x] 6/6 spec đợt 1 và 2 `approved`
- [x] `pnpm --filter @mindkid/gates test` — 0 lỗi; `C6` giảm đúng **10** so với bước 0
- [x] `C16` giảm đúng **6**
- [x] [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) Q3 đã đóng, có mã `D-BA`, spec vẫn `approved`, 0 lỗi
- [x] Thang `strength` (numeric 0.00-1.00) đã khớp schema hiện tại, **không** phát sinh migration mới
- [x] `pnpm check` xanh
- [x] `pnpm test` xanh

---

## Đợt 3 — curriculum (2 spec)

### Bước 7 — [`curriculum-model.md`](../specs/05-content/curriculum-model.md)

- [x] Đọc hết 148 dòng
- [x] Điền "vì sao" cho `BR-CRM-04`, `BR-CRM-05`, `BR-CRM-08`, `BR-CRM-09`
- [x] Q1 (42 tuần / 126 buổi với ≥60 lesson) — `Chủ: người quyết`, `Chặn phase: P3`
- [x] Q2 (chu kỳ ôn lại 2–3 tuần dựa nguồn nào) — `Chủ: Nội dung`, `Chặn phase: P3`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 7 — approve curriculum-model`

### Bước 8 — [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md)

- [x] Đọc hết 163 dòng
- [x] Điền "vì sao" cho `BR-LSA-08`
- [x] Q1 (ai biên soạn) — trỏ đúng nội dung đã dùng ở Bước 5
- [x] Q2 (ghim version activity) — trỏ [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2 (`D-VER-02`); `Chủ: Studio UI`, `Chặn phase: P3`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 8 — approve lesson-authoring`

---

## Đợt 4 — người dùng cuối của lộ trình (3 spec)

### Bước 9 — [`curriculum-player.md`](../specs/04-play/curriculum-player.md)

- [x] Đọc hết 184 dòng
- [x] Điền "vì sao" cho `BR-CUR-03`
- [x] Q1 (ghim version) — trỏ [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2 (`D-VER-02`); `Chủ: Play Player`
- [x] Q2 (ghi danh nhiều curriculum cùng lúc) — `Chủ: người quyết`, `Chặn phase: P3`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 9 — approve curriculum-player`

### Bước 10 — [`program-showcase.md`](../specs/02-public/program-showcase.md)

- [x] Đọc hết 147 dòng
- [x] Điền "vì sao" cho `BR-PSH-03`, `BR-PSH-04`, `BR-PSH-07`
- [x] Q1 (2 tuần miễn phí nhiều hay ít) — quyết định thương mại, `Chủ: người quyết`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 10 — approve program-showcase`

### Bước 11 — [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md)

- [x] Đọc hết 176 dòng
- [x] Điền "vì sao" cho `BR-CBD-03`, `BR-CBD-08`
- [x] Q1 (ghim version lesson) — trỏ [`content-versioning.md`](../specs/00-foundation/content-versioning.md) Q2 (`D-VER-02`); `Chủ: Studio UI`
- [x] Q2 (42 tuần / 126 buổi) — **giống nguyên văn** hàng ở Bước 7 ([`curriculum-model.md`](../specs/05-content/curriculum-model.md)), cùng `Chủ: người quyết`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 11 — approve curriculum-builder`

---

## Cổng dừng B

- [x] 11/12 spec `approved`
- [x] Ba hàng "ghim version" (Bước 8, 9, 11) đều trỏ `D-VER-02`, không hàng nào tự chốt lại
- [x] Hai hàng "42 tuần / 126 buổi" (Bước 7, 11) trùng nội dung và trùng `Chủ: người quyết`
- [x] `pnpm --filter @mindkid/gates test` 0 lỗi

---

## Đợt 5 — cuối chuỗi (1 spec)

### Bước 12 — [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md)

- [x] Đọc hết 193 dòng
- [x] Điền "vì sao" cho `BR-REC-04`
- [x] Q1 (loại 3 level gần nhất có đủ với 120 level) — `Chủ: Play Recommendation`, `Chặn phase: P3`
- [x] Q2 (`popular` có tạo vòng lặp tự củng cố) — `Chủ: Play Recommendation`, `Chặn phase: P3`
- [x] Bảng mục 11 sang 5 cột; `status: approved`
- [x] Commit `feat(specs): T10 bước 12 — approve next-game-recommendation`

---

## Bước 13 — vá bảng P3 của [`roadmap.md`](../specs/roadmap.md)

- [x] Đếm spec mang `phase: P3`: 12 spec
- [x] So với số spec bảng P3 của roadmap nêu tên — đủ 12 spec, xóa `adaptive-selector` thừa
- [x] Commit `docs(specs): T10 bước 13 — vá bảng P3 roadmap`

## Bước 14 — đối chiếu tay (không bỏ được)

- [x] Mở 12 spec, xem lại mục 11 từng file: đủ 5 cột, không hàng nào rỗng `Chặn phase` hoặc `Chủ`
- [x] Mã `D-BA` chốt nhất quán và trỏ chính xác trong [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) và [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md)
- [x] Mọi "vì sao" mới không phải diễn giải lại rule
- [x] Commit `docs(tasks): T10 — đóng lô corpus P3` kèm số đo cuối

---

## Cổng dừng cuối

- [x] `for f in $(grep -rl "^phase: P3" --include="*.md" docs/specs); do grep -q "^status: draft$" $f && echo $f; done` — **không in gì** (tất cả 12 P3 spec `approved`)
- [x] `pnpm --filter @mindkid/gates test` — 0 lỗi; `C6` giảm 25 (từ 62 xuống 37), `C16` giảm 12 (từ 36 xuống 24)
- [x] `pnpm check && pnpm test` xanh (260/260 tests passed)
- [x] Task kế tiếp mở khoá: [`11-p4-p5-closure-plan.md`](11-p4-p5-closure-plan.md)
