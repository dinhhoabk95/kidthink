# Checklist — Task #64: P4.3 — Worksheet một trang, in đen trắng

> Plan: [`64-p4-3-worksheet-model-plan.md`](64-p4-3-worksheet-model-plan.md)
> Spec: [`worksheet-model.md`](../specs/05-content/worksheet-model.md)

## T0–T1 — Preflight và contract

- [ ] Task #63, P3 activity/lesson authoring và P2 lifecycle đều `implemented`.
- [ ] Đọc seam thật; đối chiếu `BR-WSM-*`, `BR-ACM-05`, business-rules §7.3.
- [ ] Chốt quan hệ objective, sáu layout/schema block và representation alternative.
- [ ] Publish evidence có artifact status + source version + input hash, không path-only.
- [ ] Sửa canonical dependency worksheet sau PDF và đăng ký mọi mã lỗi.
- [ ] `pnpm lint:specs` xanh; schema change được human review.

## Checkpoint A

- [ ] D-P4I…D-P4L được duyệt; không migration/editor trước checkpoint.

## T2 — Schema/contract

- [ ] Test âm loại thứ bảy, block chữ trẻ, kích thước sai viết trước.
- [ ] Mở rộng bảng worksheet hiện có, không tạo bảng v2 song song.
- [ ] Sáu discriminated schema parse đúng; objective relation theo pattern canonical.
- [ ] DB rỗng/upgrade/rollback xanh; không sửa tay file `@generated`.

## T3–T4 — Render và studio

- [ ] Renderer dùng port #63; input hash/version khớp.
- [ ] Inspector: một A4, grayscale, vùng ≥20mm, stroke ≥2pt.
- [ ] Footer người lớn có; watermark không vào vùng làm bài.
- [ ] Studio CRUD/lifecycle sáu loại, preview artifact thật, stale/failed state rõ.
- [ ] Autosave/version conflict không mất dữ liệu; keyboard/a11y xanh.

## Checkpoint B

- [ ] Cả sáu loại edit → enqueue → preview đúng version.
- [ ] Human review schema, renderer, artifact và UI.

## T5 — Publish/lesson gate

- [ ] Render fail/stale/multi-page chặn review/publish.
- [ ] Lesson worksheet thiếu alternative trả checklist fail.
- [ ] Có alternative không in thì qua; server là nguồn truth.
- [ ] Published bất biến; version mới bắt buộc render mới.

## T6–T8 — Download, gate, evidence

- [ ] Download Zod/auth/entitlement/access ở server; cache private/no-store.
- [ ] Chỉ current published artifact, signed URL ≤60 phút; không lộ path/content locked.
- [ ] Sáu fixture qua page/measurement/font/grayscale/footer/watermark.
- [ ] IDOR/stale/path leak/render fail tests xanh.
- [ ] Mỗi `BR-WSM-01…08` có test/evidence mang mã rule.
- [ ] `pnpm check`, `pnpm test`, `pnpm lint:specs`, `pnpm check:progress` xanh.
- [ ] Spec promote sau human artifact review; không publish/seed ngoài local.

## Ngoài phạm vi

- [ ] Không nhiều trang hoặc loại thứ bảy.
- [ ] Không OCR/chấm bài/ảnh trẻ.
- [ ] Không renderer hoặc lifecycle thứ hai.
