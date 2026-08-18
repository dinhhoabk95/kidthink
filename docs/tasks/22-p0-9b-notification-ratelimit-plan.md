# Kế hoạch — Task #22: P0.9b — Email và guard tần suất

> Viết 2026-08-09, đo tại commit `5a1bb2b`. Bước sở hữu: **P0.9b** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`notification-service.md`](../specs/01-platform/notification-service.md) ·
> [`rate-limiting.md`](../specs/01-platform/rate-limiting.md).
> Quyết định cạnh đảo phase áp vào đây: **`D-BU`**.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Bước này tồn tại vì **P0.10 (auth end-to-end) không chạy được nếu thiếu nó**. Đăng ký cần gửi
email xác thực; quên mật khẩu cần gửi link đặt lại; và cả hai là hai route bị brute-force
nhiều nhất trong bất kỳ sản phẩm nào. Vá guard sau khi mở route là vá sau khi đã mở cửa.

Hai việc:

1. **`email:send` trên khung queue tối thiểu** mà P0.8b đã dựng (`D-BU`). Không chờ
   [`job-queue.md`](../specs/01-platform/job-queue.md) đầy đủ ở P1.5.
2. **Rate limit hai trục** — IP và account — với token bucket trên Valkey.

Một lệch enum đủ để làm hỏng cơ chế opt-out: `notification_status` không có giá trị
`suppressed`.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `JOB-QUEUE` (P1.5) | chưa | `D-BU` — dùng khung tối thiểu của P0.8b |
| `CHILD-DATA-COMPLIANCE` | P0.4 | `BR-NOT-03` cấm PII trẻ trong email |
| `ERROR-CODES` | registry, tra ở mọi bước | |
| `AUTH-TOKENS-SESSIONS` | P0.3 | rate limit đọc `user_id`/`manager_id` từ context |
| `packages/cache` | P0.8b T1 | token bucket cần client Valkey |
| `packages/queue` · `apps/worker` | P0.8b T2/T3 | `email:send` chạy trên khung đó |

P0.9b **phụ thuộc thật** vào P0.8b và P0.3 — khác với P0.4/P0.5/P0.6, ở đây không tách được
khối chạy sớm có ý nghĩa. Thứ tự này là thứ tự roadmap, và nó đúng.

## 1. Đo được

### 1.1 `notification_status` không có chỗ ghi opt-out

[`ops.ts`](../../packages/db/src/schema/ops.ts) khai `["queued", "dispatched", "failed"]`.

§7.2 khai `pending | sent | failed | suppressed`. Ba giá trị đầu là lệch tên; giá trị thứ tư
**không tồn tại**.

`suppressed` là toàn bộ cơ chế opt-out: §5 nói *"User đã opt-out loại đó → ghi `notifications`
với `suppressed_reason`, không gửi"*, và acceptance §9 kiểm đúng điều đó
(*"notification có status suppressed và không email nào được gửi"*).

Không có giá trị đó thì lựa chọn duy nhất là **không ghi hàng nào** — và mất luôn bằng chứng
rằng hệ thống đã tôn trọng lựa chọn của người dùng. Đó là bằng chứng cần khi có khiếu nại.

### 1.2 `notifications` thiếu ba cột

| §7.2 đòi | Trong [`ops.ts`](../../packages/db/src/schema/ops.ts) |
|---|---|
| `uuid` | thiếu |
| `suppressed_reason` | thiếu |
| `provider_message_id` | thiếu — không truy được email nào ứng với hàng nào ở phía provider |
| `code` | có, tên `template_code` — lệch tên, ngữ nghĩa khớp |

Enum `notification_channel` có `["email", "in_app"]`. Spec nói MVP **một kênh: email**, in-app
là P4. Giá trị khai trước không sai (cùng dạng với `billing_period.monthly` ở P0.5) nhưng phải
có cổng chặn dùng nó ở MVP, không chỉ chặn bằng lời.

### 1.3 11 loại thông báo chưa tồn tại trong code

§7.1 liệt kê đúng 11 `code` với phân loại giao dịch / định kỳ / vận hành. Không có hằng số nào
trong repo khai chúng. Phân loại này quyết định `BR-NOT-01` (giao dịch **không** opt-out được),
nên nó phải là dữ liệu, không phải quy ước.

### 1.4 Rate limit chưa có gì

Không middleware, không token bucket. `packages/cache` là stub tới khi P0.8b chạy.
Bảng §7 có **12 route class** với hạn mức hai trục.

## 2. Quyết định

