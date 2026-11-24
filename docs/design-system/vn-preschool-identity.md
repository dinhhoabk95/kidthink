# Bản sắc Mầm non Việt Nam: "Tuổi thơ Việt × Giấy Gỗ Mộc"

Tài liệu này quy định hướng mỹ thuật, chất liệu xúc giác, âm sắc ngũ cung và giọng văn đồng dao dành riêng cho **Thanh ghi Trẻ nhỏ** (`/play/**` trên `apps/web` và toàn bộ màn chơi Canvas 2D trong `packages/game-engine`), phục vụ chương trình 100 học phần tư duy [`koguma-curriculum-program.md`](../specs/05-content/koguma-curriculum-program.md).

Mọi ràng buộc kỹ thuật bất biến vẫn thuộc quyền sở hữu của [`design-system-contract.md`](../specs/08-quality/design-system-contract.md), [`engine-render-contract.md`](../specs/01-platform/engine-render-contract.md) và [`feedback-and-celebration.md`](../specs/04-play/feedback-and-celebration.md).

---

## 1. Triết lý thẩm mỹ: Tinh thần Kuno trên chất liệu tuổi thơ Việt

Bề mặt trẻ kết hợp **sự tĩnh tại, trật tự của bàn học cụ gỗ Nhật Bản (Koguma-kai / Montessori)** với **chất liệu thủ công mộc mạc của tuổi thơ Việt Nam**:

- **Không gian bàn học ấm và tĩnh**: Mặt nền gợi trang **giấy dó kem ấm** hoặc tấm **chiếu cói đan thưa**, giúp các vật thể học tập nổi bật rõ ràng mà không gây chói mắt trên máy tính bảng.
- **Giáo cụ mộc cầm nắm được**: Khay chứa, rãnh đích, thẻ đếm và con rối gợi chất liệu **gỗ mộc vát cạnh, nan tre ngà, quạt nan, mẹt mây và đất nung tráng men dịu**.
- **Tinh giản để tư duy**: Bối cảnh văn hoá Việt xuất hiện như đường viền khay, vật đếm thật và điểm nhấn nhẹ ở rìa sân khấu — tuyệt đối không biến màn hình thành bức tranh rối mắt làm lu mờ quan hệ toán học hay logic mà trẻ đang quan sát.

---

## 2. Hệ chất liệu, Bảng màu Token và Quy tắc Bề mặt

### 2.1 Quản trị màu sắc qua Token tập trung
- **Trong `.vue` (`apps/web/app/`)**: Chỉ dùng token Tailwind kế thừa từ `@mindkid/ui` (`surface-50`…`surface-200`, `brand-*`, `cta`, `warning-*`, `success-*`). **Tuyệt đối không viết mã hex trực tiếp** trong `<template>`, `<style scoped>` hoặc `:style`.
- **Trong Canvas 2D (`packages/game-engine/`)**: Mọi sắc độ gỗ, tre, chiếu cói, lá sen, đất nung và hào quang phản hồi phải lấy từ `systems/designTokens.ts` và gọi thực thể qua tên token chuẩn (`resolveEntityColorPair`). **Tuyệt đối không đặt chuỗi hex ngoài `designTokens.ts`**.
- **Chế độ sáng cố định (Light-only)**: Toàn bộ bề mặt trẻ chỉ chạy chế độ sáng ấm áp, không gắn lớp `dark:` và không dùng sắc đỏ báo lỗi `danger` (mọi phản hồi thử lại dùng tông hổ phách ấm `retry`).

### 2.2 Ngôn ngữ chất liệu thủ công Việt Nam trên Canvas 2D
Các chi tiết chất liệu được vẽ bằng hình học Canvas 2D thuần (procedural vector primitives), không tải ảnh bitmap nặng:

| Vật liệu gốc | Ứng dụng trên sân khấu chơi | Quy tắc thể hiện |
|---|---|---|
| **Giấy dó & Chiếu cói** | Nền sân khấu chính và thảm vùng chơi | Tông kem ngà ấm, vân đan ngang dọc độ tương phản cực thấp để không nhiễu hình khối bên trên |
| **Tre ngà & Mây đan** | Khung bảng câu hỏi, khay đựng thẻ kéo, rổ phân loại | Viền dày `3px–4px` rõ khối, bo tròn `16px–24px`, điểm nhấn đốt tre tinh tế ở góc khung |
| **Gỗ mộc & Gốm mộc** | Quân cờ đếm, khối hình học 3D, cân thăng bằng, rãnh lõm đích | Đổ bóng cứng một hướng tạo độ dày vật lý; khi ấn xuống khối xẹp nhẹ tạo cảm giác chạm thật; rãnh đích có viền lõm và hào quang nam châm khi kéo lại gần |
| **Hoạ tiết văn hoá dịu** | Viền cảnh nền theo chủ đề (`scene-decor`, `scene-themes-*`) | Cánh diều giấy, búp sen hồng, luỹ tre xanh, đèn ông sao, chong chóng tre chuyển động vi mô theo `timeMs` |

