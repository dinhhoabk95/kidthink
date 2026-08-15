---
spec: AI-ASSISTANT
title: Trợ lý AI cho người dùng
area: addon
status: implemented
mvp: false
phase: P4
reviewed: 2026-08-08
owns:
  - Phạm vi tính năng AI hướng người dùng
  - Ranh giới cứng của AI với dữ liệu trẻ
depends_on:
  - AI-CREDIT-LEDGER
  - CHILD-DATA-COMPLIANCE
  - ADVANCED-REPORT
---

# Trợ lý AI cho người dùng

> **Add-on — không bán ở MVP.** Lên catalog khi [`ai-credit-ledger.md`](ai-credit-ledger.md) đạt `implemented`.

## 1. Objective

AI **hỗ trợ**, **không thay thế** chương trình biên soạn. Nó tóm tắt, gợi ý, tìm kiếm, và
viết lại — trên dữ liệu đã có, không sinh nội dung cốt lõi mới.

Đây là **LLM duy nhất chạy trong hệ thống**, và nó là add-on ngoài MVP. Nội dung nền Cấm
không do LLM sinh — nó được soạn thành seeder trong repo ([`content-seed-authoring.md`](../01-platform/content-seed-authoring.md)), ở ngoài
runtime hoàn toàn. Trợ lý thì chạy **trong request với ngữ cảnh của một User**, nên nguy cơ
rò dữ liệu trẻ cao hơn hẳn và ranh giới phải chặt hơn.

## 2. Actors

| Actor | Cần entitlement |
|---|---|
| User | `use_ai_analysis` · `use_ai_search` |
| LLM provider | Cấm — **NEVER nhận dữ liệu định danh trẻ** |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-AIA-01` | Cấm — **NEVER gửi tên, `child_uuid`, năm sinh, hay telemetry cá nhân tới LLM** | `BR-CDC-06` — ranh giới cứng |
| `BR-AIA-02` | Chỉ gửi **số liệu tổng hợp và tên skill** | Đủ để tóm tắt, không đủ để định danh |
| `BR-AIA-03` | Mọi đầu ra AI mang **nhãn "gợi ý"** hiển thị | Người dùng phải biết đâu là máy nói |
| `BR-AIA-04` | AI Cấm — **NEVER đưa kết luận phát triển, y khoa, hay chẩn đoán** | Ranh giới sản phẩm và pháp lý |
| `BR-AIA-05` | AI Cấm — **NEVER sinh `skills`, `learning_objectives`, `lessons`, hay `game_levels`** | `BR-CSA-08` — nội dung cốt lõi soạn trong repo và có người merge, không sinh trong request |
| `BR-AIA-06` | AI Cấm — **NEVER tự publish** hay tự đổi lộ trình của trẻ | Đảm bảo quyền kiểm soát lộ trình sư phạm thuộc về phụ huynh và giáo viên |
| `BR-AIA-07` | Mọi lời gọi **trừ credit** và ghi `ai_usage_log` | Kiểm soát chi phí vận hành API và minh bạch hóa giao dịch tiêu dùng của người dùng |
| `BR-AIA-08` | Hết credit → **402**, không degrade âm thầm sang model rẻ hơn | `BR-ENT-07` |
| `BR-AIA-09` | Đầu ra qua **bộ lọc kiểm duyệt** trước khi hiển thị | Ngăn chặn việc hiển thị nội dung không an toàn hoặc sai lệch từ mô hình ngôn ngữ lớn |
| `BR-AIA-10` | User **bỏ qua được** mọi gợi ý; không gợi ý nào chặn luồng | Tôn trọng quyền chủ động của người lớn và không làm gián đoạn trải nghiệm người dùng |
| `BR-AIA-11` | Prompt và phiên bản model **có version**, ghi vào log | Truy được khi đầu ra sai |

## 7. Data

### 7.1 Sáu tính năng

| Tính năng | Đầu vào | Trừ credit |
|---|---|---|
| Tóm tắt báo cáo | Số liệu tổng hợp + tên skill | 1 |
| Giải thích báo cáo bằng lời thường | idem | 1 |
| Gợi ý game trong thư viện | Skill + band tuổi | 1 |
| Gợi ý lesson trong thư viện | idem | 1 |
| Viết lại hướng dẫn cho phụ huynh | Văn bản lesson | 2 |
| Tìm kiếm ngữ nghĩa | Câu truy vấn | 1 |

Tìm kiếm ngữ nghĩa có schema vector, job re-embed, và rerank riêng — spec chi tiết ở
[`semantic-search.md`](semantic-search.md), file này chỉ giữ nó trong danh sách 6 tính năng.

Sáu tính năng. Tất cả đều thao tác **trên nội dung đã có**.

### 7.2 Payload gửi LLM — danh sách đóng

```jsonc
{
  "age_band": "4-5",
  "skills": [{ "code": "C1.CNT.03", "name": "Đếm trong phạm vi 5",
               "mastery_label": "Đang phát triển", "attempts": 7 }],
  "period_days": 30,
  "totals": { "sessions": 24, "minutes": 310, "completion_rate": 0.78 }
}
```

Cấm **Không** `child_uuid`, không `display_name`, không `birth_year`, không `user_id`,
không hàng telemetry lẻ.

### 7.3 `ai_usage_log`

`user_id` · `feature` · `credits_spent` · `model` · `prompt_version` ·
`input_token` `output_token` · `cost_usd_micros` · `moderation_passed` · `created_at`.

Cấm lưu nội dung prompt chứa dữ liệu người dùng.

## 8. API contract

| Route | Ghi chú |
|---|---|
| `POST /api/users/ai/summarize-report` | Body `{ child_uuid, period }` — server tự dựng payload §7.2 |
| `POST /api/users/ai/suggest-content` | |
| `POST /api/users/ai/rewrite-guide` | |
| `GET /api/users/ai/search` | Tìm kiếm ngữ nghĩa — contract chi tiết ở [`semantic-search.md`](semantic-search.md) §8 |

403 `ENTITLEMENT_REQUIRED` · 402 `QUOTA_EXCEEDED` · 503 khi provider lỗi.

`child_uuid` trong body dùng để **server** tra dữ liệu; nó **không** đi tiếp tới LLM.

## 9. Acceptance criteria

```gherkin
Scenario: BR-AIA-01 — không gửi dữ liệu định danh trẻ
  Given tính năng tóm tắt báo cáo được gọi
  When ghi lại payload gửi tới LLM provider
  Then payload không chứa child_uuid, display_name, birth_year, hay user_id

