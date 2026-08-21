# Todo — Task #82: Tích hợp curriculum vào account P3

## Preflight và dependency

- [x] Xác nhận Task #38, P3.3/Task #56 và P3.4/Task #57 đã qua gate.
- [x] Đọc [`member-dashboard.md`](../specs/03-account/member-dashboard.md),
      [`my-library.md`](../specs/03-account/my-library.md),
      [`curriculum-player.md`](../specs/04-play/curriculum-player.md), actors/BR/error codes.
- [x] Ghi baseline ba debt Task #38 và test ownership/child-switch hiện có.

## WP82.1 — Checkpoint A + contract

- [x] Product/Design chốt active-child hay overview trên tablet.
- [x] Chốt states/CTA của “Chương trình đang học”.
- [x] Chốt library account-scoped, child-scoped hay hybrid và lifecycle khi child bị xoá.
- [x] Nếu contract đổi, sửa owner spec/BR/error/event trước code; chạy `pnpm --filter @mindkid/gates test`.

## WP82.2 — API projection

- [x] Viết test RED cho current curriculum visible/empty/locked.
- [x] Viết test RED ownership 404 và child không thuộc account.
- [x] Implement projection theo child + entitlement/content visibility.
- [x] Chống cache key thiếu child/account scope.

## WP82.3 — Dashboard/multi-child UI

- [x] Viết component/integration test RED cho child selector hoặc overview đã duyệt.
- [x] Implement block current curriculum và loading/empty/error/locked states.
- [x] Kiểm touch target, focus order, keyboard, screen reader và tablet breakpoints.

## WP82.4 — Library scope

- [x] Viết test RED cho account/child/hybrid scope đã duyệt.
- [x] Implement filter/state và cache key tương ứng.
- [x] Kiểm switch child không giữ item/state child trước.

## WP82.5 — Negative E2E

- [x] Fixture account có child A/B với curriculum/library khác nhau.
- [x] Test A→B khi response A bị trì hoãn; state cuối không trộn dữ liệu.
- [x] Test child ngoài ownership, mất entitlement, unpublished/hidden curriculum và deleted child.
- [x] Test không hiển thị progress/recommendation của child khác.

## WP82.6 — Gate và evidence

- [x] Chạy unit/contract/integration/E2E, `pnpm check`, `pnpm --filter @mindkid/gates test`.
- [x] Cập nhật traceability Task #38/roadmap; không copy contract vào plan khác.
- [x] Lưu evidence test theo chuẩn repo và để người review diff.
- [x] Không auto-merge; không sửa published content hay migration ngoài local.

## Gate hoàn tất

- [x] Cả ba debt account P3 đã đóng, không chỉ khối dashboard.
- [x] Ownership và race child-switch negative tests xanh.
- [x] Không có `tenant_id`, persona enum hoặc `users.role` mới.
- [x] Phase gate P3 liên quan xanh và human review hoàn tất.
