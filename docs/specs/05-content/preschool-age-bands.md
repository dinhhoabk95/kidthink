---
spec: PRESCHOOL-AGE-BANDS
title: Contract biên soạn theo band tuổi mầm non
area: content
status: implemented
mvp: false
phase: P4
reviewed: 2026-09-03

owns:
  - Ràng buộc biên soạn của nội dung theo band tuổi mầm non
depends_on:
  - LESSON-MODEL
  - LESSON-FLOW-MODEL
  - CURRICULUM-MODEL
  - GAME-LEVEL-MODEL
  - TAXONOMY-SERVICE
---

# Contract biên soạn theo band tuổi mầm non

## 1. Objective

Mỗi lứa tuổi mầm non (3–4 tuổi Mầm, 4–5 tuổi Chồi, 5–6 tuổi Lá) có đặc điểm phát triển tâm lý, khoảng thời gian chú ý và dung lượng trí nhớ làm việc rất khác biệt. Một tiết học 25 phút hay một bài tập đòi hỏi giữ cùng lúc 3 tiêu chí phân loại có thể hoàn toàn phù hợp với trẻ 5–6 tuổi nhưng sẽ gây quá tải nhận thức, ức chế và bỏ cuộc ở trẻ 3 tuổi.

Spec này sở hữu **ràng buộc biên soạn nội dung theo band tuổi**: thiết lập các trần giới hạn đo lường được về độ khó (`difficulty`), thời lượng ước tính (`estimated_minutes`), số bước chơi (`step_count`), số lượng vật thể hiển thị cùng lúc (`item_count`), và số tiêu chí phân loại đồng thời.

Spec này ép **chất lượng biên soạn bài học và trò chơi**, tuyệt đối cấm — NEVER dùng để chặn quyền ghi danh hoặc học vượt của trẻ (`D-SI` giữ nguyên).

## 2. Actors & Permissions

| Actor | Quyền |
|---|---|
| Tác giả nội dung / Sư phạm | Soạn thảo giáo án và game level tuân thủ trần giới hạn của band tuổi chỉ định |
| Quality Gate Runner | Kiểm tra tính phù hợp của toàn bộ kho nội dung qua cổng `check:age-band-fit` |
| Phụ huynh / Trẻ em | Tự do ghi danh lộ trình theo nhu cầu; không bị hệ thống chặn truy cập dựa vào tuổi thực |

## 3. Preconditions

1. Taxonomy kỹ năng đã phân loại đầy đủ theo `age_min` và `age_max` trong khoảng [3, 6].
2. File cấu hình trần giới hạn `packages/db/config/preschool-age-bands.json` tồn tại và hợp lệ.
3. Các bài học (`lessons`) và màn chơi (`game_levels`) đều khai báo `age_min`, `age_max` hoặc `age_band`.

## 4. Main Flow

1. Cổng `check:age-band-fit` nạp cấu hình trần từ `packages/db/config/preschool-age-bands.json`.
2. Đọc toàn bộ danh sách `lessons` và `game_levels` trong corpus seed.
3. Xác định band tuổi tương ứng của từng bản ghi (`3-4`, `4-5`, hoặc `5-6`).
4. Đối chiếu các thuộc tính đo lường với trần quy định của band:
   - Level: kiểm tra `difficulty` có vượt `difficulty_max`.
   - Lesson: kiểm tra `estimated_minutes` có vượt `estimated_minutes_max`.
   - Lesson: kiểm tra số lượng hoạt động / bước chơi có vượt `step_count_max`.
5. Thu thập danh sách các bản ghi vượt trần và in báo cáo chi tiết từng mã bản ghi.
6. Nếu có bản ghi vi phạm, trả về mã thoát exit 1 để ngăn chặn merge nội dung lỗi.

## 5. Alternative Flows

- **Nguồn dữ liệu không đọc được**: Dừng ngay lập tức với mã thoát exit ≠ 0 (`BR-PAR-05`).
- **Nội dung đa độ tuổi**: Bản ghi có khoảng tuổi bao trùm nhiều band phải thỏa mãn trần của band nhỏ tuổi nhất mà nó tuyên bố hỗ trợ.

