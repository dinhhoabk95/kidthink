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

| Sai | Đúng |
|---|---|
| `dashboard-and-users.md` | [`admin-dashboard.md`](06-admin/admin-dashboard.md) · [`user-management.md`](06-admin/user-management.md) |
| `identity-and-security.md` | [`registration.md`](03-account/registration.md) · [`login-and-session.md`](03-account/login-and-session.md) · [`mfa.md`](03-account/mfa.md) · … |
| `adaptive-and-curriculum.md` | `adaptive-selector.md` · [`curriculum-player.md`](04-play/curriculum-player.md) |

**Chữ `and` trong tên file bị cấm khi nó nối hai outcome.** Được phép khi nó đặt tên cho
**một** outcome không tách được — ba ví dụ đúng:

- [`backup-and-restore.md`](01-platform/backup-and-restore.md) — một backup chưa từng restore
  không phải backup. Không tách.
- [`monitoring-and-alerting.md`](01-platform/monitoring-and-alerting.md) — monitoring không có
  alert chỉ là một endpoint.
- [`login-and-session.md`](03-account/login-and-session.md) — đăng nhập cấp phiên; tách ra thì
  không spec được vòng đời token.

Ví dụ sai — `landing-and-seo.md`: landing page và structured data dùng riêng được. Tách.

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

Không có `classification`, không có `verified_against_code`, không có `sources`.
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

| Tệ | Tốt |
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
- Không dùng response wrapper `{data, error}` — JSON trần + HTTP code.
- Mã lỗi nghiệp vụ `SCREAMING_SNAKE`, đăng ký ở
  [`00-foundation/error-codes.md`](00-foundation/error-codes.md).

## 8. Viết prose

- **Nêu vì sao mỗi invariant tồn tại.** Invariant không có lý do sẽ bị xoá sai.
- Tham chiếu constant trong code thay vì copy giá trị dễ drift (`PACKAGE_CATALOG`,
  `SOFT_UNLOCK_DAYS`, `AGE_BAND_TOUCH_FLOOR`).
- Tiếng Việt cho prose; tiếng Anh chính xác cho path, enum, tên field, tên bảng.
  Chuỗi hiển thị người dùng ghi **nguyên văn** tiếng Việt.
- Quy tắc trên áp cho **định danh**. Nó cũng áp cho **thuật ngữ chuyên môn** — `schema`,
  `partition`, `queue`, `session`, `token`, `feature flag`, `rate limit`, `KPI`, `ZPD`, `LO`, …
  giữ nguyên tiếng Anh, không dịch ra tiếng Việt kể cả khi có từ tương đương. Danh sách đầy đủ,
  ba nhóm phân biệt (thuật ngữ · định danh · câu văn thường), và bảng lỗi dịch quá tay đã từng
  mắc: mục 11.3.
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
- [ ] Mọi mã lỗi có trong [`error-codes.md`](00-foundation/error-codes.md).
- [ ] Mọi link nội bộ resolve được.
- [ ] Không `classification`, không `tenant_id`, không persona enum, không cột `role` trên `users`.
- [ ] `depends_on` không tạo chu trình.
- [ ] Bảng ở mục 7 của [`data-model-overview.md`](01-platform/data-model-overview.md) khớp hai
      chiều với §7.x của mỗi `schema-*`.
- [ ] Mã ID trong spec khớp regex ở mục 7 của
      [`id-conventions.md`](00-foundation/id-conventions.md) (ví dụ khớp regex cùng hàng).
- [ ] Không còn ký hiệu emoji trong văn xuôi (mục 11.1).
- [ ] Mọi lần nhắc tài liệu khác là liên kết bấm được, kèm số mục nếu nói chỗ cụ thể (mục 11.4).
- [ ] Mọi mã hợp đồng (`BR-*`, mã lỗi, mã quyết định `D-*`, mã kiểm tra `Cn`) kèm tên đọc được
      ở lần nhắc đầu tiên trong file (mục 11.5).
- [ ] Không thuật ngữ chuyên môn nào bị dịch ra tiếng Việt (mục 11.3).
- [ ] Mọi hàng câu hỏi mở ở mục 11 của spec có 5 cột với "Chặn phase" và "Chủ" không rỗng.


## 11. Văn phong — không ký hiệu, không viết tắt tự phát

