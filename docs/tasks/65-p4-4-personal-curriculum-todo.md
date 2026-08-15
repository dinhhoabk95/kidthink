# Checklist — Task #65: P4.4 — Curriculum cá nhân dùng chung player

> Plan: [`65-p4-4-personal-curriculum-plan.md`](65-p4-4-personal-curriculum-plan.md)
> Spec: [`personal-curriculum.md`](../specs/07-addon/personal-curriculum.md)

## T0–T1 — Preflight và contract

- [x] P3.3–P3.5, P2 catalog/entitlement `implemented`; đọc seam merge thật.
- [x] Đối chiếu `BR-PCU-*`, ownership, child-data và business-rules §7.3.
- [x] Chốt copy curriculum hệ thống, quota lưu và semantics count/delete.
- [x] Đăng ký `custom_curricula_saved`; catalog không còn quota rỗng khi public.
- [x] Chốt enrollment/source kind và hai player policy; không class roster.
- [x] `pnpm lint:specs` + registry/catalog tests xanh.

## Checkpoint A

- [x] D-P4M…D-P4P được human review; SKU vẫn ẩn.
- [x] Không migration trước quyết định schema/enrollment.

## T2 — Schema

- [x] Test âm orphan/duplicate/status viết trước.
- [x] Personal curriculum/items có owner/position, không access tier/content version/public lifecycle.
- [x] Enrollment seam rõ source kind; index/unique/FK đúng contract.
- [x] DB rỗng/upgrade/rollback xanh.

## T3–T4 — Shared policy và API

- [x] Balance dùng cùng pure function P3; warning không chặn personal ready.
- [x] Player core dùng policy; personal skip empty/archive, system không đổi.
- [x] CRUD/copy/balance: Zod/auth/entitlement/owner 404/expected version.
- [x] Source phải published + mở được; copy allow-list, không paywall bypass.
- [x] Quota save nguyên tử/idempotent; archived warning không mutate.

## Checkpoint B

- [x] API/paywall/quota/IDOR/system-regression xanh.
- [x] Human review mapper và ownership query.

## T5–T6 — Enrollment/player/UI

- [x] Enroll kiểm owner curriculum + child; User khác 404.
- [x] Player skip đúng policy, không serve locked, không nhảy adaptive.
- [x] Delete/archived không orphan enrollment.
- [x] UI create/copy/reorder/warnings/child selector bằng tiếng Việt.
- [x] Không share/class/roster/catalog; keyboard/tablet/a11y xanh.

## T7–T8 — Evidence/release

- [x] Mọi UUID có IDOR test; race quota/replace xanh.
- [x] Mỗi `BR-PCU-01…08` có test mang mã rule.
- [x] `pnpm check`, `pnpm test`, E2E, `pnpm lint:specs`, `pnpm check:progress` xanh.
- [x] Spec promote và SKU public cùng release sau human review.
- [x] Không seed/publish ngoài local, không auto-merge.

## Ngoài phạm vi

- [x] Không class roster/multi-tenancy.
- [x] Không share/public/review UGC.
- [x] Không fork player hoặc tự đổi curriculum bằng adaptive.

