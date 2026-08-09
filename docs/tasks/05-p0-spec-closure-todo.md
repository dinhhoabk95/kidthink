# Checklist — Task #5: Đóng corpus spec P0

> Lý do, đồ thị phụ thuộc, tiêu chí chấp nhận và quy trình chuẩn bảy việc:
> [`05-p0-spec-closure-plan.md`](05-p0-spec-closure-plan.md).
>
> Mọi lệnh chạy từ thư mục `kidthink/`. Đặt lại đường dẫn Node trước mỗi phiên shell mới:
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```
>
> **Tick ô ngay khi làm xong.** Task #2 từng để lại một file 217 dòng toàn ô trống trong khi
> việc đã xong. Đừng lặp lại.

## Đang chặn

- [x] **`D-AF`** — chủ dự án xác nhận [`notification-service.md`](../specs/01-platform/notification-service.md) chuyển `P2` sang `P0` và được
      approve trong lô này. Chặn bước 1, 9, 10.
- [x] **`D-AG`** — chủ dự án xác nhận cắt cạnh [`security-checklist.md`](../specs/08-quality/security-checklist.md) → `ACCESS-GATING`.
      Chặn bước 2, 13.

Bảy spec của nhóm A và nhóm C **không** bị hai câu này chặn. Bước 0 cũng không.

## Thứ tự làm

```
Bước 0 -> Bước 1 -> Bước 2 -> Cổng dừng A
                                  |
    +-----------------------------+-----------------------------+
    |                             |                             |
 Nhóm A                        Nhóm B                        Nhóm C
 Bước 3,4,5,6                  Bước 7 -> 9, 10               Bước 11, 12
 (song song trong nhóm)        Bước 8 (độc lập)              (song song)
    |                             |                             |
    +-----------------------------+-----------------------------+
                                  |
                             Bước 13 -> Cổng dừng B -> Bước 14 -> Cổng dừng C
```

Ba nhóm chạm ba thư mục khác nhau nên chạy song song được. Trong nhóm B, bước 10 phải sau
bước 7 (`C8` bắt).

## Bảy việc phải làm cho mỗi spec

Chi tiết ở [`05-p0-spec-closure-plan.md`](05-p0-spec-closure-plan.md) mục "Quy trình chuẩn cho
một spec".

1. Đọc hết file, không đọc lướt.
2. Đối chiếu với 30 quyết định `D-A` đến `D-AE` chốt sau ngày `reviewed` của file.
3. Điền cột "vì sao" cho mọi rule đang trống. Không xoá rule để hết cảnh báo.
4. Chạy đủ mười một mục checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10.
5. Xử lý câu hỏi mở section 11 — chốt cái chặn P0, để nguyên cái chặn P1 trở đi.
6. Đổi `status` sang `approved`, cập nhật `reviewed`.
7. `pnpm lint:specs` và `pnpm test` xanh, rồi commit. Một spec một commit.

---

## Bước 0 — Ca âm cho cổng `C8`

- [x] Đọc `checkC8` ở [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) dòng 791
- [x] Thêm ca âm vào [`scripts/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts):
      spec `approved` phụ thuộc spec `draft` phải sinh đúng một violation
- [x] Thêm ca dương: phụ thuộc `approved` không sinh gì
- [x] `pnpm test` báo ít nhất 83 test (nền là 81)
- [x] Xác minh ca âm thật sự bắt: xoá tạm thân `checkC8`, chạy lại, test phải đỏ, rồi khôi phục
- [x] Commit `test(specs): ca âm cho cổng C8`

## Bước 1 — `D-AF`: [`notification-service.md`](../specs/01-platform/notification-service.md)

File: [`01-platform/notification-service.md`](../specs/01-platform/notification-service.md) — 165 dòng, 11 rule

- [x] Đọc hết file
- [x] Đối chiếu với [`job-queue`](../specs/01-platform/job-queue.md) và
      [`child-data-compliance`](../specs/00-foundation/child-data-compliance.md), cả hai đã `approved`
