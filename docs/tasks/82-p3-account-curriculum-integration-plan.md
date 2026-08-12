# Kế hoạch — Task #82: Tích hợp curriculum vào account P3

> Lát dọc nhận ba debt được Task #38 hoãn sang P3: khối “Chương trình đang học”, trải nghiệm
> tài khoản có nhiều trẻ và phạm vi thư viện. Không tạo persona/role/`tenant_id` mới.

## 1. Outcome

Sau khi curriculum player tồn tại, người giám hộ vào account thấy đúng chương trình của child
đang chọn, chuyển child mà dữ liệu không trộn, và thư viện áp dụng đúng scope đã được người duyệt.

Task #82 dùng owner hiện có:
[`member-dashboard.md`](../specs/03-account/member-dashboard.md),
[`my-library.md`](../specs/03-account/my-library.md) và
[`curriculum-player.md`](../specs/04-play/curriculum-player.md). Chỉ sửa spec trước code nếu
Checkpoint A thay đổi contract; không tạo spec mới chỉ để mô tả glue code.

## 2. Dependencies

```text
P1.12 member dashboard/library
          ├──────────────┐
P3.3 curriculum model/builder ──→ P3.4 curriculum player
          └──────────────┘                │
                                         ▼
                              Checkpoint A (scope/layout)
                                         │
                    API projection ──→ account UI ──→ child-switch E2E
```

- Bắt buộc hoàn tất: Task #38, Task #56 (P3.3) và Task #57 (P3.4) cùng phase gate tương ứng.
- Nếu dashboard hiển thị mastery/progress nâng cao, phần đó phụ thuộc Task #58; không kéo sớm
  adaptive engine vào lát này.
- Content visibility/entitlement/ownership rules hiện hành vẫn áp dụng; không bypass để làm UI.

## 3. Assumptions và ranh giới

1. Một account có thể có nhiều child; mọi child projection cần ownership check và 404 chống
   enumeration theo contract hiện hành.
2. “Current curriculum” chỉ hiện khi có enrollment/assignment hợp lệ và content còn visible.
3. Không trộn progress, recommendation, recent play hay library child-scoped khi chuyển child.
4. Empty/loading/error/locked states là outcome bắt buộc, không phải polish cuối.
5. Layout active-child hay overview và scope library account/child là quyết định người.
6. Không thay đổi auth, billing, taxonomy hoặc published content trong task này.

## 4. Checkpoint A — quyết định người

Trước test RED, Product/Design chốt:

1. Dashboard dùng một active child hay overview nhiều child; cách chọn/switch child trên tablet.
2. “Chương trình đang học” hiển thị những gì và CTA vào đâu khi chưa/đã/khóa enrollment.
3. Library thuộc account, child hay mô hình lai; favorite/history/download có scope nào.
4. Khi child bị xoá, archived hoặc mất entitlement, dữ liệu và empty state xử lý thế nào.

Nếu quyết định khác open question trong spec hiện có, cập nhật spec và phê duyệt trước code.

## 5. Work packages lát dọc

| ID | Cỡ | Công việc | Acceptance riêng |
|---|---:|---|---|
| WP82.1 | S | Chốt Checkpoint A; sửa owner specs/BR/error/event nếu contract đổi | Không còn open question chặn; lint xanh |
| WP82.2 | M | API/query projection cho active child + current curriculum + library scope | Ownership 404; empty/locked/visible response có contract test |
| WP82.3 | M | Dashboard block và child selector/overview responsive | Keyboard/touch/a11y; loading/empty/error/locked đủ |
| WP82.4 | M | Library filter/state theo scope đã duyệt | Đổi child/account không rò item hoặc stale cache |
| WP82.5 | M | E2E chuyển child và entitlement/visibility negative paths | Child A/B không trộn curriculum, progress hay library |
| WP82.6 | S | Evidence, gate, traceability và handoff | Check/test/lint xanh; human diff review |

Mỗi work package khoảng 1–5 file và một PR reviewable; WP82.2–WP82.4 có test RED trước code.
Nếu projection dùng nhiều hơn năm file, tách contract/server và consumer UI thành hai package M,
không nâng thành L.

## 6. Acceptance criteria

- [ ] Ba debt Task #38 có quyết định và owner thực thi, không còn câu “để P3” vô địa chỉ.
- [ ] Dashboard hiện đúng current curriculum cho child đang chọn và state chưa có/khóa/lỗi.
- [ ] Chuyển giữa ít nhất hai child không trộn curriculum, progress, recommendation hoặc library
      child-scoped; stale response không ghi đè child mới.
- [ ] Truy cập child không thuộc account trả 404 theo contract, không tiết lộ tồn tại.
- [ ] Library account/child/hybrid khớp Checkpoint A và spec
      [`my-library.md`](../specs/03-account/my-library.md).
- [ ] UI tablet-first, touch target/keyboard/focus/screen-reader đạt gate accessibility hiện hành.
- [ ] Không thêm `tenant_id`, persona enum hay cột `role` trên `users`.
- [ ] Unit/contract/integration/E2E và gate phase xanh; diff được người review, không auto-merge.

## 7. Verification

```bash
pnpm lint:specs
pnpm check
pnpm test
pnpm test:e2e
rg -n "Chương trình đang học|current curriculum|nhiều trẻ|active child|thư viện" docs/specs docs/tasks
rg -n "tenant_id|persona|users.*role" apps packages
```

E2E tối thiểu: account có child A/B; A có curriculum/library riêng, B không có; switch A→B khi
request A còn pending; UI cuối cùng chỉ được hiện state B.

## 8. Risks

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Active-child state chỉ nằm ở UI | API trả dữ liệu child khác | Ownership check server + contract test |
| Race khi switch child | Stale response của A phủ B | Request key/cancel + E2E delayed response |
| Scope library không chốt | Migration/API/UI drift | Checkpoint A trước RED |
| Kéo adaptive engine vào dashboard | Dependency vòng và phase phình | Chỉ current curriculum; advanced progress phụ thuộc Task #58 |
| Empty state bị bỏ qua | Account mới thành dead-end | Acceptance riêng cho empty/locked/error |

## 9. Definition of done

Task #82 hoàn tất khi Checkpoint A và mọi contract change đã được duyệt, sáu work package đạt
acceptance, negative E2E child-switch/ownership xanh, phase gate xanh và có human diff review.
Chỉ bật một block dashboard mà chưa chốt library/multi-child không được tính là hoàn tất.
