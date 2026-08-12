# Checklist — Task #63: P4.2 — Xuất PDF bằng job nền

> Plan: [`63-p4-2-pdf-export-plan.md`](63-p4-2-pdf-export-plan.md)
> Spec: [`pdf-export.md`](../specs/07-addon/pdf-export.md)

## T0–T1 — Quyết định trước code

- [ ] Task #62 export port đã chốt; P1 queue/P2 storage/quota/notification đã `implemented`.
- [ ] Benchmark 20 trang ở concurrency 1/2 có peak RSS, P95, fail rate và giới hạn container.
- [ ] Owner chốt worker chung/tách workload, dependency renderer và ngưỡng rollback.
- [ ] Sửa lệch thứ tự `WORKSHEET-MODEL` ↔ `PDF-EXPORT`, ghi mã quyết định.
- [ ] Đăng ký quota export riêng, chu kỳ và giá trị; không trùng entitlement `export_pdf`.
- [ ] Capability/package renderer ghi vào architecture trước khi thêm dependency.
- [ ] Catalog vẫn ẩn tới khi Task #62 + #63 cùng xanh.
- [ ] `pnpm lint:specs` và dependency/catalog tests xanh.

## Checkpoint A

- [ ] D-P4E…D-P4H được human/Infra review.
- [ ] Không renderer/schema/route nào có trước checkpoint.

## T2 — Renderer contract

- [ ] Port chỉ nhận DTO allow-list; không DB row/child object.
- [ ] Font tiếng Việt bundle/embed hợp lệ; fixture dấu không vỡ.
- [ ] Timeout/abort/concurrency cap; test không gọi network ngoài.

## T3–T4 — Schema, queue, reserve/refund

- [ ] Test âm state/duplicate/race viết trước.
- [ ] `export_jobs` có constraint, idempotency, file/page/expiry/error đầy đủ.
- [ ] `pdf:render` và cleanup đăng ký qua queue driver, không trong request.
- [ ] Reserve quota trước enqueue; retry trả cùng job.
- [ ] Fail/timeout refund đúng một lần; success không refund.
- [ ] DB/Valkey integration + concurrency tests xanh.

## Checkpoint B

- [ ] Success và failure lifecycle xuyên DB/Valkey xanh.
- [ ] Human review transaction, retry và memory limits.

## T5–T7 — Storage, API, layout

- [ ] Object private, path tương đối, signed URL ≤60 phút, owner-only 404.
- [ ] Cleanup đúng bảy ngày và idempotent.
- [ ] POST 202 + GET status; done/failed notification idempotent.
- [ ] Giáo án ≤20 trang; vượt trần 422 + refund.
- [ ] Watermark chỉ footer; PDF không child data.
- [ ] Worksheet đúng một A4 grayscale; ba kind dùng cùng renderer port.
- [ ] Font/layout/page/text artifact tests xanh.

## T8–T9 — Load, evidence, release

- [ ] Load giữ RSS/P95 trong budget; renderer chết không kéo worker khác.
- [ ] Drill S3/provider/retry/restart/cleanup không mất hoặc double refund.
- [ ] `pnpm test:e2e -- pdf-export` xanh, không `setTimeout` chờ.
- [ ] Mỗi `BR-PDF-01…09` và `BR-LPC-06` có test mang mã rule.
- [ ] `pnpm check`, `pnpm test`, `pnpm lint:specs`, `pnpm check:progress` xanh.
- [ ] PDF + LPC promote theo evidence; SKU public cùng feature sau human review.
- [ ] Không auto-merge, không migration ngoài local, không seed ngoài local.

## Ngoài phạm vi

- [ ] Không render trong request hoặc share URL công khai.
- [ ] Không file sống quá bảy ngày.
- [ ] Không editor worksheet ngoài Task #64.
