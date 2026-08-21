# Kế hoạch — Task #94: Ma trận phủ tư duy (P3)

> **Loại task:** dựng cổng đo lường (M). Checklist: [`94-thinking-coverage-matrix-todo.md`](94-thinking-coverage-matrix-todo.md).
> Thứ tự tám task: [`REMAINING-SEQUENCE.md`](REMAINING-SEQUENCE.md). Không chặn task nào, không bị task nào chặn.
> **Spec đóng:** [`thinking-coverage-matrix.md`](../specs/08-quality/thinking-coverage-matrix.md) (P3, 11 rule, 9 scenario).

## 1. Outcome

Trả lời được câu "nội dung đang dạy lệch về đâu" bằng một bảng số, không bằng cảm nhận. Ma trận
đọc nội dung đã publish, chiếu lên sáu năng lực và các trục tư duy, rồi chỉ ra ô nào trống.

Đây là cổng chất lượng nội dung, nên nó không sinh ra tính năng cho người dùng. Giá trị của nó là
chặn được việc phát hành một chương trình học nghiêng hẳn về một loại tư duy mà không ai nhận ra.

## 2. Bằng chứng đo được (2026-08-18)

1. **Chặn bởi dữ liệu, không bởi code.** Cả ba dependency đã `implemented`; sáu bảng spec đọc đều
   tồn tại trong lược đồ.
2. Mười hai mã trục tư duy đã có trong seed Lớp 1.
3. **Không nội dung nào được gắn tag trục tư duy.** Nên cổng bật ngày đầu sẽ báo mọi ô bằng 0 và
   chặn publish ngay lập tức — không phải vì nội dung sai, mà vì tag chưa có.
4. `packages/db/tests/gates/thinking-coverage.test.ts` không tồn tại; không có lệnh `pnpm` nào cho nó.
5. Không cần migration.
6. §11 Q1 của spec **trùng câu hỏi** Q1 của [`content-tagging.md`](../specs/01-platform/content-tagging.md):
   ba trục `plan`, `inhibit`, `shift` chưa có nội dung nào — thiếu nội dung hay thiếu giá trị phù
   hợp. Một câu hỏi, hai chỗ đang chờ.

## 3. Assumptions và ranh giới

1. **Đường đi phải chọn trước khi viết code** (WP94.0). Hai lựa chọn: gắn tag bù cho nội dung đã
   có rồi mới bật ngưỡng; hoặc bật cổng với ngưỡng tắt và mở dần. Chọn sai thì cổng đỏ vĩnh viễn
   và người ta học cách bỏ qua nó — đó là cách một cổng chết.
2. **Ngưỡng do người chốt**, không do mặc định trong code. Spec §11 Q2 và Q3 đang mở: sàn tính
   theo dải tuổi hay theo strand, và lesson với màn chơi có chung sàn không.
3. **Cổng chỉ đọc.** Nó không tự gắn tag, không tự sửa nội dung.
4. **Không siết từ vựng tag trong task này.** Việc gắn lại tag là việc của
   [`content-tagging.md`](../specs/01-platform/content-tagging.md); ở đây chỉ đo.

## 4. Thứ tự

```text
WP94.0  Chọn đường đi + chốt ngưỡng (cổng người, §11 Q1–Q3)
  └──→ WP94.1  Script đọc sáu bảng, in ma trận
         ├──→ WP94.2  Ngưỡng cấu hình được + ca âm
         └──→ WP94.3  Gắn tag bù, hoặc mở ngưỡng dần theo đường đã chọn
                └──→ WP94.4  Nối vào pnpm check, lật status
```

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP94.0 | S | Chốt đường đi và ngưỡng; ghi vào §11 kèm lý do | Ba hàng §11 có quyết định, hoặc có điều kiện mở lại đo được |
| WP94.1 | M | `packages/db/tests/gates/thinking-coverage.test.ts`: đọc sáu bảng, in ma trận năng lực nhân trục tư duy, kèm số nội dung mỗi ô | Chạy trên dữ liệu seed thật, in đúng số; không ghi gì vào cơ sở dữ liệu |
| WP94.2 | S | Ngưỡng đọc từ tệp cấu hình, không hằng số trong mã; fixture một ô dưới ngưỡng | Cổng **đỏ** trên fixture; xanh khi mọi ô đạt ngưỡng |
| WP94.3 | M | Theo đường đã chọn: gắn tag bù cho nội dung đã publish, hoặc mở ngưỡng theo từng bước có ghi lại | Số ô bằng 0 giảm theo từng bước, đo được bằng chính cổng |
| WP94.4 | S | Thêm cổng vào `pnpm check`; lật `status` | 11 rule có test; `pnpm check` xanh; `node packages/gates/scripts/check-progress.ts` xanh |

## 6. Acceptance criteria

```gherkin
Scenario: Ma trận đọc đúng nguồn
  Given nội dung đã publish có tag trục tư duy
  When chạy cổng đo phủ tư duy
  Then bảng in ra số nội dung theo từng ô năng lực nhân trục
  And cổng không ghi gì vào cơ sở dữ liệu

Scenario: Một ô dưới ngưỡng làm cổng đỏ
  Given ngưỡng đã chốt và một ô có số nội dung dưới ngưỡng
  When chạy cổng
  Then cổng báo đỏ và nêu tên ô đó

Scenario: Ngưỡng không nằm trong mã
  Given tệp cấu hình ngưỡng bị đổi
  When chạy cổng
  Then kết quả đổi theo tệp cấu hình, không cần sửa mã

Scenario: Ô trống vì thiếu tag được nói rõ
  Given một trục tư duy chưa có nội dung nào gắn tag
  When chạy cổng
  Then thông báo phân biệt "chưa có nội dung" với "chưa gắn tag"
```

## 7. Verification

```bash
pnpm exec biome check .
pnpm --filter @mindkid/gates test
pnpm check
pnpm vitest run scripts/tests
```

## 8. Definition of done

- Cổng đọc đúng sáu bảng và in ma trận đầy đủ.
- Ngưỡng sống trong tệp cấu hình, do người chốt, không phải mặc định trong mã.
- Có ca âm chứng minh cổng đỏ được khi một ô dưới ngưỡng.
- Thông báo phân biệt được thiếu nội dung với thiếu tag.
- Đường đi đã chọn được ghi lại, kèm số ô bằng 0 tại thời điểm bật cổng.
- 11 rule có test; spec `implemented`; `pnpm check` xanh.
