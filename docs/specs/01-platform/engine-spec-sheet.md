---
spec: ENGINE-SPEC-SHEET
title: Hợp đồng spec engine — mỗi mã GT một spec đủ khuôn SDD
area: platform
status: implemented
mvp: false
phase: P4
reviewed: 2026-10-18
owns:
  - Hình dạng spec chuẩn của một game engine
  - Luật phiếu engine phải mang mục miền hành vi và mục trục biến thể
  - Luật mục 4 và mục 5 của phiếu phải theo kịch bản lượt chơi
  - Luật mọi mã GT đã đăng ký phải có đúng một spec
  - Luật spec đặt trước cho engine chưa có template
  - Cổng đối chiếu spec với registry engine
  - Luật cấp mã GT và danh mục khuôn theo lô (lớp chi phí, một mechanic một khuôn, điều kiện nghiệm thu khuôn mới)
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - TEMPLATE-AUTHORING-KIT
  - GAME-LAYOUT-ENGINE
  - ENGINE-RENDER-CONTRACT
  - CONTENT-TAGGING
---

# Hợp đồng spec engine — mỗi mã GT một spec đủ khuôn SDD

## 1. Objective

Trước khi có phiếu, spec của một engine chỉ là **một hàng trong bảng danh mục lô**. Muốn biết
`GT-014` nhận nội dung hình dạng gì, người soạn phải mở `packages/game-engine/src/templates/GT-014/template.ts`
và đọc Zod schema. Đó là mã nguồn đang làm nhiệm vụ của spec, và nó chặn đúng người cần đọc
nhất: người biên soạn nội dung, không phải dev.

File này sở hữu **hình dạng spec engine** — một spec độc lập cho một mã `GT`, đủ khuôn 18 mục
(11 mục chuẩn `CONVENTIONS.md` + 7 mục engine chuyên biệt), đủ để soạn nội dung và cài đặt `render()`
cho engine đó mà không cần phỏng đoán — và **luật đối chiếu**: mã có trong registry mà không có
spec thì cổng đỏ, spec mô tả sai contract thì cổng đỏ.

Nó cấm — NEVER định nghĩa lại contract. Contract sống ở
[`game-template-contract.md`](game-template-contract.md) và ở `template.ts`. Spec **trích** nó.

Mục 4 và mục 5 chịu thêm một hợp đồng nữa: chúng phải kể được **một lượt chơi thật** — vào
màn hiện gì, hệ thống tự đọc gì, trẻ chạm được từ lúc nào, xong rồi còn gì trên màn, chơi lại
khác gì. Bảy nhịp và tám nhánh của [`engine-turn-script.md`](engine-turn-script.md) là khuôn
đó; file này chỉ ép **phiếu phải theo khuôn**.

Hai mục cuối, 17 và 18, trả lời câu hỏi mà mười sáu mục trước không chạm tới: *đứa trẻ **làm**
gì*, và *cùng hành vi đó soạn được bao nhiêu cách*. Từ vựng và luật của hai mục đó thuộc
[`engine-behavior-domain.md`](engine-behavior-domain.md); file này chỉ sở hữu **chỗ ngồi** của
chúng trong phiếu và luật phiếu thiếu mục thì cổng đỏ.

File này cũng sở hữu **luật cấp mã và danh mục khuôn**: mã `GT` cấp theo thứ tự nào, theo lớp
chi phí nào, một `mechanic` có mấy khuôn, và một khuôn mới cần gì trước khi được nghiệm thu
(mục 6, các hàng `BR-MTB-*`, `BR-LVB-*`, `BR-TGB-*`). Nhóm lô và dãy mã ở mục 7.5; bảng tra
đủ mọi mã là [`engines/index.md`](engines/index.md). Luật hành vi của Session (xáo trộn có seed,
phán quyết khi trẻ không hành động, event vòng) thuộc
[`game-template-contract.md`](game-template-contract.md).

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
| `docs/specs/01-platform/engines/GT-<nnn>.md` | mọi actor | Một spec, một mã |
| `docs/specs/01-platform/engines/TEMPLATE.md` | Dev | Khuôn spec mẫu 16 mục |
| `docs/specs/01-platform/engines/index.md` | mọi actor | Hai bảng sinh tự động: engine trong registry và engine đặt trước |
| `packages/game-engine/config/engine-spec-planned.json` | Dev | Danh sách mã **đặt trước**, ánh xạ mã tới plan sở hữu (`BR-ESS-15`) |
| `pnpm --filter @mindkid/game-engine check:engine-specs` | Cổng đối chiếu | Chạy trong cổng tự động trước khi merge |
| [`template-authoring-kit.md`](template-authoring-kit.md) mục 4 | Dev | Bước viết spec chèn vào luồng thêm engine |

