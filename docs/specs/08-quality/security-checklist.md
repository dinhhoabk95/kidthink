---
spec: SECURITY-CHECKLIST
title: Danh sách kiểm bảo mật
area: quality
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-19
owns:
  - Checklist bảo mật bắt buộc trước merge và trước release
depends_on:
  - AUTH-TOKENS-SESSIONS
  - CHILD-DATA-COMPLIANCE
---

# Danh sách kiểm bảo mật

## 1. Objective

Ba tài sản cần bảo vệ, theo thứ tự: **dữ liệu trẻ em** · **luồng tiền** · **nội dung trả
phí**.

Thứ tự này quyết định mức độ nghiêm ngặt. Rò nội dung trả phí là mất doanh thu; rò dữ liệu
trẻ là không sửa được.

## 2. Actors

Dev · reviewer · cổng tự động.

## 3. Entry points

Checklist trong PR template · `pnpm check` · rà soát trước release.

## 4. Main flow

1. Code chạm auth, payment, gating, hoặc dữ liệu trẻ → **bắt buộc** chạy checklist §7.
2. Reviewer xác nhận từng mục.
3. Vi phạm mức CRITICAL **chặn merge**.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Phát hiện lỗ hổng sau release | Dừng, đánh giá phạm vi, vá, xoay secret liên quan |
| Secret bị lộ | **Xoay ngay**, không chờ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SEC-01` | Vi phạm CRITICAL **chặn merge** | CRITICAL nghĩa là chiếm tài khoản hoặc rò dữ liệu trẻ; để lọt là sự cố không sửa ngược được |
| `BR-SEC-02` | Cấm — **NEVER đọc/ghi `.env`** trong code hay công cụ | `.env` chứa secret; đọc trong code là mời commit nhầm lên repo |
| `BR-SEC-03` | Secret lộ → **xoay ngay** | Secret đã lộ là secret đã mất |
| `BR-SEC-04` | Mọi route `/api/*` **Zod validate** body, query, params | Query param đi vào `ilike`/`gte` là đường vào injection |
| `BR-SEC-05` | Cấm — **NEVER mass assignment** — map từng field | Client gửi thừa field là ghi đè cột không được sửa (status, role) |
| `BR-SEC-06` | Kiểm quyền và ownership ở **server**, không client | Client là của sổ do người dùng kiểm soát; quyền kiểm ở client là quyền không kiểm |
| `BR-SEC-07` | Record của người khác → **404** | `BR-ACT-03` |
| `BR-SEC-08` | Code chạm auth, payment, hoặc dữ liệu trẻ → **bắt buộc review** người thứ hai | Một người viết và merge là một người quyết định; hai mắt thấy lỗi mà một mắt bỏ qua |
| `BR-SEC-09` | Cấm — **NEVER dữ liệu trẻ ra khỏi hạ tầng** | `BR-CDC-06` |
| `BR-SEC-10` | `apps/web` dùng `nuxt-security` cho CSP, API CORS và request-size; admin static nhận security headers từ Nginx | Web là owner duy nhất của API; admin không có Nitro server để tạo middleware hoặc auth boundary thứ hai |

## 7. Data

Contract chất lượng cắt ngang này không có entity riêng — mục này giữ số thứ tự chuẩn nhưng nội
dung là checklist an ninh áp cho mọi PR, chia theo mức độ chặn merge.

### 7.1 CRITICAL — chặn merge

- [ ] Cấm secret hardcode (API key, mật khẩu, token, chuỗi kết nối)
- [ ] Cấm đọc/ghi `.env`
- [ ] Zod validate mọi body, query, params
- [ ] Cấm mass assignment — map từng field
- [ ] Kiểm ownership ở server trước mọi đọc/ghi dữ liệu của người dùng
- [ ] Record của người khác trả **404**
- [ ] Gating kiểm ở server handler
- [ ] Response bị chặn không chứa `content_pack`
- [ ] Cấm PII của trẻ trong telemetry, log, hay prompt LLM
- [ ] User/Manager guard đúng Redis session namespace; không route auth nào chấp nhận Bearer
- [ ] Không direct dependency/import `jose`; session, remember và MFA challenge đều opaque Redis credential
- [ ] Opaque token ≥256 bit, Redis chỉ giữ digest, session tuyệt đối 1 giờ
- [ ] Remember mặc định tắt, absolute ≤365 ngày, rotate atomic; reuse revoke-all
- [ ] Redis auth lỗi fail-closed 503; không fallback file/memory/PG/JWT
- [ ] Thao tác thanh toán trong transaction, idempotent
- [ ] Upload kiểm MIME thật, từ chối SVG
- [ ] Cấm raw SQL nối chuỗi

### 7.2 HIGH — sửa trước merge

- [ ] Rate limit trên route nhạy cảm, hai trục
- [ ] CSRF token trên route đổi trạng thái
- [ ] Cookie đúng thuộc tính (`HttpOnly`, `SameSite`, `Secure`, path-scope remember)
- [ ] Valkey auth AOF + `noeviction`, client/keyspace riêng khỏi cache fail-open
- [ ] Trần phân trang ép ở server
- [ ] Thông báo lỗi không tiết lộ tài khoản tồn tại
- [ ] Cấm stack trace hay id nội bộ trong response
- [ ] File riêng tư qua signed URL ngắn hạn
- [ ] `v-html` chỉ với hằng số trong repo
- [ ] Audit ghi cho hành động trong [`audit-log.md`](../01-platform/audit-log.md) §7.2
- [ ] Cấm cache response chứa nội dung trả phí
- [ ] Web bật `nuxt-security` cho CSP/CORS/request-size; admin không mang server module và Nginx phục vụ header static
- [ ] `script-src` production không có `unsafe-inline`; script runtime dùng nonce/strict-dynamic theo config đã test

### 7.3 MEDIUM

- [ ] Dependency không có CVE mức cao
- [ ] Header bảo mật (CSP, HSTS, X-Content-Type-Options)
- [ ] CORS whitelist, không `*`
- [ ] URL outbound được validate (SSRF)
- [ ] Đích redirect trong whitelist

### 7.4 OWASP — ánh xạ

| Nguy cơ | Nơi xử lý |
|---|---|
| Broken access control | [`access-gating`](../04-play/access-gating.md) — ma trận 20 ô |
| Cryptographic failures | argon2id · secret ngoài code · TLS |
| Injection | Drizzle parameterize · Zod |
| Insecure design | Spec-first, review bắt buộc vùng nhạy cảm |
| Security misconfiguration | [`health-check.md`](../01-platform/health-check.md) · header · CORS |
| Vulnerable components | Quét dependency trong cổng tự động |
| Auth failures | [`auth-tokens-sessions.md`](../01-platform/auth-tokens-sessions.md) · rate limit hai trục |
| Data integrity failures | Bảng INSERT-only · trigger `published` |
| Logging failures | [`audit-log.md`](../01-platform/audit-log.md) · [`monitoring-and-alerting.md`](../01-platform/monitoring-and-alerting.md) |
| SSRF | Validate URL outbound |

### 7.5 Trước release

- [ ] `BR-BAK-06`: Backup đã verify restore ít nhất một lần
- [ ] Alert P0 đã cấu hình và tới được người
- [ ] Chính sách pháp lý đã rà soát
- [ ] Secret production khác secret dev
- [ ] PG và Valkey không bind `0.0.0.0`
- [ ] Auth Valkey startup check xác nhận AOF + `noeviction`; alert outage/memory/write/Lua failure tới người
- [ ] Bề mặt admin không index
- [ ] Quét toàn bộ: không PII trẻ trong log

## 8. API contract

Không có.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SEC-04 — mọi route có Zod
  When quét mọi handler dưới server/api
  Then mỗi handler parse input bằng Zod

Scenario: BR-SEC-05 — không mass assignment
  When quét mọi lời gọi db.update().set()
  Then không lời gọi nào truyền thẳng object đã parse

Scenario: BR-SEC-07 — record người khác trả 404
  When chạy bộ test IDOR trên mọi endpoint có tham số trẻ
  Then mọi endpoint trả 404

Scenario: BR-SEC-02 — không đọc .env
  When quét source tìm truy cập trực tiếp tới file .env
  Then không kết quả nào

Scenario: BR-SEC-09 — không dữ liệu trẻ ra ngoài
  When ghi lại mọi request outbound tới bên thứ ba
  Then không request nào chứa dữ liệu định danh trẻ

Scenario: BR-SEC-01 — CRITICAL chặn merge
  Given một PR có secret hardcode
  When cổng tự động chạy
  Then merge bị chặn

Scenario: BR-SEC-10 — một owner cho rate limit và CSRF
  When đọc cấu hình web và Nginx của admin
  Then web có CSP, CORS và request-size
  And Nginx có security headers cho admin static
  And rateLimiter và csrf của module bị tắt
  And route vẫn đi qua packages/cache và packages/auth tương ứng
```

## 10. Boundaries

**Always**
- Chạy checklist cho code chạm vùng nhạy cảm.
- Xoay secret ngay khi nghi lộ.
- Review người thứ hai cho auth, payment, dữ liệu trẻ.
- Khai `nuxt-security` trực tiếp trong `apps/web`; Nginx là owner header static, web là owner CORS/CSRF/rate limit.

**Ask first**
- Bỏ qua một mục CRITICAL.
- Thêm dependency chạm auth hoặc crypto.

**Never**
- Merge khi có vi phạm CRITICAL.
- Secret trong code.
- Dữ liệu trẻ ra khỏi hạ tầng.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Có thuê kiểm thử xâm nhập trước go-live không?~~ **Đóng 2026-08-09 (`D-CI`)**: có; thuê review độc lập có phạm vi auth, dữ liệu trẻ, gating và upload trước go-live P1. CRITICAL/HIGH phải đóng trước phát hành | — | Đã đóng | D-CI |
| ~~2~~ | ~~Khi chỉ có một dev thì "review người thứ hai" thực hiện thế nào?~~ **Đóng 2026-08-09 (`D-CJ`)**: mọi PR vùng nhạy cảm cần một người khác approve; khi chỉ có một dev, Product Owner review contract/diff và reviewer Security độc lập review phần bảo mật. Tác giả không tự approve | — | Đã đóng | D-CJ |
