/**
 * Kho ngữ liệu Văn hoá Mầm non Việt Nam (Tuổi thơ Việt & 10 chủ đề Bộ GD&ĐT)
 * gắn với đồ dùng trực quan Koguma-kai (Jibutsu Kyoiku).
 *
 * Invariant: Pure TS, ZERO Node/DB imports, strict explicit types, import canonical themes
 * trực tiếp từ @mindkid/shared (BR-CTR-12). Mọi emoji ref có thật trong @mindkid/emoji.
 */

import {
  CANONICAL_THEME_CODES,
  CONTENT_THEMES,
  type ContentThemeCode,
} from "@mindkid/shared";

export type MoetPreschoolTopicCode =
  | "moet_01_school"
  | "moet_02_self"
  | "moet_03_family"
  | "moet_04_professions"
  | "moet_05_plants"
  | "moet_06_animals"
  | "moet_07_traffic"
  | "moet_08_nature_water"
  | "moet_09_homeland"
  | "moet_10_festivals";

export interface VnManipulativeItem {
  readonly id: string;
  readonly label_vi: string;
  readonly emoji_ref: string;
  readonly tactile_cue: string;
}

export interface MoetPreschoolTopic {
  readonly code: MoetPreschoolTopicCode;
  readonly order: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  readonly title_vi: string;
  readonly canonical_themes: readonly ContentThemeCode[];
  readonly dong_dao_rhythm: string;
  readonly koguma_concrete_materials: string;
  readonly manipulative_items: readonly VnManipulativeItem[];
}

export interface VnContainerPair {
  readonly primaryLabel: string;
  readonly primaryEmoji: string;
  readonly secondaryLabel: string;
  readonly secondaryEmoji: string;
}

