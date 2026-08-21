# Kế hoạch — Task #96: Bộ tiết học mẫu (P4)

> **Loại task:** implementation lát dọc cộng luồng duyệt (M). Checklist: [`96-lesson-exemplar-set-todo.md`](96-lesson-exemplar-set-todo.md).
> **Chặn bởi** [`Task #95`](95-lesson-session-runner-plan.md) — spec khai `depends_on` bề mặt chạy tiết học.
> **Spec đóng:** [`lesson-exemplar-set.md`](../specs/05-content/lesson-exemplar-set.md) (P4, 11 rule, 9 scenario).

## 1. Outcome

Người dạy mới vào có một bộ tiết học **đã được người có nền sư phạm xem và ký**, phủ đủ ma trận
sáu năng lực nhân ba dải tuổi. Không phải "tiết học nào cũng dùng được", mà "mười tám tiết học này
được bảo đảm".

## 2. Bằng chứng đo được (2026-08-18)

1. **Chặn bởi** [`Task #95`](95-lesson-session-runner-plan.md): điều kiện mẫu cần bản ghi một lượt
   chạy thật, mà bảng đó chưa tồn tại.
2. Chữ "mẫu" xuất hiện **0 lần** trong lược đồ nội dung: cờ mẫu và bốn cột kèm theo đều cần
   migration cộng thêm.
3. Ma trận 18 ô (sáu năng lực nhân ba dải tuổi), sàn 18 tiết học mẫu.
4. **Năm trong sáu điều kiện mẫu kiểm được bằng máy**; điều kiện còn lại là người.
5. **Một lỗ hổng chủ sở hữu:** điều kiện số 2 cần ghi chép chơi thử với trẻ thật, nhưng chưa spec
   nào sở hữu nơi lưu ghi chép đó — [`pedagogical-evidence.md`](../specs/08-quality/pedagogical-evidence.md)
   chỉ mô tả quy trình. §11 Q3 của spec này đang chờ đúng câu đó.
6. §11 Q1 (ai đóng vai chuyên gia sư phạm mầm non) **chặn toàn bộ luồng duyệt**, và nó trùng nợ
   với §11 của [`lesson-model.md`](../specs/05-content/lesson-model.md) và
   [`mvp-scope.md`](../specs/00-foundation/mvp-scope.md).

## 3. Assumptions và ranh giới

1. **Hai câu hỏi người chặn phần duyệt, không chặn phần lược đồ.** WP96.1 và WP96.2 làm được
   trước khi có câu trả lời; WP96.3 thì không.
2. **Không tự phong mẫu.** Cờ mẫu chỉ bật sau khi có bản ký của người; máy chỉ chặn, không cấp.
3. **Nơi lưu ghi chép chơi thử phải có chủ trước khi dùng làm điều kiện.** Nếu không, điều kiện số
   2 là một ô trống được đánh dấu xong bằng niềm tin.
4. **Migration cộng thêm**, theo `BR-RBK-02`.
5. **Sàn 18 là sàn, không phải mục tiêu.** Cổng chặn dưới sàn; nó không thưởng cho việc vượt sàn.

## 4. Thứ tự

```text
WP96.0  Trả lời §11 Q1 và Q3 (cổng người: người ký, và chủ của nơi lưu ghi chép)
  ├──→ WP96.1  Migration cờ mẫu + bốn cột kèm theo
  │      └──→ WP96.2  Đề cử mẫu trong màn soạn
  │             └──→ WP96.3  Duyệt mẫu trong hàng đợi review (cần Q1)
  └──────────────────→ WP96.4  Cổng ma trận 18 ô và sàn 18, kèm ca âm
                             └──→ WP96.5  Test 11 rule, verification, lật status
```

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP96.0 | S | Chốt ai ký điều kiện người, và chốt nơi lưu ghi chép chơi thử có chủ | Hai hàng §11 có quyết định; nếu chưa có chủ thì ghi rõ đang chặn |
| WP96.1 | S | Migration cộng thêm cờ mẫu và bốn cột theo §7 | Migration chạy trên cơ sở dữ liệu đã có dữ liệu; cổng migration cộng thêm xanh |
| WP96.2 | M | Đề cử một tiết học làm mẫu trong màn soạn; hiện đủ sáu điều kiện và trạng thái từng điều kiện | Test: tiết học thiếu điều kiện kiểm được bằng máy không đề cử được |
| WP96.3 | M | Duyệt mẫu trong hàng đợi review; bản ký của người là điều kiện bật cờ | Test: cờ mẫu không bật được bằng đường nào khác ngoài duyệt |
| WP96.4 | M | Cổng ma trận 18 ô cộng sàn 18 tiết học mẫu, kèm fixture thiếu ô | Cổng **đỏ** trên fixture thiếu một ô; xanh khi đủ |
| WP96.5 | S | Test 11 rule; verification; lật `status` | 11 rule có test gọi tên mã; `node packages/gates/scripts/check-progress.ts` xanh |

## 6. Acceptance criteria

```gherkin
Scenario: Không tự phong mẫu
  Given một tiết học đạt cả năm điều kiện kiểm được bằng máy
  When chưa có bản ký của người
  Then cờ mẫu vẫn tắt

Scenario: Thiếu một ô trong ma trận thì cổng đỏ
  Given bộ mẫu thiếu một ô năng lực nhân dải tuổi
  When chạy cổng bộ tiết học mẫu
  Then cổng báo đỏ và nêu ô còn thiếu

Scenario: Điều kiện cần bản ghi chơi thử
  Given một tiết học chưa có bản ghi một lượt chạy thật
  When đề cử nó làm mẫu
  Then đề cử bị chặn kèm lý do nêu điều kiện còn thiếu

Scenario: Bỏ cờ mẫu cũng phải qua duyệt
  Given một tiết học đang là mẫu
  When có người muốn bỏ cờ mẫu
  Then thao tác đi qua hàng đợi review và được ghi vào log kiểm toán
```

## 7. Verification

```bash
pnpm exec biome check .
pnpm --filter @mindkid/gates test
pnpm db:generate && pnpm db:migrate
pnpm check
pnpm vitest run packages/db apps/web/tests
pnpm test
```

## 8. Definition of done

- Cờ mẫu và bốn cột tồn tại qua migration cộng thêm.
- Đề cử hiện đủ sáu điều kiện; năm điều kiện máy kiểm được chặn tự động.
- Cờ mẫu chỉ bật qua duyệt, và bỏ cờ cũng qua duyệt, có log kiểm toán.
- Cổng ma trận 18 ô và sàn 18 có ca âm chứng minh đỏ được.
- Nơi lưu ghi chép chơi thử có chủ, hoặc điều kiện số 2 được ghi rõ là đang chặn.
- 11 rule có test; spec `implemented`; `pnpm check` và `pnpm test` xanh.
