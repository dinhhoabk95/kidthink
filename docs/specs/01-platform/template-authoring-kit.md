---
spec: TEMPLATE-AUTHORING-KIT
title: Bộ dựng template — chi phí thêm một khuôn trò chơi
area: platform
status: implemented
mvp: false
phase: P4
reviewed: 2026-08-19

owns:
  - Chi phí thêm một game template
  - Nguồn sinh registry và điểm nối template
  - Bộ nguyên thuỷ cơ chế dùng chung giữa các template
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - GAME-LAYOUT-ENGINE
  - DETERMINISTIC-RANDOMNESS
  - TESTING-STRATEGY
---

# Bộ dựng template — chi phí thêm một khuôn trò chơi

## 1. Objective

[`game-template-contract.md`](game-template-contract.md) §4 mô tả **cái gì** phải làm để thêm một template. File này
sở hữu **chi phí** của việc đó.

Chi phí hiện tại đo được: thêm một mã template mới phải sửa tay 11 nơi — registry engine,
barrel, bảng chọn của studio, hai trang chơi, hai trang trò chơi tự tạo, danh sách trò chơi
tự tạo ở gói shared, danh sách hiển thị công khai, và seed. Không nơi nào được sinh tự động.
Ở sáu template thì chấp nhận được; ở bốn mươi thì mỗi lần thêm là một lần bỏ sót.

Mục tiêu: **một template mới bằng một file mô tả**. Mọi điểm nối còn lại do sinh mã tạo ra.
Con số template khi đó là quyết định sản phẩm, không phải trần kỹ thuật.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Dev | — | Viết file mô tả template, chạy sinh mã, viết Session class |
| Bộ sinh mã | — | Đọc mọi file mô tả, sinh registry, barrel, factory, hàng seed, danh sách bề mặt |
| Bộ test tuân thủ | — | Chạy cùng một bộ kiểm cho mọi template, không cần dev viết lại |
| Manager | `content_reviewer` | Không đụng gì ở đây. Template là Lớp 1 — `BR-GTC-04` |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/src/templates/<code>/template.ts` | Dev | **File mô tả** — thứ duy nhất viết tay cho phần khai báo |
| `packages/game-engine/src/templates/<code>/session.ts` | Dev | Session class, viết tay, dựng trên nguyên thuỷ cơ chế |
| `packages/game-engine/src/generated/` | Bộ sinh mã | Đầu ra. Cấm sửa tay |
| `pnpm gen:templates` | Dev | Chạy lại bộ sinh mã |

## 4. Main flow

1. Dev cấp mã mới theo `^GT-\d{3}$`, lấy số kế tiếp chưa dùng.
2. Dev tạo `templates/GT-007/template.ts` — khai `content_contract`, `difficulty_contract`,
   `limits`, band tuổi, `layouts`, `mechanic`, `scoring`, `events`.
3. Dev tạo `templates/GT-007/session.ts` — Session class, ghép từ nguyên thuỷ cơ chế ở §7.3.
4. Dev viết ≥3 game level mẫu chứng minh contract dùng được, theo `BR-GTC` bước 4.
5. Dev chạy `pnpm gen:templates`.
6. Bộ sinh mã quét thư mục, sinh lại toàn bộ điểm nối ở §7.2.
7. Bộ test tuân thủ tự nhận template mới và chạy toàn bộ kiểm ở §7.4 cho nó.
8. Seed vào `game_templates` qua PR, như `BR-GTC` bước 6.

Bước 2, 3, 4 viết tay. Bước 5, 6, 7 không viết dòng nào.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Thư mục template thiếu `template.ts` | Dev quên | Bộ sinh mã dừng, nêu tên thư mục |
| Mã template trùng | Hai PR song song | Bộ sinh mã dừng, nêu cả hai đường dẫn |
| File sinh ra bị sửa tay | Ai đó chữa nhanh | Kiểm phát hiện lệch giữa file trong repo và đầu ra sinh lại, báo lỗi |
| Session class không qua bộ test tuân thủ | Template mới thiếu đường tap fallback | Test đỏ, không cần ai nhớ ra phải kiểm |
| Số template vượt ngưỡng bundle | Nhiều template | Bộ sinh mã chuyển sang nạp động theo mã, xem `BR-TAK-08` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-TAK-01` | Thêm một template chỉ được sửa tay **trong thư mục template đó**. Mọi nơi khác do sinh mã | Đây là toàn bộ lý do file này tồn tại. Sửa tay 11 nơi thì lần thứ bảy sẽ bỏ sót một nơi |
| `BR-TAK-02` | Có **một kiểm đếm** khẳng định điều trên: thêm template giả lập rồi kiểm không file viết tay nào ngoài thư mục đó thay đổi | Quy tắc không có cổng thì trôi — đúng bài học của lần trước, xem [`89-game-engine-scale-out-plan.md`](../../tasks/89-game-engine-scale-out-plan.md) §2.4 |
| `BR-TAK-03` | File trong `generated/` **cấm sửa tay**, và kiểm phát hiện lệch | Sửa tay đầu ra sinh mã là mất thay đổi ở lần sinh kế tiếp |
| `BR-TAK-04` | Bộ test tuân thủ chạy cho **mọi** template, tự nhận template mới, không khai báo tay | Bộ kiểm phải khai báo tay là bộ kiểm sẽ thiếu template mới nhất |
| `BR-TAK-05` | Session class dựng trên **nguyên thuỷ cơ chế** dùng chung, không tự cài lại chọn, kéo, ghép, sắp | Sáu Session class hiện tại đã lặp nhau; ở bốn mươi thì mỗi lần sửa hành vi chung là bốn mươi lần sửa |
| `BR-TAK-06` | Nguyên thuỷ cơ chế **không biết nội dung học** — nhận `Slot[]` và mảng thực thể trừu tượng | Nguyên thuỷ biết nội dung thì hết dùng chung được, đúng lý do `BR-GTC-01` tách skill khỏi template |
| `BR-TAK-07` | Mã template **bất biến** sau khi publish, kể cả khi template bị `deprecated` | `game_levels` đã seed trỏ vào mã đó. Xem [`id-conventions.md`](../00-foundation/id-conventions.md) §7.2 |
| `BR-TAK-08` | Session class nạp **động theo mã**. Bundle bề mặt chơi không tăng tuyến tính theo số template | Trẻ mở một màn chơi không cần tải mã của ba mươi chín template khác. Đây là ràng buộc ngân sách hiệu năng, không phải tối ưu sớm |
| `BR-TAK-09` | Mọi template mới **bắt buộc** có ≥3 game level mẫu trước khi được sinh vào registry | Contract chưa từng có dữ liệu thật là contract chưa được kiểm. Giữ nguyên `BR-GTC` bước 4 |
| `BR-TAK-10` | Template mới **cấm** đổi bất kỳ `content_contract` nào đã publish | `BR-GTC-08` breaking change. Thêm không phải sửa |
| `BR-TAK-11` | File mô tả template là **nguồn sự thật duy nhất** cho hàng seed `game_templates` | Hai nguồn cho cùng một hàng thì chúng sẽ lệch, và lệch lộ ra lúc trẻ mở màn chơi |
| `BR-TAK-12` | Mọi `LayoutId` template khai phải cài đặt được, và mọi `shuffle_*` khai phải có luồng tương ứng | Trạng thái "cờ khai rồi bỏ đó" là thứ file này ngăn tái diễn |

