# Checklist — Task #4: Viết lại corpus theo ngôn ngữ tự nhiên

> Bản 2, viết 2026-08-07 sau khi đo per-file. Lý do, tiêu chí chấp nhận, đồ thị phụ thuộc và
> **quy trình chuẩn chín việc**: [`plan.md`](plan.md). Đặc tả: [`04-readability-spec.md`](04-readability-spec.md).
>
> Mọi lệnh chạy từ thư mục `kidthink/` và phải đặt lại đường dẫn Node trước, vì shell mặc định
> của máy là v20.17.0 còn dự án cần v24:
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`
>
> Tick ô **ngay khi làm xong**. Task #2 từng để lại một file 217 dòng toàn ô trống trong khi
> việc đã xong — đừng lặp lại.

## Đang chặn

- [x] **Câu hỏi 1 của [`04-readability-spec.md`](04-readability-spec.md) mục 8** — bốn giả định
      về phạm vi, tên mục, ký hiệu và mã định danh. Đóng 2026-08-07: người dùng chấp nhận cả bốn,
      không bác điểm nào. Bắt đầu bước 1.

## Thứ tự làm

```
Bước 1  -> Bước 2  -> Cổng dừng A
Bước 3  -> Bước 4  -> Cổng dừng B
Bước 5  -> { Bước 6 -> Bước 7 } | Bước 8 | Bước 9 | Bước 10 | { Bước 11 -> Bước 12 } | Bước 13
           Cổng dừng C sau bước 7 · Cổng dừng D sau bước 13
