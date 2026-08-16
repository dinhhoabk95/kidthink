---
spec: MVP-SCOPE
title: Phạm vi MVP, cổng phase, điểm cắt
area: foundation
status: implemented
mvp: true
phase: P0
reviewed: 2026-08-11
owns:
  - Định nghĩa cái gì thuộc MVP
  - Thứ tự hy sinh khi thiếu nguồn lực
  - Danh sách ngoài phạm vi hiện hành và cổng đưa một outcome trở lại
depends_on:
  - GLOSSARY
---

# Phạm vi MVP, cổng phase, điểm cắt

## 1. Objective

MVP không phải "ít tính năng nhất có thể". MVP là **tập nhỏ nhất chứng minh được chu trình
kinh doanh**:

```
User tìm thấy sản phẩm → trẻ chơi thử → User tạo hồ sơ trẻ
→ trẻ tiếp tục chơi → User thấy giá trị qua báo cáo → nâng cấp gói
→ hệ thống giữ được trải nghiệm học 4–8 tuần
```

Bất cứ thứ gì không nằm trên chu trình đó đều là P4 trở đi.

**MVP = P0 → P3.** Quyết định 2026-08-04: code viết mới từ đầu, và Authoring Studio đầy đủ
nằm trong MVP. Đây là tổ hợp đắt — §5 nói rõ cắt gì nếu nguồn lực không đủ.

Phạm vi sản phẩm hiện hành là **web-only, Việt Nam-only**. PWA là cách phân phối web, không
phải native mobile app. Classroom/B2B, licensing/white-label, marketplace và mở thị trường
không được giữ dưới dạng task hay placeholder “để sau”; nếu nhu cầu xuất hiện, người quyết mở
một chương trình scope mới và spec đi trước plan.

## 2. Actors

Không có. Spec phạm vi.

## 3. Entry points

[`../roadmap.md`](../roadmap.md) — thứ tự trong từng phase.
[`../index.md`](../index.md) — bản đồ 106 spec kèm cờ `mvp` và `phase`.

## 4. Main flow — bốn phase MVP

| Phase | Chứng minh được gì | Cổng ra |
|---|---|---|
| **P0 Foundation** | Hệ thống có xương: taxonomy, auth, schema, audit | `../../SPEC.md` §13 |
| **P1 Play core** | Trẻ chơi được, hệ thống đo được, quyền chặn đúng | idem |
| **P2 Commerce + Admin** | Tiền vào được, nội dung lớn được không cần dev | idem |
| **P3 Curriculum** | Trẻ có lộ trình 4–8 tuần, người lớn thấy tiến bộ | idem |

Không phase nào được đánh dấu xong khi cổng ra chưa xanh **toàn bộ**. Một cổng ra xanh 9/10
không phải 90% xong — nó là chưa xong.

## 5. Alternative flows — điểm cắt theo thứ tự hy sinh

Khi nguồn lực căng, cắt theo đúng thứ tự này:

| # | Cắt gì | Còn lại gì | Mất gì |
|---|---|---|---|
| 1 | P3: **1 curriculum theo tuổi** thay vì 5 | Lộ trình vẫn chạy, chứng minh được mô hình | Ít lựa chọn cho User |
| 2 | P2 Studio: **chỉ sửa level đã seed**, không tạo mới | Nội dung vẫn sửa được không cần deploy | Nội dung mới vẫn cần dev |
| 3 | P1: **80 game level** thay vì 120 | ~13 level mỗi competency | Nội dung mỏng, trẻ hết bài sớm hơn |
| 4 | P3: **báo cáo nâng cao rút gọn** — bỏ xu hướng theo tuần | Vẫn có điểm theo competency/skill | Giá trị của `premium` yếu đi |

### Bốn thứ **không bao giờ cắt**

