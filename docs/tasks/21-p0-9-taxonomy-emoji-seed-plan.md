# Kế hoạch — Task #21: P0.9 — Taxonomy service và kho emoji

> Viết 2026-08-09, đo tại commit `5a1bb2b`. Bước sở hữu: **P0.9** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) ·
> [`emoji-registry.md`](../specs/01-platform/emoji-registry.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Đây là bước **dài nhất của P0**, và phần dài nhất không phải code.

`docs/taxonomy/c1..c6.md` đã có đủ **6 competency / 41 strand / 230 skill** — đo được, khớp
chính xác §7.2 của [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md). Nhưng
**không có learning objective nào**: đếm mã LO trong toàn bộ `docs/taxonomy/` ra **0**, trong
khi `BR-TAX-02` đòi mỗi skill ≥3 LO và `BR-TAX-09` đòi ≥690 hàng.

690 LO là công việc của người. `D-CN` (đóng 2026-08-09) đã chốt chủ sở hữu — nhóm Nội dung —
và baseline **20 LO/người review/ngày**. Ở baseline đó, 690 LO là khoảng **35 ngày-người
review**, và nó không rút ngắn được bằng cách thêm dev.

Vậy P0.9 có hai đường chạy song song:

- **Đường người** — soạn và review ≥690 LO. Bắt đầu **ngay ngày đầu**, không chờ code.
- **Đường code** — `packages/taxonomy` (hiện là stub 1 dòng), seeder, `emoji_registry`
  (bảng chưa tồn tại), và cổng kiểm bất biến.

Đường code chạy xong trước là bình thường và đúng. Nó tồn tại để đường người có chỗ đổ vào,
và để mỗi lô LO được kiểm bằng máy ngay khi soạn xong.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái |
|---|---|
| `GLOSSARY` · `ID-CONVENTIONS` | `implemented` |
| [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) | `implemented` — bảng taxonomy đã có |
| `ACTORS` | chưa (P0.3) — chỉ chặn route `GET /api/guest/taxonomy` |

## 1. Đo được

### 1.1 Cây có đủ, LO chưa có gì

| Tầng | Hợp đồng §7.2 | Đếm trong `docs/taxonomy/` |
|---|---:|---:|
| Competency | 6 | 6 |
| Strand | 41 | 41 (10 · 8 · 8 · 4 · 5 · 6) |
| Skill | 230 | 230 (99 · 44 · 30 · 16 · 21 · 20) |
| Learning objective | ≥690 | **0** |

Ba tầng đầu khớp **từng competency một**, không chỉ khớp tổng. Đây là nền tốt: `BR-TAX-09`
("seed khớp chính xác `docs/taxonomy/c1..c6.md`") có nguồn để đối chiếu ngay.

Tầng LO trống hoàn toàn. Định dạng mã đã được ép ở DB — `learning_objectives.code` có CHECK
`^LO-C[1-6]\.[A-Z]{2,5}\.\d{2}-\d{2}$` — nên khuôn đã sẵn, chỉ thiếu nội dung.

### 1.2 `packages/taxonomy` là stub

[`packages/taxonomy/src/index.ts`](../../packages/taxonomy/src/index.ts) đúng **1 dòng**.
`types.ts` có 329 dòng kiểu. Toàn bộ bảy hàm ở §7.3 chưa tồn tại:
`buildSkillTree` · `resolveSkillsForCompetency` · `resolvePath` · `prerequisitesOf` ·
`unlockedBy` · `assertDag` · `nextCandidates`.

`assertDag` là hàm quan trọng nhất của bước: `BR-TAX-01` nói một chu trình làm ZPD selector
lặp vô hạn **trong lúc một đứa trẻ đang chờ**.

### 1.3 `packages/emoji` gần xong, bảng thì chưa có

[`packages/emoji/src`](../../packages/emoji/src) đã có 32 file data theo đúng 32 nhóm chủ đề
§7.2, cùng `registry.ts` `search.ts` `query.ts` `constants.ts` `types.ts`.

Nhưng **`emoji_registry` không phải là bảng nào trong schema** — grep toàn bộ
`packages/db/src/schema/` chỉ ra hai cột dùng emoji (`child_profiles.avatar_emoji`,
`game_levels.thumbnail_emoji`), không có bảng registry. §7.1 của
[`emoji-registry.md`](../specs/01-platform/emoji-registry.md) khai đủ 8 cột cho bảng này.

Thiếu bảng thì `isValidRef()` không có nguồn DB, và cổng 3 của pipeline seeder (P1.10) không
có chỗ tra.

### 1.4 Thư mục seed chưa tồn tại

§3 của cả hai spec trỏ `packages/db/src/seed-master/taxonomy/` và
`packages/db/src/seed-master/emoji.ts`. Cả hai chưa có. [`seed.ts`](../../packages/db/src/seed.ts)
hiện chỉ chạm `entitlement_keys` `packages` `package_entitlements`.

## 2. Quyết định

**D-ED — Bắt đầu soạn LO ngày đầu, không chờ code.** Đây là đường găng đo được: ~35
ngày-người review ở baseline `D-CN`. Mọi ngày chờ code là một ngày cộng thẳng vào lịch P0.

**D-EE — LO sống trong `docs/taxonomy/`, seed đọc từ đó.** `BR-TAX-09` đã đặt tài liệu làm
nguồn cho ba tầng đầu. Tách LO sang nguồn khác tạo ra hai nguồn sự thật — đúng thứ `BR-TAX-09`
tồn tại để chặn.

**D-EF — Lô 30 LO trước, đo lại rồi mới chạy tiếp.** `D-CN` ghi rõ baseline 20 LO/ngày là
**giả định chờ đo**. Soạn hết 690 rồi mới phát hiện baseline sai gấp đôi là phát hiện muộn
35 ngày.

**D-EG — `validate()` chạy trước INSERT, không sau.** §4 bước 2–3 và `BR-TAX-01` đều nói
"fail trước khi ghi hàng nào". Seed ghi rồi mới kiểm là seed đã làm bẩn DB.

**D-EH — `emoji_registry` seed từ `packages/emoji`, không chép tay.** 32 file data đã là nguồn.
Bảng là bản chiếu, cùng quan hệ với `packages`/`PACKAGE_CATALOG` ở P0.5.

## 3. Đồ thị

```
Đường người (bắt đầu ngày 1, song song mọi thứ)
  H1 lô pilot 30 LO ──→ đo lại baseline ──→ H2 soạn ≥690 LO theo lô

Đường code
  T1 packages/taxonomy — 7 hàm §7.3 + assertDag
        └──→ T2 seed-master/taxonomy — 6/41/230, validate trước insert
                  └──→ T3 cổng bất biến BR-TAX-01..05, 08, 09
                            └──→ T4 nạp LO theo lô + BR-TAX-02
  T5 migration emoji_registry
        └──→ T6 seed-master/emoji từ packages/emoji + isValidRef
                  └──→ T7 cổng BR-EMJ-03 (emoji không làm affordance)
                              ── Cổng dừng A ──
  T8 GET /api/guest/taxonomy (cần Nitro của P0.3) + BR-TAX-10 P95 < 100ms
                              ── Cổng dừng B ──
  T9 evidence và promote
```

## 4. Task

### H1 — Lô pilot 30 LO

**Mô tả.** Chủ: nhóm Nội dung (`D-CN`). Chọn 10 skill trải đều ba mức `difficulty`, soạn 3 LO
mỗi skill.

**Tiêu chí nghiệm thu**
- [ ] 30 LO viết đúng khuôn `LO-<skill_code>-NN`, có `behaviour` và `observable_criteria`.
- [ ] Mỗi LO **quan sát được** — người khác đọc xong biết cách chấm đạt/không đạt.
- [ ] Đo thật: số LO một người review được trong một ngày. So với baseline 20 (`D-CN`).
- [ ] Nếu lệch >30%, sửa lịch P0 **trước** khi chạy lô tiếp (D-EF).

**Kiểm chứng**
- [ ] Ghi con số đo được vào checklist; không suy đoán.

**Phụ thuộc:** không · **Cỡ:** M (người)

### T1 — `packages/taxonomy`

**Tiêu chí nghiệm thu**
- [ ] Bảy hàm §7.3 có mặt, pure TS — **không** ghi DB, **không** `new Date()`.
- [ ] `assertDag` throw kèm **chu trình tìm được**, không chỉ báo "có chu trình".
- [ ] Property test `BR-TAX-01`: sinh đồ thị ngẫu nhiên, mọi đồ thị có chu trình đều bị bắt.
- [ ] `prerequisitesOf(..., { transitive: true })` không lặp vô hạn kể cả khi dữ liệu bẩn.
- [ ] Cache cây 5 phút, invalidate theo `taxonomy_version`.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/taxonomy test` xanh, assertion tham chiếu `BR-TAX-01`.

**Phụ thuộc:** không · **Cỡ:** M

### T2 — Seeder taxonomy ba tầng đầu

**Tiêu chí nghiệm thu**
- [ ] `packages/db/src/seed-master/taxonomy/` đọc `docs/taxonomy/c1..c6.md` (D-EE).
- [ ] Zod từng hàng, `validate()` chạy **trước** INSERT; fail fast (D-EG).
- [ ] Idempotent theo `code`; chạy hai lần số hàng không đổi.
- [ ] Skill `planned`/`drafted` **không** vào DB.
- [ ] Ca âm: một file seed khai A prereq B và B prereq A → fail **trước** khi ghi hàng nào.

**Kiểm chứng**
- [ ] `pnpm db:seed` rồi `pnpm --filter @kidthink/db test -- taxonomy` xanh.

**Phụ thuộc:** T1 · **Cỡ:** M

### T3 — Cổng bất biến taxonomy

**Tiêu chí nghiệm thu**
- [ ] `BR-TAX-09`: đếm ra đúng 6 / 41 / 230, và so **từng competency** (99/44/30/16/21/20), không chỉ so tổng.
- [ ] `BR-TAX-03`: mỗi LO đúng một skill; mỗi skill đúng một strand.
- [ ] `BR-TAX-04`: mọi skill có `age_min ≤ age_max ∈ [3,6]`, `difficulty ∈ [1,5]`, ≥1 thinking process.
- [ ] `BR-TAX-05`: `prerequisite.difficulty ≤ skill.difficulty`.
- [ ] `BR-TAX-08`: `parent_strand_id` sâu tối đa một tầng.
- [ ] Mỗi bất biến có **ca âm** riêng: một fixture vi phạm làm cổng đỏ.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/db test -- taxonomy` xanh, assertion tham chiếu `BR-TAX-03` `BR-TAX-04` `BR-TAX-05` `BR-TAX-08` `BR-TAX-09`.

**Phụ thuộc:** T2 · **Cỡ:** M

### T4 — Nạp LO theo lô

**Tiêu chí nghiệm thu**
- [ ] Seeder nạp LO từ `docs/taxonomy/`, cùng cơ chế idempotent.
- [ ] `BR-TAX-02`: skill nào có <3 LO làm seed **fail**, nêu tên skill.
- [ ] Nạp được **từng lô** — không đòi đủ 690 mới chạy được lần đầu.
- [ ] Cổng đếm: tổng LO ≥ 690 là điều kiện của **cổng ra P0**, không phải của mỗi lần seed.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/db test -- taxonomy` xanh, assertion tham chiếu `BR-TAX-02`.

**Phụ thuộc:** T3 · H1 · **Cỡ:** M

### H2 — Soạn ≥690 LO

**Tiêu chí nghiệm thu**
- [ ] Mọi skill `seeded` có ≥3 LO.
- [ ] Tổng ≥690.
- [ ] Mỗi lô qua cổng T3/T4 **ngay khi soạn xong**, không dồn tới cuối.
- [ ] Người review ký từng lô.

**Ranh giới work package:** sau pilot, chia phần còn lại thành các batch `LO-BATCH-NNN` tối đa
30 LO. Với pilot đủ 30, cần ít nhất 22 batch tiếp theo để đạt 690. Mỗi batch là một work
package M của Nhóm Nội dung: chọn skill → soạn → chạy T3/T4 → sửa → một người ký review; không
được mở batch kế tiếp khi batch trước chưa qua gate. Nếu đo H1 làm lịch lệch >30%, tính lại số
batch trước khi tiếp tục, không tăng kích thước batch.

**Phụ thuộc:** H1 · T4 · **Cỡ:** ≥22 work package M (người), mỗi package ≤30 LO

### T5 — Migration `emoji_registry`

**Tiêu chí nghiệm thu**
- [ ] Bảng theo §7.1: `code` `unicode` `name` `category` `search_keywords` `age_suitability` `what_axis` `status`.
- [ ] `code` khớp khuôn `EMJ-<slug>`, ép bằng CHECK.
- [ ] `category` thuộc đúng 32 nhóm §7.2.
- [ ] Không route tạo/sửa/xoá (`BR-EMJ-07`).

**Kiểm chứng**
- [ ] `pnpm db:migrate` từ database rỗng · test schema xanh.

**Phụ thuộc:** không · **Cỡ:** S

### T6 — Seed emoji và `isValidRef`

**Tiêu chí nghiệm thu**
- [ ] Seed sinh từ 32 file data của [`packages/emoji`](../../packages/emoji/src), không chép tay (D-EH).
- [ ] Cổng so khớp hai chiều: tập `code` trong DB **bằng** tập trong package.
- [ ] `BR-EMJ-04`: `searchEmoji("táo")` và `searchEmoji("tao")` cùng ra kết quả.
- [ ] `BR-EMJ-09`: ca âm — emoji có skin tone modifier bị từ chối lúc seed.
- [ ] `BR-EMJ-08`: `age_suitability = blocked` không vào kết quả picker nội dung trẻ.
- [ ] `BR-EMJ-10`: `deprecated` vẫn tra được bằng `getByCode`, không xoá cứng.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/emoji test` và `pnpm --filter @kidthink/db test -- emoji` xanh, assertion tham chiếu `BR-EMJ-04` `BR-EMJ-08` `BR-EMJ-09`.

**Phụ thuộc:** T5 · **Cỡ:** M

### T7 — Cổng "emoji không làm affordance"

**Tiêu chí nghiệm thu**
- [ ] Cổng quét mọi `.vue` tìm emoji trong `label` `aria-label` `icon` — có kết quả là **đỏ** (`BR-EMJ-03`).
- [ ] Ca âm: fixture một component dùng emoji làm nhãn nút làm cổng đỏ.
- [ ] Cổng ghim font stack: mọi nơi render emoji khai đúng ba font §`BR-EMJ-06`.
- [ ] Cổng gắn vào `pnpm check`.

**Kiểm chứng**
- [ ] `pnpm check` gọi cổng mới; ca âm chạy trong `pnpm test`.

**Phụ thuộc:** T6 · **Cỡ:** S

### Cổng dừng A

- [ ] `packages/taxonomy` không còn stub; `assertDag` có property test.
- [ ] Seed ba tầng đầu khớp **từng competency** với `docs/taxonomy/`.
- [ ] `emoji_registry` tồn tại và khớp `packages/emoji` hai chiều.
- [ ] Lô pilot 30 LO xong, baseline đã đo lại (D-EF).
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

### T8 — `GET /api/guest/taxonomy`

**Tiêu chí nghiệm thu**
- [ ] `?depth=competency|strand|skill`; chỉ trả skill `status = 'seeded'`.
- [ ] `GET /api/guest/taxonomy/skills/{code}` → skill + LO + đếm asset published; 404 cho `planned`/`drafted`.
- [ ] `Cache-Control: public, max-age=3600`.
- [ ] `BR-TAX-06`: không route POST/PATCH nào; ca âm — gọi POST trả 404 hoặc 405.
- [ ] `BR-TAX-10`: 100 truy vấn `skill → LO → asset` với dữ liệu đầy đủ, **P95 < 100 ms**.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/web test -- taxonomy` xanh, assertion tham chiếu `BR-TAX-06` `BR-TAX-10`.

**Phụ thuộc:** P0.3 dựng xong Nitro runtime · T4 · **Cỡ:** M

### Cổng dừng B

- [ ] Cây phục vụ được qua route công khai, đúng độ sâu yêu cầu.
- [ ] Đo P95 trên dữ liệu **đầy đủ** (230 skill + ≥690 LO), không trên dữ liệu mẫu.
- [ ] Human review diff.

### T9 — Evidence và promote

- [ ] Mỗi `BR-TAX-*` `BR-EMJ-*` có ít nhất một test tham chiếu mã rule.
- [ ] `BR-EMJ-05` (ô picker ≥40×40px) thuộc UI picker ở P2.7 — ghi bước sở hữu, **không** tick ở đây.
- [ ] Hai spec sang `implemented` chỉ khi đủ evidence, gồm ≥690 LO đã seed.
- [ ] Tick P0.9 chỉ khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Chờ code xong mới bắt đầu soạn LO | Cộng thẳng ~35 ngày-người vào lịch P0 | D-ED — đường người bắt đầu ngày 1 |
| Baseline 20 LO/ngày sai | Phát hiện muộn 35 ngày | D-EF — pilot 30 LO, đo lại, rồi mới chạy tiếp |
| Soạn đủ 690 rồi mới chạy cổng | Lỗi hệ thống trong cách viết LO lộ ra lúc muộn nhất | T4 nạp theo lô; H2 bắt mỗi lô qua cổng ngay |
| Chu trình prerequisite lọt vào seed | ZPD selector lặp vô hạn khi trẻ đang chờ | `assertDag` chạy **trước** INSERT (D-EG), có property test |
| LO soạn không quan sát được | Không chấm được, kéo theo mastery không đo được | H1 — tiêu chí "người khác đọc xong biết cách chấm" |
| `emoji_registry` chép tay từ package | Hai nguồn lệch nhau, cổng 3 của seeder tra sai | D-EH — sinh từ package, cổng so hai chiều |

## 6. Giả định

1. **`docs/taxonomy/c1..c6.md` là nguồn đúng cho ba tầng đầu.** Đo: khớp §7.2 từng competency.
2. **LO viết vào cùng `docs/taxonomy/`.** Nếu nhóm Nội dung muốn nguồn khác, `BR-TAX-09` phải sửa **trước**.
3. **Nhóm Nội dung có người thật để bắt đầu.** `D-CN` chốt chủ sở hữu; nếu chưa có người, đây là blocker phải nêu ngay ngày đầu, không phát hiện ở tuần thứ tư.
4. **`packages/emoji` đã đủ dùng cho P0.** §11 Q1 của [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) hỏi "đủ phủ 120 game level chưa" — chặn P1, không chặn P0.
5. **Không tạo package mới.** Seeder vào `packages/db/src/seed-master/`.

## 7. Ngoài phạm vi

- 120 skill còn thiếu (230 → 350) — §11 Q2, sau MVP.
- Audio tiếng Việt cho ~21 skill C5 — §11 Q4, chặn P1.
- UI picker emoji và ràng buộc kích thước `BR-EMJ-05` — [`emoji-picker.md`](../specs/06-admin/emoji-picker.md), P2.7.
- Trình duyệt taxonomy cho Manager — [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md), P1.16.
- Cổng 3 của pipeline seeder dùng `isValidRef` — [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md), P1.10. P0.9 chỉ giao hàm.