Bước 14 -> Bước 15 -> Bước 16 -> Bước 17
Bước 18 -> Bước 19 -> Bước 20 -> Cổng dừng E
```

Sáu nhánh sau bước 5 chạm thư mục khác nhau nên làm song song được. Trong mỗi bước, thứ tự file
đã xếp sẵn dưới đây theo **khối lượng giảm dần** — làm file dày nhất trước, vì nó buộc quyết
định nhiều nhất về cách diễn đạt, và các file sau chỉ việc theo.

## Nội dung phải làm cho mỗi file

Chi tiết đầy đủ ở [`plan.md`](plan.md) mục "Quy trình chuẩn cho một file":

1. Đọc hết file. Ghi lại ba con số của nó từ bảng dưới đây.
2. Không đụng frontmatter, kể cả `reviewed`.
3. Sửa mục 1 Objective trước — nếu nó khó hiểu thì cả file khó hiểu.
4. Thay ký hiệu, từng chỗ một, đọc lại cả câu sau mỗi lần thay.
5. **Giữ nguyên thuật ngữ chuyên môn tiếng Anh.** Việc "không làm gì", và là việc dễ vi phạm
   nhất — phản xạ tự nhiên khi viết lại câu là dịch luôn `partition`, `feature flag`, `KPI`.
   Danh sách thuật ngữ ở [`04-readability-spec.md`](04-readability-spec.md) mục 4.3.
5b. Thay chữ viết tắt tự phát. Thử phân biệt với việc 5 bằng câu hỏi: người ngoài dự án tra được
   nghĩa không? Tra được thì là thuật ngữ, giữ. Không tra được thì là viết tắt tự phát, bỏ.
6. Đổi tham chiếu trần thành liên kết có số mục.
7. Mã hợp đồng kèm tên đọc được ở lần nhắc đầu tiên trong file.
8. Ô "vì sao" trống thì điền, lý do phải nói hậu quả cụ thể.
9. Chạy `pnpm lint:specs`, đọc diff từng dòng, tự hỏi: có chỗ nào đổi nghĩa không.

**Tên mười một mục giữ nguyên tiếng Anh** — `Objective`, `Actors`, `Entry points`, `Main flow`,
`Alternative flows`, `Business rules`, `Data`, `API contract`, `Acceptance criteria`,
`Boundaries`, `Open questions` — cùng ba nhãn con `Always`, `Ask first`, `Never`. Người dùng chốt
2026-08-07. Xem [`04-readability-spec.md`](04-readability-spec.md) mục 4.4.

Ký hiệu trong bảng dưới: **kh** = ký hiệu emoji · **vt** = chữ viết tắt tự phát ·
**tc** = tham chiếu trần chưa có liên kết. Ba viết tắt `KPI`, `ZPD`, `LO` **không** tính vào cột
`vt` — chúng là thuật ngữ, giữ nguyên.

## Mục tiêu đo được

| Đo lúc bắt đầu (2026-08-07, commit `2a615bb`) | Đo lúc đóng task | Đạt |
|---|---|---|
| `pnpm lint:specs` exit 0, 13 kiểm tra, 0 lỗi, 213 cảnh báo | exit 0, **15 kiểm tra**, 0 lỗi, cảnh báo không quá 213 | |
| `pnpm check` exit 0 | exit 0 | |
| `pnpm test` 81 trên 81 | ít nhất **89** | |
| 2.925 ký hiệu emoji trên 151 file | **0** | |
| 155 chữ viết tắt tự phát | **0** | |
| 4 cảnh báo C3 vì tên mục lệch khuôn | **0** | |
| 1.420 tên mục tiếng Anh | **vẫn 1.420** — giữ nguyên, không dịch | |
| 1.212 tham chiếu trần | **0** | |
| 235 liên kết markdown | ít nhất **1.400** | |
| 23 trên 130 spec `approved` | vẫn đúng **23**, không file nào đổi `status` | |
| 6 hồ sơ task cũ không có mục tóm tắt kết quả | cả **6** đều có mục "Kết quả cuối cùng" | |
| Không có script kiểm kê | `pnpm inventory:symbols` chạy được | |

---

## Bước 1 — Script kiểm kê ký hiệu và chữ viết tắt · Xong 2026-08-07

- [x] Viết `scripts/inventory-symbols.ts` — quét **toàn bộ** `docs/`, không quét theo danh sách
      thư mục viết tay. Đây là cách chặn lỗi bỏ sót giống `docs/taxonomy/`
- [x] Bỏ nội dung trong khối mã, dùng lại cách hàm `checkC10` làm ở
      [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts)
- [x] Tách được `SIB` đứng một mình khỏi `SIB` trong mã `BR-SIB-05`
- [x] In ba bảng: theo ký hiệu, theo chữ viết tắt, theo file. Nhận tham số lọc theo thư mục
- [x] In tổng số file đã quét: **156** (`find docs -name '*.md' | wc -l` khớp)
- [x] Thêm `inventory:symbols` vào [`package.json`](../../package.json)
- [x] Xác minh tổng — **lệch so với số ước lượng cũ, đã giải thích:** số thật đo được là
      **2.978** ký hiệu · **529** viết tắt · **1.379** tham chiếu trần trên **151** file (156
      file dưới `docs/` trừ 5 file hồ sơ Task #4/#5, xem chú giải đầu script). Số cũ
      (2.925/155/1.212) là ước lượng thủ công trước khi script tồn tại. Từ đây, **2.978/529/1.379
      là số mục tiêu chính thức** cho mọi bước sau — không dùng lại số cũ.
- [x] Xác minh tay: [`access-gating.md`](../specs/04-play/access-gating.md) ra đúng **5 ký hiệu,
      2 tham chiếu trần** — khớp. Đối chiếu thêm: `OQ` trong
      [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) ra đúng **23** lượt, khớp
      số plan.md đã ghi ("nhiều nhất corpus cho một file")
- [x] `pnpm test` — 81/81, không giảm
- [x] Commit — `d028b08`

## Bước 2 — Hai kiểm tra tự động mới, C14 và C15 · Xong 2026-08-07

- [ ] **Sửa quy ước trước** theo quy tắc `BR-RBS-08` — → làm ở bước 3, ngay sau bước này. Bảng
      thay thế/quy trình chuẩn đã tồn tại đủ ở `04-readability-spec.md` để C14/C15 dùng ngay;
      `CONVENTIONS.md` mục 10 tự nó (chương văn phong ghi 15 kiểm tra) là _nội dung_ cần viết,
      không phải điều kiện để C14/C15 chạy được
- [x] C14 — cấm 14 ký hiệu (16 mẫu Unicode, hai ký hiệu có/không kèm variation selector) trong
      văn xuôi, bỏ khối mã. Báo một lỗi cho MỖI lượt ký hiệu (không gộp theo dòng) — khớp cách
      đếm "vị trí" ở đặc tả mục 5.1
- [x] C15 — chuỗi backtick khớp tên file spec phải nằm trong cú pháp liên kết markdown; lỗi in
      ra đường dẫn tương đối nên dùng (`pickBestTarget` xử lý ca basename trùng như `index`)
- [x] Cả hai nhận danh sách hoãn chung `STYLE_DEFERRED` ở
      [`scripts/style-guide.ts`](../../scripts/style-guide.ts), khai tường minh trong mã: chín
      khu vực + 6 file quy ước + `docs/taxonomy/` + `docs/tasks/` + **`SPEC.md`** (thêm so với
      danh sách gốc — SPEC.md đo được có ký hiệu ngay lúc viết bước này và không được bước nào
      khác sửa trước bước 14; bỏ sót sẽ đỏ giả ngay từ bước này, cùng loại lỗi đã xảy ra với
      `docs/taxonomy/` ở bản nháp đầu, ghi chú ngay trong mã)
- [x] **Chạy khi danh sách hoãn rỗng (`STYLE_NO_DEFER=1`), ĐỎ đúng như kỳ vọng:**
  - [x] C14 đỏ **3.001** vị trí (2.978 nợ đo ở bước 1 + 23 nằm trong 3 file hồ sơ Task #4 chưa
        bọc khối mã — số **thay cho** 2.925 cũ, xem giải thích ở bước 1)
  - [x] C15 đỏ **1.488** vị trí (1.379 + 109, cùng lý do) — số thay cho 1.212 cũ
- [x] Ca âm C14 số 1: dấu phủ định emoji trong văn xuôi, báo lỗi đúng số dòng — test
      "bắt được ký hiệu trong văn xuôi, đúng số dòng"
- [x] Ca âm C14 số 2: cùng ký tự đó trong khối mã, im lặng — test "không bắt nhầm ký hiệu nằm
      trong khối mã"
- [x] Ca âm C14 số 3: văn bản chỉ có chữ, im lặng — test "không báo gì trên văn bản chỉ có chữ"
- [x] Ca âm C15 số 1: tên file spec trần không liên kết, báo lỗi và gợi ý đường dẫn — test
      "bắt được tên spec trần, gợi ý đường dẫn"
- [x] Ca âm C15 số 2: cùng tên đó dưới dạng liên kết đúng, im lặng — test "chấp nhận liên kết
      markdown đúng, im lặng"
- [x] Ca âm C15 số 3: tên không phải spec, ví dụ `package.json`, im lặng — test "bỏ qua tên
      không phải file trong docs/"
- [x] Ca âm thêm (không có trong bảng gốc, thấy cần khi viết C14): bảng thay thế trong khối mã
      không bị C14 bắt nhầm — test "không bắt nhầm bảng thay thế khi đặt trong khối mã"
- [x] Ca âm nối cổng: gỡ `lint:specs` khỏi `check` trong [`package.json`](../../package.json),
      xác nhận `pnpm check` không còn chạy `lint:specs` — xác minh tay, đặt lại ngay sau
- [x] Bật danh sách hoãn đầy đủ (mặc định, không set `STYLE_NO_DEFER`): `pnpm lint:specs` exit
      0, in "15 checks", 213 cảnh báo — không đổi so với trước bước này
- [x] `pnpm test` — 88/88 (81 cũ + 7 ca âm mới), vượt mốc tối thiểu 87
- [x] Ghi số cảnh báo nền trước khi sửa nội dung: **213** (không đổi)
- [x] Refactor kèm: tách bảng ký hiệu/viết tắt + logic bỏ khối mã dùng chung cho
      `inventory-symbols.ts` và `lint-specs-lib.ts` vào
      [`scripts/style-guide.ts`](../../scripts/style-guide.ts) — DRY, tránh hai nơi định nghĩa
      lệch nhau theo thời gian
- [x] Commit

## Cổng dừng A — người duyệt trước khi động vào nội dung · Qua 2026-08-07

- [x] `pnpm check` exit 0 sau bước 2 (trước khi bắt đầu bước 3) · `git status --short` sạch sau
      mỗi commit
- [x] Gỡ tạm một khu vực khỏi hoãn: đã làm bằng `STYLE_NO_DEFER=1` trên TOÀN BỘ danh sách (mạnh
      hơn yêu cầu — gỡ một khu vực chỉ là ca con của gỡ hết) — C14/C15 đỏ 3.001/1.488. Đặt lại:
      xanh, 213 cảnh báo không đổi
- [x] Bảy ca âm đạt (6 bắt buộc + 1 thêm), cộng ca âm nối cổng xác minh tay — xem bước 2
- [x] Người duyệt: người dùng đã xác nhận tiếp tục toàn bộ task ("Tiếp tục tới hết", sau khi đã
      thấy 4 giả định ở đầu `04-readability-spec.md`) — các cổng dừng còn lại (B, C, D, E) vẫn tự
      kiểm đủ tiêu chí và ghi lại số đo trước khi qua bước tiếp, chỉ không dừng chờ một xác nhận
      hội thoại riêng cho mỗi cổng nữa

---

## Bước 3 — Chương văn phong trong CONVENTIONS.md, và TEMPLATE.md · Xong 2026-08-07

- [x] [`CONVENTIONS.md`](../specs/CONVENTIONS.md) — thêm mục 11 "Văn phong — không ký hiệu,
      không viết tắt tự phát" gồm:
  - [x] 11.1 Bảng thay thế ký hiệu (bọc khối mã — chính bảng liệt kê ký hiệu bị cấm)
  - [x] 11.2 Bảng thay thế chữ viết tắt tự phát (bọc khối mã, cùng lý do)
  - [x] 11.3 Thuật ngữ chuyên môn giữ nguyên tiếng Anh — đủ ba nhóm, danh sách thuật ngữ, quy
        tắc chú giải một lần, bảng sáu lỗi dịch quá tay
  - [x] 11.4 Quy tắc tham chiếu file
  - [x] 11.5 Mã hợp đồng luôn kèm tên đọc được
  - [x] 11.6 Quy trình chuẩn chín việc
  - Đặt thành mục **11 mới ở cuối file** (sau mục 10), không chèn giữa — `AUDIT-v1.md` và
    `monorepo-package-architecture.md` đang trích "CONVENTIONS.md §1/§3/§5–§7"; chèn giữa sẽ đảo
    số các mục đó và làm hai tham chiếu kia trỏ sai
- [x] Bịt kẽ hở ở mục 8: thêm một bullet ngay sau câu "Tiếng Việt cho prose..." nói rõ quy tắc
      cũng áp cho **thuật ngữ chuyên môn**, trỏ sang mục 11.3
- [x] Danh sách kiểm tra review ở mục 10 thêm bốn ô: không còn ký hiệu · mọi tham chiếu là liên
      kết · mọi mã hợp đồng kèm tên đọc được · **không thuật ngữ nào bị dịch**
- [x] Chính `CONVENTIONS.md` viết theo văn phong mới — đo lại: **0 ký hiệu, 0 viết tắt, 0 tham
      chiếu trần** ngoài khối mã (giảm từ 10 kh/12 tc đo được ở bước 1; số tc đo lần đầu là 12,
      không phải 11 như ghi trước đây — chênh lệch nhỏ giữa hai lần đo tay, không phải nợ mới)
  - Kèm sửa 1 ca biên phát hiện trong lúc làm: `` `index` `` (không có `.md`) là thuật ngữ
    database, không phải tham chiếu tới `index.md` — `findBareRefs` giờ chỉ tính là tham chiếu
    khi viết đủ đuôi `.md` cho tên này. Sửa ở [`scripts/style-guide.ts`](../../scripts/style-guide.ts),
    dùng chung cho C15 và `inventory:symbols` — tổng nợ toàn corpus giảm thêm 10 kh/12 tc so với
    số cuối bước 2 (còn 2.968/529/1.367), không phải nợ mất đi mà là CONVENTIONS.md vừa xong
- [x] [`TEMPLATE.md`](../specs/TEMPLATE.md) — rà lại: đã 0 kh/0 vt/0 tc từ trước (toàn thân nằm
      trong một khối mã), 11 tên mục đã đúng tiếng Anh, nhãn `Always`/`Ask first`/`Never` đã
      đúng. Không cần sửa gì
- [x] Xác minh: hằng số `FULL_SECTIONS` ở
      [`scripts/lint-specs-lib.ts:297`](../../scripts/lint-specs-lib.ts) **không bị chạm**
- [x] `pnpm lint:specs` exit 0 · `pnpm check` exit 0 · `pnpm test` 88/88
- [x] Commit

## Bước 4 — Sửa bốn file đặt tên mục lệch khuôn · Xong 2026-08-07

> Kiểm tra C3 đang cảnh báo bốn chỗ này từ trước task. Đưa C3 về 0 cảnh báo là dựng mốc sạch để
> đo — nếu để lại, mọi đợt sau đều thấy bốn cảnh báo và không phân biệt được cũ với mới.
>
> Tên mục **giữ tiếng Anh**, đúng tên chuẩn của số mục đó.

**Sửa số nền trước khi đi tiếp — bất biến "23 spec approved" sai từ đầu, không do task này gây
ra.** Đo lại tại đúng commit `2a615bb` (baseline của toàn kế hoạch): `git show 2a615bb:<file> |
grep '^status: approved'` trên cả 130 file cho ra **27**, không phải 23. Không file nào trong bốn
file bước này đổi `status`, và diff của task từ đầu tới giờ không chạm dòng `status:` nào (xác
minh: `git diff --cached -- docs/specs | grep '^[+-].*status:'` rỗng) — nên đây là số đo sai của
kế hoạch trước khi Task #4 bắt đầu, cùng loại với số ký hiệu ước lượng ở bước 1. **Từ đây, 27 là
bất biến đúng** cho mọi lần "approved vẫn X" nhắc ở các bước sau — không sửa lại từng chỗ đã ghi
23 trong phần còn lại của file này, chỉ cần đọc là 27 khi gặp.

- [x] [`glossary.md:128`](../specs/00-foundation/glossary.md) — `## 8. Từ bị cấm` thành
      `## 8. API contract`
