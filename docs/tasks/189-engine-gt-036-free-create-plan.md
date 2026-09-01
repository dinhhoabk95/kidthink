# Kế hoạch — Task #189: `GT-036` Tự tạo quy luật — `free-create`

> **Loại task:** lát dọc engine + mô hình chấm mới (L) — đợt 4, task cuối trước chốt kiểm 4 của
> [`Task #168`](168-v1-game-list-integration-plan.md).
> **Đích:** khuôn `GT-036` chạy được, cộng **10 level** mang `legacy_v1_ref: "D3-05"`.
> **Game type v1 gánh:** `D3-05` Tự Tạo Quy luật — `C3.RULE.02` —
> nguồn `d3/FreeCreateSession.ts` · `systems/freeCreateSystem.ts`.
> **Chặn bởi:** [`#188`](188-engine-gt-035-command-sequence-plan.md).
> **Spec sở hữu:** phiếu engine [`docs/specs/01-platform/engines/GT-036.md`](../specs/01-platform/engines/GT-036.md) — **đã viết** ở [Task #190](190-engine-spec-first-authoring-spec.md). Task này cấm — NEVER viết lại phiếu; nó dựng khuôn theo phiếu, và **gỡ `GT-036` khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR** (`BR-ESS-15`).

## 1. Câu hỏi mở 1 — đã quyết: chấm được, không cần mô hình mới

Câu hỏi là *"chấm thế nào khi không có đáp án đúng"*. Câu hỏi đặt sai. Đọc v1 xong thì rõ:
`FreeCreateSystem(minRepetitions, strictness)` **đã chấm** — và chấm đúng.

Bài này không phải "không có đáp án đúng". Nó là **"mọi quy luật tự nhất quán đều đúng"**. Cái được
đo là: trẻ có đặt ra được một quy luật và giữ nó qua đủ số lần lặp không. Đó là câu hỏi đóng, chấm
được bằng máy, và chính là `C3.RULE.02`.

**Thang chấm, vừa `STANDARD_SCORING`, không cần `ScoringSchema` mới:**

| Điểm | Điều kiện |
|---:|---|
| 0 | Không phát hiện được mô-típ lặp nào |
| 60 | Có mô-típ lặp ≥ `min_repetitions` lần — **đạt** (`pass_threshold` 60) |
| +10 mỗi lần lặp thêm, trần 80 | Quy luật giữ được dài hơn yêu cầu |
| tới 100 | Số phần tử khác nhau dùng trong mô-típ, so với `palette` |

`star_thresholds` `[60, 80, 100]` giữ nguyên. Điểm là hàm thuần của chuỗi trẻ tạo ra và
`min_repetitions` — cùng chuỗi cho cùng điểm, cấm — NEVER chấm theo cảm tính hay theo mẫu dựng sẵn.

## 2. Vì sao khuôn này tồn tại

35 khuôn còn lại đều hỏi *"đáp án nào đúng"*. Khuôn này hỏi *"con đặt ra luật gì"*. Đó là khác biệt
về **vai**: trẻ chuyển từ người trả lời sang người ra đề. `C3.RULE.02` xuất hiện ở `D3-01` `D3-02`
`D3-05` của v1, nhưng chỉ `D3-05` đặt trẻ vào vai ra đề.

Grep `freeCreate` trên `packages/game-engine/src` → **0 kết quả**.

## 3. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `free-create` |
| Nguyên thuỷ | `placement` |
| Band | `5-6` — `banned_age_bands: ["3-4", "4-5"]` |
| `layouts` | `free-scene` · `horizontal-track` |
| Hệ thống mới | `systems/rule-detection-system.ts` |
| `status` | `draft` |

### Hợp đồng nội dung

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `prompt_audio_ref` | chuẩn | |
| `palette` | 2–6 phần tử: `element_id` + `asset` | vốn để trẻ dùng |
| `track_length` | 6–16 ô | chỗ trẻ đặt |
| `min_repetitions` | 2–4 | ngưỡng đạt |

`refine`: `palette` đủ phần tử để dựng được ít nhất một mô-típ lặp `min_repetitions` lần trong
`track_length`.

### Hợp đồng độ khó

`palette_size` · `track_length` · `min_repetitions` · `strictness` (`relaxed` \| `strict`) ·
`hint_after_ms`.

### Event

`game_started` · `element_placed` · `element_removed` · `creation_submitted` · `rule_detected` ·
`game_completed`.

### Ràng buộc màu — lỗi v1 đã sửa, cấm — NEVER lặp lại

v1 từng để `GAME_FEEDBACK_COLORS.success` trong bảng màu cho trẻ vẽ, tức đưa **màu hệ thống dùng để
nói "đúng"** làm bút màu. Ghi chú trong `FreeCreateSession.ts` nói rõ đã sửa. Ở v2: `palette` là
nội dung, và test phải khẳng định không phần tử nào dùng token màu phản hồi.

## 4. `RuleDetectionSystem`

| Làm | Cấm — NEVER làm |
|---|---|
| Tìm mô-típ ngắn nhất lặp ≥ `min_repetitions` lần trong chuỗi trẻ tạo | So với một mẫu dựng sẵn |
| Trả về `{ motif, repetitions, distinct_elements }` | Chấm theo cảm tính hay theo độ "đẹp" |
| Chấm theo thang mục 1, hàm thuần | Phụ thuộc thứ tự trẻ đặt các ô |
| Hai chế độ `relaxed` và `strict` cho phần đuôi dở dang | Bỏ qua chuỗi có mô-típ nhưng dài lẻ |

`relaxed`: đuôi dở dang vẫn tính. `strict`: chuỗi phải kết thúc đúng ranh giới mô-típ.
Test riêng `tests/rule-detection-system.test.ts`, dựng độc lập.

## 5. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `GT-036` trong registry, phiếu không mồ côi | `check:engine-specs` |
| 2 | `RuleDetectionSystem` dựng độc lập, ≥10 ca test riêng | `tests/rule-detection-system.test.ts` |
| 3 | Chấm là **hàm thuần**: cùng chuỗi, cùng `min_repetitions` → cùng điểm | ca test chạy 100 lần |
| 4 | Điểm nằm trong `[0, 100]`, đạt tại đúng 60, hợp `STANDARD_SCORING` | test |
| 5 | **Ca bắt buộc:** hai chuỗi khác nhau cùng thoả quy luật → cả hai đạt | test |
| 6 | **Ca bắt buộc:** chuỗi ngẫu nhiên không mô-típ → 0 điểm, không đạt | test |
| 7 | `palette` không chứa token màu phản hồi | test trên cả 10 level |
| 8 | ≥12 ca test phiên engine, có ca trẻ đặt rồi bỏ rồi đặt lại | test |
| 9 | Bộ sinh ≥8 chủ đề; `refine` đảm bảo `palette` dựng được mô-típ hợp lệ | `tests/generators.test.ts` |
| 10 | 10 level `legacy_v1_ref: "D3-05"`, `check:legacy-v1` lên **60/60** | `check:legacy-v1` |
| 11 | `pnpm check` xanh | — |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Chấm theo mẫu dựng sẵn, biến thành bài có đáp án | Cao | Nghiệm thu 5 — hai chuỗi khác nhau cùng đạt |
| Chấm không ổn định giữa các lần chạy | Cao | Nghiệm thu 3 — hàm thuần, chạy 100 lần |
| Màu phản hồi lọt vào bảng màu như v1 | Trung bình | Nghiệm thu 7 quét cả 10 level |
| `strictness` không có tác dụng thật | Trung bình | Ca test: cùng chuỗi đuôi dở, `relaxed` đạt, `strict` không |
| Khuôn cuối chương trình bị vội | Trung bình | Nó chặn chốt kiểm 4; cấm — NEVER hạ nghiệm thu để đóng sớm |
