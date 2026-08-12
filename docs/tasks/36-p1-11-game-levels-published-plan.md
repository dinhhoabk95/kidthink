# Kế hoạch — Task #36: P1.11 — ≥120 game level `published`

> Viết 2026-08-09. Bước sở hữu: **P1.11** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`game-level-model.md`](../specs/05-content/game-level-model.md).
> Đóng nợ `D-FV` (ngân sách payload đo trên toàn bộ level) và chạy `BR-GTC-10` ở quy mô thật.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Bước này **không viết code** — nó sản xuất nội dung, bằng đường ống đã dựng ở P1.10 và ràng buộc
biên tập của [`game-level-model.md`](../specs/05-content/game-level-model.md).

Đó cũng là lý do nó dễ bị lập kế hoạch sai: nó không bị chặn bởi kỹ thuật mà bởi **năng lực đọc
review**. Ba số đo của `D-HE` (số bản, số phút review, số lỗi người bắt được) là đầu vào bắt
buộc — không có chúng thì "≥120 level" là con số, không phải kế hoạch.

Spec sở hữu nói thứ mà template contract và schema không nói: **cái gì làm một màn chơi tốt**,
và cái gì làm nó sai về sư phạm **dù đúng schema**.

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `CONTENT-SEED-AUTHORING` | **P1.10** | 8 cổng, 3 lệnh CLI, lô mẫu đã chạy |
| `CONTENT-TAGGING` | P1.10 | ba trục, `weight`, `content_skill_map` |
| `GAME-TEMPLATE-CONTRACT` | P1.2 | sáu template, `limits` |
| `SCHEMA-CONTENT-TAXONOMY` | P0.7 đã xong | cột `game_levels` |
| `TAXONOMY-SERVICE` | P0.9 | 230 skill, ≥690 LO |
| Ba số đo review | P1.10 T6 | nhịp lô thực tế |
| Khảo sát port v1 | P1.2 T1 | % game type v1 dùng lại được |

## 1. Đo được

### 1.1 Số cần đạt và số đang có

| Chỉ số | Cần | Nguồn |
|---|---|---|
| Game level `published` | **≥120** | [`SPEC.md`](../SPEC.md) §13, cổng ra P1 |
| Level mẫu từ P1.2 | 18 (3 × 6 template) | **không** tính vào 120 |
| Lô mẫu từ P1.10 | ≤30 | tính vào 120 nếu đạt chuẩn biên tập |

### 1.2 Hai câu hỏi mở **chặn P1**, cả hai chưa đóng

| Câu | Ở đâu | Chủ |
|---|---|---|
| Trần số item §7.1 (2–4 / 3–6 / 3–8) dựa trên nguồn nào? | game-level-model §11 Q1 | người quyết |
| Cần bao nhiêu level mỗi skill để đủ đa dạng mà không lặp? | §11 Q2 | hoãn — chốt cùng lúc chốt người biên soạn |

Spec tự cảnh báo về Q1: *"Một con số chặn việc mà không ai truy được nguồn sẽ bị nới trong lần
đầu nó cản một lô nội dung."* Xử ở `D-HG`.

### 1.3 Số học không tránh được

230 skill, ≥120 level. Trung bình **dưới 0,6 level mỗi skill** — nghĩa là MVP **không** phủ hết
230 skill. Đây là sự thật số học, không phải thiếu sót; nó chỉ nguy hiểm khi không ai nói ra.
Xem `D-HH`.

## 2. Quyết định

**D-HG — trần số item **giữ nguyên** cho tới khi có nguồn; nới trần là **PR sửa spec**, không
phải quyết định trong lúc soạn.** Hai đường sai đối xứng: (a) giữ một con số không ai truy được
nguồn rồi từ chối nội dung tốt; (b) nới nó lặng lẽ lần đầu nó cản. Xử: trước lô lớn, dành một
lượt đối chiếu tài liệu phát triển nhận thức; có nguồn thì ghi trích dẫn vào §7.1, không có thì
ghi rõ *"phán đoán chuyên môn, hiệu lực tới khi có dữ liệu kiểm thử"*. Trong cả hai trường hợp,
**`BR-GLM-02` vẫn là lý do từ chối duyệt** — và nới nó về sau phải đi qua PR có người duyệt.

