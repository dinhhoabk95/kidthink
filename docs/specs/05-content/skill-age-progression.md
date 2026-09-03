---
spec: SKILL-AGE-PROGRESSION
title: Bảng thứ tự kỹ năng theo tháng tuổi
area: content
status: implemented
mvp: false
phase: P4
reviewed: 2026-09-03

owns:
  - Thứ tự giới thiệu kỹ năng theo tháng tuổi
depends_on:
  - TAXONOMY-SERVICE
  - CURRICULUM-MODEL
  - LESSON-FLOW-MODEL
  - PRESCHOOL-AGE-BANDS
---

# Bảng thứ tự kỹ năng theo tháng tuổi

## 1. Objective

Nếu như [`preschool-age-bands.md`](preschool-age-bands.md) trả lời câu hỏi *"nội dung này có phù hợp với lứa tuổi không"* bằng các trần giới hạn định lượng, thì spec này trả lời câu hỏi *"kỹ năng này nên được giới thiệu vào thời điểm nào trong lứa tuổi đó"*.

Spec này sở hữu **bảng thứ tự kỹ năng theo lát tuổi (tháng tuổi)**: phân chia độ tuổi mầm non thành 3 lát chính (`36-48m`, `48-60m`, `60-72m`) và xếp hạng thứ tự ưu tiên giới thiệu từng kỹ năng trong từng lát. Thứ tự này làm cơ sở tham chiếu sư phạm cho `curriculum-builder` và thuật toán học tập thích ứng (adaptive recommendation).

Bảng này là **gợi ý định hướng sư phạm**, tuyệt đối cấm — NEVER dùng để chặn trẻ mở bài học hoặc giới hạn quyền học vượt của trẻ (`D-SI` giữ nguyên).

## 2. Actors & Permissions

| Actor | Quyền |
|---|---|
| Chuyên gia sư phạm | Biên soạn và xếp thứ tự kỹ năng theo tháng tuổi và nguồn tham chiếu sư phạm |
| Curriculum Builder | Đọc bảng thứ tự kỹ năng để gợi ý xếp bài học theo tuần trong lộ trình |
| Adaptive Engine | Tham chiếu bảng thứ tự để đề xuất kỹ năng tiếp theo trong vùng phát triển gần nhất (ZPD) |
| Trẻ em / Phụ huynh | Trải nghiệm tự do, không bị khóa nội dung dựa trên tuổi thực |

## 3. Preconditions

1. Danh mục Taxonomy kỹ năng `C1`…`C6` và đồ thị phụ thuộc tiên quyết (`skill_prerequisites`) đã được định nghĩa và là đồ thị có hướng không chu trình (DAG).
2. Tệp cấu hình `packages/db/config/skill-age-progression.json` tồn tại, phủ đủ các kỹ năng có nội dung.

## 4. Main Flow

1. Cổng `check:skill-progression` nạp cấu hình `packages/db/config/skill-age-progression.json`.
2. Kiểm tra tính hợp lệ qua Zod schema: `skill_code`, `age_slice`, `rank_in_slice`, `source`.
3. Kiểm tra độ phủ: mọi kỹ năng đang có game level hoặc lesson đều phải có mặt trong bảng (`BR-SAP-04`).
4. Kiểm tra tiên quyết: thứ hạng kỹ năng phải tương thích với `skill_prerequisites`. Kỹ năng tiên quyết phải được xếp trước hoặc cùng lát tuổi với kỹ năng phụ thuộc (`BR-SAP-02`).
5. Đối chiếu với các lộ trình học (`curricula`): nếu thứ tự bài học trong lộ trình lệch so với bảng, đưa ra **cảnh báo** sư phạm nhưng không chặn xuất bản (`BR-SAP-03`).
6. Trả về kết quả kiểm tra đạt (mã thoát 0).

## 5. Alternative Flows

- **Nguồn dữ liệu lỗi**: Dừng ngay lập tức với mã thoát exit ≠ 0 (`BR-SAP-06`).
- **Thiếu kỹ năng trong bảng**: Báo lỗi đỏ và dừng tiến trình nếu kỹ năng đang có nội dung nhưng thiếu trong bảng phân bổ (`BR-SAP-04`).
- **Lộ trình xếp lệch bảng**: Hệ thống ghi log cảnh báo để người soạn rà soát, nhưng không chặn build (`BR-SAP-03`).

