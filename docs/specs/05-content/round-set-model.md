---
spec: ROUND-SET-MODEL
title: Chuỗi vòng trong một màn chơi — ràng buộc biên tập
area: content
status: draft
mvp: false
phase: P2
reviewed: 2026-08-21
owns:
  - Ràng buộc biên tập của chuỗi vòng trong một game level
  - Quy tắc leo thang độ khó giữa các vòng liền kề
depends_on:
  - GAME-LEVEL-MODEL
  - GAME-TEMPLATE-CONTRACT
  - SCHEMA-CONTENT-TAXONOMY
  - CONTENT-LIFECYCLE
---

# Chuỗi vòng trong một màn chơi — ràng buộc biên tập

## 1. Objective

Hôm nay một `game_level` mang **đúng một** `content_pack`, tức đúng một câu hỏi. Trẻ trả lời
xong là hết màn chơi. Nhưng mô hình điểm ở mục 7.2 của
[`scoring-and-result.md`](../04-play/scoring-and-result.md) tính
`first_try_ratio = rounds_correct / rounds_total`, và bảng event ở mục 7.2 của
[`event-catalog.md`](../00-foundation/event-catalog.md) đã đặt sẵn `round_started`,
`round_completed`, `round_skipped`. Cả hai được thiết kế cho nhiều vòng; nội dung thì chỉ có
một vòng để phát.

File này đóng khoảng cách đó ở phía nội dung: một `game_level` mang một **round set** — dãy
vòng có thứ tự, cùng một template, cùng một learning objective (`LO` — mục tiêu học tập),
độ khó leo dần. Trẻ làm xong vòng này thì sang vòng kế trong cùng một phiên chơi.

Đây là tài liệu người soạn nội dung đọc.
[`game-level-model.md`](game-level-model.md) sở hữu ràng buộc của **một** vòng và vẫn áp
nguyên cho từng vòng trong set. File này chỉ sở hữu thứ nằm **giữa** các vòng.

Phía runtime do [`round-sequence-play.md`](../04-play/round-sequence-play.md) sở hữu.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `requireManagerAuth()` | Soạn round set, đặt thứ tự vòng, gửi duyệt |
| Người review | quyền duyệt nội dung | Từ chối set vi phạm mục 6 |
| AI agent IDE | — | Dùng file này làm ràng buộc lúc sinh seeder |
| Cổng publish | — | Ép mục 6 lúc chuyển sang `published` |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| [`game-level-studio.md`](../06-admin/game-level-studio.md) | Người soạn nội dung | Bề mặt soạn |
| [`content-review-queue.md`](../06-admin/content-review-queue.md) | Người review | Checklist duyệt |
| [`content-seed-authoring.md`](../01-platform/content-seed-authoring.md) | AI agent IDE | Ràng buộc lúc sinh seeder |

## 4. Main flow

Không có luồng người dùng. Spec ràng buộc. Trình tự biên tập một round set:

1. Chọn template và learning objective — **một** objective cho cả set (`BR-RSM-02`).
2. Chọn số vòng trong trần của band tuổi ở mục 7.1.
3. Soạn vòng đầu ở mức khó thấp nhất của set (`BR-RSM-06`).
4. Soạn từng vòng kế, mỗi lần chỉ tăng **một** chiều độ khó (`BR-RSM-05`).
5. Kiểm hai vòng liền kề không trùng nội dung (`BR-RSM-08`).
6. Chạy checklist mục 7.4 rồi gửi duyệt.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Set một vòng | Level cũ, hoặc nội dung không chia vòng được | Hợp lệ. Round set một phần tử (`BR-RSM-09`) |
| Thêm vòng vào level đã publish | Nội dung đổi | Tạo `content_version` mới. Bản đã publish bất biến |
| Vượt trần số vòng của band | Soạn quá tay | Từ chối duyệt, không phải cảnh báo |
| Set vượt trần payload | Nhiều vòng dùng ảnh | Từ chối duyệt kèm số byte đo được (`BR-RSM-10`) |
| Trộn hai template trong một set | Người soạn muốn đổi mechanic giữa chừng | Từ chối. Thuộc [`curriculum-player.md`](../04-play/curriculum-player.md), không thuộc một level |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-RSM-01` (một template mỗi set) | Mọi vòng trong một round set dùng **cùng một** `template_code` | Đổi mechanic giữa chừng buộc trẻ học lại cách chơi ngay giữa bài. Layout cũng phải tính lại giữa phiên, phá ngân sách frame của `BR-ENG-15` |
| `BR-RSM-02` (một objective mỗi set) | Cả set phục vụ **đúng một** learning objective, `weight = 1.0` | Giữ nguyên `BR-GLM-01` (một mục tiêu học tập mỗi level). Hai objective trong một set làm kết quả không quy được về skill nào |
| `BR-RSM-03` (trần vòng theo band) | Số vòng theo band tuổi ở mục 7.1 | Trí nhớ làm việc và sức chú ý của trẻ 3 tuổi không giữ được một dãy dài. Trần cũng là thứ giữ độ dài phiên, xem `BR-RSM-12` |
| `BR-RSM-04` (mỗi vòng parse được) | `content_pack` của **từng** vòng phải parse được bằng `content_contract` của template | `BR-GTC-02` (parse ở server) áp cho từng vòng, không phải cho set. Một vòng hỏng ở giữa là màn hình trắng giữa lúc trẻ đang chơi |
| `BR-RSM-05` (leo một chiều) | Giữa hai vòng liền kề chỉ tăng **một** chiều độ khó | Kế thừa `BR-GLM-08` (độ khó tăng theo một chiều mỗi lần). Tăng hai chiều cùng lúc làm không biết chiều nào gây khó |
| `BR-RSM-06` (mở bằng thành công) | Vòng đầu phải ở mức khó **thấp nhất** của set | Trẻ bỏ game ở vòng đầu thì không có vòng nào sau đó. Mở bài bằng một lần làm được là điều kiện để còn lại phần bài |
| `BR-RSM-07` (theme nhất quán) | Một theme cho cả set | Kế thừa `BR-GLM-10` (theme nhất quán trong một level). Đổi theme giữa set đọc như đổi sang game khác |
| `BR-RSM-08` (vòng phải khác nhau) | Cấm — **NEVER hai vòng liền kề trùng nội dung.** Đổi thứ tự option không tính là khác | Kế thừa `BR-GLM-07` (level cùng skill phải khác nhau về nội dung). Lặp lại cùng một câu là luyện trí nhớ vị trí, không phải luyện tư duy |
| `BR-RSM-09` (set một vòng hợp lệ) | Round set **một phần tử** là hợp lệ và là mặc định khi migrate | Toàn bộ level đã seed phải chạy tiếp không cần soạn lại. Ép mọi level thành nhiều vòng là ép biên tập lại cả kho nội dung |
| `BR-RSM-10` (trần payload cả set) | Tổng payload **cả set** ≤ 200 KB gzipped | `BR-CFG-08` (payload ≤ 200 KB gzipped) là trần của một phiên, không phải của một vòng. Nhân theo số vòng thì trần cũ vỡ im lặng |
| `BR-RSM-11` (chỉ dẫn mỗi vòng) | Mỗi vòng có chỉ dẫn riêng, ≤ 12 từ, không phủ định | Kế thừa `BR-GLM-04` và `BR-GLM-05`. Một chỉ dẫn dùng chung cho cả set buộc nó nói chung chung, và chung chung thì trẻ không biết phải làm gì |
| `BR-RSM-12` (độ dài set) | Một set nhắm thời lượng ≤ **5 phút** ở band tuổi của nó | Trần phút chơi trong ngày ở [`healthy-play-limits.md`](../04-play/healthy-play-limits.md) đo theo ngày, không chặn một phiên dài. Set dài biến một màn chơi thành một buổi ngồi máy |
| `BR-RSM-13` (không trộn band) | Mọi vòng trong set dùng **cùng** `age_min`/`age_max` của level | Band tuổi quyết định sàn touch (`BR-ENG-05`) và trần item. Đổi band giữa set làm sàn touch đổi giữa lúc trẻ đang chạm |

## 7. Data

**Đọc:** `game_templates` · `skills` · `content_skill_map`.
**Ghi:** `game_levels` · `game_level_rounds`.

Cột DB do mục 7.4 của
[`schema-content-taxonomy.md`](../01-platform/schema-content-taxonomy.md) sở hữu. Bảng dưới
mô tả **hình dạng biên tập**, không thay thế spec schema — xem câu hỏi còn mở số 1.

### 7.1 Số vòng theo band tuổi

| Band | Vòng tối thiểu | Vòng tối đa |
|---|---:|---:|
| 3–4 | 1 | 4 |
| 4–5 | 1 | 6 |
| 5–6 | 1 | 8 |

Trần này nhân với trần item của mục 7.1
[`game-level-model.md`](game-level-model.md), không thay thế nó: một set band 3–4 có 4 vòng,
mỗi vòng vẫn tối đa 4 item và 1 vật gây nhiễu.

Vượt trần là lý do **từ chối duyệt**, không phải cảnh báo.

### 7.2 `game_level_rounds`

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `game_level_id` | bigint | FK tới **hàng version** của `game_levels`, không phải `entity_id` |
| `round_index` | int | Bắt đầu từ 0, liên tục, không nhảy số |
| `instruction` | text | ≤ 12 từ, không phủ định (`BR-RSM-11`) |
| `instruction_audio_path` | text | Nullable |
| `content_pack` | jsonb | Parse được bằng `content_contract` của template (`BR-RSM-04`) |
| `difficulty_params` | jsonb | Parse được bằng `difficulty_contract` |
| `difficulty` | int | 1–5, thang ở mục 7.2 [`game-level-model.md`](game-level-model.md) |
| — | — | UNIQUE `(game_level_id, round_index)` |

Round set **bất biến** cùng hàng version của level: sửa một vòng là tạo `content_version`
mới của cả level, theo [`content-versioning.md`](../00-foundation/content-versioning.md).
Sửa tại chỗ làm báo cáo của một đứa trẻ không giải thích được bằng nội dung nó đã chơi.

### 7.3 Leo thang — chiều được phép tăng

Mỗi bước chỉ chọn **một** cột.

| Chiều | Ví dụ tăng |
|---|---|
| Số item | 3 quả lên 4 quả |
| Số vật gây nhiễu | 1 lên 2 |
| Độ tương đồng của nhiễu | Quả đỏ với quả xanh, lên quả đỏ với quả đỏ sẫm |
| Số bước phải làm | Một lần kéo, lên hai lần kéo |
| Độ trừu tượng của tiêu chí | Tiêu chí nói ra, lên tiêu chí phải suy ra |

### 7.4 Kiểm tra trước khi gửi duyệt

- [ ] Mọi vòng cùng một `template_code`
- [ ] Đúng một learning objective cho cả set, `weight = 1.0`
- [ ] Số vòng trong trần band ở mục 7.1
- [ ] `round_index` liên tục từ 0
- [ ] Vòng đầu ở mức khó thấp nhất của set
- [ ] Mỗi bước leo đúng một chiều ở mục 7.3
- [ ] Không hai vòng liền kề trùng nội dung
- [ ] Mỗi vòng có chỉ dẫn riêng ≤ 12 từ, không phủ định
- [ ] Một theme cho cả set
- [ ] Tổng payload cả set ≤ 200 KB gzipped
- [ ] Mỗi vòng qua được checklist mục 7.4 của [`game-level-model.md`](game-level-model.md)

## 8. API contract

Không sở hữu route. Ràng buộc mục 6 ép ở cổng publish của
[`content-lifecycle.md`](../00-foundation/content-lifecycle.md), trả `422 VALIDATION_FAILED`
kèm `details.fields[]` nêu `round_index` vi phạm. Vòng không parse được trả
`422 CONTENT_PACK_INVALID` kèm `details.issues[]` và `round_index`.

Không thêm mã lỗi mới — cả hai đã có trong
[`error-codes.md`](../00-foundation/error-codes.md).

## 9. Acceptance criteria

```gherkin
Scenario: BR-RSM-01 — trộn template trong một set bị chặn
  Given một round set có vòng 0 dùng GT-001 và vòng 1 dùng GT-003
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details.fields[] nêu round_index 1 sai template_code

