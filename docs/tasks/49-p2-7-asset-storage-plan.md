# Kế hoạch — Task #49: P2.7 — Asset và lưu trữ ảnh

> Viết 2026-08-10. Bước sở hữu: **P2.7** của
> [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md).
> Spec sở hữu: [`image-storage.md`](../specs/01-platform/image-storage.md) ·
> [`image-upload.md`](../specs/06-admin/image-upload.md) ·
> [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md).
> [`emoji-picker.md`](../specs/06-admin/emoji-picker.md) **đã chuyển sang P2.6** theo `D-JV`.
>
> ```
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Tóm tắt

Quyết định lớn nhất của bước này đã có sẵn và là một quyết định **không làm**: `D4` của
[`SPEC.md`](../SPEC.md) — **không có thư viện ảnh**. Ảnh gắn với một content item cụ thể, upload
trong ngữ cảnh của nó. Bỏ thư viện đi là bỏ luôn governance đi kèm: ai xoá được, xoá thì nội
dung nào chết, bản quyền của ai, ai dọn ảnh mồ côi. Ở MVP, chi phí đó không đáng và **không mất
tính năng nào người dùng thấy**.

Ba việc còn lại là ba loại rủi ro:

1. **Upload là bề mặt nhận file từ ngoài** — SVG chứa script, MIME khai báo dối được, file lớn
   làm chết instance. Ba lớp chặn phải đứng ở **server**.
2. **Xoá ảnh đang dùng** tạo ba màn hình lỗi trước mặt trẻ, và cách phát hiện duy nhất là một
   đứa trẻ gặp phải. Cần truy vấn ngược, và nó phải **nhanh** — quét JSONB toàn bảng mỗi lần
   xoá không mở rộng được.
3. **Đường dẫn ảnh sống lâu hơn hạ tầng.** Ghi URL tuyệt đối vào DB là khoá chặt vào bucket
   hôm nay.

Bước này cũng đóng **slice cuối của P2.6**: widget ảnh trong studio (`D-CC`). Nó **không** sở
hữu audio storage/picker/upload; lời hứa cũ của Task #47 được chuyển sang contract-first ở
[`Task #80`](80-audio-contract-closure-plan.md).

## 0. Điều kiện tiên quyết

| Dep | Trạng thái | Ghi chú |
|---|---|---|
| `CHILD-DATA-COMPLIANCE` | P0.4 | `BR-CDC-04` — cấm ảnh chụp trẻ em ở mọi chỗ |
| `CONTENT-LIFECYCLE` | P0.6 | `draft` · `in_review` · `published` · `archived` |
| `EMOJI-REGISTRY` | P0.9 | vế emoji của truy vấn ngược |
| `SCHEMA-DRIVEN-FORM` | P2.5 | hint `image` đang là placeholder |
| `GAME-LEVEL-STUDIO` | P2.6 | nơi widget crop cắm vào |
| `packages/storage` | P0.1 · P2.3 | S3 client thô; ảnh chứng từ đã dùng nó |
| `JOB-QUEUE` | P1.5 | job dọn ảnh `orphan` |
| `AUDIT-LOG` | P0.11 | `BR-IMG-12` |

## 1. Đo được

### 1.1 Đã có

`packages/storage` với S3 ops thô; ảnh chứng từ thanh toán đã lưu private từ P2.3 theo `D-CB`;
studio và form sinh từ schema; vòng đời nội dung; registry emoji; BullMQ.

### 1.2 Chưa có

Bảng `content_images`; pipeline chuẩn hoá WebP + thumbnail; kiểm magic bytes; modal crop; bảng
`content_asset_refs` và truy vấn ngược; job dọn `orphan`; và **sổ ảnh** cho những ảnh chứng từ
P2.3 đã ghi.

### 1.3 Đã chốt, không mở lại