## 6. Business Rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SAP-01` | Mỗi kỹ năng được xếp vào ≥1 lát tuổi trong {`36-48m`, `48-60m`, `60-72m`} kèm thứ hạng trong lát | Cung cấp mốc thời gian sư phạm rõ ràng cho việc xây dựng bài giảng |
| `BR-SAP-02` | Thứ hạng phải tương thích với `skill_prerequisites` (kỹ năng tiên quyết xếp trước hoặc cùng lát) | Không thể dạy kỹ năng nâng cao khi trẻ chưa được tiếp cận kỹ năng nền tảng |
| `BR-SAP-03` | Bảng là gợi ý xếp thứ tự; cấm — NEVER dùng bảng để chặn trẻ mở nội dung hay học vượt | Bảo vệ nguyên tắc cá nhân hóa và tinh thần Thinking Play Platform |
| `BR-SAP-04` | Kỹ năng có level hoặc tiết học mà thiếu dòng trong bảng thì cổng kiểm tra báo đỏ | Tránh việc phát hành nội dung mồ côi không rõ vị trí sư phạm |
| `BR-SAP-05` | Lộ trình xếp theo bảng phải chạm 2–4 competency mỗi tuần (tương thích `BR-CRM-02`) | Đảm bảo sự cân bằng đa dạng tư duy trong trải nghiệm học tập của trẻ |
| `BR-SAP-06` | Nguồn dữ liệu không đọc được thì dừng tiến trình với mã thoát ≠ 0 | Ngăn chặn false positive làm lọt lỗi hệ thống |
| `BR-SAP-07` | Cổng kiểm tra phải có các ca kiểm thử tự động kiểm tra vi phạm tiên quyết và thiếu dữ liệu | Đảm bảo cổng kiểm soát luôn được bảo vệ |

## 7. Data Contract & Nguồn Sư Phạm

```ts
export interface SkillProgressionRow {
  skill_code: string;
  age_slice: "36-48m" | "48-60m" | "60-72m";
  rank_in_slice: number;
  source: string;
}

export interface SkillProgressionConfig {
  date: string;
  version: string;
  description: string;
  source_framework: string;
  progressions: SkillProgressionRow[];
}
```

Nguồn chuẩn hóa: Khung chương trình giáo dục mầm non Việt Nam (Thông tư 51/2020/TT-BGDĐT) làm trục chuẩn quốc gia, kết hợp các giai đoạn nhạy cảm giác quan và tư duy logic theo phương pháp Montessori.

## 8. Interfaces & Endpoints

Spec này thuộc tầng công cụ kiểm định chất lượng sư phạm. Không sở hữu API endpoint trực tiếp.

## 9. Acceptance Scenarios

```gherkin
Scenario: Kỹ năng có level nhưng thiếu dòng trong bảng tiến trình
  Given kỹ năng C1.CNT.01 có các game level đã xuất bản
  When cấu hình skill-age-progression.json thiếu mã C1.CNT.01
  Then cổng check:skill-progression báo lỗi vi phạm BR-SAP-04 và dừng với mã 1

Scenario: Kỹ năng tiên quyết bị xếp sau kỹ năng phụ thuộc
  Given kỹ năng A là tiên quyết của B trong taxonomy
  When bảng xếp B ở rank 1 và A ở rank 5 trong cùng lát tuổi
  Then cổng check:skill-progression báo lỗi vi phạm BR-SAP-02 và dừng với mã 1

Scenario: Lộ trình xếp lệch bảng chỉ đưa ra cảnh báo (BR-SAP-03)
  Given lộ trình học CUR-TEST xếp bài học của kỹ năng X trước kỹ năng Y (ngược với bảng gợi ý)
  When chạy kiểm tra cổng check:skill-progression
  Then hệ thống in cảnh báo sư phạm nhưng trả về mã thoát 0 thành công
```

## 10. Boundaries

- **Never**: Tuyệt đối không dùng bảng tiến trình để chặn quyền truy cập bài học của trẻ.
- **Always**: Mọi dòng dữ liệu phải có trường `source` trỏ tới tài liệu sư phạm căn cứ.

## 11. Open Questions (Đã chốt)

- `Q160-1`: Nguồn căn cứ sư phạm lấy từ đâu? -> Chốt: Chương trình GDMN Thông tư 51/2020/TT-BGDĐT kết hợp Montessori Early Learning Framework.
- `Q160-2`: Kỹ năng trải dài 2 lát tuổi xếp thế nào? -> Chốt: Xếp ở lát tuổi bắt đầu tiếp cận.
- `Q160-3`: Bộ chọn thích ứng tham chiếu bảng ở đâu? -> Chốt: Dùng để gợi ý bài học kế tiếp theo ZPD.