**D-HH — phủ **theo competency**, không theo skill; công bố % phủ skill thay vì im lặng.** Phân
bổ: **≥20 level mỗi competency C1–C6** (120 = 6 × 20), trong mỗi competency ưu tiên skill nền —
skill mà skill khác treo lên. `pnpm seed:report` in ra: level mỗi competency, skill có ≥1 level,
skill **chưa** có level. Con số phủ skill là **đầu ra công bố** của bước này, đi vào cổng ra P1,
không phải thứ phát hiện ở P3 khi curriculum cần skill chưa có nội dung.

**D-HI — sản xuất theo **lô ≤30 bản**, mỗi lô một PR, nhịp lấy từ số đo P1.10.** Ước lượng số lô
= ⌈120 / cỡ lô⌉, và thời gian = số lô × thời gian review đo được. Nếu số đo cho thấy không kịp,
thứ phải đổi là **phạm vi hoặc số người review**, không phải bỏ bước review — bỏ review là bỏ
cổng người duy nhất của đường ống này (`BR-CSA-02`).

**D-HJ — ba cổng quy mô chạy **trên toàn bộ** thư viện, không trên mẫu.** (1) `BR-GTC-10`
round-trip `content_pack` × `content_contract` trên **100%** level; (2) nợ `D-FV` — payload
config ≤200 KB gz đo trên **mọi** level; (3) `seed:check --against-db` không drift. Ba cổng này
chỉ có ý nghĩa ở quy mô thật, và đây là lần đầu có quy mô thật.

**D-HK — `BR-GLM-07` và `BR-GLM-08` là việc của **người review**, cổng 6 chỉ lọc bớt.** "Khác
nhau về nội dung, không chỉ đổi số" và "tăng một chiều mỗi lần" là phán đoán sư phạm — cổng 6
(heuristic) bắt được bản gần trùng về cấu trúc, không bắt được bản khác cấu trúc mà cùng bài
học. Đưa hai mục này thành dòng bắt buộc trong checklist review, kèm yêu cầu người review **mở
level trước cùng skill** để so.

**D-HL — level thiếu đa dạng thì **dừng lô**, không hạ chuẩn để đủ số.** Cám dỗ cuối bước: còn
thiếu 8 level, và cách nhanh nhất là đổi số lượng item của 8 level đã có. `BR-GLM-07` cấm đúng
việc đó. Nếu tới hạn mà chưa đủ 120, báo cáo thiếu — số lượng là mục tiêu, chất lượng là ràng
buộc.

## 3. Đồ thị

```
T1 đối chiếu nguồn trần item + kế hoạch phủ theo competency (D-HG, D-HH)
      └──→ T2 checklist review người: BR-GLM-01..10 + so với level cùng skill
                └──→ T3 sản xuất theo lô ≤30, mỗi lô một PR (D-HI)
                          ├──→ T4 seed:report sau mỗi lô: phủ competency · skill · template
                          └──→ T5 ba cổng quy mô: round-trip · payload ≤200 KB · drift (D-HJ)
                              ── Cổng dừng ──
  T6 evidence, promote, công bố % phủ skill cho cổng ra P1
```

## 4. Task

### Task 1 — Nguồn trần và kế hoạch phủ

**Tiêu chí nghiệm thu**
- [ ] Một lượt đối chiếu tài liệu phát triển nhận thức cho trần §7.1; kết quả ghi vào spec: trích dẫn **hoặc** câu "phán đoán chuyên môn, hiệu lực tới khi có dữ liệu" (`D-HG`).
- [ ] Kế hoạch phân bổ: **≥20 level mỗi competency** C1–C6, danh sách skill nền ưu tiên trong mỗi competency.
- [ ] Ước lượng số lô và thời gian, tính từ ba số đo của P1.10 (`D-HI`).
- [ ] Đối chiếu với khảo sát port v1 (P1.2 T1): bao nhiêu level dùng lại được ý tưởng v1.
- [ ] Ghi rõ: MVP **không** phủ hết 230 skill; mục tiêu phủ skill là con số cụ thể, không phải "càng nhiều càng tốt".

**Kiểm chứng**
- [ ] Kế hoạch nằm trong repo; `pnpm seed:report` in được cùng cấu trúc phủ.

**Phụ thuộc:** P1.10 · **Cỡ:** M

### Task 2 — Checklist review người

