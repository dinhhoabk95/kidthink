# Task #205 — Todo: Gieo game level cho 178 kỹ năng mới

Kế hoạch: [`205-open-taxonomy-level-seeding-plan.md`](205-open-taxonomy-level-seeding-plan.md)

## B1 — Mở rộng `kind: "text"` trong assetSchema & render system

- [x] `packages/game-engine/src/contracts/shared-fields.ts`: Thêm `kind: "text"` vào `assetSchema`
- [x] `packages/game-engine/src/systems/renderSystem.ts` & `shared-render.ts`: Thêm render cho `kind: "text"`
- [x] Chạy `check:engine-specs` và `pnpm check` xác minh không phá vỡ 37 template

## B2 — Chuẩn hoá Audio & TTS

- [x] Thống nhất cơ chế TTS fallback & audio narration cho C5 tiếng Việt

## B3 — Đợt A: Gieo 1.650 level cho 154 kỹ năng (Hạ trần 178 -> 24)

- [x] C1 (11 kỹ năng mới · 220 level · `C1.ORD`, `C1.DAT`)
- [x] C2 (12 kỹ năng mới · 120 level · `C2.SOL`, `C2.GRD`)
- [x] C3 (12 kỹ năng mới · 120 level · `C3.SET`, `C3.ALG`)
- [x] C4 (70 kỹ năng mới · 700 level · Cảm quan, Khoa học, Xã hội)
- [x] C5 Đợt A (39 kỹ năng mới · 390 level · Nghe, Nói, Truyện, Tiền tập viết)
- [x] C6 (10 kỹ năng mới · 100 level · `C6.PER`, `C6.INI`)
- [x] Hạ trần `skill-coverage-ratchet.json` từ 178 -> 24

## B4 — Đợt B: Gieo 240 level cho 24 kỹ năng có chữ (Hạ trần 24 -> 0)

- [x] `C5.ALP` (Chữ cái · 8 kỹ năng · 80 level)
- [x] `C5.PRN` (Phát âm · 5 kỹ năng · 50 level)
- [x] `C5.WRD` (Từ vựng tiếng Việt · 6 kỹ năng · 60 level)
- [x] `C5.RHY` (Vần · 4 kỹ năng · 40 level)
- [x] `C5.TON` (Thanh điệu · 1 kỹ năng · 10 level)
- [x] Hạ trần `skill-coverage-ratchet.json` về **0**

## B5 — Lấp round sets & nghiệm thu

- [x] Kiểm tra phân bổ round sets cho các level (`check:round-sets` PASS)
- [x] Chạy `pnpm --filter @mindkid/db check:skill-quota` đạt 0 lỗi, 408/408 skills đạt hạn ngạch
- [x] Chạy `check:go-live`, `check:engine-depth`, `check:lesson-supply` PASS xanh
- [x] Chạy toàn bộ gates `bash scripts/check.sh` pass xanh 100%
