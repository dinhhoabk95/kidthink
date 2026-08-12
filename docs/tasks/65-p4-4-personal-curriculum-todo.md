# Checklist — Task #65: P4.4 — Curriculum cá nhân dùng chung player

> Plan: [`65-p4-4-personal-curriculum-plan.md`](65-p4-4-personal-curriculum-plan.md)
> Spec: [`personal-curriculum.md`](../specs/07-addon/personal-curriculum.md)

## T0–T1 — Preflight và contract

- [ ] P3.3–P3.5, P2 catalog/entitlement `implemented`; đọc seam merge thật.
- [ ] Đối chiếu `BR-PCU-*`, ownership, child-data và business-rules §7.3.
- [ ] Chốt copy curriculum hệ thống, quota lưu và semantics count/delete.
- [ ] Đăng ký `custom_curricula_saved`; catalog không còn quota rỗng khi public.
- [ ] Chốt enrollment/source kind và hai player policy; không class roster.
- [ ] `pnpm lint:specs` + registry/catalog tests xanh.

## Checkpoint A

- [ ] D-P4M…D-P4P được human review; SKU vẫn ẩn.
- [ ] Không migration trước quyết định schema/enrollment.

## T2 — Schema

- [ ] Test âm orphan/duplicate/status viết trước.
- [ ] Personal curriculum/items có owner/position, không access tier/content version/public lifecycle.
- [ ] Enrollment seam rõ source kind; index/unique/FK đúng contract.
- [ ] DB rỗng/upgrade/rollback xanh.

## T3–T4 — Shared policy và API

- [ ] Balance dùng cùng pure function P3; warning không chặn personal ready.
- [ ] Player core dùng policy; personal skip empty/archive, system không đổi.
- [ ] CRUD/copy/balance: Zod/auth/entitlement/owner 404/expected version.
- [ ] Source phải published + mở được; copy allow-list, không paywall bypass.
- [ ] Quota save nguyên tử/idempotent; archived warning không mutate.

## Checkpoint B

- [ ] API/paywall/quota/IDOR/system-regression xanh.
- [ ] Human review mapper và ownership query.

## T5–T6 — Enrollment/player/UI

- [ ] Enroll kiểm owner curriculum + child; User khác 404.
- [ ] Player skip đúng policy, không serve locked, không nhảy adaptive.
- [ ] Delete/archived không orphan enrollment.
- [ ] UI create/copy/reorder/warnings/child selector bằng tiếng Việt.
- [ ] Không share/class/roster/catalog; keyboard/tablet/a11y xanh.

## T7–T8 — Evidence/release

- [ ] Mọi UUID có IDOR test; race quota/replace xanh.
- [ ] Mỗi `BR-PCU-01…08` có test mang mã rule.
- [ ] `pnpm check`, `pnpm test`, E2E, `pnpm lint:specs`, `pnpm check:progress` xanh.
- [ ] Spec promote và SKU public cùng release sau human review.
- [ ] Không seed/publish ngoài local, không auto-merge.

## Ngoài phạm vi

- [ ] Không class roster/multi-tenancy.
- [ ] Không share/public/review UGC.
- [ ] Không fork player hoặc tự đổi curriculum bằng adaptive.
