# Checklist — Task #49: P2.7 — Asset và lưu trữ ảnh

> Kế hoạch: [`49-p2-7-asset-storage-plan.md`](49-p2-7-asset-storage-plan.md).
> [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) **không** thuộc bước này nữa — đã sang
> P2.6 theo `D-JV`. Bước này cũng đóng **slice cuối của P2.6** (widget ảnh, `D-CC`).
> Audio không thuộc Task #49; [`Task #80`](80-audio-contract-closure-plan.md) phải đóng spec owner
> trước khi có implementation task audio.
> Tuyệt đối: không thư viện ảnh dùng chung (`D4`) · ba lớp chặn upload đứng ở server (`D-KC`).
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] **P2.6 đã đóng** trừ slice ảnh; chỗ cắm widget đã chừa sẵn.
- [x] **P2.3 đã đóng** — ảnh chứng từ tồn tại, cần ghi sổ ngược.
- [x] Bucket S3 và biến môi trường base URL đã cấu hình.
- [x] Human approve kế hoạch và năm quyết định D-KB · D-KC · D-KD · D-KE · D-KF.
- [x] Đối chiếu `BR-IMG-*` `BR-IUP-*` `BR-AUT2-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [x] Tạo nhánh riêng.

---

### Task 1 — Kho ảnh và pipeline

- [x] Bảng `content_images` đủ cột §7.1.
- [x] `owner_type` là **enum đóng**; `alt` **không null**.
- [x] Pipeline: WebP chất lượng **82**, cạnh lớn nhất ≤ **960px**.
- [x] Thumbnail **160×160**, crop giữa.
- [x] Ca dương: JPEG 3000×2000 → WebP, ≤960px, có thumbnail.
- [x] Ảnh < 160×160 → chấp nhận, **không** phóng to.
- [x] `D-KC` ca âm curl 1: `.exe` đổi tên `.png` → **415**.
- [x] `D-KC` ca âm curl 2: `.svg` → **415**.
- [x] `D-KC` ca âm curl 3: 5 MB → **413**.
- [x] Cả ba ca âm: **không** byte nào lên S3.
- [x] `D-KD`: `storage.url()` và `storage.signedUrl()` là bộ dựng URL duy nhất.
- [x] `D-KD` cổng: `https://` hay tên bucket trong cột `path` → **đỏ**.
- [x] `D-KD` ca âm: đổi base URL → ảnh trỏ host mới, **không** hàng DB nào đổi.
- [x] `BR-IMG-06` ca âm: thay ảnh → path **mới**, file cũ **vẫn còn** trên S3.
- [x] `D-KF` cổng: không route nào liệt kê ảnh thiếu `owner_type` + `owner_id`.
- [x] `D-KF` ca âm: thêm route liệt kê ảnh theo ngày → cổng **đỏ**.
- [x] Integration test bắt **orphan owner** (polymorphic không có FK).

### Task 2 — API ảnh

- [x] `POST /api/managers/images` cần auth + `x-csrf-token`.
- [x] Multipart `file` · `owner_type` · `owner_id` · `alt`.
- [x] `BR-IMG-11` ca âm: quét mã — **không** raw `$fetch` cho route upload.
- [x] Request thật có header `x-csrf-token`.
- [x] Thiếu `alt` → **422** `VALIDATION_FAILED`.
- [x] `DELETE .../images/{id}` khi đang dùng ở `published` → **409** `CONTENT_IN_USE` + `details.used_by[]`.
- [x] `BR-IMG-12`: mọi upload và xoá ghi `audit_logs`.
- [x] Content bị xoá cứng → ảnh chuyển `orphan`, không xoá file ngay.
- [x] Upload fail giữa chừng **không** làm mất trạng thái form studio.

### Task 3 — Truy vấn ngược và chỉ mục

- [x] Bảng `content_asset_refs (entity_type, entity_id, asset_kind, asset_ref)`.
- [x] `entity_id` trỏ **đúng hàng version** theo `D-AE`.
- [x] `D-KB`: ghi chỉ mục **trong cùng transaction** với ghi nội dung.
- [x] Ca dương: sửa level thêm ảnh → `content_asset_refs` có hàng mới.
- [x] `D-KB` ca âm đối soát: bảng phụ so JSONB lệch một hàng → **đỏ**.
- [x] Index GIN tồn tại nhưng **không** dùng ở đường request; cổng quét khẳng định.
- [x] `GET .../assets/{ref}/usage` trả `used_by` · `can_delete` · `block_reason`; trần **200**.
- [x] `BR-AUT2-04` ca âm: 1 `published` + 2 `draft` → mỗi mục hiện đúng trạng thái.
- [x] `BR-AUT2-01` ca âm: dùng ở `published` → **409**, nêu rõ level nào.
- [x] Chỉ ở `archived` → cho xoá, cảnh báo bản cũ hỏng preview.
- [x] Chỉ ở `draft` → cho xoá, cảnh báo draft không publish được.
- [x] `BR-AUT2-02` cổng: không route nào xoá hàng `emoji_registry`.
- [x] `BR-AUT2-03` hiệu năng: 3000 game level → `usage` **P95 < 200 ms**.

