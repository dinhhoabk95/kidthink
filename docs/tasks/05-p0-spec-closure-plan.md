# Kế hoạch — Task #5: Đóng corpus spec P0 (11 spec `draft` cuối cùng)

> Viết 2026-08-07. Checklist thực thi: [`05-p0-spec-closure-todo.md`](05-p0-spec-closure-todo.md).
>
> Task đã lưu trữ:
> [`01-bootstrap-plan.md`](01-bootstrap-plan.md) ·
> [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) ·
> [`03-schema-contract-plan.md`](03-schema-contract-plan.md).
> Task #4 (viết lại corpus theo ngôn ngữ tự nhiên) đang mở ở [`plan.md`](plan.md) và
> [`todo.md`](todo.md) — quan hệ giữa hai task nằm ở mục "Quan hệ với Task #4" bên dưới.
>
> File này viết theo quy ước mà [`04-readability-spec.md`](04-readability-spec.md) đề xuất:
> không dùng ký hiệu emoji thay lời, không dùng chữ viết tắt tự phát, mọi tham chiếu tài liệu
> là liên kết bấm được. Riêng mã quyết định `D-*` được giữ vì nó là sổ cái liên task, đã dùng
> từ Task #1. Task #3 dừng ở `D-AE`, nên task này bắt đầu từ **`D-AF`**.
>
> Mọi lệnh chạy từ thư mục `mindkid/` và phải đặt lại đường dẫn Node trước, vì shell mặc định
> của máy là v20.17.0 còn dự án cần v24:
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Còn **11 spec `phase: P0` ở trạng thái `draft`**. Chúng là phần cuối của corpus P0. Khi cả 11
chuyển sang `approved`, roadmap P0 bước 8 (migration đầu tiên) và bước 10 (auth chạy end-to-end)
hết bị chặn ở tầng contract, và việc tiếp theo của dự án chuyển từ viết spec sang viết code.

Task này **không viết code**. Không đụng `packages/db/src/schema/*.ts`, không sinh migration.
Đúng như Task #3, phạm vi dừng ở contract.

Khối lượng đo được: 12 file (11 spec đích cộng một spec kéo thêm, giải thích ở `D-AF`),
**2.159 dòng**, **101 business rule**, **22 câu hỏi mở**, **30 cảnh báo `C6`** và
**2 cảnh báo `C3`**.

## Trạng thái nền đo được (2026-08-07)

| Đo | Kết quả |
|---|---|
| Nhánh | `main`, tracking `origin/main` tại `git@dinhhoabk95.github.com:dinhhoabk95/mindkid.git` |
| Commit gần nhất | `2a615bb` — thêm [`READING-GUIDE.md`](../specs/READING-GUIDE.md) |
| Working tree | Bẩn: `docs/tasks/plan.md`, `docs/tasks/todo.md`, `docs/tasks/04-readability-spec.md` chưa commit; hai file `03-schema-contract-*` là bản đổi tên chưa commit |
| `pnpm --filter @mindkid/gates test` | Xanh — 130 spec, 13 kiểm tra, **0 lỗi, 213 cảnh báo** |
| `pnpm test` | Xanh — **81/81** (2 file test) |
| `pnpm typecheck` | Xanh |
| Spec `approved` | **26/130**. Trong đó 23 spec `P0`, 2 spec `P1`, 1 spec `P2` |
| Spec `P0` | **34** tổng, **23 approved**, **11 draft** |

## 11 spec đích

