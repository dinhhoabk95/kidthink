/**
 * Spec sở hữu: docs/specs/05-content/content-theme-registry.md
 * Rules: BR-CTR-01, BR-CTR-08, BR-CTR-09, BR-CTR-12
 *
 * Single Source of Truth cho 14 giá trị trục chủ đề (theme).
 * Bất kỳ nơi nào khác trong monorepo đều phải import từ file này.
 */

export interface ThemeNoun {
  text_vi: string;
  emoji_ref: string;
}

export interface ContentTheme {
  code: string;
  label_vi: string;
  label: string; // alias for tag seed & general display
  age_floor: 3 | 4 | 5 | 6;
  icon_emoji_ref: string;
  description: string;
  nouns: readonly ThemeNoun[];
}

export const CONTENT_THEMES: readonly ContentTheme[] = [
  {
    code: "school",
    label_vi: "Trường học",
    label: "Trường học",
    age_floor: 3,
    icon_emoji_ref: "🏫",
    description: "Lớp học, đồ dùng học tập, bàn ghế, sách vở",
    nouns: [
      { text_vi: "Trường học", emoji_ref: "🏫" },
      { text_vi: "Cặp sách", emoji_ref: "🎒" },
      { text_vi: "Bút chì", emoji_ref: "✏️" },
      { text_vi: "Sách", emoji_ref: "📚" },
      { text_vi: "Thước kẻ", emoji_ref: "📏" },
      { text_vi: "Sách mở", emoji_ref: "📖" },
      { text_vi: "Cái kéo", emoji_ref: "✂️" },
      { text_vi: "Bút sáp", emoji_ref: "🖍️" },
      { text_vi: "Cái chuông", emoji_ref: "🔔" },
      { text_vi: "Bàn tính", emoji_ref: "🧮" },
    ],
  },
  {
    code: "farm",
    label_vi: "Nông trại",
    label: "Nông trại",
    age_floor: 3,
    icon_emoji_ref: "🚜",
    description: "Nông trại, vật nuôi, cây trồng, chuồng trại",
    nouns: [
      { text_vi: "Máy kéo", emoji_ref: "🚜" },
      { text_vi: "Bò sữa", emoji_ref: "🐮" },
      { text_vi: "Gà trống", emoji_ref: "🐓" },
      { text_vi: "Heo", emoji_ref: "🐷" },
      { text_vi: "Lúa", emoji_ref: "🌾" },
      { text_vi: "Cừu", emoji_ref: "🐑" },
      { text_vi: "Dê", emoji_ref: "🐐" },
      { text_vi: "Ngựa", emoji_ref: "🐴" },
      { text_vi: "Vịt", emoji_ref: "🦆" },
      { text_vi: "Gà mái", emoji_ref: "🐔" },
    ],
  },
  {
    code: "home",
    label_vi: "Gia đình & Nhà bếp",
    label: "Gia đình & Nhà bếp",
    age_floor: 3,
    icon_emoji_ref: "🏠",
    description: "Nhà cửa, phòng ốc, đồ dùng trong nhà, nhà bếp",
    nouns: [
      { text_vi: "Ngôi nhà", emoji_ref: "🏠" },
      { text_vi: "Cái giường", emoji_ref: "🛏️" },
      { text_vi: "Cái ghế", emoji_ref: "🪑" },
      { text_vi: "Cái cửa", emoji_ref: "🚪" },
      { text_vi: "Nồi thức ăn", emoji_ref: "🍲" },
      { text_vi: "Ghế sofa", emoji_ref: "🛋️" },
      { text_vi: "Cửa sổ", emoji_ref: "🪟" },
      { text_vi: "Cái thìa", emoji_ref: "🥄" },
      { text_vi: "Cái đĩa", emoji_ref: "🍽️" },
      { text_vi: "Cái chổi", emoji_ref: "🧹" },
    ],
  },
  {
    code: "animal",
    label_vi: "Động vật",
    label: "Động vật hoang dã",
    age_floor: 3,
    icon_emoji_ref: "🦁",
    description: "Động vật hoang dã, rừng rậm, khủng long",
    nouns: [
      { text_vi: "Sư tử", emoji_ref: "🦁" },
      { text_vi: "Voi", emoji_ref: "🐘" },
      { text_vi: "Hổ", emoji_ref: "🐯" },
      { text_vi: "Khỉ", emoji_ref: "🐵" },
      { text_vi: "Hươu cao cổ", emoji_ref: "🦒" },
      { text_vi: "Gấu", emoji_ref: "🐻" },
      { text_vi: "Cáo", emoji_ref: "🦊" },
      { text_vi: "Gấu trúc", emoji_ref: "🐼" },
      { text_vi: "Ngựa vằn", emoji_ref: "🦓" },
      { text_vi: "Thỏ", emoji_ref: "🐰" },
    ],
  },
  {
    code: "nature",
    label_vi: "Thiên nhiên & Bốn mùa",
    label: "Thiên nhiên & Bốn mùa",
    age_floor: 3,
    icon_emoji_ref: "🌳",
    description: "Cây cỏ, hoa lá, công viên, bốn mùa, phong cảnh",
    nouns: [
      { text_vi: "Cây xanh", emoji_ref: "🌳" },
      { text_vi: "Hoa hướng dương", emoji_ref: "🌻" },
      { text_vi: "Cỏ bốn lá", emoji_ref: "🍀" },
      { text_vi: "Núi", emoji_ref: "⛰️" },
      { text_vi: "Lá phong", emoji_ref: "🍁" },
      { text_vi: "Hoa hồng", emoji_ref: "🌹" },
      { text_vi: "Hoa tulip", emoji_ref: "🌷" },
      { text_vi: "Xương rồng", emoji_ref: "🌵" },
      { text_vi: "Cây cọ", emoji_ref: "🌴" },
      { text_vi: "Mầm cây", emoji_ref: "🌱" },
    ],
  },
  {
    code: "ocean",
    label_vi: "Đại dương",
    label: "Đại dương",
    age_floor: 4,
    icon_emoji_ref: "🐳",
    description: "Biển cả, sinh vật biển, san hô, thế giới dưới nước",
    nouns: [
      { text_vi: "Cá voi", emoji_ref: "🐳" },
      { text_vi: "Cá heo", emoji_ref: "🐬" },
      { text_vi: "Bạch tuộc", emoji_ref: "🐙" },
      { text_vi: "Cua", emoji_ref: "🦀" },
      { text_vi: "Cá mập", emoji_ref: "🦈" },
      { text_vi: "Con cá", emoji_ref: "🐟" },
      { text_vi: "Rùa biển", emoji_ref: "🐢" },
      { text_vi: "Con tôm", emoji_ref: "🦐" },
      { text_vi: "Con sứa", emoji_ref: "🪼" },
      { text_vi: "Vỏ sò", emoji_ref: "🐚" },
    ],
  },
  {
    code: "food",
    label_vi: "Món ăn & Thực phẩm",
    label: "Món ăn & Thực phẩm",
    age_floor: 3,
    icon_emoji_ref: "🍎",
    description: "Thức ăn, bữa ăn, rau củ, trái cây, bánh ngọt",
    nouns: [
      { text_vi: "Táo đỏ", emoji_ref: "🍎" },
      { text_vi: "Chuối", emoji_ref: "🍌" },
      { text_vi: "Bánh mì", emoji_ref: "🍞" },
      { text_vi: "Cà rốt", emoji_ref: "🥕" },
      { text_vi: "Bắp ngô", emoji_ref: "🌽" },
      { text_vi: "Cơm", emoji_ref: "🌾" },
      { text_vi: "Mì", emoji_ref: "🍜" },
      { text_vi: "Bánh ngọt", emoji_ref: "🍰" },
      { text_vi: "Quả trứng", emoji_ref: "🥚" },
      { text_vi: "Sữa", emoji_ref: "🥛" },
    ],
  },
  {
    code: "vehicle",
    label_vi: "Phương tiện giao thông",
    label: "Phương tiện giao thông",
    age_floor: 3,
    icon_emoji_ref: "🚗",
    description:
      "Phương tiện đường bộ, đường sắt, đường thủy, đường hàng không",
    nouns: [
      { text_vi: "Ô tô", emoji_ref: "🚗" },
      { text_vi: "Xe buýt", emoji_ref: "🚌" },
      { text_vi: "Máy bay", emoji_ref: "✈️" },
      { text_vi: "Tàu hoả", emoji_ref: "🚆" },
      { text_vi: "Tàu thủy", emoji_ref: "🚢" },
      { text_vi: "Xe đạp", emoji_ref: "🚲" },
      { text_vi: "Xe tải", emoji_ref: "🚛" },
      { text_vi: "Trực thăng", emoji_ref: "🚁" },
      { text_vi: "Thuyền buồm", emoji_ref: "⛵" },
      { text_vi: "Xe máy", emoji_ref: "🏍️" },
    ],
  },
  {
    code: "art",
    label_vi: "Nghệ thuật & Âm nhạc",
    label: "Nghệ thuật & Âm nhạc",
    age_floor: 4,
    icon_emoji_ref: "🎨",
    description: "Vẽ tranh, âm nhạc, nhạc cụ, thủ công, màu sắc",
    nouns: [
      { text_vi: "Bảng vẽ", emoji_ref: "🎨" },
      { text_vi: "Cây đàn ghi-ta", emoji_ref: "🎸" },
      { text_vi: "Kèn saxophone", emoji_ref: "🎷" },
      { text_vi: "Nốt nhạc", emoji_ref: "🎶" },
      { text_vi: "Trống", emoji_ref: "🥁" },
      { text_vi: "Đàn piano", emoji_ref: "🎹" },
      { text_vi: "Đàn vi-ô-lông", emoji_ref: "🎻" },
      { text_vi: "Kèn trumpet", emoji_ref: "🎺" },
      { text_vi: "Bút sáp màu", emoji_ref: "🖍️" },
      { text_vi: "Máy ảnh", emoji_ref: "📷" },
    ],
  },
  {
    code: "space",
    label_vi: "Vũ trụ",
    label: "Vũ trụ",
    age_floor: 5,
    icon_emoji_ref: "🚀",
    description: "Vũ trụ, các hành tinh, phi thuyền, ngôi sao",
    nouns: [
      { text_vi: "Tên lửa", emoji_ref: "🚀" },
      { text_vi: "Hành tinh", emoji_ref: "🪐" },
      { text_vi: "Ngôi sao", emoji_ref: "🌟" },
      { text_vi: "Phi hành gia", emoji_ref: "🧑‍🚀" },
      { text_vi: "Đĩa bay", emoji_ref: "🛸" },
      { text_vi: "Trái đất", emoji_ref: "🌍" },
      { text_vi: "Trăng lưỡi liềm", emoji_ref: "🌙" },
      { text_vi: "Sao chổi", emoji_ref: "☄️" },
      { text_vi: "Trăng tròn", emoji_ref: "🌕" },
      { text_vi: "Ánh sao", emoji_ref: "✨" },
    ],
  },
  {
    code: "family",
    label_vi: "Gia đình",
    label: "Gia đình",
    age_floor: 3,
    icon_emoji_ref: "👨‍👩‍👦",
    description: "Gia đình, ông bà, cha mẹ, anh chị em, người thân",
    nouns: [
      { text_vi: "Gia đình", emoji_ref: "👨‍👩‍👦" },
      { text_vi: "Em bé", emoji_ref: "👶" },
      { text_vi: "Bà", emoji_ref: "👵" },
      { text_vi: "Ông", emoji_ref: "👴" },
      { text_vi: "Mẹ", emoji_ref: "👩" },
      { text_vi: "Bố", emoji_ref: "👨" },
      { text_vi: "Đôi vợ chồng", emoji_ref: "👫" },
      { text_vi: "Bé gái", emoji_ref: "👧" },
      { text_vi: "Bé trai", emoji_ref: "👦" },
      { text_vi: "Nhà có vườn", emoji_ref: "🏡" },
    ],
  },
  {
    code: "body",
    label_vi: "Cơ thể & Giác quan",
    label: "Cơ thể & Giác quan",
    age_floor: 3,
    icon_emoji_ref: "👀",
    description: "Cơ thể, ngũ quan, bộ phận cơ thể, sức khỏe",
    nouns: [
      { text_vi: "Mắt", emoji_ref: "👀" },
      { text_vi: "Tai", emoji_ref: "👂" },
      { text_vi: "Mũi", emoji_ref: "👃" },
      { text_vi: "Miệng", emoji_ref: "👄" },
      { text_vi: "Bàn chân", emoji_ref: "🦶" },
      { text_vi: "Lưỡi", emoji_ref: "👅" },
      { text_vi: "Cái răng", emoji_ref: "🦷" },
      { text_vi: "Bàn tay", emoji_ref: "✋" },
      { text_vi: "Cái chân", emoji_ref: "🦵" },
      { text_vi: "Trái tim", emoji_ref: "🫀" },
    ],
  },
  {
    code: "weather",
    label_vi: "Thời tiết",
    label: "Thời tiết",
    age_floor: 3,
    icon_emoji_ref: "☀️",
    description: "Thời tiết, nắng mưa, gió bão, hiện tượng tự nhiên",
    nouns: [
      { text_vi: "Mặt trời", emoji_ref: "☀️" },
      { text_vi: "Mây", emoji_ref: "☁️" },
      { text_vi: "Mưa", emoji_ref: "🌧️" },
      { text_vi: "Cầu vồng", emoji_ref: "🌈" },
      { text_vi: "Bông tuyết", emoji_ref: "❄️" },
      { text_vi: "Người tuyết", emoji_ref: "⛄" },
      { text_vi: "Giông bão", emoji_ref: "⛈️" },
      { text_vi: "Ô che mưa", emoji_ref: "☔" },
      { text_vi: "Gió", emoji_ref: "💨" },
      { text_vi: "Giọt nước", emoji_ref: "💧" },
    ],
  },
  {
    code: "festival",
    label_vi: "Lễ hội & Tết",
    label: "Lễ hội & Tết",
    age_floor: 4,
    icon_emoji_ref: "🏮",
    description: "Lễ Tết, Tết Trung thu, trang phục lễ hội, pháo hoa",
    nouns: [
      { text_vi: "Đèn lồng", emoji_ref: "🏮" },
      { text_vi: "Bao lì xì", emoji_ref: "🧧" },
      { text_vi: "Pháo hoa", emoji_ref: "🎆" },
      { text_vi: "Bí ngô Halloween", emoji_ref: "🎃" },
      { text_vi: "Cây thông Noel", emoji_ref: "🎄" },
      { text_vi: "Bóng bay", emoji_ref: "🎈" },
      { text_vi: "Hộp quà", emoji_ref: "🎁" },
      { text_vi: "Bánh sinh nhật", emoji_ref: "🎂" },
      { text_vi: "Pháo giấy", emoji_ref: "🎊" },
      { text_vi: "Ngọn nến", emoji_ref: "🕯️" },
    ],
  },
  {
    code: "job",
    label_vi: "Nghề nghiệp",
    label: "Nghề nghiệp",
    age_floor: 3,
    icon_emoji_ref: "👨‍🚒",
    description: "Bác sĩ, cô giáo, đầu bếp, công an, nông dân, thợ xây",
    nouns: [
      { text_vi: "Bác sĩ", emoji_ref: "🧑‍⚕️" },
      { text_vi: "Cô giáo", emoji_ref: "🧑‍🏫" },
      { text_vi: "Đầu bếp", emoji_ref: "🧑‍🍳" },
      { text_vi: "Lính cứu hỏa", emoji_ref: "👨‍🚒" },
      { text_vi: "Cảnh sát", emoji_ref: "👮" },
      { text_vi: "Nông dân", emoji_ref: "🧑‍🌾" },
      { text_vi: "Phi công", emoji_ref: "🧑‍✈️" },
      { text_vi: "Thợ sửa", emoji_ref: "👨‍🔧" },
      { text_vi: "Họa sĩ", emoji_ref: "👨‍🎨" },
      { text_vi: "Nhà khoa học", emoji_ref: "👩‍🔬" },
    ],
  },
  {
    code: "homeland",
    label_vi: "Quê hương – Đất nước",
    label: "Quê hương – Đất nước",
    age_floor: 4,
    icon_emoji_ref: "🇻🇳",
    description:
      "Quê hương, cờ đỏ sao vàng, danh lam thắng cảnh, di tích truyền thống",
    nouns: [
      { text_vi: "Cờ Việt Nam", emoji_ref: "🇻🇳" },
      { text_vi: "Hoa sen", emoji_ref: "🪷" },
      { text_vi: "Bông lúa", emoji_ref: "🌾" },
      { text_vi: "Ngôi sao vàng", emoji_ref: "🌟" },
      { text_vi: "Cánh đồng lúa", emoji_ref: "🌾" },
      { text_vi: "Núi non", emoji_ref: "⛰️" },
      { text_vi: "Trâu nước", emoji_ref: "🐃" },
      { text_vi: "Cầu ban đêm", emoji_ref: "🌉" },
      { text_vi: "Bình minh", emoji_ref: "🌄" },
      { text_vi: "Thuyền buồm", emoji_ref: "⛵" },
    ],
  },
] as const;

export type ContentThemeCode = (typeof CONTENT_THEMES)[number]["code"];

export const CANONICAL_THEME_CODES: ReadonlySet<string> = new Set(
  CONTENT_THEMES.map((t) => t.code)
);

export const THEME_MAP: Readonly<Record<string, ContentTheme>> = Object.freeze(
  Object.fromEntries(CONTENT_THEMES.map((t) => [t.code, t]))
);

export function isValidThemeCode(code: string): boolean {
  return CANONICAL_THEME_CODES.has(code);
}

export function getTheme(code: string): ContentTheme | undefined {
  return THEME_MAP[code];
}
