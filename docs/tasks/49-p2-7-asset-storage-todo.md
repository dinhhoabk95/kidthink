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

- [ ] **P2.6 đã đóng** trừ slice ảnh; chỗ cắm widget đã chừa sẵn.
- [ ] **P2.3 đã đóng** — ảnh chứng từ tồn tại, cần ghi sổ ngược.
- [ ] Bucket S3 và biến môi trường base URL đã cấu hình.
- [ ] Human approve kế hoạch và năm quyết định D-KB · D-KC · D-KD · D-KE · D-KF.
- [ ] Đối chiếu `BR-IMG-*` `BR-IUP-*` `BR-AUT2-*` với [`business-rules.md`](../specs/00-foundation/business-rules.md).
- [ ] Tạo nhánh riêng.

---

### Task 1 — Kho ảnh và pipeline

- [ ] Bảng `content_images` đủ cột §7.1.
- [ ] `owner_type` là **enum đóng**; `alt_vi` **không null**.
- [ ] Pipeline: WebP chất lượng **82**, cạnh lớn nhất ≤ **960px**.
- [ ] Thumbnail **160×160**, crop giữa.
- [ ] Ca dương: JPEG 3000×2000 → WebP, ≤960px, có thumbnail.
- [ ] Ảnh < 160×160 → chấp nhận, **không** phóng to.
- [ ] `D-KC` ca âm curl 1: `.exe` đổi tên `.png` → **415**.
- [ ] `D-KC` ca âm curl 2: `.svg` → **415**.
- [ ] `D-KC` ca âm curl 3: 5 MB → **413**.
- [ ] Cả ba ca âm: **không** byte nào lên S3.
- [ ] `D-KD`: `storage.url()` và `storage.signedUrl()` là bộ dựng URL duy nhất.
- [ ] `D-KD` cổng: `https://` hay tên bucket trong cột `path` → **đỏ**.
- [ ] `D-KD` ca âm: đổi base URL → ảnh trỏ host mới, **không** hàng DB nào đổi.
- [ ] `BR-IMG-06` ca âm: thay ảnh → path **mới**, file cũ **vẫn còn** trên S3.
- [ ] `D-KF` cổng: không route nào liệt kê ảnh thiếu `owner_type` + `owner_id`.
- [ ] `D-KF` ca âm: thêm route liệt kê ảnh theo ngày → cổng **đỏ**.
- [ ] Integration test bắt **orphan owner** (polymorphic không có FK).

### Task 2 — API ảnh

- [ ] `POST /api/managers/images` cần auth + `x-csrf-token`.
- [ ] Multipart `file` · `owner_type` · `owner_id` · `alt_vi`.
- [ ] `BR-IMG-11` ca âm: quét mã — **không** raw `$fetch` cho route upload.
- [ ] Request thật có header `x-csrf-token`.
- [ ] Thiếu `alt_vi` → **422** `VALIDATION_FAILED`.
- [ ] `DELETE .../images/{id}` khi đang dùng ở `published` → **409** `CONTENT_IN_USE` + `details.used_by[]`.
- [ ] `BR-IMG-12`: mọi upload và xoá ghi `audit_logs`.
- [ ] Content bị xoá cứng → ảnh chuyển `orphan`, không xoá file ngay.
- [ ] Upload fail giữa chừng **không** làm mất trạng thái form studio.

### Task 3 — Truy vấn ngược và chỉ mục

- [ ] Bảng `content_asset_refs (entity_type, entity_id, asset_kind, asset_ref)`.
- [ ] `entity_id` trỏ **đúng hàng version** theo `D-AE`.
- [ ] `D-KB`: ghi chỉ mục **trong cùng transaction** với ghi nội dung.
- [ ] Ca dương: sửa level thêm ảnh → `content_asset_refs` có hàng mới.
- [ ] `D-KB` ca âm đối soát: bảng phụ so JSONB lệch một hàng → **đỏ**.
- [ ] Index GIN tồn tại nhưng **không** dùng ở đường request; cổng quét khẳng định.
- [ ] `GET .../assets/{ref}/usage` trả `used_by` · `can_delete` · `block_reason`; trần **200**.
- [ ] `BR-AUT2-04` ca âm: 1 `published` + 2 `draft` → mỗi mục hiện đúng trạng thái.
- [ ] `BR-AUT2-01` ca âm: dùng ở `published` → **409**, nêu rõ level nào.
- [ ] Chỉ ở `archived` → cho xoá, cảnh báo bản cũ hỏng preview.
- [ ] Chỉ ở `draft` → cho xoá, cảnh báo draft không publish được.
- [ ] `BR-AUT2-02` cổng: không route nào xoá hàng `emoji_registry`.
- [ ] `BR-AUT2-03` hiệu năng: 3000 game level → `usage` **P95 < 200 ms**.

### Task 4 — Widget crop trong studio

