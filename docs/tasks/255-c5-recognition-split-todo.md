# Việc — Task #255: Tách kỹ năng nhận biết C5, gieo taxonomy ở Phase 1

> Kế hoạch: [`255-c5-recognition-split-plan.md`](255-c5-recognition-split-plan.md).
> Mỗi lát cắt là **một chiều dọc**: kho giá trị → dataset thật → ≥10 level chấm → 1 level
> dạy → cạnh prerequisite bật → chơi thật từ đầu tới cuối → hạ ratchet.
> Cấm — NEVER cắt ngang (gieo hết dataset mọi strand rồi mới soạn level).
> Cấm — NEVER mở một lát cắt mới khi lát cắt trước chưa hạ được ratchet.

## Chốt chặn 0 — trước dòng mã đầu tiên

- [x] `D-TC` — chốt mã strand: P1 `LET` `DGR` `TMK` `RIM` `ONS` / P2 tiếng Việt / P3 nối đuôi
- [x] `D-TB` — chốt độ mịn nhóm 5–6 giá trị (35 mã), không phải từng giá trị (~310 mã)
- [x] `D-TD` — `C5.VOC` +15 gieo mã ngay Phase 1, soạn nội dung sau
- [x] `D-TF` — đổi tên `C5.ALP.08`
- [x] Ghi ảnh chụp trước khi sửa: `pnpm check:intro-coverage` · ratchet hiện tại (`0`) ·
      danh sách file test đỏ (`pnpm test` có `--bail 1`, phải liệt kê thủ công)

> Mã strand và mã kỹ năng bất biến. `D-TC` chốt sai thì không sửa lại được, chỉ bỏ đi.

## WP255.1 — Gỡ số cứng trước khi số đổi

- [x] `scripts/taxonomy/sync-taxonomy-docs.ts:105,107,253` — suy số từ `SKILL_IDENTITIES`,
      bỏ so sánh cứng `!== 408`
- [x] `scripts/check-intro-coverage.ts:54` — baseline mặc định suy từ số kỹ năng thật
- [x] `packages/taxonomy/tests/taxonomy.test.ts:35` — suy từ `STRANDS_CATALOG`, bỏ `71`
- [x] `packages/content-build/tests/gates/level-allocation.test.ts:22,46,126`
- [x] Gộp ba file ngưỡng đang có **hai bản**: `packages/content-build/src/thresholds/` và
      `packages/db/config/` — `level-allocation` · `skill-age-progression` ·
      `skill-template-affinity`
- [x] `packages/content/src/skills/index.ts` — header registry
- [x] **Ca âm:** thêm một `SkillIdentity` giả rồi chạy `pnpm check` → mọi cổng phải báo
      cùng một con số mới, không cổng nào ném `Counts mismatch`. Xoá mã giả sau khi đo
- [x] **Nghiệm thu:** `grep -rn "408" scripts packages --include=*.ts --include=*.json` chỉ
      còn dữ liệu lịch sử, không còn ngưỡng sống

> **Chốt chặn 1.** Việc này đi **trước** WP255.3. Đổi số kỹ năng trước khi gỡ số cứng là
> tự tạo một đợt đỏ không liên quan tới thiết kế.

## WP255.2 — Spec đi trước

- [x] Sửa `docs/specs/01-platform/taxonomy-service.md`: C5 nhận 5 strand nhận biết, nêu
      ranh giới với `#254` theo bảng mục 1 của kế hoạch
- [x] Viết `docs/specs/05-content/skill-value-inventory.md` (`SKILL-VALUE-INVENTORY`):
      kỹ năng có dãy giá trị BẮT BUỘC khai kho; kho là nguồn sự thật cho dataset và cho
      phép kiểm phủ
- [x] Sửa `concept-topic-model.md`: `BR-CTM-09` và `BR-CTM-10` đối chiếu với kho giá trị,
      không đối chiếu bằng mắt người duyệt
- [x] Cập nhật `docs/specs/index.md` và bảng `business-rules.md`
- [x] **Nghiệm thu:** spec nêu đích danh ca âm cổng phải bắt, kèm số đo hôm nay
      (`C5.ALP.04` có 5 / 29 giá trị · `C5.TON` có 0 / 6 dấu thanh)

## WP255.3 — Phase 1: gieo taxonomy

