# Kế hoạch — Task #12: Dọn nợ cảnh báo trên spec đã approved, rồi lật cổng

> Viết 2026-08-08. Checklist thực thi: [`12-corpus-debt-sweep-todo.md`](12-corpus-debt-sweep-todo.md).
> Bản đồ liên task: [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
>
> Task cuối của chuỗi đóng corpus. Chạy **sau** [`09-p2-spec-closure-plan.md`](09-p2-spec-closure-plan.md),
> [`10-p3-spec-closure-plan.md`](10-p3-spec-closure-plan.md) và
> [`11-p4-p5-closure-plan.md`](11-p4-p5-closure-plan.md), vì ba task đó tự dọn cảnh báo trên file
> của mình; phần còn lại là nợ của các task cũ (#5, #6, #8).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Corpus 130/130 `approved` vẫn chưa phải xong. `pnpm lint:specs` còn cảnh báo trên các spec đã
`approved` từ những task trước, và `checkC16` vẫn đang ở **chặng 1** (bảng dưới 5 cột chỉ `warn`).
Nghĩa là cổng chưa tự giữ corpus: người viết spec mới hoàn toàn có thể lặp lại đúng khuyết tật cũ
mà pipeline vẫn xanh.

Task này làm hai việc và **đúng thứ tự đó**: dọn nợ trước, lật cổng sau. Lật trước là làm đỏ toàn
bộ pipeline và không ai push được.

Đo tại thời điểm viết (commit `e322414`, giữa lúc Task #9 đang chạy): **27 spec `approved` còn
mang cảnh báo — 10 `C6` và 23 `C16`**. Con số này sẽ **giảm** khi #9, #10, #11 chạy, vì mỗi task
dọn file của lô mình. Nợ thật của task này là phần còn lại sau ba task đó.

## 0. Điều kiện tiên quyết

```
grep -rl "^status: draft$" --include="*.md" docs/specs | xargs grep -l "^spec: " | grep -v TEMPLATE
grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l
pnpm lint:specs 2>&1 | tail -2
pnpm lint:specs 2>&1 | grep -oE "\[C[0-9]+\]" | sort | uniq -c
```

Lệnh 1 không in gì. Lệnh 2 ra **130**. Nếu chưa đạt thì task này chưa tới lượt.

Lấy danh sách nợ thật bằng đúng lệnh này, đừng dùng bảng in trong kế hoạch:

```
pnpm lint:specs 2>&1 | grep "\[C" | awk '{print $1}' | sed 's/:[0-9]*$//' | sort | uniq -c | sort -rn
```

## 1. Nợ đo được tại `e322414`

| Nhóm | Số file | Nội dung nợ |
|---|---|---|
| `C6` — thiếu cột "vì sao" | 5 file, 10 hàng | [`admin-auth.md`](../specs/06-admin/admin-auth.md) 4 · [`error-codes.md`](../specs/00-foundation/error-codes.md) 2 · [`payment-flow.md`](../specs/00-foundation/payment-flow.md) 2 · [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md) 1 · [`package-catalog.md`](../specs/00-foundation/package-catalog.md) 1 |
| `C16` — bảng mục 11 dưới 5 cột | 23 file | 11 file `01-platform` · 6 file `03-account` · 2 file `08-quality` · [`admin-auth.md`](../specs/06-admin/admin-auth.md) · [`taxonomy-browser.md`](../specs/06-admin/taxonomy-browser.md) · [`access-gating.md`](../specs/04-play/access-gating.md) · [`game-level-model.md`](../specs/05-content/game-level-model.md) |

Bốn file `00-foundation` mang nợ `C6` là chỗ đáng chú ý: đó là registry, spec mà mọi spec khác
tra cứu. Nợ ở đó lan xa nhất.

## 2. Phạm vi

**Trong phạm vi:**

- Điền "vì sao" cho toàn bộ `C6` còn lại trên spec `approved`.
- Chuyển toàn bộ bảng mục 11 dưới 5 cột sang 5 cột, gán `Chặn phase` và `Chủ` cho từng hàng.
- Lật `checkC16` sang chặng 2: bảng dưới 5 cột là `fail`.
- Đề xuất (cần chủ dự án duyệt) lật `checkC6` sang `fail` cho spec `status: approved` — mục 5.
- Cập nhật [`CONVENTIONS.md`](../specs/CONVENTIONS.md): ghi bảng 5 cột là bắt buộc, kèm bộ giá trị
  hợp lệ của cột `Chủ`.

**Ngoài phạm vi:**

- Trả lời các câu hỏi mở. Task này gán **chủ** và **phase** cho câu hỏi, không trả lời chúng.
- Sửa nội dung rule. Điền "vì sao" là viết lý do của rule đã có, không đổi rule.
- Code sản phẩm, ngoài `scripts/lint-specs-lib.ts` và test của nó.

## 3. Gán `Chủ` — bộ giá trị đóng

Đếm trên corpus hiện tại: `người quyết` 46 hàng, `hoãn` 29 hàng, còn lại là chủ cụ thể (`Infra`,
`Backend`, `Studio UI`, `Nội dung`, `Kế toán`) hoặc mã `D-*` cho hàng đã đóng. Task này chốt đó
là **bộ đóng** và ghi vào [`CONVENTIONS.md`](../specs/CONVENTIONS.md):

| Giá trị `Chủ` | Dùng khi |
|---|---|
| `người quyết` | Cần quyết định thương mại, pháp lý, hoặc phạm vi — chủ dự án |
| `hoãn` | Không ai cần trả lời trước phase đã ghi; nên kèm điều kiện mở lại đo được |
| `Infra` · `Backend` · `Studio UI` · `Nội dung` · `Kế toán` | Quyết định kỹ thuật hoặc nghiệp vụ nội bộ, có người phụ trách |
| `D-*` | Hàng **đã đóng**; số câu hỏi gạch ngang, ô này ghi mã quyết định |

Cấm để trống, cấm `—`, cấm `TBD`. `checkC16` đã coi rỗng và `—` là thiếu.

Khi gán, viết thêm điều kiện mở lại nếu là `hoãn`. Corpus đã có mẫu tốt: "hoãn — mở lại khi có
ước tính chi phí S3 thật". Câu như vậy đo được; "hoãn" trần thì không.

## 4. Thứ tự — bốn lô theo vùng

```
Lô 1: 4 file 00-foundation (C6, registry)                      → Cổng dừng A
Lô 2: 11 file 01-platform + 6 file 03-account (C16)
Lô 3: 6 file còn lại: admin-auth (C6+C16) · taxonomy-browser · access-gating
      · game-level-model · 2 file 08-quality                   → Cổng dừng B
Lô 4: lật checkC16 sang fail + cập nhật CONVENTIONS.md          → Cổng dừng cuối
```

Mỗi lô nhiều file nhưng mỗi file một commit — cùng luật với các task trước. [`admin-auth.md`](../specs/06-admin/admin-auth.md) vào lô 3
vì nó mang cả hai loại nợ, làm một lần cho gọn.

## 5. Lật cổng — làm đúng cách chứng minh được

Bài học đã ghi ở [`09-p2-spec-closure-plan.md`](09-p2-spec-closure-plan.md) mục 8 và ở nợ kỹ
thuật `ultracite` (CLI thoát 0 dù có lỗi): **cổng mới phải đỏ ngay lần chạy đầu**, nếu không thì
không tin là nó đang đo thật.

Trình tự cho `checkC16` chặng 2:

1. Viết ca âm **trước**: spec giả `status: approved`, bảng mục 11 ba cột → phải sinh đúng một
   `fail`.
2. Chạy test — **phải đỏ**.
3. Sửa `checkC16` trong [`scripts/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts): nhánh
   `!tableHas5Cols` gọi `fail` khi `status: approved`, giữ `warn` cho `draft`.
4. Chạy test — **phải xanh**.
5. Xoá thân nhánh mới, chạy lại — **phải đỏ trở lại**. Bước này không bỏ được.
6. Khôi phục. `pnpm lint:specs` — 0 lỗi, 0 cảnh báo.

Đề xuất kèm theo, cần chủ dự án duyệt: làm y hệt cho `checkC6` (hiện tại luôn `warn`) — spec
`approved` thiếu cột "vì sao" thành `fail`. Lý do: sau task này số `C6` về 0, nên lật không làm đỏ
gì; không lật thì nợ mọc lại lần sau. Nếu chủ dự án bác, ghi lại lý do bác vào sổ `D-*` chứ đừng
để câu hỏi treo.

## 6. Cổng dừng

### Cổng dừng A — sau lô 1

- 4 file `00-foundation` không còn `C6`.
- Đọc lại từng "vì sao" mới: là lý do, không phải diễn giải lại rule.
- `pnpm lint:specs` 0 lỗi.

### Cổng dừng B — sau lô 3

- `pnpm lint:specs` — **0 cảnh báo**. Đây là lần đầu corpus đạt số này.
- Mọi hàng câu hỏi mở toàn corpus có `Chặn phase` và `Chủ` thuộc bộ đóng ở mục 3.
- `pnpm check && pnpm test` xanh.

### Cổng dừng cuối — sau lô 4

- Ca âm `checkC16` chặng 2 đã chứng minh đỏ, xanh, rồi đỏ trở lại.
- `pnpm lint:specs` 0 lỗi, 0 cảnh báo **với cổng mới**.
- [`CONVENTIONS.md`](../specs/CONVENTIONS.md) có mục bảng 5 cột + bộ giá trị `Chủ`.
- [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md) cập nhật: bốn điều kiện "xong" đều đạt.
- Quyết định về `checkC6` đã ghi vào sổ `D-*`, dù duyệt hay bác.

## 7. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Lật cổng trước khi dọn hết | Pipeline đỏ, không ai push được, áp lực tắt cổng | Thứ tự ở mục 4 — lô 4 là lô cuối, sau khi lint đã 0 cảnh báo |
| Gán `Chủ` cho xong việc | Câu hỏi có chủ trên giấy, không ai thật sự nhận | Bộ đóng ở mục 3; `hoãn` phải kèm điều kiện mở lại đo được |
| Sửa 23 file bảng mục 11 bằng thao tác máy móc | Hàng câu hỏi bị đổi nghĩa khi thêm cột | Mỗi file một commit, đọc mục 11 trước khi sửa, không dùng `sed` hàng loạt |
| Điền "vì sao" cho registry ([`error-codes.md`](../specs/00-foundation/error-codes.md), [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md)) sai ý gốc | Sai ở chỗ mọi spec khác tra cứu | Lô 1 đi đầu và có cổng riêng; đối chiếu [`business-rules.md`](../specs/00-foundation/business-rules.md) mục 7.3 trước khi viết |
| Sửa `checkC16` mà không có ca âm | Cổng có thể không đo gì cả, như `ultracite` | Mục 5 bước 5 bắt buộc: xoá thân nhánh, test phải đỏ trở lại |

## 8. Kiểm chứng

```
pnpm lint:specs 2>&1 | tail -2                  # 0 lỗi, 0 cảnh báo
pnpm test scripts/tests/lint-specs.test.ts      # ca âm chặng 2 xanh
pnpm check && pnpm test
```

Chứng minh cổng còn sống (chạy tay, không đưa vào CI):

```
# tạo một spec giả approved với bảng mục 11 ba cột trong thư mục tạm rồi chạy lint — phải đỏ
```

Sau task này, bốn điều kiện "xong" ở [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md) đều đạt, và corpus
spec có cổng tự giữ. Việc tiếp theo của dự án là code, không phải spec.
