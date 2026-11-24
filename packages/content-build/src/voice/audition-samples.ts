import type {
  AuditionSampleSpec,
  VoiceEngineDescriptor,
  VoiceEngineId,
} from "#src/voice/types";

export const VOICE_ENGINE_DESCRIPTORS: readonly VoiceEngineDescriptor[] = [
  {
    id: "edge-hoaimy",
    label_vi: "Edge Neural · Hoài My (Chuẩn)",
    badge_vi: "Online miễn phí · Tự nhiên ấm áp",
    description_vi:
      "Microsoft Edge Neural vi-VN-HoaiMyNeural nguyên bản, hậu kỳ FFmpeg tốc độ 0.92x chuẩn -16 LUFS.",
    is_free: true,
    is_offline: false,
    default_speed: 0.92,
    pitch_shift_factor: 1,
  },
  {
    id: "edge-hoaimy-teacher",
    label_vi: "Edge Neural · Hoài My Cô Giáo Mầm Non",
    badge_vi: "Online miễn phí · Dịu dàng mầm non",
    description_vi:
      "Biến thể cô giáo mầm non từ HoaiMyNeural (rate -8% từ engine + nâng formant/pitch nhẹ +2% qua DSP).",
    is_free: true,
    is_offline: false,
    default_speed: 1,
    pitch_shift_factor: 1.02,
  },
  {
    id: "vieneu-myduyen",
    label_vi: "VieNeu v3 Nano · Mỹ Duyên (Đọc truyện Bắc)",
    badge_vi: "100% Offline ONNX CPU · Biểu cảm kể chuyện",
    description_vi:
      "Mô hình VieNeu-TTS v3 Nano chạy thuần ONNX CPU trên Intel Mac, giọng nữ miền Bắc phong cách kể chuyện ấm áp.",
    is_free: true,
    is_offline: true,
    default_speed: 0.94,
    pitch_shift_factor: 1,
  },
  {
    id: "vieneu-trucly",
    label_vi: "VieNeu v3 Nano · Trúc Ly (Tự nhiên Bắc)",
    badge_vi: "100% Offline ONNX CPU · Trong trẻo tự nhiên",
    description_vi:
      "Mô hình VieNeu-TTS v3 Nano ONNX CPU, giọng nữ miền Bắc tự nhiên, phát âm tròn vành rõ chữ.",
    is_free: true,
    is_offline: true,
    default_speed: 0.94,
    pitch_shift_factor: 1,
  },
  {
    id: "vieneu-teacher-clone",
    label_vi: "VieNeu v3 Nano · Clone Giọng Cô Giáo TiniMath",
    badge_vi: "100% Offline ONNX CPU · Zero-shot Clone",
    description_vi:
      "Zero-shot voice cloning trực tiếp từ mẫu thu âm giọng cô giáo gốc của TiniMath (flash_memory_intro + co_may_hinh_chon).",
    is_free: true,
    is_offline: true,
    default_speed: 0.95,
    pitch_shift_factor: 1,
  },
  {
    id: "piper-vais1000",
    label_vi: "Piper ONNX · VAIS-1000 (Phòng thu Bắc)",
    badge_vi: "100% Offline Siêu tốc · ~0.5s/câu",
    description_vi:
      "Mô hình VITS vi_VN-vais1000-medium chạy offline siêu tốc trên CPU Intel, âm lượng đồng đều.",
    is_free: true,
    is_offline: true,
    default_speed: 0.9,
    pitch_shift_factor: 1,
  },
  {
    id: "piper-25hours",
    label_vi: "Piper ONNX · 25Hours Single (Nhẹ)",
    badge_vi: "100% Offline Siêu nhẹ · ~0.3s/câu",
    description_vi:
      "Mô hình VITS vi_VN-25hours_single-low dung lượng nhẹ chạy offline cực nhanh trên CPU.",
    is_free: true,
    is_offline: true,
    default_speed: 0.9,
    pitch_shift_factor: 1,
  },
  {
    id: "elevenlabs",
    label_vi: "ElevenLabs Multilingual v2 (Mở rộng)",
    badge_vi: "Cần API Key · Cloud",
    description_vi: "Hỗ trợ mở rộng qua biến môi trường ELEVENLABS_API_KEY.",
    is_free: false,
    is_offline: false,
    default_speed: 0.95,
    pitch_shift_factor: 1,
    requires_env_key: "ELEVENLABS_API_KEY",
  },
  {
    id: "openai",
    label_vi: "OpenAI gpt-4o-mini-tts (Mở rộng)",
    badge_vi: "Cần API Key · Cloud",
    description_vi: "Hỗ trợ mở rộng qua biến môi trường OPENAI_API_KEY.",
    is_free: false,
    is_offline: false,
    default_speed: 0.95,
    pitch_shift_factor: 1,
    requires_env_key: "OPENAI_API_KEY",
  },
  {
    id: "gemini",
    label_vi: "Google Gemini TTS (Mở rộng)",
    badge_vi: "Cần API Key · Cloud",
    description_vi: "Hỗ trợ mở rộng qua biến môi trường GEMINI_API_KEY.",
    is_free: false,
    is_offline: false,
    default_speed: 0.95,
    pitch_shift_factor: 1,
    requires_env_key: "GEMINI_API_KEY",
  },
] as const;

