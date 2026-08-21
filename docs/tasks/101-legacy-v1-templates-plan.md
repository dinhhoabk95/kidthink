# Kế hoạch — Task #101: Lô khuôn kế thừa v1 (P5)

> **Loại task:** thêm bảy khuôn mới, không tái cấu trúc (XL). Checklist: [`101-legacy-v1-templates-todo.md`](101-legacy-v1-templates-todo.md).
> **Chặn bởi** [`Task #100`](100-round-sequence-plan.md) — `BR-LVB-09` bắt mọi khuôn lô này phát event vòng ngay ở phiên bản đầu.
> **Spec đóng:** [`legacy-v1-template-batch.md`](../specs/01-platform/legacy-v1-template-batch.md) (P5, 15 rule, 15 scenario).

## 1. Outcome

Bảy khuôn `GT-018` tới `GT-024` phủ **13 trong 15** dạng bài của bản v1 mà mười bảy khuôn hiện có
không chạy được. Hai dạng bài còn lại có một hàng ghi lý do không port.

Sau task này, câu hỏi "cơ chế chơi nào của v1 chưa có ở v2" trả lời được bằng một lệnh chạy,
không bằng cách đọc lại 60 file Session của bản cũ.

Điểm cần nói thẳng: **đây là thêm mới, không phải tái cấu trúc.** Rủi ro lớn nhất không phải làm
hỏng thứ đang chạy mà là **cấp mã sai** — mã `GT-*` bất biến, cấp bừa là hỏng vĩnh viễn.

## 2. Bằng chứng đo được (2026-08-21)

Đo trên [`packages/game-engine/src`](../../packages/game-engine/src).

1. Bốn nguyên thuỷ cơ chế đã có: `ordering`, `pairing`, `placement`, `selection`. Lô này
   **không cần thêm nguyên thuỷ nào**.
2. **19** `LayoutId` trên **12** hàm hình học, và **cả 19 đều đang được ít nhất một khuôn dùng**.
   Không có layout nhàn rỗi để tiêu; nhóm B cần **2** layout mới.
3. Sáu system riêng của khuôn đã có: `timerSystem` · `mazeSystem` · `balanceSystem` ·
   `constraintSystem` · `rotationSystem` · `isometricSystem`. Lô này cần **5** system mới.
4. `AudioController` và `SpeechSynthesisAdapter` (`vi-VN`, chỉ phát, không xin quyền microphone)
   đã dựng sẵn tại [`packages/game-engine/src/core.ts`](../../packages/game-engine/src/core.ts),
   nhưng **không khuôn nào trong mười bảy khuôn dùng nó làm cơ chế chơi**. `GT-018` là khuôn đầu
   tiên tiêu nó — đó là lý do nó phục vụ ba dạng bài mà nằm ở nhóm chi phí thấp nhất.
5. `packages/game-engine/scripts/create-template.ts` đã có và nhận đúng ba tham số. `pnpm --filter @mindkid/game-engine gen:templates` sinh lại mọi
   điểm nối, nên chi phí "sửa tay mười một nơi" đã được
   [`Task #97`](97-template-authoring-kit-plan.md) đóng.
6. Mười một khuôn `GT-007` tới `GT-017` của [`Task #99`](99-montessori-template-designs-plan.md)
   đã ship. Mã kế tiếp còn trống là `GT-018`.

## 3. Assumptions và ranh giới

1. **Port cơ chế, không port code.** Cấm chép Session class của v1. Session viết mới trên bốn
   nguyên thuỷ dùng chung (`BR-LVB-03`).
2. **Chỉ thêm, không sửa.** Cấm đổi `content_contract` của bất kỳ khuôn nào trong `GT-001` tới
   `GT-017` (`BR-LVB-11`).
3. **Mã cấp theo lớp chi phí, không theo thứ tự bảng nguồn.** `GT-018` và `GT-019` không thêm
   file nào dưới `systems/`; `GT-020` tới `GT-024` mỗi khuôn đúng một system.
4. **Hạ band thay vì nới cử chỉ.** `GT-024` vẽ theo nét là kéo liên tục và không có đường
   chạm-chạm tương đương, nên nó khai `banned_age_bands: ["3-4"]` chứ không nới cử chỉ để phủ
   thêm band (`BR-LVB-06`).
