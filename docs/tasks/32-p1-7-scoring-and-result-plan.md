# Kế hoạch — Task #32: P1.7 — Tính điểm ở server

> Viết 2026-08-09. Bước sở hữu: **P1.7** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md).
> Đóng nợ của P1.5 (`rollup:session`, `BR-TLM-04`) và P1.6 (`score`, `stars`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Một chuỗi event vào, **hai thứ khác nhau** ra: một con số cho hệ thống, một biểu hiện tích cực
cho trẻ. Spec mở đầu bằng câu đó và mọi `BR-SCO-*` là hệ quả của nó.

Trẻ 3–6 **không thấy điểm số**. Chúng thấy sao và lời khen. Điểm là cho adaptive và cho báo cáo
của người lớn. Lẫn hai thứ này là lỗi thiết kế, không phải lỗi hiển thị — nên nó phải bị chặn ở
**payload**, không phải ở component.

Ba luật dễ vi phạm nhất khi tối ưu về sau: hint và retry **không trừ điểm** (`BR-SCO-03`), sao
**không phải hàm của tốc độ** (`BR-SCO-06`), và **mọi trẻ hoàn thành đều có ít nhất một sao**
(§7.3).

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `PLAY-SESSION-LIFECYCLE` | P1.6 | route complete, `completion_status` |
| `PLAY-EVENT-INGESTION` | P1.6 | chuỗi event đủ và có thứ tự |
| `EVENT-CATALOG` | P0 registry | `answer_correct`, `round_started`, `hint_requested`, … |
| `JOB-QUEUE` | P1.5 | `rollup:session` đăng ký sẵn trong registry |
| `TELEMETRY-PIPELINE` | P1.5 | `child_session_summaries` đã có bảng |

## 1. Đo được

### 1.1 Nợ phải đóng ở bước này

| Nợ | Từ | Nội dung |
|---|---|---|
| `rollup:session` | P1.5 `D-FZ` | job có trong registry, chưa có consumer |
| `BR-TLM-04` | P1.5 | điểm chính thức tính ở `rollup:session` |
| `score` `normalized_score` `stars` | P1.6 `D-GE` | route complete đang trả `null` |

Đóng hết ba nợ là điều kiện để [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md)
sang `implemented`.

### 1.2 Đã có

Chuỗi event đầy đủ với `seq` liên tục; `rounds_correct`/`rounds_total` đếm thuần đã có từ P1.6;
bảng `child_session_summaries`.

### 1.3 Chưa có

Công thức §7.2, ngưỡng sao §7.3, xử lý năm nhánh bất thường ở §5, và ranh giới payload giữa bề
mặt trẻ và bề mặt người lớn.

## 2. Quyết định

**D-GI — công thức điểm là **một hàm thuần**, hai call site.** Route `complete` (đồng bộ, để trả
màn hình tổng kết) và job `rollup:session` (bất đồng bộ, để ghi số chính thức) **phải** ra cùng
kết quả. Cách duy nhất giữ được điều đó là một hàm `computeSessionResult(events)` thuần, không
đọc DB, không đọc giờ hệ thống. Ca âm: gọi hàm hai lần trên cùng chuỗi event → kết quả giống hệt;
và số ghi bởi job **khớp** số trả bởi route.

**D-GJ — ranh giới "trẻ không thấy điểm" ép ở **payload**, không ở component.** `BR-SCO-02` nói
trẻ không thấy con số. Nếu chỉ ẩn ở UI thì `normalized_score` vẫn nằm trong response — và màn
hình sau, hoặc bản build sau, sẽ hiện nó ra. Xử: response của route complete (bề mặt trẻ)
**không chứa** `normalized_score`, `raw_score`. Cổng quét schema response → có trường đó là đỏ.
Người lớn xem qua [`basic-report.md`](../specs/03-account/basic-report.md) (P1.12), đường khác.

**D-GK — `next_suggestion` giữ **null** ở P1; cấm heuristic tạm.** §8 có trường
`next_suggestion`, nhưng [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md)
là **P3.6**. Một heuristic tạm ("cùng chủ đề, khó hơn một chút") sẽ được đọc như tính năng thật,
rồi được đo, rồi bị so sánh với recommendation thật ở P3 — và không ai nhớ nó chỉ là tạm. Trả
`null` và ghi nợ có địa chỉ.

**D-GL — phiên `abandoned` **vẫn** tính `normalized_score`, **không** hiện sao.** Hai luật kéo
ngược nhau: `BR-PSL-07` (bỏ dở vẫn đếm vào KPI — tỉ lệ bỏ là tín hiệu chất lượng nội dung mạnh
nhất) và `BR-SCO-07` (bỏ dở không ăn mừng). Cả hai đúng, và chúng không mâu thuẫn: điểm đi vào
báo cáo, sao đi ra màn hình trẻ. Một nhánh tường minh, hai ca âm.

**D-GM — trọng số 0,6 / 0,4 và ba ngưỡng sao khai thành **hằng số có tên, một chỗ**.** §11 Q1
(trọng số đã đúng chưa) chặn **P3** — nghĩa là chúng **sẽ** đổi. Rải số 0.6 trong công thức là
đảm bảo lần chỉnh ở P3 phải đi tìm. Đặt tên, đặt một chỗ, và test tham chiếu hằng số chứ không
chép lại số.

## 3. Đồ thị

```
T1 dựng lại chuỗi round từ event + 5 nhánh bất thường §5
      └──→ T2 computeSessionResult() thuần: chỉ số §7.1 + công thức §7.2
                ├──→ T3 sao §7.3 + luật "hoàn thành là có sao" + abandoned không sao
                ├──→ T4 ranh giới payload: trẻ không thấy số (D-GJ)
                └──→ T5 rollup:session (nợ D-FZ) + child_session_summaries + BR-TLM-04
                          └──→ T6 property test: hint/tốc độ không đổi điểm · không âm · thang chung
                              ── Cổng dừng ──
  T7 evidence, promote scoring + telemetry-pipeline
```

## 4. Task

### Task 1 — Dựng lại chuỗi round

**Tiêu chí nghiệm thu**
- [ ] Nạp toàn bộ event của phiên, sắp theo `seq`; dựng round từ `round_started` … `round_completed`.
- [ ] Thiếu `round_completed` → suy từ `answer_correct` cuối của round đó + **log cảnh báo**.
- [ ] Event mâu thuẫn (`correct` và `incorrect` cùng attempt) → lấy cái đến **sau** + log cảnh báo.
- [ ] Không round nào hoàn thành → `raw_score = 0`, **không** ghi mastery.
- [ ] `duration_ms` = `completed_at − started_at` **trừ** thời gian `paused`; ca âm phiên có 2 lần pause.
- [ ] Bảy chỉ số §7.1 tính đúng: `rounds_total`, `rounds_correct` (đúng **ngay lần đầu**), `attempt_count`, `correct_count`, `incorrect_count`, `hint_count` (= `hint_requested` + `scaffold_escalated`), `retry_count`.

**Kiểm chứng**
- [ ] `pnpm test -- round-reconstruction` xanh; fixture cho cả năm nhánh §5.

**Phụ thuộc:** P1.6 · **Cỡ:** M

### Task 2 — `computeSessionResult()` thuần

**Tiêu chí nghiệm thu**
- [ ] Hàm **thuần**: không đọc DB, không đọc giờ hệ thống, không random (`D-GI`).
- [ ] `first_try_ratio = rounds_correct / rounds_total`; `accuracy = correct_count / max(attempt_count, 1)`.
- [ ] `normalized_score = clamp01(0.6 · first_try_ratio + 0.4 · accuracy)`; hằng số có tên, một chỗ (`D-GM`).
- [ ] `BR-SCO-04`: `normalized_score ∈ [0,1]`, so được giữa template.
- [ ] `BR-SCO-05`: sàn là **0**; ca âm phiên sai toàn bộ → 0, không âm.
- [ ] `BR-SCO-01`: không đọc bất kỳ giá trị điểm nào từ payload client.
- [ ] Gọi hai lần trên cùng chuỗi event → kết quả **giống hệt**.

**Kiểm chứng**
- [ ] `pnpm test -- scoring-formula` xanh, assertion tham chiếu `BR-SCO-01` `BR-SCO-04` `BR-SCO-05`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Sao

**Tiêu chí nghiệm thu**
- [ ] Ngưỡng §7.3: ≥0,85 → 3 sao · ≥0,55 → 2 sao · hoàn thành → **1 sao** · chưa hoàn thành → không sao.
- [ ] **Mọi trẻ hoàn thành có ít nhất một sao**; ca âm `normalized_score = 0.2` + completed → `stars = 1`.
- [ ] `BR-SCO-06`: hai phiên cùng kết quả, một nhanh gấp đôi → **cùng** số sao.
- [ ] `BR-SCO-07` + `D-GL`: phiên `abandoned` → `stars = null`, `normalized_score` **vẫn** được tính cho báo cáo.
- [ ] `BR-SCO-08`: `celebration` luôn tích cực, kể cả điểm thấp (nội dung cụ thể thuộc P1.8).

**Kiểm chứng**
- [ ] `pnpm test -- stars` xanh, assertion tham chiếu `BR-SCO-06` `BR-SCO-07`.

**Phụ thuộc:** T2 · **Cỡ:** S

### Task 4 — Ranh giới hai bề mặt

**Tiêu chí nghiệm thu**
- [ ] Response của `POST /api/{ns}/play-sessions/{uuid}/complete` đúng §8: `stars`, `rounds_correct`, `rounds_total`, `celebration`, `next_suggestion`.
- [ ] `BR-SCO-02` + `D-GJ`: response **không chứa** `normalized_score` hay `raw_score`; cổng quét schema → có là đỏ.
- [ ] Ca âm UI: màn hình tổng kết của trẻ không render chuỗi số nào biểu diễn điểm.
- [ ] `next_suggestion` = **null** ở P1 (`D-GK`); ca âm — không heuristic gợi ý nào trong source.
- [ ] Số chi tiết (`normalized_score`, tỉ lệ đúng, hint, thời lượng) chỉ đi qua đường báo cáo người lớn — P1.12.

**Kiểm chứng**
- [ ] `pnpm test -- result-payload` xanh, assertion tham chiếu `BR-SCO-02`.

**Phụ thuộc:** T3 · **Cỡ:** S

### Task 5 — `rollup:session` (đóng nợ `D-FZ`)

**Tiêu chí nghiệm thu**
- [ ] Consumer cho job `rollup:session`, `jobId = session_uuid`, timeout 30s (registry P1.5).
- [ ] `BR-TLM-04`: điểm **chính thức** ghi bởi job, tính lại từ chuỗi event bằng **cùng hàm** T2 (`D-GI`).
- [ ] Ca âm: client gửi `game_completed` kèm `score = 100` → điểm ghi lại là điểm tính từ event.
- [ ] Số job ghi **khớp** số route complete trả; ca âm so hai đường.
- [ ] Job idempotent (`BR-JOB-01`): chạy lại không tạo hàng trùng, không đổi kết quả.
- [ ] Ghi `play_sessions` (điểm, `completion_status`) và sinh `child_session_summaries` khoá `(child_id, session_uuid)`.
- [ ] Job gọi **hàm gác mastery** của P1.6 (`D-GH`); ở P1 hàm chưa ghi gì, nhưng đường gọi có test.
- [ ] `BR-SCO-03`: `hint_count` và `retry_count` ghi **riêng**, không trừ vào điểm.

**Kiểm chứng**
- [ ] `pnpm test -- rollup-session` xanh, assertion tham chiếu `BR-TLM-04` `BR-JOB-01`.

**Phụ thuộc:** T2 · P1.5 · **Cỡ:** M

### Task 6 — Property test

**Tiêu chí nghiệm thu**
- [ ] `BR-SCO-03`: với mọi chuỗi event sinh ngẫu nhiên, thêm `hint_requested` **không** làm `normalized_score` giảm; `hint_count` thay đổi.
- [ ] `BR-SCO-06`: đổi `elapsed_ms` mọi round **không** đổi `stars`.
- [ ] `BR-SCO-05`: với mọi đầu vào, `normalized_score ∈ [0,1]`.
- [ ] `BR-SCO-04`: hai template khác nhau, cùng tỉ lệ đúng → `normalized_score` xấp xỉ nhau (sai khác trong ngưỡng khai báo).
- [ ] Dùng `fast-check` (đã có trong catalog), ≥ 500 ca mỗi property.

**Kiểm chứng**
- [ ] `pnpm test -- scoring-properties` xanh.

**Phụ thuộc:** T5 · **Cỡ:** M

### Cổng dừng

- [ ] Một phiên thật: chơi → complete → màn hình trẻ chỉ có sao → job ghi điểm → số hai đường khớp.
- [ ] Response bề mặt trẻ không có trường điểm nào.
- [ ] Hint, retry, tốc độ không đổi điểm; điểm không âm; hoàn thành luôn có ≥1 sao.
- [ ] Phiên `abandoned`: có `normalized_score`, không sao.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 7 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-SCO-*` có ít nhất một test tham chiếu mã rule.
- [ ] [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) sang `implemented`.
- [ ] [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) sang `implemented` — ba nợ §1.1 đã đóng.
- [ ] §11 Q1 (trọng số 0,6/0,4) ghi rõ chặn **P3**, và hằng số đã đặt tên một chỗ (`D-GM`).
- [ ] Nợ `next_suggestion` ghi sang **P3.6**.
- [ ] Tick **P1.7** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Hai đường tính điểm lệch nhau | Màn hình nói một đằng, báo cáo nói một nẻo | `D-GI` — một hàm thuần, ca âm so hai đường |
| `normalized_score` nằm trong response bề mặt trẻ | Sớm muộn sẽ được hiện ra | `D-GJ` — cổng quét schema |
| Trừ điểm vì hint để "công bằng" | Dạy trẻ đừng xin trợ giúp — hỏng đúng thứ scaffolding xây | `BR-SCO-03` — property test |
| Thưởng tốc độ | Tạo thói quen đoán bừa | `BR-SCO-06` — property test đổi thời gian |
| Heuristic gợi ý tạm | Bị đọc như tính năng, khó gỡ ở P3 | `D-GK` — trả null |
| Phiên bỏ dở mất khỏi số liệu | Mất tín hiệu chất lượng nội dung mạnh nhất | `D-GL` — vẫn tính điểm, chỉ ẩn sao |
| Trọng số rải trong code | P3 chỉnh phải đi tìm, dễ sót | `D-GM` — hằng số có tên |

## 6. Giả định

1. **P1.6 đã đóng** — chuỗi event đủ, `seq` liên tục, route complete tồn tại.
2. **P1.5 đã đóng** — registry job và bảng rollup sẵn sàng.
3. **Mastery ở P3** — job gọi hàm gác nhưng chưa ghi `mastery_state`.
4. **Nội dung lời khen ở P1.8** — bước này chỉ trả `celebration` dạng mã.
5. **`sequence-order` chấm cả chuỗi ở P1** (`D-BA`).
6. **Trọng số hiện tại là giả thiết**, sẽ chỉnh ở P3 khi có dữ liệu thật.

## 7. Ngoài phạm vi

- Màn hình ăn mừng, nội dung lời khen — P1.8.
- Báo cáo cho người lớn — P1.12.
- Gợi ý game kế tiếp — P3.6.
- `mastery_state` và adaptive — P3.5.
- Chấm từng vị trí cho `sequence-order` — P3.