## 7. Data

**Đọc:** thư mục `packages/game-engine/src/templates/*/template.ts`.
**Ghi:** `packages/game-engine/src/generated/*` · hàng seed `game_templates`.

### 7.1 File mô tả

```ts
// templates/GT-007/template.ts — thứ duy nhất viết tay cho phần khai báo
export default defineTemplate({
  code: "GT-007",
  name: "Tìm điểm khác biệt",
  mechanic: "spot-difference",
  layouts: ["split-columns"],
  content_contract: SpotDifferenceContent,
  difficulty_contract: SpotDifferenceDifficulty,
  limits: { item_count: [2, 6], distractor_count: [0, 3], target_count: [1, 1] },
  age_min: 4, age_max: 6,
  banned_age_bands: ["3-4"],
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_ROUNDS_SCORING,
  events: ["question_shown", "item_selected", "round_completed"],
  session: () => import("./session"),      // nạp động — BR-TAK-08
});
```

### 7.2 Điểm nối do sinh mã tạo ra

| Đầu ra | Thay cho nơi sửa tay nào hôm nay |
|---|---|
| `generated/template-registry.ts` | `contracts/registry.ts` |
| `generated/template-exports.ts` | `index.ts` |
| `generated/session-loader.ts` | `switch` dựng session ở trang chơi và trang xem thử |
| `generated/template-codes.ts` | `CUSTOM_GAME_TEMPLATE_CODES` ở gói shared và danh sách hiển thị công khai |
| `generated/template-seed.ts` | `seed-master/game-templates.ts` |
| `generated/studio-options.ts` | Bảng chọn template trong studio |

### 7.3 Nguyên thuỷ cơ chế

| Nguyên thuỷ | Lo việc gì | Template đang dùng lại được |
|---|---|---|
| `SelectionMechanic` | Chọn một hoặc nhiều slot, khoá lựa chọn, phát telemetry chọn | GT-001 · GT-002 |
| `PlacementMechanic` | Kéo từ nguồn sang đích, kèm **đường tap-tap bắt buộc** cho band 3–4 | GT-003 · GT-004 |
| `PairingMechanic` | Ghép hai tập, giữ trạng thái cặp đã khớp | GT-005 |
| `OrderingMechanic` | Sắp thứ tự, chấm cả chuỗi | GT-006 |

Đường tap fallback nằm **trong** `PlacementMechanic`, không nằm ở từng template — đó là cách
duy nhất `BR-GTC-06` không phụ thuộc vào việc dev có nhớ hay không.

### 7.4 Bộ test tuân thủ — chạy cho mọi template

