---
spec: ERROR-CODES
title: Registry mã lỗi
area: foundation
status: draft
mvp: true
phase: P0
reviewed: 2026-08-05
owns:
  - Danh sách mã lỗi nghiệp vụ
  - Ánh xạ mã lỗi → HTTP status
  - Quy tắc thông báo hướng người dùng
depends_on:
  - GLOSSARY
---

# Registry mã lỗi

## 1. Objective

Client cần phân biệt "chưa đăng nhập" với "đã đăng nhập nhưng không đủ quyền" với "hết
quota" — ba thứ này dẫn tới ba màn hình khác nhau. HTTP status một mình không đủ.

Mã lỗi nghiệp vụ là **contract**. Client bắt theo mã, ❌ không bao giờ bắt theo chuỗi thông
báo — chuỗi đổi theo bản dịch, mã thì không.

## 2. Actors

Không có. Registry tham chiếu.

## 3. Entry points

Mọi handler API. Mọi spec khai báo mã lỗi phải đăng ký ở đây.

## 4. Main flow

1. Handler ném lỗi kèm mã.
2. Middleware bắt, tra bảng §7 để lấy HTTP status.
3. Dựng body §7.1.
4. Log server-side có ngữ cảnh đầy đủ; body trả về **không** có stack trace, **không** có id
   nội bộ.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Lỗi không có trong registry | Log `ERROR` mức cao + trả `INTERNAL_ERROR` 500. **Lỗi lập trình** |
