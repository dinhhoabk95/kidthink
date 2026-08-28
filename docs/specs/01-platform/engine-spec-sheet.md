---
spec: ENGINE-SPEC-SHEET
title: Hợp đồng spec engine — mỗi mã GT một spec đủ khuôn SDD
area: platform
status: implemented
mvp: false
phase: P4
reviewed: 2026-08-29
owns:
  - Hình dạng spec chuẩn của một game engine
  - Luật mọi mã GT đã đăng ký phải có đúng một spec
  - Cổng đối chiếu spec với registry engine
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - TEMPLATE-AUTHORING-KIT
  - GAME-LAYOUT-ENGINE
  - ENGINE-RENDER-CONTRACT
  - CONTENT-TAGGING
---

# Hợp đồng spec engine — mỗi mã GT một spec đủ khuôn SDD

## 1. Objective

Hôm nay spec của một engine là **một hàng trong bảng của spec lô**. Muốn biết `GT-014` nhận
nội dung hình dạng gì, người soạn phải mở `packages/game-engine/src/templates/GT-014/template.ts`
và đọc Zod schema. Đó là mã nguồn đang làm nhiệm vụ của spec, và nó chặn đúng người cần đọc
nhất: người biên soạn nội dung, không phải dev.

File này sở hữu **hình dạng spec engine** — một spec độc lập cho một mã `GT`, đủ khuôn 16 mục
(11 mục chuẩn `CONVENTIONS.md` + 5 mục engine chuyên biệt), đủ để soạn nội dung và cài đặt `render()`
cho engine đó mà không cần phỏng đoán — và **luật đối chiếu**: mã có trong registry mà không có
spec thì cổng đỏ, spec mô tả sai contract thì cổng đỏ.

Nó cấm — NEVER định nghĩa lại contract. Contract sống ở
[`game-template-contract.md`](game-template-contract.md) và ở `template.ts`. Spec **trích** nó.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `content_reviewer` | Đọc spec để biết soạn `content_pack` hình dạng gì, cho band tuổi nào, và ma trận seed mục tiêu |
| Dev | — | Viết spec cùng PR thêm hoặc nâng cấp engine. Spec là một phần của định nghĩa xong |
| AI agent IDE | — | Đọc spec làm ngữ cảnh sinh seeder. Cấm — NEVER sinh spec thay người |
| Cổng đối chiếu | — | So danh sách spec với `ALL_TEMPLATE_CODES`, so trường trích với registry |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| `docs/specs/01-platform/engines/GT-<nnn>.md` | mọi actor | Một spec, một mã (`GT-001`…`GT-027`) |
| `docs/specs/01-platform/engines/TEMPLATE.md` | Dev | Khuôn spec mẫu 16 mục |
| `docs/specs/01-platform/engines/index.md` | mọi actor | Bảng 27 hàng, sinh tự động từ các spec |
| `pnpm --filter @mindkid/game-engine check:engine-specs` | Cổng đối chiếu | Chạy trong cổng tự động trước khi merge |
| [`template-authoring-kit.md`](template-authoring-kit.md) mục 4 | Dev | Bước viết spec chèn vào luồng thêm engine |

## 4. Main flow

1. Dev cấp mã `GT-<nnn>` và viết `template.ts` theo
   [`template-authoring-kit.md`](template-authoring-kit.md).
2. Dev tạo `engines/GT-<nnn>.md` theo 16 mục ở mục 7.1 hoặc dùng `scripts/create-template.ts`.
3. Dev điền phần **trích** (mục 3, 7, 15) từ `template.ts`. Cổng đối chiếu kiểm phần này, sai là đỏ.
4. Dev điền phần **viết tay** (mục 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16) — mục tiêu sư phạm,
   luật riêng `BR-E<nnn>-*`, Gherkin scenario, ma trận seed, hợp đồng vẽ. Cổng và reviewer kiểm tra.
