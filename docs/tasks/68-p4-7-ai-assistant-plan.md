# Kế hoạch — Task #68: P4.7 — Trợ lý AI không gửi dữ liệu trẻ

> Viết 2026-08-11, đo tại commit `484ebaf`.
> Spec sở hữu: [`ai-assistant.md`](../specs/07-addon/ai-assistant.md).
> Phụ thuộc: [`67-p4-6-ai-credit-ledger-plan.md`](67-p4-6-ai-credit-ledger-plan.md).
> Hoàn tất sáu tính năng cùng [`69-p4-8-semantic-search-plan.md`](69-p4-8-semantic-search-plan.md).

## Tóm tắt

Task #68 triển khai năm tính năng AI không-search trên dữ liệu đã có: tóm tắt, giải thích báo
cáo, gợi ý game, gợi ý lesson và viết lại hướng dẫn. Server dựng payload allow-list; provider
không nhận tên/UUID/năm sinh/user ID/telemetry lẻ. Mọi call debit credit trước, log model/prompt
version/cost, moderation output, gắn nhãn “gợi ý” và không thay curriculum. Tính năng thứ sáu
semantic search thuộc Task #69; AI spec và catalog chỉ hoàn tất sau join đó.

## 0. Điều kiện vào

- Task #67 `implemented`; debit/refund/idempotency contract đã security/accounting review.
- P3 advanced report, recommendation/content search và ownership child profile đã `implemented`.
- Provider/model, chất lượng tiếng Việt, DPA và moderation được người quyết chốt trước dependency/call thật.

## 1. Hiện trạng và khoảng trống

- Chưa có AI provider adapter, prompt registry, usage log, route/UI trong source.
- Architecture chưa có capability LLM/embedding; vì web và worker cùng cần provider, không được
  import SDK rải trong route/job.
- Moderation port có thể được Task #66 tạo. Nếu hai task chạy song song, chốt một contract/package
  trước rồi cả hai dùng; cấm hai implementation.
- `PKG-addon_ai` đang có `ai_calls: 100` và predicate ledger-only; Task #67 đã nhận debt nhưng
  Task #68 phải tiếp tục giữ SKU ẩn đến #69.

## 2. Quyết định contract

**D-P4Z — Provider qua package port versioned.** Completion và embedding là hai capability rõ,
adapter/config server-only; prompt template có ID/version/hash. Dependency/model đổi phải qua
spec/benchmark/DPA, không nằm rải trong route.

**D-P4AA — Privacy allow-list trước provider.** Route có thể nhận `child_uuid` để server tra,
nhưng mapper tạo object mới đúng payload §7.2. Một automated egress gate chặn key/value canary
PII và raw telemetry trước adapter; log không lưu prompt/output chứa dữ liệu User.

**D-P4AB — Debit/refund bao quanh toàn call.** Debit trước adapter. Provider timeout/error hoặc
moderation chặn khiến User không nhận output thì refund idempotent theo quyết định accounting;
success ghi usage log USD riêng. Không fallback model rẻ và không trả output unmoderated.

**D-P4AC — AI chỉ retrieval/rewrite, không author/publish.** Suggestion chỉ chọn content
`published` caller mở được. Rewrite không tạo lesson/level/objective/skill mới; UI không có action
tự enroll/publish và mọi suggestion bỏ qua được.

**D-P4AD — Catalog join ba task.** Năm feature #68 có thể chạy nội bộ khi evidence xanh, nhưng
`AI-ASSISTANT` chưa promote và `PKG-addon_ai` chưa public cho tới semantic search #69 hoàn tất.

## 3. Đồ thị

```text
T0 đo ledger/report/search/recommendation/moderation seams
 └── T1 chốt provider/model/DPA/package/privacy/refund contract ── Checkpoint A
      ├── T2 provider port + prompt registry + egress gate
      └── T3 ai_usage_log migration/projection
           └── T4 orchestration debit→provider→moderate→log/refund ── Checkpoint B
                ├── T5 report summarize/explain
                ├── T6 suggest game/lesson + rewrite guide
                └── T7 User UI label/dismiss/error
                     └── T8 security/eval/cost/load evidence
                          └── T9 chờ Task #69 rồi promote/catalog
```

## 4. Task triển khai

### T0 — Preflight

**Tiêu chí nghiệm thu**

- [ ] Ledger, P3 report/recommendation, content access và moderation seams `implemented`/được ghi thật.
- [ ] Đối chiếu `BR-AIA-*`, `BR-ACL-*`, `BR-CDC-06`, content-authoring và §7.3.
- [ ] Inventory mọi field có thể đi ra provider và mọi nơi log; không dùng plan-only DTO.

**Kiểm chứng:** `pnpm check:progress`; data-flow inventory có source→mapper→adapter→log.

**Phụ thuộc:** Task #67 + P3 · **Files:** task/spec nếu seam đổi · **Cỡ:** S.

### T1 — Provider, DPA, privacy và release contract

**Tiêu chí nghiệm thu**

- [ ] Benchmark tiếng Việt/cost/latency chọn provider+model; Legal chốt DPA/retention/training policy.
- [ ] Architecture ghi package/SDK, timeout/retry/model version; moderation dùng port duy nhất.
- [ ] Spec ghi refund khi provider/moderation fail, egress allow-list và join #69; dependency/error trước code.

**Kiểm chứng:** `pnpm lint:specs`; architecture/dependency/catalog pending tests xanh.

