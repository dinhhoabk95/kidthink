# Chạy lại #280 và kiểm mới #282 (2026-10-03)

Môi trường: Chromium headless (Playwright 1.59), Node 24, `nuxt dev` cổng 3000, DB `mindkid` (migration 0007+0008),
`parent.standard@mindkid.test`, trẻ Bé Đậu (child_profile id 2), 390x844 (`-m`) và 844x390 (`-l`).
Đã gỡ nút chặn #280 (commit 54701e10): `POST .../lessons/LES-0004/progress` trả 200, không còn 404.
Móc `speechSynthesis.speak` để ghi câu đọc. Chơi bằng cách bấm các nút DOM `Các đối tượng tương tác`
(thử lần lượt vì lựa chọn xáo ngẫu nhiên). Không sửa tay hàng DB nào; bắt đầu từ bảng trống
(`child_lesson_plays` và `child_stickers` 0 hàng).

## Kết quả

| # | Kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Sảnh `/play` có hàng bài học | ĐẠT | `c1-lobby-m.png`, `c1-lobby-l.png` (`kid-lesson-row`, 6 thẻ, bài dở có icon ▶ và viền cam, ô còn lại icon sách). Tên bài là chữ (xem ghi chú 3) |
| 1 | `/play/lesson/LES-0004`: hạt bước, ▶ chỉ icon, không 404 | ĐẠT | `c1-lesson-m.png`, `c1-lesson-l.png`: 3 hạt (aria-label "Làm quen", "Hình tròn - GT-012 (Cấp 1)", "Trong - GT-001 (Cấp 1)"), `lesson-play-next` có innerText rỗng + 1 icon |
| 2 | ▶ mở `/play/<level>?lesson=<code>`, chơi xong, Chơi tiếp về trang bài, hạt kế tiếp sáng | ĐẠT | Bước 0 (làm quen GT-000, ~mười thẻ, bấm "Tiếp tục" qua hết) rồi bước 1 `GL-C2-SHP-CARD-0001?lesson=LES-0004`: `c2-intro-card-m.png`, `c2-s1-level-start-m.png`, `c2-s1-level-victory-m.png`, `c2-s1-lesson-before-m.png` → `c2-s1-lesson-after-m.png`. Hạt: [xong, hiện tại, -] → [xong, xong, hiện tại]. Đọc "Giỏi quá!" ở màn thắng |
| 3 | Rời bằng khoá phụ huynh rồi mở lại → cùng bước | ĐẠT | `c3-gate.png`, `c3-after-leave-m.png`, `c3-reopen-m.png`. Chạm ngắn không mở cổng; nhấn giữ 1.3s mở `ParentGateModal` ("6 × 3 = ?" → nhập tích, bấm Xác nhận) → về `/play`. Mở lại: [xong, xong, hiện tại] đúng như trước |
| 4 | Xong mọi bước → màn thưởng + sticker + lời khen | ĐẠT | `c4-s3-lesson-after-m.png`: 3 sao, sticker 🏫, `data-testid=victory-sticker` aria-label "Sticker mới: Trường học", nút chỉ icon. Lời đọc cuối là "Giỏi quá!" (từ trang bài, sau "Giỏi quá!" của level) |
| 4 | `/play/stickers` (bấm icon album ở sảnh): có sticker, không chữ số, khoá phụ huynh là lối thoát duy nhất | ĐẠT | `c4-album-m.png`, `c4-album-l.png`: 1 sticker `aria-label="Trường học"`; text hiển thị không có chữ số; chỉ 1 nút (khoá phụ huynh) và 1 link là skip-link `#main-content` của layout; nhấn giữ + cổng ("8 × 2") → `/play` |
| 5 | Mở lại cùng bài, xong → sticker thứ hai, idempotency | ĐẠT | `c5-r1-*`, `c5-r2-*` (844x390), `c5-album-m.png`. Lượt 2 (play id 2): sticker mới "Cặp sách" 🎒 (khác sticker cũ, đúng `BR-STK-05`); ở bước giữa `sticker = null`; album hiện 2 sticker. Mở lại sau khi xong lại sinh lượt 3 (`in_progress`), không thêm sticker (`BR-STK-01`, §5) |
| 6 | DB khớp UI | ĐẠT | Xem dưới |
| + | `BR-STK-07`/lỗi: GET album khi chưa có trẻ / cookie trẻ của user khác | ĐẠT | cả hai trả `428 NO_ACTIVE_CHILD`; `?theme=bogus` → `422 VALIDATION_FAILED` |
| + | `BR-STK-04` chọn chủ đề | ĐẠT | Bước game: SHP-CARD `school`, POS-LOC `home` → hoà, lấy theo thứ tự bước = `school`; sticker đầu là noun đầu "Trường học" |

