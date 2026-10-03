# Kiểm trình duyệt #283 — khay nhiều hàng, lời dẫn cột ở điện thoại ngang (2026-10-03)

Chromium headless (Playwright), Node 24, `nuxt dev` cổng 3000, DB `mindkid`. Ba đường chụp, JPEG chất lượng 60:

| Thư mục / tệp | Đường | Phủ |
|---|---|---|
| `GT-0xx-<level>-{m390x844,l844x390,t1024x768}.jpg` (thư mục này) | `/play/<level>` **khách** chưa đăng nhập | 20 engine mở được cho khách: GT-000, 001, 002, 003, 004, 005, 007, 008, 009, 010, 012, 013, 018, 019, 020, 021, 022, 023, 025, 034 — màn đầu vòng |
| `play/` | `/play/<level>` đăng nhập `parent.standard@mindkid.test`, hồ sơ Bé Đậu | 17 engine còn lại: GT-006, 011, 014, 015, 016, 017, 024, 026, 027, 028, 029, 030, 031, 032, 033, 035, 036 — màn đầu vòng 390x844, chạm thử 8 nút DOM của entity, **xoay máy giữa vòng** sang 844x390, **reduced-motion** ở 844x390 |
| `sandbox/` | `/play/preview-sandbox?fit=fill&template=…` (preview đã vào khung) | cả 37 engine: ba khung, xoay 390x844 → 844x390, reduced-motion; level có nội dung dài nhất của mỗi mã |

Kết quả thô: `report.json` ở từng thư mục.

## Kết quả

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Trang tải, có canvas, không `pageerror`/`console.error` | ĐẠT — khách 60/60, `play/` 17/17 (34 mục), `sandbox/` 148/148 | `report.json` |
| Điện thoại ngang: lời dẫn là cột bên trái (gấu ở đầu, loa dưới), sân khấu giữa | ĐẠT | mọi ảnh `*l844x390*`, `*rotate-to-l*` |
| Điện thoại ngang có khay: khay cột bên phải sân khấu, vật nhiều hàng | ĐẠT | `GT-004-…-l844x390.jpg` (2×2), `play/GT-030-play-rotate-to-l844x390.jpg` |
| Portrait: khay nhiều hàng dưới sân khấu | ĐẠT | `sandbox/GT-031-sb-m390x844.jpg` (8 xu, 2 hàng), `play/GT-014-play-m390x844-start.jpg` |
| **Xoay máy giữa vòng** tính lại vùng và slot | ĐẠT cho 17 engine ở `play/` và 37 ở `sandbox/` | `play/*-rotate-to-l844x390.jpg`, `sandbox/*-rotate-m-to-l.jpg` — 390x844 sang 844x390: lời dẫn dải trên → cột trái, khay hai hàng → một hàng |
| **reduced-motion** | ĐẠT: tải được, không lỗi | `play/*-reduced-l844x390.jpg`, `sandbox/*-reduced-*.jpg` (chưa so mắt từng chuyển động) |
| Chạm thử đổi khung hình | ĐẠT 17/17 (`tapChangedFrame` true) | `play/report.json` |
| Máy tính bảng giữ lời dẫn dải trên cùng | ĐẠT | các ảnh `*t1024x768*` |

## Lỗi lộ ra và đã sửa

1. **Nhãn dưới vật khay rơi ra ngoài dock / ngoài canvas** (GT-031 giá xu, GT-033 tên màu, GT-014 số đo, GT-030 nhãn dụng cụ): khay không chừa chỗ cho nhãn. Sửa: `trayLabels` → mỗi hàng khay cao thêm `TRAY_LABEL_ROW_PX` (`tray-grid.ts`, `tray-rows.test.ts` + ca âm).
2. **Nhãn dài chồng sang nhãn vật kề** (GT-033 "xe buýt vàng một" đè "xe đỏ hai"): `drawSlotLabel` co ngang vừa vùng chạm.
3. **GT-028 dòng "Bước nhảy / Đã đếm" bị vùng lời dẫn che nửa trên** (đã ghi ở QA N0): dải nhãn đặt ở đỉnh sân khấu (`splitCaption`), lưới nằm dưới.
4. **Preview-sandbox trước đây không dùng khung** — nay dùng `computeZonesForSession`; thêm `?fit=fill` và tính lại khi đổi cỡ.

## Còn lại (không sửa trong #283)

