---
spec: ENGINE-COMPETENCY-ALLOCATION
title: Ma trận phân bổ lĩnh vực tư duy theo engine và band tuổi
area: content
status: implemented
mvp: false
phase: P4
reviewed: 2026-09-03

owns:
  - Bản đồ tương hợp engine -> lĩnh vực tư duy
  - Sàn K lĩnh vực trên mỗi ô (engine × band tuổi hợp lệ)
  - Khuôn và trần ngoại lệ ô
depends_on:
  - ENGINE-CONTENT-DEPTH
  - TAXONOMY-SERVICE
  - CONTENT-TAGGING
  - GAME-TEMPLATE-CONTRACT
---

# Ma trận phân bổ lĩnh vực tư duy theo engine và band tuổi

## 1. Objective

[`engine-content-depth.md`](engine-content-depth.md) sở hữu câu hỏi *"engine này có đủ nội dung không"*, đo bằng sáu chỉ số kỹ thuật: `thinking` · `what` · `theme` · `difficulty`. Các chỉ số đó không đo **competency** — sáu lĩnh vực tư duy `C1`…`C6` vốn là bộ khung sư phạm cốt lõi của toàn bộ chương trình giáo dục mầm non.

Spec này sở hữu **phân bổ lĩnh vực**: xác định engine nào phục vụ lĩnh vực nào, và mỗi ô (engine × band tuổi hợp lệ) phải có bao nhiêu lĩnh vực khác nhau (mật độ K). Spec này **cộng thêm** vào chiều sâu nội dung, cấm — NEVER thay thế [`engine-content-depth.md`](engine-content-depth.md).

## 2. Actors & Permissions

| Actor | Quyền |
|---|---|
| Chuyên gia sư phạm | Biên soạn và duyệt bản đồ tương hợp engine → competency; ký ngoại lệ ô |
| Agent / Developer | Chạy cổng kiểm tra `check:engine-allocation`, bảo đảm tuân thủ ma trận |
| Hệ thống CI / Lefthook | Cưỡng chế cổng `check:engine-allocation` trước khi merge nội dung |

## 3. Preconditions

1. Toàn bộ template engine có mặt trong registry `@mindkid/game-engine` với danh sách `banned_age_bands` chuẩn xác.
2. File cấu hình `packages/db/config/engine-competency-allocation.json` tồn tại, hợp lệ theo Zod schema.
3. Corpus seed chứa các game level đã gắn mã `skill_codes` trỏ vào taxonomy `C1`…`C6`.

## 4. Main Flow

1. Cổng `check:engine-allocation` nạp cấu hình `packages/db/config/engine-competency-allocation.json`.
2. Kiểm tra tính toàn vẹn của tệp cấu hình qua Zod schema: `k` (mặc định 3), `affinity`, `exceptions`, `exception_cap`.
3. Đọc danh sách engine từ registry game engine và tập hợp `ALL_SEED_LEVELS`.
4. Lập danh sách các ô hợp lệ `(engine × band)` bằng cách loại bỏ các band nằm trong `banned_age_bands`.
5. Với mỗi ô hợp lệ:
   - Thu thập các lĩnh vực `C1`…`C6` từ tiền tố mã kỹ năng của các level đã xuất bản.
   - Đối chiếu với bản đồ `affinity` xem có level nào gắn lĩnh vực bị cấm không (`BR-ECA-03`).
   - Đếm số lĩnh vực phân biệt. Nếu nhỏ hơn `k` và không có ngoại lệ hợp lệ, đánh dấu ô bị thiếu.
6. In danh sách mọi ngoại lệ đang bật (`BR-ECA-06`).
7. Báo cáo chi tiết ô nào thiếu lĩnh vực nào. Nếu có bất kỳ ô nào thiếu mà không có ngoại lệ, trả về mã thoát exit 1.

## 5. Alternative Flows

- **Engine deprecated**: Bỏ qua các engine đã bị đánh dấu deprecated trong registry.
- **Band bị cấm**: Bỏ qua các band tuổi nằm trong `banned_age_bands` của template (`BR-ECA-04`).
- **Nguồn dữ liệu lỗi**: Nếu không đọc được corpus hoặc file cấu hình, dừng ngay lập tức với exit code ≠ 0 (`BR-ECA-08`).
- **Ngoại lệ hợp lệ**: Ô được miễn trừ nếu có mặt trong danh sách `exceptions` với đầy đủ `reason`, `decided_by`, `date`.

