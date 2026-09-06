# Bản kiểm kê Audio & Phương án triển khai âm thanh C5 (Task #255 / WP255.7)

> **Căn cứ:** [`255-c5-recognition-split-plan.md`](255-c5-recognition-split-plan.md) §6 (D-TE) & §7 (WP255.7).
> **Trạng thái:** Đã kiểm kê và xác định hai rổ độc lập: Rổ giá trị (231 mục) và Rổ câu thoại (140 câu).

---

## 1. Kiểm kê chính xác số lượng mục âm thanh

Theo nguyên tắc tách bạch: **Rổ giá trị** (phát âm chuẩn âm vị/từ vựng) tách rời khỏi **Rổ câu thoại** (lời dẫn, chỉ dẫn, khen ngợi theo `phrasing`).

### 1.1 Rổ giá trị (Value Inventory) — 231 mục

| Nhóm | Strand | Số mục | Mô tả ngữ âm / nội dung | Nguồn dữ liệu |
|---|---|---:|---|---|
| Dấu thanh | `C5.TMK` | **6** | Ngang (`—`), Huyền (`ˋ`), Sắc (`ˊ`), Nặng (`﹒`), Hỏi (`̉`), Ngã (`˜`) | `c5-tone-mark.ts` |
| Vần | `C5.RIM` | **53** | 12 nguyên âm đơn + 11 vần đóng `n` + 10 vần đóng `m/ng` + 9 vần đóng `c/t/p` + 5 vần đệm + 6 nguyên âm đôi | `c5-rime.ts` |
| Âm đầu | `C5.ONS` | **22** | 22 âm vị đầu (b, c/k/q, d/gi, đ, g/gh, h, l, m, n, ng/ngh, nh, p, ph, r, s, t, th, tr, v, x, ch, kh) + 2 khái niệm âm đầu/vần | `c5-onset.ts` |
| Từ vựng GDMN | `C5.VOC` | **150** | 15 nhóm chủ đề năm học GDMN (mỗi nhóm 8–12 từ vựng chuẩn tiếng Việt) | `c5-vocabulary.ts` |
| **Tổng cộng** | | **231** | **Mục phát âm mẫu cốt lõi** | |

### 1.2 Rổ câu thoại (Phrasing Inventory) — 140 câu

Mỗi kỹ năng trong số 35 kỹ năng nhận biết C5 mới có 4 mẫu câu thoại:
1. `prompt_template`: Lời nhắc bé thực hiện thử thách ("Bé hãy chọn đúng {label} nhé!")
2. `narration_template`: Lời dẫn mở đầu bài học ("Chúng mình cùng tìm hiểu về {label} nhé")
3. `success_message`: Lời khen ngợi khi hoàn thành ("Hoan hô, bé đã chọn đúng rồi!")
4. `hint_message`: Gợi ý khi bé lúng túng ("Bé hãy nhìn kỹ {label} nhé!")

Tổng số câu thoại: 35 kỹ năng × 4 câu = **140 câu thoại**.

---

## 2. Hai phương án triển khai D-TE kèm ước lượng chi phí

### Phương án A: Trình diễn qua Web Speech Synthesis / Edge TTS (Đề xuất giai đoạn 1)
- **Cơ chế:**
  - Sử dụng Web Speech API client-side giọng chuẩn tiếng Việt (`vi-VN`) có sẵn trên trình duyệt di động/tablet (`SpeechSynthesisAdapter`).
  - Dự phòng kết hợp tệp nén audio offline đã có trong `apps/web/public/audio/voice/` (742 mp3 sẵn có).
- **Chi phí phát sinh:** **0 VNĐ**.
- **Ưu điểm:**
  - Triển khai tức thì, không phụ thuộc vào phòng thu âm.
  - Zero-latency mạng, hoạt động offline 100% khi trẻ chơi trên thiết bị tablet.
  - Hoàn toàn tuân thủ `BR-CIR-21` (không thu âm, không gửi dữ liệu giọng nói của trẻ đi đâu).
- **Hạn chế:** Một số dấu thanh hoặc vần đứng một mình có thể cần tinh chỉnh ngữ điệu TTS.

### Phương án B: Thu âm diễn viên giọng đọc mầm non chuyên nghiệp (Production Studio)
- **Cơ chế:**
  - Thu âm phòng thu chuẩn studio: 231 từ/âm giá trị + 140 câu thoại = 371 tệp âm thanh `.mp3` / `.webm`.
  - Giọng nữ miền Bắc hoặc miền Nam truyền cảm, tốc độ 80-90 từ/phút chuẩn sư phạm mầm non.
- **Chi phí ước tính:** ~**5.000.000 – 10.000.000 VNĐ** (chi phí voice talent + kỹ thuật làm sạch tạp âm + cắt ghép chuẩn bitrate).
- **Ưu điểm:** Chất lượng âm thanh chuẩn xác 100% về ngữ âm học tiếng Việt cho trẻ học vần và dấu thanh.
- **Thời gian hoàn thành:** 1–2 tuần làm việc cùng studio đối tác.

---

## 3. Tích hợp bước `echo` trong `GT-000` (Task #254)

- Engine `GT-000` đã được trang bị bước `echo` (tập nói theo):
  1. Máy phát âm mẫu qua `playEchoModel`.
  2. Trẻ nghe và nhắc lại thành tiếng tự do.
  3. Trẻ chạm nút để xác nhận hoàn thành bước nói theo.
  4. **Bảo mật bất biến:** Bước `echo` Cấm — NEVER mở micro, NEVER ghi âm giọng nói của trẻ, NEVER phát sinh telemetry mang payload âm thanh (đã xác thực qua test `BR-CIR-21` trong `gt-000.test.ts`).