Scenario: BR-AIA-03 — đầu ra có nhãn gợi ý
  When hiển thị bất kỳ đầu ra AI nào
  Then có nhãn "gợi ý" hiển thị rõ

Scenario: BR-AIA-04 — không kết luận y khoa
  Given một tóm tắt được sinh ra
  When kiểm nội dung
  Then không chứa chẩn đoán, so sánh chuẩn phát triển, hay khuyến nghị y khoa

Scenario: BR-AIA-08 — hết credit trả 402
  Given user hết credit
  When gọi bất kỳ tính năng AI nào
  Then trả 402
  And không có kết quả rút gọn nào được trả

Scenario: BR-AIA-06 — AI không đổi lộ trình
  Given AI gợi ý một game
  Then curriculum_enrollments không đổi
  And gợi ý chỉ hiển thị để user chọn

Scenario: BR-AIA-07 — mọi lời gọi được log
  When gọi một tính năng AI
  Then ai_usage_log có hàng mới với model và prompt_version

Scenario: BR-AIA-09 — đầu ra qua kiểm duyệt
  Given LLM trả nội dung không phù hợp
  Then bộ lọc chặn
  And user thấy thông báo lỗi thân thiện

Scenario: BR-AIA-10 — bỏ qua được gợi ý
  When user đóng một gợi ý AI
  Then luồng tiếp tục bình thường
```

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Provider và model nào? Ảnh hưởng chi phí và chất lượng tiếng Việt | P4 | Đánh giá Benchmark các model hỗ trợ tiếng Việt tốt (Claude 3.5 Sonnet / GPT-4o) trước khi chốt; [`semantic-search.md`](semantic-search.md) Q1 dùng chung quyết định | người quyết |
| 2 | Tỉ lệ trừ credit mỗi loại lời gọi | P4 | Trỏ sang [`ai-credit-ledger.md`](ai-credit-ledger.md) Q1 | người quyết |
| ~~3~~ | ~~Tìm kiếm ngữ nghĩa cần vector store — dùng pgvector hay dịch vụ ngoài?~~ **Đóng 2026-08-05 (`D-DL`)**: pgvector trong Postgres 17 hiện có, add-on trả credit (không base search). Spec chi tiết: [`semantic-search.md`](semantic-search.md) | P4 | Đã đóng | D-DL |
| 4 | Có cần thoả thuận xử lý dữ liệu (DPA) với provider không, dù không gửi PII? | P4 | Rà soát tiêu chuẩn tuân thủ bảo vệ dữ liệu trẻ em GDPR-K / COPPA để ký kết DPA nếu cần | người quyết |
