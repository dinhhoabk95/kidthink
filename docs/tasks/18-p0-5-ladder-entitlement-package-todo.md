# Checklist — Task #18: P0.5 — Ladder, entitlement, catalog

> Kế hoạch: [`18-p0-5-ladder-entitlement-package-plan.md`](18-p0-5-ladder-entitlement-package-plan.md).
> Vùng nhạy cảm **gating** theo [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md):
> test âm trước, human review diff, không auto-merge.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] Human approve kế hoạch và bốn quyết định D-DR · D-DS · D-DT · D-DU.
- [ ] Đọc §11 của cả ba spec trước tiên; xác nhận Q đã đóng (D-X T10 bốn bậc, D-X T12 chỉ bán năm).
- [ ] Đối chiếu `BR-LAD-*` `BR-ENT-*` `BR-PKG-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

## Khối A — chạy ngay

### Task 1 — Enum `access_tier` bốn bậc

- [ ] Ca âm: test bộ giá trị enum DB **ĐỎ** trên schema hiện tại (thiếu `login`).
- [ ] Migration thêm `login`, thứ tự `free < login < standard < premium`.
- [ ] `TIER_ORDER` trong code khớp enum DB, có test so hai nguồn.
- [ ] `pnpm db:migrate` từ database rỗng không lỗi.
- [ ] Test chuyển **XANH**.

### Task 2 — Registry `EntitlementKey` và `QuotaKey`

- [ ] 16 key §7.1 khai `as const` trong `packages/shared`, kèm `group` và cờ MVP (8/8).
- [ ] 7 quota key §7.3 khai kèm đơn vị và chu kỳ.
- [ ] Type suy từ hằng số; chuỗi lạ là lỗi biên dịch.
- [ ] Ca âm: key ngoài registry → `UNKNOWN_ENTITLEMENT_KEY` (500).
- [ ] `pnpm --filter @kidthink/shared test` xanh, assertion tham chiếu `BR-ENT-01` `BR-ENT-03`.

### Task 3 — Seed sinh từ registry

- [ ] Ca âm: test so tập key DB với registry **ĐỎ**, nêu 15 key thừa và 8 key thiếu.
- [ ] `SEED_ENTITLEMENT_KEYS` sinh từ hằng số Task 2, không chép tay.
- [ ] Seed giữ idempotent theo `key`.
- [ ] Bỏ assertion đếm `16`/`12`, thay bằng so khớp tập hợp.
- [ ] `pnpm --filter @kidthink/db test -- seed` xanh, assertion tham chiếu `BR-ENT-03`.

### Task 4 — `PACKAGE_CATALOG`

- [ ] Hằng số đúng hình dạng §7.3 (`offer_code` `billing_period_vi` `duration_days`).
- [ ] `PKG-standard`: offer 365 ngày.
- [ ] `PKG-premium`: offer 365 ngày **và** offer vĩnh viễn (`duration_days: null`).
- [ ] Bốn add-on khai với `is_public: false`.
- [ ] `quotas`: `child_profiles` 3/5 · `daily_play_minutes` 60/90.
- [ ] `package_entitlements` khớp ma trận 7 dòng §7.1.
- [ ] Ca âm `BR-PKG-08`: mọi key `standard` cấp đều có trong `premium`.
- [ ] Giá giữ `PENDING_PRICE_VND`; test chặn giá khác 0 khi §11 Q1 chưa chốt.
- [ ] `pnpm --filter @kidthink/db test -- seed` xanh, assertion tham chiếu `BR-PKG-04` `BR-PKG-05`.

### Task 5 — Cổng "không hardcode giá"

- [ ] Cổng quét số tiền trong `apps/**` và `packages/**`, miễn trừ file catalog.
- [ ] Ca âm: fixture `990000` ngoài catalog làm cổng **ĐỎ**.
- [ ] Cổng gắn vào `pnpm check`.

## Cổng dừng A

- [ ] Enum bốn bậc, `TIER_ORDER` khớp DB.
- [ ] Tập `entitlement_keys` bằng đúng registry.
- [ ] Catalog 2 gói bán được + 4 add-on ẩn.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.
- [ ] P0.3 đã đóng **trước** khi mở khối B.

---

## Khối B — sau khi P0.3 đóng

### Task 6 — `allowedTiers()`

- [ ] Cài đúng §7.2; guest → `["free"]`; User có `active_child_id` không gói → tới `login`.
- [ ] Property test `BR-LAD-01` trên mọi tổ hợp entitlement.
- [ ] `BR-LAD-02`: thiếu `access_tier` → `premium`, không phải `free`.
- [ ] `BR-LAD-05`: bậc hiệu lực = max(level, curriculum).
- [ ] Cổng: không module nào khác ánh xạ entitlement sang tier.
- [ ] `pnpm --filter @kidthink/shared test -- ladder` xanh.

### Task 7 — Response khi chặn

- [ ] Body 403 đúng §7.3, có `preview` metadata.
- [ ] Ca âm `BR-LAD-04`: không `content_pack`, không `difficulty_params`, không đáp án.
- [ ] `Cache-Control: private, no-store` cho bậc ≥ `login` (`BR-LAD-09`).
- [ ] `upgrade_package_codes` sinh từ catalog.

### Task 8 — `hasEntitlement` và cache

- [ ] Đọc từ DB, không từ JWT; ca âm `BR-ENT-06`: thu hồi có hiệu lực ở request kế tiếp.
- [ ] Hợp nhiều nguồn; `expires_at` hiệu lực là muộn nhất (`BR-ENT-02`).
- [ ] Cache qua `packages/cache`, TTL 60 giây, invalidate ngay khi entitlement đổi.
- [ ] Ca âm `BR-ENT-05`: hết hạn không xoá `child_profiles`/`mastery_state`.

### Task 9 — Quota

- [ ] `consumeQuota` tăng nguyên tử trong một câu lệnh.
- [ ] Cạn → 402 `QUOTA_EXCEEDED` kèm `resets_at`; không nhánh degrade (`BR-ENT-07`).
- [ ] Ca âm `BR-ENT-10`: reset 00:01 ICT, **không** reset 00:00 UTC.
- [ ] `limit_snapshot` ghi lúc mở chu kỳ; đổi gói giữa chu kỳ không hồi tố.

## Cổng dừng B

- [ ] Gọi API không cookie không mở thêm bậc nào (`BR-LAD-03`).
- [ ] Response chặn không mang nội dung.
- [ ] Thu hồi entitlement có hiệu lực trong ≤ 1 request.
- [ ] Human review diff vùng gating.

---

## Task 10 — Evidence và promote

- [ ] Mỗi `BR-LAD-*` `BR-ENT-*` `BR-PKG-*` có test tham chiếu mã rule.
- [ ] Rule chặn P1/P2 ghi bước sở hữu, **không** tick.
- [ ] [`access-ladder.md`](../specs/00-foundation/access-ladder.md) · [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) · [`package-catalog.md`](../specs/00-foundation/package-catalog.md) sang `implemented` chỉ khi đủ evidence.
- [ ] Tick **P0.5** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

## Cổng dừng cuối

- [ ] Không kéo implementation P1.3 ([`access-gating.md`](../specs/04-play/access-gating.md)) hay P2 (thanh toán) lên sớm.
- [ ] Không số tiền nào nằm ngoài file catalog.
- [ ] Working tree không mất thay đổi ngoài phạm vi.
- [ ] Sẵn sàng lập plan P0.6.