`D4` không có thư viện ảnh · `D-CB` ảnh chứng từ **không** qua pipeline chuẩn hoá ·
`D-AN` [`image-upload.md`](../specs/06-admin/image-upload.md) đứng độc lập, form khai
`depends_on` về nó · `D-AE` mỗi version nội dung là một hàng `id` riêng ·
`D-BD` job dọn ảnh `orphan` chạy **01:00 UTC hằng ngày**, dọn ảnh orphan > **30 ngày** ·
`BR-CDC-04` cấm ảnh chụp trẻ em.

## 2. Quyết định

**D-KB — Chỉ mục ngược cập nhật **trong cùng transaction** với lưu nội dung; đường request chỉ
đọc bảng phụ.** `BR-AUT2-03` cấm quét JSONB toàn bảng ở đường request, và §7.2 đã chỉ định bảng
`content_asset_refs`. Rủi ro của một chỉ mục duy trì chủ động là **lệch**: nội dung lưu thành
công, chỉ mục thì không, và câu trả lời "xoá cái này có hỏng gì không" trở thành *sai theo hướng
nguy hiểm* — nói không hỏng trong khi có. Xử: ghi `content_asset_refs` nằm **trong cùng
transaction** với ghi nội dung; index GIN trên `content_pack` vẫn tạo nhưng **chỉ** dùng cho
script đối soát chạy ngoài đường request. Ca âm bắt buộc: một test đối soát so bảng phụ với
JSONB trên tập fixture — lệch một hàng → **đỏ**. Đây cũng là câu trả lời tạm cho §11 Q1 (rebuild
định kỳ): chưa cần rebuild vì đã có đối soát trong CI.

**D-KC — Ba lớp chặn upload đứng ở **server**; client chỉ là trải nghiệm.** `BR-IMG-04` nói kiểm
ở cả hai phía, và câu đó dễ bị đọc thành "kiểm ở client là đủ vì UI không cho chọn file lớn".
Xử: server kiểm **magic bytes** (không tin `Content-Type`), từ chối SVG, chặn > 2 MB — cả ba
trước khi ghi một byte nào lên S3. Ca âm bắt buộc chạy bằng **curl bỏ qua client**: `.exe` đổi
tên thành `.png` → **415**; `.svg` → **415**; 5 MB → **413**; và trong cả ba ca, **không** file
nào xuất hiện trên S3.

**D-KD — `path` tương đối là thứ **cho phép hoãn quyết định CDN**, và ta chứng minh điều đó.**
`BR-IMG-05` cấm URL tuyệt đối trong DB; §11 Q2 hỏi có đặt CDN trước S3 ngay không. Hai câu này
là một: nếu `path` thật sự tương đối thì Q2 **hoãn được mà không tốn gì**, và nếu không thì Q2
là quyết định chặn. Xử: `storage.url(path, variant)` và `storage.signedUrl(path, ttl)` là **bộ
dựng URL duy nhất**; cổng — chuỗi `https://` hay tên bucket xuất hiện trong cột `path` → **đỏ**.
Ca âm chứng minh: đổi biến môi trường base URL → mọi ảnh trỏ host mới, **không** một hàng DB nào
thay đổi. Q2 đóng thành "hoãn, có bằng chứng hoãn được", chủ vẫn là Infra.

**D-KE — Ảnh chứng từ **ghi sổ** vào `content_images` nhưng **không** đi qua pipeline.** §7.1 khai
`owner_type` gồm `payment_order` và `payment_proof`, và `BR-IMG-10` nói chứng từ lưu private với
signed URL 15 phút — trong khi `D-CB` đã chốt chứng từ dùng S3 thô, không chuẩn hoá WebP, không
crop. Hai điều này hợp nhau nếu tách **sổ** khỏi **pipeline**: có một chỗ duy nhất trả lời "hệ
thống đang giữ những ảnh nào" (cần cho audit và cho job dọn), còn cách xử lý từng loại thì khác
nhau. Xử: hàng `content_images` với `visibility = private`, `status = active`, không thumbnail,
không chuyển WebP; migration ghi sổ ngược cho ảnh chứng từ mà P2.3 đã lưu; đọc **chỉ** qua
`storage.signedUrl` TTL 15 phút. Ca âm: pipeline chuẩn hoá **không** chạy trên ảnh chứng từ, và
URL S3 trực tiếp vẫn bị từ chối.

