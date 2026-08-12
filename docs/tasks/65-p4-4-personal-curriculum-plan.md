# Kế hoạch — Task #65: P4.4 — Curriculum cá nhân dùng chung player

> Viết 2026-08-11, đo tại commit `484ebaf`.
> Spec sở hữu: [`personal-curriculum.md`](../specs/07-addon/personal-curriculum.md).
> Có thể chạy song song Task #66 và #67 sau cổng ra P3.

## Tóm tắt

Task #65 cho User dựng lộ trình riêng từ content `published` mà họ mở được, cảnh báo lệch cân
bằng nhưng không chặn, và chỉ ghi danh child profile do chính User sở hữu. Player phải dùng
cùng engine P3.4, chỉ thay policy tuần rỗng/archive. Không có lớp học, roster, catalog công khai
hay publish lifecycle cho UGC.

## 0. Điều kiện vào

- P3.3 curriculum model/builder và P3.4 player `implemented`; P2 entitlement/catalog chạy thật.
- P3.5 mastery tiếp tục chỉ nhận session từ content được phép; personal curriculum không thay
  thuật toán adaptive hoặc nhảy prerequisite.
- Owner chốt copy curriculum hệ thống và quota lưu trước khi migration/catalog.

## 1. Hiện trạng và drift

- Chưa có bảng/route/UI personal curriculum ở source đo.
- Spec yêu cầu quota `custom_curricula_saved`, nhưng key này không có trong entitlement spec
  hay `packages/shared/src/entitlement-catalog.ts`; `PKG-addon_curriculum.quotas` đang rỗng.
- Objective nhắc “lớp mình”, nhưng boundary dự án cấm class roster/multi-tenancy. P4 chỉ có
  child profile thuộc User; không được tạo lớp để diễn giải câu này.
- Shape enrollment/player thật chưa tồn tại ở commit đo; T0 phải dùng output merge Task #57.

## 2. Quyết định contract

**D-P4M — Một player core, hai policy.** Extract/giữ engine thuần dùng chung; source adapter
phân biệt system/personal. Personal policy skip tuần rỗng và item archived; các luật session,
progress, parent gate, healthy-play vẫn dùng chung.

**D-P4N — Ownership trả 404 ở mọi biên.** Curriculum, child enrollment, balance và player
không tiết lộ resource của User khác. Chỉ child profile có `user_id` caller mới enroll; không
tạo credential/lớp/teacher roster.

**D-P4O — Copy hệ thống là snapshot cấu trúc có kiểm quyền.** Nếu owner chốt Q1 “có”, copy chỉ
lấy item `published` caller mở được tại thời điểm copy; bản cá nhân sửa tại chỗ và không theo
version nguồn. Item archived sau đó cảnh báo + skip, không tự thay item.

**D-P4P — Quota/catalog không dùng placeholder.** Đăng ký `custom_curricula_saved`, chốt giới
hạn và semantics count (draft+ready, archive/delete), rồi mới điền catalog. Add-on chỉ public
khi builder+player+ownership+quota đều chạy.

## 3. Đồ thị

```text
T0 đo curriculum/player/enrollment/balance seams P3
 └── T1 khép copy/quota/schema/policy contract ── Checkpoint A
      ├── T2 migration personal curriculum/items/enrollment seam
      └── T3 extract/reuse balance + player policy
           └── T4 CRUD/copy/balance API ── Checkpoint B
                ├── T5 enroll + player integration
                └── T6 User builder UI
                     └── T7 IDOR/paywall/E2E/perf
                          └── T8 evidence + catalog atomic
```

## 4. Task triển khai

### T0 — Preflight output P3 thật

**Tiêu chí nghiệm thu**

- [ ] P3.3–P3.5 `implemented`; ghi interface schema, balance validator, enrollment và player core.
- [ ] Đối chiếu đủ `BR-PCU-*`, ownership/child-data/access-ladder và §7.3.
- [ ] Xác nhận cách tái dùng không làm `apps/web/app` import DB/admin code.

**Kiểm chứng:** `pnpm check:progress`; dependency report không còn plan-only seam.

**Phụ thuộc:** cổng ra P3 · **Files:** task/spec nếu seam đổi · **Cỡ:** S.

### T1 — Khép contract copy, quota và enrollment

**Tiêu chí nghiệm thu**

- [ ] Owner chốt copy system, quota số lộ trình và semantics count/delete; catalog là nguồn số duy nhất.
- [ ] Spec/model owner ghi personal source/enrollment policy, tuần rỗng/archive và cảnh báo không chặn.
- [ ] Đăng ký quota key + lỗi trước code; bỏ cách hiểu “lớp” cần roster khỏi P4.

**Kiểm chứng:** `pnpm lint:specs`; entitlement/catalog registry tests xanh.

