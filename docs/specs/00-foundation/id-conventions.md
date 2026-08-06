---
spec: ID-CONVENTIONS
title: Quy ước định danh và mã bất biến
area: foundation
status: draft
mvp: true
phase: P0
reviewed: 2026-08-04
owns:
  - Định dạng mọi mã nghiệp vụ
  - Danh sách mã bất biến sau khi phát hành
  - Quy tắc cấp mã mới
depends_on:
  - GLOSSARY
---

# Quy ước định danh và mã bất biến

## 1. Objective

Mã nghiệp vụ là thứ neo dữ liệu học tập qua nhiều năm. `mastery_state`, telemetry,
`content_skill_map`, báo cáo lịch sử đều khoá theo chúng. Một mã bị đổi hoặc tái dùng làm
hỏng dữ liệu **đã thu**, và không có cách sửa ngược.

File này chốt định dạng, ai cấp, và cái gì không bao giờ được đổi.

## 2. Actors

| Actor | Quyền cần | Làm được gì |
|---|---|---|
| Dev | — | Cấp mã Lớp 1 qua PR (taxonomy, template, entitlement key, package) |
| Manager | `content_reviewer` | Hệ thống **tự sinh** mã Lớp 2 khi tạo content; Manager không gõ tay |

## 3. Entry points

- `packages/db/src/seed-master/**` — nơi mã Lớp 1 được khai báo.
- Authoring Studio — nơi mã Lớp 2 được sinh.
- `docs/specs/**` — nơi ID tài liệu (`F-`, `BR-`, `EVT-`, `ERR-`) được cấp.

## 4. Main flow — cấp mã Lớp 2 trong studio

1. Manager chọn template và skill mục tiêu.
2. Hệ thống dựng tiền tố từ ngữ cảnh: `G-<competency>-<strand>`.
3. Hệ thống quét mã lớn nhất đang có với tiền tố đó, **cộng 1**.
4. Mã hiện ở form ở dạng **read-only**.
5. Lưu → mã ghi vào DB kèm `UNIQUE` constraint.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Trùng mã | Hai Manager lưu cùng lúc | `UNIQUE` bắt, server retry cấp mã mới, tối đa 3 lần, rồi trả `CODE_ALLOCATION_FAILED` |
| Xoá content | Content chưa từng `published` | Mã **không** được tái dùng — số tiếp theo vẫn tăng |
| Đổi skill của một level đã publish | — | Mã **giữ nguyên**. Mã mã hoá lịch sử, không mã hoá phân loại hiện tại |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ID-01` | Mã ở §7.2 **bất biến** sau khi content đạt `published` | `mastery_state`, telemetry, báo cáo đều khoá theo mã. Đổi mã là mất dữ liệu đã thu |
| `BR-ID-02` | ❌ **NEVER tái dùng** mã của bản đã xoá | Mã cũ có thể còn trong telemetry và báo cáo đã xuất |
| `BR-ID-03` | ❌ **NEVER chèn mã vào giữa dãy** | Thứ tự mã là thứ tự tạo, không phải thứ tự sư phạm. Thứ tự sư phạm nằm ở `curriculum_items.position` |
| `BR-ID-04` | Mã Lớp 2 do **server** sinh, không nhận từ client | Client gửi mã là đường để ghi đè content của người khác |
| `BR-ID-05` | Mọi mã kiểm bằng regex ở **cả** Zod và DB `CHECK` | Zod bảo vệ API; `CHECK` bảo vệ seeder và migration |
| `BR-ID-06` | ID nội bộ (`bigserial`) **không bao giờ** xuất hiện trong URL công khai hay payload cho client | ID tự tăng để lộ quy mô kinh doanh và mời enumeration |

## 7. Data

### 7.1 Định dạng

| Loại | Tiền tố | Regex | Ví dụ | Lớp |
|---|---|---|---|---|
| Competency | `C` | `^C[1-6]$` | `C1` | 1 |
| Strand | — | `^C[1-6]\.[A-Z]{2,5}$` | `C1.CNT` | 1 |
| Skill | — | `^C[1-6]\.[A-Z]{2,5}\.\d{2}$` | `C1.CNT.03` | 1 |
| Learning Objective | `LO-` | `^LO-C[1-6]\.[A-Z]{2,5}\.\d{2}-\d{2}$` | `LO-C1.CNT.03-01` | 1 |
| Game Template | `GT-` | `^GT-\d{3}$` | `GT-003` | 1 |
| Game Level | `G-` | `^G-C[1-6]-[A-Z]{2,5}-\d{3}$` | `G-C1-CNT-007` | 2 |
| Lesson | `LES-` | `^LES-\d{4}$` | `LES-0042` | 2 |
| Activity | `ACT-` | `^ACT-\d{4}$` | `ACT-0117` | 2 |
| Curriculum | `CUR-` | `^CUR-\d{3}$` | `CUR-001` | 2 |
| Worksheet | `WS-` | `^WS-\d{4}$` | `WS-0009` | 2 |
| Package | `PKG-` | `^PKG-[a-z_]{3,24}$` | `PKG-premium` | 1 |
| Entitlement key | — | `^[a-z][a-z0-9_]{4,40}$` | `play_premium_games` | 1 |
| Theme | — | `^[a-z][a-z0-9-]{2,24}$` | `farm` | 1 |
| Emoji entry | `EMJ-` | `^EMJ-[a-z0-9-]{2,40}$` | `EMJ-apple-red` | 1 |

### 7.2 Bất biến sau `published`

```
skills.code · strands.code · competencies.code · learning_objectives.code
game_templates.code · game_levels.code · lessons.code · activities.code
curricula.code · worksheets.code · packages.code · entitlement_keys.key
```

Đổi bất kỳ mã nào ở trên = **migration có kế hoạch**, không phải một `UPDATE`.
Quy trình: tạo mã mới → bảng ánh xạ `code_aliases` → 301 cho URL cũ → deprecate 2 phase.

### 7.3 ID tài liệu (chỉ trong spec, không vào DB)

| Loại | Định dạng | Registry |
|---|---|---|
| Feature | `F-<3 số>` | [`../index.md`](../index.md) |
| Business rule | `BR-<SPEC>-<2 số>` | [`business-rules.md`](./business-rules.md) |
| Error code | `SCREAMING_SNAKE` | [`error-codes.md`](./error-codes.md) |
| Event | `snake_case` | [`event-catalog.md`](./event-catalog.md) |

### 7.4 Định danh đối ngoại

| Thứ | Dùng gì ra ngoài | ❌ Không dùng |
|---|---|---|
| Game level trong URL | `code` (`G-C1-CNT-007`) | `id` bigserial |
| Child profile trong API | `uuid` | `id` bigserial |
| Trong telemetry | `child_uuid` | tên, tuổi, `id` |
| Payment order | `uuid` | `id` bigserial |
| User trong admin UI | `id` (nội bộ, sau guard) | — |

## 8. API contract

Không sở hữu route nào. Ràng buộc áp lên mọi route:

| Ràng buộc | |
|---|---|
| Path param nhận mã | `:code` với Zod regex tương ứng, ❌ không `:id` số cho tài nguyên công khai |
| Body chứa mã | Zod regex, và **bỏ qua** mọi field mã do client gửi khi tạo mới (`BR-ID-04`) |
| Lỗi | `INVALID_CODE_FORMAT` (400) · `CODE_ALREADY_EXISTS` (409) · `CODE_ALLOCATION_FAILED` (500) |

## 9. Acceptance criteria

```gherkin
Scenario: BR-ID-04 — client không đặt được mã
  Given Manager đã đăng nhập
  When client POST /api/managers/game-levels với body chứa code = "G-C1-CNT-999"
  Then mã trong body bị bỏ qua
  And level được tạo với mã do server sinh theo thứ tự

