---
spec: CURRICULUM-MODEL
title: Mô hình chương trình — ràng buộc sư phạm
area: content
status: implemented
mvp: true
phase: P3
reviewed: 2026-08-08
owns:
  - Ràng buộc sư phạm khi dựng chương trình
depends_on:
  - LESSON-MODEL
  - TAXONOMY-SERVICE
---

# Mô hình chương trình — ràng buộc sư phạm

## 1. Objective

> **Đổi 2026-08-29 (`D-SI`).** Curriculum nay là **flow** lắp từ thư viện giáo án master, và
> tuổi là tín hiệu đề xuất chứ không phải điều kiện ghi danh. Mô hình đầy đủ ở
> [`lesson-flow-model.md`](lesson-flow-model.md). Ràng buộc sư phạm của file này không đổi —
> và vì bỏ khoá tuổi, thứ tự prerequisite ở `BR-CRM-01` trở thành ràng buộc sư phạm **duy
> nhất** còn lại, nên nó càng không được nới.

Curriculum là **thứ tự có chủ đích**. Thứ tự sai làm trẻ gặp nội dung chưa đủ nền, thất bại
liên tục, rồi bỏ.

[`curriculum-builder.md`](../06-admin/curriculum-builder.md) nói **công cụ**; file này nói **luật sư phạm** mà công cụ phải ép.

## 2. Actors

Người soạn chương trình · người duyệt.

## 3. Entry points

`06-admin/curriculum-builder.md` · chỉ báo cân bằng §7.2 ở đó.

## 4. Main flow

Không có. Spec ràng buộc.

## 5. Alternative flows

Không có.

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-CRM-01` | Skill xuất hiện **sau** mọi prerequisite của nó trong lộ trình | Dạy so sánh trước khi dạy đếm là sai thứ tự |
| `BR-CRM-02` | Mỗi tuần chạm **2–4 competency**, không 1, không cả 6 | Một competency mỗi tuần quá hẹp; cả sáu quá loãng |
| `BR-CRM-03` | Skill mới xuất hiện phải được **ôn lại** trong 2–3 tuần sau (đo trên **skill**) | Học một lần rồi bỏ là quên |
| `BR-CRM-04` | Độ khó trung bình **tăng dần**, cho phép chững, không giảm mạnh | Tạo độ dốc học tập tự nhiên giúp trẻ tự tin tiến bộ mà không bị hẫng hoặc nản lòng |
| `BR-CRM-05` | Mỗi tuần có **≥1 hoạt động ngoài màn hình** | Cân bằng giữa tương tác màn hình và vận động thực tế theo định hướng giáo dục toàn diện |
| `BR-CRM-06` | Tuần đầu **dễ có chủ ý** | Tuần đầu quyết định trẻ có quay lại không |
| `BR-CRM-07` | Cấm — **NEVER quá 40%** item thuộc một competency trên toàn chương trình | Chương trình lệch là lỗi sư phạm khó thấy bằng mắt |
| `BR-CRM-08` | Chương trình theo tuổi (`program_type = 'age_based'`) phải phủ **cả 6 competency** | Phát triển đồng đều toàn bộ 6 năng lực tư duy toán học cốt lõi cho trẻ. **Từ 2026-08-29 (`D-SI`)**, `age_based` là **nhãn đề xuất** chứ không phải khoá ghi danh — luật phủ 6 competency vẫn giữ nguyên, xem [`lesson-flow-model.md`](lesson-flow-model.md) `BR-LFM-03` |
| `BR-CRM-09` | Cấm — **NEVER lặp cùng một item trong 4 tuần liên tiếp** (đo trên **item**) | Duy trì sự mới mẻ và hứng thú học tập cho trẻ mầm non |
| `BR-CRM-10` | Nêu rõ **mục tiêu của mỗi tuần** bằng một câu cho người lớn | Người lớn cần biết tuần này học gì |
| `BR-CRM-11` | Cấm — **NEVER giới thiệu skill mới trong 3 tuần cuối** của một chương trình | 3 tuần cuối dành cho ôn tập và củng cố toàn diện, đảm bảo `BR-CRM-03` không vi phạm vì thiếu tuần phía sau (`D-LY`) |

## 7. Data

### 7.1 Cấu trúc tuần chuẩn

| Buổi | Nội dung |
|---|---|
| 1 | Giới thiệu skill mới — lesson đầy đủ |
| 2 | Luyện tập — 2–3 game level |
| 3 | Ôn skill tuần trước + hoạt động ngoài màn hình |

Ba buổi mỗi tuần là mặc định; chương trình khác đặt được `sessions_per_week` khác.

### 7.2 Sáu chỉ báo cân bằng

Xem `06-admin/curriculum-builder.md` §7.2. Chúng là biểu hiện công cụ của các rule ở §6.

### 7.3 Chương trình MVP

| Chương trình | Tuần | Đối tượng |
|---|---:|---|
| Bé 3 tuổi | 8 | 3–4 |
| Bé 4 tuổi | 8 | 4–5 |
| Bé 5 tuổi | 8 | 5–6 |
| Bé 6 tuổi | 8 | 6 |
| Hành trình 42 tuần | 42 (phát hành 12 tuần đầu) | 4–6 |

Năm chương trình. Điểm cắt nếu thiếu nguồn lực: giữ **một** chương trình theo tuổi —
[`mvp-scope.md`](../00-foundation/mvp-scope.md) §5.

## 8. API contract

Không sở hữu route.

## 9. Acceptance criteria

```gherkin
Scenario: BR-CRM-01 — thứ tự prerequisite đúng
  When kiểm mọi chương trình published
  Then không skill nào xuất hiện trước prerequisite của nó

