# #283 — Nghiên cứu chấm điểm và phản hồi cho trẻ 3–6 tuổi (R3)

Ngày 2026-10-04. Phạm vi: `BR-SCO-09` (điểm một phần cho vòng nhiều lượt), `first_try_ratio`, ngưỡng sao, sàn 1 sao, và lượt hết giờ của GT-026 ở trẻ 3–4 tuổi. Nguồn là kết quả tìm kiếm web; trang tôi mở đọc đầy đủ chỉ có Fish/Shark (PMC3399978). Các nguồn còn lại chỉ đọc phần tóm tắt trong kết quả tìm kiếm, nên mức chắc chắn thấp hơn.

## 1. Nguồn

| Nguồn | Điều rút ra |
|---|---|
| [Khan Academy Kids — blog](https://blog.khanacademy.org/supporting-english-language-acquisition-with-khan-academy-kids/), [Common Sense](https://www.commonsensemedia.org/app-reviews/khan-academy-kids) | Không dán nhãn "sai": gợi ý hình/âm dẫn tới đáp án, phản hồi tức thì, nguy cơ thấp. Thưởng "sparkles" khi đúng ngay lần đầu, tích luỹ tới quà |
| [ABCmouse](https://www.abcmouse.com/abc/) | Thưởng theo hoàn thành hoạt động (vé), không theo độ chính xác |
| [Duolingo ABC](https://play.google.com/store/apps/details?id=com.duolingo.literacy&hl=en_US), [Kokotree](https://kokotree.com/alternatives/duolingo-abc) | Có streak; bình luận ghi nhận streak tạo áp lực không phù hợp tuổi 4 |
| [Fish/Shark go/no-go, Preschool (PMC3399978)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3399978/) | 40 lượt, 75% go, cửa sổ 1500 ms ("1 giây quá nhanh, 2 giây lý tưởng"). Độ chính xác go / no-go: 3,0 tuổi 62% / 47%; 3,75 tuổi 75% / 74%; 4,5 tuổi 89% / 84%; 5,25 tuổi 96% / 89% |
| [Go/no-go ở trẻ 4,5–5,5 (PMC6969333)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6969333/) | Go .92, no-go .71; no-go luôn khó hơn go |
| [NIH Toolbox scoring (PMC11841212)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11841212/) | Chỉ số kết hợp độ chính xác và tốc độ; dưới 6 tuổi trẻ không đánh đổi tốc độ lấy chính xác, nên **độ chính xác là chỉ số có nghĩa**, tốc độ thì không |
| [Praise and "easy" feedback (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0022096524001723), [Dweck — Perils and Promises of Praise](https://teaching.temple.edu/sites/teaching/files/resource/pdf/Dweck-Perils%20&%20Promises%20of%20Praise.pdf), [Parenting Science](https://parentingscience.com/praise-and-intelligence/) | Khen quá trình/nỗ lực tốt hơn khen năng lực; liên quan tới tư duy phát triển về sau |

Giới hạn: không tìm được tài liệu công khai nói rõ ngưỡng sao hay chấm điểm một phần của Lingokids, PBS Kids, Todo Math, Starfall. Phần so sánh với các app này là suy ra từ mô tả chung, không phải từ nguồn.

## 2. So với quy tắc hiện tại

Hiện tại (`scoring-and-result.md` §7): `normalized = 0,6·first_try_ratio + 0,4·accuracy`; sao ≥0,85 → 3, ≥0,55 → 2, hoàn thành → 1; không trừ điểm vì gợi ý hay thử lại (`BR-SCO-03`); không thưởng tốc độ (`BR-SCO-06`).

- **Khớp thực tế ngành:** không có nhãn "thua"; sàn 1 sao; không thưởng tốc độ; không streak. Các điểm này trùng với Khan Academy Kids và với kết luận của NIH Toolbox về độ chính xác.
- **`BR-SCO-09` hợp lý:** vòng 8 lượt đúng 6 lượt cho `round_credit = 0,75`, thành `normalized = 0,75` → 2 sao. Đối chiếu số đo: trẻ 3,75 tuổi đúng khoảng 74–75% là mức **bình thường**, nên phải được 2 sao chứ không phải 0 điểm như quy tắc cũ. Trẻ 4,5 tuổi 84–89% sát ngưỡng 3 sao (0,85), tức 3 sao là phần thưởng đạt được nhưng không dễ.
- **Trẻ 3,0 tuổi (62% go, 47% no-go) rơi vào 1–2 sao:** chấp nhận được vì sàn 1 sao, nhưng điểm đang phạt trẻ vì giới hạn phát triển chứ không vì kỹ năng.
- **Lượt hết giờ:** lượt `go` bỏ sót hiện ghi `answer_incorrect` (`BR-E026-06`). Cửa sổ nên ≥1500 ms; GT-026 spec chỉ đặt cảnh báo "dưới 1200 ở band 4-5" cần hỏi trước. Bỏ sót ở trẻ nhỏ thường là phân tán chú ý hoặc chưa kịp, không phải sai quy tắc.

## 3. Quyết định

1. **Giữ `BR-SCO-09`.** Công thức `round_credit = đúng / số lần thử` cho vòng nhiều lượt, giữ `rounds_correct` và `raw_score` chỉ đếm vòng đúng trọn.
2. **Giữ ngưỡng sao 0,85 / 0,55 và sàn 1 sao.** Hoàn thành luôn có ít nhất 1 sao. Với số đo ở mục 1, 2 sao (≥0,55) phủ gần hết trẻ 3,75 tuổi trở lên, 3 sao (≥0,85) chỉ đạt khi trẻ 4,5+ chơi tốt. Không hạ ngưỡng 3 sao: hạ thì 3 sao mất ý nghĩa.
3. **Lượt hết giờ không chạm (omission) ở band 3-4: trung tính.** Không ghi `answer_incorrect` mà ghi `answer_timeout`; không vào `attempt_count`, `correct_count` hay `round_credit`; vẫn nằm trong telemetry cho adaptive. Lỗi chạm nhầm ở `nogo` (commission) vẫn tính là sai vì đó là kỹ năng ức chế mà trò chơi đo. Lý do: nguyên tắc ít lỗi cho tuổi nhỏ, `BR-SCO-05/08`, và omission ở 3 tuổi cao tới 38%.
4. **Band 4-5 và 5-6: giữ `BR-E026-06` hiện tại** (omission tính sai) vì khả năng đáp ứng ở tuổi này đủ ổn (go 89–96%). Riêng band 4-5 đã `untimed` (`BR-E026-03`) nên không có omission.
5. **Cửa sổ kích thích tối thiểu 1500 ms ở band 3-4** (hiện cảnh báo chỉ ở band 4-5, 1200 ms); khuyến nghị 2000 ms. Đây là số của nghiên cứu Fish/Shark, không phải của spec hiện tại.
6. **Không thêm streak, bảng xếp hạng, hay thưởng tốc độ** (giữ `BR-SCO-06`).
7. **Khen theo quá trình** trong lời phản hồi sau vòng ("con đã cố gắng", "con nhớ dừng lại") thay vì khen năng lực; việc này thuộc `feedback-and-celebration.md`, chưa kiểm trong lượt này.

## 4. Việc cần triển khai từ quyết định này

- Quyết định 3: sửa `GT-026.md` (`BR-E026-06` thêm nhánh band 3-4), `scoring-and-result.md` §7.1 (`answer_timeout` không vào `attempt_count`), `RoundRunner` / `GameEngine.onUpdateVerdict`, kèm test.
- Quyết định 5: sửa `engine-difficulty-params.json` hoặc builder GT-026 cho band 3-4 và test không có cửa sổ <1500 ms.

Hạn chế: mọi con số tuổi lấy từ một nghiên cứu mẫu Mỹ (go 75%), không phải dữ liệu trẻ Việt Nam; nên đối chiếu lại bằng `play_sessions` thật khi có.

## 5. Đính chính khi triển khai (2026-10-04)

Quyết định 3 và 5 giả định GT-026 có band `3-4`. Thực tế engine **cấm band `3-4`** (`banned_age_bands`, `BR-EBD-11`), band `4-5` không đếm giờ, chỉ `5-6` có lượt hết giờ — nhóm tuổi mà nghiên cứu cho đúng ≥96% ở lượt đi. Nên: lượt `go` bỏ sót vẫn tính sai (`BR-E026-06` giữ nguyên), không dựng `answer_timeout` và không đổi cửa sổ kích thích. Quy tắc dành cho trường hợp mở band `3-4` về sau ghi ở `BR-E026-08`. `BR-SCO-09` và ngưỡng sao 0,85 / 0,55 giữ nguyên. Quyết định 7 (khen theo quá trình) bỏ qua: §7.2 của `feedback-and-celebration.md` đã có "Bé thật chăm chỉ!" và "Bé làm được rồi!", đổi bộ lời khen cần clip âm thanh và nằm trong mục "Ask first" của spec đó.

