# Kế hoạch — Task #13: Chuẩn hoá cột `Chủ` ở mục 11, và cổng `C17`

> Viết 2026-08-08, đo tại commit `9f1ef3f`, **đo lại nguyên số ở `be75db4`** sau khi Task #12
> đóng. Bản đồ liên task: [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md).
>
> Chạy **sau** [`12-corpus-debt-sweep-plan.md`](12-corpus-debt-sweep-plan.md) — task đó đã đóng ở
> `be75db4`, nên điều kiện tiên quyết mục 0 hiện đã đạt.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Task #12 đưa mọi bảng mục 11 về 5 cột và lật `checkC16` sang chặng 2. Sau đó `pnpm --filter @mindkid/gates test`
sẽ xanh sạch — nhưng **xanh không có nghĩa là hai cột mới nói được điều gì**. `checkC16` chỉ hỏi
một câu: ô `Chặn phase` và ô `Chủ` có rỗng không. Nó không hỏi ô đó **chứa gì**.

Đo ở commit `9f1ef3f`: trong 257 hàng câu hỏi sống, **76 hàng có `Chủ` không phải một chủ**.
Nặng nhất là 35 hàng mà ô `Chủ` chứa **câu trả lời** — nghĩa là câu hỏi đã chốt nhưng hàng chưa
gạch, và corpus đang báo 257 câu mở trong khi thật ra khoảng 222.

Task này làm ba việc, đúng thứ tự đó: viết cổng `C17` ở mức `warn` để có danh sách nợ đo được,
dọn 76 hàng, rồi lật `C17` sang `fail`.

## 0. Điều kiện tiên quyết

```
git log --oneline -1                            # Task #12 đã đóng
pnpm --filter @mindkid/gates test 2>&1 | tail -2                  # 0 lỗi, 0 cảnh báo
grep -rl "^status: approved" --include="*.md" docs/specs | xargs grep -l "^spec: " | wc -l
```

Lệnh cuối ra **130**. Nếu `pnpm --filter @mindkid/gates test` còn cảnh báo thì Task #12 chưa xong và task này chưa
tới lượt — hai task cùng sửa mục 11 của những file giao nhau, chạy song song là xung đột merge.

Đo ở `be75db4`: cả ba điều kiện đã đạt. Task #12 đóng lúc `be75db4`, gồm cả `C16` và `C6` chặng 2
(spec `approved` thiếu cột "vì sao" hoặc bảng dưới 5 cột nay là **lỗi**, không còn là cảnh báo).

## 1. Vì sao cổng hiện tại không bắt được

