# Kế hoạch — Task #95: Bề mặt chạy tiết học (P4)

> **Loại task:** implementation lát dọc (L). Checklist: [`95-lesson-session-runner-todo.md`](95-lesson-session-runner-todo.md).
> Thứ tự tám task: [`REMAINING-SEQUENCE.md`](REMAINING-SEQUENCE.md). **Chặn** [`Task #96`](96-lesson-exemplar-set-plan.md).
> **Spec đóng:** [`lesson-session-runner.md`](../specs/04-play/lesson-session-runner.md) (P4, 16 rule, 9 scenario — spec P4 lớn nhất).

## 1. Outcome

Người dạy mở một tiết học, đi qua từng bước cùng trẻ, ghi lại quan sát của mình, và bản ghi đó
không đổi khi nội dung tiết học được sửa về sau. Đây là chỗ dữ liệu **người lớn quan sát** vào hệ
thống, khác hẳn dữ liệu máy đo từ màn chơi.

## 2. Bằng chứng đo được (2026-08-18)

1. **Bắt đầu được ngay**: cả bốn dependency của spec đã `implemented`.
2. **Ba bảng chưa tồn tại**: bản ghi phiên chạy tiết học, bản ghi bước, và tiến độ hoạt động. Các
   bảng tiết học và hoạt động đã có, nên đây là lược đồ cộng thêm, không phải đổi lược đồ.
3. Không có route nào cho việc chạy tiết học.
4. `BR-LSR-07` đòi ghim phiên bản nội dung theo từng lần chạy — nên bản ghi phải giữ tham chiếu
   phiên bản, không chỉ tham chiếu tiết học.
5. Spec có 16 rule, nhiều nhất trong bốn spec P4 còn lại.

## 3. Assumptions và ranh giới

1. **Hai câu hỏi người chặn migration**, không chặn task: §11 Q1 (ba mức quan sát có đủ không) và
   §11 Q3 (quan sát có chảy vào mastery thích ứng không). Q3 định hình lược đồ — trả lời trước
   WP95.1, vì thêm cột sau khi có dữ liệu thật đắt hơn nhiều.
2. **Một lượt chạy gắn một trẻ.** Nhiều trẻ cùng lúc là câu hỏi P5 (§11 Q2), ngoài phạm vi.
3. **Quan sát của người dạy không phải telemetry.** Nếu Q3 chốt "không chảy vào mastery" thì cấm
   trộn hai nguồn ở tầng đọc, không chỉ ở tầng ghi.
4. **Migration cộng thêm** — điều kiện của `BR-RBK-02` ở [`release-rollback.md`](../specs/01-platform/release-rollback.md).
5. **Vào từ player curriculum**, không dựng điều hướng mới song song.

## 4. Thứ tự

```text
WP95.0  Trả lời §11 Q1 và Q3 (cổng người, Q3 định hình lược đồ)
  └──→ WP95.1  Migration cộng thêm ba bảng
         ├──→ WP95.2  Route mở phiên chạy và ghi từng bước
         │      └──→ WP95.3  Ba mức quan sát + ghim phiên bản nội dung
         │             └──→ WP95.4  Màn xem lại một lượt chạy, vào từ player curriculum
         └──────────────────→ WP95.5  Test 16 rule, verification, lật status
```

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP95.0 | S | Chốt số mức quan sát và chốt quan sát có chảy vào mastery hay không; ghi vào §11 | Hai hàng §11 có quyết định trước khi viết migration |
| WP95.1 | M | Migration cộng thêm ba bảng theo §7, kèm tham chiếu phiên bản nội dung | Migration chạy trên cơ sở dữ liệu đã có dữ liệu; cổng migration cộng thêm xanh |
| WP95.2 | L | Route mở phiên chạy, ghi bước, đóng phiên; quyền theo actor người dạy | Test tích hợp: một lượt chạy thật ghi đủ ba bảng |
| WP95.3 | M | Ba mức quan sát; ghim phiên bản nội dung mỗi lần chạy (`BR-LSR-07`) | Test: sửa tiết học sau khi chạy không đổi bản ghi đã ghim |
| WP95.4 | M | Màn xem lại một lượt chạy; lối vào từ player curriculum | Test giao diện: mở được từ curriculum, hiện đủ bước và quan sát |
| WP95.5 | M | Test cho 16 rule; verification đầy đủ; lật `status` | 16 rule có test gọi tên mã; `pnpm check:progress` xanh |

## 6. Acceptance criteria

```gherkin
Scenario: Một lượt chạy ghi đủ ba bảng
  Given một tiết học đã publish và một trẻ
  When người dạy chạy hết tiết học
  Then có một bản ghi phiên, các bản ghi bước, và tiến độ hoạt động

Scenario: BR-LSR-07 — bản ghi ghim phiên bản nội dung
  Given một lượt chạy đã hoàn tất
  When tiết học được sửa và publish phiên bản mới
  Then bản ghi cũ vẫn trỏ phiên bản đã dùng lúc chạy

Scenario: Quan sát của người dạy không lẫn vào telemetry máy đo
  Given một lượt chạy có quan sát của người dạy
  When đọc nguồn dữ liệu mastery
  Then quan sát của người dạy không xuất hiện ở đó, trừ khi quyết định Q3 nói ngược lại

Scenario: Người không có quyền dạy không mở được phiên chạy
  Given một người dùng không có quyền dạy
  When gọi route mở phiên chạy
  Then phản hồi là 403 hoặc 404 theo error-codes
```

## 7. Verification

```bash
pnpm exec biome check .
pnpm lint:specs
pnpm db:generate && pnpm db:migrate
pnpm check
pnpm vitest run packages/db apps/web/tests
pnpm test
```

## 8. Definition of done

- Ba bảng tồn tại qua migration cộng thêm; cổng migration cộng thêm xanh.
- Một lượt chạy thật ghi đủ ba bảng, kiểm bằng test tích hợp.
- Bản ghi ghim phiên bản nội dung; sửa nội dung sau đó không đổi bản ghi.
- Lối vào từ player curriculum, không có điều hướng song song.
- Quyết định Q3 được tôn trọng ở cả tầng ghi và tầng đọc.
- 16 rule có test; spec `implemented`; `pnpm check` và `pnpm test` xanh.