Scenario: BR-ID-02 — mã đã xoá không tái dùng
  Given game level "G-C1-CNT-007" tồn tại rồi bị xoá
  When Manager tạo level mới cùng competency và strand
  Then mã mới là "G-C1-CNT-008"
  And không phải "G-C1-CNT-007"

Scenario: BR-ID-05 — regex ép ở cả hai tầng
  Given một seeder cố ghi skill code "c1.cnt.3"
  When migration chạy
  Then DB CHECK constraint từ chối
  And thông báo nêu rõ regex mong đợi

Scenario: BR-ID-01 — không sửa được mã đã publish
  Given game level "G-C1-CNT-007" ở trạng thái published
  When Manager gửi PATCH đổi code
  Then hệ thống trả 409 CODE_IMMUTABLE
```

## 10. Boundaries

**Always**
- Sinh mã Lớp 2 ở server, hiện read-only trên form.
- Ép regex ở cả Zod và DB `CHECK`.
- Dùng `code` hoặc `uuid` cho định danh đối ngoại.

**Ask first**
- Thêm loại mã mới vào §7.1.
- Đổi regex của một loại mã đã có dữ liệu.
- Bất kỳ thao tác nào đổi mã đã `published`.

**Never**
- Tái dùng mã đã xoá. Chèn mã vào giữa dãy.
- Nhận mã từ client khi tạo mới.
- Để `bigserial` xuất hiện trong URL công khai hoặc payload client.
- Mã hoá thứ tự sư phạm vào mã — thứ tự nằm ở `curriculum_items.position`.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Mã Game Level có nên mang `template_code` không? Hiện chỉ mang competency + strand | Thay đổi sau khi có level là migration | 🔴 P0 | spec owner |
| 2 | 3 chữ số cho Game Level (`\d{3}`) đủ chưa? V1 dự kiến 3.000+ level → cần 4 | Chốt trước khi seed lô đầu | 🔴 P0 | spec owner |
