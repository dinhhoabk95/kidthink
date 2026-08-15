# Checklist — Task #66: P4.5 — Game cá nhân từ sáu template

> Plan: [`66-p4-5-custom-game-builder-plan.md`](66-p4-5-custom-game-builder-plan.md)
> Spec: [`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md)

## T0–T1 — Preflight/contract

- [x] Cổng ra P3 và template/studio/config/play/storage dependencies `implemented`.
- [x] Ghi seams thật; đối chiếu `BR-CGB-*`, GLM, emoji, child-data, §7.3.
- [x] Chốt moderation provider/list, payload, timeout, fail policy, logging, DPA.
- [x] Chốt quota thay/xác nhận số 10 và semantics draft/ready/delete/upload.
- [x] Chốt `skill_ids`/exposure; source kind custom bị loại khỏi mastery.
- [x] Architecture/catalog/entitlement/play/report/error specs cập nhật trước code.

## Checkpoint A

- [x] D-P4Q…D-P4T + dependency được security/legal/human review; SKU ẩn.

## T2–T4 — Moderation/schema/shared validation

- [x] Moderation port versioned, cap/timeout/fail policy; test không gọi provider thật.
- [x] Log không child data/UGC thô ngoài retention.
- [x] Migration custom game không tier/version/public lifecycle; DB rỗng/upgrade/rollback xanh.
- [x] Custom và studio dùng cùng content/editorial validator.
- [x] Cả sáu template có round-trip property + fixture âm.

## T5 — API

- [x] POST/PATCH/validate/config: Zod, entitlement, owner/child 404, expected version.
- [x] Ready bắt buộc shared validation + moderation.
- [x] Emoji registry/upload quota enforce server; không SVG/URL tuyệt đối.
- [x] Không route list/public/catalog; IDOR matrix xanh.

## Checkpoint B

- [x] CRUD/moderation/quota/config/ownership xanh; human review UGC payload/query.

## T6–T7 — Play/UI

- [x] Custom chạy cùng engine, session ghi source kind.
- [x] Mọi chuỗi custom không đổi mastery/adaptive; property test xanh.
- [x] History/exposure đúng quyết định, không suy diễn điểm mastery.
- [x] Builder sáu template/preview/errors bằng tiếng Việt; draft không mất khi fail.
- [x] Keyboard/tablet/a11y E2E xanh.

## T8 — Evidence/release

- [x] Moderation fail/quota race/six-template/IDOR/mastery isolation xanh.
- [x] Mỗi `BR-CGB-01…10` có test mang mã.
- [x] Full gate + progress xanh; spec/SKU release cùng lúc sau human review.
- [x] Không public UGC, không auto-merge/migration ngoài local.

## Ngoài phạm vi

- [x] Không submit duyệt/public/collaboration/template thứ bảy.
- [x] Không child khác owner hoặc custom game tính mastery.
