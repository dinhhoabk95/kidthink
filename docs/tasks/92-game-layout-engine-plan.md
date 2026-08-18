# Kế hoạch — Task #92: Bộ dựng layout cho màn chơi (P1)

> **Loại task:** implementation lát dọc (M). Checklist: [`92-game-layout-engine-todo.md`](92-game-layout-engine-todo.md).
> Thứ tự tám task: [`REMAINING-SEQUENCE.md`](REMAINING-SEQUENCE.md). **Chặn [`Task #93`](93-deterministic-randomness-plan.md) và [`Task #97`](97-template-authoring-kit-plan.md).**
> **Spec đóng:** [`game-layout-engine.md`](../specs/01-platform/game-layout-engine.md) (P1, `mvp: true`, 12 rule, 9 scenario).

## 1. Outcome

Một `layout_id` cho ra một danh sách ô có toạ độ, ổn định và kiểm được. Hôm nay `layout_id` là
một chuỗi không ai đọc: nó nằm trong hợp đồng template, đi vào lược đồ, rồi dừng ở đó. Sau task
này nó thành hình học, và màn chơi hết phụ thuộc vào việc mỗi template tự đặt phần tử.

Đây là món nợ engine `mvp: true` cũ nhất còn lại, và nó chặn hai task sau, nên nó đi trước.

## 2. Bằng chứng đo được (2026-08-18)

1. **Không có mã layout nào.** Không tệp nào chứa `LayoutId`, `computeLayout` hay `resolveLayout`.
   `packages/game-engine/src/layout/` không tồn tại.
2. Mười hai giá trị layout tồn tại **chỉ dưới dạng chuỗi rời** trong hợp đồng sáu template — ví
   dụ `gt001.ts:40` khai `layouts: ["grid", "horizontal-row"]`, tương tự ở `gt004.ts:73` và
   `gt006.ts:36`. Cột `layouts` trong lược đồ là `text[]`.
3. Không có gì biến một id thành toạ độ: không kiểu `Slot`, không hàm hình học, không ngưỡng vùng
   chạm.
4. Spec cố định `LayoutId` là union 12 giá trị và `Slot{index, x, y, w, h, hitW, hitH, page}` —
   nên đây là việc lấp một hợp đồng đã viết, không phải thiết kế mới.
5. Cả ba dependency của spec đều đã `implemented`; không có gì chặn về phía phụ thuộc.

## 3. Assumptions và ranh giới

1. **Hai câu hỏi người chặn việc mở tệp**, không chặn task: §11 Q1 (dải 3–4 tuổi có cần nút sang
   trang nhìn thấy được không) định hình `BR-LAY-04`; §11 Q2 (12 `LayoutId` có gộp được không)
   quyết định viết bao nhiêu hàm. Trả lời Q2 trước WP92.2, nếu không thì viết 12 hàm rồi xoá 7.
2. **Layout không được ngẫu nhiên** (`BR-LAY-01`). Cùng `layout_id` và cùng số ô cho cùng `Slot[]`.
   Việc xáo trộn thứ tự item thuộc [`Task #93`](93-deterministic-randomness-plan.md).
3. **Ngưỡng vùng chạm lấy từ** [`accessibility.md`](../specs/08-quality/accessibility.md), không
   tự đặt số mới ở đây.
4. **Không đổi hành vi sáu template đang chạy** trong task này. Chúng nhận layout qua
   `GameEngine.load()`; test template hiện có phải cho cùng kết quả.

## 4. Thứ tự

