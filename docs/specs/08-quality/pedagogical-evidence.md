---
spec: PEDAGOGICAL-EVIDENCE
title: Tiêu chuẩn bằng chứng sư phạm và quy trình playtest với trẻ
area: quality
status: approved
mvp: true
phase: P1
reviewed: 2026-08-16
owns:
  - Khung bằng chứng sư phạm và quy trình kiểm thử với trẻ
  - Tiêu chuẩn thu thập dữ liệu an toàn khi playtest
depends_on:
  - DESIGN-SYSTEM-CONTRACT
  - CHILD-DATA-COMPLIANCE
---

# Tiêu chuẩn bằng chứng sư phạm và quy trình playtest với trẻ

## 1. Objective

Quy định khung bằng chứng sư phạm (pedagogical evidence) và quy trình playtest an toàn với trẻ mầm non (3–6 tuổi). Biến mục tiêu "rèn luyện, khai phá tư duy cho trẻ mầm non" thành tiêu chuẩn đo lường có thể kiểm chứng trong sản phẩm, đồng thời đảm bảo quyền riêng tư và an toàn tuyệt đối cho trẻ.

Tách bạch rõ ràng giữa bằng chứng tương tác sản phẩm (task comprehension, strategy exploration, scaffolding reduction, mastery transition) với tuyên bố hiệu quả lâm sàng hoặc chẩn đoán IQ. Mọi thử nghiệm với trẻ phải tuân thủ nghiêm ngặt nguyên tắc giảm thiểu dữ liệu, không ghi hình/âm thanh và quyền dừng tức thì.

Spec này sở hữu khung tiêu chuẩn bằng chứng và protocol vận hành playtest; các ràng buộc bảo vệ dữ liệu trẻ em chi tiết được quy định tại [`child-data-compliance.md`](../00-foundation/child-data-compliance.md).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người giám hộ (`Guardian`) | Xác thực tài khoản User | Cấp quyền đồng ý văn bản (consent), rút quyền bất cứ lúc nào, yêu cầu xoá dữ liệu playtest |
| Trẻ mầm non (`Child` 3–6 tuổi) | Ngữ cảnh hồ sơ trẻ (không tài khoản) | Thể hiện assent tự nguyện, trải nghiệm game, dừng phiên khi mệt hoặc không muốn tiếp tục |
| Quản trị viên / Nghiên cứu (`Manager`) | `super_admin` hoặc `content_reviewer` | Thiết kế kịch bản playtest trung tính, điều phối phiên, đánh giá báo cáo bằng chứng sư phạm |

## 3. Entry points

| Tuyến / Ngữ cảnh | Actor | Ghi chú |
|---|---|---|
| Điều phối phiên playtest tại chỗ / từ xa | `Manager`, `Guardian`, `Child` | Khởi tạo phiên kèm cấu hình consent/assent và giới hạn thời lượng |
| Đánh giá báo cáo bằng chứng sư phạm | `Manager` | Xem xét các chỉ số phân tầng theo độ tuổi, competency và template |
| Audit tuân thủ dữ liệu playtest | `Manager` | Kiểm tra tính ẩn danh, cấm PII và thời hạn lưu trữ dữ liệu |

## 4. Main flow