- [x] Xác nhận quy tắc "trẻ không nhận gì" khớp [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
- [x] Điền "vì sao" cho `BR-NOT-03`
- [x] Điền "vì sao" cho `BR-NOT-07`
- [x] Điền "vì sao" cho `BR-NOT-08`
- [x] Đổi `phase: P2` thành `phase: P0`
- [x] Cập nhật [`index.md`](../specs/index.md) dòng 90 từ `P2` sang `P0`
- [x] Chạy checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] Đổi `status` sang `approved`, `reviewed` sang ngày làm
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T1 — notification-service P2 sang P0 và approve (D-AF)`

## Bước 2 — `D-AG`: cắt cạnh của [`security-checklist.md`](../specs/08-quality/security-checklist.md)

File: [`08-quality/security-checklist.md`](../specs/08-quality/security-checklist.md)

- [x] Xoá `ACCESS-GATING` khỏi `depends_on`, còn đúng hai mục
- [x] Tìm mọi chỗ nhắc gating trong văn xuôi, đổi thành liên kết tới
      [`access-gating`](../specs/04-play/access-gating.md)
- [x] `pnpm lint:specs` — `C4` xanh, `C8` chưa áp dụng vì file còn `draft`
- [x] Commit `fix(specs): D-AG — security-checklist bỏ depends_on ACCESS-GATING`

## Cổng dừng A

- [x] Chủ dự án xác nhận `D-AF`
- [x] Chủ dự án xác nhận `D-AG`
- [x] `pnpm lint:specs` 0 lỗi
- [x] `pnpm test` xanh, có ca âm `C8`
- [x] `git status` sạch

---

## Nhóm A — bốn spec `01-platform`

### Bước 3 — [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) (274 dòng, 10 rule, 4 câu hỏi mở)

- [x] Đọc hết file
- [x] Đối chiếu sáu vùng cấm section 5 với [`SPEC.md`](../SPEC.md) §0 quyết định `D8`
- [x] Đối chiếu với [`game-template-contract`](../specs/01-platform/game-template-contract.md)
      và [`data-model-overview`](../specs/01-platform/data-model-overview.md), cả hai đã `approved`
- [x] **Cảnh báo `C3`** — section 5 tên "Vùng cấm — AI không sinh code", chuẩn là
      "Alternative flows". Chốt: đổi tên, hay ghi ngoại lệ vào [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §4
- [x] Điền "vì sao" cho `BR-AIG-01`
- [x] Điền "vì sao" cho `BR-AIG-03`
- [x] Bốn câu hỏi mở đều chặn P1 trở đi — xác nhận rồi để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T3 — approve ai-codegen-pipeline`

### Bước 4 — [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) (200 dòng, 10 rule, 3 câu hỏi mở)

- [x] Đọc hết file
- [x] Đối chiếu mã emoji với regex [`id-conventions`](../specs/00-foundation/id-conventions.md) §7
- [x] Xác nhận nó là dữ liệu Lớp 1, admin chỉ đọc, khớp [`SPEC.md`](../SPEC.md) §0 quyết định `D7`
- [x] Xác nhận 32 nhóm khớp `packages/emoji` đã port từ v1
- [x] Điền "vì sao" cho `BR-EMJ-06`
- [x] Điền "vì sao" cho `BR-EMJ-07`
- [x] Ba câu hỏi mở chặn P1 và P4 — để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T4 — approve emoji-registry`

### Bước 5 — [`rate-limiting.md`](../specs/01-platform/rate-limiting.md) (151 dòng, 7 rule, 2 câu hỏi mở)

- [x] Đọc hết file
- [x] Xác nhận tên `packages/cache` khớp
      [`monorepo-package-architecture`](../specs/00-foundation/monorepo-package-architecture.md) §7.1
- [x] Xác nhận mã lỗi trong section 8 có trong
      [`error-codes.md`](../specs/00-foundation/error-codes.md)
- [x] Xác nhận quy tắc fail-open cho route thường và fail-closed cho auth và thanh toán không
      mâu thuẫn [`auth-tokens-sessions`](../specs/01-platform/auth-tokens-sessions.md)
- [x] Điền "vì sao" cho `BR-RTL-07`
- [x] Hai câu hỏi mở chặn P1 — để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T5 — approve rate-limiting`

### Bước 6 — [`health-check.md`](../specs/01-platform/health-check.md) (143 dòng, 6 rule, 1 câu hỏi mở)

- [x] Đọc hết file
- [x] Xác nhận ba kiểm tra thật (`SELECT 1` qua Drizzle, `PING` Valkey, đếm queue BullMQ) khớp
      [`repo-bootstrap`](../specs/00-foundation/repo-bootstrap.md) §7.1
- [x] Điền "vì sao" cho `BR-HLT-06`
- [x] **Chốt câu hỏi 1** — tách `/health/live` và `/health/ready`, hay giữ một endpoint. Ghi
      quyết định vào sổ cái
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T6 — approve health-check`

---

## Nhóm B — chuỗi auth `03-account`

### Bước 7 — [`registration.md`](../specs/03-account/registration.md) (193 dòng, 11 rule, 2 câu hỏi mở)

Phải xong trước bước 10.

- [x] Đọc hết file
- [x] Đối chiếu hai checkbox đồng ý với
      [`child-data-compliance`](../specs/00-foundation/child-data-compliance.md)
- [x] Đối chiếu với [`auth-tokens-sessions`](../specs/01-platform/auth-tokens-sessions.md) và
      [`error-codes`](../specs/00-foundation/error-codes.md)
- [x] Xác nhận câu hỏi 1 đã gạch bỏ đúng cách và phần chốt 2026-08-05 đọc rõ nghĩa
- [x] Điền "vì sao" cho `BR-REG-07`
- [x] Câu hỏi 2 chặn P1 — để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T7 — approve registration`