**D-KF — "Không có thư viện ảnh" thi hành bằng **cổng quét**, và `owner_type` là enum đóng.**
`BR-IMG-01` là một quy tắc dạng "không được tồn tại" — cùng loại với sáu quy tắc mà `D-JB` đã
dựng cổng ở P2.2. Xử: mở rộng cổng đó lần thứ tư — không route nào liệt kê ảnh mà thiếu **cả
hai** `owner_type` và `owner_id`; `owner_type` khai thành enum đóng, thêm giá trị mới là một
quyết định có chủ (`Ask first` của spec), không phải một dòng thêm vào lúc vội. Ca âm: thêm một
route liệt kê ảnh theo ngày tháng → cổng **đỏ**.

## 3. Đồ thị

```
T1 packages/storage: pipeline · magic bytes · bảng content_images (D-KC, D-KD, D-KF)
      ├──→ T2 POST/DELETE /api/managers/images + audit
      │         └──→ T4 widget crop trong studio — trả nợ slice cuối P2.6 (D-CC)
      ├──→ T3 content_asset_refs + GET usage + đối soát (D-KB)
      │         └──→ T2 chặn xoá khi đang dùng
      ├──→ T5 job dọn orphan 01:00 UTC, > 30 ngày (D-BD)
      └──→ T6 ghi sổ ảnh chứng từ + migration (D-KE)
                              ── Cổng dừng ──
                                    T7 evidence, promote 3 spec, nợ
```

## 4. Task

### Task 1 — Kho ảnh và pipeline

**Tiêu chí nghiệm thu**
- [ ] Bảng `content_images` đủ cột §7.1; `owner_type` là **enum đóng** theo `D-KF`; `alt` **không null**.
- [ ] Pipeline: nhận jpeg/png/webp → WebP chất lượng **82**, cạnh lớn nhất ≤ **960px**, thumbnail **160×160** crop giữa.
- [ ] Ca dương chuẩn hoá: upload JPEG 3000×2000 → file lưu là WebP, cạnh lớn nhất ≤ 960, có thumbnail 160×160.
- [ ] Ảnh nhỏ hơn 160×160 → chấp nhận, **không** phóng to.
- [ ] `D-KC` ba ca âm chạy bằng **curl**: `.exe` đổi tên `.png` → **415**; `.svg` → **415**; 5 MB → **413**; cả ba ca **không** ghi byte nào lên S3.
- [ ] `D-KD`: `storage.url()` và `storage.signedUrl()` là bộ dựng URL **duy nhất**; cổng — `https://` hay tên bucket trong cột `path` → **đỏ**.
- [ ] `D-KD` ca âm: đổi base URL trong biến môi trường → ảnh trỏ host mới, **không** hàng DB nào đổi.
- [ ] `BR-IMG-06` ca âm: thay ảnh → path **mới**; file cũ **vẫn còn** trên S3.
- [ ] `D-KF` cổng: không route nào liệt kê ảnh thiếu `owner_type` + `owner_id`; ca âm fixture → **đỏ**.
- [ ] Integration test bắt **orphan owner** — polymorphic không có FK, nên đây là ràng buộc duy nhất còn lại (§7.1).

**Kiểm chứng**
- [ ] `pnpm test -- image-pipeline` xanh, assertion tham chiếu `BR-IMG-02` `BR-IMG-03` `BR-IMG-05` `BR-IMG-06`.

**Phụ thuộc:** P0.4 · P0.6 · **Cỡ:** 3 work package M — schema + URL builder; pipeline chuẩn hoá; security/orphan integration tests

### Task 2 — API ảnh

