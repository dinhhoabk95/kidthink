# Task #277 Plan: Bàn chơi năm vùng — bố cục chung của mọi game engine

> **Mục tiêu**: Người đặt việc yêu cầu (2026-09-25) nghiên cứu design hiện tại và tái tổ chức bố
> cục chung của game engine cho sáng tạo, dễ dùng, gợi tư duy cho trẻ mầm non. Khảo sát cùng ngày
> trên code: **không có bố cục chung** — 37 session tự đặt lời dẫn, khay và nút lên canvas, nút nộp
> bài ở bốn vị trí khác nhau, sàn chạm co theo canvas, và GT-028 có thể không nộp được bài từ trang
> chơi.

Spec: [`play-stage-zones.md`](../specs/01-platform/play-stage-zones.md) (mới, sở hữu) ·
[`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) ·
[`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) ·
[`engine-input-contract.md`](../specs/01-platform/engine-input-contract.md) ·
[`engine-turn-script.md`](../specs/01-platform/engine-turn-script.md) ·
[`accessibility.md`](../specs/08-quality/accessibility.md) ·
[`parent-gate.md`](../specs/04-play/parent-gate.md) ·
[`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md).

Việc trước: [`275-gt002-play-surface-parity-plan.md`](275-gt002-play-surface-parity-plan.md)
(đang mở — GT-002 không nằm trong phạm vi task này cho tới khi #275 đóng).

---

## 1. Bối cảnh

### 1.1 Hiện trạng đo trên code (đọc code 2026-09-25, chưa chạy trên trình duyệt)

| # | Vấn đề | Chỗ | Rule bị trái |
|---|---|---|---|
| H1 | Mỗi session tự vẽ lời dẫn, bàn, khay, nút; không có vùng chung | `packages/game-engine/src/templates/GT-*/session.ts` (37 file, 17.332 dòng) | `BR-PSZ-01` (năm vùng) |
| H2 | Nút nộp bài ở bốn vị trí: GT-002 dưới giữa, GT-034 `y=120`, GT-035 `(780,120)`, GT-036 `y=465` | các `session.ts` tương ứng | `BR-PSZ-05` (một nút hành động) |
| H3 | GT-028 chỉ nộp qua gesture `commit`; trang chỉ gửi `commit` từ ba nút intro GT-000 | `GT-028/session.ts:110`, `pages/play/[code].vue:446-470` | `BR-PSZ-05`, `BR-ENG-07` (không im lặng) |
| H4 | Tiến độ vòng hiện hai lần: HUD và `drawProgressBadge` | GT-002, GT-026, GT-027, GT-028 | `BR-PSZ-06` (một nguồn tiến độ) |
| H5 | HUD và nút intro dùng chữ ("Bỏ qua", "Nghe lại", "Tiếp tục") | `pages/play/[code].vue:50-139, 189-225` | `BR-ENG-10` (chữ không đủ), `BR-PSZ-07` |
| H6 | Nút HUD 64px (`4rem`, `min-h-16`), dưới sàn 76 và 96 | `assets/css/play-surface.css:208-258` | `BR-A11-04` (sàn chạm theo band), `BR-DSC-28` |
| H7 | Sàn chạm áp ở logic px; portrait 390px scale 0,72 nên 96 thành khoảng 69px thật | `layout/constants.ts:17-28` | `BR-PSZ-04` (sàn trên px thật) |
| H8 | Badge loa vẽ trên thẻ đề không ai nghe chạm | `render/shared-render.ts:1115-1127` | `BR-PSZ-08` (loa bắt chạm thật) |
| H9 | `COMPLIMENTS`, `RETRY_ENCOURAGEMENTS`, `FeedbackSystem` export mà 0 caller ngoài chính file | `systems/feedback-system.ts:69-136` | `BR-PSZ-10` (mascot là kênh hình) |
| H10 | Trang chơi không `definePageMeta` nên nằm trong `layouts/default.vue` (navbar, footer); `layouts/kid.vue` không trang nào dùng | `pages/play/[code].vue` | `BR-PSZ-11` (không lối thoát một chạm), `BR-PGT-01` |
| H11 | Đổi cỡ viewport tính lại slot mà không `syncView()` | `pages/play/[code].vue:492-506` | `BR-PSZ-12` |
| H12 | GT-034, GT-035, GT-036 bỏ registry layout, toạ độ cứng 960×540; hit cách 60–72 trong khi hit ≥96 | `GT-034/session.ts:126-150`, `GT-035/session.ts:211-253` | `BR-LAY-05` (hit không chồng), `BR-LAY-09` |

### 1.2 Vì sao một khung cố định giúp tư duy

Trẻ chưa đọc học giao diện bằng vị trí. Khung đổi theo trò bắt trẻ tìm lại nút ở mỗi game — phần
sức chú ý đó lấy từ bài toán. Khung năm vùng cố định (HUD, lời dẫn, sân khấu, khay, hành động) để
sân khấu là chỗ duy nhất thay đổi, nên mọi đổi mới của trò chơi nằm ở chỗ trẻ đang nhìn.

### 1.3 Phép đo mở đầu

Lát S0 chạy trước mọi lát khác và chép số vào đây: ảnh chụp 11 dạng tương tác ở ba viewport, kích
thước px thật của mọi nút HUD và mọi slot, kết quả tái hiện H3 trên trình duyệt, và danh sách file
test đỏ trước khi sửa (baseline để diff).

**M1 — H3 tái hiện được (2026-09-25).**
[`apps/web/tests/unit/play-commit-reachability.test.ts`](../../apps/web/tests/unit/play-commit-reachability.test.ts):
GT-028 thật qua `RoundRunner`, chạm đủ 4 vật (đếm 8), rồi quét `tap` mỗi 12 px trên toàn 960×540 —
không toạ độ nào thắng được vòng (`expected false to be true` ở phép kiểm cuối). Cùng bàn đó, gửi
thẳng `commit` thì thắng: engine đúng, lỗi nằm ở đường tới. Test dùng `it.fails` để cổng
`check:test-ratchet` giữ xanh; S4 đổi thành `it`.

**M2 — Tỉ lệ canvas và sàn chạm thật, tính từ CSS (chưa đo trên trình duyệt).**
Hộp canvas = viewport trừ HUD (`5.5rem` = 88 px, dưới 640 px là `min-height: 4.5rem` = 72 px),
đệm `.main-arena` (16+16 ngang, 8+16 dọc), đệm và viền `.wooden-tray-container` (10+4 mỗi phía),
chặn `max-height: calc(85vh - 20px)`
([`play-surface.css:120-314`](../../apps/web/app/assets/css/play-surface.css)). Cạnh ngắn logic luôn
540 (`deriveLogicSpace`), nên `cssPerLogic` = cạnh ngắn hộp / 540.

| Viewport | Hộp canvas CSS | `cssPerLogic` | Sàn 96 (band 3-4) | Sàn 76 (band 4-5) | Sàn 64 (band 5-6) |
|---|---|---:|---:|---:|---:|
| 844×390 điện thoại ngang | 784×250 | 0,463 | **44 px** | **35 px** | **30 px** |
| 390×844 điện thoại dọc | 330×697 | 0,611 | **59 px** | **46 px** | **39 px** |
| 1024×768 tablet ngang | 964×628 | 1,163 | 112 px | 88 px | 74 px |

Hai viewport điện thoại đều dưới sàn ở **mọi** band; ở điện thoại ngang, sàn band 3-4 còn chưa tới
một nửa. Nút HUD là `4rem` = 64 px CSS cố định ở mọi viewport — dưới sàn 76 và 96. Thêm nữa, trang
chơi nằm trong `layouts/default.vue` nên navbar công khai đẩy khung `100vh` xuống, trẻ phải cuộn
mới thấy đáy canvas (H10).

**M3 — Ảnh chụp: chưa làm.** Postgres dev (cổng 5433) không chạy nên `/play/{code}` không tải được
level. Cần `pnpm services` và DB đã seed; làm ở Checkpoint 1 cùng ảnh sau.

## 2. Quyết định — giả định đã ghi, người đặt việc sửa nếu sai

| Mã | Quyết định | Vì sao |
|---|---|---|
| `D-277-1` | Spec mới [`play-stage-zones.md`](../specs/01-platform/play-stage-zones.md) sở hữu khung; không nhét vào `game-layout-engine.md` | Hình học slot và khung là hai outcome: slot xong mà khung chưa là trạng thái hôm nay |
| `D-277-2` | HUD là DOM; bốn vùng còn lại nằm trong canvas | HUD đã là DOM; kéo lời dẫn và nút ra DOM phải dựng lại cả lớp truy cập mà #259, #260 vừa đóng |
| `D-277-3` | Nút hành động vẽ bằng `drawCommitButton` (từ #275 S1b), chạm được shell đổi thành `commit` | Tái dùng primitive đã có; engine không còn tự hit-test nút |
| `D-277-4` | Pilot là GT-001 (chọn), GT-028 (đếm, cần nộp), GT-003 (kéo). GT-002 chuyển sau khi #275 đóng | Ba pilot phủ ba dạng nhập chính; tránh hai plan cùng sửa GT-002 |
| `D-277-5` | Mascot giữ emoji gấu, phản hồi bằng nảy và đổi biểu cảm emoji; asset thật để câu hỏi mở 1 của spec | Không chặn khung vì chờ hoạ sĩ |
| `D-277-6` | 29 engine còn lại chuyển vào khung ở task con theo nhóm dạng tương tác, mỗi engine một lát | Memory "1 spec = 1 lát dọc": gộp ngang 37 engine vào một task là cách #263 đóng trên cổng mù |

## 3. Lát cắt

### S0 — Phép đo mở đầu (S)

Chụp và đo như mục 1.3. Viết test tái hiện H3 ở `apps/web/tests/unit/` (GT-028 thật, chạm đủ rồi
tìm đường `commit` từ trang). Không sửa code.

### S1 — Hàm vùng thuần (M, `D-277-1`)

`computeStageZones` ở `packages/game-engine/src/layout/stage-zones.ts`, hằng số vùng cạnh
`CONTENT_TOP_PX` trong `layout/constants.ts`, sàn lấy qua hàm của `packages/shared` touch floors.
Test mọi scenario `BR-PSZ-02..04` của spec.

### S2 — Shell kid và HUD icon (M, phụ thuộc S1)

`definePageMeta({ layout: "kid" })` trên trang chơi; HUD còn ba nút icon đạt sàn band; bỏ "Bỏ qua"
chữ (đưa vào vùng hành động khi hết gợi ý). Canvas đo sau khi trừ chiều cao HUD. Resize gọi
`syncView()`. Scenario `BR-PSZ-07`, `BR-PSZ-11`, `BR-PSZ-12`.

### S3 — Vùng lời dẫn và pilot GT-001 (M, phụ thuộc S2)

Primitive vẽ vùng lời dẫn (mascot, loa, picto); shell nghe chạm ở `zones.promptSpeaker` và gọi
`replayCurrentRoundNarration`. GT-001 nhận `zones.stage` qua `prepareRound`, hàm layout lấp rect
đó. Scenario `BR-PSZ-01` (GT-001), `BR-PSZ-08`, `BR-PSZ-09`.

### S4 — Vùng hành động và GT-028 (S, phụ thuộc S3, `D-277-3`)

`needsCommit` trên `TemplateGameSession`; shell vẽ `drawCommitButton` ở `zones.action` và đổi chạm
thành `commit`. GT-028 bỏ `drawProgressBadge` và nút tự vẽ. Scenario `BR-PSZ-05`, `BR-PSZ-06`
(GT-028). Ca âm: gỡ nhánh đổi chạm của shell thì test H3 của S0 đỏ lại.

### S5 — Khay chung và pilot kéo GT-003 (M, phụ thuộc S3)

`drawWoodenTokenDock` nhận `zones.tray`; GT-003 kéo từ khay vào sân khấu, tap-tap fallback của
`BR-ENG-06` giữ nguyên. Scenario `BR-PSZ-01` (GT-003), `BR-PSZ-03`.

### S6 — Mascot phản hồi (S, phụ thuộc S3)

Nối `FeedbackSystem` vào vùng lời dẫn: mỗi lời khen, lời động viên có tiếng và dáng mascot cùng
nhịp; không leo thang. Scenario `BR-PSZ-10`.

### S7 — GT-034, GT-035, GT-036 vào registry và khung (M, phụ thuộc S4)

Bỏ toạ độ cứng; slot từ hàm layout trong `zones.stage`; nút chạy, nút xoá, nút nghe lại gom vào
vùng hành động. Scenario `BR-LAY-05` và `BR-PSZ-01` cho ba engine ở portrait 390.

## 4. Thứ tự và đồ thị phụ thuộc

```
S0 --> S1 --> S2 --> S3 --+--> S4 --> S7
                          +--> S5
                          +--> S6
```

S4, S5, S6 làm song song được sau S3. Checkpoint trình duyệt thật sau S4 và sau S7.

## 5. Không làm trong task này

- GT-002 — sau khi #275 đóng, một lát ở task con.
- 29 engine còn lại (`D-277-6`), danh sách theo nhóm: chọn 002, 009, 010, 011, 012, 018, 022, 025,
  026, 027, 029, 032 · đếm 030, 031 · kéo 004, 007, 008, 015, 021, 023 · ghép 005 · lật 020 · dãy
  006 · mê cung 013, 024 · thao tác 014, 016, 017, 019 · tạo lưới 033 · intro 000.
- Chế độ chơi tự do không đáp án — câu hỏi mở 2 của spec.
- Mascot asset thật — câu hỏi mở 1 của spec.
- Hợp nhất token CSS và `designTokens.ts` (kể cả `coral #c00500` trái `BR-DSC-07`).
- Victory modal có giọng và không chữ — đã là contract ở `BR-ENG-10`, `BR-FBK`; phục hồi ở task
  riêng, không cần spec.
- Thu mp3 lời dẫn — thuộc #274.

## 6. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Thu sân khấu làm portrait band `3-4` phân trang nhiều hơn | S0 đo trước; `BR-PSZ` cho phép thu lời dẫn còn một dòng trước khi phân trang |
| Đổi hình học layout đã publish là breaking (`BR-LAY-10`) | Mỗi pilot chạy lại level đã seed của engine đó trong test, không chỉ level mẫu |
| Hai plan cùng sửa `pages/play/[code].vue` với #275 | #277 chỉ chạm HUD, meta, resize; #275 chạm nhánh GT-002. Rebase trước mỗi lát |
| Test một vòng không bắt lỗi vòng hai (bài học #259) | Mỗi pilot có test hai vòng liên tiếp |

## 7. Câu hỏi mở

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Người đặt việc có muốn chế độ chơi tự do (câu hỏi mở 2 của spec) là task tiếp theo sau #277 không? | Thứ tự task con |
| 2 | Phía của khoá phụ huynh và nút hành động theo hướng đọc trái sang phải — có cần đổi cho trẻ thuận tay trái? | `BR-PSZ-03`, hoãn tới khi có phản hồi |