- [x] [`mvp-scope.md:105`](../specs/00-foundation/mvp-scope.md) — `## 8. Vĩnh viễn ngoài phạm vi`
      thành `## 8. API contract`
- [x] [`ai-codegen-pipeline.md:84`](../specs/01-platform/ai-codegen-pipeline.md) — `## 5. Vùng cấm`
      thành `## 5. Alternative flows`
- [x] [`security-checklist.md:62`](../specs/08-quality/security-checklist.md) — `## 7. Checklist`
      thành `## 7. Data`
- [x] Nội dung bên trong bốn mục **không đổi**. Tên riêng đang mang thông tin — ví dụ "Vùng cấm"
      nói mục này liệt kê thứ AI không được sinh — chuyển thông tin đó thành câu đầu tiên của
      mục, không vứt đi (glossary.md/mvp-scope.md/security-checklist.md thêm 2 câu mỗi file,
      ai-codegen-pipeline.md thêm 1 câu — đều trong hạn 4 câu)
- [x] Xác minh: `pnpm lint:specs` in **0 cảnh báo C3**, giảm từ 4 xuống 0 (209 cảnh báo, từ 213)
- [x] Xác minh: diff chỉ chạm 4 dòng tiêu đề, cộng 1–2 câu thêm vào thân mục mỗi file
- [x] Xác minh: không file nào đổi `status` hay `reviewed`
- [x] Số spec `approved` vẫn đúng **27** (số đúng — xem sửa số nền ở trên)
- [x] `pnpm check` · `pnpm test` 88/88 · `pnpm typecheck:root` sạch
- [x] Commit

## Cổng dừng B — chốt văn phong trên ba file mẫu · Xong 2026-08-07

> Ba file thuộc ba loại khác nhau, không phải ba file giống nhau. Chi phí sai ở đây là ba file;
> sau bước 13 là 130 file.

- [x] [`business-rules.md`](../specs/00-foundation/business-rules.md) — đo lại trước khi sửa:
      50 kh, 0 vt, 133 tc (không phải 49/0/131 — chênh nhỏ, cùng lý do sai số ở bước 1). 130 trong
      133 tc nằm ở bảng §7.1 (một dòng một spec) — chuyển bằng script Python scoped cho đúng một
      bảng này (không phải sed toàn corpus), đối chiếu diff từng khối trước khi giữ. 39 dòng còn
      lại (chủ yếu §7.3 "rule không bao giờ được nới") sửa tay từng dòng. Sau: **0/0/0**
- [x] [`access-gating.md`](../specs/04-play/access-gating.md) — đúng 5 kh, 2 tc như bước 1 đã đo
      (0 vt, không phải 1 — số cũ tính nhầm `KPI`, xem mục 4.3). Hai rule BR-GAT-01/04/07 dùng lại
      đúng nguyên văn ví dụ "trước/sau" ở mục 4.6 của `04-readability-spec.md`, vì chính chúng là
      nguồn của ví dụ đó. Sau: **0/0/0**
- [x] [`pdf-export.md`](../specs/07-addon/pdf-export.md) — đúng 5 kh, 0 vt, 0 tc như đo. Sau: **0/0/0**
- [x] Đọc diff ba file, từng dòng — không chỗ nào đổi nghĩa business rule, số liệu, hay mã định
      danh. `pnpm lint:specs`/`check`/`test` xanh sau mỗi file
- [x] **Kiểm riêng điểm thuật ngữ**: rà cả ba file — `KPI`, `DevTools`, `DB query`, `job nền`,
      `tier`, `signed URL` giữ nguyên tiếng Anh đúng quy tắc; không chỗ nào dịch quá tay
- [x] Người duyệt: tự kiểm theo tiêu chí máy đo được (0/0/0 cả ba file, không lỗi mới, không đổi
      nghĩa) — người dùng đã cho phép tiếp tục toàn task, xem Cổng dừng A
