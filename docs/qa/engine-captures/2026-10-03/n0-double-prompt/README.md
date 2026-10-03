# Kiểm #283 N0 — lời dẫn chỉ vẽ một nơi (2026-10-03)

Commit `a71f4db1`. Chromium headless (Playwright 1.59), Node 24, `nuxt dev` cổng 3000, DB `mindkid`,
`parent.standard@mindkid.test`, trẻ Bé Đậu, 390x844 (`-m`) và 844x390 (`-l`). Móc `speechSynthesis.speak`
để ghi câu đọc. Chơi bình thường, không sửa tay hàng DB. Console bắt `error` + `pageerror` mỗi lần tải level.

## Kết quả

| # | Kiểm | Kết quả | Bằng chứng |
|---|---|---|---|
| a | Engine chưa dời hiện đúng MỘT lời dẫn (của engine), không có ô prompt zone gấu+loa | ĐẠT | `GL-C1-ADD-MEMO-0001` (GT-012), `GL-C1-NCOMP-SIZE-0001` + `GL-C3-ALG-SIZE-0001` (số bí mật), `GL-C2-GEO-SPOT-0001` + `GL-C3-VIS-SPOT-0030` (điểm khác biệt), `GL-C2-GEO-PAIR-0001` + `GL-C1-OTO-PAIR-0001` (phân loại), cả `-m` lẫn `-l` |
| a | Loa/nghe lại vẫn tới được | ĐẠT | Nút HUD vàng (góc phải) + `aria-label="Nghe lại hướng dẫn"`; bấm → `speak` tăng 1 → 2 (GT-012 và NCOMP-SIZE, cả hai khung) |
| b | Engine đã dời: prompt zone có gấu + loa + chữ, chữ chỉ một lần | ĐẠT | `GL-C1-ADD-TAP-0001` (GT-001), `GL-C1-ADD-TAP-0020` (GT-028, kể cả không còn chữ lặp), `GL-C1-ADD-TCMP-0001` (GT-003), cả hai khung |
| c | GT-001 chạm đúng/sai | ĐẠT | `gt001-{m,l}-*-1/3.png`: sai → vòng nhịp hổ phách nét đứt, ô viền cam, gấu đổi dáng; đúng → vòng xanh + dấu tick, hạt tiến độ thứ hai sáng, gấu đổi dáng |
| d | Lỗi console | ĐẠT | Không `pageerror`, không lỗi console ở mọi level đã chơi. Duy nhất `428 NO_ACTIVE_CHILD` ở lần tải `/play` trước khi kích hoạt trẻ (bước chuẩn bị, không phải level) |

Mỗi level gắn mã template: GT-001 `GL-C1-ADD-TAP-0001`, GT-028 `GL-C1-ADD-TAP-0020`, GT-003 `GL-C1-ADD-TCMP-0001`,
GT-012 `GL-C1-ADD-MEMO-0001`. Tên GT-009/025/004 suy ra từ mã level theo DB (không đối chiếu registry thêm).

## Điều trẻ thực sự thấy ở engine chưa dời

Một câu dẫn in đậm trong bong bóng trắng ở đầu sân khấu, do engine tự vẽ. Không có gấu, không có loa vàng lớn
trong sân khấu. Loa chỉ còn ở HUD (nút vàng góc phải), đúng thiết kế `usesPromptZone=false`.
Engine đã dời: ô gấu + loa lớn + chữ cỡ nhỏ.

## Ghi nhận (không phải lỗi của N0)

1. `GL-C1-ADD-MEMO-0001-l.png`: ở 844x390 chữ phụ "Bé nhớ có bao nhiêu đồ vật?" bị cái vòm và hai ô số đè một phần. Engine chưa dời, thuộc #283 kế tiếp.
2. `GL-C1-ADD-TAP-0020-m.png` (GT-028, 390x844): dòng phụ cam "Bước nhảy: +2 | Đã đếm ..." bị prompt zone che nửa trên. Không phải lời dẫn lặp; là chồng lấn HUD của engine với prompt zone. Đề nghị kiểm khi dời GT-028 sang `zones.hud`.
3. GT-001 844x390: khay lựa chọn sát/đè thẻ mẫu (đã biết, #277/#279).
4. Không chơi được qua cổng: `GL-C1-ADD-SIZE-0001` (GT-009) bị `403 TIER_LOCKED` (premium), `GL-C1-DAT-SPOT-0001` và `GL-C1-CMP-PAIR-0001` bị `428 INTRO_REQUIRED`; đã thay bằng level đầu tiên của cùng họ engine mở được (xem bảng a). Không chạy bài làm quen GT-000 cho CMP/DAT.
5. Chạm GT-001 cần nhấn giữ ~80ms trên canvas (mouse down/up tức thì không ăn); nút DOM `sr-only` đầu tiên là thẻ mẫu, không phải lựa chọn. Chỉ là chi tiết tự động hoá.

Máy chủ dev đã dừng.
