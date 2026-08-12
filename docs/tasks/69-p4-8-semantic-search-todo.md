# Checklist — Task #69: P4.8 — Semantic search và cổng ra P4

> Plan: [`69-p4-8-semantic-search-plan.md`](69-p4-8-semantic-search-plan.md)
> Spec: [`semantic-search.md`](../specs/07-addon/semantic-search.md)

## T0–T1 — Preflight/decisions

- [ ] #67/#68, content search, queue, publish/version `implemented`; seams thật được ghi.
- [ ] Verify pgvector local/CI + production plan/validate; không apply.
- [ ] Chốt embedding provider/model/version/N và DPA.
- [ ] Chốt query privacy guard/retention, provider-fail refund và weights/cutoff eval method.
- [ ] Architecture/error/SEM/AIA/ACL contract thống nhất; không còn pending N trước migration.
- [ ] SKU AI vẫn ẩn; `pnpm lint:specs` xanh.

## Checkpoint A

- [ ] D-P4AE…D-P4AI được Product/Legal/Security/Infra review.
- [ ] Không migration/SDK trước model/N/query policy.

## T2–T4 — Schema, provider guard, progress gate

- [ ] Pgvector migration đúng N + unique type/id/version/model; không ANN.
- [ ] Wrong dimension/duplicate/orphan/rollback tests PG thật xanh.
- [ ] Content builder chỉ public title/description/tag; query guard trước provider.
- [ ] Không profile/report/child context hoặc raw query log ngoài retention.
- [ ] Fake adapter pin model/N; tests không gọi provider thật.
- [ ] Progress gate map đủ 8 spec/Task #62–#69; approved/public-sớm/dep-thiếu làm đỏ.

## T5 — Embed write path

- [ ] Publish enqueue sau commit với idempotency type:id:version:model.
- [ ] Worker retry 3/backoff 10s/timeout 30s; upsert không trùng.
- [ ] Old vector non-servable ngay khi current published version đổi.
- [ ] Failure alert/metric, base search vẫn sống; PG/Valkey race tests xanh.

## Checkpoint B

- [ ] Publish→embed current version, retry/race/stale fail-closed xanh.
- [ ] Human review migration, egress payload và transaction boundary.

## T6–T7 — Hybrid/API/UI

- [ ] Debit trước query embed; hybrid current-version only; open trước locked.
- [ ] Locked không content_pack; no-store; limit ≤20 và access matrix xanh.
- [ ] Provider fail → base result 200 + refund + credits 0; cả hai fail mới 503.
- [ ] GET auth/entitlement/Zod/error registry đúng; retry không double debit.
- [ ] UI fallback/locked/credits rõ, không diễn giải similarity như chất lượng trẻ.
- [ ] Keyboard/tablet/a11y/privacy retention E2E xanh.

## T8 — Eval/load/drill

- [ ] Corpus Việt có labels; precision/recall/noise chốt weights/cutoff.
- [ ] P95/throughput/row metrics trong budget; không ANN dưới 10k.
- [ ] Drill model change/stale/retry/refund/privacy canary xanh.

## T9 — Cổng ra P4

- [ ] Mỗi `BR-SEM-01…08` và `BR-AIA-01…11` có test mang mã.
- [ ] SEM + AIA promote; AI SKU public cùng feature sau human review.
- [ ] Progress chứng minh đủ 8 spec P4 `implemented` và catalog predicates xanh.
- [ ] `pnpm check`, `pnpm test`, `pnpm lint:specs`, `pnpm check:services` xanh.
- [ ] Không câu hỏi chặn P4 còn mở; không auto-merge/migration ngoài local/provider production trong test.

## Ngoài phạm vi

- [ ] Không ANN <10k/vector service ngoài/cache semantic.
- [ ] Không child/profile context, base search có charge, hoặc hạng mục P5.
