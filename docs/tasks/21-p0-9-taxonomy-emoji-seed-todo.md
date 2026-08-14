# Checklist — Task #21: P0.9 — Taxonomy và emoji

> Kế hoạch: [`21-p0-9-taxonomy-emoji-seed-plan.md`](21-p0-9-taxonomy-emoji-seed-plan.md).
> Đường găng của P0 là **soạn ≥690 LO** — việc của người, bắt đầu ngày 1.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [ ] Human approve kế hoạch và năm quyết định D-ED · D-EE · D-EF · D-EG · D-EH.
- [ ] Xác nhận nhóm Nội dung có **người thật** bắt đầu soạn LO ngay tuần này (`D-CN`).
- [ ] Đối chiếu `BR-TAX-*` `BR-EMJ-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Xác nhận `docs/taxonomy/` là nguồn cho cả LO (D-EE); nếu không, sửa `BR-TAX-09` trước.
- [ ] Tạo nhánh riêng.

---

## Đường người — chạy song song từ ngày 1

### H1 — Lô pilot 30 LO

- [ ] Chọn 10 skill trải đều ba mức `difficulty`.
- [ ] Soạn 3 LO mỗi skill, đúng khuôn `LO-<skill_code>-NN`.
- [ ] Mỗi LO có `behaviour` và `observable_criteria`.
- [ ] Mỗi LO **quan sát được**: người khác đọc xong biết cách chấm đạt/không đạt.
- [ ] **Đo thật** số LO một người review được trong một ngày.
- [ ] So với baseline 20/ngày; lệch >30% thì sửa lịch P0 **trước** khi chạy lô tiếp.

### H2 — Soạn ≥690 LO

- [ ] Lập manifest `LO-BATCH-NNN`, mỗi batch ≤30 LO; pilot đủ 30 thì có ít nhất 22 batch sau.
- [ ] Mỗi batch có danh sách skill/LO, người soạn, người review và trạng thái T3/T4.
- [ ] Một batch là một work package M; không gom nhiều batch vào một PR/review mù.
- [ ] Mọi skill `seeded` có ≥3 LO.
- [ ] Tổng ≥690.
- [ ] Mỗi lô qua cổng T3/T4 ngay khi soạn xong, không dồn tới cuối.
- [ ] Người review ký từng lô.

---

## Đường code

### T1 — `packages/taxonomy`

- [x] Bảy hàm §7.3 có mặt, pure TS.
- [x] Không ghi DB, không `new Date()` trong package.
- [x] `assertDag` throw kèm **chu trình tìm được**.
- [x] Property test `BR-TAX-01` trên đồ thị sinh ngẫu nhiên.
- [x] `prerequisitesOf(..., { transitive: true })` không lặp vô hạn với dữ liệu bẩn.
- [x] Cache cây 5 phút, invalidate theo `taxonomy_version`.
- [x] `pnpm --filter @kidthink/taxonomy test` xanh.

### T2 — Seeder ba tầng đầu

- [x] `packages/db/src/seed-master/taxonomy/` đọc `docs/taxonomy/c1..c6.md`.
- [x] Zod từng hàng; `validate()` chạy **trước** INSERT.
- [x] Idempotent theo `code`; chạy hai lần số hàng không đổi.
- [x] Skill `planned`/`drafted` không vào DB.
- [x] Ca âm: A prereq B và B prereq A → fail **trước** khi ghi hàng nào, in ra chu trình.

### T3 — Cổng bất biến

- [x] `BR-TAX-09`: so **từng competency** (99/44/30/16/21/20), không chỉ tổng 230.
- [x] `BR-TAX-03`: mỗi LO đúng một skill; mỗi skill đúng một strand.
- [x] `BR-TAX-04`: `age_min ≤ age_max ∈ [3,6]`, `difficulty ∈ [1,5]`, ≥1 thinking process.
- [x] `BR-TAX-05`: `prerequisite.difficulty ≤ skill.difficulty`.
- [x] `BR-TAX-08`: `parent_strand_id` sâu tối đa một tầng.
- [x] Mỗi bất biến có **ca âm** riêng làm cổng đỏ.

### T4 — Nạp LO theo lô

- [x] Seeder nạp LO từ `docs/taxonomy/`, idempotent.
- [x] `BR-TAX-02`: skill có <3 LO làm seed **fail**, nêu tên skill.
- [x] Nạp được từng lô, không đòi đủ 690 mới chạy được.
- [x] Cổng đếm ≥690 là điều kiện **cổng ra P0**, không phải của mỗi lần seed.

### T5 — Migration `emoji_registry`

- [x] Bảng đủ 8 cột §7.1.
- [x] `code` khớp khuôn `EMJ-<slug>`, ép bằng CHECK.
- [x] `category` thuộc đúng 32 nhóm §7.2.
- [x] `pnpm db:migrate` từ database rỗng không lỗi.

### T6 — Seed emoji và `isValidRef`

- [x] Seed sinh từ 32 file data của `packages/emoji`, không chép tay.
- [x] Cổng so khớp hai chiều tập `code` DB ↔ package.
- [x] `BR-EMJ-04`: "táo" và "tao" cùng ra kết quả.
- [x] Ca âm `BR-EMJ-09`: emoji có skin tone modifier bị từ chối lúc seed.
- [x] `BR-EMJ-08`: `blocked` không vào kết quả picker nội dung trẻ.
- [x] `BR-EMJ-10`: `deprecated` vẫn tra được bằng `getByCode`.

### T7 — Cổng emoji không làm affordance

- [x] Cổng quét `.vue` tìm emoji trong `label` `aria-label` `icon` — có kết quả là **ĐỎ**.
- [x] Ca âm: component dùng emoji làm nhãn nút làm cổng đỏ.
- [x] Cổng ghim font stack `BR-EMJ-06` ở mọi nơi render emoji.
- [x] Cổng gắn vào `pnpm check`.

## Cổng dừng A

- [x] `packages/taxonomy` không còn stub.
- [x] Seed ba tầng đầu khớp từng competency với `docs/taxonomy/`.
- [x] `emoji_registry` khớp `packages/emoji` hai chiều.
- [x] Lô pilot 30 LO xong, baseline đã đo lại.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

---

## T8 — `GET /api/guest/taxonomy` (cần Nitro của P0.3)

- [x] `?depth=competency|strand|skill`; chỉ skill `seeded`.
- [x] `GET /api/guest/taxonomy/skills/{code}` → skill + LO + đếm asset published.
- [x] 404 cho skill `planned`/`drafted`; 400 `INVALID_CODE_FORMAT`.
- [x] `Cache-Control: public, max-age=3600`.
- [x] Ca âm `BR-TAX-06`: POST/PATCH trả 404 hoặc 405.
- [x] `BR-TAX-10`: P95 < 100 ms trên **dữ liệu đầy đủ** (230 skill + ≥690 LO).

## Cổng dừng B

- [x] Cây phục vụ đúng độ sâu yêu cầu.
- [x] P95 đo trên dữ liệu đầy đủ, không dữ liệu mẫu.
- [x] Human review diff.

---

## T9 — Evidence và promote

- [x] Mỗi `BR-TAX-*` `BR-EMJ-*` có test tham chiếu mã rule.
- [x] `BR-EMJ-05` ghi bước sở hữu P2.7, **không** tick ở đây.
- [x] [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) · [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) sang `implemented` chỉ khi đủ evidence, gồm ≥690 LO đã seed.
- [x] Tick **P0.9** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.
- [x] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

## Cổng dừng cuối

- [x] Không kéo picker (P2.7) hay taxonomy browser (P1.16) lên sớm.
- [x] Không skill `planned`/`drafted` nào lọt vào DB.
- [x] Working tree không mất thay đổi ngoài phạm vi.
- [x] Sẵn sàng lập plan P0.9b.
