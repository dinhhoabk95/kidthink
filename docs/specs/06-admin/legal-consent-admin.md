---
spec: LEGAL-CONSENT-ADMIN
title: Force đồng ý lại tài liệu pháp lý
area: admin
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-14
owns:
  - Luồng admin force re-consent
  - GET /api/managers/legal-consents
  - POST /api/managers/legal-consent-forces
depends_on:
  - ADMIN-AUTH
  - AUDIT-LOG
  - CONSENT-MANAGEMENT
---

# Force đồng ý lại tài liệu pháp lý

## 1. Objective

Cho `super_admin` chủ động yêu cầu User đồng ý lại sau khi một document pháp lý singleton đã
được sửa, legal review và deploy. Feature này **không** sửa nội dung, không tạo policy version
và không cập nhật hàng loạt User; nó chỉ dịch mốc `reconsent_required_at` của loại được chọn.

Mỗi force ảnh hưởng toàn hệ thống nên cần recent reauth, xác nhận rõ, lý do nội bộ, thông báo
tiếng Việt cho User và audit trong cùng transaction. Không có nút huỷ force: khi marker đã
dịch, User cần đồng ý lại hoặc đi theo đường withdrawal/account deletion.

## 2. Actors

| Actor | Quyền | Làm được gì ở đây |
|---|---|---|
| `super_admin` | `requireManagerAuth()` + `requireRole('super_admin')` + recent reauth | Xem trạng thái và force từng loại |
| `content_reviewer` | Manager session | Không đọc số User ảnh hưởng, không force; nhận 403 |
| User | Không vào admin | Bị ảnh hưởng theo [`consent-management.md`](../03-account/consent-management.md) mục 5 |

## 3. Entry points

`/legal-consents` trong admin app · `GET /api/managers/legal-consents` ·
`POST /api/managers/legal-consent-forces`.

## 4. Main flow

1. Bản sửa của `/terms`, `/privacy` hoặc `/child-privacy` đã qua legal review và deploy.
2. `super_admin` mở `/legal-consents`; màn hình hiện route document, `last_updated_on`, marker
   gần nhất, thông báo gần nhất và số User đang cần đồng ý lại.
3. Manager chọn đúng một `consent_type`, nhập `notice` cho User và `reason` nội bộ, rồi xác
   nhận tác động toàn hệ thống.
4. Server yêu cầu recent reauth, khoá singleton requirement và so `expected_requirement_at`.
5. Trong một transaction, server tạo mốc mới bằng clock DB, cập nhật `notice` và INSERT
   audit action `legal_reconsent_forced`.
6. Request User kế tiếp áp gate do
   [`consent-management.md`](../03-account/consent-management.md) mục 7.4 sở hữu.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Chưa recent reauth | Session Manager hợp lệ nhưng reauth quá 5 phút | 428 `REAUTH_REQUIRED`; không đổi marker |