export const VN_MOET_PRESCHOOL_TOPICS: readonly MoetPreschoolTopic[] = [
  {
    code: "moet_01_school",
    order: 1,
    title_vi: "Trường Mầm Non Tre Xanh",
    canonical_themes: ["school"],
    dong_dao_rhythm: "Tiếng trống tùng tùng, bé vui đến lớp",
    koguma_concrete_materials: "Bàn tính hạt gỗ, khối gỗ màu, thẻ chấm xúc xắc",
    manipulative_items: [
      {
        id: "vn_school_abacus",
        label_vi: "Bàn tính gỗ",
        emoji_ref: "🧮",
        tactile_cue: "Gạt từng hạt gỗ đếm một đối một",
      },
      {
        id: "vn_school_crayon",
        label_vi: "Bút sáp màu",
        emoji_ref: "🖍️",
        tactile_cue: "So chiều dài bút sáp trên mặt bàn",
      },
      {
        id: "vn_school_bell",
        label_vi: "Chuông nhỏ lớp học",
        emoji_ref: "🔔",
        tactile_cue: "Lắng nghe tiếng chuông ngân theo nhịp",
      },
      {
        id: "vn_school_puzzle",
        label_vi: "Mảnh ghép gỗ",
        emoji_ref: "🧩",
        tactile_cue: "Xoay mảnh gỗ khớp vào khung hình",
      },
    ],
  },
  {
    code: "moet_02_self",
    order: 2,
    title_vi: "Bản Thân & Ngũ Quan Đáng Yêu",
    canonical_themes: ["body"],
    dong_dao_rhythm: "Tay đẹp xòe hoa, năm ngón xinh ngoan",
    koguma_concrete_materials:
      "Đôi bàn tay bé, gương soi đối xứng, bước chân đo",
    manipulative_items: [
      {
        id: "vn_self_hand",
        label_vi: "Bàn tay xinh",
        emoji_ref: "✋",
        tactile_cue: "Xòe ngón tay gộp tách số lượng dưới 10",
      },
      {
        id: "vn_self_eyes",
        label_vi: "Đôi mắt sáng",
        emoji_ref: "👀",
        tactile_cue: "Tinh mắt nhìn nhanh nhóm vật vừa hiện",
      },
      {
        id: "vn_self_ear",
        label_vi: "Đôi tai thính",
        emoji_ref: "👂",
        tactile_cue: "Nghe phách tre đoán nhịp nhanh chậm",
      },
      {
        id: "vn_self_foot",
        label_vi: "Bàn chân nhỏ",
        emoji_ref: "🦶",
        tactile_cue: "Đo chiều dài chiếu cói bằng bước chân",
      },
    ],
  },
  {
    code: "moet_03_family",
    order: 3,
    title_vi: "Gia Đình Sum Vầy & Ngôi Nhà Thân Yêu",
    canonical_themes: ["family", "home"],
    dong_dao_rhythm: "Cơm sôi bớt lửa, cả nhà quây quần",
    koguma_concrete_materials: "Bát ăn cơm, đôi đũa tre, cốc nước đong đầy vơi",
    manipulative_items: [
      {
        id: "vn_home_rice_bowl",
        label_vi: "Bát cơm trắng",
        emoji_ref: "🍚",
        tactile_cue: "Chia đều mỗi người một bát cơm ấm",
      },
      {
        id: "vn_home_chopsticks",
        label_vi: "Đôi đũa tre",
        emoji_ref: "🥢",
        tactile_cue: "Ghép hai chiếc đũa thành một đôi chẵn",
      },
      {
        id: "vn_home_pho",
        label_vi: "Tô phở nóng",
        emoji_ref: "🍜",
        tactile_cue: "Đặt tô lớn ở giữa, bát nhỏ xung quanh",
      },
      {
        id: "vn_home_tea",
        label_vi: "Tách trà xanh",
        emoji_ref: "🍵",
        tactile_cue: "Rót nước ngang vạch so sánh dung tích",
      },
    ],
  },
  {
    code: "moet_04_professions",
    order: 4,
    title_vi: "Nghề Nghiệp & Nghệ Thuật Quanh Bé",
    canonical_themes: ["job", "art"],
    dong_dao_rhythm: "Cô dạy bé múa, bác nông dân cày",
    koguma_concrete_materials:
      "Cân đĩa chợ quê, thước gỗ thợ mộc, cọ màu thủ công",
    manipulative_items: [
      {
        id: "vn_job_farmer",
        label_vi: "Bác nông dân",
        emoji_ref: "🧑‍🌾",
        tactile_cue: "Gom bó lúa chín xếp theo từng chục",
      },
      {
        id: "vn_job_teacher",
        label_vi: "Cô giáo mầm non",
        emoji_ref: "🧑‍🏫",
        tactile_cue: "Chia thẻ hình cho tổ chim non",
      },
      {
        id: "vn_job_scale",
        label_vi: "Cân thăng bằng",
        emoji_ref: "⚖️",
        tactile_cue: "Đặt quả lên hai đĩa cân xem bên nào trĩu",
      },
      {
        id: "vn_job_artist",
        label_vi: "Hoạ sĩ sắc màu",
        emoji_ref: "👨‍🎨",
        tactile_cue: "Pha dải màu đậm nhạt và đan hoa văn giấy",
      },
    ],
  },
  {
    code: "moet_05_plants",
    order: 5,
    title_vi: "Thế Giới Thực Vật & Quả Quê",
    canonical_themes: ["nature", "food"],
    dong_dao_rhythm: "Vườn bà trĩu quả, xoài chín cam tươi",
    koguma_concrete_materials: "Hạt đậu, đốt tre, lá cây, giỏ quả ngọt bốn mùa",
    manipulative_items: [
      {
        id: "vn_plant_lotus",
        label_vi: "Bông hoa sen",
        emoji_ref: "🪷",
        tactile_cue: "Xếp cánh sen xen kẽ theo quy luật lặp",
      },
      {
        id: "vn_plant_bamboo",
        label_vi: "Đốt tre xanh",
        emoji_ref: "🎋",
        tactile_cue: "Đo chiều dài bàn học bằng các đốt tre",
      },
      {
        id: "vn_plant_mango",
        label_vi: "Quả xoài chín",
        emoji_ref: "🥭",
        tactile_cue: "Đặt xoài vàng vào rổ mây đếm số lượng",
      },
      {
        id: "vn_plant_banana",
        label_vi: "Nải chuối vàng",
        emoji_ref: "🍌",
        tactile_cue: "Tách nải chuối thành hai phần gộp lại",
      },
    ],
  },
  {
    code: "moet_06_animals",
    order: 6,
    title_vi: "Thế Giới Động Vật & Đại Dương",
    canonical_themes: ["animal", "farm", "ocean"],
    dong_dao_rhythm: "Con gà cục tác lá chanh, vịt bầu lội nước",
    koguma_concrete_materials: "Mô hình gà vịt xếp hàng, vỏ sò đếm cặp",
    manipulative_items: [
      {
        id: "vn_animal_buffalo",
        label_vi: "Trâu đồng quê",
        emoji_ref: "🐃",
        tactile_cue: "So sánh chú trâu to với chú gà nhỏ",
      },
      {
        id: "vn_animal_chick",
        label_vi: "Gà con lon ton",
        emoji_ref: "🐣",
        tactile_cue: "Xếp đàn gà con nối đuôi thứ nhất đến thứ năm",
      },
      {
        id: "vn_animal_duck",
        label_vi: "Vịt bơi ao làng",
        emoji_ref: "🦆",
        tactile_cue: "Tách đàn vịt trên bờ với dưới ao",
      },
      {
        id: "vn_animal_crab",
        label_vi: "Cua đồng tám cẳng",
        emoji_ref: "🦀",
        tactile_cue: "Đếm theo đôi các càng cua đối xứng",
      },
    ],
  },
  {
    code: "moet_07_traffic",
    order: 7,
    title_vi: "Phương Tiện & An Toàn Giao Thông",
    canonical_themes: ["vehicle"],
    dong_dao_rhythm: "Xình xịch tàu nhỏ, thuyền căng buồm xuôi",
    koguma_concrete_materials: "Toa tàu gỗ nối đuôi, bản đồ lưới ngã tư",
    manipulative_items: [
      {
        id: "vn_traffic_bicycle",
        label_vi: "Xe đạp hai bánh",
        emoji_ref: "🚲",
        tactile_cue: "Đếm cách hai theo từng đôi bánh xe",
      },
      {
        id: "vn_traffic_train",
        label_vi: "Đoàn tàu nhỏ",
        emoji_ref: "🚆",
        tactile_cue: "Nối các toa tàu theo quy luật màu sắc",
      },
      {
        id: "vn_traffic_sailboat",
        label_vi: "Thuyền buồm nhỏ",
        emoji_ref: "⛵",
        tactile_cue: "Ghép hình tam giác làm cánh buồm no gió",
      },
      {
        id: "vn_traffic_bus",
        label_vi: "Xe buýt vui vẻ",
        emoji_ref: "🚌",
        tactile_cue: "Đếm hành khách lên xuống tại mỗi trạm",
      },
    ],
  },
  {
    code: "moet_08_nature_water",
    order: 8,
    title_vi: "Nước, Hiện Tượng Tự Nhiên & Vũ Trụ",
    canonical_themes: ["weather", "space"],
    dong_dao_rhythm: "Cầu vồng bảy sắc, trăng sáng sân nhà",
    koguma_concrete_materials:
      "Cốc thuỷ tinh đong nước mưa, bóng nắng đổi chiều",
    manipulative_items: [
      {
        id: "vn_water_droplet",
        label_vi: "Giọt mưa trong",
        emoji_ref: "💧",
        tactile_cue: "Rót nước qua hai cốc cao thấp bảo toàn lượng",
      },
      {
        id: "vn_water_rainbow",
        label_vi: "Cầu vồng rực rỡ",
        emoji_ref: "🌈",
        tactile_cue: "Xếp dải màu theo đúng trình tự tự nhiên",
      },
      {
        id: "vn_water_sun",
        label_vi: "Ông mặt trời",
        emoji_ref: "☀️",
        tactile_cue: "Nhận biết buổi sáng trưa chiều theo mặt trời",
      },
      {
        id: "vn_water_moon",
        label_vi: "Vầng trăng tròn",
        emoji_ref: "🌕",
        tactile_cue: "So hình tròn trăng rằm với trăng lưỡi liềm",
      },
    ],
  },
  {
    code: "moet_09_homeland",
    order: 9,
    title_vi: "Quê Hương – Đất Nước Việt Nam",
    canonical_themes: ["homeland"],
    dong_dao_rhythm: "Cánh diều no gió, đồng lúa mênh mông",
    koguma_concrete_materials: "Quạt giấy gấp đôi đối xứng, chiếu cói đan ô",
    manipulative_items: [
      {
        id: "vn_homeland_flag",
        label_vi: "Cờ đỏ sao vàng",
        emoji_ref: "🇻🇳",
        tactile_cue: "Tìm đường về đích cắm lá cờ Tổ quốc",
      },
      {
        id: "vn_homeland_rice",
        label_vi: "Bông lúa vàng",
        emoji_ref: "🌾",
        tactile_cue: "Bó từng chùm năm bông lúa đếm nhanh",
      },
      {
        id: "vn_homeland_kite",
        label_vi: "Cánh diều tuổi thơ",
        emoji_ref: "🪁",
        tactile_cue: "Gấp giấy đối xứng tạo cánh diều cân bằng",
      },
      {
        id: "vn_homeland_fan",
        label_vi: "Quạt giấy nan tre",
        emoji_ref: "🪭",
        tactile_cue: "Mở nan quạt quan sát góc mở rộng hẹp",
      },
    ],
  },
  {
    code: "moet_10_festivals",
    order: 10,
    title_vi: "Tết, Lễ Hội Truyền Thống & Lên Lớp",
    canonical_themes: ["festival"],
    dong_dao_rhythm: "Tùng rinh rinh, rước đèn dưới ánh trăng",
    koguma_concrete_materials: "Đèn lồng giấy, bao lì xì đỏ, trống hội gõ nhịp",
    manipulative_items: [
      {
        id: "vn_fest_lantern",
        label_vi: "Đèn lồng đỏ",
        emoji_ref: "🏮",
        tactile_cue: "Treo dây đèn lồng xen kẽ đỏ vàng",
      },
      {
        id: "vn_fest_lixi",
        label_vi: "Bao lì xì Tết",
        emoji_ref: "🧧",
        tactile_cue: "Chia đều phong bao may mắn đầu xuân",
      },
      {
        id: "vn_fest_moon",
        label_vi: "Mâm cỗ trông trăng",
        emoji_ref: "🎑",
        tactile_cue: "Bày quả ngọt quanh mâm cỗ Trung thu",
      },
      {
        id: "vn_fest_drum",
        label_vi: "Trống hội rộn ràng",
        emoji_ref: "🥁",
        tactile_cue: "Vỗ trống theo tiết tấu tùng cắc tùng rinh",
      },
    ],
  },
] as const;