```text
WP92.0  Trả lời §11 Q1 và Q2 (cổng người)
  └──→ WP92.1  Kiểu LayoutId + Slot + registry hàm layout
         ├──→ WP92.2  Hàm hình học cho từng layout, test ổn định theo index
         │      └──→ WP92.3  Ngưỡng vùng chạm theo accessibility, test theo dải tuổi
         │             └──→ WP92.4  Phân trang (BR-LAY-04)
         └──→ WP92.5  Nối vào GameEngine.load + ô chọn layout trong studio
                └──→ WP92.6  Siết hợp đồng: layouts từ string[] thành union, cổng + ca âm
                       └──→ WP92.7  Verification, lật status
```

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP92.0 | S | Trả lời Q1 (điều hướng phân trang cho dải 3–4) và Q2 (gộp `LayoutId`); ghi câu trả lời vào §11 | Hai hàng §11 chuyển sang gạch ngang kèm quyết định |
| WP92.1 | S | `packages/game-engine/src/layout/`: union `LayoutId`, kiểu `Slot`, registry id sang hàm | Test: mỗi giá trị union có đúng một hàm; id lạ không dựng được |
| WP92.2 | M | Hàm hình học cho từng layout sau khi Q2 chốt số hàm | Test: cùng id và cùng số ô cho cùng `Slot[]` hai lần chạy; ô không chồng nhau |
| WP92.3 | S | Ngưỡng vùng chạm `hitW`/`hitH` theo [`accessibility.md`](../specs/08-quality/accessibility.md) | Test theo ba dải tuổi: mọi ô đạt ngưỡng tối thiểu |
| WP92.4 | M | Phân trang khi số ô vượt sức chứa của layout (`BR-LAY-04`), theo quyết định Q1 | Test: `slotCount` vượt trần thì `page` tăng, thứ tự index không đảo |
| WP92.5 | M | `GameEngine.load()` chọn hàm theo `layout_id` trong tham số độ khó; studio có ô chọn layout | Test engine: đổi `layout_id` đổi `Slot[]`; test template hiện có không đổi kết quả |
| WP92.6 | S | Hợp đồng template: `layouts` từ `string[]` thành union 12 giá trị; cổng chặn giá trị lạ, kèm fixture sai | Cổng đỏ trên fixture chứa layout không có trong union |
| WP92.7 | S | Verification đầy đủ, lật `status` sang `implemented` | 12 rule `BR-LAY` có test; `pnpm check:progress` xanh |

## 6. Acceptance criteria

```gherkin
Scenario: BR-LAY-01 — layout không ngẫu nhiên
  Given một layout_id và một số ô
  When dựng layout hai lần
  Then hai lần cho cùng danh sách Slot theo cùng thứ tự index
  And không lời gọi ngẫu nhiên nào trong thư mục layout

Scenario: BR-LAY-04 — vượt sức chứa thì sang trang
  Given một layout có trần sức chứa
  When số ô yêu cầu vượt trần
  Then các ô được chia thành nhiều trang
  And thứ tự index giữa các trang không đảo

Scenario: Vùng chạm đủ lớn cho dải tuổi nhỏ nhất
  Given một layout dựng cho dải 3–4 tuổi
  When đọc hitW và hitH của từng ô
  Then mọi ô đạt ngưỡng tối thiểu ở accessibility

Scenario: Giá trị layout lạ bị chặn ở hợp đồng
  Given một hợp đồng template khai một layout không có trong union
  When chạy cổng kiểm hợp đồng template
  Then cổng báo đỏ và nêu giá trị lạ
```

## 7. Verification

```bash
pnpm exec biome check .
pnpm lint:specs
pnpm check
pnpm vitest run packages/game-engine
pnpm test
```

## 8. Definition of done

- `LayoutId` là union đóng, và mỗi giá trị có đúng một hàm dựng.
- Cùng đầu vào cho cùng `Slot[]`; không lời gọi ngẫu nhiên nào trong thư mục layout.
- Vùng chạm đạt ngưỡng của [`accessibility.md`](../specs/08-quality/accessibility.md) ở cả ba dải tuổi.
- Sáu template đang chạy cho cùng kết quả test như trước task.
- Hợp đồng template không còn nhận layout tự do; cổng có ca âm.
- 12 rule `BR-LAY` có test; spec `implemented`; `pnpm check` và `pnpm test` xanh.
