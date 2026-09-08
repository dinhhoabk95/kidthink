---
spec: LEVEL-DIFFICULTY-CONTRACT
title: Hợp đồng độ khó game level và tham số hoá cấu hình
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-09-08
owns:
  - Ánh xạ độ khó 1..5 về số item hiển thị và tham số điều khiển qua bảng tra engine
  - Quy định bắt buộc khai difficulty_params.item_count
  - Thang tiến bộ độ khó nằm trên trục kỹ năng (≥2 mức, đi từ thấp lên)
  - Ngoại lệ difficulty_fixed cho engine đặc thù cơ chế
  - Ranh giới giữa tham số độ khó và mã chơi trong session
depends_on:
  - GAME-TEMPLATE-CONTRACT
  - ENGINE-SPEC-SHEET
  - ENGINE-CONTENT-DEPTH
  - SKILL-DATASET-MODEL
---

# Hợp đồng độ khó game level và tham số hoá cấu hình

## 1. Objective

Cột `difficulty` trong bảng `game_levels` lưu giá trị `smallint` từ 1 tới 5 nhưng trước Task #263 chưa có spec nào định nghĩa cụ thể 5 mức này chi phối điều gì ở từng cơ chế chơi. Việc thiếu hợp đồng dẫn đến hai khiếm khuyết lớn trong hệ thống:
1. **Trượt độ khó**: 19/37 engine có số item hiển thị giữ nguyên ở mọi mức khó (flat engine), và 6/37 engine có số item bị giảm khi mức khó tăng.
2. **Ẩn giấu tham số**: mã chạy runtime (`round-runner.ts`) phải đoán số item hiển thị qua việc rà soát hình dạng dữ liệu `content_pack` (`extractItemCount`), trong khi các trường điều khiển độ khó khai trong schema (`hint_after_ms`, `allow_retry`, `item_count`) không được đọc lúc chơi hoặc bị gắn giá trị mặc định cứng (`.default(...)`).

Hợp đồng này xác lập:
- Mức độ khó 1..5 ánh xạ trực tiếp về **số item hiển thị** (và các tham số tương ứng) thông qua **bảng tra cấu hình theo từng engine**, cấm công thức tỷ lệ chung.
- Trường `difficulty_params.item_count` là **bắt buộc khai** trên toàn bộ level.
- Thang tiến bộ độ khó thuộc về **trục kỹ năng**, không thuộc về trục engine.
- Mã chơi (`session.ts`) đọc toàn bộ tham số từ `difficulty_params`.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người soạn nội dung | `content_author` / `content_reviewer` | Soạn `difficulty_params` đúng bảng tra của engine và đúng thang kỹ năng |
| Cổng độ khó (`check:difficulty-ladder`) | — | Kiểm tra tính đơn điệu không giảm của level và đối chiếu từng level với bảng tra |
| Cổng tham số cứng (`check:hardcoded-params`) | — | Ngăn chặn việc tái sinh số cứng và lạm dụng `.default(...)` trong schema |
| Runtime (`round-runner.ts`, session) | — | Tiếp nhận `difficulty_params` để dựng giao diện và điều khiển kịch bản lượt chơi |

## 3. Entry points