1. **Chuẩn bị kịch bản và phân tầng mẫu**: Manager chuẩn bị bộ level từ 6 game template (`D1`–`D6`) tương ứng 6 nhóm năng lực (`C1`–`C6`), phân tầng theo 3 nhóm tuổi (3–4, 4–5, 5–6 tuổi) với tối thiểu 8 trẻ/nhóm/template. Kịch bản quan sát sử dụng chỉ dẫn trung tính, không mớm ý.
2. **Cấp quyền đồng ý (Guardian consent)**: Người giám hộ đọc văn bản thông tin minh bạch về mục đích phiên chơi, loại dữ liệu thu thập (chỉ telemetry định lượng), và ký/xác nhận đồng ý tham gia.
3. **Lấy sự đồng thuận của trẻ (Child assent)**: Người điều phối giải thích bằng ngôn ngữ dễ hiểu và hình ảnh trực quan, hỏi trẻ có muốn chơi trò chơi cùng không; chỉ bắt đầu khi trẻ vui vẻ đồng ý.
4. **Khởi tạo phiên ghi nhận tối thiểu**: Hệ thống khởi tạo phiên chơi với cờ `is_playtest = true`, gắn `child_uuid` đã băm một chiều, áp đặt trần thời lượng nghiêm ngặt (15 phút cho band 3–4, 20 phút cho band 5–6) và ngắt mọi kết nối thu thập PII/media.
5. **Thực hiện phiên chơi và quan sát**: Trẻ tương tác với trò chơi; hệ thống ghi nhận các sự kiện tương tác (lần chạm, thời gian phản hồi, lượt scaffolding kích hoạt, phương án thử lại); người điều phối ghi nhận phản ứng hành vi không xâm lấn.
6. **Đánh giá bằng chứng và hoàn tất**: Tính toán 4 chỉ số sư phạm cốt lõi; lưu trữ báo cáo đã tổng hợp ẩn danh; tự động lên lịch xoá telemetry sau 90 ngày hoặc xoá ngay khi người giám hộ rút consent.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Trẻ mệt mỏi, khó chịu, từ chối | Trẻ nói muốn dừng, khóc, xao nhãng kéo dài hoặc có dấu hiệu căng thẳng | Áp dụng Stop Criteria ngay lập tức: dừng phiên chơi, khen ngợi động viên trẻ, tuyệt đối không nài ép tiếp tục |
| Người giám hộ rút quyền đồng ý | Người giám hộ yêu cầu dừng hoặc huỷ kết quả giữa chừng / sau phiên | Dừng phiên ngay lập tức; xoá vĩnh viễn toàn bộ telemetry thô gắn với phiên chơi trong vòng 24 giờ |
| Nghi ngờ rò rỉ dữ liệu định danh | Phát hiện trường PII, tên thật hoặc ghi chú cá nhân lọt vào telemetry | Khoá phiên audit, kích hoạt incident escalation, lập tức purge bản ghi vi phạm và rà soát validator |
| Dữ liệu phiên không đạt ngưỡng tối thiểu | Phiên chơi kết thúc sớm do lỗi mạng hoặc trẻ dừng trước 1 lượt hoàn chỉnh | Đánh dấu phiên là `insufficient_data`, loại khỏi tập mẫu đánh giá năng lực, không tính vào tỷ lệ hoàn thành |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-PED-01` | **Claim ladder & boundary**: Mọi tuyên bố hiệu quả sư phạm chỉ được giới hạn ở mức "hỗ trợ luyện tập, rèn luyện và làm quen năng lực tư duy". Cấm tuyệt đối mọi tuyên bố tăng chỉ số IQ, phát triển trí thông minh vượt bậc, chẩn đoán y khoa, can thiệp trị liệu hoặc quan hệ nhân quả lâm sàng | Tránh tiếp thị gây hiểu lầm, bảo vệ kỳ vọng của người giám hộ và giữ vững tính trung thực khoa học của sản phẩm |
| `BR-PED-02` | **100% Guardian consent & Child assent**: Phiên playtest với trẻ bắt buộc phải có sự đồng ý tường minh từ người giám hộ và sự đồng thuận tự nguyện của trẻ trước khi bắt đầu | Tôn trọng quyền tự quyết của trẻ và tuân thủ đạo đức nghiên cứu người dùng vị thành niên |
| `BR-PED-03` | **Zero PII & Data minimization**: Cấm thu thập hình ảnh khuôn mặt, video, bản ghi âm giọng nói, họ tên thật, địa chỉ, trường lớp hay văn bản tự do trong telemetry playtest; chỉ thu thập telemetry gameplay định lượng gắn với `child_uuid` ẩn danh | Tuân thủ Nghị định 13/2023/NĐ-CP, Luật 91/2025/QH15 và bảo đảm an toàn dữ liệu trẻ em |
| `BR-PED-04` | **Stop criteria & quyền dừng vô điều kiện**: Phiên playtest phải dừng ngay lập tức khi trẻ thể hiện bất kỳ dấu hiệu căng thẳng, mệt mỏi, mất tập trung hoặc bày tỏ muốn dừng; cấm mọi hình thức thuyết phục hay ép buộc trẻ tiếp tục | Đặt sức khoẻ tâm lý và trải nghiệm cảm xúc của trẻ lên trên mục tiêu thu thập dữ liệu |
| `BR-PED-05` | **Stratified sampling**: Bằng chứng sư phạm phải được đánh giá phân tầng theo 3 nhóm tuổi (3–4, 4–5, 5–6), 6 nhóm năng lực (`C1`–`C6`) và game template; cỡ mẫu tối thiểu N ≥ 8 trẻ/nhóm tuổi cho mỗi template; cấm dùng chỉ số trung bình gộp để che giấu thất bại ở nhóm tuổi nhỏ | Sự phát triển nhận thức và vận động tinh thay đổi lớn theo từng năm tuổi ở giai đoạn mầm non |
| `BR-PED-06` | **Session limits & data retention**: Thời lượng phiên playtest không vượt quá 15 phút (band 3–4) và 20 phút (band 5–6); dữ liệu telemetry thô của phiên playtest có thời hạn lưu trữ tối đa 90 ngày và phải được xoá hoàn toàn trong vòng 24 giờ khi có yêu cầu từ người giám hộ | Phù hợp với khoảng chú ý sinh lý của trẻ mầm non và hạn chế rủi ro tích tụ dữ liệu thừa |

## 7. Data

### 7.1 Bộ chỉ số bằng chứng sư phạm (Pedagogical Evidence Metrics)

| Chỉ số | Định nghĩa & Mẫu số | Ngưỡng đạt yêu cầu | Phân tầng bắt buộc |
|---|---|---|---|
| **Task Comprehension Rate** | Tỷ lệ trẻ hiểu mục tiêu nhiệm vụ và hoàn thành lượt chơi đầu tiên mà không cần can thiệp hướng dẫn trực tiếp từ người lớn (`lượt_hiểu / tổng_lượt_thử_đầu`) | **≥ 85%** | Theo band tuổi (3–4, 4–5, 5–6) và game template |
| **Independent Transition Rate** | Tỷ lệ trẻ chuyển đổi thành công từ hoàn thành có trợ giúp (scaffolding mức L1/L2/L3) sang hoàn thành độc lập ở lượt chơi tiếp theo cùng độ khó (`lượt_độc_lập_sau_trợ_giúp / tổng_lượt_nhận_trợ_giúp`) | **≥ 75%** | Theo nhóm năng lực (`C1`–`C6`) và band tuổi |
| **Strategy Exploration Rate** | Tỷ lệ trẻ chủ động thử nghiệm phương án khác sau phản hồi retry (không thực hiện chuỗi thao tác bấm loạn / rage tapping) (`lượt_đổi_chiến_lược / tổng_lượt_retry`) | **≥ 70%** | Theo game template và độ khó |
| **Usability Barrier Rate** | Tỷ lệ lượt chơi thất bại do rào cản thao tác giao diện (touch target quá nhỏ, audio khó nghe, độ trễ phản hồi > 100ms) (`lượt_lỗi_UI / tổng_lượt_chơi`) | **≤ 5%** | Theo thiết bị và band tuổi |

### 7.2 Thang bậc tuyên bố bằng chứng (Claim Ladder)

| Bậc | Mức tuyên bố | Điều kiện bằng chứng | Được phép dùng trong sản phẩm? |
|---|---|---|:--:|
| **Level 0 (Cấm)** | Tăng IQ, phát triển não bộ vượt trội, can thiệp y khoa/trị liệu | Không áp dụng trong sản phẩm | Cấm |
| **Level 1 (Cơ bản)** | Giới thiệu và làm quen với các khái niệm tư duy nền tảng | Toàn bộ 230 skill có bài học và game level được kiểm duyệt | Cho phép |
| **Level 2 (Thực nghiệm)** | Hỗ trợ trẻ luyện tập và củng cố thao tác tư duy qua trò chơi tương tác | Đạt đủ 4 ngưỡng §7.1 trên cỡ mẫu phân tầng N ≥ 8 trẻ/nhóm tuổi | Cho phép |
| **Level 3 (Chuyển giao)** | Trẻ có khả năng áp dụng năng lực tư duy sang tình huống/trò chơi mới cùng dạng | Hoàn thành lộ trình 42 tuần có đo lường retention sau 14 ngày | Cho phép |

## 8. API contract

Hệ thống không cung cấp HTTP endpoint công khai để ghi nhận playtest tự do. Logic kiểm thực quy trình playtest và đánh giá bằng chứng sư phạm được đóng gói qua TypeScript contract trong `@kidthink/shared`:

```ts
export interface PlaytestSessionConfig {
  hasGuardianConsent: boolean;
  hasChildAssent: boolean;
  maxDurationMinutes: number;
  ageBand: "3-4" | "4-5" | "5-6";
  collectsPii: boolean;
  templateCode?: string;
  competencyCode?: string;
}

