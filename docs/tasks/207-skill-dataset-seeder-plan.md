# Kế hoạch — Task #207: Bộ dữ liệu của một kỹ năng

> **Spec sở hữu:** [`skill-dataset-model.md`](../specs/05-content/skill-dataset-model.md)
> (`SKILL-DATASET-MODEL`, P1, 15 rule `BR-SDS-*`, 8 scenario).
> **File này cấm — NEVER chứa contract.** Bản `207-skill-dataset-seeder-spec.md` trước đây viết
> nguyên một spec 11 mục trong `docs/tasks/` — sai chỗ theo mục 9 của
> [`CONVENTIONS.md`](../specs/CONVENTIONS.md), và contract nằm ngoài corpus là contract sẽ trôi.
> Nội dung đó đã chuyển vào `docs/specs/` ngày 2026-09-03.

## 1. Outcome

Kho bài tập là lõi sản phẩm; trò chơi chỉ là cách trình bày một kỹ năng. Đường ống hôm nay đi
ngược — sinh theo khuôn game rồi mới gắn nhãn kỹ năng — nên nhãn đúng mà bài không dạy gì.

## 2. Bằng chứng đo được (2026-09-03)

| #   | Đo                                              | Con số                                                      | Đo bằng                     |
| --- | ----------------------------------------------- | ----------------------------------------------------------- | --------------------------- |
| 1   | Level trong `seed-content/corpus/`              | 5.013 trên 71 file                                          | quét JSON                   |
| 2   | Asset `kind: "emoji"`                           | 18.255                                                      | idem                        |
| 3   | Asset `kind: "text"`                            | **0**                                                       | idem                        |
| 4   | Kỹ năng 0 level (`BR-SKQ-06`)                   | 0 trên 408 — cổng hạn ngạch xanh                            | `check:skill-quota`         |
| 5   | Nhánh `text` trong `assetSchema()`              | **đã có** ba nhánh                                          | `shared-fields.ts:16`       |
| 6   | `content_contract` khai lại union asset tại chỗ | 1 — `GT-000/template.ts:15`                                 | quét `discriminatedUnion`   |
| 7   | `db:seed` chạy bao nhiêu cổng                   | **0** — `skipGates = true`, `seed.ts:160` gọi thiếu tham số | đọc `cli/seed-content.ts:9` |

Dòng 3 đặt cạnh dòng 4 là toàn bộ vấn đề: kho đạt 100% phủ kỹ năng và 0% trung thực kỹ năng.

Hai điểm bản cũ ghi sai, đã sửa khi chuyển vào spec:

- Bản cũ nói `assetSchema()` **không** có nhánh chữ và phải mở nhánh đó trước. Nhánh đã có
  (dòng 5). Việc còn lại là nội dung không dùng nó, và một `content_contract` khai lại union
  hai nhánh tại chỗ (dòng 6).
- Bản cũ dẫn số dòng của bộ sinh cũ như bằng chứng vòng thử-lại. Rule `BR-SDS-05` giữ nguyên
  ý đó nhưng không neo vào số dòng dễ trôi.

## 3. Spec đã sửa trong lượt này

| Spec                                                                            | Sửa gì                                                                                                                      |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [`skill-dataset-model.md`](../specs/05-content/skill-dataset-model.md)          | **Mới.** `SkillDataset`, bộ chiếu, bố cục seeder theo trục kỹ năng, hai cổng trung thực                                     |
| [`business-rules.md`](../specs/00-foundation/business-rules.md)                 | Đăng ký prefix `BR-SDS`; đăng ký luôn `BR-SKQ` vốn thiếu trong bản đồ                                                       |
| [`content-seed-authoring.md`](../specs/01-platform/content-seed-authoring.md)   | 8 cổng thành 10; thêm cổng 8 và 9 vào danh sách; nhường bố cục seeder game level                                            |
| [`content-lifecycle.md`](../specs/00-foundation/content-lifecycle.md)           | Số cổng ở mục 4.1                                                                                                           |
| [`level-generator-kit.md`](../specs/01-platform/level-generator-kit.md)         | `BR-LGK-11` — vật đến từ dataset, vốn từ chủ đề tụt xuống lớp áo; ứng viên trượt thì dừng                                   |
| [`game-level-model.md`](../specs/05-content/game-level-model.md)                | Ranh giới nguồn vật; thêm mục checklist; câu hỏi mở 3                                                                       |
| [`game-template-contract.md`](../specs/01-platform/game-template-contract.md)   | `BR-GTC-11` — asset ba nhánh, dùng chung `assetSchema()`; ví dụ `GT-004` sửa theo code                                      |
| [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md) | Bảng `skill_datasets`, `content_objective_map`; cột `skill_dataset_id`, `projection_ref`; `BR-SCT-08` từ vựng `entity_type` |
| [`data-model-overview.md`](../specs/01-platform/data-model-overview.md)         | Hai bảng mới vào mục 7.1 và 7.2                                                                                             |
| [`engine-content-depth.md`](../specs/05-content/engine-content-depth.md)        | Hạn ngạch đo độ phủ, không đo độ trung thực                                                                                 |
| [`content-theme-registry.md`](../specs/05-content/content-theme-registry.md)    | Chủ đề là lớp áo, không phải nguồn vật                                                                                      |
| [`index.md`](../specs/index.md) · [`roadmap.md`](../specs/roadmap.md)           | Đăng ký spec mới; chèn bước P1.11a trước lô soạn level                                                                      |

## 4. Chưa làm — cần người quyết

Bốn câu ở mục 11 của [`skill-dataset-model.md`](../specs/05-content/skill-dataset-model.md).
Câu 1 (bỏ hay giữ 5.013 level corpus) chặn khối lượng của mọi lô soạn sau đó, nên nó là câu
phải trả lời trước khi mở task thi công.

## 5. Thứ tự thi công đề xuất

1. `assetSchema()` dùng chung ở `GT-000` (một chỗ, đóng `BR-GTC-11`).
2. `skipGates` mặc định `false`, `seed.ts` truyền đủ tham số (đóng `BR-SDS-13`).
3. Bỏ `catch {}` ở `corpus/index.ts` (đóng `BR-SDS-08`).
4. Migration: `skill_datasets`, `content_objective_map`, hai cột trên `game_levels`, enum `entity_type`.
5. Bộ chiếu nhóm A trước — 12 khuôn, cấu trúc đơn giản nhất — kèm hai cổng trung thực và ca âm.
6. Dataset cho một kỹ năng mẫu (`C1.NREC.02`), đọc từng level chiếu ra.
