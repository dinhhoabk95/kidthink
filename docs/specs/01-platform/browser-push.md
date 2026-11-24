---
spec: BROWSER-PUSH
title: Thông báo trình duyệt qua FCM Web
area: platform
status: approved
mvp: false
phase: P5
reviewed: 2026-10-18
open_tasks:
  - "#311"
owns:
  - Đăng ký và xoay endpoint thông báo trình duyệt
  - FCM Web delivery adapter
  - Permission prompt và service-worker push lifecycle
depends_on:
  - NOTIFICATION-SERVICE
  - NOTIFICATION-INBOX
  - AUTH-TOKENS-SESSIONS
---

# Thông báo trình duyệt qua FCM Web

> **Chưa hoàn thành** — phía **gửi** (§4.1: FCM HTTP v1 + job `push:send`) đã có theo spec này. Phía **client** chưa có: route `/api/users/notification-endpoints` chưa được dựng, trang `/me/settings/notifications` chưa lấy token từ Firebase Messaging và package `firebase` của web chưa được import ở đâu. Producer chưa enqueue `push:send` cho loại thông báo nào vì Open question 2 chưa chốt. Việc còn lại: [Task #311](../../tasks/311-addon-provider-gaps-plan.md).

## 1. Objective

User có thể chủ động bật thông báo trình duyệt để nhận tín hiệu kịp thời khi không mở MindKid.
Kênh dùng **Firebase Cloud Messaging cho Web (FCM Web)** và được xử lý sau các package core ở
Task #83. Đây là delivery best-effort; User luôn xem lại logical notification trong inbox do
[`../03-account/notification-inbox.md`](../03-account/notification-inbox.md) sở hữu.

FCM không phải điều kiện để email hoạt động, không phải tracking channel và không mở bề mặt cho
Child profile.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| User | phiên User hợp lệ, thao tác trên bề mặt người lớn | Bật/tắt permission và đăng ký thiết bị hiện tại |
| Browser service worker | endpoint đã đăng ký | Hiện notification và mở internal action URL |
| Worker | job `push:send` | Gửi qua FCM HTTP v1 (`fetch` + WebCrypto), cập nhật delivery và endpoint |
| Trẻ | — | Cấm thấy permission prompt hay nhận notification |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `/me/settings/notifications` | User | Nút bật/tắt có chủ ý; không prompt tự động |
| `POST /api/users/notification-endpoints` | User | Đăng ký/rotate token của browser hiện tại |
| `DELETE /api/users/notification-endpoints/{uuid}` | User | Thu hồi endpoint thuộc chính User |
| `apps/web/public/firebase-messaging-sw.js` hoặc service worker build tương đương | Browser | Background message + click handler |
| `packages/notification` | Worker | `fcm_web` channel driver gọi FCM HTTP v1 qua `fetch` |

## 4. Main flow

1. User bấm “Bật thông báo trên trình duyệt này” ở `/me/settings/notifications`.
2. Client mới gọi browser permission API. Nếu được cấp, FCM Web SDK lấy registration token với
   VAPID public key và gửi token + `client_installation_id` first-party lên server.
3. Server encrypt token, lưu fingerprint HMAC để dedup và gắn endpoint với User hiện tại.
4. Khi logical notification có delivery `fcm_web`, worker gửi payload tối thiểu qua
   FCM HTTP v1 rồi cập nhật `notification_deliveries`.
5. Service worker hiện notification. Click chỉ mở `action_url` nội bộ allow-list; inbox vẫn giữ
   bản xem lại nếu push bị OS hoặc browser bỏ.
6. Token rotate thì cùng installation thay token trong transaction; FCM trả invalid/unregistered
   thì endpoint bị vô hiệu, không retry vô hạn.

### 4.1 Đường gửi FCM HTTP v1 (worker)

1. Producer enqueue job `push:send` với payload `{ notificationId, userId, title, body, actionUrl }`
   (`jobId` = `notification_id`). Job này không mang token.
2. Consumer (workerd và Node dev chạy cùng mã) đọc cấu hình service account từ env
   (§7.1). Thiếu cấu hình → kênh tắt (`BR-BPS-11`).
3. Consumer nạp các endpoint `active` của `userId`, giải mã token tại chỗ rồi gọi
   `POST https://fcm.googleapis.com/v1/projects/{FCM_PROJECT_ID}/messages:send` bằng `fetch` với
   `Authorization: Bearer <access token>`.
4. Access token OAuth2 lấy bằng JWT service account ký **RS256** qua WebCrypto
   (`crypto.subtle.importKey("pkcs8", …)` + `sign("RSASSA-PKCS1-v1_5")`), đổi tại
   `https://oauth2.googleapis.com/token` với scope `https://www.googleapis.com/auth/firebase.messaging`;
   cache trong bộ nhớ tiến trình đến **60 giây trước hạn** (`BR-BPS-10`).
5. Kết quả từng endpoint phân loại theo bảng `BR-BPS-12`; kết quả gộp ghi vào
   `notification_deliveries` kênh `fcm_web`.

### 4.2 Phân loại lỗi FCM

| FCM trả | Phân loại | Hành vi |
|---|---|---|
| 2xx | `dispatched` | Ghi `provider_message_id` (trường `name`) |
| 404 `UNREGISTERED` | terminal, token chết | Endpoint → `invalid`, không retry |
| 400 `INVALID_ARGUMENT` | terminal, token sai | Endpoint → `invalid`, không retry |
| 429, 5xx, 401 (token OAuth hết hạn), lỗi mạng | retryable | Xoá cache access token, ném lỗi để queue retry theo chính sách job |
| 4xx khác (403, 400 khác mã…) | non-retryable | Ghi lỗi (không kèm token/khoá), không retry, không vô hiệu endpoint |

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Browser không hỗ trợ | Không có service worker/Push API | Giấu nút bật, email + inbox vẫn hoạt động |
| Permission `denied` | User từ chối | Không hỏi lại tự động; chỉ hiện hướng dẫn khi User tự mở settings |
| Permission `default` | User chưa quyết | Không prompt lúc landing, đăng ký, login hay `/play` |
| Token invalid/unregistered | FCM trả lỗi terminal | Vô hiệu endpoint, mark delivery failed terminal, không xoá logical notification |
| User logout/xoá endpoint | Thiết bị dùng chung | Thu hồi endpoint server-side và xoá token local |
| Push tới khi offline | Browser/OS giữ hoặc bỏ | Không giả định delivery; inbox là nguồn sự thật |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-BPS-01` | Provider browser push là **FCM Web**; server gọi FCM HTTP v1 (`fetch`, không dùng SDK `firebase-admin`), client dùng Firebase Web SDK | Một provider đã chốt tránh hai lifecycle token/service worker cạnh tranh |
| `BR-BPS-02` | Permission chỉ được yêu cầu sau thao tác rõ ràng trên bề mặt người lớn; Cấm — **NEVER** auto-prompt | Browser prompt sớm làm User từ chối vĩnh viễn và gây gián đoạn |
| `BR-BPS-03` | Cấm — **NEVER** đăng ký endpoint cho Child profile hoặc hiện prompt trong `/play` | Trẻ không phải actor có credential/permission hệ thống |
| `BR-BPS-04` | FCM registration token phải mã hoá at-rest, không log/analytics/response sau đăng ký; key dedup là HMAC fingerprint | Token cho phép nhắm tới một browser cụ thể và không được trở thành identifier vận hành công khai |
| `BR-BPS-05` | Payload FCM không chứa tên, UUID, tuổi, tiến độ hay PII khác của trẻ; chỉ chứa notification id, copy chung và internal action path | FCM là hạ tầng bên thứ ba; dữ liệu trẻ không rời hạ tầng |
| `BR-BPS-06` | Push là best-effort; trạng thái `dispatched` chỉ nghĩa FCM đã nhận request, không nghĩa User đã đọc | FCM/browser/OS không cung cấp exactly-once hay read receipt đáng tin cậy |
| `BR-BPS-07` | Click target phải là path nội bộ trong allow-list; Cấm URL do payload/provider tự quyết | Chặn open redirect và phishing qua notification |
| `BR-BPS-08` | Token rotate theo installation, invalid token bị terminalize; Cấm retry vô hạn endpoint chết | Token FCM thay đổi và endpoint chết là lifecycle bình thường |
| `BR-BPS-09` | Firebase client/service-worker code được bundle/self-host theo CSP; Cấm remote script động | Remote script làm yếu CSP và thay đổi code ngoài review |
| `BR-BPS-10` | Access token OAuth2 của FCM sinh bằng JWT service account ký RS256 qua **WebCrypto** (`crypto.subtle`, PKCS8), gọi bằng `fetch`; cache trong bộ nhớ đến 60 giây trước hạn; Cấm — **NEVER** dùng `firebase-admin` hay API chỉ có ở Node | `firebase-admin` không chạy trên workerd; một mã duy nhất phải chạy ở cả Cloudflare và dev |
| `BR-BPS-11` | Cấu hình service account (`FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`) là **tuỳ chọn**: thiếu bất kỳ biến nào thì kênh push tắt — consumer ghi delivery `suppressed` (`FCM_NOT_CONFIGURED`), log tên biến thiếu, **không** ném lỗi, không retry; email và inbox không bị ảnh hưởng. Khác email (`BR-NOT-10`, fail-closed ở production) vì push là best-effort (`BR-NOT-13`) | Push chưa cấu hình không được chặn queue hay làm hỏng kênh giao dịch |
| `BR-BPS-12` | Phân loại lỗi theo §4.2: 404 `UNREGISTERED` và 400 `INVALID_ARGUMENT` → vô hiệu endpoint (`invalid`); 429/5xx/401/lỗi mạng → ném lỗi để retry; 4xx khác → non-retryable, ghi log. Nhiều endpoint: có ít nhất một endpoint `dispatched` thì job coi là thành công (best-effort, `BR-BPS-06`), không retry để khỏi gửi trùng; không endpoint nào thành công mà có lỗi retryable thì job ném lỗi | Retry vô hạn endpoint chết là lỗi vận hành; retry cả job khi một endpoint đã nhận làm trùng push |
| `BR-BPS-13` | Cấm — **NEVER** log hoặc đưa vào `last_error`/alert: token thiết bị, access token, JWT, `FCM_PRIVATE_KEY`; thông báo lỗi chỉ gồm HTTP status và mã lỗi FCM | Token cho phép nhắm một browser cụ thể; khoá riêng cho phép giả mạo server |

## 7. Data

**Đọc:** `notifications`, `notification_deliveries`, `notification_endpoints`, cấu hình public Firebase/VAPID, env service account (§7.1).
**Ghi:** `notification_endpoints` (đổi `status` sang `invalid` + `invalidated_at`), delivery state kênh `fcm_web`.

### 7.1 Biến môi trường phía gửi

| Biến | Worker | Loại | Ghi chú |
|---|---|---|---|
| `FCM_PROJECT_ID` | `worker` | tuỳ chọn, không bí mật | ID project Firebase, nằm trong URL `messages:send` |
| `FCM_CLIENT_EMAIL` | `worker` | tuỳ chọn, **secret** | `client_email` của service account |
| `FCM_PRIVATE_KEY` | `worker` | tuỳ chọn, **secret** | `private_key` PEM PKCS8; chấp nhận `\n` literal thay cho xuống dòng |
| `NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY` | `web` + `worker` | bắt buộc | Worker cần để giải mã token; cùng giá trị với web |

Cả ba `FCM_*` đặt bằng `wrangler secret put` (`BR-ENV-18`), kể cả `FCM_PROJECT_ID`: giữ chung một
nhóm với khoá để cấu hình service account đổi cùng lúc, và `secret: true` ngăn nó rơi vào `vars`.

Schema cột canonical của `notification_endpoints` nằm ở
[`schema-identity-billing.md`](schema-identity-billing.md) §7.10d. File này chỉ sở hữu semantics:
token mã hoá + HMAC fingerprint, một installation active theo User, rotate/revoke/terminalize và
không có IP history, browser fingerprint, vị trí hay FCM read receipt.

## 8. API contract

### `POST /api/users/notification-endpoints`

| | |
|---|---|
| Auth | `requireUserAuth()` + CSRF |
| Body | `{ provider: "fcm_web", client_installation_id: uuid, token: string }` |
| 200 | `{ uuid, provider, status: "active" }` — không echo token |
| 422/429 | Mã validation/rate-limit đã đăng ký |

### `DELETE /api/users/notification-endpoints/{uuid}`

| | |
|---|---|
| Auth | `requireUserAuth()` + CSRF + ownership |
| 204 | Endpoint revoked; idempotent với endpoint đã revoked |
| 404 | Không tồn tại hoặc thuộc User khác |

## 9. Acceptance criteria

```gherkin
Scenario: BR-BPS-02 — không auto-prompt
  Given User chưa từng quyết định permission
  When mở landing, login, /me hoặc /play
  Then browser permission API không được gọi

Scenario: BR-BPS-03 — trẻ không thấy prompt
  Given đang ở child play surface
  When service worker và Push API đều sẵn sàng
  Then không có control bật notification

Scenario: BR-BPS-04 — token không lộ
  Given đăng ký FCM token thành công
  When đọc response, log, metric và hàng DB
  Then response/log/metric không chứa token
  And DB chỉ có token mã hoá + HMAC fingerprint

Scenario: BR-BPS-05 — payload không có PII trẻ
  Given notification báo cáo tuần có dữ liệu của một Child profile
  When ghi lại request outbound tới FCM
  Then payload không chứa child uuid, display name, tuổi hay tiến độ

Scenario: BR-BPS-08 — token terminal bị vô hiệu
  Given FCM trả registration-token-not-registered
  When worker xử lý kết quả
  Then endpoint chuyển invalid
  And job không retry endpoint đó

Scenario: BR-BPS-10 — JWT ký RS256 bằng WebCrypto và được cache
  Given service account hợp lệ
  When gửi hai push liên tiếp trong cùng tiến trình
  Then chỉ một lần đổi access token
  And chữ ký JWT xác minh được bằng public key

Scenario: BR-BPS-11 — thiếu cấu hình thì kênh tắt
  Given thiếu FCM_PRIVATE_KEY
  When job push:send chạy
  Then delivery fcm_web là suppressed FCM_NOT_CONFIGURED
  And job không ném lỗi và không có lời gọi fetch

Scenario: BR-BPS-12 — 5xx được retry
  Given FCM trả 503
  When worker xử lý
  Then job ném lỗi để queue retry
  And endpoint vẫn active

Scenario: BR-BPS-13 — không lộ bí mật qua log
  Given FCM trả lỗi cho một token
  When đọc mọi dòng log và last_error
  Then không chứa token thiết bị, access token hay private key

Scenario: BR-BPS-07 — click chỉ mở path nội bộ
  Given payload bị sửa action_url thành https://evil.example
  When User click notification
  Then service worker không mở URL đó
```

## 10. Boundaries

**Always**
- User gesture trước permission prompt.
- Token mã hoá, rotate/revoke được, không log.
- FCM payload tối thiểu và không có dữ liệu trẻ.
- Inbox là nguồn xem lại.

**Ask first**
- Thêm provider ngoài FCM Web.
- Thêm loại notification được gửi push.
- Đổi copy/permission timing hoặc action allow-list.

**Never**
- Push hay prompt tới trẻ.
- Coi FCM accepted là User đã đọc.
- Remote Firebase script ngoài bundle đã review.
- Token/PII trong log hoặc analytics.
- `firebase-admin` hoặc API chỉ có ở Node trên đường gửi.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Browser/device matrix hỗ trợ chính thức và fallback copy cụ thể? | Cổng Task #84 | P5 | Studio UI |
| 2 | Loại nào trong 11 code được bật FCM mặc định? | Delivery policy | P5 | người quyết |
