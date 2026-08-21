# Kế hoạch — Task #62: P4.1 — Công cụ soạn giáo án cá nhân

> Viết 2026-08-11, đo tại commit `484ebaf` trên working tree đang triển khai P0.9.
> Bước sở hữu: **P4 — Add-on** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md).
> Task kế tiếp trong nhánh: [`63-p4-2-pdf-export-plan.md`](63-p4-2-pdf-export-plan.md).

## Tóm tắt

Task #62 dựng không gian riêng để User copy lesson đã duyệt, sắp xếp activity/game/note và
giữ snapshot bất biến. Không có chia sẻ, cộng tác, catalog UGC hay dữ liệu trẻ. Add-on
`PKG-addon_lesson_plan` chỉ được bật bán sau khi Task #63 nối export PDF thật và toàn bộ giá,
chu kỳ, quota đã được người quyết chốt.

### Bản đồ toàn phase P4

```text
Cổng ra P3
 ├── Task #62 Lesson Plan Creator ──→ #63 PDF Export ──→ #64 Worksheet Model
 ├── Task #65 Personal Curriculum
 ├── Task #66 Custom Game Builder
 └── Task #67 AI Credit Ledger ──→ #68 AI Assistant ──→ #69 Semantic Search
                                                        └── audit đủ #62–#69, cổng ra P4
```

Task #65 và #66 chạy song song với hai nhánh còn lại sau cổng ra P3. Task #69 chỉ đóng phase
khi cả ba nhánh đều có evidence. Thứ tự #62 → #63 → #64 cố ý đặt PDF trước worksheet để tuân
`WORKSHEET-MODEL.depends_on: PDF-EXPORT`; T0 của Task #63 phải sửa cách trình bày roadmap đang
ngụ ý chiều ngược trước khi implementation.

## 0. Điều kiện vào và phạm vi phase

| Phụ thuộc | Điều kiện vào |
|---|---|
| P0–P3 | Tất cả spec MVP `implemented`; cổng ra P3 của Task #61 xanh |
| P2.4 · Task #46 | Catalog, entitlement resolver, quota service và payment approval đã chạy thật |
| P2.8 · Task #50 | Content lifecycle/versioning và notification hook đã có |
| P3.1–P3.2 · Tasks #54–#55 | Lesson/activity schema, library và nội dung `published` đã có |
| Task #63 | Chưa cần cho editor, nhưng bắt buộc trước khi promote spec và bật catalog |

**Stop condition:** khi dependency chưa `implemented`, chỉ làm T0–T1. Không viết route dựa
trên interface trong plan P3 chưa merge và không bật `is_public` để “thử”.

## 1. Hiện trạng đo được

- Chưa có `lesson_plans`, `lesson_plan_items`, route hay UI creator trong source hiện tại.
- Registry đã khai bốn entitlement đúng tên, nhưng `PACKAGE_CATALOG` đang gán
  `lesson_plans_per_month: 20` dù spec và [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md) vẫn ghi
  quota chưa chốt.
- Chưa có quota key riêng cho số lần export. `export_pdf` hiện là entitlement, không phải một
  quota có chu kỳ; Task #63 phải khép contract này.
- Điều kiện catalog trong
  [`package-catalog.md`](../specs/00-foundation/package-catalog.md) chỉ nhắc
  [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md) trong khi feature bán ra
  bao gồm PDF. Đây là release predicate thiếu, không được dùng để bật bán sớm.

## 2. Quyết định phải chốt trước code

**D-P4A — Snapshot là DTO allow-list, không copy row DB.** Mỗi item lưu đúng field cần in và
hiển thị cùng `source_entity_id`, `source_content_version`; không lưu `content_pack` bị khoá,
đường storage, dữ liệu review hay quan hệ lồng nhau.

**D-P4B — Thay danh sách item là transaction có optimistic version.** Route PUT nhận
`expected_version`; ownership sai trả 404, stale trả mã registry đã có/được đăng ký trước khi
dùng. Vị trí liên tục từ 0 và item nguồn phải `published` + caller mở được tại thời điểm copy.

**D-P4C — Catalog là phép chuyển nguyên tử của feature hoàn chỉnh.** Giữ
`PKG-addon_lesson_plan.is_public = false` cho tới khi Task #62 và #63 đều xanh, giá/chu kỳ,
`lesson_plans_per_month` và quota export có quyết định người sở hữu. Xoá số placeholder khỏi
đường có thể bán hoặc ghi rõ hằng `PENDING_*`; không coi 20 là quyết định.