| # | Spec | Dòng | Rule | Câu hỏi mở | `depends_on` đã `approved` chưa |
|---|---|---:|---:|---:|---|
| 1 | [`01-platform/emoji-registry`](../specs/01-platform/emoji-registry.md) | 200 | 10 | 3 | Rồi |
| 2 | [`01-platform/health-check`](../specs/01-platform/health-check.md) | 143 | 6 | 1 | Rồi |
| 3 | [`01-platform/rate-limiting`](../specs/01-platform/rate-limiting.md) | 151 | 7 | 2 | Rồi |
| 4 | [`01-platform/ai-codegen-pipeline`](../specs/01-platform/ai-codegen-pipeline.md) | 274 | 10 | 4 | Rồi |
| 5 | [`03-account/registration`](../specs/03-account/registration.md) | 193 | 11 | 2 | Rồi |
| 6 | [`03-account/login-and-session`](../specs/03-account/login-and-session.md) | 188 | 10 | 2 | Rồi |
| 7 | [`06-admin/admin-auth`](../specs/06-admin/admin-auth.md) | 168 | 8 | 2 | Rồi |
| 8 | [`08-quality/testing-strategy`](../specs/08-quality/testing-strategy.md) | 187 | 10 | 2 | Rồi |
| 9 | [`03-account/email-verification`](../specs/03-account/email-verification.md) | 141 | 8 | 1 | **Chưa** — cần `REGISTRATION` và `NOTIFICATION-SERVICE` |
| 10 | [`03-account/password-recovery`](../specs/03-account/password-recovery.md) | 169 | 12 | 1 | **Chưa** — cần `NOTIFICATION-SERVICE` |
| 11 | [`08-quality/security-checklist`](../specs/08-quality/security-checklist.md) | 180 | 9 | 2 | **Chưa** — cần `ACCESS-GATING` |

Spec kéo thêm vào phạm vi (lý do ở `D-AF`):

| # | Spec | Dòng | Rule | `phase` hiện tại | `depends_on` |
|---|---|---:|---:|---|---|
| 12 | [`01-platform/notification-service`](../specs/01-platform/notification-service.md) | 165 | 11 | `P2` | `JOB-QUEUE` và `CHILD-DATA-COMPLIANCE` — cả hai đã `approved` |

## Ràng buộc cứng: cổng `C8`