| Route / màn hình / file | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/config/engine-difficulty-params.json` | Dev / Biên soạn | Bảng tra 37 engine × 5 mức kèm lý do sư phạm |
| `packages/content/src/levels/**/*.ts` | Biên soạn | Nơi khai báo `difficulty_params` trên từng level |
| `packages/game-engine/src/runtime/round-runner.ts` | Trẻ chơi | Đọc trực tiếp `config.difficulty_params.item_count` |
| `pnpm --filter @mindkid/game-engine check:difficulty-ladder` | Cổng CI/Git | Cổng kiểm tra độ khó chạy trong pre-commit |

## 4. Main flow

1. Người soạn chọn một kỹ năng và xác định các mức khó cần phủ (tối thiểu 2 mức, tăng dần từ 1 đến 5).
2. Với mỗi level gắn với engine tương ứng, người soạn tra cứu `packages/game-engine/config/engine-difficulty-params.json` để lấy bộ tham số chuẩn cho mức `difficulty` được chỉ định (gồm `item_count`, `distractor_count`, `grid_size`, v.v.).
3. Level khai báo đầy đủ trường `difficulty_params` với các giá trị khớp bảng tra.
4. Cổng `check:difficulty-ladder` kiểm tra:
   - Level có `difficulty_params.item_count` nằm trong `limits.item_count` của engine.
   - Khi `difficulty` tăng trong cùng một nhánh kỹ năng, `item_count` không được giảm.
   - Bộ tham số khớp chuẩn bảng tra (hoặc có lý do điều chỉnh hợp lệ).
5. Khi trẻ chơi, `round-runner.ts` và session class nhận `difficulty_params`, thiết lập số item, dung sai và thời gian gợi ý mà không cần đoán cấu trúc `content_pack`.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Engine dạy khái niệm (`GT-000`) | `difficulty_fixed: true` trong config | Mọi mức khó giữ nguyên 1 item trọng tâm; độ khó tăng qua số lượng phân đoạn hoặc tính phức tạp của khái niệm |
| Engine cố định số vật theo cơ chế (`GT-014`) | Cơ chế đòi hỏi đúng 2 đĩa cân | Giữ nguyên `item_count: 2`, độ khó điều chỉnh qua số lượng quả cân hoặc mức độ chênh lệch khối lượng |
| Lỗi thiếu `item_count` | Level không khai `difficulty_params.item_count` | Cổng kiểm tra từ chối commit ngay tại local |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-LDC-01` | Mức `difficulty` 1..5 ánh xạ về số item qua bảng tra `engine-difficulty-params.json` 37 engine × 5 mức; CẤM công thức tỷ lệ chung. | Số lượng item mang ngữ nghĩa vật lý khác nhau ở từng cơ chế (4 thẻ chọn ở GT-001 khác 4 vật trên đĩa cân ở GT-014). Bảng tra cho phép tinh chỉnh sư phạm độc lập. |
| `BR-LDC-02` | Trường `difficulty_params.item_count` là BẮT BUỘC KHAI trên mọi game level; CẤM suy đoán từ `content_pack`. | Tránh việc runtime phải đoán mò qua các khóa mảng (`extractItemCount`), gây lỗi telemetry bằng 0 ở các engine dùng cấu trúc dữ liệu đặc thù. |
| `BR-LDC-03` | Tính đơn điệu không giảm: với mọi engine (trừ engine `difficulty_fixed`), `item_count(Lvl_n+1) >= item_count(Lvl_n)` khi mức khó tăng. | Mức khó cao hơn không được làm giảm số item hiển thị; giảm item là đi ngược quy luật phát triển nhận thức của trẻ. |
| `BR-LDC-04` | Thang tiến bộ độ khó thuộc trục KỸ NĂNG: mỗi kỹ năng trong corpus phải có ≥2 mức khó và được sắp xếp từ thấp lên cao. | Trẻ học theo lộ trình kỹ năng; thang đo độ khó phải phản ánh sự nâng bậc của năng lực tư duy chứ không phải đặc tính của engine. |
| `BR-LDC-05` | Ngoại lệ `difficulty_fixed: true` bắt buộc khai trong config có cổng canh; CẤM ghi bằng văn xuôi không qua kiểm chứng. | Đảm bảo tính minh bạch; chỉ engine có lý do cơ chế tất yếu mới được miễn trừ yêu cầu tăng item. |
| `BR-LDC-06` | Mã chơi (`session.ts`) đọc toàn bộ ngưỡng từ `difficulty_params`; CẤM fix cứng hằng số điều khiển độ khó trong session code. | Tách biệt triệt để giữa mã điều khiển luồng (engine logic) và tham số nội dung sư phạm (content parameters). |
| `BR-LDC-07` | Hạn chế `.default(...)` trong `DifficultySchema`: chỉ dùng cho trường tùy chọn thật sự; trường điều khiển độ khó bắt buộc khai. | Tránh tình trạng level thiếu trường nhưng vẫn âm thầm lọt qua parse nhờ giá trị mặc định do schema tự cấp. |
| `BR-LDC-08` | Hệ thống thích ứng (`adaptive-engine.md` / `BR-ADP-09`) chỉ đọc và tinh chỉnh `difficulty_params`, không đọc cột `difficulty`. | Thuật toán thích ứng ZPD điều chỉnh trực tiếp các chiều tham số vật lý của bài học (thời gian, số vật, gợi ý) thay vì một số nguyên thô. |

## 7. Data

**Đọc:**
- `packages/game-engine/config/engine-difficulty-params.json`
- `game_levels.difficulty`
- `game_levels.difficulty_params`