**Phụ thuộc:** T0 + human decisions · **Files:** PCU/entitlement/package/curriculum-player/error specs · **Cỡ:** M.

### Checkpoint A — Contract/schema review

- [ ] D-P4M…D-P4P được review; `PKG-addon_curriculum` vẫn ẩn.
- [ ] Schema enrollment không polymorphic ngầm chưa được chốt.

### T2 — Migration personal curriculum

**Tiêu chí nghiệm thu**

- [ ] Bảng owner/title/band/duration/status + item position/reference theo contract; không access tier/version/public status.
- [ ] Enrollment seam tham chiếu đúng một source kind và enforce child ownership ở service; FK/index/unique đầy đủ.
- [ ] Migration DB rỗng/upgrade/rollback, orphan/duplicate/status test âm xanh với PG thật.

**Kiểm chứng:** `pnpm db:migrate`; `pnpm test -- personal-curriculum-schema`.

**Phụ thuộc:** Checkpoint A · **Files:** schema/migration/meta/integration test · **Cỡ:** M.

### T3 — Reuse balance và player core

**Tiêu chí nghiệm thu**

- [ ] Cùng hàm balance P3 trả warnings; personal `ready` không bị block bởi warning/tuần rỗng.
- [ ] Cùng player core nhận policy; personal skip empty week/archived item, system behavior không đổi.
- [ ] Regression suite chứng minh system curriculum vẫn chặn invariant cũ và adaptive không nhảy bước.

**Kiểm chứng:** `pnpm test -- curriculum-policy curriculum-balance`.

**Phụ thuộc:** T0–T2 · **Files:** pure policy/service/tests · **Cỡ:** M.

### T4 — CRUD, copy và balance API

**Tiêu chí nghiệm thu**

- [ ] POST/PUT items/GET balance Zod + auth + entitlement + owner 404; replace items transaction/expected version.
- [ ] Item phải `published` + caller mở được; copy system dùng allow-list và không lách paywall.
- [ ] Save quota nguyên tử/idempotent; archived source cảnh báo, không tự mutate.

**Kiểm chứng:** `pnpm test -- personal-curriculum-api personal-curriculum-copy`.

**Phụ thuộc:** T2–T3 · **Files:** service + routes/tests chia lát ≤5 file · **Cỡ:** M.

### Checkpoint B — Builder API riêng tư

- [ ] CRUD/copy/balance/quota/paywall/IDOR xanh; không resource public.
- [ ] Human review mọi query ownership và mapper.

### T5 — Enrollment và player integration

**Tiêu chí nghiệm thu**

- [ ] Enroll route kiểm entitlement, owner curriculum + child; User khác luôn 404.
- [ ] Player bỏ empty/archive đúng policy, vẫn ghi session/progress bằng engine chuẩn và không serve content locked.
- [ ] Delete/archive personal curriculum không orphan enrollment; state transition được chốt và test.

**Kiểm chứng:** `pnpm test -- personal-enrollment personal-curriculum-player`.

**Phụ thuộc:** T3–T4 · **Files:** enroll service/route, source adapter, tests · **Cỡ:** M.

### T6 — Builder UI User

**Tiêu chí nghiệm thu**

- [ ] Create/copy/reorder/week/session UI bằng tiếng Việt, reuse pure balance result chứ không copy logic admin.
- [ ] Warning lệch/tuần rỗng/archive rõ nhưng không chặn ready; paywall picker không lộ payload locked.
- [ ] Child selector chỉ child của caller; không bề mặt lớp/roster/share/catalog.

**Kiểm chứng:** `pnpm test:e2e -- personal-curriculum` gồm keyboard/tablet.

**Phụ thuộc:** T4–T5 · **Files:** page + tối đa 2 component + E2E · **Cỡ:** M.

### T7–T8 — Gate, evidence và catalog

**Tiêu chí nghiệm thu**

- [ ] IDOR trên mọi UUID, race quota/replace, archived skip và system regression xanh.
- [ ] Mỗi `BR-PCU-01…08` có test mang mã; full gate + progress xanh.
- [ ] Spec `implemented` và SKU public cùng release sau human review; không seed/publish ngoài local.

**Kiểm chứng:** `pnpm check`, `pnpm test`, E2E, `pnpm lint:specs`, `pnpm check:progress`.

**Phụ thuộc:** T5–T6 · **Files:** security/evidence/spec/catalog/progress tests · **Cỡ:** M.

## 5. Rủi ro và ngoài phạm vi

- Rủi ro: fork player, enrollment rò ownership, quota key thiếu, thuật ngữ “lớp” kéo roster.
- T2/T3 song song sau Checkpoint A; UI chỉ sau API/player.
- Ngoài phạm vi: class roster, share/public catalog, review/publish UGC, adaptive tự đổi lộ trình.
