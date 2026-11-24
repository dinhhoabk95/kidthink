---
spec: DAILY-ADVENTURE-FLOW
title: Chuyến phiêu lưu một chạm — chuỗi hoạt động ngắn liền mạch cho trẻ
area: play
status: implemented
mvp: false
phase: P4
reviewed: 2026-11-15
owns:
  - Luồng Chuyến phiêu lưu hôm nay một chạm từ sảnh trẻ (`/play`)
  - API tổng hợp chuỗi chặng chơi ngắn hợp ZPD (`GET /api/users/play/adventure`)
depends_on:
  - PLAY-ENTRY-AND-PROFILE-SELECT
  - NEXT-GAME-RECOMMENDATION
  - CONCEPT-INTRO-GATE
  - PLAY-SESSION-LIFECYCLE
  - STICKER-ALBUM
---

# Chuyến phiêu lưu một chạm — chuỗi hoạt động ngắn liền mạch cho trẻ

## 1. Objective

Trẻ 3–4 tuổi vào sảnh `/play` chưa đọc được chữ và dễ lúng túng khi phải tự chọn qua hai tầng danh mục (`Sảnh → Nhóm năng lực → Màn chơi`).

Spec này định nghĩa nút hành động chính **Chuyến phiêu lưu hôm nay** ngay tại sảnh chơi: chỉ với **một cú chạm**, hệ thống dẫn trẻ đi liền mạch qua một chuỗi ngắn 2–3 màn chơi đã được cá nhân hoá theo ZPD và lộ trình của trẻ (bao gồm bài làm quen khái niệm nếu cần), kết thúc bằng nghi thức mở quà Sticker trước khi quay về Phòng Chơi Gấu Con.

## 2. Actors

| Actor | Quyền cần | Làm được gì ở đây |
|---|---|---|
| Trẻ | Hồ sơ trẻ đang hoạt động (`active_child_id`) hoặc Guest | Chạm một nút lớn ở sảnh để bắt đầu chuỗi 2–3 màn chơi nối tiếp nhau |
| Guest | Không cần đăng nhập | Chạy chuỗi 2 màn chơi từ allow-list `free`, không lưu tiến độ (`SPEC.md` §1.5) |
| Server | — | Tổng hợp chuỗi màn chơi tất định từ bộ gợi ý và cổng làm quen khái niệm |

## 3. Entry points

| Route / màn hình | Actor | Ghi chú |
|---|---|---|
| Nút CTA chính ở `/play` (`KidAdventureLauncher`) | Trẻ / Guest | Duy nhất một CTA màu cam `cta` trên sảnh (`BR-DSC-10`), vùng chạm ≥ 96px CSS |
| `GET /api/users/play/adventure` | Trẻ (User đã đăng nhập) | Trả về chuỗi 2–3 chặng hợp quyền và hợp tuổi của trẻ đang hoạt động |
| `/play/{code}?adventure=1` | Trẻ / Guest | Chạy từng chặng trong chuỗi, tự chuyển sang chặng kế khi bấm Chơi tiếp |

## 4. Main flow

1. Trang `/play` tải chuỗi chặng từ `GET /api/users/play/adventure` (hoặc lấy 2 màn allow-list `free` nếu là Guest).
2. Nút **Chuyến phiêu lưu hôm nay** hiển thị tối đa 3 biểu tượng hình ảnh (`thumbnail_emoji` qua `BrandEmoji`) đại diện các chặng sắp chơi, không yêu cầu đọc chữ.
3. Trẻ chạm vào nút → điều hướng thẳng vào chặng 1 (`/play/{step1.level_code}?adventure=1`).
4. Khi hoàn thành một chặng và trẻ chạm nút **Chơi tiếp** trên màn thưởng, trình duyệt chuyển thẳng sang chặng kế tiếp trong chuỗi.
5. Khi hoàn thành chặng cuối cùng, màn thưởng mở hộp quà Sticker (với trẻ có hồ sơ), và nút **Chơi tiếp** đưa trẻ trở lại Phòng Chơi `/play` trong trạng thái Gấu Con vẫy tay chúc mừng.

## 5. Alternative flows

| Nhánh | Điều kiện | Hành vi |
|---|---|---|
| Màn chơi đầu tiên cần làm quen khái niệm | `concept-intro-gate` báo thiếu bài intro | Server tự xếp bài intro (`GT-000` tương ứng) làm chặng 1, màn chơi thực hành làm chặng 2 |
| Hết hạn mức chơi lành mạnh giữa chuỗi | `healthy-play-limits` chạm trần sau khi xong chặng 1 | Hoàn tất trọn vẹn chặng đang chơi (`BR-HPL-02`), sau đó hiện thông báo nghỉ ngơi ấm áp thay vì mở chặng 2 |
| Guest chưa đăng nhập | Không có phiên User | Sinh chuỗi 2 màn chơi từ allow-list `free` ngay trên client/guest catalog, không ghi DB |
| Chỉ còn 1 màn chơi phù hợp | Kho màn chơi hợp quyền chỉ trả 1 kết quả | Chuỗi gồm đúng 1 chặng, vẫn vào chơi bình thường, cấm báo lỗi |