**Ghi:**
- `game_levels.difficulty_params` trong seeder và content authoring studio.

| Field | Kiểu | Ràng buộc |
|---|---|---|
| `difficulty` | `smallint` | `1 <= difficulty <= 5` |
| `difficulty_params.item_count` | `number` | Bắt buộc, nguyên dương, nằm trong `limits.item_count` của engine |
| `difficulty_params.hint_after_ms` | `number` | Tùy chọn, `hint_after_ms >= 1000` |
| `difficulty_params.allow_retry` | `boolean` | Tùy chọn, mặc định `true` |

## 8. API contract

Không có endpoint HTTP riêng. Contract này áp dụng ở tầng cấu hình seed và payload session runtime:

### Runtime Config Payload

```typescript
interface LevelDifficultyConfig {
  item_count: number;
  hint_after_ms?: number;
  allow_retry?: boolean;
  [key: string]: unknown;
}
```

## 9. Acceptance criteria

```gherkin
Scenario: BR-LDC-01 — Ánh xạ mức khó khớp bảng tra
  Given Một game level GT-001 có difficulty là 3
  When Cổng check:difficulty-ladder kiểm tra level
  Then Giá trị difficulty_params.item_count phải khớp giá trị của GT-001 mức 3 trong engine-difficulty-params.json

Scenario: BR-LDC-02 — Thiếu item_count thì bị từ chối
  Given Một game level không khai báo trường difficulty_params.item_count
  When Cổng kiểm tra hợp đồng độ khó chạy
  Then Cổng báo lỗi và chặn commit

Scenario: BR-LDC-03 — Số item giảm khi tăng độ khó thì bị chặn
  Given Hai level thuộc cùng một kỹ năng dùng engine GT-002
  And Level thứ nhất có difficulty 3 với item_count là 4
  And Level thứ hai có difficulty 4 với item_count là 3
  When Cổng check:difficulty-ladder chạy
  Then Cổng báo lỗi vi phạm tính đơn điệu không giảm của số item

Scenario: BR-LDC-05 — Ngoại lệ difficulty_fixed được tôn trọng
  Given Engine GT-000 khai difficulty_fixed bằng true trong config kèm lý do cơ chế
  When Cổng kiểm tra duyệt qua các level của GT-000
  Then Cổng cho phép các level ở mọi mức độ khó có cùng item_count là 1
```

## 10. Boundaries

**Always**
- Luôn tra cứu `engine-difficulty-params.json` khi khởi tạo tham số level mới.
- Luôn khai báo `difficulty_params.item_count` tường minh trên mọi level.
- Luôn kiểm tra tính đơn điệu không giảm theo thang kỹ năng.

**Ask first**
- Thay đổi giá trị trong `engine-difficulty-params.json` cho một engine đã publish.
- Bổ sung trường bắt buộc mới vào `difficulty_params`.

**Never**
- Cấm — NEVER suy đoán số item từ mảng `items` hoặc `options` của `content_pack`.
- Cấm — NEVER dùng công thức tỷ lệ số học (linear scaling formula) để tính số item chung cho 37 engine.
- Cấm — NEVER để level có mức khó 5 mang số item ít hơn mức khó 1.
- Cấm — NEVER khai báo `.default(...)` cho các trường điều khiển trực tiếp độ khó trong schema.

## 11. Ca sai không bắt được bằng schema

1. **Số item bằng nhau ở hai cực**: Level khai `difficulty: 5` và `difficulty: 1` đều có `item_count: 4`. Cả hai level đều parse hợp lệ qua Zod schema của engine vì 4 nằm trong `[2, 6]`. Tuy nhiên về mặt sư phạm, thang độ khó bị tê liệt (flat ladder). Schema không thể bắt được lỗi này vì nó chỉ kiểm tra từng thực thể độc lập; chỉ có cổng đối chiếu chuỗi level theo kỹ năng (`check:difficulty-ladder`) mới phát hiện được.
2. **Mâu thuẫn giữa params và content pack**: `difficulty_params.item_count` khai là 5, nhưng mảng `content_pack.items` chỉ chứa 3 phần tử. Schema của engine chỉ kiểm tra mảng không rỗng, không thể tự động so sánh số lượng phần tử của content pack với giá trị khai ở difficulty params nếu không có rule kiểm tra chéo.

## 12. Open questions

Không có.
