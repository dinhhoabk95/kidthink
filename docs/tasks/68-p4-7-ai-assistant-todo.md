# Checklist — Task #68: P4.7 — Trợ lý AI không gửi dữ liệu trẻ

> Plan: [`68-p4-7-ai-assistant-plan.md`](68-p4-7-ai-assistant-plan.md)
> Spec: [`ai-assistant.md`](../specs/07-addon/ai-assistant.md)

## T0–T1 — Preflight/decisions

- [ ] Task #67 và P3 report/recommendation/content seams `implemented`; data-flow inventory xong.
- [ ] Đối chiếu `BR-AIA-*`, ACL, CDC-06, core-content boundaries, §7.3.
- [ ] Benchmark/chốt provider+model tiếng Việt, cost/latency; Legal chốt DPA/retention/training.
- [ ] Architecture ghi package/SDK/timeout/model version; moderation port duy nhất.
- [ ] Chốt refund provider/moderation fail, egress allow-list và join catalog #69.
- [ ] `pnpm lint:specs` + dependency/catalog pending tests xanh.

## Checkpoint A

- [ ] D-P4Z…D-P4AD được Product/Legal/Security review; SKU ẩn.

## T2–T4 — Provider/privacy/usage/orchestration

- [ ] Port server-only + fake adapter; prompt registry immutable/versioned.
- [ ] Egress gate deep-scan chặn child/user IDs, name, birth year, raw telemetry/canary.
- [ ] `ai_usage_log` không prompt/output; USD tách credit; migration rollback xanh.
- [ ] Auth/ownership trước mapper; debit trước provider; fail refund idempotent.
- [ ] Output moderation trước return; không downgrade model hoặc lộ provider detail.
- [ ] Retry không double call/debit/log; tests không gọi LLM thật.

## Checkpoint B

- [ ] Canary PII bị chặn; debit/refund/log/moderation lifecycle xanh.
- [ ] Human review data flow/prompt/adapter.

## T5–T7 — Năm feature và UI

- [ ] Summarize/explain chỉ aggregate+skill; owner sai 404.
- [ ] Không diagnosis/medical/prediction; language/moderation fixtures âm xanh.
- [ ] Suggest chỉ content published/mở được; locked không content_pack.
- [ ] Rewrite không ghi core content/publish/enroll.
- [ ] Mọi output nhãn “gợi ý”, dismiss được; 402/403/503 rõ.
- [ ] Keyboard/tablet/a11y + DOM/log sensitive-data tests xanh.

## T8–T9 — Eval/evidence/join

- [ ] Eval tiếng Việt PII/diagnosis/core-generation/moderation đạt quality/cost/latency budget.
- [ ] Mỗi `BR-AIA-01…11` có test mang mã.
- [ ] Spec chưa promote và SKU chưa public trước Task #69.
- [ ] Sau #69: full gate/progress/human review xanh mới release.
- [ ] Không production provider call/seed/auto-merge.

## Ngoài phạm vi

- [ ] Không core content generation/publish/auto-enroll/diagnosis.
- [ ] Không semantic schema/job trong task này.
