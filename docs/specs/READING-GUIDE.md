---
doc: READING-GUIDE
title: Cách đọc corpus spec và tài liệu task
version: 1.0.0
status: active
created: 2026-08-07
---

# Cách đọc corpus spec và tài liệu task

[`CONVENTIONS.md`](CONVENTIONS.md) dạy **viết**. File này dạy **đọc** — giải mã ký hiệu,
chữ viết tắt, và quy ước văn phong đang dùng trong [`SPEC.md`](../SPEC.md), `specs/**`, `tasks/**`.

> Viết vì một lý do cụ thể: nhiều khái niệm trong corpus **chưa từng được định nghĩa ở đâu**.
> Người đọc mới phải suy từ ngữ cảnh — đó là chi phí không cần thiết.

---

## 1. Đọc theo thứ tự nào

Lần đầu vào dự án, đọc đúng 4 file này trước, theo thứ tự:

| # | File | Trả lời câu gì |
|---|---|---|
| 1 | [`../SPEC.md`](../SPEC.md) §0 | 10 quyết định định hình dự án. Đọc **hết** — mọi thứ sau đều dựa vào |
| 2 | [`00-foundation/glossary.md`](00-foundation/glossary.md) §7 | Từ vựng nghiệp vụ: competency, strand, skill, template vs level |
| 3 | [`index.md`](index.md) | Bản đồ 130 spec, tra "muốn biết X thì đọc file nào" |
| 4 | File này | Ký hiệu và cách đọc |

Sau đó mới mở spec cụ thể. Cấm đọc corpus theo thứ tự thư mục — `00-foundation/` là
contract cắt ngang, đọc trần trụi sẽ không hiểu để làm gì.

### Đọc một spec đơn lẻ

Mỗi spec có **11 section cố định, đúng thứ tự**. Không phải section nào cũng cần đọc:

| Cần gì | Đọc section |
|---|---|
| Hiểu nhanh spec này về cái gì | §1 Objective (3–6 câu) |
| Implement | §6 Business rules → §7 Data → §8 API contract |
| Viết test | §9 Acceptance criteria (Gherkin, map 1-1 sang test) |
| Biết cái gì **cấm** | §10 Boundaries — mục `Never` |
| Biết cái gì **chưa chốt** | §11 Open questions |
| Sửa spec | §11 trước — có thể câu hỏi bạn định hỏi đã có người trả lời |

`Không có.` trong một section **không phải** thiếu sót — nó nghĩa là sự vắng mặt có chủ ý
(ví dụ spec schema không có API contract).

---

## 2. Frontmatter — 9 field

```yaml
spec: SCHEMA-PLAY-TELEMETRY      # ID duy nhất toàn corpus, SCREAMING-KEBAB
title: Schema — trẻ, phiên chơi   # tiếng Việt, một dòng
area: platform                    # khớp thư mục chứa nó
status: approved                  # độ chín của SPEC, không phải của CODE
mvp: true                         # true = chặn release MVP
phase: P0                         # phase sớm nhất được IMPLEMENT
reviewed: 2026-08-07              # lần cuối người đọc lại
owns:                             # thứ mà CHỈ file này định nghĩa
  - Định nghĩa cột module child, play, adaptive
depends_on:                       # spec phải approved TRƯỚC file này
  - DATA-MODEL-OVERVIEW
```

### Hai chỗ dễ hiểu nhầm nhất

**`status` nói về spec, không phải code.**

| Giá trị | Nghĩa |
|---|---|
| `draft` | Đang viết hoặc chờ duyệt. Nội dung có thể đổi |
| `approved` | Đã duyệt. Đổi là **breaking** — phải ghi lại vì sao, giữ cả kết luận cũ |
| `implemented` | Acceptance criteria §9 đã **xanh thật**. Không đặt vì "code viết xong rồi" |

Lưu ý: `status: approved` + code chưa tồn tại là trạng thái **bình thường** — cả 26 spec
`approved` hiện tại đều chưa có dòng code nào.

**`phase` là phase *implement*, không phải phase *approve*.**

