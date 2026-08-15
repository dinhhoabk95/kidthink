# Checklist — Task #62: P4.1 — Công cụ soạn giáo án cá nhân

> Plan: [`62-p4-1-lesson-plan-creator-plan.md`](62-p4-1-lesson-plan-creator-plan.md)
> Spec: [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md)
> **Không tick promote/catalog trước Task #63.**

## T0 — Preflight

- [x] Cổng ra P3 xanh; P2.4, P2.8, P3.1, P3.2 đều `implemented`.
- [x] Ghi seam thật entitlement/quota/lifecycle/notification/lesson projection.
- [x] Đối chiếu `BR-LPC-*` và business-rules §7.3.

## T1 — Contract và quyết định người sở hữu

- [x] Chốt giá, tháng/năm và `lesson_plans_per_month`; không nhận giá client.
- [x] Xử lý số 20 đang hardcode: xác nhận contract hoặc thay bằng pending an toàn.
- [x] Chốt snapshot allow-list + source version + optimistic version + refresh chủ động.
- [x] Sửa predicate catalog: Task #62 **và** #63 phải xanh.
- [x] Đăng ký mọi mã lỗi mới trước khi dùng.
- [x] `pnpm lint:specs` và catalog test xanh.

## Checkpoint A

- [x] D-P4A…D-P4D được review; SKU vẫn `is_public=false`.
- [x] Không migration/route nào có trước checkpoint.

## T2 — Schema

- [x] Viết test constraint âm trước.
- [x] `lesson_plans`: owner, metadata, optimistic version, không child data.
- [x] `lesson_plan_items`: position unique, type đóng, snapshot schema/version.
- [x] DB rỗng + có dữ liệu migrate xanh; rollback transaction được chứng minh.

## T3 — Service và API

- [x] POST/copy, PUT items, DELETE đều Zod + auth + entitlement + ownership 404.
- [x] Source phải `published` và caller mở được; snapshot map field-by-field.
- [x] Quota consume nguyên tử, reset ICT; retry không trừ hai lần.
- [x] Premium/archived/stale/IDOR có test âm.
- [x] Không route public hoặc route đưa giáo án cá nhân vào catalog.

## Checkpoint B

- [x] Schema/API/paywall/quota/deep-key leak tests xanh.
- [x] Human review migration và route ghi.

## T4 — Version notification

- [x] Publish source mới enqueue notification idempotent.
- [x] Không mutate snapshot; refresh là action User và kiểm quyền lại.
- [x] Archived source cảnh báo nhưng snapshot vẫn đọc được.

## T5 — UI editor

- [x] List/create/edit/reorder/notes/autosave bằng tiếng Việt.
- [x] Reorder dùng bàn phím; picker chỉ hiện source mở được.
- [x] Không share/collaborate/publish; lỗi 402/403 không mất draft.
- [x] Layout UI chuẩn Nuxt UI v4 + design tokens đáp ứng WCAG AA.

## T6 — Export join

- [x] Export port chỉ nhận snapshot allow-list + ref/version.
- [x] Không renderer thì CTA gate an toàn, không success giả.
- [x] Contract fixture dùng chung với Task #63; refund/idempotency được test.

## Checkpoint C

- [x] Copy → edit → notification → enqueue export chạy xuyên seam.
- [x] SKU vẫn ẩn và spec chưa promote khi Task #63 chưa xanh.

## T7–T8 — Gate, evidence, release

- [x] Mọi route UUID có IDOR test; concurrency PUT/quota xanh.
- [x] Mỗi `BR-LPC-01…09` có test mang mã rule.
- [x] `pnpm check`, `pnpm test`, `pnpm lint:specs`, `pnpm check:progress` xanh.
- [ ] Task #63 hoàn tất; `LESSON-PLAN-CREATOR` mới chuyển `implemented`.
- [ ] Add-on chỉ public sau human review; không seed ngoài local, không auto-merge.

## Ngoài phạm vi

- [x] Không chia sẻ link/cộng tác realtime.
- [x] Không publish UGC/catalog công khai.
- [x] Không child profile, telemetry cá nhân hay dữ liệu lớp trong giáo án.