**Tiêu chí nghiệm thu**
- [ ] `POST /api/managers/images` cần `requireManagerAuth()` + `x-csrf-token`; multipart `file` · `owner_type` · `owner_id` · `alt`.
- [ ] `BR-IMG-11` + `BR-IUP-06` ca âm: quét mã — **không** raw `$fetch` cho route upload; request thật có header `x-csrf-token`.
- [ ] Thiếu `alt` → **422** `VALIDATION_FAILED`.
- [ ] `DELETE /api/managers/images/{id}`: đang dùng ở nội dung `published` → **409** `CONTENT_IN_USE` + `details.used_by[]`.
- [ ] `BR-IMG-12`: mọi upload và xoá ghi `audit_logs`.
- [ ] Ảnh của content bị xoá cứng → chuyển `orphan`, không xoá file ngay.
- [ ] Upload fail giữa chừng **không** làm mất trạng thái form studio (`BR-IMG-07` nhánh §5).

**Kiểm chứng**
- [ ] `pnpm test -- image-api` xanh.

**Phụ thuộc:** T1 · T3 · **Cỡ:** M

### Task 3 — Truy vấn ngược và chỉ mục

**Tiêu chí nghiệm thu**
- [ ] Bảng `content_asset_refs (entity_type, entity_id, asset_kind, asset_ref)`; `entity_id` trỏ **đúng hàng version** theo `D-AE`.
- [ ] `D-KB`: ghi chỉ mục nằm **trong cùng transaction** với ghi nội dung; ca dương — sửa một level thêm ảnh mới → `content_asset_refs` có hàng mới.
- [ ] `D-KB` ca âm đối soát: so bảng phụ với `content_pack` JSONB trên tập fixture; lệch một hàng → **đỏ**.
- [ ] Index GIN trên `game_levels.content_pack` tồn tại nhưng **không** dùng ở đường request; cổng quét khẳng định.
- [ ] `GET /api/managers/assets/{ref}/usage` trả đúng hình dạng §7.1 gồm `can_delete` và `block_reason`; trần **200** nơi dùng.
- [ ] `BR-AUT2-04` ca âm: một ảnh dùng ở 1 bản `published` + 2 bản `draft` → mỗi mục hiện đúng trạng thái của nó.
- [ ] `BR-AUT2-01` ca âm: dùng ở `published` → **409**, danh sách nêu rõ level nào.
- [ ] Chỉ dùng ở bản `archived` → cho xoá, **cảnh báo** bản cũ hỏng preview; chỉ ở `draft` → cho xoá, cảnh báo draft không publish được.
- [ ] `BR-AUT2-02` cổng: không route nào xoá hàng `emoji_registry`; emoji chỉ `deprecated`.
- [ ] `BR-AUT2-03` hiệu năng: DB có **3000** game level → `usage` **P95 < 200 ms**.

**Kiểm chứng**
- [ ] `pnpm test -- asset-usage` xanh, gồm test hiệu năng trên dữ liệu 3000 level.

**Phụ thuộc:** T1 · **Cỡ:** 3 work package M — transaction writer; reconciliation/index; usage API + performance gate

### Task 4 — Widget crop trong studio

**Tiêu chí nghiệm thu**
- [ ] Widget lắp vào hint `image` của P2.5; placeholder "P2.7" bị **xoá** — đóng slice cuối của P2.6 theo `D-CC`.
- [ ] Modal crop §7.1 đủ: khung **1:1** mặc định · nút **xoay 90°** · zoom kéo thả · `alt` bắt buộc · cảnh báo thường trực.
- [ ] `BR-IUP-02` ca âm: template hiển thị item ở 96px → modal có hộp preview ở **đúng 96px**.
- [ ] `BR-IUP-08` ca âm: cảnh báo "không dùng ảnh chụp trẻ em" hiện **thường trực**, không phải tooltip.
- [ ] `BR-IUP-07` + `BR-STU-03` ca âm: upload fail vì mạng → modal **giữ nguyên crop và góc xoay**, có nút thử lại.
- [ ] `BR-IUP-05`: chưa điền `alt` → nút upload **vô hiệu**.
- [ ] `BR-IUP-04` ca âm hai phía: chọn file 5 MB → client chặn trước khi gửi; gửi 5 MB bằng curl → server **413**.
- [ ] Ảnh vào < 200×200 → cảnh báo, không chặn cứng.
- [ ] Kết quả crop gửi lên ≤ **1200×1200**, WebP hoặc PNG.
- [ ] Đổi tỉ lệ crop sang 4:3 hoặc 16:9 **chỉ khi** template cho phép.
- [ ] Preview studio cập nhật ngay sau khi field nhận `path`.