Một spec `phase: P1` vẫn có thể `approved` ngay ở P0 — xảy ra khi một spec P0 `depends_on`
nó. Đã có 2 trường hợp: [`game-template-contract.md`](01-platform/game-template-contract.md)
và [`job-queue.md`](01-platform/job-queue.md). Cả hai đều ghi rõ lý do trong §11.

---

## 3. Mã định danh — bảng tra nhanh

### 3.1 `BR-XXX-NN` — Business rule

```
BR-SPT-03
│  │   └── số thứ tự 2 chữ số, đặt rồi cấm đổi, cấm tái dùng
│  └────── ID spec rút gọn (SPT = Schema-Play-Telemetry)
└───────── Business Rule
```

Luôn có **3 cột**: `ID | Rule | Vì sao`. Cột "vì sao" là **bắt buộc** —
lý do: *rule không có "vì sao" sẽ bị người sau xoá nhầm*.

Tra một `BR-*` về spec sở hữu: [`00-foundation/business-rules.md`](00-foundation/business-rules.md).
Tên test mang ID rule, nên `grep BR-SPT-03` tìm được cả spec lẫn test.

### 3.2 Mã dữ liệu — [`id-conventions.md`](00-foundation/id-conventions.md) §7

| Loại | Ví dụ | Lớp |
|---|---|:--:|
| Competency | `C1` | 1 |
| Strand | `C1.CNT` | 1 |
| Skill | `C1.CNT.03` | 1 |
| Learning Objective | `LO-C1.CNT.03-01` | 1 |
| Game **Template** | `GT-003` | 1 |
| Game **Level** | `GL-C1-CNT-MATCH-0007` | 2 |
| Lesson | `LES-0042` | 2 |
| Activity | `ACT-0117` | 2 |
| Curriculum | `CUR-001` | 2 |
| Worksheet | `WS-0009` | 2 |
| Package | `PKG-premium` | 1 |
| Emoji | `EMJ-apple-red` | 1 |

Lưu ý: **`GT-` vs `GL-` là cặp dễ lẫn nhất.** Template = *cơ chế chơi* (code, dev viết).
Level = *nội dung* (data, admin tạo). Một `GT-` phục vụ hàng chục `GL-`.

### 3.3 Lớp 1 vs Lớp 2 — phân đôi quan trọng nhất của schema

| | Lớp 1 — *code-owned master* | Lớp 2 — *admin-owned content* |
|---|---|---|
| Nguồn sự thật | Hằng số TS trong repo | DB |
| Admin làm gì | **Chỉ đọc** | CRUD trong studio |
| Đổi bằng cách nào | PR + deploy | UI, có version + duyệt |
| Có `content_version` không | không | có |
| Ví dụ | taxonomy, template, emoji, package | game level, lesson, curriculum |

Đọc thấy "Lớp 1" thì nghĩ ngay *"admin không sửa được, FK trỏ vào đây"*.

---

## 4. Ledger quyết định và quy ước task

`D-*` là mã **ledger quyết định** — mỗi mã là một quyết định đã chốt, kèm ai chốt và vì sao.
Mã này nằm trong `docs/tasks/*plan.md`, dạng bảng `| **D-X** | quyết định | ai chốt | vì sao |`. Spec chỉ trích mã đó. Muốn biết `D-AE` là gì:

```bash
grep -rn '| \*\*D-AE\*\*' docs/tasks/
```

Ledger hiện tới `D-AE` (31 quyết định). Phân bố: `D-A`…`D-R` ở Task #1 (bootstrap),
`D-S`…`D-X` ở Task #2, `D-Y`…`D-AE` ở Task #3.

Lưu ý: **Nợ đã biết:** `D-X` bị dùng lại cho 11 quyết định khác nhau ở Task #2 — nên `grep D-X`
ra 11 kết quả không phân biệt được. Đã ghi trong [`todo.md`](../tasks/todo.md) mục "Ngoài task này".

---

## 5. `C1`–`C13` — 13 cổng máy

`pnpm --filter @mindkid/gates test` chạy 13 check trên 130 spec. Đọc log dạng
`file.md:52  [C6]  <mô tả>`:

| Mã | Kiểm gì | Mức |
|---|---|---|
| `C1` | Frontmatter đủ 9 field | error |
| `C2` | Hai spec cùng `owns` một thứ | error |
| `C3` | 11 section đúng tên, đúng thứ tự | error |
| `C4` | Link nội bộ resolve được | error |
| `C5` | Mã lỗi dùng ở §8 có đăng ký trong [`error-codes.md`](00-foundation/error-codes.md) | error |
| `C6` | `BR-*` có cột "vì sao" · ID không trùng | **warning** / error |
| `C7` | `depends_on` không tạo chu trình | **warning** |
| `C8` | Spec `approved` không `depends_on` spec chưa `approved` | error |
| `C9` | Từ bị cấm: `classification` · `tenant_id` · `persona enum` | error |
| `C10` | Câu chữ bị cấm (ví dụ nhắc CI provider đã bỏ) | error |
| `C11` | Số spec ở [`index.md`](index.md) + [`SPEC.md`](../SPEC.md) §14 khớp filesystem | error |
| `C12` | Tên bảng [`data-model-overview.md`](01-platform/data-model-overview.md) §7 <-> `schema-*` §7.x, **hai chiều** | error |
| `C13` | Mã ID khớp regex của chính prefix nó mang | error |

**warning không làm exit 1.** Hiện có ~213 warning nền, gần hết là C6 "thiếu vì sao" ở
spec chưa approve. Số này chỉ **giảm**: mỗi lần approve một spec là phải điền cho đủ.

`C9` và `C10` có **ngữ cảnh phủ định** — dòng nào *định nghĩa lệnh cấm* thì không bị bắt.
Nên viết `không dùng tenant_id` là hợp lệ, viết `dùng tenant_id` thì đỏ.

---

## 6. Phase `P0`–`P5`

**MVP = P0 → P3.** P4/P5 ngoài MVP.

| Phase | Nội dung | Cắt được không |
|---|---|---|
| **P0** Foundation | Repo, schema, migration, auth, seed Lớp 1, cổng tự động | Cấm — chặn mọi thứ |
| **P1** Play core | Engine 6 template, catalog + gating, play session, ≥120 level, Public Site | Cấm — core business |
| **P2** Commerce + Admin | Package, VietQR, entitlement, Studio, audit log | Studio thu hẹp được |
| **P3** Curriculum | Lesson ≥60, curriculum, mastery + adaptive, báo cáo nâng cao | 1 curriculum thay vì 5 |
| **P4** Add-on | AI, export PDF, Custom Game Builder | ngoài MVP |
| **P5** Web scale | Thanh toán tự động, PWA install, offline curriculum pack | ngoài MVP |

**4 thứ cấm bao giờ cắt:** gating · audit · tuân thủ dữ liệu trẻ · versioning nội dung.
Lý do: rẻ khi làm đúng lúc, rất đắt khi vá sau.

---

## 7. Từ bị cấm — và dùng gì thay

| Cấm | Dùng gì | Vì sao |
|---|---|---|
| `tenant`, `tenant_id` | — | Multi-tenancy ngoài scope hiện hành |
| `school`, `classroom` | — | B2B ngoài scope hiện hành |
| `native mobile`, `licensing`, `marketplace` | — | Không có plan/spec triển khai; mở lại phải đổi canonical scope trước |
| `persona`, `role` (trên `users`) | `entitlement` | Năng lực suy từ quyền, không từ nhãn |
| `tier` (cho **người**) | `package` | `tier` chỉ mô tả **content** |
| `domain` (tầng 2 taxonomy) | `strand` | Trùng nghĩa với domain module |
| `game` (trần trụi) | `game_template` / `game_level` | Mơ hồ giữa hai thứ khác hẳn nhau |
| `student`, `pupil` | `child profile` | Trẻ 3–6 không phải học sinh |
| `score` hiện cho trẻ | `sao`, `hoàn thành` | Không hiện điểm lúc chơi |
| "IQ", "chẩn đoán", "chậm phát triển" | Nhãn ở [`advanced-report.md`](03-account/advanced-report.md) | Vi phạm ranh giới báo cáo |