Thêm 2026-08-07, Task #4 —
[`../tasks/04-readability-spec.md`](../tasks/04-readability-spec.md). Corpus trước đó dùng ký
hiệu emoji thay lời và chữ viết tắt tự phát chưa từng định nghĩa; người đọc mới phải học một
bảng ký hiệu riêng trước khi hiểu câu đầu tiên. Mục này là quy ước lâu dài — áp cho mọi spec viết
sau Task #4, không chỉ corpus đã có.

### 11.1 Bảng thay ký hiệu

Không dùng 14 ký hiệu dưới đây trong văn xuôi. Bọc trong khối mã vì chính bảng này liệt kê ký
hiệu bị cấm — đối tượng được nói tới, không phải cách viết vi phạm (kiểm tra C14 bỏ qua khối mã).

```
❌  →  "Không …", "Cấm …", "… không phải là …" tuỳ ngữ cảnh. Ô bảng nhị phân: "Không"
✅  →  Ô bảng nhị phân: "Có". Trong checklist: bỏ hẳn, ô tick đã nói điều đó
⚠️  →  "Cảnh báo:" đầu câu
⛔  →  "Cổng dừng"
⟂  →  "làm song song được"
👤  →  "cần người quyết"
🟡  →  "Hoãn, chặn phase Pn" — nêu rõ phase, không để màu thay lời
🔴  →  "Chặn cứng, không hoãn thêm được"
❗  →  "Quan trọng:"
⏸  →  "Đang chờ"
⟷  →  "khớp hai chiều với"
⊂  →  "bao hàm" — ví dụ free ⊂ login thành "tier `login` bao hàm tier `free`"
⇒  →  "dẫn tới", "nên", "thì"
✱  →  Đổi thành cột riêng trong bảng, tên cột "Bắt buộc", giá trị "Có"/"Không"
```

Chỉ đổi ký hiệu, không đổi thuật ngữ đứng cạnh nó.

### 11.2 Bảng thay chữ viết tắt tự phát

`LO`, `ZPD`, `KPI` KHÔNG nằm ở đây — thuật ngữ chuyên môn, giữ nguyên, xem mục 11.3.

```
OQ            →  "câu hỏi còn mở"
DMO           →  data-model-overview.md (liên kết)
SIB           →  schema-identity-billing.md (liên kết)
SCT           →  schema-content-taxonomy.md (liên kết)
SPT           →  schema-play-telemetry.md (liên kết)
TAX           →  taxonomy-service.md (liên kết)
GTC           →  game-template-contract.md (liên kết)
CLC           →  content-lifecycle.md (liên kết)
Tn (hồ sơ task)  →  "Bước n"
Mn (hồ sơ task)  →  "Mâu thuẫn n"
D-*           →  Giữ mã (spec khác trích nó), luôn kèm tên đọc được lần nhắc đầu
Cn            →  Giữ mã (log `pnpm lint:specs` in `[C6]`), luôn kèm tên đọc được lần nhắc đầu
```

### 11.3 Thuật ngữ chuyên môn giữ nguyên tiếng Anh

**Quy tắc.** Viết tiếng Việt cho câu văn, giữ nguyên tiếng Anh cho thuật ngữ chuyên môn. Không
dịch thuật ngữ ra tiếng Việt kể cả khi có từ tương đương — bản dịch tự chế bắt người đọc dịch
ngược lại để tra tài liệu gốc, và mỗi người dịch một kiểu.

| Nhóm | Xử lý | Ví dụ |
|---|---|---|
| Thuật ngữ chuyên môn | Giữ nguyên tiếng Anh, không dịch | `schema`, `partition`, `migration`, `seed`, `index`, `cache`, `queue`, `worker`, `job`, `session`, `token`, `payload`, `endpoint`, `middleware`, `handler`, `webhook`, `rate limit`, `feature flag`, `audit log`, `health check`, `telemetry`, `rollup`, `idempotency`, `rollback`, `deprecation`, `monorepo`, `workspace`, `entitlement`, `gating`, `paywall`, `tier`, `business rule`, `acceptance criteria`, `foreign key`, `primary key`, `KPI`, `ZPD`, `LO`, `MFA`, `OAuth`, `PWA`, `SEO` |
| Định danh | Giữ nguyên tuyệt đối | Tên bảng, tên cột, route, giá trị enum, mã lỗi, tên file, tên package |
| Câu văn thường | Viết tiếng Việt | Mô tả hành vi, lý do, cảnh báo, chuỗi hiển thị người dùng |