const THEME_CONTAINERS_MAP: Readonly<Record<string, VnContainerPair>> = {
  farm: {
    primaryLabel: "Giỏ tre",
    primaryEmoji: "🧺",
    secondaryLabel: "Khay cỏ",
    secondaryEmoji: "🌾",
  },
  food: {
    primaryLabel: "Rổ mây",
    primaryEmoji: "🧺",
    secondaryLabel: "Đĩa gốm",
    secondaryEmoji: "🍽️",
  },
  festival: {
    primaryLabel: "Giỏ lễ hội",
    primaryEmoji: "🏮",
    secondaryLabel: "Hộp quà Tết",
    secondaryEmoji: "🎁",
  },
  homeland: {
    primaryLabel: "Giỏ sen",
    primaryEmoji: "🪷",
    secondaryLabel: "Nia tre",
    secondaryEmoji: "🎋",
  },
  home: {
    primaryLabel: "Khay bếp",
    primaryEmoji: "🥣",
    secondaryLabel: "Hộp gỗ",
    secondaryEmoji: "📦",
  },
  family: {
    primaryLabel: "Giỏ gia đình",
    primaryEmoji: "🧺",
    secondaryLabel: "Hộp quà ấm",
    secondaryEmoji: "🎁",
  },
  ocean: {
    primaryLabel: "Giỏ vỏ sò",
    primaryEmoji: "🐚",
    secondaryLabel: "Lọ biển xanh",
    secondaryEmoji: "🫙",
  },
  school: {
    primaryLabel: "Khay học tập",
    primaryEmoji: "📦",
    secondaryLabel: "Giỏ đồ dùng",
    secondaryEmoji: "🧺",
  },
};

const DEFAULT_CONTAINER_PAIR: VnContainerPair = {
  primaryLabel: "Giỏ mây",
  primaryEmoji: "🧺",
  secondaryLabel: "Hộp quà",
  secondaryEmoji: "🎁",
};

export function resolveThemeContainers(themeCode?: string): VnContainerPair {
  if (!themeCode) {
    return DEFAULT_CONTAINER_PAIR;
  }
  return THEME_CONTAINERS_MAP[themeCode] ?? DEFAULT_CONTAINER_PAIR;
}

const THEME_TO_MOET_MAP: ReadonlyMap<string, MoetPreschoolTopic> = new Map(
  VN_MOET_PRESCHOOL_TOPICS.flatMap((topic) =>
    topic.canonical_themes.map((theme) => [theme, topic] as const)
  )
);

export function getMoetTopicForTheme(
  themeCode: string
): MoetPreschoolTopic | undefined {
  if (!CANONICAL_THEME_CODES.has(themeCode)) {
    return undefined;
  }
  return THEME_TO_MOET_MAP.get(themeCode);
}

export function getCanonicalThemesCoverage(): readonly string[] {
  return CONTENT_THEMES.map((t) => t.code);
}
