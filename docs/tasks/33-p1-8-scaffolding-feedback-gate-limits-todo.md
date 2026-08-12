# Checklist — Task #33: P1.8 — Scaffolding, phản hồi, parent gate, hạn mức giờ

> Kế hoạch: [`33-p1-8-scaffolding-feedback-gate-limits-plan.md`](33-p1-8-scaffolding-feedback-gate-limits-plan.md).
> Thứ tự trong bước không đảo: **phản hồi → scaffolding → parent gate → hạn mức** (`D-GN`).
> Bước này biến nhiều lời "cấm" thành **một cổng quét** (`D-GQ`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.7 đã đóng** — `celebration`, `stars`, hint không trừ điểm.
- [ ] **P1.6 đã đóng** — `duration_ms`, `paused_ms`.
- [ ] **P1.3 đã đóng** — bước 6 quota đã có đường 402.
- [ ] [`Task #80`](80-audio-contract-closure-plan.md) đã duyệt ma trận audio/fallback; không dùng Web Speech như giả định không test.
- [ ] Human approve kế hoạch và sáu quyết định D-GN · D-GO · D-GP · D-GQ · D-GR · D-GS.
- [ ] Đối chiếu `BR-SCF-*` `BR-FBK-*` `BR-PGT-*` `BR-HPL-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Hệ thống phản hồi

- [ ] Bảng phản hồi §7.1 dạng dữ liệu (nhấc · đúng · chưa đúng · hoàn thành).
- [ ] `BR-FBK-02` sai luôn có phản hồi: nhịp hổ phách + âm + item trôi về.
- [ ] **Ca âm: im lặng khi sai → đỏ.**
- [ ] `BR-FBK-01` không đỏ · không buzzer · không rung mạnh · không trừ điểm.
- [ ] `BR-FBK-03` "chưa đúng" dùng token `retry`, không `danger`.
- [ ] `BR-FBK-05` pop phát ra **tại điểm chạm**.
- [ ] `BR-FBK-07` sai 5 lần → phản hồi lần 5 giống lần 1.
- [ ] `BR-FBK-04` ăn mừng lớn chỉ khi hoàn thành level.
- [ ] `BR-FBK-06` ca âm màn hình đơn sắc vẫn phân biệt được.
- [ ] `BR-FBK-09` reduced-motion → nhịp scale 400ms, vẫn có âm.
- [ ] `BR-FBK-10` SFX ramp vào ≥20ms, ra ≥40ms, ceiling cưỡng chế.
- [ ] Ngân sách ăn mừng: 1,2s · ≤40 hạt pool · reduced-motion 400ms/0 hạt.
- [ ] Lời khen xoay vòng, không lặp liên tiếp.
- [ ] `BR-FBK-08` không so sánh trẻ với trẻ khác.
- [ ] Cấm chuỗi "Sai rồi" · "Không đúng" · "Bé chưa giỏi".
- [ ] Audio theo `D-AV`: clip tĩnh + Web Speech TTS.
- [ ] Không có `vi-VN`/Web Speech fail → fallback đã duyệt vẫn phát chỉ dẫn hoặc trình diễn hình; phiên không crash, không im lặng.

### Task 2 — Scaffolding leo thang

- [ ] Bảng ngưỡng ba band dạng dữ liệu, điều kiện **hoặc**.
- [ ] L1 highlight nhịp thở.
- [ ] L2 ghost hand tốc độ thật, một lần, âm dẫn hướng.
- [ ] L3 ghost hand 0,5× lặp + lời hướng dẫn tiếng Việt.
- [ ] `BR-SCF-01` ca âm: không control nào gọi hint theo yêu cầu.
- [ ] `BR-SCF-01` ca âm: không event `hint_requested` với `source: "user"`.
- [ ] `BR-SCF-05` ca âm: 12 giây → band 3–4 ở L1, band 5–6 vẫn L0.
- [ ] `BR-SCF-03` gán `engine.focusIndex`; chỉ một phần tử động.
- [ ] `BR-SCF-04` L3 + 60 giây → round **không** tự hoàn thành.
- [ ] Sau 3 chu kỳ → gợi ý chuyển round (`round_skipped`).
- [ ] `BR-SCF-06` reduced-motion → highlight nhấp nháy chậm, vẫn có trình diễn.
- [ ] `BR-SCF-07` phát `scaffold_escalated` và `demo_shown`.
- [ ] `BR-SCF-08` ca âm: không chuỗi audio nào mang giọng chê.
- [ ] Round retry: đồng hồ reset, bộ đếm miss **không** reset.
- [ ] API `tick` / `onMiss` / `onSuccess` đúng §8.

### Task 3 — Cổng "cấm trên bề mặt trẻ" (`D-GQ`)

- [ ] Không nút "chơi thêm".
- [ ] Không streak ép buộc.
- [ ] Không đếm ngược gây áp lực.
- [ ] Không thông báo dụ quay lại.
- [ ] `BR-PGT-05` không số tiền / gói / đơn hàng dưới `pages/play`.
- [ ] Không chuỗi số biểu diễn điểm trên bề mặt trẻ.
- [ ] Không token `danger`/đỏ trên canvas.
- [ ] Không giọng chê trong audio và lời.
- [ ] **Mỗi rule một fixture vi phạm, cổng đỏ trên từng cái.**

### Task 4 — Cổng phụ huynh

- [ ] `BR-PGT-01` nút thoát không tap trúng được; long-press **800ms**.
- [ ] `BR-PGT-02` thử thách phép nhân hai số một chữ số, bàn phím số lớn.
- [ ] `BR-PGT-07` không chữ cần đọc trôi chảy.
- [ ] Không mật khẩu · không năm sinh · không giữ nút · không ngày tháng.
- [ ] `D-GO` server sinh thử thách, giữ đáp án, cấp `gate_token` TTL 5 phút.
- [ ] `BR-PGT-04` trong cửa sổ tin cậy không hỏi lại; sau 5 phút hỏi lại.
- [ ] Trạng thái ở `sessionStorage`, **không** cookie.
- [ ] `BR-PGT-03` sai → quay lại game, không thông báo tiêu cực.
- [ ] Sai 3 lần → khoá 60 giây.
- [ ] `BR-PGT-06` ca âm: sửa `sessionStorage` → API vẫn kiểm `requireUserAuth()`.
- [ ] Cổng có ở đủ 5 nơi §3.
- [ ] **Không** cổng ở cài đặt âm thanh và chuyển động.
- [ ] Event `parent_gate_shown` · `parent_gate_passed` · `parent_gate_failed`.

### Task 5 — Hạn mức giờ chơi

- [ ] Trần dạng dữ liệu: guest — · login 30/30 · standard 60/45 · premium 90/60.
- [ ] `BR-HPL-08` đặt cap > trần → **422**.
- [ ] `BR-HPL-01` ca âm: trẻ A hết hạn mức, trẻ B vẫn chơi đủ.
- [ ] `BR-HPL-03` ranh giới ngày ICT dùng hàm `D-GB`.
- [ ] `BR-HPL-03` ca âm: đổi múi giờ thiết bị → vẫn 402.
- [ ] `BR-HPL-07` ca âm: tab nền 20 phút không cộng vào `play_minutes`.
- [ ] `BR-HPL-02` hết giữa phiên → phiên hiện tại chạy hết; phiên mới 402.
- [ ] `GET /api/users/children/{uuid}/play-budget` trả `cap`/`used`/`remaining`/`resets_at`.
- [ ] `PATCH /api/users/children/{uuid}/settings` đặt `daily_play_cap_minutes`.
- [ ] `POST /api/users/children/{uuid}/grant-extra-time` ≤ 30 phút/ngày, ghi lại.
- [ ] `BR-HPL-06` thiếu `gate_token` hợp lệ → **403**.
- [ ] Màn hình hết giờ: mascot vẫy tay + lời ấm áp + 2 gợi ý ngoài màn hình (`D-BB`).
- [ ] Màn hình hết giờ **không** có nút chơi thêm; nút duy nhất dẫn qua Parent Gate.
- [ ] Tăng hạn mức giữa ngày → hiệu lực ngay.

## Cổng dừng

- [ ] Band 3–4 bế tắc 10 giây → có trợ giúp, không cần thao tác nào.
- [ ] Sai luôn có phản hồi; không đỏ; cường độ không tăng.
- [ ] Nút thoát không tap trúng được; sửa storage không đi vòng được server.
- [ ] Hết hạn mức không cắt phiên đang chạy; đổi giờ thiết bị không lách được.
- [ ] `pnpm lint:kid-surface` đỏ trên **từng** fixture của tám rule.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence và promote

- [ ] Mỗi `BR-SCF-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-FBK-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-PGT-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-HPL-*` có test tham chiếu mã rule.
- [ ] [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) → `implemented`.
- [ ] [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) → `implemented`.
- [ ] [`parent-gate.md`](../specs/04-play/parent-gate.md) → `implemented`.
- [ ] [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) → `implemented`.
- [ ] Đóng §11 Q3 của [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) bằng `D-GR`.
- [ ] Task #80 đã tạo owner cho storage/authoring; không gán nhầm audio vào Task #49 ảnh.
- [ ] Tick **P1.8** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Ngưỡng scaffolding cần đo với trẻ thật — **chặn nghiệm thu P1**, chủ Studio UI.
- [ ] `hint_rate` > 40% + `drop_rate` > 20% = level sai độ khó → ngưỡng KPI theo dõi ở P1.16.
- [ ] Tỉ lệ fail parent gate > 15% = thử thách quá khó → KPI theo dõi ở P1.16.
- [ ] Hạn mức theo tuần — P3.
- [ ] PWA toàn màn hình để chặn nút back — P5.
