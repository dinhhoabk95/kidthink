---
spec: SEMANTIC-SEARCH
title: Tìm kiếm ngữ nghĩa bằng vector embedding
area: addon
status: draft
mvp: false
phase: P4
reviewed: 2026-08-05
owns:
  - Lược đồ lưu vector embedding của nội dung
  - Job tái tạo embedding khi publish/update
  - Thuật toán xếp hạng ngữ nghĩa (semantic rerank) và ngưỡng similarity
depends_on:
  - AI-ASSISTANT
  - AI-CREDIT-LEDGER
  - CONTENT-SEARCH
  - JOB-QUEUE
  - CHILD-DATA-COMPLIANCE
---

# Tìm kiếm ngữ nghĩa bằng vector embedding

> **Add-on — ❌ không bán ở MVP.** Một trong sáu tính năng của `ai-assistant` (§7.1 dòng
> "Tìm kiếm ngữ nghĩa"); file này là spec chi tiết cho **riêng** tính năng đó — schema
> vector, job re-embed, và thuật toán rerank không thuộc phạm vi `owns` của `ai-assistant`.

## 1. Objective

Bổ sung cho `content-search` (tsvector), ❌ không thay thế. User gõ câu hỏi tự nhiên hoặc
từ không khớp tag/tiêu đề đúng chữ ("bài giúp con đếm số" ≈ "Đếm trong phạm vi 5") và vẫn
tìm ra bài giảng liên quan nhờ độ giống nghĩa của vector embedding, thay vì phải nhớ đúng
từ khoá hay tag hệ thống dùng.

Đây là tính năng **trả credit**, gate bởi `use_ai_search` — quyết định chốt 2026-08-05: giữ
ở add-on, ❌ không đưa vào base search miễn phí (giữ nguyên D3 — 2 SKU + add-on chưa bán).

## 2. Actors

| Actor | Cần entitlement | Làm được gì |
|---|---|---|
| User | `use_ai_search` + đủ credit | Gõ câu hỏi tự nhiên, nhận danh sách nội dung xếp theo độ giống nghĩa |
| Embedding provider (ngoài) | — | Nhận **chỉ** text nội dung đã `published` và câu query của user. ❌ **NEVER** nhận dữ liệu trẻ |
| Job `embed:content` | system | Tính lại vector khi nội dung publish/update |

Guest và Manager ❌ không dùng route này ở phạm vi spec này — giống `ai-assistant` §2, đây
là tính năng của User.

## 3. Entry points

| Route / job | | |
|---|---|---|
| `GET /api/users/ai/search` | Route đã đứng trong danh sách 6 tính năng ở `ai-assistant.md` §8; **contract chi tiết ở đây** |
| Job `embed:content` | Producer: pipeline publish/version (`content-lifecycle` → `published`). Consumer: `apps/worker` |

## 4. Main flow

**Nhánh ghi (re-embed):**
1. Nội dung chuyển trạng thái `published` (lần đầu hoặc bản mới) → publish pipeline enqueue
   `embed:content` với `{ content_type, content_id, content_version }`.
2. Worker gọi embedding provider trên text công khai: `title_vi + description_vi + tên tag`.
3. Lưu vector vào `content_embeddings`, khoá theo `(content_type, content_id, content_version)`.

**Nhánh đọc (tìm kiếm):**
1. Zod parse `q` (2–200 ký tự) + `limit`.
2. Kiểm `use_ai_search` + credit (`ai-credit-ledger`) — thiếu → 403/402, ❌ không gọi provider.
3. Embed câu `q` qua provider.
4. Truy vấn `content_embeddings` bằng cosine distance (`<=>` của pgvector), lọc theo
   `access-ladder`/quyền hiện tại giống `content-search` (chỉ `published`, đúng bậc actor).
5. Rerank hybrid: kết hợp cosine similarity với hạng tsvector đang có; nội dung **mở được**
   luôn xếp trên `locked` bất kể similarity (kế thừa nguyên tắc `content-search.md` §7.2 mục 2).