| Không cắt | Vì sao |
|---|---|
| **Access gating** | Cắt gating là cho không toàn bộ nội dung. Không có đường sửa sau khi đã phát hành |
| **Audit log** | Thêm audit sau là đi vá từng call site, và không có dữ liệu cho khoảng thời gian đã chạy |
| **Tuân thủ dữ liệu trẻ em** ([`child-data-compliance.md`](child-data-compliance.md)) | Dữ liệu thu sai không xoá ngược được khỏi backup và log |
| **Versioning nội dung** | Không có nó thì mọi báo cáo học tập trở nên vô nghĩa sau lần sửa nội dung đầu tiên |

Bốn thứ này rẻ khi làm đúng lúc và rất đắt khi vá sau. Chúng là lý do phase gate tồn tại.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-MVP-01` | Phase không xong khi cổng ra chưa xanh toàn bộ | 90% xong của một cổng an toàn là 0% an toàn |
| `BR-MVP-02` | **NEVER bán một gói chưa mở được tính năng nào** | Vấn đề đạo đức thương mại, không chỉ là gap kỹ thuật |
| `BR-MVP-03` | Add-on lên catalog **cùng lúc** với tính năng của nó, không trước | idem |
| `BR-MVP-04` | Thứ ở §8 **ngoài phạm vi hiện hành** — không viết code, spec triển khai, task hay chỗ trống schema cho nó. Muốn đưa lại phải có quyết định sản phẩm mới, sửa canonical scope rồi viết spec trước plan. | Chỗ trống “để sau này dùng” biến giả định thành contract và kéo kiến trúc hiện tại theo một mô hình chưa được chọn |
| `BR-MVP-05` | Bốn thứ ở §5 không được cắt dù nguồn lực thế nào | Bốn yếu tố này (dữ liệu trẻ, audit thanh toán, isolation, logging) bảo vệ pháp lý và nền tảng hệ thống |
| `BR-MVP-06` | Nội dung MVP đủ cho **4–8 tuần** quay lại | Dưới ngưỡng đó thì retention không đo được, và KPI không có nghĩa |

## 7. Data — số lượng phải đạt

| Lớp | MVP | Cắt được xuống |
|---|---:|---:|
| Competency | 6 | 6 |
| Strand | 41 | 41 |
| Skill | 230 | 230 |
| Learning Objective | ≥690 | ≥690 |
| Game Template | 6 | 6 |
| Game Level published | ≥120 | 80 |
| Lesson published | ≥60 | 40 |
| Curriculum | 5 | 1 |

Taxonomy không cắt được — nó là bộ xương mà mọi thứ khác treo lên. Cắt skill là cắt khả
năng đo, và không thêm lại được cho dữ liệu đã thu.

## 8. API contract

Spec này không có route — mục này giữ số thứ tự chuẩn nhưng nội dung là danh sách **ngoài phạm
vi hiện hành**. Đây không phải backlog “sau MVP”. Chỉ một quyết định sản phẩm mới sửa canonical
scope mới được đưa một outcome trở lại; khi đó viết spec sở hữu rồi mới lập plan/task.

| Ngoài phạm vi | Vì sao |
|---|---|
| Multi-tenancy, `tenant_id` | B2C. Thêm trục tenant vào mọi query để phục vụ khách hàng chưa tồn tại |
| School admin, class roster, classroom | B2B khác mô hình bán, khác mô hình hỗ trợ, khác nghĩa vụ pháp lý |
| Marketplace nội dung | Kéo theo kiểm duyệt UGC ở quy mô, thanh toán cho người bán, tranh chấp bản quyền |
| Leaderboard công khai | Vi phạm nguyên tắc thiết kế cho trẻ 3–6 và ranh giới [`child-data-compliance.md`](child-data-compliance.md) |
| Mạng xã hội, bình luận, chia sẻ công khai | idem |
| Nhiều cấp admin, phân quyền tuỳ biến | Hai role là đủ cho một đội vận hành |
| White-label, licensing | Đổi mô hình phân phối, quyền nội dung, hợp đồng và thường kéo theo tenant/B2B |
| Realtime collaboration | |
| AI tự sinh và **tự phát hành** nội dung; LLM chạy trong hệ thống để sinh nội dung | Ranh giới cứng — nội dung nền soạn bằng seeder trong repo, người merge PR mới là phát hành. `01-platform/content-seed-authoring.md` |
| Multiplayer | |
| Native mobile app, App Store, Google Play | Web responsive + PWA đủ cho tablet; không duy trì thêm native client và store release pipeline |
| Localization và tuân thủ thị trường ngoài Việt Nam | Chưa có thị trường đích; không chọn locale/jurisdiction giả trước nhu cầu thật |

## 9. Acceptance criteria — MVP hoàn thành khi

```gherkin
Scenario: Chu trình kinh doanh đầy đủ
  Given một khách chưa từng biết sản phẩm
  When khách vào landing page
  And chơi thử một game free không cần đăng nhập
  And đăng ký tài khoản
  And tạo một hồ sơ trẻ
  And trẻ chơi 3 game và hoàn thành
  And người lớn xem báo cáo cơ bản
  And User tạo đơn thanh toán và nộp chứng từ
  And manager duyệt đơn
  Then trẻ chơi được nội dung premium
  And người lớn xem được báo cáo nâng cao
  And toàn bộ chuỗi trên không cần dev can thiệp

