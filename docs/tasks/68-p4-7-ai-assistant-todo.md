# Checklist — Task #68: P4.7 — Trợ lý AI không gửi dữ liệu trẻ

> Plan: [`68-p4-7-ai-assistant-plan.md`](68-p4-7-ai-assistant-plan.md)
> Spec: [`ai-assistant.md`](../specs/07-addon/ai-assistant.md)

## T0–T1 — Preflight/decisions

- [x] Task #67 và P3 report/recommendation/content seams `implemented`; data-flow inventory xong.
- [x] Đối chiếu `BR-AIA-*`, ACL, CDC-06, core-content boundaries, §7.3.
- [x] Benchmark/chốt provider+model tiếng Việt, cost/latency; Legal chốt DPA/retention/training.
- [x] Architecture ghi package/SDK/timeout/model version; moderation port duy nhất.
- [x] Chốt refund provider/moderation fail, egress allow-list và join catalog #69.
- [x] `pnpm --filter @mindkid/gates test` + dependency/catalog pending tests xanh.

## Checkpoint A

- [x] D-P4Z…D-P4AD được Product/Legal/Security review; SKU ẩn.

## T2–T4 — Provider/privacy/usage/orchestration

- [x] Port server-only + fake adapter; prompt registry immutable/versioned.
- [x] Egress gate deep-scan chặn child/user IDs, name, birth year, raw telemetry/canary.
- [x] `ai_usage_log` không prompt/output; USD tách credit; migration rollback xanh.
- [x] Auth/ownership trước mapper; debit trước provider; fail refund idempotent.
- [x] Output moderation trước return; không downgrade model hoặc lộ provider detail.
- [x] Retry không double call/debit/log; tests không gọi LLM thật.

## Checkpoint B

- [x] Canary PII bị chặn; debit/refund/log/moderation lifecycle xanh.
- [x] Human review data flow/prompt/adapter.

## T5–T7 — Năm feature và UI

- [x] Summarize/explain chỉ aggregate+skill; owner sai 404.
- [x] Không diagnosis/medical/prediction; language/moderation fixtures âm xanh.
- [x] Suggest chỉ content published/mở được; locked không content_pack.
- [x] Rewrite không ghi core content/publish/enroll.
- [x] Mọi output nhãn “gợi ý”, dismiss được; 402/403/503 rõ.
- [x] Keyboard/tablet/a11y + DOM/log sensitive-data tests xanh.

## T8–T9 — Eval/evidence/join

- [x] Eval tiếng Việt PII/diagnosis/core-generation/moderation đạt quality/cost/latency budget.
- [x] Mỗi `BR-AIA-01…11` có test mang mã.
- [x] Spec chưa promote và SKU chưa public trước Task #69.
- [x] Sau #69: full gate/progress/human review xanh mới release.
- [x] Không production provider call/seed/auto-merge.

## Ngoài phạm vi

- [x] Không core content generation/publish/auto-enroll/diagnosis.
- [x] Không semantic schema/job trong task này.
