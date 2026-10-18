---
spec: TYPE-SAFETY
title: An toàn kiểu và ranh giới dữ liệu
area: quality
status: implemented
mvp: true
phase: P0
reviewed: 2026-10-18
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

`any` xoá luôn câu hỏi kiểu. `unknown` không xoá câu hỏi nhưng cũng không trả lời nó: code
khai `unknown` đẩy việc mô tả hình dạng sang người đọc sau. Spec này cấm `any` ở mọi nơi,
kể cả file test; cấm khai báo `unknown` mới, bắt buộc dùng interface/type cụ thể, kiểu suy
ra từ schema Zod hoặc generic có ràng buộc; và biến ép kiểu thành nợ chỉ được giảm.

## 2. Actors

Dev · reviewer · cổng tự động `pnpm check`.

## 3. Entry points

`pnpm lint` (Biome) · `pnpm typecheck` (tsc + vue-tsc) · `scripts/check-type-safety.ts` (`scripts/check-type-safety.test.ts`) · rà soát trong code review.

## 4. Main flow

1. Dữ liệu ngoài vào hệ thống (body, query, param, response provider, file) đi thẳng vào
   schema Zod; code không khai thêm biến, tham số hay field kiểu `unknown` để giữ nó.
2. Zod parse ngay tại ranh giới. Fail → `VALIDATION_FAILED` 422 theo
   [`error-codes.md`](../00-foundation/error-codes.md) §7.7.