### Task 4 — Widget crop trong studio

- [x] Widget lắp vào hint `image` của P2.5; placeholder "P2.7" bị **xoá**.
- [x] Modal crop: khung **1:1** mặc định.
- [x] Nút **xoay 90°**; zoom kéo thả.
- [x] `BR-IUP-02` ca âm: template hiển thị 96px → hộp preview **đúng 96px**.
- [x] `BR-IUP-08` ca âm: cảnh báo "không dùng ảnh chụp trẻ em" hiện **thường trực**.
- [x] `BR-IUP-07` ca âm: upload fail → modal **giữ nguyên crop và góc xoay**, có nút thử lại.
- [x] `BR-IUP-05`: chưa điền `alt` → nút upload **vô hiệu**.
- [x] `BR-IUP-04` ca âm: file 5 MB → client chặn trước khi gửi.
- [x] `BR-IUP-04` ca âm: gửi 5 MB bằng curl → server **413**.
- [x] Ảnh vào < 200×200 → cảnh báo, không chặn cứng.
- [x] Kết quả crop ≤ **1200×1200**, WebP hoặc PNG.
- [x] Đổi tỉ lệ 4:3 / 16:9 **chỉ khi** template cho phép.
- [x] Preview studio cập nhật ngay sau khi field nhận `path`.

### Task 5 — Job dọn ảnh mồ côi

- [x] `D-BD`: job chạy **01:00 UTC hằng ngày**.
- [x] Dọn ảnh `orphan` cũ hơn **30 ngày**.
- [x] `BR-AUT2-05` ca âm: orphan 31 ngày → xoá file S3 **và** xoá hàng `content_images`.
- [x] Ca âm ngược: orphan 29 ngày → **không** đụng tới.
- [x] Job idempotent; chạy hai lần không lỗi.
- [x] Ghi `audit_logs` tổng hợp: số ảnh, số byte.
- [x] Đăng ký vào registry job P1.5 kèm retry policy và ngưỡng alert.

### Task 6 — Ghi sổ ảnh chứng từ

- [x] `D-KE`: hàng `content_images` với `owner_type = payment_proof`, `visibility = private`, không thumbnail.
- [x] Migration ghi sổ ngược cho ảnh chứng từ của P2.3.
- [x] Ca âm: chạy migration hai lần **không** sinh hàng trùng.
- [x] `D-CB` ca âm: pipeline WebP **không** chạy trên ảnh chứng từ.
- [x] `BR-IMG-10` ca âm: URL S3 trực tiếp → **bị từ chối**.
- [x] Chỉ `storage.signedUrl` TTL **15 phút** mở được.
- [x] Test của P2.3 về chứng từ vẫn xanh **không sửa assertion**.
- [x] Ảnh chứng từ **không** vào phạm vi job dọn `orphan`.

## Cổng dừng

- [x] Manager upload ảnh trong studio → crop 1:1 → preview cỡ thật → lưu → ảnh hiện trong preview engine.
- [x] Ba ca âm upload bằng curl đều bị chặn, S3 sạch.
- [x] Xoá ảnh đang dùng ở `published` → **409** với danh sách nơi dùng.
- [x] `usage` chạy dưới 200 ms trên 3000 level.
- [x] Đối soát chỉ mục ngược không lệch hàng nào.
- [x] Đổi base URL → ảnh trỏ host mới, DB không đổi.
- [x] Không route nào liệt kê ảnh không kèm owner.
- [x] Ảnh chứng từ vẫn private và vẫn không qua pipeline.
- [x] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

---

## Task 7 — Evidence, promote và nợ chuyển tiếp

- [x] Mỗi `BR-IMG-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-IUP-*` có test tham chiếu mã rule.
- [x] Mỗi `BR-AUT2-*` có test tham chiếu mã rule.
- [x] [`image-storage.md`](../specs/01-platform/image-storage.md) → `implemented`.
- [x] [`image-upload.md`](../specs/06-admin/image-upload.md) → `implemented`.
- [x] [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md) → `implemented`.
- [x] `D-CC` khép lại: slice cuối P2.6 đã xong; cổng ra P2.6 nay đủ.
- [x] Tick **P2.7** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [x] **CDN trước S3** — đóng theo `D-KD`: hoãn được, **có bằng chứng** (đổi base URL không đụng DB). Chủ vẫn là Infra.
- [x] **Tần suất dọn orphan** — đóng theo `D-BD`: 01:00 UTC hằng ngày, > 30 ngày. Đã làm ở T5.
- [x] **Xoá nền tự động** — cùng một câu ở hai spec, đóng **một lần**: hoãn P4.
- [x] **Rebuild chỉ mục ngược định kỳ** — chưa cần theo `D-KB` (đã có test đối soát); script rebuild ghi nợ P4.