**D-P4D — Snapshot không tự đổi.** Khi source publish version mới, chỉ tạo notification cho
chủ giáo án; không mutate item. User có thể chủ động refresh từng item bằng một action riêng,
vẫn kiểm entitlement lại và tạo snapshot mới.

## 3. Đồ thị phụ thuộc P4

```text
T0 đo seam P2/P3 thật
 └── T1 khép contract D-P4A…D + giá/quota/release predicate ── Checkpoint A
      └── T2 migration lesson_plans/items
           └── T3 domain service + API ownership/access/quota ── Checkpoint B
                ├── T4 notification version mới
                └── T5 UI library/editor
                     └── T6 seam export với Task #63 ── Checkpoint C
                          └── T7 security/a11y/E2E
                               └── T8 evidence; chờ Task #63 để promote/catalog
```

## 4. Task triển khai

### T0 — Preflight seam đã merge

**Tiêu chí nghiệm thu**

- [ ] P2.4, P2.8, P3.1 và P3.2 `implemented`; ghi interface thật của entitlement, quota,
  lifecycle, notification và lesson projection.
- [ ] Đối chiếu đủ `BR-LPC-*`, `BR-ENT-*`, `BR-PKG-*`, `BR-CLC-*` và §7.3 business rules.
- [ ] Xác nhận không plan P3 nào được dùng như API runtime nếu code thật khác.

**Kiểm chứng:** `node packages/gates/scripts/check-progress.ts`; báo cáo preflight không còn dependency giả.

**Phụ thuộc:** cổng ra P3 · **Files likely touched:** chỉ task/spec nếu seam đổi · **Cỡ:** S.

### T1 — Khép contract thương mại, snapshot và lỗi

**Tiêu chí nghiệm thu**

- [ ] Người quyết chốt giá/chu kỳ/quota giáo án; giá chỉ nằm trong `PACKAGE_CATALOG`.
- [ ] Spec sở hữu ghi DTO snapshot, optimistic version, refresh chủ động và predicate catalog
  yêu cầu Task #63; mọi mã lỗi được đăng ký trước route.
- [ ] Giá trị 20 hiện tại được xác nhận thành contract hoặc thay bằng trạng thái pending an toàn;
  không có số chưa chốt ở đường public.

**Kiểm chứng:** `pnpm --filter @mindkid/gates test` và test catalog pending/public.

**Phụ thuộc:** T0 + human decision · **Files:** spec LPC, package-catalog, entitlement catalog,
error registry/test · **Cỡ:** M (3–5 file).

### Checkpoint A — Contract

- [ ] D-P4A…D-P4D được owner review; giá/quota có nguồn duy nhất.
- [ ] `PKG-addon_lesson_plan` vẫn ẩn; không migration/route trước checkpoint.

### T2 — Migration giáo án và item snapshot

**Tiêu chí nghiệm thu**

- [ ] `lesson_plans` có owner, metadata, optimistic version, timestamps; không child FK/data.
- [ ] `lesson_plan_items` có position duy nhất, type đóng và snapshot schema/version; custom note
  không giả làm source item.
- [ ] Migration DB rỗng + DB có dữ liệu xanh; ca rollback và constraint âm đỏ trước.

**Kiểm chứng:** `pnpm db:migrate`; `pnpm test -- lesson-plan-schema` với PG thật.

**Phụ thuộc:** Checkpoint A · **Files:** schema creator, migration/meta, integration test · **Cỡ:** M.

### T3 — Domain service và API editor

**Tiêu chí nghiệm thu**

- [ ] POST/copy, PUT items, DELETE dùng Zod, `requireUserAuth()`, entitlement và ownership 404.
- [ ] Copy/replace kiểm source `published` + access ở server, map snapshot field-by-field và
  consume quota nguyên tử theo ICT.
- [ ] Source premium không mở được, source archived và stale version có test âm; không route
  public/catalog cho giáo án cá nhân.

**Kiểm chứng:** `pnpm test -- lesson-plan-service lesson-plan-api`.

**Phụ thuộc:** T2 · **Files:** service, 3–4 route mỏng, integration test (chia PR theo lát nếu >5) · **Cỡ:** M mỗi lát.

### Checkpoint B — Biên dữ liệu riêng

