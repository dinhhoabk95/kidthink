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
- [ ] Mỗi LO có `behaviour_vi` và `observable_criteria_vi`.
- [ ] Mỗi LO **quan sát được**: người khác đọc xong biết cách chấm đạt/không đạt.
- [ ] **Đo thật** số LO một người review được trong một ngày.
- [ ] So với baseline 20/ngày; lệch >30% thì sửa lịch P0 **trước** khi chạy lô tiếp.

### H2 — Soạn ≥690 LO

- [ ] Mọi skill `seeded` có ≥3 LO.
- [ ] Tổng ≥690.
- [ ] Mỗi lô qua cổng T3/T4 ngay khi soạn xong, không dồn tới cuối.
- [ ] Người review ký từng lô.

---

## Đường code

### T1 — `packages/taxonomy`

- [ ] Bảy hàm §7.3 có mặt, pure TS.
- [ ] Không ghi DB, không `new Date()` trong package.
- [ ] `assertDag` throw kèm **chu trình tìm được**.
- [ ] Property test `BR-TAX-01` trên đồ thị sinh ngẫu nhiên.
- [ ] `prerequisitesOf(..., { transitive: true })` không lặp vô hạn với dữ liệu bẩn.
- [ ] Cache cây 5 phút, invalidate theo `taxonomy_version`.
- [ ] `pnpm --filter @kidthink/taxonomy test` xanh.

### T2 — Seeder ba tầng đầu

- [ ] `packages/db/src/seed-master/taxonomy/` đọc `docs/taxonomy/c1..c6.md`.
- [ ] Zod từng hàng; `validate()` chạy **trước** INSERT.
- [ ] Idempotent theo `code`; chạy hai lần số hàng không đổi.
- [ ] Skill `planned`/`drafted` không vào DB.
- [ ] Ca âm: A prereq B và B prereq A → fail **trước** khi ghi hàng nào, in ra chu trình.

### T3 — Cổng bất biến

- [ ] `BR-TAX-09`: so **từng competency** (99/44/30/16/21/20), không chỉ tổng 230.
- [ ] `BR-TAX-03`: mỗi LO đúng một skill; mỗi skill đúng một strand.
- [ ] `BR-TAX-04`: `age_min ≤ age_max ∈ [3,6]`, `difficulty ∈ [1,5]`, ≥1 thinking process.
- [ ] `BR-TAX-05`: `prerequisite.difficulty ≤ skill.difficulty`.
- [ ] `BR-TAX-08`: `parent_strand_id` sâu tối đa một tầng.
- [ ] Mỗi bất biến có **ca âm** riêng làm cổng đỏ.

### T4 — Nạp LO theo lô

- [ ] Seeder nạp LO từ `docs/taxonomy/`, idempotent.
- [ ] `BR-TAX-02`: skill có <3 LO làm seed **fail**, nêu tên skill.
- [ ] Nạp được từng lô, không đòi đủ 690 mới chạy được.
- [ ] Cổng đếm ≥690 là điều kiện **cổng ra P0**, không phải của mỗi lần seed.

### T5 — Migration `emoji_registry`

- [ ] Bảng đủ 8 cột §7.1.
- [ ] `code` khớp khuôn `EMJ-<slug>`, ép bằng CHECK.
- [ ] `category` thuộc đúng 32 nhóm §7.2.
- [ ] `pnpm db:migrate` từ database rỗng không lỗi.

### T6 — Seed emoji và `isValidRef`

- [ ] Seed sinh từ 32 file data của `packages/emoji`, không chép tay.
- [ ] Cổng so khớp hai chiều tập `code` DB ↔ package.
- [ ] `BR-EMJ-04`: "táo" và "tao" cùng ra kết quả.
- [ ] Ca âm `BR-EMJ-09`: emoji có skin tone modifier bị từ chối lúc seed.
- [ ] `BR-EMJ-08`: `blocked` không vào kết quả picker nội dung trẻ.
- [ ] `BR-EMJ-10`: `deprecated` vẫn tra được bằng `getByCode`.

### T7 — Cổng emoji không làm affordance

- [ ] Cổng quét `.vue` tìm emoji trong `label` `aria-label` `icon` — có kết quả là **ĐỎ**.
- [ ] Ca âm: component dùng emoji làm nhãn nút làm cổng đỏ.
- [ ] Cổng ghim font stack `BR-EMJ-06` ở mọi nơi render emoji.
- [ ] Cổng gắn vào `pnpm check`.

## Cổng dừng A

- [ ] `packages/taxonomy` không còn stub.
- [ ] Seed ba tầng đầu khớp từng competency với `docs/taxonomy/`.
- [ ] `emoji_registry` khớp `packages/emoji` hai chiều.
- [ ] Lô pilot 30 LO xong, baseline đã đo lại.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

---

## T8 — `GET /api/guest/taxonomy` (cần Nitro của P0.3)

- [ ] `?depth=competency|strand|skill`; chỉ skill `seeded`.
- [ ] `GET /api/guest/taxonomy/skills/{code}` → skill + LO + đếm asset published.
- [ ] 404 cho skill `planned`/`drafted`; 400 `INVALID_CODE_FORMAT`.
- [ ] `Cache-Control: public, max-age=3600`.
- [ ] Ca âm `BR-TAX-06`: POST/PATCH trả 404 hoặc 405.
- [ ] `BR-TAX-10`: P95 < 100 ms trên **dữ liệu đầy đủ** (230 skill + ≥690 LO).

## Cổng dừng B

- [ ] Cây phục vụ đúng độ sâu yêu cầu.
- [ ] P95 đo trên dữ liệu đầy đủ, không dữ liệu mẫu.
- [ ] Human review diff.

---

## T9 — Evidence và promote

- [ ] Mỗi `BR-TAX-*` `BR-EMJ-*` có test tham chiếu mã rule.
- [ ] `BR-EMJ-05` ghi bước sở hữu P2.7, **không** tick ở đây.
- [ ] [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) · [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) sang `implemented` chỉ khi đủ evidence, gồm ≥690 LO đã seed.
- [ ] Tick **P0.9** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) chỉ khi `check:progress` tự xanh.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

## Cổng dừng cuối

- [ ] Không kéo picker (P2.7) hay taxonomy browser (P1.16) lên sớm.
- [ ] Không skill `planned`/`drafted` nào lọt vào DB.
- [ ] Working tree không mất thay đổi ngoài phạm vi.
- [ ] Sẵn sàng lập plan P0.9b.
