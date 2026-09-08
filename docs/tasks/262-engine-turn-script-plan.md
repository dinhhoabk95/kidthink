# Task #262 Plan: Kịch bản lượt chơi — cưỡng chế bảy nhịp và đóng khoản hai trường lời đọc

> **Mục tiêu**: 37 phiếu engine đã kể được một lượt chơi thật. Task này (a) dựng cổng giữ cho
> chúng không trôi về bản sao, và (b) đóng khoản nợ thật mà lượt spec phát hiện: **hai trường
> song song cho lời đọc đề**.

---

## 1. Bối cảnh

### 1.1 Việc đã xong ở lượt spec (2026-09-08)

| File | Thay đổi |
|---|---|
| [`engine-turn-script.md`](../specs/01-platform/engine-turn-script.md) | **Mới** — bảy nhịp `N1`…`N7`, ba giá trị ràng buộc nhịp của lời đọc, tám nhánh bắt buộc, 12 rule `BR-ETS-*` |
| [`engine-spec-sheet.md`](../specs/01-platform/engine-spec-sheet.md) | Thêm `BR-ESS-18` (mục 4 theo bảy nhịp) và `BR-ESS-19` (mục 5 phủ tám nhánh) |
| [`engines/TEMPLATE.md`](../specs/01-platform/engines/TEMPLATE.md) | Khuôn mục 4 và mục 5 mới |
| `engines/GT-000.md` … `GT-036.md` | **37 phiếu** viết lại mục 4 (bảy nhịp) và mục 5 (tám nhánh), nội dung riêng từng engine |

`check:engine-specs` sau thay đổi: **37 mã, 37 spec, 0 mồ côi, 0 vi phạm**.

### 1.2 Hai số đo mở đầu

**Số đo 1 — mục 4 là bản sao.** 26 trên 37 phiếu có mục 4 giống hệt nhau, khác đúng một chuỗi:

```
3. Trẻ tương tác theo cơ chế `<mechanic>`.
```

Mục 5 có trung vị **4 nhánh**, và không phiếu boilerplate nào có nhánh **bỏ dở giữa lượt** hay
**chơi lại lần thứ n** — hai tình huống trẻ gặp nhiều nhất.

**Số đo 2 — hai trường cho một lời đọc.** Đo trên mã nguồn:

| Trường | Khai ở đâu | Ai đọc |
|---|---|---|
| `content_pack.prompt_audio_ref` | `promptFields()` — **36/37** contract engine | **Không ai.** Chỉ contract, `gate-09-concept-present.ts`, `config-dictionary.ts` và test |
| `game_levels.instruction_audio_path` | cột DB + `game-config-runtime.ts` | `use-play-audio.ts` → `[code].vue` — **đường sống** |

Engine duy nhất không khai `prompt_audio_ref` là `GT-000`, và nó là engine duy nhất tự gọi
`AudioController.playPromptAudio()`. Người soạn nội dung điền `prompt_audio_ref` hôm nay sẽ
không nghe thấy gì, và không có gì báo cho họ biết.

### 1.3 Cái đã đúng sẵn, cần giữ

`BR-ETS-02` (cấm nhận chạm lúc còn preload) **đang đạt**: `[code].vue` bọc canvas bằng
`v-show="!(isLoading || errorMessage)"` nên vùng chơi bị ẩn khỏi luồng con trỏ trong lúc
`preloadPlayAssets()` chạy. Đây là thứ dễ mất khi ai đó đổi `v-show` thành `v-if` ngược lại
hoặc thêm một lớp phủ — nên nó cần một test giữ, không cần một bản vá.

---

## 2. Giả định của lượt spec

| # | Giả định | Cái bị loại và vì sao |
|---|---|---|
| A1 | Bảy nhịp là **kịch bản**, không phải nhịp hệ thống | `SystemBeat` giữ nguyên ba giá trị `reveal`/`hint`/`timeout` (`BR-EPL-02`); mục 7.2 của spec khai ánh xạ giữa hai trục |
| A2 | Spec mới **không** định nghĩa lại leo thang trợ giúp, phản hồi, ăn mừng, vòng chơi, phiên | Bốn thứ đó đã có chủ. Spec mới chỉ sở hữu ba nhịp chưa ai sở hữu: mở màn, ra đề, chơi lại |
| A3 | Mục 4 của phiếu nói `L1`/`L2`/`L3` **cụ thể theo engine** | Ba cấp chung không cài được: bàn tay ma của mê cung vạch một đường, của phân loại thì bê một vật |
| A4 | Không chọn hộ trường lời đọc nào sẽ sống | Khai tử một trường là đổi contract nội dung và đổi cả đường seed. Ghi thành câu hỏi 1, có chủ |
| A5 | Chơi lại **không** đổi độ khó | Adaptive đổi độ khó **giữa các phiên** (`adaptive-engine.md`); đổi ngay trong lần bấm chơi lại đọc thành hình phạt |

