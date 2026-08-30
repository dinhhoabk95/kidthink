# Task #112 — Gỡ `packages/gates`

## 1. Vì sao

Yêu cầu người dùng, ngày 2026-08-29: *"Việc check lint chỉ cần theo biome hoặc vue-tsc
có được không. còn toàn bộ phải bỏ lint check thừa thải này"*, và sau đó *"đổi spec để
xóa đi toàn bộ do dư thừa code"*.

Package bị gỡ, đo trước khi xoá:

| Số đo | Giá trị |
|---|---|
| File tracked | 97 |
| Dòng TypeScript | 10.713 |
| Test case | 253 trong 24 file |
| Rule `BR-*` được cưỡng chế | 96 |
| Rule `C1`–`C18` (corpus spec) | 18 |

## 2. Cái gì được giữ, vì sao

Hai thứ trong package **không phải** lint tuỳ biến — chúng bị gỡ thì mất luôn `vue-tsc`
và một cổng bảo mật.

| Giữ | Chuyển tới | Vì sao |
|---|---|---|
| `typecheck-gate.ts` · `typecheck-delta.ts` · `ratchet.ts` · `typecheck-baseline.json` | `scripts/typecheck/` | Đây **chính là** `vue-tsc`: không workspace nào có script `typecheck` riêng, cả 10 project chạy qua file này |
| `findUnvalidatedRoutes` | `apps/web/tests/security/route-validation.ts` | `BR-SEC-04` — route `/api/*` đọc body phải Zod parse. Viết lại tự chứa, hết phụ thuộc package cũ |

Baseline có sẵn **2.950 lỗi** kiểu tại thời điểm gỡ (chốt lại còn **2.948** — con số **2.931** ghi ở đây và ở `CLAUDE.md` sai, sửa 2026-08-30; sau khi bỏ 5 mục trỏ `packages/gates` và một lượt giảm ở `admin:app`). Bỏ bậc thang thì `pnpm typecheck`
đỏ ngay từ lần chạy đầu, nên bậc thang được giữ nguyên.

## 3. Cổng còn lại — đây là toàn bộ

| Lệnh | Đo gì | Exit đo 2026-08-29 |
|---|---|---|
| `pnpm lint` | Biome, 1.312 file | 0 |
| `pnpm lint:deps` | dependency-cruiser, 1.529 module | 0 |
| `pnpm typecheck` | `tsc` + `vue-tsc`, 10 project, bậc thang nợ | 0 |
| `pnpm test` | Unit/integration + cổng trong `<workspace>/tests/gates/` | 1 (đỏ có sẵn, xem mục 5) |
| `pnpm test:deploy` | Script hạ tầng | chưa đo lại |

Hai cổng được giữ đều có **ca âm** đo thật:

- Hạ một số trong `typecheck-baseline.json` → cổng đỏ `admin:app +1`, exit 1.
- Thêm route `/api/users/__negcase.post.ts` đọc body không parse → `BR-SEC-04` đỏ, exit 1.

## 4. Cái gì mất — nói thẳng

❌ KHÔNG còn cổng nào đo: corpus spec (frontmatter, section, link nội bộ, mã lỗi, ID
rule), từ vựng người dùng, design token và hex literal, ép kiểu `as T` (`BR-TYP-02`),
`any` trong file test (`BR-TYP-08`), ranh giới runtime, tên biến môi trường, giá, mặt
công khai cho trẻ, convention workspace, so spec ↔ code (`BR-AIG-06`).

Những rule đó **vẫn là luật** trong `docs/specs/` — nhưng luật không có cổng thì trôi,
và người review là hàng phòng thủ duy nhất.

## 5. Nợ đã biết, không do task này

`packages/db/tests/gates/thinking-coverage.test.ts` đỏ trước và sau khi gỡ. Corpus seed
thiếu phủ tư duy — nợ nội dung, không phải nợ cổng.

## 6. Spec đã sửa

| File | Sửa gì |
|---|---|
| [`READING-GUIDE.md`](../specs/READING-GUIDE.md) | Xoá §5 (bảng `C1`–`C13`), đánh số lại §6–10 → §5–9 |
| [`CONVENTIONS.md`](../specs/CONVENTIONS.md) | Bỏ ký hiệu `Cn`, đổi ví dụ trỏ file đã xoá, bước 9 thành lượt đọc của người |
| [`business-rules.md`](../specs/00-foundation/business-rules.md) | 4 rule `BR-REG2-*` không còn cổng; thêm câu hỏi mở #2 về `status: implemented` |
| [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) | §7.6 viết lại — cổng chéo repo bị cấm dựng lại; §8 liệt kê lệnh thật |
| [`type-safety.md`](../specs/08-quality/type-safety.md) | `BR-TYP-02`/`BR-TYP-08` mất cổng; `BR-TYP-04` thu về phạm vi body; sổ nợ route đã rỗng |
| [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) | `BR-DSC-02` chuyển sang grep tay, §7.5 nêu rõ đó là toàn bộ phần cưỡng chế |
| [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) | `BR-ENG-04` chuyển sang grep tay |
| [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) | `BR-AIG-06` thành rule chết; ghi rõ cả pipeline `gen:*` **chưa từng được dựng** |
| [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) | Bản ghi lịch sử, giữ nguyên nghĩa |
| [`SPEC.md`](../SPEC.md) · [`AGENTS.md`](../../AGENTS.md) | Bảng lệnh viết lại theo `package.json` thật |

## 7. Cố tình không làm

199 file trong `docs/tasks/` còn nhắc `packages/gates`. Chúng là **bản ghi lịch sử** của
việc đã làm — sửa chúng là viết lại lịch sử, và sửa hàng loạt bằng `sed` trên corpus là
lỗi đã trả giá một lần. File này là bản ghi chính thức của việc gỡ; ai đọc task cũ và
thắc mắc thì tra về đây.

## 8. Câu hỏi còn mở

| # | Câu hỏi | Chủ |
|---|---|---|
| 1 | `business-rules.md` còn xứng `status: implemented` không, khi `BR-REG2-*` mất cổng? | mở |
| 2 | Bốn rule mất cổng nhưng có `grep` thay thế (`BR-DSC-02`, `BR-ENG-04`) có nên vào `pnpm check` dạng một dòng grep không? | mở |

## Bổ sung 2026-08-30 — danh sách nợ §4 chưa đủ

Lượt review Task #109→#129 đối chiếu 75 file đã xoá với cổng còn lại và tìm thấy **tám**
khoản mất cưỡng chế không có trong §4, trong đó `BR-MFA-13` là khoản nặng nhất:
spec `mfa.md` §7 nói rõ sai khoá TOTP hỏng **im lặng**, nên phép quét tĩnh là detector
duy nhất. Đã khôi phục tại `apps/web/tests/gates/mfa-key-custody.ts`.

Bảy khoản còn lại: `BR-PRF-01/02/08`, `BR-EMJ-03`, vệ sinh script shell, vệ sinh
đường dẫn import, 24 rule manifest `BR-APM/ASC/OCP/OFF/PWA/RBL`, và nửa phần quét của
`BR-GAT-01`.

Bảng đủ nay ở [`docs/specs/08-quality/runtime-gates.md`](../specs/08-quality/runtime-gates.md) §3.