### DB (psql, container `mindkid-db-1`)

```
child_lesson_plays: id 1 completed (3 bước: intro + 2 game, 1 sticker) · id 2 completed (2 bước game, 1 sticker) · id 3 in_progress (0 sticker)
child_stickers:     1 | child 2 | play 1 | school | 🏫 | Trường học
                    2 | child 2 | play 2 | school | 🎒 | Cặp sách
```
Khớp UI: hai lượt đã xong ↔ hai sticker, một sticker/lượt (unique `(child_profile_id, child_lesson_play_id)`), lượt dở không có sticker.
Lượt 2 và 3 không có bước làm quen vì GT-000 của trẻ đã xong (`BR-CLF-01`: "nếu cổng đòi"; ảnh chụp bước chỉ còn 2 bước, `BR-CLF-02` không co lại trong cùng lượt).

## Lỗi và ghi nhận

1. **Màn thưởng/thắng tràn khung ở 844x390** (`c5-r2-lesson-after-l.png`): thẻ modal cao hơn khung nhìn — mép trên cắt hàng sao và đầu Gấu Con, hàng nút ▶/↻ bị cắt ở đáy. Sticker vẫn hiện nhưng trẻ ngang phải kéo/khó thấy nút. File: `apps/web/app/components/kid/victory-modal.vue` (dùng cho cả trang bài và trang level). Mức: trung bình.
2. **Bố cục level ngang 844x390 vẫn đè** (`c5-r2-level-start-l.png`): các ô lựa chọn xếp sát/đè thẻ mẫu, vùng chơi thấp — lỗi 1 của QA #279 vẫn còn (chưa phải việc của #280/#282).
3. Nhỏ: (a) hàng bài học, tiêu đề "Bé Giỏi Quá!/Bé Đã Hoàn Thành!" và dòng chữ trong modal là chữ cho trẻ chưa đọc (đã ghi ở QA trước). (b) Album: header chủ đề hiện emoji 🏫 ngay cạnh sticker 🏫 nên một sticker nhìn như hai ô, hai sticker nhìn như ba (`c4-album-m.png`, `c5-album-m.png`; sticker mới nhất có viền nét đứt). Dễ làm trẻ tưởng có hai sticker/ô thừa; spec §9 "đúng hai sticker". File: `apps/web/app/pages/play/stickers.vue`. (c) Thoát khoá phụ huynh ở lesson/album về `/play` có navbar phụ huynh ("Phụ Huynh Standard"), không phải bề mặt trẻ — đúng hiện trạng, chỉ ghi lại. (d) Lần tải đầu của `/play` ngay sau khi dev server khởi động từng không hiện hàng bài học (đo 1 lần, tải lại thì có; nghi nguyên nhân là biên dịch dev lần đầu, không tái hiện).

## Chưa kiểm

- Reduced-motion cho trang bài/màn thưởng.
- Âm thanh thật (chỉ đọc qua móc `speak`); "lời khen" được xác nhận bằng chuỗi "Giỏi quá!".
- Chạm bằng touchscreen thật: chơi dùng nút DOM (`click`), không dùng kéo/thả; chỉ khoá phụ huynh dùng chuột nhấn giữ.
- Ca đua hai yêu cầu `progress` song song (§5), xoá bài → `child_lesson_play_id` null, chủ đề "đủ mọi sticker → quay vòng" (cần ≥ N lượt cùng chủ đề).
- Bước làm quen chỉ chụp ở 390x844 (`c2-intro-card-m.png`); 844x390 các lượt sau không có bước này.
- Một số ảnh ở 844x390 chỉ có cho lượt 2 (`c5-r*`); bước 1 của lượt 1 ở 390x844 (`c2-*`, `c4-s3-*`).