5. Chạy `check:engine-specs`. Cổng đỏ nếu thiếu spec, thừa spec, thiếu rule, thiếu Gherkin, hoặc trường trích lệch.
6. Sinh lại `engines/index.md`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Có mã trong registry, không có spec | Dev quên bước 2 | Cổng đỏ, nêu mã thiếu. Không có nhánh cảnh báo |
| Có spec, không có mã trong registry | Xoá engine mà quên spec | Cổng đỏ, nêu spec mồ côi |
| Trường trích lệch với `template.ts` | Đổi `limits` mà quên spec | Cổng đỏ, in cả hai giá trị |
| Engine `deprecated` | Ngừng cấp level mới | Spec **giữ nguyên**, thêm dòng trạng thái ở mục 1. Level cũ vẫn chạy nên spec vẫn phải đọc được |
| Đổi `content_contract` của engine đã publish | Breaking change `BR-GTC-08` | Spec phải sửa **cùng PR**. Cổng đỏ nếu contract đổi mà spec không đổi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ESS-01` (một mã một spec) | Mỗi mã trong `ALL_TEMPLATE_CODES` có **đúng một** spec; mỗi spec ứng với **đúng một** mã đang tồn tại | Song ánh là thứ cổng kiểm được. Quan hệ lỏng hơn thì cổng chỉ đếm được, không đối chiếu được |
| `BR-ESS-02` (trích, không chép) | Trường trích ghi kèm **nguồn dòng** dạng `đường-dẫn:số-dòng`; giá trị phải khớp registry lúc chạy cổng | Giá trị chép tay drift lặng lẽ. Có nguồn dòng thì cổng so được, người đọc mở được |
| `BR-ESS-03` (spec không mang contract) | Spec cấm — NEVER khai `content_contract` mới, cấm khai Zod schema riêng | Hai nguồn sự thật cho một schema là một nguồn sai chờ ngày lộ ra |
| `BR-ESS-04` (spec không gắn skill) | Spec cấm — NEVER khai `skill_id` hay `competency_id` | Cùng lý do với `BR-GTC-01` (template không gắn skill): gắn skill vào engine phá tính tái dùng |
| `BR-ESS-05` (ma trận seed bắt buộc) | Mục 13 của spec phải có ma trận `band tuổi × giá trị tư duy` với ô mục tiêu là số, không phải chữ | Ô ghi "đa dạng" không soạn được. Ô ghi `≥2` thì soạn được và đếm được |
| `BR-ESS-06` (mỗi spec nêu ca sai) | Mục 14 của spec phải nêu **ít nhất một** `content_pack` hợp lệ về schema nhưng sai về sư phạm, kèm lý do | Contract Zod chặn được sai schema. Nó cấm — NEVER chặn được một màn `GT-006` sắp xếp 5 bước cho trẻ 3 tuổi |
| `BR-ESS-07` (spec là một phần của định nghĩa xong) | PR thêm engine thiếu spec thì **không merge được** | Spec viết sau luôn là spec không được viết. 21 engine ở mức 3 level là bằng chứng của cùng một cơ chế |
| `BR-ESS-08` (index sinh tự động) | `engines/index.md` sinh từ các spec, cấm — NEVER sửa tay | Bảng tổng sửa tay là nơi thứ 12 phải nhớ cập nhật, theo đúng lỗi mà [`template-authoring-kit.md`](template-authoring-kit.md) mục 1 đã đo |
| `BR-ESS-09` (cổng có ca âm) | Cổng đối chiếu phải có test ca âm: bỏ một spec, đổi một `limits` — cả hai phải làm cổng đỏ | Cổng không có ca âm là cổng không biết mình hỏng. Bài học đã trả giá với công cụ lint trước đó |
| `BR-ESS-10` (mục hợp đồng vẽ bắt buộc) | Mục 12 của spec phải nêu slot dùng, bảng bốn lớp, và trạng thái thị giác riêng của engine | `BR-ERC-10` (mỗi engine có mục 12) của [`engine-render-contract.md`](engine-render-contract.md): một hợp đồng vẽ chung không đủ để cài `render()` cho `GT-013` mê cung |
| `BR-ESS-11` (spec đủ khuôn SDD) | File engine là spec đủ khuôn `CONVENTIONS.md` (16 mục), frontmatter có đủ 9 trường gồm `owns` và `depends_on` | Spec thiếu cấu trúc sẽ mất đi các ràng buộc bảo vệ chất lượng |
| `BR-ESS-12` (rule riêng engine) | Mục 6 của spec có ≥1 `BR-E<nnn>-*`. Rule của engine cấm — NEVER trùng rule của spec lô | Mỗi engine có bất biến nghiệp vụ riêng cần bảo vệ |
| `BR-ESS-13` (Gherkin bắt buộc) | Mỗi `BR-E<nnn>-*` phải có ≥1 scenario Gherkin tương ứng ở mục 9 | Kiểm chứng tính đúng đắn qua kịch bản hành vi rõ ràng |
| `BR-ESS-14` (không sở hữu chồng) | `owns` của spec engine cấm chứa thứ mà spec lô hoặc `game-template-contract` đã sở hữu | Tránh xung đột phạm vi sở hữu giữa các spec |

## 7. Data

**Đọc:** `packages/game-engine/src/generated/template-registry.ts` ·
`packages/game-engine/src/templates/<code>/template.ts` · các spec trong
`docs/specs/01-platform/engines/`.
**Ghi:** `docs/specs/01-platform/engines/index.md` (sinh tự động). Không ghi vào database.

### 7.1 Mười sáu mục của một spec engine

Spec engine gồm 11 mục theo chuẩn [`CONVENTIONS.md`](../CONVENTIONS.md) và 5 mục engine chuyên biệt:

| # | Mục | Nội dung | Nguồn | Cổng kiểm |
|---:|---|---|---|:--:|
| 1 | Objective | Tiến trình tư duy dạy trẻ, điểm khác biệt với engine gần nhất | Viết tay | Có |
| 2 | Actors | Trẻ · Người soạn nội dung · Bộ sinh level · Cổng | Viết tay | Có |
| 3 | Entry points | Thư mục engine, `content_contract`, layout dùng, phiếu này | Trích | Có |
| 4 | Main flow | Một lượt chơi đúng từ `content_pack` tới thắng | Viết tay | Có |
| 5 | Alternative flows | Sai, hết giờ, gợi ý, thiết bị yếu, asset hỏng | Viết tay | Có |
| 6 | Business rules | `BR-E<nnn>-01`… — luật riêng engine kèm lý do | Viết tay | Có |
| 7 | Data | Hình dạng `content_pack` và `difficulty_params`, band, `limits` | Trích | Có |
| 8 | API contract | Thường không có ("không có, engine chạy trong tiến trình") | Viết tay | Có |
| 9 | Acceptance criteria | Gherkin, mỗi `BR-E<nnn>-*` có ≥1 scenario | Viết tay | Có |
| 10 | Boundaries | Always · Ask first · Never của riêng engine | Viết tay | Có |
| 11 | Open questions | Câu hỏi chặn, có chủ | Viết tay | Có |
| 12 | Hợp đồng vẽ | Slot dùng, bảng bốn lớp, trạng thái thị giác riêng, thứ tự tuột | Viết tay | Có |
| 13 | Ma trận seed mục tiêu | `band × giá trị thinking`, ô là số (`BR-ESS-05`) | Viết tay | Có |
| 14 | Ca sai không bắt được bằng schema | ≥1 ca parse sạch mà sai sư phạm kèm lý do (`BR-ESS-06`) | Viết tay | Có |
| 15 | Trường trích từ registry | `layouts`, `limits`, `banned_age_bands`, `asset_kinds`, nguồn dòng (`BR-ESS-02`) | Trích | Có |
| 16 | Chiều sâu nội dung | Sáu số đo hiện tại và mục tiêu bậc đang bật (`BR-ECD-01`…`-06`) | Trích/Viết tay | Có |

### 7.2 Bảng ánh xạ 11 mục phiếu cũ → 16 mục spec mới

| Mục phiếu cũ | Đi về mục nào của spec mới |
|---|---|
| 1. Engine này dạy trẻ làm gì | 1. Objective |
| 2. Cơ chế và layout | 3. Entry points + 15. Trường trích từ registry |
| 3. Band tuổi và khả năng tiếp cận | 7. Data + 15. Trường trích từ registry |
| 4. Hình dạng `content_pack` | 7. Data |
| 5. Trục độ khó | 7. Data |
| 6. Ma trận seed mục tiêu | 13. Ma trận seed mục tiêu |
| 7. Ca sai không bắt được bằng schema | 14. Ca sai không bắt được bằng schema |
| 8. Acceptance criteria riêng | 9. Acceptance criteria (Gherkin scenario) |
| 9. Boundaries | 10. Boundaries |
| 10. Câu hỏi còn mở | 11. Open questions |
| 11. Hợp đồng vẽ | 12. Hợp đồng vẽ |
| *(chưa có)* | 2. Actors · 4. Main flow · 5. Alternative flows · 6. Business rules (`BR-E<nnn>-*`) · 8. API contract · 16. Chiều sâu nội dung |

### 7.3 Trường trích và nguồn của nó

| Trường spec | Lấy từ | Kiểu |
|---|---|---|
| `mechanic` | `template.mechanic` | `MechanicId` |
| `layouts` | `template.layouts` | `LayoutId[]` |
| `age_min` · `age_max` | `template.age_min` · `template.age_max` | `3 \| 4 \| 5 \| 6` |
| `banned_age_bands` | `template.banned_age_bands` | `AgeBand[]` |
| `requires_tap_fallback` | `template.requires_tap_fallback` | `boolean` |
| `limits` | `template.limits` | ba cặp `[min, max]` |
| `asset_kinds` | `template.asset_kinds` | `("emoji" \| "image" \| "audio")[]` |
| `engine_session` | `template.engine_session` | `string` |
| Khoá `content_pack` | khoá bậc một của `content_contract` | `string[]` |
| Khoá `difficulty_params` | khoá bậc một của `difficulty_contract` | `string[]` |

Cổng so **danh sách khoá bậc một**, không so cấu trúc lồng (`BR-ESS-03`).

### 7.4 Hình dạng đầu ra của cổng

```
check:engine-specs
  27 mã trong registry, 27 spec tồn tại, 0 mồ côi
  Bậc thang engine-spec-ready.json: N spec sẵn sàng
  GT-014: limits.item_count spec ghi [2,6], registry [2,8]   LỆCH
  exit 1
