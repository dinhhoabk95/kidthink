# Task #276 TODO: Lộ trình làm trung tâm

Plan: [`276-roadmap-first-seeder-plan.md`](276-roadmap-first-seeder-plan.md).
Spec: [`learning-roadmap-model.md`](../specs/05-content/learning-roadmap-model.md) ·
[`lesson-topic-composition.md`](../specs/05-content/lesson-topic-composition.md).

Luật đóng lát: một lát chỉ tick xong khi cổng của nó **xanh** và **ca âm của nó đỏ**. Cổng
không có ca âm thì lát chưa xong, bất kể code đã viết.

---

## S1 — Cổng cân bằng lộ trình chạy thật

- [x] Cổng ở `packages/content-build/src/gates/roadmap-balance.ts` + CLI `src/cli/check-roadmap-balance.ts`,
      gọi `validateCurriculumModel` (tên thật; plan viết `validateCurriculumBalance`) trên mọi chương trình `published`.
      Gán nội dung qua `selectCurriculumSlot` — hàm thuần tách từ seeder, cổng và seeder dùng chung
- [x] Thêm `check:roadmap-balance` vào `package.json` (gốc và `@mindkid/content-build`)
- [x] Nối vào `seed-all.ts` — chạy **trước** mọi bước ghi (kể cả mở kết nối), mã thoát ≠ 0 chặn pipeline.
      ⚠️ Hệ quả: `pnpm db:seed` **đỏ** cho tới khi S2 + S4 thay 5 chương trình cũ (đúng ý plan §5)
- [x] Đo lại: cổng in bảng 5 hàng. Khớp plan ở `BR-CRM-02` (8/8, 22/42), `BR-CRM-07` (100%, 68,3%),
      `BR-CRM-08` (1/6, 4/6). **Lệch** plan ở `BR-CRM-03` (BE: 5/10 thay 10/14; J42: 19/40 thay 22/38) và
      `BR-CRM-11` (BE: 6 thay 5; J42: 3 khớp) — cổng đọc `skill_codes` của header seed và bỏ level cách ly,
      đúng thứ tự gieo hiện tại; số của plan đo ngày 2026-09-20 trước khi corpus đổi
- [x] **Ca âm**: cùng `CUR-BE3` — kho nguồn thật đỏ, kho cân bằng (6 competency, mỗi tuần 3, ôn lại, không kỹ năng mới
      ở 3 tuần cuối) xanh; ca đỏ riêng cho `BR-CRM-02` · `03` · `07` · `08` · `11`
- [x] Test `packages/content-build/tests/gates/roadmap-balance.test.ts` (12 ca) phủ ca dương, ca âm, và `seed-all`
      dừng trước `getOwnerDb()`
- [x] `BR-CRM-05` chặn trên lộ trình soạn (tiết `offscreen` có `is_offline`); `BR-CRM-01` đo qua `skill_codes` mỗi tiết —
      chương trình legacy vẫn không đo được hai luật này, sẽ bị S4 xoá

## S2 — Lộ trình đầu tiên được soạn

- [x] Tạo `packages/content/src/roadmaps/` và kiểu `RoadmapSeed` theo spec mục 7.1 (spec đã sửa §7.1: thêm `version`,
      `sessions_per_week`, `skill_code` mỗi tiết, bảng vai trò → loại nội dung → `is_offline`)
- [x] Soạn `RM-3-4-mam-01` — band `3-4`, 12 tuần × 3 tiết, mỗi tuần có `goal` và `target_skills`. 12 tuần vì CRM-11 cấm kỹ năng
      mới ở 3 tuần cuối mà 9 kỹ năng mới cần 9 tuần giới thiệu
- [x] Mỗi tiết khai `role` trong `introduce` · `practice` · `review` · `offscreen`
      (`BR-LRM-05`)
- [x] `check:roadmap-balance` xanh trên lộ trình mới — đo: 0/12 tuần lệch, share lớn nhất 30,6% (C1), 6/6 competency,
      0/9 kỹ năng không ôn lại, 0 kỹ năng mới ở 3 tuần cuối
- [x] **Ca âm**: lộ trình khai chỉ 1 competency → đỏ ở `BR-CRM-08`
- [x] **Ca âm**: lộ trình khai kỹ năng không có trong `skills` → đỏ, in mã sai
- [x] Test `tests/gates/roadmap-seed-gate.test.ts` (8 ca): thêm ca âm target_skills lệch, practice trước introduce,
      mã lộ trình sai dạng, trần độ khó band
