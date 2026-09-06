# Task #256: Chuẩn hoá toàn diện thuật ngữ âm thanh & hiển thị cho trẻ mầm non toàn dự án

> **Phạm vi toàn diện:** Rà soát và sửa toàn bộ thuật ngữ âm thanh (TTS / audio prompt) và hiển thị (canvas flashcard, HUD prompt, nhãn từ vựng, emoji, builders) trên toàn bộ hệ thống cho phù hợp với trẻ mầm non (3–6 tuổi) theo văn phong tiếng Việt chuẩn sư phạm.

---

## 1. Bản đồ các khu vực cần chuẩn hoá toàn dự án

| Khu vực | Hiện trạng chưa chuẩn | Chuẩn hoá mầm non |
|---|---|---|
| **1. Số học (C1 / Number items)** | Cộc lốc `không`, `một`, `hai`, `ba`, `bốn`... Thẻ hiển thị `ba`, TTS đọc `ba`. Prompt: `Hình nào là ba?`, `các hình ba`. | Thẻ hiển thị & TTS phát âm: `Số không`, `Số một`, `Số hai`, `Số ba`... Prompt: `Bé hãy chọn số ba`, `Đâu là số ba?`. |
| **2. Hình học & Khối (C2 / Shapes & Solids)** | Emoji tên cộc lốc `Tròn đỏ`, `Vuông xanh`, `Tam giác đỏ`, `Thoi cam`. Ghép chuỗi bị lặp: `các hình hình tròn`, `tạo hình hình tròn`. | Emoji & thẻ: `Hình tròn đỏ`, `Hình vuông xanh`, `Hình tam giác đỏ`, `Hình thoi cam`... Prompt mượt: `các hình tròn`, `tạo hình tròn`. |
| **3. Không gian & Phương hướng (C2.ORI)** | Nhãn & concept cộc lốc: `Trái`, `Phải`, `Trên`, `Dưới`, `Trước`, `Sau`, `Trong`, `Ngoài`, `Giữa`, `Góc`. | Thuật ngữ tự nhiên: `Bên trái`, `Bên phải`, `Ở trên`, `Ở dưới`, `Phía trước`, `Phía sau`, `Bên trong`, `Bên ngoài`, `Ở giữa`, `Trong góc`. |
| **4. Chữ cái & Âm vần (C5)** | Cần đảm bảo luôn có `Chữ a`, `Chữ b`, `Chữ c`. Prompt: `Đâu là chữ a?` thay vì `Hình nào là a?`. | Đồng bộ `Chữ ...`, `Âm ...`. |
| **5. Đồ vật, Con vật, Hoa quả (Emoji)** | Nhiều emoji đặt tên thiếu loại từ: `Vịt`, `Cam`, `Chanh`, `Chuối`, `Táo đỏ`... | Bổ sung loại từ chuẩn tiếng Việt: `Con vịt`, `Quả cam`, `Quả chanh`, `Quả chuối`, `Quả táo đỏ`... |
| **6. Giao diện & Câu lệnh Canvas** | Canvas hiện `Khái niệm: Nhận biết số 0-3` (hàn lâm). Review hiện `Ôn tập: ...` (quản trị). | Bỏ `Khái niệm: `, hiển thị trực tiếp tên bài học. Bỏ tiền tố `Ôn tập: `. |
| **7. Toàn bộ 37 Content Builders** | Rà soát và sửa câu prompt ở `gt-000.ts` .. `gt-036.ts` để sinh câu tự nhiên không lỗi ghép từ. | Sử dụng helper `formatChildPrompt` / `formatChildTerm`. |

---

## 2. Kế hoạch triển khai theo 7 gói công việc (Work Packages)

### WP256.1: Bộ thư viện chuẩn hoá ngôn ngữ mầm non (`preschool-terminology.ts`)
- Tạo module tiện ích chuẩn hoá ngôn ngữ:
  - `formatDisplayLabel(label, opts)`: Sinh nhãn hiển thị trực quan (`Số ba`, `Hình tròn`, `Con vịt`, `Quả cam`).
  - `formatSpokenLabel(label, opts)`: Sinh chuỗi đọc TTS rõ ràng, dễ nghe.
  - `formatChildPrompt(action, label, opts)`: Sinh câu dẫn tự nhiên (`Đâu là ...?`, `Bé hãy chọn ... nhé!`).
  - `formatPluralNoun(label)`: Xử lý số nhiều không lặp từ (`các hình tròn`, `các chú vịt`, `các quả táo`).

