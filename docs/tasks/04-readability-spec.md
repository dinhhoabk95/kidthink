# Spec — Task #4: Viết lại corpus theo ngôn ngữ tự nhiên

> Viết 2026-08-07. Kế hoạch thực thi: [`plan.md`](plan.md) · Checklist: [`todo.md`](todo.md).
> Task #3 lưu trữ: [`03-schema-contract-plan.md`](03-schema-contract-plan.md) ·
> [`03-schema-contract-todo.md`](03-schema-contract-todo.md).

## Chỗ để file này, và vì sao không phải [`SPEC.md`](../SPEC.md) ở gốc repo

Lệnh `/spec` mặc định ghi ra [`SPEC.md`](../SPEC.md) ở gốc dự án. Ở repo này **không làm vậy được**:
`kidthink/SPEC.md` là symlink trỏ tới [`../SPEC.md`](../SPEC.md) — bản đặc tả sản phẩm dài
1.286 dòng, được kiểm tra C11 đối chiếu số lượng spec, và là thứ 130 file trong `docs/specs/`
tham chiếu tới. Ghi đè nó bằng spec của một task biên tập là phá hợp đồng sản phẩm.

Spec của task nằm cùng chỗ với hồ sơ task, tức `docs/tasks/`. Đây là lần đầu repo có file dạng
này; hai task trước chỉ có `plan` và [`todo.md`](../tasks/todo.md).

---

## Những điều tôi đang giả định

Bạn chưa chốt bốn điểm dưới đây. Tôi chọn sẵn phương án, ghi rõ hệ quả, và **làm theo phương án
đã chọn nếu bạn không bác**. Bác điểm nào thì nói số thứ tự của nó.

**Giả định 1 — Phạm vi là toàn bộ corpus, gồm cả hồ sơ task cũ và thư mục taxonomy.**
Gồm 130 file spec, 6 file quy ước trong `docs/specs/`, [`../SPEC.md`](../SPEC.md), 8 file trong
`docs/taxonomy/`, và 6 hồ sơ task cũ trong `docs/tasks/`. Tổng 151 file, khoảng 31.700 dòng.
Làm theo từng đợt, mỗi đợt một commit riêng, cổng tự động phải xanh sau mỗi đợt.

Hai phần vừa được thêm vào phạm vi sau khi đo lại ngày 2026-08-07:

- `docs/taxonomy/` — 8 file, 1.008 dòng, **221 ký hiệu**. Bản nháp đầu của kế hoạch bỏ sót thư
  mục này. Nó không phải tài liệu phụ: quy tắc `BR-TAX-09` của
  [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) mục 6 buộc dữ liệu seed
  **khớp chính xác** `docs/taxonomy/c1..c6.md`, tức 6 năng lực, 41 nhánh, 230 kỹ năng.
- 6 hồ sơ task cũ — 2.360 dòng, **592 ký hiệu**, **107 chữ viết tắt**, **501 tham chiếu trần**.
  Đây là cụm dày đặc nhất corpus. Riêng
  [`03-schema-contract-plan.md`](03-schema-contract-plan.md) và
  [`03-schema-contract-todo.md`](03-schema-contract-todo.md) đã chiếm 644 vấn đề, nhiều hơn cả
  khu vực `01-platform` gồm 27 file.

*Nếu bác:* thu hẹp còn `docs/tasks/` cộng ba file quy ước, khoảng 2.900 dòng.

**Giả định 2 — Tên mười một mục giữ nguyên tiếng Anh.** Đã đảo so với bản nháp đầu, sau khi
người dùng chốt ngày 2026-08-07: *"Những thuật ngữ chuyên môn vẫn phải giữ nguyên gốc tiếng Anh
thay vì dịch ra."* Tên mục là từ vựng của định dạng spec, nên áp quy tắc đó. Chi tiết và hệ quả:
mục 4.4.

Bản nháp đầu đề xuất dịch cả 1.420 tên mục sang tiếng Việt, kéo theo sửa
[`scripts/lint-specs-lib.ts:297-319`](../../scripts/lint-specs-lib.ts) và một commit chạm 134
file. Quyết định mới **bỏ hẳn** bước đó khỏi kế hoạch.
*Nếu bác:* dịch tên mục sang tiếng Việt, bước 4 quay lại kế hoạch.

**Giả định 3 — Bỏ hết ký hiệu emoji, viết thành chữ.** Khoảng 2.762 lượt xuất hiện. Thêm một
kiểm tra tự động mới cấm chúng quay lại, kèm ca âm chứng minh kiểm tra đó thật sự bắt được.
*Nếu bác:* giữ lại dấu cảnh báo ở đầu đoạn, bỏ mọi ký hiệu khác.

