# Kế hoạch — Task #201: Soát quyết định vội và luật chống tái phạm

> **Loại task:** sửa nợ + cổng (M).
> **Đích:** mọi con số đang nằm trong plan và spec hoặc **có phép đo**, hoặc **mang nhãn chưa đo**
> kèm task chủ. Không có loại thứ ba.
> **Sửa:** [`#190`](190-engine-spec-first-authoring-spec.md) · [`#192`](192-golive-preschool-pedagogy-plan.md).

## 1. Vì sao có task này

Ba plan viết trong hai ngày (`#190` `#191` `#192`) chứa **cả số đo được lẫn số tôi tự đặt**, và
hai loại đó trông giống hệt nhau trên trang giấy. Đó là cơ chế sinh ra `theme-caps` sai, `126` hiểu
sai, và `RESERVED_MECHANICS` phình — cùng một họ lỗi mà repo đã trả giá vài lần.

Soát lại tìm được **tám** quyết định không có phép đo. Hai trong số đó không phải rủi ro — là **sai
đã xảy ra**, và nếu không sửa thì `#197` sẽ soạn 45 giáo án theo một mô hình mà contract **đã đóng**.

## 2. Bảng soát

| # | Quyết định | Ở đâu | Đo lại ra gì | Hạng |
|---|---|---|---|---|
| **H1** | `126 = 3 độ tuổi × (10 chủ đề × 4 tiết + 2 ôn tập)`, đích phân bố `42/42/42` | `#192` §3 · todo `#197` | **SAI.** `126 = CUR-J42` 42 tuần × 3 tiết/tuần. `lesson-corpus-depth.md` §7.3 đã **bác** mô hình phân vùng `42/42/42` vì `BR-LFM-01` (thư viện dùng chung) và `BR-LFM-02` (trẻ cấm — NEVER bị khoá vào flow đúng tuổi) | **Sai** |
| **H2** | "mỗi tiết 2 biến thể level để chơi lại không lặp" → đích ~700 level | `#192` §3 | **SAI TẦNG.** Biến thể chơi lại có nhà riêng: `game_level_rounds`, trần **6 · 8 · 10** vòng theo band (`BR-RSM-03`, `D-167A` 2026-08-31). Đo corpus: **0/239 level có vòng nào** | **Sai** |
| **H3** | Nâng sàn level mỗi kỹ năng `2 → 4` | `#192` D5 | Chưa đo. Số 4 không suy ra từ đâu — tôi viết "chơi lại trong tuần" mà không có số liệu phiên chơi nào | Vội |
| **H4** | Bảng "10 chủ đề chương trình mầm non" | `#192` §2.3 | Chưa tra nguồn gốc — trong khi chính `#192` D2 cấm chép số văn bản từ trí nhớ. **Mâu thuẫn nội bộ** | Vội |
| **H5** | "Ba pha: gây hứng thú → trọng tâm → luyện tập" | `#192` D7 · `#198` | Chưa tra nguồn. `#198` định dựng cổng cưỡng chế cấu trúc này | Vội |
| **H6** | 27 cặp `limits` "đặt trước" trong 9 phiếu engine | `#190`, mục 15 mỗi phiếu | Tôi tự đặt khi đọc plan. `BR-ESS-02` sẽ **cưỡng chế** chúng lúc khuôn ra đời | Vội, hậu quả cứng |
| **H7** | Ma trận seed mục 13 của 9 phiếu (`≥3` `≥4` …) | `#190` | Tự đặt. Cổng không đối chiếu số này với registry nên hỏng im lặng | Vội |
| **H8** | `batch: legacy-v1` cho 9 engine | `#190` D6 | Từ vựng lô hợp lệ, hậu quả thấp | Ghi nhận |

## 3. Hai cái sai — phân tích

### 3.1 H1 — tôi hợp lý hoá ngược một con số có sẵn

Tôi thấy `126` trong `go-live.json`, rồi dựng phép tính `3 × (10×4+2)` cho khớp, và viết rằng
con số đó "vốn đã là một năm học của ba độ tuổi". Đó không phải phát hiện — đó là **hợp lý hoá
ngược**. Nguồn thật nằm ở `lesson-corpus-depth.md`:

```
Chương trình 42 tuần CUR-J42 là flow dài nhất: 42 × 3 = 126 tiết.
```

Tệ hơn: §7.3 của chính file đó kể rằng bản trước **đã có** bảng chia `42/42/42` theo band, ra 222
buổi, và bảng đó **bị bác** bởi quyết định `D-SI`. Todo `#197` của tôi ghi *"Cân lại phân bố tuổi:
hiện 19/26/36, đích 42/42/42"* — tức dựng lại đúng cái vừa bị gỡ.

Bài học: khi một con số đã có trong repo, việc phải làm là **tra nguồn của nó**, không phải nghĩ
ra một cách diễn giải nghe hợp lý.

### 3.2 H2 — tôi giải đúng vấn đề ở sai tầng

Vấn đề thật: *trẻ chơi lại thì gặp lại màn cũ*. Tôi kết luận "thêm level". Nhưng repo đã có tầng
giải quyết đúng việc đó — **round set**: một `game_level` mang một dãy vòng, trần 6/8/10 theo band,
`BR-RSM-01` bắt mọi vòng dùng cùng `template_code` để trẻ không phải học lại cách chơi.

Đo ra: `game_level_rounds` có bảng, có spec, có trần vừa nâng tháng trước — và **corpus rỗng hoàn
toàn**. Không một seed file nào khai `rounds:`.

Nghĩa là đích thật không phải "×3 số level". Nó là: **lấp tầng vòng đang rỗng**, rồi mới hỏi còn
thiếu bao nhiêu level. Hai đích đó khác nhau về khối lượng rất nhiều — và khác cả về việc ai làm:
thêm vòng cho level đã có là sửa seed, thêm level là soạn mới.

