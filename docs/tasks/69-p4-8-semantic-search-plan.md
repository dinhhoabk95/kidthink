# Kế hoạch — Task #69: P4.8 — Semantic search pgvector và cổng ra P4

> Viết 2026-08-11, đo tại commit `484ebaf`.
> Spec sở hữu: [`semantic-search.md`](../specs/07-addon/semantic-search.md).
> Phụ thuộc: [`68-p4-7-ai-assistant-plan.md`](68-p4-7-ai-assistant-plan.md) và Task #67.

## Tóm tắt

Task #69 là lát cuối P4: chọn embedding model để đóng `vector(N)`, tạo embedding cho đúng
content version `published`, hybrid rerank với tsvector, giữ content mở được trên locked, refund
credit khi semantic provider fail và fallback base search. Kết thúc task mới promote AI assistant,
bật `addon_ai`, và audit đủ cả 8 spec P4.

## 0. Điều kiện vào

- Task #67 ledger và #68 năm feature/provider/privacy port xanh; P1 content search/job queue và
  P2 publish/version pipeline `implemented`.
- Embedding model/dimension, DPA, query-PII policy, weights/cutoff được chốt trước migration.
- PostgreSQL local/CI/production plan hỗ trợ pgvector; chỉ validate/plan infra, không apply.

## 1. Hiện trạng và blockers

- Chưa có pgvector extension, `content_embeddings`, job hay semantic route trong source.
- `N = PENDING_EMBEDDING_DIM` chặn migration; đổi model sau migration là re-embed/schema decision.
- Q2 cutoff chưa đo trên corpus; Q3 cấm ANN trước 10,000 rows nhưng phải ghi metric.
- Spec cho phép gửi raw query User tới embedding provider. Query có thể chứa tên/PII do User tự
  gõ, xung đột ranh giới không dữ liệu trẻ ra provider; Legal/Security phải chốt local guard,
  reject/redact hoặc contract khác trước call thật.
- `check-progress` hiện chưa có mapping P4; không thể dùng gate hiện tại để tuyên bố 8 spec xong.

## 2. Quyết định bắt buộc

**D-P4AE — Dimension bất biến theo model contract.** Ghi provider/model/version/dimension và
normalized input format trước migration. Đổi model tạo re-embed plan; không cast/pad vector để
né migration.

**D-P4AF — Query có privacy guard trước egress.** Zod 2–200 trước, local detection/policy do
Legal duyệt, không append profile/report/child context. Provider chỉ nhận query đã qua guard hoặc
public published text; logs không giữ query thô ngoài retention contract.

**D-P4AG — Credit chỉ trả cho semantic value.** Debit trước embedding call. Provider fail và
fallback tsvector thì refund idempotent, response `credits_spent=0`; fallback cũng fail mới 503.
Không charge cho base search.

**D-P4AH — Hybrid được đo, không đoán.** Corpus đánh giá tiếng Việt có relevance labels; chốt
`w1/w2` và cutoff từ precision/recall. Open content luôn trước locked; locked không content pack.
Không ANN dưới 10,000 rows; threshold có metric/test.

**D-P4AI — Current-version join là fail-closed.** Search chỉ dùng embedding có version bằng
current published. Khi publish version mới, bản cũ bị loại ngay cả trước job mới; job idempotent
theo type/id/version/model.

## 3. Đồ thị

```text
T0 verify pgvector/provider/publish/search/progress seams
 └── T1 chốt model(N)/privacy/refund/ranking/infra contract ── Checkpoint A
      ├── T2 pgvector migration + content_embeddings
      ├── T3 embedding port/input builder/privacy guard
      └── T4 extend P4 progress manifest/gate
           └── T5 publish hook + embed:content worker ── Checkpoint B
                ├── T6 hybrid query/access/fallback service
                └── T7 API + AI search UI
                     └── T8 relevance/load/security/re-embed drill ── Checkpoint C
                          └── T9 promote SEM+AIA; catalog + audit 8 spec P4
```

## 4. Task triển khai

### T0 — Preflight và capability check

**Tiêu chí nghiệm thu**

- [ ] #67/#68, content search, queue, publish/version `implemented`; ghi seams merge thật.
- [ ] Verify pgvector version/capability ở local+CI và production plan/validate, không apply.
- [ ] Đối chiếu `BR-SEM-*`, AIA/ACL/CDC/search/gating/job/version và inventory progress P4 thiếu.

**Kiểm chứng:** capability report + `pnpm check:services`; không production mutation.

**Phụ thuộc:** #67/#68 + P1/P2 · **Files:** evidence/task/spec nếu seam đổi · **Cỡ:** S.

### T1 — Khép model, privacy, ranking và refund

**Tiêu chí nghiệm thu**

- [ ] Product/Legal/Security chốt embedding model+N, DPA/query guard/log retention và fallback refund.
- [ ] Eval owner chốt corpus/metrics để quyết weights/cutoff; Infra xác nhận extension/migration path.
- [ ] Semantic/AI/ledger/architecture/error specs ghi một contract; SKU vẫn ẩn.

**Kiểm chứng:** `pnpm lint:specs`; không còn `PENDING_EMBEDDING_DIM` ở contract được phép migrate.

**Phụ thuộc:** T0 + human decisions · **Files:** SEM/AIA/ACL/architecture/privacy/error specs · **Cỡ:** M.

### Checkpoint A — Migration unblock

- [ ] D-P4AE…D-P4AI được Product/Legal/Security/Infra review.
- [ ] Không migration/vector SDK khi model/N/query policy còn pending.

### T2 — Pgvector schema/migration

**Tiêu chí nghiệm thu**