export interface PlaytestValidationResult {
  valid: boolean;
  reason?:
    | "MISSING_GUARDIAN_CONSENT"
    | "MISSING_CHILD_ASSENT"
    | "PII_COLLECTION_FORBIDDEN"
    | "SESSION_DURATION_EXCEEDED"
    | "INVALID_AGE_BAND";
}

export interface PedagogicalMetricsInput {
  totalFirstAttempts: number;
  comprehendedFirstAttempts: number;
  totalAssistedAttempts: number;
  independentTransitions: number;
  totalRetries: number;
  strategyExplorations: number;
  totalSessions: number;
  uiBarrierFailures: number;
}

export interface EvidenceEvaluationResult {
  passed: boolean;
  taskComprehensionRate: number;
  independentTransitionRate: number;
  strategyExplorationRate: number;
  usabilityBarrierRate: number;
  failures: string[];
}
```

## 9. Acceptance criteria

```gherkin
Scenario: BR-PED-01 — từ chối các claim y khoa và IQ
  When người dùng hoặc hệ thống kiểm tra tuyên bố "Tăng 15 điểm IQ cho trẻ"
  Then hệ thống từ chối và phân loại là vi phạm claim ladder Level 0

Scenario: BR-PED-02 — bắt buộc 100% guardian consent và child assent
  Given cấu hình phiên playtest có hasGuardianConsent = false hoặc hasChildAssent = false
  When hàm validatePlaytestSession được gọi
  Then kết quả trả về valid = false kèm mã lỗi tương ứng

