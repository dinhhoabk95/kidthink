# Task #299 Todo: Màn vận hành admin nói thật

Plan: [`299-admin-ops-truthfulness-plan.md`](299-admin-ops-truthfulness-plan.md).
Spec: [`system-activity.md`](../specs/06-admin/system-activity.md) `BR-SYS-01`, [`data-export.md`](../specs/06-admin/data-export.md) `BR-EXP-05/07`, [`notification-admin.md`](../specs/06-admin/notification-admin.md) `BR-NTA-03`, [`legal-consent-admin.md`](../specs/06-admin/legal-consent-admin.md) `BR-LCA-07`.

---

## S0 — Chốt notification template
- [ ] Hỏi người dùng: (a) template trong DB qua vòng đời nội dung hay (b) code-owned, gỡ PATCH giả

## S1 — System status (`BR-SYS-01`)
- [ ] Test đỏ: Valkey/queue không đo được → không trả `ok`
- [ ] Test đỏ: queue counts là số thật
- [ ] Ping Valkey + `getJobCounts()` ở `system/status.get.ts:86-104`

## S2 — Data export
- [ ] Test đỏ: vượt trần → 422 (`BR-EXP-05`)
- [ ] Test đỏ: rate limit qua Redis (`BR-EXP-07`)
- [ ] Test đỏ: `from`/`to` lọc đúng (§8)
- [ ] Đếm trước, bỏ `.limit` im lặng; `checkRateLimit`; áp `from`/`to`

## S3 — Legal consent force
- [ ] Test đỏ: thiếu `confirm_*` → 422
- [ ] Test đỏ: `expected_requirement_at` cũ → 409 `CONSENT_REQUIREMENT_CHANGED`
- [ ] Test đỏ: marker do DB sinh, lớn hơn marker cũ (`BR-LCA-07`); 201 có `affected_user_count`
- [ ] Sửa `legal-consent-forces/index.post.ts` (transaction, `FOR UPDATE`, lỗi domain)

## S4 — Notification template
- [ ] (b) Test đỏ PATCH không còn; gỡ `[version].patch.ts`; sửa spec trước
- [ ] (a) Test đỏ PATCH lưu draft + publish đổi render; bảng + migration + renderer

## S5 — Nghiệm thu
- [ ] `rtk proxy pnpm lint` exit 0
- [ ] `rtk proxy pnpm typecheck` exit 0
- [ ] Test web/admin liên quan + `check:error-codes` + `check:test-ratchet` xanh
- [ ] Bỏ `open_tasks` + khối "Chưa hoàn thành" ở 4 spec, nâng `status: implemented`
- [ ] Commit lên `main`
