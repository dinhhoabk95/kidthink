---
spec: SECURITY-CHECKLIST
title: Danh sách kiểm bảo mật
area: quality
status: draft
mvp: true
phase: P0
reviewed: 2026-08-04
owns:
  - Checklist bảo mật bắt buộc trước merge và trước release
depends_on:
  - AUTH-TOKENS-SESSIONS
  - ACCESS-GATING
  - CHILD-DATA-COMPLIANCE
---

# Danh sách kiểm bảo mật

## 1. Objective

Ba tài sản cần bảo vệ, theo thứ tự: **dữ liệu trẻ em** · **luồng tiền** · **nội dung trả
phí**.

Thứ tự này quyết định mức độ nghiêm ngặt. Rò nội dung trả phí là mất doanh thu; rò dữ liệu
trẻ là ❌ không sửa được.

## 2. Actors

Dev · reviewer · CI.

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
| Secret bị lộ | **Xoay ngay**, ❌ không chờ |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SEC-01` | Vi phạm CRITICAL **chặn merge** | |
| `BR-SEC-02` | ❌ **NEVER đọc/ghi `.env`** trong code hay công cụ | |
| `BR-SEC-03` | Secret lộ → **xoay ngay** | Secret đã lộ là secret đã mất |
| `BR-SEC-04` | Mọi route `/api/*` **Zod validate** body, query, params | Query param đi vào `ilike`/`gte` là đường vào injection |
| `BR-SEC-05` | ❌ **NEVER mass assignment** — map từng field | |
| `BR-SEC-06` | Kiểm quyền và ownership ở **server**, ❌ không client | |
| `BR-SEC-07` | Record của người khác → **404** | `BR-ACT-03` |
| `BR-SEC-08` | Code chạm auth, payment, hoặc dữ liệu trẻ → **bắt buộc review** người thứ hai | |
| `BR-SEC-09` | ❌ **NEVER dữ liệu trẻ ra khỏi hạ tầng** | `BR-CDC-06` |

## 7. Checklist

### 7.1 CRITICAL — chặn merge

- [ ] ❌ Không secret hardcode (API key, mật khẩu, token, chuỗi kết nối)
- [ ] ❌ Không đọc/ghi `.env`
- [ ] Zod validate mọi body, query, params
- [ ] ❌ Không mass assignment — map từng field
- [ ] Kiểm ownership ở server trước mọi đọc/ghi dữ liệu của người dùng
- [ ] Record của người khác trả **404**
- [ ] Gating kiểm ở server handler
- [ ] Response bị chặn ❌ không chứa `content_pack`
- [ ] ❌ Không PII của trẻ trong telemetry, log, hay prompt LLM
- [ ] Guard đúng namespace, kiểm audience
- [ ] Thao tác thanh toán trong transaction, idempotent
- [ ] Upload kiểm MIME thật, từ chối SVG
- [ ] ❌ Không raw SQL nối chuỗi

### 7.2 HIGH — sửa trước merge

- [ ] Rate limit trên route nhạy cảm, hai trục
- [ ] CSRF token trên route đổi trạng thái
- [ ] Cookie đúng thuộc tính (`HttpOnly`, `SameSite`, `Secure`, path-scope refresh)
- [ ] Trần phân trang ép ở server
- [ ] Thông báo lỗi ❌ không tiết lộ tài khoản tồn tại
- [ ] ❌ Không stack trace hay id nội bộ trong response
- [ ] File riêng tư qua signed URL ngắn hạn
- [ ] `v-html` chỉ với hằng số trong repo
- [ ] Audit ghi cho hành động trong `audit-log` §7.2
- [ ] ❌ Không cache response chứa nội dung trả phí

### 7.3 MEDIUM

- [ ] Dependency ❌ không có CVE mức cao
- [ ] Header bảo mật (CSP, HSTS, X-Content-Type-Options)
- [ ] CORS whitelist, ❌ không `*`
- [ ] URL outbound được validate (SSRF)
- [ ] Đích redirect trong whitelist

### 7.4 OWASP — ánh xạ

| Nguy cơ | Nơi xử lý |
|---|---|
| Broken access control | `access-gating` — ma trận 20 ô |
| Cryptographic failures | argon2id · secret ngoài code · TLS |
| Injection | Drizzle parameterize · Zod |
| Insecure design | Spec-first, review bắt buộc vùng nhạy cảm |
| Security misconfiguration | `health-check` · header · CORS |
| Vulnerable components | Quét dependency trong CI |
| Auth failures | `auth-tokens-sessions` · rate limit hai trục |
| Data integrity failures | Bảng INSERT-only · trigger `published` |
| Logging failures | `audit-log` · `monitoring-and-alerting` |
| SSRF | Validate URL outbound |

### 7.5 Trước release

- [ ] Backup đã verify restore ít nhất một lần
- [ ] Alert P0 đã cấu hình và tới được người
- [ ] Chính sách pháp lý đã rà soát
- [ ] Secret production khác secret dev
- [ ] PG và Valkey ❌ không bind `0.0.0.0`
- [ ] Bề mặt admin ❌ không index
- [ ] Quét toàn bộ: ❌ không PII trẻ trong log

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
  When CI chạy
  Then merge bị chặn
```

## 10. Boundaries

**Always**
- Chạy checklist cho code chạm vùng nhạy cảm.
- Xoay secret ngay khi nghi lộ.
- Review người thứ hai cho auth, payment, dữ liệu trẻ.

**Ask first**
- Bỏ qua một mục CRITICAL.
- Thêm dependency chạm auth hoặc crypto.

**Never**
- Merge khi có vi phạm CRITICAL.
- Secret trong code.
- Dữ liệu trẻ ra khỏi hạ tầng.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có thuê kiểm thử xâm nhập trước go-live không? | Go-live |
| 2 | Khi chỉ có một dev thì "review người thứ hai" thực hiện thế nào? | Quy trình |
