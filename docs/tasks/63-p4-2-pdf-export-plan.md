# Kế hoạch — Task #63: P4.2 — Xuất PDF bằng job nền

> Viết 2026-08-11, đo tại commit `484ebaf`.
> Spec sở hữu: [`pdf-export.md`](../specs/07-addon/pdf-export.md).
> Phụ thuộc trực tiếp: [`62-p4-1-lesson-plan-creator-plan.md`](62-p4-1-lesson-plan-creator-plan.md).
> Mở khoá: [`64-p4-3-worksheet-model-plan.md`](64-p4-3-worksheet-model-plan.md).

## Tóm tắt

Task #63 tạo pipeline export thật: reserve quota → enqueue → render ở worker → lưu private →
signed URL → cleanup bảy ngày, với refund idempotent khi fail. Trước code phải đo Puppeteer
trên cấu hình tương đương t3.small và chốt renderer/deployment; không thêm dependency theo phỏng
đoán. Task này là nửa còn lại của release `PKG-addon_lesson_plan`.

## 0. Điều kiện vào

- Task #62 đã chốt snapshot/export port và editor core.
- P1 queue, P2 storage/notification/catalog/quota đều `implemented`.
- Infra cung cấp môi trường benchmark tương đương giới hạn RAM/CPU production.
- Giá/quota export và quyền `export_pdf` có owner; chưa chốt thì chỉ benchmark + contract.

## 1. Hiện trạng và drift contract

- Chưa có renderer, `export_jobs`, route exports hay job cleanup trong source.
- Queue/worker/storage package đã có seam nền nhưng chưa có job add-on PDF.
- Registry quota chưa có key export; spec dùng chữ `export_pdf` trùng entitlement key.
- `worksheet-model.depends_on: PDF-EXPORT`; vì vậy worksheet phải chạy sau task này dù roadmap
  đang trình bày theo chiều ngược. T0 phải sửa/ghi quyết định thứ tự trước implementation.

## 2. Quyết định bắt buộc

**D-P4E — Chọn renderer bằng benchmark, không mặc định Puppeteer.** Fixture 20 trang tiếng
Việt, grayscale worksheet và concurrency 1/2; đo peak RSS, thời gian, fail rate trong giới hạn
t3.small. Nếu process vượt 80% RAM hoặc làm worker khác starve, tách workload theo phương án
Infra duyệt. Mọi dependency mới cần review contract trước.

**D-P4F — Quota export là key riêng có chu kỳ.** Chọn tên canonical không trùng entitlement;
reserve trước enqueue trong transaction, unique idempotency key theo request. Fail/timeout/cancel
ghi bút toán refund đúng một lần; success không refund.

**D-P4G — File private và immutable theo job.** Storage path tương đối, object private, signed
URL tối đa 60 phút, retention bảy ngày. Job cleanup idempotent; DB giữ evidence tối thiểu sau
khi object bị xoá.

**D-P4H — Một renderer contract cho ba loại.** Giáo án, worksheet và curriculum cá nhân dùng
cùng port; template/layout riêng nhưng chung font embedding, pagination, watermark, storage,
security và test harness.

## 3. Đồ thị

```text
T0 benchmark + sửa thứ tự roadmap/depends_on
 └── T1 chốt quota/renderer/package/release contract ── Checkpoint A
      ├── T2 renderer port + fixture font/layout
      └── T3 migration export_jobs + queue catalog
           └── T4 reserve/refund + worker lifecycle ── Checkpoint B
                ├── T5 private storage/signed URL/cleanup
                ├── T6 API status + notification
                └── T7 layout 3 kind + 20-page guard
                     └── T8 load/security/E2E ── Checkpoint C
                          └── T9 evidence + join Task #62/catalog
```

## 4. Task triển khai

### T0 — Benchmark và khép lệch thứ tự

**Tiêu chí nghiệm thu**

- [ ] Benchmark fixture xấu nhất ghi peak RSS/P95/fail rate ở concurrency 1 và 2; không gọi production.
- [ ] Owner chốt worker chung hay workload tách, kèm ngưỡng rollback/alert.
- [ ] Roadmap/`depends_on` worksheet–PDF có một chiều canonical và mã quyết định; không còn mâu thuẫn.

**Kiểm chứng:** báo cáo có command, giới hạn container và artifact; `pnpm lint:specs` xanh.

**Phụ thuộc:** Infra + Task #62 contract · **Files:** task evidence + tối đa 2 spec · **Cỡ:** S/M.

### T1 — Contract quota, package driver và lỗi

**Tiêu chí nghiệm thu**

- [ ] Đăng ký quota export, chu kỳ/giá trị do owner chốt; 402/422/503 dùng mã registry đúng.
- [ ] Capability renderer có package/adapter và thư viện nền được ghi ở architecture trước dependency.
- [ ] Catalog giữ ẩn tới join #62/#63; refund/idempotency/retention có contract duy nhất.

**Kiểm chứng:** `pnpm lint:specs`; dependency boundary và catalog pending tests xanh.

**Phụ thuộc:** T0 + human decisions · **Files:** PDF/entitlement/package/architecture/error specs · **Cỡ:** M.

### Checkpoint A — Không code trước quyết định hạ tầng

- [ ] D-P4E…D-P4H và dependency mới được review.
- [ ] Quota/renderer không còn placeholder; SKU vẫn ẩn.

### T2 — Renderer port và fixture chuẩn

**Tiêu chí nghiệm thu**

- [ ] Port nhận DTO allow-list, trả bytes/page_count/metrics; không nhận DB row hay child object.
- [ ] Font tiếng Việt được bundle/embed có license; fixture “Bé đếm quả táo” không ô vuông.
- [ ] Renderer có timeout, abort và giới hạn concurrency; unit test không cần network ngoài.