export function findVoiceEngineDescriptor(
  engineId: string
): VoiceEngineDescriptor | undefined {
  return VOICE_ENGINE_DESCRIPTORS.find((item) => item.id === engineId);
}

export function isVoiceEngineId(value: string): value is VoiceEngineId {
  return VOICE_ENGINE_DESCRIPTORS.some((item) => item.id === value);
}

export const AUDITION_SAMPLES_12: readonly AuditionSampleSpec[] = [
  {
    id: "S01",
    category: "round_instruction",
    note_vi: "Câu dẫn đếm vật thật C1 (Koguma Jibutsu)",
    raw_text: "Bé hãy chạm đếm xem trên khay gỗ có mấy quả táo đỏ nhé!",
  },
  {
    id: "S02",
    category: "round_instruction",
    note_vi: "Chuyển đổi tỷ lệ tiến độ (2/5) & chữ số sang lời đọc tự nhiên",
    raw_text: "Bé hãy xếp đủ 5 hạt gỗ vào rổ mây nhé! (2/5)",
  },
  {
    id: "S03",
    category: "round_instruction",
    note_vi: "Đọc biểu thức toán học (+, =) sang tiếng Việt mầm non",
    raw_text: "Gộp hai giỏ lại: 3 + 2 = mấy nhỉ?",
  },
  {
    id: "S04",
    category: "gt000_step",
    note_vi: "Bước tập nói GT-000 & đọc chuẩn 'số 0' thành 'số không'",
    raw_text: "Bé nói theo cô nhé: Số 0",
  },
  {
    id: "S05",
    category: "gt000_step",
    note_vi: "Bước nhận diện hình học không gian C2",
    raw_text: "Bé hãy chỉ cho cô hình tam giác màu vàng nhé!",
  },
  {
    id: "S06",
    category: "skill_item",
    note_vi: "Nhãn khái niệm ngắn (kiểm tra ngắt âm cuối & không nuốt chữ)",
    raw_text: "Số mười lăm",
  },
  {
    id: "S07",
    category: "skill_item",
    note_vi: "Nhãn văn hoá tuổi thơ Việt (thanh điệu sắc - huyền - ngã - nặng)",
    raw_text: "Cánh diều tuổi thơ",
  },
  {
    id: "S08",
    category: "encouragement",
    note_vi: "Câu đồng dao mừng hoàn thành màn chơi (nhịp vần 4 chữ)",
    raw_text: "Dung dăng dung dẻ, bé giỏi quá nè!",
  },
  {
    id: "S09",
    category: "encouragement",
    note_vi: "Lời khích lệ dịu dàng khi trẻ làm chưa đúng (không phán xét)",
    raw_text: "Gần đúng rồi đó, mình ngắm lại chút nha!",
  },
  {
    id: "S10",
    category: "koguma_guide",
    note_vi: "Câu dài Góc Ba Mẹ (Koguma Jibutsu & Taiwa đối thoại)",
    raw_text:
      "Góc ba mẹ chơi cùng bé. Đồ vật quanh nhà: Đôi đũa tre và bát ăn cơm. Câu hỏi gợi mở: Đố bé ghép hai chiếc đũa thành mấy đôi nhỉ?",
  },
  {
    id: "S11",
    category: "kid_ui",
    note_vi: "Lời chào Gấu Con tại Phòng chơi Giấy Gỗ Mộc",
    raw_text: "Gấu Con chào bé! Chạm đập tay dạo vườn quê cùng mình nhé!",
  },
  {
    id: "S12",
    category: "kid_ui",
    note_vi: "Lời giới thiệu Khay Giáo Cụ Montessori tự do",
    raw_text:
      "Chào mừng bé đến bàn Cân Gỗ Bạn Thú! Hãy đặt các bạn lên hai đĩa cân xem bên nào nặng hơn nhé!",
  },
] as const;