3. Từ sau parse, code chỉ làm việc với kiểu suy ra từ schema — không còn ép kiểu.
4. Cổng tự động đếm ép kiểu theo file, so với baseline; tăng thì fail.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Cần hình dạng mà TypeScript không diễn đạt được | Viết **hàm hẹp kiểu** trả `x is T`, không ép kiểu |
| Đọc field của lỗi hay object lạ | `Reflect.get` + kiểm `typeof`, không `as { code?: string }` |
| Dữ liệu đi tiếp tới một schema khác, không đọc ở đây | Khai bằng generic có ràng buộc hoặc kiểu suy ra từ schema đích, không khai `unknown` mới |
| Chỗ `unknown` đã có sẵn trong code | Nợ chỉ được giảm; sửa file nào thì thay bằng kiểu cụ thể ở file đó |
| Test double không dựng nổi kiểu thật | Khai interface cho phần double cần, hoặc ép kiểu **một lần** trong helper của test có chú thích lý do. Không `any`, không `as unknown as T` |
| Ép kiểu trong file đã có nợ | Không thêm chỗ mới; cổng chỉ cho số giảm |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TYP-01` | Cấm — **NEVER `any` tường minh** trong production code của `apps/*`, `packages/*` và `scripts/`. Ép bằng Biome `noExplicitAny` mức error và `scripts/check-type-safety.ts`. File test thuộc `BR-TYP-08` | `any` tắt mọi kiểm tra kiểu ở mọi chỗ giá trị đó đi qua, không chỉ dòng khai báo |
| `BR-TYP-02` | Ép kiểu (`as T`, `<T>x`, `as unknown as T`) là **nợ chỉ được giảm** — phần `as unknown as` được kiểm soát ratchet theo file bởi `scripts/check-type-safety.ts` | Không thêm chỗ ép kiểu mù mới; nợ hiện có chỉ được giảm |
| `BR-TYP-03` | Cấm — **NEVER khai báo `unknown` mới** (biến, tham số, kiểu trả về, field, type alias). Bắt buộc khai interface/type cụ thể, kiểu suy ra từ schema Zod, hoặc generic có ràng buộc. Chỗ `unknown` đã có là nợ chỉ được giảm qua `scripts/type-safety-baseline.json`. Không tính `catch (err)` — kiểu đó do TypeScript gán, không phải do người viết khai | `unknown` không mô tả hình dạng nào; mỗi chỗ khai `unknown` là một chỗ người đọc sau phải tự đoán dữ liệu. Khai kiểu cụ thể buộc người viết trả lời câu hỏi đó ngay, ở chỗ họ biết rõ nhất |
| `BR-TYP-04` | Mọi route `/api/*` đọc **body** phải Zod parse trong cùng file. Ép bằng `apps/web/tests/security/security-checklist.test.ts` | `BR-SEC-04` đã yêu cầu điều này từ P0 |
| `BR-TYP-05` | Cấm — **NEVER `as const` bị tính là nợ** | `as const` làm kiểu **hẹp lại**, không nói dối; ngược hoàn toàn với `as T` |
| `BR-TYP-06` | Cấm — **NEVER mass assignment**: map từng field từ dữ liệu đã parse sang bản ghi | `BR-SEC-05` |
| `BR-TYP-07` | Cổng mới BẮT BUỘC có **ca âm** trong test: một mẫu vi phạm phải làm cổng fail | Cổng không có ca âm là cổng chưa biết mình có chạy hay không (`ultracite check` từng exit 0 với lỗi lint thật) |
| `BR-TYP-08` | Cấm — **NEVER `any` tường minh trong file test**, giống production code. Cưỡng chế bằng cổng ratchet theo file tại `scripts/check-type-safety.ts` + `scripts/check-type-safety.test.ts` | Test dùng `any` thì mock lệch kiểu thật mà vẫn xanh — test khẳng định một hình dạng không còn tồn tại |

## 7. Data

### 7.1 Ngưỡng theo vùng code

| Vùng | `any` | Ép kiểu `as T` | Khai `unknown` mới |
|---|:--:|---|---|
| `apps/*/server` | Cấm | Nợ, chỉ giảm | Cấm |
| `apps/*/app` | Cấm | Nợ, chỉ giảm | Cấm |
| `packages/*/src` | Cấm | Nợ, chỉ giảm | Cấm |
| `scripts/` | Cấm | Nợ, chỉ giảm | Cấm |
| Đường dẫn test | Cấm (`BR-TYP-08`) — ratchet theo file | Được một lần trong helper, có chú thích; không `as unknown as T` | Cấm |

### 7.2 Baseline nợ ép kiểu (2026-10-18)

| Vùng | Số chỗ |
|---|---:|
| `packages/*` | 352 |
| `apps/web/server` | 335 |
| `apps/web/app` | 73 |
| `apps/admin` | 65 |
| `apps/worker` | 21 |
| `scripts/` | 5 |
| **Tổng (không kể test), 235 file** | **851** |
| `any` tường minh (`BR-TYP-01` / `BR-TYP-08`) | **112** (theo `scripts/type-safety-baseline.json`) |
| Khai báo `unknown` (`BR-TYP-03`) | **590** (theo `scripts/type-safety-baseline.json`) |
| `as unknown as` (`BR-TYP-02`) | **50** (theo `scripts/type-safety-baseline.json`) |

### 7.2a Sổ nợ route chưa validate body (2026-08-17)

Sổ nợ đã **rỗng** trước khi bị gỡ: cả 24 route đều đã Zod parse body. Cổng hiện tại
(`apps/web/tests/security/security-checklist.test.ts`, `BR-SEC-04`) assert danh sách vi phạm
bằng rỗng — thêm route đọc body mà quên parse là test đỏ ngay, KHÔNG còn sổ nợ để trốn vào.

### 7.3 Thay ép kiểu bằng gì

| Thay vì | Dùng |
|---|---|
| `(body.x as string)` | Zod schema rồi đọc `input.x` |
| `(err as { code?: string }).code` | `readPostgresErrorCode(err)` — `Reflect.get` + `typeof` |
| `(event as Record<string, unknown>)._body` | `readRequestBody(event)` rồi parse bằng schema của route |
| `data as ApiResponse` | `apiResponseSchema.parse(data)` |
| `x as unknown as T` | Hàm hẹp kiểu `isT(x): x is T` |

### 7.4 `unknown` đã có trong code

Các chỗ dưới đây có từ trước `BR-TYP-03` và là nợ, không phải mẫu để chép:

- `readRequestBody()` trả `unknown` — người gọi buộc phải parse.
- `content_pack: z.record(z.string(), z.unknown())` — hình dạng thuộc
  `content_contract` của game template, route trung chuyển chứ không đọc.
- `AuthErrorDetails = Readonly<Record<string, unknown>> | string` — details tuỳ mã lỗi.

`catch (err)` không nằm trong danh sách: TypeScript tự gán `unknown`, người viết không khai.

## 8. API contract

Không có route. Ràng buộc lên cổng tự động:

```
biome noExplicitAny                              → BR-TYP-01, mức error, đã bật (trừ file test)
scripts/typecheck/typecheck-gate.ts              → tsc + vue-tsc, nợ chỉ được giảm
scripts/check-type-safety.ts                     → BR-TYP-01, BR-TYP-02 (as unknown as), BR-TYP-03 (unknown), BR-TYP-08 (test any)
apps/web/tests/security/security-checklist.test  → BR-TYP-04 (body), qua BR-SEC-04
```

## 9. Acceptance criteria

```gherkin
Scenario: BR-TYP-01 — any tường minh chặn merge
  Given một file thêm `function f(x: any)`
  When chạy pnpm lint
  Then Biome báo lint/suspicious/noExplicitAny
  And cổng exit khác 0

Scenario: BR-TYP-08 — any tường minh trong file test chặn merge
  Given một file `*.test.ts` thêm `function f(x: any)`
  When chạy cổng check-type-safety
  Then cổng fail và chỉ ra file, rule BR-TYP-08

Scenario: BR-TYP-03 — khai unknown mới chặn merge
  Given một file trong apps/ thêm `function f(x: unknown): void`
  When chạy cổng đo khai báo unknown (scripts/check-type-safety.ts)
  Then cổng fail và chỉ ra file, dòng đó

> **CHƯA CÓ CỔNG.** `lint:type-safety` bị gỡ cùng `packages/gates` ngày 2026-08-29,
> đúng như §8 của chính file này đã ghi. Bốn kịch bản `BR-TYP-02` / `BR-TYP-05` dưới đây
> mô tả một cổng **không còn tồn tại** — giữ lại làm đặc tả cho lần dựng lại, Cấm — NEVER
> đọc chúng như phép kiểm đang chạy. Sổ nợ: [`runtime-gates.md`](runtime-gates.md) §3.
>
> ```gherkin
> Scenario: BR-TYP-02 — thêm ép kiểu mới thì fail
> Scenario: BR-TYP-02 — bớt ép kiểu thì xanh
> Scenario: BR-TYP-02 — file mới có ép kiểu thì fail
> Scenario: BR-TYP-05 — as const không bị tính
> ```

Scenario: BR-TYP-04 — route đọc body mà không parse thì fail
  Given một route gọi readBody nhưng không có safeParse hay parse nào
  When chạy `pnpm test --filter @mindkid/web` (cổng ở apps/web/tests/security/)
  Then cổng fail và chỉ ra route đó

Scenario: BR-TYP-07 — cổng có ca âm
  When chạy test của hai script cổng
  Then mỗi script có ít nhất một ca mẫu vi phạm làm cổng fail
```

## 10. Boundaries

**Always**
- Parse dữ liệu ngoài bằng Zod ngay tại ranh giới.
- Khai interface/type cụ thể hoặc generic có ràng buộc cho mọi function, tham số, kiểu trả về.
- Map từng field từ dữ liệu đã parse.
- Viết hàm hẹp kiểu khi cần hình dạng phức tạp.

**Ask first**
- Nâng bất kỳ số trong baseline §7.2.
- Thêm vùng code vào diện miễn cổng.
- Tắt `noExplicitAny` cho một file.

**Never**
- `any` tường minh, kể cả trong file test.
- Khai báo `unknown` mới.
- `as any` hay `as unknown as T` để trốn lỗi kiểu.
- Ép kiểu để im lặng một lỗi kiểu.
- Đọc field từ `unknown` mà chưa hẹp kiểu.
- Ghi baseline mới khi số tăng.
- Thêm cổng mà không có ca âm.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Có hạ nợ ép kiểu về 0 cho `packages/taxonomy` (88 chỗ, nhiều nhất) trước P2 không, hay để nguyên tới khi sửa từ vựng tag? | Nợ `BR-TYP-02` | P2 | Backend |
| 2 | Có cần cổng riêng cấm `@ts-expect-error` không, hay `noTsIgnore` của Biome là đủ? | — | P2 | Backend |
