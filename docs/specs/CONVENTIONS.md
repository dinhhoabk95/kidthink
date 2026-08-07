---
doc: CONVENTIONS
title: Quy ước viết specification — v2
version: 2.0.0
status: active
created: 2026-08-04
---

# Quy ước viết specification (v2)

Áp dụng cho [`../SPEC.md`](../SPEC.md) và mọi file dưới `specs/`.
Thay đổi so với v1 và lý do: [`AUDIT-v1.md`](AUDIT-v1.md) §4.

## 1. Một outcome, một file — luật cứng

**Cấm gộp.** Nếu một spec mô tả hai thứ mà người dùng có thể dùng riêng lẻ, đó là hai spec.

Kiểm tra bằng câu hỏi: *"Tính năng này xong chưa?"* — nếu câu trả lời phải là "phần A xong,
phần B chưa" thì file đang gộp và phải tách.

| ❌ Sai | ✅ Đúng |
|---|---|
| `dashboard-and-users.md` | `admin-dashboard.md` · `user-management.md` |
| `identity-and-security.md` | `registration.md` · `login-and-session.md` · `mfa.md` · … |
| `adaptive-and-curriculum.md` | `adaptive-selector.md` · `curriculum-player.md` |

**Chữ `and` trong tên file bị cấm khi nó nối hai outcome.** Được phép khi nó đặt tên cho
**một** outcome không tách được:

- ✅ `backup-and-restore.md` — một backup chưa từng restore không phải backup. Không tách.
- ✅ `monitoring-and-alerting.md` — monitoring không có alert chỉ là một endpoint.
- ✅ `login-and-session.md` — đăng nhập cấp phiên; tách ra thì không spec được vòng đời token.
- ❌ `landing-and-seo.md` — landing page và structured data dùng riêng được. Tách.

Khi phân vân: **tách**. Hai file nhỏ dễ gộp lại hơn một file to dễ bị bỏ dở.

## 2. Cấu trúc thư mục

| Thư mục | Chứa gì |
|---|---|
| `00-foundation/` | Contract cắt ngang mọi bề mặt. Không map vào một màn hình |
| `01-platform/` | Năng lực nội bộ, không phải bề mặt người dùng |
| `02-public/` | Outcome của khách chưa đăng nhập |
| `03-account/` | Outcome của User đã đăng nhập |
| `04-play/` | Outcome của trẻ trên bề mặt chơi |
| `05-content/` | Mô hình nội dung — hình dạng dữ liệu và ràng buộc biên tập |
| `06-admin/` | Outcome của Manager |
| `07-addon/` | Spec đầy đủ, **không lên catalog MVP** (§SPEC.md 1.6) |
| `08-quality/` | Contract chất lượng cắt ngang: test, bảo mật, a11y, hiệu năng, design |

Mỗi outcome có **đúng một** spec sở hữu. Spec khác **link tới**, không copy contract.
Contract bị copy sẽ drift.

## 3. Metadata bắt buộc

```yaml
---
spec: <SCREAMING-KEBAB id, duy nhất toàn corpus>
title: <tiếng Việt, một dòng>
area: foundation | platform | public | account | play | content | admin | addon | quality
status: draft | approved | implemented
mvp: true | false
phase: P0 | P1 | P2 | P3 | P4 | P5
reviewed: YYYY-MM-DD
owns:
  - <entity, route, hoặc quyết định mà spec này là nguồn sự thật duy nhất>
depends_on:
  - <spec id phải approved trước>
---
```

| Field | Nghĩa |
|---|---|
| `status` | Độ chín của **spec**, không phải của code. `implemented` chỉ đặt khi acceptance criteria đã xanh |
| `mvp` | `true` nếu chặn release MVP |
| `phase` | Phase sớm nhất spec này được implement — khớp `../SPEC.md` §12 |
| `owns` | Thứ mà **chỉ** file này được định nghĩa. Nếu hai file cùng `owns` một thứ, một trong hai sai |
| `depends_on` | Dùng để xếp thứ tự implement. Cấm chu trình |

❌ Không có `classification`, không có `verified_against_code`, không có `sources`.
v2 là greenfield — không có code để đối chiếu, và spec không mang lineage.

## 4. Mười một section — đúng thứ tự

1. **Objective** — outcome của ai, giá trị gì. 3–6 câu.
2. **Actors** — ai chạm vào, với quyền nào.
3. **Entry points** — route, màn hình, hoặc caller.
4. **Main flow** — đường đi chính, đánh số.
5. **Alternative flows** — nhánh rẽ và ca lỗi.
6. **Business rules** — đánh số `BR-<SPEC>-nn`, mỗi rule kèm **vì sao**.
7. **Data** — entity đọc/ghi, field, ràng buộc.
8. **API contract** — route, auth, request, response, mã lỗi.
9. **Acceptance criteria** — Gherkin, mỗi scenario **fail được**.
10. **Boundaries** — Always · Ask first · Never, viết riêng cho module này.
11. **Open questions** — cái gì chưa chốt và nó chặn gì.

