# Checklist — Task #32: P1.7 — Tính điểm ở server

> Kế hoạch: [`32-p1-7-scoring-and-result-plan.md`](32-p1-7-scoring-and-result-plan.md).
> Hai bề mặt, hai thứ khác nhau: **số** cho hệ thống, **sao** cho trẻ. Không lẫn.
> Bước này đóng ba nợ: `rollup:session` · `BR-TLM-04` · `score`/`stars` của P1.6.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.6 đã đóng** — chuỗi event đủ, route complete trả `null` cho điểm.
- [ ] **P1.5 đã đóng** — `rollup:session` có trong registry, bảng rollup sẵn.
- [ ] Human approve kế hoạch và năm quyết định D-GI · D-GJ · D-GK · D-GL · D-GM.
- [ ] Đối chiếu `BR-SCO-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Dựng lại chuỗi round

- [ ] Nạp event theo `seq`, dựng round `round_started` … `round_completed`.
- [ ] Thiếu `round_completed` → suy từ `answer_correct` cuối + log cảnh báo.
- [ ] Event mâu thuẫn cùng attempt → lấy cái **đến sau** + log cảnh báo.
- [ ] Không round nào hoàn thành → `raw_score = 0`, không ghi mastery.
- [ ] `duration_ms` trừ thời gian `paused`; ca âm phiên có 2 lần pause.
- [ ] `rounds_total` = số `round_started`.
- [ ] `rounds_correct` = round đúng **ngay lần đầu**.
- [ ] `attempt_count` · `correct_count` · `incorrect_count`.
- [ ] `hint_count` = `hint_requested` + `scaffold_escalated`.
- [ ] `retry_count` = `round_retried`.

### Task 2 — `computeSessionResult()` thuần

- [ ] Hàm thuần: không DB, không giờ hệ thống, không random.
- [ ] `first_try_ratio` và `accuracy` đúng §7.2.
- [ ] `normalized_score = clamp01(0.6 · first_try_ratio + 0.4 · accuracy)`.
- [ ] Trọng số và ngưỡng là **hằng số có tên, một chỗ** (`D-GM`).
- [ ] `BR-SCO-04` `normalized_score ∈ [0,1]`.
- [ ] `BR-SCO-05` sàn 0; ca âm sai toàn bộ → 0, không âm.
- [ ] `BR-SCO-01` không đọc giá trị điểm nào từ client.
- [ ] Gọi hai lần cùng chuỗi → kết quả giống hệt.

### Task 3 — Sao

- [ ] ≥0,85 → 3 sao.
- [ ] ≥0,55 → 2 sao.
- [ ] Hoàn thành → **1 sao** (ca âm `normalized_score = 0.2` → 1 sao).
- [ ] Chưa hoàn thành → không sao.
- [ ] `BR-SCO-06` hai phiên cùng kết quả, khác tốc độ → cùng sao.
- [ ] `BR-SCO-07` phiên `abandoned` → `stars = null`.
- [ ] `D-GL` phiên `abandoned` **vẫn** có `normalized_score` cho báo cáo.
- [ ] `BR-SCO-08` `celebration` luôn tích cực.

### Task 4 — Ranh giới hai bề mặt

- [ ] Response complete đúng §8: `stars` · `rounds_correct` · `rounds_total` · `celebration` · `next_suggestion`.
- [ ] `BR-SCO-02` response **không** chứa `normalized_score`.
- [ ] `BR-SCO-02` response **không** chứa `raw_score`.
- [ ] Cổng quét schema response → có trường điểm là đỏ.
- [ ] Ca âm UI: màn hình trẻ không render chuỗi số biểu diễn điểm.
- [ ] `next_suggestion` = **null**; ca âm không heuristic gợi ý nào trong source (`D-GK`).

### Task 5 — `rollup:session`

- [ ] Consumer `rollup:session`, `jobId = session_uuid`, timeout 30s.
- [ ] `BR-TLM-04` điểm chính thức tính lại từ event bằng **cùng hàm** T2.
- [ ] Ca âm: client gửi `score = 100` → điểm ghi là điểm tính từ event.
- [ ] Số job ghi **khớp** số route complete trả.
- [ ] `BR-JOB-01` idempotent: chạy lại không tạo hàng trùng.
- [ ] Ghi `play_sessions` + `child_session_summaries`.
- [ ] Gọi hàm gác mastery của P1.6 (`D-GH`); đường gọi có test.
- [ ] `BR-SCO-03` `hint_count` và `retry_count` ghi riêng, không trừ điểm.

### Task 6 — Property test (`fast-check`, ≥500 ca mỗi property)

- [ ] Thêm `hint_requested` **không** làm `normalized_score` giảm.
- [ ] Đổi `elapsed_ms` **không** đổi `stars`.
- [ ] Với mọi đầu vào, `normalized_score ∈ [0,1]`.
- [ ] Hai template cùng tỉ lệ đúng → `normalized_score` xấp xỉ nhau.

## Cổng dừng

- [ ] Phiên thật: chơi → complete → màn hình trẻ chỉ có sao → job ghi điểm → hai số khớp.
- [ ] Response bề mặt trẻ không có trường điểm nào.
- [ ] Hint · retry · tốc độ không đổi điểm.
- [ ] Điểm không âm; hoàn thành luôn ≥ 1 sao.
- [ ] Phiên `abandoned`: có điểm, không sao.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 7 — Evidence và promote

- [ ] Mỗi `BR-SCO-*` có test tham chiếu mã rule.
- [ ] [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) → `implemented`.
- [ ] [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) → `implemented` (ba nợ đã đóng).
- [ ] Nợ `next_suggestion` ghi sang **P3.6**.
- [ ] Tick **P1.7** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] Trọng số 0,6/0,4 đã đúng chưa — **P3**, chủ Backend; hằng số đã đặt tên một chỗ.