### 2.3 Cổng hiệu năng cho chuyển động nền
- Mọi chuyển động vi mô của cảnh nền Việt Nam (lá tre đung đưa, mây trôi, gợn nước hồ sen) bắt buộc kiểm tra cờ `ambient_motion_enabled` từ hệ thống giảm cấp hiệu năng (`degradation.ts`) và tôn trọng `prefers-reduced-motion`.
- Khi tốc độ khung hình xuống dưới ngưỡng an toàn (42 fps trên máy tính bảng tầm thấp), cảnh nền tự động chuyển sang trạng thái tĩnh gọn nhẹ mà vẫn giữ nguyên vẹn độ mượt 60 fps của thao tác kéo–thả.
- Không cấp phát mảng hay đối tượng mới trên mỗi nhịp `requestAnimationFrame`.

---

## 3. Ánh xạ 10 Chủ đề Giáo dục Mầm non Việt Nam lên Thế giới Trẻ

Bản đồ đường mòn (`/play/map`), Phòng chơi Gấu Con (`/play`), Sân chơi Sticker (`/play/stickers`) và Hộp đồ chơi tự do (`/play/toybox`) thống nhất bối cảnh với **10 chủ đề năm học của Bộ GD&ĐT**:

| Chủ đề năm học mầm non | Mã `theme` liên kết | Hình ảnh & Đạo cụ đặc trưng tuổi thơ Việt |
|---|---|---|
| **1. Trường mầm non** | `school` | Cổng trường cờ hoa mùa thu, trống trường, kệ đồ chơi gỗ, xích đu sân nắng |
| **2. Bản thân** | `body` | Gương mây, đôi bàn tay xinh, nón vải che nắng, đôi dép quai hậu |
| **3. Gia đình** | `family`, `home` | Mái ngói đỏ, mâm cơm gia đình bát gốm đũa tre, chiếu cói hiên nhà |
| **4. Nghề nghiệp** | `job` | Xưởng mộc bác thợ, bàn xoay gốm, nón bác nông dân, ống nghe cô y tá |
| **5. Thế giới động vật** | `animal`, `farm`, `ocean` | Đàn gà con sân rơm, chú trâu đồng cỏ, cá vàng ao bèo, rạn san hô biển Việt |
| **6. Thế giới thực vật** | `nature`, `food` | Vườn chuối, đầm sen, giỏ trái cây nhiệt đới (bưởi, xoài, thanh long, vú sữa) |
| **7. Phương tiện giao thông** | `vehicle` | Xe đạp nhỏ, xích lô, đoàn tàu Bắc–Nam, thuyền nan trên sông, đèn tín hiệu |
| **8. Hiện tượng tự nhiên** | `weather`, `space` | Nắng vàng, mưa rào mùa hạ, cầu vồng sau mưa, trăng rằm đêm thu |
| **9. Quê hương – Lễ hội** | `homeland`, `festival`, `art` | Cổng làng cây đa, bánh chưng Tết, đèn ông sao Trung thu, rối nước, quạt giấy |
| **10. Bước vào lớp Một** | `school` | Cặp sách mới, bảng phấn xanh, hộp bút gỗ, hành trang sẵn sàng tới trường tiểu học |

> **Quy tắc biểu tượng điều hướng**: Mọi nút điều hướng, thanh tab và nút chức năng trên bề mặt Vue chỉ dùng biểu tượng SVG `i-lucide-*` kèm vùng chạm đạt sàn `64px–76px`. Emoji và hình vẽ vật phẩm chỉ dùng làm nội dung học tập và nhãn dán thưởng.

---

## 4. Âm sắc Ngũ cung & Nhạc cụ Mộc (`sfx-engine`)

Trải nghiệm thính giác trên bề mặt trẻ loại bỏ hoàn toàn âm điện tử chói gắt kiểu arcade, thay bằng âm hưởng mộc mạc của nhạc cụ dân gian và giáo cụ gỗ:

1. **Thang âm Ngũ cung Việt Nam (`Hò – Xự – Xang – Xê – Cống`)**:
   - Các nốt chạm chọn đồ vật, đặt khớp rãnh gỗ và chuỗi đếm tăng dần đi trên dải tần ngũ cung sáng, ấm (tương ứng quãng *C – D – F – G – A* hoặc *C – D – E – G – A* ở quãng trung dễ nghe với tai trẻ nhỏ).
   - Âm sắc tổng hợp mô phỏng **mộc cầm, ống tre đàn T'rưng, tiếng phách tre gõ nhịp** và tiếng chuông gió thanh nhẹ khi mở hộp quà Sticker.
2. **Phản hồi khi làm chưa đúng (Không trừng phạt)**:
   - Tuyệt đối không dùng tiếng còi rè (buzzer) hay quãng nghịch chói tai.
   - Khi trẻ thả chệch hoặc chọn chưa khớp, phát hai nhịp gõ gỗ trầm ấm êm ái kết hợp vầng sáng hổ phách và đưa vật trôi nhẹ về vị trí cũ để mời trẻ thử lại.
3. **An toàn thính giác mầm non**:
   - Mọi hiệu ứng âm thanh bắt buộc có đường bao tăng âm `>= 20ms` (không giật cục tức thì) và giảm âm mượt `>= 40ms`.
   - Cưỡng chế trần âm lượng tổng thể dưới `-1 dBTP` (mục tiêu độ to `-16 LUFS`).

---

## 5. Giọng văn Cô giáo Mầm non, Đối thoại Kuno & Nhịp Đồng dao

Bổ trợ cho [`06-voice.md`](06-voice.md), lời thoại hướng tới trẻ 3–6 tuổi tuân thủ tinh thần **đối thoại tư duy (*Taiwa Kyoiku*)** và âm điệu **đồng dao Việt Nam**:

### 5.1 Ba quy chuẩn câu thoại cho trẻ
1. **Câu dẫn nhiệm vụ ngắn gọn, giàu hình ảnh (`<= 12` từ)**:
   - Trẻ nghe một lần nắm ngay hành động cốt lõi; mọi câu dẫn trên màn chơi đều có giọng đọc tiếng Việt kèm theo để trẻ chưa biết chữ không bao giờ phải tự đọc chữ một mình.
   - *Nên viết*: `"Bé xếp 5 quả quýt vào hai đĩa mây nhé!"` (10 từ) · `"Đố bé tìm chú gà đứng phía sau mẹ?"` (9 từ).
   - *Không viết*: `"Hãy thực hiện phép phân tách số lượng 5 thành hai nhóm bất kỳ trên màn hình."` (khô cứng, vượt trần từ, văn phong người lớn).
2. **Câu hỏi khơi gợi tư duy thay vì ra lệnh khô khan**:
   - Dùng lời rủ rê ấm áp của cô giáo mầm non và bạn Gấu Con: *"Bé thử xem..."*, *"Đố bé biết..."*, *"Bên nào nhiều hơn nhỉ?"*, *"Điều gì vừa đổi khác thế?"*.
   - Ở thẻ hướng dẫn dành cho cha mẹ (hoạt động `offscreen`), luôn đính kèm 1 câu hỏi gợi mở *"Vì sao bé biết?"* để cha mẹ trò chuyện cùng con đúng phương pháp Kuno.
3. **Lời khích lệ mang nhịp đồng dao Việt Nam**:
   - Khi hoàn thành chặng chơi: khen nỗ lực quan sát và sự khéo léo bằng nhịp câu 4 chữ / lục bát vui tươi (*"Tinh mắt khéo tay, Gấu khen bé tài!"*, *"Một hai ba bốn, xếp gọn thật xinh!"*).
   - Khi trẻ đang loay hoay: khích lệ dịu dàng (*"Gần đúng rồi đó, mình ngắm lại chút nha!"*), không hối thúc thời gian.

### 5.2 Quy tắc hiển thị chữ tiếng Việt trên bề mặt trẻ
- Cỡ chữ tối thiểu `16px` ở mọi thành phần; câu dẫn và nhãn chính ưu tiên `20px–28px` với phông **Baloo 2** tròn trịa, rõ nét dấu.
- Chiều cao dòng (`line-height`) luôn giữ từ `1.4` trở lên để không cắt dấu thanh chồng của tiếng Việt (*ấ, ẫ, ậ, ử, ữ*).
- **Tuyệt đối không dùng `uppercase` (chữ in hoa toàn bộ)** cho câu tiếng Việt hiển thị với trẻ nhỏ nhằm bảo toàn khả năng nhận diện hình dáng chữ thường và dấu thanh.