## 4. Main flow

1. Dev cấp mã `GT-<nnn>` và viết `template.ts` theo
   [`template-authoring-kit.md`](template-authoring-kit.md).
2. Dev tạo `engines/GT-<nnn>.md` theo 18 mục ở mục 7.1 hoặc dùng `scripts/create-template.ts`.
3. Dev điền phần **trích** (mục 3, 7, 15) từ `template.ts`. Cổng đối chiếu kiểm phần này, sai là đỏ.
4. Dev điền phần **viết tay** (mục 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18) — mục tiêu
   sư phạm, luật riêng `BR-E<nnn>-*`, Gherkin scenario, ma trận seed, hợp đồng vẽ, miền hành vi,
   trục biến thể. Cổng và reviewer kiểm tra.
5. Chạy `check:engine-specs`. Cổng đỏ nếu thiếu spec, thừa spec, thiếu rule, thiếu Gherkin, hoặc
   trường trích lệch. Chạy `check:engine-behavior` cho nội dung của mục 17 và 18.
6. Sinh lại `engines/index.md`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Có mã trong registry, không có spec | Dev quên bước 2 | Cổng đỏ, nêu mã thiếu. Không có nhánh cảnh báo |
| Có spec, không có mã trong registry, **không** khai đặt trước | Xoá engine mà quên spec | Cổng đỏ, nêu spec mồ côi |
| Có spec, không có mã trong registry, **có** khai đặt trước | Viết spec trước khi dựng khuôn (`BR-ESS-15`) | Cổng xanh. Spec vào bảng đặt trước của index, cổng trường trích chưa bật |
| Có mã trong registry mà vẫn còn trong danh sách đặt trước | Dựng xong khuôn mà quên gỡ khỏi danh sách | Cổng đỏ. Danh sách đặt trước cấm — NEVER phình ra |
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
| `BR-ESS-11` (spec đủ khuôn SDD) | File engine là spec đủ khuôn `CONVENTIONS.md` (18 mục), frontmatter có đủ 9 trường gồm `owns` và `depends_on` | Spec thiếu cấu trúc sẽ mất đi các ràng buộc bảo vệ chất lượng |
| `BR-ESS-12` (rule riêng engine) | Mục 6 của spec có ≥1 `BR-E<nnn>-*`. Rule của engine cấm — NEVER trùng luật danh mục khuôn ở mục 6 của file này hay luật của [`game-template-contract.md`](game-template-contract.md) | Mỗi engine có bất biến nghiệp vụ riêng cần bảo vệ |
| `BR-ESS-13` (Gherkin bắt buộc) | Mỗi `BR-E<nnn>-*` phải có ≥1 scenario Gherkin tương ứng ở mục 9 | Kiểm chứng tính đúng đắn qua kịch bản hành vi rõ ràng |
| `BR-ESS-14` (không sở hữu chồng) | `owns` của spec engine cấm chứa thứ mà file này hoặc `game-template-contract` đã sở hữu | Tránh xung đột phạm vi sở hữu giữa các spec |
| `BR-ESS-18` (mục 4 theo bảy nhịp) | Mục 4 của phiếu đánh số theo bảy nhịp `N1`…`N7` của [`engine-turn-script.md`](engine-turn-script.md), mỗi nhịp nói nội dung **riêng** của engine. Cấm — NEVER để lại chuỗi bản sao `Trẻ tương tác theo cơ chế <mechanic>` | Đo 2026-09-08: **26 trên 37** phiếu có mục 4 giống hệt nhau, chỉ khác tên cơ chế. Sáu bước đó đúng về mặt hình thức và rỗng về mặt nội dung — cổng cũ không bắt được vì nó chỉ kiểm mục có tồn tại hay không |
| `BR-ESS-19` (mục 5 phủ tám nhánh) | Mục 5 phủ đủ tám nhánh bắt buộc ở mục 7.4 của [`engine-turn-script.md`](engine-turn-script.md), mỗi nhánh một hàng | Trung vị hôm nay là 4 nhánh, và hai nhánh trẻ gặp nhiều nhất — **bỏ dở giữa lượt** và **chơi lại lần thứ n** — không có ở phiếu nào |
| `BR-ESS-16` (mục miền hành vi bắt buộc) | Mục 17 của phiếu phải khai miền chủ đạo, ≥1 câu quan sát được, bảng điều kiện phát triển tiên quyết và kênh thắng cuộc (`BR-EBD-07`), bậc biểu diễn theo band. Giá trị miền phải thuộc từ vựng đóng của [`engine-behavior-domain.md`](engine-behavior-domain.md) | Mười sáu mục trước đó mô tả **cơ chế**. Một phiếu tả đủ `tap-select` mà không tả nổi đứa trẻ đang làm gì thì người soạn nội dung vẫn phải đoán bài này hợp lứa nào — và `BR-GTC-05` chỉ nói cấm band, không nói cấm vì đâu |
| `BR-ESS-17` (mục trục biến thể bắt buộc) | Mục 18 phải khai ≥3 trục biến thể có giá trị cụ thể, một giá trị `do_mo`, và ≥1 quyền quyết định thuộc về trẻ | "Đa dạng cách thức" không soạn được và không đếm được khi nó là một tính từ. Ba trục có giá trị thì ma trận seed ở mục 13 có chỗ bám, và cổng đo được |
| `BR-ESS-15` (spec đặt trước) | Spec **được phép** ra đời trước `template.ts` khi mã có mặt trong `engine-spec-planned.json`. Mỗi hàng phải trỏ tới một plan **có thật**, và mã phải **rời danh sách trong cùng PR** dựng khuôn. Mã không khai đặt trước mà không có khuôn vẫn là spec mồ côi | `BR-ESS-07` nói spec là một phần của định nghĩa xong, nhưng nó chỉ chặn được PR *thêm* engine. Chín engine của chương trình `#168` có plan trước khuôn hàng tháng, và khoản mồ côi của `BR-ESS-01` khiến viết spec sớm **làm cổng đỏ** — tức hợp đồng đang phạt đúng thứ nó muốn khuyến khích. Hai ràng buộc kèm theo giữ cho "đặt trước" cấm — NEVER thành lối đi vòng: có plan thật, và tự rỗng đi |
| `BR-MTB-01` · `BR-LVB-01` (mã cấp tuần tự) | Mã `GT-*` cấp **tuần tự**, cấm bỏ trống số ở giữa; registry hiện liền mạch `GT-000` tới `GT-037`. `BR-MTB-01` ra đời cho dãy `GT-007`…`GT-017`, `BR-LVB-01` cho `GT-018`…`GT-024` — cùng một luật, giữ cả hai mã vì test đang trích | Mã bất biến theo mục 7 của [`id-conventions.md`](../00-foundation/id-conventions.md). Lỗ ở giữa dãy làm người sau tưởng có khuôn đã bị xoá và đi tìm nó, hoặc lấp nó bằng một khuôn không liên quan |
| `BR-TGB-02` (mã bất biến kể cả khi hoãn) | Mã đã cấp **bất biến** kể cả khi khuôn bị hoãn hay `deprecated`; cấm — NEVER dùng lại mã đó cho khuôn khác | `game_levels` đã seed trỏ vào mã. Tái dùng mã là đổi nghĩa một tham chiếu đã phát hành |
| `BR-MTB-02` · `BR-LVB-02` (mã cấp theo lớp chi phí) | Trong một lô, mã cấp theo **lớp chi phí**: nhóm A (không thêm file nào dưới `systems/`) trước, nhóm B (mỗi khuôn thêm **đúng một** system) sau. Dãy mã từng lô ở mục 7.5 | Bảng nguồn xếp theo thứ tự bài học, không theo chi phí xây. Đọc mã là biết ngay khuôn thuộc lớp chi phí nào, không phải mở code ra đếm, và kế hoạch cắt phạm vi cắt được theo nhóm |
| `BR-MTB-03` · `BR-LVB-04` (một mechanic một khuôn) | Mỗi giá trị `mechanic` chỉ có **một** khuôn. Khác độ khó thì khác `difficulty_params`, không khác mã | `BR-GTC-03` (tách nội dung khỏi độ khó). Hai mã cho một cơ chế là hai chỗ phải sửa mỗi lần cơ chế đó đổi, và báo cáo phủ đếm hai lần một thứ |
| `BR-LVB-05` · `BR-MTB-04` · `BR-TGB-09` (mechanic đăng ký trước khi seed) | Giá trị `mechanic` của khuôn mới phải có trong từ vựng trục `mechanic` ở mục 7.1 của [`content-tagging.md`](../05-content/content-tagging.md) **trước khi** khuôn được seed, đăng ký trong **cùng PR** ship khuôn (`D-RK`). Cổng: `BR-TCM-01` của [`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md) | Trục `mechanic` là một chiều của ma trận phủ. Giá trị lạ lọt vào làm ô đa dạng cơ chế đếm sai mà không ai thấy; đăng ký trước hàng loạt thì có giá trị trỏ vào khuôn chưa tồn tại |
| `BR-MTB-05` (fallback tap theo band) | Khuôn có cử chỉ kéo mà `age_min` bằng 3 hoặc 4 **bắt buộc** khai `requires_tap_fallback` và có đường xử lý chạm-chạm thật | `BR-GTC-06` (fallback tap) — kéo chính xác ở tuổi 3–4 là thiết kế sai, không phải độ khó cao |
| `BR-LVB-06` (cấm band thay vì nới cử chỉ) | Khuôn không làm được fallback tap thì khai `banned_age_bands`; cấm — NEVER nới cử chỉ để phủ thêm band. Ví dụ: `GT-024` vẽ theo nét cấm band `3-4` | `BR-ENG-12` (cấm thao tác vận động tinh). Kéo liên tục ở tuổi 3–4 là thiết kế sai — hạ band là câu trả lời đúng |
| `BR-MTB-06` · `BR-LVB-07` · `BR-TGB-06` (ba level mẫu là điều kiện) | Khuôn chưa có **ít nhất ba** game level mẫu chạy được (`fixtures.ts`) thì chưa nghiệm thu, chưa vào registry | `BR-TAK-09`. Một `content_contract` chưa từng được viết nội dung vào là một giả thuyết; lỗi của nó lộ ra lúc trẻ mở màn chơi |
| `BR-MTB-08` · `BR-LVB-08` (điểm nối do bộ sinh mã) | Cấm — **NEVER thêm mã khuôn mới vào một điểm nối bằng tay**; `pnpm --filter @mindkid/game-engine gen:templates` chạy lại không sinh diff ngoài thư mục khuôn | `BR-TAK-01`. Mười một điểm nối sửa tay thì lần sau sẽ quên một chỗ, và chỗ quên đó là một màn hình trắng |
| `BR-MTB-13` (layout đăng ký trước Session) | Layout mới phải vào registry của [`game-layout-engine.md`](game-layout-engine.md) **trước** khi viết Session class, kèm hàm hình học và test riêng | `BR-LAY-02` ném `LAYOUT_NOT_SUPPORTED` cho layout ngoài registry. Viết Session trước nghĩa là Session được thử trên toạ độ cứng, và toạ độ cứng sống sót qua review |
| `BR-MTB-15` · `BR-LVB-12` · `BR-TGB-08` (system mới có test riêng) | Mỗi system mới của nhóm B có bộ test **độc lập với khuôn dùng nó** | Một system chỉ được thử gián tiếp qua một khuôn thì lỗi của nó bị đọc nhầm thành lỗi của khuôn, và không tái dùng được cho khuôn thứ hai |

## 7. Data

**Đọc:** `packages/game-engine/src/generated/template-registry.ts` ·
`packages/game-engine/src/templates/<code>/template.ts` · các spec trong
`docs/specs/01-platform/engines/` · `packages/game-engine/config/engine-spec-ready.json` ·
`packages/game-engine/config/engine-spec-planned.json`.
**Ghi:** `docs/specs/01-platform/engines/index.md` (sinh tự động). Không ghi vào database.

### 7.1 Mười sáu mục của một spec engine

Spec engine gồm 11 mục theo chuẩn [`CONVENTIONS.md`](../CONVENTIONS.md) và 7 mục engine chuyên biệt:

| # | Mục | Nội dung | Nguồn | Cổng kiểm |
|---:|---|---|---|:--:|
| 1 | Objective | Tiến trình tư duy dạy trẻ, điểm khác biệt với engine gần nhất | Viết tay | Có |
| 2 | Actors | Trẻ · Người soạn nội dung · Bộ sinh level · Cổng | Viết tay | Có |
| 3 | Entry points | Thư mục engine, `content_contract`, layout dùng, phiếu này | Trích | Có |
| 4 | Main flow | Bảy nhịp `N1`…`N7` của một lượt chơi (`BR-ESS-18`) | Viết tay | Có |
| 5 | Alternative flows | Tám nhánh bắt buộc cộng nhánh riêng (`BR-ESS-19`) | Viết tay | Có |
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
| 17 | Miền hành vi | Miền chủ đạo, câu quan sát được, kênh thắng cuộc (`BR-EBD-07`), điều kiện phát triển tiên quyết, bậc biểu diễn (`BR-ESS-16`) | Viết tay | Có |
| 18 | Trục biến thể và độ mở | ≥3 trục có giá trị, `do_mo`, quyền của trẻ (`BR-ESS-17`) | Viết tay | Có |

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
| *(chưa có)* | 2. Actors · 4. Main flow · 5. Alternative flows · 6. Business rules (`BR-E<nnn>-*`) · 8. API contract · 16. Chiều sâu nội dung · 17. Miền hành vi · 18. Trục biến thể và độ mở |

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

Với spec **đặt trước** (`BR-ESS-15`) thì chưa có gì để so: mục 15 ghi **giá trị đặt trước** kèm
plan làm nguồn, và cổng đối chiếu trường trích bật đúng lúc khuôn xuất hiện — cũng là lúc mã rời
`engine-spec-planned.json`. Giá trị đặt trước vì thế là **cam kết với cổng**, không phải ghi chú:
khuôn dựng lệch nó thì `BR-ESS-02` đỏ ngay ở PR đó.

### 7.4 Hình dạng đầu ra của cổng

```
check:engine-specs
  27 mã trong registry, 36 spec tồn tại, 0 mồ côi
  Đặt trước (engine-spec-planned.json): 9 spec chờ template
  Bậc thang engine-spec-ready.json: N spec sẵn sàng
  GT-014: limits.item_count spec ghi [2,6], registry [2,8]   LỆCH
  exit 1
```

### 7.5 Danh mục khuôn theo lô

Giá trị `batch` ở frontmatter mỗi phiếu là nhãn lô; [`engines/index.md`](engines/index.md) sinh
từ nó. Bảng dưới là dãy mã và lớp chi phí của từng lô (`BR-MTB-02` · `BR-LVB-02`).

| `batch` | Dãy mã | Nhóm A — không thêm system | Nhóm B — mỗi khuôn một system mới |
|---|---|---|---|
| `core-pedagogy` | `GT-000` | — | — |
| `mvp` | `GT-001` … `GT-006` | sáu khuôn MVP, xem mục 7.2 của [`game-template-contract.md`](game-template-contract.md) | — |
| `montessori` | `GT-007` … `GT-017` | `GT-007` … `GT-011` (chỉ thêm layout) | `GT-012` `timerSystem` · `GT-013` `mazeSystem` · `GT-014` `balanceSystem` · `GT-015` `constraintSystem` · `GT-016` `rotationSystem` · `GT-017` `isometricSystem` |
| `activity-catalog` | `GT-018` … `GT-024`, `GT-028` … `GT-036` | `GT-018` (dùng `AudioController`) · `GT-019` (mở rộng `rotationSystem`) | `GT-020` `cardSystem` · `GT-021` `mirrorSystem` · `GT-022` `sceneSystem` · `GT-023` `assemblySystem` · `GT-024` `traceSystem`; `GT-028` … `GT-036` ghi system ở mục 3 của phiếu |
| `taxonomy-gap` | `GT-025` … `GT-027`, `GT-037` | `GT-025` | `GT-026` `inhibitionSystem` · `GT-027` `ruleSystem`; `GT-037` ghi ở phiếu |

Lô `activity-catalog` phủ danh mục 60 dạng game nguồn; ánh xạ dạng game nguồn → mã `GT` thuộc
[`source-game-type-coverage.md`](../08-quality/source-game-type-coverage.md). Lô `taxonomy-gap`
sinh ra hai giá trị trục `thinking` mà không khuôn nào khác sinh được (`BR-TGB-03` ở
[`thinking-coverage-matrix.md`](../08-quality/thinking-coverage-matrix.md)).

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

Scenario: BR-ESS-14 — owns của spec engine chồng chéo với spec khác làm cổng đỏ
  Given spec GT-001 khai owns chứa "Vòng lặp game engine"
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-18 — mục 4 không đủ bảy nhịp làm cổng đỏ
  Given phiếu GT-011 có mục 4 đánh số tới N5
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-18 — mục 4 còn chuỗi bản sao làm cổng đỏ
  Given phiếu GT-011 có mục 4 chứa "Trẻ tương tác theo cơ chế"
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-19 — mục 5 thiếu nhánh bắt buộc làm cổng đỏ
  Given phiếu GT-011 có mục 5 không có hàng cho nhánh chơi lại lần thứ n
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-16 — phiếu thiếu mục 17 làm cổng đỏ
  Given phiếu GT-011 không có mục 17
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-16 — miền hành vi ngoài từ vựng làm cổng đỏ
  Given phiếu GT-011 khai miền chủ đạo là "quan-sat"
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-17 — phiếu thiếu mục 18 làm cổng đỏ
  Given phiếu GT-011 không có mục 18
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-17 — mục 18 chỉ có hai trục biến thể làm cổng đỏ
  Given phiếu GT-011 khai đúng hai trục biến thể
  When chạy check:engine-behavior
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

Scenario: BR-ESS-15 — spec đặt trước không bị tính là mồ côi
  Given GT-028 có spec và không có template trong registry
  And engine-spec-planned.json khai GT-028 trỏ tới plan có thật
  When chạy check:engine-specs
  Then cổng thoát với mã 0
  And báo cáo đếm GT-028 vào số spec đặt trước

Scenario: BR-ESS-15 — spec không khai đặt trước vẫn là mồ côi
  Given GT-028 có spec và không có template trong registry
  And engine-spec-planned.json không khai GT-028
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0
  And thông báo nêu GT-028 là spec mồ côi

Scenario: BR-ESS-15 — khuôn đã dựng mà mã còn trong danh sách đặt trước làm cổng đỏ
  Given GT-001 có template trong registry
  And engine-spec-planned.json vẫn khai GT-001
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-15 — hàng đặt trước trỏ tới plan không tồn tại làm cổng đỏ
  Given engine-spec-planned.json khai một mã trỏ tới plan không có thật
  When chạy check:engine-specs
  Then cổng thoát với mã khác 0

Scenario: BR-ESS-08 — index sinh lại đúng
  Given 27 spec hợp lệ
  When sinh lại engines/index.md
  Then bảng có đúng 27 hàng
  And mỗi hàng liên kết tới spec tương ứng

Scenario: BR-ESS-03 — spec không khai schema riêng
  When đọc toàn bộ 27 spec
  Then không spec nào chứa khai báo z.object ở mục 7

Scenario: BR-MTB-01 — mã cấp tuần tự, không bỏ trống
  When đọc thư mục packages/game-engine/src/templates
  Then mọi mã từ GT-000 tới mã cao nhất đã ship đều tồn tại
  And không mã nào bị bỏ trống ở giữa

Scenario: BR-LVB-01 — bảy khuôn GT-018 tới GT-024 có trong registry
  When đọc ALL_TEMPLATE_CODES
  Then mọi mã từ GT-018 tới GT-024 có mặt với status published

Scenario: BR-TGB-02 — mã của khuôn bị hoãn không được dùng lại
  Given GT-026 bị hoãn hoặc deprecated
  When một khuôn mới xin mã
  Then khuôn mới nhận mã liền sau mã cao nhất, không nhận GT-026

Scenario: BR-MTB-02 — mã khớp lớp chi phí
  When đọc mười một khuôn lô montessori
  Then GT-007 tới GT-011 không thêm file nào dưới systems
  And GT-012 tới GT-017 mỗi khuôn thêm đúng một system

Scenario: BR-LVB-02 — nhóm A của lô activity-catalog không thêm system
  When đọc GT-018 và GT-019
  Then không khuôn nào thêm file mới dưới systems
  And GT-020 tới GT-024 mỗi khuôn thêm đúng một system

Scenario: BR-MTB-03 — một mechanic một khuôn
  When đọc trường mechanic của mọi khuôn
  Then không hai khuôn nào cùng một giá trị mechanic

Scenario: BR-LVB-05 — mechanic chưa đăng ký bị chặn
  Given một khuôn khai mechanic không có trong từ vựng trục mechanic
  When chạy cổng phủ
  Then cổng thoát với mã khác 0
  And nêu tên mechanic và mã khuôn

Scenario: BR-MTB-05 — khuôn kéo ở band thấp có fallback tap
  When đọc mọi khuôn có age_min bằng 3 hoặc 4 và mechanic dùng cử chỉ kéo
  Then requires_tap_fallback là true
  And Session class có đường xử lý chạm-chạm

Scenario: BR-LVB-06 — khuôn không fallback được thì cấm band thấp
  When đọc khuôn GT-024
  Then banned_age_bands chứa 3-4
  And requires_tap_fallback là false

Scenario: BR-MTB-06 — khuôn không có ba level mẫu thì chưa nghiệm thu
  Given khuôn GT-007 có hai game level mẫu
  When chạy cổng nghiệm thu khuôn
  Then cổng thoát với mã khác 0
  And nêu số level mẫu còn thiếu

Scenario: BR-MTB-08 — không điểm nối nào sửa tay
  Given cây làm việc sạch sau khi thêm một khuôn
  When chạy pnpm --filter @mindkid/game-engine gen:templates
  Then không file viết tay nào ngoài thư mục khuôn đó bị thay đổi

Scenario: BR-MTB-13 — layout ngoài registry bị chặn
  Given một Session class yêu cầu layout number-bond-tree chưa đăng ký
  When dựng phiên
  Then engine ném LAYOUT_NOT_SUPPORTED

Scenario: BR-MTB-15 — system có test độc lập
  When đọc bộ test của mỗi system nhóm B
  Then mỗi system có ít nhất một test không nạp khuôn nào
```

## 10. Boundaries

**Always**
- Viết spec cùng PR thêm/sửa engine, hoặc sớm hơn qua danh sách đặt trước (`BR-ESS-15`).
- Gỡ mã khỏi `engine-spec-planned.json` trong chính PR dựng `template.ts`.
- Ghi nguồn dòng cho mọi trường trích.
- Nêu ít nhất một ca sai không bắt được bằng schema ở mục 14.
- Nêu hợp đồng vẽ riêng của engine ở mục 12.
- Viết mục 4 theo bảy nhịp `N1`…`N7`, mỗi nhịp bằng nội dung riêng của engine.
- Phủ đủ tám nhánh bắt buộc ở mục 5.
- Khai miền hành vi và câu quan sát được ở mục 17.
- Khai ≥3 trục biến thể, độ mở và quyền của trẻ ở mục 18.
- Giữ ca âm trong bộ test của cổng.
- Cấp mã tuần tự theo lớp chi phí; đăng ký `mechanic` và layout trước khi viết Session.
- Cho mỗi system mới một bộ test độc lập và mỗi khuôn mới ít nhất ba level mẫu.

**Ask first**
- Bỏ một mục trong khuôn 18 mục.
- Cấp mã ngoài một lô có nhãn `batch` ở mục 7.5, hoặc chuyển một khuôn nhóm A sang nhóm B.
- Cho một engine `deprecated` giữ spec ở dạng rút gọn hơn.

**Never**
- Khai contract mới trong spec (`BR-ESS-03`).
- Gắn skill hay competency vào spec (`BR-ESS-04`).
- Sửa tay `engines/index.md` (`BR-ESS-08`).
- Đặt từ vựng miền hành vi mới trong phiếu engine — từ vựng thuộc [`engine-behavior-domain.md`](engine-behavior-domain.md).
- Merge PR thêm engine mà thiếu spec (`BR-ESS-07`).
- Thêm mã vào `engine-spec-planned.json` mà không có plan sở hữu (`BR-ESS-15`).
- Để AI agent IDE sinh spec thay người.
- Hai mã cho một `mechanic`, hoặc dùng lại mã của một khuôn đã hoãn.
- Thêm mã khuôn vào điểm nối bằng tay.
- Nới cử chỉ để phủ thêm band tuổi.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Cổng đối chiếu đọc `template.ts` bằng nạp module hay bằng phân tích cú pháp tĩnh? Nạp module chính xác hơn nhưng kéo theo toàn bộ đồ thị import của engine vào cổng | Thi công cổng | P4 | Backend |
| 2 | Spec của engine `deprecated` có phải giữ ma trận seed ở mục 13 không? Ma trận cho một engine không nhận level mới là thông tin chết | Luật `BR-ESS-05` áp cho engine deprecated | P5 | Nội dung |
