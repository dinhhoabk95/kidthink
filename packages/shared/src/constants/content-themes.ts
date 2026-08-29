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
    icon_emoji_ref: "EMJ-school",
    description: "Lớp học, đồ dùng học tập, bàn ghế, sách vở",
    nouns: [
      { text_vi: "Trường học", emoji_ref: "EMJ-school" },
      { text_vi: "Cặp sách", emoji_ref: "EMJ-backpack" },
      { text_vi: "Bút chì", emoji_ref: "EMJ-pencil" },
      { text_vi: "Sách", emoji_ref: "EMJ-books" },
      { text_vi: "Thước kẻ", emoji_ref: "EMJ-ruler" },
    ],
  },
  {
    code: "farm",
    label_vi: "Nông trại",
    label: "Nông trại",
    age_floor: 3,
    icon_emoji_ref: "EMJ-tractor",
    description: "Nông trại, vật nuôi, cây trồng, chuồng trại",
    nouns: [
      { text_vi: "Máy kéo", emoji_ref: "EMJ-tractor" },
      { text_vi: "Bò sữa", emoji_ref: "EMJ-cow" },
      { text_vi: "Gà trống", emoji_ref: "EMJ-rooster" },
      { text_vi: "Heo", emoji_ref: "EMJ-pig" },
      { text_vi: "Lúa", emoji_ref: "EMJ-rice" },
    ],
  },
  {
    code: "home",
    label_vi: "Gia đình & Nhà bếp",
    label: "Gia đình & Nhà bếp",
    age_floor: 3,
    icon_emoji_ref: "EMJ-house",
    description: "Nhà cửa, phòng ốc, đồ dùng trong nhà, nhà bếp",
    nouns: [
      { text_vi: "Ngôi nhà", emoji_ref: "EMJ-house" },
      { text_vi: "Cái giường", emoji_ref: "EMJ-bed" },
      { text_vi: "Cái ghế", emoji_ref: "EMJ-chair" },
      { text_vi: "Cái cửa", emoji_ref: "EMJ-door" },
      { text_vi: "Nồi thức ăn", emoji_ref: "EMJ-pot-of-food" },
    ],
  },
  {
    code: "animal",
    label_vi: "Động vật",
    label: "Động vật hoang dã",
    age_floor: 3,
    icon_emoji_ref: "EMJ-lion",
    description: "Động vật hoang dã, rừng rậm, khủng long",
    nouns: [
      { text_vi: "Sư tử", emoji_ref: "EMJ-lion" },
      { text_vi: "Voi", emoji_ref: "EMJ-elephant" },
      { text_vi: "Hổ", emoji_ref: "EMJ-tiger" },
      { text_vi: "Khỉ", emoji_ref: "EMJ-monkey" },
      { text_vi: "Hươu cao cổ", emoji_ref: "EMJ-giraffe" },
    ],
  },
  {
    code: "nature",
    label_vi: "Thiên nhiên & Bốn mùa",
    label: "Thiên nhiên & Bốn mùa",
    age_floor: 3,
    icon_emoji_ref: "EMJ-deciduous-tree",
    description: "Cây cỏ, hoa lá, công viên, bốn mùa, phong cảnh",
    nouns: [
      { text_vi: "Cây xanh", emoji_ref: "EMJ-deciduous-tree" },
      { text_vi: "Hoa hướng dương", emoji_ref: "EMJ-sunflower" },
      { text_vi: "Cỏ bốn lá", emoji_ref: "EMJ-four-leaf-clover" },
      { text_vi: "Núi", emoji_ref: "EMJ-mountain" },
      { text_vi: "Lá phong", emoji_ref: "EMJ-maple-leaf" },
    ],
  },
  {
    code: "ocean",
    label_vi: "Đại dương",
    label: "Đại dương",
    age_floor: 4,
    icon_emoji_ref: "EMJ-whale",
    description: "Biển cả, sinh vật biển, san hô, thế giới dưới nước",
    nouns: [
      { text_vi: "Cá voi", emoji_ref: "EMJ-whale" },
      { text_vi: "Cá heo", emoji_ref: "EMJ-dolphin" },
      { text_vi: "Bạch tuộc", emoji_ref: "EMJ-octopus" },
      { text_vi: "Cua", emoji_ref: "EMJ-crab" },
      { text_vi: "Cá mập", emoji_ref: "EMJ-shark" },
    ],
  },
  {
    code: "food",
    label_vi: "Món ăn & Thực phẩm",
    label: "Món ăn & Thực phẩm",
    age_floor: 3,
    icon_emoji_ref: "EMJ-red-apple",
    description: "Thức ăn, bữa ăn, rau củ, trái cây, bánh ngọt",
    nouns: [
      { text_vi: "Táo đỏ", emoji_ref: "EMJ-red-apple" },
      { text_vi: "Chuối", emoji_ref: "EMJ-banana" },
      { text_vi: "Bánh mì", emoji_ref: "EMJ-bread" },
      { text_vi: "Cà rốt", emoji_ref: "EMJ-carrot" },
      { text_vi: "Bắp ngô", emoji_ref: "EMJ-corn" },
    ],
  },
  {
    code: "vehicle",
    label_vi: "Phương tiện giao thông",
    label: "Phương tiện giao thông",
    age_floor: 3,
    icon_emoji_ref: "EMJ-car",
    description:
      "Phương tiện đường bộ, đường sắt, đường thủy, đường hàng không",
    nouns: [
      { text_vi: "Ô tô", emoji_ref: "EMJ-car" },
      { text_vi: "Xe buýt", emoji_ref: "EMJ-bus" },
      { text_vi: "Máy bay", emoji_ref: "EMJ-airplane" },
      { text_vi: "Tàu hoả", emoji_ref: "EMJ-train" },
      { text_vi: "Tàu thủy", emoji_ref: "EMJ-ship" },
    ],
  },
  {
    code: "art",
    label_vi: "Nghệ thuật & Âm nhạc",
    label: "Nghệ thuật & Âm nhạc",
    age_floor: 4,
    icon_emoji_ref: "EMJ-artist-palette",
    description: "Vẽ tranh, âm nhạc, nhạc cụ, thủ công, màu sắc",
    nouns: [
      { text_vi: "Bảng vẽ", emoji_ref: "EMJ-artist-palette" },
      { text_vi: "Cây đàn ghi-ta", emoji_ref: "EMJ-guitar" },
      { text_vi: "Kèn saxophone", emoji_ref: "EMJ-saxophone" },
      { text_vi: "Nốt nhạc", emoji_ref: "EMJ-musical-notes" },
      { text_vi: "Trống", emoji_ref: "EMJ-drum" },
    ],
  },
  {
    code: "space",
    label_vi: "Vũ trụ",
    label: "Vũ trụ",
    age_floor: 5,
    icon_emoji_ref: "EMJ-rocket",
    description: "Vũ trụ, các hành tinh, phi thuyền, ngôi sao",
    nouns: [
      { text_vi: "Tên lửa", emoji_ref: "EMJ-rocket" },
      { text_vi: "Hành tinh", emoji_ref: "EMJ-ringed-planet" },
      { text_vi: "Ngôi sao", emoji_ref: "EMJ-glowing-star" },
      { text_vi: "Phi hành gia", emoji_ref: "EMJ-astronaut" },
      { text_vi: "Đĩa bay", emoji_ref: "EMJ-flying-saucer" },
    ],
  },
  {
    code: "family",
    label_vi: "Gia đình",
    label: "Gia đình",
    age_floor: 3,
    icon_emoji_ref: "EMJ-family",
    description: "Gia đình, ông bà, cha mẹ, anh chị em, người thân",
    nouns: [
      { text_vi: "Gia đình", emoji_ref: "EMJ-family" },
      { text_vi: "Em bé", emoji_ref: "EMJ-baby" },
      { text_vi: "Bà", emoji_ref: "EMJ-grandmother" },
      { text_vi: "Ông", emoji_ref: "EMJ-grandfather" },
      { text_vi: "Mẹ", emoji_ref: "EMJ-mother" },
    ],
  },
  {
    code: "body",
    label_vi: "Cơ thể & Giác quan",
    label: "Cơ thể & Giác quan",
    age_floor: 3,
    icon_emoji_ref: "EMJ-eyes",
    description: "Cơ thể, ngũ quan, bộ phận cơ thể, sức khỏe",
    nouns: [
      { text_vi: "Mắt", emoji_ref: "EMJ-eyes" },
      { text_vi: "Tai", emoji_ref: "EMJ-ear" },
      { text_vi: "Mũi", emoji_ref: "EMJ-nose" },
      { text_vi: "Miệng", emoji_ref: "EMJ-mouth" },
      { text_vi: "Bàn chân", emoji_ref: "EMJ-foot" },
    ],
  },
  {
    code: "weather",
    label_vi: "Thời tiết",
    label: "Thời tiết",
    age_floor: 3,
    icon_emoji_ref: "EMJ-sun",
    description: "Thời tiết, nắng mưa, gió bão, hiện tượng tự nhiên",
    nouns: [
      { text_vi: "Mặt trời", emoji_ref: "EMJ-sun" },
      { text_vi: "Mây", emoji_ref: "EMJ-cloud" },
      { text_vi: "Mưa", emoji_ref: "EMJ-rain" },
      { text_vi: "Cầu vồng", emoji_ref: "EMJ-rainbow" },
      { text_vi: "Bông tuyết", emoji_ref: "EMJ-snowflake" },
    ],
  },
  {
    code: "festival",
    label_vi: "Lễ hội & Tết",
    label: "Lễ hội & Tết",
    age_floor: 4,
    icon_emoji_ref: "EMJ-red-lantern",
    description: "Lễ Tết, Tết Trung thu, trang phục lễ hội, pháo hoa",
    nouns: [
      { text_vi: "Đèn lồng", emoji_ref: "EMJ-red-lantern" },
      { text_vi: "Bao lì xì", emoji_ref: "EMJ-red-envelope" },
      { text_vi: "Pháo hoa", emoji_ref: "EMJ-fireworks" },
      { text_vi: "Bí ngô Halloween", emoji_ref: "EMJ-jack-o-lantern" },
      { text_vi: "Cây thông Noel", emoji_ref: "EMJ-christmas-tree" },
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
