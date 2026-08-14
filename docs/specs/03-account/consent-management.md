---
spec: CONSENT-MANAGEMENT
title: Quản lý đồng ý
area: account
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-14
owns:
  - Luồng xem, ghi nhận, rút đồng ý
  - Cách tính trạng thái đồng ý hiện hành
  - User gate khi admin force re-consent
depends_on:
  - CHILD-DATA-COMPLIANCE
  - LEGAL-PAGES
---

# Quản lý đồng ý

## 1. Objective

User xem được mình đã đồng ý loại nào, vào lúc nào, rút lại được và được hỏi lại khi
`super_admin` force sau một thay đổi pháp lý quan trọng. Hệ thống không quản lý policy version:
mỗi tài liệu có một bản code-owned hiện hành, còn trạng thái re-consent dùng một mốc
`reconsent_required_at` theo từng loại.

Đồng ý phải tường minh và chứng minh được nhưng không được biến thành cách khoá quyền export,
rút đồng ý hay xoá tài khoản. Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, Nghị định 13/2023 và
Luật Trẻ em là căn cứ cần legal review; spec này không thay tư vấn pháp lý.

## 2. Actors

| Actor | Quyền | Làm được gì ở đây |
|---|---|---|
| User | `requireUserAuth()` | Xem, đồng ý, rút đồng ý của chính mình |
| Guest đăng ký | Không | Đọc marker hiện hành cho hai checkbox đăng ký |
| Child Profile | Không có credential | Không đồng ý và không rút đồng ý |

Thao tác force của `super_admin` thuộc
[`legal-consent-admin.md`](../06-admin/legal-consent-admin.md), không thuộc màn hình User này.

## 3. Entry points

`/me/settings/privacy` · `/consent-required` · `GET /api/users/consents` ·
`POST /api/users/consents` · `POST /api/users/consents/withdraw` ·
`GET /api/guest/consent-requirements`.

## 4. Main flow

1. User mở `/me/settings/privacy` hoặc bị điều hướng tới `/consent-required`.
2. Server tính trạng thái từng loại từ lần `consent_logs` mới nhất và singleton
   `consent_requirements` tương ứng.
3. Màn hình hiện loại, document hiện hành, lần đồng ý gần nhất, trạng thái và thông báo thay đổi
   do `super_admin` nhập khi force; không hiện version hay diff version.
4. User mở toàn văn hiện hành, tick checkbox chưa được chọn sẵn và gửi
   `{ consent_type, requirement_at, accept: true }`.
5. Server khoá hàng requirement, đối chiếu `requirement_at`, rồi INSERT một hàng
   `action='accepted'` kèm IP, user agent và thời điểm.
6. Khi mọi loại đang chặn đã hợp lệ, User trở lại `return_to` đã được kiểm tra là path nội bộ.