| Kiểm | Ép rule nào |
|---|---|
| `checkWinCondition()` gọi 100 lần không đổi trạng thái, không sinh event | `BR-GTC-09` |
| `validateAction()` không sinh event và không đổi trạng thái | `BR-GTC-09` |
| `content_pack` của mọi level đã seed parse được | `BR-GTC-10` |
| `content_contract` xuất được JSON Schema và suy ra kiểu | `BR-GTC-07` |
| Mechanic chứa `drag` thì có đường tap-tap chạy được | `BR-GTC-06` |
| Mọi `LayoutId` khai đều resolve được | `BR-LAY-07` |
| Mọi `shuffle_*` khai đều có luồng tương ứng | `BR-RNG-04` |
| Sai đáp án luôn có phản hồi, không bao giờ im lặng | `BR-ENG-07` |
| Mọi event phát ra thuộc `events` đã khai | [`event-catalog.md`](../00-foundation/event-catalog.md) |

Bộ này là lý do template thứ bốn mươi an toàn ngang template thứ bảy.

## 8. API contract

Không sở hữu route. Hai route liên quan thuộc
[`game-template-contract.md`](game-template-contract.md) §8 và giữ nguyên hình dạng — chúng chỉ đổi **nguồn dữ liệu**,
từ bảng viết tay sang registry sinh ra.

## 9. Acceptance criteria

```gherkin
Scenario: BR-TAK-01 — thêm template chỉ chạm thư mục của nó
  Given một template giả lập GT-999 chỉ gồm template.ts và session.ts
  When chạy pnpm gen:templates
  Then mọi file viết tay ngoài thư mục GT-999 không đổi
  And template GT-999 xuất hiện trong registry sinh ra

Scenario: BR-TAK-03 — file sinh ra bị sửa tay thì bị bắt
  Given ai đó sửa một dòng trong generated/template-registry.ts
  When chạy kiểm sinh mã
  Then kiểm báo lỗi và nêu tên file lệch

Scenario: BR-TAK-04 — bộ test tuân thủ tự nhận template mới
  Given thêm template GT-999
  When chạy bộ test tuân thủ mà không sửa file test nào
  Then mọi kiểm ở bảng 7.4 chạy cho GT-999

Scenario: BR-TAK-05 — Session class không tự cài lại cơ chế
  When đọc mọi Session class
  Then mỗi class dùng đúng một nguyên thuỷ cơ chế
  And không class nào tự cài xử lý kéo thả

Scenario: BR-TAK-06 — nguyên thuỷ không biết nội dung học
  When kiểm chữ ký của mọi nguyên thuỷ cơ chế
  Then không nguyên thuỷ nào nhận content_pack

Scenario: BR-TAK-08 — bundle chơi không tăng tuyến tính
  Given ba mươi template đã đăng ký
  When đo mã tải về khi trẻ mở một màn chơi GT-001
  Then chỉ Session class của GT-001 được tải
  And mã của các template khác không nằm trong gói đầu tiên

Scenario: BR-TAK-09 — template chưa có level mẫu không vào registry
  Given template GT-999 không có game level mẫu nào
  When chạy pnpm gen:templates
  Then bộ sinh mã dừng và nêu thiếu level mẫu

Scenario: BR-TAK-11 — hàng seed sinh từ file mô tả
  When so hàng game_templates sinh ra với file mô tả
  Then mọi field khớp từng cái một
  And không nơi nào khai lại các field đó bằng tay

Scenario: BR-TAK-12 — cờ khai rồi bỏ đó bị chặn
  Given template GT-999 khai layout "chưa-có-thật"
  When chạy pnpm gen:templates
  Then bộ sinh mã dừng và nêu layout không cài đặt được
```

## 10. Boundaries

**Always**
- Giữ mọi thay đổi của một template mới trong thư mục của nó.
- Sinh lại điểm nối bằng bộ sinh mã.
- Dựng Session class trên nguyên thuỷ cơ chế.
- Nạp Session class theo mã, không nạp trước tất cả.

**Ask first**
- Thêm một nguyên thuỷ cơ chế mới.
- Thêm một đầu ra mới vào `generated/`.
- Đổi hình dạng file mô tả template.

**Never**
- Sửa tay file trong `generated/`.
- Liệt kê mã template bằng tay ở bất kỳ bề mặt nào.
- Cho Manager tạo template qua giao diện.
- Đưa template vào registry khi chưa có level mẫu.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Bốn nguyên thuỷ ở §7.3 có phủ được template 7–20 không? Cần liệt kê cơ chế dự kiến trước khi chốt danh sách | Hình dạng nguyên thuỷ | P4 | Nội dung |
| 2 | Trần số template trước khi cần tách gói theo nhóm cơ chế là bao nhiêu? Phải đo kích thước Session class trung bình sau khi có nguyên thuỷ | `BR-TAK-08` | P4 | hoãn — đo được sau bước đầu |
| 3 | 60 game type của v1 port sang bao nhiêu template mới, và bao nhiêu chỉ là `content_pack` khác? Trùng câu hỏi 1 ở [`game-template-contract.md`](game-template-contract.md) §11, giờ trả lời được vì có chi phí thật để so | Phạm vi P4 | P4 | hoãn — khảo sát trước |