## 6. Business Rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PAR-01` | Level và tiết học vượt trần của band tuổi mình khai báo thì cổng kiểm tra báo đỏ | Ngăn chặn nội dung quá tải nhận thức gây nản lòng cho trẻ |
| `BR-PAR-02` | Kỹ năng gắn vào bài phải thuộc khung tuổi hợp lệ trong taxonomy (`age_min` · `age_max`) | Đảm bảo tính sư phạm tuần tự theo sự phát triển của trẻ |
| `BR-PAR-03` | `age_min ≤ age_max`, cả hai ∈ [3, 6], và band tuổi của level ⊆ band tuổi hợp lệ của engine | Tuân thủ ranh giới vận động và cơ chế chơi của từng engine (neo [`BR-ECD-13`](engine-content-depth.md)) |
| `BR-PAR-04` | Contract này ép biên soạn nội dung; cấm — NEVER dùng để chặn ghi danh theo tuổi của trẻ | Bảo vệ quyền học tập cá nhân hóa và nguyên tắc D-SI của nền tảng |
| `BR-PAR-05` | Nguồn dữ liệu không đọc được thì dừng tiến trình với mã thoát ≠ 0 | Ngăn chặn false positive làm lọt lỗi biên soạn |
| `BR-PAR-06` | Báo cáo in chi tiết từng bản ghi lệch kèm trần bị vượt; cấm chỉ in tỷ lệ phần trăm chung | Cung cấp thông tin hành động cụ thể cho biên tập viên sửa đổi |
| `BR-PAR-07` | Cổng kiểm tra phải có các ca kiểm thử âm và dương tự động | Đảm bảo cơ chế kiểm định luôn hoạt động chính xác |

## 7. Data Contract & Trần Giới Hạn

Bảng trần giới hạn sư phạm theo band tuổi (Nguồn: Khung giáo dục mầm non Thông tư 51/2020/TT-BGDĐT & Thuyết phát triển nhận thức Piaget):

| Chỉ số trần | Band `3-4` (Mầm) | Band `4-5` (Chồi) | Band `5-6` (Lá) | Nguồn căn cứ sư phạm |
|---|:---:|:---:|:---:|---|
| `difficulty_max` | **2** | **3** | **5** | Thang đo độ khó 1-5; lứa 3 tuổi chỉ thao tác nhận diện trực quan |
| `estimated_minutes_max` | **12 phút** | **18 phút** | **25 phút** | Khoảng chú ý tập trung có chủ đích tối đa theo lứa tuổi |
| `step_count_max` | **2 bước** | **3 bước** | **4 bước** | Khả năng duy trì mạch hoạt động trong một tiết học |
| `concurrent_items_max` | **4 vật** | **6 vật** | **8 vật** | Dung lượng trí nhớ làm việc (working memory span) |
| `criteria_max` | **1 tiêu chí** | **2 tiêu chí** | **3 tiêu chí** | Khả năng phân loại đa chiều (ví dụ: chỉ màu sắc vs màu + hình) |

## 8. Interfaces & Endpoints

Spec này thuộc tầng kiểm định nội dung biên soạn (Content Authoring Gates). Không có HTTP endpoint công khai.

## 9. Acceptance Scenarios

```gherkin
Scenario: Tiết học vượt trần thời lượng cho phép ở lứa 3-4 tuổi
  Given một tiết học LES-TEST-01 khai báo band tuổi "3-4"
  When estimated_minutes của tiết học là 15 phút (vượt trần 12 phút)
  Then cổng check:age-band-fit báo lỗi vi phạm BR-PAR-01 và trả về mã thoát 1

Scenario: Màn chơi vượt độ khó trần ở lứa 3-4 tuổi
  Given một game level GL-TEST-01 khai báo band tuổi "3-4"
  When difficulty của level là 3 (vượt trần 2)
  Then cổng check:age-band-fit báo lỗi vi phạm BR-PAR-01

Scenario: Khẳng định không chặn ghi danh theo tuổi (BR-PAR-04)
  Given một hồ sơ trẻ 3 tuổi ghi danh vào lộ trình CUR-BE5 (đề xuất 5 tuổi)
  When phụ huynh thực hiện yêu cầu ghi danh POST /api/users/children/{uuid}/enrollments
  Then hệ thống chấp nhận ghi danh thành công với HTTP 200, không từ chối vì tuổi
```

## 10. Boundaries

- **Never**: Tuyệt đối không dùng spec này để từ chối ghi danh của trẻ trên API.
- **Never**: Không tự ý nới lỏng trần giới hạn trong file cấu hình khi chưa có sự đồng ý của chuyên gia sư phạm.

## 11. Open Questions (Đã chốt)

- `Q159-1`: Năm con số trần lấy từ nguồn nào? -> Chốt: Lấy từ Khung giáo dục mầm non Việt Nam và tài liệu phát triển nhận thức mầm non chuẩn hóa ở mục 7.
- `Q159-2`: Các bản ghi hiện đang lệch trần xử lý thế nào? -> Chốt: Giữ nguyên trong task này; đưa vào danh sách rà soát và điều chỉnh của Task #124.
