# Kế hoạch — Task #278: `GT-037` Tìm hết ký hiệu — `symbol-hunt`

> **Loại task:** lát dọc engine mới + layout mới (L).
> **Đích:** khuôn `GT-037` chơi được trên bề mặt chơi, layout `scatter-board` thuần, **12 level**
> cộng 3 fixture, mọi cổng xanh.
> **Spec sở hữu:** phiếu engine [`GT-037.md`](../specs/01-platform/engines/GT-037.md) — viết ở
> task này, trạng thái `draft`, **đặt trước** (`BR-ESS-15`). Lát S2 dựng khuôn phải **gỡ `GT-037`
> khỏi `packages/game-engine/config/engine-spec-planned.json` trong cùng PR**.
> **Nguồn yêu cầu:** "trò chơi tìm toàn bộ số, chữ, hình… trong một bảng random hàng chục ký
> hiệu khác nhau, sắp xếp random không chồng lên nhau" — người đặt việc, 2026-09-27.

## 1. Nghiên cứu — bài này là gì và vì sao đáng làm

Dạng bài là **cancellation task** (bài gạch xoá): một bảng nhiều ký hiệu, trẻ đánh dấu mọi bản sao
của ký hiệu đích. Nó là công cụ đo chú ý chuẩn trong tâm lý học phát triển, có bản cho mầm non.

| Phát hiện | Nguồn | Hệ quả thiết kế |
|---|---|---|
| NEPSY dùng hai bài cho 3–4 tuổi: tìm 20 thỏ trong 96 hình **xếp hàng-cột**, và tìm 20 mèo **rải tự do** | Hokken et al. 2026, *British Journal of Visual Impairment* | Tỉ lệ đích ~20% là mốc đã kiểm chứng → luật ca sai mục 14 của phiếu (15–35%) |
| Bảng rải ngẫu nhiên sinh **nhiều lỗi hơn** bảng hàng-cột; bảng hàng-cột dẫn mắt thành chuỗi quét dài, bảng ngẫu nhiên chỉ ra chuỗi 2–4 | Wang & Huang, *Computers & Education* | Bảng "random" đúng như yêu cầu là **trục khó**, không phải trang trí → band nhỏ bảng thưa hơn |
| Quét có tổ chức phát triển muộn, rõ dần tới tuổi đi học | Woods et al., "The development of organized visual search", PMC3651801 | Band `4-5` bắt buộc bộ đếm; trợ giúp **thu hẹp vùng** chứ không chỉ thẳng |
| Chú ý bền tăng tới ~4 tuổi rồi chững | Tổng hợp tìm kiếm, Picture Deletion Task for Preschoolers | `age_min` 4; band `3-4` đề xuất cấm (phiếu mục 11 câu 4) |

Hai số đo tự nhiên của bài — `omission` (bỏ sót đích) và `commission` (chạm nhầm gây nhiễu) — tách
được **quét** khỏi **chú ý chọn lọc**. Engine ghi cả hai vào sự kiện, cộng `order` (thứ tự ô trẻ
tìm) để về sau đo được chiến lược quét.

## 2. Vì sao là engine mới, không mở rộng `GT-022`

Đo trên code hiện tại:

- `GT-022` giới hạn `scene_objects` 3–12 và `target_count` 1–5 — không chứa nổi "hàng chục".
- Toạ độ `GT-022` lấy từ `content_pack` hoặc `100 + rng.next() * 760` **không kiểm đụng nhau**
  (`packages/game-engine/src/templates/GT-022/session.ts` hàm `setupEntities`) — hai vật 64 px có
  thể chồng. Đây là lỗi tồn tại riêng của `GT-022`, **ngoài phạm vi** task này; ghi lại để mở task
  sửa.
- `GT-022` do người soạn **đặt từng vật**; `GT-037` do engine **sinh bảng** từ kho + seed. Hai hợp
  đồng nội dung khác bản chất; gộp vào một `content_contract` là một schema hai nghĩa.

Kết luận: engine mới, một phiếu, một plan, một lát dọc (quy ước "1 spec = 1 plan").

## 3. Hình dạng

| Mục | Giá trị |
|---|---|
| `mechanic` | `symbol-hunt` |
| Nguyên thuỷ | `selection` (dùng lại `mechanics/selection-mechanic.ts`) |
| Band | `4-5` · `5-6` — `banned_age_bands: ["3-4"]` (chờ quyết, phiếu mục 11 câu 4) |
| `layouts` | `scatter-board` (mới) |
| `status` | `draft` |

### 3.1 Hợp đồng nội dung (dự kiến — khuôn thắng khi dựng)

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `prompt` · `instruction_audio_path` | chuẩn `promptFields()` | |
| `symbols` | 6–40 phần tử `{ id, asset, orientation_free? }` | kho ký hiệu **khác nhau**; `asset` là `emoji` · `text` · `image` |
| `target_ids` | 1–2 id thuộc `symbols` | |
| `target_copies` | 2–8 | tổng bản sao đích trên bảng |
| `item_count` | 12–30 | tổng ký hiệu trên bảng |
| `confusable_ids` | 0–4 id thuộc `symbols`, không thuộc `target_ids` | bắt buộc có mặt ≥1 bản |

`superRefine`: id duy nhất; `target_ids`/`confusable_ids` ⊂ `symbols`; không hai `symbols` cùng
glyph sau NFC (`BR-E037-07`); `item_count − target_copies ≥ số confusable`; chữ số/chữ cái
(`text` khớp `^[0-9\p{L}]$`) cấm `orientation_free` (`BR-E037-06`).

### 3.2 Độ khó