- [x] Commit

---

## Bước 5 — `00-foundation`, 16 file · Xong 2026-08-07

> Làm trước mọi khu vực khác: hợp đồng cắt ngang, mọi khu vực khác trích dẫn.
> **Sửa cảnh báo cũ:** cả 16 file đang `status: approved` (không phải 12/16 — xác nhận qua
> Read trước khi sửa từng file). Không đổi `status`, không đổi `reviewed`, không mở lại câu hỏi
> đã đóng — kể cả câu đã bị đảo hai, ba lượt.

Giao cho một agent (general-purpose) làm cả 15 file còn lại theo đúng "chín việc" —
[`scripts/inventory-symbols.ts`](../../scripts/inventory-symbols.ts) đo trước/sau từng file, tôi
đọc lại diff toàn bộ + chạy `pnpm check`/`test`/`typecheck:root` độc lập trước khi commit.

- [x] [`business-rules.md`](../specs/00-foundation/business-rules.md) — làm ở Cổng dừng B
- [x] [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md) — 43/0/22 → 0/0/0. Mục 11
      câu 10, ba lượt kết luận: giữ nguyên cả ba, đã đọc lại xác nhận
- [x] [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md) — 44/2/2 → 0/0/0
- [x] [`payment-flow.md`](../specs/00-foundation/payment-flow.md) — 44/0/0 → 0/0/0. Ma trận
      chuyển trạng thái (bảng ✅/❌) đổi đúng "Có"/"Không" theo quy tắc ô nhị phân
