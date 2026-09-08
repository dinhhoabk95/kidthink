# Task #261 Plan: Miền hành vi của engine (Behavior Domain) cho 37 khuôn mầm non

> **Mục tiêu**: Cưỡng chế mô hình **miền hành vi** vừa được viết vào corpus spec — 37 phiếu
> engine đã có mục 17 và 18, nhưng chưa có cổng nào đọc chúng.
> Câu một dòng: *phiếu engine đã tả được đứa trẻ đang làm gì; giờ cần cổng giữ cho nó đúng.*

---

## 1. Bối cảnh

### 1.1 Việc đã xong ở lượt spec (2026-09-07)

| File | Thay đổi |
|---|---|
| [`engine-behavior-domain.md`](../specs/01-platform/engine-behavior-domain.md) | **Mới** — từ vựng 6 miền, 3 giá trị ràng buộc nhịp, 13 rule `BR-EBD-*`, bảng phân miền 37 engine, số đo phủ miền theo band |
| [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md) | Khuôn phiếu 16 → **18 mục**; thêm `BR-ESS-16` (mục 17 bắt buộc) và `BR-ESS-17` (mục 18 bắt buộc) |
| [`engines/TEMPLATE.md`](../specs/01-platform/engines/TEMPLATE.md) | Khuôn mẫu có mục 17 và 18 |
| `engines/GT-000.md` … `GT-036.md` | **37 phiếu** có mục 17 (miền hành vi, câu quan sát, điều kiện phát triển tiên quyết, bậc biểu diễn) và mục 18 (trục biến thể, độ mở, quyền của trẻ) |
| [`CONVENTIONS.md`](../specs/CONVENTIONS.md) | Sửa hai chỗ còn ghi phiếu engine là "khuôn rút gọn mười mục" |

`check:engine-specs` chạy sau thay đổi: **37 mã, 37 spec, 0 mồ côi, 0 vi phạm**.

### 1.2 Số đo làm nên mô hình

Đo trực tiếp trên `src/templates/GT-*/template.ts` ngày 2026-09-07, không đọc qua `index.md`:

| Band | Engine khả dụng | Số miền hành vi |
|---|---:|:--:|
| `3-4` | 8 | **2 / 6** — chỉ `chi-dinh` và `van-chuyen` |
| `4-5` | 22 | **5 / 6** — thiếu `kien-tao` |
| `5-6` | 37 | **6 / 6** |

Phân bố engine theo miền: `chi-dinh` 16 · `van-chuyen` 9 · `sap-dat` 7 · `lan-net` 2 ·
`dieu-chinh` 2 · `kien-tao` **1**.

Hai con số đáng chú ý nhất, và cả hai đều là **câu hỏi mở**, cấm — NEVER tự sửa trong task này:

1. Trẻ 3–4 tuổi không gặp miền `lan-net` nào, dù 3–4 là lứa của mọi hoạt động tiền tập viết.
   `GT-024` chỉ nhận `5-6`, mà bảng điều kiện phát triển ở mục 17 của chính phiếu đó **không có
   dòng nào đòi `5-6`** trừ trường hợp nét chữ cái.
2. Miền `kien-tao` có đúng một engine (`GT-036`), và engine đó cấm cả hai band nhỏ vì **thang
   chấm** cần đủ `min_repetitions`, không vì hành vi.

### 1.3 Vì sao cần cổng

Mục 17 và 18 hiện là văn bản. Không có cổng thì ba thứ trôi ngay trong tháng đầu: miền khai
lệch với cơ chế, ô trục biến thể quay về chữ "nhiều chủ đề", và số miền của một band tụt mà
không ai biết — đúng ba kiểu trôi mà `BR-ESS-05` đã phải chặn cho ma trận seed.

---

## 2. Giả định của lượt spec

Ghi ra để lượt sau đọc được lý do, không phải để hỏi lại.

| # | Giả định | Cái bị loại và vì sao |
|---|---|---|
| A1 | "Behavior domain driven" hiểu là lấy **hành vi quan sát được của trẻ** làm trục mô hình, dựng trên **6 cử chỉ đã đóng** của `engine-play-language.md` | Không dựng từ vựng cử chỉ mới. Corpus đã có bốn từ vựng tag song song; thêm cái thứ năm là lặp lại đúng khoản nợ đó |
| A2 | Miền hành vi khai trong `packages/game-engine/config/engine-behavior-domain.json` | Không thêm trường vào `GameTemplate`: `BR-GTC-08` coi mọi đổi contract đã publish là breaking change, và miền hành vi chưa cần tới runtime. Ghi thành câu hỏi 4 của spec |
| A3 | Không thêm `BR-E<nnn>-*` mới cho từng engine | Cưỡng chế nằm ở `BR-EBD-*` (cắt ngang) và `BR-ESS-16`/`-17` (hình dạng phiếu). Thêm 37 rule riêng là 37 rule không chặn thêm gì |
| A4 | Không đổi `age_min` hay `banned_age_bands` của engine nào | Hạ band là đổi hợp đồng đã đo. Hai chỗ đáng hạ (`GT-024`, `GT-036`) đi vào câu hỏi mở kèm bằng chứng |
| A5 | Bậc thang miền theo band chốt bằng **số đo hiện tại** (2 · 5 · 6), không chốt bằng mục tiêu | Bậc thang đặt cao hơn thực tế là cổng đỏ ngày đầu, và cổng đỏ sẵn thì người ta tắt nó |

