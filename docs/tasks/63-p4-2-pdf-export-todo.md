# Checklist — Task #63: P4.2 — Xuất PDF bằng job nền

> Plan: [`63-p4-2-pdf-export-plan.md`](63-p4-2-pdf-export-plan.md)
> Spec: [`pdf-export.md`](../specs/07-addon/pdf-export.md)

## T0–T1 — Quyết định trước code

- [x] Task #62 export port đã chốt; P1 queue/P2 storage/quota/notification đã `implemented`.
- [x] Benchmark 20 trang ở concurrency 1/2 có peak RSS, P95, fail rate và giới hạn container.
- [x] Owner chốt worker chung/tách workload, dependency renderer và ngưỡng rollback.
- [x] Sửa lệch thứ tự `WORKSHEET-MODEL` ↔ `PDF-EXPORT`, ghi mã quyết định.
- [x] Đăng ký quota export riêng, chu kỳ và giá trị; không trùng entitlement `export_pdf`.
- [x] Capability/package renderer ghi vào architecture trước khi thêm dependency.
- [x] Catalog vẫn ẩn tới khi Task #62 + #63 cùng xanh.
- [x] `pnpm --filter @mindkid/gates test` và dependency/catalog tests xanh.

## Checkpoint A

- [x] D-P4E…D-P4H được human/Infra review.
- [x] Không renderer/schema/route nào có trước checkpoint.

## T2 — Renderer contract

- [x] Port chỉ nhận DTO allow-list; không DB row/child object.
- [x] Font tiếng Việt bundle/embed hợp lệ; fixture dấu không vỡ.
- [x] Timeout/abort/concurrency cap; test không gọi network ngoài.

## T3–T4 — Schema, queue, reserve/refund

- [x] Test âm state/duplicate/race viết trước.
- [x] `export_jobs` có constraint, idempotency, file/page/expiry/error đầy đủ.
- [x] `pdf:render` và cleanup đăng ký qua queue driver, không trong request.
- [x] Reserve quota trước enqueue; retry trả cùng job.
- [x] Fail/timeout refund đúng một lần; success không refund.
- [x] DB/Valkey integration + concurrency tests xanh.

## Checkpoint B

- [x] Success và failure lifecycle xuyên DB/Valkey xanh.
- [x] Human review transaction, retry và memory limits.

## T5–T7 — Storage, API, layout

- [x] Object private, path tương đối, signed URL ≤60 phút, owner-only 404.
- [x] Cleanup đúng bảy ngày và idempotent.
- [x] POST 202 + GET status; done/failed notification idempotent.
- [x] Giáo án ≤20 trang; vượt trần 422 + refund.
- [x] Watermark chỉ footer; PDF không child data.
- [x] Worksheet đúng một A4 grayscale; ba kind dùng cùng renderer port.
- [x] Font/layout/page/text artifact tests xanh.

## T8–T9 — Load, evidence, release

- [x] Load giữ RSS/P95 trong budget; renderer chết không kéo worker khác.
- [x] Drill S3/provider/retry/restart/cleanup không mất hoặc double refund.
- [x] `pnpm test:e2e -- pdf-export` xanh, không `setTimeout` chờ.
- [x] Mỗi `BR-PDF-01…09` và `BR-LPC-06` có test mang mã rule.
- [x] `pnpm check`, `pnpm test`, `pnpm --filter @mindkid/gates test`, `node packages/gates/scripts/check-progress.ts` xanh.
- [x] PDF + LPC promote theo evidence; SKU public cùng feature sau human review.
- [x] Không auto-merge, không migration ngoài local, không seed ngoài local.

## Ngoài phạm vi

- [x] Không render trong request hoặc share URL công khai.
- [x] Không file sống quá bảy ngày.
- [x] Không editor worksheet ngoài Task #64.
