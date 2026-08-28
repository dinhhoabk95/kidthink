# Checklist — Task #125: Cổng go-live

> Kế hoạch: [`125-go-live-readiness-plan.md`](125-go-live-readiness-plan.md).
> Điểm hợp lưu cuối — chỉ bắt đầu khi Task #116, #122, #124 đã merge.
> Tuyệt đối: không cờ bỏ qua, không danh sách miễn trừ, không rút phạm vi, không hạ ngưỡng,
> không cho xanh khi chỉ một trục đạt.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] `check:render` in `27 engine active, 27 cài render, 0 thiếu`.
- [ ] `check:engine-depth` xanh ở bậc đang bật.
- [ ] `check:lesson-supply` in `cầu tiết 126, cung 126`.
- [ ] `grep -n "222" docs/specs/08-quality/go-live-readiness.md` — liệt kê mọi chỗ.
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.
- [ ] Trả lời `Q125-2`: sàn nội dung dùng bậc nào.
- [ ] Trả lời `Q125-3`: cổng chạy mỗi PR hay chỉ trước phát hành.

## WP125.1 — Sửa `BR-GLR-04`

**Cỡ:** S · cổng người trước khi viết mã

- [ ] `Q125-1` — người quyết duyệt sửa `222 buổi` → `126 tiết`.
- [ ] Sửa `BR-GLR-04` ở mục 6.
- [ ] Quét toàn file: mọi chỗ còn ghi 222 hoặc sửa, hoặc ghi rõ là số lịch sử.
- [ ] Không đổi ý nghĩa rule — chỉ đổi con số cho khớp mục 1.1.

## WP125.2 — `check:go-live`

**Cỡ:** M

- [ ] Ca âm: một engine mất `render()` → đỏ.
- [ ] Ca âm: một engine tụt dưới sàn nội dung → đỏ.
- [ ] Ca âm: cung lesson tụt xuống 125 → đỏ.
- [ ] Ca âm: một kỹ năng tụt xuống 1 level → đỏ.
- [ ] Ca âm: trục game đạt, trục giáo án không → **đỏ** (`BR-GLR-09`).
- [ ] Ca âm: nguồn không đọc được → đỏ, không trả rỗng rồi xanh (`BR-GLR-06`).
- [ ] Ca âm: thêm engine `active` ngoài danh sách phạm vi → đỏ (`BR-GLR-05`).
- [ ] Fixture ở `tests/**/fixtures/`.
- [ ] Trục game — 27/27 engine cài `render()`.
- [ ] Trục game — 27/27 engine đạt sàn nội dung bậc đang bật.
- [ ] Trục game — mọi `content_pack` parse được contract.
- [ ] Trục game — mỗi engine ≥1 cửa vào `free` hoặc `login`.
- [ ] Trục giáo án — cung lesson ≥ 126.
- [ ] Trục giáo án — mọi kỹ năng thư viện ≥2 level.
- [ ] Trục giáo án — `CUR-J42` publish được.
- [ ] `config/go-live.json` — ngưỡng và danh sách phạm vi ngoài mã (`BR-GLR-08`).
- [ ] Khẳng định cổng **không** có `--skip`, `--allow-failing`, hay danh sách miễn trừ (`BR-GLR-03`).
- [ ] Cổng in kết quả **từng phép kiểm**, không in một con số tổng.
- [ ] Gốc repo từ `repoPath()`, không `process.cwd()`.
- [ ] Bảy ca âm chuyển sang đỏ vì đúng lý do.

## WP125.3 — Chạy thật và ghi kết quả

**Cỡ:** S

- [ ] Chạy `check:go-live` trên corpus và mã sau khi #116, #122, #124 merge.
- [ ] Ghi kết quả từng phép kiểm vào *Ghi chép khi làm*, kể cả phép kiểm xanh.
- [ ] Nếu đỏ: **lùi ngày**, ghi lý do. Không rút phạm vi, không hạ ngưỡng.

## WP125.4 — Đóng spec

**Cỡ:** S

- [ ] `go-live-readiness.md` đổi `status: draft` → `implemented`.
- [ ] Ghi rõ trong PR: `implemented` nghĩa là cổng tồn tại và biết đỏ, không nghĩa là đang xanh.

## Nghiệm thu

- [ ] `check:go-live` chạy được, in kết quả từng phép kiểm.
- [ ] Bảy ca âm đều đỏ vì đúng lý do.
- [ ] Cổng không có cờ bỏ qua, không có danh sách miễn trừ.
- [ ] `config/go-live.json` chứa ngưỡng và phạm vi.
- [ ] Trục game đạt mà trục giáo án không → cổng đỏ.
- [ ] Engine `active` ngoài phạm vi → cổng đỏ.
- [ ] Nguồn không đọc được → đỏ; ca kiểm với thư mục rỗng.
- [ ] `BR-GLR-04` không còn ghi 222.
- [ ] `go-live-readiness.md` mang `status: implemented`.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.

## Ghi chép khi làm

- Kết quả từng phép kiểm trục game: ................
- Kết quả từng phép kiểm trục giáo án: ................
- Bậc sàn nội dung đã chốt (`Q125-2`): ................
- Nếu đỏ, ngày lùi tới và lý do: ................