- ⚠️ Nợ nội dung đã biết (vào sổ cầu ở S3): `C1.CMP.01`, `C5.LIS.01`, `C6.ATT.01` chưa có bài học band `3-4`

## S3 — Sổ cầu nội dung

- [x] Viết `packages/content-build/src/cli/derive-demand.ts` (lõi thuần ở `gates/content-demand.ts`; `pnpm derive:demand`
      ghi file, `pnpm check:content-demand` kiểm). Từ chối chạy khi lộ trình đỏ (`BR-LRM-06`)
- [x] Ô sổ cầu đủ cột theo spec mục 7.2; `template_codes` lấy từ
      `gates/skill-template-affinity.ts`, Cấm — NEVER gõ tay. Spec §7.2 đã sửa: `topic_code` null tới khi có sổ chủ đề,
      `filled_by` là mảng, `level_quota` 3 (practice) / 1 (bài học), luật lấp ô xác định ghi rõ
- [x] In ra `packages/content/src/roadmaps/content-demand.json`, commit vào repo (`BR-LRM-07`)
- [x] Số ô khớp số tiết của lộ trình — 36 ô
- [x] **Ca âm**: chạy lại `derive-demand` không đổi gì → file trùng từng byte (kể cả đảo thứ tự kho đầu vào)
- [x] **Ca âm**: sửa một tuần trong lộ trình → sổ cầu đổi tương ứng
- [x] **Ca âm** bổ sung: nội dung kỹ năng khác / band khác / vượt trần độ khó không lấp ô; `topics[]` dừng chứ không nuốt im lặng
- [x] Test `tests/gates/content-demand.test.ts` (16 ca). Đo thật: `RM-3-4-mam-01` lấp **20/36 ô**, nợ 16 —
      11 ô `offscreen` + 3 ô `introduce` (CMP.01, LIS.01, ATT.01 chưa có bài band `3-4`) + 2 ô `review` (GEO.02, LIS.01); 12/12 ô `practice` đã lấp

## S4 — Bỏ phép chia lấy dư, lật thứ tự pipeline

- [x] Xoá `insertCurriculumItemForSession` và `seedCurriculumItemsData` khỏi
      `seed-master/curricula.ts`
- [x] `curriculum_items` sinh thẳng từ lộ trình, không tính toán lại (`BR-LRM-02`)
- [x] Đổi `seed-all.ts`: bước lộ trình chạy **trước** bước gieo level (`BR-LRM-03`)
- [x] Bỏ `LIMIT 100` — không còn chỗ nào đọc kho để chọn nội dung
- [x] Cổng quét `seed-master/` không còn phép chia lấy dư trên `lessons`/`game_levels`
- [x] **Ca âm**: đưa lại hàm cũ vào cây → cổng đỏ và nêu tên hàm
- [x] **Ca âm**: level không có ô sổ cầu → không lọt vào `curriculum_items` (`BR-LRM-08`)

      Đo sau S4: `pnpm check:seed-master` xanh · `check:roadmap-balance` xanh (1 lộ trình) ·
      `check:content-demand` xanh (20/36 ô, nợ 16) · `check:go-live` READY.
      `seed-all` gieo chương trình `CUR-RM-3-4-mam-01` + 12 tuần trước nội dung, item sau nội dung.
      Chương trình cũ `CUR-BE3..J42` và cổng mô phỏng `roadmap-balance` bị gỡ; seeder không còn
      chạm tới các hàng đó nếu DB cục bộ còn sót.
      Còn treo: `packages/shared/src/curriculum-player.ts` vẫn trả `"CUR-J42"` làm
      `next_curriculum_suggestion` — quyết định hợp đồng API, chưa đổi.

## S5 — `topics[]` và cổng bố cục bài

- [x] Thêm `topics[]` vào `LessonSeed.header` theo spec `lesson-topic-composition` mục 7.1
- [x] Viết `check-lesson-topics.ts` (trong `packages/content-build/src/cli/`, không phải
      `scripts/`) phủ `BR-LTC-01` · `03` · `04` · `05` · `06` · `07` · `09`
