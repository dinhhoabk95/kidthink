---
spec: GLOSSARY
title: Từ vựng chuẩn
area: foundation
status: approved
mvp: true
phase: P0
reviewed: 2026-08-06
owns:
  - Định nghĩa duy nhất của mọi thuật ngữ domain
  - Ánh xạ thuật ngữ PRD ↔ thuật ngữ code
depends_on: []
---

# Từ vựng chuẩn

## 1. Objective

Một từ, một nghĩa, toàn corpus. PRD gốc và code v1 dùng lệch nhau ở vài chỗ quan trọng
(`domain` vs `strand`, `game` vs `game level`) — lệch từ vựng là lệch schema, và lệch
schema phát hiện được lúc migration thì đã muộn.

File này là **trọng tài**. Spec nào dùng từ khác phải sửa, không phải file này.

## 2. Actors

Không có. Đây là spec tham chiếu.

## 3. Entry points

Mọi spec khác. `depends_on: [GLOSSARY]` là mặc định ngầm, không cần khai báo.

## 4. Main flow

Không có.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-GLOS-01` | Thuật ngữ ở §7 là duy nhất. Spec dùng từ đồng nghĩa phải sửa | Hai tên cho một thứ sinh ra hai bảng |
| `BR-GLOS-02` | Thêm thuật ngữ mới = cập nhật file này **trước**, dùng sau | Từ vựng trôi thì tra cứu chéo chết |
| `BR-GLOS-03` | Từ ở §8 bị **cấm** trong mọi spec, code, và UI | Chúng mang nghĩa sai hoặc thuộc phạm vi đã loại bỏ |

## 7. Data — từ điển

### 7.1 Taxonomy

| Chuẩn | Tiếng Việt | Nghĩa | Đồng nghĩa bị cấm |
|---|---|---|---|
| **Competency** | Năng lực | Tầng 1. Đúng **6**: C1–C6 | ability, area |
| **Strand** | Nhánh | Tầng 2, thuộc một Competency. 41 cái | **domain** (PRD gọi vậy — không dùng) |
| **Skill** | Kỹ năng | Tầng 3. 230 cái. Mã bất biến `C1.CNT.03` | competency detail |
| **Learning Objective** (LO) | Mục tiêu học tập | Tầng 4. **Một hành vi quan sát được**. ≥3 mỗi Skill | goal, outcome |
| **Thinking process** | Tiến trình tư duy | Trục metadata `thinking`: observe, compare, sort, … | cognitive skill |

> PRD dùng `Domain` cho tầng 2. Corpus v2 dùng **Strand**. Lý do: `domain` đã mang nghĩa
> "domain module" trong kiến trúc schema — trùng nghĩa trong cùng codebase là nguồn lỗi.

### 7.2 Game

| Chuẩn | Tiếng Việt | Nghĩa | Đồng nghĩa bị cấm |
|---|---|---|---|
| **Game Mechanic** | Cơ chế chơi | Cách tương tác trừu tượng: `drag-to-container`, `tap-select`, … | interaction type |
| **Game Template** | Khuôn trò chơi | Lớp 1, code-owned. Mechanic + layout + `content_contract`. **Không gắn skill** | game type, engine |
| **Game Level** | Màn chơi | Lớp 2, admin-owned. Template + `content_pack` + `difficulty_params` + theme | game instance, **game** (mơ hồ) |
| **`content_pack`** | Gói nội dung | Dữ liệu *học* — item, emoji, đáp án đúng | payload, data |
| **`difficulty_params`** | Tham số độ khó | Dữ liệu *điều chỉnh* — số item, distractor, hint, thời gian | config (mơ hồ) |
| **Theme** | Chủ đề | Bộ hình ảnh và bảng màu: `farm`, `ocean`, … | skin |
| **Session class** | Lớp phiên | Class TS thực thi một template trên canvas | handler |

> Dùng trần trụi chữ **"game"** trong spec là lỗi review. Phải nói rõ *Template* hay *Level*.

### 7.3 Nội dung

| Chuẩn | Tiếng Việt | Nghĩa |
|---|---|---|
| **Lesson** | Bài học | Lớp 2, Manager biên soạn, có duyệt. Đơn vị dạy học hoàn chỉnh |
| **Activity** | Hoạt động | Đơn vị nhỏ tái dùng được trong nhiều Lesson |
| **Curriculum** | Chương trình | **Chỉ là một thứ tự** trên thư viện. Không phải tài sản gốc |
| **Curriculum Item** | Mục chương trình | Một vị trí trong curriculum, trỏ tới Lesson hoặc Game Level |
| **Worksheet** | Phiếu bài tập | Tài liệu in được, gắn LO |
| **Lesson Plan** | Giáo án | Do **User** tạo (add-on), **không** duyệt, **không** vào catalog công khai |

> `Lesson` (hệ thống) ≠ `Lesson Plan` (của User). Hai bảng khác nhau, hai vòng đời khác
> nhau. Nhầm hai cái này là nhầm quyền sở hữu nội dung.

### 7.4 Người và quyền

| Chuẩn | Tiếng Việt | Nghĩa |
|---|---|---|
| **Guest** | Khách | Chưa đăng nhập. Không có record |
| **User** | Người dùng | Một loại duy nhất. Có thể là phụ huynh, có thể là giáo viên |
| **Child Profile** | Hồ sơ trẻ | Thuộc User. **Không có tài khoản, không có credential** |
| **Manager** | Quản trị viên | `super_admin` \| `content_reviewer`. Không tự đăng ký |
| **Entitlement** | Quyền sử dụng | Một khoá năng lực đã được cấp, có hạn |
| **Entitlement key** | Khoá quyền | Định danh năng lực: `play_premium_games`, … Lớp 1 |
| **Package** | Gói | Bó entitlement + giá + thời hạn. Lớp 1 |
| **Add-on** | Gói bổ sung | Package trục độc lập, không mở tier game |
| **Access tier** | Bậc truy cập | Tier `premium` bao hàm tier `standard`, tier `standard` bao hàm tier `login`, tier `login` bao hàm tier `free` — áp dụng trên **content** |
| **Quota** | Hạn mức | Giới hạn đếm được: số trẻ, phút chơi/ngày, lượt AI |

### 7.5 Chơi và đo

| Chuẩn | Tiếng Việt | Nghĩa |
|---|---|---|
| **Play Session** | Phiên chơi | Một lượt chơi một Game Level, từ mở tới kết thúc |
| **Play Event** | Sự kiện chơi | Một hành động trong phiên. INSERT-only |
| **Mastery state** | Trạng thái thành thạo | Ước lượng `p_learn` của một trẻ trên một Skill |
| **ZPD** | Vùng phát triển gần | Khoảng độ khó vừa sức — quá dễ trẻ bỏ, quá khó trẻ khóc |
| **Scaffolding** | Trợ giúp leo thang | Gợi ý tăng dần theo đồng hồ hoặc số miss, **không theo yêu cầu** |
| **Parent Gate** | Cổng phụ huynh | Rào chặn trẻ rời khu vực chơi |
| **`child_uuid`** | Định danh giả của trẻ | Dùng trong telemetry. **Không** phải PII |

### 7.6 Hai lớp dữ liệu

| Chuẩn | Nghĩa |
|---|---|
| **Lớp 1 — code-owned master** | Nguồn sự thật là hằng số TS. Admin **chỉ đọc**. Đổi = PR + deploy |
| **Lớp 2 — admin-owned content** | Nguồn sự thật là DB. Studio CRUD. Có version, có duyệt |

Xem [`../../SPEC.md`](../../SPEC.md) §2.1.

## 8. API contract

Glossary không có route — mục này giữ nguyên số thứ tự chuẩn nhưng nội dung là từ bị cấm dùng
trong corpus, không phải hợp đồng API.

| Từ | Vì sao cấm | Dùng gì thay |
|---|---|---|
| `tenant`, `tenant_id` | Multi-tenancy vĩnh viễn ngoài phạm vi | — |
| `school`, `school_admin`, `classroom` | B2B ngoài phạm vi MVP | — |
| `persona`, `role` (trên `users`) | Năng lực suy từ entitlement, không từ nhãn | `entitlement` |
| `tier` (cho **người dùng**) | `tier` chỉ mô tả **content** | `package`, `entitlement` |
| `domain` (cho tầng 2 taxonomy) | Trùng nghĩa với domain module | `strand` |
| `game` (trần trụi) | Mơ hồ giữa Template và Level | `game_template` / `game_level` |
| `student`, `pupil` | Trẻ 3–6 không phải học sinh trong hệ thống | `child profile` |
| `score` hiển thị cho trẻ | Không hiện điểm lúc chơi | `sao`, `hoàn thành` |
| "chậm phát triển", "IQ", "chẩn đoán" | Vi phạm ranh giới báo cáo | Nhãn ở [`advanced-report.md`](../03-account/advanced-report.md) |

## 9. Acceptance criteria

```gherkin
Scenario: BR-GLOS-03 — từ bị cấm không tồn tại trong corpus
  Given toàn bộ thư mục docs/specs
  When grep -rniE "tenant_id|school_admin|persona enum" docs/specs
  Then không có kết quả nào ngoài file glossary.md và AUDIT-v1.md

Scenario: BR-GLOS-01 — tầng 2 taxonomy chỉ gọi là strand
  Given toàn bộ corpus spec và schema
  When tìm từ "domain" dùng theo nghĩa tầng 2 taxonomy
  Then không có kết quả
```

## 10. Boundaries

**Always**
- Tra file này trước khi đặt tên bảng, cột, enum, hoặc route.
- Nói rõ `game_template` hay `game_level`, không nói trần "game".

**Ask first**
- Thêm thuật ngữ mới vào §7.
- Đổi nghĩa một thuật ngữ đã dùng trong schema.

**Never**
- Dùng từ ở §8.
- Đặt tên bảng/cột theo từ đồng nghĩa không có trong §7.

## 11. Open questions

Không có.
