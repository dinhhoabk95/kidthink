# Kế hoạch — Task #100: Chuỗi vòng trong một màn chơi (P1 vá + P2 tính năng)

> **Loại task:** vá một lỗ đang chảy máu, cộng một tính năng mới (L). Checklist: [`100-round-sequence-todo.md`](100-round-sequence-todo.md).
> **Không bị task nào chặn.** Chặn [`Task #101`](101-legacy-v1-templates-plan.md) qua `BR-LVB-09`.
> **Spec đóng:** [`round-set-model.md`](../specs/05-content/round-set-model.md) (P2, 13 rule, 10 scenario) và [`round-sequence-play.md`](../specs/04-play/round-sequence-play.md) (P2, 14 rule, 13 scenario).

## 1. Outcome

Một `game_level` chạy được **nhiều câu hỏi nối tiếp** trong một phiên: trẻ làm xong vòng này thì
sang vòng kế mà không rời màn chơi và không gọi mạng.

Hai spec, một task, vì tách ra thì mỗi nửa vô dụng: mô hình nội dung xong mà runtime chưa xong là
dữ liệu không ai chơi được; runtime xong mà mô hình chưa xong là một bộ chạy không có gì để chạy.

Điểm cần nói thẳng: **WP100.0 không phải phần của tính năng.** Nó là vá một lỗ đã đang gây thiệt
hại mỗi ngày, và nó ship được một mình. Nếu phần còn lại của task trượt phase, WP100.0 vẫn phải đi.

## 2. Bằng chứng đo được (2026-08-21)

1. **Không session production nào phát `round_started`.** Quét toàn bộ `packages` và `apps`: ba
   chỗ nhắc tới nó đều là test. Không có emitter thật.
2. Hệ quả tính được tại [`packages/shared/src/scoring.ts`](../../packages/shared/src/scoring.ts):
   `rounds_total = 0` nên `first_try_ratio = 0`, và không có guard. Với
   `SCORING_WEIGHTS.FIRST_TRY = 0.6`, `normalized_score` trần ở **0,4**; ngưỡng hai sao là
   **0,55**. Mọi trẻ hoàn thành mọi màn chơi hôm nay nhận **đúng một sao**, và adaptive engine
   nhận `correct_ratio ≤ 0,4` cho tất cả.
3. Từ vựng vòng **đã có sẵn** trong mục 7.2 của
   [`event-catalog.md`](../specs/00-foundation/event-catalog.md): `round_started`,
   `question_shown`, `answer_correct`, `round_completed`, `round_retried`, `round_skipped`.
   Không phải thiết kế mới, chỉ chưa có ai phát.
4. Payload config ở mục 7.1 của
   [`game-config-delivery.md`](../specs/04-play/game-config-delivery.md) **đã khai**
   `"scoring": { "mode": "rounds", "max_rounds": 5 }`. Trường này chưa có nghĩa vì không có
   `rounds[]` đi kèm.
5. Cột `game_levels.content_pack` là **một** jsonb. Đã quét mục 7.4 của
   [`schema-content-taxonomy.md`](../specs/01-platform/schema-content-taxonomy.md): không có
   khái niệm vòng ở tầng schema.
6. `GameEngine.loop()` đã gọi `activeSession?.update?.(deltaMs)` mỗi frame, và
   `TemplateGameSession` đã tách "phán quyết thuần" khỏi "chuyển state". Hai thứ đó là toàn bộ
   hạ tầng mà `RoundRunner` cần — không phải viết mới.

## 3. Assumptions và ranh giới

1. **Cấm sửa hợp đồng `GameSession`.** `BR-RSP-03` là ràng buộc cứng của task. `RoundRunner`
   bọc `TemplateGameSession`; 17 template hiện có không đổi một dòng nào.
2. **Cấm đổi `content_contract` của khuôn đã publish.** Vòng là dữ liệu ở tầng level, không phải
   ở tầng khuôn. Đây là lý do phương án "biến mọi `content_contract` thành mảng" bị loại.
3. **Set một vòng là mặc định khi migrate.** Toàn bộ level đã seed chạy tiếp không cần soạn lại
   (`BR-RSM-09`).