### WP256.2: Game Engine & Flashcard Intro (GT-000 / `session.ts`)
- `drawNumberContent`: Nhãn dưới thẻ hiển thị `Số ba` (hoặc `Số ...`).
- `drawNonNumberContent`: Nhãn dưới thẻ hiển thị `Hình ...` với hình học.
- `playPresentAudio` & `playEchoModel`: TTS đọc đầy đủ, tự nhiên (`Số ba`, `Hình tròn`, `Chữ a`).
- `getStepPromptText`: Chuẩn hoá câu lệnh mẫu (`Đây là số ba`, `Bé nói theo cô nhé: số ba`, `Đâu là số ba?`).
- `drawSubPromptText`: Xoá chữ `Khái niệm: `, hiển thị tên bài học thân thiện.

### WP256.3: Rà soát toàn bộ 37 Builders (`packages/content/src/builders/`)
- `gt-000.ts`: Chuẩn hoá narration, echo, recognise, recall (`Đâu là ...?`), bỏ tiền tố `Ôn tập: `.
- `gt-001.ts`: Dùng `formatChildPrompt`.
- `gt-002.ts`: Sửa lỗi `các hình hình tròn` và `các hình số ba`.
- `gt-003.ts`: Sửa lỗi `các hình ${targetAttr}`.
- `gt-004.ts`: Đổi `các hình` thành `các đồ vật / các bạn` khi là con vật/hoa quả.
- `gt-006.ts`, `gt-012.ts`, `gt-022.ts`, `gt-024.ts`, `gt-026.ts`, `gt-029.ts`, `gt-036.ts`: Chuẩn hoá toàn bộ prompt text.

### WP256.4: Rà soát & chuẩn hoá kho Emoji (`packages/emoji/src/data/`)
- `shape-color.ts`: Đổi toàn bộ `Tròn đỏ` -> `Hình tròn đỏ`, `Vuông đỏ` -> `Hình vuông đỏ`, `Tam giác đỏ` -> `Hình tam giác đỏ`, `Thoi cam` -> `Hình thoi cam`...
- `fruit.ts`: Bổ sung loại từ (`Quả cam`, `Quả chuối`, `Quả chanh`, `Chùm nho`, `Quả dưa hấu`...).
- `animal-farm.ts`, `animal-wild.ts`: Bổ sung loại từ (`Con vịt`, `Con bò`, `Con ngựa`...).

### WP256.5: Rà soát & chuẩn hoá Kho dữ liệu Kỹ năng (C1 .. C6)
- `packages/content-build/scripts/generate-skill-datasets.ts`:
  - `NUMBER_ITEMS`: Chuẩn hoá nhãn `Số không`, `Số một`, `Số hai`, `Số ba`...
  - `generatePhrasingForSkill`: Sửa `hint_message` để không ghép cứng `hình {label}`.
- C1: Rà soát 47 file kỹ năng số học có nhãn `ba`, `hai`, `một` -> cập nhật thành `Số ...`.
- C2.ORI: Cập nhật 10 file kỹ năng định hướng không gian (`Trái` -> `Bên trái`, `Trên` -> `Ở trên`...).

### WP256.6: Audio Playback & Replay trên Web Player (`/play/[code].vue`)
- Rà soát hàm `playInstructionNarration` và `replayInstructionAudio`.
- Đảm bảo văn bản truyền vào `engine.audio.speakPrompt` được chuẩn hoá qua `preschool-terminology`.

### WP256.7: Verification Gates & Manual Verification
- Chạy toàn bộ gates: `biome check .`, `check-value-inventory`, `check-intro-coverage`, `typecheck`.
- Kiểm tra trực quan màn hình học & nghe thử phát âm TTS trên trình duyệt.