**Giả định 4 — Mã định danh hợp đồng được giữ nguyên, nhưng luôn kèm tên đọc được.** Mã quy tắc
nghiệp vụ (`BR-GAT-01`), mã lỗi (`TIER_LOCKED`), mã định danh spec (`ACCESS-GATING`), và mã kiểm
tra tự động (`C6`) là hợp đồng thật: tên test mang mã, sổ đăng ký
[`../specs/00-foundation/business-rules.md`](../specs/00-foundation/business-rules.md) tra theo
mã, kiểm tra C5, C6, C13 đọc mã, và log của `pnpm lint:specs` in ra `[C6]`. Xoá mã là phá cổng.
Cách xử lý: giữ mã, nhưng mỗi lần nhắc phải kèm tên đọc được — viết *"quy tắc `BR-GAT-01` (kiểm
quyền ở tầng server, không kiểm ở trình duyệt)"* thay vì `BR-GAT-01` trần.
Riêng nhóm viết tắt tự phát — `OQ`, `DMO`, `SIB`, `SCT`, `SPT`, `TAX`, `GTC`, `CLC` — bị bỏ hẳn,
thay bằng tên file thật.
*Nếu bác:* hoặc giữ mã trần như hiện tại (diff nhỏ nhất), hoặc đổi cả mã sang tiếng Việt (đọc dễ
nhất nhưng phá sổ đăng ký và ba kiểm tra tự động).

---

## 1. Mục tiêu

Corpus hiện tại đúng về nội dung nhưng đắt để đọc. Người đọc mới phải học một bảng ký hiệu riêng
trước khi hiểu được câu đầu tiên. Bằng chứng cụ thể:

- [`plan.md:8-9`](plan.md) nhồi sáu ký hiệu vào một dòng chú giải:
  *"`Tn` = bước · cổng dừng · song song được · `Mn` = chỗ contract tự mâu thuẫn ·
  `D-*` = ledger quyết định · cần người."*
- [`plan.md:58`](plan.md) dùng sáu chữ viết tắt chưa từng định nghĩa ở đâu:
  *"OQ trong 6 spec đích | 17 (DMO 3 · SIB 2 · SCT 2 · SPT 2 · TAX 4 · GTC 4)"*.
- [`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) được viết ngày 2026-08-07 để **giải
  mã** ký hiệu. Nó xử lý triệu chứng, không xử lý nguyên nhân: một corpus cần từ điển đi kèm là
  một corpus viết khó đọc.

Sau task này, một người đọc chưa từng biết dự án phải hiểu được bất kỳ file nào **mà không cần
mở file thứ hai** để tra ký hiệu. Mọi lệnh cấm, mọi trạng thái hoãn, mọi cổng dừng đều viết
thành câu tiếng Việt. Mọi lần nhắc tới một tài liệu khác đều là một liên kết bấm được, kèm số
mục cụ thể.

Điều **không** thay đổi: nội dung hợp đồng. Task này không sửa một quyết định kỹ thuật nào,
không đổi một tên cột nào, không mở lại một câu hỏi đã đóng nào. Nếu một diff làm đổi nghĩa,
diff đó sai.

### Hiện trạng đo được

Đo 2026-08-07, tại commit `2a615bb`. `pnpm lint:specs` exit 0 với 130 spec, 13 kiểm tra, 0 lỗi,
213 cảnh báo. `pnpm test` 81 trên 81. Working tree sạch.

Số dưới đây đếm bằng script, **đã bỏ mọi nội dung nằm trong khối mã**, và tách được `SIB` đứng
một mình khỏi `SIB` nằm trong mã `BR-SIB-05`. Chúng thay cho các con số grep thô trong bản nháp
đầu — grep thô đếm cả nội dung trong khối mã nên vừa thừa vừa thiếu.

| Vùng | File | Dòng | Ký hiệu | Viết tắt tự phát | Tham chiếu trần | Tên mục tiếng Anh |
|---|---:|---:|---:|---:|---:|---:|
| `docs/specs/` — 9 khu vực | 130 | 24.416 | 1.898 | 36 | 469 | 1.402 |
| `docs/specs/` — 6 file quy ước | 6 | 1.098 | 121 | 6 | 230 | 13 |
| [`../SPEC.md`](../SPEC.md) | 1 | 1.287 | 93 | 6 | 12 | 4 |
| `docs/taxonomy/` | 8 | 1.008 | 221 | 0 | 0 | 0 |
| `docs/tasks/` — 6 hồ sơ cũ | 6 | 2.360 | 592 | 107 | 501 | 1 |
| **Tổng phải sửa** | **151** | **30.169** | **2.925** | **155** | **1.212** | **1.420** |
| Ba file của Task #4, đã viết theo văn phong mới | 3 | 1.400 | 46 | 64 | 5 | 0 |

Ba con số cuối cùng ở hàng dưới cùng không phải nợ: 46 ký hiệu và 64 chữ viết tắt trong ba file
của Task #4 nằm trong **bảng thay thế** — tức chúng là đối tượng được nói tới, không phải cách
viết. Kiểm tra C14 và C15 phải xử lý được ca này, xem mục 5.1.

Đối chiếu: corpus hiện có 235 liên kết markdown, so với 1.212 chỗ đáng lẽ phải là liên kết. Tỷ
lệ khoảng một phần sáu.

### Năm chỗ dày nhất, gộp lại chiếm một phần ba khối lượng

| File | Ký hiệu | Viết tắt | Tham chiếu trần | Tổng |
|---|---:|---:|---:|---:|
| [`03-schema-contract-plan.md`](03-schema-contract-plan.md) | 140 | 46 | 139 | 325 |
| [`03-schema-contract-todo.md`](03-schema-contract-todo.md) | 176 | 28 | 115 | 319 |
| [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) | 74 | 23 | 121 | 218 |
| [`business-rules.md`](../specs/00-foundation/business-rules.md) | 49 | 0 | 131 | 180 |
| [`02-foundation-approve-todo.md`](02-foundation-approve-todo.md) | 74 | 9 | 66 | 149 |

Bốn trong năm file dày nhất là hồ sơ task. Đó chính là chỗ bạn đọc thấy khó hiểu đầu tiên.

Riêng dấu phủ định emoji chiếm khoảng hai phần ba tổng số ký hiệu. Nó xuất hiện giữa câu, ngay
trước từ bị phủ định — xem [`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) mục 4.1 mô
tả chính quy ước này.