Scenario: BR-PED-03 — cấm thu thập bất kỳ PII nào trong phiên playtest
  Given cấu hình phiên playtest có collectsPii = true
  When hàm validatePlaytestSession được gọi
  Then kết quả trả về valid = false và reason = "PII_COLLECTION_FORBIDDEN"

Scenario: BR-PED-04 — áp dụng stop criteria khi trẻ có dấu hiệu dừng
  Given trẻ thể hiện mệt mỏi hoặc đòi dừng phiên chơi
  When người điều phối kích hoạt stop criteria
  Then phiên kết thúc lập tức mà không ghi nhận trạng thái phạt hay ép buộc

Scenario: BR-PED-05 — phân tầng mẫu thử nghiệm tối thiểu 8 trẻ mỗi nhóm tuổi
  Given tập dữ liệu đánh giá game template
  When kiểm tra số lượng mẫu từng nhóm tuổi 3–4, 4–5, 5–6
  Then mỗi nhóm phải có ít nhất 8 trẻ tham gia hợp lệ

Scenario: BR-PED-06 — kiểm soát trần thời lượng phiên theo band tuổi
  Given trẻ ở band tuổi "3-4" với thời lượng phiên yêu cầu là 25 phút
  When hàm validatePlaytestSession được gọi
  Then kết quả trả về valid = false và reason = "SESSION_DURATION_EXCEEDED"
```

## 10. Boundaries

**Always**
- Yêu cầu chữ ký/xác nhận đồng ý từ người giám hộ và assent của trẻ trước khi bắt đầu phiên chơi.
- Băm ẩn danh `child_uuid` bằng thuật toán một chiều trước khi lưu trữ telemetry.
- Dừng phiên ngay lập tức khi trẻ mệt mỏi, khó chịu hoặc muốn dừng.
- Phân tầng kết quả theo nhóm tuổi và template trước khi kết luận bằng chứng sư phạm.

**Ask first**
- Khi muốn mở rộng quy mô khảo sát trên nhóm trẻ có nhu cầu giáo dục đặc biệt.
- Khi muốn điều chỉnh ngưỡng metric sau các nghiên cứu chuyên sâu dài hạn.

**Never**
- Thu thập hình ảnh, video, bản ghi âm giọng nói hay thông tin định danh cá nhân của trẻ.
- Đưa ra tuyên bố chẩn đoán y khoa, điều trị rối loạn phát triển hay tăng chỉ số IQ.
- Nài ép hoặc thuyết phục trẻ tiếp tục chơi khi trẻ đã thể hiện muốn dừng.
- Gộp chung kết quả mọi lứa tuổi để che giấu tỷ lệ thất bại ở trẻ nhỏ 3–4 tuổi.

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | Cần công cụ tự động nào để người giám hộ rút consent từ xa qua giao diện web? | Portal người giám hộ P2 | P2 | người quyết |
| 2 | Quy chuẩn ghi nhận video quan sát khi có chuyên gia tâm lý đi kèm (lab test có bảo trợ)? | Đợt nghiên cứu mở rộng | Ngoài MVP | Nội dung |
