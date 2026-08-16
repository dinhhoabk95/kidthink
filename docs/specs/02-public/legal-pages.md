---
spec: LEGAL-PAGES
title: Trang pháp lý và chính sách
area: public
status: implemented
mvp: true
phase: P1
reviewed: 2026-08-14
owns:
  - Danh sách trang pháp lý bắt buộc
  - Nguồn nội dung singleton của trang pháp lý
depends_on:
  - CHILD-DATA-COMPLIANCE
---

# Trang pháp lý và chính sách

## 1. Objective

Tám trang pháp lý cung cấp bản công khai **duy nhất đang áp dụng** cho Guest và User. Nội dung
được sở hữu bởi code, sửa bằng PR và deploy; hệ thống không có policy version, lịch sử version
hay editor pháp lý trong admin.

Ba tài liệu cần đồng ý (`terms`, `privacy`, `child_data`) tách việc **đổi nội dung** khỏi việc
**yêu cầu đồng ý lại**. Sau khi bản sửa đã qua rà soát và deploy, `super_admin` mới chủ động
force theo [`legal-consent-admin.md`](../06-admin/legal-consent-admin.md) mục 4.

> Mọi chính sách cần được **chuyên gia pháp lý tại Việt Nam rà soát** trước deploy production.
> Spec này định nghĩa cấu trúc và ràng buộc kỹ thuật, không thay tư vấn pháp lý.

## 2. Actors

| Actor | Quyền | Làm được gì ở đây |
|---|---|---|
| Guest | Không cần đăng nhập | Đọc toàn bộ tám trang |
| User | Không cần dùng session để đọc | Đọc cùng nội dung với Guest, kể cả khi đang bị yêu cầu đồng ý lại |
| Cơ quan quản lý | Truy cập công khai | Đối chiếu chính sách đang áp dụng |

## 3. Entry points

`/terms` · `/privacy` · `/child-privacy` · `/cookie` ·
`/payment-policy` · `/refund-policy` · `/contact` · `/about`.

## 4. Main flow

1. Guest hoặc User mở route pháp lý.
2. Hệ thống đọc đúng một document hiện hành từ registry code-owned và hiện ngày cập nhật gần nhất.
3. Mỗi mục có tóm tắt ngắn trước nội dung đầy đủ.
4. Khi cần sửa, người soạn đổi document trong repo; legal review và PR review là cổng trước deploy.
5. Nếu thay đổi cần User đồng ý lại, `super_admin` force **sau deploy** qua
   [`legal-consent-admin.md`](../06-admin/legal-consent-admin.md) mục 4. Deploy tự nó không force.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Slug không thuộc danh sách đóng | Mở `/{slug}` | 404 |
| URL version lịch sử | Mở `/{slug}/v/{version}` hoặc API `/versions` | 404; route không tồn tại |
| Chưa có bản dịch | MVP | Chỉ tiếng Việt |
| Document `pending_review` | Kiểm production build/deploy | Cổng đỏ; document không được phát hành |
| User đang bị force re-consent | Mở trang pháp lý | Vẫn 200 và đọc được toàn văn hiện hành |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LGL-01` | Mỗi slug có **đúng một** document hiện hành, có `last_updated_on`, không có số version | Một bản code-owned là contract đã chọn; thêm số version sẽ dựng lại hệ thống version bị loại bỏ |
| `BR-LGL-02` | Cấm — **NEVER route, API, schema hay UI lịch sử policy version**. Git giữ lịch sử authoring, không phải bề mặt sản phẩm | Hai nguồn lịch sử sẽ lệch nhau; sản phẩm chỉ phục vụ văn bản hiện hành |
| `BR-LGL-03` | Cấm — **NEVER script bên thứ ba** trên trang pháp lý | Trang giải thích quyền riêng tư mà tự nó theo dõi là mâu thuẫn không giải thích được |
| `BR-LGL-04` | Chính sách trẻ em là **trang riêng**, không nhét vào privacy | Nghĩa vụ đối với dữ liệu trẻ cần được đọc và đồng ý riêng |
| `BR-LGL-05` | Đổi code **không tự force**. Chỉ `super_admin` force sau deploy qua [`legal-consent-admin.md`](../06-admin/legal-consent-admin.md) | Tách release code khỏi quyết định pháp lý có ảnh hưởng toàn bộ User; tránh một deploy kỹ thuật vô tình khoá hệ thống |
| `BR-LGL-06` | Ngôn ngữ **rõ ràng**, có tóm tắt đầu mỗi mục | Chính sách không đọc được là chính sách không có |
| `BR-LGL-07` | Cấm — **NEVER deploy production document chưa qua rà soát pháp lý** | Bảo đảm nội dung công khai đã có người chịu trách nhiệm pháp lý đọc |
| `BR-LGL-08` | Link tới chính sách trẻ em ở **chân mọi trang** | Minh bạch thông tin và dễ tiếp cận cho phụ huynh ở mọi bề mặt sản phẩm |
| `BR-LGL-09` | Cấm — **NEVER sửa nội dung document pháp lý qua admin UI hoặc `seo_pages`** | Nội dung pháp lý phải đi qua diff PR, legal review và rollback code; editor runtime bỏ qua cả ba cổng |

## 7. Data

### 7.1 Tám trang bắt buộc

| Trang | Cần đồng ý riêng | Ghi chú |
|---|:--:|---|
| Điều khoản sử dụng (`/terms`) | Có | `consent_type='terms'` |
| Chính sách quyền riêng tư (`/privacy`) | Có | `consent_type='privacy'` |
| Chính sách bảo vệ dữ liệu trẻ em (`/child-privacy`) | Có | `consent_type='child_data'` |
| Chính sách cookie (`/cookie`) | Không | Liệt kê cookie kỹ thuật thiết yếu |
| Chính sách thanh toán (`/payment-policy`) | Không | Không tạo consent riêng |
| Chính sách hoàn tiền (`/refund-policy`) | Không | Không tạo consent riêng |
| Giới thiệu (`/about`) | Không | Trang công khai tĩnh |
| Liên hệ (`/contact`) | Không | Trang công khai tĩnh |

### 7.2 Chính sách trẻ em phải nêu

Dữ liệu **nào** được thu theo danh sách đóng của
[`child-data-compliance.md`](../00-foundation/child-data-compliance.md) mục 7.1 · mục đích ·
thời hạn · ai truy cập · bên thứ ba · quyền xem, sửa, export, xoá, rút đồng ý · cách thực hiện
từng quyền · kênh liên hệ.

### 7.3 Registry code-owned

Mỗi `LegalDocument` có đúng các field nghiệp vụ:

`slug` · `title` · `last_updated_on` · `legal_review_status` (`pending_review` | `approved`) ·
`summary` · `requires_consent` · `is_child_specific` · `sections[]`.

Cấm field `version`, `content_version`, `previous_versions`, `diff` hay `effective_from` dùng
để dựng lịch sử. `last_updated_on` chỉ mô tả bản hiện hành, không phải khoá consent.

## 8. API contract

### `GET /api/guest/legal/{slug}`

| | |
|---|---|
| Auth | Không |
| 200 | Document hiện hành theo mục 7.3; không field version |
| 404 | Slug không thuộc danh sách đóng |

Ba document cần đồng ý trả `Cache-Control: no-store` để màn hình re-consent không dùng nội dung
cũ từ browser cache. Cấm route `GET /api/guest/legal/{slug}/versions` và
`GET /api/guest/legal/{slug}/v/{version}`.

## 9. Acceptance criteria

```gherkin
Scenario: BR-LGL-01 — mỗi slug chỉ có một document hiện hành
  When đọc registry trang pháp lý
  Then mỗi slug xuất hiện đúng một lần
  And document có last_updated_on
  And document không có field version hay content_version