Scenario: BR-RSM-03 — vượt trần vòng của band bị chặn
  Given một level band 3-4 có 5 vòng
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details.fields[] nêu vượt trần vòng của band

Scenario: BR-RSM-04 — một vòng hỏng chặn cả set
  Given một round set 4 vòng, vòng 2 có content_pack thiếu field options
  When gửi duyệt
  Then trả 422 CONTENT_PACK_INVALID
  And details mang round_index bằng 2

Scenario: BR-RSM-05 — leo hai chiều cùng lúc bị chặn
  Given vòng 0 có 3 item và 1 nhiễu
  And vòng 1 có 4 item và 2 nhiễu
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details.fields[] nêu round_index 1 tăng hai chiều

Scenario: BR-RSM-06 — vòng đầu không phải dễ nhất bị chặn
  Given một set có difficulty theo thứ tự 3, 1, 2
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED

Scenario: BR-RSM-08 — hai vòng liền kề trùng nội dung bị chặn
  Given vòng 1 và vòng 2 có content_pack chỉ khác thứ tự phần tử options
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED

Scenario: BR-RSM-09 — set một vòng vẫn publish được
  Given một level có đúng một hàng game_level_rounds với round_index 0
  When gửi duyệt
  Then level chuyển sang published

Scenario: BR-RSM-10 — set vượt trần payload bị chặn
  Given một round set 6 vòng có tổng payload 240 KB gzipped
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details nêu số byte đo được

