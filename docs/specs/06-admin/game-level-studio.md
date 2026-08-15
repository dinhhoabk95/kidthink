---
spec: GAME-LEVEL-STUDIO
title: Studio soạn màn chơi
area: admin
status: implemented
mvp: true
phase: P2
reviewed: 2026-08-08
owns:
  - Luồng soạn một game level
  - Ràng buộc soạn thảo và lưu nháp
depends_on:
  - SCHEMA-DRIVEN-FORM
  - LIVE-PREVIEW
  - GAME-TEMPLATE-CONTRACT
  - CONTENT-LIFECYCLE
---

# Studio soạn màn chơi

## 1. Objective

Manager tạo và sửa game level **không viết một dòng code nào**. Đây là điều kiện để nội dung
lớn nhanh hơn tốc độ tuyển được lập trình viên — và là một trong sáu tiêu chí MVP hoàn thành.

**D-CC** (T15, 2026-08-09): field `thumbnail_emoji` và ảnh trong form do
[`schema-driven-form.md`](schema-driven-form.md) sinh ra lắp widget từ
[`emoji-picker.md`](emoji-picker.md) và [`image-upload.md`](image-upload.md) — cả hai ở
bước 7 của [`roadmap.md`](../roadmap.md), **sau** bước 6 (spec này). Không chặn: hai field đó
build sau cùng slice trong bước 6, khi bước 7 đã xong; phần còn lại của form (field text/số/
select) không cần chờ.

Studio ghi `game_levels` ở trạng thái `draft`. Publish là bề mặt khác
([`publish-and-version.md`](publish-and-version.md)), có cổng duyệt riêng.

## 2. Actors

| Actor | Làm gì |
|---|---|
| `content_reviewer` · `super_admin` | Tạo, sửa, gửi duyệt |
| `pnpm seed:content` | Ghi nội dung nền `published` qua đường khác ([`content-seed-authoring.md`](../01-platform/content-seed-authoring.md)); từ đó Manager quản lý trong studio bằng **version mới** |

## 3. Entry points

`/studio/levels` danh sách · `/studio/levels/new` · `/studio/levels/{code}/{version}`.

## 4. Main flow

1. Chọn **template** — quyết định đầu tiên, không đổi được sau khi có nội dung.
2. Chọn **skill mục tiêu** → hệ thống gợi ý tag ba trục và band tuổi.
3. Form sinh **từ `content_contract`** của template ([`schema-driven-form.md`](schema-driven-form.md)).
4. Chọn emoji hoặc upload ảnh cho từng item.
5. Đặt `difficulty_params`, `theme_id`, `access_tier`.
6. **Preview trên engine thật**, cập nhật khi field đổi (debounce 300ms).
7. Lưu nháp bất cứ lúc nào; gửi duyệt khi xong.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Đổi template khi đã có nội dung | Cảnh báo mất dữ liệu, yêu cầu xác nhận; `content_pack` bị reset |
| Sửa level đã `published` | Tạo **version mới** ở `draft` — [`content-versioning.md`](../00-foundation/content-versioning.md) §4 |
| Lưu fail (mạng, validation) | **Giữ nguyên toàn bộ dữ liệu form**, cho thử lại |
| Hai Manager mở cùng bản | `expected_version` chống ghi đè; người sau nhận **409** |
| Preview không dựng được | Hiện **rõ lý do**, không để preview trống im lặng |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-STU-01` | Studio ghi `game_levels`. Cấm — **NEVER ghi `game_templates`** | Template là Lớp 1, do seed và migration sở hữu |
| `BR-STU-02` | `content_pack` validate bằng `content_contract` ở **server** trước khi ghi | Sai schema làm crash engine trong lúc trẻ đang chơi |
| `BR-STU-03` | Cấm — **NEVER mất công việc.** Lưu fail giữ nguyên form | Manager mất 20 phút biên soạn vì lỗi mạng sẽ không tin studio nữa |
| `BR-STU-04` | Preview dùng **engine thật**, không mock, không ảnh tĩnh | Preview xấp xỉ để lọt level không chơi được, và người phát hiện sẽ là một đứa trẻ 4 tuổi |
| `BR-STU-05` | Mọi thao tác ghi `audit_logs` | Nội dung sai gây hại cho trẻ |
| `BR-STU-06` | `access_tier` **bắt buộc chọn**, không mặc định | `BR-LAD-02` |
| `BR-STU-07` | Studio Cấm — **NEVER publish trực tiếp** — đi qua `in_review` | `BR-CLC-02` |
| `BR-STU-08` | Mật độ UI dày hơn MASTER: field 16px, control 40px | Studio là bề mặt làm việc theo lô |
| `BR-STU-09` | Lỗi validate hiện **cạnh field**, không dồn lên đầu form | Form có thể dài 40 field |
| `BR-STU-10` | Emoji chọn qua **picker**; chrome của studio vẫn là SVG | `BR-EMJ-01` `BR-EMJ-03` |

## 7. Data

### 7.1 Cấu trúc màn hình

| Vùng | Nội dung |
|---|---|
| Trái (40%) | Form sinh từ schema, nhóm theo: Thông tin · Nội dung · Độ khó · Phân loại · Quyền |
| Phải (60%) | Preview engine thật, khung tỉ lệ 16:9, nút chạy lại |
| Trên | Mã level (read-only) · trạng thái · nút Lưu nháp · Gửi duyệt |
| Dưới | Lỗi validate còn lại, đếm |

### 7.2 Trường bắt buộc trước khi gửi duyệt

`template_code` · `title` · `instruction` · `content_pack` hợp lệ ·
`difficulty_params` hợp lệ · `access_tier` · ≥1 skill (đúng 1 có `weight = 1.0`) ·
≥1 learning objective · `age_min`/`age_max` · `difficulty` · tag đủ ba trục.

### 7.3 Lưu nháp

Tự động mỗi 30 giây khi có thay đổi, và khi rời field. Nháp không cần hợp lệ đầy đủ —
validate đầy đủ chỉ chạy khi **gửi duyệt**.

## 8. API contract

### `POST /api/managers/levels`

Body `{ template_code }`. 201 → level `draft` rỗng kèm mã sinh bởi server.

### `PATCH /api/managers/levels/{code}/{version}`

| | |
|---|---|
| Auth | `requireManagerAuth()` |
| Body | Field cần đổi + `expected_version` |
| 200 | |
| 409 | `VERSION_CONFLICT` · `CONTENT_IMMUTABLE` |
| 422 | `CONTENT_PACK_INVALID` + `details.issues[]` |

### `POST /api/managers/levels/{code}/{version}/submit`

Chuyển `draft → in_review`. **422** `PUBLISH_CHECKLIST_FAILED` nếu thiếu §7.2.

## 9. Acceptance criteria

```gherkin
Scenario: Manager tạo và publish level không cần code
  Given manager đăng nhập vào studio
  When manager chọn template, chọn emoji, đặt đáp án, gửi duyệt và publish
  Then level xuất hiện trong catalog
  And trẻ chơi được ngay
  And không có deploy nào xảy ra

