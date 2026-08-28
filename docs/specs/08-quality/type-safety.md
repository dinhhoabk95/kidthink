---
spec: TYPE-SAFETY
title: An toàn kiểu và ranh giới dữ liệu
area: quality
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-17
owns:
  - Ngưỡng dùng any, unknown và ép kiểu, cùng cổng ép ngưỡng
  - Quy tắc dữ liệu vào phải qua schema trước khi đọc
depends_on:
  - SECURITY-CHECKLIST
  - ERROR-CODES
  - MONOREPO-PACKAGE-ARCHITECTURE
---

# An toàn kiểu và ranh giới dữ liệu

## 1. Objective

Ép kiểu là **nói dối trình biên dịch**. `(body.age_min as number)` không kiểm gì; nó chỉ
tắt phần kiểm tra duy nhất đang bảo vệ mình. Khi client gửi `age_min: "ba"`, giá trị đó
đi thẳng vào cột `integer` và lỗi nổ ở tầng DB — cách xa chỗ sai, với thông báo không
ai đọc được.

`unknown` thì khác `any`. `unknown` là **thừa nhận đúng sự thật** rằng dữ liệu chưa được
kiểm; nó buộc phải hẹp kiểu trước khi đọc. `any` xoá luôn câu hỏi. Spec này cho `unknown`
ở ranh giới, cấm `any` ở mọi nơi, và biến ép kiểu thành nợ chỉ được giảm.

## 2. Actors

Dev · reviewer · cổng tự động `pnpm check`.

## 3. Entry points

`pnpm lint` (Biome) · `pnpm typecheck` (tsc + vue-tsc) · rà soát trong code review.

## 4. Main flow

1. Dữ liệu ngoài vào hệ thống (body, query, param, response provider, file) được đọc ra
   dưới dạng `unknown`.
2. Zod parse ngay tại ranh giới. Fail → `VALIDATION_FAILED` 422 theo
   [`error-codes.md`](../00-foundation/error-codes.md) §7.7.