Scenario: BR-RSM-11 — chỉ dẫn một vòng quá dài bị chặn
  Given vòng 2 có instruction 18 từ
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details.fields[] nêu round_index 2

Scenario: BR-RSM-13 — trộn band trong một set bị chặn
  Given vòng 0 khai band 3-4 và vòng 1 khai band 5-6
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
```

## 10. Boundaries

**Always**
- Một template, một learning objective, một theme, một band cho cả set.
- Mở set bằng vòng dễ nhất.
- Leo đúng một chiều độ khó mỗi bước.
- Ghim round set vào `content_version` của level.

**Ask first**
- Đổi trần số vòng ở mục 7.1.
- Thêm một chiều leo thang vào mục 7.3.
- Đổi mục tiêu 5 phút ở `BR-RSM-12`.

**Never**
- Trộn hai `template_code` trong một set.
- Hai learning objective trong một set.
- Hai vòng liền kề trùng nội dung.
- Sửa một vòng của bản đã publish tại chỗ.
- Đổi band tuổi giữa các vòng.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ | Quyết định / Trạng thái |
|---|---|---|---|---|---|
| 1 | `game_level_rounds` là bảng con hay cột `rounds` jsonb trên `game_levels`? Bảng con cho phép ràng buộc UNIQUE và query từng vòng; jsonb rẻ hơn và khớp cách `content_pack` đang lưu | Hình dạng schema, migration | P2 | Backend | **Bảng con `game_level_rounds` (Task #100 WP100.1).** UNIQUE `(game_level_id, round_index)` ép bởi DB — ràng buộc index liên tục và không trùng vòng không cần code giữ. Query từng vòng cho phép migration và debug mà không parse jsonb. Spec mục 7.2 đã viết theo phương án này, không cần đổi |
| 2 | Migrate level đã seed: copy `content_pack` hiện có thành `round_index = 0` rồi drop cột cũ theo expand-contract, hay giữ cột cũ vĩnh viễn làm vòng 0? | Kế hoạch migration | P2 | người quyết | **Expand-contract (Task #100 WP100.1).** Pha expand: tạo `game_level_rounds`, copy `content_pack`/`difficulty_params`/`instruction`/`instruction_audio_path` của mọi level thành `round_index = 0`. Pha contract: drop 4 cột cũ trên `game_levels` sau khi tất cả code đã đọc từ bảng mới. Repo đã có `scripts/lint-migration-expand.ts` nên pattern có sẵn. Giữ cột cũ vĩnh viễn tạo hai nguồn cho cùng dữ liệu — drift không tránh được |
| 3 | Trần 4 vòng ở band 3–4 dựa trên suy luận về sức chú ý, chưa đo với trẻ. Con số đúng là bao nhiêu? | Trần mục 7.1 | P2 nghiệm thu | người quyết | Chờ dữ liệu từ [`pedagogical-evidence.md`](../08-quality/pedagogical-evidence.md) |
| 4 | Set có nên cho phép vòng **tuỳ chọn** — vòng khó thêm chỉ hiện khi trẻ làm đúng hết các vòng trước? | Phạm vi P2 | P3 | người quyết | Hoãn. Vòng tuỳ chọn làm `rounds_total` khác nhau giữa hai lượt chơi cùng một level, phá tính so sánh của `first_try_ratio` |
