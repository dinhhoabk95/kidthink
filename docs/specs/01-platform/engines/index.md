<!-- @generated bởi scripts/gen-engine-index.ts — BR-ESS-08. Cấm sửa tay. -->

# Danh mục phiếu engine

30 engine trong registry, 36 phiếu, 6 đặt trước, 0 mồ côi.

Hình dạng phiếu và luật đối chiếu: [`engine-spec-sheet.md`](../engine-spec-sheet.md).
Sàn nội dung mỗi engine: [`engine-content-depth.md`](../../05-content/engine-content-depth.md).

## Engine trong registry

| Mã | Tên | Cơ chế | Band | Band bị cấm | Fallback tap | Lô |
|---|---|---|:--:|---|:--:|---|
| [`GT-001`](GT-001.md) | Chọn một đáp án | `tap-select` | 3–6 | — | Không | mvp |
| [`GT-002`](GT-002.md) | Chọn nhiều đáp án | `tap-select-multi` | 4–6 | 3-4 | Không | mvp |
| [`GT-003`](GT-003.md) | Kéo vào đích | `drag-to-container` | 3–6 | — | Có | mvp |
| [`GT-004`](GT-004.md) | Phân loại vào nhóm | `sort-groups` | 4–6 | 3-4 | Có | mvp |
| [`GT-005`](GT-005.md) | Ghép cặp | `pair-match` | 3–6 | — | Có | mvp |
| [`GT-006`](GT-006.md) | Sắp xếp thứ tự | `sequence-order` | 5–6 | 3-4 · 4-5 | Có | mvp |
| [`GT-007`](GT-007.md) | Tách gộp số | `number-bond` | 3–6 | — | Có | montessori |
| [`GT-008`](GT-008.md) | Kéo vào ô chứa | `drag-to-slot` | 3–6 | — | Có | montessori |
| [`GT-009`](GT-009.md) | Loại trừ theo manh mối | `clue-deduction` | 4–6 | — | Không | montessori |
| [`GT-010`](GT-010.md) | Thay thế biểu tượng | `substitution` | 4–6 | — | Không | montessori |
| [`GT-011`](GT-011.md) | Ma trận chọn hình | `matrix-choice` | 5–6 | — | Không | montessori |
| [`GT-012`](GT-012.md) | Nhìn chớp rồi nhớ lại | `flash-recall` | 3–6 | — | Không | montessori |
| [`GT-013`](GT-013.md) | Tìm đường mê cung | `maze-route` | 4–6 | — | Có | montessori |
| [`GT-014`](GT-014.md) | Cân hai bên | `balance-scale` | 5–6 | — | Có | montessori |
| [`GT-015`](GT-015.md) | Lưới không lặp | `sudoku-mini` | 5–6 | — | Có | montessori |
| [`GT-016`](GT-016.md) | Xoay kim đồng hồ | `clock-hands` | 5–6 | — | Có | montessori |
| [`GT-017`](GT-017.md) | Xếp khối và phối cảnh | `block-stack` | 5–6 | — | Không | montessori |
| [`GT-018`](GT-018.md) | Nghe rồi làm | `listen-respond` | 4–6 | — | Không | legacy-v1 |
| [`GT-019`](GT-019.md) | Xoay và lật mảnh | `rotate-transform` | 4–6 | — | Có | legacy-v1 |
| [`GT-020`](GT-020.md) | Lật thẻ tìm cặp | `memory-flip` | 3–6 | — | Không | legacy-v1 |
| [`GT-021`](GT-021.md) | Hoàn thiện đối xứng | `mirror-complete` | 4–6 | — | Có | legacy-v1 |
| [`GT-022`](GT-022.md) | Tìm vật thể ẩn | `hidden-object` | 4–6 | — | Không | legacy-v1 |
| [`GT-023`](GT-023.md) | Lắp ghép hình thể | `construct` | 4–6 | — | Có | legacy-v1 |
| [`GT-024`](GT-024.md) | Vẽ theo nét | `trace-path` | 5–6 | 3-4 | Không | legacy-v1 |
| [`GT-025`](GT-025.md) | Tìm điểm khác biệt | `spot-difference` | 4–6 | — | Không | taxonomy-gap |
| [`GT-026`](GT-026.md) | Chỉ chạm khi đúng dấu | `go-nogo` | 4–6 | 3-4 | Không | taxonomy-gap |
| [`GT-027`](GT-027.md) | Đổi luật giữa chừng | `rule-switch` | 5–6 | 3-4 | Không | taxonomy-gap |
| [`GT-028`](GT-028.md) | Chạm đếm tích luỹ | `tap-count` | 4–6 | 3-4 | Không | legacy-v1 |
| [`GT-029`](GT-029.md) | Bớt khỏi nhóm | `remove-from-set` | 4–6 | 3-4 | Có | legacy-v1 |
| [`GT-030`](GT-030.md) | Đo bằng đơn vị lặp | `measure-with-unit` | 5–6 | 3-4 · 4-5 | Có | legacy-v1 |

## Engine đặt trước — spec có, `template.ts` chưa

Cột lấy từ frontmatter của chính phiếu, không lấy từ registry: `BR-ESS-15` cho phép phiếu
ra đời trước khuôn, và cổng đối chiếu trường trích chỉ bật khi khuôn có mặt.

| Mã | Tên | Cơ chế đặt trước | Lô | Plan sở hữu |
|---|---|---|---|---|
| [`GT-031`](GT-031.md) | Gộp tiền xu | `coin-compose` | legacy-v1 | [`184-engine-gt-031-coin-compose-plan.md`](../../../tasks/184-engine-gt-031-coin-compose-plan.md) |
| [`GT-032`](GT-032.md) | So lượng chất lỏng | `pour-quantity` | legacy-v1 | [`185-engine-gt-032-pour-quantity-plan.md`](../../../tasks/185-engine-gt-032-pour-quantity-plan.md) |
| [`GT-033`](GT-033.md) | Dệt hoa văn lưới | `weave-grid` | legacy-v1 | [`186-engine-gt-033-weave-grid-plan.md`](../../../tasks/186-engine-gt-033-weave-grid-plan.md) |
| [`GT-034`](GT-034.md) | Gõ theo nhịp | `beat-sequence` | legacy-v1 | [`187-engine-gt-034-beat-sequence-plan.md`](../../../tasks/187-engine-gt-034-beat-sequence-plan.md) |
| [`GT-035`](GT-035.md) | Xếp hàng lệnh | `command-sequence` | legacy-v1 | [`188-engine-gt-035-command-sequence-plan.md`](../../../tasks/188-engine-gt-035-command-sequence-plan.md) |
| [`GT-036`](GT-036.md) | Tự tạo quy luật | `free-create` | legacy-v1 | [`189-engine-gt-036-free-create-plan.md`](../../../tasks/189-engine-gt-036-free-create-plan.md) |
