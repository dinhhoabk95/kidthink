# Kế hoạch — Task #205: Gieo game level cho 178 kỹ năng mới

> **Tiền đề:** kho năng lực đã mở từ 41 → 71 strand, 230 → 408 kỹ năng (task này,
> phần đã làm xong). 178 kỹ năng mới hiện **0 level**, đang nằm trong trần bậc
> thang `BR-SKQ-06`. Kế hoạch này nói cách hạ trần đó về 0.

## 1. Số phải gieo

`BR-SKQ-02` + `BR-SKQ-03`: kỹ năng C1 cần ≥20 level trải ≥4 khuôn; C2–C6 cần ≥10
level trải ≥2 khuôn. `BR-SKQ-04` chặn trần 5 level cho mỗi cặp (kỹ năng, khuôn).

| Năng lực | Kỹ năng mới | Level/kỹ năng | Level phải gieo |
|---|---:|---:|---:|
| C1 Tư duy toán học | 11 | 20 | **220** |
| C2 Tư duy không gian | 12 | 10 | **120** |
| C3 Tư duy logic | 12 | 10 | **120** |
| C4 Tư duy khám phá | 70 | 10 | **700** |
| C5 Tư duy ngôn ngữ | 63 | 10 | **630** |
| C6 Tư duy điều hành | 10 | 10 | **100** |
| | **178** | | **1.890** |

Corpus hiện có 4.059 level. Sau khi đóng hết: **5.949**, khớp trần
`level-allocation.json` đã sinh lại (`target_total_levels: 5180` cho phần hạn
ngạch, phần dư là level đã có vượt sàn).

## 2. Chốt chặn kỹ thuật — đo được, không suy đoán

### 2.1 Asset chỉ có `emoji` và `image`. **Không có kiểu chữ.**

`packages/game-engine/src/contracts/shared-fields.ts`:

```ts
export const assetSchema = () =>
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
    z.object({ kind: z.literal("image"), path: z.string() }),
  ]);
```

`EmojiRef` còn được đối chiếu với sổ emoji. Chữ cái tiếng Việt không phải emoji.

**Hệ quả:** mọi kỹ năng cần hiển thị **chữ** — chữ cái, vần viết, tiếng, dấu
thanh trên chữ — hiện **không gieo được** nếu không làm một trong hai:

| Đường | Việc | Chi phí |
|---|---|---|
| **(a) Thêm `kind: "text"`** | Một nhánh mới trong `assetSchema`, `asset-resolver`, và lớp vẽ của engine | Một lần, chạm 36 hợp đồng khuôn nhưng chỉ mở rộng — không phá level cũ |
| (b) Ảnh hoá từng chữ | 29 chữ cái × hoa/thường + ~150 vần + tiếng → **hàng trăm file ảnh** | Lặp lại mỗi lần đổi phông, không tìm kiếm được, không đọc màn hình được |

**Đề xuất: (a).** Đường (b) là nợ vĩnh viễn.

### 2.2 Audio đi qua `prompt_audio_ref`, chưa có file nào

`promptFields()` có `prompt_audio_ref` (tuỳ chọn) và `GT-018` có
`audio_prompt.text`. Kho audio tiếng Việt hiện **0 file**. Trẻ 3–6 không đọc
được, nên mọi kỹ năng nghe không có audio là màn chơi câm.

### 2.3 Hai khuôn từng nợ thì đã có

`GT-026 go-nogo` và `GT-027 rule-switch` đã tồn tại — nợ engine của `C6.INH` và
`C6.FLX` ghi trong `c6-executive-function.md` **đã trả**. Cập nhật lại ghi chú
đó khi gieo tới C6.

## 3. Chia đợt theo cái gieo được ngay

### Đợt A — 154 kỹ năng, **1.650 level**, không cần đổi engine

Gieo được bằng emoji + audio, dùng khuôn đã có:

| Nhóm | Kỹ năng | Level | Khuôn dùng được |
|---|---:|---:|---|
| C1.ORD · C1.DAT | 11 | 220 | `GT-006` `GT-001` `GT-003` `GT-008` `GT-028` |
| C2.SOL · C2.GRD | 12 | 120 | `GT-017` `GT-023` `GT-019` `GT-013` `GT-035` |
| C3.SET · C3.ALG | 12 | 120 | `GT-004` `GT-009` `GT-015` `GT-035` `GT-013` |
| C4 — cảm quan · khoa học · xã hội | 70 | 700 | `GT-001` `GT-004` `GT-005` `GT-006` `GT-022` `GT-025` `GT-034` `GT-032` `GT-014` |
| C5 — nghe, nói, truyện, tiền tập viết | 39 | 390 | `GT-018` `GT-005` `GT-006` `GT-020` `GT-024` |
| C6.PER · C6.INI | 10 | 100 | `GT-026` `GT-027` `GT-035` `GT-012` |

