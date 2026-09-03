# Kế hoạch — Task #208: Tái kiến trúc `packages/db` quanh trục năng lực

> Danh sách việc: [`208-competency-architecture-todo.md`](208-competency-architecture-todo.md)
>
> **File này cấm — NEVER chứa contract.** Contract nằm trong `docs/specs/`; mục 2 của
> [`CONVENTIONS.md`](../specs/CONVENTIONS.md) sở hữu luật đó.
>
> Spec liên quan: `docs/specs/00-foundation/monorepo-package-architecture.md` (bố cục package) ·
> `docs/specs/05-content/skill-dataset-model.md` (trục kỹ năng) ·
> `docs/specs/01-platform/content-seed-authoring.md` §7.1 (bố cục nội dung) ·
> `docs/specs/01-platform/taxonomy-service.md` (cây phân loại) ·
> `SPEC.md` §8.1 (ranh giới package) · `docs/specs/01-platform/data-model-overview.md` (luật schema)

---

## 0. Từ điển thuật ngữ

Tài liệu này **không** dùng từ lóng nội bộ. Bảng dưới quy đổi từ cũ trong repo sang từ dùng ở đây,
để đọc code cũ vẫn hiểu.

| Từ cũ trong repo | Nghĩa | Từ dùng trong tài liệu này |
| --- | --- | --- |
| *gieo* / *seed* | Nạp dữ liệu khởi tạo vào database (danh mục gói cước, cây năng lực, kho bài học) | **nạp dữ liệu nền** |
| *cổng* / *gate* | Một bước kiểm tra tự động, sai thì dừng và báo lỗi | **phép kiểm tra** |
| *ca âm* / *negative case* | Test cố tình tạo dữ liệu sai, để chứng minh phép kiểm tra thật sự bắt được lỗi | **test chứng minh bắt lỗi** |
| *bộ chiếu* / *projection* | Hàm nhận vốn liệu của một kỹ năng + một khuôn trò chơi, trả ra nội dung màn chơi | **bộ dựng màn chơi** |
| *dataset* | Vốn liệu dạy học của một kỹ năng: danh sách vật, thứ tự, bậc khó, câu chỉ dẫn | **bộ dữ liệu kỹ năng** |
| *corpus* | 5.013 màn chơi do máy sinh, lưu dạng JSON | **kho màn chơi sinh máy** |
| *backfill* | Màn chơi soạn thêm để lấp chỗ thiếu | **màn chơi bù** |
| *barrel* | File `index.ts` gom và xuất lại mọi thứ trong thư mục | **file gom xuất** |
| *band* | Nhóm tuổi (`3-4`, `4-5`, `5-6`, `6-7`) | **nhóm tuổi** |
| *ratchet* | Ngưỡng nợ chỉ được phép giảm, không được tăng | **ngưỡng chỉ giảm** |
| *template* / *khuôn* / `GT-0NN` | Một kiểu trò chơi (chọn đúng, kéo thả, ghép cặp…) | **khuôn trò chơi** |
| *strand* | Nhóm kỹ năng con trong một năng lực, ví dụ `C1.ADD` (phép cộng) | **nhóm kỹ năng** |
| *competency* / `C1..C6` | Năng lực — tầng cao nhất của cây phân loại | **năng lực** |

Cây phân loại của dự án:

```
Năng lực (6)  →  Nhóm kỹ năng (71)  →  Kỹ năng (408)  →  Mục tiêu học tập  →  Màn chơi
   C1                  C1.ADD               C1.ADD.01
```

---

## 1. Vì sao phải làm

`packages/db` hiện không phải một package. Nó là **bốn phần việc khác nhau** nằm chung thư mục:

| Phần việc | Đo được | `SPEC.md` §8.1 quy định |
| --- | --- | --- |
| Kết nối và mô tả database (`client` · `schema` · `migrations` · `purge`) | 51 file · ~4.100 dòng | ✅ đúng vai của `packages/db` |
| Logic nghiệp vụ (`services/`) | 32 file · 15.198 dòng | ❌ ghi rõ **"Cấm: business logic"** |
| Kho nội dung học (`seed-content/` · `seed-master/`) | 556 file · 113.873 dòng · 8,5 MB JSON | không spec nào giao vai này cho `db` |
| Công cụ kiểm tra và nạp dữ liệu (`gates/` · `cli/` · `scripts/` · `config/`) | 48 file · 12.645 dòng · 668 KB JSON | — |

Tổng **618 file TypeScript · 133.277 dòng · 15 MB**. Package lớn thứ hai của repo nhỏ hơn ~30 lần.

### 1.1 Ba hậu quả đã đo, không phải suy đoán

**(a) Kho nội dung bị kéo vào bản build máy chủ.**
`package.json` chỉ mở một lối vào `"."`. File gom xuất `src/index.ts:26` xuất lại `seed.ts`;
`seed.ts:14` nhập tĩnh hàm nạp nội dung; chuỗi đó kéo theo `activities/` + `lessons/` +
`c1..c6/levels` + `backfill/` — **khoảng 44.000 dòng** vào **mọi** nơi dùng `@mindkid/db`.
`apps/web/server` và `apps/worker` nhập 138 tên từ package này và **không tên nào là dữ liệu nội
dung** (chỉ một file test dùng tới).

**(b) Trục kỹ năng đã dựng xong nhưng chưa nối vào đâu cả.**
Task #207 sinh 408 file `skills/c<n>/<nhóm>/<KỸ-NĂNG>.ts` (52.384 dòng). Nhưng:

- `SKILL_SEEDS` — ma trận màn chơi của từng kỹ năng — **không nơi nào dùng** trong toàn repo.
- `projections/` — 33 file, 2.240 dòng bộ dựng màn chơi — **không nơi nào gọi**.
- Màn chơi thật vẫn đến từ đường cũ: `cli/gen-corpus.ts` sinh JSON bằng `getLevelGenerator()`
  của game-engine, **không đọc `dataset.items`** của kỹ năng.

Nghĩa là 52.384 dòng vốn liệu dạy học đang nằm chờ, còn nội dung trẻ thật sự chơi thì lấy vật từ
vốn từ chủ đề. Đây đúng là điều `skill-dataset-model.md` §2 đo ngày 2026-09-03: 0/5.013 màn chơi
có chữ số hoặc chữ cái, trong khi phép kiểm tra độ phủ kỹ năng vẫn báo đạt.

**(c) Nội dung của một năng lực nằm rải trên 8 cách sắp xếp khác nhau.** Riêng C1:

| Ở đâu | Sắp theo |
| --- | --- |
| `skills/c1/<nhóm>/*.ts` (110 file) | kỹ năng ✅ |
| `corpus/c1/*.json` (12 file) | nhóm kỹ năng ✅ |
| `activities/c1-activities.ts` | năng lực ✅ |
| `c1/seed-gt0NN.ts` (10 file) | khuôn trò chơi ❌ |
| `c1/seed-mont-*.ts` (12 file) | nguồn giáo trình Montessori ❌ |
| `backfill/seed-gt001-backfill.ts` (6 file) | khuôn trò chơi, **trộn C1–C6 trong cùng file** ❌ |
| `pedagogy-missing-skills.ts` | không sắp gì — 4.367 dòng phẳng, trộn hết ❌ |
| `reauthored/authoring.ts` | mã màn chơi cũ của bản v1 ❌ |

Không mở được file nào trả lời được câu **"kỹ năng C1.ADD.03 đã soạn tới đâu?"**

### 1.2 Kết quả mong muốn

1. `packages/db` chỉ còn là lớp nói chuyện với PostgreSQL.
2. Kho nội dung thành package riêng, xếp **theo đúng cây năng lực → nhóm kỹ năng → kỹ năng**.
3. Logic nghiệp vụ dùng chung nhiều nơi thành package độc lập; phụ thuộc một chiều, không chồng chéo.
4. Không còn danh sách viết cứng trong code — mọi danh sách suy ra từ nguồn sự thật.

---

## 2. Bằng chứng đã đo (2026-09-03, cây làm việc sạch)

| # | Đo gì | Con số | Đo bằng |
| --- | --- | --- | --- |
| 1 | File / dòng trong `packages/db/src` | 618 / 133.277 | `find` + `wc` |
| 2 | File trong `services/` **không** chạm database | 4 file · 1.655 dòng | quét import |
| 3 | `services/` phụ thuộc kho nội dung | **0** | quét import |
| 4 | Kho nội dung phụ thuộc `services/` | **1 file** (`tagging`), 2 chỗ gọi | quét import |
| 5 | Nơi gọi bộ dựng màn chơi | **0** | quét toàn repo |
| 6 | Nơi dùng ma trận màn chơi của kỹ năng | **0** | quét toàn repo |
| 7 | Tên `apps/*` nhập từ `@mindkid/db` | 138 (≈55 bảng · ≈75 hàm nghiệp vụ · 6 kết nối · 1 nạp dữ liệu) | script phân tích import |
| 8 | Dòng nội dung bị kéo vào bản build qua file gom xuất | ≈44.000 | lần theo import tĩnh |
| 9 | `@mindkid/emoji` khai trong `package.json`, dùng thật | **0 lần** | quét toàn package |
| 10 | File schema > 400 dòng (`BR-DM-11`) | **0** (lớn nhất `content.ts` 339) | `wc -l` |
| 11 | Thư mục rác `packages/db/packages/db/tests/gates/fixtures/tmp` | tồn tại, 0 byte | `find -empty` |
| 12 | File JSON ngưỡng ở `config/` | 9 file · 668 KB (`level-allocation.json` 451 KB) | `du` |
| 13 | Kho màn chơi sinh máy | 71 file JSON · 8,5 MB · 5.013 màn | `du` + đếm |
| 14 | Test | 133 file; **49/73 file `integration/` mới thật sự truy vấn database** | quét `getOwnerDb` |
| 15 | Script không lệnh nào gọi | **13/18**, trong đó 7 file không nơi nào tham chiếu | quét tên file |
| 16 | Phép kiểm tra tồn tại nhưng không đường nào chạy | 3 | lần theo `package.json` |
| 17 | `apps/admin` tham chiếu `@mindkid/db` | **0** | quét toàn app |
| 18 | Số bảng khai trong `schema/` **so với** danh sách xoá dữ liệu test viết cứng | **82 so với 79** | script đối chiếu |
| 19 | Service chỉ có test gọi, không app nào gọi | 2 file · 351 dòng (`content-versioning` · `telemetry-retention`) | quét tên hàm xuất |

**Dòng 18 là một lỗi thật, không phải rủi ro giả định.** `tests/global-setup.ts:35-116` viết cứng
tên bảng cần xoá giữa các lượt test, và **thiếu đúng hai bảng Task #207 vừa thêm** —
`skill_datasets` và `content_objective_map`. Hai bảng đó không được dọn, nên dữ liệu rò từ file
test này sang file test kia. Đây là ví dụ trực tiếp cho yêu cầu bỏ giá trị viết cứng.

