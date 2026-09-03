---
spec: LEGACY-V1-COVERAGE
title: Cổng phủ 60 game types v1 và xương truy vết
area: quality
status: draft
mvp: true
phase: P0
reviewed: 2026-09-01
owns:
  - Định nghĩa 60 game type v1 đã tích hợp vào v2
  - Bậc thang phủ 60 game type v1 (Bậc 0 đến Bậc 3)
  - Nguồn sự thật cho trường legacy_v1_ref
---

# Cổng phủ 60 game types v1 và xương truy vết

> Spec sở hữu các quy tắc phủ game types từ phiên bản v1 (D1-01..D6-11) sang nền tảng v2 (C1-01..C6-03).
> Tham chiếu: [`Task #168`](../../tasks/168-v1-game-list-integration-plan.md), [`Task #170`](../../tasks/170-legacy-v1-traceability-spine-plan.md).

## 1. Mục đích

1. Cung cấp **xương truy vết 60 game types v1** sang hệ thống template và taxonomy v2.
2. Đo lường khách quan tỷ lệ hoàn thành tích hợp 60 game types bằng dữ liệu (`legacy_v1_ref`), không bằng lời nói.
3. Đảm bảo mọi level được tính vào độ phủ v1 phải qua `content_contract` của template.

## 2. Ranh giới dữ liệu

1. **Registry 60 Game Types:** Lưu trữ tại `packages/shared/src/constants/legacy-v1-game-types.ts` làm nguồn sự thật bất biến (song ánh 60 `legacy_id` ↔ 60 `competency_id`).
2. **Trường `legacy_v1_ref`:**
   - Thuộc `ContentSeedHeader` (`packages/content/src/types.ts`).
   - Lưu trữ tại cột `legacy_v1_ref text` trong bảng `game_levels`.
   - Cấm — NEVER lưu trữ `legacy_v1_ref` trong `content_pack`.

## 3. Business Rules (`BR-LVC-*`)

### `BR-LVC-01` — Bất biến Registry 60 Game Types
Registry `LEGACY_V1_GAME_TYPES` phải có đúng 60 hàng, song ánh 1-1 giữa `legacy_id` (`^D[1-6]-\d{2}$`) và `competency_id` (`^C[1-6]-\d{2}$`), không trùng lặp, không bỏ sót.

### `BR-LVC-02` — Ép định dạng và danh mục mã `legacy_v1_ref`
Nếu trường `legacy_v1_ref` được khai báo trên một level, giá trị của nó bắt buộc phải thuộc danh mục 60 mã hợp lệ của `LEGACY_V1_ID_SET`. Mọi mã lạ đều bị từ chối ở Gate 2.

### `BR-LVC-03` — Điều kiện tính độ phủ một Game Type V1
Một game type v1 được tính là "đã phủ" khi có đủ số lượng level tối thiểu theo bậc thang cấu hình (`min_levels_per_type`), trong đó 100% level phải:
- Ở trạng thái `published` (hoặc seed shippable).
- Khai báo đúng `legacy_v1_ref`.
- Vượt qua `content_contract` và `difficulty_contract` của game template tương ứng.

### `BR-LVC-04` — Bậc thang độ phủ (Coverage Ladder)
Tiến độ tích hợp 60 game types được giám sát qua file `packages/db/config/legacy-v1-coverage.json` gồm 4 bậc thang:
- **Bậc 0:** `min_levels_per_type = 1`, `min_types_covered = 20`.
- **Bậc 1:** `min_levels_per_type = 10`, `min_types_covered = 51`.
- **Bậc 2:** `min_levels_per_type = 10`, `min_types_covered = 57`.
- **Bậc 3:** `min_levels_per_type = 10`, `min_types_covered = 60`.

### `BR-LVC-05` — Cấm báo xanh giả khi thiếu dữ liệu
Cổng `check:legacy-v1` và pipeline `seed:check` bắt buộc phải fail nếu danh sách level rỗng hoặc không đọc được nguồn dữ liệu.

## 4. Kiểm thử và xác minh

- Unit test: `packages/shared/tests/legacy-v1-game-types.test.ts`.
- Gate test: `packages/db/tests/gates/legacy-v1-coverage.test.ts` (gồm ca âm gỡ nhãn và ca âm hỏng contract).
- CLI check: `pnpm --filter @mindkid/db check:legacy-v1` và `pnpm seed:check`.
