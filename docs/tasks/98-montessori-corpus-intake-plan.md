# Kế hoạch — Task #98: Nạp corpus Montessori (P3 lô A, P4 lô B)

> **Loại task:** biên soạn nội dung có cổng, cộng mười một khuôn trò chơi mới (nhiều lát dọc S/M).
> Checklist: [`98-montessori-corpus-intake-todo.md`](98-montessori-corpus-intake-todo.md).
> **Spec đóng:** [`montessori-corpus-mapping.md`](../specs/05-content/montessori-corpus-mapping.md) · [`montessori-game-level-batch.md`](../specs/05-content/montessori-game-level-batch.md) · [`montessori-lesson-batch.md`](../specs/05-content/montessori-lesson-batch.md) · [`montessori-template-batch.md`](../specs/01-platform/montessori-template-batch.md).
> **Tiếp nối ở** [`Task #99`](99-montessori-template-designs-plan.md) — bản thiết kế chi tiết chín khuôn còn lại, và thứ tự làm xếp lại theo hạn ngạch nội dung thay vì chi phí engine.
> **Không chặn bởi task nào đang mở.** Bốn spec đã `approved` ngày 2026-08-20; 16 câu hỏi mở đã đóng bằng `D-RG` tới `D-RV`.

## 1. Outcome

21 tập giáo án Montessori trở thành nội dung trẻ mở được: game level chơi trên bề mặt có sẵn,
và lesson để người lớn dẫn buổi học có hoạt động ngoài màn hình.

Task chia làm hai nửa không cùng hình dạng:

- **Lô A** — 19 dạng bài chạy trên sáu khuôn hiện có. Không một dòng code engine. Đây là phần
  giao được sớm và ước lượng được chắc chắn.
- **Lô B** — 14 dạng bài cần mười một khuôn mới. Mã cấp theo **lớp chi phí**: `GT-007` tới
  `GT-011` chỉ cần layout mới, `GT-012` tới `GT-017` mỗi khuôn kéo theo một system engine chưa
  tồn tại. Ship theo bốn nhóm với cổng người giữa các nhóm (`D-RN`).

Điểm cần nói thẳng: nguồn dày hơn chỗ catalog chứa được. 57 dạng bài, trần chỉ chứa 33. Task
này **hoãn 24 dạng bài**, không cắt chúng.

## 2. Bằng chứng đo được (2026-08-20)

1. Catalog hiện có **120 game level** (20 mỗi competency), **60 lesson**, **60 activity**, và
   **6 khuôn** `GT-001` tới `GT-006`. Mã level đã dùng khối `0001` tới `0020` mỗi competency;
   lesson và activity dùng `0001` tới `0060`.
2. Dataset sau chuẩn hoá có **21 workbook, 57 dạng bài**. Trước chuẩn hoá, workbook 09 và 17
   dùng cú pháp khác nên không đếm được (`D-RI` đã sửa).
3. **3 trên 21** workbook có phần gợi ý sư phạm ba mức. 18 workbook còn lại cần người viết —
   `BR-MCM-09` biến việc này thành điều kiện, không phải tuỳ chọn.
4. Nguồn lệch: **14 trên 21** workbook lấy C1 làm competency chính, **không workbook nào** phủ
   C5 hay C6. Nạp hết ở hai level mỗi dạng bài đẩy tỉ lệ cân bằng lên **4,8 lần**, vượt trần ba
   lần của `BR-TCM-07`.
5. Từ vựng trục `mechanic` có hai bộ: mục 7.1 của [`content-tagging.md`](../specs/01-platform/content-tagging.md)
   khai đúng sáu giá trị khớp code; Trục 3 của [`taxonomy/index.md`](../taxonomy/index.md) khai
   mười sáu giá trị khác. `D-RK` chọn bộ thứ nhất.
6. Seed hiện tại gắn tag ngoài từ vựng (`what_tags: ["cnt"]`, `thinking_tags: ["visual"]`). Đây
   là nợ có sẵn, **không** thuộc phạm vi task này — xem mục 10.
