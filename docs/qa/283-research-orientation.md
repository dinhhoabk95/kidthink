# Nghiên cứu hướng màn hình cho GT-035 ở điện thoại ngang (#283)

Câu hỏi: bàn GT-035 (lưới robot + hàng chương trình + 4 lệnh) không vừa ở sàn chạm khi canvas ngang ~610x350. Giữ lớp xoay máy `BR-PSZ-14`, khoá dọc, hay thu mục tiêu?

## 1. Bằng chứng đã xác minh

| Nguồn | Điều rút ra |
| --- | --- |
| [NN/g — Design for Kids Based on Their Stage of Physical Development](https://www.nngroup.com/articles/children-ux-physical-development/) | Trẻ 3–5 tuổi cần mục tiêu chạm ít nhất **2 × 2 cm** (gấp bốn mức 1 × 1 cm của người lớn). Chạm và vuốt dễ; kéo thả chính xác khó. Nên cho nhiều cách thao tác cho cùng một việc (kéo hoặc chạm). Bài **không bàn về hướng màn hình**. |
| [Apple HIG và Material qua tổng hợp](https://www.zachswebdesigns.com/touch-target-size-guidelines-minimum-pixel-sizes-for-mobile-ui-elements/) | Người lớn: tối thiểu 44 pt (Apple), 48 dp (Material) cộng 8 dp giãn cách, khoảng 9 mm. Mức này **thấp hơn một nửa** mức 2 cm cho trẻ nhỏ, nên không dùng làm lý do thu mục tiêu của trẻ. Vùng chạm có thể lớn hơn hình vẽ. |
| [MDN — ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock) | Không phải Baseline. Thường chỉ chạy khi trang đang toàn màn hình. Có thể bị từ chối: `SecurityError`, `NotSupportedError`, `AbortError`. |
| [W3C Screen Orientation](https://www.w3.org/TR/screen-orientation/) và [báo lỗi thực tế](https://github.com/bccsa/luminary-media-convert/issues/251) | iOS Safari chưa bao giờ cài `lock()`. Gọi `lock()` ngay trước khi vào toàn màn hình xong có thể bị từ chối. |
| [MDN — manifest `orientation`](https://developer.mozilla.org/en-US/docs/Web/Manifest/orientation) | Chỉ đặt hướng mặc định lúc mở và chủ yếu áp cho PWA đã cài. Không dùng được để khoá riêng cho một trò. |
| [Touchscreen Prompts for Preschoolers (UW)](http://faculty.washington.edu/alexisr/TouchscreenPrompts.pdf) (qua kết quả tìm kiếm, không đọc được toàn văn) | Trẻ nhỏ gặp khó với kéo thả, xoay và giãn; trẻ 4 tuổi thạo cả bảy cử chỉ. Lời nhắc có tác dụng rõ. |
| [Parent scaffolding (PMC4861828)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4861828/) | Phụ huynh hỗ trợ trẻ 46–76 tháng nhiều khi dùng máy tính bảng, gồm hỗ trợ bằng lời và bằng tay. Phụ huynh đứng cạnh là điều bình thường. |
| [Apple Kids Category 1.3](https://developer.apple.com/kids/) và [Google Play Families](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en) | Quy định tập trung vào quyền riêng tư, quảng cáo, liên kết ngoài. **Không có điều khoản về khoá hay bắt buộc hướng màn hình.** |

## 2. Không xác minh được — ghi rõ để khỏi coi là bằng chứng

Các tìm kiếm về hướng màn hình mặc định của Khan Academy Kids, Duolingo ABC, PBS Kids Games, Toca Boca/Sago Mini, Endless Alphabet, ABCmouse và Lingokids **không trả về nguồn nào nêu rõ**. Trang App Store của Sago Mini World chỉ ghi thiết bị tương thích, không ghi hướng. Trang Khan Academy Kids chỉ khuyên kiểm khoá xoay của thiết bị. Không có nghiên cứu nào về lời nhắc xoay máy cho trẻ mầm non được tìm thấy. Vì vậy mọi nhận định "ứng dụng X làm Y" bị bỏ; kết luận dưới đây dựa trên NN/g, thông số kỹ thuật web và số đo của chính dự án. Nên tự mở các ứng dụng đó trên một điện thoại thật để đối chiếu (mục 5).

## 3. So sánh phương án

Số đo của dự án (luồng A, 2026-10-04): ở 610x350 band 5-6 sàn chạm khoảng 96 CSS px; sân khấu khoảng 375x329 CSS px; chín ô tương tác đã đầy sân khấu. Mức 96 px (~2,5 cm) đã sát khuyến nghị 2 cm của NN/g.

| Phương án | Hợp lệ với trẻ 3–6? | Chạy được ở đâu | Rủi ro | Kết luận |
| --- | --- | --- | --- | --- |
| **A. Lớp xoay máy dọc** (`BR-PSZ-14` hiện tại) | Có: giữ mục tiêu ≥ 2 cm; biểu tượng không chữ, trẻ chưa đọc cũng hiểu; phụ huynh cầm máy xoay được | Mọi trình duyệt, kể cả iOS Safari | Trẻ có thể bị chặn vì khoá xoay của máy đang bật; hơi gián đoạn | **Giữ làm nền** |
| **B. Khoá dọc bằng `screen.orientation.lock('portrait')`** | Có, và không gián đoạn nếu thành công | Chỉ Android Chrome khi đang toàn màn hình hoặc PWA; **không** có ở iOS Safari | Cần cử chỉ người dùng và toàn màn hình; thất bại im lặng nếu tách riêng | **Thêm như nâng cấp dần**, không thay A |
| **C. Thu mục tiêu dưới sàn chạm** | Không: dưới 2 cm trái NN/g, trẻ 3–4 tuổi trượt chạm; `BR-PSZ-04` cấm | Mọi nơi | Mất tính dùng được ở đúng nhóm tuổi nhỏ nhất | **Loại** |
| **D1. Chỉ xin xoay khi cần** (bàn tràn thật, không theo band) | Có | Mọi nơi | Đã làm: điều kiện là "bàn tràn sân khấu" | Giữ như hiện tại |
| **D2. Thiết kế lại GT-035 cho landscape** (ví dụ lệnh thành cột khay, chương trình là chip chỉ đọc) | Có thể, nhưng đổi cách chơi | Mọi nơi | Luồng A đo: cột khay chỉ còn ~120 CSS px bề ngang, vẫn không vừa; chip chỉ đọc làm lưới ~0,9 cm | **Không khả thi ở sàn chạm** |

## 4. Quyết định

**Giữ A làm hành vi chuẩn, thêm B như tăng cường tuỳ chọn; loại C.**

Lý do:
- A là cách duy nhất chạy ở mọi nền tảng, trong đó iOS Safari không có `lock()` và đây là nền tảng phổ biến trong gia đình có trẻ nhỏ.
- B chỉ cải thiện được trên Android Chrome và chỉ khi đã toàn màn hình, nên không thể là cơ chế duy nhất; nếu `lock()` bị từ chối thì rơi về A.
- Hướng của điện thoại do phụ huynh cầm quyết định phần lớn; xoay máy là thao tác của phụ huynh, không phải của trẻ. Lớp phủ nên nói với cả hai: biểu tượng cho trẻ, nhãn a11y cho người hỗ trợ.
- C trái hẳn khuyến nghị 2 cm của NN/g và `BR-PSZ-04`.

### `BR-PSZ-14` có đổi không

Có, ba điều chỉnh nhỏ, không đổi điều kiện kích hoạt:
1. **Thử khoá dọc trước, không bắt buộc.** Khi bàn tràn ở canvas ngang và trình duyệt đang toàn màn hình hoặc là PWA đã cài, gọi `screen.orientation.lock('portrait')` trong một cử chỉ người dùng (nút bắt đầu vòng). Lỗi thì bỏ qua và hiện lớp xoay như hiện tại. Gỡ khoá (`unlock()`) khi rời trò hoặc khi `requiresPortrait()` hết đúng.
2. **Lớp phủ giữ nguyên nghĩa tạm dừng.** Engine tạm dừng với lý do `rotate_device`, đồng hồ dừng, không phạt điểm. Đã kiểm trên trình duyệt thật (`bd55c5de`).
3. **Gợi ý khoá xoay.** Nếu sau khoảng 5 giây xoay máy vẫn không được (máy bật khoá xoay dọc/ngang), nhãn a11y và một dòng chữ nhỏ cho phụ huynh nói đến khoá xoay của máy. Chữ chỉ dành cho người lớn; trẻ vẫn dựa vào biểu tượng.

Không đề xuất đặt `orientation` trong manifest: nó áp cho cả ứng dụng và chỉ khi mở, không khoá riêng một trò.

## 5. Việc cần người làm

- Mở Khan Academy Kids, PBS Kids Games, Sago Mini World, Toca Boca Jr, Lingokids trên một điện thoại thật, ghi hướng mặc định và cách xử lý khi xoay, rồi bổ sung vào mục 2.
- Thử lớp xoay máy trên iPhone Safari và Android Chrome cùng một trẻ 4–5 tuổi có phụ huynh bên cạnh, theo `docs/qa/touch-device-checklist.md` mục C.
