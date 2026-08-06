---
spec: AI-CODEGEN-PIPELINE
title: Pipeline AI sinh code từ spec
area: platform
status: draft
mvp: true
phase: P0
reviewed: 2026-08-04
owns:
  - Artefact máy đọc được sinh ra từ spec
  - Cái gì AI được sinh code, cái gì không
  - Cổng chất lượng bắt buộc trước khi merge
depends_on:
  - CONVENTIONS
  - GAME-TEMPLATE-CONTRACT
  - DATA-MODEL-OVERVIEW
---

# Pipeline AI sinh code từ spec

## 1. Objective

Corpus spec v2 có **124 file** với API contract dạng bảng, Gherkin acceptance, và business
rule đánh số. Đó là đủ cấu trúc để sinh phần lớn code khung một cách máy móc: Zod schema,
bảng Drizzle, route skeleton, Session class skeleton, và **test từ Gherkin**.

Mục tiêu không phải "AI viết hộ ứng dụng". Mục tiêu là **spec và code không trôi khỏi
nhau** — khi spec là nguồn sinh, một thay đổi contract không thể quên cập nhật code.

### 1.1 Ranh giới

```
spec (nguồn sự thật)  ──sinh──►  scaffold  ──người viết logic──►  code
                                     │
                       AI dừng ở đây │  logic nghiệp vụ, quyết định kiến trúc,
                                     │  và MỌI thứ trong vùng cấm §5 là của người
```

AI sinh **khung**, không sinh **quyết định**. Một route skeleton có guard đúng, Zod đúng, mã
lỗi đúng — nhưng thân hàm là `throw new Error("TODO")` cho tới khi người viết.

Spec này sở hữu **code**. Seeder **nội dung** (game level, LO, lesson, curriculum) cũng là
file TS trong repo và cũng qua PR review, nhưng contract của nó ở
[`content-seed-authoring`](./content-seed-authoring.md) — nội dung và code có cổng kiểm khác
nhau.

## 2. Actors

| Actor | Làm gì | ❌ Không làm được |
|---|---|---|
| Dev | Chạy generator, review diff, viết logic, mở PR | — |
| Generator (máy, không LLM) | Sinh từ artefact xác định: Zod, Drizzle, barrel, type | — |
| LLM | Sinh skeleton cần suy luận: test từ Gherkin, Session class từ template contract | Ghi thẳng vào `main` · chạm vùng cấm §5 |
| CI | Chặn merge khi cổng §6 đỏ | — |

## 3. Entry points

| Lệnh | Sinh gì | Loại |
|---|---|---|
| `pnpm gen:spec-index` | `spec-index.json` — frontmatter + API contract + BR + Gherkin của 124 spec | xác định |
| `pnpm gen:schema` | Drizzle table từ section Data của spec | xác định |
| `pnpm gen:zod` | Zod schema từ API contract | xác định |
| `pnpm gen:routes` | Route skeleton: guard, Zod parse, mã lỗi, `TODO` thân hàm | xác định |
| `pnpm gen:tests` | Vitest/Playwright skeleton từ Gherkin, mỗi scenario một `test.todo` | xác định |
| `pnpm gen:session --template=GT-003` | Session class skeleton từ `content_contract` | LLM |
| `pnpm gen:check` | So spec ↔ code, báo lệch | xác định |

**Bảy lệnh, sáu là xác định.** Chỉ `gen:session` cần LLM, và output của nó vẫn phải qua
cổng §6.

## 4. Main flow

```
1. Spec được duyệt (status: approved)
2. pnpm gen:spec-index          → spec-index.json  (artefact máy đọc)
3. pnpm gen:schema / gen:zod / gen:routes / gen:tests
4. Diff hiện ra trong git — NGƯỜI ĐỌC TỪNG DÒNG
5. Người viết logic nghiệp vụ vào chỗ TODO
6. pnpm check && pnpm test      → phải xanh
7. PR có người review           → merge
8. pnpm gen:check trong CI      → chặn merge nếu spec và code lệch
```

## 5. Vùng cấm — AI ❌ không sinh code

