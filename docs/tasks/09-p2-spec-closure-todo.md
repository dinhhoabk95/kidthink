# Checklist — Task #9: Đóng corpus spec P2 (30 spec)

> Kế hoạch: [`09-p2-spec-closure-plan.md`](09-p2-spec-closure-plan.md).
> Mọi lệnh chạy từ `kidthink/`. Đặt lại đường dẫn Node trước mỗi phiên shell mới:
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```
>
> Sổ cái quyết định bắt đầu từ **`D-BE`** (`D-BC` bỏ trống, bước 1 dùng `D-BD`).

## Thứ tự làm

```
Bước 0  → Lô A (4)  → Cổng dừng A  → Lô B (8)  → Cổng dừng B
        → Lô C (6)  → Cổng dừng C  → Lô D (4)  → Cổng dừng D
        → Lô E (8)  → Bước 31 (roadmap) → Bước 32 (đối chiếu tay) → Cổng dừng cuối
```

**Vòng lặp tám việc cho mỗi spec** — [`09-p2-spec-closure-plan.md`](09-p2-spec-closure-plan.md)
mục 5. Mỗi ô spec dưới đây nghĩa là đã chạy đủ tám việc và đã commit.

Mẫu commit: `feat(specs): T9 bước <n> — approve <tên-spec>`

---

## Bước 0 — Đo lại trước khi bắt đầu

- [ ] `git status` sạch, `origin/main..HEAD` ra **0**
- [ ] `docker info` chạy được (hook `pre-push` job `services` của [`lefthook.yml`](../../lefthook.yml)
      sẽ chặn nếu Docker chết)
- [ ] `pnpm lint:specs` — ghi lại con số: phải là **0 lỗi, 101 cảnh báo, 0 chu trình**
- [ ] Đếm `status: approved` toàn corpus — phải ra **81**
- [ ] Đếm spec `phase: P2` — phải ra **31**; trong đó `draft` ra **29**
- [ ] Đọc [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 10 (checklist review 15 mục) và mục 11
      (văn phong) — hai mục này áp cho mọi dòng viết mới trong task

---

## Lô A — nền asset (4 spec)

Đồ thị: `image-storage → image-upload` và `image-storage → asset-usage-tracking` (hai nhánh song song); [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) độc lập.

### Bước 1 — [`image-storage.md`](../specs/01-platform/image-storage.md)

- [x] Đọc hết 224 dòng
- [x] Đối chiếu `owner_type` đa hình ở mục 7 với **danh sách đa hình 9 mục** (`D-AQ`)
- [x] Điền "vì sao" cho **3** cảnh báo `C6`
- [x] Bảng mục 11 sang 5 cột; Q1 (xoá nền tự động) trỏ sang
      [`image-upload.md`](../specs/06-admin/image-upload.md) Q1 — cặp 7 của mục 6
- [x] Q2 (CDN trước S3) — `Chặn phase: P2`, `Chủ: người quyết`, không tự chốt
- [x] Q3 (tần suất job dọn ảnh `orphan`) — chốt được từ corpus, ghi `D-*` (`D-BD`)
- [x] `status: approved`, `reviewed` sang ngày làm
- [x] `pnpm lint:specs` — 0 lỗi, cảnh báo **104 → 101**
- [x] Commit `feat(specs): T9 bước 1 — approve image-storage`

### Bước 2 — [`image-upload.md`](../specs/06-admin/image-upload.md)

- [x] Đọc hết 168 dòng
- [x] Điền "vì sao" cho **2** cảnh báo `C6`
- [x] Bảng mục 11 sang 5 cột; Q1 trỏ ngược sang
      [`image-storage.md`](../specs/01-platform/image-storage.md) Q1, cùng `Chặn phase: P4`
- [x] `status: approved`; `pnpm lint:specs` cảnh báo **101 → 99**
- [x] Commit `feat(specs): T9 bước 2 — approve image-upload`

### Bước 3 — [`emoji-picker.md`](../specs/06-admin/emoji-picker.md)

- [x] Đọc hết 149 dòng; 0 cảnh báo `C6`
- [x] Đối chiếu 32 nhóm emoji với [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) —
      kho emoji là danh sách đóng, picker không được mở rộng nó
- [x] Bảng mục 11 sang 5 cột
- [x] `status: approved`; `pnpm lint:specs` cảnh báo giữ **99**
- [x] Commit `feat(specs): T9 bước 3 — approve emoji-picker`

### Bước 4 — [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md)

- [x] Đọc hết 156 dòng; 0 cảnh báo `C6`
- [x] `reviewed: 2026-08-07` — file duy nhất trong lô viết sau `D-AQ`, vẫn đối chiếu lại
- [x] Bảng mục 11 sang 5 cột
- [x] `status: approved`; cảnh báo giữ **99**
- [x] Commit `feat(specs): T9 bước 4 — approve asset-usage-tracking`

---

## Cổng dừng A

- [x] 4/4 spec lô A `approved`; `pnpm lint:specs` 0 lỗi, **99** cảnh báo
- [x] `pnpm check` xanh
- [x] `pnpm test` xanh
- [x] **Một phiên duy nhất với chủ dự án** — 6 câu ở mục 7 của
      [`09-p2-spec-closure-plan.md`](09-p2-spec-closure-plan.md):
  - [x] 1. Giá cuối `standard` / `premium`
  - [x] 2. Doanh thu tính theo đơn `approved` hay ngày hiệu lực entitlement
  - [x] 3. Cam kết thời gian duyệt + `SOFT_UNLOCK_DAYS`
  - [x] 4. Sentry hay tự xây error log
  - [x] 5. Provider email có trạng thái bounce/delivery
  - [x] 6. Năng lực đọc review — bao nhiêu bản/ngày/người
- [x] Chủ dự án **duyệt hay bác** đề xuất bịt lỗ hổng `C16` (mục 8). Nếu duyệt: làm ngay ở
      bước 4b trước khi vào lô B, để 26 spec còn lại được cổng giữ
- [x] Ghi mọi câu trả lời vào sổ cái `D-*` (từ `D-BE`), kể cả câu trả lời là "hoãn"

### Bước 4b — bịt lỗ hổng `C16` (chỉ chạy nếu Cổng dừng A duyệt)

- [x] Viết **ca âm trước**: trong [`scripts/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts),
      một spec giả `approved` có bảng mục 11 dạng 3 cột phải sinh **đúng một** violation