5. **`free-create` không port.** Khuôn không có đáp án đúng làm `checkWinCondition()` vô nghĩa và
   đẩy `correct_ratio` bịa vào adaptive. Mở lại cần một quyết định sản phẩm, không phải một
   quyết định kỹ thuật.
6. **Ba khuôn ngoài lô.** `spot-difference`, `go-nogo`, `rule-switch` không có dạng bài v1 nào
   dùng. Chúng phục vụ khoảng trống taxonomy, và ghép vào đây làm cổng hoàn tất mất nghĩa.

## 4. Thứ tự

Nhóm A trước, và **không phải vì nó dễ**: nó là lát cắt dọc rẻ nhất chứng minh cả đường ống —
mã, mechanic, level mẫu, event vòng, cổng nghiệm thu — trước khi bỏ tiền vào năm system mới.

```text
WP101.0  Quyết định người: ba khuôn ngoài lô, và free-scene là gì
  └──→ WP101.1  Đăng ký 7 giá trị mechanic vào từ vựng, kèm ca âm
         └──→ WP101.2  GT-018 listen-respond — lát cắt dọc đầu tiên
                └──→ WP101.3  GT-019 rotate-transform
                       │        [CHECKPOINT A: nhóm A xong, đo lại chi phí thật]
                       ├──→ WP101.4  GT-020 memory-flip   (cardSystem)
                       ├──→ WP101.5  GT-021 mirror-complete (mirrorSystem)
                       ├──→ WP101.6  GT-022 hidden-object (sceneSystem + free-scene)
                       ├──→ WP101.7  GT-023 construct     (assemblySystem)
                       └──→ WP101.8  GT-024 trace-path    (traceSystem)
                              │        [CHECKPOINT B: bảy khuôn chạy được]
                              └──→ WP101.9  Cổng hoàn tất lô, kèm ca âm
                                     └──→ WP101.10  Verification, lật status
```

WP101.4 tới WP101.8 **làm song song được** — mỗi khuôn một system riêng, không khuôn nào đọc
system của khuôn khác.

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP101.0 | S | Chốt câu hỏi còn mở số 1 (ba khuôn ngoài lô) và số 3 (`free-scene` là `LayoutId` thật hay chế độ ngoài layout engine) | Hai quyết định ghi vào spec kèm lý do |
| WP101.1 | S | Thêm 7 giá trị `mechanic` vào từ vựng trục `mechanic` của [`content-tagging.md`](../specs/01-platform/content-tagging.md) | Cổng phủ đỏ khi khuôn khai `mechanic` chưa đăng ký; ca âm bắt buộc |
| WP101.2 | M | `GT-018` `listen-respond` trên `AudioController` đã có; phủ C3-04, C3-08, C5-01 | Ba level mẫu chạy được; phát `round_started`; không xin quyền microphone; `pnpm --filter @mindkid/game-engine gen:templates` không đổi file viết tay ngoài thư mục khuôn |
| WP101.3 | S | `GT-019` `rotate-transform` mở rộng `rotationSystem`; xoay bằng nút góc 90 độ | Không file mới dưới `systems/`; không đường nào xoay bằng cử chỉ hai ngón; ba level mẫu |
| WP101.4 | M | `GT-020` `memory-flip` + `cardSystem`; dùng lại layout `card-flip-grid` và `timerSystem` | `cardSystem` có test chạy được **không nạp** `GT-020`; ba level mẫu; band 3–6 |
| WP101.5 | M | `GT-021` `mirror-complete` + `mirrorSystem` + layout `mirror-axis-split` | Layout vào registry **trước** khi viết Session; `mirrorSystem` có test độc lập; ba level mẫu |
| WP101.6 | L | `GT-022` `hidden-object` + `sceneSystem` + `free-scene` | Toạ độ tự do tái lập được với cùng seed; `sceneSystem` có test độc lập; ba level mẫu |
| WP101.7 | L | `GT-023` `construct` + `assemblySystem`; snap về mỏ neo, có fallback chạm-chạm | `assemblySystem` có test độc lập; đường chạm-chạm chạy thật; đo bundle so trần 80 KB |
| WP101.8 | M | `GT-024` `trace-path` + `traceSystem`; khai `banned_age_bands: ["3-4"]` | `traceSystem` có test độc lập; band 3–4 bị chặn ở cổng, không phải ở lời khuyên |
| WP101.9 | S | Cổng hoàn tất lô theo mục 7.4 của spec: mọi dạng bài v1 hoặc trỏ được tới một mã, hoặc có hàng ở mục 7.3 | Cổng đỏ khi thêm một dạng bài mồ côi vào fixture; xanh trên bảng thật |
| WP101.10 | S | Verification đầy đủ; lật `status` | 15 rule có test mang ID; `pnpm check` xanh; bundle mỗi khuôn trong trần |