```

## 8. API contract

Không có. Spec là tài liệu trong repo, cổng chạy lúc build. Không route nào đọc nó.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ESS-01 — mã trong registry thiếu spec làm cổng đỏ
  Given registry có 27 mã và thư mục engines chỉ có 26 spec
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0
  And thông báo nêu đúng mã thiếu spec

Scenario: BR-ESS-01 — spec mồ côi làm cổng đỏ
  Given thư mục engines có spec GT-099 và registry không có mã đó
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0
  And thông báo nêu GT-099 là spec mồ côi

Scenario: BR-ESS-02 — trường trích lệch làm cổng đỏ
  Given spec GT-014 ghi limits.item_count là [2,6]
  And template.ts của GT-014 khai [2,8]
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0
  And thông báo in cả hai giá trị

Scenario: BR-ESS-11 — spec thiếu trường frontmatter hoặc owns rỗng làm cổng đỏ
  Given spec GT-001 thiếu owns hoặc status
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-12 — spec thiếu BR-E riêng làm cổng đỏ
  Given spec GT-001 không có BR-E001-* ở mục 6
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-13 — rule thiếu scenario Gherkin làm cổng đỏ
  Given spec GT-001 có BR-E001-01 nhưng mục 9 không có Scenario tương ứng
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-14 — owns của spec engine chồng chéo với spec lô làm cổng đỏ
  Given spec GT-001 khai owns chứa "Vòng lặp game engine"
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-10 — spec thiếu mục hợp đồng vẽ làm cổng đỏ
  Given spec GT-014 không có mục 12
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-05 — spec thiếu ma trận seed làm cổng đỏ
  Given spec GT-020 không có bảng ở mục 13 hoặc ô ghi chữ "đa dạng"
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-09 — cổng có ca âm
  Given bộ test của cổng đối chiếu
  When đọc danh sách test
  Then có ít nhất 8 test ca âm bao phủ các điều kiện vi phạm

Scenario: BR-ESS-08 — index sinh lại đúng
  Given 27 spec hợp lệ
  When sinh lại engines/index.md
  Then bảng có đúng 27 hàng
  And mỗi hàng liên kết tới spec tương ứng

Scenario: BR-ESS-03 — spec không khai schema riêng
  When đọc toàn bộ 27 spec
  Then không spec nào chứa khai báo z.object ở mục 7
```