- [x] `packages/shared/src/strands-catalog.ts` — thêm 5 strand, 71 → 76
- [x] `docs/taxonomy/c5-language-thinking.md` — 5 mục strand mới, 35 hàng kỹ năng theo
      bảng mục 4 của kế hoạch; cập nhật bảng tổng quan trong `docs/taxonomy/index.md`
- [x] 35 file `packages/content/src/skills/c5/{let,dgr,tmk,rim,ons}/*.ts` và
      `c5/voc/C5.VOC.{06..20}.ts` — identity + LO + dataset khung, `levels: []`
- [x] Đăng ký trong `packages/content/src/skills/index.ts`
- [x] `EXPECTED_SKILL_COUNTS.C5` 84 → 119
- [x] Nối cạnh prerequisite mục 4.7 vào các kỹ năng `ALP` `TON` `RHY` `PHO` `WRD` đã có
- [x] `skill-coverage-ratchet.json`: `max_skills_without_levels` 0 → **35**, ghi lý do trỏ
      về task này và ghi mốc trở về 0
- [x] Đổi tên `C5.ALP.08` theo `D-TF` (markdown + `SkillIdentity`, hai bên phải khớp)
- [x] **Nghiệm thu:**
      `pnpm db:seed` gieo 443 kỹ năng / 76 strand ·
      `pnpm check:taxonomy-docs` in `443/443` ·
      `assertDag` xanh ·
      `pnpm check:intro-coverage` **không đổi** (kỹ năng mới chưa có level chấm) ·
      trang `/taxonomy` của admin hiện 20 strand C5

> **Chốt chặn 2.** Ratchet đứng ở 35 là nợ mở có chủ đích. Từ đây mọi PR chỉ được làm nó
> **giảm**. Cấm — NEVER gieo thêm mã kỹ năng nào khác khi nó chưa về 0.

## WP255.4 — Kho giá trị + cổng

- [x] `packages/content/src/inventories/c5-letter.ts` — 29 chữ, chia đúng 5 nhóm `LET.*`
- [x] `c5-digraph.ts` (11) · `c5-tone-mark.ts` (6) · `c5-rime.ts` (53) · `c5-onset.ts` (22)
- [x] `c5-vocabulary.ts` — 15 bộ từ, 8–12 từ mỗi bộ
- [x] `scripts/check-value-inventory.ts` — **hai chiều**: dataset ⊆ kho **và** kho ⊆ hợp
      các dataset của nhóm
- [x] Nối vào `package.json` và `scripts/check.sh` Phase 1, cạnh `check:intro-coverage`
- [x] **Ca âm 1:** thêm `id: "cup"` vào dataset `C5.LET.03` → `pnpm check` đỏ
- [x] **Ca âm 2:** xoá chữ `r` khỏi `C5.LET.05` → cổng nêu đúng chữ thiếu
- [x] **Nghiệm thu:** cổng chạy trên corpus hôm nay phải **đỏ** và nêu đúng nợ thật. Xanh
      nghĩa là cổng sai — dừng lại, đây đúng vết cổng seed báo 552/552 đạt trong khi
      162/228 gói không parse được

## WP255.5 — Lát cắt dọc 1: `C5.LET` (5 kỹ năng)

- [x] 5 dataset thật, đủ 29 chữ, mỗi kỹ năng đúng nhóm của nó
- [x] 50 level chấm (≥10 mỗi kỹ năng, ≥2 khuôn, ≤5 mỗi cặp)
- [x] 5 level dạy `GT-000`, `difficulty: 1`, `teaches` khai đủ, `access_tier` ≤ tier thấp
      nhất của nhóm
- [x] **Nghiệm thu:** ratchet 35 → 30 · `check:intro-coverage` không tăng ·
      thư mục `c5/let/` có 29 glyph phân biệt ·
      chơi thật: hồ sơ trẻ mới vào `C5.ALP.01` bị `428 INTRO_REQUIRED` vì chưa qua
      `C5.LET.01`; học xong bài dạy, chơi đạt, mở được `ALP.01`; mở lại trình duyệt vẫn
      vào thẳng; `/games` hiện huy hiệu

> **Chốt chặn 3.** Lát cắt này chứng minh cả chuỗi: strand mới → kỹ năng mới → kho giá trị
> → cổng → prerequisite → cửa chặn → huy hiệu. Chưa chạy đầu-tới-cuối thì Cấm — NEVER mở
> WP255.6.