### Bước 8 — [`login-and-session.md`](../specs/03-account/login-and-session.md) (188 dòng, 10 rule, 2 câu hỏi mở)

**Bước rủi ro nhất của task.** File viết 2026-08-04, trước quyết định kiến trúc cookie
2026-08-06. Đừng rút gọn việc đối chiếu.

- [x] Đọc hết file
- [x] Đối chiếu **từng dòng** phần token và cookie với
      [`auth-tokens-sessions`](../specs/01-platform/auth-tokens-sessions.md) §7.4
- [x] Quyết định vận chuyển cũ đã được thay thế ngày 2026-08-09 bằng Sidebase Local + JWT
      access; refresh-token rotation vẫn là contract backend tự quản
- [x] Xác nhận JWT access chỉ mang `sid`, không mang refresh token, khớp [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md)
- [x] Xác nhận tên cookie và secret của `apps/web` khác `apps/admin`
- [x] Xác nhận reauth 5 phút có mặt và khớp [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) §7.4
- [x] Ghi mọi chỗ lệch tìm được vào sổ cái trước khi sửa, kể cả khi bên sai là spec đã `approved`
- [x] Điền "vì sao" cho `BR-LGN-04`
- [x] Điền "vì sao" cho `BR-LGN-06`
- [x] Hai câu hỏi mở chặn P2 — để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T8 — approve login-and-session`

### Bước 9 — [`password-recovery.md`](../specs/03-account/password-recovery.md) (169 dòng, 12 rule, 1 câu hỏi mở)

Mở khoá bởi bước 1.

- [x] Đọc hết file
- [x] Xác nhận quy tắc "luôn trả 200" khớp [`error-codes.md`](../specs/00-foundation/error-codes.md) và không rò sự tồn tại tài khoản
- [x] Xác nhận "giết mọi phiên" khớp [`login-and-session.md`](../specs/03-account/login-and-session.md) sau bước 8
- [x] Đối chiếu kênh gửi email với [`notification-service.md`](../specs/01-platform/notification-service.md) sau bước 1
- [x] Điền "vì sao" cho `BR-PWR-05`
- [x] Điền "vì sao" cho `BR-PWR-06`
- [x] Điền "vì sao" cho `BR-PWR-08`
- [x] Câu hỏi 1 chặn [`account-settings.md`](../specs/03-account/account-settings.md) — để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T9 — approve password-recovery`

### Bước 10 — [`email-verification.md`](../specs/03-account/email-verification.md) (141 dòng, 8 rule, 1 câu hỏi mở)

Mở khoá bởi bước 1 và bước 7. `C8` sẽ đỏ nếu làm sớm hơn.

- [x] Xác nhận `REGISTRATION` và `NOTIFICATION-SERVICE` đều đã `approved`
- [x] Đọc hết file
- [x] Xác nhận điều kiện tạo hồ sơ trẻ khớp
      [`child-data-compliance`](../specs/00-foundation/child-data-compliance.md)
- [x] Điền "vì sao" cho `BR-EVF-02`
- [x] Điền "vì sao" cho `BR-EVF-05`
- [x] Điền "vì sao" cho `BR-EVF-07`
- [x] Câu hỏi 1 chặn P1 — để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T10 — approve email-verification`

---

## Nhóm C

### Bước 11 — [`admin-auth.md`](../specs/06-admin/admin-auth.md) (168 dòng, 8 rule, 2 câu hỏi mở)

- [x] Đọc hết file
- [x] Xác nhận TOTP dùng `otpauth`, tách khỏi Sidebase Local
- [x] Xác nhận cookie và secret của `apps/admin` khác `apps/web` ở tầng crypto, không chỉ policy
- [x] Đối chiếu hai guard với [`actors`](../specs/00-foundation/actors.md)
- [x] Điền "vì sao" cho `BR-ADA-03`
- [x] Điền "vì sao" cho `BR-ADA-05`
- [x] Điền "vì sao" cho `BR-ADA-07`
- [x] Điền "vì sao" cho `BR-ADA-08`
- [x] **Chốt câu hỏi 2** — quy trình xoay mật khẩu Manager đầu tiên. Nó chặn script seed ở P0,
      không chỉ go-live
- [x] Câu hỏi 1 chặn P2 — để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T11 — approve admin-auth`

### Bước 12 — [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) (187 dòng, 10 rule, 2 câu hỏi mở)

