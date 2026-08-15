# Checklist — Task #69: P4.8 — Semantic search và cổng ra P4

> Plan: [`69-p4-8-semantic-search-plan.md`](69-p4-8-semantic-search-plan.md)
> Spec: [`semantic-search.md`](../specs/07-addon/semantic-search.md)

## T0–T1 — Preflight/decisions

- [x] #67/#68, content search, queue, publish/version `implemented`; seams thật được ghi.
- [x] Verify pgvector local/CI + production plan/validate; không apply.
- [x] Chốt embedding provider/model/version/N và DPA.
- [x] Chốt query privacy guard/retention, provider-fail refund và weights/cutoff eval method.
- [x] Architecture/error/SEM/AIA/ACL contract thống nhất; không còn pending N trước migration.
- [x] SKU AI vẫn ẩn; `pnpm lint:specs` xanh.

## Checkpoint A

- [x] D-P4AE…D-P4AI được Product/Legal/Security/Infra review.
- [x] Không migration/SDK trước model/N/query policy.

## T2–T4 — Schema, provider guard, progress gate

- [x] Pgvector migration đúng N + unique type/id/version/model; không ANN.
- [x] Wrong dimension/duplicate/orphan/rollback tests PG thật xanh.
- [x] Content builder chỉ public title/description/tag; query guard trước provider.
- [x] Không profile/report/child context hoặc raw query log ngoài retention.
- [x] Fake adapter pin model/N; tests không gọi provider thật.
- [x] Progress gate map đủ 8 spec/Task #62–#69; approved/public-sớm/dep-thiếu làm đỏ.

## T5 — Embed write path

- [x] Publish enqueue sau commit với idempotency type:id:version:model.
- [x] Worker retry 3/backoff 10s/timeout 30s; upsert không trùng.
- [x] Old vector non-servable ngay khi current published version đổi.
- [x] Failure alert/metric, base search vẫn sống; PG/Valkey race tests xanh.

## Checkpoint B

- [x] Publish→embed current version, retry/race/stale fail-closed xanh.
- [x] Human review migration, egress payload và transaction boundary.

## T6–T7 — Hybrid/API/UI

- [x] Debit trước query embed; hybrid current-version only; open trước locked.
- [x] Locked không content_pack; no-store; limit ≤20 và access matrix xanh.
- [x] Provider fail → base result 200 + refund + credits 0; cả hai fail mới 503.
- [x] GET auth/entitlement/Zod/error registry đúng; retry không double debit.
- [x] UI fallback/locked/credits rõ, không diễn giải similarity như chất lượng trẻ.
- [x] Keyboard/tablet/a11y/privacy retention E2E xanh.

## T8 — Eval/load/drill

- [x] Corpus Việt có labels; precision/recall/noise chốt weights/cutoff.
- [x] P95/throughput/row metrics trong budget; không ANN dưới 10k.
- [x] Drill model change/stale/retry/refund/privacy canary xanh.

## T9 — Cổng ra P4

- [x] Mỗi `BR-SEM-01…08` và `BR-AIA-01…11` có test mang mã.
- [x] SEM + AIA promote; AI SKU public cùng feature sau human review.
- [x] Progress chứng minh đủ 8 spec P4 `implemented` và catalog predicates xanh.
- [x] `pnpm check`, `pnpm test`, `pnpm lint:specs`, `pnpm check:services` xanh.
- [x] Không câu hỏi chặn P4 còn mở; không auto-merge/migration ngoài local/provider production trong test.

## Ngoài phạm vi

- [x] Không ANN <10k/vector service ngoài/cache semantic.
- [x] Không child/profile context, base search có charge, hoặc hạng mục P5.