6. Trả kết quả kèm `locked` khi bị chặn bậc, ❌ không kèm `content_pack`. Ghi `ai_usage_log`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Nội dung chưa có embedding | Job chưa chạy hoặc job fail | Bỏ khỏi kết quả ngữ nghĩa, ❌ không lỗi — vẫn còn trong `content-search` thường |
| Provider lỗi hoặc timeout | Gọi embed câu query fail | Fallback trả kết quả tsvector thường (`BR-SEM-07`), ❌ không 5xx chặn toàn bộ tìm kiếm |
| Cả embed và tsvector đều rỗng | | Trả rỗng + gợi ý nới bộ lọc, giống `content-search` §5 |
| Query quá ngắn (<2 ký tự sau trim) | | 422 `VALIDATION_FAILED` |
| Nội dung bị chặn bậc xuất hiện trong top-N | | `locked: true`, ❌ không `content_pack` — kế thừa `BR-SRC-01` |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SEM-01` | Provider ngoài ❌ **NEVER** nhận gì khác ngoài text nội dung đã `published` và câu query của user | Đây là điểm dữ liệu rời hệ thống mới — tái khẳng định `BR-AIA-01`/`BR-CDC-06` tại chính nơi rủi ro phát sinh |
| `BR-SEM-02` | Câu `q` là input chưa tin: Zod validate, cap độ dài trước khi gửi provider | Query dài bất thường là đường vào abuse chi phí gọi provider |
| `BR-SEM-03` | Vector re-embed **mỗi lần** publish/update; ❌ **NEVER** serve vector cũ hơn `content_version` hiện tại | Nội dung sửa mà search vẫn khớp bản cũ là bug ngữ nghĩa, khó phát hiện bằng test thường |
| `BR-SEM-04` | Job `embed:content` idempotent theo `(content_type, content_id, content_version)` | Retry không tạo dòng trùng, theo `BR-JOB-01` |
| `BR-SEM-05` | ❌ **NEVER cache** kết quả tìm kiếm ngữ nghĩa | Kế thừa `BR-SRC-06` — danh sách có thể lộ nội dung trả phí |
| `BR-SEM-06` | Kết quả tuân access-ladder như `content-search`: `locked` hiện, `content_pack` ❌ không hiện | Một đường tìm kiếm thứ hai không được là đường vòng qua gating |
| `BR-SEM-07` | Provider lỗi ❌ **NEVER** làm tìm kiếm 5xx toàn phần — fallback tsvector | Semantic search là tăng cường, hỏng nó không được kéo sập tìm kiếm cơ bản |
| `BR-SEM-08` | Cột/index `vector` tạo qua migration Drizzle, ❌ raw `ALTER` ngoài migration | Đồng nhất với nguyên tắc ORM chung của `SPEC.md` §6 |

## 7. Data

**Đọc:** `content_embeddings`, `game_levels`/`lessons` (text công khai), `ai_credit_ledger`.
**Ghi:** `content_embeddings` (job), `ai_usage_log` (mỗi lần gọi).

### 7.1 Bảng mới — `content_embeddings`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `content_type` | enum(`level`,`lesson`,`activity`) | |
| `content_id` | uuid | FK polymorphic — không ép được ở Postgres, integration test bắt orphan (`BR-DM-04`) |
| `content_version` | int | Khớp `content_versioning` |
| `embedding` | `vector(N)` (pgvector) | `N` phụ thuộc model chọn ở OQ1 |
| `model_version` | text | Để biết vector cũ cần re-embed khi đổi model |
| `created_at` | timestamptz | |

Unique `(content_type, content_id, content_version)`. ❌ Không build ANN index (HNSW/IVFFlat)
ở lần triển khai đầu — quy mô nội dung hiện tại (≤120 level, ≤40 lesson, theo
`content-search.md` §7.3) đủ nhỏ cho sequential scan trên `vector_cosine_ops`, giống lý do
`content-search` chưa cần search engine riêng.

### 7.2 Job `embed:content`

| | |
|---|---|
| Lịch | Sự kiện — sau `content_published` |
| Idempotency key | `${content_type}:${content_id}:${content_version}` |
| Timeout | 30s (gọi network ra ngoài) |
| Retry | 3, backoff exponential 10s |

**Add-on job — ❌ không tính vào 10 job MVP của `job-queue.md` §7.1**, nhưng dùng chung hạ
tầng BullMQ/Valkey đã có. `job-queue.md` §7.1 đã có dòng chú "job add-on ❌ không tạo ở MVP" —
đây là job cụ thể hoá dòng chú đó.

### 7.3 Xếp hạng hybrid

```
score = w1 * cosine_similarity + w2 * tsvector_rank
```

Nội dung **mở được** với quyền hiện tại luôn xếp trên `locked` bất kể `score` — kế thừa
nguyên tắc `content-search.md` §7.2 mục 2, không định nghĩa lại.

Ngưỡng `cosine_similarity` tối thiểu để coi là "liên quan": **chưa chốt**, xem OQ2.

## 8. API contract

### `GET /api/users/ai/search`

| | |
|---|---|
| Auth | `requireUserAuth()` + entitlement `use_ai_search` |
| Query | `q` (text, 2–200 ký tự) · `limit` (≤20) |
| 200 | `{ items: [{ code, title_vi, thumbnail_emoji, access_tier, locked, similarity }], credits_spent }` |
| 402 | `QUOTA_EXCEEDED` — hết credit |
| 403 | `ENTITLEMENT_REQUIRED` |
| 422 | `VALIDATION_FAILED` |
| 503 | Cả embed provider và fallback tsvector đều fail |

`items[].locked = true` → ❌ không có `content_pack` — giống `content-search.md` §8.

## 9. Acceptance criteria

```gherkin
Scenario: BR-SEM-01 — provider ngoài không nhận dữ liệu trẻ
  Given job embed:content chạy cho một lesson published
  When ghi lại payload gửi tới embedding provider
  Then payload chỉ chứa title_vi, description_vi, tên tag
  And không chứa child_uuid, display_name, hay bất kỳ trường trẻ nào