**D-EJ — Thêm `suppressed` vào enum và ba cột thiếu, đổi tên `template_code` thì không.**
`suppressed` là ngữ nghĩa thiếu; `template_code` vs `code` là chữ. Sửa cái nào thay đổi hành vi.

**D-EK — Provider email là port, adapter thật ở P2.** §11 Q1 (provider nào, domain SPF/DKIM)
chặn deploy P2. P0.9b giao interface `sendEmail()` + adapter ghi ra thư mục local để test đọc
được nội dung thật. Không chọn provider ở đây.

**D-EL — 11 loại thông báo khai thành registry có kiểu.** Giống `EntitlementKey` ở P0.5: union
đóng, kèm cờ `optOutAllowed`. `BR-NOT-01` được ép ở tầng kiểu, không ở tầng review.

**D-EM — Bảng hạn mức §7 khai một chỗ, middleware đọc từ đó.** 12 route class × 2 trục = 24
con số. Rải chúng vào từng route là bảo đảm chúng sẽ lệch khỏi spec.

**D-EN — Fail closed là mặc định của route nhạy cảm, không phải cấu hình.** `BR-RTL-02` nói
Valkey mất thì auth và thanh toán **fail closed**. Viết thành cờ cấu hình là để ngỏ khả năng ai
đó tắt nó lúc sự cố. Phân loại route quyết định hành vi, và ca âm kiểm đúng điều đó.

## 3. Đồ thị

```
T1 migration notifications: + suppressed, + uuid, + suppressed_reason, + provider_message_id
      └──→ T2 registry 11 loại + cờ optOutAllowed
                └──→ T3 port sendEmail() + adapter local
                          └──→ T4 job email:send (jobId = notification_id)
                                    └──→ T5 cổng nội dung email: không PII trẻ, không pixel, có link huỷ

T6 bảng hạn mức 12 route class (một nguồn)
      └──→ T7 token bucket trên packages/cache
                └──→ T8 middleware hai trục + nguồn IP tin cậy
                          └──→ T9 khoá đăng nhập tăng dần
                                    └──→ T10 fail closed cho auth và thanh toán
                              ── Cổng dừng ──
  T11 evidence và promote
```

## 4. Task

### Task 1 — Migration `notifications`

**Tiêu chí nghiệm thu**
- [ ] Ca âm trước: test ghi một notification `suppressed` — **đỏ** trên enum hiện tại.
- [ ] Enum thêm `suppressed`; ba giá trị cũ giữ nguyên tên (D-EJ).
- [ ] Thêm `uuid` · `suppressed_reason` · `provider_message_id`.
- [ ] Cổng: `channel = 'in_app'` bị từ chối ở MVP, ca âm chứng minh cổng đỏ khi dùng.

**Kiểm chứng**
- [ ] `pnpm db:migrate` từ database rỗng · `pnpm --filter @mindkid/db test -- ops` xanh.

**Phụ thuộc:** không · **Cỡ:** S

### Task 2 — Registry 11 loại thông báo

**Tiêu chí nghiệm thu**
- [ ] 11 `code` §7.1 khai `as const` kèm `kind` (`transactional | periodic | ops`) và `optOutAllowed` (D-EL).
- [ ] `BR-NOT-01`: loại giao dịch có `optOutAllowed: false`; ca âm — `PUT notification-preferences` với `order_approved = false` trả **422** và loại đó **không** nằm trong schema cho phép.
- [ ] Code lạ là lỗi biên dịch.
- [ ] `BR-NOT-06`: không loại nào mang nghĩa tiếp thị; cổng chặn thêm loại tiếp thị.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test -- notifications` xanh, assertion tham chiếu `BR-NOT-01`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Port `sendEmail()`

**Tiêu chí nghiệm thu**
- [ ] Interface nhận `{ to, code, payload }`, trả `provider_message_id`.
- [ ] Adapter P0 ghi ra thư mục local, đọc được nội dung thật để test (D-EK).
- [ ] `BR-NOT-02`: kiểu của `to` **không** nhận được child profile; ca âm là lỗi biên dịch, không phải kiểm lúc chạy.
- [ ] Tài khoản `deleted` → không gửi gì.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/notification test` xanh, assertion tham chiếu `BR-NOT-02`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Job `email:send`