| Lỗi Zod | Gom thành `VALIDATION_FAILED` 422 kèm `fields[]` |
| Lỗi DB constraint | Ánh xạ sang mã nghiệp vụ tương ứng, ❌ không lộ tên constraint |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ERR-01` | Mã lỗi là `SCREAMING_SNAKE`, đăng ký ở §7 trước khi dùng | Mã không đăng ký sẽ trùng nghĩa với mã khác |
| `BR-ERR-02` | ❌ **NEVER thông báo lỗi tiết lộ tài khoản có tồn tại hay không** | Enumeration email |
| `BR-ERR-03` | ❌ **NEVER stack trace, tên bảng, tên constraint, hay id nội bộ** trong body | |
| `BR-ERR-04` | Thông báo hướng người dùng là **tiếng Việt thân thiện**, nói được **làm gì tiếp** | "Đã xảy ra lỗi" không giúp ai |
| `BR-ERR-05` | Record của người khác → `NOT_FOUND` 404, ❌ không `FORBIDDEN` 403 | 403 xác nhận record tồn tại |
| `BR-ERR-06` | Client bắt theo **mã**, ❌ không theo chuỗi | |
| `BR-ERR-07` | Mã 402 dành riêng cho **hết quota**; 403 cho **thiếu quyền** | Hai thứ này dẫn tới hai CTA khác nhau: mua thêm vs nâng cấp |
| `BR-ERR-08` | ❌ **NEVER thông báo lỗi tiết lộ tài khoản đăng nhập bằng cách nào** — mật khẩu hay SNS nào | Mở rộng của `BR-ERR-02`. Biết "email này dùng Google" cho kẻ tấn công chọn hướng, và người dùng ❌ không đổi được điều đó. Ngoại lệ duy nhất: `SOCIAL_EMAIL_CONFLICT`, nơi caller **đã chứng minh** kiểm soát hộp thư ấy |

## 7. Data — registry

### 7.1 Hình dạng response lỗi

```json
{
  "code": "TIER_LOCKED",
  "message": "Nội dung này thuộc gói Premium.",
  "details": { "access_tier": "premium", "required_entitlement": "play_premium_games" }
}
```

`details` là tuỳ mã. `message` để hiển thị; `code` để phân nhánh.

### 7.2 Auth và quyền

| Mã | HTTP | Khi nào | Thông báo |
|---|:--:|---|---|
| `UNAUTHENTICATED` | 401 | Thiếu / hỏng / sai audience token | "Bạn cần đăng nhập để tiếp tục." |
| `TOKEN_EXPIRED` | 401 | Access token hết hạn, refresh được | — client tự refresh |
| `SESSION_REVOKED` | 401 | `refresh_token_version` lệch | "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại." |
| `INSUFFICIENT_ROLE` | 403 | Manager role không đủ | "Bạn không có quyền truy cập mục này." |
| `ENTITLEMENT_REQUIRED` | 403 | Thiếu entitlement key | "Tính năng này thuộc gói {tên gói}." |
| `TIER_LOCKED` | 403 | Content bậc cao hơn quyền | "Nội dung này thuộc gói {tên gói}." |
| `ACCOUNT_SUSPENDED` | 403 | `users.status = 'suspended'` | "Tài khoản đang tạm khoá. Liên hệ hỗ trợ." |
| `NO_ACTIVE_CHILD` | 428 | Route cần trẻ, chưa chọn | "Hãy chọn hồ sơ bé trước khi tiếp tục." |
| `PARENT_GATE_REQUIRED` | 403 | Đổi `active_child_id` sang trẻ khác không kèm `gate_token` hợp lệ (`child-profile-switching.md`, `play-entry-and-profile-select.md`) | "Cần xác nhận của phụ huynh để tiếp tục." |
| `CONSENT_REQUIRED` | 428 | Chưa đồng ý chính sách hiện hành | "Vui lòng đọc và đồng ý chính sách bảo vệ dữ liệu trẻ em." |
| `CONSENT_VERSION_STALE` | 409 | Chính sách đã có bản mới | "Chính sách đã cập nhật. Vui lòng xem lại." |
| `MFA_REQUIRED` | 428 | Manager chưa qua MFA; hoặc User đã bật MFA và mới qua yếu tố thứ nhất — kể cả khi yếu tố đó là SNS (`BR-MFA-09`) | — |
| `MFA_INVALID_CODE` | 401 | Mã TOTP sai, hoặc mã khôi phục sai / đã dùng | "Mã không đúng. Thử lại hoặc dùng mã khôi phục." |
| `MFA_LOCKED` | 429 | Sai mã 5 lần, `details.retry_after_s` | "Sai mã quá nhiều lần. Thử lại sau 15 phút." |
| `REAUTH_REQUIRED` | 428 | Thao tác nhạy cảm, phiên chưa reauth trong 5 phút. `details.methods[]` ∈ `password`\|`social`\|`totp` | "Vui lòng xác minh lại danh tính để tiếp tục." |
| `NOT_FOUND` | 404 | Không tồn tại **hoặc** không thuộc caller | "Không tìm thấy nội dung." |

### 7.2a Mạng xã hội và OAuth

| Mã | HTTP | Khi nào | Thông báo |
|---|:--:|---|---|
| `SOCIAL_EMAIL_CONFLICT` | 409 | Provider trả email đã có tài khoản, chưa liên kết. ❌ **NEVER tự liên kết** (`BR-SCL-04`) | "Email này đã có tài khoản KidThink. Hãy đăng nhập rồi liên kết {provider} trong Cài đặt → Bảo mật." |
| `SOCIAL_IDENTITY_ALREADY_LINKED` | 409 | Tài khoản SNS đó đã gắn User khác. Body ❌ **không** nói User nào (`BR-SLK-06`) | "Tài khoản {provider} này đã được liên kết với một tài khoản khác." |
| `SOCIAL_PROVIDER_ALREADY_LINKED` | 409 | User đã có provider đó (`BR-SLK-02`) | "Bạn đã liên kết {provider} rồi." |
| `LAST_LOGIN_METHOD` | 409 | Gỡ SNS cuối trên tài khoản ❌ không mật khẩu. `details.set_password_url` | "Đây là cách đăng nhập duy nhất của bạn. Hãy đặt mật khẩu trước khi gỡ." |
| `PASSWORD_NOT_SET` | 409 | Gọi "đổi mật khẩu" trên tài khoản `password_hash` NULL | "Tài khoản chưa có mật khẩu. Hãy dùng Đặt mật khẩu." |
| `OAUTH_STATE_INVALID` | 400 | `state` lệch, thiếu, hoặc đã dùng (`BR-OAP-03` `BR-OAP-14`) | "Phiên đăng nhập đã hết hạn. Vui lòng thử lại." |
| `OAUTH_PROVIDER_DISABLED` | 404 | Provider tắt **hoặc** ❌ không có trong danh sách đóng — ❌ không phân biệt hai ca | "Cách đăng nhập này hiện không khả dụng." |
| `OAUTH_PROVIDER_ERROR` | 502 | Provider 5xx / timeout / trả lỗi ngoài `access_denied` | "Không kết nối được với {provider}. Bạn có thể đăng nhập bằng email và mật khẩu." |

### 7.3 Quota và thanh toán

| Mã | HTTP | Khi nào |
|---|:--:|---|
| `QUOTA_EXCEEDED` | 402 | Hết hạn mức, `details.resets_at` |
| `CHILD_LIMIT_EXCEEDED` | 402 | Vượt `child_profiles` quota |
| `DAILY_PLAY_CAP_REACHED` | 402 | Hết phút chơi trong ngày |
| `PACKAGE_NOT_FOUND` | 404 | `package_code` không có trong catalog |
| `UNKNOWN_ENTITLEMENT_KEY` | 500 | Entitlement key không có trong registry — lỗi lập trình, không phải lỗi người dùng (`entitlement-model.md`) |
| `PACKAGE_NOT_SELLABLE` | 400 | Gói `is_public = false` hoặc `retired` |
| `OFFER_NOT_FOUND` | 400 | `offer_code` không thuộc gói |
| `ORDER_ALREADY_PENDING` | 409 | Đã có đơn chưa xử lý cho gói đó |
| `ORDER_ALREADY_PROCESSED` | 409 | Approve/reject đơn đã terminal |
| `ADMIN_NOTE_REQUIRED` | 422 | Duyệt/từ chối không ghi chú |
| `PAYMENT_PROOF_REQUIRED` | 422 | Thiếu chứng từ |

### 7.4 Nội dung

| Mã | HTTP | Khi nào |
|---|:--:|---|
| `INVALID_STATUS_TRANSITION` | 409 | Ngoài bảng chuyển trạng thái |
| `PUBLISH_CHECKLIST_FAILED` | 422 | Thiếu ràng buộc publish, `details.missing[]` |
| `CONTENT_IMMUTABLE` | 409 | Sửa hàng đã `published` |
| `CONTENT_IN_USE` | 409 | Xoá nội dung đang được dùng, `details.used_by[]` |
| `VERSION_CONFLICT` | 409 | `expected_version` lệch |
| `VERSION_ALREADY_DRAFTED` | 409 | Đã có bản draft chưa publish |
| `VERSION_NOT_FOUND` | 404 | Version content được yêu cầu không tồn tại (`content-versioning.md`) |
| `CANNOT_ROLLBACK_TO_CURRENT` | 409 | Rollback nhắm đúng version hiện tại (`content-versioning.md`) |
| `CONTENT_PACK_INVALID` | 422 | Không parse được bằng `content_contract`, `details.issues[]` |
| `CODE_IMMUTABLE` | 409 | Đổi mã đã publish |
| `INVALID_CODE_FORMAT` | 400 | Sai regex |
| `CODE_ALREADY_EXISTS` | 409 | Trùng mã |
| `CODE_ALLOCATION_FAILED` | 500 | Cấp mã ID mới thất bại sau 3 lần retry do trùng (`id-conventions.md`) |

### 7.5 Chơi

| Mã | HTTP | Khi nào |
|---|:--:|---|
| `SESSION_NOT_FOUND` | 404 | |
| `SESSION_ALREADY_COMPLETED` | 409 | Complete lần hai |
| `ALREADY_ENROLLED` | 409 | Trẻ đã đăng ký curriculum này (`curriculum-player.md`) |
| `SESSION_EXPIRED` | 410 | Phiên bỏ dở quá lâu |
| `EVENT_OUT_OF_ORDER` | 409 | `seq` lùi — client lỗi |
| `EVENT_DUPLICATE` | 200 | Trùng `(session, seq)` — **idempotent, trả 200** |
| `TEMPLATE_NOT_SUPPORTED` | 422 | Client yêu cầu template không có |

### 7.6 Dữ liệu trẻ và tài khoản

| Mã | HTTP | Khi nào |
|---|:--:|---|
| `CHILD_FIELD_NOT_ALLOWED` | 400 | Field ngoài danh sách đóng |
| `CHILD_AGE_OUT_OF_RANGE` | 422 | `birth_year` ngoài `[3,6]` tuổi |
| `AVATAR_NOT_IN_PRESET` | 400 | `avatar_id` không thuộc preset |
| `EXPORT_RATE_LIMITED` | 429 | Quá 1 lần / 24h |
| `EMAIL_ALREADY_REGISTERED` | 409 | **Chỉ ở luồng đăng ký** — xem `BR-ERR-02` |
| `INVALID_CREDENTIALS` | 401 | Sai email **hoặc** sai mật khẩu — **không phân biệt** |

### 7.7 Chung

| Mã | HTTP | Khi nào |
|---|:--:|---|
| `VALIDATION_FAILED` | 422 | Zod fail, `details.fields[]` |
| `RATE_LIMITED` | 429 | `details.retry_after_s` |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | MIME không cho phép |
| `PAYLOAD_TOO_LARGE` | 413 | |
| `SERVICE_UNAVAILABLE` | 503 | DB / Valkey / queue không tới được |
| `INTERNAL_ERROR` | 500 | Không phân loại được. **Luôn kèm log mức ERROR** |

## 8. API contract

Middleware lỗi là nơi duy nhất dựng body. Handler chỉ ném mã.

```ts
throw appError("TIER_LOCKED", { access_tier: "premium", required_entitlement: "play_premium_games" });
```

`appError` tra registry để lấy HTTP status và `message` mặc định. Mã không có trong registry
→ throw ở **dev**, log + `INTERNAL_ERROR` ở **prod**.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ERR-02 — đăng nhập sai không tiết lộ email có tồn tại
  Given email a@example.com đã đăng ký và b@example.com chưa
  When đăng nhập sai mật khẩu với a@example.com
  And đăng nhập với b@example.com
  Then cả hai trả cùng mã INVALID_CREDENTIALS
  And cùng thông báo
  And thời gian phản hồi không lệch quá 50ms

Scenario: BR-ERR-02 — quên mật khẩu luôn 200
  When gọi forgot-password với một email chưa đăng ký
  Then hệ thống trả 200
  And thông báo giống hệt trường hợp email đã đăng ký

Scenario: BR-ERR-03 — body lỗi không lộ nội bộ
  Given một lỗi vi phạm unique constraint xảy ra
  When đọc body response
  Then body không chứa tên bảng, tên constraint, hay stack trace

Scenario: BR-ERR-05 — record người khác trả NOT_FOUND
  Given child profile X thuộc user B
  When user A gọi GET /api/users/children/X
  Then code là NOT_FOUND
  And HTTP status là 404

Scenario: BR-ERR-07 — hết quota là 402, thiếu quyền là 403
  Given user standard hết quota child_profiles
  When user tạo thêm profile
  Then HTTP status là 402 và code là CHILD_LIMIT_EXCEEDED
  When user standard gọi nội dung premium
  Then HTTP status là 403 và code là TIER_LOCKED

Scenario: BR-ERR-01 — mọi mã dùng trong code đều có trong registry
  When quét mọi lời gọi appError trong apps và packages
  Then mọi mã đều xuất hiện trong error-codes.md

Scenario: BR-ERR-08 — lỗi đăng nhập không lộ cách đăng ký
  Given a@example.com đăng ký bằng Google, b@example.com đăng ký bằng mật khẩu
  When đăng nhập sai mật khẩu với cả hai
  Then cả hai trả INVALID_CREDENTIALS
  And không body nào chứa tên provider

Scenario: SOCIAL_EMAIL_CONFLICT là ngoại lệ có kiểm soát
  Given a@example.com đã đăng ký bằng mật khẩu
  When một người hoàn tất OAuth Google với chính email đó
  Then trả 409 SOCIAL_EMAIL_CONFLICT
  And không endpoint nào cho biết điều đó mà không cần vượt OAuth trước

Scenario: REAUTH_REQUIRED nói được làm gì tiếp
  Given user có password_hash NULL và đã liên kết Google
  When gọi một thao tác nhạy cảm chưa reauth
  Then trả 428 REAUTH_REQUIRED
  And details.methods chứa social và không chứa password
```

## 10. Boundaries

**Always**
- Đăng ký mã ở §7 trước khi dùng.
- Trả 404 cho record của người khác.
- Log đầy đủ ngữ cảnh ở server, trả tối thiểu cho client.
- Thông báo tiếng Việt nói rõ làm gì tiếp.

**Ask first**
- Thêm mã lỗi mới.
- Đổi HTTP status của một mã đã dùng.
- Đổi thông báo của mã liên quan tới thanh toán hoặc pháp lý.

**Never**
- Mã không đăng ký.
- Stack trace / tên bảng / id nội bộ trong body.
- Thông báo tiết lộ tài khoản có tồn tại.
- Thông báo tiết lộ tài khoản đăng nhập bằng cách nào.
- Client bắt lỗi theo chuỗi thông báo.
- 403 cho record không thuộc caller.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có cần i18n cho `message` không, hay tiếng Việt là đủ ở MVP? | Mở thị trường |
| 2 | `EVENT_DUPLICATE` trả 200 — client có cần biết là trùng không, hay im lặng là đủ? | `play-event-ingestion` |
