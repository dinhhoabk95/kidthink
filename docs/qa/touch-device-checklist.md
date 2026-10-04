# Danh sách kiểm trên thiết bị cảm ứng vật lý — #283

Phần duy nhất của điều kiện 3 mà mô phỏng CDP không thay được. Ghi kết quả theo bảng cuối; ảnh/video vào
`docs/qa/engine-captures/<ngày>/touch-device/`.

## Thiết bị (tối thiểu)
| # | Loại | Ví dụ | Ghi |
|---|---|---|---|
| D1 | Điện thoại nhỏ (≈390x844 CSS) | iPhone 12–15, Android 6" | Safari hoặc Chrome; ghi model và phiên bản OS |
| D2 | Điện thoại ở màn ngang (≈844x390) | cùng máy D1 xoay ngang | Kiểm lớp xoay máy và HUD cột lề |
| D3 | Máy tính bảng (≈768–1024 rộng) | iPad, tablet Android | Cả dọc và ngang |
| D4 | Màn hình cảm ứng laptop/AIO (nếu có) | | Chuột và cảm ứng đồng thời |

Chuẩn bị: bản dev/staging đã gieo v3; tài khoản phụ huynh + bé; dọn khoá `rl:*` nếu đăng nhập bị giới hạn; tắt chế độ tiết kiệm pin;
bật rồi tắt "giảm chuyển động" ở một lượt.

## Ba khung cần phủ
390x844 (dọc) · 844x390 (ngang, cao dưới 500) · máy tính bảng/desktop (≥ 768 rộng). Xoay máy **giữa vòng** ít nhất một lần mỗi nhóm.

## A. Kéo thả (ghi: kéo ngón, thả nhầm vùng, kéo ra ngoài màn)
GT-004, 007, 008, 015, 021, 023 (khay nhiều hàng, khay cột ở ngang), GT-030/031/033. Mỗi engine: một level mỗi band phục vụ.
- [ ] Kéo vật từ khay vào đích; thả ngoài đích → vật về khay, không kẹt
- [ ] Chạm-chạm (không kéo) cũng đặt được vật (`BR-ENG-06`)
- [ ] Khay không phân trang: mọi vật hiện, không vật bị che
- [ ] Vật và hộp chạm ≥ sàn chạm: đầu ngón người lớn **và** ngón tay bé (nếu có bé 3–6 tuổi tham gia) chọn đúng vật

## B. Thời gian thực
- [ ] **GT-026** `GL-C4-HOM-GNG-0001` và một level không có đồng hồ: chạm đúng lượt `go`; kích thích **chỉ hiện khi chạm được** (`BR-E026-04`); không chạm → đếm `answer_incorrect`; chơi hết 3 vòng, hiện phần thưởng
- [ ] GT-026 dưới 60% đúng: vòng vẫn đóng, không treo (`BR-E026-05`)
- [ ] **GT-027** `GL-C2-GEO-SWT-0001`: chạm trong lúc tín hiệu đổi luật bị bỏ qua; 3 vòng, phần thưởng
- [ ] Pass: không đứng màn trống, điểm và số sao khớp số lần đúng (`play_sessions`)

## C. GT-035 và lớp xoay máy (`BR-PSZ-14`)
- [ ] D2 (844x390): lớp phủ biểu tượng xoay hiện, không chữ, chạm canvas không đổi gì, âm lời dẫn tạm dừng
- [ ] Xoay dọc: lớp phủ tắt, chương trình đang xếp còn nguyên, chạy tiếp thắng được
- [ ] D1: ba seed `GL-C1-ALG-CMD-0009/0010`, `GL-C2-DIR-CMD-0004` — lệnh và nút chạy hiện đủ, chơi hết 3 vòng
- [ ] Xoay giữa vòng ba lần liên tiếp: không treo, không nhân đôi lệnh

## D. Đa điểm thật
Ngón thứ hai/thứ ba đặt lên trong khi ngón đầu đang kéo hoặc đang chạm; ngón lòng bàn tay chạm cạnh canvas.
- [ ] Chỉ ngón đầu được tính (kéo GT-031, GT-015; chạm GT-026/027); ngón thừa bị bỏ qua
- [ ] Hủy cảm ứng (kéo ra rìa hệ thống, thông báo trượt xuống, gập cạnh): không kẹt con trỏ, kéo tiếp bằng ngón mới được
- [ ] Hai bàn tay (người lớn + bé): không nhảy vật giữa hai ngón

## E. Chung
- [ ] Mỗi lần: cuộn trang không cuộn khi chạm canvas; không phóng to hai ngón; không kích hoạt menu giữ-lâu của trình duyệt
- [ ] Nút hành động ✓ chạm được ở GT-002, 006, 018 (chuỗi), 028, 034, 035, 036
- [ ] Reduced-motion: chuyển động mũi tên xoay ngừng, thông tin vẫn rõ

## Tiêu chí đạt
Mọi ô ở A–E của D1, D2, D3 đạt; không lỗi chặn (đứng màn, kẹt con trỏ, vật không chạm được). Lỗi nhỏ ghi vào bảng với mức độ.

## Bảng kết quả
| Ngày | Thiết bị/OS/trình duyệt | Khung | Mục | Kết quả | Ghi chú / ảnh |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