4. **Bảo toàn hành vi của 17 khuôn.** Test khuôn phải cho **cùng kết quả** trước và sau, không
   chỉ "vẫn xanh". Chụp danh sách `trạng-thái | tên-test` trước và sau, yêu cầu trùng khít.
5. **Không nối tiếp phiên bỏ dở** (`BR-RSP-07`). Phiên là đơn vị đo; nối nửa phiên làm
   `rounds_total` của hai lượt không so được.
6. Ba câu hỏi cần người quyết trước khi code chạm vào: hình dạng schema, cách vá điểm ở WP100.0,
   và câu chữ mục 7.2 của [`event-catalog.md`](../specs/00-foundation/event-catalog.md).

## 4. Thứ tự

```text
WP100.0  Vá điểm — ship độc lập, không chờ gì
  │        [CHECKPOINT A: sao đã đúng chưa, trước khi làm tiếp]
  └──→ WP100.1  Quyết định schema + câu chữ event catalog (cổng người)
         └──→ WP100.2  Bảng vòng + migration expand
                └──→ WP100.3  Cổng publish ép 13 rule biên tập, kèm ca âm
                       │        [CHECKPOINT B: dữ liệu đúng, chưa ai chơi được]
                       └──→ WP100.4  Config delivery trả rounds[]
                              └──→ WP100.5  RoundRunner trong engine
                                     │        [CHECKPOINT C: chạy headless hết set]
                                     ├──→ WP100.6  Bề mặt chơi: chuyển vòng, chỉ báo, ăn mừng
                                     └──→ WP100.7  Cổng chống hồi quy ở complete
                                            └──→ WP100.8  Verification, lật status
```

## 5. Work packages

| ID | Cỡ | Công việc | Kết quả kiểm được |
|---|---:|---|---|
| WP100.0 | S | Vá `first_try_ratio` khi `rounds_total = 0`. Mặc định đề xuất: điểm rơi về `accuracy` nguyên phần, không nhân 0,4. Ghi quyết định vào câu hỏi còn mở số 2 của [`round-sequence-play.md`](../specs/04-play/round-sequence-play.md) | Test: phiên không có `round_started` và trả lời đúng hết đạt 3 sao. Ca âm: test cũ khẳng định trần 0,4 phải đỏ trước khi sửa |
| WP100.1 | S | Chốt ba việc: bảng con hay jsonb; cách vá điểm ở WP100.0; câu chữ mục 7.2 của [`event-catalog.md`](../specs/00-foundation/event-catalog.md) | Ba quyết định ghi vào spec kèm lý do; không để lửng |
| WP100.2 | M | `game_level_rounds` theo mục 7.2 của [`round-set-model.md`](../specs/05-content/round-set-model.md); migration expand-contract copy `content_pack` hiện có thành `round_index = 0` | `pnpm lint:migration-expand` xanh; mọi level đã seed có đúng một hàng vòng; đọc level cũ cho kết quả y hệt trước migration |
| WP100.3 | M | Cổng publish ép `BR-RSM-01` tới `BR-RSM-13`, trả `422` kèm `round_index` vi phạm | Cổng đỏ trên fixture vi phạm từng rule; xanh trên corpus hiện có. Ca âm bắt buộc theo `BR-TYP-07` |
| WP100.4 | M | Payload config trả `rounds[]` và `scoring.mode`; đo trần 200 KB gzipped **cả set** (`BR-RSM-10`) | Set 6 vòng có ảnh vượt trần bị chặn kèm số byte đo được; set hợp lệ trả đủ vòng trong một response |
| WP100.5 | L | `RoundRunner`: con trỏ vòng, dựng session mỗi vòng, `destroy()` session cũ **trước**, phát `round_started` và `round_completed` | Chạy headless hết set 4 vòng; `getNetworkRequestCount()` trả 0; snapshot hành vi 17 khuôn trùng khít trước và sau |
| WP100.6 | M | Bề mặt chơi: chuyển vòng, chỉ báo tiến độ phi ngôn ngữ, ăn mừng chỉ ở cuối set, scaffolding reset mỗi vòng | `pnpm lint:kid-surface` xanh; không phần tử nào hiện chữ số tiến độ; không đường nào đếm ngược chuyển vòng |
| WP100.7 | S | `complete` trả `422 VALIDATION_FAILED` khi `scoring.mode` là `rounds` mà chuỗi event không có `round_started` nào | Cổng đỏ trên chuỗi event thiếu; xanh trên chuỗi đủ. Đây là cổng ngăn lỗ ở mục 2 quay lại |
| WP100.8 | S | Verification đầy đủ; lật `status` hai spec sang `implemented` | 27 rule có test mang ID; `pnpm check` và `pnpm test` giữ nguyên baseline |