**Tiêu chí nghiệm thu**
- [ ] Chạy trên khung `packages/queue` + `apps/worker` của P0.8b, **không** dựng khung mới (`D-BU`).
- [ ] `jobId = notification_id` (`BR-NOT-05`); ca âm — chạy lại job không gửi email thứ hai.
- [ ] `BR-NOT-04`: INSERT `notifications` trong **cùng transaction** với sự kiện nghiệp vụ; ca âm — transaction rollback thì không có hàng notification mồ côi.
- [ ] Retry 5 lần backoff; hết retry → `failed` + `alert()` (port của P0.8b T6).
- [ ] Opt-out → ghi `suppressed` + `suppressed_reason`, **không** gửi.
- [ ] Bounce cứng → đánh dấu địa chỉ, dừng loại định kỳ, **giữ** loại giao dịch.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/worker test -- email` xanh, assertion tham chiếu `BR-NOT-04` `BR-NOT-05`.

**Phụ thuộc:** T3 · P0.8b · **Cỡ:** M

### Task 5 — Cổng nội dung email

**Tiêu chí nghiệm thu**
- [ ] `BR-NOT-03`: cổng quét template — không field nào của trẻ ngoài `display_name` được nội suy vào email. Ca âm: template chèn `birth_year` làm cổng **đỏ**.
- [ ] `BR-NOT-08`: cổng quét — không ảnh 1×1, không URL theo dõi mở. Ca âm là một template có pixel.
- [ ] `BR-NOT-07`: mọi template loại **định kỳ** có link huỷ đăng ký; thiếu là lỗi.
- [ ] §7.3: template tiếng Việt, nói rõ làm gì tiếp, không đếm ngược, không so sánh trẻ với trẻ khác — kiểm bằng danh sách cụm từ cấm, có ca âm.
- [ ] Cổng gắn vào `pnpm check`.

**Kiểm chứng**
- [ ] `pnpm check` gọi cổng mới; ca âm chạy trong `pnpm test`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 6 — Bảng hạn mức

**Tiêu chí nghiệm thu**
- [ ] 12 route class §7 khai một chỗ, kèm hạn mức IP, hạn mức account, cửa sổ (D-EM).
- [ ] Test so bảng trong code với bảng trong spec — lệch một ô là đỏ.
- [ ] Mỗi class đánh dấu `failMode: open | closed` — auth và thanh toán là `closed` (D-EN).
- [ ] Route không suy ra được `route_class` là **lỗi**, không phải mặc định không giới hạn.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test -- rate-limit` xanh, assertion tham chiếu `BR-RTL-01`.

**Phụ thuộc:** không · **Cỡ:** M

### Task 7 — Token bucket

**Tiêu chí nghiệm thu**
- [ ] Cài trên `packages/cache`; đếm nguyên tử, không read-modify-write.
- [ ] Test đồng thời: 100 request song song vượt hạn mức 10 thì đúng 10 lọt.
- [ ] Cửa sổ trượt đúng theo cấu hình từng class.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/cache test -- bucket` xanh.

**Phụ thuộc:** T6 · P0.8b T1 · **Cỡ:** M

### Task 8 — Middleware hai trục

**Tiêu chí nghiệm thu**
- [ ] Kiểm **cả** trục IP và trục account cho route nhạy cảm (`BR-RTL-01`).
- [ ] Ca âm §9: 50 lần sai từ một IP cho 50 email → IP bị giới hạn; 10 lần sai một email từ 10 IP → account bị khoá tạm.
- [ ] `BR-RTL-04`: IP lấy từ **nguồn tin cậy đã cấu hình**; ca âm — `X-Forwarded-For` giả không đổi được kết quả.
- [ ] `BR-RTL-03`: 429 kèm header `Retry-After` và body đúng §8.
- [ ] `BR-RTL-07`: thông báo 429 **không** tiết lộ tài khoản tồn tại; ca âm so hai thông báo cho email đã đăng ký và chưa đăng ký — phải giống hệt.
- [ ] Guest dùng trục `tm_did`; Manager có hạn mức riêng.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/web test -- rate-limit` xanh, assertion tham chiếu `BR-RTL-01` `BR-RTL-03` `BR-RTL-04` `BR-RTL-07`.

**Phụ thuộc:** T7 · P0.3 đóng · **Cỡ:** M

### Task 9 — Khoá đăng nhập tăng dần