**Chú giải một lần cho thuật ngữ ít phổ biến** — lần nhắc đầu tiên trong mỗi file, mở ngoặc giải
thích ngắn, lần sau dùng trần: `ZPD`, `LO`, `KPI`, `idempotency`, `rollup`, `paywall`.

**Sáu lỗi dịch quá tay đã từng mắc — dùng làm ca đối chiếu:**

| Sai — dịch quá tay | Đúng — giữ nguyên |
|---|---|
| "phân mảnh bảng `telemetry_events`" | "partition bảng `telemetry_events`" |
| "hàng đợi việc", "cờ tính năng", "nhật ký kiểm toán" | "job queue", "feature flag", "audit log" |
| "chỉ số theo dõi", "vùng phát triển gần" | "KPI", "ZPD" |
| "truy vấn cơ sở dữ liệu" | "truy vấn database" hoặc "DB query" |
| "biểu mẫu sinh từ lược đồ" | "schema-driven form" |
| "kiểm tra sức khoẻ", "giới hạn tần suất" | "health check", "rate limit" |

### 11.4 Tham chiếu file

Mọi lần nhắc tới một tài liệu khác phải là liên kết bấm được, đường dẫn tương đối, kèm số mục
nếu đang nói về một chỗ cụ thể. Đường dẫn trong ví dụ minh hoạ vẫn phải resolve thật — kiểm tra
C4 quét cả nội dung trong khối mã, không bỏ qua như C9/C10 làm.

```markdown
Sai:   Xem `access-ladder` §7.3.
Đúng:  Xem mục 7.3 của [`access-ladder.md`](00-foundation/access-ladder.md).
```

Với mã nguồn, trỏ dòng cụ thể dạng `đường-dẫn:số-dòng`, ví dụ
[`scripts/lint-specs-lib.ts:297`](../../scripts/lint-specs-lib.ts).

### 11.5 Mã hợp đồng luôn kèm tên đọc được

Lần nhắc **đầu tiên** trong mỗi file của một mã `BR-*`, mã lỗi, mã quyết định `D-*`, hay mã kiểm
tra `Cn` phải kèm tên: *"quy tắc `BR-GAT-01` — kiểm quyền ở tầng server, không kiểm ở trình
duyệt"*. Những lần nhắc sau trong cùng file dùng mã trần được. Không đổi mã — mã là hợp đồng,
spec khác trích nó.

### 11.6 Quy trình chuẩn cho một file — chín việc, đúng thứ tự

1. Đọc hết file trước khi sửa dòng nào.
2. Không đụng frontmatter, kể cả `reviewed`.
3. Sửa mục 1 Objective trước — nếu nó khó hiểu thì cả file khó hiểu.
4. Thay ký hiệu, từng chỗ một, đọc lại cả câu sau mỗi lần thay.
5. Giữ nguyên thuật ngữ chuyên môn tiếng Anh — việc "không làm gì", dễ vi phạm nhất.
6. Thay chữ viết tắt tự phát theo mục 11.2.
7. Đổi tham chiếu trần thành liên kết có số mục.
8. Mã hợp đồng kèm tên đọc được ở lần nhắc đầu tiên trong file.
9. Chạy `pnpm lint:specs`, đọc diff từng dòng, tự hỏi: có chỗ nào đổi nghĩa không.

Cấm thay thế hàng loạt (`sed` trên toàn corpus) — dấu phủ định emoji không có một bản dịch duy
nhất, mỗi câu cần đọc lại sau khi thay.

### 11.7 Bảng câu hỏi mở ở mục 11 phải đủ 5 cột

Mọi spec `status: approved` chứa bảng câu hỏi mở ở section "## 11. Open questions" bắt buộc phải sử dụng bảng 5 cột:

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |

Cột `Chủ` phải thuộc bộ giá trị đóng:
- `người quyết`: Cần quyết định thương mại, pháp lý, hoặc phạm vi — chủ dự án
- `hoãn`: Chưa cần trả lời trước phase đã ghi; nên kèm điều kiện mở lại đo được
- `Infra` · `Backend` · `Studio UI` · `Nội dung` · `Kế toán`: Quyết định kỹ thuật hoặc nghiệp vụ nội bộ
- `D-*`: Hàng đã đóng; ghi mã quyết định tương ứng (ví dụ `D-AE`)

Cấm để trống, cấm `-`, cấm `—`, cấm `TBD`. `checkC16` ở chặng 2 sẽ báo lỗi `fail` nếu bảng dưới 5 cột hoặc thiếu `Chặn phase`/`Chủ`.

