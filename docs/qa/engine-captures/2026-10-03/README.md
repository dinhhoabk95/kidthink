# Checkpoint trình duyệt thật — Task #279 và #280 (2026-10-03)

Môi trường: Chromium headless (Playwright 1.59), Node 24, `pnpm dev` cổng 3000, DB `mindkid` đã seed.
Tài khoản `parent.standard@mindkid.test`, hồ sơ trẻ Bé Đậu (5-6 tuổi), chạm bằng touchscreen thật.
Tiếng nói: móc `speechSynthesis.speak` để ghi lại câu được đọc (không nghe được âm thanh).

## #279 — phản hồi và Gấu Con

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| GT-001, 390x844: chạm sai → vòng nhịp hổ phách nét đứt tại điểm chạm, gấu nghiêng | ĐẠT | `gt001-m390-wrong-a.png`, `-wrong-b.png` |
| GT-001: chạm đúng → vòng xanh + dấu tick + hạt, gấu nảy lên, hạt tiến độ sáng | ĐẠT | `gt001-m390-right-a.png`, `-right-b.png`, `-after.png` |
| GT-001, 1024x768 | ĐẠT (chỉ ca đúng; thứ tự lựa chọn xáo ngẫu nhiên nên lần chạm "sai" trúng đáp án đúng) | `gt001-T1024-*.png` |
| GT-028, 390x844 và 1024x768 | ĐẠT (vòng xanh + tick; ca sai không chụp được vì thứ tự xáo) | `gt028-m390-*.png`, `gt028-T1024-0-start.png` |
| Reduced-motion: phản hồi vẫn thấy | ĐẠT: vòng cố định bán kính (không nở), tick vẫn hiện, gấu không nảy | `gt001-m390-reduced-wrong-a.png`, `-right-a.png`, `gt001-T1024-reduced-*.png` |
| Màn tổng kết: nút chỉ icon, gấu canvas | ĐẠT: nút `Chơi tiếp`/`Chơi lại` chỉ icon (innerText rỗng), `<canvas class="kid-mascot">`, đọc "Giỏi quá!" | `victory-gt001-390.png`, `intro-victory-390.png` |
| 844x390 (ngang) | KHÔNG ĐẠT: xem lỗi 1 | `gt001-L844-0-start.png`, `gt028-L844-0-start.png` |

Tiếng: các câu đọc ghi nhận được gồm lời dẫn, tên vật vừa chạm ("Quả dưa hấu") và "Giỏi quá!" khi xong.
Dáng gấu chỉ khác nhau bằng độ nghiêng/nảy (cùng một khuôn mặt SVG) nên khá tinh tế ở 390px.

## #280 — luồng bài học

| Kiểm | Kết quả |
|---|---|
| Sảnh `/play` có hàng "Bài học" | ĐẠT — `lobby-390.png` (`kid-lesson-row`, thẻ cuộn ngang, tiêu đề là chữ) |
| `/play/lesson/LES-0004`: hạt, nút ▶, vào bước, tiếp tục, khoá phụ huynh, màn thưởng | KHÔNG KIỂM ĐƯỢC — lỗi 2 chặn |

## Lỗi

1. **Bố cục ngang 844x390**: thẻ mẫu bị hai ô lựa chọn đè lên, nút khoá/loa bị cắt mép trên, khay trò chơi tràn dưới khung nhìn. Lặp lại với GT-001 và GT-028 (vùng sân khấu `computeStageZones` ở màn thấp).
2. **`POST /api/users/play/lessons/{code}/progress` trả 404 NOT_FOUND cho mọi bài trong DB seed**.
   `apps/web/server/services/child-lesson-flow.ts` `findLessonGameLevels` nối `activities.id = lesson_activities.activity_id`,
   nhưng dữ liệu seed ghi `lesson_activities.activity_id` = `activities.entity_id` (378 hàng khớp theo `entity_id`, 0 hàng khớp theo `id`;
   `content-lifecycle.ts:391` cũng dùng `entityId`). Các service khác (`lesson-plan.ts`, `lesson-session-runner.ts`) nối theo `id` — hai quy ước đang lệch nhau.
   Trang bài hiện trạng thái lỗi (gấu + nút tải lại, `lesson-0-390.png`).
   Tái hiện: đăng nhập, chọn trẻ, mở `/play/lesson/LES-0004`.
3. Nhỏ: thẻ cổng làm quen ("Làm quen khái niệm trước"), hàng bài học và tiêu đề tổng kết dùng chữ nhiều, trái tinh thần `BR-CLF-06`/`BR-ENG-10` cho trẻ chưa đọc; ở 390px chữ lời dẫn bị cắt "…" vì nút loa 96px chiếm chỗ; gấu che hai sao đầu ở màn tổng kết.
