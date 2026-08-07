# Kế hoạch — Task #4: Viết lại corpus theo ngôn ngữ tự nhiên

> Viết 2026-08-07, sửa lần 2 cùng ngày sau khi đo per-file. Đặc tả của task:
> [`04-readability-spec.md`](04-readability-spec.md). Checklist thực thi: [`todo.md`](todo.md).
>
> Ba task trước đã lưu trữ:
> [`01-bootstrap-plan.md`](01-bootstrap-plan.md) và [`01-bootstrap-todo.md`](01-bootstrap-todo.md) ·
> [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) và [`02-foundation-approve-todo.md`](02-foundation-approve-todo.md) ·
> [`03-schema-contract-plan.md`](03-schema-contract-plan.md) và [`03-schema-contract-todo.md`](03-schema-contract-todo.md).
>
> File này viết theo đúng văn phong mà nó đề xuất: không ký hiệu emoji, không chữ viết tắt tự
> phát, mọi tham chiếu tài liệu là liên kết bấm được. So sánh nó với
> [`03-schema-contract-plan.md`](03-schema-contract-plan.md) là thấy ngay khác biệt.

## Tóm tắt

151 file, 30.169 dòng, chứa 2.925 ký hiệu emoji dùng thay lời, 155 chữ viết tắt tự phát chưa
từng định nghĩa, 1.420 tên mục tiếng Anh, và 1.212 lần nhắc tài liệu khác mà không có liên kết.
Nội dung đúng; cách viết bắt người đọc học một bảng ký hiệu riêng trước khi hiểu câu đầu tiên.

Kế hoạch chia việc thành **20 bước**, xếp theo thứ tự phụ thuộc, mỗi bước một commit. Nguyên tắc
xuyên suốt: **dựng cổng đo trước, sửa nội dung sau**, và cổng mới phải đỏ ngay lần chạy đầu thì
mới tin là nó đang đo thật.

## Sửa lần 2 — hai thay đổi phạm vi

Bản đầu của kế hoạch này viết trước khi đo per-file. Đo xong tìm ra hai chỗ sai:

**Bỏ sót `docs/taxonomy/`.** 8 file, 1.008 dòng, 221 ký hiệu. Nó không phải tài liệu phụ: quy
tắc `BR-TAX-09` của [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) mục 6
buộc dữ liệu seed khớp **chính xác** `docs/taxonomy/c1..c6.md`. Thêm thành bước 16.

**Sáu hồ sơ task cũ chuyển từ "ngoài phạm vi" vào phạm vi.** Người dùng chốt 2026-08-07: hồ sơ
task phải đọc được để hiểu *phải làm gì, theo thứ tự nào, nội dung ra sao*. Số đo ủng hộ quyết
định đó — bốn trong năm file dày nhất corpus là hồ sơ task. Thêm thành bước 18 và bước 19.

## Trạng thái đo được lúc bắt đầu

Đo 2026-08-07, tại commit `2a615bb`, working tree sạch.

| Chỉ số | Giá trị |
|---|---|
| `pnpm lint:specs` | exit 0 — 130 spec, 13 kiểm tra, 0 lỗi, 213 cảnh báo |
| `pnpm check` | exit 0 |
| `pnpm test` | 81 test, 81 đạt, 2 file test |
| Spec ở trạng thái `approved` | 23 trên 130 |

Khối lượng phải sửa, đếm bằng script, đã bỏ nội dung trong khối mã:

| Vùng | File | Dòng | Ký hiệu | Viết tắt | Tham chiếu trần | Bước |
|---|---:|---:|---:|---:|---:|---|
| `00-foundation` | 16 | 3.844 | 390 | 6 | 206 | 5 |
| `01-platform` | 27 | 5.924 | 485 | 15 | 116 | 6, 7 |
| `04-play` và `05-content` | 18 | 3.157 | 199 | 9 | 30 | 8 |
| `03-account` | 20 | 3.657 | 274 | 0 | 18 | 9 |
| `02-public` và `08-quality` | 14 | 2.269 | 204 | 0 | 23 | 10 |
| `06-admin` | 28 | 4.539 | 247 | 6 | 43 | 11, 12 |
| `07-addon` | 7 | 1.026 | 99 | 0 | 33 | 13 |
| [`../SPEC.md`](../SPEC.md) | 1 | 1.287 | 93 | 6 | 12 | 14 |
| 6 file quy ước trong `docs/specs/` | 6 | 1.098 | 121 | 6 | 230 | 15, 17 |
| `docs/taxonomy/` | 8 | 1.008 | 221 | 0 | 0 | 16 |
| 6 hồ sơ task cũ | 6 | 2.360 | 592 | 107 | 501 | 18, 19 |
| **Tổng** | **151** | **30.169** | **2.925** | **155** | **1.212** | |

## Bốn quyết định thiết kế