3. Từ sau parse, code chỉ làm việc với kiểu suy ra từ schema — không còn ép kiểu.
4. Cổng tự động đếm ép kiểu theo file, so với baseline; tăng thì fail.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Cần hình dạng mà TypeScript không diễn đạt được | Viết **hàm hẹp kiểu** trả `x is T`, không ép kiểu |
| Đọc field của lỗi hay object lạ | `Reflect.get` + kiểm `typeof`, không `as { code?: string }` |
| Dữ liệu đi tiếp tới một schema khác, không đọc ở đây | Giữ `unknown` — đúng chỗ dùng |
| Test double không dựng nổi kiểu thật | Ép kiểu **một lần** trong helper của test, có chú thích lý do |
| Ép kiểu trong file đã có nợ | Không thêm chỗ mới; cổng chỉ cho số giảm |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TYP-01` | Cấm — **NEVER `any` tường minh** trong `apps/*` và `packages/*`. Ép bằng Biome `noExplicitAny` mức error | `any` tắt mọi kiểm tra kiểu ở mọi chỗ giá trị đó đi qua, không chỉ dòng khai báo |
| `BR-TYP-02` | Ép kiểu (`as T`, `<T>x`) là **nợ chỉ được giảm** — nhưng KHÔNG còn cổng nào đếm (gỡ 2026-08-29). Còn là luật cho reviewer, không phải cổng máy | 840 chỗ hiện có không sửa được trong một PR; cấm tuyệt đối ngay là cổng ai cũng tắt |
| `BR-TYP-03` | `unknown` **được phép và được khuyến khích** ở ranh giới hệ thống, nhưng phải qua schema parse hoặc hàm hẹp kiểu trước khi đọc field | `unknown` là lời thừa nhận trung thực; cấm nó sẽ đẩy người viết về `any` hoặc ép kiểu — tệ hơn hẳn |
| `BR-TYP-04` | Mọi route `/api/*` đọc **body** phải Zod parse trong cùng file. Ép bằng `apps/web/tests/security/security-checklist.test.ts`. Query và param KHÔNG được cổng nào đo | `BR-SEC-04` đã yêu cầu điều này từ P0 nhưng không có cổng nào đo |
| `BR-TYP-05` | Cấm — **NEVER `as const` bị tính là nợ** | `as const` làm kiểu **hẹp lại**, không nói dối; ngược hoàn toàn với `as T` |
| `BR-TYP-06` | Cấm — **NEVER mass assignment**: map từng field từ dữ liệu đã parse sang bản ghi | `BR-SEC-05` |
| `BR-TYP-07` | Cổng mới BẮT BUỘC có **ca âm** trong test: một mẫu vi phạm phải làm cổng fail | Cổng không có ca âm là cổng chưa biết mình có chạy hay không (`ultracite check` từng exit 0 với lỗi lint thật) |
| `BR-TYP-08` | `any` trong file test là **nợ chỉ được giảm** — cổng đếm đã gỡ 2026-08-29, giờ KHÔNG ai ép | Biome **tắt** `noExplicitAny` cho đường dẫn test, nên `BR-TYP-01` không phủ tới đó. 560 chỗ hiện có giờ trôi tự do |

## 7. Data

### 7.1 Ngưỡng theo vùng code

| Vùng | `any` | Ép kiểu `as T` | `unknown` |
|---|:--:|---|---|
| `apps/*/server` | Cấm | Nợ, chỉ giảm | Được ở ranh giới |
| `apps/*/app` | Cấm | Nợ, chỉ giảm | Được |
| `packages/*/src` | Cấm | Nợ, chỉ giảm | Được |
| `scripts/` | Cấm | Nợ, chỉ giảm | Được |
| Đường dẫn test | **Nợ, chỉ giảm** (`BR-TYP-08`) — Biome không phủ tới đây | Ngoài baseline — test double cần ép kiểu để dựng mock | Được |

Cột `any` của đường dẫn test **không phải "Cấm"**: `noExplicitAny` của ultracite tắt ở
đó. Kiểm bằng file thử — cùng đoạn `function f(x: any)` bị Biome bắt ở
`apps/web/server/` và im lặng ở `apps/web/tests/`. Nên `any` trong test đi theo cùng cơ
chế bậc thang với ép kiểu.

### 7.2 Baseline nợ ép kiểu (2026-08-17)

| Vùng | Số chỗ |
|---|---:|
| `packages/*` | 352 |
| `apps/web/server` | 335 |
| `apps/web/app` | 73 |
| `apps/admin` | 65 |
| `apps/worker` | 21 |
| `scripts/` | 5 |
| **Tổng (không kể test), 235 file** | **851** |
| `any` trong 94 file test (`BR-TYP-08`) | **560** |

Số trên là ảnh chụp 2026-08-17. Baseline (`type-safety-baseline.json`) và cổng đọc nó đã bị
gỡ 2026-08-29, nên các số này KHÔNG còn được cập nhật hay đối chiếu với thực tế.

### 7.2a Sổ nợ route chưa validate body (2026-08-17)

Sổ nợ đã **rỗng** trước khi bị gỡ: cả 24 route đều đã Zod parse body. Cổng hiện tại
(`apps/web/tests/security/security-checklist.test.ts`, `BR-SEC-04`) assert danh sách vi phạm
bằng rỗng — thêm route đọc body mà quên parse là test đỏ ngay, KHÔNG còn sổ nợ để trốn vào.

### 7.3 Thay ép kiểu bằng gì

| Thay vì | Dùng |
|---|---|
| `(body.x as string)` | Zod schema rồi đọc `input.x` |
| `(err as { code?: string }).code` | `readPostgresErrorCode(err)` — `Reflect.get` + `typeof` |
| `(event as Record<string, unknown>)._body` | `readRequestBody(event)` trả `unknown` |
| `data as ApiResponse` | `apiResponseSchema.parse(data)` |
| `x as unknown as T` | Hàm hẹp kiểu `isT(x): x is T` |

### 7.4 Ca dùng `unknown` hợp lệ

- `readRequestBody()` trả `unknown` — người gọi buộc phải parse.
- `catch (err: unknown)` — không ai biết được ném ra cái gì.
- `content_pack: z.record(z.string(), z.unknown())` — hình dạng thuộc
  `content_contract` của game template, route trung chuyển chứ không đọc.
- `AuthErrorDetails = Readonly<Record<string, unknown>> | string` — details tuỳ mã lỗi.

## 8. API contract

Không có route. Ràng buộc lên cổng tự động:

```
biome noExplicitAny                              → BR-TYP-01, mức error, đã bật
scripts/typecheck/typecheck-gate.ts              → tsc + vue-tsc, nợ chỉ được giảm
apps/web/tests/security/security-checklist.test  → BR-TYP-04 (body), qua BR-SEC-04
```

`BR-TYP-02` và `BR-TYP-08` KHÔNG còn cổng nào đo — cổng của chúng bị gỡ cùng
`packages/gates`. Cấm — NEVER thêm script `lint:*` riêng cho một rule
(TESTING-STRATEGY §7.6).

## 9. Acceptance criteria

```gherkin
Scenario: BR-TYP-01 — any tường minh chặn merge
  Given một file thêm `function f(x: any)`
  When chạy pnpm lint
  Then Biome báo lint/suspicious/noExplicitAny
  And cổng exit khác 0

Scenario: BR-TYP-02 — thêm ép kiểu mới thì fail
  Given một file đang có 3 chỗ ép kiểu trong baseline
  When thêm chỗ thứ 4
  Then lint:type-safety fail và chỉ ra đúng file đó

Scenario: BR-TYP-02 — bớt ép kiểu thì xanh
  Given cùng file đó giảm còn 1 chỗ
  When chạy lint:type-safety
  Then cổng xanh
  And nhắc chạy --update để hạ baseline

Scenario: BR-TYP-02 — file mới có ép kiểu thì fail
  Given một file chưa có trong baseline
  When file đó chứa một chỗ ép kiểu
  Then cổng fail

Scenario: BR-TYP-05 — as const không bị tính
  Given một file chỉ chứa `status: "draft" as const`
  When chạy lint:type-safety
  Then file đó không xuất hiện trong báo cáo nợ

Scenario: BR-TYP-04 — route đọc body mà không parse thì fail
  Given một route gọi readBody nhưng không có safeParse hay parse nào
  When chạy lint:route-validation
  Then cổng fail và chỉ ra route đó

Scenario: BR-TYP-07 — cổng có ca âm
  When chạy test của hai script cổng
  Then mỗi script có ít nhất một ca mẫu vi phạm làm cổng fail
```

## 10. Boundaries

**Always**
- Parse dữ liệu ngoài bằng Zod ngay tại ranh giới.
- Dùng `unknown` cho dữ liệu chưa kiểm, rồi hẹp kiểu.
- Map từng field từ dữ liệu đã parse.
- Viết hàm hẹp kiểu khi cần hình dạng phức tạp.

**Ask first**
- Nâng bất kỳ số trong baseline §7.2.
- Thêm vùng code vào diện miễn cổng.
- Tắt `noExplicitAny` cho một file.

**Never**
- `any` tường minh.
- Ép kiểu để im lặng một lỗi kiểu.
- Đọc field từ `unknown` mà chưa hẹp kiểu.
- Ghi baseline mới khi số tăng.
- Thêm cổng mà không có ca âm.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có hạ nợ ép kiểu về 0 cho `packages/taxonomy` (88 chỗ, nhiều nhất) trước P2 không, hay để nguyên tới khi sửa từ vựng tag? | Nợ `BR-TYP-02` | P2 | Backend |
| 2 | Có cần cổng riêng cấm `@ts-expect-error` không, hay `noTsIgnore` của Biome là đủ? | — | P2 | Backend |
