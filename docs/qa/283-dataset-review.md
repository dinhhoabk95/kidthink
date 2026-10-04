# #283 — Phiếu duyệt thay đổi dataset

Đo ngày 2026-10-04, so `1496d7c3` (đầu đợt) với `HEAD`. Nguồn: `git diff` của `packages/content/src/skills`,
`packages/game-engine/config/engine-difficulty-params.json`, `packages/game-engine/src/templates/GT-024/fixtures.ts`,
`packages/content/src/builders/gt-000.ts`. Chỉ đếm; không chạy lại builder ở bản cũ.

Lý do chung: ở sàn chạm của band (`BR-PSZ-04`) và canvas thấp, số vật cũ không vừa sân khấu; không thu vật dưới sàn
(`BR-PSZ-13`). Nên giảm số vật/độ khó thay vì nới cổng. Phiên bản nội dung đã nâng lên 3 (`BR-CSA-17`).

**Người duyệt:** chủ nội dung. Mỗi mục: ✅ nhận · ✏️ đổi hướng.

## A. Level B3/B1 hạ độ khó trong dataset kỹ năng — 28 level

Hạng truy cập suy ra từ độ khó, nên 11 level mà hạ độ khó làm hạng tụt được ghim bằng `access_tier` (4 `premium`,
7 `standard`); 17 level còn lại không đổi hạng khi hạ độ khó nên không cần ghim. Phân bố độ khó của (engine, band) trước → sau:

| # | Engine · band | Số level hạ | Độ khó | Phân bố cũ → mới (độ khó: số level) | Hệ quả | Đề xuất |
|---|---|---|---|---|---|---|
| A1 | GT-004 · 4-5 | 11 | 5 → 4 | {1:56, 2:148, 3:163, 4:76, **5:11**} → {…, 4:87} | band 4-5 **mất bậc 5**; GT-004 5-6 giữ nguyên (3/4/5) | ✅ Nhận. Trẻ 4-5 tuổi vẫn còn bậc 5 ở band 5-6 |
| A2 | GT-008 · 3-4 | 3 | 4 → 3 | {…, 3:31, 4:4} → {…, 3:34, 4:1} | khớp `GT-008.md:124` (`slot_count` ≤ 4 ở 3-4); còn 1 level bậc 4 | ✅ Nhận (đưa dữ liệu về đúng spec) |
| A3 | GT-015 · 5-6 | 6 | 5 → 4 | {…, 4:15, **5:6**} → {…, 4:21} | band 5-6 **mất bậc 5**; GT-015 chỉ có band này | ✏️ Cân nhắc: nếu cần bậc 5, thêm level 3×3 ít đáp án thay vì giữ 4×4 (fixture 4×4 ngoài `GT-015.md`: chỉ 2×2/3×3) |
| A4 | GT-021 · 4-5 | 8 | 3→2 (7), 4→2 (1) | {1:4, 2:10, 3:7, 4:1} → {1:4, **2:18**} | band 4-5 chỉ còn bậc 1–2; **dốc phẳng**, 18/22 level cùng bậc 2 | ✏️ Cân nhắc: tách 18 level bậc 2 bằng tham số khác (số cột, độ lệch) thay vì chỉ hạ |

Chi tiết A1 (11): `GL-C1-CNT-PAIR-0007/0011`, `GL-C1-MEAS-PAIR-0011`, `GL-C1-NCOMP-PAIR-0028/0032`, `GL-C1-OTO-PAIR-0011`,
`GL-C1-PAT-PAIR-0019/0023/0027`, `GL-C1-PROB-PAIR-0003`, `GL-C1-SUB-PAIR-0003`.
A2 (3): `GL-C1-CNT-SLOT-0003`, `GL-C1-OTO-SLOT-0015`, `GL-C5-PHO-SLOT-0003` (ghim `premium`).
A3 (6): `GL-C1-PROB-HIDE-0002/0004/0007/0011`, `GL-C2-GRD-HIDE-0002`, `GL-C3-ALG-HIDE-0004`.
A4 (8): `GL-C1-CNT-TANG-0002/0003/0005`, `GL-C2-MIR-COMP-0025`, `GL-C2-SYM-MIR-0003`, `GL-C3-RULE-TANG-0002`,
`GL-C3-SEQ-TANG-0002`, `GL-C4-EXP-TANG-0004` (ghim: 7 `standard`, `GL-C1-CNT-TANG-0003` `premium`).