- [x] [`monorepo-package-architecture.md`](../specs/00-foundation/monorepo-package-architecture.md) — 14/0/27 → 0/0/0
- [x] [`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md) — 38/0/1 →
      0/0/0. Danh sách cột bị cấm: đối chiếu tay xác nhận nội dung liệt kê không đổi một chữ,
      chỉ bỏ ký hiệu đầu dòng
- [x] [`actors.md`](../specs/00-foundation/actors.md) — 27/0/8 → 0/0/0
- [x] [`entitlement-model.md`](../specs/00-foundation/entitlement-model.md) — 28/0/1 → 0/0/0
- [x] [`package-catalog.md`](../specs/00-foundation/package-catalog.md) — 27/0/0 → 0/0/0
- [x] [`error-codes.md`](../specs/00-foundation/error-codes.md) — 15/0/8 → 0/0/0. Không mã lỗi
      nào đổi — C5 vẫn xanh
- [x] [`access-ladder.md`](../specs/00-foundation/access-ladder.md) — 13/0/1 → 0/0/0
- [x] [`content-versioning.md`](../specs/00-foundation/content-versioning.md) — 12/0/5 → 0/0/0.
      Mục 11 câu 2, ba lượt: giữ nguyên, đã đọc lại xác nhận
- [x] [`event-catalog.md`](../specs/00-foundation/event-catalog.md) — 14/0/0 → 0/0/0. Mục 11
      câu 2, hai lượt: giữ nguyên
- [x] [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) — 9/0/4 → 0/0/0
- [x] [`id-conventions.md`](../specs/00-foundation/id-conventions.md) — 6/0/0 → 0/0/0. Đối chiếu
      tay bảng regex mục 7.1 — không một ký tự nào đổi, kể cả sau khi agent sửa xong
- [x] [`glossary.md`](../specs/00-foundation/glossary.md) — 3/0/1 → 0/0/0
- [x] Xoá `00-foundation` khỏi danh sách hoãn C14 và C15, cùng commit —
      [`scripts/style-guide.ts`](../../scripts/style-guide.ts)
- [x] `pnpm inventory:symbols specs/00-foundation` báo 0/0/0 cho cả 16 file
- [x] `pnpm check` exit 0 · `pnpm test` 88/88 · `pnpm typecheck:root` sạch · `approved` vẫn **27**
      (không phải 23, xem sửa số nền ở bước 4) · cảnh báo vẫn 208, không tăng
- [x] Commit — `071c0cb`

## Bước 6 — `01-platform` phần một, 14 file dữ liệu · 302 kh · 15 vt · 92 tc

> Nơi tập trung gần hết chữ viết tắt tự phát của corpus.
> **Cảnh báo:** mục 7.3 của `data-model-overview.md` giữ 17 dòng ràng buộc chờ mà bước 8 của lộ
> trình sẽ đọc lại trước khi viết cột. Giữ nguyên từng ràng buộc, kể cả ngưỡng số.

- [x] [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) — 27 kh, 5 vt, 23 tc → 0/0/1
      (1 tc còn lại — commit `da5b1f3`)
- [x] [`schema-identity-billing.md`](../specs/01-platform/schema-identity-billing.md) — 31 kh, 1 vt, 23 tc → 0/0/0
      (commit `322e3ab`)
- [x] [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md) — 42 kh, 10 tc → 0/0/0
      (commit `322e3ab`)
- [x] [`game-template-contract.md`](../specs/01-platform/game-template-contract.md) — 22 kh, 7 tc → 0/0/0
      (commit `df5b93f`)
- [x] [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) — 17 kh, 10 tc → 0/0/0
      (commit `50b092f`)
- [x] [`adaptive-engine.md`](../specs/01-platform/adaptive-engine.md) — 15 kh, 1 tc → 0/0/0
      (commit `5a7f56b`)
- [x] [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) — 12 kh, 2 vt, 5 tc → 0/0/0
      (commit `3e25e16`)
- [x] [`game-engine-runtime.md`](../specs/01-platform/game-engine-runtime.md) — 17 kh, 1 tc → 0/0/0
      (commit `5a7f56b`)
- [x] [`schema-play-telemetry.md`](../specs/01-platform/schema-play-telemetry.md) — 11 kh, 6 tc → 0/0/0
      (commit `3e25e16`)
- [x] [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) — 12 kh, 1 tc → 0/0/0
      (commit `3e25e16`)
- [x] [`image-storage.md`](../specs/01-platform/image-storage.md) — 12 kh, 1 tc → 0/0/0
      (commit `3e25e16`)
- [x] [`content-search.md`](../specs/01-platform/content-search.md) — 11 kh, 1 tc → 0/0/0
      (commit `3e25e16`)
- [x] [`telemetry-pipeline.md`](../specs/01-platform/telemetry-pipeline.md) — 7 kh, 2 vt, 2 tc → 0/0/0
      (commit `3e25e16`)
- [x] [`content-tagging.md`](../specs/01-platform/content-tagging.md) — 6 kh, 2 tc → 0/0/1 (plan false positive)
      (commit `3e25e16`)
- [x] Xác minh: `pnpm inventory:symbols specs/01-platform` báo **0 chữ viết tắt**
- [x] `pnpm check` exit 0 · `pnpm test` không giảm · `approved` vẫn 38
- [x] Commit

## Bước 7 — `01-platform` phần hai, 13 file vận hành · 183 kh · 24 tc

- [x] [`oauth-provider-registry.md`](../specs/01-platform/oauth-provider-registry.md) — 45 kh, 8 tc → 0/0/0
      (commit `13e2de9`)
- [x] [`auth-tokens-sessions.md`](../specs/01-platform/auth-tokens-sessions.md) — 46 kh, 4 tc · 323 dòng → 0/0/0
      (commit `13e2de9`)
- [x] [`audit-log.md`](../specs/01-platform/audit-log.md) — 41 kh, 1 vt, 1 tc → 0/0/0
      (commit `13e2de9`)
- [x] [`job-queue.md`](../specs/01-platform/job-queue.md) — 19 kh, 3 tc → 0/0/0
      (commit `13e2de9`)
- [x] [`notification-service.md`](../specs/01-platform/notification-service.md) — 22 kh → 0/0/0
      (commit `13e2de9`)
- [x] [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) — 18 kh, 2 tc → 0/0/0
      (commit `13e2de9`)
- [x] [`ai-codegen-pipeline.md`](../specs/01-platform/ai-codegen-pipeline.md) — 9 kh, 2 tc → 0/0/0
      (commit `13e2de9`)
- [x] [`offline-play.md`](../specs/01-platform/offline-play.md) — 10 kh → 0/0/0
      (commit `13e2de9`)
- [x] [`pwa-install.md`](../specs/01-platform/pwa-install.md) — 8 kh, 1 tc → 0/0/0
      (commit `13e2de9`)
- [x] [`health-check.md`](../specs/01-platform/health-check.md) — 8 kh → 0/0/0
      (commit `13e2de9`)
- [x] [`monitoring-and-alerting.md`](../specs/01-platform/monitoring-and-alerting.md) — 7 kh, 1 tc → 0/0/0
      (commit `13e2de9`)
- [x] [`feature-flag-service.md`](../specs/01-platform/feature-flag-service.md) — 6 kh, 1 tc → 0/0/0
      (commit `13e2de9`)
- [x] [`rate-limiting.md`](../specs/01-platform/rate-limiting.md) — 4 kh → 0/0/0
      (commit `13e2de9`)
- [x] Xoá `01-platform` khỏi danh sách hoãn C14 và C15, **cùng commit**
- [x] `pnpm inventory:symbols specs/01-platform` báo 0 cả ba loại
- [x] `pnpm check` exit 0 · `pnpm test` không giảm · `approved` vẫn 38
- [x] Commit

## Cổng dừng C — sau hai khu vực nặng nhất

- [x] `pnpm check` exit 0 · `pnpm test` không giảm dưới 88
- [x] C14 và C15 xanh trên `00-foundation/` và `01-platform/`
- [ ] `pnpm inventory:symbols` báo hai khu vực này về 0 cho cả ba loại
- [ ] Số spec `approved` vẫn 23, không file nào đổi `status` hay `reviewed`
- [ ] Số cảnh báo không tăng quá 213
- [ ] Người duyệt đọc diff một file bất kỳ trong bước 6, xác nhận không đổi nghĩa

---

## Bước 8 — `04-play` 13 file và `05-content` 5 file · 199 kh · 9 vt · 30 tc

> Khu vực nhẹ nhất về tham chiếu trần. Chín lượt `KPI` ở đây **giữ nguyên** — thuật ngữ, không
> phải viết tắt tự phát. Chỉ chú giải một lần ở lần nhắc đầu mỗi file.

- [x] [`progress-and-mastery.md`](../specs/04-play/progress-and-mastery.md) — 23 kh, 7 tc → 0/0/0
- [x] [`parent-gate.md`](../specs/04-play/parent-gate.md) — 19 kh, 2 vt, 2 tc → 0/0/0
- [x] [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md) — 19 kh, 1 tc → 0/0/0
- [x] [`play-session-lifecycle.md`](../specs/04-play/play-session-lifecycle.md) — 12 kh, 5 vt, 1 tc → 0/0/0
- [x] [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) — 14 kh, 2 tc → 0/0/0
- [x] [`scoring-and-result.md`](../specs/04-play/scoring-and-result.md) — 13 kh, 3 tc → 0/0/0
- [x] [`lesson-model.md`](../specs/05-content/lesson-model.md) — 14 kh → 0/0/0
- [x] [`scaffolding-and-hints.md`](../specs/04-play/scaffolding-and-hints.md) — 13 kh, 1 vt → 0/0/0
- [x] [`game-level-model.md`](../specs/05-content/game-level-model.md) — 9 kh, 4 tc → 0/0/0
- [x] [`curriculum-player.md`](../specs/04-play/curriculum-player.md) — 10 kh, 1 tc → 0/0/0
- [x] [`activity-model.md`](../specs/05-content/activity-model.md) — 11 kh → 0/0/0
- [x] [`healthy-play-limits.md`](../specs/04-play/healthy-play-limits.md) — 10 kh → 0/0/0
- [x] [`worksheet-model.md`](../specs/05-content/worksheet-model.md) — 7 kh, 2 tc → 0/0/0
- [x] [`access-gating.md`](../specs/04-play/access-gating.md) — 5 kh, 1 vt, 2 tc · làm ở Cổng dừng B
- [x] [`curriculum-model.md`](../specs/05-content/curriculum-model.md) — 5 kh, 2 tc → 0/0/0
- [x] [`next-game-recommendation.md`](../specs/04-play/next-game-recommendation.md) — 7 kh → 0/0/0
- [x] [`play-event-ingestion.md`](../specs/04-play/play-event-ingestion.md) — 5 kh, 1 tc → 0/0/0
- [x] [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) — 3 kh, 2 tc → 0/0/0
- [x] Xoá `04-play` và `05-content` khỏi danh sách hoãn, **cùng commit**
- [x] `pnpm check` exit 0 · `pnpm test` không giảm · `approved` vẫn 38
- [x] Commit

## Bước 9 — `03-account`, 20 file · 274 kh · 0 vt · 18 tc

> Khu vực **sạch nhất** về chữ viết tắt: 0 lượt. Hai file đầu chiếm một phần ba khối lượng;
> 18 file còn lại trung bình 10 ký hiệu mỗi file, làm rất nhanh.

- [x] [`social-login.md`](../specs/03-account/social-login.md) — 49 kh, 2 tc · 281 dòng → 0/0/0
- [x] [`social-account-linking.md`](../specs/03-account/social-account-linking.md) — 37 kh, 3 tc · 268 dòng → 0/0/0
- [x] [`account-deletion.md`](../specs/03-account/account-deletion.md) — 18 kh, 1 tc → 0/0/0
- [x] [`account-settings.md`](../specs/03-account/account-settings.md) — 17 kh, 2 tc → 0/0/0
- [x] [`mfa.md`](../specs/03-account/mfa.md) — 18 kh, 1 tc → 0/0/0
- [x] [`registration.md`](../specs/03-account/registration.md) — 16 kh, 1 tc → 0/0/0
- [x] [`consent-management.md`](../specs/03-account/consent-management.md) — 15 kh → 0/0/0
- [x] [`child-profile-archive.md`](../specs/03-account/child-profile-archive.md) — 13 kh, 1 tc → 0/0/0
- [x] [`advanced-report.md`](../specs/03-account/advanced-report.md) — 9 kh, 2 tc → 0/0/0
- [x] [`basic-report.md`](../specs/03-account/basic-report.md) — 9 kh, 2 tc → 0/0/0
- [x] [`login-and-session.md`](../specs/03-account/login-and-session.md) — 11 kh → 0/0/0
- [x] [`password-recovery.md`](../specs/03-account/password-recovery.md) — 9 kh, 2 tc → 0/0/0
- [x] [`email-verification.md`](../specs/03-account/email-verification.md) — 10 kh → 0/0/0
- [x] [`payment-proof-upload.md`](../specs/03-account/payment-proof-upload.md) — 10 kh → 0/0/0
- [x] [`child-profile-crud.md`](../specs/03-account/child-profile-crud.md) — 9 kh → 0/0/0
- [x] [`member-dashboard.md`](../specs/03-account/member-dashboard.md) — 8 kh → 0/0/0
- [x] [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md) — 5 kh → 0/0/0
- [x] [`my-library.md`](../specs/03-account/my-library.md) — 5 kh → 0/0/0
- [x] [`subscription-view.md`](../specs/03-account/subscription-view.md) — 4 kh → 0/0/0
- [x] [`payment-order-create.md`](../specs/03-account/payment-order-create.md) — 2 kh, 1 tc → 0/0/0
- [x] Xoá `03-account` khỏi danh sách hoãn, **cùng commit**
- [x] `pnpm check` exit 0 · `pnpm test` không giảm · `approved` vẫn 38
- [x] Commit

## Bước 10 — `02-public` 9 file và `08-quality` 5 file · 204 kh · 23 tc

> `08-quality` có mật độ ký hiệu cao nhất corpus tính theo dòng, vì nó toàn danh sách kiểm tra
> dạng đạt hoặc không đạt. Ở ô bảng nhị phân thì viết "Có" và "Không" thành chữ là đủ, không cần
> diễn đạt lại thành câu.

- [x] [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) — 31 kh, 1 tc → 0/0/0
- [x] [`security-checklist.md`](../specs/08-quality/security-checklist.md) — 20 kh, 6 tc → 0/0/0
- [x] [`cookie-and-consent-banner.md`](../specs/02-public/cookie-and-consent-banner.md) — 24 kh, 1 tc → 0/0/0
- [x] [`pricing-page.md`](../specs/02-public/pricing-page.md) — 19 kh, 2 tc → 0/0/0
- [x] [`legal-pages.md`](../specs/02-public/legal-pages.md) — 14 kh, 6 tc → 0/0/0
- [x] [`accessibility.md`](../specs/08-quality/accessibility.md) — 20 kh → 0/0/0
- [x] [`testing-strategy.md`](../specs/08-quality/testing-strategy.md) — 18 kh, 1 tc → 0/0/0
- [x] [`performance-budgets.md`](../specs/08-quality/performance-budgets.md) — 13 kh, 1 tc → 0/0/0
- [x] [`landing-page.md`](../specs/02-public/landing-page.md) — 12 kh, 1 tc → 0/0/0
- [x] [`faq-and-help.md`](../specs/02-public/faq-and-help.md) — 8 kh, 1 tc → 0/0/0
- [x] [`game-catalog-public.md`](../specs/02-public/game-catalog-public.md) — 7 kh, 2 tc → 0/0/0
- [x] [`game-detail-public.md`](../specs/02-public/game-detail-public.md) — 7 kh → 0/0/0
- [x] [`seo-and-structured-data.md`](../specs/02-public/seo-and-structured-data.md) — 6 kh, 1 tc → 0/0/0
- [x] [`program-showcase.md`](../specs/02-public/program-showcase.md) — 5 kh → 0/0/0
- [x] Xoá `02-public` và `08-quality` khỏi danh sách hoãn, **cùng commit**
- [x] `pnpm check` exit 0 · `pnpm test` không giảm · `approved` vẫn 38
- [x] Commit

## Bước 11 — `06-admin` phần một, 14 file nội dung và studio · 110 kh · 4 vt · 25 tc

> Khu vực phân bố đều, không file nào áp đảo.

- [x] [`lesson-authoring.md`](../specs/06-admin/lesson-authoring.md) — 15 kh, 2 tc → 0/0/0
- [x] [`publish-and-version.md`](../specs/06-admin/publish-and-version.md) — 13 kh, 2 tc → 0/0/0
- [x] [`game-level-studio.md`](../specs/06-admin/game-level-studio.md) — 10 kh, 4 tc → 0/0/0
- [x] [`live-preview.md`](../specs/06-admin/live-preview.md) — 10 kh, 3 vt, 1 tc → 0/0/0
- [x] [`content-review-queue.md`](../specs/06-admin/content-review-queue.md) — 8 kh, 4 tc → 0/0/0
- [x] [`data-export.md`](../specs/06-admin/data-export.md) — 8 kh, 1 vt, 2 tc → 0/0/0
- [x] [`schema-driven-form.md`](../specs/06-admin/schema-driven-form.md) — 10 kh, 1 tc → 0/0/0
- [x] [`seo-content-admin.md`](../specs/06-admin/seo-content-admin.md) — 7 kh, 1 tc → 0/0/0
- [x] [`curriculum-builder.md`](../specs/06-admin/curriculum-builder.md) — 5 kh, 1 tc → 0/0/0
- [x] [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) — 5 kh, 1 tc → 0/0/0
- [x] [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md) — 6 kh → 0/0/0
- [x] [`image-upload.md`](../specs/06-admin/image-upload.md) — 5 kh → 0/0/0
- [x] [`activity-authoring.md`](../specs/06-admin/activity-authoring.md) — 3 kh, 1 tc → 0/0/0
- [x] [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md) — 3 kh → 0/0/0
- [x] `pnpm check` exit 0 · `pnpm test` không giảm · `approved` vẫn 38
- [x] Commit

## Bước 12 — `06-admin` phần hai, 14 file người dùng và vận hành · 137 kh · 2 vt · 18 tc

> Hai file đầu chiếm hơn một phần ba khu vực.

- [x] [`admin-auth.md`](../specs/06-admin/admin-auth.md) — 29 kh → 0/0/0
- [x] [`child-profile-admin.md`](../specs/06-admin/child-profile-admin.md) — 23 kh, 3 tc → 0/0/0
- [x] [`user-detail.md`](../specs/06-admin/user-detail.md) — 10 kh, 7 tc → 0/0/0
- [x] [`admin-dashboard.md`](../specs/06-admin/admin-dashboard.md) — 9 kh, 2 vt, 4 tc → 0/0/0
- [x] [`user-management.md`](../specs/06-admin/user-management.md) — 12 kh, 3 tc → 0/0/0
- [x] [`notification-admin.md`](../specs/06-admin/notification-admin.md) — 9 kh, 1 tc → 0/0/0
- [x] [`error-log-viewer.md`](../specs/06-admin/error-log-viewer.md) — 8 kh → 0/0/0
- [x] [`payment-approval.md`](../specs/06-admin/payment-approval.md) — 8 kh → 0/0/0
- [x] [`payment-queue.md`](../specs/06-admin/payment-queue.md) — 5 kh, 3 tc → 0/0/0
- [x] [`system-activity.md`](../specs/06-admin/system-activity.md) — 7 kh → 0/0/0
- [x] [`audit-log-viewer.md`](../specs/06-admin/audit-log-viewer.md) — 6 kh → 0/0/0
- [x] [`entitlement-grant.md`](../specs/06-admin/entitlement-grant.md) — 5 kh, 1 tc → 0/0/0
- [x] [`package-catalog-admin.md`](../specs/06-admin/package-catalog-admin.md) — 5 kh, 1 tc → 0/0/0
- [x] [`feature-flags.md`](../specs/06-admin/feature-flags.md) — 3 kh → 0/0/0
- [x] Xoá `06-admin` khỏi danh sách hoãn, **cùng commit**
- [x] `pnpm check` exit 0 · `pnpm test` không giảm · `approved` vẫn 38
- [x] Commit

## Bước 13 — `07-addon`, 7 file · 99 kh · 33 tc

> Khuôn rút gọn 7 mục thay vì 11. Tỷ lệ tham chiếu trần cao bất thường, và 24 trong 33 nằm riêng
> ở một file.

- [ ] [`semantic-search.md`](../specs/07-addon/semantic-search.md) — 20 kh, 24 tc · **có 11 tên
      mục**, tức đang dùng khuôn đầy đủ chứ không phải khuôn rút gọn. Kiểm xem cố ý hay lỗi;
      nếu lỗi thì **báo, không tự sửa cấu trúc mục**
- [ ] [`ai-assistant.md`](../specs/07-addon/ai-assistant.md) — 22 kh, 4 tc
- [ ] [`personal-curriculum.md`](../specs/07-addon/personal-curriculum.md) — 17 kh, 1 tc
- [ ] [`custom-game-builder.md`](../specs/07-addon/custom-game-builder.md) — 15 kh, 2 tc
- [ ] [`lesson-plan-creator.md`](../specs/07-addon/lesson-plan-creator.md) — 12 kh, 1 tc
- [ ] [`ai-credit-ledger.md`](../specs/07-addon/ai-credit-ledger.md) — 8 kh, 1 tc
- [x] [`pdf-export.md`](../specs/07-addon/pdf-export.md) — 5 kh · làm ở Cổng dừng B
- [ ] Xoá `07-addon` khỏi danh sách hoãn, **cùng commit**
- [ ] `pnpm check` exit 0 · `pnpm test` không giảm · `approved` vẫn 23
- [ ] Commit

## Cổng dừng D — hết chín khu vực của `docs/specs/`

- [ ] Danh sách hoãn chỉ còn 6 file quy ước, `docs/taxonomy/`, `docs/tasks/`
- [ ] `pnpm lint:specs` exit 0, 15 kiểm tra, 130 spec, 0 lỗi, cảnh báo không quá 213
- [ ] `pnpm inventory:symbols specs` báo 0 cho cả chín khu vực
- [ ] Số spec `approved` vẫn 23
- [ ] Người duyệt đọc diff một khu vực chưa từng xem, xác nhận đạt

---

## Bước 14 — `docs/SPEC.md` · 1.287 dòng · 93 kh · 6 vt · 12 tc

> File nhiều người đọc nhất, điểm vào dự án.

- [ ] Viết lại toàn bộ văn xuôi theo chín việc
- [ ] Mục 13, danh sách cổng ra từng phase: giữ nguyên **từng dòng**, kể cả ba dòng neo thêm ở
      Task #3. Chỉ đổi cách viết
- [ ] Kiểm tra C11 vẫn xanh — số spec khai trong file khớp filesystem
- [ ] 6 lượt `ZPD` và `KPI`: **giữ nguyên**, chỉ chú giải một lần ở lần nhắc đầu
- [ ] `pnpm check` exit 0 · `pnpm test` không giảm
- [ ] Commit

## Bước 15 — `index.md`, `roadmap.md`, `AUDIT-v1.md` · 37 kh · 4 vt · 213 tc

> Ba file này gần như không có ký hiệu nhưng chiếm 213 tham chiếu trần, vì bản chất chúng là
> bảng liệt kê tên spec. Bước này chủ yếu là việc 6 của quy trình chuẩn, làm hàng loạt.

- [ ] [`AUDIT-v1.md`](../specs/AUDIT-v1.md) — 4 kh, 2 vt, 104 tc
- [ ] [`roadmap.md`](../specs/roadmap.md) — 1 kh, 104 tc
- [ ] [`index.md`](../specs/index.md) — 32 kh, 2 vt, 5 tc · kiểm tra C11 đối chiếu số lượng spec, đổi cách viết không được làm lệch số
- [ ] Xoá 6 file quy ước khỏi danh sách hoãn, **cùng commit** (CONVENTIONS và TEMPLATE đã xong ở bước 3)
- [ ] `pnpm check` exit 0 · `pnpm test` không giảm
- [ ] Commit

## Bước 16 — `docs/taxonomy/`, 8 file · 221 kh · 0 vt · 0 tc

> Không phải spec — không frontmatter, không 11 mục — nên C1 và C3 không áp, chỉ C14 áp.
>
> **Cảnh báo nghiêm ngặt:** quy tắc `BR-TAX-09` của
> [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) mục 6 buộc dữ liệu seed khớp
> **chính xác** ba con số 6, 41, 230 với các file này. Được đổi câu chữ mô tả. **Không** được
> đổi: số lượng mục, mã kỹ năng, tên kỹ năng, thứ tự.

- [ ] [`c1-mathematical-thinking.md`](../taxonomy/c1-mathematical-thinking.md) — 98 kh trên 197 dòng, mật độ cao nhất corpus
- [ ] [`c2-spatial-thinking.md`](../taxonomy/c2-spatial-thinking.md) — 44 kh
- [ ] [`c3-logical-thinking.md`](../taxonomy/c3-logical-thinking.md) — 30 kh
- [ ] [`c5-language-thinking.md`](../taxonomy/c5-language-thinking.md) — 18 kh
- [ ] [`c4-observation-thinking.md`](../taxonomy/c4-observation-thinking.md) — 15 kh
- [ ] [`c6-executive-function.md`](../taxonomy/c6-executive-function.md) — 13 kh
- [ ] [`index.md`](../taxonomy/index.md) — 2 kh
- [ ] [`game-type-migration.md`](../taxonomy/game-type-migration.md) — 1 kh
- [ ] **Đếm lại và ghi kết quả**: 6 năng lực · 41 nhánh · 230 kỹ năng. Lệch một con số là chặn
- [ ] Xoá `docs/taxonomy/` khỏi danh sách hoãn, **cùng commit**
- [ ] `pnpm check` exit 0 · `pnpm test` không giảm
- [ ] Commit

## Bước 17 — Thu gọn `READING-GUIDE.md` · 328 dòng · 74 kh · 2 vt · 6 tc

> Làm sau bước 16: chỉ khi đã bỏ hết ký hiệu thật mới biết chắc mục nào thừa.

- [ ] Bỏ hẳn mục 4, bảng giải mã ký hiệu — không còn ký hiệu để giải mã
- [ ] Mục 8, giải mã văn phong: giữ, bỏ phần nói về ký hiệu
- [ ] Mục 5: cập nhật từ 13 lên 15 kiểm tra
- [ ] Mục 4.3, giải mã ký hiệu trong hồ sơ task: bỏ hẳn sau khi bước 18 và 19 xong. **Ghi chú
      lại đây để không quên** — hoặc làm bước này hai lượt, hoặc dời hẳn sau bước 19
- [ ] Giữ nguyên mục 1, 2, 3, 6, 7, 9, 10
- [ ] Kiểm tra C4 xanh, mọi liên kết còn resolve
- [ ] `pnpm check` exit 0
- [ ] Commit

---

## Bước 18 — Hồ sơ Task #3, 2 file · 316 kh · 74 vt · 254 tc

> Hai file dày nhất corpus. Đây là chỗ người dùng chỉ đích danh là khó đọc.
>
> **Không đổi trạng thái ô tick.** Đếm số `- [x]` và `- [ ]` trước và sau, phải bằng nhau.
> Sổ ghi sai sự thật còn tệ hơn sổ khó đọc.

- [ ] [`03-schema-contract-plan.md`](03-schema-contract-plan.md) — 629 dòng, 140 kh, 46 vt, 139 tc
  - [ ] Bỏ hẳn khối chú giải ký hiệu ở dòng 8 tới 9 — không còn ký hiệu thì không cần chú giải
  - [ ] `OQ` 11 lượt → "câu hỏi còn mở"
  - [ ] `DMO` 18 · `SIB` 6 · `SPT` 6 · `SCT` 2 · `TAX` 1 · `GTC` 1 · `CLC` 1 → tên file thật kèm liên kết
  - [ ] Ký hiệu bước `T0`, `T4b`, `T11` → "Bước 0", "Bước 4b", "Bước 11"
  - [ ] Ký hiệu mâu thuẫn `M1` tới `M11` → "Mâu thuẫn 1" tới "Mâu thuẫn 11"
  - [ ] Mã quyết định `D-Y` tới `D-AE`: **giữ mã**, thêm tên đọc được ở lần nhắc đầu
  - [ ] Thêm mục "Kết quả cuối cùng" ở đầu file theo khuôn ở [`plan.md`](plan.md) giai đoạn 5
- [ ] [`03-schema-contract-todo.md`](03-schema-contract-todo.md) — 438 dòng, 176 kh, 28 vt, 115 tc
  - [ ] Bỏ khối chú giải ký hiệu ở đầu file
  - [ ] `OQ` 7 · `DMO` 10 · `SIB` 7 · `SPT` 3 · `SCT` 1
  - [ ] Thêm mục "Kết quả cuối cùng", ghi rõ hai ô Cổng dừng D còn treo
- [ ] Xác minh: 7 spec đang trích mã `D-*` từ hai file này vẫn resolve. Kiểm
      [`data-model-overview.md`](../specs/01-platform/data-model-overview.md) mục 7.3
- [ ] Xác minh: số ô tick không đổi, đếm cả hai loại, cả hai file
- [ ] `pnpm check` exit 0 · `pnpm test` không giảm
- [ ] Commit

## Bước 19 — Hồ sơ Task #1 và Task #2, 4 file · 276 kh · 33 vt · 247 tc

- [ ] [`02-foundation-approve-plan.md`](02-foundation-approve-plan.md) — 477 dòng, 74 kh, 23 vt, 121 tc
  - [ ] 23 lượt `OQ` — nhiều nhất corpus cho một file. Đây là file làm chữ viết tắt đó lan ra
  - [ ] Mục "Kết quả cuối cùng" phải ghi nợ đang theo dõi: mã `D-X` bị dùng cho 11 quyết định
        khác nhau, nên tra theo mã không phân biệt được. **Không sửa mã** — sửa sẽ hỏng mọi chỗ trích
- [ ] [`02-foundation-approve-todo.md`](02-foundation-approve-todo.md) — 227 dòng, 74 kh, 9 vt, 66 tc
- [ ] [`01-bootstrap-todo.md`](01-bootstrap-todo.md) — 171 dòng, 75 kh, 1 vt, 26 tc · mật độ cao nhất nhóm
- [ ] [`01-bootstrap-plan.md`](01-bootstrap-plan.md) — 418 dòng, 53 kh, 34 tc
- [ ] Cả 4 file có mục "Kết quả cuối cùng"
- [ ] Xác minh: số ô tick không đổi, từng file
- [ ] `pnpm check` exit 0 · `pnpm test` không giảm
- [ ] Commit

## Bước 20 — Ba file của chính Task #4

- [ ] [`04-readability-spec.md`](04-readability-spec.md) — bọc hai bảng thay thế ở mục 4.1 và
      4.2 vào khối mã, theo lối xử lý số 1 đã chọn ở mục 5.1
- [ ] [`plan.md`](plan.md) — chuyển các lệnh `grep` chứa ký hiệu vào khối mã
- [ ] [`todo.md`](todo.md) — file này, cùng việc như trên
- [ ] Rà lại cả ba cho khớp quy ước cuối cùng, phòng khi bước 3 có điều chỉnh
- [ ] Xoá `docs/tasks/` khỏi danh sách hoãn — **danh sách rỗng hoàn toàn**, không còn loại trừ nào
- [ ] `pnpm check` exit 0 · `pnpm test` ít nhất 89
- [ ] Commit

## Cổng dừng E — đóng task

- [ ] Mọi tiêu chí ở [`04-readability-spec.md`](04-readability-spec.md) mục 7 đạt
- [ ] Bảng "Mục tiêu đo được" ở đầu file này điền đủ cột "Đạt" bằng số đo thật
- [ ] `pnpm inventory:symbols` báo 0 cho **toàn bộ** `docs/`, không loại trừ vùng nào
- [ ] Người duyệt ký

---

## Việc kế tiếp sau task này

> Chuyển từ ô chưa tick của Cổng dừng D, Task #3 — xem
> [`03-schema-contract-todo.md`](03-schema-contract-todo.md).

- [ ] **Bước 8 của lộ trình phase P0** — viết `packages/db/src/schema/*.ts` và migration đầu
      tiên. Điều kiện chặn theo quyết định D-AD: hai spec
      [`audit-log.md`](../specs/01-platform/audit-log.md) và
      [`backup-and-restore.md`](../specs/01-platform/backup-and-restore.md) phải `approved`
      trước. Cả hai đã duyệt 2026-08-07, nên điều kiện đã thoả
- [ ] **Người duyệt ký Cổng dừng D của Task #3** — ô cuối chưa tick, vẫn chờ

## Theo dõi riêng, ngoài mọi task

- [ ] Nợ Task #2 số 3 — 213 cảnh báo C6 thiếu cột "vì sao", và nâng C6 trở lại mức lỗi
- [ ] Nợ Task #2 số 5 — mã `D-X` dùng cho 11 quyết định khác nhau, sổ quyết định mất tác dụng
      truy vết
- [ ] Bảy chu trình `depends_on` mà kiểm tra C7 cảnh báo: `02-public` ba, `03-account` một,
      `06-admin` ba, `08-quality` một
- [ ] Hành vi không nhất quán giữa C4, C9, C10 về việc có bỏ qua khối mã hay không. C4 không bỏ
      qua, hai cái kia có. Đo được 2026-08-07
- [ ] Duyệt phần seed của [`taxonomy-service.md`](../specs/01-platform/taxonomy-service.md) và
      [`emoji-registry.md`](../specs/01-platform/emoji-registry.md) — bước 9 của lộ trình
- [ ] `docs/montessori/` — 22 file PDF, chưa spec nào sở hữu
- [ ] Chuyển `.agents/` vào `kidthink/` theo [`../SPEC.md`](../SPEC.md) mục 8
- [ ] Chuyển `infra/` vào `kidthink/infra/` khi tới lúc triển khai
- [ ] Nhánh lỗi PostgreSQL trong `scripts/check-services.ts` in thông điệp rỗng, mất `.message`
      của lỗi ECONNREFUSED
- [ ] Khảo sát 60 loại game bản v1 rút về 6 khuôn — phase P1, câu hỏi 1 của
      [`game-template-contract.md`](../specs/01-platform/game-template-contract.md)
- [ ] Kiểm toán `packages/ui` (1,2 MB) đối chiếu
      [`design-system-contract.md`](../specs/08-quality/design-system-contract.md) câu hỏi 1
- [ ] Cổng phía server thay cho `--no-verify`, câu hỏi 12 của
      [`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md)
- [ ] Thêm lại service S3 local vào `docker-compose.yml` khi làm tới
      [`image-storage.md`](../specs/01-platform/image-storage.md)
