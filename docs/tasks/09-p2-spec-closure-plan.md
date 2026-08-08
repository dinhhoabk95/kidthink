# Kế hoạch — Task #9: Đóng corpus spec P2 (30 spec)

> Viết 2026-08-08. Checklist thực thi: [`09-p2-spec-closure-todo.md`](09-p2-spec-closure-todo.md).
>
> Task đã lưu trữ:
> [`01-bootstrap-plan.md`](01-bootstrap-plan.md) ·
> [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) ·
> [`03-schema-contract-plan.md`](03-schema-contract-plan.md) ·
> [`04-readability-spec.md`](04-readability-spec.md) ·
> [`05-p0-spec-closure-plan.md`](05-p0-spec-closure-plan.md) ·
> [`06-p1-spec-closure-plan.md`](06-p1-spec-closure-plan.md) ·
> [`08-p1-batch2-plan.md`](08-p1-batch2-plan.md).
> Task viết code đầu tiên — migration P0 — là **Task #7**:
> [`07-first-migration-plan.md`](07-first-migration-plan.md) (đã đóng 179/179 ô). Quan hệ thứ tự
> giữa Task #7 và task này: mục 9.
>
> Sổ cái quyết định `D-*` là sổ liên task, dùng từ Task #1. Mã cuối đã dùng là `D-BB`
> (Task #8), bước 1 dùng `D-BD` (`D-BC` **bỏ trống, không dùng**), nên các quyết định tiếp theo
> bắt đầu từ **`D-BE`**.
>
> Mọi lệnh chạy từ thư mục `kidthink/`. Đặt lại đường dẫn Node trước mỗi phiên shell mới, vì
> shell mặc định của máy là v20.17.0 còn dự án cần v24:
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Task #8 đóng **lô 2** của corpus P1: `phase: P1` đạt 43/43, toàn corpus **81/130 `approved`**.
Số `draft` còn lại phân bố **29 P2 · 12 P3 · 8 P4 · 1 P5**.

Task này đóng **29 spec `phase: P2`** đang `draft` (cộng rà soát [`payment-flow.md`](../specs/00-foundation/payment-flow.md)) — theo [`roadmap.md`](../specs/roadmap.md) mục P2 là
**Commerce + Admin**. Đây là lô đầu tiên đụng **tiền thật** (`payment_orders` → `entitlements`,
trong một transaction) và **studio soạn nội dung** — đường găng dài nhất của MVP đi qua nó.

Sau task này: **110/130 `approved`**, và `phase: P2` đạt **31/31** (29 spec đích cộng [`image-storage.md`](../specs/01-platform/image-storage.md) và
[`payment-flow.md`](../specs/00-foundation/payment-flow.md) đã `approved` từ Task #5).

## 0. Điều kiện tiên quyết — đo lại trước khi bắt đầu

| Đo | Giá trị hôm nay |
|---|---|
| `origin/main..HEAD` | **0** commit chờ |
| `git status` | sạch |
| Docker daemon | sống — `pnpm check:services` chạy được, hook `pre-push` (`services` job của [`lefthook.yml`](../../lefthook.yml)) không chặn |
| `pnpm lint:specs` | 0 lỗi, **101** cảnh báo, 0 chu trình |

Không có nợ tồn từ Task #8. Bắt đầu được ngay.

## 1. Phạm vi

**Trong phạm vi:**

- 29 spec `phase: P2` đang `draft` → `approved` (và rà soát [`payment-flow.md`](../specs/00-foundation/payment-flow.md) như file thứ 30), **mỗi spec một commit**.
- Điền cột "vì sao" cho **45 cảnh báo `C6`** (`C6` — mỗi `BR-*` phải có ID không trùng và cột
  "vì sao" không rỗng) nằm trên 29 file này cộng 2 cảnh báo trên [`payment-flow.md`](../specs/00-foundation/payment-flow.md).
- Chuẩn hoá bảng mục 11 (Open questions) từ **3 cột sang 5 cột** (`#`, `Câu hỏi`, `Chặn gì`,
  `Chặn phase`, `Chủ`) — dạng mà các spec đã `approved` đang dùng. Cả 29 file đích còn dạng 3 cột.
- Xử lý **44 câu hỏi mở** trên 29 file; ghi quyết định vào sổ cái từ **`D-BE`** (`D-BC` bỏ trống).
- Vá bảng P2 của [`roadmap.md`](../specs/roadmap.md): bảng nêu tên 22 spec, nhưng **31** spec
  mang `phase: P2` — thiếu 9. Cùng khuyết tật Task #8 đã vá cho P1.
- Bịt lỗ hổng của kiểm tra `C16` (`C16` — mọi hàng câu hỏi mở phải có "Chặn phase" và "Chủ"
  không rỗng) — mục 8.

**Ngoài phạm vi — cố ý:**

- Viết code sản phẩm. Task này không đụng `packages/` hay `apps/`. Ngoại lệ duy nhất:
  [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) cùng test của nó, nếu chủ dự án
  duyệt đề xuất ở mục 8.
- Spec `phase: P3/P4/P5` (21 spec `draft`). Lô sau.
- Chốt **giá cuối** `standard`/`premium`. Lý do đo được: mục 7.
- Migration và seed — [`07-first-migration-plan.md`](07-first-migration-plan.md).

## 2. Số đo đầu vào — 30 spec đích

Cột "Chặn bởi" là spec **trong cùng lô** mà `C8` (spec `approved` thì mọi `depends_on` của nó
cũng phải `approved`) bắt phải `approved` trước.

| Spec | Dòng | `BR-*` | Câu hỏi | `C6` | Chặn bởi |
|---|---:|---:|---:|---:|---|
| [`image-storage.md`](../specs/01-platform/image-storage.md) | 225 | 12 | 3 | 0 | [x] (đã `approved` ở Bước 1) |
| [`image-upload.md`](../specs/06-admin/image-upload.md) | 168 | 9 | 1 | 2 | [`image-storage.md`](../specs/01-platform/image-storage.md) |
| [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) | 149 | 8 | 1 | 0 | — |
| [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md) | 156 | 6 | 1 | 0 | [`image-storage.md`](../specs/01-platform/image-storage.md) |
| [`payment-order-create.md`](../specs/03-account/payment-order-create.md) | 167 | 8 | 2 | 1 | — |
| [`payment-proof-upload.md`](../specs/03-account/payment-proof-upload.md) | 176 | 8 | 2 | 4 | [`payment-order-create.md`](../specs/03-account/payment-order-create.md) · [`image-storage.md`](../specs/01-platform/image-storage.md) |
| [`payment-queue.md`](../specs/06-admin/payment-queue.md) | 173 | 8 | 2 | 2 | — |
| [`payment-approval.md`](../specs/06-admin/payment-approval.md) | 204 | 9 | 2 | 0 | — |
| [`pricing-page.md`](../specs/02-public/pricing-page.md) | 145 | 8 | 2 | 1 | [`payment-order-create.md`](../specs/03-account/payment-order-create.md) |
| [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) | 175 | 9 | 2 | 2 | — |
| [`subscription-view.md`](../specs/03-account/subscription-view.md) | 140 | 7 | 1 | 2 | — |
| [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md) | 130 | 6 | 1 | 1 | — |
| [`live-preview.md`](../specs/06-admin/live-preview.md) | 160 | 7 | 1 | 1 | — |
| [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) | 174 | 8 | 2 | 1 | [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) · [`image-upload.md`](../specs/06-admin/image-upload.md) |
| [`game-level-studio.md`](../specs/06-admin/game-level-studio.md) | 197 | 10 | 2 | 0 | [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) · [`live-preview.md`](../specs/06-admin/live-preview.md) |
| [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) | 194 | 8 | 3 | 1 | [`live-preview.md`](../specs/06-admin/live-preview.md) · [`game-level-studio.md`](../specs/06-admin/game-level-studio.md) |
| [`publish-and-version.md`](../specs/06-admin/publish-and-version.md) | 177 | 8 | 2 | 1 | — |
| [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md) | 157 | 8 | 2 | 2 | — |
| [`user-management.md`](../specs/06-admin/user-management.md) | 178 | 8 | 2 | 1 | — |
| [`user-detail.md`](../specs/06-admin/user-detail.md) | 135 | 6 | 1 | 2 | [`user-management.md`](../specs/06-admin/user-management.md) |
| [`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md) | 163 | 8 | 1 | 1 | [`user-detail.md`](../specs/06-admin/user-detail.md) |
| [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) | 163 | 6 | 2 | 0 | — |
| [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md) | 155 | 7 | 1 | 3 | — |
| [`feature-flags.md`](../specs/06-admin/feature-flags.md) | 131 | 6 | 1 | 1 | [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md) |
| [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) | 148 | 7 | 1 | 2 | — |
| [`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md) | 141 | 7 | 1 | 2 | — |
| [`system-activity.md`](../specs/06-admin/system-activity.md) | 121 | 6 | 1 | 2 | — |
| [`data-export.md`](../specs/06-admin/data-export.md) | 160 | 8 | 1 | 4 | — |
| [`notification-admin.md`](../specs/06-admin/notification-admin.md) | 150 | 7 | 1 | 1 | — |
| [`mfa.md`](../specs/03-account/mfa.md) | 213 | 11 | 2 | 5 | — |
| **Tổng** | **4.925** | **234** | **44** | **45** | |

Nặng nhất: [`image-storage.md`](../specs/01-platform/image-storage.md) (224 dòng, 12 rule) ·
[`mfa.md`](../specs/03-account/mfa.md) (213 dòng, 11 rule, 5 cảnh báo `C6` — nhiều nhất lô) ·
[`payment-approval.md`](../specs/06-admin/payment-approval.md) (204 dòng, 9 rule, và là file
duy nhất mang một checklist đối chiếu 5 mục chạy trong transaction).

## 3. Đồ thị phụ thuộc — sạch, năm tầng

Kiểm chứng bằng máy (lệnh ở cuối [`09-p2-spec-closure-todo.md`](09-p2-spec-closure-todo.md)):

- 0 chu trình toàn corpus. `C7` (chu trình `depends_on`) đã là **mức lỗi** kể từ Task #6 — chu
  trình mới không lọt được.
- 0 tham chiếu tiến: không spec `P2` nào `depends_on` một spec `P3`/`P4`/`P5`.
- Mọi phụ thuộc còn `draft` của 30 file đều **nằm trong chính lô này**. Không có nút chặn ngoài.

Năm tầng topo:

```
tầng 0 (20)  image-storage · feature-flag-service · emoji-picker · live-preview
             payment-order-create · payment-approval · payment-queue · entitlement-grant
             subscription-view · package-catalog-admin · publish-and-version · seo-content-admin
             admin-dashboard · user-management · audit-log-viewer · error-log-viewer
             system-activity · data-export · notification-admin · mfa
                |
tầng 1  (6)  image-upload · asset-usage-tracking · payment-proof-upload · pricing-page
             feature-flags · user-detail
                |
tầng 2  (2)  schema-driven-form · child-profile-admin
                |
tầng 3  (1)  game-level-studio
                |
tầng 4  (1)  content-review-queue
```

**Nhưng thứ tự làm không đi theo tầng.** Làm hết 20 spec của tầng 0 rồi mới xuống tầng 1 là
**lát ngang**: sau tầng 0 không có đường nào chạy trọn vẹn, và mâu thuẫn giữa
[`payment-order-create.md`](../specs/03-account/payment-order-create.md) với
[`payment-approval.md`](../specs/06-admin/payment-approval.md) chỉ lộ ra khi đọc liền nhau.
Nguyên tắc 5 của [`roadmap.md`](../specs/roadmap.md) ("vertical slice, không horizontal layer")
nói đúng chuyện này cho code, và nó đúng y hệt cho spec.

## 4. Năm lô dọc — thứ tự và lý do

| Lô | Chủ đề | Spec | Vì sao ở vị trí này |
|---|---|---:|---|
| A | Nền asset | 4 | Chặn cả lô B (ảnh chứng từ chuyển khoản) lẫn lô C (studio). Nhỏ, và mang ràng buộc tuân thủ "không ảnh chụp trẻ em" của [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) |
| B | Luồng tiền, hai đầu | 8 | Chuỗi dài nhất, rủi ro cao nhất, đụng `payment_orders` và `entitlements` trong một transaction. Hỏng sớm rẻ hơn hỏng muộn |
| C | Studio nội dung | 6 | Đường găng MVP đi qua đây. Phụ thuộc [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) và [`image-upload.md`](../specs/06-admin/image-upload.md) của lô A |
| D | Vận hành người dùng | 4 | Rủi ro thấp, nhưng [`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md) mang rule "cấm có trang liệt kê trẻ" |
| E | Nhật ký, cờ, xuất dữ liệu, MFA | 8 | Độc lập hoàn toàn với bốn lô trên. Để cuối |

### Lô A — nền asset (4 spec)

```
image-storage → image-upload và image-storage → asset-usage-tracking (hai nhánh song song)
emoji-picker (độc lập)
```

[`image-storage.md`](../specs/01-platform/image-storage.md) là file dài nhất lô và là nút chặn
của ba spec khác. Mục 7 của nó khai `owner_type` đa hình — đối chiếu với **danh sách đa hình 9
mục** đã chốt ở `D-AQ` (Task #6 bước 15) trước khi lật cờ.

### Lô B — luồng tiền, hai đầu (8 spec)

Thứ tự bắt buộc bởi `C8`:

```
payment-order-create → payment-proof-upload (+ image-storage) → payment-queue → payment-approval
                     → pricing-page
entitlement-grant · subscription-view · package-catalog-admin (độc lập)
```

Đây là lô duy nhất đụng bảng `payment_orders` và `entitlements`. **Mọi thay đổi cột phát sinh ở
đây phải sửa [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) và
mục 7 của [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) cùng lúc** —
`C12` (bản đồ bảng khớp hai chiều giữa hai file) sẽ đỏ nếu chỉ sửa một bên. Cả hai file đó là
`P0` đã `approved`, nên sửa chúng là **đổi contract**: ghi `D-*` và nêu ở cổng dừng.

[`payment-approval.md`](../specs/06-admin/payment-approval.md) mục 4 nêu checklist đối chiếu 5
mục chạy **trước** khi bật nút duyệt, và mục 6 bắt cả thao tác chạy trong **một transaction có
khoá hàng**. Đọc nó cạnh [`payment-flow.md`](../specs/00-foundation/payment-flow.md) — máy trạng
thái là nguồn sự thật, [`payment-approval.md`](../specs/06-admin/payment-approval.md) chỉ là bề
mặt của một cạnh trong máy đó.

### Lô C — studio nội dung (6 spec)

```
schema-driven-form (+ emoji-picker, image-upload) → game-level-studio (+ live-preview)
                                                  → content-review-queue
live-preview · publish-and-version · seo-content-admin (độc lập)
```

[`content-review-queue.md`](../specs/06-admin/content-review-queue.md) là spec sâu nhất của toàn
corpus P2 (tầng 4) và câu hỏi 1 của nó — "một người duyệt được bao nhiêu bản/ngày" — là **câu
hỏi mở #3 của [`SPEC.md`](../SPEC.md)**, tức ràng buộc thật của đường găng MVP. Xem mục 7.

### Lô D — vận hành người dùng (4 spec)

```
user-management → user-detail → child-profile-admin
admin-dashboard (độc lập)
```

[`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md) giới hạn **đúng 4 trường**
và cấm có trang liệt kê toàn bộ trẻ. Đọc cạnh
[`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) — danh sách field
trẻ là danh sách đóng, và Nghị định 13/2023 là lý do nó đóng.

### Lô E — nhật ký, cờ, xuất dữ liệu, MFA (8 spec)

```
feature-flag-service → feature-flags
audit-log-viewer · error-log-viewer · system-activity · data-export · notification-admin · mfa
```

[`mfa.md`](../specs/03-account/mfa.md) mang 5 cảnh báo `C6` — nhiều nhất lô — và `depends_on`
[`social-login.md`](../specs/03-account/social-login.md) vừa `approved` ở Task #8. Đối chiếu mục
7.4 của [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md): reauth 5 phút
là cơ chế mà [`mfa.md`](../specs/03-account/mfa.md) dựa vào để bật/tắt MFA, không phải cơ chế
riêng của nó.

## 5. Quy trình chuẩn cho một spec — tám việc

Giữ nguyên vòng lặp của Task #5, Task #6 và Task #8.

1. **Đọc hết file.** Không đọc lướt. Ghi lại số dòng, số rule, số câu hỏi mở.
2. **Đối chiếu với quyết định đã chốt sau ngày `reviewed`.** 28/30 file có
   `reviewed: 2026-08-04` hoặc `2026-08-05`, tức viết **trước** toàn bộ `D-A` đến `D-BB`
   (hai ngoại lệ: [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md),
   `2026-08-07` và [`image-storage.md`](../specs/01-platform/image-storage.md), `2026-08-08`). Danh sách bắt buộc đối chiếu: định dạng mã ở
   [`id-conventions.md`](../specs/00-foundation/id-conventions.md) mục 7; khoá ngoại dùng `id`
   (`D-AE`); kiến trúc cookie niêm phong bọc quanh xoay refresh token ở
   [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) mục 7.4; bản đồ bảng
   ở [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) mục 7; danh sách đa
   hình 9 mục (`D-AQ`); `scoring` schema chung (`D-BA`).
3. **Sửa cảnh báo `C6`** — điền cột "vì sao" cho mọi rule đang trống. **Không xoá rule để hết
   cảnh báo.** [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 5: rule không có "vì sao" sẽ bị
   người sau xoá nhầm.
4. **Chuyển bảng mục 11 sang 5 cột** (`#`, `Câu hỏi`, `Chặn gì`, `Chặn phase`, `Chủ`). Một câu
   hỏi không có chủ là một câu hỏi không ai trả lời.
5. **Chạy checklist review** [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 10, đủ mười lăm mục.
6. **Xử lý từng câu hỏi mở.** Câu chặn P2 phải chốt và ghi vào sổ cái `D-*`. Câu chặn P3 trở đi
   để nguyên, điền `Chặn phase` và `Chủ`.
7. **Đổi `status: draft` thành `approved`, cập nhật `reviewed` sang ngày làm.**
8. **Chạy `pnpm lint:specs`** — phải 0 lỗi và số cảnh báo giảm đúng bằng số `C6` vừa sửa; rồi
   commit — **một spec một commit**.

`pnpm test` và `pnpm check` chạy ở **cuối mỗi lô**, không sau mỗi spec: hai lệnh đó không đọc
nội dung spec, và chạy 30 lần là 30 lần chờ không đổi kết quả.

## 6. Mười cặp câu hỏi dính nhau — chốt một lần, đóng hai chỗ

Đọc 30 file rời rạc sẽ trả lời mười câu hỏi này hai lần, và hai lần đó có thể lệch nhau.

| # | Cặp | Ghi chú |
|---|---|---|
| 1 | [`pricing-page.md`](../specs/02-public/pricing-page.md) Q1 ↔ [`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q1 | **Giá cuối.** [`package-catalog.md`](../specs/00-foundation/package-catalog.md) là `P0` đã `approved` và đã ghi "cần người quyết — chặn P2". Xử lý ở mục 7 |
| 2 | [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) Q1 ↔ [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md) Q1 | Doanh thu tính theo đơn `approved` hay theo ngày hiệu lực entitlement. Một quy ước kế toán, hỏi từ hai màn hình |
| 3 | [`payment-order-create.md`](../specs/03-account/payment-order-create.md) Q2 ↔ [`payment-proof-upload.md`](../specs/03-account/payment-proof-upload.md) Q1 ↔ [`payment-flow.md`](../specs/00-foundation/payment-flow.md) Q2 | SLA duyệt ↔ `SOFT_UNLOCK_DAYS = 3`. Con số này lên màn hình User nên phải giữ được. [`payment-flow.md`](../specs/00-foundation/payment-flow.md) là `P0` đã `approved` |
| 4 | [`payment-queue.md`](../specs/06-admin/payment-queue.md) Q1 ↔ [`payment-flow.md`](../specs/00-foundation/payment-flow.md) Q1 | Webhook/API ngân hàng để đối chiếu tự động. Nguyên văn cùng một câu; [`payment-flow.md`](../specs/00-foundation/payment-flow.md) đã ghi "Hoãn, chặn phase P2" |
| 5 | [`payment-approval.md`](../specs/06-admin/payment-approval.md) Q1 ↔ [`payment-flow.md`](../specs/00-foundation/payment-flow.md) Q3 | Luồng hoàn tiền. [`payment-flow.md`](../specs/00-foundation/payment-flow.md) ghi chặn **P5** — [`payment-approval.md`](../specs/06-admin/payment-approval.md) phải khớp, không tự đặt phase khác |
| 6 | [`user-management.md`](../specs/06-admin/user-management.md) Q1 ↔ [`user-detail.md`](../specs/06-admin/user-detail.md) Q1 | Support note gắn với User. Hai file hỏi **nguyên văn cùng một câu** |
| 7 | [`image-storage.md`](../specs/01-platform/image-storage.md) Q1 ↔ [`image-upload.md`](../specs/06-admin/image-upload.md) Q1 | Xoá nền tự động. Cả hai chặn P4 — **để mở**, nhưng phải trỏ vào nhau, không để hai câu hỏi mồ côi |
| 8 | [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) Q2 ↔ [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q1 | Chặn tự duyệt bản mình tạo khi có ≥2 manager. [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) là `P0` đã `approved` |
| 9 | [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) Q1 ↔ [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) Q4 | [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) ghi rõ "hoãn — chốt lúc [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) thiết kế". **Lúc đó là lô C.** Đóng cả hai chỗ. Tiền lệ: `D-BA` đóng cặp Q3 ↔ [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) ở Task #8 |
| 10 | [`publish-and-version.md`](../specs/06-admin/publish-and-version.md) Q1 ↔ [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q3 | **Tham chiếu chết.** [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) Q3 (trạng thái `scheduled`) đã **đóng** `D-X` (nhãn T10 trong khối `D-X` dùng lại của Task #2) — "không ở MVP". [`publish-and-version.md`](../specs/06-admin/publish-and-version.md) Q1 vẫn trỏ sang nó như thể còn treo. Đóng theo, trích `D-X`, không mở lại quyết định |

Cặp 10 là lỗi **đo được lúc lập kế hoạch**, không phải giả định — đúng loại lệch mà bước đối
chiếu tay của Task #3, #5, #6 và #8 vẫn bắt ra sau khi cổng máy đã xanh.

## 7. Cái gì thực sự bị chặn — giá cuối **không** chặn task này

[`pricing-page.md`](../specs/02-public/pricing-page.md) Q1 ghi "**Giá cuối** — chặn phát hành
trang này". Đo lại cho chính xác trước khi coi nó là nút chặn của task:

- Mục 7 của [`pricing-page.md`](../specs/02-public/pricing-page.md) bắt **sinh giá và quyền lợi
  từ dữ liệu** (`PACKAGE_CATALOG`), và xếp "viết tay quyền lợi" vào nhóm Never.
- Nên con số giá là **giá trị của một constant**, không phải một dòng contract. Nó chặn
  **go-live trang giá**, không chặn `status: approved` của spec.

Xử lý đúng: giữ Q1 mở với `Chặn phase: P2` và `Chủ: người quyết`, trỏ sang
[`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q1 — **y hệt cách
[`package-catalog.md`](../specs/00-foundation/package-catalog.md) đang ghi**. Ép chốt giá chỉ để
lật được cờ `approved` là đổi một quyết định thương mại cho tiện việc lint.

Cùng logic áp cho: SLA duyệt (cặp 3), Sentry hay tự xây
([`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md) Q1), provider email có trạng thái
bounce ([`notification-admin.md`](../specs/06-admin/notification-admin.md) Q1), CDN trước S3
([`image-storage.md`](../specs/01-platform/image-storage.md) Q2).

### Sáu quyết định vẫn cần chủ dự án

**Gom cả sáu vào một phiên duy nhất ở Cổng dừng A.** Hỏi rải rác 6 lần trong 30 spec là 6 lần
dừng việc.

| # | Câu hỏi | Spec | Vì sao chủ dự án phải trả lời |
|---|---|---|---|
| 1 | Giá cuối `standard` / `premium` | [`package-catalog.md`](../specs/00-foundation/package-catalog.md) Q1 · [`pricing-page.md`](../specs/02-public/pricing-page.md) Q1 | Quyết định thương mại. Chặn go-live trang giá, không chặn spec |
| 2 | Doanh thu tính theo đơn `approved` hay theo ngày hiệu lực entitlement | [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) · [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md) | Quy ước kế toán, không suy ra được từ corpus |
| 3 | Cam kết thời gian duyệt (lên màn hình User) và `SOFT_UNLOCK_DAYS` | [`payment-order-create.md`](../specs/03-account/payment-order-create.md) · [`payment-proof-upload.md`](../specs/03-account/payment-proof-upload.md) · [`payment-flow.md`](../specs/00-foundation/payment-flow.md) | Cam kết vận hành, cần người trực cuối tuần |
| 4 | Sentry hay tự xây error log | [`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md) | Ngân sách. Tự xây thiếu source map và grouping |
| 5 | Provider email có trạng thái bounce/delivery | [`notification-admin.md`](../specs/06-admin/notification-admin.md) | Ngân sách và chọn vendor; quyết định độ chính xác của nhật ký gửi |
| 6 | Năng lực đọc review — bao nhiêu bản/ngày/người | [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) Q1 | Ràng buộc thật của đường găng MVP; cũng là câu hỏi mở #3 của [`SPEC.md`](../SPEC.md) |

## 8. Đề xuất mở rộng kiểm tra `C16` — hai chặng

`C16` được thêm ở Task #8 để giữ việc thứ 4 của quy trình (bảng câu hỏi mở 5 cột).

`checkC16` ([`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts)) trước đây chỉ kiểm tra khi bảng đã có ≥5 cột, khiến các bảng 3 cột rơi qua cổng mà không bị cảnh báo. Đồng thời 23 spec đã `approved` từ trước đang mang bảng <5 cột. Việc lật `fail` trực tiếp sẽ làm đỏ 23 spec `approved` và phong toả pipeline.

Để giải quyết, thực hiện thiết kế **hai chặng**:

**Chặng 1 (trong Task #9):**
1. Mở rộng `checkC16` ở `scripts/lint-specs-lib.ts`: bảng mục 11 có <5 cột → **`warn`** cho mọi `status` (kể cả `approved`).
2. Bịt điểm mù:
   - `docs/specs/00-foundation/glossary.md` — §11 có, bảng không, thân là `Không có.` → hợp lệ, cho qua tường minh.
   - `docs/specs/READING-GUIDE.md` — miễn trừ theo khoá frontmatter (`doc:` thay vì `spec:`).
   - Spec `approved` có `spec:` mà không có §11, hoặc §11 rỗng không phải `Không có.` → **`warn`**.
3. Thêm ca âm bắt buộc trong `scripts/tests/lint-specs.test.ts` (spec giả `approved` bảng 3 cột, không bảng/không `Không có.`, không §11).

**Chặng 2 (task sau):**
Sau khi 23 spec `approved` được chuyển sang 5 cột, lật `warn` → `fail`.

## 9. Quan hệ với Task #7 — đối chiếu với migration đã chạy

Task #7 ([`07-first-migration-plan.md`](07-first-migration-plan.md)) đã hoàn thành 179/179 ô, migration P0 đã được tạo và chạy.

Lô B của task này đọc lại đường `payment_orders` → `entitlements` đối chiếu trực tiếp với schema đã tồn tại trong `packages/db/src/schema/billing.ts`.

Mọi sai lệch phát hiện ở đây sẽ tốn một migration mới + một lần đối chiếu `C12` + sửa test tích hợp. Do đó, lô B phải nêu rõ tại Cổng dừng B là có phát sinh migration mới hay không.

## 10. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Lô B phát sinh cột schema mới | Cao — đổi 2 spec `P0` đã `approved` | Sửa [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) và [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) **cùng commit**; `C12` là cổng |
| Sửa [`payment-flow.md`](../specs/00-foundation/payment-flow.md) · [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) · [`package-catalog.md`](../specs/00-foundation/package-catalog.md) — đều `approved` | Trung bình | Ghi `D-*`, nêu ở cổng dừng của lô tương ứng, không sửa lặng lẽ |
| Ép chốt giá hoặc SLA chỉ để lật được cờ `approved` | Cao — đổi quyết định thương mại cho tiện việc lint | Mục 7; sáu câu gom về Cổng dừng A |
| Đóng câu hỏi bằng cách xoá nó | Cao — mất thông tin lặng lẽ | Đối chiếu tay ở bước cuối: mọi câu hỏi biến mất phải có `D-*` tương ứng |
| Bảng 3 cột lọt qua `C16` | Trung bình — 30 file `approved` mà cổng vẫn xanh | Mục 8 |
| [`mfa.md`](../specs/03-account/mfa.md) 5 cảnh báo `C6` và phụ thuộc [`social-login.md`](../specs/03-account/social-login.md) vừa `approved` hôm qua | Trung bình | Để riêng ở lô E, đọc cạnh mục 7.4 của [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) |
| 30 commit, mỗi commit một lần `pnpm lint:specs` | Thấp — chỉ tốn thời gian | `pnpm test` và `pnpm check` chạy cuối lô |
| [`roadmap.md`](../specs/roadmap.md) thiếu 9 spec `P2` | Trung bình — người đọc roadmap tưởng P2 có 22 việc | Bước riêng ở cuối, sau khi cả 30 đã `approved` |

## 11. Cổng dừng

| Cổng | Sau | Điều kiện |
|---|---|---|
| A | Lô A (4 spec) | Chủ dự án trả lời 6 câu ở mục 7 và duyệt hay bác đề xuất `C16` ở mục 8 |
| B | Lô B (8 spec) | `pnpm check` và `pnpm test` xanh; nêu rõ **có đổi `schema-*` hay không** |
| C | Lô C (6 spec) | Cổng máy xanh; xác nhận `D-*` cho cặp 9 và cặp 10 của mục 6 |
| D | Lô D (4 spec) | Cổng máy xanh |
| Cuối | Lô E + vá roadmap + đối chiếu tay | Mục 12 |

## 12. Tiêu chí hoàn thành

- [ ] 29/29 spec đích `status: approved`, `reviewed` là ngày làm (cộng rà soát [`payment-flow.md`](../specs/00-foundation/payment-flow.md) như file thứ 30).
- [ ] Toàn corpus **110/130 `approved`**; `phase: P2` đạt **31/31**.
- [ ] `pnpm lint:specs` 0 lỗi, cảnh báo giảm từ **101 xuống ≤ 54** (trên 29 spec đích và payment-flow), 0 chu trình.
- [ ] 0 cảnh báo `C6` nào còn nằm trên spec `phase: P2`.
- [ ] 0 bảng mục 11 < 5 cột trong 30 file phạm vi (23 spec `approved` khác còn < 5 cột được ghi nhận nợ cho Chặng 2 mục 8).
- [ ] `pnpm check` xanh, `pnpm test` xanh (số test tăng do thêm unit test cho C16 ở mục 8).
- [ ] Mọi hàng câu hỏi mở của 31 spec `P2` có `Chặn phase` và `Chủ` không rỗng.
- [ ] Mọi câu hỏi biến mất khỏi mục 11 có một mã `D-*` giải thích.
- [ ] [`roadmap.md`](../specs/roadmap.md) bảng P2 liệt kê đủ 31 spec.
- [ ] [`SPEC.md`](../SPEC.md) mục 14 và [`index.md`](../specs/index.md) mục Tổng khớp số đếm
      (**không đổi** — task này không thêm hay xoá file spec nào).
- [ ] `git push` sạch, `origin/main..HEAD` ra **0**.
