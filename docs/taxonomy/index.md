# Skill Taxonomy Registry

> **Sổ quản lý bộ xương dữ liệu của MindKid.**
> Đây là nguồn sự thật cho tầng L1–L3 (Competency → Strand → Skill).
> Tầng L4 (Learning Objective) và L5 (Lesson) tham chiếu về skill code ở đây.
> Contract kỹ thuật: [`../SPEC.md`](../SPEC.md) §2 (Content Architecture) + §3 (Data Model).
> Spec sở hữu Phase A: [`../specs/01-platform/taxonomy-service.md`](../specs/01-platform/taxonomy-service.md).

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

## Bậc trong strand

| Ký hiệu | Mã | Nhãn | Nghĩa |
|---|---|---|---|
| `b` | `basic` | Làm quen | Một thuộc tính, có gợi ý, độ khó 1–2 |
| `c` | `core` | Thành thạo | Chuẩn của band, làm độc lập, độ khó 3 |
| `a` | `advanced` | Thử thách | Nhiều thuộc tính hoặc nhiều bước, độ khó 4–5 |

> **Cột `Status` cũ đã bị gỡ.** Nó viết tay và đã chết: seeder ghi cứng
> `"seeded"` cho mọi hàng nên DB không bao giờ thấy giá trị khác, còn markdown
> thì ghi 96 kỹ năng là `chờ` trong khi cả 96 đều đã có ≥10 game level thật.
> Trạng thái nội dung suy từ corpus (`check:skill-quota`), không viết tay.

## Band tuổi

| Mã | Nhãn | Tuổi |
|---|---|---|
| `3-4` | Mẫu giáo bé | 3–4 |
| `4-5` | Mẫu giáo nhỡ | 4–5 |
| `5-6` | Mẫu giáo lớn | 5–6 |
| `6-7` | Sẵn sàng vào lớp 1 | 6–7 |

## Tổng quan tiến độ

| ID | Competency | Tên | Strand | Skill | Có nội dung | Chưa có level |
|----|---|---|---:|---:|---:|---:|
| [C1](c1-mathematical-thinking.md) | Mathematical Thinking | Tư duy toán học | 12 | 110 | 99 | 11 |
| [C2](c2-spatial-thinking.md) | Spatial Thinking | Tư duy không gian | 10 | 56 | 44 | 12 |
| [C3](c3-logical-thinking.md) | Logical Thinking | Tư duy logic | 10 | 42 | 30 | 12 |
| [C4](c4-observation-thinking.md) | Discovery Thinking | Tư duy khám phá | 16 | 86 | 16 | 70 |
| [C5](c5-language-thinking.md) | Language Thinking | Tư duy ngôn ngữ | 15 | 84 | 21 | 63 |
| [C6](c6-executive-function.md) | Executive Function | Tư duy điều hành | 8 | 30 | 20 | 10 |
| | **Tổng** | | **71** | **408** | **230** | **178** |

Cột **Chưa có level** là nợ nội dung có trần: `BR-SKQ-06` giữ nó ở
`packages/content-build/src/gates/skill-coverage-ratchet.json` và trần **chỉ
được giảm**. Ưu tiên soạn theo thứ tự C5 → C4 → C2 → C3 → C6 → C1.

**C4 đổi phạm vi** từ *Observation* sang *Discovery*: nhận thêm khám phá khoa
học và khám phá xã hội — hai trụ còn lại của lĩnh vực Nhận thức trong Chương
trình GDMN, trước đây không strand nào nhận. Hai strand `C4.VIS` và `C4.MEM`
**đóng băng**: chú ý chọn lọc và trí nhớ làm việc là cấu trúc chức năng điều
hành (Diamond 2013), nên kỹ năng mới thuộc hai nhóm đó đi vào `C6.ATT` và
`C6.WM`. Tám kỹ năng cũ ở nguyên chỗ — luật bất biến mã.

**C5 mở toàn bộ trục tiền đọc viết tiếng Việt**: âm vị và âm tiết, vần, thanh
điệu, chữ cái, khái niệm chữ viết, sách, tiền tập viết, đọc tiếng và từ. Tiếng
Việt là ngôn ngữ đơn lập có thanh điệu — đơn vị là **tiếng**, cấu trúc là **âm
đầu + vần + thanh**. Cấm — NEVER bê khung phoneme tiếng Anh sang.

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
- `age_min ≤ age_max`, cả hai ∈ **[3, 7]** — `7` là band tiền tiểu học.
- `difficulty` ∈ [1, 5].
- Mỗi skill có **≥ 1** `thinking` code và **≥ 3** Learning Objective.
- Prerequisite của một skill phải có `difficulty` **≤** skill đó.
- Skill code khớp regex `^C[1-6]\.[A-Z]{2,5}\.\d{2}$`.

## Files

| File | Competency |
|---|---|
| [`c1-mathematical-thinking.md`](c1-mathematical-thinking.md) | C1 — Mathematical Thinking |
| [`c2-spatial-thinking.md`](c2-spatial-thinking.md) | C2 — Spatial Thinking |
| [`c3-logical-thinking.md`](c3-logical-thinking.md) | C3 — Logical Thinking |
| [`c4-observation-thinking.md`](c4-observation-thinking.md) | C4 — Discovery Thinking |
| [`c5-language-thinking.md`](c5-language-thinking.md) | C5 — Language Thinking |
| [`c6-executive-function.md`](c6-executive-function.md) | C6 — Executive Function |
| [`moet-alignment.md`](moet-alignment.md) | Đối chiếu Chương trình GDMN và Bộ chuẩn 5 tuổi |
| [`game-type-migration.md`](game-type-migration.md) | Ánh xạ 60 game type D→C |
