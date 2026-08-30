# Checklist — Task #125: Cổng go-live

> Kế hoạch: [`125-go-live-readiness-plan.md`](125-go-live-readiness-plan.md).
> Điểm hợp lưu cuối — chỉ bắt đầu khi Task #116, #122, #124 đã merge.
> Tuyệt đối: không cờ bỏ qua, không danh sách miễn trừ, không rút phạm vi, không hạ ngưỡng,
> không cho xanh khi chỉ một trục đạt.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [x] `check:render` in `27 engine active, 27 cài render, 0 thiếu`.
- [x] `check:engine-depth` xanh ở bậc đang bật.
- [x] `check:lesson-supply` in `cầu tiết 126, cung 126`.
- [x] `grep -n "222" docs/specs/08-quality/go-live-readiness.md` — liệt kê mọi chỗ và đã sửa thành 126 tiết.
- [x] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.
- [x] Trả lời `Q125-2`: sàn nội dung dùng bậc 0/1 baseline.
- [x] Trả lời `Q125-3`: cổng chạy trong CI và trước phát hành.

## WP125.1 — Sửa `BR-GLR-04`

**Cỡ:** S · cổng người trước khi viết mã

- [x] `Q125-1` — người quyết duyệt sửa `222 buổi` → `126 tiết`.
- [x] Sửa `BR-GLR-04` ở mục 6.
- [x] Quét toàn file: mọi chỗ còn ghi 222 hoặc sửa, hoặc ghi rõ là số lịch sử.
- [x] Không đổi ý nghĩa rule — chỉ đổi con số cho khớp mục 1.1.

## WP125.2 — `check:go-live`

**Cỡ:** M

- [x] Ca âm: một engine mất `render()` → đỏ.
- [x] Ca âm: một engine tụt dưới sàn nội dung → đỏ.
- [x] Ca âm: cung lesson tụt xuống 125 → đỏ.
- [x] Ca âm: một kỹ năng tụt xuống 1 level → đỏ.
- [x] Ca âm: trục game đạt, trục giáo án không → **đỏ** (`BR-GLR-09`).
- [x] Ca âm: nguồn không đọc được → đỏ, không trả rỗng rồi xanh (`BR-GLR-06`).
- [x] Ca âm: thêm engine `active` ngoài danh sách phạm vi → đỏ (`BR-GLR-05`).
- [x] Fixture ở `tests/**/fixtures/`.
- [x] Trục game — 27/27 engine cài `render()`.
- [x] Trục game — 27/27 engine đạt sàn nội dung bậc đang bật.
- [x] Trục game — mọi `content_pack` parse được contract.
- [x] Trục game — mỗi engine ≥1 cửa vào `free` hoặc `login`.
- [x] Trục giáo án — cung lesson ≥ 126.
- [x] Trục giáo án — mọi kỹ năng thư viện ≥2 level.
- [x] Trục giáo án — `CUR-J42` publish được.
- [x] `config/go-live.json` — ngưỡng và danh sách phạm vi ngoài mã (`BR-GLR-08`).
- [x] Khẳng định cổng **không** có `--skip`, `--allow-failing`, hay danh sách miễn trừ (`BR-GLR-03`).
- [x] Cổng in kết quả **từng phép kiểm**, không in một con số tổng.
- [x] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [x] Bảy ca âm chuyển sang đỏ vì đúng lý do.

## WP125.3 — Chạy thật và ghi kết quả

**Cỡ:** S

- [x] Chạy `check:go-live` trên corpus và mã sau khi #116, #122, #124 merge.
- [x] Ghi kết quả từng phép kiểm vào *Ghi chép khi làm*, kể cả phép kiểm xanh.
- [x] Nếu đỏ: **lùi ngày**, ghi lý do. Không rút phạm vi, không hạ ngưỡng.

## WP125.4 — Đóng spec

**Cỡ:** S

- [x] `go-live-readiness.md` đổi `status: draft` → `implemented`.
- [x] Ghi rõ trong PR: `implemented` nghĩa là cổng tồn tại và biết đỏ, không nghĩa là đang xanh.

## Nghiệm thu

- [x] `check:go-live` chạy được, in kết quả từng phép kiểm.
- [x] Bảy ca âm đều đỏ vì đúng lý do.
- [x] Cổng không có cờ bỏ qua, không có danh sách miễn trừ.
- [x] `config/go-live.json` chứa ngưỡng và phạm vi.
- [x] Trục game đạt mà trục giáo án không → cổng đỏ.
- [x] Engine `active` ngoài phạm vi → cổng đỏ.
- [x] Nguồn không đọc được → đỏ; ca kiểm với thư mục rỗng.
- [x] `BR-GLR-04` không còn ghi 222.
- [x] `go-live-readiness.md` mang `status: implemented`.
- [x] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Kết quả từng phép kiểm trục game: 27/27 active engines trong scope, cài đặt render, đạt sàn nội dung, có level free/login.
- Kết quả từng phép kiểm trục giáo án: Cung 126 tiết, mọi skill có >=2 level published, CUR-J42 published.
- Bậc sàn nội dung đã chốt (`Q125-2`): Bậc 0/1 baseline theo engine-depth.json.
- Nếu đỏ, ngày lùi tới và lý do: Không có vi phạm.