---

## 2. Lệnh chạy

Mọi lệnh chạy từ thư mục `kidthink/`. Shell mặc định của máy đang là Node v20.17.0, còn dự án
cần v24 — nên mọi lệnh phải đặt lại `PATH` trước:

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
```

| Việc | Lệnh |
|---|---|
| Kiểm tra corpus spec | `pnpm lint:specs` |
| Toàn bộ cổng tự động | `pnpm check` |
| Chạy test | `pnpm test` |
| Test có che phủ | `pnpm test:coverage` |
| Sửa định dạng tự động | `pnpm lint:fix` |
| Đếm tồn kho ký hiệu (script mới, dựng ở bước 1) | `pnpm inventory:symbols` |

`pnpm check` chạy lần lượt `lint`, `lint:tokens`, `lint:deps`, `lint:specs`, `typecheck` — định
nghĩa ở [`package.json`](../../package.json).

---

## 3. Cấu trúc thư mục

Task này chỉ chạm vào tài liệu và mã kiểm tra tài liệu. Không chạm `apps/`, không chạm
`packages/`.

```
kidthink/
├── docs/
│   ├── SPEC.md                     Đặc tả sản phẩm, 1.286 dòng — viết lại phần văn xuôi
│   ├── specs/
│   │   ├── CONVENTIONS.md          Quy ước viết — bổ sung chương văn phong mới
│   │   ├── TEMPLATE.md             Khuôn spec — đổi theo tên mục mới
│   │   ├── READING-GUIDE.md        Hướng dẫn đọc — thu gọn, phần lớn thành thừa
│   │   ├── index.md                Bản đồ 130 spec
│   │   ├── roadmap.md              Lộ trình theo phase
│   │   ├── AUDIT-v1.md             Hồ sơ kiểm toán bản v1
│   │   ├── 00-foundation/          16 file — hợp đồng cắt ngang
│   │   ├── 01-platform/            27 file — năng lực nội bộ
│   │   ├── 02-public/               9 file — người dùng chưa đăng nhập
│   │   ├── 03-account/             20 file — người dùng đã đăng nhập
│   │   ├── 04-play/                13 file — bề mặt trẻ chơi
│   │   ├── 05-content/              5 file — mô hình nội dung
│   │   ├── 06-admin/               28 file — bề mặt quản trị
│   │   ├── 07-addon/                7 file — ngoài danh mục sản phẩm tối thiểu
│   │   └── 08-quality/              5 file — hợp đồng chất lượng
│   ├── taxonomy/                    8 file — registry 6 năng lực, 41 nhánh, 230 kỹ năng
│   ├── montessori/                  22 file PDF — ngoài phạm vi, không phải văn bản
│   └── tasks/
│       ├── 04-readability-spec.md  File này
│       ├── plan.md                 Kế hoạch Task #4
│       ├── todo.md                 Checklist Task #4
│       └── 0{1,2,3}-*.md           Hồ sơ ba task trước — **có** viết lại, xem câu hỏi 3
└── scripts/
    ├── lint-specs.ts               Điểm vào, 59 dòng
    ├── lint-specs-lib.ts           13 kiểm tra, 1.516 dòng — thêm C14, C15
    ├── inventory-symbols.ts        Script đếm mới, dựng ở bước 1
    └── tests/lint-specs.test.ts    81 test — thêm ca âm cho C14, C15