7. Đo trên `packages/game-engine/src`: bốn nguyên thuỷ cơ chế đã có (`ordering`, `pairing`,
   `placement`, `selection`), **12 `LayoutId` trên 4 hàm hình học lõi**, và **không** system nào
   cho hẹn giờ, mê cung, cân, ràng buộc lưới, xoay kim hay phối cảnh đẳng cự. Đây là chi phí
   thật của lô B, và là lý do mã cấp theo lớp chi phí.
8. Ba bậc gợi ý của engine (L1 highlight, L2 ghost hand tốc độ thật, L3 ghost hand 0,5× lặp)
   khớp **một-một** với ba mức Nudge, Guidance, Demo của nguồn. 18 workbook thiếu gợi ý cần
   người **viết lời**, không cần xây cơ chế.
9. `GT-001` nhận tối đa **6** phương án và `prompt` tối đa **80** ký tự. Đây là lý do bài loại
   trừ theo manh mối (bảng số 1 tới 10, ba manh mối) không chạy được trên khuôn hiện có.
10. `pnpm lint:specs` xanh trên 155 spec; `pnpm lint:rule-ids` xanh trên 1405 rule.

## 3. Assumptions và ranh giới

Mười sáu quyết định đã ghi vào spec. Bảng dưới là bản tra nhanh; nguồn sự thật là mục 11 của
từng spec.

| Mã | Quyết định | Ghi ở |
|---|---|---|
| `D-RG` | Coi nguồn có bản quyền đầy đủ; chỉ cơ chế bài toán được tái dùng. Không chờ giấy phép | mapping mục 11 |
| `D-RH` | Một level đúng một skill code; strand phụ đi vào tag | mapping mục 7.1 |
| `D-RI` | Chuẩn hoá cú pháp dạng bài trong chính dataset | mapping mục 7.5 |
| `D-RJ` | Task #98 không thêm nguồn C5 hay C6 | mapping mục 11 |
| `D-RK` | [`content-tagging.md`](../specs/01-platform/content-tagging.md) thắng cho trục `mechanic`; đăng ký theo từng khuôn | template mục 7.5 |
| `D-RL` | `GT-015` và `GT-017` vẽ bằng canvas; `asset_kinds` giữ `emoji` | template mục 7.5 |
| `D-RM` | Thời gian hiện kích thích `GT-011` thuộc `difficulty_params`, 800ms tới 3000ms | template mục 7.5 |
| `D-RN` | Ship bốn nhóm khuôn, cổng người giữa các nhóm | template mục 7.4 |
| `D-RO` | `GT-014` dùng `scoring` schema chung | template mục 7.5 |
| `D-RP` | Đoạn thứ ba của mã level là mechanic viết tắt; 13 giá trị đã seed giữ nguyên | level mục 11 |
| `D-RQ` | Nhận 33 trên 57 dạng bài; 24 dạng hoãn, không cắt | level mục 7.5 |
| `D-RR` | `access_tier` theo `difficulty`: 1 là `free` tới 4–5 là `premium` | level mục 7.6 |
| `D-RS` | Giữ nguyên sàn phủ | level mục 11 |
| `D-RT` | Chưa có chuyên gia sư phạm thì lesson dừng `draft` | lesson mục 7.6 |
| `D-RU` | Lesson vào thư viện rời, không ghép chương trình ở task này | lesson mục 7.6 |
| `D-RV` | Không cần bản ghi chơi thử ở task này vì lô không publish | lesson mục 7.6 |

Ba ranh giới cứng:

1. **Cổng trước nội dung.** WP98.2 dựng cổng hạn ngạch trước batch nội dung đầu tiên. Nạp trước
   rồi đo sau nghĩa là phát hiện vượt trần lúc đã tốn công đọc review.
2. **Không siết nhánh slug của trục `what` và `thinking`.** Bỏ nhánh dự phòng làm đỏ khoảng 139
   nội dung đã seed. Task này chỉ thêm giá trị trục `mechanic`, không đụng hai trục kia.
3. **Không sửa mã đã published.** 13 đoạn mechanic đã seed giữ nguyên (`D-RP`), 120 level và 60
   lesson giữ nguyên.

## 4. Thứ tự