| Trường | Mặc định | Ghi chú |
|---|---|---|
| `hint_after_ms` | 8000 | 5000–30000 |
| `allow_retry` | `true` | |
| `show_target_counter` | `true` | tắt ở `4-5` là "ask first" |

### 3.3 Dựng bảng — "random không chồng" đúng theo cấu tạo

1. `scatter-board` (hàm thuần, `BR-LAY-01`) trả **mọi ô ứng viên** vừa vùng chơi: bước ô =
   `hit + SLOT_GAP_PX + 2 × JITTER_MAX_PX`, `hit` = sàn chạm band quy ra logic px.
2. Phiên (`deriveStream(layoutSeed, …)`):
   - `cells` — Fisher–Yates chọn `item_count` ô trong số ô ứng viên; ô dư ≥15% để bảng không đọc
     ra hàng-cột;
   - `jitter` — lệch mỗi ô trong `[-JITTER_MAX_PX, +JITTER_MAX_PX]` hai trục;
   - `distractors` — rút `item_count − target_copies` ký hiệu gây nhiễu từ kho (không đích), mỗi
     `confusable_ids` ≥1 bản, còn lại rút có lặp nhưng trải đều;
   - `assign` — xáo multiset (đích + gây nhiễu) vào các ô đã chọn.
3. Vì lệch ≤ `JITTER_MAX_PX` trong ô rộng `hit + gap + 2·JITTER_MAX_PX`, hai vùng chạm luôn cách
   nhau ≥ `gap` — **không** cần vòng thử-lại (Poisson-disc có thể thất bại khi bảng đông; lưới lệch
   thì không bao giờ).

### 3.4 Sức chứa ước tính (960×540, vùng chơi ~896×396, `JITTER_MAX_PX` = 8)

| Band | Sàn chạm | Bước ô | Ô ứng viên | `item_count` tối đa (≤85%) |
|---|---:|---:|---:|---:|
| `3-4` | 96 | 128 | 7×3 = 21 | 17 — dưới "hàng chục" dày → đề xuất cấm |
| `4-5` | 76 | 108 | 8×3 = 24 | **20** |
| `5-6` | 64 | 96 | 9×4 = 36 | **30** |

Số là **ước tính** — S1 đo bằng hàm thật và ghi vào [`provisional-values.md`](provisional-values.md).
Không gian dọc (540 × ≤1280) cho diện tích tương đương; S1 đo cả hai hướng.

## 4. Thay đổi contract phải làm trước code (S0)

| File | Thay đổi |
|---|---|
| `docs/specs/01-platform/game-layout-engine.md` | Thêm `scatter-board` vào từ vựng; rule mới: layout tìm-kiếm **cấm phân trang**, hết chỗ thì báo sức chứa — ngoại lệ có lý do của `BR-LAY-04`; hàm sức chứa công khai để cổng seed gọi |
| `docs/specs/01-platform/engine-behavior-domain.md` | Thêm hàng `GT-037` · `symbol-hunt` · `chi-dinh` · — · tự do |
| `docs/specs/00-foundation/event-catalog.md` | `item_selected` thêm `commission`; `round_completed` thêm `omissions` · `commissions` · `order` cho `GT-037` |
| `docs/specs/00-foundation/error-codes.md` | Đăng ký `LAYOUT_CAPACITY_EXCEEDED` |
| `docs/specs/index.md` · `business-rules.md` §7.1 | Prefix `BR-E037` |

## 5. Lát thi công

| Lát | Nội dung | Chặn bởi |
|---|---|---|
| S0 | Sửa contract mục 4; trả lời 4 câu mở ở phiếu mục 11 | — |
| S1 | `computeScatterBoardLayout` + hàm sức chứa + test (thuần, sàn chạm, gap, đo sức chứa hai hướng, ca âm) | S0 |
| S2 | `template.ts` + schema + `superRefine` + đăng ký registry; gỡ khỏi `engine-spec-planned.json`; sửa phiếu mục 15 theo khuôn thật | S1 |
| S3 | `session.ts`: dựng bảng 4 luồng, thắng/`commission`/`omission`, trợ giúp `L1`–`L3`, sự kiện; test thuộc tính 1.000 seed | S2 |
| S4 | Vẽ + nối bề mặt chơi; kiểm trên trình duyệt thật cả ngang và dọc | S3 |
| S5 | 12 level (`4-5`×6, `5-6`×6: chữ số · chữ cái · hình · emoji) + 3 fixture; cổng seed | S4 |
| S6 | Cổng đầy đủ + review diff | S5 |

## 6. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Màn thật nhỏ hơn 960×540 logic → sức chứa tụt dưới `item_count` của level | Cổng seed kiểm theo không gian **nhỏ nhất** hỗ trợ; runtime ném `LAYOUT_CAPACITY_EXCEEDED` thay vì thu nhỏ |
| Emoji hình giống nhau trên nền tảng khác nhau (font emoji) | Kho `4-5` ưu tiên `text` và hình vẽ; emoji chỉ dùng cặp khác biệt rõ |
| Bảng đông quá sức band `4-5` | Trần 20 và tỉ lệ đích 15–35% là luật cổng, không phải khuyến nghị |
| Cổng xanh giả (bài học `gate-silent-pass-patterns`) | Mỗi luật mới có ca âm; test thuộc tính chạy trên seed thật, không mock layout |

## 7. Ngoài phạm vi

- Sửa lỗi chồng vật của `GT-022` — mở task riêng.
- `finish_mode: declare` — chờ phiếu mục 11 câu 3.
- Phát hành nội dung hay chạy `seed:content` ngoài local.