**Kiểm chứng:** `pnpm test -- pdf-renderer-contract`; snapshot/text extraction fixture xanh.

**Phụ thuộc:** Checkpoint A · **Files:** package renderer, adapter, fixture/test · **Cỡ:** M.

### T3 — `export_jobs` và job catalog

**Tiêu chí nghiệm thu**

- [ ] Migration có owner/ref/kind/status/idempotency/file/page/expiry/error/timestamps và constraint state.
- [ ] Job `pdf:render` + cleanup add-on dùng queue driver, retry/backoff/timeout đã chốt; không chạy trong request.
- [ ] DB rỗng + upgrade + rollback và duplicate enqueue có test PG/Valkey thật.

**Kiểm chứng:** `pnpm db:migrate`; `pnpm test -- export-job-schema export-queue`.

**Phụ thuộc:** Checkpoint A · **Files:** schema/migration, queue catalog, integration test · **Cỡ:** M.

### T4 — Reserve, render và refund nguyên tử

**Tiêu chí nghiệm thu**

- [ ] POST reserve quota trước enqueue; idempotency retry trả cùng job và không reserve lần hai.
- [ ] Worker state machine terminal-safe; fail/timeout ghi refund đúng một lần và notification lỗi.
- [ ] Race tests success-vs-timeout/retry chứng minh quota không âm, không double refund.

**Kiểm chứng:** `pnpm test -- pdf-export-lifecycle pdf-export-concurrency`.

**Phụ thuộc:** T2–T3 · **Files:** orchestration service, worker handler, tests · **Cỡ:** M.

### Checkpoint B — Lifecycle tiền và job

- [ ] Reserve→render→done và reserve→fail→refund đều xanh với DB/Valkey thật.
- [ ] Human review transaction, retry và worker memory limits.

### T5 — Storage private, signed URL và cleanup

**Tiêu chí nghiệm thu**

- [ ] Object private, path tương đối, MIME/size allow-list; signed URL ≤60 phút và owner-only status.
- [ ] Cleanup sau bảy ngày xoá object idempotent, không xoá trước hạn, ghi metric/error.
- [ ] Link 61 phút, IDOR job UUID và stale object đều có test âm.

**Kiểm chứng:** `pnpm test -- pdf-storage-retention` với S3 local.

**Phụ thuộc:** T4 + storage P2 · **Files:** storage adapter, cleanup handler, integration test · **Cỡ:** M.

### T6 — API và notification

**Tiêu chí nghiệm thu**

- [ ] POST `/api/users/exports` trả 202; GET status chỉ owner, Zod đầy đủ, không polling vô hạn.
- [ ] Done trả signed URL mới; failed trả lỗi thân thiện + trạng thái refund, không stack/provider detail.
- [ ] Notification done/failed idempotent; route không render hay stream process renderer.

**Kiểm chứng:** `pnpm test -- pdf-export-api`; E2E polling bằng `expect.poll()`.

**Phụ thuộc:** T4–T5 · **Files:** 2 route, notification adapter, tests · **Cỡ:** M.

### T7 — Layout và ràng buộc output

**Tiêu chí nghiệm thu**

- [ ] Giáo án ≤20 trang, watermark chỉ footer, font đúng; vượt trần fail/refund.
- [ ] PDF không child data; DTO allow-list/deep scan và fixture canary chứng minh.
- [ ] Worksheet một A4 grayscale và curriculum table dùng cùng renderer port, chưa bật UI ngoài task sở hữu.

**Kiểm chứng:** `pnpm test -- pdf-layout-contract`; render + inspect page/text/image artifact local.

**Phụ thuộc:** T2 + T4 · **Files:** templates theo kind + contract tests · **Cỡ:** M từng kind.

### T8 — Load, a11y và failure drill

**Tiêu chí nghiệm thu**

- [ ] Load theo concurrency đã chốt giữ RSS/P95 trong budget; timeout không kéo worker job khác.
- [ ] Download/status UI keyboard/screen-reader được; lỗi tiếng Việt, không lộ path/provider.
- [ ] Drill renderer chết, S3 lỗi, retry, cleanup lỗi và restart worker không mất/refund sai job.

**Kiểm chứng:** load report + `pnpm test:e2e -- pdf-export` + full worker tests.

**Phụ thuộc:** T5–T7 · **Files:** load/E2E/ops evidence · **Cỡ:** M.

### Checkpoint C — Artifact và vận hành

- [ ] Layout, storage, API, load và failure drill xanh trong cùng giới hạn đã benchmark.
- [ ] Human review artifact thật và runbook trước release.

### T9 — Evidence và release join

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-PDF-01…09` có test mang mã rule; `BR-LPC-06` dùng cùng quota service.
- [ ] Full gate xanh; PDF spec và LPC spec promote theo đúng evidence.
- [ ] `PKG-addon_lesson_plan` chỉ public trong join có human review; không seed ngoài local.

**Kiểm chứng:** `pnpm check`, `pnpm test`, `pnpm lint:specs`, `pnpm check:progress` và diff catalog.

**Phụ thuộc:** Checkpoint C + Task #62 · **Files:** spec status, evidence, catalog/progress test · **Cỡ:** S.

## 5. Rủi ro và ngoài phạm vi

| Rủi ro | Giảm thiểu |
|---|---|
| Renderer OOM làm chết worker | benchmark, concurrency cap, workload isolation và alert trước catalog |
| Double refund/quota | ledger/idempotency + race test |
| Signed URL/file lộ | object private, owner 404, TTL và deep leak test |
| Font/layout vỡ | artifact fixture tiếng Việt + page/text inspection |

Ngoài phạm vi: editor worksheet (Task #64), share PDF công khai, file sống >7 ngày, render trong request.