Scenario: BR-CRM-02 — mỗi tuần 2-4 competency
  When kiểm mọi tuần của mọi chương trình published
  Then mỗi tuần chạm từ 2 tới 4 competency

Scenario: BR-CRM-03 — có ôn lại
  Given một skill xuất hiện lần đầu ở tuần N
  Then skill đó xuất hiện lại trong tuần N+1 tới N+3

Scenario: BR-CRM-07 — không lệch competency
  When tính phân bố competency của một chương trình
  Then không competency nào vượt 40% tổng item

Scenario: BR-CRM-08 — chương trình theo tuổi phủ đủ 6
  When kiểm chương trình theo tuổi
  Then cả 6 competency đều có ít nhất một item

Scenario: BR-CRM-06 — tuần đầu dễ
  When tính độ khó trung bình tuần 1
  Then thấp hơn độ khó trung bình toàn chương trình

Scenario: BR-CRM-09 — không lặp trong 4 tuần
  When kiểm mọi cửa sổ 4 tuần liên tiếp
  Then không item nào xuất hiện hai lần

Scenario: BR-CRM-10 — mỗi tuần có mục tiêu
  When mở chương trình
  Then mỗi tuần có một câu mô tả mục tiêu cho người lớn

Scenario: BR-CRM-11 — không giới thiệu skill mới trong 3 tuần cuối
  Given một chương trình có duration_weeks = W
  Then không skill mới nào xuất hiện ở các tuần W-2, W-1, W
```

## 10. Boundaries

**Always**
- Kiểm thứ tự prerequisite.
- Ôn lại skill mới trong 2–3 tuần.
- ≥1 hoạt động ngoài màn hình mỗi tuần.

**Ask first**
- Đổi cấu trúc tuần chuẩn.
- Đổi ngưỡng cân bằng competency.

**Never**
- Skill trước prerequisite.
- Một competency quá 40%.
- Lặp item trong 4 tuần liên tiếp.
- Tuần đầu khó.
- Skill mới ở 3 tuần cuối.

## 11. Open questions

| # | Câu hỏi | Chặn phase | Đề xuất chốt | Chủ |
|---|---|---|---|---|
| 1 | 42 tuần cần ~126 buổi. Với ≥60 lesson thì mỗi lesson dùng lại 2 lần — có chấp nhận được không? | P3 | Đóng theo `D-LA` & `D-LU`: Thư viện lesson thiết kế đủ số lượng theo nhu cầu curriculum thực tế | người quyết |
| 2 | Chu kỳ ôn lại 2–3 tuần dựa trên nguồn nào? Đường cong quên có tài liệu nhưng chưa đối chiếu cho tuổi 3–6 | P3 | Đóng: Giữ quy tắc ôn lại 2-3 tuần cho MVP; đo lường tỉ lệ hoàn thành thực tế để tinh chỉnh ở P4 | Nội dung |