**Dòng 19** không phải code chết mà là **tính năng chưa nối**: `content-versioning.ts` (317 dòng)
hiện thực spec `content-versioning.md` nhưng không route nào gọi. Ghi thành nợ có tên, không xoá.

---

## 3. Quyết định đã chốt

| ID | Quyết định | Hệ quả trong kế hoạch |
| --- | --- | --- |
| `Q1` | **Logic dùng chung cho nhiều app hoặc package khác thì phải tách package riêng.** | §4 — đo ai dùng gì, tách 3 package mới, trả 1 phần về package sẵn có |
| `Q2` | **Danh tính kỹ năng dùng cả hai: TypeScript là nguồn sự thật, Markdown chỉ làm tài liệu.** | §5 — `docs/taxonomy/*.md` sinh ra từ TypeScript, có phép kiểm tra chống lệch |
| `Q3` | **Giữ bản chụp kho màn chơi cũ trước khi xoá.** | Giai đoạn 6 — chụp ra ngoài repo trước khi xoá 8,5 MB |
| `Q4` | **Không viết cứng giá trị trong code.** | §6 — sáu chỗ, mỗi chỗ một nguồn sự thật |

---

## 4. Tách logic nghiệp vụ theo `Q1`

### 4.1 Đo: app nào dùng service nào

Quét import thật của `apps/web/server` và `apps/worker/src`, đối chiếu với tên hàm mà mỗi file
trong `services/` xuất ra:

| Phạm vi dùng | File | Kết luận theo `Q1` |
| --- | --- | --- |
| **web + worker** | `audit` (186 dòng, còn được 9 service khác dùng) | → package riêng |
| **web + worker** | `play-session` (1.456) | → package riêng |
| **web + worker** | `pdf-export` (421) + `pdf-renderer` (574) + `worksheet-renderer` (635) | → package riêng |
| **web + worker** | `notification-dispatch` (145) | → về `packages/notification` **đã có sẵn** |
| **content + seed-master** | hàm chuẩn hoá mã thẻ trong `tagging` | → về `packages/taxonomy` **đã có sẵn** |
| chỉ **worker** | `payment-jobs` (72) · `rollup` (228) | → `apps/worker/src/services/` |
| chỉ **web** | 20 file, ~11.000 dòng | → `apps/web/server/services/` |
| chỉ test gọi | `content-versioning` (317) · `telemetry-retention` (34) | giữ trong `db`, ghi thành nợ có tên |

Quy tắc này trùng đúng §4 của `monorepo-package-architecture.md`: bước 1 nói dùng ở ≥2 app thì
tách package; bước 5 nói chỉ dùng ở một app thì dùng thẳng trong app đó, không cần package.

### 4.2 Ba package mới

Tên đặt theo `BR-MPA-05` — mỗi package **một** năng lực rõ trong tên, cấm tên gộp kiểu
`utils` / `common` / `core`.

| Package | Chứa gì | Phụ thuộc |
| --- | --- | --- |
| `@mindkid/audit` | Ghi nhật ký kiểm toán, quét dữ liệu nhạy cảm trước khi ghi | `db` · `shared` |
| `@mindkid/play` | Nhận sự kiện chơi, cập nhật mức thành thạo và huy hiệu, kết thúc phiên chơi | `db` · `shared` · `adaptive` · `game-engine` · `queue` |
| `@mindkid/export` | Dựng file PDF (giáo án, phiếu bài tập) và quản lý vòng đời việc kết xuất | `db` · `audit` · `shared` · `storage` · `queue` |

`@mindkid/export` phụ thuộc `@mindkid/audit` — một chiều, không có vòng.

### 4.3 Đồ thị phụ thuộc sau khi tách

```
        shared   taxonomy   game-engine   adaptive   auth   config   queue   storage
           │         │            │           │        │       │       │        │
           └────┬────┴──────┬─────┴───────────┴────────┴───┬───┴───────┴────────┘
                │           │                              │
                ▼           ▼                              ▼
          content        content-build ─────────────►     db
       (dữ liệu thuần)   (nạp + kiểm tra)                  │
                                                  ┌────────┼────────┐
                                                  ▼        ▼        ▼
                                                audit    play    export
                                                  │                 │
                                                  └────────►────────┘
                                                           │
                                              ┌────────────┴────────────┐
                                              ▼                         ▼
                                          apps/web                 apps/worker
```

Mọi mũi tên một chiều. `content` và `db` **không bao giờ** biết đến nhau; `content-build` là nơi
duy nhất hai bên gặp — đó là bản chất của một bộ nạp dữ liệu.

### 4.4 Luật ranh giới — cưỡng chế bằng `dependency-cruiser`

| Từ | Được nhập | **Cấm nhập** |
| --- | --- | --- |
| `packages/content` | `shared` · `taxonomy` · `game-engine` | `db` · `content-build` · `drizzle-orm` · `postgres` · mọi module `node:*` |
| `packages/db` | `shared` · `auth` · `config` | `content` · `content-build` · `audit` · `play` · `export` |
| `packages/audit` · `play` · `export` | `db` và các package nền | `content-build` · lẫn nhau trừ cạnh `export → audit` |
| `packages/content-build` | `db` · `content` · các package nền | `apps/*` |

Mỗi luật phải có **test chứng minh bắt lỗi**: dựng tạm một import vi phạm và đòi `pnpm lint:deps`
báo đỏ. Luật không có test chứng minh là luật sẽ trôi.

