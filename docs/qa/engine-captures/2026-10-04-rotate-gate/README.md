
## QA cuối trên DB dev content v3 (2026-10-04)

Playwright + CDP chạm thật, 390x844, DB dev đã gieo `content_version = 3` (`253829cf`). Tài khoản `parent.standard` (Bé Đậu) và `parent.pro` (Bé Sóc).

| Kiểm | Kết quả |
|---|---|
| GT-035 `GL-C1-ALG-CMD-0009`, `-0010`, `GL-C2-DIR-CMD-0004` ở 390x844 | **ĐẠT**: `overflowsStage()` false, 24 ô (trước 27, 6 ô ngoài canvas), lưới 4×3, hàng lệnh và nút chạy hiện đủ. Chưa chơi hết vòng ba seed này |
| Intro `GL-C1-CMP-INTRO-0004` (cho `GL-C1-CMP-PAIR-0001`) | **ĐẠT**: 36/36 bước, mọi bước `recall` có đáp án trong ô chọn, hiện "Đã học xong", session GT-000 `completed`, score 1, 3 sao |
| GT-026 vòng đúng dưới 60 % (`GL-C4-HOM-GNG-0001`, bỏ lỡ lượt go, chạm lượt nogo) | **ĐẠT** (`BR-E026-05`): đủ 3 vòng, hiện màn thưởng, `completed`, score 0, **1 sao** (sàn) |
| GT-026 nút DOM của entity theo thời gian thực | **ĐẠT**: có 1 nút `sr-only` khi kích thích hiện, 0 nút giữa hai lượt |
| Điểm GT-026 untimed 24/24 đúng | **ĐẠT sau sửa**: `completed`, score 3, **3 sao** |
| Điểm GT-027 (12 lần đúng, 3 vòng) | **ĐẠT**: score 3, 3 sao |
| Điểm GT-031 (`GL-C1-ADD-PICT-0002`, tap-tap, 3 vòng) | **ĐẠT**: score 3, 3 sao |

### Hai lỗi thật lộ ra và đã sửa

1. **24/24 đúng vẫn chỉ 2 sao (GT-026).** `telemetry_events` có `round_started` ×7, `round_completed` ×6 cho 3 vòng: session tự ghi thêm `round_started`/`round_completed {round_index: 0}` cộng bản của `RoundRunner`. `rounds_total` đếm `round_started` nên `first_try_ratio` = 3/7. Sửa `f62142c7`: runner là nguồn duy nhất của hai event (`BR-RSP-12`), test `round-runner-lifecycle-events.test.ts`.
2. **Trẻ đã làm quen ở v1 bị đòi làm lại (`INTRO_REQUIRED`).** `findCompletedLevelIds` đối chiếu `game_levels.id` của bản đang published; v1 đã archive nên id đổi và bài làm quen đã hoàn thành không còn tính. Bé Đậu (có GT-000 hoàn thành ở `GL-C2-GEO-INTRO-0001`, `GL-C4-DET-INTRO-0001`…) bị chặn ở GT-026/027. Sửa `64d19aaf`: đối chiếu theo mã level (`BR-CIG-08`), test `intro-completion-across-versions.test.ts`.

### Rủi ro bản v1 đã archive (workstream K)

- `/api/users/play/map`, `/home`, `/dashboard`, `/stickers`, trang `/play` và `/me` của Bé Đậu (có phiên cũ trên v1): **200**, không lỗi.
- `level_params` rỗng và không có mã server nào đọc — không ảnh hưởng.
- Còn đối chiếu theo `game_levels.id`: `services/recommendation.ts` (`allPlayedLevelIdSet`, `recentLevelIds`) — level từng chơi ở v1 không còn tính là "đã chơi" khi gợi ý. Nhẹ, chưa sửa.
- `answer_incorrect` chỉ ghi cho cử chỉ của trẻ; lượt bỏ lỡ (`miss` do hết giờ) của GT-026 không có verdict nên không vào điểm.
- `game_started`/`game_completed` giờ **mỗi vòng một lần** (3 vòng → 3), không phải một lần mỗi phiên.
- Console có `Hydration completed but contains mismatches` ở `/me` (chưa tra).

Máy chủ dev đã dừng, script tạm đã xoá, khoá `rl:*` Valkey dev xoá nhiều lần để đăng nhập.

## QA quy tắc điểm mới + GT-035 + `/me` (workstream R, 2026-10-04)