- [ ] Extension/migration tạo `content_embeddings` đúng N, type/id/version/model/timestamp và unique key.
- [ ] Không ANN index; orphan integration check theo `BR-DM-04`, current model/version indexes đủ.
- [ ] DB rỗng/upgrade/rollback, wrong dimension/duplicate/orphan tests xanh; không raw ALTER ngoài migration.

**Kiểm chứng:** `pnpm db:migrate`; `pnpm test -- semantic-schema` với PG pgvector thật.

**Phụ thuộc:** Checkpoint A · **Files:** schema/migration/meta/integration test · **Cỡ:** M.

### T3 — Embedding port, input builder và query guard

**Tiêu chí nghiệm thu**

- [ ] Port dùng model/version/N đã pin; public content builder chỉ title/description/tag names.
- [ ] Query Zod+cap+privacy guard trước adapter; không profile/report/child context hay raw-query logs ngoài contract.
- [ ] Vector dimension/normalization/timeout fake adapter tests xanh; không provider thật trong unit/integration.

**Kiểm chứng:** `pnpm test -- embedding-contract semantic-egress-guard`.

**Phụ thuộc:** Checkpoint A + package #68 · **Files:** provider port/builders/guards/tests · **Cỡ:** M.

### T4 — Progress gate P4

**Tiêu chí nghiệm thu**

- [ ] Manifest/gate map đúng 8 spec P4 và Task #62–#69, không suy từ checkbox tay.
- [ ] Ca âm một spec `approved`, catalog public sớm hoặc dependency chưa implemented làm gate đỏ.
- [ ] Gate không tick/đổi spec; chỉ báo evidence thiếu với file:line.

**Kiểm chứng:** `pnpm test -- check-progress`; fixture P4 đỏ/xanh.

**Phụ thuộc:** T0 · **Files:** progress lib/test + task manifest nếu canonical · **Cỡ:** M.

### T5 — Publish hook và worker idempotent

**Tiêu chí nghiệm thu**

- [ ] Publish enqueue `embed:content` sau commit với type/id/version/model idempotency key.
- [ ] Worker chỉ đọc published public text, retry 3/backoff 10s/timeout 30s; upsert không duplicate.
- [ ] Version mới làm old vector non-servable ngay; failure metric/alert nhưng base search vẫn sống.

**Kiểm chứng:** `pnpm test -- semantic-embed-job semantic-version-race` với PG/Valkey thật.

**Phụ thuộc:** T2–T3 + publish/queue · **Files:** producer/handler/repository/tests · **Cỡ:** M.

### Checkpoint B — Write path

- [ ] Publish→enqueue→embed/upsert current version xanh; retry/race/stale fail-closed.
- [ ] Human review egress payload, migration và publish transaction boundary.

### T6 — Hybrid search và fallback

**Tiêu chí nghiệm thu**

- [ ] Debit→embed query→cosine+tsvector rerank; open before locked, limit ≤20, current version only.
- [ ] Locked item không content_pack; response/no-store và access matrix kế thừa base search.
- [ ] Provider fail fallback 200 tsvector + refund/credits 0; cả hai fail mới 503, retry không double debit.

**Kiểm chứng:** `pnpm test -- semantic-ranking semantic-access semantic-fallback`.

**Phụ thuộc:** T2–T3 + #67/content search · **Files:** service/query/refund adapter/tests · **Cỡ:** M.

### T7 — API và search UI

**Tiêu chí nghiệm thu**

- [ ] GET route auth+`use_ai_search`, Zod q/limit, 402/403/422/503 registry và no-store.
- [ ] UI phân biệt semantic/base fallback, locked/upgrade và `credits_spent`; không hiện similarity như chất lượng trẻ.
- [ ] Query/history UI theo retention/privacy contract; keyboard/tablet/a11y và dismiss/error states xanh.

**Kiểm chứng:** `pnpm test:e2e -- semantic-search` với fake embedding adapter.

**Phụ thuộc:** T6 + #68 UI · **Files:** route/page/components/E2E chia lát · **Cỡ:** M.

### T8 — Relevance, load và re-embed drill

**Tiêu chí nghiệm thu**

- [ ] Eval corpus ghi precision/recall/noise, chốt weights/cutoff; Vietnamese synonyms đạt threshold owner duyệt.
- [ ] Query P95/worker throughput/rows metric trong budget; xác nhận không ANN khi <10k.
- [ ] Drill provider/model change, stale version, queue retry, refund/fallback và privacy canary xanh.

**Kiểm chứng:** eval/load/security report + full automated suites.

**Phụ thuộc:** T5–T7 · **Files:** fixtures/load/evidence · **Cỡ:** M.

### Checkpoint C — Read path và quality

- [ ] Ranking, access, refund/fallback, UI, relevance/load và privacy drill cùng xanh.
- [ ] Human review query plan, eval và egress trước catalog.

### T9 — Cổng ra P4

**Tiêu chí nghiệm thu**

- [ ] Mỗi `BR-SEM-01…08` có test mang mã; AIA đủ 11 rule sau feature thứ sáu.
- [ ] `SEMANTIC-SEARCH` và `AI-ASSISTANT` promote; `PKG-addon_ai` public cùng feature sau human review.
- [ ] Progress chứng minh cả 8 spec P4 `implemented`, dependencies/catalog predicates/gates xanh.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:services` xanh; không open question
  chặn P4 còn mở.

**Kiểm chứng:** full gate trên và audit không còn open question chặn P4.

**Phụ thuộc:** Checkpoint C + Tasks #62–#68 · **Files:** spec statuses, Task #14, catalog/progress/evidence tests · **Cỡ:** M.

## 5. Ngoài phạm vi

ANN dưới 10k, vector service ngoài, cache semantic result, child/profile context vào query,
base search trả credit và mọi outcome mở rộng ngoài Web scale hiện hành.