1. **Nợ vật lý ở canvas hẹp ngang** (số đo ban đầu 784x250, nay 610x350 sau khi HUD thành cột lề — xem phần dưới) (sàn chạm 76–96 px CSS): vd. `sandbox/GT-033-sb-l844x390.jpg` lưới 4×4 band 3-4 bị khay đè; GT-008 band 3-4 hàng ô đích thứ hai cắt ở đáy. Số đo ở `KNOWN_*_DEBT` các test `stage-engines-b*.test.ts`.
2. **GT-035** (`play/GT-035-play-m390x844-tapped.jpg`): nhãn "RIGHT" dưới ô robot hàng đầu bị hàng ô dưới che một phần.
3. Cột lời dẫn ở điện thoại ngang không có chữ phụ (`BR-PSZ-09`); picto chỉ hiện khi còn chỗ.

## Chơi hết vòng bằng cảm ứng thật (2026-10-04)

Tự động bằng Playwright + CDP `Input.dispatchTouchEvent` (`touchStart`/`touchMove`/`touchEnd`, kéo thả 6 bước di chuyển), đăng nhập `parent.standard@mindkid.test`, hồ sơ Bé Đậu. Một "gương" của engine chạy ở Node với đúng bản cấu hình và `layout_seed` mà trang nhận (mỗi lần mở level server phát seed mới) để tìm chuỗi cử chỉ thắng; chuỗi được phát lại bằng chạm/kéo trên trang, chờ trang sang vòng kế (`role=progressbar` tăng), qua cả ba vòng của level (số vật khay đổi giữa vòng: GT-031 2 xu, GT-014 vv.). Kết quả thô: `autoplay/report-*.json`.

| Khung | Kết quả |
|---|---|
| 390x844 (canvas 330x709) | **15/15** engine tự chơi được: GT-006, 011, 014, 015, 016, 017, 024, 028, 029, 030, 031, 032, 033, 035, 036 — đủ 3 vòng, trang sang vòng đúng, 0 lỗi console |
| 844x390 (canvas 610x350) | **16/17** — mọi engine trên (trừ GT-035) đủ 3 vòng. **GT-035 không thắng được vòng 1**: hàng lệnh dưới cùng bị cắt ở đáy canvas (ảnh `autoplay/GT-035-l-round1.jpg`), band 3-4 với lưới 4×3 + 5 ô chương trình + 4 lệnh là 12+5+4 ô ở sàn 148 logic px — không vừa dù HUD đã thành cột lề |
| GT-026, GT-027 | **Không tự chơi** (đi/không đi theo thời gian thực — gương và trang lệch đồng hồ); chỉ kiểm bố cục và chạm thử |

Lỗi thật lộ ra khi tự chơi và đã sửa:
1. **Backing store canvas lệch hộp CSS** (658x350 so với 610x350 ở 844x390): lần đo đầu xảy ra trước khi lưới HUD xếp xong, `resize` của window không bắn. Engine tính slot trên logic space cũ nên vị trí vẽ và vị trí chạm lệch ~60 logic px. Sửa: `ResizeObserver` trên canvas gọi lại đường `handleResize`.
2. **GT-035 mất hàng lệnh ở điện thoại ngang** khi dải HUD ăn 110 px: HUD thành cột lề (xem spec `BR-PSZ-07`), canvas 350 px thay vì 250.
3. **Nhãn "RIGHT"/"ĐÍCH" của GT-035 bị hàng ô dưới che**: chỉ vẽ khi khoảng giữa hai hàng còn chỗ cho dải nhãn (test `gt-035-grid-labels.test.ts`).

## Reduced-motion

`tests/layout/reduced-motion.test.ts`: với `reducedMotion` bật, khung hình thứ hai (cách 1,5 giây, cả `timeMs` lẫn `Date.now`) của **36 engine đã dời giống hệt khung đầu từng lệnh vẽ**; mascot đứng yên ở mọi dáng; vòng gợi ý nút hành động không nháy. Ca âm: không bật thì mascot và vòng gợi ý có chuyển động. Quan sát bằng mắt chuyển động trên máy thật chưa làm.

## Chưa kiểm

- GT-026, GT-027 chưa tự chơi hết vòng (thời gian thực).
- Máy thật có màn cảm ứng đa điểm (mới có mô phỏng CDP một ngón).
- Hai trang `/play/lesson/...` và màn thưởng ở khung ngang mới (HUD cột lề) chưa chụp lại.

Máy chủ dev đã dừng. Các script chụp là tạm, đã xoá.