- [x] Đọc hết file
- [x] **Chốt câu hỏi 1** — file tự ghi nó chặn P0. Đo thời gian cổng tự động chạy PG Docker,
      quyết định có tách suite không
- [x] Xác nhận ngưỡng phủ test ở đây khớp cái mà mọi task sau phải đạt
- [x] Xác nhận cách đặt tên test mang ID scenario, khớp [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §6
- [x] Điền "vì sao" cho `BR-TST-01`
- [x] Điền "vì sao" cho `BR-TST-05`
- [x] Điền "vì sao" cho `BR-TST-08`
- [x] Câu hỏi 2 chặn [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) — để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T12 — approve testing-strategy`

---

## Bước 13 — [`security-checklist.md`](../specs/08-quality/security-checklist.md) (180 dòng, 9 rule, 2 câu hỏi mở)

Sau `D-AG` ở bước 2 và sau mọi spec khác, vì nó tham chiếu nhiều spec nhất.

- [x] Xác nhận `depends_on` còn đúng hai mục sau bước 2
- [x] Đọc hết file
- [x] **Cảnh báo `C3`** — section 7 tên "Checklist", chuẩn là "Data". Chốt: đổi tên, hay ghi
      ngoại lệ vào [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §4. Quyết định phải giống bước 3
- [x] Điền "vì sao" cho `BR-SEC-01`
- [x] Điền "vì sao" cho `BR-SEC-02`
- [x] Điền "vì sao" cho `BR-SEC-05`
- [x] Điền "vì sao" cho `BR-SEC-06`
- [x] Điền "vì sao" cho `BR-SEC-08`
- [x] **Chốt câu hỏi 2** — khi chỉ có một dev thì "review người thứ hai" của `BR-SEC-08` thực
      hiện thế nào. Một rule chặn merge mà không ai biết cách thoả sẽ bị tắt trong lần đầu nó cản việc
- [x] Câu hỏi 1 chặn go-live — để nguyên
- [x] Checklist [`CONVENTIONS.md`](../specs/CONVENTIONS.md) §10
- [x] `status: approved`, cập nhật `reviewed`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Commit `feat(specs): T13 — approve security-checklist`

## Cổng dừng B

- [x] 12/12 spec `approved`
- [x] `pnpm lint:specs` 0 lỗi
- [x] Cảnh báo giảm ít nhất 30 so với nền 213
- [x] `pnpm test` xanh
- [x] Mọi quyết định mới đã ghi vào sổ cái, đánh số tiếp từ `D-AF`

---

## Bước 14 — Đối chiếu tay và đóng sổ

Cổng máy không bắt được mọi thứ. Task #3 chạy bước tương tự và tìm ra hai chỗ lệch mà kiểm tra
tự động bỏ qua.

- [x] Đếm `phase: P0` — phải ra **35**
- [x] Đếm `phase: P0` và `status: approved` — phải ra **35**
- [x] Đếm `status: approved` toàn corpus — phải ra **38/130**
- [x] [`index.md`](../specs/index.md) khớp `phase: P0` mới của [`notification-service.md`](../specs/01-platform/notification-service.md)
- [x] [`roadmap.md`](../specs/roadmap.md) P0 bước 10 nhắc [`notification-service.md`](../specs/01-platform/notification-service.md) như phụ thuộc
- [x] Mọi `BR-*` vừa sửa có mặt trong
      [`business-rules.md`](../specs/00-foundation/business-rules.md)
- [x] Đọc lại cả 30 cột "vì sao" vừa viết. Hỏi từng cái: người sau đọc câu này có hiểu vì sao
      không được xoá rule không? Câu nào chỉ diễn giải lại tên rule thì viết lại
- [x] Commit `docs(specs): T14 — đóng corpus P0, đối chiếu tay`

## Cổng dừng C — kết thúc task

- [x] 35/35 spec P0 `approved`
- [x] `pnpm check` xanh
- [x] `pnpm test` xanh
- [x] `pnpm lint:specs` 0 lỗi
- [x] Đã push lên `origin/main`
- [x] Việc tiếp theo của dự án là roadmap P0 **bước 8 — migration đầu tiên**, task viết code đầu tiên

## Lệnh đếm dùng ở bước 14

```
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH

# Số spec P0 và số P0 đã approved
grep -rl "^phase: P0" docs/specs/*/ --include="*.md" | wc -l
for f in $(grep -rl "^phase: P0" docs/specs/*/ --include="*.md"); do
  grep -m1 "^status:" "$f"
done | sort | uniq -c

# Tổng approved toàn corpus
grep -rh "^status: approved" docs/specs/*/ --include="*.md" | wc -l

# Cổng
pnpm lint:specs && pnpm test && pnpm check
```