- [x] Cổng đỏ trên 126 bài hiện tại, in đúng số bài có 1 chủ đề
- [x] **Ca âm**: bài 2 chủ đề × 2 khuôn hợp lệ → xanh
- [x] **Ca âm**: chủ đề khai khuôn ngoài ma trận tương hợp → đỏ, in cặp kỹ năng-khuôn
- [x] **Ca âm**: hoạt động có `skill_codes` không giao với bài → đỏ (`BR-LTC-06`)

      Đo `pnpm check:lesson-topics` trên 126 bài: chưa khai `topics[]` 126 · khai đúng 1 chủ đề 0 ·
      `BR-LTC-01` 126 · `BR-LTC-05` 1 (mọi bài đúng 3 hoạt động) · `BR-LTC-06` 14 cặp bài-hoạt động
      (spec §7.2 đếm 11 hoạt động; cổng đếm theo cặp bài-hoạt động và tính cả hoạt động ngoài
      trò chơi số, nên hai con số không so thẳng được; chưa đối chiếu từng mã) ·
      `BR-LTC-09` 125 (khuôn riêng biệt mỗi bài 2..2; 1 bài `offscreen` được miễn) ·
      `BR-LTC-03/04/07` 0 vì chưa có chủ đề nào để đo. Gate cố ý **đỏ** tới khi S6 xong, chưa
      nối vào `pnpm check` hay hook. Trần 4 chủ đề chưa chốt nên cổng chưa ép trần.
      `BR-LTC-01` chưa miễn bài `introduce` vì "chủ đề dài" chưa có định nghĩa đo được.

## S6 — Chuyển 126 bài sang `topics[]`

- [x] Sổ chủ đề do tôi soạn một file (`topics/registry.ts`): 48 kỹ năng × 2 chủ đề, mã
      `TP-<skill>-NN`, nhãn tiếng Việt. Chủ đề là khía cạnh con của kỹ năng bài; không dùng `what_tags`
      vì không neo được strand. Bản nháp chờ review PR
- [x] 126/126 bài khai đúng 2 chủ đề (`BR-LTC-01`); 0 bài chưa khai `topics[]`
- [x] Mỗi chủ đề ≥2 khuôn, hoặc rơi nhánh miễn. Kho level không đủ cho **25 bài** — ghi nợ có ratchet
      ở `thresholds/lesson-topics-debt.json`: `level_stock_short` 18 · `matrix_empty` 7 (kỹ năng
      `C1.NCOMP.04`, `C3.DED.01`, `C5.DES.04` chưa có khuôn trong ma trận). Chỉ hạ `BR-LTC-03/07/09`;
      bài đã đạt mà còn trong sổ → `DEBT-STALE` đỏ
- [x] Thêm 176 hoạt động `digital_game` (c1 60 · c2 34 · c3 30 · c4 23 · c5 11 · c6 18), `origin:
      ai_assisted`, lấy level thật. Bản nháp chờ review PR. `ACT-0811` vá `LES-0107`: gỡ hoạt
      động lệch kỹ năng làm bài còn 1 khuôn, cổng `lesson-variety` (BR-LTV-02/03) đỏ; thêm level
      `GL-C1-NCOMP-TCMP-0016` đúng kỹ năng, không nới luật
- [x] Hoạt động lệch kỹ năng: 14 cặp (bài, hoạt động) thực đo, gỡ khỏi bài → `BR-LTC-06` còn 0
- [x] `check:lesson-topics` xanh: `BR-LTC-01/02/04/05/06` 0 vi phạm; `03/07/09` 0 ngoài sổ nợ
- [x] **Ca âm**: `BR-LTC-05` — số hoạt động mỗi bài 3..7, min khác max; test đỏ khi mọi bài cùng số.
      Ca âm sổ nợ: bỏ sổ → cổng đỏ; bài đã đạt còn trong sổ → đỏ
- [ ] Trần 4 chủ đề, miễn `introduce` (chủ đề dài), `BR-LTC-08` thời lượng: **chưa ép** vì spec chưa
      chốt (câu hỏi mở), không đoán

## S7 — `gen-levels` đọc sổ cầu

- [x] `gen-levels.ts` nhận `--demand-skill=<skill>`: đọc `content-demand.json`, chỉ cho sinh khi còn ô
      thực hành thiếu cho đúng kỹ năng + band và khuôn nằm trong ma trận tương hợp của ô đó
      (`checkGenerationTarget`); level sinh ra mang `skill_codes: [skill]`. Cờ `--cell` vẫn là
      engine×band, khác nghĩa. **Chưa sinh hàng loạt level** — công cụ và cổng, nợ vẫn 16 · 18 · 14