`checkC16` trong [`packages/gates/src/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) coi một ô là
thiếu khi nó rỗng, `-`, hoặc `—`. Mọi chuỗi khác đều qua. Nên các giá trị sau đang **hợp lệ với
cổng** mà vô nghĩa với người đọc:

| Ô `Chủ` gặp thật trong corpus | Vấn đề |
|---|---|
| `Chốt: Dùng Google Fonts open-source (OFL license), không tốn phí bản quyền` | Đây là câu trả lời, không phải chủ. Hàng lẽ ra phải gạch |
| `Product / QA` · `DevOps / Infra` · `Search Infra / Database` | Tên đội tự phát, không nằm trong bộ nào; không tra được ai nhận |
| [`payment-approval.md`](../specs/06-admin/payment-approval.md) | Trỏ sang spec khác thay vì ghi chủ — chuyển tiếp vô hạn |
| `cần chủ + hạn` | Ghi rằng còn thiếu chủ, tức là chính nó là nợ |

[`CONVENTIONS.md`](../specs/CONVENTIONS.md) hiện chỉ có một dòng nhắc bảng phải 5 cột
(mục checklist). Không có chỗ nào định nghĩa **bộ giá trị**. Không định nghĩa thì không kiểm được,
và nợ mọc lại ở spec tiếp theo.

## 2. Nợ đo được tại `9f1ef3f`

| Nhóm | Hàng | File | Nội dung |
|---|---|---|---|
| A | 35 | 25 | Câu đã chốt, ô `Chủ` chứa câu trả lời, hàng **chưa gạch**. 18 hàng đã kèm mã `D-*`, 17 hàng chưa |
| B | 32 | 23 | Tên vai trò tự do ngoài bộ 5 đội, hoặc ghi `cần chủ`, hoặc chứa phase |
| C | 5 | 5 | Ô `Chủ` là liên kết trỏ spec khác |
| D | 4 | 4 | Tên vai trò dính văn xuôi giải thích dài |

Tổng **76 hàng trên 42 file**. Lấy lại danh sách lúc làm, đừng tin số in ở đây — Task #12 vẫn
đang thêm hàng mới:

```
pnpm --filter @mindkid/gates test 2>&1 | grep -F "[C17]"
```

Phân bố theo vùng: `00-foundation` 6 file / 14 hàng · `01-platform` 6 file / 9 hàng ·
`02-public` 7 file / 11 hàng · `03-account` 9 file / 14 hàng · `04-play` 11 file / 22 hàng ·
`08-quality` 3 file / 6 hàng.

Nhóm A là nhóm đáng làm trước: nó không chỉ sai định dạng, nó làm **sai số đếm** câu hỏi mở của
toàn dự án. Mọi ước lượng việc còn lại đang tính dư khoảng 35 câu.

## 3. Bộ giá trị đóng cho `Chủ`

Ô `Chủ` phải khớp đúng **một** trong bốn dạng:

| Dạng | Viết thế nào | Dùng khi |
|---|---|---|
| Chủ dự án | `người quyết` | Quyết định thương mại, pháp lý, hoặc phạm vi |
| Hoãn | `hoãn` hoặc `hoãn — <điều kiện mở lại đo được>` | Không ai cần trả lời trước phase đã ghi ở cột 4 |
| Đội | `Infra` · `Backend` · `Studio UI` · `Nội dung` · `Kế toán` | Quyết định kỹ thuật hoặc nghiệp vụ nội bộ |
| Mã quyết định | `D-XX`, kèm task trong ngoặc nếu cần: `D-AE (T11)` | **Chỉ** cho hàng đã gạch `~~n~~` |

Cấm: rỗng, `—`, `TBD`, tên đội tự phát, văn xuôi. Phase đi ở cột `Chặn phase`, không nhét vào cột
`Chủ`.

**Bảng quy đổi cho nhóm B** — đây là chỗ dễ tuỳ tiện nhất, nên chốt sẵn:

| Gặp | Đổi thành |
|---|---|
| `DevOps / Infra` · `Offline Infrastructure & Content Caching` · `Search Infra / Database (…)` · `PWA / Compliance` | `Infra` |
| `Data / Adaptive` · `Play Player` · `Play Recommendation` · `Security / Anti-cheat` · `AI Addon` · `Account & Child Multi-Profile` · `Teacher & Institution Addon` | `Backend` |
| `Account Settings UX` | `Studio UI` |
| `nội dung` (viết thường) | `Nội dung` |
| `Product / QA` · `Product / Analytics` · `Product / Parent Features` · `Product / Profile Security` · `Chuyên gia pháp lý / Ban điều hành` | `người quyết` |
| `cần chủ + hạn` · `cần chủ có tên (D-W)` · `cần **người** — …` | `người quyết`; hạn ghi ở cột `Chặn phase` |
| `người quyết — chặn P2` · `P1` | Tách: phase về cột `Chặn phase`, cột `Chủ` còn `người quyết` |

Phần văn xuôi bị cắt khỏi ô `Chủ` **không được vứt**. Nó về cột `Câu hỏi` hoặc cột `Chặn gì`, tuỳ
nó đang giải thích cái gì.

**Nhóm A — khuôn đóng một hàng.** Mẫu đã có trong corpus, hàng 2 của
[`content-versioning.md`](../specs/00-foundation/content-versioning.md) mục 11:

- Số hàng: `~~3~~`
- Cột `Câu hỏi`: câu hỏi gốc gạch ngang, rồi **`Đóng <ngày> (T13)`: <câu trả lời chuyển từ ô `Chủ` sang>**
- Cột `Chặn gì`: `—`
- Cột `Chặn phase`: `Đã đóng`
- Cột `Chủ`: mã `D-*`

17 hàng nhóm A chưa có mã thì cấp mã mới. Mã lớn nhất đang dùng là `D-BO`, nên bắt đầu từ
`D-BP`. Lấy lại bằng lệnh lúc làm, đừng hardcode:

```
grep -rhoE "D-B[A-Z]" docs/specs docs/tasks | sort -u | tail -1
```

**Nhóm C** — ô `Chủ` là liên kết: chủ thật là chủ của câu hỏi được trỏ tới. Mở file đó, đọc hàng
tương ứng, chép giá trị `Chủ` của nó về. Liên kết chuyển sang cột `Chặn gì`.

## 4. Cổng `C17` — hai chặng

Cùng cách làm đã dùng cho `C16`, và cùng lý do: cổng không có ca âm là cổng chưa tồn tại (nợ
`ultracite` — CLI thoát 0 dù có lỗi).

Chặng 1 (bước 1 của task, **trước** khi dọn):

1. Ca âm trước: spec giả `status: approved`, một hàng mục 11 có `Chủ` là `Product / QA` → đúng
   một `warn` `C17`. Một hàng `Chủ` là `người quyết` → im lặng.
2. Chạy test — **phải đỏ**.
3. Viết `checkC17`: `Chủ` phải khớp một trong bốn dạng ở mục 3. Hàng gạch `~~n~~` chỉ chấp nhận
   `D-*`. Mức `warn` cho mọi `status`.
4. Chạy test — **phải xanh**. `pnpm --filter @mindkid/gates test` in ra khoảng 76 cảnh báo `C17`, 0 lỗi.

Chặng 2 (bước cuối, sau khi dọn hết):

5. Đổi `warn` sang `fail` khi `status: approved`, giữ `warn` cho `draft`.
6. Xoá thân nhánh vừa đổi, chạy lại ca âm — **phải đỏ trở lại**. Không bỏ được bước này.
7. Khôi phục. `pnpm --filter @mindkid/gates test` — 0 lỗi, 0 cảnh báo.

Đặt `C17` ở mức `warn` trước có hai cái lợi đo được: danh sách nợ do chính cổng sinh ra (không
phải chép tay từ kế hoạch này), và pipeline không đỏ trong lúc 42 file còn đang dọn.

## 5. Quy trình chuẩn cho một file — sáu việc, đúng thứ tự

Áp cho cả 42 file, không ngoại lệ:

1. `pnpm --filter @mindkid/gates test 2>&1 | grep <tên-file>` — lấy đúng số hàng nợ.
2. Đọc **cả mục 11**, không chỉ hàng bị báo. Hàng bên cạnh thường cùng một lỗi mà cổng chưa bắt.
3. Phân loại từng hàng nợ vào A / B / C / D theo mục 2.
4. Sửa theo luật mục 3. Sửa tay từng hàng — **không** `sed` hàng loạt lên bảng markdown.
5. `pnpm --filter @mindkid/gates test 2>&1 | grep <tên-file>` trống, và `tail -2` vẫn 0 lỗi.
6. Một commit: `docs(specs): T13 — chuẩn hoá Chủ cho <tên-file>`.

Việc 2 là việc dễ bỏ nhất và tốn nhất khi bỏ: cổng `C17` chỉ đọc ô `Chủ`, còn ô `Chặn phase` bên
cạnh có thể đang chứa nguyên một đoạn văn — corpus hiện có ít nhất 40 ô như vậy. Thấy thì sửa
luôn trong cùng commit.

## 6. Thứ tự — sáu lô theo vùng, rồi cổng

```
Bước 1 : checkC17 chặng 1 (warn) + ca âm                    → Cổng dừng A
Lô 1   : 00-foundation, 6 file / 14 hàng   (registry, đi đầu)
Lô 2   : 01-platform,   6 file /  9 hàng
Lô 3   : 02-public,     7 file / 11 hàng
Lô 4   : 03-account,    9 file / 14 hàng   → Cổng dừng B (giữa đường)
Lô 5   : 04-play,      11 file / 22 hàng
Lô 6   : 08-quality,    3 file /  6 hàng
Bước cuối : C17 chặng 2 (fail) + CONVENTIONS.md + CORPUS-CLOSURE.md → Cổng dừng cuối
```

`00-foundation` đi đầu vì đó là registry — mọi spec khác tra cứu nó, và bốn file trong lô
([`event-catalog.md`](../specs/00-foundation/event-catalog.md),
[`repo-bootstrap.md`](../specs/00-foundation/repo-bootstrap.md),
[`access-ladder.md`](../specs/00-foundation/access-ladder.md),
[`child-data-compliance.md`](../specs/00-foundation/child-data-compliance.md)) mang 11 trong 14
hàng của lô. `04-play` để gần cuối vì nặng nhất và toàn nhóm A — làm sau khi tay đã quen khuôn.

Lô độc lập nhau: không lô nào đọc kết quả của lô khác. Chạy song song được nếu có hai người, trừ
bước 1 và bước cuối.

## 7. Cổng dừng

### Cổng dừng A — sau bước 1

- Ca âm `C17` đã chứng minh đỏ rồi xanh.
- `pnpm --filter @mindkid/gates test` — 0 lỗi, số cảnh báo `C17` bằng số hàng đo ở mục 2 (± số hàng Task #12 mới thêm).
- Số đó được ghi vào [`13-question-owner-normalization-todo.md`](13-question-owner-normalization-todo.md) làm mốc đếm ngược.

### Cổng dừng B — sau lô 4

- `C17` giảm đúng bằng số hàng của bốn lô đầu. Lệch nghĩa là có file bị sửa mà không kiểm.
- Đọc lại 5 hàng nhóm A bất kỳ đã đóng: câu trả lời có nằm ở cột `Câu hỏi` không, hay bị bỏ rơi.
- `pnpm check && pnpm test` xanh.

### Cổng dừng cuối

- `pnpm --filter @mindkid/gates test` — 0 lỗi, 0 cảnh báo **với `C17` ở chặng 2**.
- Ca âm chặng 2 đã chứng minh đỏ → xanh → đỏ.
- [`CONVENTIONS.md`](../specs/CONVENTIONS.md) có mục bộ giá trị `Chủ` (bảng mục 3) và khuôn đóng
  một hàng (mục 3, nhóm A).
- [`CORPUS-CLOSURE.md`](CORPUS-CLOSURE.md) cập nhật số câu hỏi mở thật sau khi trừ 35 hàng nhóm A.
- Mọi mã `D-*` mới cấp trong task này đều xuất hiện đúng một lần trong corpus.

## 8. Ngoài phạm vi

- **Trả lời câu hỏi mở.** Task này gán chủ và đóng những hàng **đã** có câu trả lời nằm sai chỗ.
  Nó không quyết định thay ai.
- Chuẩn hoá cột `Chặn phase` thành bộ đóng. Cột đó hiện có hơn 100 giá trị khác nhau; gom lại là
  một task riêng, và phải chốt bộ phase trước. Task này chỉ dời phase khỏi ô `Chủ` khi gặp.
- Sửa nội dung rule hoặc nội dung câu hỏi.
- Code sản phẩm, ngoài [`packages/gates/src/lint-specs-lib.ts`](../../scripts/lint-specs-lib.ts) và test của nó.

## 9. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Chạy đè lên Task #12 đang dở | Xung đột merge trên chính mục 11 của file giao nhau | Điều kiện tiên quyết mục 0: lint phải 0 cảnh báo trước khi bắt đầu |
| Đóng nhầm hàng nhóm A | Một câu hỏi thật bị coi là đã trả lời, mất dấu vĩnh viễn | Chỉ đóng khi ô `Chủ` chứa câu trả lời **tự nó đủ nghĩa**; nghi ngờ thì để `người quyết` và ghi vào cổng dừng |
| Quy đổi nhóm B tuỳ tiện | `Backend` nhận việc mà không ai báo | Bảng quy đổi mục 3 là bắt buộc; giá trị ngoài bảng thì dừng lại hỏi, không tự chế |
| Vứt mất văn xuôi khi cắt ô | Mất lý do đã ghi, không khôi phục được từ diff sau nhiều commit | Mục 3: văn xuôi chuyển sang `Câu hỏi` hoặc `Chặn gì`, không xoá |
| Lật `C17` sang `fail` sớm | Pipeline đỏ, không ai push được | Bước cuối, sau khi cảnh báo về 0 — cùng thứ tự đã dùng ở Task #12 |
| `checkC17` khớp lỏng, ví dụ chỉ tìm chuỗi con `người quyết` | Cổng xanh giả trên ô `người quyết — chặn P2` | Ca âm phải có đúng ô đó và mong đợi một `warn` |

## 10. Kiểm chứng toàn task

```
pnpm --filter @mindkid/gates test 2>&1 | tail -2                  # 0 lỗi, 0 cảnh báo
pnpm test packages/gates/tests/lint-specs.test.ts      # ca âm C17 hai chặng xanh
pnpm check && pnpm test
```

Đếm lại câu hỏi mở thật sau task:

```
grep -rh "^| [0-9]" docs/specs --include="*.md" | wc -l
```

Sau task này, hai cột thêm vào ở Task #12 mới thật sự đo được điều chúng hứa, và số câu hỏi mở
của dự án là số thật chứ không phải số phồng.