| Vùng | Vì sao |
|---|---|
| **Auth** — guard, verify JWT, hash mật khẩu, xử lý phiên | Lỗi ở đây là lỗ hổng, và lỗ hổng do máy sinh khó thấy hơn lỗ hổng do người viết |
| **Thanh toán** — approve, cấp entitlement, transaction | Luồng tiền. Một lỗi idempotency mất tiền thật |
| **Gating** — `allowedTiers`, kiểm ownership | Bug ở đây cho không toàn bộ nội dung |
| **Dữ liệu trẻ** — mọi thứ chạm `child_profiles`, `consent_logs`, telemetry PII | Ràng buộc pháp lý, không sửa ngược được |
| **Migration chạy tự động** | Migration sai làm hỏng dữ liệu production |
| **Nội dung đã published** | `content-lifecycle` `BR-CLC-01` |

Ở sáu vùng này AI được **đọc, giải thích, đề xuất, review** — ❌ không được **sinh code sẽ
merge**.

Ranh giới đặt theo *hậu quả khi sai*, không theo *độ khó khi viết*.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-AIG-01` | Code sinh ra ❌ **NEVER** merge tự động. Luôn qua PR có người review | |
| `BR-AIG-02` | Ưu tiên generator **xác định** hơn LLM. Dùng LLM chỉ khi output không suy ra máy móc được | Generator xác định tái lập được, diff sạch, không tốn tiền |
| `BR-AIG-03` | AI ❌ **NEVER** sinh code trong vùng cấm §5 | |
| `BR-AIG-04` | Code sinh ra mang header `@generated from <spec-id>@<sha>`; ❌ **NEVER sửa tay** file `@generated` | Sửa tay file sinh ra sẽ mất ở lần sinh sau |
| `BR-AIG-05` | Test sinh từ Gherkin ra dưới dạng `test.todo`, ❌ **không** dưới dạng test rỗng pass | Test rỗng pass là tệ hơn không có test — nó báo xanh giả |
| `BR-AIG-06` | `pnpm gen:check` chạy trong CI, **chặn merge** khi spec và code lệch | Không có cổng này thì spec trôi khỏi code trong 3 sprint |
| `BR-AIG-07` | Đổi contract → sửa **spec trước**, sinh lại, rồi sửa code. ❌ Không sửa code trước | Nếu code đi trước, spec thành tài liệu chết |
| `BR-AIG-08` | Prompt của `gen:session` version trong repo | Prompt là code |
| `BR-AIG-09` | Session class sinh ra phải qua `pnpm lint:tokens` — ❌ không hex literal | LLM rất hay sinh hex literal |
| `BR-AIG-10` | Mọi PR có code sinh ra ghi rõ trong mô tả: lệnh nào sinh, spec nào, phần nào người viết | Review cần biết soi chỗ nào |

## 7. Data

### 7.1 `spec-index.json` — artefact trung tâm

```jsonc
{
  "specs": [{
    "id": "ACCESS-LADDER",
    "path": "00-foundation/access-ladder.md",
    "area": "foundation", "status": "draft", "mvp": true, "phase": "P0",
    "owns": ["..."], "depends_on": ["GLOSSARY", "ACTORS"],
    "business_rules": [
      { "id": "BR-LAD-02", "rule": "Content thiếu access_tier coi là premium", "reason": "Mặc định phải là đóng" }
    ],
    "api": [{
      "method": "GET", "path": "/api/guest/levels/{code}",
      "auth": "none",
      "responses": { "200": "...", "403": "TIER_LOCKED" }
    }],
    "scenarios": [{
      "name": "BR-LAD-02 — mặc định đóng",
      "given": ["..."], "when": ["..."], "then": ["..."]
    }],
    "error_codes": ["TIER_LOCKED"]
  }]
}
```

Sinh bằng parse Markdown — **xác định, không LLM**. Đây là lý do `CONVENTIONS.md` ép cấu
trúc 11 section và bảng cố định: cấu trúc đó tồn tại để máy đọc được.

### 7.2 Cái gì sinh ra từ cái gì

| Section spec | Sinh ra | Công cụ |
|---|---|---|
| Data → bảng field | Drizzle table + type | xác định |
| API contract → Body | Zod schema | xác định |
| API contract → route + auth | Route skeleton có guard + parse + mã lỗi + `TODO` | xác định |
| Acceptance → Gherkin | `test.todo` có tên = tên scenario | xác định |
| Error codes | Union type + bảng ánh xạ HTTP | xác định |
| Business rules | Comment `@see BR-XXX-nn` cạnh chỗ ép rule | xác định |
| `content_contract` template | Session class skeleton | **LLM** |

### 7.3 Header file sinh ra

```ts
/**
 * @generated from ACCESS-LADDER@a3f9c21 by `pnpm gen:routes`
 * ❌ KHÔNG sửa tay file này — sửa spec rồi sinh lại.
 * Logic nghiệp vụ viết ở ./access-ladder.impl.ts
 */