## 10. Boundaries

**Always**
- Viết spec cùng PR thêm/sửa engine.
- Ghi nguồn dòng cho mọi trường trích.
- Nêu ít nhất một ca sai không bắt được bằng schema ở mục 14.
- Nêu hợp đồng vẽ riêng của engine ở mục 12.
- Giữ ca âm trong bộ test của cổng.

**Ask first**
- Bỏ một mục trong khuôn 16 mục.
- Cho một engine `deprecated` giữ spec ở dạng rút gọn hơn.

**Never**
- Khai contract mới trong spec (`BR-ESS-03`).
- Gắn skill hay competency vào spec (`BR-ESS-04`).
- Sửa tay `engines/index.md` (`BR-ESS-08`).
- Merge PR thêm engine mà thiếu spec (`BR-ESS-07`).
- Để AI agent IDE sinh spec thay người.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Cổng đối chiếu đọc `template.ts` bằng nạp module hay bằng phân tích cú pháp tĩnh? Nạp module chính xác hơn nhưng kéo theo toàn bộ đồ thị import của engine vào cổng | Thi công cổng | P4 | Backend |
| 2 | Spec của engine `deprecated` có phải giữ ma trận seed ở mục 13 không? Ma trận cho một engine không nhận level mới là thông tin chết | Luật `BR-ESS-05` áp cho engine deprecated | P5 | Nội dung |
