# Kế hoạch — Task #33: P1.8 — Scaffolding, phản hồi, parent gate, hạn mức giờ

> Viết 2026-08-09. Bước sở hữu: **P1.8** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) ·
> [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) ·
> [`parent-gate.md`](../specs/04-play/parent-gate.md) ·
> [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Bốn spec, một chủ đề: **trẻ 3–6 không tự xoay xở được**, nên hệ thống phải chủ động.

- Trẻ **sẽ không xin trợ giúp** → trợ giúp leo thang theo đồng hồ hoặc miss, không theo yêu cầu.
- Trẻ học từ phản hồi tức thì, **im lặng là defect** → mọi thao tác có phản hồi, sai không bị trừng phạt.
- Trẻ chạm lung tung → nút thoát **không tap trúng được**, sau đó là thử thách ngoài tầm trẻ.
- Sản phẩm cho trẻ **không được** tối ưu cho thời gian màn hình → hạn mức là **tính năng**, và dừng phải êm.

Đây cũng là bước biến nhiều lời "cấm" thành cổng: cấm nút chơi thêm, cấm streak ép buộc, cấm
đếm ngược, cấm dữ liệu thanh toán trong khu vực chơi, cấm giọng chê.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `GAME-ENGINE-RUNTIME` | P1.2 | `focusIndex`, audio ramp, reduced-motion |
| `SCORING-AND-RESULT` | P1.7 | `celebration`, `stars`, hint không trừ điểm |
| `PLAY-SESSION-LIFECYCLE` | P1.6 | `duration_ms`, `paused_ms` |
| `ACCESS-GATING` | P1.3 | bước 6 quota đã cắm đường **402** |
| `ENTITLEMENT-MODEL` | P0.5 | trần theo gói |
| `CHILD-DATA-COMPLIANCE` | P0.4 | `BR-CDC-09` `BR-CDC-12` |
| `TELEMETRY-PIPELINE` | P1.5/P1.7 | `child_daily_stats.play_minutes` |

## 1. Đo được

### 1.1 Đã có

Engine với `focusIndex` và ràng buộc bề mặt trẻ (P1.2 T7); điểm và `celebration` dạng mã (P1.7);
`duration_ms` trừ `paused` (P1.6/P1.7); đường 402 trong `assertContentAccess` bước 6 (P1.3) —
hiện gọi một hàm quota **chưa có số thật**.

### 1.2 Chưa có

`systems/scaffolding.ts`, `systems/feedbackSystem.ts`, cổng phụ huynh, ba route hạn mức, màn
hình hết giờ, và bộ lời khen tiếng Việt.

### 1.3 Đã chốt, không mở lại

`D-AV` lời khen: P1 dùng **audio clip tĩnh + Web Speech API (TTS)**; fallback và đường
storage/authoring phải được đóng ở [`Task #80`](80-audio-contract-closure-plan.md), không mặc
định gán cho P2.7 ảnh ·
`D-DB` mascot Thỏ Tini ở mọi theme, background đổi theo theme · `D-AZ` trần 30/60/90 phút khớp
khuyến nghị AAP/WHO · `D-BB` gợi ý ngoài màn hình dùng **danh sách tĩnh 12 hoạt động** dạng seed.

## 2. Quyết định

**D-GN — thứ tự trong bước: phản hồi → scaffolding → parent gate → hạn mức.** Phản hồi trước vì
scaffolding **dùng lại** kênh của nó (highlight, âm dẫn hướng, ghost hand đều là phản hồi hình
và tiếng). Parent gate trước hạn mức vì `grant-extra-time` cần `gate_token`. Bốn spec không làm
song song bốn nhánh — thứ tự này là đường ngắn nhất mà mỗi bước để lại hệ thống chạy được.

**D-GO — `gate_token` do **server** cấp; cổng vẫn là UX, không phải auth.** Mâu thuẫn biểu kiến:
`BR-PGT-06` nói cổng là client-side và **không** thay guard server, nhưng §8 của
[`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) bắt `grant-extra-time` nhận
`gate_token` và trả **403** khi thiếu. Không thể vừa client-side vừa xác minh được. Xử: server
sinh thử thách (phép nhân, đáp án giữ ở server, TTL ngắn), client trả lời, server cấp
`gate_token` TTL **5 phút** gắn với phiên đăng nhập. Cổng vẫn không thay `requireUserAuth()` —
nó là **lớp thứ hai** cho đúng ba hành động nhạy cảm (đổi hạn mức, cấp thêm giờ, rời khu vực
chơi sang bề mặt người lớn). Ca âm `BR-PGT-06` giữ nguyên: sửa `sessionStorage` không đi vòng
được guard server.

**D-GP — ngưỡng khai dạng **dữ liệu**, vì chúng chắc chắn sẽ đổi.** Ba bảng: scaffolding
(band × cấp × [miss, giây]), trần gói (gói × trần × mặc định), ngân sách ăn mừng (bình thường ×
reduced-motion). §11 Q1 của scaffolding ghi rõ ngưỡng hiện là **số ước lượng, cần đo với trẻ
thật**, chặn *P1 nghiệm thu*. Dữ liệu hoá là điều kiện để chỉnh sau khi đo mà không phải sửa
logic.

**D-GQ — mọi "cấm trên bề mặt trẻ" gom vào **một cổng quét**, không rải thành test lẻ.** Danh
sách: không nút "chơi thêm" · không streak ép buộc · không đếm ngược tạo áp lực · không thông
báo dụ quay lại · không dữ liệu thanh toán dưới `pages/play` · không giọng chê trong chuỗi
audio và lời · không token `danger`/đỏ trên canvas · không con số điểm. Mỗi mục là một rule của
cùng một cổng, có ca âm riêng. Rải ra thì mục thứ chín (thêm ở P2) sẽ không ai nhớ thêm test.

**D-GR — chỉ dẫn và lời khen dùng **cùng** đường âm thanh, và điều đó **đóng** §11 Q3 của
[`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md).** `D-AV` đã chốt cho
lời khen: clip tĩnh + Web Speech TTS ở P1. Câu hỏi narration mà `D-FI` nêu lên ở P1.2 là **cùng
một câu hỏi**; trả lời khác nhau cho hai chỗ là hai đường audio phải bảo trì. Áp `D-AV` cho cả
chỉ dẫn level. P1 chỉ nghiệm thu khi fallback trên thiết bị chuẩn đã có test; thu âm người thật
và audio authoring chưa có spec owner, phải đi qua Task #80 trước code.

**D-GS — hạn mức nối vào **đường 402 đã có**, không tạo đường thứ hai.** P1.3 đã cắm bước 6 vào
`assertContentAccess`. Bước này thay hàm quota "chưa giới hạn" bằng số thật đọc từ
`child_daily_stats`. Cấm thêm chỗ kiểm hạn mức nào khác — hai chỗ kiểm là hai chỗ lệch.

## 3. Đồ thị

```
T1 feedbackSystem: bảng phản hồi §7.1 · lời khen xoay vòng · ngân sách ăn mừng
      └──→ T2 scaffolding: 3 cấp × 3 band, leo thang tự động, focusIndex
                └──→ T3 cổng quét "cấm trên bề mặt trẻ" (D-GQ)
  T4 parent gate: long-press 800ms · thử thách server-issued · cửa sổ 5 phút
      └──→ T5 hạn mức: đếm theo ICT · 3 route · nối 402 · màn hình hết giờ
                          ── Cổng dừng ──
  T6 evidence, promote 4 spec, đóng engine §11 Q3
```

## 4. Task

### Task 1 — Hệ thống phản hồi

**Tiêu chí nghiệm thu**
- [ ] Bảng §7.1 khai dạng dữ liệu: nhấc · đúng · chưa đúng · hoàn thành level (màu token, chuyển động, âm).
- [ ] `BR-FBK-02`: sai **luôn** có phản hồi — nhịp hổ phách trên target + âm + item trôi về chỗ cũ. Ca âm im lặng → **đỏ**.
- [ ] `BR-FBK-01` `BR-FBK-03`: không `danger`/đỏ, không buzzer, không rung mạnh, không trừ điểm; "chưa đúng" dùng token `retry` hổ phách.
- [ ] `BR-FBK-05`: pop khi đúng phát ra **tại điểm chạm**, không từ toạ độ cố định.
- [ ] `BR-FBK-07`: sai 5 lần liên tiếp → phản hồi lần 5 **giống hệt** lần 1.
- [ ] `BR-FBK-04`: ăn mừng lớn **chỉ** khi hoàn thành level; item đúng chỉ pop nhỏ.
- [ ] `BR-FBK-06`: ca âm màn hình đơn sắc — vẫn phân biệt đúng/chưa đúng qua chuyển động.
- [ ] `BR-FBK-09`: `reduced-motion` → ăn mừng còn **một nhịp scale 400ms**, vẫn có âm.
- [ ] `BR-FBK-10`: mọi SFX ramp vào ≥20ms, ra ≥40ms, master ceiling cưỡng chế trong code.
- [ ] Ngân sách §7.3: 1,2s / ≤40 hạt (object pool) / reduced-motion 400ms, 0 hạt.
- [ ] Bộ lời khen §7.2 xoay vòng, **không lặp liên tiếp**; `BR-FBK-08` không so sánh trẻ với trẻ khác; cấm "Sai rồi", "Không đúng", "Bé chưa giỏi".
- [ ] Audio theo `D-AV`: clip tĩnh + Web Speech TTS (`D-GR`).
- [ ] Ca âm từ Task #80: thiết bị không có giọng `vi-VN` hoặc `speechSynthesis` fail → dùng asset tĩnh hay trình diễn hình đã duyệt; không im lặng và không crash phiên.

**Kiểm chứng**
- [ ] `pnpm test -- feedback` xanh, assertion tham chiếu `BR-FBK-01` `BR-FBK-02` `BR-FBK-07`.

**Phụ thuộc:** P1.2 · P1.7 · **Cỡ:** M

### Task 2 — Scaffolding leo thang

**Tiêu chí nghiệm thu**
- [ ] Bảng §7.1 dạng dữ liệu (`D-GP`): 3–4 → 1/10s · 2/18s · 3/25s; 4–5 → 2/15s · 3/25s · 4/35s; 5–6 → 2/20s · 3/30s · 5/40s. Điều kiện **hoặc**, cái nào đến trước.
- [ ] Ba cấp §7.2: L1 highlight nhịp thở · L2 ghost hand tốc độ thật một lần + âm dẫn · L3 ghost hand 0,5× lặp + lời hướng dẫn.
- [ ] `BR-SCF-01`: leo thang **tự động**; ca âm — quét UI bề mặt trẻ, **không** control nào gọi hint theo yêu cầu; không event `hint_requested` với `source: "user"`.
- [ ] `BR-SCF-05`: ca âm — cùng level, band 3–4 đã ở L1 sau 12 giây trong khi band 5–6 vẫn L0.
- [ ] `BR-SCF-03`: mỗi lần scaffolding hoạt động **gán** `engine.focusIndex`; chỉ một phần tử động (`BR-ENG-09`).
- [ ] `BR-SCF-04`: ở L3 thêm 60 giây không thao tác → round **không** tự hoàn thành; sau 3 chu kỳ gợi ý chuyển round (`round_skipped`).
- [ ] `BR-SCF-06`: `reduced-motion` → ghost hand thành highlight nhấp nháy chậm, **vẫn có** trình diễn.
- [ ] `BR-SCF-07`: phát `scaffold_escalated { round_index, level, trigger, elapsed_ms }` và `demo_shown { round_index, speed }`.
- [ ] `BR-SCF-02`: hint **không** trừ điểm — kiểm bằng property test của P1.7.
- [ ] `BR-SCF-08`: ca âm — không chuỗi audio nào mang nghĩa trách hoặc so sánh.
- [ ] Round retry: đồng hồ reset, bộ đếm miss **không** reset.
- [ ] API §8 đúng: `tick(deltaMs, state, ageBand)`, `onMiss`, `onSuccess` (reset về 0).

**Kiểm chứng**
- [ ] `pnpm test -- scaffolding` xanh, assertion tham chiếu `BR-SCF-01` `BR-SCF-04` `BR-SCF-05`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Cổng "cấm trên bề mặt trẻ"

**Tiêu chí nghiệm thu**
- [ ] Tám rule của `D-GQ` nằm trong **một** cổng, mỗi rule một ca âm.
- [ ] `BR-HPL-05`: không nút "chơi thêm", không streak ép buộc, không đếm ngược gây áp lực, không thông báo dụ quay lại.
- [ ] `BR-PGT-05`: quét `pages/play` — không component nào hiện số tiền, gói, hay đơn hàng.
- [ ] `BR-SCO-02`: không chuỗi số biểu diễn điểm trên bề mặt trẻ (dùng lại cổng P1.7).
- [ ] `BR-FBK-01` `BR-DSC-07`: không token `danger`/đỏ trên canvas.
- [ ] Thêm rule thứ chín phải sửa **một** chỗ.

**Kiểm chứng**
- [ ] `pnpm lint:kid-surface` xanh trên repo sạch, đỏ trên **từng** fixture vi phạm.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — Cổng phụ huynh

**Tiêu chí nghiệm thu**
- [ ] `BR-PGT-01`: nút thoát **không tap trúng được**; chỉ long-press **800ms** mở cổng.
- [ ] `BR-PGT-02` `BR-PGT-07`: thử thách là **phép nhân hai số một chữ số**, nhập bằng bàn phím số lớn; không chữ cần đọc trôi chảy; không mật khẩu, không năm sinh, không giữ nút.
- [ ] `D-GO`: server sinh thử thách và giữ đáp án; đúng → cấp `gate_token` TTL **5 phút** gắn phiên đăng nhập.
- [ ] `BR-PGT-04`: trong cửa sổ tin cậy **không** hỏi lại; sau 5 phút hỏi lại; trạng thái ở `sessionStorage`, không cookie.
- [ ] `BR-PGT-03`: sai → quay lại game, **không** thông báo tiêu cực.
- [ ] Sai 3 lần → khoá cổng **60 giây**, trẻ quay lại game bình thường.
- [ ] `BR-PGT-06` ca âm: sửa `sessionStorage` để bỏ qua cổng → API bề mặt người lớn **vẫn** kiểm `requireUserAuth()`.
- [ ] Cổng bắt buộc ở đủ 5 nơi §3; **cấm** cổng ở cài đặt âm thanh và chuyển động (trẻ tự chỉnh được).
- [ ] Event `parent_gate_shown` `parent_gate_passed` `parent_gate_failed` với `attempts`.

**Kiểm chứng**
- [ ] `pnpm test -- parent-gate` xanh, assertion tham chiếu `BR-PGT-01` `BR-PGT-04` `BR-PGT-06`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 5 — Hạn mức giờ chơi

**Tiêu chí nghiệm thu**
- [ ] Trần §7.1 dạng dữ liệu: guest không đếm · login 30/30 · standard 60/**45** · premium 90/**60**. Mặc định **thấp hơn** trần.
- [ ] `BR-HPL-08`: đặt cap > trần gói → **422**.
- [ ] `BR-HPL-01`: hạn mức **theo từng trẻ**; ca âm — trẻ A hết, trẻ B vẫn chơi đủ.
- [ ] `BR-HPL-03`: ranh giới ngày **ICT**, dùng hàm của `D-GB`; ca âm đổi múi giờ thiết bị → vẫn 402.
- [ ] `BR-HPL-07`: đếm `duration_ms − paused_ms`; ca âm tab nền 20 phút **không** cộng.
- [ ] `BR-HPL-02`: hết hạn mức giữa phiên → phiên hiện tại **chạy hết**; phiên mới 402 (nối đường P1.3, `D-GS`).
- [ ] Ba route: `GET play-budget` (`cap`/`used`/`remaining`/`resets_at`) · `PATCH settings` · `POST grant-extra-time` (≤30 phút/ngày, ghi lại).
- [ ] `BR-HPL-06`: `grant-extra-time` thiếu `gate_token` hợp lệ → **403**.
- [ ] `BR-HPL-04`: màn hình hết giờ — mascot vẫy tay, lời ấm áp, **2 gợi ý ngoài màn hình** từ seed 12 hoạt động (`D-BB`), **không** nút chơi thêm, nút duy nhất dẫn qua Parent Gate.
- [ ] Người lớn tăng hạn mức giữa ngày → hiệu lực **ngay**.

**Kiểm chứng**
- [ ] `pnpm test -- play-limits` xanh, assertion tham chiếu `BR-HPL-02` `BR-HPL-03` `BR-HPL-08`.

**Phụ thuộc:** T4 · P1.3 · **Cỡ:** M

### Cổng dừng

- [ ] Trẻ band 3–4 bế tắc 10 giây → có trợ giúp, **không** cần thao tác nào.
- [ ] Sai luôn có phản hồi, không đỏ, không tăng cường độ.
- [ ] Nút thoát không tap trúng được; qua cổng bằng phép nhân; sửa storage không đi vòng được server.
- [ ] Hết hạn mức không cắt phiên đang chạy; đổi giờ thiết bị không lách được.
- [ ] `pnpm lint:kid-surface` đã đỏ trên **từng** fixture của tám rule.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 6 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-SCF-*` `BR-FBK-*` `BR-PGT-*` `BR-HPL-*` có ít nhất một test tham chiếu mã rule.
- [ ] Bốn spec sang `implemented`.
- [ ] Đóng §11 Q3 của [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) bằng `D-GR` (áp `D-AV`).
- [ ] Task #80 đã đồng bộ câu hỏi audio ở taxonomy/engine, owner storage/authoring và ma trận fallback; không còn lời hứa trần “thu studio ở P2”.
- [ ] Ghi lại §11 Q1 của scaffolding: ngưỡng cần đo với trẻ thật — **chặn nghiệm thu P1**, chủ Studio UI.
- [ ] Ghi lại §11 Q2 của scaffolding (hint_rate cao = khó hay sai?) và Q2 của parent-gate (fail > 15%) thành **ngưỡng KPI** theo dõi ở P1.16.
- [ ] Tick **P1.8** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Thêm nút "xin trợ giúp" cho tiện | Trẻ 3 tuổi không bấm — quay lại đúng vấn đề spec giải | `BR-SCF-01` — ca âm quét UI |
| Im lặng khi sai | Trẻ không biết mình đã thao tác | `BR-FBK-02` — im lặng là **defect**, có ca âm |
| Tăng cường độ phản hồi khi sai nhiều | Đọc thành trách móc | `BR-FBK-07` — so lần 5 với lần 1 |
| Hệ thống làm hộ khi trẻ bế tắc | Trẻ mất cơ hội là người thao tác cuối | `BR-SCF-04` — giữ L3, gợi ý chuyển round |
| `gate_token` chỉ ở client | Trẻ hoặc script bỏ qua được cấp thêm giờ | `D-GO` — server sinh thử thách, giữ đáp án |
| Kiểm hạn mức ở hai chỗ | Hai chỗ lệch, một chỗ cho qua | `D-GS` — nối vào bước 6 của gating |
| Cắt phiên khi hết giờ | Trẻ đang chơi bị cắt ngang | `BR-HPL-02` — ca âm |
| Cơ chế kéo dài lẻn vào ở P2 | Vi phạm `BR-CDC-09`, mất lý do phụ huynh tin sản phẩm | `D-GQ` — một cổng, dễ thêm rule |
| Ngưỡng scaffolding sai với trẻ thật | Trợ giúp quá sớm hoặc quá muộn | `D-GP` — dữ liệu hoá, chỉnh sau khi đo |

## 6. Giả định

1. **P1.7 đã đóng** — `celebration` và `stars` có, hint không trừ điểm đã có property test.
2. **P1.6 đã đóng** — `duration_ms`, `paused_ms`, phiên terminal.
3. **P1.3 đã đóng** — bước 6 quota đã cắm đường 402.
4. **Lesson chưa tồn tại ở P1** — gợi ý ngoài màn hình dùng seed tĩnh 12 hoạt động (`D-BB`).
5. **Màn hình cài đặt trẻ đầy đủ ở P1.9** — bước này chỉ cần route `PATCH settings` và một chỗ đặt hạn mức.
6. **Mascot Thỏ Tini** dùng chung mọi theme (`D-DB`).

## 7. Ngoài phạm vi

- Quản lý hồ sơ trẻ, chọn trẻ chơi — P1.9.
- Báo cáo thời gian chơi cho người lớn — P1.12.
- Thu âm studio và audio picker/upload — ngoài bước này; chỉ nhận phase sau khi Task #80 tạo spec owner và implementation task được người duyệt.
- Hạn mức theo tuần — P3 (§11 Q2).
- PWA toàn màn hình để chặn nút back — P5 (parent-gate §11 Q1).