**Kiểm chứng**
- [ ] `pnpm test:e2e -- studio-image-upload` xanh · `pnpm test -- image-upload-widget` xanh.

**Phụ thuộc:** T2 · P2.6 · **Cỡ:** M

### Task 5 — Job dọn ảnh mồ côi

**Tiêu chí nghiệm thu**
- [ ] `D-BD`: job chạy **01:00 UTC hằng ngày**, dọn ảnh `orphan` cũ hơn **30 ngày**.
- [ ] `BR-AUT2-05` ca âm: ảnh có owner bị xoá 31 ngày trước → job xoá file khỏi S3 **và** xoá hàng `content_images`.
- [ ] Ảnh `orphan` 29 ngày → **không** đụng tới.
- [ ] Job idempotent; chạy hai lần không lỗi.
- [ ] Job ghi `audit_logs` tổng hợp: bao nhiêu ảnh, bao nhiêu byte.
- [ ] Đăng ký vào registry job của P1.5 kèm retry policy và ngưỡng alert.

**Kiểm chứng**
- [ ] `pnpm --filter @mindkid/worker test -- orphan-image-cleanup` xanh.

**Phụ thuộc:** T1 · P1.5 · **Cỡ:** S

### Task 6 — Ghi sổ ảnh chứng từ

**Tiêu chí nghiệm thu**
- [ ] `D-KE`: ảnh chứng từ có hàng `content_images` với `owner_type = payment_proof`, `visibility = private`, không thumbnail.
- [ ] Migration ghi sổ ngược cho ảnh chứng từ mà P2.3 đã lưu; ca âm — chạy migration hai lần không sinh hàng trùng.
- [ ] `D-KE` + `D-CB` ca âm: pipeline chuẩn hoá WebP **không** chạy trên ảnh chứng từ.
- [ ] `BR-IMG-10` ca âm: URL S3 trực tiếp → **bị từ chối**; chỉ `storage.signedUrl` TTL **15 phút** mở được.
- [ ] Test của P2.3 về chứng từ vẫn xanh **không sửa assertion**.
- [ ] Ảnh chứng từ **không** vào phạm vi job dọn `orphan` — chúng gắn với đơn, và đơn không bị xoá (`BR-PAY-08`).

**Kiểm chứng**
- [ ] `pnpm test -- payment-proof-registry` xanh · `pnpm test -- proof-upload` vẫn xanh.

**Phụ thuộc:** T1 · P2.3 · **Cỡ:** S

### Cổng dừng

- [ ] Manager upload ảnh trong studio, crop 1:1, preview cỡ thật, lưu, ảnh hiện trong preview engine.
- [ ] Ba ca âm upload bằng curl đều bị chặn, và S3 sạch.
- [ ] Xoá ảnh đang dùng ở `published` → **409** với danh sách nơi dùng.
- [ ] `usage` chạy dưới 200 ms trên 3000 level.
- [ ] Đối soát chỉ mục ngược không lệch hàng nào.
- [ ] Đổi base URL → ảnh trỏ host mới, DB không đổi.
- [ ] Không route nào liệt kê ảnh không kèm owner.
- [ ] Ảnh chứng từ vẫn private và vẫn không qua pipeline.
- [ ] `pnpm check && pnpm test && pnpm test:e2e && pnpm --filter @mindkid/gates test && node packages/gates/scripts/check-progress.ts` xanh.

### Task 7 — Evidence, promote và nợ chuyển tiếp

