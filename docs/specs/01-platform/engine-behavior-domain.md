---
spec: ENGINE-BEHAVIOR-DOMAIN
title: Miền hành vi của engine — sáu miền, bằng chứng quan sát, trục biến thể
area: platform
status: draft
mvp: false
phase: P4
reviewed: 2026-09-07
owns:
  - Từ vựng đóng sáu miền hành vi của engine
  - Luật mỗi engine khai đúng một miền chủ đạo
  - Sàn miền hành vi trên mỗi band tuổi
  - Trục biến thể, độ mở và quyền quyết định của trẻ trên một engine
  - Hình dạng câu quan sát được của một lượt chơi
depends_on:
  - ENGINE-PLAY-LANGUAGE
  - ENGINE-SPEC-SHEET
  - GAME-TEMPLATE-CONTRACT
  - PRESCHOOL-AGE-BANDS
  - CONTENT-TAGGING
---

# Miền hành vi của engine — sáu miền, bằng chứng quan sát, trục biến thể

## 1. Objective

Ba mươi bảy phiếu engine hôm nay mô tả **cơ chế**: `tap-select`, `drag-to-container`,
`sort-groups`. Không phiếu nào mô tả **hành vi** — thứ một cô giáo mầm non nhìn thấy và ghi
lại được khi đứng cạnh đứa trẻ đang chơi. Hai thứ đó không giống nhau: `tap-select` là một
sự kiện con trỏ, còn *"con chỉ vào quả táo đỏ sau khi nghe hết câu hỏi"* là một quan sát phát
triển.

