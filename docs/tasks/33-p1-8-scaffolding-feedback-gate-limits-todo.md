# Checklist — Task #33: P1.8 — Scaffolding, phản hồi, parent gate, hạn mức giờ

> Kế hoạch: [`33-p1-8-scaffolding-feedback-gate-limits-plan.md`](33-p1-8-scaffolding-feedback-gate-limits-plan.md).
> Thứ tự trong bước không đảo: **phản hồi → scaffolding → parent gate → hạn mức** (`D-GN`).
> Bước này biến nhiều lời "cấm" thành **một cổng quét** (`D-GQ`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P1.7 đã đóng** — `celebration`, `stars`, hint không trừ điểm.
- [x] **P1.6 đã đóng** — `duration_ms`, `paused_ms`.
- [x] **P1.3 đã đóng** — bước 6 quota đã có đường 402.
- [x] [`Task #80`](80-audio-contract-closure-plan.md) đã duyệt ma trận audio/fallback; không dùng Web Speech như giả định không test.
- [x] Human approve kế hoạch và sáu quyết định D-GN · D-GO · D-GP · D-GQ · D-GR · D-GS.
- [x] Đối chiếu `BR-SCF-*` `BR-FBK-*` `BR-PGT-*` `BR-HPL-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Hệ thống phản hồi

- [x] Bảng phản hồi §7.1 dạng dữ liệu (nhấc · đúng · chưa đúng · hoàn thành).
- [x] `BR-FBK-02` sai luôn có phản hồi: nhịp hổ phách + âm + item trôi về.
- [x] **Ca âm: im lặng khi sai → đỏ.**
- [x] `BR-FBK-01` không đỏ · không buzzer · không rung mạnh · không trừ điểm.
- [x] `BR-FBK-03` "chưa đúng" dùng token `retry`, không `danger`.
- [x] `BR-FBK-05` pop phát ra **tại điểm chạm**.
- [x] `BR-FBK-07` sai 5 lần → phản hồi lần 5 giống lần 1.
- [x] `BR-FBK-04` ăn mừng lớn chỉ khi hoàn thành level.
- [x] `BR-FBK-06` ca âm màn hình đơn sắc vẫn phân biệt được.
- [x] `BR-FBK-09` reduced-motion → nhịp scale 400ms, vẫn có âm.
- [x] `BR-FBK-10` SFX ramp vào ≥20ms, ra ≥40ms, ceiling cưỡng chế.
- [x] Ngân sách ăn mừng: 1,2s · ≤40 hạt pool · reduced-motion 400ms/0 hạt.
- [x] Lời khen xoay vòng, không lặp liên tiếp.
- [x] `BR-FBK-08` không so sánh trẻ với trẻ khác.
- [x] Cấm chuỗi "Sai rồi" · "Không đúng" · "Bé chưa giỏi".
- [x] Audio theo `D-AV`: clip tĩnh + Web Speech TTS.
- [x] Không có `vi-VN`/Web Speech fail → fallback đã duyệt vẫn phát chỉ dẫn hoặc trình diễn hình; phiên không crash, không im lặng.

### Task 2 — Scaffolding leo thang

- [x] Bảng ngưỡng ba band dạng dữ liệu, điều kiện **hoặc**.
- [x] L1 highlight nhịp thở.
- [x] L2 ghost hand tốc độ thật, một lần, âm dẫn hướng.
- [x] L3 ghost hand 0,5× lặp + lời hướng dẫn tiếng Việt.
- [x] `BR-SCF-01` ca âm: không control nào gọi hint theo yêu cầu.
- [x] `BR-SCF-01` ca âm: không event `hint_requested` với `source: "user"`.
- [x] `BR-SCF-05` ca âm: 12 giây → band 3–4 ở L1, band 5–6 vẫn L0.
- [x] `BR-SCF-03` gán `engine.focusIndex`; chỉ một phần tử động.
- [x] `BR-SCF-04` L3 + 60 giây → round **không** tự hoàn thành.
- [x] Sau 3 chu kỳ → gợi ý chuyển round (`round_skipped`).
- [x] `BR-SCF-06` reduced-motion → highlight nhấp nháy chậm, vẫn có trình diễn.
- [x] `BR-SCF-07` phát `scaffold_escalated` và `demo_shown`.
- [x] `BR-SCF-08` ca âm: không chuỗi audio nào mang giọng chê.
- [x] Round retry: đồng hồ reset, bộ đếm miss **không** reset.
- [x] API `tick` / `onMiss` / `onSuccess` đúng §8.

### Task 3 — Cổng "cấm trên bề mặt trẻ" (`D-GQ`)

- [x] Không nút "chơi thêm".
- [x] Không streak ép buộc.
- [x] Không đếm ngược gây áp lực.
- [x] Không thông báo dụ quay lại.
- [x] `BR-PGT-05` không số tiền / gói / đơn hàng dưới `pages/play`.
- [x] Không chuỗi số biểu diễn điểm trên bề mặt trẻ.
- [x] Không token `danger`/đỏ trên canvas.
- [x] Không giọng chê trong audio và lời.
- [x] **Mỗi rule một fixture vi phạm, cổng đỏ trên từng cái.**

### Task 4 — Cổng phụ huynh

- [x] `BR-PGT-01` nút thoát không tap trúng được; long-press **800ms**.
- [x] `BR-PGT-02` thử thách phép nhân hai số một chữ số, bàn phím số lớn.
- [x] `BR-PGT-07` không chữ cần đọc trôi chảy.
- [x] Không mật khẩu · không năm sinh · không giữ nút · không ngày tháng.
- [x] `D-GO` server sinh thử thách, giữ đáp án, cấp `gate_token` TTL 5 phút.
- [x] `BR-PGT-04` trong cửa sổ tin cậy không hỏi lại; sau 5 phút hỏi lại.
- [x] Trạng thái ở `sessionStorage`, **không** cookie.
- [x] `BR-PGT-03` sai → quay lại game, không thông báo tiêu cực.
- [x] Sai 3 lần → khoá 60 giây.
- [x] `BR-PGT-06` ca âm: sửa `sessionStorage` → API vẫn kiểm `requireUserAuth()`.
- [x] Cổng có ở đủ 5 nơi §3.
- [x] **Không** cổng ở cài đặt âm thanh và chuyển động.
- [x] Event `parent_gate_shown` · `parent_gate_passed` · `parent_gate_failed`.

### Task 5 — Hạn mức giờ chơi

- [x] Trần dạng dữ liệu: guest — · login 30/30 · standard 60/45 · premium 90/60.
- [x] `BR-HPL-08` đặt cap > trần → **422**.
- [x] `BR-HPL-01` ca âm: trẻ A hết hạn mức, trẻ B vẫn chơi đủ.
- [x] `BR-HPL-03` ranh giới ngày ICT dùng hàm `D-GB`.
- [x] `BR-HPL-03` ca âm: đổi múi giờ thiết bị → vẫn 402.
- [x] `BR-HPL-07` ca âm: tab nền 20 phút không cộng vào `play_minutes`.
- [x] `BR-HPL-02` hết giữa phiên → phiên hiện tại chạy hết; phiên mới 402.
- [x] `GET /api/users/children/{uuid}/play-budget` trả `cap`/`used`/`remaining`/`resets_at`.
- [x] `PATCH /api/users/children/{uuid}/settings` đặt `daily_play_cap_minutes`.
- [x] `POST /api/users/children/{uuid}/grant-extra-time` ≤ 30 phút/ngày, ghi lại.
- [x] `BR-HPL-06` thiếu `gate_token` hợp lệ → **403**.
- [x] Màn hình hết giờ: mascot vẫy tay + lời ấm áp + 2 gợi ý ngoài màn hình (`D-BB`).
- [x] Màn hình hết giờ **không** có nút chơi thêm; nút duy nhất dẫn qua Parent Gate.
- [x] Tăng hạn mức giữa ngày → hiệu lực ngay.

## Cổng dừng

- [x] Band 3–4 bế tắc 10 giây → có trợ giúp, không cần thao tác nào.
- [x] Sai luôn có phản hồi; không đỏ; cường độ không tăng.
- [x] Nút thoát không tap trúng được; sửa storage không đi vòng được server.
- [x] Hết hạn mức không cắt phiên đang chạy; đổi giờ thiết bị không lách được.
- [x] `pnpm --filter @mindkid/gates test` đỏ trên **từng** fixture của tám rule.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 6 — Evidence và promote

- [x] Mỗi `BR-SCF-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-FBK-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-PGT-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-HPL-*` có test tham chiếu mã rule.
- [x] [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) → `implemented`.
- [x] [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) → `implemented`.
- [x] [`parent-gate.md`](../specs/04-play/parent-gate.md) → `implemented`.
- [x] [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) → `implemented`.
- [x] Đóng §11 Q3 của [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) bằng `D-GR`.
- [x] Task #80 đã tạo owner cho storage/authoring; không gán nhầm audio vào Task #49 ảnh.
- [x] Tick **P1.8** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Ngưỡng scaffolding cần đo với trẻ thật — **chặn nghiệm thu P1**, chủ Studio UI.
- [ ] `hint_rate` > 40% + `drop_rate` > 20% = level sai độ khó → ngưỡng KPI theo dõi ở P1.16.
- [ ] Tỉ lệ fail parent gate > 15% = thử thách quá khó → KPI theo dõi ở P1.16.
- [ ] Hạn mức theo tuần — P3.
- [ ] PWA toàn màn hình để chặn nút back — P5.