**Quyết định 1 — Cổng mới có danh sách hoãn theo thư mục, thu dần sau mỗi đợt.**
Kiểm tra C14 và C15 áp cho toàn corpus, nên nếu bật một lần cho tất cả thì chúng đỏ suốt 15 đợt
liền và không phân biệt được "chưa làm tới" với "làm sai". Cách xử lý: hai kiểm tra nhận một
danh sách thư mục được hoãn, khai ngay trong
[`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts). Mỗi đợt xong một khu vực thì xoá
khu vực đó khỏi danh sách hoãn, trong cùng commit. Danh sách rỗng ở bước 20. Nhờ vậy mỗi đợt đều
có một cổng máy xác nhận đợt đó xong thật.

**Quyết định 2 — Thuật ngữ chuyên môn giữ nguyên tiếng Anh, kể cả tên mười một mục.**
Người dùng chốt 2026-08-07: *"Những thuật ngữ chuyên môn vẫn phải giữ nguyên gốc tiếng Anh thay
vì dịch ra."* Danh sách thuật ngữ và ba nhóm phân biệt ở
[`04-readability-spec.md`](04-readability-spec.md) mục 4.3.

Bằng chứng cho thấy corpus vốn đã làm đúng: `token` 341 lượt, `seed` 340, `entitlement` 327,
`session` 330, `schema` 238, `telemetry` 141, `gating` 64, `rollup` 55, `KPI` 26, `ZPD` 16,
`partition` 15, `idempotency` 7. Vấn đề nằm ở **bản nháp đầu của kế hoạch này**, nơi tôi dịch
chúng ra tiếng Việt — không nằm ở corpus.

Hệ quả lớn nhất: **bỏ hẳn việc dịch 1.420 tên mục**. Bản nháp đầu định dành một bước riêng cho
việc đó, chạm 134 file trong một commit và phải sửa hai hằng số `FULL_SECTIONS` và
`ADDON_SECTIONS` ở [`scripts/lint-specs-lib.ts:297-319`](../../scripts/lint-specs-lib.ts). Bỏ
được bước tốn nhất và rủi ro nhất của kế hoạch. Bước 4 giữ số nhưng đổi nội dung: chỉ còn sửa
bốn file đang đặt tên mục riêng, về đúng tên chuẩn tiếng Anh.

**Quyết định 3 — Viết lại văn xuôi bằng tay, không thay thế hàng loạt.**
Dấu phủ định emoji chiếm khoảng hai phần ba tổng số ký hiệu, và nó không có một bản dịch duy
nhất: chỗ thành "Không", chỗ thành "Cấm", chỗ thành "không phải là", chỗ phải tách câu làm hai.
Một lệnh `sed` toàn corpus sẽ tạo ra hàng nghìn câu ngữ pháp sai mà cổng máy không bắt được, vì
cổng chỉ đo sự vắng mặt của ký tự chứ không đo chất lượng câu.

**Quyết định 4 — Trong mỗi khu vực, làm file dày nhất trước.**
File dày là file buộc phải quyết định nhiều nhất về cách diễn đạt. Quyết xong ở file đầu thì các
file sau chỉ việc theo. Ngược lại, làm file nhẹ trước thì tới file dày mới phát hiện bảng thay
thế thiếu ca, và phải quay lại sửa những file đã xong. Thứ tự file trong [`todo.md`](todo.md)
xếp giảm dần theo tổng số vấn đề, chính vì lý do này.

## Đồ thị phụ thuộc

```
Bước 1 — script kiểm kê, đếm chính xác
    |
Bước 2 — kiểm tra C14 và C15, phải đỏ ngay
    |
    +--> Cổng dừng A: người duyệt trước khi động vào nội dung
    |
Bước 3 — CONVENTIONS.md và TEMPLATE.md   (quy tắc BR-RBS-08: sửa quy ước trước)
    |
Bước 4 — sửa 4 file đặt tên mục lệch khuôn, về tên chuẩn tiếng Anh
    |
    +--> Cổng dừng B: người duyệt chốt văn phong trên ba file mẫu
    |
Bước 5 — 00-foundation, 16 file
    |    (làm trước: hợp đồng cắt ngang, mọi khu vực khác trích dẫn)
    |
    +-----------+-----------+-----------+-----------+-----------+
    |           |           |           |           |           |
 Bước 6,7    Bước 8      Bước 9     Bước 10    Bước 11,12   Bước 13
 01-platform 04-play +   03-account 02-public + 06-admin    07-addon
             05-content             08-quality
    |
    +--> Cổng dừng C sau bước 7 · Cổng dừng D sau bước 13
    |
Bước 14 — docs/SPEC.md
    |
Bước 15 — index.md, roadmap.md, AUDIT-v1.md
    |
Bước 16 — docs/taxonomy/, 8 file
    |
Bước 17 — READING-GUIDE.md thu gọn
    |    (làm sau cùng trong nhóm này: chỉ biết bỏ được mục nào
    |     khi đã bỏ hết ký hiệu thật)
    |
Bước 18 — hồ sơ Task #3, 2 file dày nhất corpus
    |
Bước 19 — hồ sơ Task #1 và Task #2, 4 file
    |
Bước 20 — ba file của chính Task #4
    |
    +--> Cổng dừng E: đóng task
```

Sáu nhánh từ bước 6 tới bước 13 chạm thư mục khác nhau nên làm song song được. Bước 5 phải xong
trước chúng, vì `00-foundation/` chứa hợp đồng mà mọi khu vực khác trích dẫn — chuẩn hoá ở đó
trước thì các khu vực sau chỉ việc trỏ liên kết tới bản đã chuẩn, không phải sửa hai lần.

## Ghi chú về cỡ bước

Kỹ năng lập kế hoạch khuyến nghị mỗi bước chạm không quá 5 file. Kế hoạch này **cố ý lệch**:
bước 9 chạm 20 file, bước 12 chạm 14 file. Lý do và cách bù:

- Đơn vị công việc tự nhiên ở đây là **một khu vực**, vì cổng C14 và C15 bật hoặc tắt theo thư
  mục, không theo file. Chia nhỏ hơn khu vực thì không có cổng máy nào xác nhận từng phần.
- Bù lại: [`todo.md`](todo.md) liệt kê **từng file** thành một ô tick riêng, kèm số đo của file
  đó, nên đơn vị theo dõi vẫn là một file.
- Bước lớn nhất trong bản nháp đầu — dịch 1.420 tên mục, chạm 134 file — đã bị bỏ hẳn theo
  quyết định thiết kế 2.

---

## Quy trình chuẩn cho một file — chín việc, đúng thứ tự

Mọi bước từ 5 tới 20 áp đúng quy trình này cho từng file. Đây là phần trả lời cho câu hỏi "phải
làm gì, theo thứ tự nào".

**Việc 1 — Đọc hết file trước khi sửa dòng nào.** Ghi lại ba con số của file đó từ bảng trong
[`todo.md`](todo.md): bao nhiêu ký hiệu, bao nhiêu chữ viết tắt, bao nhiêu tham chiếu trần. Đó
là số ô phải về 0.

**Việc 2 — Không đụng frontmatter.** Chín trường ở đầu file giữ nguyên từng ký tự, kể cả
`reviewed`. Task này đổi cách viết, không đổi độ chín của hợp đồng. Đọc `owns` và `depends_on`
để biết file chịu trách nhiệm gì và trỏ đi đâu — thông tin đó cần cho việc 6.

**Việc 3 — Mục 1, Mục tiêu.** Đọc lại và bảo đảm nó trả lời được ba câu: outcome của ai, giá trị
gì, vì sao tồn tại. Dài 3 tới 6 câu. Nếu mục này khó hiểu thì cả file khó hiểu, nên sửa nó trước.

**Việc 4 — Thay ký hiệu, từng chỗ một.** Theo bảng ở
[`04-readability-spec.md`](04-readability-spec.md) mục 4.1. Sau mỗi lần thay, **đọc lại cả câu**.
Dấu phủ định emoji thường nằm giữa câu, nên thay thẳng bằng chữ "không" hay tạo ra câu cụt —
phần lớn trường hợp phải tách thành hai câu. Xem ví dụ ở mục 4.6 của đặc tả.

Chỉ đổi ký hiệu. **Không** đổi thuật ngữ đứng cạnh nó — xem việc 5.

**Việc 5 — Giữ nguyên thuật ngữ chuyên môn tiếng Anh.** Đây là việc **không làm gì**, và nó là
việc dễ vi phạm nhất. Trong lúc viết lại câu, phản xạ tự nhiên là dịch luôn `partition` thành
"phân mảnh", `feature flag` thành "cờ tính năng", `KPI` thành "chỉ số theo dõi". Không làm vậy.
Danh sách thuật ngữ giữ nguyên và ba nhóm phân biệt ở mục 4.3 của đặc tả; bảng sáu lỗi dịch quá
tay đã mắc trong bản nháp cũng ở đó, dùng làm ca đối chiếu.

Việc duy nhất được phép làm với thuật ngữ: **chú giải một lần** ở lần nhắc đầu tiên trong mỗi
file, với sáu thuật ngữ ít phổ biến là `ZPD`, `LO`, `KPI`, `idempotency`, `rollup`, `paywall`.

**Việc 5b — Thay chữ viết tắt tự phát.** Theo bảng ở mục 4.2 của đặc tả. Nhóm `DMO`, `SIB`,
`SCT`, `SPT`, `TAX`, `GTC`, `CLC` thay bằng tên file thật kèm liên kết, tức làm luôn việc 6 cho
chỗ đó. Chữ `OQ` thay bằng "câu hỏi còn mở".

Phân biệt với việc 5: `DMO` là **viết tắt tự phát của một tên file** nên bỏ. `KPI` là **thuật
ngữ chuyên môn** nên giữ. Thử bằng câu hỏi: người ngoài dự án có tra được nghĩa của nó không?
Tra được thì là thuật ngữ, giữ. Không tra được thì là viết tắt tự phát, bỏ.

**Việc 6 — Đổi tham chiếu trần thành liên kết.** Mọi chuỗi backtick khớp tên một file spec phải
thành liên kết markdown, đường dẫn tương đối, kèm số mục nếu đang nói về chỗ cụ thể. Viết "mục
7.3" chứ không viết ký hiệu tiết mục. Với mã nguồn thì trỏ dạng `đường-dẫn:số-dòng`.

**Việc 7 — Mã hợp đồng phải kèm tên đọc được.** Lần nhắc **đầu tiên** trong mỗi file của một mã
`BR-*`, một mã lỗi, hay một mã quyết định `D-*` phải kèm tên: viết "quy tắc `BR-GAT-01` — kiểm
quyền ở tầng server, không kiểm ở trình duyệt". Những lần nhắc sau trong cùng file dùng mã trần
được. Sổ đăng ký tên nằm ở
[`business-rules.md`](../specs/00-foundation/business-rules.md), làm ở bước 5.

**Việc 8 — Ô "vì sao" trống thì điền.** Kiểm tra C6 đang ở mức cảnh báo nên corpus vẫn xanh dù
có 213 ô trống. Gặp thì điền, và lý do phải nói **hậu quả cụ thể**, không nói "để đảm bảo tính
toàn vẹn". Không bắt buộc, nhưng đây là dịp tự nhiên nhất.

**Việc 9 — Chạy cổng và đọc diff.** `pnpm lint:specs` phải exit 0. Đọc diff của file vừa sửa,
từng dòng, tự hỏi một câu duy nhất: **có chỗ nào đổi nghĩa không**. Nếu có, hoàn tác chỗ đó.

Ba thứ **không** làm trong quy trình này: đổi mã định danh, đổi số liệu đã ghi, mở lại câu hỏi
đã đóng. Ranh giới đầy đủ ở [`04-readability-spec.md`](04-readability-spec.md) mục 6.

---

## Giai đoạn 1 — Dựng nền đo được

### Bước 1 — Script kiểm kê ký hiệu và chữ viết tắt

**Nội dung.** Trước khi sửa phải biết chính xác sửa bao nhiêu chỗ và ở đâu. Script đọc corpus,
bỏ nội dung trong khối mã, và in bảng số lượng theo từng ký hiệu, từng chữ viết tắt, từng file.
Bản nháp của script đã chạy khi viết kế hoạch này và cho ra các số ở bảng trên; bước 1 là đưa nó
vào repo thành một lệnh chạy lại được.

**Tiêu chí chấp nhận**
- `pnpm inventory:symbols` in ba bảng: theo ký hiệu, theo chữ viết tắt, theo file. Nhận một tham
  số tuỳ chọn để lọc theo thư mục.
- Phân biệt được `SIB` đứng một mình với `SIB` trong mã `BR-SIB-05`, và với `SIB` trong khối mã.
- Tổng khớp bảng ở trên: 2.925 ký hiệu, 155 chữ viết tắt, 1.212 tham chiếu trần trên 151 file.
  Lệch thì phải giải thích lệch ở đâu trước khi đi tiếp.

**Cách xác minh**
- `pnpm inventory:symbols` exit 0.
- Đối chiếu tay: chọn [`access-gating.md`](../specs/04-play/access-gating.md), script báo 5 ký
  hiệu và 2 tham chiếu trần. Đếm tay, phải khớp.
- `pnpm test` không giảm dưới 81.

**Phụ thuộc.** Không có.

**File sẽ chạm.** `scripts/inventory-symbols.ts` là file mới ·
[`package.json`](../../package.json) thêm một dòng script.

**Cỡ.** Nhỏ, 2 file.

### Bước 2 — Hai kiểm tra tự động mới, C14 và C15

**Nội dung.** C14 cấm ký hiệu emoji trong văn xuôi. C15 buộc mọi lần nhắc tên một file spec phải
là liên kết bấm được. Cả hai nhận danh sách thư mục hoãn, theo quyết định thiết kế 1.

Điểm quan trọng nhất: **cả hai phải đỏ ngay lần chạy đầu**, trên corpus chưa sửa gì. Bộ nhớ dự
án đã ghi hai lần bài học ngược lại — `ultracite check` trả exit 0 trong khi vẫn còn lỗi lint, và
`dependency-cruiser` có cấu hình loại trừ làm hai phần ba quy tắc thành vô dụng. Một script mới
mà xanh ngay là dấu hiệu nó không đo gì.

**Đo được 2026-08-07, khi viết chính kế hoạch này:** kiểm tra C4 **không** bỏ qua khối mã. Bản
nháp đầu của [`04-readability-spec.md`](04-readability-spec.md) có bốn đường dẫn minh hoạ trong
khối mã, và C4 báo đúng bốn lỗi. Ba hệ quả:

- Hành vi giữa C4, C9, C10 đang không nhất quán. C9 và C10 có ngữ cảnh bỏ qua, C4 thì không.
- Mọi ví dụ trong tài liệu có chứa liên kết markdown phải dùng đường dẫn resolve thật, tính từ
  chính file chứa ví dụ. Quy tắc này ghi vào
  [`../specs/CONVENTIONS.md`](../specs/CONVENTIONS.md) ở bước 3.
- C14 và C15 phải chọn dứt khoát một hành vi và ghi lý do ngay trong mã. Chọn: cả hai **bỏ qua**
  khối mã, vì ký hiệu trong ví dụ "trước khi sửa" là nội dung hợp lệ cần giữ.

**Tiêu chí chấp nhận**
- C14 trên corpus chưa sửa, danh sách hoãn rỗng: đỏ, **2.925** vị trí.
- C15 trên corpus chưa sửa, danh sách hoãn rỗng: đỏ, **1.212** vị trí, mỗi lỗi in đường dẫn
  tương đối nên dùng.
- Sáu ca âm ở [`04-readability-spec.md`](04-readability-spec.md) mục 5.2 đều là unit test thật
  trong [`scripts/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts) và đều đạt.