## 6. Acceptance criteria

```gherkin
Scenario: WP101.1 — mechanic chưa đăng ký bị chặn
  Given khuôn GT-018 khai mechanic listen-respond
  And từ vựng trục mechanic chưa có giá trị đó
  When chạy cổng phủ
  Then cổng thoát với mã khác 0

Scenario: WP101.2 — khuôn âm thanh không xin quyền microphone
  When đọc mọi đường mã của GT-018
  Then không đường nào gọi API thu âm
  And không đường nào xin quyền microphone

Scenario: WP101.2 — khuôn lô này phát event vòng
  Given một phiên chơi GT-018 hoàn thành
  When đọc chuỗi telemetry
  Then chuỗi chứa ít nhất một round_started
  And chuỗi chứa ít nhất một round_completed

Scenario: WP101.3 — mã nhóm A không thêm system
  When đọc GT-018 và GT-019
  Then không file nào được thêm dưới thư mục systems

Scenario: WP101.4 — system có test độc lập với khuôn
  When chạy bộ test của cardSystem
  Then bộ test chạy xong mà không nạp GT-020

Scenario: WP101.6 — cảnh tái lập được với cùng seed
  Given một phiên chơi GT-022 với một seed cố định
  When chạy lại phiên với cùng seed
  Then vị trí mọi vật trong tranh giống hệt lần trước

Scenario: WP101.8 — khuôn không fallback được thì cấm band thấp
  When đọc khuôn GT-024
  Then banned_age_bands chứa 3-4
  And requires_tap_fallback là false

Scenario: WP101.9 — cổng hoàn tất bắt dạng bài mồ côi
  Given một dạng bài v1 không trỏ tới mã GT nào
  And nó cũng không có hàng ở mục 7.3 của spec
  When chạy cổng hoàn tất lô
  Then cổng thoát với mã khác 0
  And nêu tên dạng bài đó

Scenario: WP101.10 — khuôn mới không đụng contract cũ
  Given cây làm việc trước khi thêm lô
  When bảy khuôn đã ship
  Then không content_contract nào của GT-001 tới GT-017 bị đổi
```

## 7. Verification

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm --filter @mindkid/game-engine gen:templates
pnpm lint
pnpm --filter @mindkid/gates test
pnpm check
pnpm vitest run packages/game-engine
pnpm test
```

Sau `pnpm --filter @mindkid/game-engine gen:templates`, kiểm cây làm việc: không file viết tay nào ngoài thư mục khuôn vừa
thêm được phép đổi (`BR-LVB-08`).

## 8. Definition of done

- Bảy khuôn `GT-018` tới `GT-024` tồn tại, tuần tự, không bỏ trống số ở giữa.
- Không hai khuôn nào trùng giá trị `mechanic`; cả bảy `mechanic` đã vào từ vựng.
- `GT-018` và `GT-019` không thêm file nào dưới `systems/`; `GT-020` tới `GT-024` mỗi khuôn đúng một system.
- Mỗi system mới có bộ test chạy được không nạp khuôn dùng nó.
- Mỗi khuôn có ≥3 game level mẫu chạy được và phát `round_started` cùng `round_completed`.
- Không `content_contract` nào của `GT-001` tới `GT-017` bị đổi.
- Mỗi khuôn ≤80 KB gzipped, kèm system riêng của nó.
- Cổng hoàn tất lô chạy được và có ca âm.
- 15 rule có test mang ID; spec lật `implemented`.