## 6. Business Rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-ECA-01` | Bản đồ tương hợp là nguồn sự thật duy nhất; cấm suy diễn tự do ngoài bản đồ | Tránh việc gán ép cơ chế game vào lĩnh vực không phù hợp |
| `BR-ECA-02` | Mỗi ô (engine × band hợp lệ) có ≥ K lĩnh vực khác nhau; K đọc từ cấu hình (mặc định K = 3) | Đảm bảo trẻ ở mỗi độ tuổi được trải nghiệm nhiều dạng tư duy trên cùng một cơ chế quen thuộc |
| `BR-ECA-03` | Level gắn `skill_codes` thuộc lĩnh vực bị cấm trong bản đồ của engine thì cổng đỏ | Ngăn chặn việc tạo bài tập sai sư phạm (ví dụ dùng game mê cung để dạy ngữ âm C5) |
| `BR-ECA-04` | Band bị `banned_age_bands` không tính vào sàn ô | Cơ chế không phù hợp lứa tuổi thì không ép chỉ tiêu nội dung |
| `BR-ECA-05` | Ngoại lệ phải có đủ `engine`, `band`, `reason`, `decided_by`, `date`; thiếu 1 trường thì đỏ | Mọi sự châm chước phải minh bạch và có trách nhiệm cá nhân |
| `BR-ECA-06` | Cổng in mọi ngoại lệ ở mỗi lần chạy, kể cả khi kiểm tra đạt xanh | Tránh tình trạng ngoại lệ bị lãng quên hoặc âm thầm mở rộng |
| `BR-ECA-07` | Số lượng ngoại lệ không được vượt quá `exception_cap` (tối đa 8 ô trên toàn hệ thống) | Kiểm soát trần chất lượng, ngăn chặn việc lạm dụng ngoại lệ |
| `BR-ECA-08` | Nguồn không đọc được thì dừng với mã thoát ≠ 0; cấm trả về rỗng rồi báo đạt | Ngăn chặn false positive làm lọt lỗi nghiêm trọng |
| `BR-ECA-09` | Báo cáo in danh sách cụ thể ô nào thiếu lĩnh vực nào; cấm chỉ in tỷ lệ phần trăm chung | Cung cấp thông tin hành động trực tiếp cho tác giả nội dung biên tập |

## 7. Data Contract & Schema

```ts
export interface EngineAffinityConfig {
  code: string;
  name: string;
  mechanic: string;
  allowed_competencies: Array<{ comp: string; reason: string }>;
  prohibited_competencies: Array<{ comp: string; reason: string }>;
}

export interface CellException {
  engine: string;
  band: "3-4" | "4-5" | "5-6";
  reason: string;
  decided_by: string;
  date: string;
}

export interface EngineAllocationConfigFile {
  date: string;
  version: string;
  k: number;
  exception_cap: number;
  description: string;
  engines: EngineAffinityConfig[];
  exceptions?: CellException[];
}
```

## 8. Interfaces & Endpoints

Spec này thuộc tầng công cụ kiểm định (Quality & Gates). Không sở hữu endpoint HTTP public nào. Số đo phân bổ phục vụ báo cáo nội bộ và bảo đảm chất lượng build.

## 9. Acceptance Scenarios

```gherkin
Scenario: Ô hợp lệ đạt đủ K lĩnh vực
  Given template GT-001 ở band 3-4 có các level thuộc C1, C2, C3
  When chạy kiểm tra cổng check:engine-allocation với K = 3
  Then ô GT-001::3-4 được tính là đạt

Scenario: Phát hiện level gắn lĩnh vực cấm
  Given template GT-026 (go-nogo) cấm lĩnh vực C2
  When có một level thuộc GT-026 gắn skill C2.GEO.01
  Then cổng báo lỗi vi phạm BR-ECA-03 và trả về mã thoát 1

Scenario: Ngoại lệ hợp lệ và trong trần
  Given ô GT-016::3-4 có ngoại lệ hợp lệ với lý do sư phạm và chữ ký người duyệt
  And tổng số ngoại lệ đang bật là 1 <= 8 (exception_cap)
  When chạy kiểm tra cổng
  Then ô GT-016::3-4 được miễn trừ và thông tin ngoại lệ được in ra màn hình
```

## 10. Boundaries

- **Never**: Không sửa `engine-content-depth.md` ngoài một link tham chiếu.
- **Never**: Không gán ép level vào lĩnh vực bị cấm của engine để chạy theo số lượng.
- **Always**: Mọi ngoại lệ phải có người chịu trách nhiệm và ngày ký duyệt cụ thể.

## 11. Open Questions (Đã chốt)

- `Q158-1`: Xử lý thế nào với level gắn 2 kỹ năng thuộc 2 lĩnh vực khác nhau? -> Chốt: Tính cả 2 lĩnh vực nếu cả 2 đều nằm trong danh sách được phép của engine.
- `Q158-2`: Trần ngoại lệ là bao nhiêu? -> Chốt: 8 ô (~10% tổng số ô hợp lệ).