## 6. Acceptance criteria

```gherkin
Scenario: WP100.0 — vá điểm, sao không còn trần một
  Given một phiên không phát round_started nào
  And trẻ trả lời đúng mọi lần ngay lần thử đầu
  When server tính kết quả
  Then normalized_score vượt ngưỡng hai sao

Scenario: WP100.2 — migration không đổi hành vi level cũ
  Given một level đã seed với một content_pack
  When chạy migration expand
  Then level đó có đúng một hàng game_level_rounds với round_index 0
  And mở level đó cho kết quả y hệt trước migration

Scenario: WP100.3 — cổng biên tập có ca âm
  Given một round set leo hai chiều độ khó cùng lúc
  When gửi duyệt
  Then trả 422 VALIDATION_FAILED
  And details.fields[] nêu round_index vi phạm

Scenario: WP100.5 — 17 khuôn không đổi hành vi
  Given snapshot kết quả test của 17 khuôn trước khi thêm RoundRunner
  When RoundRunner đã vào engine
  Then danh sách trạng-thái và tên-test trùng khít snapshot cũ

Scenario: WP100.5 — không gọi mạng giữa hai vòng
  Given một round set 4 vòng đã nạp
  When trẻ chơi hết cả 4 vòng
  Then getNetworkRequestCount trả 0

Scenario: WP100.5 — session vòng cũ bị huỷ trước vòng mới
  Given trẻ vừa xong vòng 1
  When engine dựng session của vòng 2
  Then destroy của session vòng 1 đã được gọi trước đó

Scenario: WP100.6 — trẻ không thấy chữ số tiến độ
  When đọc mọi phần tử hiển thị trong lúc chơi một round set
  Then không phần tử nào chứa chữ số dạng tiến độ vòng

Scenario: WP100.7 — thiếu round_started bị bắt ở cổng
  Given scoring.mode là rounds
  And chuỗi event không có round_started nào
  When client gọi complete
  Then trả 422 VALIDATION_FAILED
```

## 7. Verification

```bash
export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm lint
pnpm lint:specs
pnpm lint:migration-expand
pnpm lint:kid-surface
pnpm check
pnpm vitest run packages/shared packages/game-engine
pnpm typecheck:web
pnpm test
```

`pnpm test` và `pnpm typecheck:web` là cổng **delta**, không phải cổng xanh: đếm trước khi sửa,
yêu cầu không tăng. Baseline hiện tại ghi trong [`../../CLAUDE.md`](../../CLAUDE.md).

## 8. Definition of done

- Điểm không còn trần 0,4 khi phiên không có vòng; quyết định ghi vào spec.
- `game_level_rounds` tồn tại; mọi level đã seed có đúng một hàng vòng; hành vi level cũ không đổi.
- Cổng publish ép đủ 13 rule biên tập, mỗi rule có ca âm.
- Config trả cả set trong một response, trần 200 KB đo trên cả set.
- `RoundRunner` chạy hết set mà không gọi mạng và không sửa hợp đồng `GameSession`.
- Snapshot hành vi 17 khuôn trùng khít trước và sau.
- Bề mặt chơi không có chữ số tiến độ, không đếm ngược, ăn mừng chỉ ở cuối set.
- Cổng `complete` bắt được chuỗi event thiếu `round_started`.
- 27 rule có test mang ID; hai spec lật `implemented`.
