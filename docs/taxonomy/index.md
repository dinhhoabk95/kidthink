# Skill Taxonomy Registry

> **Sổ quản lý bộ xương dữ liệu của TiniMath.**
> Đây là nguồn sự thật cho tầng L1–L3 (Competency → Strand → Skill).
> Tầng L4 (Learning Objective) và L5 (Lesson) tham chiếu về skill code ở đây.
> Contract kỹ thuật: [`../SPEC.md`](../SPEC.md) §2 (Content Architecture) + §3 (Data Model).
> Spec sở hữu Phase A: [`../specs/platform/taxonomy-service/SPEC.md`](../specs/platform/taxonomy-service/SPEC.md).

## Cách dùng file này

1. Skill code là **bất biến**. Đặt rồi không đổi — LO, lesson, `mastery_state`,
   telemetry đều khoá theo nó.
2. Thêm skill mới → thêm dòng vào file competency tương ứng, tăng số cuối. Không
   chèn giữa, không tái sử dụng số của skill đã xoá.
3. Đổi `status` khi tiến độ thay đổi. `status` trong file này là nguồn sự thật
   cho tiến độ nội dung; DB chỉ chứa skill đã đạt `🟢 seeded` trở lên.
4. Đổi competency của một skill đã có lesson gắn vào → **cần duyệt** (SPEC §9 Ask first).

## Quy ước mã

```
C1.CNT.03
│  │   └── số thứ tự trong strand (2 chữ số, bất biến)
│  └────── mã strand (3–5 chữ, chữ in)
└───────── competency C1..C6
```

## Bảng trạng thái

| Ký hiệu | Nghĩa | Điều kiện |
|---|---|---|
| ⬜ | `planned` | Đã xác định tên, chưa biên soạn gì |
| 🟡 | `drafted` | Có tên + tuổi + độ khó + prerequisite |
| 🟢 | `seeded` | Có ≥ 3 Learning Objective, đã vào DB |
| ✅ | `covered` | Có ≥ 1 `game_level` + ≥ 1 `lesson` published |

## Tổng quan tiến độ

| ID | Competency | Strand | Skill đã đặt tên | Mục tiêu | Còn thiếu | Game type hiện có |
|----|---|---:|---:|---:|---:|---:|
| [C1](c1-mathematical-thinking.md) | Mathematical Thinking | 10 | 99 | ~120 | 21 | 22 |
| [C2](c2-spatial-thinking.md) | Spatial Thinking | 8 | 44 | ~80 | 36 | 11 |
| [C3](c3-logical-thinking.md) | Logical Thinking | 8 | 30 | ~70 | 40 | 20 |
| [C4](c4-observation-thinking.md) | Observation Thinking | 4 | 16 | ~60 | 44 | 3 |
| [C5](c5-language-thinking.md) | Language Thinking | 5 | 21 | ~60 | 39 | 1 |
| [C6](c6-executive-function.md) | Executive Function | 6 | 20 | ~50 | 30 | 3 |
| | **Tổng** | **41** | **230** | **350–500** | **120–270** | **60** |

Khoảng trống lớn nhất: **C4 Observation** và **C5 Language** — cũng chính là hai
competency gần như không có game type nào hiện tại. Đây là ưu tiên nội dung số 1.

## Ba trục metadata — từ vựng chuẩn

Mọi asset phải gắn đủ ba trục (SPEC §2.3). Chỉ dùng giá trị trong bảng dưới.
Thêm giá trị mới → cần duyệt.

### Trục 1 — `what` (nội dung học)

| Code | Nghĩa |
|---|---|
| `number` | số, chữ số, lượng |
| `quantity` | nhiều/ít, ước lượng |
| `arithmetic` | cộng, trừ, tách, gộp |
| `geometry` | hình 2D/3D |
| `space` | vị trí, hướng, lộ trình |
| `pattern` | quy luật, chuỗi |
| `colour` | màu sắc |
| `size` | kích thước, dài, cao |
| `weight` | nặng nhẹ, cân bằng |
| `capacity` | dung tích, thể tích |
| `time` | thời gian, đồng hồ, thứ tự ngày |
| `money` | tiền |
| `category` | nhóm, chức năng, thuộc về |
| `vocabulary` | từ vựng chủ đề |
| `story` | truyện, trình tự sự kiện |
| `sound` | âm thanh, nhịp |
| `texture` | kết cấu |
| `rule` | luật, tiêu chí |

