# Checklist — Task #40: P1.14 — Account, legal consent singleton, force & deletion

> Kế hoạch: [`40-p1-14-account-consent-deletion-plan.md`](40-p1-14-account-consent-deletion-plan.md).
> Thiết kế lại 2026-08-14 theo root D12 (`D-QV`–`D-QZ`).
> Spec sở hữu: [`account-settings.md`](../specs/03-account/account-settings.md) · [`consent-management.md`](../specs/03-account/consent-management.md) · [`legal-consent-admin.md`](../specs/06-admin/legal-consent-admin.md) · [`account-deletion.md`](../specs/03-account/account-deletion.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P1.13 đã đóng** — document singleton code-owned (`/terms`, `/privacy`, `/child-privacy`), không versioned routes.
- [x] **P1.9 đã đóng** — ba trạng thái hồ sơ trẻ và đường khôi phục chạy được.
- [x] **P1.5 đã đóng** — registry job, bảng retry, `AlertPort` có adapter.
- [x] Human approve kế hoạch và sáu quyết định D-QV · D-QW · D-QX · D-QY · D-QZ.
- [x] Đối chiếu `BR-ACS-*` `BR-CSM-*` `BR-LCA-*` `BR-ADL-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng `feat/p1-14-account-consent-deletion`.

---

### Task 1 — Migration và validity primitive (`D-QZ`)

- [x] Migration `0030_consent_action_and_requirements.sql`: thêm `action` ('accepted' | 'withdrawn'), drop `policy_version`, tạo 3 singleton requirement rows (`terms`, `privacy`, `child_data`) với marker NULL.
- [x] `consent_logs` bảng INSERT-only (`BR-CSM-01`, `BR-CSM-07`).
- [x] Primitive dùng chung: `requireConsentActive()`, `assertUserTermsAndPrivacyConsent()`, `isAllowedConsentExemptPath()` (`apps/web/server/utils/consent-guard.ts`).
- [x] Clock so sánh ở DB; marker NULL giữ acceptance hiện có hợp lệ.
- [x] Invariant test: schema không còn `policy_version`, singleton đủ 3 loại (`apps/web/tests/api/consent-management.test.ts`).

### Task 2 — Legal document current-only (`D-QV`)

- [x] Registry code-owned có `slug`, `title`, `last_updated_on`, sections; không có `version`, version list hay snapshot history.
- [x] Chỉ giữ current page/API (`/terms`, `/privacy`, `/child-privacy`); mọi `/v/{version}` bị xoá.
- [x] `/terms`, `/privacy`, `/child-privacy` không tracking bên thứ ba (`lint:public-scripts`).
- [x] Deploy document không đụng `consent_requirements`.

### Task 3 — Marker API, registration và acceptance (`D-QY`)

- [x] `GET /api/guest/consent-requirements` chỉ trả marker Terms/Privacy.
- [x] Registration echo marker; force giữa lúc form mở trả 409 `CONSENT_REQUIREMENT_CHANGED`.
- [x] `GET /api/users/consents` trả 3 singletons theo contract singleton.
- [x] `POST /api/users/consents` echo marker trong transaction, so khớp marker và INSERT `action='accepted'`.
- [x] `CONSENT_VERSION_STALE` bị loại bỏ hoàn toàn khỏi `packages/auth` và `packages/shared`.
- [x] Acceptance response không chứa policy version, document history hay reason nội bộ.

### Task 4 — Gate Terms/Privacy và Child-data (`D-QX`)

- [x] Deny-by-default qua `apps/web/server/middleware/consent-gate.ts`: route User ngoài allow-list bị 428 `CONSENT_REQUIRED` khi Terms/Privacy required.
- [x] Allow-list đóng đúng [`consent-management.md`](../specs/03-account/consent-management.md) §7.4 (`isAllowedConsentExemptPath`): export, withdrawal, reauth, logout và account deletion vẫn chạy.
- [x] Child-data guard chặn create child profile và play session mới khi child_data required (`BR-CSM-10`).
- [x] Session bắt đầu trước marker vẫn ingest kết quả cuối; session tiếp theo bị chặn (`BR-CSM-10`).

### Task 5 — User UI (`/me/settings/privacy` & `/consent-required`)

- [x] `/me/settings/privacy` hiện loại, document current, accepted_at, status và `notice`.
- [x] `/consent-required` checkbox không tick sẵn (`BR-CSM-02`), hỗ trợ nhiều loại required và safe `return_to`.
- [x] 409 marker đổi làm reload nội dung/trạng thái, không tự retry acceptance.
- [x] Không version number, version history hay diff giả.
- [x] Withdrawal/deletion flow baseline tiếp tục chạy khi Terms/Privacy required.

### Task 6 — Audit action và admin force API (`D-QW`)

- [x] Đăng ký action `legal_reconsent_forced` trong `AUDIT_ACTIONS`; `notice` và `reason` 20–500 ký tự.
- [x] `GET /api/managers/legal-consents` chỉ `super_admin` (`requireRole('super_admin')`), `content_reviewer` nhận 403.
- [x] `POST /api/managers/legal-consent-forces` đòi recent reauth, confirm deployed/all users, lock row requirement và UPDATE marker + INSERT audit trong cùng transaction (`BR-LCA-01`..`03`).
- [x] Marker do DB sinh, cấm timestamp từ client; không route rollback/clear marker (`BR-LCA-07`, `BR-LCA-08`).

### Task 7 — Admin force UI (`/legal-consents`)

- [x] `apps/admin/app/pages/legal-consents/index.vue`: chỉ đọc metadata document và link toàn văn; không editor (`BR-LCA-09`).
- [x] Chọn đúng một loại; `notice` và reason tách biệt; hai xác nhận tác động rõ ràng.
- [x] Recent reauth 428 và conflict 409 có xử lý rõ ràng.
- [x] UI không có reset/clear/rollback và không cho chọn User riêng.

### Task 8 — Handoff SNS và task lịch sử

- [x] Task #41 nhận contract marker trong consent SNS và redirect forced consent.
- [x] Master P1.14 giữ tính nhất quán với contract mới.

### Task 9 — Evidence và promote

- [x] Test tham chiếu `BR-ACS-*`, `BR-CSM-*`, `BR-LCA-*`, `BR-ADL-*`, `BR-REG-03`, `BR-LGN-11` cho mọi nhánh.
- [x] `pnpm check`, `pnpm test`, `pnpm --filter @mindkid/gates test`, `node packages/gates/scripts/check-progress.ts` toàn bộ xanh.
- [x] Promote spec [`legal-consent-admin.md`](../specs/06-admin/legal-consent-admin.md) sang `status: implemented`.
- [x] Tick **P1.14** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).

---

## Cổng dừng

- [x] Không còn `policy_version`, version legal route/API/UI hay `CONSENT_VERSION_STALE` trong contract/code/test active.
- [x] Deploy không force; force không fan-out; audit fail rollback marker.
- [x] Force Terms/Privacy không khoá quyền export/withdraw/delete.
- [x] Force Child-data không thu mới và không cắt phiên đang chạy.
- [x] Registration/acceptance race marker luôn fail atomically bằng 409.
- [x] Content reviewer không đọc/force được; super admin chưa reauth không force được.
- [x] Full local gate xanh (175 test files, 1499 tests passed, 0 lint/typecheck errors).