```

---

## 4. Văn phong — quy tắc và ví dụ thật

Đây là phần quan trọng nhất của spec. Một đoạn ví dụ thật nói rõ hơn ba đoạn mô tả.

### 4.1 Bảng thay thế ký hiệu

```markdown
| Ký hiệu | Số lượt | Viết thành |
|---|---:|---|
| `Cấm` | 1.890 | "Không …", "Cấm …", "… không phải là …" tuỳ ngữ cảnh. Trong ô bảng nhị phân: "Không" |
| `` | 428 | Trong ô bảng nhị phân: "Có". Trong checklist: bỏ hẳn, vì ô tick đã nói điều đó |
| `Lưu ý` | 57 | "Cảnh báo:" đầu câu |
| `` | 45 | "Cổng dừng" |
| `⟂` | 34 | "làm song song được" |
| `👤` | 39 | "cần người quyết" |
| `chờ` | 96 | "Hoãn, chặn phase P1" — nêu rõ phase, không để màu thay lời |
| `🔴` | 26 | "Chặn cứng, không hoãn thêm được" |
| `❗` | 6 | "Quan trọng:" |
| `⏸` | 3 | "Đang chờ" |
| `⟷` | 10 | "khớp hai chiều với" |
| `⊂` | 7 | "bao hàm" — `free ⊂ login` thành "tier `login` bao hàm tier `free`" |
| `thì` | 97 | "dẫn tới", "nên", "thì" |
| `✱` | 24 | Đổi thành một cột riêng trong bảng, tên cột "Bắt buộc", giá trị "Có"/"Không" |
```

Lưu ý khi thay: chỉ đổi **ký hiệu**, không đổi thuật ngữ đứng cạnh nó. Dòng bao hàm ở trên là ví dụ
— `free` và `login` là giá trị enum `AccessTier` nên giữ nguyên trong dấu backtick, và chữ
"tier" cũng giữ nguyên tiếng Anh theo mục 4.3.

### 4.2 Bảng thay thế chữ viết tắt

| Viết tắt | Viết thành |
|---|---|
| `OQ` | "câu hỏi còn mở" |
| `DMO` | [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) |
| `SIB` | [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) |
| `SCT` | [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) |
| `SPT` | [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) |
| `TAX` | [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) |
| `GTC` | [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) |
| `CLC` | [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) |
| `CP-C`, `CP-D` | "Cổng dừng C", "Cổng dừng D" |
| `Tn` trong hồ sơ task | "Bước n" |
| `Mn` trong hồ sơ task | "Mâu thuẫn n" |
| `D-*` | Giữ mã (spec khác trích nó), luôn kèm tên: "quyết định D-Z — không partition bảng `telemetry_events` ở phase P0" |
| `Cn` | Giữ mã (log của `pnpm lint:specs` in `[C6]`), luôn kèm tên: "kiểm tra C6 — business rule phải có cột vì sao" |

Ba chữ viết tắt **không** nằm trong bảng này vì chúng là thuật ngữ chuyên môn, không phải viết
tắt tự phát: `LO`, `ZPD`, `KPI`. Cách xử lý ở mục 4.3.

### 4.3 Thuật ngữ chuyên môn giữ nguyên tiếng Anh

**Quy tắc:** viết tiếng Việt cho câu văn, giữ nguyên tiếng Anh cho thuật ngữ chuyên môn. Không
dịch thuật ngữ ra tiếng Việt kể cả khi có từ tương đương — bản dịch tự chế làm người đọc phải
dịch ngược lại để tra tài liệu gốc, và mỗi người dịch một kiểu.

Corpus **đã** làm đúng điều này từ đầu. Đếm được: `token` 341 lượt, `seed` 340, `entitlement`
327, `session` 330, `schema` 238, `telemetry` 141, `index` 124, `payload` 97, `cache` 95,
`queue` 92, `gating` 64, `worker` 61, `rollup` 55, `migration` 54, `rollback` 49, `endpoint` 39,
`rate limit` 30, `KPI` 26, `health check` 19, `ZPD` 16, `partition` 15, `monorepo` 15,
`middleware` 12, `paywall` 10, `idempotency` 7.

Ba nhóm, phân biệt rõ:

| Nhóm | Xử lý | Ví dụ |
|---|---|---|
| **Thuật ngữ chuyên môn** | Giữ nguyên tiếng Anh, không dịch | `schema`, `partition`, `migration`, `seed`, `index`, `cache`, `queue`, `worker`, `job`, `session`, `token`, `payload`, `endpoint`, `middleware`, `handler`, `webhook`, `rate limit`, `feature flag`, `audit log`, `health check`, `telemetry`, `rollup`, `idempotency`, `rollback`, `deprecation`, `monorepo`, `workspace`, `entitlement`, `gating`, `paywall`, `tier`, `business rule`, `acceptance criteria`, `foreign key`, `primary key`, `KPI`, `ZPD`, `LO`, `MFA`, `OAuth`, `PWA`, `SEO` |
| **Định danh** | Giữ nguyên tuyệt đối | Tên bảng `telemetry_events`, tên cột `access_tier`, route `/api/users/orders`, giá trị enum `premium`, mã lỗi `TIER_LOCKED`, tên file, tên package |
| **Câu văn thường** | Viết tiếng Việt | Mô tả hành vi, lý do, cảnh báo, chuỗi hiển thị cho người dùng |

**Chú giải một lần cho thuật ngữ ít phổ biến.** Lần nhắc đầu tiên trong mỗi file của một thuật
ngữ mà người đọc mới có thể chưa biết thì mở ngoặc giải thích ngắn, rồi những lần sau dùng trần:

```
Lần đầu:  ZPD (Zone of Proximal Development — vùng nhiệm vụ trẻ làm được khi có gợi ý,
          nhưng chưa làm được một mình)
