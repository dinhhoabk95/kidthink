# Kế hoạch — Task #24: P0.11 — Nhật ký kiểm toán

> Viết 2026-08-09, đo tại commit `5a1bb2b`. Bước sở hữu: **P0.11** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`audit-log.md`](../specs/01-platform/audit-log.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Audit đứng ở đây vì [`roadmap.md`](../specs/roadmap.md) nguyên tắc 4: **audit trước hành động
cần audit**. Thêm sau là đi vá từng call site, và không có dữ liệu cho khoảng thời gian đã chạy.

Nền DB đã có phần khó nhất: `REVOKE UPDATE, DELETE ON audit_logs` đã nằm trong migration từ
`0006`, và [`ops.test.ts`](../../packages/db/tests/integration/ops.test.ts) đã có test tham
chiếu `BR-AUD-01`.

Nhưng bảng **thiếu đúng ba cột làm nên giá trị của một bản ghi audit**: `before_data`,
`after_data`, `reason`. Có `changes` JSONB gộp, và không có chỗ ghi lý do — trong khi §7.2 liệt
kê **13 trong 28 hành động bắt buộc có `reason`**.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái |
|---|---|
| `ACTORS` | P0.3 — phải đóng trước |
| `DATA-MODEL-OVERVIEW` | `implemented` |

P0.11 đứng **sau** P0.10 trong roadmap nhưng không phụ thuộc nó. Nó phụ thuộc `ACTORS` (để
biết `actor_type`) và phải xong **trước** P0.11b (admin-auth ghi `manager_login`).

## 1. Đo được

### 1.1 Ba cột thiếu

| §7.1 đòi | Trong [`ops.ts`](../../packages/db/src/schema/ops.ts) |
|---|---|
| `before_data` JSONB | thiếu — có `changes` JSONB gộp |
| `after_data` JSONB | thiếu |
| `reason` text | **thiếu hoàn toàn** |
| `actor_type` `actor_id` `action` `entity_type` `entity_id` `ip_address` `user_agent` `created_at` | có |

`BR-AUD-04` nói *"'Đã đổi package' không đủ để hoàn tác hay điều tra"* — đó chính xác là thứ
một cột `changes` gộp cho ra. Và không có `reason` thì 13 hành động ở §7.2 (`user_suspended`,
`entitlement_granted`, `order_approved`, `content_rejected`, `data_exported`…) không ghi được
lý do bắt buộc, dù đó là toàn bộ điểm của việc bắt buộc chúng.

`actor_id` đang `NOT NULL`. §7.1 ghi *"NULL khi `system`"*. Job tự động không có `actor_id`
thật; ép NOT NULL buộc người viết bịa một giá trị.

### 1.2 Hai index thiếu

[`ops.ts`](../../packages/db/src/schema/ops.ts) có `idx_audit_logs_actor_created`.
§7.1 đòi thêm `(entity_type, entity_id, created_at)` và `(action, created_at)`.

Truy vấn điều tra thường gặp nhất là *"chuyện gì đã xảy ra với entity này"* — đó là index
đang thiếu. `GET /api/managers/audit-logs` có filter cho cả ba trục.

### 1.3 Chưa có `writeAudit()` và chưa có danh sách 28 action

§3 nói `packages/db` giữ helper `writeAudit()` — *"nơi duy nhất ghi"*. Chưa tồn tại.
§7.2 liệt kê 28 action đóng; chưa có hằng số nào trong repo.

## 2. Quyết định

**D-ET — Tách `changes` thành `before_data`/`after_data`, thêm `reason`.** Bảng còn rỗng
(không hành động nào được audit vì chưa có `writeAudit()`), nên đây là migration cột.

**D-EU — `writeAudit(tx, …)` bắt buộc nhận transaction ở **chữ ký hàm**.** §8 viết rõ:
*"`tx` bắt buộc — chữ ký hàm không cho phép gọi ngoài transaction"*. `BR-AUD-02` được ép ở tầng
kiểu, không ở tầng review. Đây là cách rẻ nhất để một rule không bao giờ bị quên.

**D-EV — 28 action là union đóng, `reason` bắt buộc ở tầng kiểu.** 13 action cần `reason`;
khai thành kiểu có điều kiện thì quên `reason` là lỗi biên dịch, không phải hàng audit rỗng
phát hiện lúc điều tra.

**D-EW — Ba cổng nội dung payload chạy tự động.** `BR-AUD-05` (không PII trẻ) và `BR-AUD-06`
(không mật khẩu/token/hash) không kiểm được bằng mắt trên 28 call site. Cổng quét payload +
ca âm.

## 3. Đồ thị

```
T1 migration: before_data · after_data · reason · actor_id nullable · 2 index
      └──→ T2 registry 28 action + cờ requiresReason (union đóng)
                └──→ T3 writeAudit(tx, …) — tx bắt buộc ở chữ ký
                          ├──→ T4 cổng payload: không PII trẻ, không bí mật
                          ├──→ T5 gắn audit vào hành động đã tồn tại
                          └──→ T6 GET /api/managers/audit-logs (chỉ super_admin)
                              ── Cổng dừng ──
  T7 evidence và promote
```

## 4. Task

### Task 1 — Migration `audit_logs`

**Tiêu chí nghiệm thu**
- [ ] Ca âm trước: test ghi một hàng audit có `reason` — **đỏ**, cột không tồn tại.
- [ ] Tách `changes` thành `before_data` và `after_data` JSONB (D-ET).
- [ ] Thêm `reason` text.
- [ ] `actor_id` thành nullable; CHECK: `actor_type = 'system'` thì `actor_id IS NULL`, ngược lại NOT NULL.
- [ ] Thêm index `(entity_type, entity_id, created_at)` và `(action, created_at)`.
- [ ] `REVOKE UPDATE, DELETE ON audit_logs` giữ nguyên sau migration; test `BR-AUD-01` vẫn xanh.

**Kiểm chứng**
- [ ] `pnpm db:migrate` từ database rỗng · `pnpm --filter @mindkid/db test -- ops` xanh.

**Phụ thuộc:** không · **Cỡ:** S

### Task 2 — Registry 28 action

**Tiêu chí nghiệm thu**
- [ ] 28 action §7.2 khai `as const`, nhóm theo bảng, kèm cờ `requiresReason` cho đúng 13 action.
- [ ] Action ngoài registry là **lỗi biên dịch** (`BR-AUD-03`).
- [ ] Kiểu ép: action có `requiresReason` mà thiếu `reason` là lỗi biên dịch (D-EV).
- [ ] Test đối chiếu registry với bảng §7.2 — thiếu hoặc thừa một dòng là đỏ.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test -- audit` xanh, assertion tham chiếu `BR-AUD-03`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — `writeAudit(tx, …)`

**Tiêu chí nghiệm thu**
- [ ] Chữ ký nhận `tx` là **tham số đầu bắt buộc**; gọi ngoài transaction là lỗi biên dịch (D-EU).
- [ ] Ca âm `BR-AUD-02`: ghi audit fail → transaction rollback → hành động **không** xảy ra. Test bằng approve một đơn: đơn vẫn `submitted`, không entitlement nào được cấp.
- [ ] `BR-AUD-07`: API cho thao tác hàng loạt ghi **một bản mỗi entity**; ca âm — archive 5 level cho ra đúng 5 hàng, 5 `entity_id` khác nhau.
- [ ] `BR-AUD-04`: `before_data`/`after_data` chỉ chứa field **đã đổi**, không chụp nguyên bản ghi.
- [ ] Payload lớn → cắt còn field đã đổi + hash bản đầy đủ (§5).
- [ ] `writeAudit` là **nơi duy nhất** ghi `audit_logs`; cổng chặn INSERT trực tiếp từ chỗ khác.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/db test -- audit` xanh, assertion tham chiếu `BR-AUD-02` `BR-AUD-04` `BR-AUD-07`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Cổng nội dung payload

**Tiêu chí nghiệm thu**
- [ ] `BR-AUD-05`: cổng chặn `display_name` `birth_year` và mọi field trẻ ngoài `child_uuid` trong payload. Ca âm: audit archive một trẻ có `display_name` làm cổng **đỏ**.
- [ ] `BR-AUD-06`: cổng chặn `password` `password_hash` `token` `token_hash` `secret` — **kể cả dạng hash**. Ca âm: audit đổi mật khẩu mang hash làm cổng đỏ.
- [ ] Cổng chạy ở **runtime** trong `writeAudit`, không chỉ ở lint — payload đến từ dữ liệu, không từ mã nguồn.
- [ ] `BR-AUD-08`: job purge của P0.4 **giữ** `audit_logs`; ca âm khẳng định hàng còn sau purge.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/db test -- audit-payload` xanh, assertion tham chiếu `BR-AUD-05` `BR-AUD-06` `BR-AUD-08`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Gắn audit vào hành động đã tồn tại

**Mô tả.** Tại thời điểm P0.11, một phần trong 28 action đã có code (P0.4 `consent_withdrawn`
`child_data_purged` `child_profile_archived`; P0.6 nhóm nội dung; P0.10 chưa có action nào của
User). Phần còn lại thuộc P0.11b và P2.

**Tiêu chí nghiệm thu**
- [ ] Lập bảng 28 action × bước sở hữu; action nào đã có code thì gắn `writeAudit` **trong cùng transaction** ngay ở PR này.
- [ ] Action chưa có code ghi bước sở hữu, **không** tick, **không** tạo handler giả.
- [ ] `BR-AUD-03` kiểm được: test duyệt danh sách action đã gắn, mỗi cái sinh đúng một hàng.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/db test -- audit-coverage` xanh.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 6 — `GET /api/managers/audit-logs`

**Tiêu chí nghiệm thu**
- [ ] Auth `requireManagerAuth()` + role `super_admin` (`BR-AUD-09`).
- [ ] Ca âm: `content_reviewer` gọi → **403**.
- [ ] Filter `actor_type` `action` `entity_type` `entity_id` `from` `to`; `limit` trần **200**; phân trang cursor.
- [ ] Không route nào cho `UPDATE`/`DELETE`.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/admin test -- audit-logs` xanh, assertion tham chiếu `BR-AUD-09`.

**Phụ thuộc:** T3 · P0.3 đóng · **Cỡ:** M

### Cổng dừng

- [ ] `audit_logs` có `before_data` `after_data` `reason`; ba index đủ.
- [ ] Gọi `writeAudit` ngoài transaction là lỗi biên dịch.
- [ ] Cổng payload chặn PII trẻ và bí mật ở runtime, có ca âm.
- [ ] `content_reviewer` không đọc được audit.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human review diff.

### Task 7 — Evidence và promote

- [ ] Mỗi `BR-AUD-*` có ít nhất một test tham chiếu mã rule.
- [ ] Bảng 28 action × bước sở hữu ghi vào [`audit-log.md`](../specs/01-platform/audit-log.md) — action chưa gắn được có chủ rõ ràng.
- [ ] §11 Q1 (retention) ghi là chặn P1, không chặn P0.
- [ ] Spec sang `implemented` chỉ khi đủ evidence; tick P0.11 khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Giữ `changes` gộp cho nhanh | "Đã đổi package" không hoàn tác hay điều tra được | D-ET — tách lúc bảng còn rỗng |
| Không có `reason` | 13 action bắt buộc lý do mất chính thứ làm chúng bắt buộc | T1 thêm cột, T2 ép ở tầng kiểu |
| `writeAudit` gọi được ngoài transaction | Hành động không có audit, hoặc audit cho hành động chưa xảy ra | D-EU — `tx` là tham số đầu bắt buộc |
| Bí mật lọt vào payload | `audit_logs` INSERT-only + giữ vĩnh viễn → **không xoá được** | D-EW — cổng runtime, ca âm gồm cả dạng hash |
| Gắn audit cho hành động chưa có code | Handler giả để tick cho đủ | T5 — action chưa có code ghi bước sở hữu, không tick |
| Thiếu index entity | Truy vấn điều tra phổ biến nhất quét toàn bảng | T1 thêm hai index §7.1 |

## 6. Giả định

1. **`audit_logs` còn rỗng.** Chưa có `writeAudit()` nên chưa hành động nào ghi được. Nếu sai, D-ET cần bước chuyển dữ liệu từ `changes`.
2. **P0.11 chạy trước P0.11b.** `manager_login` là action của admin-auth; audit phải có trước.
3. **Không giao UI xem audit.** [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) là P2.10; P0.11 giao route API.
4. **Hash chain không làm ở P0.** §11 Q2 — `BR-AUD-01` đã ép bằng quyền DB; hash chain chờ P3.

## 7. Ngoài phạm vi

- Màn hình xem audit — [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md), P2.10.
- Retention và archive sang S3 — §11 Q1, chặn P1.
- Hash chain chống sửa ở tầng hạ tầng — §11 Q2, chờ P3.
- Nội dung bản export trong `data_exported` — §11 Q3, chốt cùng P2; mặc định **chỉ metadata**.
- Các action thuộc P0.11b và P2 — gắn ở đúng bước sở hữu.
