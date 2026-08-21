# Checklist — Task #64: P4.3 — Worksheet một trang, in đen trắng

> Plan: [`64-p4-3-worksheet-model-plan.md`](64-p4-3-worksheet-model-plan.md)
> Spec: [`worksheet-model.md`](../specs/05-content/worksheet-model.md)

## T0–T1 — Preflight và contract

- [x] Task #63, P3 activity/lesson authoring và P2 lifecycle đều `implemented`.
- [x] Đọc seam thật; đối chiếu `BR-WSM-*`, `BR-ACM-05`, business-rules §7.3.
- [x] Chốt quan hệ objective, sáu layout/schema block và representation alternative.
- [x] Publish evidence có artifact status + source version + input hash, không path-only.
- [x] Sửa canonical dependency worksheet sau PDF và đăng ký mọi mã lỗi.
- [x] `pnpm --filter @mindkid/gates test` xanh; schema change được human review.

## Checkpoint A

- [x] D-P4I…D-P4L được duyệt; không migration/editor trước checkpoint.

## T2 — Schema/contract

- [x] Test âm loại thứ bảy, block chữ trẻ, kích thước sai viết trước.
- [x] Mở rộng bảng worksheet hiện có, không tạo bảng v2 song song.
- [x] Sáu discriminated schema parse đúng; objective relation theo pattern canonical.
- [x] DB rỗng/upgrade/rollback xanh; không sửa tay file `@generated`.

## T3–T4 — Render và studio

- [x] Renderer dùng port #63; input hash/version khớp.
- [x] Inspector: một A4, grayscale, vùng ≥20mm, stroke ≥2pt.
- [x] Footer người lớn có; watermark không vào vùng làm bài.
- [x] Studio CRUD/lifecycle sáu loại, preview artifact thật, stale/failed state rõ.
- [x] Autosave/version conflict không mất dữ liệu; keyboard/a11y xanh.

## Checkpoint B

- [x] Cả sáu loại edit → enqueue → preview đúng version.
- [x] Human review schema, renderer, artifact và UI.

## T5 — Publish/lesson gate

- [x] Render fail/stale/multi-page chặn review/publish.
- [x] Lesson worksheet thiếu alternative trả checklist fail.
- [x] Có alternative không in thì qua; server là nguồn truth.
- [x] Published bất biến; version mới bắt buộc render mới.

## T6–T8 — Download, gate, evidence

- [x] Download Zod/auth/entitlement/access ở server; cache private/no-store.
- [x] Chỉ current published artifact, signed URL ≤60 phút; không lộ path/content locked.
- [x] Sáu fixture qua page/measurement/font/grayscale/footer/watermark.
- [x] IDOR/stale/path leak/render fail tests xanh.
- [x] Mỗi `BR-WSM-01…08` có test/evidence mang mã rule.
- [x] `pnpm check`, `pnpm test`, `pnpm --filter @mindkid/gates test`, `node packages/gates/scripts/check-progress.ts` xanh.
- [x] Spec promote sau human artifact review; không publish/seed ngoài local.

## Ngoài phạm vi

- [x] Không nhiều trang hoặc loại thứ bảy.
- [x] Không OCR/chấm bài/ảnh trẻ.
- [x] Không renderer hoặc lifecycle thứ hai.