- [ ] Widget lắp vào hint `image` của P2.5; placeholder "P2.7" bị **xoá**.
- [ ] Modal crop: khung **1:1** mặc định.
- [ ] Nút **xoay 90°**; zoom kéo thả.
- [ ] `BR-IUP-02` ca âm: template hiển thị 96px → hộp preview **đúng 96px**.
- [ ] `BR-IUP-08` ca âm: cảnh báo "không dùng ảnh chụp trẻ em" hiện **thường trực**.
- [ ] `BR-IUP-07` ca âm: upload fail → modal **giữ nguyên crop và góc xoay**, có nút thử lại.
- [ ] `BR-IUP-05`: chưa điền `alt_vi` → nút upload **vô hiệu**.
- [ ] `BR-IUP-04` ca âm: file 5 MB → client chặn trước khi gửi.
- [ ] `BR-IUP-04` ca âm: gửi 5 MB bằng curl → server **413**.
- [ ] Ảnh vào < 200×200 → cảnh báo, không chặn cứng.
- [ ] Kết quả crop ≤ **1200×1200**, WebP hoặc PNG.
- [ ] Đổi tỉ lệ 4:3 / 16:9 **chỉ khi** template cho phép.
- [ ] Preview studio cập nhật ngay sau khi field nhận `path`.

### Task 5 — Job dọn ảnh mồ côi

- [ ] `D-BD`: job chạy **01:00 UTC hằng ngày**.
- [ ] Dọn ảnh `orphan` cũ hơn **30 ngày**.
- [ ] `BR-AUT2-05` ca âm: orphan 31 ngày → xoá file S3 **và** xoá hàng `content_images`.
- [ ] Ca âm ngược: orphan 29 ngày → **không** đụng tới.
- [ ] Job idempotent; chạy hai lần không lỗi.
- [ ] Ghi `audit_logs` tổng hợp: số ảnh, số byte.
- [ ] Đăng ký vào registry job P1.5 kèm retry policy và ngưỡng alert.

### Task 6 — Ghi sổ ảnh chứng từ

- [ ] `D-KE`: hàng `content_images` với `owner_type = payment_proof`, `visibility = private`, không thumbnail.
- [ ] Migration ghi sổ ngược cho ảnh chứng từ của P2.3.
- [ ] Ca âm: chạy migration hai lần **không** sinh hàng trùng.
- [ ] `D-CB` ca âm: pipeline WebP **không** chạy trên ảnh chứng từ.
- [ ] `BR-IMG-10` ca âm: URL S3 trực tiếp → **bị từ chối**.
- [ ] Chỉ `storage.signedUrl` TTL **15 phút** mở được.
- [ ] Test của P2.3 về chứng từ vẫn xanh **không sửa assertion**.
- [ ] Ảnh chứng từ **không** vào phạm vi job dọn `orphan`.

## Cổng dừng

- [ ] Manager upload ảnh trong studio → crop 1:1 → preview cỡ thật → lưu → ảnh hiện trong preview engine.
- [ ] Ba ca âm upload bằng curl đều bị chặn, S3 sạch.
- [ ] Xoá ảnh đang dùng ở `published` → **409** với danh sách nơi dùng.
- [ ] `usage` chạy dưới 200 ms trên 3000 level.
- [ ] Đối soát chỉ mục ngược không lệch hàng nào.
- [ ] Đổi base URL → ảnh trỏ host mới, DB không đổi.
- [ ] Không route nào liệt kê ảnh không kèm owner.
- [ ] Ảnh chứng từ vẫn private và vẫn không qua pipeline.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm lint:specs && pnpm check:progress` xanh.

---

## Task 7 — Evidence, promote và nợ chuyển tiếp

- [ ] Mỗi `BR-IMG-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-IUP-*` có test tham chiếu mã rule.
- [ ] Mỗi `BR-AUT2-*` có test tham chiếu mã rule.
- [ ] [`image-storage.md`](../specs/01-platform/image-storage.md) → `implemented`.
- [ ] [`image-upload.md`](../specs/06-admin/image-upload.md) → `implemented`.
- [ ] [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md) → `implemented`.
- [ ] `D-CC` khép lại: slice cuối P2.6 đã xong; cổng ra P2.6 nay đủ.
- [ ] Tick **P2.7** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

## Câu hỏi mở chuyển tiếp

- [ ] **CDN trước S3** — đóng theo `D-KD`: hoãn được, **có bằng chứng** (đổi base URL không đụng DB). Chủ vẫn là Infra.
- [ ] **Tần suất dọn orphan** — đóng theo `D-BD`: 01:00 UTC hằng ngày, > 30 ngày. Đã làm ở T5.
- [ ] **Xoá nền tự động** — cùng một câu ở hai spec, đóng **một lần**: hoãn P4.
- [ ] **Rebuild chỉ mục ngược định kỳ** — chưa cần theo `D-KB` (đã có test đối soát); script rebuild ghi nợ P4.