## 6. Business rules

| ID | Rule | Vì sao |
|---|---|---|
| `BR-DAV-01` | Chuỗi phiêu lưu một chạm chứa từ **1 đến tối đa 3 chặng** màn chơi hợp quyền (`allowedTiers`) của người gọi | Trẻ 3–6 tuổi có khoảng chú ý ngắn (5–10 phút); quá 3 màn liên tiếp gây mỏi nhận thức |
| `BR-DAV-02` | Không có cơ chế chuỗi ngày bắt buộc (streak), không đếm ngược giờ reset ngày, không phạt khi trẻ bỏ dở chuỗi | Tuân thủ cứng `BR-PRG-07` và `BR-CDC-09` — chống cơ chế gây nghiện cho trẻ mầm non |
| `BR-DAV-03` | Nếu màn chơi mục tiêu có bài làm quen khái niệm chưa hoàn thành, bài làm quen được đặt đứng ngay trước màn chơi đó trong chuỗi | Tuân thủ `BR-CIG-01` để trẻ không bị đẩy vào bài tập khi chưa hiểu khái niệm |
| `BR-DAV-04` | Nút khởi động phiêu lưu đạt sàn chạm ≥ 96px CSS, hiển thị biểu tượng trực quan và đọc lời mời tiếng Việt khi chạm biểu tượng loa | `BR-ENG-05`, `BR-ENG-10` — trẻ 3 tuổi thao tác chính xác ngay lần chạm đầu mà không cần biết đọc |
| `BR-DAV-05` | Chuyển chặng chỉ diễn ra sau khi trẻ chủ động bấm nút tiếp tục ở màn tổng kết chặng trước; cấm tự chuyển chặng cưỡng bức không qua xác nhận chạm của trẻ | Giữ quyền chủ động (agency) cho trẻ và cho trẻ nhịp thở ngắn giữa hai trò chơi |
| `BR-DAV-06` | Mọi chặng trong chuỗi đều kiểm tra lại quyền truy cập và hạn mức chơi lành mạnh ở server lúc mở phiên chơi | `BR-LAD-03`, `BR-HPL-02` — danh sách chuỗi ở client không phải nguồn cấp quyền |

## 7. Data

**Đọc:** `child_profiles`, `curriculum_enrollments`, `play_sessions`, `mastery_state`, `game_levels` (thông qua `getRecommendationsForChild`).
**Ghi:** Không tạo bảng mới. Mỗi chặng khi chơi tạo một `play_sessions` độc lập như luồng chuẩn.

```ts
interface AdventureStepItem {
  readonly step_index: number;
  readonly level_code: string;
  readonly title: string;
  readonly thumbnail_emoji: string;
  readonly kind: "intro" | "play";
}

interface DailyAdventureResponse {
  readonly child_uuid: string;
  readonly greeting_vi: string;
  readonly steps: readonly AdventureStepItem[];
}
```

## 8. API contract

### `GET /api/users/play/adventure`

| | |
|---|---|
| Auth | Phiên User (`defineApiRoute` `auth: "user"`) + trẻ đang hoạt động thuộc caller |
| Query | Không có |
| 200 | `DailyAdventureResponse` (§7) |
| 401 | `UNAUTHENTICATED` — chưa đăng nhập |
| 428 | `NO_ACTIVE_CHILD` — chưa chọn hồ sơ trẻ hoặc hồ sơ không thuộc caller |

## 9. Acceptance criteria

```gherkin
Scenario: BR-DAV-01 — trả chuỗi tối đa 3 chặng hợp quyền
  Given user đăng nhập có trẻ đang hoạt động thuộc band 3-4
  When gọi GET /api/users/play/adventure
  Then trả 200 với mảng steps có độ dài từ 1 đến 3
  And không phần tử nào có is_locked là true

Scenario: BR-DAV-02 — không chứa trường streak hay bộ đếm ngược
  When gọi GET /api/users/play/adventure
  Then response không chứa streak_days, expires_at hay countdown_seconds

Scenario: BR-DAV-06 — không lộ dữ liệu trẻ của user khác
  Given cookie active_child_id trỏ tới trẻ của user khác
  When gọi GET /api/users/play/adventure
  Then trả 428 NO_ACTIVE_CHILD
```

## 10. Boundaries

**Always**
- Kiểm ownership của `active_child_id` trên DB mỗi lần gọi.
- Giới hạn tối đa 3 chặng mỗi lượt phiêu lưu.
- Giữ duy nhất một nút CTA cam trên sảnh `/play`.

**Ask first**
- Tăng trần số chặng vượt quá 3.
- Thay đổi thứ tự ưu tiên chọn bài của bộ gợi ý gốc (`next-game-recommendation.md`).

**Never**
- Thêm chuỗi ngày liên tiếp (streak) hoặc thông báo thúc giục quay lại.
- Cho phép bỏ qua kiểm tra `access-gating` ở từng chặng.

## 11. Open questions

Không có.