```text
WP98.0  Baseline đo được
  └──→ WP98.1  Bảng tra 57 dạng bài, mã ổn định
         └──→ WP98.2  Cổng hạn ngạch · tier · khối mã, kèm ca âm
                ├──→ WP98.3  Lô A batch đầu — workbook 01  (lát dọc chứng minh đường ống)
                │      └──→ WP98.4  Lô A band 3-4 còn lại — workbook 02 · 03 · 05 · 06
                │             └──→ WP98.5  Lô A band 4-5 và 5-6 — workbook 10 · 11 · 15 · 18 · 19
                │                    │
                │                    └── CHECKPOINT 1: lô A xong, cổng phủ xanh
                │
                └──→ WP98.6  Lesson band 3-4      (song song được với lô A game level)
                       └──→ WP98.7  Lesson band 4-5
                              └──→ WP98.8  Lesson band 5-6
                                     │
                                     └── CHECKPOINT 2: 21 lesson ở draft, có dấu vết người đọc

CHECKPOINT 2
  └──→ WP98.9   4 hàng layout registry cho A1: number-bond-tree · ten-frame-split · horizontal-slot-track · matrix-slot-grid
         └──→ WP98.10  GT-007 cây tách gộp
                └──→ WP98.11  GT-008 kéo vào ô khuyết
                       └──→ WP98.12  Nội dung nhóm A1 — workbook 07 · 08 · 13 · 02 · 11 · 15
                              │
                              └── CHECKPOINT 3: cổng người nhóm A1 (D-RN)
                                     └──→ A2  GT-009 · GT-010 · GT-011   (1 layout mới, không system)
                                            └──→ B1  GT-012 · GT-013     (2 system)
                                                   └──→ B2  GT-014 tới GT-017  (4 system)
```

Nhóm A (`GT-007` tới `GT-011`) mở khoá **12 trên 16 workbook lô B** mà không thêm dòng system
nào. Đó là lý do WP98.9 tới WP98.12 nằm trước, và lý do nếu phải cắt thì cắt từ B2 lên.

Lô A và lô lesson **chạy song song được** — chúng không chia file nào, và lesson ở `draft` không
vào ma trận phủ nên không đụng cổng của lô A.

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP98.0 | S | Chụp baseline: `pnpm seed:report`, `pnpm check:coverage`, số hàng `game_levels` và `lessons` theo competency và band | Một file số đo trước, để mọi WP sau so được delta |
| WP98.1 | M | Bảng tra 57 dạng bài dưới `docs/montessori/dataset/`: mã ổn định `WB<nn>-D<n>`, band, competency, strand, lô A hay B, khuôn | Tổng khớp 57; mỗi hàng có đủ sáu cột; `pnpm lint:specs` xanh |
| WP98.2 | M | Cổng lô Montessori: hạn ngạch theo competency, `access_tier` theo `difficulty`, khối mã từ `0101`, một batch một workbook. Fixture vi phạm cho **từng** rule | Cổng đỏ trên bốn fixture sai; xanh trên seed hiện có |
| WP98.3 | S | Lô A batch đầu — workbook 01, 3 dạng bài, 6 level `GT-001` và `GT-003`, band 3-4 | `pnpm seed:check` xanh; `seed:content --dry-run` xanh; cổng phủ không tụt ô nào |
| WP98.4 | M | Lô A band 3-4 còn lại — workbook 02 · 03 · 05 · 06, 9 dạng bài, 18 level | Như trên, cộng: ô C1 và C4 band 3-4 tăng đúng số dự kiến |
| WP98.5 | M | Lô A band 4-5 và 5-6 — workbook 10 · 11 · 15 · 18 · 19, 7 dạng bài, 14 level | Như trên; tổng lô A đạt 19 dạng bài và 38 level |
| WP98.6 | M | 7 lesson band 3-4 cộng activity ngoài màn hình, seed `draft`; bảng thay giáo cụ được dùng và bổ sung khi thiếu hàng | Mỗi lesson có hoạt động ngoài màn hình làm hoạt động chính; không vật liệu nào phải mua; band 3-4 không vật dưới 3cm |
| WP98.7 | M | 7 lesson band 4-5 cộng activity | Như trên |
| WP98.8 | M | 7 lesson band 5-6 cộng activity | Như trên; tổng 21 lesson ở `draft` |
| WP98.9 | S | Bốn `LayoutId` của nhóm A1 vào registry, ánh xạ sang hàm lõi theo cột dự kiến ở mục 7.3 của spec khuôn; viết hàm mới trong `geometry.ts` **chỉ khi** hàng nào không ánh xạ được | `LAYOUT_IDS` tăng đúng 4; mỗi layout có test; ghi lại hàng nào cần hàm mới để trả lời câu hỏi mở số 6; layout ngoài registry vẫn ném `LAYOUT_NOT_SUPPORTED` |
| WP98.10 | M | `GT-007` cây tách gộp: file mô tả, Session class, 3 level mẫu, journey E2E, đăng ký `mechanic` | 15 điều kiện nghiệm thu ở mục 7.5 của [`montessori-template-batch.md`](../specs/01-platform/montessori-template-batch.md) xanh |
| WP98.11 | M | `GT-008` kéo vào ô khuyết, cùng hình dạng WP98.10 | Như trên |
| WP98.12 | M | Nội dung nhóm A1 — workbook 07 · 08 · 13 và dạng bài còn lại của 02 · 11 · 15 | `seed:check` xanh; hạn ngạch C1 còn lại đúng 0 |
| WP98.13 | S | Cổng người nhóm A1: đọc lại hạn ngạch, phủ, và chất lượng hai khuôn trước khi mở A2 | Quyết định ghi lại; A2 chỉ bắt đầu sau khi ghi |