---

## 3. Thi công

### 3.1 Cấu hình — `packages/game-engine/config/engine-behavior-domain.json`

```
{
  "ratchet": { "3-4": 2, "4-5": 5, "5-6": 6 },
  "domains": ["chi-dinh","van-chuyen","sap-dat","dieu-chinh","lan-net","kien-tao"],
  "nhip": ["tu-do","nhip-de","thoi-gian-that"],
  "engines": { "GT-000": { "mien": "chi-dinh", "mien_phu": null, "nhip": "tu-do" }, … }
}
```

Nguồn của 37 hàng: mục 7.2 của [`engine-behavior-domain.md`](../specs/01-platform/engine-behavior-domain.md).
Zod schema kiểm tệp trước khi dùng, hỏng tệp thì exit ≠ 0, cấm — NEVER trả rỗng rồi báo đạt.

### 3.2 Cổng — `packages/game-engine/scripts/check-engine-behavior.ts`

Kiểm, theo đúng thứ tự này:

1. **Từ vựng** — `mien`, `mien_phu`, `nhip` thuộc danh sách đóng (`BR-EBD-01`).
2. **Một miền chủ đạo** — `mien` là chuỗi đơn, `mien_phu` là chuỗi đơn hoặc `null` (`BR-EBD-02`).
3. **Phiếu khớp cấu hình** — mục 17 của `GT-<nnn>.md` khai đúng miền mà cấu hình khai (`BR-ESS-16`).
4. **Câu quan sát** — mục 17 có bảng ≥1 hàng; từ chối chuỗi kỹ thuật trong danh sách cấm
   (`chọn đáp án đúng`, `hoàn thành lượt`, `trả về true`) (`BR-EBD-05`).
5. **Điều kiện phát triển tiên quyết** — mục 17 có bảng 4 dòng vận động · chú ý · bộ nhớ làm
   việc · ngôn ngữ (`BR-EBD-06`).
6. **Bậc biểu diễn** — mục 17 khai bậc cho từng band engine nhận (`BR-EBD-12`).
7. **Trục biến thể** — mục 18 có ≥3 hàng, mỗi hàng ≥2 giá trị ngăn bằng `·`; từ chối ô chứa
   "đa dạng", "nhiều chủ đề", "phong phú" (`BR-EBD-10`).
8. **Độ mở và quyền của trẻ** — mục 18 khai `do_mo` ∈ {đóng, bán mở, mở} và có dòng quyền của
   trẻ; `đóng` phải kèm chữ "lý do cơ chế" (`BR-EBD-08`, `BR-EBD-09`).
9. **Nhịp và band** — engine `thoi-gian-that` cấm band `3-4`; engine `nhip-de` phải khai thời
   gian hiện đề theo band (`BR-EBD-11`).
10. **Sàn miền theo band** — đọc `age_min`/`age_max`/`banned_age_bands` **từ registry**, tính
    số miền mỗi band, so với `ratchet`. Tụt là đỏ (`BR-EBD-04`).

Báo cáo in số miền của từng band **ở mọi lần chạy**, kể cả khi xanh (`BR-EBD-04` mục Boundaries).

### 3.3 Ca âm — `packages/game-engine/tests/gates/engine-behavior.test.ts`

Tối thiểu 6, theo `BR-EBD-13`: miền ngoài từ vựng · hai miền chủ đạo · thiếu câu quan sát ·
câu quan sát viết bằng từ kỹ thuật · chỉ hai trục biến thể · `do_mo` bỏ trống · band tụt dưới
bậc. Mỗi ca **phải** làm cổng đỏ; test chỉ khẳng định "cổng chạy" là test vô nghĩa.

### 3.4 Nối vào chuỗi cổng

- `packages/game-engine/package.json`: thêm `"check:engine-behavior"`.
- `scripts/check.sh`: chạy ngay sau `check:engine-specs`.
- Chạy bằng binary Node **v24.15.0**; `node` trên PATH là v20 và `pnpm` gãy ở đó.

### 3.5 Cột miền trong index sinh tự động

`scripts/gen-engine-index.ts` thêm cột **Miền** vào bảng `engines/index.md`, đọc từ cấu hình.
`index.md` là file sinh (`BR-ESS-08`), cấm — NEVER sửa tay.

---

## 4. Không làm trong task này

- Đổi `age_min`, `age_max` hay `banned_age_bands` của bất kỳ engine nào (A4).
- Thêm trường `behavior_domain` vào `GameTemplate` (A2).
- Thêm trục tag `behavior_domain` cho nội dung — `BR-EBD-03` cấm.
- Soạn level mới để lấp miền còn thiếu ở band nhỏ; đó là việc của nội dung sau khi hai câu hỏi
  mở được trả lời.

---

## 5. Nghiệm thu

1. `check:engine-behavior` xanh trên 37 engine và in đúng ba con số `2 · 5 · 6`.
2. Bảy ca âm đỏ đúng chỗ mong đợi.
3. `check:engine-specs` vẫn xanh (37 mã, 37 spec, 0 mồ côi).
4. `engines/index.md` sinh lại có cột Miền, 37 hàng.
5. Sửa `mien` của một engine trong cấu hình mà không sửa phiếu → cổng đỏ, in cả hai giá trị.