[`packages/gates/src/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) dòng 791 định nghĩa kiểm tra
`C8` — *"spec `approved` thì `depends_on` của nó cũng phải `approved`"*. Nó gọi `fail()`, không
phải `warn()`, nên vi phạm là **lỗi**, không phải cảnh báo, và làm `pnpm --filter @mindkid/gates test` trả mã
thoát khác 0. Lefthook chặn commit ở đó.

Hệ quả trực tiếp: **không thể đảo thứ tự tuỳ ý**. Đồ thị dưới đây là bắt buộc, không phải gợi ý.

```
  notification-service (D-AF: P2 -> P0, approve)
        |
        +--------------------+
        |                    |
   password-recovery    email-verification
                             ^
                             |
                        registration

  security-checklist  <-- D-AG: cắt cạnh phụ thuộc ACCESS-GATING

  emoji-registry · health-check · rate-limiting · ai-codegen-pipeline
  login-and-session · admin-auth · testing-strategy
        (bảy spec này không phụ thuộc gì trong lô, làm song song được)
```

## Hai quyết định phải chốt trước khi bắt đầu

### `D-AF` — [`notification-service.md`](../specs/01-platform/notification-service.md) chuyển từ `P2` sang `P0`, và được approve trong lô này

**Vấn đề đo được.** [`email-verification`](../specs/03-account/email-verification.md) và
[`password-recovery`](../specs/03-account/password-recovery.md) đều là `phase: P0` và đều
`depends_on: NOTIFICATION-SERVICE`, nhưng
[`notification-service`](../specs/01-platform/notification-service.md) là `phase: P2`. Đây là
**đảo ngược phase**: một spec P0 phụ thuộc một spec P2. Không thể approve hai spec P0 đó khi
phụ thuộc còn `draft`, vì `C8` sẽ đỏ.

**Vì sao phụ thuộc này là thật, không phải lỗi biên tập.** Xác thực email ở P0 nghĩa là gửi
một email ở P0. Roadmap P0 bước 10 ghi rõ "Auth end-to-end **bằng email/mật khẩu**" với bốn
spec [`registration.md`](../specs/03-account/registration.md), [`email-verification.md`](../specs/03-account/email-verification.md), [`login-and-session.md`](../specs/03-account/login-and-session.md), [`password-recovery.md`](../specs/03-account/password-recovery.md). Không có
kênh gửi thì bước 10 không chạy được. `phase: P2` trên [`notification-service.md`](../specs/01-platform/notification-service.md) là **sai**, không
phải phụ thuộc sai.

**Quyết định.** Đổi `phase: P2` thành `phase: P0` trên
[`notification-service`](../specs/01-platform/notification-service.md), cập nhật
[`index.md`](../specs/index.md) dòng 90, và approve nó trong lô này.

**Chi phí.** Một spec, 165 dòng, ba cảnh báo `C6`. Đồ thị phụ thuộc của nó là `JOB-QUEUE` và
`CHILD-DATA-COMPLIANCE`, **cả hai đã `approved`** — nên không có hiệu ứng dây chuyền. Đây là
cách rẻ nhất trong ba cách xử lý.

**Hai cách thay thế đã cân nhắc và loại.**

| Cách | Vì sao loại |
|---|---|
| Cắt cạnh, để [`email-verification.md`](../specs/03-account/email-verification.md) tự tả việc gửi email | Contract gửi email bị chép ở hai chỗ. [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §2: "Contract bị copy sẽ drift" |
| Tách một spec `email-channel` P0 mới ra khỏi [`notification-service.md`](../specs/01-platform/notification-service.md) | Thêm spec thứ 131 cho một việc mà spec sẵn có đã tả. `C11` kiểm số spec mỗi thư mục nên còn phải sửa [`SPEC.md`](../SPEC.md) §14 và [`index.md`](../specs/index.md) |

### `D-AG` — cắt cạnh [`security-checklist.md`](../specs/08-quality/security-checklist.md) → `ACCESS-GATING`

**Vấn đề đo được.** [`security-checklist`](../specs/08-quality/security-checklist.md) là
`phase: P0` nhưng `depends_on: ACCESS-GATING`, mà
[`access-gating`](../specs/04-play/access-gating.md) là `phase: P1`, `status: draft`. Cùng kiểu
đảo ngược phase như `D-AF`.

**Vì sao đây lại là phụ thuộc sai, khác với `D-AF`.** [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §3 định nghĩa
`depends_on` là "dùng để xếp thứ tự **implement**". [`security-checklist.md`](../specs/08-quality/security-checklist.md) không implement gating
— nó là danh sách kiểm mà reviewer chạy tay và cổng tự động chạy máy. Nó **nhắc tới** gating,
và §2 của cùng file quy ước nói cách nhắc tới đúng là **link**, không phải copy contract và
cũng không phải `depends_on`.

**Quyết định.** Xoá `ACCESS-GATING` khỏi `depends_on` của
[`security-checklist`](../specs/08-quality/security-checklist.md). Giữ nguyên mọi tham chiếu
gating trong phần văn xuôi và đổi chúng thành liên kết bấm được tới
[`access-gating`](../specs/04-play/access-gating.md).

**Cách thay thế nếu chủ dự án không đồng ý.** Kéo [`access-gating.md`](../specs/04-play/access-gating.md) vào lô này và approve nó luôn.
Chi phí thấp hơn tưởng: 204 dòng, và đồ thị phụ thuộc của nó (`ACCESS-LADDER`,
`ENTITLEMENT-MODEL`, `ACTORS`) **đã `approved` hết** nên cũng không có dây chuyền. Rủi ro là
approve sớm một contract gating chưa gặp [`game-level-model.md`](../specs/05-content/game-level-model.md) (vẫn `draft`, `P1`) — đúng loại rủi
ro mà Task #3 gọi tên: ký vào bản thiết kế mà bước sau chắc chắn phải đảo.

**Giả định ghi vào file thay vì hỏi.** Task này đi theo `D-AF` và `D-AG` như viết ở trên. Nếu
chủ dự án đảo một trong hai, chỉ bước 1 và bước 2 đổi; mười ba bước còn lại không đổi.

## Quy trình chuẩn cho một spec

Mỗi spec đi qua đúng bảy việc này. Đây là vòng lặp mà Task #2 và Task #3 đã chạy, viết lại cho
gọn.

1. **Đọc hết file.** Không đọc lướt. Ghi lại số dòng, số rule, số câu hỏi mở.
2. **Đối chiếu với các quyết định đã chốt sau ngày `reviewed`.** Mọi spec trong lô có
   `reviewed: 2026-08-04` hoặc `2026-08-05`, tức viết **trước** 30 quyết định `D-A` đến `D-AE`
   của Task #2 và Task #3. Danh sách cần đối chiếu: định dạng mã ở
   [`id-conventions`](../specs/00-foundation/id-conventions.md) §7, quy tắc khoá ngoại dùng
   `id` (`D-AE`), kiến trúc Sidebase Local + JWT access + refresh-token rotation hiện hành ở
   [`auth-tokens-sessions`](../specs/01-platform/auth-tokens-sessions.md) §7.4, và bản đồ bảng
   ở [`data-model-overview`](../specs/01-platform/data-model-overview.md) §7.
3. **Sửa cảnh báo `C6`** — điền cột "vì sao" cho mọi rule đang trống. Không xoá rule để hết
   cảnh báo. [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §5: rule không có "vì sao" sẽ bị người sau xoá nhầm.
4. **Chạy checklist review** [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10, đủ mười một mục.
5. **Xử lý từng câu hỏi mở ở section 11.** Câu nào chặn P0 thì phải chốt và ghi quyết định vào
   sổ cái. Câu nào chặn P1 trở đi thì để nguyên, ghi rõ nó chặn gì.
6. **Đổi `status: draft` thành `status: approved` và cập nhật `reviewed` sang ngày làm.**
7. **Chạy `pnpm --filter @mindkid/gates test` và `pnpm test`, cả hai phải xanh, rồi commit một spec một commit.**

Một spec một commit. Task #3 làm vậy và khi `T11a` sai thì `git revert` gọn đúng một file.

## Các bước

### Bước 0 — Chứng minh cổng `C8` đỏ được

`C8` là ràng buộc mà toàn bộ thứ tự của task này dựa vào, và nó **chưa từng đỏ một lần nào** —
hiện chưa có spec `approved` nào có phụ thuộc `draft`. Một cổng chưa từng đỏ là một cổng chưa
được chứng minh. Bài học `ultracite` còn nguyên giá trị: `ultracite check` trả mã thoát 0 dù có
lỗi lint, và không ai biết cho tới khi có người viết ca âm.

Thêm ca âm vào [`packages/gates/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts):
gọi `checkC8` với một spec giả `approved` phụ thuộc một spec giả `draft`, khẳng định nó sinh ra
đúng một violation. Thêm ca dương: phụ thuộc `approved` thì không sinh gì.

