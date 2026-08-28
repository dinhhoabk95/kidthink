# Checklist — Task #123: Mô hình giáo án

> Kế hoạch: [`123-lesson-flow-model-plan.md`](123-lesson-flow-model-plan.md).
> Tuyệt đối: không từ chối ghi danh vì tuổi, không cảnh báo chung chung, không nới prerequisite,
> không để bộ đề xuất tự ghi danh, không chạy migration ngoài local.
>
> `export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH`

## Preflight

- [ ] Đọc lược đồ lesson và flow — trả lời `Q123-1`: thư viện master hay gắn cứng.
- [ ] Tìm nhánh 422 theo tuổi ở route enrollment; ghi đường dẫn file và dòng.
- [ ] Đo cầu hiện tại: 5 chương trình, flow dài nhất bao nhiêu tiết (kỳ vọng `CUR-J42` = 126).
- [ ] Đo cung: bao nhiêu lesson `published` (kỳ vọng 81).
- [ ] Chụp danh sách `trạng-thái | tên-test` trước khi sửa.
- [ ] Trả lời `Q123-2`: `CUR-J42` hiện thế nào khi chưa lắp đủ.

## WP123.1 — Thư viện master

**Cỡ:** M

- [ ] Nếu lesson gắn cứng vào flow: viết migration, chạy **chỉ local**.
- [ ] Test: cùng lesson xuất hiện trong nhiều flow — **hợp lệ** (`BR-LFM-01`).
- [ ] Test: một flow chứa cùng lesson hai lần — **bị chặn ở tầng dữ liệu** (`BR-LFM-05`).
- [ ] Test: thứ tự lesson vi phạm prerequisite — bị chặn (`BR-LFM-06`).
- [ ] Khẳng định không migration nào chạy ngoài local.

## WP123.2 — Gỡ khoá tuổi ở ghi danh

**Cỡ:** S

- [ ] Ca âm trước: ghi danh trẻ 3 tuổi vào `CUR-J42` — chạy trên mã hôm nay, kỳ vọng **đỏ** (422).
- [ ] Bỏ nhánh 422 theo tuổi (`BR-LFM-02`).
- [ ] Giữ `target_age_min` / `target_age_max` — chúng thành tín hiệu xếp hạng (`BR-LFM-03`).
- [ ] Test: ghi danh flow ngoài gói **thành công**; tiết ngoài gói vẫn khoá (`BR-LFM-07`).
- [ ] Ca âm chuyển sang GREEN — ghi danh thành công.
- [ ] Khẳng định không route nào còn trả 422 vì tuổi.

## WP123.3 — Cảnh báo đọc được

**Cỡ:** S

- [ ] Cảnh báo hiện ở màn ghi danh, trước khi xác nhận.
- [ ] Câu chữ nêu **rõ lệch bao nhiêu** — hai con số tuổi (`BR-LFM-04`).
- [ ] Cảnh báo **không** chặn — nút xác nhận vẫn bật.
- [ ] Test: lệch 2 tuổi thì câu chữ nêu đúng hai con số.
- [ ] Bề mặt trẻ nhìn thấy **không** hiện cảnh báo này.

## WP123.4 — Đề xuất xếp hạng

**Cỡ:** S

- [ ] `target_age_*` vào hàm xếp hạng gợi ý flow.
- [ ] Test: đường đề xuất **không** gọi đường ghi danh (`BR-LFM-09`).

## WP123.5 — Flow publish được khi lắp đủ

**Cỡ:** S

- [ ] Flow chỉ `published` khi mọi tiết trỏ tới lesson `published` có thật (`BR-LFM-08`).
- [ ] Ca âm: gỡ một lesson khỏi thư viện khi flow đang lắp đủ → flow không publish được.
- [ ] Xác nhận `CUR-J42` **bị chặn publish** hôm nay — đó là hành vi đúng, chờ Task #124.
- [ ] Áp `Q123-2` cho bề mặt phụ huynh.

## Nghiệm thu

- [ ] Ghi danh trẻ 3 tuổi vào `CUR-J42` thành công; cảnh báo nêu đúng hai con số tuổi.
- [ ] Không route nào trả 422 vì tuổi ở đường ghi danh.
- [ ] Một lesson trong nhiều flow — hợp lệ, có test.
- [ ] Một flow chứa lesson lặp — bị chặn, có test.
- [ ] Thứ tự vi phạm prerequisite — bị chặn.
- [ ] Flow có tiết trỏ lesson chưa `published` — không publish được.
- [ ] Đường đề xuất không gọi đường ghi danh.
- [ ] Cầu tính bằng flow dài nhất, cho ra **126** trên 5 chương trình.
- [ ] Không migration nào chạy ngoài local.
- [ ] `lesson-flow-model.md` mang `status: implemented`.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` xanh.
- [ ] Mở PR cho người review diff, không tự merge.