**Phụ thuộc:** T0 + Product/Legal/Security decisions · **Files:** AIA/architecture/catalog/privacy/error specs · **Cỡ:** M.

### Checkpoint A

- [ ] D-P4Z…D-P4AD được Product/Legal/Security review; SKU ẩn.
- [ ] Không SDK/schema/route trước provider+DPA decision.

### T2 — Provider port, prompt registry và egress gate

**Tiêu chí nghiệm thu**

- [ ] Port server-only nhận typed payload + prompt/model version, có timeout/abort; fake adapter cho test.
- [ ] Prompt registry immutable/versioned; không runtime prompt tùy ý, không core-content generation template.
- [ ] Egress gate deep-scan chặn child/user IDs, display name, birth year, raw telemetry và canary variants.

**Kiểm chứng:** `pnpm test -- ai-provider-contract ai-egress-gate`; test không gọi LLM thật.

**Phụ thuộc:** Checkpoint A · **Files:** package port/prompt/guard/tests · **Cỡ:** M từng lát.

### T3 — Usage log và projection

**Tiêu chí nghiệm thu**

- [ ] `ai_usage_log` có user/feature/credit/model/prompt/tokens/USD/moderation/timestamp; không prompt/output.
- [ ] Link debit/refund idempotent theo ref; USD micros non-negative, credit không trộn cost.
- [ ] Migration DB rỗng/upgrade/rollback và forbidden-column/deep-log tests xanh.

**Kiểm chứng:** `pnpm db:migrate`; `pnpm test -- ai-usage-schema`.

**Phụ thuộc:** Checkpoint A + #67 · **Files:** schema/migration/meta/integration test · **Cỡ:** M.

### T4 — Orchestration an toàn

**Tiêu chí nghiệm thu**

- [ ] Auth/entitlement/ownership trước mapper; debit trước provider; success log usage; fail refund đúng một lần.
- [ ] Output moderation trước return; blocked/error trả tiếng Việt, không provider detail và không model downgrade.
- [ ] Retry/request idempotency không gọi/debit/log hai lần; metrics không child/UGC PII.

**Kiểm chứng:** `pnpm test -- ai-orchestration ai-refund-concurrency`.

**Phụ thuộc:** T2–T3 · **Files:** orchestration service/adapters/tests · **Cỡ:** M.

### Checkpoint B — Privacy/cost boundary

- [ ] Canary PII bị chặn trước adapter; debit/refund/log/moderation lifecycle xanh.
- [ ] Human review data flow, prompt registry và provider adapter.

### T5 — Tóm tắt và giải thích báo cáo

**Tiêu chí nghiệm thu**

- [ ] Route Zod/auth/ownership 404; payload chỉ aggregate + skill names/labels và period đã chốt.
- [ ] Output không diagnosis/medical/development prediction; moderation + language gate có fixture âm.
- [ ] Hai feature dùng prompt/version/cost riêng, UI data không lưu raw output ngoài contract retention.

**Kiểm chứng:** `pnpm test -- ai-report-features`; provider spy chứng minh payload allow-list.

**Phụ thuộc:** T4 + P3.7 · **Files:** routes/feature services/tests chia lát · **Cỡ:** M.

### T6 — Gợi ý nội dung và viết lại hướng dẫn

**Tiêu chí nghiệm thu**

- [ ] Suggest chỉ rerank/chọn game/lesson `published` caller mở được; không trả `content_pack` locked.
- [ ] Rewrite chỉ biến đổi text hướng dẫn hiện có, không ghi lesson/level/objective/skill hay publish/enroll.
- [ ] Empty/provider fail/moderation fail và content archived có fallback/error đúng, refund đúng contract.

**Kiểm chứng:** `pnpm test -- ai-suggest ai-rewrite`; DB write spy cấm core content mutation.

**Phụ thuộc:** T4 + P1/P3 library · **Files:** routes/services/tests chia lát · **Cỡ:** M.

### T7 — UI năm feature

**Tiêu chí nghiệm thu**

- [ ] Mọi output có nhãn “gợi ý”, model không giả người; dismiss được và không chặn luồng.
- [ ] 402/403/503/moderation states rõ, không mất trang/report; không CTA tự enroll/publish.
- [ ] Keyboard/tablet/a11y và no-sensitive-data DOM/log tests xanh.

**Kiểm chứng:** `pnpm test:e2e -- ai-assistant` với fake adapter deterministic.

**Phụ thuộc:** T5–T6 · **Files:** pages/components/E2E chia lát · **Cỡ:** M.

### T8–T9 — Eval, evidence và join semantic

**Tiêu chí nghiệm thu**

- [ ] Eval tiếng Việt có bộ ca diagnosis/core generation/PII/moderation; quality/cost/latency budget đạt.
- [ ] `BR-AIA-01…11` có test mang mã, nhưng spec giữ `approved` tới Task #69 hoàn tất feature thứ sáu.
- [ ] Sau #69, full gate + human review mới promote và public SKU; không call provider production trong gate.

**Kiểm chứng:** full gate, eval report, `pnpm check:progress` sau join.

**Phụ thuộc:** T5–T7 + Task #69 · **Files:** eval/evidence/spec/catalog/progress tests · **Cỡ:** M.

## 5. Ngoài phạm vi

Sinh/publish core content, tự đổi curriculum, diagnosis, raw child telemetry/PII tới provider,
semantic schema/job (Task #69), model fallback âm thầm.