**Tiêu chí chấp nhận.** `pnpm test` báo số test tăng từ 81 lên ít nhất 83. Xoá thân hàm
`checkC8` làm test mới đỏ.

**Vì sao đặt ở bước 0.** Nếu `C8` không hoạt động thì bước 1 và bước 2 giải một bài toán không
tồn tại, và ba spec ở cuối lô có thể approve thẳng mà không cần `D-AF`.

### Bước 1 — `D-AF`: [`notification-service.md`](../specs/01-platform/notification-service.md)

Đổi `phase`, sửa ba cảnh báo `C6` (`BR-NOT-03`, `BR-NOT-07`, `BR-NOT-08`), cập nhật
[`index.md`](../specs/index.md) dòng 90, approve.

**Tiêu chí chấp nhận.** [`notification-service.md`](../specs/01-platform/notification-service.md) có `status: approved` và `phase: P0`.
[`index.md`](../specs/index.md) ghi `P0`. `pnpm --filter @mindkid/gates test` còn 0 lỗi.

### Bước 2 — `D-AG`: cắt cạnh của [`security-checklist.md`](../specs/08-quality/security-checklist.md)

Xoá `ACCESS-GATING` khỏi `depends_on`. Đổi các tham chiếu gating trong văn xuôi thành liên kết.
Chưa approve ở bước này — [`security-checklist.md`](../specs/08-quality/security-checklist.md) còn năm cảnh báo `C6` và một cảnh báo `C3`, xử lý
ở bước 13.

