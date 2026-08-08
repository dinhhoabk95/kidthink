# Checklist — Task #8: Đóng corpus spec P1, lô 2 (30 spec)

> Bối cảnh, đồ thị phụ thuộc, tám cặp câu hỏi dính nhau, tám quyết định cần chủ dự án:
> [`08-p1-batch2-plan.md`](08-p1-batch2-plan.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```
>
> **Tick ô ngay khi làm xong.** Một spec một commit — Task #3 làm vậy và khi `T11a` sai thì
> `git revert` gọn đúng một file.
>
> **Cấm `git commit --no-verify` và `git push --no-verify`.** Hook local là cổng duy nhất của
> repo này ([`lefthook.yml`](../../lefthook.yml)).
>
> Sổ cái quyết định bắt đầu từ **`D-AR`** (mã cuối đã dùng: `D-AQ`).

## Thứ tự làm

```
Bước 0 (push 50 commit)
   |
Lô A: 1 -> 2 -> 3  -> Cổng dừng A  (chủ dự án trả lời 8 câu + duyệt C16)
   |
Lô B: 4 -> 5 -> {6, 7, 8} -> 9 ;  10 -> 11 ;  12   -> Cổng dừng B
   |
Lô C: 13 -> 14 -> 15 -> {16, 17} ;  18 -> 19       -> Cổng dừng C
   |
Lô D: 20 -> 21 -> {22, 27} ; 22 -> {23, 24} ; 21 -> 25 ; 26  -> Cổng dừng D
   |
Lô E: 28 -> 29 ;  30
   |
Bước 31 (roadmap) -> Bước 32 (đối chiếu tay) -> Cổng dừng cuối
```

---

## Bước 0 — Đẩy 50 commit đang chờ

Cổng dừng cuối của Task #6 để lại ô này chưa tick vì Docker không sống. Đo lại: Docker đã sống.

- [ ] `docker compose up -d`
- [ ] `pnpm check:services` xanh (PG 17 + Valkey 9, đúng major version)
- [ ] `git push` — không dùng `--no-verify`
- [ ] `git log --oneline origin/main..HEAD | wc -l` ra **0**
- [ ] Quay lại [`06-p1-spec-closure-todo.md`](06-p1-spec-closure-todo.md) Cổng dừng cuối, tick ô
      `git push`

---

## Lô A — contract chất lượng (3 spec)

Mọi spec giao diện ở lô B, C, D tiêu thụ ngưỡng của lô này. Chốt sau thì phải mở lại spec đã
`approved`.

### Bước 1 — [`accessibility.md`](../specs/08-quality/accessibility.md)

172 dòng · 1 rule · 2 câu hỏi · 0 cảnh báo. Rẻ nhất lô 2, và là nút chặn của bước 2.

- [x] Đọc hết file, ghi lại số dòng và số rule thực đo
- [x] Đối chiếu `depends_on: []` — đúng như nhát cắt `D-AH` của Task #6 để lại
- [x] Chuyển bảng mục 11 sang 5 cột (`#`, `Câu hỏi`, `Chặn gì`, `Chặn phase`, `Chủ`)
- [x] Q1 (kiểm thử với trẻ thật và công nghệ trợ giúp trước go-live) — để mở, `Chặn phase: Go-live`
- [x] Q2 (sàn 96px cho band 3–4 dựa nguồn nào) — **chặn P1, phải chốt**: tìm nguồn trích dẫn
      được hoặc ghi `D-AR` nói rõ số này là ước lượng nội bộ và điều kiện để sửa
- [x] Chạy checklist review [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 10, đủ 15 mục
- [x] `status: approved`, `reviewed: 2026-08-08`
- [x] `pnpm lint:specs` 0 lỗi, cảnh báo **không đổi** (file này vốn 0 cảnh báo)
- [x] Commit `feat(specs): T8 bước 1 — approve accessibility`

### Bước 2 — [`design-system-contract.md`](../specs/08-quality/design-system-contract.md)

187 dòng · 14 rule · 2 câu hỏi · 3 cảnh báo `C6`.

- [x] Đọc hết file
- [x] **Soi mục 7.1**: bảng sàn chạm (64px · 76px · 96px · 44px) đang **chép lại** thứ mà
      `BR-A11-04` của [`accessibility.md`](../specs/08-quality/accessibility.md) sở hữu. Đổi
      thành liên kết, không giữ bản sao — [`CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 2:
      contract bị copy sẽ drift
- [x] Điền "vì sao" cho `BR-DSC-09`, `BR-DSC-13`, `BR-DSC-14`
- [x] Chuyển bảng mục 11 sang 5 cột
- [x] Q1 (bộ avatar preset do ai vẽ, bao nhiêu cái) — **cặp số 2** của kế hoạch mục 6, dính với
      [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) Q1. Cần chủ dự án →
      hỏi ở Cổng dừng A, chốt một lần cho cả hai file
- [x] Q2 (giấy phép font chữ số trên canvas) — chặn P1, chốt hoặc ghi chủ sở hữu rõ
- [x] Checklist review 15 mục
- [x] `status: approved`, `reviewed: 2026-08-08`
- [x] `pnpm lint:specs` 0 lỗi, cảnh báo giảm **3**
- [x] Commit `feat(specs): T8 bước 2 — approve design-system-contract`

### Bước 3 — [`performance-budgets.md`](../specs/08-quality/performance-budgets.md)

179 dòng · 11 rule · 3 câu hỏi · 1 cảnh báo `C6`.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-PRF-08`
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (thiết bị chuẩn đo 60 fps) — **cặp số 1**: [`SPEC.md`](../SPEC.md) mục 13 Cổng ra P1 đã
      ghi "60 fps trên tablet Android 2GB". Còn thiếu model cụ thể → hỏi ở Cổng dừng A
- [ ] Q2 (t3.small đủ cho MVP không) — để mở, `Chặn phase` ghi ngân sách hạ tầng
- [ ] Q3 (CDN trước S3 từ đầu hay sau) — để mở, `Chặn phase: P2`
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới
- [ ] `pnpm lint:specs` 0 lỗi, cảnh báo giảm **1**
- [ ] Commit `feat(specs): T8 bước 3 — approve performance-budgets`

### Cổng dừng A — phiên quyết định của chủ dự án

Gom tất cả câu hỏi cần người vào **một phiên**. Hỏi rải rác 8 lần trong 30 spec là 8 lần dừng việc.

- [ ] `pnpm check` xanh, `pnpm test` xanh
- [ ] Chủ dự án trả lời 8 câu ở [`08-p1-batch2-plan.md`](08-p1-batch2-plan.md) mục 7:
  - [ ] 1 — model tablet chuẩn đo 60 fps
  - [ ] 2 — ngân sách và đơn vị rà soát pháp lý
  - [ ] 3 — số avatar preset và ai vẽ
  - [ ] 4 — lời khen thu âm người thật hay tổng hợp giọng nói
  - [ ] 5 — có dùng analytics tự host không
  - [ ] 6 — kênh hỗ trợ trực tiếp là gì
  - [ ] 7 — 6 game allow-list guest và ngưỡng lượt mời đăng ký
  - [ ] 8 — nguồn y tế cho ngưỡng 30/60/90 phút
- [ ] Ghi cả 8 câu trả lời thành `D-*` liên tiếp, một mã một quyết định
- [ ] Chủ dự án duyệt **hoặc bác** đề xuất `C16` ([`08-p1-batch2-plan.md`](08-p1-batch2-plan.md)
      mục 8). Nếu duyệt: thêm `checkC16` + **ca âm** vào
      [`lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts), xoá thân hàm phải làm test
      đỏ, rồi commit riêng `feat(lint): T8 — C16 câu hỏi mở phải có chủ và phase`
- [ ] Commit `docs(tasks): T8 — chốt 8 quyết định ở Cổng dừng A`

---

## Lô B — lõi chơi (9 spec)

Lô đụng `play_sessions` và `play_events`. **Mọi cột phát sinh phải sửa
[`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) và mục 7 của
[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) trong cùng commit** —
`C12` kiểm bản đồ bảng hai chiều và sẽ đỏ nếu chỉ sửa một bên.

### Bước 4 — [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md)

193 dòng · 10 rule · 2 câu hỏi · 0 cảnh báo. Nút chặn của cả nhánh phiên chơi.

- [ ] Đọc hết file
- [ ] Đối chiếu với [`access-gating.md`](../specs/04-play/access-gating.md) (đã `approved` ở
      Task #6): config trả về phải đã lọc quyền, `content_pack` không được lọt cho guest
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (đáp án đúng nằm trong payload) — để mở, `Chặn phase: P4`
- [ ] Q2 (adaptive params áp ở P3, P1 dùng tham số gốc) — **chặn P1, chốt**
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, `pnpm lint:specs` 0 lỗi
- [ ] Commit `feat(specs): T8 bước 4 — approve game-config-delivery`

### Bước 5 — [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md)

204 dòng · 11 rule · 2 câu hỏi · 3 cảnh báo. File dài nhất lô B.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-PSL-04`, `BR-PSL-05`, `BR-PSL-09`
- [ ] Đối chiếu máy trạng thái phiên với
      [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) mục 7 — mọi
      trạng thái trong spec phải có chỗ chứa trong bảng
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (30 phút đóng phiên bỏ dở có đúng không) — **chặn P1, chốt**
- [ ] Q2 (trẻ quay lại phiên `abandoned` — tiếp tục hay bắt đầu mới) — **chặn P1, chốt**
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, `pnpm lint:specs` cảnh báo giảm **3**
- [ ] Commit `feat(specs): T8 bước 5 — approve play-session-lifecycle`

### Bước 6 — [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md)

193 dòng · 9 rule · 2 câu hỏi · 1 cảnh báo.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-ING-04`
- [ ] Đối chiếu tính idempotent với Cổng ra P1 ở [`SPEC.md`](../SPEC.md) mục 13: "ghi đủ event,
      idempotent khi gửi trùng, không complete được hai lần"
- [ ] Đối chiếu mã sự kiện với [`event-catalog.md`](../specs/00-foundation/event-catalog.md)
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (khoảng trống `seq` có cần cảnh báo không) — **chặn P1, chốt**; nếu có cảnh báo thì phải
      khớp [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md)
- [ ] Q2 (có nén payload event không) — **chặn P1, chốt**
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **1**
- [ ] Commit `feat(specs): T8 bước 6 — approve play-event-ingestion`

### Bước 7 — [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md)

199 dòng · 8 rule · 2 câu hỏi · 2 cảnh báo.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-SCO-01`, `BR-SCO-05`
- [ ] Đối chiếu với Cổng ra P1: "điểm tính ở server; gửi điểm giả từ client không đổi kết quả lưu"
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (trọng số 0,6/0,4) — để mở, `Chặn phase: P3` (cần dữ liệu thật để tinh chỉnh)
- [ ] Q2 (`sequence-order` chấm từng vị trí hay cả chuỗi) — **cặp số 6**: đây chính là chỗ mà
      [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) Q3 hẹn "chốt
      lúc [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) thiết kế". Chốt cả
      hai chỗ trong **cùng commit**, ghi `D-*`
- [ ] [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) là spec
      `approved` — sửa nó là đổi contract, nêu ở Cổng dừng B
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 7 — approve scoring-and-result, đóng Q3 của game-template-contract`

### Bước 8 — [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md)

190 dòng · 9 rule · 3 câu hỏi · 2 cảnh báo.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-HPL-04`, `BR-HPL-08`
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (30/60/90 phút khớp khuyến nghị y tế nào) — dùng câu trả lời số 8 của Cổng dừng A, ghi
      nguồn trích dẫn được vào cột "vì sao" của rule tương ứng
- [ ] Q2 (hạn mức theo tuần) — để mở, `Chặn phase: P3`
- [ ] Q3 (gợi ý hoạt động ngoài màn hình lấy từ đâu khi chưa có `lessons`) — **cặp số 4**, dính
      với [`basic-report.md`](../specs/03-account/basic-report.md) Q2 ở bước 18. Chốt tại đây,
      bước 18 tham chiếu lại
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 8 — approve healthy-play-limits`

### Bước 9 — [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md)

180 dòng · 10 rule · 2 câu hỏi · 1 cảnh báo.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-FBK-08`
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (thu âm người thật hay tổng hợp giọng nói) — dùng câu trả lời số 4 của Cổng dừng A; ghi
      hệ quả kích thước bundle vào [`performance-budgets.md`](../specs/08-quality/performance-budgets.md)
      nếu con số đổi
- [ ] Q2 (mascot có nhất quán qua mọi theme không) — chốt cùng
      [`design-system-contract.md`](../specs/08-quality/design-system-contract.md)
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **1**
- [ ] Commit `feat(specs): T8 bước 9 — approve feedback-and-celebration`

### Bước 10 — [`parent-gate.md`](../specs/04-play/parent-gate.md)

167 dòng · 8 rule · 2 câu hỏi · 0 cảnh báo. Nút chặn của bước 11 và bước 17.

- [ ] Đọc hết file
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (nút back trình duyệt không chặn được) — **cặp số 8**: để mở,
      `Chặn phase: P5`, `Chủ`: [`pwa-install.md`](../specs/01-platform/pwa-install.md)
- [ ] Q2 (tỉ lệ fail bao nhiêu là quá khó) — để mở, `Chặn phase` ghi KPI P1
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới
- [ ] Commit `feat(specs): T8 bước 10 — approve parent-gate`

### Bước 11 — [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md)

174 dòng · 9 rule · 2 câu hỏi · 0 cảnh báo.

- [ ] Đọc hết file
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (guest chơi bao nhiêu lượt thì mời đăng ký) — **cặp số 5**: dùng câu trả lời số 7 của
      Cổng dừng A. Chốt ở đây thì **phải sửa
      [`access-ladder.md`](../specs/00-foundation/access-ladder.md) Q2 cùng commit** — spec `P0`
      đã `approved`, ghi `D-*` và nêu ở Cổng dừng B
- [ ] Q2 (sảnh trẻ có cần chế độ chỉ hiện nội dung mở được) — **chặn P1, chốt**
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới
- [ ] Commit `feat(specs): T8 bước 11 — approve play-entry-and-profile-select, đóng Q2 của access-ladder`

### Bước 12 — [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md)

175 dòng · 9 rule · 2 câu hỏi · 0 cảnh báo. Không phụ thuộc gì trong lô — làm lúc nào cũng được.

- [ ] Đọc hết file
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (ngưỡng thời gian cần kiểm chứng với trẻ thật) — để mở, `Chặn phase` ghi nghiệm thu P1,
      nhưng **ghi rõ số hiện tại là ước lượng** để người implement không tưởng là số đã đo
- [ ] Q2 (`hint_rate` cao là nội dung khó hay nội dung sai) — để mở, `Chủ`: KPI nội dung
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới
- [ ] Commit `feat(specs): T8 bước 12 — approve scaffolding-and-hints`

### Cổng dừng B — sau lô B (9 spec)

- [ ] 12/12 spec của lô A và B `approved`
- [ ] `pnpm lint:specs` 0 lỗi, cảnh báo giảm đúng **17** so với đầu task (142 → 125)
- [ ] `pnpm check` xanh
- [ ] `pnpm test` xanh
- [ ] **Trả lời rõ: lô B có đổi `schema-*` không?** Nếu có, liệt kê cột và xác nhận
      [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) mục 7 đã sửa cùng
      lúc, `C12` xanh
- [ ] Nêu với chủ dự án hai lần sửa spec đã `approved`:
      [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) (bước 7) và
      [`access-ladder.md`](../specs/00-foundation/access-ladder.md) (bước 11)
- [ ] `git push`

---

## Lô C — tài khoản và hồ sơ trẻ (7 spec)

### Bước 13 — [`legal-pages.md`](../specs/02-public/legal-pages.md)

152 dòng · 9 rule · 3 câu hỏi · 2 cảnh báo. Nút chặn của bước 14 và bước 26.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-LGL-07`, `BR-LGL-08`
- [ ] Xác nhận `depends_on` **không còn** `CONSENT-MANAGEMENT` — nhát cắt `D-AI` của Task #6
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (ngân sách và đơn vị rà soát pháp lý) — dùng câu trả lời số 2 của Cổng dừng A
- [ ] Q2 (hồ sơ đánh giá tác động) — để mở, `Chủ`:
      [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)
- [ ] Q3 (chính sách hoàn tiền) — để mở, `Chặn phase: P2`
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 13 — approve legal-pages`

### Bước 14 — [`consent-management.md`](../specs/03-account/consent-management.md)

173 dòng · 10 rule · 2 câu hỏi · 3 cảnh báo.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-CSM-02`, `BR-CSM-03`, `BR-CSM-06`
- [ ] Đối chiếu với [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md):
      bản đồng ý phải trỏ tới một version chính sách cụ thể
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (diff chính sách sinh tự động hay soạn tay) — **chặn P1, chốt**
- [ ] Q2 (version chính sách đổi bao lâu một lần, ai quyết) — để mở, `Chủ`: pháp lý
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **3**
- [ ] Commit `feat(specs): T8 bước 14 — approve consent-management`

### Bước 15 — [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md)

187 dòng · 16 rule · 2 câu hỏi · 2 cảnh báo. Nhiều rule nhất lô C.

- [ ] Đọc hết file **cạnh**
      [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) — mọi ràng
      buộc pháp lý phải có rule tương ứng, hoặc phải giải thích vì sao không cần
- [ ] Điền "vì sao" cho `BR-CPC-07`, `BR-CPC-08`
- [ ] Đối chiếu cột bảng `child_profiles` với
      [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md)
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (bao nhiêu avatar preset) — **cặp số 2**: dùng câu trả lời số 3 của Cổng dừng A, cùng
      quyết định với [`design-system-contract.md`](../specs/08-quality/design-system-contract.md)
      Q1 đã chốt ở bước 2
- [ ] Q2 (trẻ sang 7 tuổi xử lý thế nào) — **cặp số 7**: để mở, `Chặn phase: P3`, và **thêm liên
      kết chéo** tới [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) Q1
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 15 — approve child-profile-crud`

### Bước 16 — [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md)

160 dòng · 10 rule · 1 câu hỏi · 0 cảnh báo.

- [ ] Đọc hết file
- [ ] Đối chiếu với [`account-deletion.md`](../specs/03-account/account-deletion.md) (đã
      `approved` ở Task #6): xoá tài khoản và lưu trữ hồ sơ trẻ phải nói cùng một chuyện về dữ liệu
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (trẻ sang 7 tuổi có tự động archive không) — **cặp số 7**: để mở, `Chặn phase: P3`,
      `Chủ` trỏ [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) Q2
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới
- [ ] Commit `feat(specs): T8 bước 16 — approve child-profile-archive`

### Bước 17 — [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md)

143 dòng · 8 rule · 1 câu hỏi · 2 cảnh báo. Cần cả bước 15 và bước 10 xong.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-CPS-03`, `BR-CPS-05`
- [ ] Đối chiếu ranh giới với [`parent-gate.md`](../specs/04-play/parent-gate.md): đổi hồ sơ trẻ
      có phải qua cổng phụ huynh không, và ai sở hữu rule đó
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (PIN riêng cho từng trẻ) — để mở, `Chặn phase: P4`
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 17 — approve child-profile-switching`

### Bước 18 — [`basic-report.md`](../specs/03-account/basic-report.md)

175 dòng · 10 rule · 2 câu hỏi · 2 cảnh báo.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-BRP-03`, `BR-BRP-05`
- [ ] Xác nhận `depends_on` **không còn** `PROGRESS-AND-MASTERY` — nhát cắt `D-AK` của Task #6;
      ranh giới "6 mục, không chẩn đoán" phải còn nguyên trong văn xuôi
- [ ] Đối chiếu nguồn dữ liệu với
      [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) (đã `approved`)
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (báo cáo tuần qua email, mặc định bật hay tắt) — **chặn P1, chốt**; phải khớp
      [`notification-service.md`](../specs/01-platform/notification-service.md)
- [ ] Q2 (gợi ý hoạt động ngoài màn hình) — **cặp số 4**: tham chiếu quyết định đã chốt ở bước 8,
      không quyết lại
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 18 — approve basic-report`

### Bước 19 — [`member-dashboard.md`](../specs/03-account/member-dashboard.md)

153 dòng · 10 rule · 1 câu hỏi · 1 cảnh báo. Cần bước 15 và bước 18 xong.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-MDB-04`
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (tài khoản nhiều trẻ cần bố cục khác không) — để mở, `Chặn phase: P3`
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **1**
- [ ] Commit `feat(specs): T8 bước 19 — approve member-dashboard`

### Cổng dừng C — sau lô C (7 spec)

- [ ] 19/19 spec của lô A, B, C `approved`
- [ ] `pnpm lint:specs` 0 lỗi, cảnh báo 142 → **112**
- [ ] `pnpm check` xanh, `pnpm test` xanh
- [ ] Mọi lần sửa spec `P0` đã `approved` trong lô C đều có `D-*`
- [ ] `git push`

---

## Lô D — trang công khai và tìm kiếm (8 spec)

### Bước 20 — [`content-search.md`](../specs/01-platform/content-search.md)

191 dòng · 8 rule · 2 câu hỏi · 1 cảnh báo. Nút chặn của bước 22 và bước 27.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-SRC-05`
- [ ] Xác nhận lọc theo quyền khớp [`access-gating.md`](../specs/04-play/access-gating.md)
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (Postgres full-text đủ tới bao nhiêu nội dung) — để mở, `Chặn phase` ghi sau MVP
- [ ] Q2 — **đã đóng 2026-08-05** (tìm kiếm ngữ nghĩa thuộc add-on AI). Giữ nguyên dạng gạch
      ngang, không xoá
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **1**
- [ ] Commit `feat(specs): T8 bước 20 — approve content-search`

### Bước 21 — [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md)

175 dòng · 2 rule · 2 câu hỏi · 0 cảnh báo. `depends_on: []` sau nhát cắt `D-AJ`.

- [ ] Đọc hết file
- [ ] Xác nhận `depends_on: []` và ranh giới "spec này sở hữu **hạ tầng** SEO, nội dung trang ở
      [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md)" còn nguyên
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (tổ hợp bộ lọc nào đáng index riêng) — **chặn P1, chốt**; liên quan trực tiếp Q1 của
      bước 22
- [ ] Q2 (`og:image` sinh động hay ảnh chung) — **chặn P1, chốt**
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới
- [ ] Commit `feat(specs): T8 bước 21 — approve seo-and-structured-data`

### Bước 22 — [`game-catalog-public.md`](../specs/02-public/game-catalog-public.md)

155 dòng · 9 rule · 1 câu hỏi · 2 cảnh báo. Cần bước 20 và 21.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-GCP-06`, `BR-GCP-08`
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (120 game thì phân trang hay cuộn vô hạn) — **chặn P1, chốt**; phải nhất quán với quyết
      định index bộ lọc ở bước 21
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 22 — approve game-catalog-public`

### Bước 23 — [`game-detail-public.md`](../specs/02-public/game-detail-public.md)

160 dòng · 10 rule · 1 câu hỏi · 2 cảnh báo.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-GDP-02`, `BR-GDP-05`
- [ ] Xác nhận chiều phụ thuộc đúng: file này `depends_on`
      [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md), không ngược lại
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (có ảnh chụp màn hình game không) — **chặn P1, chốt**; nếu có thì phải nói ai sinh và
      cập nhật theo `content_version`
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 23 — approve game-detail-public`

### Bước 24 — [`landing-page.md`](../specs/02-public/landing-page.md)

155 dòng · 10 rule · 2 câu hỏi · 1 cảnh báo.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-LND-08`
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (analytics tự host) — **cặp số 3**: dùng câu trả lời số 5 của Cổng dừng A. Chốt tại đây,
      bước 26 tham chiếu lại
- [ ] Q2 (6 game nổi bật có trùng allow-list guest không) — dùng câu trả lời số 7 của Cổng dừng A
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **1**
- [ ] Commit `feat(specs): T8 bước 24 — approve landing-page`

### Bước 25 — [`faq-and-help.md`](../specs/02-public/faq-and-help.md)

129 dòng · 6 rule · 1 câu hỏi · 2 cảnh báo. File ngắn nhất lô 2.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-FAQ-03`, `BR-FAQ-04`
- [ ] Xác nhận `depends_on` **không còn** `SEO-CONTENT-ADMIN` — nhát cắt `D-AL` của Task #6; nội
      dung FAQ ở P1 vào bằng seed, sửa qua giao diện quản trị là năng lực P2
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (kênh hỗ trợ trực tiếp) — dùng câu trả lời số 6 của Cổng dừng A
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 25 — approve faq-and-help`

### Bước 26 — [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md)

149 dòng · 8 rule · 1 câu hỏi · 2 cảnh báo. Cần bước 13 và bước 24.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-CKB-06`, `BR-CKB-07`
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (analytics tự host có cần cookie không) — **cặp số 3**: tham chiếu quyết định đã chốt ở
      bước 24, không quyết lại. Nếu có cookie thì phải là đồng ý thật, khớp
      [`consent-management.md`](../specs/03-account/consent-management.md)
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 26 — approve cookie-and-consent-banner`

### Bước 27 — [`my-library.md`](../specs/03-account/my-library.md)

160 dòng · 8 rule · 1 câu hỏi · 1 cảnh báo. Cần bước 20.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-MLB-06`
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (thư viện riêng theo từng trẻ hay chung tài khoản) — để mở, `Chặn phase: P3`
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **1**
- [ ] Commit `feat(specs): T8 bước 27 — approve my-library`

### Cổng dừng D — sau lô D (8 spec)

- [ ] 27/27 spec của lô A, B, C, D `approved`
- [ ] `pnpm lint:specs` 0 lỗi, cảnh báo 142 → **106**
- [ ] `pnpm check` xanh, `pnpm test` xanh
- [ ] `git push`

---

## Lô E — mạng xã hội và ngoại tuyến (3 spec)

### Bước 28 — [`social-login.md`](../specs/03-account/social-login.md)

281 dòng · 27 rule · 2 câu hỏi · 0 cảnh báo. **File nặng nhất corpus lô 2** — đọc riêng, không
ghép chung ngày với spec khác.

- [ ] Đọc hết file. 27 rule, đọc từng cái
- [ ] Đối chiếu với [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md)
      (đã `approved` ở Task #6): danh sách provider và hình dạng cấu hình
- [ ] Đối chiếu cột `social_identities` với
      [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) mục 7.3a —
      cột này đã vào migration P0 dù luồng SNS chỉ chạy ở P1
- [ ] Xác nhận `BR-SCL-04` (409 `SOCIAL_EMAIL_CONFLICT`, **không** tự liên kết) khớp Cổng ra P1
      ở [`SPEC.md`](../SPEC.md) mục 13
- [ ] Xác nhận mọi mã lỗi trong mục 8 có trong
      [`error-codes.md`](../specs/00-foundation/error-codes.md) — `C5` là cổng
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (gửi email khi có người thử đăng nhập bằng Google) — để mở, `Chặn phase: P2`
- [ ] Q2 (nhánh B khi provider không trả email) — **chặn P1, chốt**
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới
- [ ] Commit `feat(specs): T8 bước 28 — approve social-login`

### Bước 29 — [`social-account-linking.md`](../specs/03-account/social-account-linking.md)

268 dòng · 14 rule · 2 câu hỏi · 0 cảnh báo. **Thứ tự sau bước 28 không đảo được** —
[`roadmap.md`](../specs/roadmap.md) mục 12.

- [ ] Đọc hết file
- [ ] Xác nhận màn hình liên kết là lối thoát của nhánh 409 `BR-SCL-04` ở bước 28
- [ ] Xác nhận `BR-SLK-04` (chặn gỡ phương thức đăng nhập cuối cùng) có ca hai tab đồng thời
      trong mục 9
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (gộp hai bước gỡ SNS và đặt mật khẩu) — để mở, `Chặn phase: P2`
- [ ] Q2 (reauth 5 phút nên nằm ở đâu) — **chặn P1, chốt**; con số này đang dùng chung với
      [`account-settings.md`](../specs/03-account/account-settings.md) và
      [`mfa.md`](../specs/03-account/mfa.md), phải có **đúng một** chủ sở hữu, còn lại liên kết
      tới. Chủ hợp lý là
      [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) mục 7.4 — nếu
      chuyển thì đó là sửa spec `P0` đã `approved`, ghi `D-*`
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới
- [ ] Commit `feat(specs): T8 bước 29 — approve social-account-linking`

### Bước 30 — [`offline-play.md`](../specs/01-platform/offline-play.md)

163 dòng · 9 rule · 2 câu hỏi · 2 cảnh báo. Độc lập hoàn toàn.

- [ ] Đọc hết file
- [ ] Điền "vì sao" cho `BR-OFF-04`, `BR-OFF-06`
- [ ] Đối chiếu với [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) (bước 6):
      buffer ngoại tuyến gửi lại phải đi qua đúng đường idempotent đó, không có đường riêng
- [ ] Chuyển bảng mục 11 sang 5 cột
- [ ] Q1 (tải trước một tuần curriculum) — để mở, `Chặn phase: P5`
- [ ] Q2 (5 MB buffer đủ chưa) — **chặn P1, chốt** hoặc ghi rõ điều kiện đo
- [ ] Checklist review 15 mục
- [ ] `status: approved`, `reviewed` mới, cảnh báo giảm **2**
- [ ] Commit `feat(specs): T8 bước 30 — approve offline-play`

---

## Bước 31 — Vá bảng P1 của [`roadmap.md`](../specs/roadmap.md)

Đo được: bảng P1 của [`roadmap.md`](../specs/roadmap.md) liệt kê **25** spec, nhưng có **43**
spec mang `phase: P1`. Thiếu 18 — và **7 trong số đó đã `approved` từ Task #6**, tức lỗ hổng
này có trước lô 2. Cùng loại khuyết tật với "Khuyết tật 3" mà Task #6 tìm ra ở
[`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md).

18 spec thiếu:

- [ ] `01-platform`: [`content-search.md`](../specs/01-platform/content-search.md) ·
      [`content-tagging.md`](../specs/01-platform/content-tagging.md) ·
      [`job-queue.md`](../specs/01-platform/job-queue.md) ·
      [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) ·
      [`offline-play.md`](../specs/01-platform/offline-play.md) ·
      [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md)
- [ ] `02-public`: [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md) ·
      [`faq-and-help.md`](../specs/02-public/faq-and-help.md)
- [ ] `03-account`: [`account-deletion.md`](../specs/03-account/account-deletion.md) ·
      [`account-settings.md`](../specs/03-account/account-settings.md) ·
      [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) ·
      [`consent-management.md`](../specs/03-account/consent-management.md) ·
      [`member-dashboard.md`](../specs/03-account/member-dashboard.md) ·
      [`my-library.md`](../specs/03-account/my-library.md)
- [ ] `06-admin`: [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md)
- [ ] `08-quality`: [`accessibility.md`](../specs/08-quality/accessibility.md) ·
      [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) ·
      [`performance-budgets.md`](../specs/08-quality/performance-budgets.md)

- [ ] Thêm cả 18 vào bảng P1 của [`roadmap.md`](../specs/roadmap.md), xếp đúng vị trí theo
      `depends_on` chứ không nối vào cuối bảng
- [ ] Kiểm lại: số spec trong bảng P1 = số spec có `phase: P1` = **43**
- [ ] Commit `docs(specs): T8 bước 31 — bảng P1 của roadmap đủ 43 spec`

---

## Bước 32 — Đối chiếu tay và đóng sổ

Cổng máy không bắt được mọi thứ. Task #3, Task #5 và Task #6 đều chạy bước này và cả ba lần đều
tìm ra chỗ lệch mà kiểm tra tự động bỏ qua.

- [ ] Đếm `status: approved` toàn corpus — phải ra **79/130**
- [ ] Đếm `phase: P1` và `approved` — phải ra **43/43**
- [ ] Đếm cảnh báo `C6` còn nằm trên spec `phase: P1` — phải ra **0**
- [ ] Mọi `BR-*` vừa sửa hoặc vừa điền "vì sao" có mặt trong
      [`business-rules.md`](../specs/00-foundation/business-rules.md)
- [ ] Mọi hàng câu hỏi mở của 43 spec `P1` có `Chặn phase` và `Chủ` không rỗng
- [ ] **Mọi câu hỏi biến mất khỏi mục 11 có một mã `D-*` giải thích.** Câu hỏi bị xoá mà không có
      quyết định là thông tin mất lặng lẽ
- [ ] Đọc lại mọi cột "vì sao" vừa viết. Hỏi từng cái: người sau đọc câu này có hiểu vì sao không
      được xoá rule không? Câu nào chỉ diễn giải lại tên rule thì viết lại
- [ ] [`SPEC.md`](../SPEC.md) mục 14 và [`index.md`](../specs/index.md) mục Tổng khớp số đếm —
      task này không thêm hay xoá file spec nào nên số phải **không đổi**
- [ ] Commit `docs(specs): T8 bước 32 — đóng lô 2 corpus P1, đối chiếu tay`

---

## Cổng dừng cuối — kết thúc task

- [ ] 30/30 spec đích `approved`, tổng corpus **79/130**
- [ ] `phase: P1` đạt **43/43**
- [ ] `pnpm lint:specs` 0 lỗi, **0 chu trình**, cảnh báo **≤ 104**
- [ ] `pnpm check` xanh
- [ ] `pnpm test` xanh
- [ ] `git push` sạch, `origin/main..HEAD` ra **0**
- [ ] Việc tiếp theo: **Task #7** — [`07-first-migration-plan.md`](07-first-migration-plan.md),
      mở lại từ Bước 1. Nếu lô B có đổi `schema-*` thì đọc lại phạm vi Task #7 mục 0 trước khi
      chạy tiếp

---

## Lệnh đếm dùng ở Bước 32

```
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH

# Tổng approved — phải ra 79
grep -rh "^status: approved" docs/specs/*/ --include="*.md" | wc -l

# P1 đã approved — phải ra 43
for f in $(grep -rl "^phase: P1" docs/specs/*/ --include="*.md"); do
  grep -m1 "^status:" "$f"
done | sort | uniq -c

# Cảnh báo C6 còn trên spec P1 — phải ra 0
pnpm lint:specs 2>&1 | grep "\[C6\]" | while read -r line; do
  f="docs/specs/${line%%:*}"
  grep -q "^phase: P1" "$f" && echo "$line"
done

# Bảng P1 của roadmap so với frontmatter — hai số phải bằng nhau
grep -c "^| [0-9]" docs/specs/roadmap.md
grep -rl "^phase: P1" docs/specs/*/ --include="*.md" | wc -l

# Cổng
pnpm lint:specs && pnpm test && pnpm check
```