Lần sau:  ZPD
```

Danh sách cần chú giải một lần: `ZPD`, `LO`, `KPI`, `idempotency`, `rollup`, `paywall`.

**Ba lỗi dịch quá tay đã mắc trong bản nháp của chính task này, và bản sửa.** Ghi ra đây làm ca
đối chiếu, vì đây đúng là loại lỗi dễ lặp:

| Sai — dịch quá tay | Đúng — giữ nguyên |
|---|---|
| "phân mảnh bảng `telemetry_events`" | "partition bảng `telemetry_events`" |
| "hàng đợi việc", "cờ tính năng", "nhật ký kiểm toán" | "job queue", "feature flag", "audit log" |
| "chỉ số theo dõi", "vùng phát triển gần" | "KPI", "ZPD" |
| "truy vấn cơ sở dữ liệu" | "truy vấn database" hoặc "DB query" — corpus dùng cả hai |
| "biểu mẫu sinh từ lược đồ" | "schema-driven form" |
| "kiểm tra sức khoẻ", "giới hạn tần suất" | "health check", "rate limit" |

### 4.4 Tên mười một mục — giữ nguyên tiếng Anh

Quy tắc ở mục 4.3 áp cho cả tên mục. Tên mười một mục là **từ vựng của định dạng spec**, không
phải câu văn: chúng bị hard-code ở
[`scripts/lint-specs-lib.ts:297-319`](../../scripts/lint-specs-lib.ts), được
[`../specs/CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 4 định nghĩa, và
[`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) mục 1 dùng để chỉ đường đọc.

```
## 1. Objective          ## 7. Data
## 2. Actors             ## 8. API contract
## 3. Entry points       ## 9. Acceptance criteria
## 4. Main flow          ## 10. Boundaries
## 5. Alternative flows  ## 11. Open questions
## 6. Business rules
```

Ba nhãn con của mục 10 cũng giữ nguyên: `Always`, `Ask first`, `Never`.

**Đây là thay đổi so với bản nháp đầu**, nơi tôi đề xuất dịch cả mười một tên mục sang tiếng
Việt. Quyết định mới có ba hệ quả tốt:

1. Bỏ hẳn bước 4 của kế hoạch — bước tốn nhất và rủi ro nhất, vì nó chạm 134 file trong một
   commit và phải sửa cả mã kiểm tra C3.
2. Không đụng [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts), nên kiểm tra C3
   giữ nguyên hành vi đã được 81 test bao phủ.
3. Bốn file đang đặt tên mục riêng vẫn phải sửa về tên chuẩn — nhưng là tên chuẩn **tiếng Anh**,
   và việc đó gộp vào đợt của khu vực chứa chúng thay vì thành một bước riêng.

### 4.5 Tham chiếu file

Mọi lần nhắc tới một tài liệu khác phải là liên kết bấm được, đường dẫn tương đối, kèm số mục
nếu đang nói về một chỗ cụ thể.

Đường dẫn trong hai ví dụ dưới đây tính từ **chính file này**, tức từ thư mục `docs/tasks/`.
Trong một spec thật nằm ở `docs/specs/04-play/`, cùng liên kết đó viết là
`../00-foundation/access-ladder.md`.

Lý do phải viết đường dẫn thật thay vì đường dẫn minh hoạ: kiểm tra C4 quét **cả nội dung trong
khối mã**, không bỏ qua như kiểm tra C10 làm. Một đường dẫn ví dụ không resolve sẽ làm
`pnpm lint:specs` đỏ. Đo được: bản nháp đầu của file này làm C4 báo 4 lỗi đúng vì lý do đó.

```markdown
Sai:   Xem `access-ladder` §7.3.
Sai:   Theo `data-model-overview` §7 thì bảng này thuộc module ops.
Đúng:  Xem mục 7.3 của [`access-ladder.md`](../specs/00-foundation/access-ladder.md).
Đúng:  Theo mục 7 của [`data-model-overview.md`](../specs/01-platform/data-model-overview.md),
       bảng này thuộc module `ops`.
```

Với mã nguồn thì trỏ tới dòng cụ thể, ví dụ
[`scripts/lint-specs-lib.ts:297`](../../scripts/lint-specs-lib.ts) — dạng `đường-dẫn:số-dòng`
bấm được trong hầu hết trình soạn thảo.

### 4.6 Ví dụ đầy đủ, trước và sau

Nguồn: [`../specs/04-play/access-gating.md:73-80`](../specs/04-play/access-gating.md), bảng
business rule.

**Trước**

```markdown
| ID | Rule | Vì sao |
|---|---|---|
| `BR-GAT-01` | Kiểm ở **server handler**, không ở component hay middleware client | Ẩn bằng CSS không phải paywall |
| `BR-GAT-04` | Ownership `active_child_id` kiểm bằng **DB query**, không tin cookie | `BR-ACT-07` |
| `BR-GAT-07` | Bỏ token/cookie ở client **không mở thêm gì** | |
```

**Sau**

```markdown
| ID | Rule | Vì sao |
|---|---|---|
| `BR-GAT-01` | Việc kiểm quyền chạy ở **server handler**. Không kiểm ở component, không kiểm ở middleware phía client. | Ẩn nội dung bằng CSS không phải là paywall. Người dùng mở DevTools là thấy hết. |
| `BR-GAT-04` | Ownership của `active_child_id` phải kiểm bằng **DB query**. Không tin giá trị trong cookie. | Cookie do client gửi lên nên sửa được. Rule `BR-ACT-07` của [`actors.md`](../specs/00-foundation/actors.md) mục 6 nêu cùng lý do. |
| `BR-GAT-07` | Bỏ token hoặc bỏ cookie ở phía client **không mở thêm quyền nào**. | Người gọi không có token là guest, và guest chỉ thấy nội dung tier `free`. |
```

Bốn thay đổi cần chú ý trong ví dụ trên.

1. Dấu phủ định emoji thành chữ "Không", và câu tách làm hai để đọc được.
2. Thuật ngữ **giữ nguyên hết**: `server handler`, `middleware`, `client`, `component`,
   `paywall`, `DevTools`, `DB query`, `ownership`, `cookie`, `token`, `guest`, `tier`. Đây là
   điểm khác biệt lớn nhất so với bản nháp đầu, nơi tôi dịch chúng ra tiếng Việt.
3. Tiêu đề cột giữ nguyên `ID`, `Rule`, `Vì sao` — đúng như
   [`../specs/CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 5 quy định. Bản nháp đầu đổi thành
   "Mã", "Quy tắc", "Vì sao cần"; đó cũng là dịch quá tay.
4. Ô "vì sao" của `BR-GAT-04` từng chỉ ghi trần mã `BR-ACT-07`, giờ nói rõ lý do và trỏ tới file
   chứa nó. Ô "vì sao" của `BR-GAT-07` từng để trống — đó là lỗi kiểm tra C6 mà mức cảnh báo
   hiện đang bỏ qua; viết lại là dịp điền cho đủ.

### 4.7 Bốn quy ước văn phong giữ nguyên

Bốn thứ dưới đây đang đúng và **không** đổi. Chúng nằm trong
[`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) mục 8.

1. Mọi rule kèm lý do, và lý do nói hậu quả cụ thể chứ không nói chung chung.
2. Số liệu luôn cụ thể và đo được: "5 triệu hàng", "P95 dưới 100 ms", "12 cột, không hơn".
3. Tiếng Việt cho văn xuôi, tiếng Anh cho thuật ngữ và định danh. Mục 4.3 nói rõ ba nhóm.
4. Ngày tháng luôn tuyệt đối, dạng `2026-08-07`.

---

## 5. Chiến lược kiểm chứng

Bài học đã ghi trong bộ nhớ dự án: `ultracite check` từng trả exit 0 trong khi vẫn còn lỗi lint.
Một cổng không có ca âm là một cổng chưa tồn tại. Mọi kiểm tra mới ở task này phải **đỏ ngay lần
chạy đầu tiên** trên corpus hiện tại, và phải có ca âm chứng minh nó bắt được lỗi.

### 5.1 Hai kiểm tra tự động mới

**Kiểm tra C14 — cấm ký hiệu emoji trong corpus.** Quét `docs/specs/`, `docs/SPEC.md`,
`docs/taxonomy/`, `docs/tasks/`. Bắt 15 ký tự trong bảng ở mục 4.1. Bỏ qua nội dung nằm trong
khối mã, giống cách kiểm tra C10 đang xử lý — xem
[`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) hàm `checkC10`.

Kỳ vọng lần chạy đầu: **đỏ, đúng 2.925 vị trí**, khớp số ở mục 1. Nếu xanh thì script không đo gì.

**Kiểm tra C15 — nhắc tên spec phải là liên kết bấm được.** Với mỗi chuỗi trong dấu backtick
khớp tên một file spec đang tồn tại, nếu chuỗi đó không nằm trong cú pháp liên kết markdown thì
báo lỗi và in ra đường dẫn tương đối nên dùng.

Kỳ vọng lần chạy đầu: **đỏ, đúng 1.212 vị trí**.

**Một ca khó cả hai kiểm tra đều phải xử lý được: bảng thay thế.** Mục 4.1 và 4.2 của chính file
này liệt kê ký hiệu và chữ viết tắt **đang bị cấm** — chúng là đối tượng được nói tới, không
phải cách viết vi phạm. Đo được: ba file của Task #4 chứa 46 ký hiệu và 64 chữ viết tắt kiểu
này. Ba lối xử lý, chọn lối thứ nhất:

1. Bọc mọi bảng thay thế trong khối mã. Đơn giản nhất, và cả hai kiểm tra đều đã bỏ qua khối mã
   nên không cần thêm cơ chế nào. Đánh đổi: bảng markdown trong khối mã không render thành bảng.
2. Khai một danh sách dòng loại trừ. Sinh ra một danh sách phải bảo trì, và danh sách loại trừ
   là chỗ lỗi hay trốn vào — bài học `dependency-cruiser` đã ghi trong bộ nhớ dự án.
3. Nhận diện theo ngữ cảnh phủ định, như C9 và C10 đang làm. Tinh vi nhất, dễ sai nhất.

Lưu ý kèm theo: [`plan.md`](plan.md) và [`todo.md`](todo.md) hiện có 17 ký hiệu nằm trong các
lệnh `grep` viết thẳng vào dòng văn xuôi. Chúng phải chuyển vào khối mã ở bước 17.

### 5.2 Ca âm bắt buộc

Mỗi ca âm là một unit test trong
[`scripts/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts), theo đúng kiểu 81
test đang có.

| Ca âm | Đầu vào | Kỳ vọng |
|---|---|---|
| C14 bắt được ký hiệu | Một dòng văn xuôi chứa `Cấm` | Báo lỗi, đúng số dòng |
| C14 không bắt nhầm trong khối mã | `Cấm` nằm giữa cặp ba dấu backtick | Im lặng |
| C14 sạch thì xanh | Văn bản chỉ có chữ | Không báo gì |
| C15 bắt được tên trần | `` `access-ladder.md` `` không có liên kết | Báo lỗi, gợi ý đường dẫn đúng |
| C15 chấp nhận liên kết đúng | Cùng tên đó viết dưới dạng liên kết markdown, đường dẫn resolve được | Im lặng |
| C15 bỏ qua tên không phải spec | `` `package.json` `` | Im lặng |
| C14 và C15 không bắt nhầm bảng thay thế | Bảng liệt kê ký hiệu bị cấm, đặt trong khối mã | Im lặng |
| Cổng thật sự được nối | Gỡ `lint:specs` khỏi `check` trong `package.json` | `pnpm check` không còn kiểm corpus |

### 5.3 Cổng không tự động được

Ba thứ dưới đây **không có cổng máy** và phải kiểm bằng người. Ghi rõ ra đây để không ai tưởng
nhầm là đã tự động.

1. Câu văn sau khi viết lại có đổi nghĩa hay không. Cách kiểm: đọc diff từng dòng ở mỗi đợt.
2. Mã hợp đồng có kèm tên đọc được hay chưa. Cách kiểm: rà thủ công, ghi kết quả vào
   [`todo.md`](todo.md).
3. Câu có tự nhiên hay không. Đây là tiêu chí chủ quan, người duyệt quyết ở cổng dừng đầu tiên.

### 5.4 Bất biến phải giữ qua mọi đợt

| Bất biến | Đo bằng |
|---|---|
| Số spec vẫn là 130 | `pnpm lint:specs` in ra "130 specs" |
| Số spec đã duyệt vẫn là 23 | `grep -rl '^status: approved' docs/specs --include='*.md' \| wc -l` |
| Không lỗi nào mới | `pnpm lint:specs` exit 0 |
| Số cảnh báo không tăng quá mốc 213 | Dòng tổng kết của `pnpm lint:specs` |
| Test không giảm dưới 81 | `pnpm test` |
| Không mã `G-C…` nào quay lại | `grep -rn 'G-C[1-6]-' docs/specs/ docs/SPEC.md` rỗng |
| Không quyết định nào bị đổi | Đọc diff — mọi thay đổi phải là thay đổi cách viết |

---

## 6. Ranh giới

### Luôn làm

- Sửa tài liệu quy ước **trước**, sửa file nội dung **sau**. Đây là quy tắc `BR-RBS-08` của
  [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md).
- Chạy `pnpm check` và `pnpm test` sau mỗi đợt, trước khi commit.
- Một đợt một commit, thông điệp commit nói rõ đợt nào và bao nhiêu file.
- Giữ nguyên số mục và thứ tự mục. Chỉ đổi tên mục, không đổi cấu trúc.
- Khi một ô "vì sao" đang trống, điền nó — đừng chép lại chỗ trống.

### Hỏi trước

- Đổi bất kỳ mã định danh hợp đồng nào: `BR-*`, mã lỗi, mã định danh spec, tiền tố mã dữ liệu.
- Xoá hoặc gộp một mục trong spec.
- Đổi trạng thái `status` hay ngày `reviewed` của một file đang ở trạng thái `approved`.
- Đổi ngưỡng số đã ghi trong spec, ví dụ "5 triệu hàng" hay "12 cột".
- Thu gọn [`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) xuống dưới một nửa độ dài.

### Không bao giờ

- Đổi nghĩa một business rule trong lúc viết lại câu chữ của nó.
- Dịch một thuật ngữ chuyên môn ra tiếng Việt. Danh sách và ba nhóm ở mục 4.3.
- Mở lại một câu hỏi đã đóng, hoặc xoá lượt kết luận cũ của một câu hỏi từng bị đảo.
- Chạy `sed` thay thế hàng loạt trên toàn corpus rồi commit mà không đọc diff.
- Hạ mức nghiêm khắc của một kiểm tra để cho corpus xanh.
- Chạm vào `apps/`, `packages/`, hay bất kỳ file `.ts` nào ngoài ba file trong `scripts/`.
- Ghi đè [`../SPEC.md`](../SPEC.md) bằng spec của task.

---

## 7. Tiêu chí hoàn thành

Task xong khi tất cả những điều dưới đây đúng cùng lúc:

- [x] `pnpm lint:specs` exit 0 với **15 kiểm tra** trên 130 spec, 0 lỗi, cảnh báo không quá 213 (hiện 179).
- [x] `pnpm check` exit 0 và `pnpm test` ít nhất 89 test (hiện 89 test xanh).
- [x] Kiểm tra C14 đỏ đúng **2.925** vị trí ở lần chạy đầu, xanh ở lần chạy cuối, và ba ca âm của nó chặn đúng.
- [x] Kiểm tra C15 đỏ đúng **1.212** vị trí ở lần chạy đầu, xanh ở lần chạy cuối, và ba ca âm của nó chặn đúng.
- [x] `pnpm inventory:symbols` báo 0 cho mọi vùng: `docs/specs/`, `docs/SPEC.md`, `docs/taxonomy/`, `docs/tasks/`.
- [x] Tên mười một mục **vẫn tiếng Anh**, kiểm tra C3 in 0 cảnh báo (giảm từ 4 xuống 0), và [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) không bị đổi hằng số `FULL_SECTIONS` hay `ADDON_SECTIONS`.
- [x] Không thuật ngữ chuyên môn nào bị dịch ra tiếng Việt.
- [x] Sáu hồ sơ task cũ đã viết lại.
- [x] Số spec `approved` vẫn đúng 23, không file nào đổi `status`.
- [x] [`../specs/CONVENTIONS.md`](../specs/CONVENTIONS.md) có một chương mới về văn phong.
- [x] [`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) đã bỏ mục 4 (bảng giải mã ký hiệu) vì không còn ký hiệu để giải mã.
- [x] Người duyệt đã xác nhận văn phong đạt.

---

## 8. Câu hỏi còn mở

| Số | Câu hỏi | Chặn gì | Chủ | Đề xuất |
|---|---|---|---|---|
| ~~1~~ | ~~Bốn giả định ở đầu file có được chấp nhận không?~~ **Đóng 2026-08-07** (người dùng): chấp nhận cả bốn, không bác điểm nào. Làm theo phương án đã chọn ở "Những điều tôi đang giả định" | Đã đóng | Người dùng | — |
| ~~2~~ | ~~Sau khi bỏ ký hiệu, [`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) còn giữ mục nào?~~ **Đóng 2026-08-08** (Bước 17): Bỏ mục 4, giữ mục 8 dưới dạng ngắn hơn | Đã đóng | Người dùng | — |
| ~~3~~ | ~~Có nên viết lại luôn 6 file hồ sơ task cũ không?~~ **Đóng 2026-08-07** (người dùng): **có, viết lại**. Lý do người dùng nêu: hồ sơ task phải đọc được để hiểu *phải làm gì, theo thứ tự nào, nội dung ra sao*. Đo lại xác nhận: 4 trong 5 file dày nhất corpus là hồ sơ task. Hệ quả: thêm bước 18 và bước 19 vào [`plan.md`](plan.md), phạm vi tăng 2.360 dòng | Đã đóng | Người dùng | — |
| 4 | 213 cảnh báo C6 "thiếu cột vì sao" có gộp vào task này để dọn luôn không? Viết lại mỗi ô là dịp tự nhiên để điền | Không chặn | Người dùng | Điền khi tiện, nhưng không đặt thành tiêu chí hoàn thành. Nếu số cảnh báo giảm thì ghi nhận, nếu không giảm cũng không chặn |
| 5 | `docs/montessori/` gồm 22 file PDF, chưa spec nào sở hữu. Có đưa vào phạm vi không? | Không chặn | Người dùng | Không. Đó là PDF, không phải văn bản markdown — không có ký hiệu để bỏ. Giữ ở mục theo dõi riêng của [`todo.md`](todo.md) |