### 4.5 Ba cạnh phụ thuộc phải cắt trước khi tách được

| Cạnh hiện có | Số chỗ | Cách cắt |
| --- | --- | --- |
| nội dung → `#src/services/tagging` | 2 | Chuyển hàm chuẩn hoá mã thẻ (thuần, không chạm database) sang `@mindkid/taxonomy`; `services/tagging.ts` xuất lại để 261 chỗ gọi ở `apps/*` không phải sửa |
| nội dung → `#src/schema/*` | 10 | Chúng nằm trên đường **ghi** — đi theo `content-build`, không theo `content` |
| nội dung → `#src/client` | 3 | Như trên |

---

## 5. Danh tính kỹ năng theo `Q2` — TypeScript là nguồn sự thật

### 5.1 Hiện trạng

Mã kỹ năng, nhóm kỹ năng, độ tuổi, độ khó, quá trình tư duy, mục tiêu học tập và điều kiện tiên
quyết của **cả 408 kỹ năng** đang nằm trong bảng Markdown ở `docs/taxonomy/c1..c6.md`. Lúc nạp dữ
liệu, code **phân tích văn bản Markdown** để lấy ra. Hai hệ quả: sửa một dấu gạch trong bảng làm
hỏng dữ liệu mà TypeScript không thấy, và không kiểu nào ràng buộc được nội dung bảng.

### 5.2 Đích

Mỗi kỹ năng có **một file duy nhất** trong `packages/content` chứa **trọn vẹn** kỹ năng đó:

```
packages/content/src/skills/c1/nrec/C1.NREC.02.ts
  ├─ identity   mã · nhóm kỹ năng · năng lực · tên · tuổi · độ khó ·
  │             quá trình tư duy · mục tiêu học tập · điều kiện tiên quyết
  ├─ dataset    danh sách vật · thứ tự chuẩn · bậc khó · câu chỉ dẫn
  └─ levels     ma trận màn chơi: khuôn nào · nhóm tuổi nào · chủ đề nào
```

Mở một file là trả lời được **toàn bộ** câu hỏi về kỹ năng đó. Đây chính là điều mục 1.1(c) nói
hiện nay không làm được.

### 5.3 Markdown thành tài liệu sinh ra

- `docs/taxonomy/c1..c6.md` được **sinh từ** TypeScript bằng một lệnh, không sửa tay nữa.
- Phép kiểm tra chống lệch: sinh lại và so với file trong repo; khác một byte thì báo đỏ. Cùng
  cách repo đang giữ 9 file ngưỡng JSON.
- Phần văn xuôi trong các file đó (giải thích phạm vi C4, ghi chú sư phạm) **giữ nguyên**, chỉ
  bảng dữ liệu là sinh ra. Đánh dấu ranh giới bằng cặp thẻ để bộ sinh biết ghi vào đâu.
- `packages/taxonomy` giữ nguyên vai trò: thư viện duyệt cây thuần, nhận dữ liệu từ ngoài vào
  (`buildSkillTree(rows)`). Nó **không** chứa dữ liệu 408 kỹ năng.

### 5.4 Chuyển đổi phải kiểm chứng được

Bộ chuyển đổi Markdown → TypeScript chạy một lần, và phải chứng minh không mất dữ liệu:
đọc bảng Markdown hiện tại và đọc TypeScript vừa sinh, so **từng trường của từng kỹ năng**,
đòi trùng khít 408/408. Lệch một dòng thì dừng và in ra, không đoán.

---

## 6. Bỏ giá trị viết cứng theo `Q4`

Sáu chỗ đã xác định, mỗi chỗ thay bằng một nguồn sự thật:

| # | Đang viết cứng | Ở đâu | Thay bằng |
| --- | --- | --- | --- |
| 1 | 79 tên bảng cần xoá giữa các lượt test | `tests/global-setup.ts:35-116` | Đọc từ chính `schema/` lúc chạy (`getTableName` của Drizzle trên mọi export). Tự đúng khi thêm bảng. Test chứng minh: thêm một bảng giả ⟹ nó xuất hiện trong danh sách xoá |
| 2 | 22 đường dẫn file schema | `src/index.ts:9-24` | File `schema/index.ts` sinh bằng script, kèm phép kiểm tra: file `.ts` trong `schema/` mà không có trong danh mục ⟹ báo đỏ |
| 3 | 1.280 dòng import của 408 kỹ năng | `skills/index.ts` | Danh mục sinh từ thư mục, kèm phép kiểm tra file chưa đăng ký (luật `BR-SDS-07` — hiện chỉ sống trong một file test, đường nạp dữ liệu **không** chạy nó) |
| 4 | Bảng 34 khuôn → bộ dựng | `projections/index.ts` | Sinh từ thư mục `builders/`, cùng cách |
| 5 | Danh sách nguồn màn chơi | `seed-content/index.ts:29-48` | Sau Giai đoạn 6 chỉ còn **một** nguồn: danh mục kỹ năng. Danh sách biến mất |
| 6 | Ngưỡng số lượng ghi trong lời chú thích code | `gates/skill-quota.ts:7,9` — "C1 ≥ 20 màn, C2–C6 ≥ 10"; "C1 ≥ 4 khuôn, C2–C6 ≥ 2" | Đưa vào `content-build/src/thresholds/quota.json`, đọc lúc chạy. Đổi ngưỡng không phải sửa code |