---

## 3. Thi công

### 3.1 Cổng — `packages/game-engine/scripts/check-engine-turn.ts`

1. Mục 4 có đủ bảy mốc `N1`…`N7`, **đúng thứ tự**.
2. Mục 4 không chứa chuỗi bản sao (`Trẻ tương tác theo cơ chế`, `Phản hồi thị giác theo trạng thái`, `setupEntities() khởi tạo trạng thái`).
3. Nhịp `N2` nêu trường lời đọc và kênh hình song song.
4. Nhịp `N5` nêu cả ba cấp `L1` · `L2` · `L3`.
5. Nhịp `N7` nêu **cái gì đổi** và **cái gì giữ**.
6. Mục 5 có ≥8 hàng đánh số và phủ đủ tám nhãn nhánh của mục 7.4.
7. Mục 4 dài hơn ngưỡng tối thiểu ký tự cho mỗi nhịp — chặn kiểu điền `N4` bằng ba chữ.

### 3.2 Ca âm (`BR-ETS-12`, ≥6)

Thiếu một nhịp · sai thứ tự nhịp · còn chuỗi bản sao · thiếu một nhánh bắt buộc · `N5` chỉ ghi
"scaffolding highlight" · `N7` không nói cái gì giữ nguyên.

### 3.3 Đóng khoản hai trường lời đọc (`BR-ETS-04`)

Chờ câu trả lời cho câu hỏi 1, rồi làm **một** trong hai:

- **Giữ `instruction_audio_path`** → gỡ `prompt_audio_ref` khỏi `promptFields()`, migrate 36
  contract, cập nhật `gate-09-concept-present.ts` và `config-dictionary.ts`, và cập nhật mục 7
  của 36 phiếu.
- **Giữ `prompt_audio_ref`** → `game-config-runtime.ts` đọc nó khi dựng payload vòng,
  `use-play-audio.ts` nhận từ đó, và `instruction_audio_path` thành cột suy ra.

Cấm — NEVER làm cả hai nửa vời và để lại hai đường.

### 3.4 Test giữ những thứ đang đúng

- `BR-ETS-02`: test bề mặt chơi — trong lúc `isLoading` bật, cử chỉ trên vùng chơi không sinh
  sự kiện engine nào.
- `BR-ETS-03`: test `use-play-audio` — bấm nghe lại giữa lúc đang đọc thì `stopNarrationAudio()`
  chạy trước khi phát lại; không có hai `HTMLAudioElement` cùng sống.
- `BR-ETS-10`: test runner — hai lượt liên tiếp cùng level có `layout_seed` khác nhau và
  `difficulty_params` **bằng nhau**.

### 3.5 Nối vào chuỗi cổng

`check:engine-turn` vào `package.json` của `@mindkid/game-engine` và vào `scripts/check.sh`,
ngay sau `check:engine-specs`. Chạy bằng binary Node **v24.15.0**.

---

## 4. Không làm trong task này

- Đổi `SystemBeat` hay thêm cử chỉ mới.
- Đổi ngưỡng leo thang trợ giúp, ngôn ngữ phản hồi, hay quy tắc ăn mừng — bốn thứ đó có chủ khác.
- Chọn hộ trường lời đọc nào bị khai tử (A4).
- Đổi độ khó khi chơi lại.

---

## 5. Nghiệm thu

1. `check:engine-turn` xanh trên 37 phiếu; sáu ca âm đỏ đúng chỗ.
2. `check:engine-specs` vẫn xanh (37 mã, 37 spec, 0 mồ côi).
3. Ba test giữ ở mục 3.4 xanh.
4. Sau khi câu hỏi 1 được trả lời: chỉ còn **một** trường mang lời đọc trong toàn hệ thống, và
   `grep` trường bị khai tử trả về 0 kết quả ngoài migration.