Giáo dục mầm non tiên tiến — Montessori, Reggio Emilia, HighScope, EYFS — lấy **hành vi quan
sát được** làm đơn vị của cả việc dạy lẫn việc đánh giá. Chương trình GDMN Việt Nam cũng vậy:
120 chỉ số của Thông tư 23/2010 đều viết dưới dạng hành vi ("thực hiện được chỉ dẫn 2–3 hành
động liên tiếp"), không dưới dạng cơ chế phần mềm.

Spec này sở hữu **miền hành vi**: một cách nhóm 37 engine theo *thứ đứa trẻ làm bằng tay, mắt
và tai*, chứ không theo *thứ chương trình nhận được*. Nó dùng để đo ba câu hỏi mà trục
`mechanic` không trả lời được:

1. Trẻ ở band này được làm **bao nhiêu kiểu hành vi** khác nhau?
2. Có bao nhiêu engine cho trẻ **tạo ra** thứ gì đó, so với số engine chỉ hỏi *"cái nào đúng"*?
3. Một engine có **bao nhiêu cách** trình bày cùng một hành vi, và trẻ được **tự quyết** cái gì?

Số đo đầu tiên, ngày 2026-09-07, trả lời cả ba và không có câu nào đẹp: **16 trên 37** engine
thuộc miền *chỉ định* — trẻ chỉ vào một vật trong tập có sẵn; **1 trên 37** thuộc miền *kiến
tạo*; và trẻ **3–4 tuổi chỉ gặp 2 trong 6 miền**. Mục 7.3 là bảng đo đó.

Spec này **cấm — NEVER** trở thành trục tag thứ tư của nội dung. Miền hành vi là thuộc tính
của **engine**, suy ra từ sáu cử chỉ đã đóng của
[`engine-play-language.md`](engine-play-language.md); người soạn nội dung không gắn thêm thẻ
nào (`BR-EBD-03`).

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Chuyên gia sư phạm | — | Chốt miền chủ đạo của một engine, viết câu quan sát, ký ngoại lệ sàn miền |
| Dev | — | Khai miền trong `engine-behavior-domain.json`, viết mục 17 và 18 của phiếu engine |
| Người soạn nội dung | `content_reviewer` | Đọc mục 18 để biết soạn bao nhiêu biến thể và biến thể nào đã có |
| Cổng `check:engine-behavior` | — | Đối chiếu phiếu với cấu hình, đo phủ miền theo band, ép sàn bậc thang |

## 3. Entry points

| Nơi | Actor | Ghi chú |
|---|---|---|
| `packages/game-engine/config/engine-behavior-domain.json` | Dev | Nguồn sự thật của miền chủ đạo, miền phụ và ràng buộc nhịp cho từng mã `GT` |
| `docs/specs/01-platform/engines/GT-<nnn>.md` mục 17 | mọi actor | Miền hành vi của engine, câu quan sát, điều kiện phát triển tiên quyết |
| `docs/specs/01-platform/engines/GT-<nnn>.md` mục 18 | Người soạn nội dung | Trục biến thể, độ mở, quyền của trẻ |
| `pnpm --filter @mindkid/game-engine check:engine-behavior` | Cổng | Chạy cùng `check:engine-specs` |
| [`engine-play-language.md`](engine-play-language.md) | Dev | Sáu cử chỉ — nguồn của miền, cấm mở rộng ở đây |

## 4. Main flow

1. Dev hoặc chuyên gia sư phạm xác định **cử chỉ chủ đạo** của engine theo sáu cử chỉ của
   [`engine-play-language.md`](engine-play-language.md).
2. Tra bảng 7.1 để ra **miền chủ đạo**; khai vào `engine-behavior-domain.json` kèm miền phụ
   (tối đa một) và `rang_buoc_nhip`.
3. Viết mục 17 của phiếu engine: câu quan sát được, điều kiện phát triển tiên quyết, bậc biểu
   diễn theo band.
4. Viết mục 18: ≥3 trục biến thể có giá trị cụ thể, độ mở, quyền quyết định của trẻ.
5. Chạy `check:engine-behavior`. Cổng đối chiếu phiếu với cấu hình, đo phủ miền từng band, so
   với bậc thang hiện hành.
6. Bậc thang chỉ đi lên: đóng thêm engine ở một band làm số miền tăng thì bậc mới được nâng
   trong cùng PR.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Engine khai miền ngoài sáu giá trị | Muốn đặt tên mới cho hành vi | Cổng đỏ. Từ vựng đóng — thêm giá trị là quyết định của spec này, không của một phiếu |
| Engine khai hai miền chủ đạo | Cơ chế lai | Cổng đỏ. Chọn một, cái còn lại thành miền phụ (`BR-EBD-02`) |
| Phiếu có mục 17 mà cấu hình chưa có mã | Phiếu đặt trước (`BR-ESS-15`) | Cổng xanh. Miền của phiếu đặt trước là **cam kết**, đối chiếu bật khi khuôn xuất hiện |
| Số miền của một band tụt xuống dưới bậc | Bỏ `deprecated` một engine đang gánh miền duy nhất | Cổng đỏ, nêu miền nào mất và engine nào từng gánh |
| Engine `đóng` về độ mở | Cơ chế chỉ có một đáp án đúng | Hợp lệ, nhưng phải nêu **lý do cơ chế** ở mục 18, không được bỏ trống (`BR-EBD-08`) |
| Engine ràng buộc thời gian thật muốn nhận band `4-5` | `go-nogo`, `flash-recall`, `beat-sequence` | Phải khai cửa sổ dung sai và một lối chơi **không tính giờ** cho band đó (`BR-EBD-11`) |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-EBD-01` (miền suy từ cử chỉ) | Mỗi miền định nghĩa bằng bộ ba: **cử chỉ chủ đạo** của [`engine-play-language.md`](engine-play-language.md) × **đối tượng tác động** × **ràng buộc nhịp**. Cấm — NEVER đặt cử chỉ mới ở đây | Corpus đã có bốn từ vựng tag song song và một cuộc dọn dẹp chưa xong. Miền hành vi là **cách nhóm** một từ vựng đã đóng, cấm là trục thứ năm |
| `BR-EBD-02` (một miền chủ đạo) | Mỗi engine khai **đúng một** miền chủ đạo và **tối đa một** miền phụ | Hai miền chủ đạo là không có miền chủ đạo — cùng lý do với `BR-TAG-04` (đúng một skill trọng số 1.0) |
| `BR-EBD-03` (miền không phải tag nội dung) | Cấm — NEVER thêm `behavior_domain` vào từ vựng tag của [`content-tagging.md`](content-tagging.md) hay vào bảng `content_tags`. Ánh xạ `mechanic` → miền là hàm nhiều–một, suy được | Người soạn nội dung không được gánh thêm một ô bắt buộc nữa. Trục `what` đã cho thấy một trục nới lỏng thì corpus lệch 160 lượt gắn |
| `BR-EBD-04` (sàn miền theo band) | Mỗi band có ≥K miền khả dụng (engine không cấm band đó **và** có ≥1 level `published`). K là **bậc thang**, đo 2026-09-07: `3-4` = 2, `4-5` = 5, `5-6` = 6. Cấm tụt | Trẻ 3–4 tuổi chỉ được chỉ và mang là một khoảng trống vận động, không phải một lựa chọn thiết kế. Bậc thang biến nó thành số theo dõi được thay vì một nhận xét |
| `BR-EBD-05` (câu quan sát bằng lời người) | Mục 17 có ≥1 **câu quan sát**: động từ trẻ làm + đối tượng + điều kiện, viết như dòng cô giáo ghi vào sổ. Cấm — NEVER viết bằng từ kỹ thuật (`chọn đáp án đúng`, `hoàn thành lượt`) | Một câu ghi được là một câu kiểm được. Bằng chứng phát triển của trẻ là hành vi, không phải mã trạng thái |
| `BR-EBD-06` (điều kiện phát triển tiên quyết) | Mục 17 khai điều kiện **vận động · chú ý · bộ nhớ làm việc · ngôn ngữ** tối thiểu của band nhỏ nhất engine nhận, và `age_min` cùng `banned_age_bands` phải **suy ra được** từ bảng đó | Hôm nay band bị cấm được biện luận bằng một câu văn xuôi khác nhau ở mỗi phiếu, nên không đối chiếu được giữa 37 engine. `BR-GTC-05` nói cấm band vì mechanic sai lứa; nó không nói *sai ở chỗ nào* |
| `BR-EBD-07` (hai kênh cho thông tin thắng cuộc) | Mọi thông tin **cần để thắng** phải đến qua ≥2 kênh trong ba kênh hình · âm · ký hiệu. Màu sắc cấm — NEVER là kênh duy nhất | Trẻ mầm non chưa đọc, một phần trẻ không phân biệt được màu, và thiết bị lớp học thường tắt âm. `BR-EPL-03` lo hai kênh cho **trạng thái**; luật này lo hai kênh cho **nội dung** |
| `BR-EBD-08` (độ mở phải khai) | Mục 18 khai `do_mo` ∈ `đóng` · `bán mở` · `mở`. Engine `đóng` phải nêu **lý do cơ chế**; cấm bỏ trống | Một corpus toàn đáp án đơn nhất là một tập đề kiểm tra, không phải một môi trường chơi. Đo 2026-09-07: 1 trên 37 engine ở mức `mở` |
| `BR-EBD-09` (quyền của trẻ) | Mục 18 khai ≥1 quyết định thuộc về **trẻ**: thứ tự làm, vật liệu, chủ đề, mức khó, hoặc thời điểm nộp | Tự chủ là điều kiện của động cơ trong ở lứa tuổi này. Engine mà hệ thống quyết mọi thứ biến trẻ thành người thi hành |
| `BR-EBD-10` (trục biến thể đếm được) | Mục 18 khai ≥3 trục biến thể, mỗi trục ≥2 **giá trị cụ thể**. Cấm — NEVER ghi "đa dạng" hay "nhiều chủ đề" | Cùng lý do với `BR-ESS-05`: ô ghi chữ không soạn được, ô ghi giá trị thì soạn được và đếm được |
| `BR-EBD-11` (nhịp thật cấm dưới 5 tuổi) | Engine có `rang_buoc_nhip = 'thời-gian-thật'` cấm band `3-4`. Nhận band `4-5` thì phải khai cửa sổ dung sai và một **lối chơi không tính giờ**. Engine `nhịp-đề` **không** thuộc luật này, nhưng phải khai thời gian hiện đề theo từng band | Ép nhịp lên trẻ chưa điều khiển được tốc độ tay đo tốc độ vận động chứ không đo nhận thức, và tạo trải nghiệm thua liên tiếp. Ranh giới nằm ở chỗ đồng hồ chạy trên **đề** hay trên **tay trẻ**: `GT-012` chớp rồi cho trả lời thong thả, nên nó ở được band `3-4`; `GT-026` chấm đúng trong cửa sổ phản ứng, nên không |
| `BR-EBD-12` (vật trước ký hiệu) | Mục 17 khai bậc biểu diễn theo band trong `vật` → `hình` → `ký hiệu`. Band `3-4` cấm — NEVER bài mà bậc `ký hiệu` đứng một mình | Chữ số và chữ cái là quy ước; trẻ ba tuổi cần lượng trước ký hiệu. Nhánh `text` của `assetSchema()` (`BR-GTC-11`) làm bài ký hiệu **soạn được** — nên luật này là thứ giữ nó khỏi bị dùng sai lứa |
| `BR-EBD-13` (cổng có ca âm) | `check:engine-behavior` có ≥6 test ca âm: miền ngoài từ vựng, hai miền chủ đạo, thiếu câu quan sát, chỉ 2 trục biến thể, độ mở bỏ trống, band tụt dưới bậc | Cổng không có ca âm là cổng không biết mình hỏng — bài học đã trả giá với công cụ lint trước đó (`BR-ESS-09`) |

## 7. Data

**Đọc:** `packages/game-engine/config/engine-behavior-domain.json` · registry engine ·
`docs/specs/01-platform/engines/GT-*.md` mục 17 và 18 · corpus `game_levels` để đo band khả dụng.
**Ghi:** không ghi database. Cổng in báo cáo.

### 7.1 Sáu miền hành vi

| Mã | Tên | Cử chỉ chủ đạo | Đối tượng tác động | Câu quan sát mẫu | Số engine |
|---|---|---|---|---|---:|
| `chi-dinh` | Chỉ định | `tap` | Một vật trong tập đã bày sẵn | "Con nghe hết câu hỏi rồi mới chỉ vào con vịt" | 16 |
| `van-chuyen` | Vận chuyển | `drop` | Vật rời ↔ chỗ chứa | "Con nhấc từng quả, mang sang rổ, buông tay rồi mới lấy quả tiếp" | 9 |
| `sap-dat` | Sắp đặt | `drop` + `commit` lặp | **Quan hệ** giữa nhiều vật (thứ tự, lưới, đối xứng, nhịp) | "Con đổi chỗ hai tấm thẻ cho tới khi câu chuyện kể xuôi" | 7 |
| `dieu-chinh` | Điều chỉnh | `adjust` | Một tham số liên tục của một vật | "Con xoay kim tới khi nó chỉ đúng số 3, rồi dừng" | 2 |
| `lan-net` | Lần nét | `stroke` | Một đường liên tục | "Con đưa ngón tay theo mũi tên, đi hết nét mới nhấc lên" | 2 |
| `kien-tao` | Kiến tạo | trẻ tự chọn chuỗi cử chỉ | Sản phẩm chưa có đáp án sẵn | "Con tự nghĩ ra luật xanh–đỏ–xanh rồi làm hết dải ô" | 1 |

Sáu miền là **cách nhóm** sáu cử chỉ, không phải sáu cử chỉ mới. `commit` và `revert` không
sinh miền riêng: chúng là nhịp kết thúc và nhịp sửa của mọi miền.

**Ràng buộc nhịp** là trục thứ ba của bộ ba `BR-EBD-01`, ba giá trị đóng:

| Giá trị | Thời gian ràng buộc cái gì | Ví dụ | Band nhỏ nhất |
|---|---|---|:--:|
| `tự do` | Không gì cả — trẻ hành động khi nào cũng được | `GT-001` `GT-003` | `3-4` |
| `nhịp-đề` | **Lúc ra đề**: kích thích hiện rồi tắt, còn câu trả lời thì không tính giờ | `GT-012` `GT-018` `GT-020` | `3-4`, kèm thời gian hiện khai theo band |
| `thời-gian-thật` | **Lúc trẻ đáp**: cửa sổ trả lời có hạn | `GT-026` `GT-034` | `5-6`, hoặc `4-5` kèm lối không tính giờ |

Phân biệt này quyết định `BR-EBD-11`. Một bài chớp rồi nhớ lại **không** ép tốc độ tay trẻ:
nó ép trí nhớ, và trẻ ba tuổi có trí nhớ thị giác ngắn hạn để chơi. Một bài chạm-khi-thấy-dấu
thì ép đúng thứ trẻ ba tuổi chưa có: điều khiển tốc độ phản ứng.

### 7.2 Phân miền 37 engine

| Mã | Cơ chế | Miền chủ đạo | Miền phụ | Ràng buộc nhịp |
|---|---|---|---|---|
| `GT-000` | `concept-intro` | `chi-dinh` | — | tự do |
| `GT-001` | `tap-select` | `chi-dinh` | — | tự do |
| `GT-002` | `tap-select-multi` | `chi-dinh` | — | tự do |
| `GT-003` | `drag-to-container` | `van-chuyen` | — | tự do |
| `GT-004` | `sort-groups` | `van-chuyen` | — | tự do |
| `GT-005` | `pair-match` | `van-chuyen` | `chi-dinh` | tự do |
| `GT-006` | `sequence-order` | `sap-dat` | — | tự do |
| `GT-007` | `number-bond` | `van-chuyen` | — | tự do |
| `GT-008` | `drag-to-slot` | `van-chuyen` | — | tự do |
| `GT-009` | `clue-deduction` | `chi-dinh` | — | tự do |
| `GT-010` | `substitution` | `chi-dinh` | — | tự do |
| `GT-011` | `matrix-choice` | `chi-dinh` | — | tự do |
| `GT-012` | `flash-recall` | `chi-dinh` | — | nhịp-đề |
| `GT-013` | `maze-route` | `lan-net` | `chi-dinh` | tự do |
| `GT-014` | `balance-scale` | `van-chuyen` | `dieu-chinh` | tự do |
| `GT-015` | `sudoku-mini` | `sap-dat` | — | tự do |
| `GT-016` | `clock-hands` | `dieu-chinh` | — | tự do |
| `GT-017` | `block-stack` | `chi-dinh` | — | tự do |
| `GT-018` | `listen-respond` | `chi-dinh` | — | nhịp-đề |
| `GT-019` | `rotate-transform` | `dieu-chinh` | `van-chuyen` | tự do |
| `GT-020` | `memory-flip` | `chi-dinh` | — | nhịp-đề |
| `GT-021` | `mirror-complete` | `sap-dat` | `van-chuyen` | tự do |
| `GT-022` | `hidden-object` | `chi-dinh` | — | tự do |
| `GT-023` | `construct` | `sap-dat` | `van-chuyen` | tự do |
| `GT-024` | `trace-path` | `lan-net` | — | tự do |
| `GT-025` | `spot-difference` | `chi-dinh` | — | tự do |
| `GT-026` | `go-nogo` | `chi-dinh` | — | thời-gian-thật |
| `GT-027` | `rule-switch` | `chi-dinh` | — | tự do |
| `GT-028` | `tap-count` | `chi-dinh` | — | tự do |
| `GT-029` | `remove-from-set` | `van-chuyen` | — | tự do |
| `GT-030` | `measure-with-unit` | `van-chuyen` | `sap-dat` | tự do |
| `GT-031` | `coin-compose` | `van-chuyen` | — | tự do |
| `GT-032` | `pour-quantity` | `chi-dinh` | `dieu-chinh` | tự do |
| `GT-033` | `weave-grid` | `sap-dat` | — | tự do |
| `GT-034` | `beat-sequence` | `sap-dat` | — | thời-gian-thật |
| `GT-035` | `command-sequence` | `sap-dat` | — | tự do |
| `GT-036` | `free-create` | `kien-tao` | `sap-dat` | tự do |

### 7.3 Phủ miền theo band — số đo 2026-09-07

Band khả dụng lấy từ `age_min`/`age_max` của registry, đối chiếu bảng
[`engines/index.md`](engines/index.md).

| Band | Engine khả dụng | Miền khả dụng | Số miền |
|---|---:|---|:--:|
| `3-4` | 8 | `chi-dinh` · `van-chuyen` | **2 / 6** |
| `4-5` | 22 | thêm `lan-net` · `dieu-chinh` · `sap-dat` | **5 / 6** |
| `5-6` | 37 | thêm `kien-tao` | **6 / 6** |

Ba con số này là toàn bộ lý do spec này tồn tại.

Trẻ 3–4 tuổi gặp đúng hai hành vi: **chỉ vào** và **mang bỏ vào**. Không có lần nét — dù 3–4
là đúng lứa của bộ khung kim loại Montessori và mọi hoạt động tiền tập viết. Không có điều
chỉnh, không có kiến tạo. Tám engine của band này (`GT-000` `GT-001` `GT-003` `GT-005`
`GT-007` `GT-008` `GT-012` `GT-020`) chia nhau hai miền.

Ở chiều còn lại: `kien-tao` có **một** engine trong cả corpus, và engine đó (`GT-036`) cấm cả
hai band nhỏ. Nghĩa là trên toàn nền tảng, việc *"con tự nghĩ ra"* chỉ tồn tại cho trẻ 5–6
tuổi, ở đúng một cơ chế.

Cả hai là **câu hỏi mở của mục 11**, không phải việc phải sửa ngay: hạ `age_min` của một
engine là đổi hợp đồng đã đo, và spec này chưa đo được cái giá của nó.

### 7.4 Sáu trục biến thể

Từ vựng **gợi ý, không đóng** — mục 18 của phiếu chọn ≥3 trục và điền giá trị thật.

| Trục | Nghĩa | Ví dụ giá trị |
|---|---|---|
| `boi-canh` | Cùng hành vi, khác thế giới | nông trại · chợ Tết · đại dương · lớp học |
| `vai-tro` | Trẻ đóng vai gì trong bài | người trả lời · người sửa lỗi giúp nhân vật · người ra đề · người kể lại |
| `kenh-de` | Đề đến qua kênh nào | hình · âm · ký hiệu · phản hồi khi chạm |
| `so-duong-thang` | Có mấy cấu hình được coi là thắng | một · nhiều tổ hợp · mọi cấu hình tự nhất quán |
| `nhip` | Thời gian ràng buộc thế nào | tự do · có gợi ý theo giờ · thời gian thật |
| `do-mo` | Ai đặt tiêu chí đúng | hệ thống đặt · hệ thống đặt, nhiều lời giải · trẻ đặt |

### 7.5 Bậc biểu diễn theo band

| Bậc | Nghĩa | Band phù hợp |
|---|---|---|
| `vật` | Vật thể có thể đếm, mang, đặt được | `3-4` trở lên |
| `hình` | Tranh, sơ đồ, biểu tượng của vật | `3-4` trở lên |
| `ký hiệu` | Chữ số, chữ cái, dấu quy ước | `4-5` kèm bậc dưới; `5-6` đứng riêng |

`BR-EBD-12` cấm bậc `ký hiệu` đứng một mình ở band `3-4`. Nó **không** cấm ký hiệu xuất hiện:
số 3 in cạnh ba quả táo là bài đúng lứa, và là đúng thứ nhánh `text` của `assetSchema()` sinh ra.

### 7.6 Nơi khai báo

```
packages/game-engine/config/engine-behavior-domain.json
  {
    "ratchet": { "3-4": 2, "4-5": 5, "5-6": 6 },
    "engines": {
      "GT-003": { "mien": "van-chuyen", "mien_phu": null, "nhip": "tu-do" },
      "GT-012": { "mien": "chi-dinh",    "mien_phu": null, "nhip": "nhip-de" },
      "GT-026": { "mien": "chi-dinh",    "mien_phu": null, "nhip": "thoi-gian-that" }
    }
  }
```

Cấu hình là **nguồn sự thật**; mục 17 của phiếu phải khớp nó. Chọn tệp cấu hình thay vì thêm
trường vào `GameTemplate` là có chủ ý: `game-template-contract.md` sở hữu hình dạng
`GameTemplate`, và `BR-GTC-08` coi mọi thay đổi contract đã publish là breaking change. Miền
hành vi không cần đến runtime, nên nó không đáng một migration. Xem câu hỏi 4 mục 11.

## 8. API contract

Không có. Miền hành vi là dữ liệu trong repo, đo lúc chạy cổng. Không route nào đọc nó.

## 9. Acceptance criteria

```gherkin
Scenario: BR-EBD-01 — miền ngoài sáu giá trị làm cổng đỏ
  Given engine-behavior-domain.json khai GT-013 với miền "vach-duong"
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0
  And thông báo nêu sáu giá trị hợp lệ

Scenario: BR-EBD-02 — hai miền chủ đạo làm cổng đỏ
  Given GT-014 khai mien là "van-chuyen" và "dieu-chinh" cùng lúc
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-03 — miền hành vi không xuất hiện trong từ vựng tag nội dung
  When đọc từ vựng ba trục của content-tagging.md và bảng content_tags
  Then không trục nào chứa giá trị của sáu miền hành vi

Scenario: BR-EBD-04 — band tụt dưới bậc thang làm cổng đỏ
  Given bậc thang khai 4-5 phải có 5 miền
  And engine duy nhất gánh miền lan-net ở band 4-5 bị đánh dấu deprecated
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0
  And báo cáo nêu miền lan-net mất khỏi band 4-5

Scenario: BR-EBD-05 — phiếu thiếu câu quan sát làm cổng đỏ
  Given phiếu GT-011 có mục 17 nhưng không có bảng câu quan sát
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-05 — câu quan sát viết bằng từ kỹ thuật làm cổng đỏ
  Given phiếu GT-011 khai câu quan sát là "trẻ chọn đáp án đúng"
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0
  And thông báo nêu câu quan sát phải mô tả hành vi nhìn thấy được

Scenario: BR-EBD-06 — phiếu thiếu điều kiện phát triển tiên quyết làm cổng đỏ
  Given phiếu GT-024 không khai bảng điều kiện vận động và chú ý ở mục 17
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-07 — bài dùng màu làm kênh duy nhất bị chặn
  Given một level mà thông tin phân biệt lựa chọn chỉ nằm ở màu sắc
  When chạy cổng kiểm seed
  Then cổng thoát với mã khác 0
  And thông báo nêu cần kênh thứ hai là hình dạng, chữ hoặc âm

Scenario: BR-EBD-08 — độ mở bỏ trống làm cổng đỏ
  Given phiếu GT-022 có mục 18 nhưng không khai do_mo
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-09 — phiếu không khai quyền nào của trẻ làm cổng đỏ
  Given phiếu GT-015 khai mục 18 mà không có dòng quyền của trẻ
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-10 — chỉ hai trục biến thể làm cổng đỏ
  Given phiếu GT-025 khai đúng hai trục biến thể ở mục 18
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-10 — trục biến thể ghi chữ đa dạng làm cổng đỏ
  Given phiếu GT-025 khai trục boi-canh với giá trị "đa dạng chủ đề"
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-11 — engine nhịp thời gian thật nhận band 3-4 làm cổng đỏ
  Given GT-026 khai nhip là thời-gian-thật và age_min là 3
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-11 — engine nhịp-đề vẫn được nhận band 3-4
  Given GT-012 khai nhip là nhịp-đề và khai thời gian hiện đề cho từng band
  When chạy check:engine-behavior
  Then cổng thoát với mã 0

Scenario: BR-EBD-11 — engine nhịp-đề thiếu thời gian hiện đề theo band làm cổng đỏ
  Given GT-012 khai nhip là nhịp-đề mà mục 17 không khai thời gian hiện đề cho band 3-4
  When chạy check:engine-behavior
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-12 — bài ký hiệu đứng một mình ở band 3-4 bị chặn
  Given một level band 3-4 mà mọi lựa chọn là chữ số trần, không kèm lượng
  When chạy cổng kiểm seed
  Then cổng thoát với mã khác 0

Scenario: BR-EBD-13 — cổng có ca âm
  Given bộ test của check:engine-behavior
  When đọc danh sách test
  Then có ít nhất 6 test ca âm phủ các điều kiện vi phạm ở trên
```

## 10. Boundaries

**Always**
- Suy miền từ sáu cử chỉ đã đóng của [`engine-play-language.md`](engine-play-language.md).
- Viết câu quan sát bằng lời một cô giáo ghi được vào sổ.
- Giải thích `age_min` và band cấm bằng điều kiện phát triển, không bằng thói quen.
- Khai độ mở và quyền của trẻ, kể cả khi câu trả lời là "đóng" hoặc "rất ít".
- In số miền của từng band ở mỗi lần chạy cổng, kể cả khi xanh.

**Ask first**
- Thêm giá trị thứ bảy vào từ vựng miền.
- Hạ `age_min` của một engine để lấp một miền còn thiếu ở band nhỏ.
- Nâng bậc thang `BR-EBD-04` lên trước khi có engine thật đóng vào band đó.

**Never**
- Biến miền hành vi thành trục tag của nội dung (`BR-EBD-03`).
- Khai hai miền chủ đạo cho một engine (`BR-EBD-02`).
- Cho engine ràng buộc thời gian thật xuống band `3-4` (`BR-EBD-11`).
- Dùng màu làm kênh duy nhất mang thông tin thắng cuộc (`BR-EBD-07`).
- Ghi "đa dạng" vào ô trục biến thể (`BR-EBD-10`).

## 11. Open questions

| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |
|---|---|---|---|---|
| 1 | `GT-024` lần nét chỉ nhận band `5-6` (`age_min` = 5 **và** cấm `3-4`), nên miền `lan-net` vắng ở `3-4` và chỉ có `GT-013` gánh ở `4-5`. Nhưng 3–4 tuổi là đúng lứa của bộ khung kim loại và mọi hoạt động tiền tập viết. Cấm ở đây là vì **vận động** hay vì **dung sai đường nét** đang đặt quá hẹp? Bảng điều kiện ở mục 17 của phiếu `GT-024` không có dòng nào đòi `5-6` trừ trường hợp nét chữ cái | Miền `lan-net` cho band `3-4`, tức bậc thang `3-4` lên 3 | P4 | Nội dung |
| 2 | `GT-036` kiến tạo cấm cả `3-4` và `4-5` vì thang chấm cần đủ `min_repetitions`. Cái chặn là **cơ chế** hay là **cách chấm**? Trẻ 4 tuổi đặt được luật xanh–đỏ; thứ nó chưa làm được là lặp đủ dài để thang chấm nhận ra | Miền `kien-tao` cho band nhỏ | P4 | Nội dung |
| 3 | Giai đoạn ba của `GT-000` (trẻ **gọi tên** vật) là hành vi nói. Nền tảng cấm chạm micro, nên hệ thống không quan sát được nó. Bằng chứng đó ghi ở đâu — sổ của cô, hay một bề mặt cho phụ huynh xác nhận? | Bằng chứng hành vi cho lĩnh vực ngôn ngữ | P5 | Sư phạm |
| 4 | Miền hành vi nên nằm ở tệp cấu hình (chọn hiện tại) hay thành trường của `GameTemplate`? Trường registry đắt hơn nhưng cho runtime chọn bài theo miền, ví dụ "hôm nay con chưa được kéo thả lần nào" | Gợi ý bài kế tiếp theo miền | P5 | Backend |
| 5 | 16 trên 37 engine thuộc `chi-dinh`. Cần một trần **tỷ lệ level** theo miền, hay chỉ cần sàn số miền theo band? Trần tỷ lệ chặn được việc corpus phình ra ở đúng miền rẻ nhất | Cân bằng corpus theo miền | P5 | Nội dung |