## WP255.6 — Lát cắt dọc 2: `C5.DGR` (2 kỹ năng)

- [ ] 2 dataset, 11 chữ ghép; `ng`/`ngh` tách riêng theo luật chính tả
- [ ] 20 level chấm + 2 level dạy
- [ ] Bật prerequisite `C5.ALP.07` ← `C5.DGR.01`, `C5.ALP.08` ← `C5.DGR.02`
- [ ] **Nghiệm thu:** ratchet 30 → 28; `C5.ALP.07` bị chặn khi chưa qua `C5.DGR.01`

## WP255.7 — Đường audio

- [ ] Đếm chính xác: rổ **giá trị** (~230 mục: 6 dấu + 53 vần + 22 âm đầu + ~150 từ) tách
      khỏi rổ **câu thoại** (theo `phrasing` từng kỹ năng)
- [ ] Trình hai phương án kèm giá cho `D-TE`; người đặt việc chốt
- [ ] Nối bước `echo` của `GT-000` (`D-SM` của [`#254`](254-skill-opening-lesson-plan.md))
      vào một kỹ năng mẫu
- [ ] **Nghiệm thu:** một kỹ năng `TMK` chạy đủ nghe → nhắc lại → chấm; ca âm "`echo`
      Cấm — NEVER phát sinh event mang dữ liệu âm thanh"

> **Chốt chặn 4.** `D-TE` chưa chốt thì WP255.8 không khởi động. Bài nhận biết một âm mà
> im lặng là bài rỗng.

## WP255.8 — Lát cắt dọc 3–5: `C5.TMK` · `C5.RIM` · `C5.ONS` (13 kỹ năng)

- [ ] `TMK` 3 kỹ năng — dataset mang **dấu thanh thật**, 30 level chấm + 3 level dạy
- [ ] `RIM` 6 kỹ năng — 53 vần, 60 level chấm + 6 level dạy
- [ ] `ONS` 4 kỹ năng — 22 âm đầu, 40 level chấm + 4 level dạy, audio bắt buộc
- [ ] Ba PR riêng, mỗi PR một strand
- [ ] Bật prerequisite cho `C5.TON.05` · `C5.RHY.04`..`.07` · `C5.PHO.04`..`.07`
- [ ] **Nghiệm thu:** ratchet 28 → 15; `C5.TMK` có 6 dấu thanh (hôm nay toàn C5 có 0)

## WP255.9 — Lát cắt dọc 6: `C5.VOC.06`..`.20` (15 kỹ năng)

- [ ] 15 bộ từ thật, 8–12 từ mỗi bộ, bám 10 chủ đề năm học GDMN
- [ ] 150 level chấm + 15 level dạy
- [ ] **Nghiệm thu:** ratchet 15 → **0** — trần trở về giá trị trước Phase 1;
      không dataset nào của `VOC` còn nằm trong vốn từ trang trí

## WP255.10 — Dọn corpus C5 cũ

- [ ] Viết lại 42 dataset đang lấy trọn từ `spoon cup bed chair apple banana watermelon
      carrot corn dog cat chicken`: `WRT` 7 · `BOK` 5 · `VOC` 5 · `DES` `GRM` `QUE` `STO`
      4 mỗi strand · `LIS` `PRA` `WRD` 3 mỗi strand
- [ ] Viết lại 3 dataset `WRD` để chứa tiếng viết
- [ ] Sửa `GL-C5-STO-INTRO-0001`: khai `teaches`, khai dataset chủ đề, đổi `band: "3-5"`
      sang giá trị hợp lệ
- [ ] Sửa mã level `GL-C5-VOC-*` nằm nhầm trong file strand `STO`
- [ ] **Nghiệm thu:** `BR-CTM-10` xanh trên toàn C5; nợ `intro-coverage` của C5 = 0

## Việc không thuộc task này

- Learning objective khuôn mẫu (84 / 84 kỹ năng C5 giống nhau) — task riêng, không chặn
- `C4` — 70 kỹ năng chưa có level, nợ lớn hơn C5
- Đối chiếu MOET Chuẩn 15 · 16 (chỉ số 79–91, làm quen đọc và viết): hiện chưa có dòng nào
  trong `moet-alignment.md`. Làm sau WP255.8, khi đã có nội dung thật để đối chiếu