Scenario: BR-SEM-03 — không serve vector cũ hơn version hiện tại
  Given một level có content_version = 2 đã có embedding
  When level được sửa và publish lại thành content_version = 3
  Then tìm kiếm ngữ nghĩa không dùng vector của content_version = 2
  And job embed:content được enqueue cho content_version = 3

Scenario: BR-SEM-04 — job re-embed idempotent
  Given job embed:content cho (level, X, version 3) đã chạy xong
  When job đó chạy lại
  Then content_embeddings không có dòng trùng cho (level, X, 3)

Scenario: BR-SEM-05 — không cache kết quả
  Given user gọi GET /api/users/ai/search
  When đọc header response
  Then Cache-Control chứa no-store

Scenario: BR-SEM-06 — nội dung khoá hiện nhưng không kèm nội dung
  Given user standard tìm kiếm ngữ nghĩa không lọc bậc
  When kết quả chứa level premium
  Then item đó có locked = true
  And item đó không có content_pack

Scenario: BR-SEM-07 — provider lỗi không kéo sập tìm kiếm
  Given embedding provider trả timeout
  When user gọi GET /api/users/ai/search
  Then response vẫn 200 với kết quả từ tsvector fallback
  And không trả 503 trừ khi tsvector cũng fail

Scenario: hết credit trả 402
  Given user hết credit AI
  When gọi GET /api/users/ai/search
  Then trả 402
  And provider không được gọi
```

## 10. Boundaries

**Always**
- Chỉ gửi text nội dung đã `published` tới provider.
- Re-embed khi publish/update nội dung.
- Fallback tsvector khi provider lỗi.
- Validate và cap độ dài `q` trước khi gửi provider.
- Trả `locked` thay vì ẩn nội dung trả phí — giống `content-search`.

**Ask first**
- Đổi model/provider embedding.
- Đổi ngưỡng similarity hoặc công thức hybrid rank.
- Thêm ANN index (HNSW/IVFFlat).
- Đưa tính năng này vào base search miễn phí (đổi cả quyết định D3).

**Never**
- Gửi dữ liệu trẻ hoặc PII của user tới embedding provider.
- Cache kết quả tìm kiếm ngữ nghĩa.
- Serve vector cũ hơn `content_version` hiện tại.
- Raw SQL ngoài migration cho schema `vector`.
- Trả `content_pack` của nội dung `locked`.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Provider/model embedding nào — cùng quyết định với `ai-assistant.md` OQ1 (LLM provider) hay tách riêng? Ảnh hưởng `N` (dimension) của cột `vector` | Migration schema |
| 2 | Ngưỡng `cosine_similarity` tối thiểu để coi là kết quả liên quan — cần đo thực nghiệm trên corpus thật, chưa có dữ liệu để đoán | Rerank |
| 3 | Có cần ANN index không, và tới quy mô nội dung nào thì cần — tương tự câu hỏi ngưỡng của `content-search.md` OQ1 nhưng cho vector | Sau launch add-on |
| 4 | Provider lỗi giữa chừng có trừ credit không? Phụ thuộc ngữ nghĩa `ai-credit-ledger` chưa chốt ở spec đó | `ai-credit-ledger` |