**Tiêu chí chấp nhận.** `depends_on` còn đúng hai mục. `C4` (link nội bộ resolve) vẫn xanh.

### Cổng dừng A — sau bước 0 đến 2

`D-AF` và `D-AG` là thay đổi contract: một cái đổi `phase` của spec, một cái xoá cạnh phụ thuộc.
[`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) `BR-RBS-08` nói đổi contract thì đổi spec trước, và cả hai đều đang làm đúng
thế — nhưng chúng cũng là hai chỗ duy nhất trong task này mà **người phải đồng ý**, vì phần còn
lại chỉ là đọc, điền "vì sao", và lật cờ.

- [ ] Chủ dự án xác nhận `D-AF` và `D-AG`
- [ ] `pnpm --filter @mindkid/gates test` 0 lỗi, `pnpm test` xanh với ca âm `C8` mới

### Bước 3 đến 6 — Nhóm A: bốn spec `01-platform`

Bốn spec này không phụ thuộc nhau, làm theo thứ tự khối lượng giảm dần.

| Bước | Spec | Điểm cần soi kỹ |
|---|---|---|
| 3 | [`ai-codegen-pipeline`](../specs/01-platform/ai-codegen-pipeline.md) (274 dòng) | Cảnh báo `C3`: section 5 đang tên "Vùng cấm — AI không sinh code" thay vì "Alternative flows". Phải chốt đổi tên về chuẩn hay ghi nhận ngoại lệ. Sáu vùng cấm ở section 5 phải khớp [`SPEC.md`](../SPEC.md) §0 `D8` |
| 4 | [`emoji-registry`](../specs/01-platform/emoji-registry.md) (200 dòng) | Là dữ liệu Lớp 1, admin chỉ đọc. Mã emoji phải khớp regex [`id-conventions.md`](../specs/00-foundation/id-conventions.md) §7. Bước 9 roadmap P0 seed nó cùng taxonomy |
| 5 | [`rate-limiting`](../specs/01-platform/rate-limiting.md) (151 dòng) | Nhắc `packages/cache` — phải khớp tên package thật ở [`monorepo-package-architecture`](../specs/00-foundation/monorepo-package-architecture.md) §7.1. Quy tắc fail-open cho route thường và fail-closed cho auth phải khớp [`error-codes.md`](../specs/00-foundation/error-codes.md) |
| 6 | [`health-check`](../specs/01-platform/health-check.md) (143 dòng) | Câu hỏi 1 (tách `/health/live` và `/health/ready`) chặn vận hành, nên chốt luôn ở đây thay vì để mở |

### Bước 7 đến 10 — Nhóm B: chuỗi auth `03-account`

Thứ tự trong nhóm này **không đảo được**: [`email-verification.md`](../specs/03-account/email-verification.md) `depends_on: REGISTRATION`.

| Bước | Spec | Điểm cần soi kỹ |
|---|---|---|
| 7 | [`registration`](../specs/03-account/registration.md) (193 dòng) | Hai checkbox đồng ý phải khớp [`child-data-compliance`](../specs/00-foundation/child-data-compliance.md). Câu hỏi 1 đã gạch bỏ và chốt 2026-08-05, xác nhận phần gạch bỏ vẫn đọc được đúng |
| 8 | [`login-and-session`](../specs/03-account/login-and-session.md) (188 dòng) | Đây là spec rủi ro nhất trong nhóm. Quyết định vận chuyển cũ ngày 2026-08-06 đã được Sidebase Local + JWT thay thế ngày 2026-08-09; phải đối chiếu từng dòng với [`auth-tokens-sessions`](../specs/01-platform/auth-tokens-sessions.md) §7.4 |
| 9 | [`password-recovery`](../specs/03-account/password-recovery.md) (169 dòng) | Mở khoá bởi bước 1. Quy tắc "luôn trả 200" và "giết mọi phiên" phải khớp [`login-and-session.md`](../specs/03-account/login-and-session.md) sau khi bước 8 xong |
| 10 | [`email-verification`](../specs/03-account/email-verification.md) (141 dòng) | Mở khoá bởi bước 1 và bước 7. Điều kiện tạo hồ sơ trẻ phải khớp [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) |

### Bước 11 và 12 — Nhóm C

| Bước | Spec | Điểm cần soi kỹ |
|---|---|---|
| 11 | [`admin-auth`](../specs/06-admin/admin-auth.md) (168 dòng) | Bốn cảnh báo `C6`, nhiều nhất nhóm. TOTP dùng `otpauth`, tách khỏi Sidebase Local. Cookie, issuer và secret của `apps/admin` phải khác `apps/web` ở tầng crypto. Câu hỏi 2 (xoay mật khẩu Manager đầu tiên) chặn go-live nhưng cũng chặn script seed ở P0 — chốt luôn |
| 12 | [`testing-strategy`](../specs/08-quality/testing-strategy.md) (187 dòng) | Câu hỏi 1 tự ghi là chặn P0, nên bắt buộc chốt. Ba cảnh báo `C6`. Ngưỡng phủ test ở đây là ngưỡng mà mọi task sau phải đạt |

### Bước 13 — [`security-checklist.md`](../specs/08-quality/security-checklist.md)

Làm sau cùng trong các spec vì nó tham chiếu nhiều spec khác nhất và vì `D-AG` phải xong trước.
Năm cảnh báo `C6` và một cảnh báo `C3` (section 7 đang tên "Checklist" thay vì "Data").

Câu hỏi 2 — *"khi chỉ có một dev thì review người thứ hai thực hiện thế nào"* — không được để
mở. `BR-SEC-08` chặn merge dựa vào nó, và một rule chặn merge mà không ai biết cách thoả là
một rule sẽ bị tắt trong lần đầu nó cản việc.

### Cổng dừng B — sau bước 13

- [ ] 12/12 spec `approved`
- [ ] `pnpm --filter @mindkid/gates test` 0 lỗi, và số cảnh báo giảm ít nhất 30 so với 213 của mức nền
- [ ] `pnpm test` xanh
- [ ] Mọi quyết định mới ghi vào sổ cái, đánh số tiếp từ `D-AF`

### Bước 14 — Đối chiếu tay và đóng sổ

Cổng máy không bắt được mọi thứ. Task #3 chạy một bước đối chiếu tay tương tự và tìm ra hai chỗ
lệch mà mười một kiểm tra tự động bỏ qua.

1. Đếm lại: `phase: P0` phải ra **35** spec, `status: approved` trong nhóm đó phải ra **35**.
2. Tổng `approved` toàn corpus phải ra **38/130**.
3. [`index.md`](../specs/index.md) phải khớp `phase` mới của [`notification-service.md`](../specs/01-platform/notification-service.md).
4. [`roadmap.md`](../specs/roadmap.md) P0 bước 10 phải nhắc [`notification-service.md`](../specs/01-platform/notification-service.md) như phụ
   thuộc, hiện chưa nhắc.
5. Mọi `BR-*` mới thêm cột "vì sao" phải có mặt trong
   [`business-rules.md`](../specs/00-foundation/business-rules.md).
6. Đọc lại 30 cột "vì sao" vừa viết, hỏi từng cái: *nếu người sau đọc mỗi câu này, họ có hiểu
   vì sao không được xoá rule không?*

### Cổng dừng C — kết thúc task

- [ ] 35/35 spec P0 `approved`
- [ ] `pnpm check`, `pnpm test`, `pnpm --filter @mindkid/gates test` xanh cả ba
- [ ] Đã push lên `origin/main`
- [ ] Corpus P0 đóng. Việc tiếp theo của dự án là roadmap P0 **bước 8 — migration đầu tiên**,
      và đó là task viết code đầu tiên

## Quan hệ với Task #4

Task #4 ([`plan.md`](plan.md)) viết lại 151 file theo ngôn ngữ tự nhiên. 12 file của task này
nằm trong phạm vi đó — khoảng **2.159 trên 30.169 dòng, tức 7%**.

**Không chạy hai task song song trên cùng file.** Cả hai đều sửa văn xuôi, và xung đột merge ở
tài liệu tốn nhiều thời gian hơn ở code vì không có test bắt được sai sót khi hoà tay.

**Đề xuất thứ tự: Task #5 trước.** Ba lý do:

1. Task #4 đang bị chặn bởi câu hỏi 1 mục 8 của
   [`04-readability-spec.md`](04-readability-spec.md) và chưa bắt đầu — checklist mới tick 4
   trên 321 ô. Task #5 không bị chặn bởi gì ngoài `D-AF` và `D-AG`, mà hai cái đó nằm trong
   chính plan này.
2. Đóng corpus P0 mở khoá đường găng. Viết lại văn xuôi không mở khoá gì.
3. Task #4 không phải làm lại việc của Task #5. Quy trình chín bước của Task #4 ghi rõ *"không
   đụng frontmatter, kể cả `reviewed`"* — nên nó viết lại văn xuôi của spec `approved` mà không
   đổi trạng thái, và không cần approve lại.

Đổi lại, 30 cột "vì sao" mà Task #5 viết mới sẽ được Task #4 đọc lại lần nữa. Viết chúng theo
đúng quy ước của [`04-readability-spec.md`](04-readability-spec.md) ngay từ đầu thì lần đọc đó
chỉ là xác nhận.

## Rủi ro

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| Approve [`login-and-session.md`](../specs/03-account/login-and-session.md) mà chưa hoà giải với kiến trúc cookie chốt 2026-08-06, rồi phải đảo khi viết code auth | **Cao** | Bước 8 làm việc đối chiếu từng dòng với [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) §7.4 trước khi lật cờ. Đây là bước đắt nhất trong task, đừng rút gọn |
| Điền cột "vì sao" cho đủ cảnh báo `C6` thay vì để trả lời thật | **Cao** | Bước 14 mục 6 đọc lại cả 30 cột. Một câu "vì sao" chỉ diễn giải lại tên rule là một câu chưa viết |
| `D-AF` bị đảo, phải quay lại kiến trúc kênh gửi email | Trung bình | Cổng dừng A đặt trước mọi việc khác. Nếu đảo thì chỉ mất bước 0 đến 2 |
| Chốt vội câu hỏi mở chặn P0 chỉ để lật được cờ | Trung bình | Chỉ ba câu bắt buộc chốt: [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) Q1, [`admin-auth.md`](../specs/06-admin/admin-auth.md) Q2, [`security-checklist.md`](../specs/08-quality/security-checklist.md) Q2. 19 câu còn lại chặn P1 trở đi, để nguyên là đúng |
| Xung đột với Task #4 nếu ai đó chạy song song | Trung bình | Mục "Quan hệ với Task #4". Kiểm `git status` trước mỗi bước |
| Hai cảnh báo `C3` (tên section lệch chuẩn) bị xử lý bằng cách nới `C3` thay vì sửa file | Thấp | Nới một kiểm tra để hết cảnh báo là đúng thứ mà bộ nhớ dự án ghi là không được làm. Sửa tên section, hoặc ghi ngoại lệ có lý do vào [`CONVENTIONS.md`](../specs/CONVENTIONS.md) |

## Câu hỏi mở của chính task này

1. **`D-AG` — cắt cạnh, hay kéo [`access-gating.md`](../specs/04-play/access-gating.md) vào lô?** Plan này đi theo hướng cắt cạnh. Chặn
   bước 2 và bước 13.
2. **Hai cảnh báo `C3` xử lý thế nào?** Đổi tên section về chuẩn mười một mục, hay thêm vào
   [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §4 một danh sách đóng các ngoại lệ có lý do? Chặn bước 3 và bước 13.
3. **Task này có ghi đè [`plan.md`](../tasks/plan.md) và [`todo.md`](../tasks/todo.md) không?** Hiện hai tên đó thuộc về Task #4. File
   này và checklist của nó dùng tên `05-p0-spec-closure-*` để không phá Task #4. Nếu muốn nó
   thành task đang chạy, cần `git mv docs/tasks/plan.md docs/tasks/04-readability-plan.md` và
   tương tự cho [`todo.md`](../tasks/todo.md), rồi đổi tên cặp `05-*`. Không chặn bước nào.