| Hai admin mở cùng trạng thái | `expected_requirement_at` cũ | Request sau trả 409 `CONSENT_REQUIREMENT_CHANGED`; không ghi audit |
| Force lặp lại | Một số User chưa đồng ý lần force trước | Tạo marker mới hơn; acceptance nằm giữa hai marker lại thành required |
| Audit fail | DB hoặc helper audit lỗi | Rollback cả marker và notice |
| Chọn loại ngoài danh sách đóng | Giá trị khác ba loại mục 7.1 | 422 `VALIDATION_FAILED` |
| Document chưa deploy hoặc đang `pending_review` | Checklist xác nhận không đạt | UI không cho gửi; server vẫn yêu cầu `confirm_deployed=true` nhưng human release review là cổng cuối |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LCA-01` | Chỉ `super_admin` có recent reauth mới force được | Một click ảnh hưởng toàn bộ User; Manager role thấp hơn không có nhiệm vụ vận hành pháp lý |
| `BR-LCA-02` | Force chỉ UPDATE một singleton requirement; cấm policy version và cấm UPDATE hàng loạt User | Marker toàn cục cho cùng kết quả với chi phí và rủi ro thấp hơn fan-out theo User |
| `BR-LCA-03` | UPDATE marker và INSERT audit `legal_reconsent_forced` ở **cùng transaction** | Force không có audit hoặc audit không có force đều làm mất bằng chứng vận hành |
| `BR-LCA-04` | `consent_type` là danh sách đóng `terms` · `privacy` · `child_data`; mỗi request force đúng một loại | Tác động của ba loại khác nhau; bulk mơ hồ làm User bị chặn rộng hơn ý định |
| `BR-LCA-05` | `notice` và `reason` đều 20–500 ký tự; `notice` hiện cho User, `reason` chỉ vào audit | User cần lý do dễ hiểu, người điều tra cần lý do vận hành; dùng chung một chuỗi sẽ làm một trong hai sai mục đích |
| `BR-LCA-06` | Cấm — **NEVER force tự động từ deploy, migration, feature flag hay thay đổi file** | Quyết định buộc toàn bộ User đồng ý lại cần con người chịu trách nhiệm sau khi xác nhận bản deploy |
| `BR-LCA-07` | Marker do DB sinh và phải lớn hơn marker cũ; client không được chọn thời điểm | Client chọn timestamp có thể đặt marker về quá khứ và làm acceptance cũ sống lại |
| `BR-LCA-08` | Cấm — **NEVER rollback, clear hay giảm marker sau force** | Hạ marker sẽ âm thầm coi User chưa đồng ý là đã đồng ý; force nhầm được xử lý bằng thông báo và re-consent, không sửa lịch sử |
| `BR-LCA-09` | Admin UI chỉ đọc metadata document; cấm editor nội dung pháp lý | Nội dung phải đi qua diff PR và legal review theo [`legal-pages.md`](../02-public/legal-pages.md) mục 10 |

## 7. Data

### 7.1 Ba hàng singleton

| `consent_type` | Document | Gate sau force |
|---|---|---|
| `terms` | `/terms` | Product access ngoài allow-list quyền dữ liệu |
| `privacy` | `/privacy` | Product access ngoài allow-list quyền dữ liệu |
| `child_data` | `/child-privacy` | Thu dữ liệu trẻ và play session mới |

### 7.2 Đọc và ghi

**Đọc:** registry document code-owned · `consent_requirements` · `consent_logs` tổng hợp.

**Ghi:** một hàng `consent_requirements` và một hàng `audit_logs` trong cùng transaction.

Hình dạng cột thuộc
[`schema-identity-billing.md`](../01-platform/schema-identity-billing.md) mục 7.4a. API không trả
danh sách User bị ảnh hưởng và không cho chọn User riêng lẻ.

## 8. API contract

### `GET /api/managers/legal-consents`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `requireRole('super_admin')` |
| 200 | `{ items: [{ consent_type, document_url, last_updated_on, requirement_at, notice, affected_user_count }] }` |
| 403 | `INSUFFICIENT_ROLE` |

### `POST /api/managers/legal-consent-forces`

| | |
|---|---|
| Auth | `requireManagerAuth()` + `requireRole('super_admin')` + recent reauth + CSRF |
| Body | `{ consent_type, expected_requirement_at: string \| null, notice, reason, confirm_deployed: true, confirm_all_users: true }` |
| 201 | `{ consent_type, requirement_at, affected_user_count }` |
| 409 | `CONSENT_REQUIREMENT_CHANGED` — marker đã đổi sau khi Manager tải màn hình |
| 422 | `VALIDATION_FAILED` |
| 428 | `REAUTH_REQUIRED` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-LCA-01 — content_reviewer không force được
  Given manager có role content_reviewer
  When gọi POST /api/managers/legal-consent-forces
  Then trả 403 INSUFFICIENT_ROLE
  And consent_requirements không đổi

Scenario: BR-LCA-02 — force không fan-out theo User
  Given hệ thống có 100000 User
  When super_admin force privacy
  Then đúng một hàng consent_requirements bị UPDATE
  And không hàng users hay consent_logs nào bị UPDATE hoặc INSERT

Scenario: BR-LCA-03 — audit fail rollback force
  Given writeAudit sẽ thất bại
  When super_admin force terms
  Then transaction rollback
  And requirement_at và notice không đổi

Scenario: BR-LCA-05 — force có hai lý do đúng đối tượng
  When super_admin force privacy với notice và reason hợp lệ
  Then User thấy notice
  And audit_logs.reason chứa reason
  And response User không chứa reason nội bộ

Scenario: BR-LCA-07 — marker chỉ tiến tới
  Given privacy có requirement_at A
  When super_admin force privacy thành công
  Then requirement_at mới lớn hơn A
  And timestamp trong body client không thể ghi đè giá trị đó

Scenario: BR-LCA-08 — không có đường hạ marker
  When quét route và UI admin legal consent
  Then chỉ có GET trạng thái và POST force
  And không có reset, clear, rollback hay DELETE

Scenario: BR-LCA-09 — admin không sửa document
  When mở /legal-consents
  Then document chỉ có link đọc
  And không có input sửa title, section hay last_updated_on
```

## 10. Boundaries

**Always**
- Recent reauth và `super_admin` role trước force.
- Lý do nội bộ, thông báo User và hai checkbox xác nhận tác động.
- Marker + audit trong cùng transaction.
- So `expected_requirement_at` để chống ghi đè thao tác đồng thời.

**Ask first**
- Thêm consent type.
- Đổi allow-list User bị gate.
- Cho role khác xem hoặc force.
- Thêm hành động hoàn tác force.

**Never**
- Policy version, document history hay editor nội dung.
- Force tự động từ deploy, migration hoặc feature flag.
- UPDATE hàng loạt User hay `consent_logs`.
- Cho client chọn marker timestamp.
- Clear, giảm hoặc rollback marker.

## 11. Open questions

Không có.