Nguyên tắc: **danh sách nào suy ra được từ thư mục hoặc từ schema thì không viết tay.** Danh sách
nào là quyết định của con người (ngưỡng, hạn ngạch, bảng phân bổ) thì nằm trong file JSON có tên
rõ ràng, không nằm trong code.

---

## 7. Cấu trúc đích

```
packages/db                     Chỉ nói chuyện với PostgreSQL.
  src/client.ts                   Tạo kết nối (vai chủ sở hữu / vai ứng dụng)
  src/schema/                     22 file mô tả 82 bảng — GIỮ PHẲNG (xem §8)
  src/migrations/                 7 file SQL + sổ theo dõi
  src/purge.ts                    Xoá tài khoản theo yêu cầu pháp lý
  src/auth-*.ts                   Hai bộ nối cho package auth

packages/audit                  Nhật ký kiểm toán.
packages/play                   Phiên chơi, sự kiện chơi, mức thành thạo, huy hiệu.
packages/export                 Kết xuất PDF: giáo án và phiếu bài tập.

packages/content                Chỉ chứa nội dung học. KHÔNG biết database tồn tại.
  src/skills/c1..c6/<nhóm>/<KỸ-NĂNG>.ts   408 file: danh tính + vốn liệu + ma trận màn chơi
  src/builders/<khuôn>.ts                  34 bộ dựng màn chơi
  src/manual/c1..c6/<nhóm>/                Màn chơi soạn tay (3 khuôn không có khe cho vật)
  src/activities/c1..c6.ts                 Hoạt động cho phụ huynh, theo năng lực
  src/lessons/c1..c6.ts                    Giáo án, theo năng lực
  src/registry.ts                          Danh mục sinh tự động từ thư mục

packages/content-build          Chỉ nạp nội dung vào database và kiểm tra chất lượng.
  src/loader/                     Đọc nội dung → ghi vào bảng
  src/checks/                     Phép kiểm tra chất lượng + test chứng minh bắt lỗi
  src/cli/                        Lệnh chạy tay
  src/thresholds/*.json           Ngưỡng và bảng phân bổ (từ packages/db/config/)

apps/web/server/services/       20 file logic chỉ web dùng
apps/worker/src/services/       2 file logic chỉ worker dùng
```

### 7.1 Trục gom trong `packages/content`

| Cách sắp cũ | Đang ở đâu | Thành gì |
| --- | --- | --- |
| theo khuôn trò chơi | `c<n>/seed-gt0NN.ts` · `backfill/seed-gt00N-*.ts` | trường `template` trong `levels[]` của file kỹ năng |
| theo nguồn Montessori | `c<n>/seed-mont-*.ts` | trường `montessori_ref` |
| theo mã màn chơi bản v1 | `reauthored/authoring.ts` | trường `legacy_v1_ref` |
| "kỹ năng còn thiếu màn chơi" | `pedagogy-missing-skills.ts` (4.367 dòng phẳng) | tan vào chính file kỹ năng đó |
| theo số lô | `lessons/batch-NN.ts` (15 file) | `lessons/c1.ts … c6.ts` |
| trộn nhiều năng lực một file | `activities/pedagogy-activities-45.ts` (4.529) · `digital-game-activities.ts` (1.964) | tách theo năng lực |

Mọi cách sắp xếp khác trở thành **một trường dữ liệu bên trong file kỹ năng**, không còn là thư mục.

---

## 8. Bốn ràng buộc ghim bố cục — đụng vào là hỏng mà không báo lỗi

| Ràng buộc | Ở đâu | Hỏng thế nào |
| --- | --- | --- |
| `schema: "./src/schema/*.ts"` — mẫu tìm file **một tầng** | `drizzle.config.ts:5` | File schema đẩy vào thư mục con **rơi khỏi** `drizzle-kit generate` mà **không báo lỗi**; bảng đó ngừng sinh bản ghi thay đổi. ⟹ `schema/` **giữ phẳng** |
| File gom xuất liệt kê **từng** file schema bằng đường dẫn viết tay | `src/index.ts:9-24` | Đổi tên hoặc dời một file schema mà quên sửa dòng tương ứng ⟹ mất export, lỗi hiện ra ở chỗ khác hẳn |
| Đường tới `migrations/` tính tương đối | `tests/global-setup.ts:191-198` · `scripts/migrate.ts:6-7` | Dời `tests/` hoặc `scripts/` là gãy |
| Danh sách 79 bảng cần xoá viết cứng | `tests/global-setup.ts:35-116` | Đã hỏng rồi — thiếu `skill_datasets` và `content_objective_map` |

Thêm một chỗ ở lớp cưỡng chế: `.dependency-cruiser.cjs:79` viết cứng `^packages/(db|storage)/`.
Năm package mới phải được thêm vào đó, nếu không ranh giới của chúng không ai canh.

---

## 9. Bảy giai đoạn

Mỗi giai đoạn là một PR, đi trọn một đường và kết thúc ở trạng thái chạy được.

> **Test đi cùng code trong cùng giai đoạn.** 133 file test phải theo mã nguồn chúng đo.
> `tests/global-setup.ts` **ở lại `packages/db`**; các package mới dùng lại qua
> `defineWorkspaceTest` của `@mindkid/config/vitest`.

### Giai đoạn 1 — Dọn nợ và chặn rò rỉ *(không đổi hành vi)*

**Làm gì**
- Xoá `@mindkid/emoji` khỏi `package.json` (khai nhưng 0 lần dùng).
- Xoá thư mục rác `packages/db/packages/`; sửa `tests/gates/level-generator-kit.test.ts:19,106`
  dùng `repoPath()` thay vì ghép đường dẫn tương đối.