- Danh sách hoãn ban đầu chứa chín khu vực cộng `docs/taxonomy/` cộng `docs/tasks/`.
- Bật danh sách hoãn đầy đủ: `pnpm lint:specs` exit 0, in "15 checks".

**Cách xác minh**
- Gỡ tạm một khu vực khỏi danh sách hoãn, chạy lại: đỏ. Đặt lại: xanh. Ghi kết quả vào
  [`todo.md`](todo.md).
- `pnpm test` ít nhất 87, tức 81 cũ cộng 6 ca âm.
- Ca âm nối cổng: gỡ `lint:specs` khỏi `check` trong [`package.json`](../../package.json), xác
  nhận `pnpm check` không còn kiểm corpus, đặt lại ngay.

**Phụ thuộc.** Bước 1.

**File sẽ chạm.** [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) ·
[`scripts/tests/lint-specs.test.ts`](../../scripts/tests/lint-specs.test.ts) ·
[`../specs/CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 10 cập nhật từ 13 lên 15 kiểm tra.

**Cỡ.** Vừa, 3 file nhưng logic mới đáng kể.

### Cổng dừng A — người duyệt trước khi động vào nội dung

- `pnpm check` exit 0, working tree sạch.
- C14 và C15 chứng minh được là đỏ khi gỡ hoãn, xanh khi đặt lại.
- Sáu ca âm đạt.
- Người duyệt xác nhận: được phép bắt đầu sửa nội dung.

---

## Giai đoạn 2 — Quy ước trước, nội dung sau

Quy tắc `BR-RBS-08` của [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) nêu: đổi
hợp đồng thì đổi đặc tả trước. Văn phong là một hợp đồng, nên hai file quy ước đổi trước 130 file
nội dung.

### Bước 3 — Chương văn phong trong CONVENTIONS.md, và TEMPLATE.md

**Nội dung.** Thêm vào [`../specs/CONVENTIONS.md`](../specs/CONVENTIONS.md) một chương ghi: hai
bảng thay thế ở [`04-readability-spec.md`](04-readability-spec.md) mục 4.1 và 4.2, **quy tắc
thuật ngữ chuyên môn giữ nguyên tiếng Anh** ở mục 4.3 kèm cả ba nhóm và danh sách sáu lỗi dịch
quá tay, quy tắc tham chiếu file ở mục 4.5, quy tắc "mã hợp đồng luôn kèm tên đọc được", quy tắc
"đường dẫn trong ví dụ phải resolve thật vì C4 quét cả khối mã", và **chín việc của quy trình
chuẩn** ở trên.

`CONVENTIONS.md` mục 8 hiện đã có một câu về việc này: *"Tiếng Việt cho prose; tiếng Anh chính
xác cho path, enum, tên field, tên bảng."* Câu đó đúng nhưng chỉ nói về **định danh**, không nói
về **thuật ngữ**. Đó chính là kẽ hở làm bản nháp đầu của kế hoạch dịch `partition` thành "phân
mảnh". Chương mới phải bịt kẽ hở đó bằng danh sách thuật ngữ cụ thể.

[`../specs/TEMPLATE.md`](../specs/TEMPLATE.md) **không đổi tên mục** — chỉ rà lại cho khớp quy
ước mới ở phần khác nếu có.

**Tiêu chí chấp nhận**
- `CONVENTIONS.md` có chương văn phong, và chính nó viết theo văn phong đó.
- Chương đó có danh sách thuật ngữ giữ nguyên, đủ cả ba nhóm.
- Danh sách kiểm tra review ở `CONVENTIONS.md` mục 10 thêm bốn ô: không còn ký hiệu · mọi tham
  chiếu là liên kết · mọi mã hợp đồng kèm tên đọc được · không thuật ngữ nào bị dịch.
- Mười một tên mục ở `CONVENTIONS.md` mục 4 và `TEMPLATE.md` **giữ nguyên tiếng Anh**.

**Cách xác minh.** `pnpm lint:specs` exit 0 · đọc `CONVENTIONS.md` không thấy ký hiệu emoji nào
ngoài khối mã · hằng số `FULL_SECTIONS` ở
[`scripts/lint-specs-lib.ts:297`](../../scripts/lint-specs-lib.ts) không bị chạm.

**Phụ thuộc.** Bước 2.
**File sẽ chạm.** 2 file.
**Cỡ.** Nhỏ.

### Bước 4 — Sửa bốn file đặt tên mục lệch khuôn

**Nội dung.** Kiểm tra C3 đang cảnh báo bốn chỗ đặt tên mục riêng thay vì tên chuẩn:

| File và dòng | Đang ghi | Phải thành |
|---|---|---|
| [`glossary.md:128`](../specs/00-foundation/glossary.md) | `## 8. Từ bị cấm` | `## 8. API contract` |
| [`mvp-scope.md:105`](../specs/00-foundation/mvp-scope.md) | `## 8. Vĩnh viễn ngoài phạm vi` | `## 8. API contract` |
| [`ai-codegen-pipeline.md:84`](../specs/01-platform/ai-codegen-pipeline.md) | `## 5. Vùng cấm — AI ❌ không sinh code` | `## 5. Alternative flows` |
| [`security-checklist.md:62`](../specs/08-quality/security-checklist.md) | `## 7. Checklist` | `## 7. Data` |

Nội dung bên trong bốn mục đó **không đổi**. Chỉ đổi dòng tiêu đề. Tên riêng đang mang thông tin
— ví dụ "Vùng cấm" nói rằng mục này liệt kê thứ AI không được sinh — nên chuyển thông tin đó
thành câu đầu tiên của mục, đừng vứt đi.

**Vì sao làm ngay ở đây, trước khi sửa nội dung.** Bốn cảnh báo này có sẵn từ trước task. Nếu để
lại, mọi đợt sau đều thấy C3 cảnh báo bốn chỗ và không phân biệt được cảnh báo cũ với lỗi mới do
đợt đó gây ra. Đưa C3 về 0 cảnh báo là dựng một mốc sạch để đo.

**Tiêu chí chấp nhận**
- Kiểm tra C3 in **0 cảnh báo**, giảm từ 4 xuống 0.
- Diff chỉ chạm bốn dòng tiêu đề, cộng tối đa bốn câu thêm vào thân mục.
- Không file nào đổi `status` hay `reviewed` — hai trong bốn file đang `approved`.

**Cách xác minh.** `pnpm lint:specs` exit 0, 0 cảnh báo C3 · số spec `approved` vẫn 23.

**Phụ thuộc.** Bước 3.
**File sẽ chạm.** 4 file.
**Cỡ.** Nhỏ.

### Cổng dừng B — chốt văn phong trên ba file mẫu

Trước khi cán 130 file, người duyệt phải xác nhận văn phong mới đúng ý. Ba file mẫu chọn theo ba
loại khác nhau, không phải ba file giống nhau:

| File | Vì sao chọn | Số đo |
|---|---|---|
| [`access-gating.md`](../specs/04-play/access-gating.md) | Dày business rule, có ma trận gating 20 ô | 5 ký hiệu, 1 viết tắt, 2 tham chiếu trần |
| [`business-rules.md`](../specs/00-foundation/business-rules.md) | Sổ đăng ký, nhiều tham chiếu nhất corpus | 49 ký hiệu, 131 tham chiếu trần |
| [`pdf-export.md`](../specs/07-addon/pdf-export.md) | Khuôn rút gọn 7 mục, không phải 11 | 5 ký hiệu |

Viết lại đủ ba file theo chín việc của quy trình chuẩn, đọc diff từng dòng, rồi người duyệt trả
lời một câu: văn phong này đúng ý chưa. Nếu chưa, sửa bảng thay thế ở bước 3 rồi làm lại ba file.
Chi phí sai ở đây là ba file; chi phí sai sau bước 13 là 130 file.

---

## Giai đoạn 3 — Viết lại từng khu vực trong `docs/specs/`

Mỗi bước từ 5 tới 13 làm bốn phần:

1. Áp **chín việc của quy trình chuẩn** cho từng file, theo thứ tự file ghi trong
   [`todo.md`](todo.md), tức file dày nhất trước.
2. Xoá khu vực đó khỏi danh sách hoãn của C14 và C15, trong cùng commit.
3. Chạy `pnpm check` và `pnpm test`, phải xanh.
4. Chạy `pnpm inventory:symbols <khu vực>`, phải báo 0.

Tiêu chí chấp nhận chung cho cả chín bước:

- C14 và C15 xanh cho khu vực vừa làm, sau khi đã gỡ khỏi danh sách hoãn.
- Số spec `approved` không đổi. Trường `status` và `reviewed` của mọi file không đổi.
- Số cảnh báo `lint:specs` không tăng.
- Đọc diff từng dòng, không quyết định nào đổi nghĩa.

### Bước 5 — `00-foundation`, 16 file, 390 ký hiệu

**Vì sao làm trước.** Hợp đồng cắt ngang, mọi khu vực khác trích dẫn. Chuẩn hoá ở đây trước thì
các khu vực sau chỉ việc trỏ liên kết tới bản đã chuẩn.

**Đặc điểm khu vực.** Chứa 206 tham chiếu trần, trong đó **131 nằm riêng trong**
[`business-rules.md`](../specs/00-foundation/business-rules.md) — file này là sổ đăng ký mã quy
tắc, nên mỗi dòng của nó nhắc một spec. Đây cũng là chỗ tự nhiên để đặt **tên đọc được cho từng
mã một lần**, rồi 130 file kia trỏ về. Làm file này trước trong khu vực.

Ba file nặng tiếp theo: [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) 43 ký
hiệu và 18 tham chiếu trần, [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md)
45 ký hiệu, [`payment-flow.md`](../specs/00-foundation/payment-flow.md) 44 ký hiệu.

**Cảnh báo.** 12 trong 16 file ở khu vực này đang `status: approved`. Không đổi `status`, không
đổi `reviewed`, không mở lại câu hỏi đã đóng — kể cả những câu đã bị đảo hai lượt như
[`event-catalog.md`](../specs/00-foundation/event-catalog.md) mục 11 câu 2 và
[`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) mục 11 câu 10 (ba lượt).

**Phụ thuộc.** Bước 4 và Cổng dừng B.
**Cỡ.** Lớn, 15 file còn lại sau khi trừ file đã làm ở Cổng dừng B.

### Bước 6 — `01-platform` phần một, 14 file về dữ liệu, 302 ký hiệu

**Nội dung khu vực.** [`data-model-overview.md`](../specs/01-platform/data-model-overview.md),
ba file `schema-*`, [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md),
[`game-template-contract.md`](../specs/01-platform/game-template-contract.md), và các file về
lưu trữ, gieo dữ liệu, tìm kiếm, gắn thẻ, telemetry.

**Vì sao tách riêng.** Đây là nơi tập trung gần như toàn bộ chữ viết tắt tự phát. Làm chúng cùng
lúc thì bảng thay thế áp một lần, nhất quán.

**Cảnh báo.** Mục 7.3 của
[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) giữ 17 dòng ràng buộc chờ
mà bước 8 của lộ trình sẽ đọc lại trước khi viết cột Drizzle. Giữ nguyên **từng ràng buộc**, kể
cả ngưỡng số như "5 triệu hàng" và "2 GB". Bảy spec trong khu vực này vừa duyệt ở Task #3.

**Kiểm riêng cho bước này.** `pnpm inventory:symbols specs/01-platform` báo 0 chữ viết tắt.

**Phụ thuộc.** Bước 5.
**Cỡ.** Lớn, 14 file.

### Bước 7 — `01-platform` phần hai, 13 file về vận hành, 183 ký hiệu

**Nội dung khu vực.** Auth token và session, OAuth provider registry, rate limiting, audit log,
backup và restore, monitoring, health check, job queue, notification service, feature flag, AI
codegen pipeline, offline play, PWA install.

**Ba file nặng nhất.** [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md)
45 ký hiệu, [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) 46 ký hiệu,
[`audit-log.md`](../specs/01-platform/audit-log.md) 41 ký hiệu.

**Phụ thuộc.** Bước 6.
**Cỡ.** Lớn, 13 file.

### Cổng dừng C — sau hai khu vực nặng nhất

- `pnpm check` exit 0 · `pnpm test` không giảm dưới 88.
- C14 và C15 xanh trên `00-foundation/` và `01-platform/`, hai thư mục đã ra khỏi hoãn.
- `pnpm inventory:symbols` báo hai khu vực này về 0 cho cả ba loại vấn đề.
- Số spec `approved` vẫn 23, không file nào đổi `status` hay `reviewed`.
- Số cảnh báo không tăng quá 213.
- Người duyệt đọc diff một file bất kỳ trong bước 6, xác nhận không đổi nghĩa.

### Bước 8 — `04-play` 13 file và `05-content` 5 file, 199 ký hiệu

**Nội dung.** Bề mặt trẻ chơi, và năm mô hình nội dung.

**Ba file nặng nhất.** [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) 23
ký hiệu và 7 tham chiếu trần, [`parent-gate.md`](../specs/04-play/parent-gate.md) 19 ký hiệu,
[`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) 19 ký hiệu.

**Đặc điểm.** Khu vực nhẹ nhất về tham chiếu trần, chỉ 30 chỗ trên 18 file. Chín lượt `KPI` ở
đây **giữ nguyên** — đó là thuật ngữ, không phải viết tắt tự phát. Việc duy nhất cần làm với nó
là chú giải một lần ở lần nhắc đầu trong mỗi file, theo việc 5 của quy trình chuẩn. Chúng tập
trung ở [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) và
[`parent-gate.md`](../specs/04-play/parent-gate.md).

**Phụ thuộc.** Bước 5.
**Cỡ.** Lớn, 17 file còn lại.

### Bước 9 — `03-account`, 20 file, 274 ký hiệu

**Đặc điểm.** Khu vực **sạch nhất** về chữ viết tắt: 0 lượt. Cũng ít tham chiếu trần, chỉ 18 chỗ
trên 20 file. Nhưng 274 ký hiệu, và hai phần ba nằm ở hai file.

**Hai file chiếm một phần ba khối lượng.**
[`social-login.md`](../specs/03-account/social-login.md) 49 ký hiệu và
[`social-account-linking.md`](../specs/03-account/social-account-linking.md) 37 ký hiệu. Mười
tám file còn lại trung bình 10 ký hiệu mỗi file, tức làm rất nhanh sau khi xong hai file đầu.

**Phụ thuộc.** Bước 5.
**Cỡ.** Lớn, 20 file.

### Bước 10 — `02-public` 9 file và `08-quality` 5 file, 204 ký hiệu

**Đặc điểm.** Hai khu vực nhỏ, gộp một bước. `08-quality` có mật độ ký hiệu cao nhất corpus tính
theo dòng: 102 ký hiệu trên 903 dòng, vì nó toàn danh sách kiểm tra dạng đạt hoặc không đạt.

**Ba file nặng nhất.**
[`design-system-contract.md`](../specs/08-quality/design-system-contract.md) 31 ký hiệu,
[`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md) 24 ký hiệu,
[`security-checklist.md`](../specs/08-quality/security-checklist.md) 20 ký hiệu.

**Lưu ý cách viết.** Danh sách đạt hoặc không đạt là chỗ mà bảng nhị phân thật sự hợp lý. Ở đây
"Có" và "Không" viết thành chữ trong ô bảng, đúng bảng thay thế — không cần diễn đạt lại thành
câu.

**Phụ thuộc.** Bước 5.
**Cỡ.** Lớn, 14 file.

### Bước 11 — `06-admin` phần một, 14 file về nội dung và studio

**Nội dung.** Game level studio, lesson authoring, activity authoring, curriculum builder,
content review queue, publish và version, live preview, schema-driven form, image upload, emoji
picker, asset usage tracking, taxonomy browser, SEO content admin, data export.

**File nặng nhất.** [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) 15 ký hiệu và
2 tham chiếu trần. Khu vực này phân bố khá đều, không có file nào áp đảo.

**Phụ thuộc.** Bước 5.
**Cỡ.** Lớn, 14 file.

### Bước 12 — `06-admin` phần hai, 14 file về người dùng và vận hành

**Nội dung.** Admin auth, admin dashboard, user management, user detail, child profile admin,
entitlement grant, package catalog admin, payment queue, payment approval, audit log viewer,
error log viewer, system activity, feature flags, notification admin.

**Hai file nặng nhất.** [`admin-auth.md`](../specs/06-admin/admin-auth.md) 29 ký hiệu và
[`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md) 23 ký hiệu — gộp lại chiếm
hơn một phần ba khu vực.

**Phụ thuộc.** Bước 11.
**Cỡ.** Lớn, 14 file.

### Bước 13 — `07-addon`, 7 file, 99 ký hiệu

**Đặc điểm.** Khuôn rút gọn 7 mục thay vì 11, xem
[`../specs/CONVENTIONS.md`](../specs/CONVENTIONS.md) mục 4. Tỷ lệ tham chiếu trần cao bất thường:
33 chỗ trên 7 file, và **24 nằm riêng trong**
[`semantic-search.md`](../specs/07-addon/semantic-search.md).

Một ngoại lệ đáng chú ý: [`semantic-search.md`](../specs/07-addon/semantic-search.md) có 11 tên
mục, tức nó đang dùng khuôn đầy đủ chứ không phải khuôn rút gọn như sáu file còn lại. Kiểm lại
xem đó là cố ý hay là lỗi; nếu là lỗi thì báo, **không** tự sửa cấu trúc mục.

**Phụ thuộc.** Bước 5.
**Cỡ.** Vừa, 6 file còn lại.

### Cổng dừng D — hết `docs/specs/` phần khu vực

- Danh sách hoãn của C14 và C15 chỉ còn 6 file quy ước, `docs/taxonomy/`, và `docs/tasks/`.
- `pnpm lint:specs` exit 0 với 15 kiểm tra, 130 spec, 0 lỗi, cảnh báo không quá 213.
- `pnpm inventory:symbols specs` báo 0 cho cả chín khu vực.
- Số spec `approved` vẫn 23.
- Người duyệt đọc diff một khu vực chưa từng xem, xác nhận đạt.

---

## Giai đoạn 4 — Tài liệu ngoài chín khu vực

### Bước 14 — `docs/SPEC.md`, 1.287 dòng, 93 ký hiệu

**Nội dung.** File nhiều người đọc nhất, là điểm vào dự án theo
[`../specs/READING-GUIDE.md`](../specs/READING-GUIDE.md) mục 1.

**Cảnh báo.** Mục 13 chứa danh sách cổng ra từng phase, trong đó có ba dòng neo vừa thêm ở
Task #3. Giữ nguyên **từng dòng**, chỉ đổi cách viết. Kiểm tra C11 đối chiếu số spec khai trong
file với filesystem — đổi cách viết không được làm lệch số.

**Phụ thuộc.** Cổng dừng D.
**Cỡ.** Vừa, 1 file lớn.

### Bước 15 — `index.md`, `roadmap.md`, `AUDIT-v1.md`

**Đặc điểm.** Ba file này gần như không có ký hiệu (32, 1, 4) nhưng có **213 tham chiếu trần** —
`roadmap.md` 104 chỗ và `AUDIT-v1.md` 104 chỗ. Đó là bản chất của chúng: cả hai đều là bảng liệt
kê tên spec. Bước này chủ yếu là việc 6 của quy trình chuẩn, làm hàng loạt.

[`index.md`](../specs/index.md) bị kiểm tra C11 đối chiếu số lượng spec — đổi cách viết không
được làm lệch số.

**Phụ thuộc.** Bước 14.
**Cỡ.** Vừa, 3 file.

### Bước 16 — `docs/taxonomy/`, 8 file, 221 ký hiệu

**Nội dung.** Registry 6 năng lực, 41 nhánh, 230 kỹ năng. Không phải spec — không có frontmatter,
không có 11 mục — nên kiểm tra C1 và C3 không áp. Chỉ C14 áp.

**Cảnh báo nghiêm ngặt.** Quy tắc `BR-TAX-09` của
[`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) mục 6 buộc dữ liệu seed khớp
**chính xác** ba con số 6, 41, 230 với các file này. Viết lại được phép đổi câu chữ mô tả, nhưng
**không** được đổi: số lượng mục, mã kỹ năng, tên kỹ năng, thứ tự. Sau bước này phải đếm lại 6,
41, 230 và ghi kết quả.

**Ba file nặng nhất.**
[`c1-mathematical-thinking.md`](../taxonomy/c1-mathematical-thinking.md) 98 ký hiệu trên 197
dòng — mật độ cao nhất corpus, [`c2-spatial-thinking.md`](../taxonomy/c2-spatial-thinking.md) 44,
[`c3-logical-thinking.md`](../taxonomy/c3-logical-thinking.md) 30.

**Phụ thuộc.** Bước 15.
**Cỡ.** Lớn, 8 file.

### Bước 17 — Thu gọn `READING-GUIDE.md`

**Nội dung.** File này viết ngày 2026-08-07 để **giải mã** ký hiệu. Sau bước 16 thì không còn ký
hiệu để giải mã, nên mục 4 thành thừa. Các mục còn lại vẫn có giá trị: thứ tự đọc, cách hiểu
frontmatter, phân biệt Lớp 1 với Lớp 2, bảng mã dữ liệu, danh sách kiểm tra, các phase, danh sách
từ bị cấm, ba lỗi đọc thường gặp.

**Vì sao làm sau cùng trong nhóm này.** Chỉ khi đã bỏ hết ký hiệu thật mới biết chắc mục nào
thừa. Bỏ sớm thì mất từ điển trong lúc vẫn còn ký hiệu.

**Tiêu chí chấp nhận**
- Mục 4, bảng giải mã ký hiệu, bỏ hẳn.
- Mục 8, giải mã văn phong, giữ nhưng bỏ phần nói về ký hiệu.
- Mục 5 cập nhật từ 13 lên 15 kiểm tra.
- Mọi liên kết còn resolve, kiểm tra C4 xanh.

**Phụ thuộc.** Bước 16.
**Cỡ.** Nhỏ, 1 file.

---

## Giai đoạn 5 — Hồ sơ task

Đây là phần người dùng chỉ đích danh: hồ sơ task phải đọc được để hiểu *phải làm gì, theo thứ tự
nào, nội dung ra sao*. Sáu hồ sơ cũ chiếm 592 ký hiệu, 107 chữ viết tắt, 501 tham chiếu trần —
cụm dày nhất corpus.

### Khuôn chung cho một hồ sơ task sau khi viết lại

Ngoài chín việc của quy trình chuẩn, mỗi hồ sơ task được thêm **một mục mới ở đầu file**, đặt
ngay sau tiêu đề:

```markdown
## Kết quả cuối cùng

**Task này làm gì:** <hai tới ba câu>
**Kết thúc ngày:** <ngày tuyệt đối>
**Đo được lúc đóng:** <các con số thật>
**Còn nợ lại:** <danh sách, mỗi món trỏ tới chỗ đang theo dõi nó>
**Đọc tiếp:** <liên kết tới hồ sơ task kế tiếp>
```

Lý do thêm mục này: hồ sơ hiện tại bắt người đọc suy kết quả từ 400 ô tick rải rác. Ai mở
[`03-schema-contract-todo.md`](03-schema-contract-todo.md) hôm nay phải đọc 438 dòng mới biết
task đó kết thúc ra sao và còn nợ gì.

Hai thứ **không** đổi trong hồ sơ lưu trữ: trạng thái ô tick, và nội dung quyết định. Một ô chưa
tick thì vẫn để chưa tick — sổ ghi sai sự thật còn tệ hơn sổ khó đọc.

### Bước 18 — Hồ sơ Task #3, 2 file, 644 vấn đề

**Nội dung.** [`03-schema-contract-plan.md`](03-schema-contract-plan.md) 629 dòng và
[`03-schema-contract-todo.md`](03-schema-contract-todo.md) 438 dòng. Hai file dày nhất corpus.

**Cụ thể phải xử lý những gì**

| Thứ phải bỏ | Số lượt | Thay bằng |
|---|---:|---|
| Chú giải ký hiệu ở đầu file, dòng 8 tới 9 của plan | 1 khối | Bỏ hẳn. Không còn ký hiệu thì không cần chú giải |
| Ký hiệu emoji | 316 | Bảng thay thế mục 4.1 của đặc tả |
| `OQ` | 18 | "câu hỏi còn mở" |
| Viết tắt tên file: `DMO` 28, `SIB` 13, `SPT` 9, `SCT` 3, `TAX` 1, `GTC` 1, `CLC` 1 | 56 | Tên file thật, kèm liên kết |
| Tham chiếu trần | 254 | Liên kết có số mục |
| Ký hiệu bước `T0`, `T4b`, `T11` | khoảng 40 | "Bước 0", "Bước 4b", "Bước 11" |
| Ký hiệu mâu thuẫn `M1` tới `M11` | khoảng 30 | "Mâu thuẫn 1" tới "Mâu thuẫn 11" |
| Mã quyết định `D-Y` tới `D-AE` | khoảng 60 | Giữ mã, thêm tên ở lần nhắc đầu mỗi file |

**Cảnh báo về mã quyết định.** Bảy spec đang trích mã `D-*` từ hai file này —
[`data-model-overview.md`](../specs/01-platform/data-model-overview.md) mục 7.3 có cả một bảng
trỏ sang. Giữ nguyên mã. Chỉ thêm tên đọc được.

**Nợ đã biết, không sửa ở đây.** Mã `D-X` bị dùng cho 11 quyết định khác nhau ở Task #2. Viết lại
không giải quyết được chuyện đó, và đổi mã sẽ làm hỏng mọi chỗ đang trích. Ghi rõ trong mục "Kết
quả cuối cùng" của [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) rằng đây là
nợ đang theo dõi.

**Phụ thuộc.** Bước 17.
**Cỡ.** Vừa về số file, lớn về khối lượng.

### Bước 19 — Hồ sơ Task #1 và Task #2, 4 file

**Nội dung.** [`01-bootstrap-plan.md`](01-bootstrap-plan.md) 418 dòng ·
[`01-bootstrap-todo.md`](01-bootstrap-todo.md) 171 dòng ·
[`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) 477 dòng ·
[`02-foundation-approve-todo.md`](02-foundation-approve-todo.md) 227 dòng.

**Đặc điểm.** [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) chứa 23 lượt `OQ`
— nhiều nhất corpus cho một file. Đây chính là file khiến chữ viết tắt đó lan ra chỗ khác.
[`01-bootstrap-todo.md`](01-bootstrap-todo.md) có 75 ký hiệu trên 171 dòng, mật độ cao nhất nhóm.

**Phụ thuộc.** Bước 18.
**Cỡ.** Lớn, 4 file.

### Bước 20 — Ba file của chính Task #4

**Nội dung.** [`04-readability-spec.md`](04-readability-spec.md), [`plan.md`](plan.md),
[`todo.md`](todo.md). Rà lại cho khớp quy ước cuối cùng, phòng khi bước 3 có điều chỉnh so với
bản đặc tả ban đầu.

**Hai việc cụ thể đã biết trước**

1. Chuyển 17 ký hiệu đang nằm trong các lệnh `grep` viết thẳng vào dòng văn xuôi của
   [`plan.md`](plan.md) và [`todo.md`](todo.md) vào trong khối mã.
2. Bọc hai bảng thay thế ở [`04-readability-spec.md`](04-readability-spec.md) mục 4.1 và 4.2
   trong khối mã, theo lối xử lý số 1 đã chọn ở mục 5.1 của đặc tả.

**Tiêu chí chấp nhận**
- Danh sách hoãn của C14 và C15 **rỗng hoàn toàn**, không còn một loại trừ nào.
- C14 và C15 xanh trên toàn corpus.

**Phụ thuộc.** Bước 19.
**Cỡ.** Vừa, 3 file.

### Cổng dừng E — đóng task

Toàn bộ tiêu chí ở [`04-readability-spec.md`](04-readability-spec.md) mục 7 phải đạt.

---

## Rủi ro

| Rủi ro | Mức | Cách giảm |
|---|---|---|
| Viết lại câu làm đổi nghĩa một rule, và cổng máy không bắt được vì nó chỉ đo sự vắng mặt của ký tự | **Cao** | Cấm thay thế hàng loạt. Việc 9 của quy trình chuẩn bắt đọc diff từng dòng. Bảng bất biến ở [`04-readability-spec.md`](04-readability-spec.md) mục 5.4 đo lại sau mỗi đợt. Cổng dừng C và D bắt người duyệt đọc một file cụ thể |
| **Dịch quá tay thuật ngữ chuyên môn.** Đã xảy ra một lần trong chính bản nháp của kế hoạch này: `partition` thành "phân mảnh", `feature flag` thành "cờ tính năng", `KPI` thành "chỉ số theo dõi". Không cổng máy nào bắt được — C14 chỉ đo ký hiệu, C15 chỉ đo liên kết | **Cao** | Việc 5 của quy trình chuẩn là một việc **không làm gì**, đặt riêng thành một bước chính vì nó dễ quên. Danh sách thuật ngữ và sáu ca đối chiếu ở [`04-readability-spec.md`](04-readability-spec.md) mục 4.3, chép vào [`../specs/CONVENTIONS.md`](../specs/CONVENTIONS.md) ở bước 3. Cổng dừng B kiểm điểm này trên ba file mẫu trước khi cán 130 file |
| C14 hoặc C15 xanh giả vì phân tích markdown lỏng nên không thấy gì | **Cao** | Bắt buộc đỏ ngay lần chạy đầu, số vị trí phải khớp **chính xác** 2.925 và 1.212. Sáu ca âm. Bài học đã ghi: `ultracite check` từng exit 0 khi vẫn còn lỗi |
| Còn vùng nào khác bị bỏ sót giống `docs/taxonomy/` | **Cao** | Đã xảy ra một lần trong chính task này. Bước 1 buộc script quét **toàn bộ** `docs/` chứ không quét theo danh sách thư mục viết tay, và in ra tổng số file đã quét. Con số đó phải khớp `find docs -name '*.md' | wc -l` |
| Diff bước 4 gồm 134 file, quá lớn để đọc thật | **Cao** | Commit riêng, thuần cơ học. Kiểm tra C3 là cổng máy cho đúng bước này. Thêm phép đo: số dòng thay đổi phải xấp xỉ 1.420 |
| Viết lại hồ sơ task lưu trữ làm sai lệch lịch sử — ví dụ tick một ô vốn chưa tick | **Cao** | Khuôn ở giai đoạn 5 ghi rõ: trạng thái ô tick không đổi. Kiểm bằng cách đếm số `- [x]` và `- [ ]` trước và sau, phải bằng nhau từng file |
| Bỏ ký hiệu làm mất tín hiệu quét nhanh: dấu phủ định emoji vốn để mắt bắt được lệnh cấm khi lướt | Trung bình | Bù bằng cấu trúc câu: câu cấm bắt đầu bằng "Không" hoặc "Cấm", đặt ở đầu ô hoặc đầu câu. Xem ví dụ ở [`04-readability-spec.md`](04-readability-spec.md) mục 4.5 |
| 1.212 liên kết mới, một phần sai đường dẫn tương đối | Trung bình | Kiểm tra C4 đã kiểm mọi liên kết nội bộ. C15 in sẵn đường dẫn đúng nên chép được. Chạy C4 sau mỗi bước |
| Đổi câu chữ trong `docs/taxonomy/` làm lệch ba con số 6, 41, 230 mà `BR-TAX-09` neo vào | Trung bình | Bước 16 bắt đếm lại và ghi kết quả. Không đổi mã kỹ năng, tên kỹ năng, thứ tự |
| Người duyệt chốt văn phong ở Cổng dừng B rồi đổi ý ở bước 12 | Trung bình | Cổng dừng B làm trên ba file thuộc ba loại khác nhau. Chi phí đổi ý ở B là ba file; ở bước 12 là toàn bộ đã làm |
| Task #3 còn hai ô chưa tick ở Cổng dừng D, dễ quên khi chuyển task | Thấp | Ô thứ nhất chuyển sang mục "Việc kế tiếp" của [`todo.md`](todo.md). Ô thứ hai ghi trong banner của [`03-schema-contract-todo.md`](03-schema-contract-todo.md) |
| 213 cảnh báo nền che một cảnh báo mới | Thấp | So số trước và sau mỗi bước. Tăng thì phải giải thích. Nợ cũ từ Task #2, theo dõi riêng |

## Ngoài phạm vi task này

| Việc | Vì sao để ngoài |
|---|---|
| Sửa nội dung hợp đồng: đổi quyết định, đổi tên cột, mở lại câu hỏi đã đóng | Task này đổi cách viết, không đổi điều được viết |
| `docs/montessori/`, 22 file PDF | Không phải văn bản markdown, không có ký hiệu để bỏ. Xem câu hỏi 5 của [`04-readability-spec.md`](04-readability-spec.md) mục 8 |
| Dọn 213 cảnh báo C6 thiếu cột "vì sao", và nâng C6 trở lại mức lỗi | Nợ từ Task #2. Việc 8 của quy trình chuẩn điền khi tiện, nhưng không đặt thành điều kiện đóng task |
| Bảy chu trình `depends_on` mà kiểm tra C7 đang cảnh báo | Không liên quan cách viết |
| Đổi tên mã `D-X` đang bị dùng cho 11 quyết định khác nhau | Nợ từ Task #2. Đổi mã sẽ hỏng mọi chỗ đang trích. Ghi vào mục "Kết quả cuối cùng" của hồ sơ Task #2 ở bước 19 |
| Sửa cấu trúc mục của [`semantic-search.md`](../specs/07-addon/semantic-search.md) nếu phát hiện nó dùng nhầm khuôn | Đổi cấu trúc là đổi hợp đồng. Bước 13 chỉ **báo**, không sửa |
| Bước 8 của lộ trình phase P0: viết `packages/db/src/schema/*.ts` và migration đầu tiên | Việc kế tiếp sau task này, xem [`todo.md`](todo.md) |
| Dịch tên bảng, tên cột, giá trị enum, mã lỗi sang tiếng Việt | Quy ước hiện hành giữ tiếng Anh cho định danh kỹ thuật, và điều đó vẫn đúng |

## Câu hỏi còn mở

Bốn câu hỏi ở [`04-readability-spec.md`](04-readability-spec.md) mục 8 chưa có người trả lời.
Câu 1, về bốn giả định, **chặn toàn bộ task** — không bắt đầu bước 1 khi chưa có câu trả lời.
Câu 3 đã đóng 2026-08-07: có viết lại hồ sơ task cũ, thành bước 18 và bước 19.

## Cách xác minh toàn task

```bash
cd kidthink
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH

# Cổng tự động
pnpm inventory:symbols   # mọi vùng về 0
pnpm lint:specs          # 15 kiểm tra, 130 spec, 0 lỗi, cảnh báo không quá 213
pnpm check               # lint, lint:tokens, lint:deps, lint:specs, typecheck
pnpm test                # ít nhất 89 test

# Ca âm bắt buộc — cổng không có ca âm là cổng chưa tồn tại
#  C14 : đặt một dấu phủ định emoji vào văn xuôi        -> exit 1, đúng số dòng
#  C14 : đặt cùng ký tự đó vào trong khối mã            -> im lặng
#  C15 : nhắc tên một file spec mà không đặt liên kết   -> exit 1, in đường dẫn nên dùng
#  C15 : nhắc tên đó dưới dạng liên kết đúng            -> im lặng
#  C3  : đảo thứ tự hai mục trong một fixture           -> exit 1

# Đo kết quả cuối
grep -rl '^status: approved' docs/specs --include='*.md' | wc -l         # 23
grep -rn 'G-C[1-6]-' docs/specs/ docs/SPEC.md | wc -l                    # 0
grep -rc '^## 1\. Mục tiêu' docs/specs --include='*.md' | grep -cv ':0'  # 130
find docs -name '*.md' | wc -l                                           # khớp số file script quét

# Hồ sơ task: số ô tick không đổi so với trước khi viết lại
grep -c '^- \[x\]' docs/tasks/03-schema-contract-todo.md                 # phải bằng số cũ
grep -c '^- \[ \]' docs/tasks/03-schema-contract-todo.md                 # phải bằng số cũ
```

**Điều kiện đóng Task #4.** Corpus không còn ký hiệu emoji làm ngữ nghĩa · không còn chữ viết tắt
tự phát · **không thuật ngữ chuyên môn nào bị dịch ra tiếng Việt**, và mười một tên mục vẫn
tiếng Anh · mọi lần nhắc tài liệu khác là liên kết bấm được có số mục · sáu hồ sơ task cũ có mục
"Kết quả cuối cùng" · hai kiểm tra mới xanh và có ca âm chứng minh chúng bắt được lỗi · 23 spec
`approved` không đổi trạng thái · số ô tick trong hồ sơ lưu trữ không đổi · hằng số
`FULL_SECTIONS` ở [`scripts/lint-specs-lib.ts:297`](../../scripts/lint-specs-lib.ts) không bị
chạm · người duyệt xác nhận văn phong đạt trên ít nhất hai khu vực.