Scenario: BR-MVP-06 — đủ nội dung cho 4 tuần
  Given một trẻ 4 tuổi theo một curriculum
  When trẻ chơi mỗi ngày theo hạn mức
  Then trong 4 tuần không có nội dung nào lặp lại
  And mọi tuần đều có ít nhất 5 hoạt động

Scenario: Manager tạo nội dung không cần code
  Given manager đã đăng nhập vào admin
  When manager tạo một game level mới từ emoji và publish
  Then level xuất hiện trong catalog
  And trẻ chơi được ngay
  And không có deploy nào xảy ra

Scenario: BR-MVP-04 — không có dấu vết của thứ ngoài phạm vi
  When grep tìm tenant_id, school_admin, classroom, native_mobile, licensing, marketplace trong toàn bộ source
  Then không kết quả nào ngoài file spec liệt kê chúng như bị cấm
```

## 10. Boundaries

**Always**
- Kiểm cổng ra đầy đủ trước khi tuyên bố phase xong.
- Cắt theo đúng thứ tự §5.
- Giữ bốn thứ không-cắt.

**Ask first**
- Thêm bất kỳ thứ gì vào MVP.
- Cắt ngoài thứ tự §5.
- Đưa một mục ở §8 vào phạm vi.

**Never**
- Bán gói chưa mở được tính năng.
- Cắt gating, audit, tuân thủ dữ liệu trẻ, hoặc versioning.
- Để chỗ trống trong schema cho thứ ở §8.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| ~~1~~ | ~~Ai biên soạn ≥690 LO, ≥120 game level, ≥60 lesson?~~ **Đóng 2026-08-09 (`D-CN`, thay thế quyết định hoãn `D-W`)**: nhóm Nội dung sở hữu; AI agent IDE chỉ soạn file. Baseline lập kế hoạch là 20 LO, 6 game level hoặc 3 lesson/người review/ngày; đo lại sau lô pilot 30 LO + 6 level, không hạ checklist để đạt quota | — | Đã đóng | D-CN |
| 2 | Ngân sách và lịch cho P0→P3 là bao nhiêu? Chưa có ước lượng nào | Toàn bộ kế hoạch | cần người quyết | người quyết |
| 3 | Có mốc phát hành cứng không, hay ship khi xong? Nếu có mốc cứng thì §5 phải được kích hoạt sớm | Ưu tiên | cần người quyết | người quyết |
| ~~4~~ | ~~Backup và monitoring thuộc phase nào~~ **Đóng 2026-08-06 (T9)**: **P0** — [`backup-and-restore.md`](../01-platform/backup-and-restore.md) spec gắn vào cổng ra P0. Go-live không có backup là không chấp nhận được | — | Đã đóng | D-X (T9) |