- Sửa `cli/cell-generator.ts:8` (`../../../scripts/...`) sang bí danh `#scripts/...`.
- **Chặn rò rỉ nội dung vào bản build**: bỏ `export * from "./seed.ts"` và 4 dòng nội dung khỏi
  `src/index.ts`; mở lối vào thứ hai `"./seed"` cho các lệnh chạy tay và test dùng.
- Phân loại 13 script không ai gọi:
  - **Nối vào `package.json`** (bốn bộ sinh lại file ngưỡng — xoá là mất khả năng dựng lại 668 KB
    dữ liệu mà phép kiểm tra đang đo): `gen-level-allocation` · `gen-skill-affinity` ·
    `generate-skill-datasets` · `gen-pedagogy-45`.
  - **Giữ, sửa đường nhập**: `check-matrix-budget` (đang được dùng thật).
  - **Xoá** (bộ chuyển đổi chạy một lần, đã xong, không nơi nào tham chiếu): 8 file còn lại.
    Trước khi xoá, gỡ tên chúng khỏi danh sách cho phép ở `tests/gates/taxonomy-refs.ts:36`.
- Nối `check-skill-registry` vào đường nạp dữ liệu (nó là luật `BR-SDS-07` nhưng hiện chỉ chạy
  trong một file test).
- Ghi hai service chỉ có test gọi (`content-versioning`, `telemetry-retention`) vào sổ nợ có tên.

**Nghiệm thu**
- Bốn lệnh `pnpm lint` · `lint:deps` · `typecheck` · `test` thoát mã 0.
- Chụp danh sách `trạng-thái | tên-test` trước và sau — **trùng khít**. Bất kỳ test nào đổi trạng
  thái, kể cả hỏng→đạt, đều là dấu hiệu hành vi đã đổi.
- Nhập `@mindkid/db` không còn với tới file gom xuất của kho nội dung.
- Chạy lại hai bộ sinh file ngưỡng cho ra **byte giống hệt** bản trong repo.

**Quy mô** M · **Phụ thuộc** không

---

### Giai đoạn 2 — Sửa spec và luật ranh giới *(chạy song song Giai đoạn 1)*

Luật của repo: đổi hành vi mà spec đã chốt thì **sửa spec trong cùng PR**.

**Làm gì**
- `monorepo-package-architecture.md` §7.1 — thêm năm dòng cho `content` · `content-build` ·
  `audit` · `play` · `export`.
- `SPEC.md` §8.1 — thêm năm hàng ranh giới; hàng `packages/db/` bỏ chữ "seed" và bỏ vai nghiệp vụ.
- `content-seed-authoring.md` và `skill-dataset-model.md` — đổi đường dẫn
  `packages/db/src/seed-content/…` sang `packages/content/src/…`.
- `taxonomy-service.md` — ghi `Q2`: TypeScript là nguồn sự thật, Markdown sinh ra từ đó.
- `.dependency-cruiser.cjs` — thêm luật của §4.4 và mở rộng mẫu ở dòng 79.

**Nghiệm thu**
- Tìm chuỗi `packages/db/src/seed-content` trong `docs/` trả về rỗng.
- **Test chứng minh bắt lỗi** cho mỗi luật ranh giới: dựng tạm một import vi phạm, đòi
  `pnpm lint:deps` báo **đỏ**.

**Quy mô** M · **Phụ thuộc** không

---

### Giai đoạn 3 — Chuyển danh tính kỹ năng sang TypeScript *(`Q2`)*

**Làm gì**
- Khai kiểu đầy đủ cho danh tính một kỹ năng (mã, nhóm, năng lực, tên, tuổi, độ khó, quá trình
  tư duy, mục tiêu học tập, điều kiện tiên quyết).
- Bộ chuyển đổi đọc `docs/taxonomy/c1..c6.md`, sinh phần danh tính vào **đúng file kỹ năng đang
  có** ở `skills/c<n>/<nhóm>/<KỸ-NĂNG>.ts` — hợp nhất với vốn liệu đã có sẵn ở đó.
- Viết lệnh sinh ngược `docs/taxonomy/*.md` từ TypeScript, chỉ ghi vào vùng đánh dấu, giữ nguyên
  phần văn xuôi.
- Gỡ code phân tích Markdown khỏi đường nạp dữ liệu.

**Nghiệm thu**
- So **từng trường của từng kỹ năng** giữa Markdown cũ và TypeScript mới: trùng khít **408/408**.
  Lệch một dòng thì dừng và in ra, không đoán.
- Sinh lại Markdown từ TypeScript cho ra **byte giống hệt** file trong repo (sau lần sinh đầu).
- Phép kiểm tra chống lệch có test chứng minh: sửa tay một ô trong Markdown ⟹ báo đỏ.

**Quy mô** L · **Phụ thuộc** Giai đoạn 1, 2

---

### Giai đoạn 4 — Dựng `packages/content`

**Làm gì**
- Cắt cạnh phụ thuộc còn lại: chuyển hàm chuẩn hoá mã thẻ sang `@mindkid/taxonomy`;
  `services/tagging.ts` xuất lại để 261 chỗ gọi ở `apps/*` không phải sửa.
- Tạo package, phụ thuộc chỉ gồm `shared` · `taxonomy` · `game-engine`.
- Chuyển 408 file kỹ năng và 33 bộ dựng màn chơi sang. Trên 500 dòng nên **viết bộ chuyển đổi tự
  động, không sửa tay** — bài học đã trả giá ghi trong `CLAUDE.md`.