Không bỏ section nào. Dùng `Không có.` khi sự vắng mặt là có ý nghĩa.
Spec `07-addon/**` được rút gọn còn 1–2–6–7–8–9–11 (không có flow chi tiết).

## 5. Business rule — đánh số và tra chéo được

```markdown
| ID | Rule | Vì sao |
|---|---|---|
| `BR-GATE-01` | Content thiếu `access_tier` bị coi là `premium`, không phải `free` | Quên gán tier là cho không nội dung |
```

Định danh: `BR-<SPEC id rút gọn>-<số 2 chữ>`. Đặt rồi **không đổi, không tái dùng**.
Test tham chiếu bằng ID trong tên test. Registry tổng:
[`00-foundation/business-rules.md`](00-foundation/business-rules.md).

**Rule không có "vì sao" sẽ bị xoá sai bởi người sau.** Đây là lý do cột thứ ba bắt buộc.

## 6. Acceptance criteria — Gherkin, fail được

```gherkin
Scenario: BR-GATE-01 — content thiếu access_tier không được cho không
  Given một game level được ghi vào DB không có access_tier
  When guest gọi GET /api/guest/levels/{code}
  Then hệ thống trả 403
  And body không chứa content_pack
```

| ❌ Tệ | ✅ Tốt |
|---|---|
| "Người dùng thấy được danh sách game phù hợp" | "Guest gọi `GET /api/guest/levels?tier=premium` → 403, body có `access_tier` và `required_entitlement`, không có `content_pack`" |

Mỗi scenario map được sang **đúng một** test. Tên test mang ID scenario.

## 7. API contract

```markdown
### `POST /api/users/orders`

| | |
|---|---|
| Auth | `requireUserAuth()` |
| Body | `CreateOrderSchema` — `{ package_code, billing_period }` |
| 201 | `{ order_id, amount, currency, qr_payload, expires_at }` |
| 400 | `INVALID_PACKAGE` — `package_code` không có trong catalog |
| 409 | `ORDER_ALREADY_PENDING` — User đã có đơn `pending` cho gói này |
```

- Path canonical: `/api/guest/**` · `/api/users/**` · `/api/managers/**`.
- Path là **danh từ số nhiều**.
- ❌ Không response wrapper `{data, error}` — JSON trần + HTTP code.
- Mã lỗi nghiệp vụ `SCREAMING_SNAKE`, đăng ký ở
  [`00-foundation/error-codes.md`](00-foundation/error-codes.md).

## 8. Viết prose

- **Nêu vì sao mỗi invariant tồn tại.** Invariant không có lý do sẽ bị xoá sai.
- Tham chiếu constant trong code thay vì copy giá trị dễ drift (`PACKAGE_CATALOG`,
  `SOFT_UNLOCK_DAYS`, `AGE_BAND_TOUCH_FLOOR`).
- Tiếng Việt cho prose; tiếng Anh chính xác cho path, enum, tên field, tên bảng.
  Chuỗi hiển thị người dùng ghi **nguyên văn** tiếng Việt.
- Bảng hơn danh sách gạch đầu dòng khi có từ 3 thuộc tính trở lên.
- Không viết như thể B2B, classroom, school-admin, multi-tenant, `tenant_id` đang tồn tại
  — chúng **vĩnh viễn ngoài phạm vi**.

## 9. Thêm một spec mới

1. Chọn `area` và `phase`.
2. Copy [`TEMPLATE.md`](TEMPLATE.md) sang `<area>/<kebab-outcome>.md`.
3. Kiểm tên file không gộp hai outcome (§1).
4. Điền đủ 11 section.
5. Thêm vào [`index.md`](index.md).
6. Kiểm `owns` không đụng spec khác.

## 10. Checklist review

- [ ] Metadata đủ 9 field. `owns` không trùng spec nào khác.
- [ ] 11 section đúng thứ tự, không section nào rỗng không giải thích.
- [ ] Tên file không nối hai outcome.
- [ ] Mọi `BR-*` có cột "vì sao" và có ID không trùng.
- [ ] Mọi Gherkin scenario fail được, map sang đúng một test.
- [ ] Mọi mã lỗi có trong `error-codes.md`.
- [ ] Mọi link nội bộ resolve được.
- [ ] Không `classification`, không `tenant_id`, không persona enum, không cột `role` trên `users`.
- [ ] `depends_on` không tạo chu trình.
- [ ] Bảng trong `data-model-overview` §7 khớp hai chiều với `schema-*` §7.x.
- [ ] Mã ID trong spec khớp regex `id-conventions` §7 (ví dụ khớp regex cùng hàng).