```

Tách `*.gen.ts` (sinh, không sửa) khỏi `*.impl.ts` (người viết). `gen:check` chỉ so file
`.gen.ts` — file người viết không bị ràng buộc.

### 7.4 `gen:check` báo gì

| Lệch | Mức |
|---|---|
| Route có trong spec, không có trong code | **error** |
| Route có trong code, không có trong spec | **error** — code đi trước spec |
| Mã lỗi dùng trong code không có trong `error-codes.md` | **error** |
| Gherkin scenario không có test tương ứng | **error** |
| Test `test.todo` chưa implement | **warn**, đếm và báo |
| BR không được tham chiếu ở đâu trong code | **warn** |
| File `.gen.ts` bị sửa tay (hash lệch) | **error** |

## 8. API contract

Không có route. Giao diện là CLI + CI.

```ts
interface GenCheckResult {
  errors: { kind: string; spec_id: string; detail: string }[];
  warnings: { kind: string; spec_id: string; detail: string }[];
  coverage: { scenarios_total: number; scenarios_implemented: number };
}
```

CI fail khi `errors.length > 0`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-AIG-05 — test sinh ra là test.todo, không phải test rỗng
  Given một spec có 8 Gherkin scenario chưa implement
  When chạy pnpm gen:tests
  Then file test sinh ra chứa 8 test.todo
  And pnpm test báo 8 todo
  And không test nào pass mà chưa có assertion

Scenario: BR-AIG-06 — CI chặn khi spec và code lệch
  Given một route tồn tại trong code nhưng không có trong spec nào
  When chạy pnpm gen:check
  Then kết quả có ít nhất một error
  And CI fail

Scenario: BR-AIG-04 — sửa tay file generated bị bắt
  Given một file .gen.ts đã sinh
  When ai đó sửa tay một dòng trong file đó
  Then pnpm gen:check báo error hash lệch

Scenario: BR-AIG-03 — không sinh code vùng cấm
  When chạy pnpm gen:routes
  Then không file nào được sinh dưới packages/auth
  And route thanh toán chỉ sinh chữ ký và Zod, thân hàm là TODO
  And thân hàm không chứa logic cấp entitlement

Scenario: BR-AIG-09 — Session class sinh ra không có hex literal
  Given pnpm gen:session --template=GT-003 đã chạy
  When chạy pnpm lint:tokens
  Then không vi phạm nào trong file vừa sinh

Scenario: BR-AIG-07 — đổi contract bắt đầu từ spec
  Given một dev đổi một route trong code mà không đổi spec
  When CI chạy
  Then gen:check báo error "route không có trong spec"

Scenario: sinh lại là idempotent
  Given code đã sinh từ một spec chưa đổi
  When chạy lại pnpm gen:routes
  Then git diff rỗng

Scenario: mọi mã lỗi trong code đều có trong registry
  Given code sử dụng appError với một mã chưa đăng ký
  When chạy pnpm gen:check
  Then kết quả có error trỏ tới mã đó
```

## 10. Boundaries

**Always**
- Ưu tiên generator xác định hơn LLM.
- Đọc từng dòng diff của code sinh ra trước khi commit.
- Tách `*.gen.ts` khỏi `*.impl.ts`.
- Chạy `gen:check` trong CI như cổng chặn merge.
- Sửa spec trước, sinh lại, rồi sửa code.

**Ask first**
- Thêm một loại artefact sinh ra.
- Dùng LLM cho một generator hiện đang xác định.
- Nới một mục trong `gen:check` từ error xuống warn.

**Never**
- Merge tự động code sinh ra.
- Sinh code trong vùng cấm §5.
- Sửa tay file `@generated`.
- Sinh test rỗng pass.
- Để code đi trước spec.
- Hex literal trong Session class sinh ra.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Parser Markdown → `spec-index.json` chịu được spec viết lệch chuẩn tới đâu? Cần lint spec riêng hay parser đủ nghiêm? | Xây generator |
| 2 | `gen:session` sinh skeleton hay sinh cả logic gameplay cơ bản? Sinh nhiều hơn thì review đắt hơn | Phạm vi P1 |
| 3 | Có sinh Vue component skeleton từ section Entry points không? Hiện chưa nằm trong phạm vi | P1 UI |
| 4 | `gen:check` chạy trong pre-commit hay chỉ CI? Pre-commit nhanh hơn nhưng chậm commit | DX |