Scenario: BR-LGL-02 — không có bề mặt version lịch sử
  When mở /privacy/v/1 và GET /api/guest/legal/privacy/versions
  Then cả hai trả 404

Scenario: BR-LGL-03 — không script bên thứ ba
  When mở mọi trang pháp lý
  Then không request tới domain bên thứ ba

Scenario: BR-LGL-04 — chính sách trẻ em là trang riêng
  When mở /child-privacy
  Then trang tồn tại và có document riêng

Scenario: BR-LGL-05 — deploy không tự force re-consent
  Given privacy được sửa, rà soát và deploy
  When chưa có super_admin force
  Then reconsent_required_at của privacy không đổi

Scenario: BR-LGL-07 — document chờ review chặn production
  Given privacy có legal_review_status pending_review
  When chạy production gate
  Then gate thất bại

Scenario: BR-LGL-08 — link ở chân mọi trang
  When kiểm chân trang của mọi trang public
  Then có link tới chính sách trẻ em

Scenario: BR-LGL-09 — legal document không thuộc SEO editor
  When đọc schema và route của seo_pages
  Then không có page_type legal
  And không mutation admin nào ghi LEGAL_DOCUMENTS
```

## 10. Boundaries

**Always**
- Giữ đúng một document hiện hành cho mỗi slug.
- Hiện `last_updated_on` và tóm tắt từng mục.
- Rà soát pháp lý trước deploy production.
- Link chính sách trẻ em ở chân mọi trang.

**Ask first**
- Sửa bất kỳ nội dung pháp lý nào.
- Thêm hoặc bỏ một trang.
- Đổi tài liệu nào cần consent riêng.

**Never**
- Policy version, URL version cũ, API lịch sử hay diff version.
- Script bên thứ ba trên trang pháp lý.
- Deploy document chưa qua rà soát pháp lý.
- Gộp chính sách trẻ em vào privacy.
- Sửa document pháp lý qua admin UI hoặc `seo_pages`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Ngân sách và đơn vị rà soát pháp lý?~~ **Đóng 2026-08-09 (T13, `D-AS`)**: ngân sách 50M VND tư vấn pháp lý IP/Bảo vệ dữ liệu trước go-live | Go-live | Đã đóng | D-AS |
| 2 | Hồ sơ đánh giá tác động và nghĩa vụ nộp/lưu theo Luật 91/2025/QH15 cùng văn bản hướng dẫn hiện hành phải thực hiện thế nào? | Tuân thủ pháp lý — cùng câu hỏi với [`child-data-compliance.md`](../00-foundation/child-data-compliance.md) mục 11 câu 2 | P1 | người quyết |
| ~~3~~ | ~~Chính sách hoàn tiền chưa có nội dung — chính sách thương mại là gì?~~ **Đóng 2026-08-16 (D-RF)**: không có hoàn tiền tự động trong ứng dụng; hướng dẫn khách hàng liên hệ kênh Zalo OA / Messenger / Email để thoả thuận và chuyển khoản thủ công | Quy trình thanh toán | Đã đóng | D-RF |