**Hạng truy cập đổi:** không (đã ghim). Cần xác nhận: hạng ghim là hạng cũ, không phải hạng "đúng" theo độ khó mới; level
bậc 2 mà `premium` (`GL-C1-CNT-TANG-0003`) là cố ý để không đổi quyền của người đã trả phí.

## B. Tham số engine ở độ khó 5 — `engine-difficulty-params.json`

| # | Engine | Tham số | Cũ → mới | Level phục vụ ở bậc 5 | Phẳng thang? | Đề xuất |
|---|---|---|---|---|---|---|
| B1 | GT-009 | `item_count`/`candidate_count`/`distractor_count` | 10/10/9 → 8/8/7 | 21 (4-5: 6 · 5-6: 15) | **Có**: bậc 5 ≡ bậc 4 (8/3 manh mối/8/7) — mất khác biệt độ khó | ✏️ Nên đổi: nâng bậc 5 bằng `clue_count` 3→4 (`GT-009.md:216` cho tối đa 4 manh mối ở 5-6) thay vì thêm ứng viên |
| B2 | GT-029 | `item_count`/`initial_count` | 10 → 8 (`remove_count` 4 giữ) | 7 (4-5: 2 · 5-6: 5) | Không: bậc 4 `remove_count` 3, bậc 5 là 4 | ✅ Nhận |
| B3 | GT-030 | `item_count` | 5 → 4 | 6 (5-6) | Gần phẳng: chỉ khác `length_in_units` 8→10 và `gap_tolerance_pct` 8→6 | ✅ Nhận; ghi nhận khác biệt chỉ còn ở độ dài/dung sai |
| B4 | GT-035 | `collectible_count` | 3 → 2 (`item_count` 8, `max_commands` 8, `obstacle_count` 4 giữ) | 3 (5-6) | Không: bậc 5 vẫn khác bậc 4 ở 3 tham số | ✅ Nhận (`BR-E035-07`) |

**Lệch spec cần sửa** (không do thay đổi này gây ra, chỉ lộ ra): `GT-009.md:146` còn ghi "4–10 ứng viên"; `GT-029.md:176,218`
còn ghi `item_count` [2, 10]; dữ liệu chỉ còn tới 8. Nên hạ trần trong spec về 8 hoặc ghi rõ "trần phụ thuộc sàn chạm".

## C. Fixture/builder

| # | Mục | Cũ → mới | Rủi ro giáo dục | Đề xuất |
|---|---|---|---|---|
| C1 | GT-024 mẫu 2 (ngôi sao) | 10 đỉnh, 11 vật → pentagram 5 đỉnh, 6 vật | Nét nối điểm đơn giản hơn; hình vẫn là ngôi sao một nét | ✅ Nhận. Dùng đúng cho band 5-6 (19 level, bậc 1:5 · 2:6 · 3:8) |
| C2 | GT-000 recall (`gt-000.ts`) | `recallOptions` luôn có đáp án trong ≤4 lựa chọn | Sửa lỗi không qua được intro khi ôn 5–6 vật; không đổi độ khó | ✅ Nhận |

## D. Không đổi
Hạng truy cập · mã level (`BR-CSA-10`) · số level (6380 mỗi phiên bản) · số ánh xạ kỹ năng (6399 mỗi phiên bản).

## E. Điểm cần chốt
1. A3, A4, B1: có bù khác biệt độ khó bằng tham số khác không (đề xuất ✏️), hay nhận thang phẳng hơn.
2. Hạ trần spec GT-009/GT-029 về 8, hay giữ trần cũ và coi 8 là giới hạn runtime theo sàn chạm.
3. Nhận mốc phiên bản 3 cho **toàn bộ** danh mục (không chỉ ~35 level), vì khoá `BR-CSA-17` băm toàn cục.