**Tiêu chí nghiệm thu**
- [ ] Checklist §7.4 thành mục bắt buộc trong PR template: một skill `weight = 1.0` · chỉ dẫn ≤12 từ không phủ định · item và nhiễu trong trần · emoji rõ ở 96px · nhiễu khác rõ · theme nhất quán · khác biệt thật · không cần kiến thức ngoài.
- [ ] `BR-GLM-07` `BR-GLM-08` có dòng riêng, kèm yêu cầu **mở level trước cùng skill để so** (`D-HK`).
- [ ] `BR-GLM-04` `BR-GLM-05`: cổng 4 bắt câu >12 từ và từ phủ định; ca âm cả hai.
- [ ] `BR-GLM-02`: cổng 2/5 bắt vượt trần item theo band; ca âm band 3–4 với 6 item → **422**.
- [ ] `BR-GLM-01`: hai skill cùng `weight = 1.0` → 422 (dùng lại `BR-TAG-04`).
- [ ] `BR-GLM-06`: quy trình kiểm emoji ở **96px thật**, không kiểm bằng cảm giác ở cỡ nhỏ.
- [ ] `BR-GLM-09` `BR-GLM-10`: không kiến thức ngoài, theme nhất quán — dòng checklist + ví dụ.

**Kiểm chứng**
- [ ] `pnpm test -- game-level-model` xanh, assertion tham chiếu `BR-GLM-02` `BR-GLM-04` `BR-GLM-05`.

**Phụ thuộc:** T1 · **Cỡ:** M

### Task 3 — Sản xuất theo lô

**Tiêu chí nghiệm thu**
- [ ] Mỗi lô ≤ **30 bản**, một PR, chạy `pnpm seed:check` xanh **trước khi** mở PR.
- [ ] Mỗi lô có người review đọc **từng bản** (`BR-CSA-02`).
- [ ] Mỗi lô merge → `pnpm seed:content --batch=…` → hàng `published`, `content_review_log`, hàng `content_seed_batches`.
- [ ] Sau mỗi lô: ghi lại thời gian review thật, cập nhật ước lượng còn lại.
- [ ] Sáu template đều có level thật; không template nào chỉ có level mẫu của P1.2.
- [ ] Mỗi level có ≥1 tag mỗi **trục sư phạm** (`BR-TAG-02`) và đúng một skill chính.
- [ ] `access_tier` đặt tường minh cho từng bản (cột NOT NULL, không default).
- [ ] `D-HL`: nếu tới hạn chưa đủ 120, **báo cáo thiếu** — không hạ chuẩn, không nhân bản level đổi số.

**Kiểm chứng**
- [ ] `pnpm seed:report` in ≥120 level `published`, chia theo competency.

**Phụ thuộc:** T2 · **Cỡ:** ≥4 work package M — mỗi lô ≤30 level, một PR, acceptance và evidence riêng

### Task 4 — Đo phủ sau mỗi lô

**Tiêu chí nghiệm thu**
- [ ] `pnpm seed:report` in: level mỗi competency · skill có ≥1 level · skill chưa có level · level mỗi template.
- [ ] Lô kế tiếp chọn từ **khoảng trống** báo cáo chỉ ra, không chọn theo cảm hứng.
- [ ] Cân bằng band tuổi: mỗi band 3–4 / 4–5 / 5–6 đều có nội dung ở mọi competency.
- [ ] Cân bằng bậc: **đúng 6** level `free`, một mã `published` cho mỗi competency C1–C6, difficulty 1–2; các level còn lại dùng `login`/`standard`/`premium` theo plan nội dung.
- [ ] Sáu mã guest được nhóm Nội dung duyệt và `seed:report` in tường minh; không còn câu hỏi “level nào vào allow-list” ở cổng ra P1.

**Kiểm chứng**
- [ ] Báo cáo cuối bước là **đầu vào** của cổng ra P1.

**Phụ thuộc:** T3 · **Cỡ:** S

### Task 5 — Ba cổng quy mô (`D-HJ`)

**Tiêu chí nghiệm thu**
- [ ] `BR-GTC-10`: round-trip `content_pack` × `content_contract` trên **100%** level `published` — không bản nào fail.
- [ ] Nợ `D-FV`: payload config ≤ **200 KB** gz trên **mọi** level; vượt → chặn merge.
- [ ] `seed:check --against-db`: **0 drift** giữa repo và DB.
- [ ] Ba cổng chạy trong cổng tự động, không phải lệnh chạy tay.
- [ ] Thời gian chạy của ba cổng ở quy mô 120 level không làm cổng tự động quá chậm để dùng — đo và ghi lại.