- Đổi `projections/` thành `builders/`; danh mục viết cứng thành danh mục sinh từ thư mục (§6 #4).
- Viết `buildLevelsForSkill(skill)`: với mỗi dòng trong `levels[]`, gọi bộ dựng của khuôn tương
  ứng. Nội dung dựng ra không khớp hợp đồng của khuôn thì **ném lỗi và dừng**, không thử lại —
  vòng thử-lại-tới-khi-đạt chính là lý do kho hiện tại tiến hoá theo hình dạng phép kiểm tra chứ
  không theo kỹ năng.
- Tách hai file trộn nhiều năng lực và 15 file giáo án theo lô thành `activities/c1..c6.ts` và
  `lessons/c1..c6.ts`.

**Nghiệm thu**
- `packages/content` có **0 import** drizzle, `node:*`, `@mindkid/db` — `lint:deps` xác nhận.
- **Test chứng minh bắt lỗi**: vốn liệu 2 vật dựng cho khuôn đòi ≥4 vật ⟹ ném lỗi, **không** sinh
  màn chơi.
- Cùng hạt ngẫu nhiên cho ra **byte giống hệt** giữa hai lần chạy.
- Số hoạt động và số giáo án trước/sau **bằng nhau**; mã của chúng không đổi.

**Quy mô** L · **Phụ thuộc** Giai đoạn 3

---

### Giai đoạn 5 — Dựng `packages/content-build`

**Làm gì**
- Chuyển 20 phép kiểm tra, 10 lệnh chạy tay, `seed-master/`, hàm ghi nội dung vào database, và
  9 file ngưỡng JSON sang package mới.
- Mọi phép kiểm tra lấy gốc repo từ `repoPath()`, **không** đọc thư mục làm việc hiện tại —
  vitest chạy với thư mục làm việc là thư mục workspace nên đọc `process.cwd()` cho kết quả sai.
- Mỗi phép kiểm tra giữ đủ hai phần: quét nguồn thật, và test chứng minh bắt lỗi.
- Đưa ngưỡng số lượng từ lời chú thích code vào `thresholds/quota.json` (§6 #6).
- `packages/db/src/seed.ts` chỉ còn nạp dữ liệu nền phi nội dung (gói cước, quyền lợi, tài khoản,
  bản ghi đồng ý); phần nội dung gọi sang package mới.

**Nghiệm thu**
- Chạy **từng** phép kiểm tra, so **từng con số** với bản chạy trước khi chuyển — đòi trùng khít.
  So mã thoát là không đủ: phép kiểm tra trỏ sai đường dẫn vẫn thoát 0 và báo "đạt". Repo này đã
  có 5 lần như vậy.
- Database rỗng → `pnpm db:migrate && pnpm db:seed` thoát 0; chạy lần hai **không đổi số hàng**.
- Nạp dữ liệu vẫn chạy đủ 10 phép kiểm tra. **Test chứng minh bắt lỗi**: dựng một màn chơi vi
  phạm rồi chạy `db:seed` ⟹ mã thoát khác 0 và **0 hàng được ghi**.

**Quy mô** L · **Phụ thuộc** Giai đoạn 4

---

### Giai đoạn 6 — Tách logic nghiệp vụ *(`Q1`)*

**Làm gì**
- Dựng `@mindkid/audit`, `@mindkid/play`, `@mindkid/export` theo §4.2. Thứ tự: `audit` trước
  (9 service khác phụ thuộc nó), rồi `play` và `export`.
- Chuyển `notification-dispatch` vào `packages/notification` đã có sẵn.
- Chuyển 20 file chỉ web dùng sang `apps/web/server/services/`; 2 file chỉ worker dùng sang
  `apps/worker/src/services/`.
- Thay danh sách bảng viết cứng ở `tests/global-setup.ts` bằng đọc từ `schema/` (§6 #1) — việc
  này đóng luôn lỗi thiếu hai bảng đã đo.
- Thay 22 đường dẫn schema viết tay ở `src/index.ts` bằng danh mục sinh có kiểm tra (§6 #2).

**Nghiệm thu**
- Mỗi tên trong 138 tên đang xuất ra vẫn nhập được, chỉ **đổi đường nhập**. Đối chiếu bằng script
  so danh sách tên trước/sau: không tên nào **biến mất**.
- Danh sách bảng cần xoá suy ra lúc chạy có đủ **82** bảng. Test chứng minh: thêm một bảng giả
  vào `schema/` ⟹ nó xuất hiện trong danh sách.
- `packages/db/src` còn khoảng 5.000 dòng (từ 133.277).
- `lint:deps` xác nhận không có vòng phụ thuộc nào.

**Quy mô** L · **Phụ thuộc** Giai đoạn 5

---

### Giai đoạn 7 — Nối đường sinh màn chơi theo kỹ năng

Đây là chỗ việc "gom theo năng lực" thành thật thay vì chỉ đổi chỗ file.

**Làm gì**
- **Chụp bản lưu trước (`Q3`)**: xuất kho màn chơi sinh máy hiện tại (71 file, 8,5 MB) và danh
  sách mã màn chơi đã phát hành ra **ngoài repo**, ghi rõ đường dẫn bản lưu vào PR.
- Bộ chuyển đổi đọc từng màn chơi cũ trong `c1..c6/`, `backfill/`, `pedagogy-missing-skills.ts`,
  `reauthored/`; tra kỹ năng của nó; ghi một dòng `{ khuôn, nhóm tuổi, bậc khó, chủ đề, số vòng }`
  vào đúng file kỹ năng. Màn chơi nào không tra được về kỹ năng nào ⟹ **dừng và in danh sách**,
  không đoán.
- `montessori_ref` và `legacy_v1_ref` giữ nguyên **trong dữ liệu** — hai phép kiểm tra đọc chúng
  như dữ liệu; đã có lần chúng nằm trong lời chú thích và một bộ chuyển đổi xoá sạch, làm con số
  tụt từ 24 xuống 14 mà nội dung không mất gì.
- Sinh lại toàn bộ màn chơi qua `buildLevelsForSkill` và nạp vào database sạch.
- Xoá `corpus/*.json` và `cli/gen-corpus.ts`.

**Nghiệm thu — cổng chặn của cả task**
- So danh sách mã màn chơi trước và sau ⟹ **rỗng**. Luật `BR-SDS-14`: mã đã phát hành không được
  đổi — mã ghi lịch sử, không ghi phân loại.
- Hai phép kiểm tra trung thực **xanh thật**, mỗi cái có test chứng minh bắt lỗi:
  - *nguồn vật* — mọi vật trong màn chơi truy được về vốn liệu của chính kỹ năng đó;
  - *khái niệm hiện ra* — kỹ năng có ký tự (chữ số, chữ cái) thì mọi màn chơi phải hiển thị ký tự đó.
- **Người mở một màn chơi của `C5.ALP.01` trên máy thật và thấy chữ cái trên màn hình.** Chụp màn
  hình vào PR. Đây là nghiệm thu duy nhất chứng minh nội dung thật sự dạy kỹ năng.

**Quy mô** L · **Phụ thuộc** Giai đoạn 5

---

## 10. Điểm dừng để người xem lại

| Sau giai đoạn | Điều kiện |
| --- | --- |
| 1–2 | Bốn lệnh kiểm tra thoát 0; danh sách test trùng khít; chưa file nào bị **dời**, mới chỉ **gỡ** |
| 3 | 408/408 kỹ năng trùng khít giữa Markdown cũ và TypeScript mới; sinh ngược ra byte giống hệt |
| 4 | `packages/content` không import database; test chứng minh bắt lỗi báo đỏ đúng chỗ; số hoạt động/giáo án trùng khít |
| 5 | Nạp dữ liệu lên database rỗng chạy được và lặp lại không đổi số hàng; **từng con số** của mỗi phép kiểm tra trùng khít bản trước khi chuyển |
| 6 | Không tên nào trong 138 tên biến mất; không có vòng phụ thuộc |
| 7 | So mã màn chơi rỗng; hai phép kiểm tra trung thực xanh; ảnh chụp màn hình có chữ cái |

---

## 11. Rủi ro

| Rủi ro | Mức | Cách giảm |
| --- | --- | --- |
| Đổi mã màn chơi đã phát hành | **Cao** | Chụp danh sách mã ra ngoài repo trước; so ra rỗng là điều kiện chặn Giai đoạn 7 |
| Phép kiểm tra chuyển chỗ thành **đạt giả** vì trỏ sai đường dẫn ngưỡng | **Cao** | So từng con số, không so mã thoát. Repo đã có 5 mẫu đạt giả |
| Tách service làm hỏng 261 chỗ gọi ở `apps/*` | **Cao** | Giai đoạn 6 đòi không tên nào biến mất; đổi đường nhập bằng bộ chuyển đổi tự động, không sửa tay |
| Mất dữ liệu khi chuyển danh tính kỹ năng từ Markdown | **Cao** | So từng trường của 408 kỹ năng; lệch thì dừng |
| Bộ chuyển đổi tự động ghép sai khối code | Trung bình | Quét theo dòng, tìm dòng đóng đúng cột; cấm biểu thức chính quy nhảy khối |
| Test "xanh" nhưng hành vi đã đổi | Trung bình | Chụp `trạng-thái \| tên-test` trước/sau, đòi trùng khít — kể cả hỏng→đạt |
| Vòng phụ thuộc giữa các package | Trung bình | Cắt ba cạnh ở §4.5 **trước** khi tách; luật `dependency-cruiser` có test chứng minh |
| Nợ lỗi kiểu tăng lên | Trung bình | Ngưỡng chỉ giảm; muốn tăng phải có lý do trong PR |
| PR quá lớn không xem nổi | **Cao** | Bảy PR, bảy điểm dừng |

---

## 12. Kiểm chứng đầu-cuối

```bash
# Gốc repo, Node 24 theo .nvmrc — Node mặc định của máy là v20 sẽ chết
pnpm lint && pnpm lint:deps && pnpm typecheck && pnpm test

# Đường nạp dữ liệu trên database rỗng
pnpm db:migrate && pnpm db:seed     # thoát 0
pnpm db:seed                         # chạy lại: số hàng KHÔNG đổi

# Tài liệu phân loại không lệch với TypeScript
pnpm --filter @mindkid/content check:taxonomy-docs

# Các phép kiểm tra chất lượng nội dung
pnpm --filter @mindkid/content-build check:skill-quota
pnpm --filter @mindkid/content-build check:engine-depth
pnpm --filter @mindkid/content-build check:skill-fidelity
pnpm --filter @mindkid/content-build check:legacy-v1

# Mở thật một màn chơi của kỹ năng có ký tự
pnpm dev  →  mở màn chơi của C5.ALP.01  →  phải THẤY chữ cái trên màn hình
```