## 4. Quyết định sửa

| # | Quyết định | Vì sao |
|---|---|---|
| S1 | Gỡ mô hình `42/42/42` khỏi `#192` và `#197`. Tuổi là **nhãn đề xuất** (`BR-LFM-03`), cấm — NEVER là khoá phân vùng | Contract đã đóng ở `D-SI`. Dựng lại là mở lại một quyết định đã trả giá |
| S2 | Đích go-live tách hai câu hỏi: **(a)** lấp round set cho level đã có, **(b)** thêm bao nhiêu level. Trả lời (a) trước | (b) chỉ tính đúng sau khi (a) xong. Tính trước là đoán |
| S3 | Cấm — NEVER phát biểu con số đích go-live cho tới khi `#202` đo xong | Con số ~700 hiện tại không có cơ sở. Để nguyên nó trong plan là để một cái bẫy |
| S4 | Mọi số chưa đo mang nhãn `CHƯA ĐO` **trong chính câu chứa nó**, cộng một hàng trong sổ số tạm | Nhãn ở cuối file thì người đọc lướt qua. Nhãn trong câu thì không lướt được |
| S5 | Sổ số tạm là **dữ liệu có cổng**: `docs/tasks/provisional-values.md`, mỗi hàng có `giá trị · nơi dùng · task chủ · hạn` | Cùng khuôn `engine-spec-planned.json`: danh sách phải tự rỗng đi, và cổng canh nó |
| S6 | `#193` (tra chuẩn GDMN) nâng thành **chặn cứng** cho `#194`–`#200`, gồm cả bảng 10 chủ đề và cấu trúc ba pha | H4 và H5 cùng một họ với D2. Không có lý do miễn trừ cho hai cái đó |
| S7 | 27 cặp `limits` của 9 phiếu: giữ nguyên nhưng đánh dấu `CHƯA ĐO`, và luật là **khuôn thắng** | Dev dựng `template.ts` theo nhu cầu thật; phiếu sửa theo, không phải ngược lại. Nếu không, số tôi bịa thành ràng buộc thiết kế |

## 5. Việc

### `#202` Đo tầng vòng và suy đích thật *(chặn mọi việc nội dung của `#192`)*
- Đếm level có round set: hiện **0/239**
- Đo `BR-RSM-12` (trần 5 phút một set) so với trần vòng 6/8/10 → số vòng thực dụng mỗi band
- Suy: một tiết cần bao nhiêu level và bao nhiêu vòng để chơi lại một tuần không lặp
- **Sản phẩm:** con số đích go-live có phép tính kèm theo, thay cho "~700"

### `#203` Sửa `#192` theo S1–S3
- Gỡ `42/42/42`; ghi lại nguồn thật của `126` là `CUR-J42` 42 × 3
- Gỡ "~700"; trỏ sang `#202`
- Tách đợt 5 thành **5a lấp round set** và **5b thêm level**

### `#204` Sổ số tạm + cổng
- `docs/tasks/provisional-values.md` — nạp sẵn tám hàng H1–H8
- Cổng: mọi chuỗi `CHƯA ĐO` trong `docs/` phải có hàng trong sổ; hàng quá hạn làm cổng đỏ
- **Ca âm 1:** thêm `CHƯA ĐO` không đăng ký → đỏ
- **Ca âm 2:** hàng quá hạn → đỏ

### `#205` Đánh dấu số tạm trong 9 phiếu engine
- Mục 15 mỗi phiếu: `limits` ghi rõ `CHƯA ĐO`, luật **khuôn thắng**
- Mục 13: ma trận seed ghi rõ là mục tiêu biên soạn, chưa phải số đo
- `#181`–`#189` thêm bước: dựng `template.ts` theo nhu cầu thật rồi **sửa phiếu theo**

### `#206` Nâng `#193` thành chặn cứng
- Bảng 10 chủ đề và cấu trúc "ba pha" vào phạm vi `#193`, tra nguồn gốc
- `#194`–`#200` cấm — NEVER khởi động trước khi `#193` xong

## 6. Điều kiện nghiệm thu

| # | Điều kiện | Kiểm bằng |
|---|---|---|
| 1 | `#192` không còn chuỗi `42/42/42` và không còn "~700" | grep |
| 2 | Nguồn của `126` ghi đúng là `CUR-J42` 42 tuần × 3 tiết | đọc |
| 3 | Đích go-live có phép tính kèm, không có số trần trụi | review |
| 4 | `provisional-values.md` có đủ 8 hàng, mỗi hàng có task chủ và hạn | cổng `#204` |
| 5 | Mọi `CHƯA ĐO` trong `docs/` có hàng trong sổ | cổng `#204` |
| 6 | 9 phiếu engine: mục 15 mang nhãn và luật khuôn-thắng | grep 9 file |
| 7 | Cổng sổ số tạm có ≥2 ca âm | `pnpm test` |
| 8 | `pnpm check` xanh | — |

## 7. Rủi ro của chính task này

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Nhãn `CHƯA ĐO` rắc khắp nơi thành nhiễu, ai cũng bỏ qua | Cao | Sổ có **hạn**; hàng quá hạn làm cổng đỏ. Danh sách phải tự rỗng đi |
| `#202` đo xong ra con số lớn hơn ~700, phá lịch go-live | Trung bình | Thà biết sớm. Con số sai theo hướng lạc quan là thứ đắt nhất |
| Sửa `#192` làm mất phần đúng của nó | Trung bình | Ba chốt cổng, hai chủ đề thiếu, và neo GDMN đều đo được — giữ nguyên, chỉ gỡ phần suy diễn |