### Đợt B — 24 kỹ năng, **240 level**, chặn cứng bởi §2.1

`C5.ALP.01`–`.08` · `C5.PRN.01`–`.05` · `C5.WRD.01`–`.06` · `C5.RHY.04`–`.07` ·
`C5.TON.05`. Tất cả cần chữ hiển thị được. **Cấm — NEVER gieo bằng ảnh rời** như
đường (b).

Điều kiện vào Đợt B: `kind: "text"` đã có trong `assetSchema` và có ca âm.

## 4. Dữ liệu phải sát thực tế trẻ — bốn ràng buộc

| # | Ràng buộc | Vì sao |
|---|---|---|
| 1 | Mỗi kỹ năng trải **≥2 chủ đề** khác nhau trong 16 theme | `BR-ECD-05`. Mười màn cùng bối cảnh thì trẻ chán trước khi kỹ năng hình thành |
| 2 | Ưu tiên 4 theme chưa level nào dùng: `job` `homeland` `festival` `weather` | Chính C4.SOC · C4.HOM · C4.MAT là chỗ tiêu thụ đúng của chúng |
| 3 | Vật liệu trong `C4.EXP` · `C4.TAC` phải là **đồ có thật trong nhà Việt** | Chìm nổi thì lá cây và hòn sỏi, không phải "rubber duck". Nhám mịn thì rổ tre và mặt gương |
| 4 | `C4.TAC` (xúc giác) và phần `C5.WRT` cần vật thật → `asset_type = worksheet` + `parent_guide` | Canvas Cấm — NEVER làm được xúc giác. Ghi thẳng ra còn hơn giả vờ có |

## 5. Riêng trục tiếng Việt — bốn quy tắc soạn

`C5` không port được từ khung tiếng Anh. Tiếng Việt là ngôn ngữ đơn lập có
thanh điệu: đơn vị là **tiếng**, cấu trúc là **âm đầu + vần + thanh**.

1. **Đơn vị là tiếng, không phải phoneme.** `C5.PHO.02` đếm *tiếng* trong từ
   ("con **bướm**" = 2 tiếng), Cấm — NEVER đếm âm vị kiểu Anh.
2. **Vần là một khối.** `C5.RHY` dạy vần trọn (`an` `ang` `oa` `ia`), không tách
   vần thành từng chữ cái. Thứ tự: vần một âm → vần có âm cuối → vần có âm đệm →
   vần có nguyên âm đôi. Đúng thứ tự sách Tiếng Việt lớp 1.
3. **Thanh điệu là một trục riêng.** Sáu thanh: ngang · huyền · sắc · hỏi · ngã ·
   nặng. `C5.TON.06` (đổi thanh đổi nghĩa) phải dùng cặp tiếng thật:
   *ma – mà – má – mả – mã – mạ*.
4. **Chữ ghép phải dạy như một đơn vị.** `ch` `gh` `gi` `kh` `ng` `ngh` `nh` `ph`
   `qu` `th` `tr` là một âm, Cấm — NEVER tách thành hai chữ cái rời.

## 6. Thứ tự làm

```
B1  Thêm kind: "text" vào assetSchema + asset-resolver + lớp vẽ   (mở Đợt B)
B2  Quyết định audio: thu người thật hay TTS                       (mở toàn C5)
B3  Đợt A — 1.650 level, hạ trần bậc thang 178 -> 24
B4  Đợt B — 240 level, hạ trần 24 -> 0
B5  Lấp round set: hiện 0/4.059 level có vòng nào
```

**Mỗi lô gieo xong phải hạ trần trong `skill-coverage-ratchet.json`.** Trần chỉ
giảm — đó là điều duy nhất giữ cho kho mở không biến thành kho rỗng.

## 7. Nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `max_skills_without_levels` về **0** | `check:skill-quota` |
| 2 | Mọi kỹ năng mới đạt hạn ngạch và đa dạng khuôn | `check:skill-quota` |
| 3 | 0 mã kỹ năng chết | `check:taxonomy-refs`, ≥2 ca âm |
| 4 | ≥10 chủ đề có mặt; 4 theme trống được dùng | `check:theme-registry` |
| 5 | `check:go-live` vẫn READY | `check:go-live` |
| 6 | Kỹ năng cần vật thật gắn `worksheet` + `parent_guide` | review người |
| 7 | Trục tiếng Việt qua review người bản ngữ theo §5 | review người |