Scenario: BR-STU-03 — lưu fail không mất dữ liệu
  Given manager đã điền 30 field
  When request lưu thất bại vì mạng
  Then toàn bộ dữ liệu form còn nguyên
  And có nút thử lại

Scenario: BR-STU-02 — content_pack sai bị chặn ở server
  When gửi content_pack thiếu đáp án đúng
  Then trả 422 CONTENT_PACK_INVALID
  And details.issues nêu rõ vấn đề

Scenario: BR-STU-04 — preview dùng engine thật
  When quét implementation của preview
  Then nó import cùng entry point với runtime của trẻ

Scenario: BR-STU-06 — access_tier bắt buộc
  When gửi duyệt mà chưa chọn access_tier
  Then trả 422
  And missing chứa access_tier

Scenario: BR-STU-01 — studio không ghi template
  When quét mọi route studio
  Then không route nào ghi bảng game_templates

Scenario: BR-STU-07 — không publish trực tiếp
  Given một level ở draft
  When gọi publish
  Then trả 409 INVALID_STATUS_TRANSITION

Scenario: hai manager không ghi đè nhau
  Given manager A và B cùng mở một bản draft
  When A lưu rồi B lưu với expected_version cũ
  Then B nhận 409 VERSION_CONFLICT

Scenario: BR-STU-09 — lỗi hiện cạnh field
  When gửi duyệt với 3 field lỗi
  Then mỗi lỗi hiện ngay dưới field tương ứng

Scenario: sửa level published tạo version mới
  Given một level published version 2
  When manager bấm sửa
  Then hệ thống tạo version 3 ở draft
  And version 2 vẫn published
```

## 10. Boundaries

**Always**
- Validate `content_pack` ở server.
- Preview bằng engine thật.
- Tự lưu nháp, giữ dữ liệu khi lưu fail.
- Ghi audit mọi thao tác.

**Ask first**
- Thêm trường ngoài `content_contract`.
- Đổi bố cục hai cột.
- Nới danh sách bắt buộc §7.2.

**Never**
- Ghi `game_templates` từ studio.
- Publish trực tiếp từ studio.
- Mock preview.
- Mất dữ liệu form khi lưu fail.
- Mặc định `access_tier`.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | Có cần chế độ soạn hàng loạt (nhập bảng) cho 120 level không? Từng bản một sẽ rất chậm | P2 | Chưa ở MVP — MVP dùng seeder [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) để nạp lô; studio dùng để sửa/tạo từng bản | người quyết |
| 2 | Sao chép một level làm bản mới — có ở MVP không? | P2 | Có — tính năng "Nhân bản" (Duplicate) tạo một bản nháp mới kế thừa toàn bộ `content_pack` | người quyết |