**Tiêu chí nghiệm thu**
- [ ] 5 lần → 1 phút · 10 → 5 phút · 15 → 30 phút · reset sau 24 giờ không sai (§7).
- [ ] `BR-RTL-05`: **không** khoá vĩnh viễn; ca âm — chờ hết cửa sổ thì đăng nhập đúng thành công.
- [ ] Ngưỡng khai trong bảng Task 6, không rải trong code.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/web test -- lockout` xanh, assertion tham chiếu `BR-RTL-05`.

**Phụ thuộc:** T8 · **Cỡ:** S

### Task 10 — Fail closed

**Tiêu chí nghiệm thu**
- [ ] Valkey mất → auth và thanh toán trả **503**, không xử lý (`BR-RTL-02`).
- [ ] Route thường fail open, vẫn phục vụ.
- [ ] Ca âm: tắt Valkey, gọi `POST login` → 503 và **không** có lần thử mật khẩu nào chạm DB.
- [ ] `BR-RTL-06`: `play:events` có hạn mức riêng rộng hơn; ca âm — phiên chơi 30 phút gửi event đều không bị 429.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/web test -- rate-limit-failmode` xanh, assertion tham chiếu `BR-RTL-02` `BR-RTL-06`.

**Phụ thuộc:** T8 · **Cỡ:** M

### Cổng dừng

- [ ] Email gửi được end-to-end qua adapter local, đọc được nội dung.
- [ ] Chạy lại job không gửi hai lần.
- [ ] Opt-out ghi `suppressed`, có bằng chứng trong DB.
- [ ] Hai trục rate limit cùng hoạt động; fail closed đúng chỗ.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] Human review diff — chạm auth và dữ liệu trẻ, không auto-merge.

### Task 11 — Evidence và promote

- [ ] Mỗi `BR-NOT-*` `BR-RTL-*` có ít nhất một test tham chiếu mã rule.
- [ ] §11 Q1 của [`notification-service.md`](../specs/01-platform/notification-service.md) (provider, SPF/DKIM) ghi là **chặn deploy P2**, không chặn P0.
- [ ] §11 Q1 của [`rate-limiting.md`](../specs/01-platform/rate-limiting.md) (CAPTCHA) ghi là chặn P1 — và ghi rõ CAPTCHA bên thứ ba đụng `BR-CDC-08`.
- [ ] Hai spec sang `implemented` chỉ khi đủ evidence; tick P0.9b khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Không có `suppressed` nên "không ghi gì" | Mất bằng chứng đã tôn trọng opt-out, đúng lúc có khiếu nại | D-EJ — thêm giá trị enum, ca âm là chính hàng `suppressed` |
| Dựng khung queue mới cho email | Hai khung song song, `D-BU` mất tác dụng | T4 bắt chạy trên khung P0.8b, không tạo mới |
| Chọn provider email ở P0 | Quyết định P2 bị chốt sớm bởi một dòng code | D-EK — port + adapter local |
| Hạn mức rải trong từng route | 24 con số lệch dần khỏi spec | D-EM — một nguồn, test so với spec |
| Fail closed thành cờ cấu hình | Ai đó tắt nó lúc sự cố, đúng lúc cần nhất | D-EN — phân loại route quyết định, có ca âm |
| Email chứa PII trẻ | Vi phạm `BR-CDC-06`/`BR-NOT-03`, dữ liệu rời hạ tầng | T5 — cổng quét template kèm ca âm |
| Rate limit chặn nhầm trẻ đang chơi | Trẻ bị 429 giữa lúc chơi | `BR-RTL-06` có ca âm phiên 30 phút |

## 6. Giả định

1. **P0.8b đã xong.** `packages/cache` `packages/queue` `apps/worker` có nội dung. Nếu chưa, P0.9b không bắt đầu được — đây là phụ thuộc thật, không tách khối được.
2. **P0.3 đã đóng.** Middleware rate limit đọc `user_id`/`manager_id` từ context của `ACTORS`.
3. **`packages/notification` là package mới hợp lệ.** [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) §7 liệt kê nó sẵn; cả `apps/web` và `apps/worker` đều dùng.
4. **Không giao UI cài đặt thông báo.** `/me/settings/notifications` thuộc P1.14 ([`account-settings.md`](../specs/03-account/account-settings.md)); P0.9b giao route API và contract.

## 7. Ngoài phạm vi

- Danh mục job đầy đủ, retry policy, alerting backlog — [`job-queue.md`](../specs/01-platform/job-queue.md), P1.5.
- Provider email thật và domain SPF/DKIM — §11 Q1, chặn deploy P2.
- CAPTCHA đăng ký — §11 Q1 của [`rate-limiting.md`](../specs/01-platform/rate-limiting.md), chặn P1.
- Kênh push và in-app — P4.
- Màn hình cài đặt thông báo — P1.14.
