# Task #256: Checklist chuẩn hoá toàn diện thuật ngữ âm thanh & hiển thị cho trẻ mầm non toàn dự án

- [x] **WP256.1: Bộ thư viện chuẩn hoá ngôn ngữ mầm non (`preschool-terminology.ts`)**
  - [x] Tạo `packages/shared/src/preschool-terminology.ts` (export sang shared và game-engine/content)
  - [x] Triển khai `formatDisplayLabel`: xử lý số (`Số ba`), hình (`Hình tròn`), chữ (`Chữ a`), con vật/đồ vật
  - [x] Triển khai `formatSpokenLabel`: xử lý đọc phát âm TTS chuẩn mầm non
  - [x] Triển khai `formatChildPrompt`: sinh câu hỏi/câu dẫn chuẩn tiếng Việt mầm non
  - [x] Triển khai `formatPluralNoun`: xử lý số nhiều tránh lặp từ (`các hình tròn`, `các quả táo`)

- [x] **WP256.2: Game Engine & Flashcard Intro (`GT-000/session.ts`)**
  - [x] `drawNumberContent`: nhãn dưới thẻ hiển thị `Số ...`
  - [x] `drawNonNumberContent`: nhãn dưới thẻ hiển thị `Hình ...` với hình học
  - [x] `playPresentAudio`: phát âm TTS câu hoàn chỉnh `Đây là số ba` (hoặc `Số ba`)
  - [x] `playEchoModel`: phát âm TTS mẫu chuẩn `Số ba`, `Hình tròn`, `Chữ a`
  - [x] `getStepPromptText`: chuẩn hoá toàn bộ câu lệnh mẫu mầm non
  - [x] `drawSubPromptText`: bỏ từ hàn lâm `Khái niệm: `, hiển thị trực tiếp tên bài học

- [x] **WP256.3: Rà soát & chuẩn hoá 37 Builders (`packages/content/src/builders/`)**
  - [x] `gt-000.ts`: Chuẩn hoá narration/echo/recognise, sửa recall thành `Đâu là ${label}?`, bỏ `Ôn tập: `
  - [x] `gt-001.ts`: Chuẩn hoá prompt chọn đối tượng
  - [x] `gt-002.ts`: Xoá bỏ lỗi lặp từ `các hình hình tròn` và `các hình số ba`
  - [x] `gt-003.ts`: Chuẩn hoá câu kéo vào giỏ
  - [x] `gt-004.ts`, `gt-006.ts`, `gt-012.ts`, `gt-022.ts`, `gt-024.ts`, `gt-026.ts`, `gt-029.ts`, `gt-036.ts`: Rà soát & sửa chuỗi prompt cứng

- [x] **WP256.4: Rà soát & chuẩn hoá kho Emoji (`packages/emoji/src/data/`)**
  - [x] `shape-color.ts`: Đổi `Tròn đỏ` -> `Hình tròn đỏ`, `Vuông đỏ` -> `Hình vuông đỏ`, `Tam giác đỏ` -> `Hình tam giác đỏ`, `Thoi cam` -> `Hình thoi cam`...
  - [x] `fruit.ts`: Bổ sung loại từ (`Quả cam`, `Quả chuối`, `Quả chanh`, `Chùm nho`, `Quả dưa hấu`...)
  - [x] `animal-farm.ts`, `animal-wild.ts`, `animal-water.ts`: Bổ sung loại từ (`Con vịt`, `Con bò`, `Con ngựa`, `Con cá`...)
  - [x] `vegetable.ts`: Bổ sung loại từ (`Củ cà rốt`, `Bắp ngô`, `Củ khoai tây`...)

- [x] **WP256.5: Rà soát & chuẩn hoá Dữ liệu Kỹ năng (C1 .. C6)**
  - [x] `packages/content-build/scripts/generate-skill-datasets.ts`: chuẩn hoá `NUMBER_ITEMS` (`Số không` .. `Số hai mươi`) và `hint_message`
  - [x] C1: Cập nhật 46 file kỹ năng số học có nhãn `ba`, `hai`, `một` -> `Số ba`, `Số hai`, `Số một`
  - [x] C2.ORI: Cập nhật 10 file kỹ năng định hướng (`Trái` -> `Bên trái`, `Trên` -> `Phía trên`...)

- [x] **WP256.6: Audio Playback & Replay trên Web Player (`/play/[code].vue`)**
  - [x] Kiểm tra luồng gọi `engine.audio.speakPrompt` trong `playInstructionNarration`
  - [x] Đảm bảo văn bản audio prompt chuẩn hoá trước khi phát âm

- [x] **WP256.7: Verification Gates & Kiểm thử**
  - [x] Chạy `pnpm check` (biome + value-inventory + intro-coverage + typecheck) đạt exit 0
  - [x] Kiểm tra trực quan thẻ Flashcard GT-000 và các mini-game trên trình duyệt
  - [x] Kiểm tra audio TTS phát âm tự nhiên
