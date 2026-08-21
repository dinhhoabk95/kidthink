# Kế hoạch — Task #18: P0.5 — Ladder, entitlement và catalog gói

> Viết 2026-08-09, đo tại commit `5a1bb2b`. Bước sở hữu: **P0.5** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu, đúng thứ tự: [`access-ladder.md`](../specs/00-foundation/access-ladder.md) →
> [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) →
> [`package-catalog.md`](../specs/00-foundation/package-catalog.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Ba spec này là trục thương mại của sản phẩm: bậc nội dung, năng lực người dùng, và SKU.
Chúng chưa có code, nhưng **đã có schema và seed** — và cả hai đều lệch hợp đồng ở mức làm
sai kết quả gate, không phải lệch tên cột.

Ba lệch đo được:

1. Enum `access_tier` trong DB có **3 giá trị**, hợp đồng khai **4**. Thiếu đúng bậc `login`.
2. Seed `entitlement_keys` có 16 hàng, nhưng **15/16 key không tồn tại trong registry**.
3. Seed `packages` bán gói theo tháng, trong khi quyết định đã chốt MVP **chỉ bán năm**.

Cả ba đều đi lọt vì cổng hiện tại **đếm số hàng** thay vì so khớp nội dung — cùng loại lỗi
đã ghi ở [`17-p0-4-child-data-compliance-plan.md`](17-p0-4-child-data-compliance-plan.md)
mục 1.3.

## 0. Điều kiện tiên quyết

| Dep của bước | Trạng thái |
|---|---|
| `GLOSSARY` | `implemented` |
| `ACTORS` | **chưa** — P0.3 đang chạy |
| `ACCESS-LADDER` → `ENTITLEMENT-MODEL` → `PACKAGE-CATALOG` | thứ tự nội bộ, không đảo được |

`allowedTiers()` nhận `caller` (guest / User có `active_child_id`), tức là nó đọc kết quả của
`ACTORS`. Vậy P0.5 chia hai khối như P0.4:

- **Khối A** — enum, registry, catalog, quota. Dữ liệu thuần, không đọc `caller`. Chạy ngay.
- **Khối B** — `allowedTiers()`, `hasEntitlement()`, `consumeQuota()`, cache. Cần P0.3 đóng.

## 1. Ba lệch đo được

### 1.1 Enum `access_tier` thiếu bậc `login`

[`game.ts`](../../packages/db/src/schema/game.ts) khai `["free", "standard", "premium"]`.

[`access-ladder.md`](../specs/00-foundation/access-ladder.md) §7.1 khai bốn bậc
`free | login | standard | premium`, và §11 Q3 **đã đóng 2026-08-06 (D-X, T10)** đúng câu hỏi
"gộp `login` vào `standard` được không?" — kết luận: **giữ bốn bậc**, vì `login` là chỗ duy
nhất gate được "chơi miễn phí nhưng có lưu tiến độ".

Hệ quả nếu để nguyên: mọi nội dung định ở bậc `login` phải gán `free` (cho không) hoặc
`standard` (bắt trả tiền). Đó là quyết định thương mại bị ép bởi một enum thiếu giá trị.

Enum đang được dùng ở bốn bảng: `game_levels` ([`game.ts`](../../packages/db/src/schema/game.ts))
· `lessons` `activities` `curricula` ([`content.ts`](../../packages/db/src/schema/content.ts)).
Thêm giá trị vào enum PostgreSQL là thao tác một chiều — cần làm **trước** khi có dữ liệu thật.

### 1.2 Registry `entitlement_keys` — 15/16 key là key bịa

[`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) §7.1 khai đúng 16 key.
[`seed.ts`](../../packages/db/src/seed.ts) seed 16 key khác:

| Trong seed | Có trong registry? |
|---|---|
| `export_pdf` | có |
| `play_game` · `view_curriculum` · `manage_child` · `view_analytics` · `ai_tutor` · `custom_curriculum` · `unlimited_play` · `multi_child` · `offline_access` · `priority_support` · `early_access` · `teacher_dashboard` · `school_license` · `api_access` · `content_authoring` | **không** |

Đây không phải lệch chính tả. `unlimited_play`, `school_license`, `api_access`,
`teacher_dashboard` là **mô hình kinh doanh khác** với thứ ba spec mô tả. `BR-ENT-03` nói key
là hằng số mà code tham chiếu; gate viết theo registry sẽ gate một key không có hàng nào cấp.

Thiếu toàn bộ tám key MVP: `play_free_games` `play_login_games` `play_standard_games`
`play_premium_games` `access_premium_curriculum` `manage_children` `view_basic_report`
`view_advanced_report`.

### 1.3 Catalog gói — chu kỳ sai, thiếu add-on, thiếu quota

| Hợp đồng | Seed hiện tại |
|---|---|
| `standard`: offer 365 ngày | `duration_months: 1` |
| `premium`: offer 365 ngày **và** vĩnh viễn | `duration_months: 12`, không có offer vĩnh viễn |
| Offer shape `{offer_code, billing_period, price_vnd, duration_days}` (§7.3) | `{duration_months, price_vnd}` |
| 4 gói add-on khai báo với `is_public = false` (`BR-PKG-05`) | không có gói nào |
| `quotas` mỗi gói: `child_profiles` 3/5 · `daily_play_minutes` 60/90 | cột `quotas` không được seed |
| `package_entitlements` theo bảng §7.1 | 12 hàng trỏ key bịa |

§11 Q2 **đã đóng 2026-08-06 (D-X, T12)**: MVP **chỉ bán gói năm**; `monthly` chỉ giữ chỗ
trong enum tới khi có cổng thanh toán tự động ở P5. Seed đang bán gói tháng.

`PENDING_PRICE_VND = 0` là **đúng** — §11 Q1 chưa chốt giá, và hằng số tên `PENDING_*` là
đúng thứ [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) yêu cầu ở
cổng ra P2. Giữ nguyên.

### 1.4 Vì sao cổng không bắt được

[`seed.test.ts`](../../packages/db/tests/integration/seed.test.ts) khẳng định:
`keyCount === 16` · `mapCount === 12` · hai gói tồn tại · chạy hai lần không đổi số.

Không assertion nào so tập key với registry. 16 key bịa vẫn cho ra 16.

## 2. Quyết định

**D-DR — Registry là nguồn, seed là bản chiếu.** `SEED_ENTITLEMENT_KEYS` phải **sinh từ** một
hằng số TypeScript đúng bằng §7.1, và cổng phải so khớp hai chiều với DB. Không chép tay lần
thứ hai.

**D-DS — `access_tier` sửa ở P0.5, không hoãn sang P1.** [`access-gating.md`](../specs/04-play/access-gating.md) ở P1.3 tiêu thụ
enum này. Thêm giá trị enum sau khi `game_levels` có ≥120 hàng `published` là thao tác khác
hẳn với thêm lúc bảng rỗng.

**D-DT — Không seed dữ liệu giá.** Giá vẫn `PENDING_PRICE_VND` cho tới khi §11 Q1 chốt
(chặn P2). P0.5 seed **cấu trúc** offer đúng (`offer_code`, `duration_days`), không seed số tiền.

**D-DU — Quota là bảng thứ hai, không phải entitlement.** `quota_usage` đã có schema đúng.
P0.5 giao registry `QuotaKey` + hạn mức theo gói + hàm đếm; không gộp vào `hasEntitlement`.

## 3. Đồ thị

```
Khối A — chạy ngay
  T1 enum access_tier 4 bậc (migration)
  T2 registry EntitlementKey + QuotaKey (hằng số + type)
        └──→ T3 seed sinh từ registry + cổng so khớp hai chiều
                  └──→ T4 PACKAGE_CATALOG hằng số + 4 add-on + quota
                            └──→ T5 cổng "không hardcode giá"
                                      │
                              ── Cổng dừng A ──

Khối B — sau khi P0.3 đóng
  T6 allowedTiers()  ──→ T7 hình dạng response chặn (strip + no-store)
  T8 hasEntitlement + cache TTL 60s + invalidate
  T9 checkQuota / consumeQuota + reset ICT
                              ── Cổng dừng B ──
  T10 evidence và promote
```

## 4. Task

### Task 1 — Enum `access_tier` đủ bốn bậc

**Tiêu chí nghiệm thu**
- [ ] Ca âm trước: test khẳng định enum DB có đúng bộ `free|login|standard|premium` — **đỏ** trên schema hiện tại.
- [ ] Migration thêm giá trị `login` đúng vị trí thứ tự (`free < login < standard < premium`).
- [ ] `TIER_ORDER` trong code khớp thứ tự enum DB; test so khớp hai nguồn.
- [ ] Bốn bảng mang `access_tier` (`game_levels` `lessons` `activities` `curricula`) đều nhận giá trị mới.

**Kiểm chứng**
- [ ] `pnpm db:migrate` từ database rỗng, không lỗi · `pnpm --filter @mindkid/db test -- game` xanh.

**Phụ thuộc:** không · **Cỡ:** S

### Task 2 — Registry `EntitlementKey` và `QuotaKey`

**Tiêu chí nghiệm thu**
- [ ] 16 key của §7.1 khai trong `packages/shared` dưới dạng `as const`, kèm `group` và cờ `is_mvp` (8 MVP / 8 khai trước, `BR-ENT-04`).
- [ ] 7 quota key của §7.3 khai kèm đơn vị và chu kỳ.
- [ ] Type `EntitlementKey` suy từ hằng số — chuỗi lạ là lỗi biên dịch.
- [ ] Ca âm: gate một key ngoài registry → `UNKNOWN_ENTITLEMENT_KEY` (500, lỗi lập trình).

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test` xanh, assertion tham chiếu `BR-ENT-01` và `BR-ENT-03`.

**Phụ thuộc:** không · **Cỡ:** M

### Task 3 — Seed sinh từ registry, cổng so khớp hai chiều

**Tiêu chí nghiệm thu**
- [ ] Ca âm trước: test so tập `entitlement_keys` trong DB với registry — thiếu là lỗi, thừa là lỗi. **Đỏ** trên seed hiện tại, nêu đúng 15 key thừa và 8 key thiếu.
- [ ] `SEED_ENTITLEMENT_KEYS` sinh từ hằng số Task 2, không chép tay (D-DR).
- [ ] Seed vẫn idempotent theo `key`.
- [ ] Test cũ đếm `16`/`12` thay bằng so khớp tập hợp; **không** giữ song song hai kiểu assert.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/db test -- seed` xanh, assertion tham chiếu `BR-ENT-03`.

**Phụ thuộc:** T2 · **Cỡ:** M

### Task 4 — `PACKAGE_CATALOG` và bảng chiếu

**Tiêu chí nghiệm thu**
- [ ] Hằng số `PACKAGE_CATALOG` đúng hình dạng §7.3 (`offer_code`, `billing_period`, `duration_days`).
- [ ] `PKG-standard`: một offer 365 ngày. `PKG-premium`: offer 365 ngày **và** offer vĩnh viễn (`duration_days: null`).
- [ ] Bốn gói add-on khai với `is_public: false` (`BR-PKG-05`).
- [ ] `quotas` theo §7.1: `child_profiles` 3/5 · `daily_play_minutes` 60/90.
- [ ] `package_entitlements` khớp ma trận 7 dòng của §7.1; ca âm `BR-PKG-08`: mọi key `standard` cấp đều có trong `premium`.
- [ ] Giá giữ `PENDING_PRICE_VND` (D-DT); test khẳng định không gói nào có giá khác 0 khi §11 Q1 chưa chốt.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/db test -- seed` xanh, assertion tham chiếu `BR-PKG-04` `BR-PKG-05` `BR-PKG-08`.

**Phụ thuộc:** T3 · **Cỡ:** M

### Task 5 — Cổng "không hardcode giá"

**Mô tả.** `BR-PKG-02` và acceptance §9 đòi một phép grep: số tiền chỉ được xuất hiện trong
file định nghĩa catalog. Repo đã có tiền lệ đúng dạng này — `pnpm --filter @mindkid/gates test` quét hex literal.

**Tiêu chí nghiệm thu**
- [ ] Cổng quét số tiền dạng chữ số trong `apps/**` và `packages/**`, miễn trừ file catalog.
- [ ] Ca âm: fixture chứa `990000` ngoài catalog làm cổng **đỏ**.
- [ ] Cổng gắn vào `pnpm check`.

**Kiểm chứng**
- [ ] `pnpm check` gọi cổng mới; ca âm chạy trong `pnpm test`.

**Phụ thuộc:** T4 · **Cỡ:** S

### Cổng dừng A

- [ ] Enum `access_tier` bốn bậc; `TIER_ORDER` khớp DB.
- [ ] Tập `entitlement_keys` trong DB **bằng đúng** registry §7.1.
- [ ] Catalog đúng 2 gói bán được + 4 add-on `is_public = false`.
- [ ] `pnpm check && pnpm test && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.
- [ ] Khối B chưa bắt đầu nếu P0.3 chưa đóng.

### Task 6 — `allowedTiers()` là nơi duy nhất ánh xạ

**Tiêu chí nghiệm thu**
- [ ] Cài đúng §7.2; guest → `["free"]`; User có `active_child_id` mà không gói → tới `login`.
- [ ] Property test `BR-LAD-01`: với **mọi** tổ hợp entitlement, tập trả về đóng xuống dưới theo `TIER_ORDER`.
- [ ] `BR-LAD-02`: content thiếu `access_tier` phân giải thành `premium`, không phải `free`.
- [ ] `BR-LAD-05`: bậc hiệu lực = `max(level, curriculum)`.
- [ ] Cổng: không file nào ngoài module này ánh xạ entitlement sang tier.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test -- ladder` xanh, assertion tham chiếu `BR-LAD-01` `BR-LAD-02` `BR-LAD-05`.

**Phụ thuộc:** P0.3 đóng · T1 · T2 · **Cỡ:** M

### Task 7 — Hình dạng response khi chặn

**Tiêu chí nghiệm thu**
- [ ] Body 403 đúng §7.3: `code` `access_tier` `required_entitlement` `upgrade_package_codes` `preview`.
- [ ] Ca âm `BR-LAD-04`: body **không** chứa `content_pack`, **không** chứa `difficulty_params`, không chứa đáp án.
- [ ] `Cache-Control: private, no-store` cho mọi response bậc ≥ `login` (`BR-LAD-09`).
- [ ] `upgrade_package_codes` sinh từ catalog, không viết tay.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/shared test -- ladder` xanh, assertion tham chiếu `BR-LAD-04` `BR-LAD-09`.

**Phụ thuộc:** T6 · T4 · **Cỡ:** M

### Task 8 — `hasEntitlement` và cache

**Tiêu chí nghiệm thu**
- [ ] Đọc từ DB, **không** từ JWT (`BR-ENT-06`); ca âm: token còn hạn nhưng entitlement bị thu hồi → 403 ở request kế tiếp.
- [ ] Hợp nhiều nguồn (`BR-ENT-02`); `expires_at` hiệu lực là muộn nhất.
- [ ] Cache qua `packages/cache`, TTL 60 giây, **invalidate ngay** khi entitlement đổi.
- [ ] Hết hạn không xoá dữ liệu (`BR-ENT-05`).

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/db test -- entitlement` xanh, assertion tham chiếu `BR-ENT-02` `BR-ENT-05` `BR-ENT-06`.

**Phụ thuộc:** P0.3 đóng · T2 · **Cỡ:** M

### Task 9 — Quota

**Tiêu chí nghiệm thu**
- [ ] `consumeQuota` tăng nguyên tử (`used + n` trong một câu lệnh), không read-modify-write.
- [ ] Cạn → **402** `QUOTA_EXCEEDED` kèm `resets_at`; ca âm: không có nhánh trả bản rút gọn (`BR-ENT-07`).
- [ ] Chu kỳ tính theo **ICT (UTC+7)** mốc 00:00; ca âm `BR-ENT-10`: reset ở 00:01 ICT, **không** reset ở 00:00 UTC.
- [ ] `limit_snapshot` ghi lúc mở chu kỳ; đổi gói giữa chu kỳ không hồi tố.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/db test -- quota` xanh, assertion tham chiếu `BR-ENT-07` `BR-ENT-10`.

**Phụ thuộc:** T8 · **Cỡ:** M

### Cổng dừng B

- [ ] Bỏ cookie gọi API không mở thêm bậc nào (`BR-LAD-03`).
- [ ] Response chặn không mang nội dung.
- [ ] Thu hồi entitlement có hiệu lực trong ≤ 1 request.
- [ ] Human review diff — vùng nhạy cảm **gating**, không auto-merge.

### Task 10 — Evidence và promote

- [ ] Mỗi `BR-LAD-*` `BR-ENT-*` `BR-PKG-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented` chỉ khi đủ evidence; rule chặn P1/P2 ghi bước sở hữu.
- [ ] Tick P0.5 chỉ khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Sửa enum `access_tier` sau khi có nội dung | Thêm giá trị enum trên bảng có dữ liệu là thao tác một chiều | D-DS — làm ở P0.5, lúc bảng còn rỗng |
| Key bịa đã lọt vào seed sẽ lọt tiếp vào gate | Gate viết theo registry sẽ không khớp hàng nào | T3 dựng cổng so tập hai chiều, ca âm trước |
| Giá chưa chốt (§11 Q1) | Cám dỗ bịa số để "chạy được" | D-DT — `PENDING_PRICE_VND`, có test chặn giá khác 0 |
| `hasEntitlement` đọc từ JWT cho nhanh | Thu hồi quyền mất hiệu lực tới 15 phút | `BR-ENT-06` có ca âm riêng ở T8 |
| Cache năng lực không invalidate | Người bị thu hồi vẫn chơi tiếp 60 giây | T8 bắt invalidate ngay, test đo bằng request kế tiếp |

## 6. Giả định

1. **Khối A không cần P0.3.** Enum, registry, catalog, seed đều là dữ liệu; không đọc `caller`.
2. **P0.5 không giao route HTTP.** `GET /api/guest/packages` và `/api/users/entitlements` gắn vào ở P1.13 và P1.12; P0.5 giao hàm và dữ liệu.
3. **Allow-list guest 6 level (`BR-LAD-07`) không làm ở P0.5.** §11 Q1 của access-ladder chặn phase P1 và cần nội dung thật — P0.5 chỉ giao chỗ khai báo.
4. **Không tạo package mới.** Registry và catalog vào `packages/shared`; cache dùng `packages/cache`.

## 7. Ngoài phạm vi

- Giá cuối (§11 Q1 của [`package-catalog.md`](../specs/00-foundation/package-catalog.md)) — chặn P2.
- `grace_period` kéo dài bao lâu (§11 Q2 của [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md)) — chặn P1.
- Luồng thanh toán và cấp quyền tay — [`payment-flow.md`](../specs/00-foundation/payment-flow.md) và [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md), P2.
- Áp gating lên route nội dung thật — [`access-gating.md`](../specs/04-play/access-gating.md), P1.3.