### Trục 2 — `thinking` (quá trình tư duy)

| Code | Nghĩa |
|---|---|
| `observe` | quan sát, chú ý chi tiết |
| `compare` | so sánh hai hay nhiều đối tượng |
| `sort` | phân loại theo tiêu chí |
| `match` | ghép cặp tương ứng |
| `count` | đếm, đối chiếu số lượng |
| `sequence` | sắp xếp theo thứ tự |
| `infer` | suy ra từ dữ kiện |
| `predict` | đoán kết quả |
| `deduce` | loại trừ để đi tới đáp án |
| `solve` | giải quyết vấn đề nhiều bước |
| `verify` | kiểm tra, tự sửa |
| `create` | tự tạo ra mẫu/quy luật mới |
| `plan` | lập kế hoạch trước khi làm |
| `recall` | ghi nhớ và gọi lại |
| `inhibit` | kìm phản xạ sai |
| `shift` | chuyển tiêu chí, đổi luật |
| `describe` | diễn đạt bằng lời |
| `listen` | nghe hiểu và hành động |

### Trục 3 — `mechanic` (cơ chế chơi)

| Code | Nghĩa | Template base |
|---|---|---|
| `drag-to-container` | kéo vật vào rổ/nhóm | `DragDropSession` |
| `drag-to-slot` | kéo vào ô đúng vị trí | `DragDropSession` |
| `drag-to-order` | kéo sắp xếp thứ tự | `DragDropSession` |
| `pair-match` | nối/ghép hai bên | `DragDropSession` |
| `tap-select` | chạm chọn một hoặc nhiều | `TapSelectSession` |
| `tap-count` | chạm đếm từng vật | `TapSelectSession` |
| `flash-recall` | nhìn nhanh rồi chọn lại | `TapSelectSession` |
| `memory-flip` | úp/mở thẻ tìm cặp | `TapSelectSession` |
| `maze-route` | tìm đường qua mê cung | `mazeSystem` |
| `construct` | lắp ghép, xây khối | `DragDropSession` |
| `rotate-transform` | xoay, lật, đối xứng | `transformSystem` |
| `balance` | cân bằng hai bên | `balanceSystem` |
| `trace-path` | vẽ theo nét | `trailSystem` |
| `sequence-arrange` | xếp tranh/sự kiện theo trình tự | `DragDropSession` |
| `listen-respond` | nghe rồi chạm/kéo | `audioController` |
| `free-create` | tự do tạo mẫu | `freeCreateSystem` |

## Bất biến bắt buộc

Property test trong `packages/taxonomy` phải khẳng định:

- Mỗi skill thuộc **đúng một** strand. Mỗi strand thuộc **đúng một** competency.
- `skill_prerequisites` là **DAG** — không chu trình ở mọi trạng thái seed.
- `age_min ≤ age_max`, cả hai ∈ [3, 6].
- `difficulty` ∈ [1, 5].
- Mỗi skill 🟢 trở lên có **≥ 1** `thinking` code.
- Prerequisite của một skill phải có `difficulty` **≤** skill đó.
- Skill code khớp regex `^C[1-6]\.[A-Z]{2,5}\.\d{2}$`.

## Files

| File | Competency |
|---|---|
| [`c1-mathematical-thinking.md`](c1-mathematical-thinking.md) | C1 — Mathematical Thinking |
| [`c2-spatial-thinking.md`](c2-spatial-thinking.md) | C2 — Spatial Thinking |
| [`c3-logical-thinking.md`](c3-logical-thinking.md) | C3 — Logical Thinking |
| [`c4-observation-thinking.md`](c4-observation-thinking.md) | C4 — Observation Thinking |
| [`c5-language-thinking.md`](c5-language-thinking.md) | C5 — Language Thinking |
| [`c6-executive-function.md`](c6-executive-function.md) | C6 — Executive Function |
| [`game-type-migration.md`](game-type-migration.md) | Ánh xạ 60 game type D→C |
