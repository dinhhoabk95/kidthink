# Checklist — Task #24: P0.11 — Nhật ký kiểm toán

> Kế hoạch: [`24-p0-11-audit-log-plan.md`](24-p0-11-audit-log-plan.md).
> Audit phải xong **trước** P0.11b — `manager_login` là action của bước đó.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] Human approve kế hoạch và bốn quyết định D-ET · D-EU · D-EV · D-EW.
- [ ] **P0.3 đã đóng** — `actor_type` đọc được từ context.
- [ ] Xác nhận `audit_logs` còn rỗng trước khi tách cột.
- [ ] Đối chiếu `BR-AUD-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Migration `audit_logs`

- [ ] Ca âm: ghi hàng audit có `reason` **ĐỎ** — cột không tồn tại.
- [ ] Tách `changes` thành `before_data` và `after_data`.
- [ ] Thêm `reason` text.
- [ ] `actor_id` nullable + CHECK: `system` thì NULL, ngược lại NOT NULL.
- [ ] Thêm index `(entity_type, entity_id, created_at)` và `(action, created_at)`.
- [ ] `REVOKE UPDATE, DELETE ON audit_logs` giữ nguyên; test `BR-AUD-01` vẫn xanh.
- [ ] `pnpm db:migrate` từ database rỗng không lỗi.

### Task 2 — Registry 28 action

- [ ] 28 action §7.2 khai `as const`, nhóm theo bảng.
- [ ] Cờ `requiresReason` đúng 13 action.
- [ ] Action ngoài registry là lỗi biên dịch.
- [ ] Thiếu `reason` cho action bắt buộc là **lỗi biên dịch**.
- [ ] Test đối chiếu registry với bảng §7.2 — thiếu hoặc thừa một dòng là ĐỎ.

### Task 3 — `writeAudit(tx, …)`

- [ ] `tx` là tham số đầu **bắt buộc**; gọi ngoài transaction là lỗi biên dịch.
- [ ] Ca âm `BR-AUD-02`: audit fail → rollback → đơn vẫn `submitted`, không entitlement nào cấp.
- [ ] `BR-AUD-07`: archive 5 level → đúng 5 hàng, 5 `entity_id` khác nhau.
- [ ] `BR-AUD-04`: `before_data`/`after_data` chỉ chứa field đã đổi.
- [ ] Payload lớn → cắt còn field đã đổi + hash bản đầy đủ.
- [ ] Cổng: không chỗ nào INSERT thẳng vào `audit_logs`.

### Task 4 — Cổng nội dung payload

- [ ] `BR-AUD-05`: chặn `display_name` `birth_year` và mọi field trẻ ngoài `child_uuid`.
- [ ] Ca âm: audit archive trẻ mang `display_name` làm cổng **ĐỎ**.
- [ ] `BR-AUD-06`: chặn `password` `password_hash` `token` `token_hash` `secret`, **kể cả dạng hash**.
- [ ] Ca âm: audit đổi mật khẩu mang hash làm cổng **ĐỎ**.
- [ ] Cổng chạy ở **runtime** trong `writeAudit`, không chỉ ở lint.
- [ ] `BR-AUD-08`: hàng audit còn nguyên sau job purge của P0.4.

### Task 5 — Gắn audit vào hành động đã tồn tại

- [ ] Lập bảng 28 action × bước sở hữu.
- [ ] Action đã có code: gắn `writeAudit` **trong cùng transaction** ngay PR này.
- [ ] Action chưa có code: ghi bước sở hữu, **không** tick, **không** tạo handler giả.
- [ ] Test duyệt danh sách action đã gắn, mỗi cái sinh đúng một hàng.

### Task 6 — `GET /api/managers/audit-logs`

- [ ] Auth `requireManagerAuth()` + role `super_admin`.
- [ ] Ca âm `BR-AUD-09`: `content_reviewer` gọi → **403**.
- [ ] Filter đủ sáu trục; `limit` trần 200; phân trang cursor.
- [ ] Không route `UPDATE`/`DELETE` nào.

## Cổng dừng

- [ ] `audit_logs` có `before_data` `after_data` `reason`; ba index đủ.
- [ ] Gọi `writeAudit` ngoài transaction là lỗi biên dịch.
- [ ] Cổng payload chặn PII trẻ và bí mật ở runtime, có ca âm.
- [ ] `content_reviewer` không đọc được audit.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human review diff.

## Task 7 — Evidence và promote

- [ ] Mỗi `BR-AUD-*` có test tham chiếu mã rule.
- [ ] Bảng 28 action × bước sở hữu ghi vào [`audit-log.md`](../specs/01-platform/audit-log.md).
- [ ] §11 Q1 (retention) ghi là chặn P1.
- [ ] [`audit-log.md`](../specs/01-platform/audit-log.md) sang `implemented` chỉ khi đủ evidence.
- [ ] Tick **P0.11** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.

## Cổng dừng cuối

- [ ] Không tạo handler giả để tick action chưa có code.
- [ ] Không bí mật hay PII trẻ trong bất kỳ hàng audit nào.
- [ ] Không kéo [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) (P2.10) lên sớm.
- [ ] Sẵn sàng lập plan P0.11b.
