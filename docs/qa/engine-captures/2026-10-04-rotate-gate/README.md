
## QA cuối trên DB dev content v3 (2026-10-04)

Playwright + CDP chạm thật, 390x844, DB dev đã gieo `content_version = 3` (`253829cf`). Tài khoản `parent.standard` (Bé Đậu) và `parent.pro` (Bé Sóc).

| Kiểm | Kết quả |
|---|---|
| GT-035 `GL-C1-ALG-CMD-0009`, `-0010`, `GL-C2-DIR-CMD-0004` ở 390x844 | **ĐẠT**: `overflowsStage()` false, 24 ô (trước 27, 6 ô ngoài canvas), lưới 4×3, hàng lệnh và nút chạy hiện đủ (`gt035-GL-C1-ALG-CMD-0009-m390x844-v3.jpg` không lưu — chụp thử, xem số liệu). Chưa chơi hết vòng ba seed này |
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
