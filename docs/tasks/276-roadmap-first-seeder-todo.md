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
- [ ] Chưa chặn (hoãn sang S2): `BR-CRM-05` — tiết chưa khai vai trò `offscreen`; `BR-CRM-01` — tiết chưa khai kỹ năng mục tiêu

## S2 — Lộ trình đầu tiên được soạn

- [ ] Tạo `packages/content/src/roadmaps/` và kiểu `RoadmapSeed` theo spec mục 7.1
- [ ] Soạn `RM-3-4-mam-01` — band `3-4`, đủ tuần, mỗi tuần có `goal` và `target_skills`
- [ ] Mỗi tiết khai `role` trong `introduce` · `practice` · `review` · `offscreen`
      (`BR-LRM-05`)
- [ ] `check:roadmap-balance` xanh trên lộ trình mới
- [ ] **Ca âm**: lộ trình khai chỉ 1 competency → đỏ ở `BR-CRM-08`
- [ ] **Ca âm**: lộ trình khai kỹ năng không có trong `skills` → đỏ, in mã sai

## S3 — Sổ cầu nội dung

- [ ] Viết `packages/content-build/src/cli/derive-demand.ts`
- [ ] Ô sổ cầu đủ cột theo spec mục 7.2; `template_codes` lấy từ
      `gates/skill-template-affinity.ts`, Cấm — NEVER gõ tay
- [ ] In ra `content-demand.json`, commit vào repo (`BR-LRM-07`)
- [ ] Số ô khớp số tiết của lộ trình
- [ ] **Ca âm**: chạy lại `derive-demand` không đổi gì → file trùng từng byte
- [ ] **Ca âm**: sửa một tuần trong lộ trình → sổ cầu đổi tương ứng

## S4 — Bỏ phép chia lấy dư, lật thứ tự pipeline

- [ ] Xoá `insertCurriculumItemForSession` và `seedCurriculumItemsData` khỏi
      `seed-master/curricula.ts`
- [ ] `curriculum_items` sinh thẳng từ lộ trình, không tính toán lại (`BR-LRM-02`)
- [ ] Đổi `seed-all.ts`: bước lộ trình chạy **trước** bước gieo level (`BR-LRM-03`)
- [ ] Bỏ `LIMIT 100` — không còn chỗ nào đọc kho để chọn nội dung
- [ ] Cổng quét `seed-master/` không còn phép chia lấy dư trên `lessons`/`game_levels`
- [ ] **Ca âm**: đưa lại hàm cũ vào cây → cổng đỏ và nêu tên hàm
- [ ] **Ca âm**: level không có ô sổ cầu → không lọt vào `curriculum_items` (`BR-LRM-08`)

## S5 — `topics[]` và cổng bố cục bài

- [ ] Thêm `topics[]` vào `LessonSeed.header` theo spec `lesson-topic-composition` mục 7.1
- [ ] Viết `scripts/check-lesson-topics.ts` phủ `BR-LTC-01` · `03` · `04` · `05` · `06` ·
      `07` · `09`
- [ ] Cổng đỏ trên 126 bài hiện tại, in đúng số bài có 1 chủ đề
- [ ] **Ca âm**: bài 2 chủ đề × 2 khuôn hợp lệ → xanh
- [ ] **Ca âm**: chủ đề khai khuôn ngoài ma trận tương hợp → đỏ, in cặp kỹ năng-khuôn
- [ ] **Ca âm**: hoạt động có `skill_codes` không giao với bài → đỏ (`BR-LTC-06`)

## S6 — Chuyển 126 bài sang `topics[]`

- [ ] Ánh xạ `what_tags` → mã chủ đề cho phần neo được strand; báo cáo phần không neo được
- [ ] Soạn tay phần còn lại; mỗi bài đạt sàn 2 chủ đề (trừ vai trò `introduce`)
- [ ] Mỗi chủ đề đạt sàn 2 khuôn, hoặc rơi đúng nhánh miễn ở spec mục 5
- [ ] Sửa 11 hoạt động lệch kỹ năng đã đo ở plan §2.5 → còn 0
- [ ] `check:lesson-topics` xanh
- [ ] **Ca âm**: `BR-LTC-05` — đo lại số hoạt động mỗi bài, min khác max

## S7 — `gen-levels` đọc sổ cầu

- [ ] `gen-levels.ts` nhận `content-demand.json` làm nguồn, chỉ sinh ô còn thiếu
- [ ] Level ngoài sổ cầu gắn `orphan`, giữ trong kho, không gieo vào lộ trình (G3)
- [ ] Báo cáo độ phủ in **ô đã lấp / tổng ô**, Cấm — NEVER in tổng hàng `game_levels`
      (`BR-LRM-09`)
- [ ] **Ca âm**: yêu cầu sinh một level cho kỹ năng không có ô → cổng đỏ
- [ ] **Ca âm**: hạ một ô khỏi trạng thái đã lấp → nợ tăng, cổng không xanh

## S8 — Ba lộ trình band đầy đủ

- [ ] Soạn `RM-4-5-*` và `RM-5-6-*` theo cùng khuôn S2
- [ ] Ba lộ trình đều xanh `check:roadmap-balance`, đều phủ 6/6 competency
      (`BR-CRM-08`)
- [ ] Sinh sổ cầu cho cả ba, lấp tới ngưỡng bậc thang đợt 1
- [ ] Mỗi lộ trình band có dãy item **khác nhau** — đo bằng so chuỗi, không được bằng nhau
- [ ] Bài học phục vụ một lộ trình band đều khai band đó (`BR-LRM-04`)
- [ ] **Ca âm**: đưa một bài band `5-6` vào lộ trình band `3-4` → cổng đỏ, in mã bài

## Đóng task

- [ ] `curriculum-model.md` giữ `status: implemented` **chỉ khi** `check:roadmap-balance`
      xanh trên mọi chương trình `published`
- [ ] Hai spec mới chuyển `draft` → `implemented` khi acceptance criteria của chúng xanh
- [ ] Cập nhật `docs/specs/index.md` nếu `phase` hay `status` đổi
- [ ] Ghi lại số đo sau vào plan §2 để so với số trước