Một consent hợp lệ khi hàng mới nhất của loại đó có `action='accepted'` và
`created_at >= reconsent_required_at`; nếu marker là NULL thì chỉ cần hàng `accepted` mới nhất.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Force `terms` hoặc `privacy` | Acceptance gần nhất cũ hơn marker | Navigation đưa tới `/consent-required`; product API trả 428 `CONSENT_REQUIRED` ngoài allow-list mục 7.4 |
| Force `child_data` | Acceptance gần nhất cũ hơn marker | Không mở play session mới và không thu dữ liệu trẻ mới; vẫn đọc, export, sửa/xoá theo quyền chủ thể dữ liệu |
| Game đang chạy khi force `child_data` | Session đã mở trước marker | Cho phiên hiện tại hoàn tất; chặn session mới, không cắt ngang trẻ |
| Marker đổi khi form đang mở | `requirement_at` client gửi khác DB | 409 `CONSENT_REQUIREMENT_CHANGED`; tải lại document và checkbox |
| Rút `child_data` | User xác nhận hậu quả | INSERT `withdrawn`; archive hồ sơ, dừng thu mới, giữ 30 ngày rồi purge |
| Rút `privacy` hoặc `terms` | User xác nhận | INSERT `withdrawn`, dẫn sang luồng xoá tài khoản; không tự xoá |
| Đồng ý lại sau khi rút | Chưa purge | INSERT `accepted`; khôi phục hồ sơ `child_data` trong cửa sổ 30 ngày |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CSM-01` | `consent_logs` **INSERT-only**. Đồng ý và rút đều thêm hàng | Sửa hàng cũ làm mất bằng chứng chuỗi hành động của User |
| `BR-CSM-02` | Đồng ý **tường minh**, checkbox không tick sẵn, không suy từ login, tiếp tục dùng hay hành vi khác | Đồng ý phải là hành động chủ động, cụ thể |
| `BR-CSM-03` | Chỉ marker do `super_admin` force mới làm acceptance cũ hết hiệu lực; deploy code tự nó không force | Tách quyết định pháp lý toàn hệ thống khỏi thao tác release kỹ thuật |
| `BR-CSM-04` | Gate theo loại và **không bao giờ** chặn đọc legal document, export dữ liệu, rút đồng ý, reauth, logout hay xoá tài khoản | User phải luôn thực hiện được quyền dữ liệu và đường từ chối hợp pháp |
| `BR-CSM-05` | Màn hình re-consent hiện `notice_vi` của lần force và link toàn văn singleton; cấm giả diff khi không có policy version | User cần biết lý do được hỏi lại; diff bịa từ một bản duy nhất là thông tin sai |
| `BR-CSM-06` | Rút đồng ý nêu **hậu quả cụ thể** trước khi xác nhận | Người dùng phải hiểu phạm vi ảnh hưởng trước hành động nhạy cảm |
| `BR-CSM-07` | Mỗi hàng ghi `consent_type`, `action`, IP, user agent và thời điểm; cấm `policy_version` | Đây là bằng chứng hành động trong mô hình marker, không phải bằng chứng policy version |
| `BR-CSM-08` | Rút `child_data` **không xoá ngay** — archive rồi purge sau 30 ngày | Cho phép đổi ý và khôi phục trước khi dữ liệu bị xoá |
| `BR-CSM-09` | POST đồng ý phải so `requirement_at` client đã xem với marker hiện hành trong cùng transaction; lệch trả 409 | Admin có thể force lúc form đang mở; không đối chiếu sẽ ghi nhận đồng ý cho nội dung User chưa đọc |
| `BR-CSM-10` | Force `child_data` chặn mọi **thu thập mới** nhưng không cắt session đang chạy và không chặn đọc dữ liệu cũ | Dừng xử lý mới mà không gây hại trải nghiệm của trẻ hoặc giữ dữ liệu làm con tin |

## 7. Data

### 7.1 Loại đồng ý

| Loại | Lần đầu thu | Khi force sẽ chặn | Rút được |
|---|---|---|:--:|
| `terms` | Đăng ký | Product access ngoài allow-list mục 7.4 | Có; dẫn sang xoá tài khoản |
| `privacy` | Đăng ký | Product access ngoài allow-list mục 7.4 | Có; dẫn sang xoá tài khoản |
| `child_data` | Trước lần thu dữ liệu trẻ đầu tiên | Session chơi và mutation thu dữ liệu trẻ mới | Có |

Ba loại là danh sách đóng. Không có consent tiếp thị ở MVP vì không có email tiếp thị theo
quy tắc `BR-NOT-06` của [`notification-service.md`](../01-platform/notification-service.md).

### 7.2 Màn hình User

| Cột | Nội dung |
|---|---|
| Loại | Nhãn tiếng Việt + link document singleton |
| Đồng ý gần nhất | Thời điểm, không số version |
| Trạng thái | `active` · `required` · `withdrawn` |
| Thông báo thay đổi | `notice_vi` của lần force gần nhất; không giả diff |
| Hành động | Đọc toàn văn · Đồng ý · Rút |

### 7.3 `consent_logs` và `consent_requirements`

Hình dạng cột canonical thuộc
[`schema-identity-billing.md`](../01-platform/schema-identity-billing.md) mục 7.4–7.4a.
Module này chỉ ghi INSERT vào `consent_logs`; chỉ admin force được UPDATE singleton requirement.

### 7.4 Allow-list khi `terms` hoặc `privacy` đang required

| Route / bề mặt | Lý do vẫn cho phép |
|---|---|
| Trang public và pháp lý | Đọc văn bản trước khi quyết định |
| `GET/POST /api/users/consents` và route withdraw | Xem, đồng ý hoặc từ chối |
| `POST /api/users/auth/reauth` · `POST /api/users/auth/logout` | Xác minh thao tác nhạy cảm hoặc rời tài khoản |
| `GET /api/users/data-export` | Quyền lấy bản sao dữ liệu |
| Route xem, tạo và huỷ yêu cầu xoá tài khoản | Đường từ chối điều khoản mà không mất quyền chủ thể dữ liệu |

Allow-list là danh sách đóng trong code. Route `/api/users/**` mới mặc định bị gate khi
`terms` hoặc `privacy` required cho tới khi được review và thêm tường minh vào danh sách.

## 8. API contract

### `GET /api/guest/consent-requirements`

| | |
|---|---|
| Auth | Không |
| 200 | `{ terms: { requirement_at }, privacy: { requirement_at } }` |

Dùng cho form đăng ký email và SNS. Không trả `notice_vi`, manager hay số User ảnh hưởng.

### `GET /api/users/consents`

| | |
|---|---|
| Auth | `requireUserAuth()`; route thuộc allow-list mục 7.4 |
| 200 | `{ consents: [{ consent_type, document_url, accepted_at, requirement_at, notice_vi, status }] }` |

### `POST /api/users/consents`

| | |
|---|---|
| Auth | `requireUserAuth()`; route thuộc allow-list mục 7.4 |
| Body | `{ consent_type, requirement_at: string \| null, accept: true }` |
| 201 | `{ consent_type, accepted_at, status: 'active' }` |
| 409 | `CONSENT_REQUIREMENT_CHANGED` — marker đã đổi từ lúc User tải form |
| 422 | `VALIDATION_FAILED` |

### `POST /api/users/consents/withdraw`

| | |
|---|---|
| Auth | `requireUserAuth()` + reauth gần nhất |
| Body | `{ consent_type, confirm: true }` |
| 200 | `{ consent_type, status: 'withdrawn', consequence }` |

## 9. Acceptance criteria

```gherkin
Scenario: BR-CSM-01 — rút tạo hàng mới
  Given user đã có một hàng child_data accepted
  When rút đồng ý
  Then consent_logs có thêm một hàng child_data withdrawn
  And hàng accepted không đổi

Scenario: BR-CSM-03 — deploy không tự hỏi lại
  Given privacy đã được sửa và deploy
  When super_admin chưa force
  Then user đã accepted vẫn có trạng thái active

Scenario: BR-CSM-04 — force terms giữ đường thực hiện quyền dữ liệu
  Given terms đang required với user
  When user gọi GET /api/users/data-export và mở trang xoá tài khoản
  Then cả hai được phép
  When user gọi một product API ngoài allow-list
  Then trả 428 CONSENT_REQUIRED

Scenario: BR-CSM-05 — re-consent không giả policy diff
  Given privacy đã được force với notice_vi hợp lệ
  When mở /consent-required
  Then hiện notice_vi và link /privacy
  And không có số version, version cũ hay diff version

Scenario: BR-CSM-09 — marker đổi khi form đang mở
  Given user mở form với requirement_at A
  And super_admin force tạo requirement_at B
  When user POST đồng ý với A
  Then trả 409 CONSENT_REQUIREMENT_CHANGED
  And không INSERT consent_logs

Scenario: BR-CSM-10 — child_data force dừng thu mới
  Given user có một child profile và child_data đang required
  When bắt đầu play session mới
  Then trả 428 CONSENT_REQUIRED
  When đọc báo cáo và export dữ liệu cũ
  Then cả hai vẫn thành công

Scenario: BR-CSM-10 — không cắt session đang chạy
  Given một play session bắt đầu trước khi child_data bị force
  When force xảy ra giữa phiên
  Then phiên hiện tại hoàn tất được
  And play session kế tiếp bị chặn

Scenario: BR-CSM-08 — rút không xoá ngay
  When rút đồng ý child_data
  Then hồ sơ trẻ chuyển archived
  And dữ liệu vẫn còn
  When đồng ý lại trong 30 ngày
  Then hồ sơ khôi phục

Scenario: BR-CSM-02 — không tick sẵn
  When mở màn hình re-consent
  Then mọi checkbox chưa tick
```

## 10. Boundaries

**Always**
- INSERT-only cho mọi hành động consent.
- Tính validity từ action mới nhất và `reconsent_required_at` hiện hành.
- So marker trong cùng transaction trước khi INSERT acceptance.
- Giữ allow-list quyền dữ liệu hoạt động khi consent required.

**Ask first**
- Thêm loại consent.
- Thêm route vào allow-list mục 7.4.
- Đổi thời hạn 30 ngày sau khi rút `child_data`.
- Thay đổi hậu quả của `terms` hoặc `privacy` withdrawal.

**Never**
- `policy_version`, version history hay diff version.
- Sửa hoặc xoá hàng `consent_logs`.
- Tick sẵn hoặc suy đồng ý từ hành vi.
- Cho client cũ ghi acceptance sau khi marker đổi.
- Chặn legal document, export, withdrawal, reauth, logout hay account deletion.
- Cắt play session đang chạy vì một force mới.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Diff chính sách sinh tự động hay soạn tay?~~ **Đóng 2026-08-14 (`D-QV`)**: không có policy version nên không sinh diff; `super_admin` nhập `notice_vi` cho lần force và User đọc toàn văn singleton | — | Đã đóng | D-QV |
| ~~2~~ | ~~Version chính sách đổi bao lâu một lần và ai quyết định?~~ **Đóng 2026-08-14 (`D-QV`)**: không có version; nội dung đổi bằng PR, còn `super_admin` quyết định force sau deploy | — | Đã đóng | D-QV |

