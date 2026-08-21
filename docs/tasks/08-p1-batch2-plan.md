# Kế hoạch — Task #8: Đóng corpus spec P1, lô 2 (30 spec còn lại)

> Viết 2026-08-08. Checklist thực thi: [`08-p1-batch2-todo.md`](08-p1-batch2-todo.md).
>
> **Ghi chú lịch sử 2026-08-14:** phần policy version của lô này đã được root D12 và
> `D-QV`–`D-QZ` trong [Task #40](40-p1-14-account-consent-deletion-plan.md) thay thế.
>
> Task đã lưu trữ:
> [`01-bootstrap-plan.md`](01-bootstrap-plan.md) ·
> [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) ·
> [`03-schema-contract-plan.md`](03-schema-contract-plan.md) ·
> [`04-readability-spec.md`](04-readability-spec.md) ·
> [`05-p0-spec-closure-plan.md`](05-p0-spec-closure-plan.md) ·
> [`06-p1-spec-closure-plan.md`](06-p1-spec-closure-plan.md).
> Task viết code đầu tiên — migration P0 bước 8 — là **Task #7**:
> [`07-first-migration-plan.md`](07-first-migration-plan.md), mới chạy 3/179 ô. Quan hệ thứ tự
> giữa Task #7 và task này: mục 9 dưới đây.
>
> Sổ cái quyết định `D-*` là sổ liên task, dùng từ Task #1. Mã cuối đã dùng là `D-AQ`
> (Task #7 bước 12b), nên task này bắt đầu từ **`D-AR`**.
>
> Mọi lệnh chạy từ thư mục `mindkid/`. Đặt lại đường dẫn Node trước mỗi phiên shell mới, vì
> shell mặc định của máy là v20.17.0 còn dự án cần v24:
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Task #6 đóng **lô 1** của corpus P1: 11 spec, và quan trọng hơn là sửa ba khuyết tật đồ thị
(8 chu trình `depends_on`, 4 tham chiếu tiến sang phase sau, 1 spec lệch phase giữa hai file),
rồi nâng kiểm tra `C7` (chu trình `depends_on`) từ cảnh báo lên lỗi.

Lô 2 là **30 spec P1 còn lại**. Điểm khác biệt lớn nhất so với lô 1: **đồ thị đã sạch**.

| Đo | Giá trị hôm nay |
|---|---:|
| Spec toàn corpus | 130 |
| `status: approved` | 49 |
| Spec `phase: P1` | 43 |
| `phase: P1` và `approved` | 13 |
| **Đích của task này** | **30** |
| Chu trình `depends_on` toàn corpus | 0 |
| Tham chiếu tiến P1 sang P2/P3 | 0 |
| `pnpm --filter @mindkid/gates test` | 0 lỗi, 142 cảnh báo |

Không còn nhát cắt đồ thị nào phải làm. Nhưng **đây không phải việc đọc rồi lật cờ**: 30 file
mang **55 câu hỏi mở**, trong đó **26 câu chặn P1** và **8 câu cần chủ dự án trả lời** vì
chúng là quyết định ngân sách, pháp lý, hoặc nội dung — không suy ra được từ corpus.

Sau task này: **79/130 `approved`**, và **P1 đạt 43/43** — toàn bộ từ vựng mà code P1 sẽ dùng
đã chốt.

## 0. Điều kiện tiên quyết — 50 commit chưa push

Cổng dừng cuối của Task #6 để lại một ô chưa tick: `git push` không chạy được vì Docker daemon
không sống, `pnpm services` đỏ, và hook `pre-push` chặn đúng chức năng của nó
([`lefthook.yml`](../../lefthook.yml), `pre-push` job `services`).

Đo lại hôm nay: Docker **đã sống**, `origin/main..HEAD` còn **50 commit**.

Đẩy trước khi bắt đầu. Một task 30 commit chồng lên 50 commit chưa đẩy là 80 commit nằm trên
đúng một ổ đĩa.

## 1. Phạm vi

**Trong phạm vi:**

- 30 spec `phase: P1` đang `draft` → `approved`, mỗi spec một commit.
- Điền cột "vì sao" cho **38 cảnh báo `C6`** nằm trên 30 file này (`C6` — `BR-*` không trùng ID,
  cột "vì sao" không rỗng).
- Chuẩn hoá bảng mục 11 (Open questions) từ 3 cột sang **5 cột** (`#`, `Câu hỏi`, `Chặn gì`,
  `Chặn phase`, `Chủ`) — dạng mà Task #5 và Task #6 đã dùng cho 25 spec đã `approved`. Cả 30
  file đích hiện còn dạng 3 cột.
- Chốt **26 câu hỏi chặn P1** và ghi vào sổ cái `D-AR` trở đi.
- Vá lỗ hổng đo được ở [`roadmap.md`](../specs/roadmap.md): bảng P1 liệt kê 25 spec, nhưng có
  **43** spec mang `phase: P1` — thiếu 18, trong đó **7 cái đã `approved` từ Task #6**.

**Ngoài phạm vi — cố ý:**

- Viết code. Task này không đụng `packages/` hay `apps/`. Ngoại lệ duy nhất: một kiểm tra lint
  mới nếu chủ dự án duyệt đề xuất ở mục 8.
- Spec `phase: P2` trở đi (51 spec `draft`). Lô sau.
- Đóng câu hỏi chặn P2/P3/go-live. Chúng ở lại mục 11 với `Chặn phase` và `Chủ` ghi rõ.
- Migration và seed — [`07-first-migration-plan.md`](07-first-migration-plan.md).

## 2. Số đo đầu vào — 30 spec đích

Cột "chặn" là spec **trong cùng lô** mà `C8` (spec `approved` thì `depends_on` cũng phải
`approved`) bắt phải `approved` trước.

| Spec | Dòng | `BR-*` | Câu hỏi | `C6` | Chặn bởi |
|---|---:|---:|---:|---:|---|
| [`accessibility.md`](../specs/08-quality/accessibility.md) | 172 | 1 | 2 | 0 | — |
| [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) | 187 | 14 | 2 | 3 | [`accessibility.md`](../specs/08-quality/accessibility.md) |
| [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) | 179 | 11 | 3 | 1 | — |
| [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) | 193 | 10 | 2 | 0 | — |
| [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) | 204 | 11 | 2 | 3 | [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) |
| [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) | 193 | 9 | 2 | 1 | [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) |
| [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) | 199 | 8 | 2 | 2 | [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) |
| [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) | 190 | 9 | 3 | 2 | [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) |
| [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) | 180 | 10 | 2 | 1 | [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) |
| [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) | 175 | 9 | 2 | 0 | — |
| [`parent-gate.md`](../specs/04-play/parent-gate.md) | 167 | 8 | 2 | 0 | — |
| [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) | 174 | 9 | 2 | 0 | [`parent-gate.md`](../specs/04-play/parent-gate.md) |
| [`legal-pages.md`](../specs/02-public/legal-pages.md) | 152 | 9 | 3 | 2 | — |
| [`consent-management.md`](../specs/03-account/consent-management.md) | 173 | 10 | 2 | 3 | [`legal-pages.md`](../specs/02-public/legal-pages.md) |
| [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) | 187 | 16 | 2 | 2 | [`consent-management.md`](../specs/03-account/consent-management.md) |
| [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md) | 143 | 8 | 1 | 2 | [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) · [`parent-gate.md`](../specs/04-play/parent-gate.md) |
| [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) | 160 | 10 | 1 | 0 | [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) |
| [`basic-report.md`](../specs/03-account/basic-report.md) | 175 | 10 | 2 | 2 | — |
| [`member-dashboard.md`](../specs/03-account/member-dashboard.md) | 153 | 10 | 1 | 1 | [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) · [`basic-report.md`](../specs/03-account/basic-report.md) |
| [`content-search.md`](../specs/01-platform/content-search.md) | 191 | 8 | 2 | 1 | — |
| [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) | 175 | 2 | 2 | 0 | — |
| [`game-catalog-public.md`](../specs/02-public/game-catalog-public.md) | 155 | 9 | 1 | 2 | [`content-search.md`](../specs/01-platform/content-search.md) · [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) |
| [`game-detail-public.md`](../specs/02-public/game-detail-public.md) | 160 | 10 | 1 | 2 | [`game-catalog-public.md`](../specs/02-public/game-catalog-public.md) |
| [`landing-page.md`](../specs/02-public/landing-page.md) | 155 | 10 | 2 | 1 | [`game-catalog-public.md`](../specs/02-public/game-catalog-public.md) |
| [`faq-and-help.md`](../specs/02-public/faq-and-help.md) | 129 | 6 | 1 | 2 | [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) |
| [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md) | 149 | 8 | 1 | 2 | [`legal-pages.md`](../specs/02-public/legal-pages.md) |
| [`my-library.md`](../specs/03-account/my-library.md) | 160 | 8 | 1 | 1 | [`content-search.md`](../specs/01-platform/content-search.md) |
| [`social-login.md`](../specs/03-account/social-login.md) | 281 | 27 | 2 | 0 | — |
| [`social-account-linking.md`](../specs/03-account/social-account-linking.md) | 268 | 14 | 2 | 0 | [`social-login.md`](../specs/03-account/social-login.md) |
| [`offline-play.md`](../specs/01-platform/offline-play.md) | 163 | 9 | 2 | 2 | — |
| **Tổng** | **5.342** | **313** | **55** | **38** | |

[`social-login.md`](../specs/03-account/social-login.md) 281 dòng và 27 `BR-*` là file nặng
nhất trong lô, gấp đôi trung vị.

## 3. Đồ thị phụ thuộc — sạch, bốn tầng

Kiểm chứng bằng máy (lệnh ở cuối [`08-p1-batch2-todo.md`](08-p1-batch2-todo.md)):

- 0 chu trình toàn corpus, và `C7` đã là **mức lỗi** kể từ Task #6 — chu trình mới không lọt được.
- 0 tham chiếu tiến: không spec `P1` nào `depends_on` một spec `P2`/`P3`/`P5`.
- Mọi phụ thuộc còn `draft` của 30 file đều **nằm trong chính lô này**. Không có nút chặn ngoài.

Bốn tầng topo:

```
tầng 0 (11)  accessibility · performance-budgets · seo-and-structured-data · legal-pages
             content-search · game-config-delivery · parent-gate · scaffolding-and-hints
             basic-report · social-login · offline-play
                |
tầng 1  (9)  design-system-contract · faq-and-help · consent-management
             cookie-and-consent-banner · game-catalog-public · my-library
             play-session-lifecycle · play-entry-and-profile-select · social-account-linking
                |
tầng 2  (6)  child-profile-crud · play-event-ingestion · scoring-and-result
             healthy-play-limits · game-detail-public · landing-page
                |
tầng 3  (4)  child-profile-archive · child-profile-switching · member-dashboard
             feedback-and-celebration
```

**Nhưng thứ tự làm không đi theo tầng.** Làm hết tầng 0 rồi hết tầng 1 là **lát ngang**: sau
tầng 0 không có đường nào chạy trọn vẹn, và câu hỏi ở tầng 0 chỉ lộ ra mâu thuẫn khi đọc tới
tầng 2. [`roadmap.md`](../specs/roadmap.md) nguyên tắc 5 nói đúng chuyện này cho code, và nó
đúng y hệt cho spec: **một đường chạy hết tốt hơn năm tầng chạy dở**.

## 4. Năm lô dọc — thứ tự và lý do

| Lô | Chủ đề | Spec | Vì sao ở vị trí này |
|---|---|---:|---|
| A | Contract chất lượng | 3 | Ngưỡng a11y, token design, ngân sách hiệu năng bị **mọi** spec giao diện của lô B, C, D tiêu thụ. Chốt sau thì phải mở lại spec đã `approved` |
| B | Lõi chơi | 9 | Đường dài nhất, rủi ro cao nhất, đụng schema. Hỏng sớm rẻ hơn hỏng muộn |
| C | Tài khoản và hồ sơ trẻ | 7 | Phụ thuộc [`parent-gate.md`](../specs/04-play/parent-gate.md) của lô B |
| D | Trang công khai và tìm kiếm | 8 | Phụ thuộc [`legal-pages.md`](../specs/02-public/legal-pages.md) của lô C |
| E | Đăng nhập mạng xã hội và ngoại tuyến | 3 | Độc lập hoàn toàn. Để cuối vì [`social-login.md`](../specs/03-account/social-login.md) là file nặng nhất |

### Lô A — contract chất lượng (3 spec)

1. [`accessibility.md`](../specs/08-quality/accessibility.md) — `depends_on: []` sau nhát cắt
   `D-AH` của Task #6. Chỉ 1 `BR-*`, 0 cảnh báo. Là spec rẻ nhất trong lô 2 và là nút chặn của
   [`design-system-contract.md`](../specs/08-quality/design-system-contract.md).
2. [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) — 3 cảnh báo
   `C6`. Mục 7.1 của nó **chép lại** bảng sàn chạm (64px · 76px · 96px · 44px) mà `BR-A11-04`
   sở hữu; đọc kỹ chỗ này, contract bị chép sẽ drift.
3. [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) — câu hỏi 1 hỏi thiết
   bị chuẩn đo 60 fps. Xem mục 6, cặp số 1.

### Lô B — lõi chơi (9 spec)

Thứ tự bắt buộc bởi `C8`:

```
game-config-delivery → play-session-lifecycle → play-event-ingestion
                                             → scoring-and-result → feedback-and-celebration
                                             → healthy-play-limits
parent-gate → play-entry-and-profile-select        scaffolding-and-hints (độc lập)
```

Đây là lô đụng bảng `play_sessions` và `play_events`. **Mọi thay đổi cột phát sinh ở đây phải
sửa [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) và mục 7 của
[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) cùng lúc** — `C12` kiểm
bản đồ bảng hai chiều và sẽ đỏ nếu chỉ sửa một bên. Cả hai file đó là `P0` đã `approved`, nên
sửa chúng là **đổi contract**: ghi `D-*` và nêu ở cổng dừng.

### Lô C — tài khoản và hồ sơ trẻ (7 spec)

```
legal-pages → consent-management → child-profile-crud → child-profile-archive
                                                     → child-profile-switching (+ parent-gate)
basic-report → member-dashboard (+ child-profile-crud)
```

[`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) 16 `BR-*` là file nhiều
rule nhất lô C — nó chịu ràng buộc của
[`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md). Đọc hai file
cạnh nhau.

### Lô D — trang công khai và tìm kiếm (8 spec)

```
content-search → game-catalog-public → game-detail-public
                                    → landing-page
                → my-library
seo-and-structured-data → faq-and-help
legal-pages (lô C) → cookie-and-consent-banner
```

### Lô E — mạng xã hội và ngoại tuyến (3 spec)

[`social-login.md`](../specs/03-account/social-login.md) →
[`social-account-linking.md`](../specs/03-account/social-account-linking.md). Thứ tự này
**không đảo được** và lý do đã ghi ở [`roadmap.md`](../specs/roadmap.md) mục 12: nhánh 409
`SOCIAL_EMAIL_CONFLICT` (`BR-SCL-04`) không có lối thoát nào khác ngoài màn hình liên kết.
[`offline-play.md`](../specs/01-platform/offline-play.md) độc lập, làm chỗ nào cũng được.

## 5. Quy trình chuẩn cho một spec — tám việc

Bảy việc đầu là vòng lặp của Task #5 và Task #6, giữ nguyên. Việc thứ 4 là mới cho lô này.

1. **Đọc hết file.** Không đọc lướt. Ghi lại số dòng, số rule, số câu hỏi mở.
2. **Đối chiếu với quyết định đã chốt sau ngày `reviewed`.** Cả 30 file có `reviewed: 2026-08-04`
   hoặc `2026-08-05`, tức viết **trước** toàn bộ `D-A` đến `D-AQ`. Danh sách bắt buộc đối chiếu:
   định dạng mã ở [`id-conventions.md`](../specs/00-foundation/id-conventions.md) mục 7; khoá
   ngoại dùng `id` (`D-AE`); kiến trúc Sidebase Local + JWT access + xoay refresh token ở
   [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) mục 7.4; bản đồ
   bảng ở [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) mục 7; danh
   sách đa hình 9 mục (`D-AQ`).
3. **Sửa cảnh báo `C6`** — điền cột "vì sao" cho mọi rule đang trống. Không xoá rule để hết cảnh
   báo. [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 5: rule không có "vì sao" sẽ bị người sau
   xoá nhầm.
4. **Chuyển bảng mục 11 sang 5 cột** (`#`, `Câu hỏi`, `Chặn gì`, `Chặn phase`, `Chủ`). Một câu
   hỏi không có chủ là một câu hỏi không ai trả lời. Đây là dạng mà 25 spec `approved` đang dùng;
   30 file đích còn dạng 3 cột.
5. **Chạy checklist review** [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 10, đủ mười lăm mục.
6. **Xử lý từng câu hỏi mở.** Câu chặn P1 phải chốt và ghi vào sổ cái `D-*`. Câu chặn P2 trở đi
   để nguyên, điền `Chặn phase` và `Chủ`.
7. **Đổi `status: draft` thành `approved`, cập nhật `reviewed` sang ngày làm.**
8. **Chạy `pnpm --filter @mindkid/gates test`, phải 0 lỗi và số cảnh báo phải giảm đúng bằng số `C6` vừa sửa; rồi
   commit — một spec một commit.**

`pnpm test` và `pnpm check` chạy ở **cuối mỗi lô**, không sau mỗi spec: hai lệnh đó không đọc
nội dung spec, và chạy 30 lần là 30 lần chờ không đổi kết quả.

## 6. Tám cặp câu hỏi dính nhau — chốt một lần, đóng hai chỗ

Đọc 30 file rời rạc sẽ trả lời tám câu hỏi này hai lần, và hai lần đó có thể lệch nhau.

| # | Cặp | Ghi chú |
|---|---|---|
| 1 | [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) Q1 "thiết bị chuẩn đo 60 fps là model nào" | **Câu trả lời đã có một nửa**: [`SPEC.md`](../SPEC.md) mục 13 Cổng ra P1 ghi "60 fps trên **tablet Android 2GB**". Còn thiếu đúng một model cụ thể để mua và đo |
| 2 | [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) Q1 "bao nhiêu avatar preset" ↔ [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) Q1 "ai vẽ và bao nhiêu cái" | Cùng một quyết định, hỏi từ hai phía. Chốt ở lô A, tham chiếu lại ở lô C |
| 3 | [`landing-page.md`](../specs/02-public/landing-page.md) Q1 "có dùng analytics tự host không" ↔ [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md) Q1 "analytics tự host có cần cookie" | Câu sau **không trả lời được** trước câu trước. Chốt cùng lúc, lô D |
| 4 | [`basic-report.md`](../specs/03-account/basic-report.md) Q2 ↔ [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) Q3 | Hai file hỏi **nguyên văn cùng một câu**: gợi ý hoạt động ngoài màn hình lấy từ đâu khi chưa có `lessons` ở P1. Một quyết định, hai chỗ ghi |
| 5 | [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) Q1 ↔ [`access-ladder.md`](../specs/00-foundation/access-ladder.md) Q2 | Cùng câu "guest chơi bao nhiêu lượt thì mời đăng ký". [`access-ladder.md`](../specs/00-foundation/access-ladder.md) là `P0` **đã `approved`** — chốt ở đây là sửa spec `P0`, cần ghi `D-*` |
| 6 | [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) Q2 ↔ [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) Q3 | [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) Q3 ghi rõ "hoãn — chốt lúc [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) thiết kế". **Lúc đó là lô B.** Đóng cả hai chỗ |
| 7 | [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) Q1 ↔ [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) Q2 | Cùng chuyện "trẻ sang 7 tuổi". Cả hai chặn `P3` — **để mở**, nhưng phải trỏ vào nhau, không để hai câu hỏi mồ côi |
| 8 | [`parent-gate.md`](../specs/04-play/parent-gate.md) Q1 ↔ [`pwa-install.md`](../specs/01-platform/pwa-install.md) | [`pwa-install.md`](../specs/01-platform/pwa-install.md) là `P5`, `mvp: false`. Để mở, điền `Chặn phase: P5` |

## 7. Tám quyết định cần chủ dự án

26 câu hỏi chặn P1. **18 câu suy ra được từ corpus** — người làm task tự chốt và ghi `D-*`.
Tám câu dưới đây thì không: chúng là ngân sách, pháp lý, hoặc lựa chọn nội dung.

| # | Câu hỏi | Spec | Vì sao chủ dự án phải trả lời |
|---|---|---|---|
| 1 | Model tablet chuẩn để đo 60 fps | [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) | Phải mua thiết bị. Không chốt thì Cổng ra P1 không nghiệm thu được |
| 2 | Ngân sách và đơn vị rà soát pháp lý | [`legal-pages.md`](../specs/02-public/legal-pages.md) | Điều kiện go-live, có chi phí |
| 3 | Số avatar preset và ai vẽ | [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) · [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) | Chi phí thiết kế |
| 4 | Lời khen thu âm người thật hay tổng hợp giọng nói | [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) | Chi phí sản xuất, ảnh hưởng kích thước bundle |
| 5 | Có dùng analytics tự host không | [`landing-page.md`](../specs/02-public/landing-page.md) · [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md) | Kéo theo hạ tầng và nghĩa vụ đồng ý |
| 6 | Kênh hỗ trợ trực tiếp là gì | [`faq-and-help.md`](../specs/02-public/faq-and-help.md) | Cam kết vận hành, cần người trực |
| 7 | 6 game vào allow-list guest và ngưỡng lượt mời đăng ký | [`access-ladder.md`](../specs/00-foundation/access-ladder.md) Q1, Q2 | Quyết định nội dung; sửa một spec `P0` đã `approved` |
| 8 | Nguồn y tế cho ngưỡng 30/60/90 phút | [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) | Cần trích dẫn nguồn được, không tự đặt số |

**Gom cả tám vào một phiên duy nhất ở Cổng dừng A.** Hỏi rải rác 8 lần trong 30 spec là 8 lần
dừng việc.

## 8. Đề xuất cổng mới `C16` — cần chủ dự án duyệt

Việc thứ 4 của quy trình (mục 5) là chuẩn hoá bảng mục 11 sang 5 cột. Không có cổng máy nào giữ
nó: file thứ 31 vẫn ghi 3 cột được và không ai biết.

Đề xuất `C16` — mọi hàng câu hỏi mở phải có `Chặn phase` và `Chủ` không rỗng. Mức **lỗi** với
spec `approved`, **cảnh báo** với spec `draft` — cùng hình dạng `C8` đang dùng, để 104 spec
`draft` không làm đỏ cổng ngay hôm nay.

Kèm **ca âm** trong [`lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts): một spec giả
`approved` có hàng câu hỏi thiếu cột `Chủ` phải sinh đúng một violation; xoá thân hàm `checkC16`
phải làm test mới đỏ. Bài học `ultracite` còn nguyên: một cổng chưa từng đỏ là một cổng chưa
được chứng minh.

Đây là việc duy nhất trong task chạm vào `scripts/`. Nếu chủ dự án không duyệt, bỏ qua — 30 spec
vẫn đóng được, chỉ là không có cổng giữ.

## 9. Quan hệ với Task #7 — vì sao chạy task này trước

[`07-first-migration-plan.md`](07-first-migration-plan.md) mới chạy 3/179 ô, và 3 ô đó là bước 8
(một bước **spec**, không phải code) đã đóng sớm ở Task #6. Tức Task #7 **chưa viết dòng code
nào**.

Lô B của task này đọc lại toàn bộ đường chơi và có thể phát hiện cột thiếu trong
[`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) — chuyện đã xảy ra
đúng một lần: `D-AP` (Task #6 bước 12b) tìm ra bảng `notifications` bị bỏ sót khỏi migration số 1, và
tìm ra được là vì **có người đọc spec P1 trước**.

Sửa một cột trong spec tốn một commit. Sửa một cột sau khi migration đã chạy tốn một migration
mới, một lần đối chiếu `C12`, và một lần sửa test tích hợp.

**Đề xuất: đóng Task #8 trước, rồi mở lại Task #7.** Nếu chủ dự án muốn ngược lại thì lô B phải
tách ra chạy trước Task #7 — chín spec đó là phần duy nhất của lô 2 đụng schema.

## 10. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| 8 quyết định cần chủ dự án nằm rải khắp 5 lô | Cao — dừng việc nhiều lần | Gom một phiên ở Cổng dừng A (mục 7) |
| Lô B phát sinh cột schema mới | Cao — đổi 2 spec `P0` đã `approved` | Sửa [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) và [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) **cùng commit**; `C12` là cổng |
| Sửa [`access-ladder.md`](../specs/00-foundation/access-ladder.md) và [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) — spec đã `approved` | Trung bình | Ghi `D-*`, nêu ở cổng dừng của lô tương ứng, không sửa lặng lẽ |
| [`social-login.md`](../specs/03-account/social-login.md) 281 dòng, 27 rule | Trung bình — dễ đọc lướt | Để riêng ở lô E, không ghép chung ngày với spec khác |
| 30 commit, mỗi commit một lần `pnpm --filter @mindkid/gates test` | Thấp — chỉ tốn thời gian | `pnpm test` và `pnpm check` chạy cuối lô, không sau mỗi spec |
| Đóng câu hỏi bằng cách xoá nó | Cao — mất thông tin lặng lẽ | Đối chiếu tay ở bước cuối: mọi câu hỏi biến mất phải có `D-*` tương ứng |
| [`roadmap.md`](../specs/roadmap.md) thiếu 18 spec `P1` | Trung bình — người đọc roadmap tưởng P1 có 25 việc | Bước riêng ở cuối, sau khi cả 30 đã `approved` |

## 11. Cổng dừng

| Cổng | Sau | Điều kiện |
|---|---|---|
| A | Lô A (3 spec) | Chủ dự án trả lời 8 câu ở mục 7 và duyệt hay bác `C16` ở mục 8 |
| B | Lô B (9 spec) | `pnpm check` và `pnpm test` xanh; nêu rõ có đổi `schema-*` hay không |
| C | Lô C (7 spec) | Cổng máy xanh; xác nhận `D-*` cho mọi lần sửa spec `P0` |
| D | Lô D (8 spec) | Cổng máy xanh |
| Cuối | Lô E + đối chiếu tay | Mục 12 |

## 12. Tiêu chí hoàn thành

- [ ] 30/30 spec đích `status: approved`, `reviewed` là ngày làm.
- [ ] Toàn corpus **79/130 `approved`**; `phase: P1` đạt **43/43**.
- [ ] `pnpm --filter @mindkid/gates test` 0 lỗi, cảnh báo giảm từ 142 xuống **≤ 104**, 0 chu trình.
- [ ] 0 cảnh báo `C6` nào còn nằm trên spec `phase: P1`.
- [ ] `pnpm check` xanh, `pnpm test` xanh (số test tăng nếu `C16` được duyệt).
- [ ] Mọi hàng câu hỏi mở của 43 spec `P1` có `Chặn phase` và `Chủ` không rỗng.
- [ ] Mọi câu hỏi biến mất khỏi mục 11 có một mã `D-*` giải thích.
- [ ] [`roadmap.md`](../specs/roadmap.md) bảng P1 liệt kê đủ 43 spec.
- [ ] [`SPEC.md`](../SPEC.md) mục 14 và [`index.md`](../specs/index.md) mục Tổng khớp số đếm
      (không đổi — task này không thêm hay xoá file spec nào).
- [ ] `git push` sạch, 0 commit chờ.
