# Kế hoạch — Task #19: P0.6 — Vòng đời và phiên bản nội dung

> Viết 2026-08-09, đo tại commit `5a1bb2b`. Bước sở hữu: **P0.6** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu, đúng thứ tự: [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) →
> [`content-versioning.md`](../specs/00-foundation/content-versioning.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Khác với P0.4 và P0.5, bước này **có nền DB tốt**. P0.7/P0.8 đã dựng đúng ba thứ khó nhất:

- Partial unique index `idx_game_levels_published_code` — nơi `BR-VER-02` thực sự được ép.
- Trigger `prevent_published_*_update` trên `game_levels` `lessons` `activities` `worksheets` `curricula` — nơi `BR-CLC-01` được ép ở tầng thấp nhất.
- `REVOKE UPDATE, DELETE ON content_review_log` — `BR-CLC-06` ép bằng quyền DB, không bằng quy ước.
- Cột `entity_id` (neo dòng dõi, D-AE) có mặt trên cả năm bảng Lớp 2.

Còn thiếu **toàn bộ tầng service**: máy trạng thái, checklist publish, phân loại field bump
version, rollback. Và một lệch tên đủ để làm hỏng mọi thứ viết theo spec: enum trạng thái
trong DB dùng `submitted`, hợp đồng dùng `in_review`.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái |
|---|---|
| `GLOSSARY` | `implemented` |
| `ACTORS` | **chưa** — P0.3 |
| `ID-CONVENTIONS` | `implemented` |
| `CONTENT-LIFECYCLE` → `CONTENT-VERSIONING` | thứ tự nội bộ, không đảo |

Bảng §2 của [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) gán quyền
chuyển trạng thái theo **role Manager**. Vậy máy trạng thái đọc `ACTORS`. Chia khối như P0.4/P0.5:

- **Khối A** — enum, máy trạng thái thuần (hàm `canTransition`), checklist, phân loại bump. Không đọc actor. Chạy ngay.
- **Khối B** — gán quyền theo role, transaction publish/archive, rollback. Cần P0.3.

## 1. Đo được

### 1.1 Enum trạng thái lệch một giá trị

[`game.ts`](../../packages/db/src/schema/game.ts) khai
`["draft", "submitted", "approved", "published", "archived", "rejected"]`.

[`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) §7.1 khai
`draft | in_review | approved | published | archived | rejected`.

`submitted` không xuất hiện ở bất kỳ đâu trong corpus spec. Mọi thứ viết theo hợp đồng —
bảng chuyển §7.1, hàng đợi duyệt của [`content-review-queue.md`](../specs/06-admin/content-review-queue.md),
route `transition` §8 — nói `in_review`. Để nguyên thì mỗi lần đọc code phải dịch một tên,
và cổng so khớp enum với spec không viết được.

Đây là lệch **rẻ nhất** để sửa ngay bây giờ: bảng nội dung còn rỗng.

### 1.2 Cái đã có, không phải làm lại

| Ràng buộc | Ép ở đâu | Đo được |
|---|---|---|
| `BR-VER-02` một bản `published` mỗi `code` | `uniqueIndex idx_game_levels_published_code` | có trong [`game.ts`](../../packages/db/src/schema/game.ts) |
| `BR-CLC-01` bất biến sau publish | `prevent_published_game_level_update` + bốn trigger cùng họ | migration `0006` `0007` `0008` |
| `BR-CLC-06` review log INSERT-only | `REVOKE UPDATE, DELETE ON content_review_log` | migration `0006`–`0010` |
| `(code, content_version)` UNIQUE | `game_levels_code_version_unique` | [`game.ts`](../../packages/db/src/schema/game.ts) |
| Neo dòng dõi `entity_id` | 5 bảng Lớp 2 | [`content.ts`](../../packages/db/src/schema/content.ts) · [`curriculum.ts`](../../packages/db/src/schema/curriculum.ts) · [`game.ts`](../../packages/db/src/schema/game.ts) |

Trigger đang gắn mã lỗi `BR-SCT-05` trong thông báo `RAISE EXCEPTION`. Rule sở hữu ngữ nghĩa
bất biến là `BR-CLC-01`; `BR-SCT-05` là cột/bảng. Thông báo nên nêu **cả hai** để tra ngược
được từ log production về đúng spec.

### 1.3 Cái chưa có

| Thiếu | Rule |
|---|---|
| Hàm kiểm bảng chuyển §7.1 | `BR-CLC-02` |
| Checklist publish §7.3 ở server | `BR-CLC-09` `BR-CLC-11` |
| Bắt buộc `reason` ≥ 10 ký tự khi `rejected` | `BR-CLC-05` |
| Cổng "không tiến trình máy nào chuyển trạng thái" | `BR-CLC-04` |
| Publish + archive trong một transaction | `BR-CLC-07` |
| Chặn xoá cứng khi đã publish hoặc có telemetry | `BR-CLC-08` |
| Phân loại field bump / không bump | `BR-VER-07` `BR-VER-08` |
| Rollback không đảo số version | `BR-VER-06` |
| Cảnh báo báo cáo khi trải nhiều version | `BR-VER-05` |

### 1.4 `content_review_log` không ghi được một chuyển trạng thái

[`ops.ts`](../../packages/db/src/schema/ops.ts) khai bảng với `action`
(`submitted | approved | rejected`), `reviewer_manager_id`, `review_notes`, `content_version`.

§7.2 của [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) khai ngữ nghĩa
khác: mỗi hàng ghi **một lần chuyển** — `from_status` / `to_status` — kèm `reason` (bắt buộc
≥10 ký tự khi `to_status = 'rejected'`) và `checklist_snapshot` (kết quả §7.3 tại thời điểm chuyển).

Ba hệ quả đo được:

| Vấn đề | Rule không thực thi được |
|---|---|
| Enum `action` không có `published` `archived` | `BR-CLC-10` — "mọi chuyển trạng thái ghi log" ghi được 3/6 chuyển |
| Không có `from_status` | Không truy được một hàng log về đúng cạnh nào của bảng §7.1 |
| Không có `checklist_snapshot` | `BR-CLC-11` — không chứng minh được lô seed đã chạy checklist |

Cột thật thuộc [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md)
§7.10a (quyết định D-AC). File này sở hữu **ngữ nghĩa**, và ngữ nghĩa đang không có chỗ để ghi.

## 2. Quyết định

**D-DV — Đổi `submitted` thành `in_review` ở P0.6, không giữ alias.** Giữ hai tên cho cùng một
trạng thái là nợ vĩnh viễn: mọi truy vấn vận hành sau này phải nhớ cả hai. Bảng còn rỗng nên
migration là đổi enum, không phải đổi dữ liệu.

**D-DW — Máy trạng thái là bảng dữ liệu, không phải chuỗi `if`.** Bảng §7.1 có 36 ô. Viết
thành `Record<ContentStatus, ContentStatus[]>` cho phép test **toàn bộ** 36 ô bằng một vòng
lặp; viết thành nhánh điều kiện thì mỗi ô là một lần người viết phải nhớ.

**D-DX — Checklist publish là hàm thuần trả `missing[]`.** `BR-CLC-11` bắt seed đi qua **cùng**
checklist với route studio. Chỉ có một cách bảo đảm điều đó không trôi: checklist không được
biết nó đang được gọi từ đâu.

**D-EI — `content_review_log` đổi sang ghi cạnh, không ghi hành động.** `from_status` /
`to_status` / `reason` / `checklist_snapshot` thay cho `action` / `review_notes`. Bảng còn
rỗng nên đây là migration cột, không phải chuyển dữ liệu. Cột thật cập nhật ở
[`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.10a trong
cùng PR, theo việc 7 của quy trình.

**D-DY — `BR-VER-05` chỉ giao phần tính, không giao UI.** Hàm trả về mốc đổi version trong một
chuỗi phiên chơi; hiển thị thuộc [`basic-report.md`](../specs/03-account/basic-report.md) ở P1.12.

## 3. Đồ thị

```
Khối A — chạy ngay
  T1 enum in_review + cột content_review_log ghi cạnh (migration)
        └──→ T2 bảng chuyển trạng thái + test đủ 36 ô
  T3 checklist publish §7.3 (hàm thuần, trả missing[])
  T4 phân loại field bump / không bump (§7.2 · §7.3)
                              ── Cổng dừng A ──

Khối B — sau khi P0.3 đóng
  T5 quyền chuyển theo role + reason bắt buộc
  T6 publish + archive một transaction · rollback
  T7 cổng BR-CLC-04 và BR-CLC-08
  T8 mốc đổi version cho báo cáo
                              ── Cổng dừng B ──
  T9 evidence và promote
```

## 4. Task

### Task 1 — Enum `in_review` và `content_review_log` ghi cạnh

**Tiêu chí nghiệm thu**
- [ ] Ca âm trước: test so bộ giá trị enum DB với §7.1 — **đỏ** vì `submitted`.
- [ ] Migration đổi `submitted` → `in_review`; không giữ giá trị cũ (D-DV).
- [ ] Grep toàn repo không còn `submitted` cho ngữ cảnh vòng đời nội dung.
- [ ] `content_review_log` đổi sang `from_status` · `to_status` · `reason` · `checklist_snapshot`, bỏ `action`/`review_notes` (D-EI).
- [ ] Ca âm: ghi một chuyển `approved → published` vào log — hiện tại **không** biểu diễn được, sau migration phải được.
- [ ] Cột thật cập nhật ở [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) §7.10a trong cùng PR.
- [ ] `REVOKE UPDATE, DELETE ON content_review_log` giữ nguyên sau migration.
- [ ] Thông báo `RAISE EXCEPTION` của bốn trigger nêu **cả** `BR-CLC-01` lẫn `BR-SCT-05`.

**Kiểm chứng**
- [ ] `pnpm db:migrate` từ database rỗng · `pnpm --filter @mindkid/db test -- game content` xanh.

**Phụ thuộc:** không · **Cỡ:** S

### Task 2 — Bảng chuyển trạng thái

**Tiêu chí nghiệm thu**
- [ ] `ALLOWED_TRANSITIONS` khai dạng dữ liệu, khớp đúng 36 ô của §7.1 (D-DW).
- [ ] Test duyệt **mọi** cặp `(from, to)`; ô "Không" phải trả `409 INVALID_STATUS_TRANSITION`.
- [ ] Ca âm `BR-CLC-02`: `draft → published` bị từ chối.
- [ ] Trạng thái **khởi sinh** chỉ nhận hai giá trị: `draft` (studio) và `published` (seed, §4.1). Giá trị khởi sinh khác là lỗi.
- [ ] `archived → published` chỉ mở cho `super_admin` — đánh dấu trong dữ liệu, kiểm quyền ở T5.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test -- lifecycle` xanh, assertion tham chiếu `BR-CLC-02`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Checklist publish

**Tiêu chí nghiệm thu**
- [ ] Hàm thuần nhận thực thể, trả `{ ok: boolean, missing: string[] }` (D-DX).
- [ ] Phủ đủ mục §7.3: ràng buộc chung cho mọi thực thể + riêng cho `game_levels` `lessons` `curricula` `worksheets`.
- [ ] Ca âm `BR-CLC-09`: `content_pack` không có đáp án đúng → `missing` chứa `no_correct_answer`, trạng thái **không** đổi.
- [ ] Không publish một phần: thiếu bất kỳ mục nào → 422, không ghi gì.
- [ ] Hàm **không** nhận tham số nào cho biết nguồn gọi (studio hay seed).

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test -- publish-checklist` xanh, assertion tham chiếu `BR-CLC-09`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Phân loại field bump version

**Tiêu chí nghiệm thu**
- [ ] Hai danh sách khai từ §7.2 (bump) và §7.3 (không bump), theo từng thực thể.
- [ ] Hàm `requiresVersionBump(entityType, changedFields)` trả `true` khi giao với danh sách bump.
- [ ] Ca âm `BR-VER-07`: sửa `description` **không** bump.
- [ ] Ca âm `BR-VER-08`: sửa `content_pack` bắt buộc bump; sửa trực tiếp trả 409.
- [ ] Field không nằm trong danh sách nào → lỗi, không mặc định "không bump". Mặc định phải là **đóng**, cùng lý do với `BR-LAD-02`.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test -- versioning` xanh, assertion tham chiếu `BR-VER-07` `BR-VER-08`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Cổng dừng A

- [ ] Enum trạng thái khớp §7.1; không còn tên `submitted`.
- [ ] 36 ô bảng chuyển đều có test.
- [ ] Checklist publish trả `missing[]` đúng cho mọi thực thể.
- [ ] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.
- [ ] Khối B chưa bắt đầu nếu P0.3 chưa đóng.

### Task 5 — Quyền chuyển trạng thái theo role

**Tiêu chí nghiệm thu**
- [ ] `content_reviewer` chuyển được đúng năm chuyển ở §2; `super_admin` thêm `archived → published`.
- [ ] Ca âm: `content_reviewer` gọi rollback → 403 `INSUFFICIENT_ROLE`.
- [ ] `BR-CLC-05`: `to_status = rejected` mà `reason` < 10 ký tự → 422, trạng thái không đổi.
- [ ] `BR-CLC-03`: ghi cả người tạo và người duyệt, kể cả khi là một người.
- [ ] `expected_version` sai → 409 `VERSION_CONFLICT`.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/db test -- lifecycle` xanh, assertion tham chiếu `BR-CLC-03` `BR-CLC-05`.

**Phụ thuộc:** P0.3 đóng · T2 · **Cỡ:** M

### Task 6 — Publish, archive, rollback

**Tiêu chí nghiệm thu**
- [ ] Publish version N+1 và archive version N nằm trong **một** transaction (`BR-CLC-07`).
- [ ] Ca âm ở tầng DB: `UPDATE` đặt hai bản cùng `published` bị partial unique index từ chối.
- [ ] Rollback: publish lại bản `archived` M; bản đang chạy thành `archived`; **không** sinh version mới (`BR-VER-06`).
- [ ] `content_version` chỉ tăng, không tái dùng (`BR-VER-01`).
- [ ] Mỗi lần chuyển ghi `content_review_log` + `audit_logs` (`BR-CLC-10`).

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/db test -- versioning` xanh, assertion tham chiếu `BR-VER-01` `BR-VER-02` `BR-VER-06` `BR-CLC-07`.

**Phụ thuộc:** T5 · **Cỡ:** M

### Task 7 — Hai cổng chặn đường vòng

**Tiêu chí nghiệm thu**
- [ ] Cổng `BR-CLC-04`: quét mọi đường gọi transition; mọi lời gọi mang một `manager_id` thật. Job, script, seeder **không** gọi được.
- [ ] Ca âm: fixture một job gọi transition làm cổng **đỏ**.
- [ ] `BR-CLC-08`: xoá cứng chỉ khi chưa từng `published` **và** không có telemetry trỏ tới; ngược lại 409 `CONTENT_IN_USE` kèm danh sách nơi dùng.
- [ ] `BR-CLC-11`: đường seed dùng **đúng** hàm checklist Task 3; ca âm — một batch thiếu learning objective làm rollback toàn batch, không ghi hàng nào.

**Kiểm chứng**
- [ ] `pnpm check` gọi cổng mới; `pnpm --filter @mindkid/db test -- lifecycle` xanh, assertion tham chiếu `BR-CLC-04` `BR-CLC-08` `BR-CLC-11`.

**Phụ thuộc:** T3 · T6 · **Cỡ:** M

### Task 8 — Mốc đổi version cho báo cáo

**Tiêu chí nghiệm thu**
- [ ] Hàm nhận chuỗi phiên chơi của một trẻ trên một `entity_id`, trả mốc mà `content_version` đổi (`BR-VER-05`).
- [ ] Không giao UI (D-DY); hiển thị thuộc P1.12.
- [ ] Ca âm `BR-VER-04`: phiên mở ở version 3, publish version 4 giữa chừng → kết quả phiên ghi `content_version = 3`.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test -- versioning` xanh, assertion tham chiếu `BR-VER-04` `BR-VER-05`.

**Phụ thuộc:** T6 · **Cỡ:** S

### Cổng dừng B

- [ ] Không đường nào publish được mà bỏ qua checklist.
- [ ] Không tiến trình máy nào chuyển được trạng thái.
- [ ] Hai bản cùng `published` bị chặn ở **cả** service lẫn DB.
- [ ] Human review diff — vùng nhạy cảm **nội dung đã published**, không auto-merge.

### Task 9 — Evidence và promote

- [ ] Mỗi `BR-CLC-*` `BR-VER-*` có ít nhất một test tham chiếu mã rule.
- [ ] Hai spec sang `implemented` chỉ khi đủ evidence.
- [ ] Tick P0.6 chỉ khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Giữ `submitted` cho "đỡ phải sửa" | Hai tên cho một trạng thái, vĩnh viễn | D-DV — đổi lúc bảng rỗng, không alias |
| Checklist nằm trong route studio | Seed thành lỗ hổng lớn nhất của cổng duyệt | D-DX — hàm thuần, không biết nguồn gọi; T7 có ca âm |
| Máy trạng thái viết bằng `if` | 36 ô, người viết nhớ thiếu vài ô | D-DW — bảng dữ liệu, test duyệt toàn bộ |
| Field mới không nằm trong danh sách bump nào | Mặc định "không bump" cho không một lần sửa gameplay | T4 — field lạ là **lỗi**, không phải mặc định |
| Trigger nêu sai mã rule trong log | Truy ngược từ production về spec sai chỗ | T1 — thông báo nêu cả `BR-CLC-01` và `BR-SCT-05` |

## 6. Giả định

1. **Bảng nội dung còn rỗng.** Đo: seed chỉ chạm `entitlement_keys` `packages` `package_entitlements`. Nếu sai, T1 cần bước chuyển dữ liệu.
2. **P0.6 không giao route HTTP.** `POST /api/managers/content/{...}/transition` gắn vào ở P2.8 ([`publish-and-version.md`](../specs/06-admin/publish-and-version.md)); P0.6 giao hàm và ràng buộc.
3. **Khối A không cần P0.3.** Bảng chuyển và checklist là hàm thuần trên dữ liệu.
4. **Không dựng seeder ở đây.** [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) là P1.10; P0.6 chỉ bảo đảm nó **không thể** đi vòng qua checklist.

## 7. Ngoài phạm vi

- Studio, hàng đợi duyệt, màn hình version — P2.5–P2.8.
- Seeder nội dung nền — P1.10.
- Chặn tự duyệt bản do chính mình tạo (§11 Q1 của [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md)) — chặn P2.
- Archive lạnh sang S3 (§11 Q1 của [`content-versioning.md`](../specs/00-foundation/content-versioning.md)) — chặn chi phí, không chặn phase.