`C9` bắt 3 từ đầu tự động. Số còn lại là quy ước người giữ.

---

## 8. Giải mã văn phong

Corpus viết theo mấy quy ước cố định. Biết trước thì đọc nhanh hơn nhiều.

**Mọi rule đều kèm "vì sao", và "vì sao" luôn nói hậu quả cụ thể.**
Cấm viết *"để đảm bảo tính toàn vẹn"*. Nên viết *"một chu trình làm ZPD selector lặp vô
hạn, và nó lặp trong lúc một đứa trẻ đang chờ"*. Đọc cột "vì sao" là cách nhanh nhất hiểu
rule đó bảo vệ cái gì.

**Số luôn cụ thể, không có "sau này" / "khi cần".**
Ngưỡng viết bằng số đo được: *"5M hàng / 2GB"*, *"P95 dưới 100 ms"*, *"12 cột. Không hơn."*
Gặp câu định tính không có số thì đó là chỗ chưa chốt, đáng nghi.

**Câu ngắn, khẳng định. Đối lập đặt cạnh nhau.**
*"Nhật ký sửa được không phải nhật ký."* · *"Một backup chưa từng restore không phải backup."*
· *"Ép bằng quy ước là không ép."* Đây là câu chốt, thường đứng cuối đoạn hoặc trong cột
"vì sao" — đọc riêng chúng cũng nắm được ý chính.

**Tiếng Việt cho prose, tiếng Anh cho định danh kỹ thuật.**
Tên bảng, cột, route, enum, mã lỗi giữ nguyên tiếng Anh. Chuỗi hiển thị cho người dùng ghi
nguyên văn tiếng Việt trong ngoặc kép.

**Bảng thay cho danh sách khi có ≥3 thuộc tính.** Nên corpus nhiều bảng — đọc bảng theo cột
tiêu đề, cấm đọc tuần tự từng ô.

**Ngày tháng luôn tuyệt đối.** `2026-08-06`, cấm dùng "hôm qua" / "tuần trước".

---

## 9. Tra cứu nhanh

| Muốn biết | Chạy lệnh / mở file |
|---|---|
| `BR-XXX-NN` là gì | `grep -rn 'BR-XXX-NN' docs/specs/` |
| `D-XX` là quyết định gì | `grep -rn '\| \*\*D-XX\*\*' docs/tasks/` |
| Spec nào `owns` một bảng | `grep -rn '<tên_bảng>' docs/specs/01-platform/data-model-overview.md` |
| Mã lỗi có hợp lệ không | [`00-foundation/error-codes.md`](00-foundation/error-codes.md) |
| Format một loại mã | [`00-foundation/id-conventions.md`](00-foundation/id-conventions.md) §7 |
| Spec nào đã approved | `grep -rl '^status: approved' docs/specs --include='*.md'` |
| Còn câu hỏi nào mở chặn P0 | `grep -rn 'chặn P0' docs/specs/` |
| Corpus có sạch không | `pnpm --filter @mindkid/gates test` |

Lưu ý: Lệnh `grep` phải chạy từ `mindkid/` (nơi có `docs/`). Đo trên `docs/tasks/*.md` sẽ ra
kết quả nhiễu — file task **nói về** ký hiệu nên chính nó chứa chuỗi đang tìm.

---

## 10. Ba lỗi đọc thường gặp

**1. Tưởng `status: approved` nghĩa là đã code.**
Không. Nó nghĩa là *contract đã chốt, được phép code theo*. Trạng thái code là `implemented`.

**2. Tưởng `phase` cho biết khi nào spec được duyệt.**
Không. `phase` là khi **implement**. Duyệt sớm hơn là chuyện thường, khi spec khác phụ thuộc.

**3. Tưởng câu hỏi gạch ngang `~~3~~` là câu hỏi bị bỏ.**
Không. Nó là câu hỏi **đã trả lời** — và phần đằng sau chính là câu trả lời, thường kèm ngày
và lý do. Đây là chỗ chứa nhiều ngữ cảnh nhất trong corpus.