Playwright + CDP chạm thật, 390x844, DB dev content v3, `GL-C4-HOM-GNG-0001` (GT-026 có tính giờ, 3 vòng × 8 lượt: `ggggggnn ggggggnn gggggnng`), Bé Đậu (`parent.standard`) và Bé Sóc (`parent.pro`). Đọc `play_sessions` và `telemetry_events` trực tiếp.

| Kiểm | Kết quả |
|---|---|
| GT-026 để trống (không chạm gì) | **ĐẠT** `BR-E026-06`: `answer_incorrect` ×18 (lượt `go` bỏ lỡ) + `answer_correct` ×6 (lượt `nogo` kìm được) = 24; score 0, 1 sao |
| GT-026 chạm đúng cả 24 lượt (chỉ chạm `go`) | **ĐẠT**: `answer_correct` ×24; score 3, **3 sao** |
| GT-026 chạm nhầm một lượt `nogo` | **ĐẠT** quy tắc `first_try_ratio`: `answer_correct` ×23 + `answer_incorrect` ×1; score 2, **2 sao** (một vòng không còn đúng ngay) |
| GT-026 chạm cả `go` lẫn `nogo` | `answer_correct` ×18, `answer_incorrect` ×6 (mỗi vòng có 2 `nogo`) → mọi vòng có sai → score 0, 1 sao — **bằng điểm bỏ trống** (xem lưu ý 2) |
| GT-035 `GL-C1-ALG-CMD-0009`, `-0010`, `GL-C2-DIR-CMD-0004` chơi hết 3 vòng (BFS ra `tiến ×3`, chạm bảng lệnh rồi nút chạy) | **ĐẠT** cả ba: `completed`, score 3, 3 sao; bàn 4×3 + 8 ô chương trình + 4 lệnh + nút chạy vừa 390x844 |
| `/me` sau đăng nhập (cả hai tài khoản) | **ĐẠT**: HTML SSR có khối "Hồ sơ các bé" và "Đang xem" (không rơi nhánh "Chào mừng"), 0 cảnh báo hydration trên client |

### Lưu ý

1. **Lượt đầu mỗi vòng GT-026 hiện kích thích trong lúc cổng cử chỉ còn đóng** (câu dẫn đang đọc, `BR-PNR-11`). Chạm một lần ở lúc đó bị nuốt im lặng, đồng hồ chạy lại khi cổng mở và lượt hết giờ → `answer_incorrect`. Chạm lặp mỗi 300 ms thì đúng. Trẻ 3–6 tuổi thường chạm một lần: nên ẩn kích thích tới khi cổng mở hoặc nhận chạm sớm. Chưa sửa (cần quyết định spec `BR-E026-04`).
2. **Điểm GT-026 không phân biệt 75 % đúng với bỏ trống:** với quy tắc `first_try_ratio` mới (vòng chỉ tính khi không có `answer_incorrect`), vòng 8 lượt có 2 `nogo` chạm nhầm đều 0 điểm. Đúng theo spec `scoring-and-result.md` §7.1 nhưng thang điểm thô cho GT-026.
3. **`game_started`: GT-026 chỉ 1 lần cho 3 vòng, GT-035 3 lần (mỗi vòng một lần)** — vòng đời không đồng nhất giữa engine (`game_completed` đều 3).
4. **Chưa kiểm được:** GT-025 `GL-C2-GEO-SPOT-0001` và GT-031 `GL-C1-ADD-PICT-0002` — chạm bằng chuột, `touchscreen`, CDP và nút DOM đều không làm session tiến (90 s, `in_progress`, 0 telemetry), trong khi GT-026 (nút DOM) và GT-035 (CDP chạm toạ độ) chạy đúng. Chưa rõ lỗi do bộ chạy hay do engine; cần tay thật hoặc script riêng. Nhánh "sai một lần rồi thắng" ở engine nhiều bước vì thế chỉ kiểm bằng GT-026 (8 lượt/vòng), chưa bằng engine chọn/ghép; GT-035 chạy sai rồi sửa chưa rõ cách xoá hàng lệnh bằng chạm, chưa chạy xong.
5. `Đã chơi: 0 ngày` ở `/me` dù Bé Đậu vừa chơi nhiều phiên: số lấy từ `child_daily_stats` (worker tổng hợp), worker không chạy ở dev — không phải lỗi mã.
6. Khoá `rl:*` Valkey dev đã xoá nhiều lần để đăng nhập; máy chủ dev đã dừng, script tạm đã xoá.