Nhóm A2 (`GT-009` · `GT-010` · `GT-011`), B1 (`GT-012` · `GT-013`) và B2 (`GT-014` tới `GT-017`)
lặp đúng hình dạng WP98.9 tới WP98.13, với một khác biệt: nhóm B thay bước layout bằng bước
**viết system**, và mỗi system phải có test độc lập với khuôn dùng nó (`BR-MTB-15`). Không liệt
kê trước ở đây: mỗi nhóm mở sau một cổng người, và ước lượng trước cổng đó là ước lượng giả.

## 6. Acceptance criteria

```gherkin
Scenario: Cổng hạn ngạch có ca âm
  Given một batch Montessori đẩy C1 vượt 36 level
  When chạy cổng lô Montessori
  Then cổng thoát với mã khác 0
  And nêu competency, số hiện có và số vượt

Scenario: Cổng tier có ca âm
  Given một level Montessori difficulty 1 khai access_tier premium
  When chạy cổng lô Montessori
  Then cổng thoát với mã khác 0

Scenario: Lô A không cần khuôn mới
  When đọc template_code của mọi level thuộc batch lô A
  Then mọi giá trị nằm trong GT-001 tới GT-006

Scenario: Lô A không làm tụt ô phủ nào
  Given cổng phủ xanh trước lô A
  When nạp xong 38 level lô A và chạy lại cổng phủ
  Then không ô nào tụt dưới sàn
  And tỉ lệ cân bằng vẫn dưới ba lần

Scenario: Lesson lô Montessori không publish khi chưa có người duyệt
  When đọc status của 21 lesson Montessori
  Then mọi lesson ở draft
  And không lesson nào được ma trận phủ đếm

Scenario: Vật liệu lesson không phải mua
  When đọc materials của 21 lesson Montessori
  Then không lesson nào nêu tên một bộ giáo cụ thương mại
  And không lesson nào yêu cầu mua đồ chuyên dụng

Scenario: Band 3-4 không có vật nhỏ nuốt được
  When đọc materials của mọi activity band 3-4 trong lô
  Then không vật nào có đường kính dưới 3cm

Scenario: Khuôn mới đăng ký mechanic trong cùng PR
  Given PR ship GT-007
  When đọc diff
  Then mục 7.1 của content-tagging.md có thêm đúng một giá trị mechanic

Scenario: Nội dung lô B bị chặn khi khuôn chưa active
  Given GT-007 chưa active
  When chạy seed:check trên batch workbook 07
  Then cổng 1 fail

Scenario: Mã Montessori không đụng khối đã seed
  When đọc mã của mọi bản thuộc batch có tiền tố SEED-MONT
  Then mọi số thứ tự từ 0101 trở lên
```