- [x] Chạy test — **phải đỏ** (chưa sửa `checkC16` thì không thể xanh)
- [x] Sửa `checkC16` ([`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) quanh dòng
      1693): bảng <5 cột thì `fail` nếu `status: approved`, `warn` nếu `draft`
- [x] Chạy test — **phải xanh**
- [x] Xoá thân nhánh mới, chạy lại test — **phải đỏ trở lại**. Đây là bước chứng minh cổng, không
      bỏ được
- [x] Khôi phục, `pnpm lint:specs` — 4 spec lô A đã 5 cột nên **không** phát sinh lỗi mới
- [x] Commit `feat(scripts): T9 bước 4b — C16 bắt bảng câu hỏi mở thiếu cột`

---

## Lô B — luồng tiền, hai đầu (8 spec)

Đồ thị bắt buộc bởi `C8`:

```
payment-order-create → payment-proof-upload (+ image-storage) → payment-queue → payment-approval
                     → pricing-page
entitlement-grant · subscription-view · package-catalog-admin (độc lập)
```

**Cảnh báo:** mọi cột schema phát sinh trong lô này phải sửa
[`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) **và** mục 7 của
[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) trong **cùng một commit**
— `C12` kiểm hai chiều.

### Bước 5 — [`payment-order-create.md`](../specs/03-account/payment-order-create.md)

- [x] Đọc hết 167 dòng; đọc cạnh [`payment-flow.md`](../specs/00-foundation/payment-flow.md)
      (máy trạng thái là nguồn sự thật)
- [x] Điền "vì sao" cho **1** cảnh báo `C6`
- [x] Bảng mục 11 sang 5 cột; Q2 (SLA duyệt) dùng câu trả lời số 3 của Cổng dừng A, ghi `D-*`
- [x] Q1 (mã giảm giá ở MVP) — chốt từ [`package-catalog.md`](../specs/00-foundation/package-catalog.md)
      (2 SKU, không có cơ chế giảm giá) hoặc để mở với `Chủ` rõ
- [x] `status: approved`; commit `feat(specs): T9 bước 5 — approve payment-order-create`

### Bước 6 — [`payment-proof-upload.md`](../specs/03-account/payment-proof-upload.md)

- [x] Đọc hết 176 dòng
- [x] Điền "vì sao" cho **4** cảnh báo `C6`
- [x] Q1 (`SOFT_UNLOCK_DAYS = 3` đủ chưa) — cặp 3 của mục 6, phải khớp
      [`payment-flow.md`](../specs/00-foundation/payment-flow.md) Q2. Nếu đổi con số thì sửa
      [`payment-flow.md`](../specs/00-foundation/payment-flow.md) **cùng commit** và ghi `D-*`
- [x] Q2 (OCR mã giao dịch) — `Chặn phase: P4`
- [x] `status: approved`; commit `feat(specs): T9 bước 6 — approve payment-proof-upload`

### Bước 7 — [`payment-queue.md`](../specs/06-admin/payment-queue.md)

- [x] Đọc hết 173 dòng
- [x] Điền "vì sao" cho **2** cảnh báo `C6`
- [x] Q1 (webhook/API ngân hàng) — cặp 4 của mục 6; khớp nguyên văn `Chặn phase` với
      [`payment-flow.md`](../specs/00-foundation/payment-flow.md) Q1
- [x] Kiểm rule "không có nút duyệt trên danh sách" còn nguyên — nó là ranh giới giữa spec này và
      [`payment-approval.md`](../specs/06-admin/payment-approval.md)
- [x] `status: approved`; commit `feat(specs): T9 bước 7 — approve payment-queue`

### Bước 8 — [`payment-approval.md`](../specs/06-admin/payment-approval.md)

- [x] Đọc hết 204 dòng; 0 cảnh báo `C6`
- [x] Đối chiếu checklist 5 mục và ràng buộc "một transaction, có khoá hàng" với mục 8 của
      [`SPEC.md`](../SPEC.md)
- [x] Q1 (luồng hoàn tiền) — cặp 5 của mục 6: [`payment-flow.md`](../specs/00-foundation/payment-flow.md)
      Q3 ghi **P5**. Điền `Chặn phase: P5`, không tự đặt phase khác
- [x] Q2 (huỷ duyệt) — chốt và ghi `D-*`, hoặc để mở với `Chủ` rõ
- [x] `status: approved`; commit `feat(specs): T9 bước 8 — approve payment-approval`

### Bước 9 — [`pricing-page.md`](../specs/02-public/pricing-page.md)

- [x] Đọc hết 145 dòng
- [x] Điền "vì sao" cho **1** cảnh báo `C6`
- [x] Q1 (giá cuối) — **giữ mở**, `Chặn phase: P2`, `Chủ: người quyết`, trỏ sang
      [`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q1. Mục 7 của kế hoạch
      giải thích vì sao giá không chặn `approved`
- [x] Kiểm rule "sinh giá và quyền lợi từ dữ liệu" còn nguyên — đó là lý do Q1 không chặn
- [x] `status: approved`; commit `feat(specs): T9 bước 9 — approve pricing-page`

### Bước 10 — [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md)

- [ ] Đọc hết 175 dòng; điền "vì sao" cho **2** cảnh báo `C6`
- [ ] Đối chiếu 16 entitlement key với [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md)
- [ ] `status: approved`; commit `feat(specs): T9 bước 10 — approve entitlement-grant`

### Bước 11 — [`subscription-view.md`](../specs/03-account/subscription-view.md)

- [ ] Đọc hết 140 dòng; điền "vì sao" cho **2** cảnh báo `C6`
- [ ] `status: approved`; commit `feat(specs): T9 bước 11 — approve subscription-view`

### Bước 12 — [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md)

- [ ] Đọc hết 130 dòng; điền "vì sao" cho **1** cảnh báo `C6`
- [ ] Q1 (doanh thu 30 ngày) — cặp 2 của mục 6; dùng câu trả lời số 2 của Cổng dừng A, ghi `D-*`
      **một lần** và trỏ từ [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) sang
- [ ] `status: approved`; commit `feat(specs): T9 bước 12 — approve package-catalog-admin`

---

## Cổng dừng B

- [ ] 8/8 spec lô B `approved`; toàn corpus **16/30** spec đích xong
- [ ] `pnpm lint:specs` 0 lỗi, cảnh báo **≤ 86**
- [ ] `pnpm check` xanh
- [ ] `pnpm test` xanh
- [ ] **Nêu rõ: lô B có đổi `schema-*` hay không.** Nếu có, liệt kê cột và mã `D-*`, và xác nhận
      [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) mục 7 đã sửa cùng
      commit (`C12` xanh)
- [ ] Nếu có đổi `schema-*`: ghi vào [`07-first-migration-plan.md`](07-first-migration-plan.md)
      mục 0 rằng phạm vi Task #7 cần đọc lại

---

## Lô C — studio nội dung (6 spec)

```
schema-driven-form (+ emoji-picker, image-upload) → game-level-studio (+ live-preview)
                                                  → content-review-queue
live-preview · publish-and-version · seo-content-admin (độc lập)
```

### Bước 13 — [`live-preview.md`](../specs/06-admin/live-preview.md)

- [ ] Đọc hết 160 dòng; điền "vì sao" cho **1** cảnh báo `C6`
- [ ] Kiểm rule "dùng engine thật, cấm mock" còn nguyên — đối chiếu
      [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md)
- [ ] `status: approved`; commit `feat(specs): T9 bước 13 — approve live-preview`

### Bước 14 — [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md)

- [ ] Đọc hết 174 dòng; điền "vì sao" cho **1** cảnh báo `C6`
- [ ] **Q1 — cặp 9 của mục 6.** [`game-template-contract.md`](../specs/01-platform/game-template-contract.md)
      Q4 ghi "hoãn — chốt lúc [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md)
      thiết kế". Chốt cách khai `refine` dạng ui-hint, ghi **một** `D-*`, sửa **cả hai** file
      trong cùng commit
- [ ] [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) là `P1` đã
      `approved` — nêu ở Cổng dừng C
- [ ] `status: approved`; commit `feat(specs): T9 bước 14 — approve schema-driven-form + đóng GTC Q4`

### Bước 15 — [`game-level-studio.md`](../specs/06-admin/game-level-studio.md)

- [ ] Đọc hết 197 dòng; 0 cảnh báo `C6`
- [ ] Đối chiếu "validate `content_pack` ở server" với
      [`game-template-contract.md`](../specs/01-platform/game-template-contract.md)
- [ ] `status: approved`; commit `feat(specs): T9 bước 15 — approve game-level-studio`

### Bước 16 — [`content-review-queue.md`](../specs/06-admin/content-review-queue.md)

- [ ] Đọc hết 194 dòng; điền "vì sao" cho **1** cảnh báo `C6`
- [ ] Q1 (bao nhiêu bản/ngày/người) — dùng câu trả lời số 6 của Cổng dừng A. Đây là ràng buộc
      đường găng, cũng là câu hỏi mở #3 của [`SPEC.md`](../SPEC.md) — nếu chốt được thì cập nhật
      cả hai chỗ
- [ ] Q2 — cặp 8 của mục 6, khớp [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q1
- [ ] Q3 — trỏ [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) Q5
- [ ] Kiểm rule "cấm duyệt theo lô" còn nguyên
- [ ] `status: approved`; commit `feat(specs): T9 bước 16 — approve content-review-queue`

### Bước 17 — [`publish-and-version.md`](../specs/06-admin/publish-and-version.md)

- [ ] Đọc hết 177 dòng; điền "vì sao" cho **1** cảnh báo `C6`
- [ ] **Q1 — cặp 10 của mục 6, tham chiếu chết.** [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md)
      Q3 (trạng thái `scheduled`) đã **đóng** `D-X` ở Task #10 — "không ở MVP". Đóng Q1 theo,
      trích `D-X`, **không mở lại quyết định**
- [ ] `status: approved`; commit `feat(specs): T9 bước 17 — approve publish-and-version`

### Bước 18 — [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md)

- [ ] Đọc hết 157 dòng; điền "vì sao" cho **2** cảnh báo `C6`
- [ ] Q1 (bao nhiêu trang SEO ở MVP) — `Chặn phase: P1` theo nguyên văn hiện có; xác nhận lại với
      [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) vừa `approved`
      ở Task #8
- [ ] `status: approved`; commit `feat(specs): T9 bước 18 — approve seo-content-admin`

---

## Cổng dừng C

- [ ] 6/6 spec lô C `approved`; **22/30** spec đích xong
- [ ] `pnpm lint:specs` 0 lỗi, cảnh báo **≤ 80**
- [ ] `pnpm check` xanh, `pnpm test` xanh
- [ ] Xác nhận `D-*` cho cặp 9 (sửa [`game-template-contract.md`](../specs/01-platform/game-template-contract.md),
      spec `P1` đã `approved`) và cặp 10 (đóng Q1 của
      [`publish-and-version.md`](../specs/06-admin/publish-and-version.md) theo `D-X`)

---

## Lô D — vận hành người dùng (4 spec)

```
user-management → user-detail → child-profile-admin
admin-dashboard (độc lập)
```

### Bước 19 — [`user-management.md`](../specs/06-admin/user-management.md)

- [ ] Đọc hết 178 dòng; điền "vì sao" cho **1** cảnh báo `C6`
- [ ] Q1 (support note) — cặp 6 của mục 6; chốt **một lần** ở đây, [`user-detail.md`](../specs/06-admin/user-detail.md)
      trỏ sang
- [ ] Kiểm rule "thu hồi phiên khi khoá" khớp mục 7.4 của
      [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md)
- [ ] `status: approved`; commit `feat(specs): T9 bước 19 — approve user-management`

### Bước 20 — [`user-detail.md`](../specs/06-admin/user-detail.md)

- [ ] Đọc hết 135 dòng; điền "vì sao" cho **2** cảnh báo `C6`
- [ ] Q1 trỏ sang [`user-management.md`](../specs/06-admin/user-management.md) Q1, không lặp lại
      quyết định
- [ ] `status: approved`; commit `feat(specs): T9 bước 20 — approve user-detail`

### Bước 21 — [`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md)

- [ ] Đọc hết 163 dòng **cạnh** [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
- [ ] Điền "vì sao" cho **1** cảnh báo `C6`
- [ ] Kiểm ba rule không được nới: đúng 4 trường · cấm trang liệt kê toàn bộ trẻ · cấm tìm kiếm
      trẻ theo tên. Nghị định 13/2023 là lý do, ghi lý do vào cột "vì sao"
- [ ] `status: approved`; commit `feat(specs): T9 bước 21 — approve child-profile-admin`

### Bước 22 — [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md)

- [ ] Đọc hết 163 dòng; 0 cảnh báo `C6`
- [ ] Q1 (doanh thu tháng) — trỏ sang `D-*` đã ghi ở bước 12, không chốt lại
- [ ] Kiểm rule "đọc từ rollup, cấm quét bảng thô" khớp
      [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md)
- [ ] `status: approved`; commit `feat(specs): T9 bước 22 — approve admin-dashboard`

---

## Cổng dừng D

- [ ] 4/4 spec lô D `approved`; **26/30** spec đích xong
- [ ] `pnpm lint:specs` 0 lỗi, cảnh báo **≤ 76**
- [ ] `pnpm check` xanh, `pnpm test` xanh

---

## Lô E — nhật ký, cờ, xuất dữ liệu, MFA (8 spec)

### Bước 23 — [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md)

- [ ] Đọc hết 155 dòng; điền "vì sao" cho **3** cảnh báo `C6`
- [ ] Kiểm hai rule không nới: cờ luôn có hạn · cấm cờ gate ràng buộc tuân thủ
- [ ] `status: approved`; commit `feat(specs): T9 bước 23 — approve feature-flag-service`

### Bước 24 — [`feature-flags.md`](../specs/06-admin/feature-flags.md)

- [ ] Đọc hết 131 dòng; điền "vì sao" cho **1** cảnh báo `C6`
- [ ] `status: approved`; commit `feat(specs): T9 bước 24 — approve feature-flags`

### Bước 25 — [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md)

- [ ] Đọc hết 148 dòng; điền "vì sao" cho **2** cảnh báo `C6`
- [ ] Đối chiếu 28 hành động bắt buộc audit với [`audit-log.md`](../specs/01-platform/audit-log.md)
- [ ] `status: approved`; commit `feat(specs): T9 bước 25 — approve audit-log-viewer`

### Bước 26 — [`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md)

- [ ] Đọc hết 141 dòng; điền "vì sao" cho **2** cảnh báo `C6`
- [ ] Q1 (Sentry hay tự xây) — dùng câu trả lời số 4 của Cổng dừng A, ghi `D-*`
- [ ] Kiểm rule "strip PII ở tầng nhận" — không nới
- [ ] `status: approved`; commit `feat(specs): T9 bước 26 — approve error-log-viewer`

### Bước 27 — [`system-activity.md`](../specs/06-admin/system-activity.md)

- [ ] Đọc hết 121 dòng; điền "vì sao" cho **2** cảnh báo `C6`
- [ ] Kiểm rule "cấm hiện xanh khi không có số liệu" khớp
      [`health-check.md`](../specs/01-platform/health-check.md) (cấm 200 cứng) — cùng một nguyên tắc
- [ ] `status: approved`; commit `feat(specs): T9 bước 27 — approve system-activity`

### Bước 28 — [`data-export.md`](../specs/06-admin/data-export.md)

- [ ] Đọc hết 160 dòng; điền "vì sao" cho **4** cảnh báo `C6`
- [ ] Kiểm rule "PII của trẻ ở bất kỳ loại xuất nào" nằm trong nhóm Never — đối chiếu
      [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
- [ ] `status: approved`; commit `feat(specs): T9 bước 28 — approve data-export`

### Bước 29 — [`notification-admin.md`](../specs/06-admin/notification-admin.md)

- [ ] Đọc hết 150 dòng; điền "vì sao" cho **1** cảnh báo `C6`
- [ ] Q1 (provider có bounce/delivery) — dùng câu trả lời số 5 của Cổng dừng A
- [ ] Đối chiếu 11 loại thông báo, một kênh email với
      [`notification-service.md`](../specs/01-platform/notification-service.md)
- [ ] `status: approved`; commit `feat(specs): T9 bước 29 — approve notification-admin`

### Bước 30 — [`mfa.md`](../specs/03-account/mfa.md)

- [ ] Đọc hết 213 dòng — file nhiều cảnh báo `C6` nhất lô, để riêng, không ghép chung ngày
- [ ] Điền "vì sao" cho **5** cảnh báo `C6`
- [ ] Đối chiếu reauth 5 phút ở mục 7.4 của
      [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) — MFA dựa vào cơ
      chế đó, không tự định nghĩa
- [ ] Đối chiếu [`social-login.md`](../specs/03-account/social-login.md) (vừa `approved` ở Task #8)
      — rule "cấm coi SNS là yếu tố thứ hai" phải còn nguyên
- [ ] Q1, Q2 (mất cả thiết bị lẫn mã khôi phục / tài khoản chỉ có SNS) — chốt hoặc để mở với
      `Chủ` rõ; cả hai là chính sách hỗ trợ
- [ ] `status: approved`; commit `feat(specs): T9 bước 30 — approve mfa`

---

## Bước 31 — Bảng P2 của [`roadmap.md`](../specs/roadmap.md) đủ 31 spec

Bảng hiện nêu tên 22 spec; **31** spec mang `phase: P2`. Thiếu 9:

- [ ] [`data-export.md`](../specs/06-admin/data-export.md)
- [ ] [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md)
- [ ] [`feature-flags.md`](../specs/06-admin/feature-flags.md)
- [ ] [`image-storage.md`](../specs/01-platform/image-storage.md)
- [ ] [`notification-admin.md`](../specs/06-admin/notification-admin.md)
- [ ] [`payment-flow.md`](../specs/00-foundation/payment-flow.md)
- [ ] [`pricing-page.md`](../specs/02-public/pricing-page.md)
- [ ] [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md)
- [ ] [`subscription-view.md`](../specs/03-account/subscription-view.md)

- [ ] Xếp đúng vị trí theo `depends_on`, **không nối vào cuối bảng**
- [ ] Kiểm lại: số spec trong bảng P2 = số spec có `phase: P2` = **31**
- [ ] Commit `docs(specs): T9 bước 31 — bảng P2 của roadmap đủ 31 spec`

---

## Bước 32 — Đối chiếu tay và đóng sổ

Cổng máy không bắt được mọi thứ. Task #3, #5, #6 và #8 đều chạy bước này và cả bốn lần đều tìm ra
chỗ lệch mà kiểm tra tự động bỏ qua.

- [ ] Đếm `status: approved` toàn corpus — phải ra **110/130**
- [ ] Đếm `phase: P2` và `approved` — phải ra **31/31**
- [ ] Đếm cảnh báo `C6` còn nằm trên spec `phase: P2` — phải ra **0**
- [ ] Đếm bảng mục 11 dạng 3 cột trên 30 file phạm vi — phải ra **0** (23 spec `approved` khác còn < 5 cột ghi nhận nợ cho Chặng 2 mục 8)
- [ ] Mọi `BR-*` vừa sửa hoặc vừa điền "vì sao" có mặt trong
      [`business-rules.md`](../specs/00-foundation/business-rules.md)
- [ ] Mọi hàng câu hỏi mở của 31 spec `P2` có `Chặn phase` và `Chủ` không rỗng
- [ ] **Mọi câu hỏi biến mất khỏi mục 11 có một mã `D-*` giải thích.** Câu hỏi bị xoá mà không có
      quyết định là thông tin mất lặng lẽ
- [ ] Mười cặp ở mục 6 của kế hoạch: mỗi cặp đã đóng **một lần**, hai file trỏ vào nhau, không
      hai quyết định lệch nhau
- [ ] Mọi lần sửa spec đã `approved` ([`payment-flow.md`](../specs/00-foundation/payment-flow.md) ·
      [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) ·
      [`package-catalog.md`](../specs/00-foundation/package-catalog.md) ·
      [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) ·
      `schema-*`) có `D-*` và đã nêu ở cổng dừng tương ứng
- [ ] Đọc lại mọi cột "vì sao" vừa viết. Hỏi từng cái: người sau đọc câu này có hiểu vì sao không
      được xoá rule không? Câu nào chỉ diễn giải lại tên rule thì viết lại
- [ ] [`SPEC.md`](../SPEC.md) mục 14 và [`index.md`](../specs/index.md) mục Tổng khớp số đếm —
      task này không thêm hay xoá file spec nào nên số phải **không đổi**
- [ ] Commit `docs(specs): T9 bước 32 — đóng corpus P2, đối chiếu tay`

---

## Cổng dừng cuối — kết thúc task

- [ ] 29/29 spec đích `approved` (cộng rà soát [`payment-flow.md`](../specs/00-foundation/payment-flow.md)), tổng corpus **110/130**
- [ ] `phase: P2` đạt **31/31**
- [ ] `pnpm lint:specs` 0 lỗi, **0 chu trình**, cảnh báo **≤ 54** (trên 29 spec đích và payment-flow)
- [ ] `pnpm check` xanh
- [ ] `pnpm test` xanh (số test tăng do thêm unit test cho C16)
- [ ] `git push` sạch, `origin/main..HEAD` ra **0**

---

## Lệnh đếm dùng ở Bước 0 và Bước 32

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH

# Tổng approved — Bước 0 ra 79, Bước 32 ra 109
grep -rh "^status: approved" docs/specs/*/ --include="*.md" | wc -l

# P2 theo status — Bước 32 phải ra 31 approved, 0 draft
for f in $(grep -rl "^phase: P2" docs/specs/*/ --include="*.md"); do
  grep -m1 "^status:" "$f"
done | sort | uniq -c

# Cảnh báo C6 còn trên spec P2 — phải ra 0
pnpm lint:specs 2>&1 | grep "\[C6\]" | while read -r line; do
  f="docs/specs/${line%%:*}"
  grep -q "^phase: P2" "$f" && echo "$line"
done

# Bảng mục 11 còn 3 cột trên spec approved — phải ra rỗng
for f in $(grep -rl "^status: approved" docs/specs/*/ --include="*.md"); do
  awk '/^## 11\./{f=1;next} f&&/^## /{exit} f&&/Câu hỏi/{if(gsub(/\|/,"|")<6) print FILENAME}' "$f"
done

# Bảng P2 của roadmap so với frontmatter — hai số phải bằng nhau
awk '/^## P2/{f=1} /^## P3/{f=0} f' docs/specs/roadmap.md \
  | grep -o "([^)]*\.md)" | sed 's|.*/||;s|)||' | sort -u | wc -l
grep -rl "^phase: P2" docs/specs/*/ --include="*.md" | wc -l

# Cổng
pnpm lint:specs && pnpm test && pnpm check
```
