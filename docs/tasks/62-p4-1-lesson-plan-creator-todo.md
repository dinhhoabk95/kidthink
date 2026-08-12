# Checklist — Task #62: P4.1 — Công cụ soạn giáo án cá nhân

> Plan: [`62-p4-1-lesson-plan-creator-plan.md`](62-p4-1-lesson-plan-creator-plan.md)
> Spec: [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md)
> **Không tick promote/catalog trước Task #63.**

## T0 — Preflight

- [ ] Cổng ra P3 xanh; P2.4, P2.8, P3.1, P3.2 đều `implemented`.
- [ ] Ghi seam thật entitlement/quota/lifecycle/notification/lesson projection.
- [ ] Đối chiếu `BR-LPC-*` và business-rules §7.3.

## T1 — Contract và quyết định người sở hữu

- [ ] Chốt giá, tháng/năm và `lesson_plans_per_month`; không nhận giá client.
- [ ] Xử lý số 20 đang hardcode: xác nhận contract hoặc thay bằng pending an toàn.
- [ ] Chốt snapshot allow-list + source version + optimistic version + refresh chủ động.
- [ ] Sửa predicate catalog: Task #62 **và** #63 phải xanh.
- [ ] Đăng ký mọi mã lỗi mới trước khi dùng.
- [ ] `pnpm lint:specs` và catalog test xanh.

## Checkpoint A

- [ ] D-P4A…D-P4D được review; SKU vẫn `is_public=false`.
- [ ] Không migration/route nào có trước checkpoint.

## T2 — Schema

- [ ] Viết test constraint âm trước.
- [ ] `lesson_plans`: owner, metadata, optimistic version, không child data.
- [ ] `lesson_plan_items`: position unique, type đóng, snapshot schema/version.
- [ ] DB rỗng + có dữ liệu migrate xanh; rollback transaction được chứng minh.

## T3 — Service và API

- [ ] POST/copy, PUT items, DELETE đều Zod + auth + entitlement + ownership 404.
- [ ] Source phải `published` và caller mở được; snapshot map field-by-field.
- [ ] Quota consume nguyên tử, reset ICT; retry không trừ hai lần.
- [ ] Premium/archived/stale/IDOR có test âm.
- [ ] Không route public hoặc route đưa giáo án cá nhân vào catalog.

## Checkpoint B

- [ ] Schema/API/paywall/quota/deep-key leak tests xanh.
- [ ] Human review migration và route ghi.

## T4 — Version notification

- [ ] Publish source mới enqueue notification idempotent.
- [ ] Không mutate snapshot; refresh là action User và kiểm quyền lại.
- [ ] Archived source cảnh báo nhưng snapshot vẫn đọc được.

## T5 — UI editor

- [ ] List/create/edit/reorder/notes/autosave bằng tiếng Việt.
- [ ] Reorder dùng bàn phím; picker chỉ hiện source mở được.
- [ ] Không share/collaborate/publish; lỗi 402/403 không mất draft.
- [ ] `pnpm test:e2e -- lesson-plan-editor` xanh.

## T6 — Export join

- [ ] Export port chỉ nhận snapshot allow-list + ref/version.
- [ ] Không renderer thì CTA gate an toàn, không success giả.
- [ ] Contract fixture dùng chung với Task #63; refund/idempotency được test.

## Checkpoint C

- [ ] Copy → edit → notification → enqueue export chạy xuyên seam.
- [ ] SKU vẫn ẩn và spec chưa promote khi Task #63 chưa xanh.

## T7–T8 — Gate, evidence, release

- [ ] Mọi route UUID có IDOR test; concurrency PUT/quota xanh.
- [ ] Mỗi `BR-LPC-01…09` có test mang mã rule.
- [ ] `pnpm check`, `pnpm test`, `pnpm lint:specs`, `pnpm check:progress` xanh.
- [ ] Task #63 hoàn tất; `LESSON-PLAN-CREATOR` mới chuyển `implemented`.
- [ ] Add-on chỉ public sau human review; không seed ngoài local, không auto-merge.

## Ngoài phạm vi

- [ ] Không chia sẻ link/cộng tác realtime.
- [ ] Không publish UGC/catalog công khai.
- [ ] Không child profile, telemetry cá nhân hay dữ liệu lớp trong giáo án.
