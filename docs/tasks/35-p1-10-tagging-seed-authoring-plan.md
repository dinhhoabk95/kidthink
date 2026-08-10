# Kế hoạch — Task #35: P1.10 — Gắn tag nội dung & seeder nội dung nền

> Viết 2026-08-09. Bước sở hữu: **P1.10** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`content-tagging.md`](../specs/01-platform/content-tagging.md) ·
> [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Đây là **đường găng dài nhất của MVP**, và nó không rút ngắn được bằng cách thêm dev — nó bị
chặn bởi **năng lực đọc review của người**.

Hai spec:

1. **Gắn tag ba trục** — một asset không gắn vào một kỹ năng duy nhất; nó gắn trên ba trục độc
   lập: học *cái gì* (`what`), rèn *cách nghĩ* nào (`thinking`), chơi *bằng cách nào*
   (`mechanic`). Cộng một trục chủ đề tuỳ chọn.
2. **Seeder nội dung nền** — nội dung viết thành file TS **trong repo**, AI agent IDE làm trợ lý
   soạn thảo, **PR review là cổng người**, merge chính là phát hành.

Ranh giới cứng của spec, không thương lượng: **không có LLM nào chạy trong hệ thống**. AI soạn
file; chỉ người merge.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `GAME-TEMPLATE-CONTRACT` | **P1.2** | kiểu `content_pack` lấy từ `content_contract` |
| `TAXONOMY-SERVICE` | P0.9 | ≥690 LO, 230 skill, competency C1–C6 |
| `EMOJI-REGISTRY` | P0.9 | cổng 3 kiểm ref |
| `CONTENT-LIFECYCLE` · `CONTENT-VERSIONING` | P0.6 | checklist publish, `BR-CLC-01` |
| `AI-CODEGEN-PIPELINE` | P0.0 đã xong | vùng cấm cho AI agent |
| `GLOSSARY` | P0.2 đã xong | từ vựng ba trục |

## 1. Đo được

### 1.1 Bước này bắt đầu **sớm hơn** vị trí của nó trong danh sách

[`roadmap.md`](../specs/roadmap.md) nhóm D ghi rõ: biên soạn seeder chỉ cần **P1.2** xong, và
"bắt đầu sớm nhất có thể". Vị trí số 10 trong bảng là **điểm đóng**, không phải điểm bắt đầu.
Xem `D-GZ`.

### 1.2 Đã có

Sáu template + `content_contract` Zod (P1.2); taxonomy và emoji registry (P0.9); checklist
publish ở tầng service (P0.6); bảng `content_tags`, `content_tag_map`, `content_skill_map` từ
P0.7.

### 1.3 Chưa có

Từ vựng ba trục chưa seed; `content_seed_batches` chưa có; tám cổng chưa tồn tại; ba lệnh CLI
(`seed:check`, `seed:content`, `seed:report`) chưa có; `packages/moderation/src/child-content-blocklist.ts`
chưa có.

### 1.4 Một câu hỏi mở chặn P1

§11 Q1 của [`content-tagging.md`](../specs/01-platform/content-tagging.md): từ vựng `what` và
`thinking` **đã đủ phủ 230 skill chưa?** Chủ ghi "hoãn — đo được khi seed". Xử ở `D-HC`: đo
**trước** khi soạn hàng loạt, không đo bằng cách gặp lỗi ở bản thứ 80.

## 2. Quyết định

**D-GZ — đường ống seeder dựng **ngay sau P1.2**, chạy song song P1.3–P1.9; P1.10 là điểm
đóng.** Đường găng bị chặn bởi tốc độ đọc của người, nên mọi ngày công cụ chưa có là một ngày
người review chưa bắt đầu được. Cụ thể: tám cổng + ba lệnh CLI + từ vựng tag là việc **không**
phụ thuộc gating, phiên chơi, hay hồ sơ trẻ. Chỉ `access_tier` trên mỗi bản cần P0.5 (đã có).
Nếu tổ chức chỉ có một luồng làm việc, giữ thứ tự tuần tự — nhưng khi đó ghi rõ đây là điểm
chậm nhất của kế hoạch.

**D-HA — mỗi cổng trong tám cổng phải có **ca âm riêng**, và cổng heuristic phải ghi rõ nó là
heuristic.** Cổng 0–3, 5 là **xác định**; cổng 4, 6, 7 là **heuristic** — chúng lọc bớt, không
kết luận. Nguy hiểm nằm ở chỗ người review tin cổng 7 (an toàn nội dung) như tin cổng 1
(schema). Xử: báo cáo của `seed:check` in nhãn `xác định` / `heuristic` cạnh mỗi cổng, và tài
liệu PR template nhắc "cổng heuristic không thay mắt người".

**D-HB — trục `mechanic` **suy** từ `game_templates.mechanic`, không nhập tay; trục `theme`
không nằm trong `BR-TAG-02`.** Hai chi tiết dễ sai và cùng nằm trong tagging: nhập tay
`mechanic` tạo cơ hội lệch với template thật; ép `theme` vào ràng buộc "≥1 tag mỗi trục" chặn
publish những level không có chủ đề. Khai `BR-TAG-02` chỉ trên **ba trục sư phạm**.

**D-HC — đối chiếu từ vựng × 230 skill là **Task 1**, trước khi soạn bản nội dung nào.** Nếu
`what`/`thinking` thiếu giá trị, phát hiện ở bản thứ 80 nghĩa là 80 bản phải gắn lại tag — và
tag sai làm nội dung **không tìm thấy hoặc tìm nhầm** (`BR-TAG-06`). Mở rộng từ vựng là PR Lớp 1
bình thường; điều đắt là phát hiện muộn.

**D-HD — `seed:check --against-db` chạy trong **cổng tự động**, không phải lệnh chạy tay.**
`BR-CSA-11`: seeder file là **nguồn sự thật**; sửa DB tay rồi quên seeder thì môi trường tiếp
theo mất bản sửa. Drift chỉ phát hiện được nếu có ai chạy — nên cho chạy tự động và fail cổng
khi `drift.length > 0`.

**D-HE — lô ≤ **30 bản** mỗi PR, và đo **thời gian review thật** từ lô đầu.** Đường găng là năng
lực đọc; kế hoạch chỉ đúng nếu biết một người đọc được bao nhiêu bản mỗi ngày. Lô đầu tiên ghi
lại: số bản, số phút review, số lỗi cổng heuristic bỏ sót mà người bắt được. Ba con số đó là đầu
vào của kế hoạch P1.11 (≥120 level) — không phải ước lượng.

**D-HF — `origin` và `authored_in` là **hai cột**, không gộp.** §7.4 tách bạch: `origin` trả lời
*soạn thảo có AI hỗ trợ không*, `authored_in` trả lời *hàng này vào DB bằng đường nào*. Gộp một
cột là mất khả năng trả lời một trong hai câu, và `origin` **không đổi** sau khi người sửa.

## 3. Đồ thị

```
T1 đối chiếu từ vựng ba trục × 230 skill (D-HC) — trước mọi việc khác
      └──→ T2 seed từ vựng tag + content_skill_map + weight + orphan test
                └──→ T3 hình dạng ContentSeed<T> + bố cục c1..c6 + provenance
                          └──→ T4 tám cổng, mỗi cổng một ca âm
                                    └──→ T5 CLI: seed:check · seed:content · seed:report · --dry-run · --against-db
                                              └──→ T6 lô mẫu ≤30 bản, đo thời gian review (D-HE)
                                                  ── Cổng dừng ──
  T7 evidence, promote, bàn giao số đo cho P1.11
```

## 4. Task

### Task 1 — Đối chiếu từ vựng với 230 skill

**Tiêu chí nghiệm thu**
- [ ] Bảng: mỗi skill trong 230 skill → tag `what` và `thinking` khả dĩ; ô trống là **thiếu từ vựng**.
- [ ] Kết luận rõ: từ vựng hiện tại phủ được bao nhiêu %; danh sách giá trị cần thêm.
- [ ] Giá trị thêm (nếu có) vào seed Lớp 1 qua **PR riêng**, có người duyệt.
- [ ] Ghi kết quả vào todo bước này — đóng §11 Q1 của tagging (`D-HC`).

**Kiểm chứng**
- [ ] Bảng nằm trong repo; `pnpm seed:report` sau này in được cùng con số.

**Phụ thuộc:** P0.9 · **Cỡ:** M

### Task 2 — Từ vựng tag và bản đồ skill

**Tiêu chí nghiệm thu**
- [ ] Seed `content_tags` Lớp 1: 14 giá trị `what`, 12 `thinking`, 6 `mechanic`, 12 `theme`.
- [ ] `BR-TAG-01`: tag ngoài từ vựng → **422**; ca âm gắn `fun_stuff`.
- [ ] `BR-TAG-02`: publish thiếu tag một **trục sư phạm** → chặn; `theme` **không** nằm trong ràng buộc (`D-HB`).
- [ ] `mechanic` **suy** từ `game_templates.mechanic`; ca âm nhập tay lệch template → đỏ.
- [ ] `BR-TAG-03`: `weight ∈ [0,1]`.
- [ ] `BR-TAG-04`: **đúng một** skill `weight = 1.0`; ca âm hai skill cùng 1.0 → 422.
- [ ] `BR-TAG-05`: `user_tags` tách hoàn toàn; ca âm `GET /api/guest/tags` **không** trả tag của User.
- [ ] `BR-TAG-07`: integration test bắt **orphan** trong `content_tag_map` (FK đa hình, 1 trong 9 chỗ bắt buộc theo `BR-DM-04`).
- [ ] `BR-TAG-06`: AI **đề xuất**, người **xác nhận** — không đường nào tự gắn tag.
- [ ] `GET /api/guest/tags` cache `public, max-age=3600`.

**Kiểm chứng**
- [ ] `pnpm test -- content-tagging` xanh, assertion tham chiếu `BR-TAG-01` `BR-TAG-04` `BR-TAG-07`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Hình dạng seeder và provenance

**Tiêu chí nghiệm thu**
- [ ] `ContentSeed<"GT-00x">` lấy kiểu `content_pack` **từ** `content_contract` (`BR-CSA-12`); ca âm thiếu field → lỗi `tsc`, không phải lỗi runtime.
- [ ] Bố cục `packages/db/src/seed-content/c1..c6/gt-00x.ts` theo **competency × template**.
- [ ] Bảng `content_seed_batches` đủ field §7.4: `batch_code`, `kind`, `git_sha`, `pr_url`, `approved_by_manager_id`, `rows_inserted`, `gate_results` (JSONB), `seeded_at`, `seeded_by`.
- [ ] `D-HF`: cột `origin ∈ {human, ai_assisted}` và `authored_in ∈ {repo_seed, studio}` **tách**; `seed_batch_id` nullable.
- [ ] `origin` **không đổi** sau khi người sửa; ca âm.
- [ ] Không cột `ai_generated`, không bảng `content_generation_runs`.
- [ ] `BR-CSA-10`: `code` bất biến sau merge; ca âm đổi `code` đã seed → cổng 0 đỏ.

**Kiểm chứng**
- [ ] `pnpm --filter @kidthink/db test -- seed-shape` xanh; `pnpm typecheck` bắt được seeder sai schema.

**Phụ thuộc:** T2 · P1.2 · **Cỡ:** M

### Task 4 — Tám cổng

**Tiêu chí nghiệm thu**
- [ ] Cổng **0 Định danh**: `code` duy nhất toàn corpus, đúng format, không đụng `code` đã seed với `content_version` khác. Ca âm hai file cùng `code` → fail **trước khi mở kết nối DB**.
- [ ] Cổng **1 Schema**: parse bằng Zod thật (còn đủ `refine`) cho cả `content_pack` và `difficulty_params`.
- [ ] Cổng **2 Cấu trúc**: ≥1 đáp án đúng · prompt không rỗng · số item trong `limits` · distractor hợp lệ · không đáp án trùng.
- [ ] Cổng **3 Asset**: mọi emoji ref có trong `emoji_registry` (`BR-CSA-13`); mọi `image_path` resolve được.
- [ ] Cổng **4 Ngôn ngữ** *(heuristic)*: câu ≤12 từ · từ vựng 3–6 tuổi · không từ cấm §7.5 · không lỗi dấu.
- [ ] Cổng **5 Sư phạm**: `skill_codes`/`learning_objective_codes` là FK có thật · `age_min ≤ age_max ∈ [3,6]` · `difficulty ∈ [1,5]` · khớp band · mechanic hợp band (`BR-GTC-05`). Ca âm `GT-006` với `age_min = 3` → fail.
- [ ] Cổng **6 Trùng lặp** *(heuristic)*: chuẩn hoá `content_pack` rồi so với bản đã `published`.
- [ ] Cổng **7 An toàn** *(heuristic)*: dùng `packages/moderation/src/child-content-blocklist.ts` seed Lớp 1 (bạo lực, sợ hãi, chết chóc, bệnh tật, phân biệt, thương hiệu, bản quyền, tôn giáo, chính trị, so sánh trẻ, từ trừng phạt).
- [ ] **Mỗi cổng có ca âm riêng**; báo cáo in `file:line` và nhãn `xác định`/`heuristic` (`D-HA`).
- [ ] Trượt cổng nào thì **dừng ở đó**; PR không merge được.

**Kiểm chứng**
- [ ] `pnpm seed:check` xanh trên lô sạch, đỏ trên **tám** fixture, mỗi fixture một cổng.

**Phụ thuộc:** T3 · **Cỡ:** L — **tách nhỏ khi thực thi** (cổng 0–3 / 4–5 / 6–7)

### Task 5 — Ba lệnh CLI và đường ghi

**Tiêu chí nghiệm thu**
- [ ] `pnpm seed:check` chạy 8 cổng, **không chạm DB**.
- [ ] `pnpm seed:content --dry-run` dựng DB tạm → seed → checklist publish → rollback.
- [ ] `pnpm seed:content --batch=SEED-*` ghi thật; `BR-CSA-05` một batch = **một transaction**, cấm seed một phần.
- [ ] `BR-CSA-01`: chỉ **INSERT**; sửa `content_pack` mà giữ `content_version` → thoát khác 0, DB không đổi, thông báo yêu cầu khai version mới.
- [ ] Khai `content_version` mới → INSERT bản mới + **archive** bản cũ trong **một** transaction.
- [ ] `BR-CSA-02`: ghi thẳng `published`, không qua `draft`/`in_review`.
- [ ] `BR-CSA-03`: mỗi hàng có `content_review_log` `from_status = null → published`, `actor_manager_id` = người approve PR, `checklist_snapshot` = kết quả 8 cổng.
- [ ] `BR-CSA-04`: trượt checklist publish → **rollback cả batch**, nêu `code` bản lỗi.
- [ ] `BR-CSA-06`: chạy lại → `rows_inserted = 0`, `rows_skipped_idempotent` = số bản, **không** hàng nào bị UPDATE.
- [ ] `BR-CSA-11` + `D-HD`: `seed:check --against-db` chạy trong cổng tự động; `drift.length > 0` → **đỏ**.
- [ ] `pnpm seed:report` in phủ theo competency · skill · template và **chỉ ra khoảng trống**.
- [ ] Môi trường đã có bản studio cùng `code` → seed **từ chối**, studio thắng.
- [ ] `BR-CSA-07` `BR-CSA-08`: ca âm — cấu hình AI agent **không** chạy được `seed:content` ngoài local, **không** merge PR, **không** chạm `skills`/`strands`.
- [ ] Cấm chạy trong đường request; ca âm quét route.

**Kiểm chứng**
- [ ] `pnpm test -- seed-cli` xanh, assertion tham chiếu `BR-CSA-01` `BR-CSA-04` `BR-CSA-06`.

**Phụ thuộc:** T4 · **Cỡ:** L

### Task 6 — Lô mẫu và đo tốc độ review

**Tiêu chí nghiệm thu**
- [ ] Một lô **≤30 bản** đi hết đường: soạn → `seed:check` xanh → PR → review người → merge → `seed:content`.
- [ ] `BR-CSA-09`: nếu lô gồm `learning_objectives`, chúng chịu **đúng** 8 cổng và đúng PR review.
- [ ] Ghi ba số (`D-HE`): số bản, số phút review thật, số lỗi mà **người** bắt được sau khi cổng heuristic đã xanh.
- [ ] PR template có dòng nhắc: cổng 4, 6, 7 là heuristic, **không** thay mắt người.
- [ ] `BR-CSA-02`: người review **mở từng bản**, không approve theo lô mù.
- [ ] Ba số bàn giao cho kế hoạch P1.11.

**Kiểm chứng**
- [ ] Batch có hàng trong `content_seed_batches` với `pr_url` và `approved_by_manager_id` thật.

**Phụ thuộc:** T5 · **Cỡ:** M

### Cổng dừng

- [ ] Tám cổng đều đã **đỏ** được trên fixture riêng.
- [ ] Seed chạy lại là no-op; sửa bản `published` bị từ chối.
- [ ] Trượt checklist → rollback cả batch, không hàng nào lọt.
- [ ] `--against-db` chạy trong cổng tự động và bắt được drift cố ý.
- [ ] Không đường nào cho AI merge hay chạy seed ngoài local.
- [ ] Ba số đo review đã ghi lại.
- [ ] `pnpm check && pnpm test && pnpm lint:specs && pnpm check:progress` xanh.

### Task 7 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-TAG-*` và `BR-CSA-*` có ít nhất một test tham chiếu mã rule.
- [ ] Hai spec sang `implemented`.
- [ ] §11 Q1 của tagging đóng bằng kết quả T1 (`D-HC`).
- [ ] §11 Q2 (weight do người đặt hay suy từ LO) giữ cho **P3**.
- [ ] Ba số của `D-HE` ghi vào đầu vào kế hoạch **P1.11**, cùng kết quả khảo sát port v1 của P1.2 T1.
- [ ] Tick **P1.10** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Đường ống dựng muộn | Đường găng dài nhất bắt đầu muộn — trễ cả MVP | `D-GZ` — dựng ngay sau P1.2, song song |
| Tin cổng heuristic như cổng xác định | Nội dung không hợp tuổi lọt tới trẻ | `D-HA` — nhãn trong báo cáo + PR template |
| Từ vựng thiếu, phát hiện ở bản thứ 80 | 80 bản phải gắn lại tag | `D-HC` — đối chiếu 230 skill ở Task 1 |
| Sửa DB tay rồi quên seeder | Môi trường mới mất bản sửa | `D-HD` — `--against-db` trong cổng tự động |
| Seed đè nội dung người soạn trong studio | Mất công việc của Manager | §5 — studio thắng, seed từ chối |
| Approve theo lô mà không mở nội dung | Cổng người thành hình thức | `BR-CSA-02` — review từng bản, lô ≤30 |
| AI chạy `seed:content` lên môi trường thật | Vượt ranh giới cứng của spec | `BR-CSA-07` — ca âm cấu hình |
| Ước lượng tốc độ review bằng cảm tính | Kế hoạch P1.11 sai từ gốc | `D-HE` — ba số đo thật từ lô đầu |
| Seed một phần khi lỗi giữa chừng | Thư viện nội dung không giải thích được | `BR-CSA-05` — một transaction |

## 6. Giả định

1. **P1.2 đã đóng** — sáu `content_contract` ổn định; đổi contract sau là `BR-GTC-08` breaking change.
2. **P0.9 đã đóng** — ≥690 LO, 230 skill, emoji registry có dữ liệu.
3. **P0.6 đã đóng** — checklist publish tồn tại ở tầng service, không chỉ ở route studio.
4. **Có ít nhất một người review đủ chuyên môn sư phạm** cho lô nội dung.
5. **Studio chưa tồn tại** (P2.6) — "studio thắng" là ràng buộc thiết kế, kiểm bằng test, chưa có UI.
6. **Lesson và curriculum ở P3** — bước này chỉ game level và LO.

## 7. Ngoài phạm vi

- Soạn đủ ≥120 game level — **P1.11** (bước này giao đường ống + lô mẫu).
- Tìm kiếm nội dung — P1.11b.
- Studio soạn nội dung — P2.5, P2.6.
- Hàng đợi duyệt nội dung của admin — P2.8.
- Lesson, curriculum — P3.
- `weight` suy tự động từ LO — P3.