**Tiêu chí nghiệm thu**
- [ ] Mỗi `BR-IMG-*` `BR-IUP-*` `BR-AUT2-*` có ít nhất một test tham chiếu mã rule.
- [ ] Ba spec sang `implemented`.
- [ ] `D-CC` khép lại: slice cuối của P2.6 (widget ảnh) đã xong; xác nhận cổng ra P2.6 nay đủ.
- [ ] §11 Q2 của [`image-storage.md`](../specs/01-platform/image-storage.md) (CDN trước S3) — đóng theo `D-KD`: **hoãn được, có bằng chứng**; chủ vẫn là Infra, và quyết định sau không đụng DB.
- [ ] §11 Q3 của [`image-storage.md`](../specs/01-platform/image-storage.md) (tần suất dọn orphan) — đóng theo `D-BD`: 01:00 UTC hằng ngày, > 30 ngày. Đã làm ở T5.
- [ ] §11 Q1 của [`image-storage.md`](../specs/01-platform/image-storage.md) và Q1 của [`image-upload.md`](../specs/06-admin/image-upload.md) là **cùng một câu** (xoá nền tự động) — đóng một lần: hoãn **P4**.
- [ ] §11 Q1 của [`asset-usage-tracking.md`](../specs/06-admin/asset-usage-tracking.md) (rebuild chỉ mục ngược định kỳ) — đóng theo `D-KB`: chưa cần, đã có test đối soát; script rebuild ghi nợ **P4**.
- [ ] Tick **P2.7** ở [`14-implementation-sequence-todo.md`](14-implementation-sequence-todo.md) khi `check:progress` tự xanh.

**Cỡ:** S

## 5. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| Chỉ mục ngược lệch | Trả lời "không hỏng gì" trong khi có — sai theo hướng nguy hiểm | `D-KB` — cùng transaction + test đối soát |
| Quét JSONB ở đường request | Xoá ảnh thành thao tác vài giây, rồi thành timeout | `BR-AUT2-03` — bảng phụ, cổng quét |
| Tin `Content-Type` của client | File thực thi lên S3 | `D-KC` — magic bytes, ca âm curl |
| SVG lọt | Script chạy trong ngữ cảnh admin | `D-KC` — chặn ở server, ca âm curl |
| URL tuyệt đối trong DB | Đổi CDN là migration toàn bảng | `D-KD` — cổng cột `path` |
| Ghi đè file gốc khi thay ảnh | Version nội dung cũ trỏ vào ảnh đã đổi | `BR-IMG-06` — path mới, ca âm |
| Ảnh chứng từ lọt vào pipeline công khai | Thông tin ngân hàng ra bucket public | `D-KE` — tách sổ khỏi pipeline, ca âm |
| Job dọn xoá nhầm ảnh còn dùng | Nội dung published hỏng, phát hiện bởi trẻ | T5 — chỉ dọn `orphan` > 30 ngày, ca âm 29 ngày |
| Thư viện ảnh mọc lại qua một route "tiện" | Kéo theo toàn bộ governance mà `D4` cố tránh | `D-KF` — cổng quét, enum đóng |
| Ảnh chụp trẻ em được upload | Vi phạm `BR-CDC-04` | Cảnh báo thường trực + review nội dung ở P2.8 |

## 6. Giả định

1. **P2.6 đã đóng** trừ slice ảnh — widget cắm vào chỗ đã chừa sẵn.
2. **P2.3 đã đóng** — ảnh chứng từ tồn tại và cần ghi sổ ngược.
3. **Chưa có CDN** — `D-KD` làm quyết định đó hoãn được.
4. **Chưa có lesson, activity, worksheet** — `owner_type` khai đủ enum nhưng chỉ `game_level` và `payment_proof` có dữ liệu thật ở MVP.
5. **User không upload gì** — mọi upload đều là Manager; đường User upload là add-on P4.

## 7. Ngoài phạm vi

- Thư viện ảnh dùng chung — **không bao giờ** ở MVP (`D4`).
- Xoá nền tự động — P4.
- User upload ảnh — add-on P4.
- Script rebuild chỉ mục ngược — P4.
- CDN — Infra quyết sau, không đụng DB.
- Duyệt nội dung có ảnh — P2.8.
- Audio storage/picker/upload — Task #80 phải tạo spec owner và implementation task riêng; không gộp vào pipeline ảnh.
