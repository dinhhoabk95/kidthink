---
spec: SKILL-VALUE-INVENTORY
title: Kho giá trị kỹ năng — nguồn sự thật cho dãy giá trị ngôn ngữ và nhận thức
area: content
status: draft
mvp: true
phase: P1
reviewed: 2026-09-06
owns:
  - Danh mục kho giá trị kỹ năng (chữ cái, chữ ghép, dấu thanh, vần, âm đầu, từ vựng)
  - Ràng buộc đối chiếu hai chiều giữa dataset và kho giá trị
  - Cổng kiểm tra check:value-inventory
depends_on:
  - TAXONOMY-SERVICE
  - SKILL-DATASET-MODEL
  - CONCEPT-TOPIC-MODEL
---

# Kho giá trị kỹ năng — nguồn sự thật cho dãy giá trị ngôn ngữ và nhận thức

## 1. Objective

Nhiều kỹ năng ngôn ngữ và nhận thức dạy hoặc kiểm tra một **kho giá trị hữu hạn, xác định**:
29 chữ cái tiếng Việt, 11 chữ ghép, 6 dấu thanh, 53 vần, 22 âm đầu, và các bộ từ vựng theo chủ đề.

Trước Task #255, mã nguồn không có nơi nào nói ra 29 chữ cái hay 6 dấu thanh gồm những gì.
Hệ quả: dataset bị co cụm thành cửa sổ trượt trên vài từ vựng trang trí (`spoon cup bed chair...`),
`C5.ALP.04` ("Nhận đủ 29 chữ cái") chỉ có 5 chữ, và toàn bộ strand `C5.TON` có 0 dấu thanh
nhưng cổng phủ vẫn báo xanh.

Spec này xác lập **Kho giá trị kỹ năng (Skill Value Inventory)** là nguồn sự thật duy nhất cho
các dãy giá trị học thuật. Mọi dataset của kỹ năng tương ứng BẮT BUỘC đối chiếu hai chiều với kho.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Người biên soạn | `content_author` | Soạn dataset bám sát kho giá trị, không tự phát minh giá trị ngoài kho |
| Người duyệt | `content_reviewer` | Đối chiếu danh sách giá trị trước khi duyệt |
| Cổng kiểm tra | CI / `check.sh` | Cưỡng chế hai chiều: dataset ⊆ kho và kho ⊆ hợp các dataset |

## 3. Entry points

| File / Lệnh | Actor | Ghi chú |
|---|---|---|
| `packages/content/src/inventories/c5-*.ts` | Dev / Author | Các hằng số kho giá trị |
| `packages/content/src/skills/c5/**` | Author | File định nghĩa kỹ năng và dataset |
| `scripts/check-value-inventory.ts` | CI / Dev | Script cổng kiểm tra hai chiều |
| `pnpm check:value-inventory` | CI / Dev | Lệnh chạy cổng trong Phase 1 |

## 4. Main flow

1. Một kỹ năng thuộc nhóm có kho giá trị khai báo tập item trong dataset của nó.
2. Cổng `check:value-inventory` quét toàn bộ dataset của strand/nhóm kỹ năng.
3. Chiều 1 (Tính hợp lệ): Mọi item trong dataset phải thuộc kho giá trị (`dataset ⊆ inventory`).
4. Chiều 2 (Độ bao phủ): Mọi giá trị trong kho phải xuất hiện trong ít nhất một dataset của nhóm (`inventory ⊆ ⋃ dataset`).
5. Nếu vi phạm, cổng báo đỏ chi tiết: giá trị ngoại lai hoặc giá trị còn thiếu trong kho.

## 5. Alternative flows

| Tình huống | Hành vi |
|---|---|
| Kỹ năng mới ở Phase 1 gieo khung (chưa có level) | Ghi nhận nợ độ phủ vào baseline, đo lường giảm dần qua từng lát cắt |
| Dataset chứa item rác (ví dụ: `cup` trong bài chữ cái) | Cổng đỏ ngay lập tức, chặn commit |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-SVI-01` (khai báo kho giá trị) | Mọi strand/kỹ năng có dãy giá trị học thuật xác định BẮT BUỘC có kho giá trị trong `packages/content/src/inventories/` | Không thể kiểm tra tính trung thực của bài học nếu không có nguồn sự thật cho các giá trị cần dạy |
| `BR-SVI-02` (dataset là tập con của kho) | Dataset của kỹ năng BẮT BUỘC chỉ chứa các giá trị thuộc kho giá trị tương ứng (`dataset ⊆ inventory`). Cấm — NEVER mượn từ vựng từ bộ từ trang trí | Tránh hiện tượng bài dạy chữ cái hay dấu thanh nhưng lại chứa thìa, cốc, giường, ghế |
| `BR-SVI-03` (kho được phủ trọn) | Hợp các dataset trong nhóm kỹ năng BẮT BUỘC phủ đủ 100% các giá trị trong kho tương ứng (`inventory ⊆ ⋃ dataset`) khi hoàn thành lát cắt | Đảm bảo chương trình không bỏ quên chữ cái, dấu thanh hay âm vần nào |
| `BR-SVI-04` (đối chiếu tự động) | Cổng `check:value-inventory` kiểm tra tự động hai chiều, không dựa vào mắt người duyệt | Người duyệt không thể đếm tay từng chữ cái qua hàng trăm file dataset |
| `BR-SVI-05` (nguồn chung cho dạy và chấm) | Kho giá trị là nguồn sự thật cho cả level dạy `GT-000` (`concept.values[]`) và level chấm `GT-*` | Đảm bảo bài dạy và bài kiểm tra thống nhất hoàn toàn về tập giá trị |

## 7. Data & Inventories

Kho giá trị C5 gồm:
- `c5-letter.ts`: 29 chữ cái tiếng Việt (5 nhóm `LET.01..05`)
- `c5-digraph.ts`: 11 chữ ghép (`DGR.01..02`)
- `c5-tone-mark.ts`: 6 dấu thanh (`TMK.01..03`)
- `c5-rime.ts`: 53 vần tiếng Việt (`RIM.01..06`)
- `c5-onset.ts`: 22 âm đầu tiếng Việt (`ONS.01..04`)
- `c5-vocabulary.ts`: 15 bộ từ vựng GDMN 8–12 từ mỗi bộ (`VOC.06..20`)

## 8. Acceptance criteria

1. Ca âm 1: Thêm `id: "cup"` vào dataset `C5.LET.03` → Cổng đỏ (`BR-SVI-02`).
2. Ca âm 2: Thiếu một chữ trong kho (ví dụ xoá `r` khỏi `C5.LET.05`) → Cổng chỉ ra đúng chữ thiếu (`BR-SVI-03`).
3. Số đo hiện trạng: Cổng đo và chỉ ra đúng nợ hiện tại trên corpus C5 (ví dụ `C5.TON` thiếu 6/6 dấu, `C5.ALP.04` thiếu 24/29 chữ).
