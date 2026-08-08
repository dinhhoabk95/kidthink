---
spec: PUBLISH-AND-VERSION
title: Phát hành và quản lý phiên bản
area: admin
status: draft
mvp: true
phase: P2
reviewed: 2026-08-04
owns:
  - Thao tác publish, archive, rollback trong admin
  - Màn hình lịch sử version
depends_on:
  - CONTENT-LIFECYCLE
  - CONTENT-VERSIONING
---

# Phát hành và quản lý phiên bản

## 1. Objective

Đưa nội dung `approved` ra production, và quay lại được khi sai.

Đây là hành động **có hậu quả tức thì với trẻ đang chơi**. Nó tách khỏi studio và khỏi hàng
đợi duyệt để không ai bấm nhầm trong lúc đang soạn.

## 2. Actors

| Actor | Publish | Archive | Rollback |
|---|:--:|:--:|:--:|
| `content_reviewer` | | | Cấm |
| `super_admin` | | | |

## 3. Entry points

`/studio/publish` · `/studio/levels/{code}/versions` ·
`POST /api/managers/content/{type}/{id}/transition` ·
`GET /api/managers/content/{type}/{code}/versions`.

## 4. Main flow

1. Chọn bản `approved`.
2. Server chạy **checklist publish** [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) §7.3.
3. Đủ → transaction: bản mới `published`, bản cũ `archived`.
4. Ghi `content_review_log` + `audit_logs`.
5. Nội dung có hiệu lực **ngay** cho phiên chơi mới; phiên đang chạy giữ version cũ.

## 5. Alternative flows

| Nhánh | Hành vi |
|---|---|
| Checklist thiếu | **422** kèm `missing[]`, không publish một phần |
| Archive nội dung trong curriculum `published` | **409** kèm danh sách nơi dùng |
| Rollback | `super_admin` publish lại bản `archived`; số version không đảo |
| Publish khi đã có bản published | Tự động archive bản cũ **trong cùng transaction** |
| Xoá cứng | Chỉ khi chưa từng `published` **và** không có telemetry |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PUB-01` | Publish chạy checklist **ở server**, không tin client | `BR-CLC-09` |
| `BR-PUB-02` | Publish + archive trong **một transaction** | Hai bản cùng `published` là hai bản cùng được phục vụ |
| `BR-PUB-03` | Rollback **chỉ** `super_admin` | Nó đổi thứ trẻ đang thấy |
| `BR-PUB-04` | Rollback **không đảo số version** | Số version map 1-1 với một nội dung, vĩnh viễn |
| `BR-PUB-05` | Archive nội dung đang dùng → **409** kèm danh sách | Xoá cứng làm mồ côi dữ liệu học tập |
| `BR-PUB-06` | Publish **không ngắt phiên đang chạy** | `BR-VER-04` |
| `BR-PUB-07` | Màn hình publish hiện **diff so với bản đang chạy** | Publish mà không biết đổi gì là publish mù |
| `BR-PUB-08` | Mọi thao tác ghi audit | |

## 7. Data

### 7.1 Màn hình lịch sử version

| Cột | Nội dung |
|---|---|
| Version | Số |
| Trạng thái | `published` \| `archived` \| `draft` \| … |
| Người tạo / người duyệt | |
| Ngày publish / archive | |
| Thay đổi | Tóm tắt diff so với version trước |
| Lượt chơi | Số phiên gắn với version đó |
| Hành động | Xem · Rollback (chỉ `super_admin`) |

Cột "Lượt chơi" quan trọng: rollback một version đã có 2.000 lượt chơi là quyết định khác
với rollback version có 3 lượt.

### 7.2 Diff hiển thị

So `content_pack`, `difficulty_params`, `skill_ids`, `access_tier`, `age` giữa bản sắp
publish và bản đang chạy. Hiện dạng field-by-field, không dump JSON thô.

## 8. API contract

### `POST /api/managers/content/{type}/{id}/transition`

Body `{ to_status: "published", expected_version }`.
200 → `{ status, content_version, archived_version }`.
422 `PUBLISH_CHECKLIST_FAILED` · 409 `CONTENT_IN_USE` · 403 `INSUFFICIENT_ROLE` (rollback).

### `GET /api/managers/content/{type}/{code}/versions`

200 → §7.1 kèm `content_review_log` mỗi bản.

## 9. Acceptance criteria

```gherkin
Scenario: BR-PUB-02 — publish và archive nguyên tử
  Given version 1 đang published và version 2 approved
  When publish version 2
  Then đúng một hàng có status published
  And đó là version 2
  And version 1 là archived

Scenario: BR-PUB-01 — checklist kiểm ở server
  Given một bản approved thiếu tag trục thinking
  When publish
  Then trả 422 PUBLISH_CHECKLIST_FAILED
  And missing chứa tag_axis_thinking

Scenario: BR-PUB-03 — content_reviewer không rollback được
  Given manager role content_reviewer
  When gọi rollback
  Then trả 403

Scenario: BR-PUB-04 — rollback không đảo version
  Given version 1, 2, 3 và đang chạy version 3
  When rollback về version 2
  Then version 2 published, version 3 archived
  And không có hàng version 4

Scenario: BR-PUB-05 — archive nội dung đang dùng bị chặn
  Given một level nằm trong curriculum published
  When archive level đó
  Then trả 409 CONTENT_IN_USE
  And body liệt kê curriculum đang dùng

Scenario: BR-PUB-06 — publish không ngắt phiên đang chạy
  Given một trẻ đang chơi version 3
  When publish version 4
  Then phiên đang chạy tiếp tục
  And kết quả ghi với content_version 3

Scenario: BR-PUB-07 — hiện diff trước khi publish
  When mở màn hình publish
  Then hiện danh sách field đã đổi so với bản đang chạy
  And không dump JSON thô

Scenario: lịch sử hiện lượt chơi mỗi version
  When mở màn hình lịch sử version
  Then mỗi version hiện số phiên chơi gắn với nó
```

## 10. Boundaries

**Always**
- Checklist ở server.
- Publish + archive trong một transaction.
- Hiện diff trước khi publish.
- Ghi audit.

**Ask first**
- Nới một mục checklist.
- Cho `content_reviewer` rollback.
- Xoá cứng nội dung.

**Never**
- Publish một phần khi checklist thiếu.
- Hai bản cùng `published`.
- Đảo số version khi rollback.
- Archive nội dung đang được dùng.

## 11. Open questions

| # | Câu hỏi | Chặn gì |
|---|---|---|
| 1 | Có cần publish theo lịch (hẹn giờ) không? | [`content-lifecycle.md`](../00-foundation/content-lifecycle.md) Q3 |
| 2 | Rollback có nên cảnh báo mạnh hơn khi version đang chạy có nhiều lượt chơi không? | P2 UX |
