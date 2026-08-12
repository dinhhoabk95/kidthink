# Checklist — Task #36: P1.11 — ≥120 game level `published`

> Kế hoạch: [`36-p1-11-game-levels-published-plan.md`](36-p1-11-game-levels-published-plan.md).
> Bước **sản xuất nội dung**, không viết code. Chặn bởi năng lực đọc review.
> Quy tắc cuối bước: thiếu số thì **báo thiếu**, không hạ chuẩn (`D-HL`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] **P1.10 đã đóng** — 8 cổng, 3 lệnh CLI, lô mẫu đã merge.
- [ ] Có **ba số đo review** từ P1.10 T6.
- [ ] Có kết quả **khảo sát port v1** từ P1.2 T1.
- [ ] Human approve kế hoạch và sáu quyết định D-HG · D-HH · D-HI · D-HJ · D-HK · D-HL.
- [ ] Xác nhận số người review và thời gian họ dành được mỗi tuần.
- [ ] Tạo nhánh riêng cho lô đầu.

---

### Task 1 — Nguồn trần và kế hoạch phủ

- [ ] Đối chiếu tài liệu phát triển nhận thức cho trần item §7.1.
- [ ] Ghi vào spec: trích dẫn **hoặc** "phán đoán chuyên môn, hiệu lực tới khi có dữ liệu".
- [ ] Phân bổ **≥20 level mỗi competency** C1–C6.
- [ ] Danh sách skill nền ưu tiên trong mỗi competency.
- [ ] Ước lượng số lô = ⌈120 / cỡ lô⌉ và thời gian từ số đo P1.10.
- [ ] Đối chiếu bao nhiêu level dùng lại được ý tưởng v1.
- [ ] Ghi rõ mục tiêu **% phủ skill** (MVP không phủ hết 230 skill).

### Task 2 — Checklist review người

- [ ] Checklist §7.4 vào PR template, đủ 8 mục.
- [ ] `BR-GLM-07` dòng riêng: khác biệt thật, **mở level trước cùng skill để so**.
- [ ] `BR-GLM-08` dòng riêng: tăng **một chiều** mỗi lần.
- [ ] `BR-GLM-04` ca âm: chỉ dẫn 20 từ → 422.
- [ ] `BR-GLM-05` ca âm: chỉ dẫn chứa "đừng"/"không" → yêu cầu viết lại khẳng định.
- [ ] `BR-GLM-02` ca âm: band 3–4 với 6 item → **422**.
- [ ] `BR-GLM-01` ca âm: hai skill `weight = 1.0` → 422.
- [ ] `BR-GLM-06` quy trình kiểm emoji ở **96px thật**.
- [ ] `BR-GLM-09` không nội dung cần kiến thức ngoài.
- [ ] `BR-GLM-10` theme nhất quán trong một level.

### Task 3 — Sản xuất theo lô (≥4 lô, mỗi lô một PR)

- [ ] Lô ≤ **30 bản**.
- [ ] `pnpm seed:check` xanh **trước khi** mở PR.
- [ ] Người review đọc **từng bản**.
- [ ] Merge → `pnpm seed:content --batch=…`.
- [ ] Mỗi lô có hàng `content_seed_batches` với `pr_url` và `approved_by_manager_id` thật.
- [ ] Ghi lại thời gian review thật sau mỗi lô, cập nhật ước lượng.
- [ ] Sáu template đều có level thật (không chỉ level mẫu P1.2).
- [ ] Mỗi level: ≥1 tag mỗi trục sư phạm + đúng một skill `weight = 1.0`.
- [ ] `access_tier` đặt tường minh cho từng bản.
- [ ] Thiếu số tới hạn → **báo thiếu**, không nhân bản đổi số.

### Task 4 — Đo phủ sau mỗi lô

- [ ] `pnpm seed:report` in level mỗi competency.
- [ ] Báo cáo in skill có ≥1 level và skill **chưa** có level.
- [ ] Báo cáo in level mỗi template.
- [ ] Lô kế tiếp chọn từ khoảng trống báo cáo chỉ ra.
- [ ] Cân bằng band: 3–4 / 4–5 / 5–6 đều có nội dung ở mọi competency.
- [ ] Cân bằng bậc: **đúng 6** level `free`, một mã `published` mỗi competency, difficulty 1–2; có `login`/`standard`/`premium` cho phần còn lại.
- [ ] `seed:report` in tường minh sáu mã guest đã được nhóm Nội dung duyệt.

### Task 5 — Ba cổng quy mô

- [ ] `BR-GTC-10` round-trip trên **100%** level `published`.
- [ ] Nợ `D-FV`: payload config ≤ **200 KB** gz trên **mọi** level.
- [ ] `seed:check --against-db` → **0 drift**.
- [ ] Ba cổng chạy trong cổng tự động, không phải lệnh tay.
- [ ] Đo và ghi thời gian chạy ở quy mô 120 level.

## Cổng dừng

- [ ] ≥120 level `published`; mỗi competency ≥20.
- [ ] 100% round-trip · 100% payload trong ngân sách · 0 drift.
- [ ] Mỗi lô có `content_review_log` và batch row thật.
- [ ] Không level nào là bản sao đổi số của level khác.
- [ ] Trẻ thật chơi được ít nhất một level của **mỗi** template, điểm về server, theo protocol đã duyệt ở [`Task #81`](81-pedagogical-evidence-contract-plan.md).
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 6 — Evidence và promote

- [ ] Mỗi `BR-GLM-*` có test hoặc mục checklist tham chiếu mã rule.
- [ ] [`game-level-model.md`](../specs/05-content/game-level-model.md) → `implemented`.
- [ ] §11 Q1 (nguồn trần item) đóng theo `D-HG`.
- [ ] §11 Q2 (bao nhiêu level mỗi skill) đóng bằng số thật.
- [ ] **Công bố % phủ skill** vào evidence cổng ra P1.
- [ ] Đóng câu hỏi allow-list bằng đúng sáu mã đã seed; không để “đủ level free” ở dạng định tính.
- [ ] Tick **P1.11** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.