**Kiểm chứng**
- [ ] `pnpm seed:check --against-db && pnpm test -- content-roundtrip && pnpm perf:budget -- config` xanh.

**Phụ thuộc:** T3 · **Cỡ:** M

### Cổng dừng

- [ ] ≥120 level `published`, mỗi competency ≥20.
- [ ] 100% level round-trip được; 100% payload ≤200 KB gz; 0 drift.
- [ ] Mỗi lô có `content_review_log` và hàng `content_seed_batches` với `pr_url` thật.
- [ ] Không level nào là bản sao của level khác chỉ đổi số lượng.
- [ ] Một trẻ thật chơi được ít nhất một level của **mỗi** template, điểm về server, theo protocol an toàn/evidence đã duyệt ở [`Task #81`](81-pedagogical-evidence-contract-plan.md).
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

### Task 6 — Evidence và promote

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-GLM-*` có ít nhất một test hoặc mục checklist tham chiếu mã rule.
- [ ] [`game-level-model.md`](../specs/05-content/game-level-model.md) sang `implemented`.
- [ ] §11 Q1 đóng theo `D-HG` (có trích dẫn hoặc ghi rõ là phán đoán chuyên môn).
- [ ] §11 Q2 đóng bằng số thật: bao nhiêu level mỗi skill đã đạt được, và mức nào là đủ đa dạng.
- [ ] **Công bố % phủ skill** — đưa vào evidence cổng ra P1 (`D-HH`).
- [ ] Đóng câu hỏi allow-list ở [`access-ladder.md`](../specs/00-foundation/access-ladder.md) §11 bằng đúng sáu mã đã seed; mỗi competency đúng một mã, difficulty 1–2.
- [ ] Tick **P1.11** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Nới trần item lặng lẽ khi nó cản một lô | Ràng buộc sư phạm mất hiệu lực đúng lúc cần nhất | `D-HG` — nới là PR sửa spec |
| Nhân bản level đổi số cho đủ 120 | Thư viện trông đủ nhưng không dạy thêm gì | `BR-GLM-07` + `D-HL` — báo thiếu thay vì hạ chuẩn |
| Phủ skill lệch, phát hiện ở P3 | Curriculum cần skill chưa có nội dung | `D-HH` — công bố % phủ ở cổng ra P1 |
| Review đuối, approve theo lô | Mất cổng người duy nhất | `D-HI` — lô ≤30, đo nhịp thật |
| Cổng quy mô chỉ chạy trên mẫu | Vỡ ở production với level thứ 97 | `D-HJ` — chạy trên 100% |
| Nội dung dồn vào một band tuổi | Trẻ 3–4 hoặc 5–6 không có gì để chơi | T4 — cân bằng band trong báo cáo phủ |
| Không đủ level `free` | Lối vào guest rỗng, mất kênh chuyển đổi | T4 — cân bằng bậc |
| Cổng tự động chậm tới mức bị tắt | Mất cả ba cổng quy mô | T5 — đo thời gian chạy, tối ưu nếu cần |

## 6. Giả định

1. **P1.10 đã đóng** — 8 cổng, CLI, ba số đo review.
2. **P1.2 đã đóng** — sáu template chạy được; level mẫu **không** tính vào 120.
3. **Có người review đủ chuyên môn sư phạm**, và số người đó là hằng số đã biết khi lập lịch.
4. **Ảnh chưa có ở P1** — nội dung dùng emoji từ registry.
5. **Lesson và curriculum ở P3** — bước này chỉ game level.
6. **Studio chưa tồn tại** — mọi bản đi qua seeder.
7. **Ca kiểm với trẻ thật chỉ chạy sau Task #81** — chưa có consent/protocol thì không được dùng kết quả làm evidence sản phẩm.

## 7. Ngoài phạm vi

- Tìm kiếm nội dung — P1.11b.
- Studio soạn và sửa nội dung — P2.6.
- Hàng đợi duyệt nội dung admin — P2.8.
- Lesson, curriculum, worksheet — P3, P4.
- Ảnh và asset ngoài emoji — P2.7.
