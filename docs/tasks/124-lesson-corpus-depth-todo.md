# Checklist — Task #124: Cung giáo án

> Kế hoạch: [`124-lesson-corpus-depth-plan.md`](124-lesson-corpus-depth-plan.md).
> Chỉ bắt đầu khi [`Task #123`](123-lesson-flow-model-todo.md) đã merge.
> Tuyệt đối: không nối bước chơi vào level của kỹ năng khác, không lặp lesson trong cùng flow,
> không ô trống, không `UPDATE` bản published, không in phần trăm tổng.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] Đo cầu: chiều dài flow dài nhất `published` (kỳ vọng `CUR-J42` = 126).
- [ ] Đo cung: lesson `published` (kỳ vọng 81).
- [ ] Đếm kỹ năng thư viện giáo án (kỳ vọng 40); đếm kỹ năng có 0 level (kỳ vọng 23) và có 1 (kỳ vọng 2).
- [ ] Đếm bước chơi trỏ sai kỹ năng (kỳ vọng 151 / 162).
- [ ] Xác nhận `GT-007` và `GT-008` có 0 liên kết giáo án.
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.

## WP124.1 — Chốt danh sách 45 tiết

**Cỡ:** S · cổng người · không soạn nội dung

- [ ] Liệt kê 45 tiết thiếu: vị trí trong flow · kỹ năng · prerequisite.
- [ ] Đối chiếu prerequisite (`BR-LFM-06`) — kỹ năng sau mọi prerequisite của nó.
- [ ] Liệt kê **kỹ năng mới** mà 45 tiết mang vào.
- [ ] Đo lại ngân sách level: 48 hay hơn — trả lời `Q124-1`.
- [ ] Người quyết duyệt danh sách. **Không soạn level trước chữ ký.**

## WP124.2 — Soạn level cho kỹ năng thiếu

**Cỡ:** M · một PR mỗi năm kỹ năng

- [ ] Xếp kỹ năng theo mức chặn: kỹ năng nền, prerequisite của nhiều kỹ năng khác, đi trước.
- [ ] Mỗi kỹ năng đạt ≥2 level `published` (`BR-LCD-10`).
- [ ] Hai level của cùng kỹ năng **khác khuôn** (`BR-LTV-02`) — trả lời `Q124-2` cho kỹ năng chỉ một engine phục vụ.
- [ ] `GT-007` nối vào ≥1 bài học (`BR-LTV-09`).
- [ ] `GT-008` nối vào ≥1 bài học.
- [ ] Level mới đi qua đủ tám cổng của Task #117.
- [ ] Ghi số level sang ngân sách [`Task #122`](122-engine-content-depth-todo.md) — soạn một lần, đếm hai chỗ.

## WP124.3 — Nối lại 151 bước chơi

**Cỡ:** M · chỉ sau WP124.2

- [ ] Trả lời `Q124-3`: gộp lô version hay từng cái.
- [ ] Mỗi bước chơi trỏ level phục vụ **đúng** kỹ năng của bước đó.
- [ ] Hai bước của một bài học khác khuôn.
- [ ] Mọi thay đổi là version mới; 0 câu `UPDATE` chạm bản published.
- [ ] Kiểm mẫu bốn bài học bằng tay — cùng bốn bài đã dùng xác nhận vi phạm.
- [ ] `BR-LTV-04` đạt 162/162.

## WP124.4 — Soạn 45 giáo án

**Cỡ:** M · một PR mỗi năm tiết

- [ ] Không phân theo band — thư viện master dùng chung.
- [ ] Mỗi tiết trỏ lesson thật; không ô trống, không lesson giữ chỗ (`BR-LCD-04`).
- [ ] Không lặp lesson trong cùng flow (`BR-LCD-05`).
- [ ] Mỗi lesson lắp đủ hai bước chơi khác khuôn, trỏ đúng kỹ năng.
- [ ] Cung đạt 126.

## WP124.5 — `check:lesson-supply`

**Cỡ:** M

- [ ] Ca âm: bớt một lesson khi thư viện sát cầu (`BR-LCD-09`).
- [ ] Ca âm: một kỹ năng tụt xuống 1 level.
- [ ] Ca âm: lặp cùng lesson hai lần trong một flow.
- [ ] Ca âm: nguồn không đọc được → đỏ, không trả 0 rồi xanh (`BR-LCD-06`).
- [ ] Fixture ở `packages/db/tests/**/fixtures/`.
- [ ] Đo cầu tiết: cung ≥ chiều dài flow dài nhất `published` (`BR-LCD-02`).
- [ ] Đo cầu level: mỗi kỹ năng ≥2 level `published` (`BR-LCD-10`).
- [ ] Chỉ đếm `published` (`BR-LCD-03`).
- [ ] Báo cáo in từng chương trình kèm số buổi thiếu; **không** in phần trăm tổng (`BR-LCD-08`).
- [ ] Giảm `durationWeeks` / `sessionsPerWeek` cần người quyết, ghi lý do vào PR (`BR-LCD-07`).
- [ ] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [ ] Bốn ca âm chuyển sang đỏ vì đúng lý do.

## Nghiệm thu

- [ ] `check:lesson-supply` in `cầu tiết 126, cung 126` và `0 kỹ năng thiếu level`.
- [ ] Bốn ca âm đều đỏ vì đúng lý do.
- [ ] `CUR-J42` publish được.
- [ ] `BR-LTV-04` đạt 162/162 — 0 bước chơi trỏ sai kỹ năng.
- [ ] `GT-007` và `GT-008` mỗi engine nối vào ≥1 bài học.
- [ ] Mọi kỹ năng có ≥2 level, hai level khác khuôn.
- [ ] 0 câu `UPDATE` chạm bản published.
- [ ] Kiểm mẫu bốn bài học bằng tay — đúng kỹ năng, đúng khuôn.
- [ ] `lesson-corpus-depth.md` mang `status: implemented`.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Số kỹ năng mới do 45 tiết mang vào: ................
- Ngân sách level thật (`Q124-1`): ................
- Kỹ năng chỉ một engine phục vụ, và khuôn thứ hai lấy ở đâu: ................
