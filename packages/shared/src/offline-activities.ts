/**
 * Offline Activities Seed Catalog — 12 static offline activities for preschool children (D-BB).
 * Displayed on end-of-play screen when daily play cap is reached (BR-HPL-04).
 */

export interface OfflineActivity {
  id: number;
  titleVi: string;
  descriptionVi: string;
  emoji: string;
  category: "creative" | "physical" | "social" | "reading";
}

export const OFFLINE_ACTIVITIES: OfflineActivity[] = [
  {
    id: 1,
    titleVi: "Vẽ tranh sắc màu",
    descriptionVi: "Dùng bút màu vẽ con vật hoặc ngôi nhà ước mơ của bé.",
    emoji: "🎨",
    category: "creative",
  },
  {
    id: 2,
    titleVi: "Xếp hình khối",
    descriptionVi: "Dùng đồ chơi xếp hình xây một lâu đài thật cao.",
    emoji: "🧩",
    category: "creative",
  },
  {
    id: 3,
    titleVi: "Đọc sách tranh cùng bố mẹ",
    descriptionVi: "Chọn một cuốn sách tranh yêu thích và cùng bố mẹ khám phá.",
    emoji: "📚",
    category: "reading",
  },
  {
    id: 4,
    titleVi: "Vận động nhảy múa",
    descriptionVi: "Bật bài nhạc vui nhộn và cùng nhảy múa tập thể dục nào!",
    emoji: "💃",
    category: "physical",
  },
  {
    id: 5,
    titleVi: "Chơi trốn tìm",
    descriptionVi: "Chơi trò trốn tìm vui vẻ cùng người thân trong nhà.",
    emoji: "🙈",
    category: "social",
  },
  {
    id: 6,
    titleVi: "Tạo hình đất nặn",
    descriptionVi: "Nặn hình trái cây, con vật hoặc bông hoa bé thích.",
    emoji: "🖍️",
    category: "creative",
  },
  {
    id: 7,
    titleVi: "Tưới cây giúp bố mẹ",
    descriptionVi: "Dùng bình nhỏ tưới nước cho các chậu cây xinh xắn.",
    emoji: "🪴",
    category: "physical",
  },
  {
    id: 8,
    titleVi: "Gấp giấy origami đơn giản",
    descriptionVi: "Gấp chiếc thuyền giấy nhỏ hoặc máy bay giấy cùng bố mẹ.",
    emoji: "✈️",
    category: "creative",
  },
  {
    id: 9,
    titleVi: "Hát bài hát quen thuộc",
    descriptionVi: "Hát thật to bài hát mầm non bé vừa được học.",
    emoji: "🎤",
    category: "physical",
  },
  {
    id: 10,
    titleVi: "Dọn dẹp đồ chơi",
    descriptionVi: "Thu dọn đồ chơi vào giỏ ngăn nắp như một em bé ngoan.",
    emoji: "🧸",
    category: "social",
  },
  {
    id: 11,
    titleVi: "Bắt chước tiếng con vật",
    descriptionVi: "Đố bố mẹ đoán con vật nào đang kêu!",
    emoji: "🐶",
    category: "social",
  },
  {
    id: 12,
    titleVi: "Thư giãn nhắm mắt lắng nghe",
    descriptionVi: "Nằm ngoan 5 phút và lắng nghe tiếng chim hót ngoài cửa sổ.",
    emoji: "🌿",
    category: "physical",
  },
];

/**
 * Returns 2 random offline activity suggestions (D-BB).
 */
export function getOfflineActivitySuggestions(): [
  OfflineActivity,
  OfflineActivity,
] {
  const idx1 = Math.floor(Math.random() * OFFLINE_ACTIVITIES.length);
  let idx2: number;
  do {
    idx2 = Math.floor(Math.random() * OFFLINE_ACTIVITIES.length);
  } while (idx2 === idx1);

  const act1 = OFFLINE_ACTIVITIES[idx1] as OfflineActivity;
  const act2 = OFFLINE_ACTIVITIES[idx2] as OfflineActivity;
  return [act1, act2];
}