- [x] Level ngoài sổ cầu là **mồ côi**: suy ra từ sổ cầu (`findOrphanLevels`), không thêm cột vào
      schema; không bao giờ được gieo vì phép lấp ô tra theo kỹ năng. `report:level-demand` in số mồ côi
- [x] `pnpm report:level-demand` in **ô đã lấp / tổng ô** mỗi lộ trình (20/36 · 18/36 · 22/36), không
      in tổng hàng `game_levels` (`BR-LRM-09`)
- [x] **Ca âm**: kỹ năng không có ô / sai band / mọi ô đã lấp / khuôn ngoài ma trận → `gen-levels` ném lỗi
      (`level-demand.test.ts`, chạy trên sổ cầu thật)
- [x] **Ca âm**: hạ một ô khỏi trạng thái đã lấp → `findDebtIncreases` báo nợ tăng; `check:content-demand`
      đỏ với thông điệp trước → sau

## S8 — Ba lộ trình band đầy đủ

- [x] Soạn `RM-4-5-chi-01` và `RM-5-6-la-01` theo cùng khuôn S2 (12 tuần × 3 tiết, 9 kỹ năng mới mỗi
      lộ trình). Bản nháp chờ review PR; taxonomy khai tuổi bằng một tuổi đơn nên prerequisite dưới
      band được miễn — `BR-LRM-11` trong spec, cổng `prerequisiteMap` áp dụng
- [x] Ba lộ trình đều xanh `check:roadmap-balance`, đều phủ 6/6 competency
      (`BR-CRM-08`). Đo: share lớn nhất 30,6% (3-4) · 22,2% (4-5) · 22,2% (5-6); 0/12 tuần lệch;
      0 kỹ năng không ôn lại; 0 kỹ năng mới ở 3 tuần cuối
- [ ] Sinh sổ cầu cho cả ba, lấp tới ngưỡng bậc thang đợt 1 — **chưa đạt, ghi nợ thật**: sổ cầu đã
      sinh cho cả ba nhưng lấp 20/36 (3-4) · 18/36 (4-5) · 22/36 (5-6); nợ 16 · 18 · 14 ô. Theo
      vai trò — 3-4: introduce 3 · offscreen 11 · review 2 · practice 0; 4-5: introduce 4 ·
      offscreen 12 · review 1 · practice 1; 5-6: introduce 3 · offscreen 8 · review 2 · practice 1.
      Nợ chủ yếu là ô bài học và ô `offscreen` (cần bài có hoạt động ngoài màn hình) vì kho bài học
      band 4-5 và 5-6 còn mỏng. Không đoán ngưỡng bậc thang; nợ này là tín hiệu cầu cho đợt soạn kế tiếp
- [x] Mỗi lộ trình band có dãy item **khác nhau** — đo bằng so chuỗi (`content-demand.test.ts` và
      `roadmap-seeding.test.ts`), không được bằng nhau
- [x] Bài học phục vụ một lộ trình band đều khai band đó (`BR-LRM-04`) — `findBandMismatches` chạy
      trong `derive:demand` và `check:content-demand`, mã thoát ≠ 0 và in mã nội dung lệch band
- [x] **Ca âm**: đưa một bài band `5-6` vào lộ trình band `3-4` → cổng đỏ, in mã bài
- [x] **Ca âm** bổ sung: prerequisite nằm trong band mà lộ trình thiếu → đỏ `BR-CRM-01`, in mã
      kỹ năng thiếu (`roadmap-seed-gate.test.ts`)

## Đóng task

- [x] `curriculum-model.md` giữ `status: implemented` — `check:roadmap-balance` xanh trên cả 3 lộ trình
      soạn (0/12 tuần lệch, 6/6 competency)
- [ ] Hai spec mới (`learning-roadmap-model.md`, `lesson-topic-composition.md`) **giữ `draft`** — chưa
      đạt acceptance: nợ ô sổ cầu 16 · 18 · 14, 25 bài thiếu khuôn (sổ nợ có ratchet), trần 4 chủ đề /
      miễn `introduce` / `BR-LTC-08` chưa chốt. Không chuyển `implemented` khi còn nợ
- [x] `docs/specs/index.md`: `phase` và `status` không đổi nên không cập nhật
- [x] Số đo sau ghi ở plan §2.7
