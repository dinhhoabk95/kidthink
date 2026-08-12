# Checklist — Task #66: P4.5 — Game cá nhân từ sáu template

> Plan: [`66-p4-5-custom-game-builder-plan.md`](66-p4-5-custom-game-builder-plan.md)
> Spec: [`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md)

## T0–T1 — Preflight/contract

- [ ] Cổng ra P3 và template/studio/config/play/storage dependencies `implemented`.
- [ ] Ghi seams thật; đối chiếu `BR-CGB-*`, GLM, emoji, child-data, §7.3.
- [ ] Chốt moderation provider/list, payload, timeout, fail policy, logging, DPA.
- [ ] Chốt quota thay/xác nhận số 10 và semantics draft/ready/delete/upload.
- [ ] Chốt `skill_ids`/exposure; source kind custom bị loại khỏi mastery.
- [ ] Architecture/catalog/entitlement/play/report/error specs cập nhật trước code.

## Checkpoint A

- [ ] D-P4Q…D-P4T + dependency được security/legal/human review; SKU ẩn.

## T2–T4 — Moderation/schema/shared validation

- [ ] Moderation port versioned, cap/timeout/fail policy; test không gọi provider thật.
- [ ] Log không child data/UGC thô ngoài retention.
- [ ] Migration custom game không tier/version/public lifecycle; DB rỗng/upgrade/rollback xanh.
- [ ] Custom và studio dùng cùng content/editorial validator.
- [ ] Cả sáu template có round-trip property + fixture âm.

## T5 — API

- [ ] POST/PATCH/validate/config: Zod, entitlement, owner/child 404, expected version.
- [ ] Ready bắt buộc shared validation + moderation.
- [ ] Emoji registry/upload quota enforce server; không SVG/URL tuyệt đối.
- [ ] Không route list/public/catalog; IDOR matrix xanh.

## Checkpoint B

- [ ] CRUD/moderation/quota/config/ownership xanh; human review UGC payload/query.

## T6–T7 — Play/UI

- [ ] Custom chạy cùng engine, session ghi source kind.
- [ ] Mọi chuỗi custom không đổi mastery/adaptive; property test xanh.
- [ ] History/exposure đúng quyết định, không suy diễn điểm mastery.
- [ ] Builder sáu template/preview/errors bằng tiếng Việt; draft không mất khi fail.
- [ ] Keyboard/tablet/a11y E2E xanh.

## T8 — Evidence/release

- [ ] Moderation fail/quota race/six-template/IDOR/mastery isolation xanh.
- [ ] Mỗi `BR-CGB-01…10` có test mang mã.
- [ ] Full gate + progress xanh; spec/SKU release cùng lúc sau human review.
- [ ] Không public UGC, không auto-merge/migration ngoài local.

## Ngoài phạm vi

- [ ] Không submit duyệt/public/collaboration/template thứ bảy.
- [ ] Không child khác owner hoặc custom game tính mastery.