## 7. Verification

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm lint                 # biome check ., KHÔNG dùng ultracite check
pnpm lint:specs
pnpm lint:rule-ids
pnpm typecheck
pnpm seed:check
pnpm seed:content --dry-run
pnpm check:coverage
pnpm seed:report
pnpm test
```

## 8. Definition of done

- Bảng tra 57 dạng bài tồn tại, mã ổn định, tổng khớp số đo.
- Cổng lô Montessori có **ca âm cho từng rule**, không chỉ cho một rule.
- Lô A: 19 dạng bài, 38 level `published`, không ô phủ nào tụt, tỉ lệ cân bằng dưới ba lần.
- 21 lesson và activity ở `draft`, mỗi lesson có hoạt động ngoài màn hình làm hoạt động chính.
- Bốn layout của nhóm A1 vào registry, mỗi layout có test riêng.
- Nhóm khuôn A1: `GT-007` và `GT-008` qua đủ 15 điều kiện nghiệm thu, mỗi khuôn có journey E2E
  và một bước kiểm soát lỗi tự thân.
- Nội dung nhóm A1 nạp xong; hạn ngạch C1 dùng hết đúng 36.
- Bốn spec Montessori lật `implemented` **chỉ khi** cả bốn nhóm khuôn xong; sau nhóm A1 chúng
  vẫn ở `approved`.
- Mọi PR có người review đọc từng bản, không merge tự động.

## 9. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| 18 workbook thiếu gợi ý sư phạm; người biên soạn viết vội cho đủ | Cao | `BR-MCM-09` chặn ở cổng duyệt; WP98.3 làm mẫu ba mức cho workbook 01 trước, dùng làm chuẩn cho phần còn lại |
| Cổng hạn ngạch chỉ có một ca âm rồi coi là đủ | Cao | Định nghĩa done của WP98.2 đòi fixture riêng cho **từng** rule. Đây là đúng cái bẫy mà `ultracite check` và `nuxt typecheck` đã mắc |
| Trần C1 chạm sớm, workbook cuối không còn hạn ngạch | Trung bình | Thứ tự ưu tiên ở mục 7.5 của spec level đã cố định; `pnpm seed:report` in hạn ngạch còn lại sau mỗi batch |
| Lesson `draft` nằm im vô hạn vì không có chuyên gia | Trung bình | `D-RT` làm trạng thái này đọc được; nợ nằm ở câu hỏi mở số 1 của [`lesson-model.md`](../specs/05-content/lesson-model.md), không bị chôn |
| Khuôn mới đội chi phí, nhóm B2 không bao giờ tới | Trung bình | `D-RN` cắt từ B2 lên. Nhóm A đã mở khoá 12 trên 16 workbook lô B mà không cần system nào |
| Bảy `LayoutId` nhóm A hoá ra cần hàm hình học mới, chi phí nhóm A tăng | Thấp | WP98.9 kiểm giả thuyết ngay ở khuôn đầu, trước khi cam kết lịch cho A2 |
| Emoji cần cho workbook chưa có trong registry | Thấp | Cổng 3 bắt ở `seed:check`; đăng ký trước hoặc đổi vật liệu |

## 10. Cái gì KHÔNG thuộc Task #98

- Siết nhánh slug dự phòng của trục `what` và `thinking`. Nợ đó làm đỏ khoảng 139 nội dung đã
  seed và cần gắn lại tag trước.
- Sửa 13 đoạn mechanic đã seed trong mã level. Mã published bất biến (`D-RP`).
- Ghép lesson Montessori vào chương trình (`D-RU`).
- Thêm nguồn nội dung cho C5 và C6 (`D-RJ`).
- Nạp 24 dạng bài còn lại (`D-RQ`).
- Nêu tên nguồn PDF ra công khai, hoặc dùng lại ảnh chụp trang (`D-RG` để ngỏ phần này).
- Khuôn tô nét số (`trace-path`). Nguồn chỉ nhắc ở dòng mục tiêu của workbook 01, không có dạng
  bài nào — xem mục 7.6 của [`montessori-corpus-mapping.md`](../specs/05-content/montessori-corpus-mapping.md).