- [ ] Schema/API/ownership/paywall/quota xanh; deep-key test không lộ field nguồn bị cấm.
- [ ] Human review migration và mọi route ghi trước UI.

### T4 — Thông báo source có version mới

**Tiêu chí nghiệm thu**

- [ ] Publish version mới enqueue notification idempotent cho đúng chủ snapshot cũ.
- [ ] Notification không chứa dữ liệu trẻ và không mutate giáo án; refresh luôn là action User.
- [ ] Archived source hiện cảnh báo nhưng snapshot vẫn đọc/in được.

**Kiểm chứng:** `pnpm test -- lesson-plan-version-notification`.

**Phụ thuộc:** T3 + notification P0 · **Files:** hook, handler/service, test · **Cỡ:** M.

### T5 — Library và editor User

**Tiêu chí nghiệm thu**

- [ ] Trang list/create/edit bằng tiếng Việt, reorder bàn phím được và autosave báo trạng thái.
- [ ] Picker chỉ hiện nội dung `published` caller mở được; custom note tách rõ khỏi nội dung hệ thống.
- [ ] Không UI share/collaborate/publish/catalog; empty/error/403/402 không làm mất bản nháp.

**Kiểm chứng:** `pnpm test:e2e -- lesson-plan-editor` gồm keyboard và refresh version.

**Phụ thuộc:** T3–T4 · **Files:** page + tối đa 2 component + E2E · **Cỡ:** M.

### T6 — Seam export với Task #63

**Tiêu chí nghiệm thu**

- [ ] Export command chỉ truyền snapshot allow-list, owner và ref/version; không render trong request.
- [ ] Khi Task #63 chưa có, CTA bị feature-gate an toàn; không endpoint giả trả thành công.
- [ ] Contract test giữa creator và export worker chứng minh cùng ref/version và refund idempotency.

**Kiểm chứng:** contract test `lesson-plan-export-port`; Task #63 consumer test dùng cùng fixture.

**Phụ thuộc:** T3 + contract Task #63 · **Files:** export port, adapter, contract test · **Cỡ:** M.

### Checkpoint C — Lát dọc creator

- [ ] Copy → edit → giữ snapshot → nhận thông báo → enqueue export chạy tới seam thật.
- [ ] `is_public=false`; Task #63 chưa xanh thì spec chưa promote.

### T7 — Cổng chất lượng và bảo mật

**Tiêu chí nghiệm thu**

- [ ] IDOR test cho mọi route UUID, concurrency PUT/quota và deep-key leak đều xanh.
- [ ] E2E tablet + a11y + refresh/retry không tạo item/quota trùng.
- [ ] `pnpm check`, `pnpm test`, `pnpm --filter @mindkid/gates test` xanh; không nới test hiện có.

**Kiểm chứng:** full gate và human security review.

**Phụ thuộc:** T4–T6 · **Files:** test/evidence nhỏ theo suite · **Cỡ:** M.

### T8 — Evidence, promote và catalog join

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-LPC-01…09` có test mang mã rule; evidence link tới output thật.
- [ ] Task #63 hoàn tất `BR-PDF-*`, quota export và renderer; LPC chuyển `implemented` sau join.
- [ ] Chỉ sau human review mới bật catalog/seed local; agent không merge hoặc chạy seed ngoài local.

**Kiểm chứng:** `node packages/gates/scripts/check-progress.ts` + full gate; diff catalog chứng minh feature và SKU đổi cùng PR/release.

**Phụ thuộc:** T7 + Task #63 · **Files:** spec status, todo Task #14, evidence/catalog test · **Cỡ:** S.

## 5. Song song, rủi ro và ngoài phạm vi

- T2–T3 tuần tự. T4 và T5 chạy song song sau API; Task #67 có thể chạy độc lập toàn bộ.
- Rủi ro lớn: snapshot lộ paywall, quota placeholder thành giá trị production, SKU bật trước PDF.
- Ngoài phạm vi: chia sẻ link, cộng tác realtime, publish UGC, dữ liệu lớp/trẻ trong giáo án.

## Cổng dừng cuối

- [ ] Task #62 và #63 cùng xanh; add-on lên catalog cùng tính năng, không trước.
- [ ] Full gate + human review migration, ownership, quota, snapshot và catalog.
- [ ] Không auto-merge, không migration ngoài local, không sửa hàng `published`.
