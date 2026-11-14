/**
 * @mindkid/emoji — Custom 2.5D Emoji-Art & Tier-3 Hero Sprite Registry
 * Phủ 27 emoji chuẩn cho gameplay PoC (GT-000, GT-001, FLASHCARD_COUNTER_EMOJIS).
 */

export type CustomSpriteTier = "vector_craft" | "hero_webp";

export interface EmojiSpriteMeta {
  readonly emoji: string;
  readonly slug: string;
  readonly nameVi: string;
  readonly svgPath: string;
  readonly heroWebpPath?: string;
  readonly tier: CustomSpriteTier;
}

const CUSTOM_SPRITE_LIST: readonly EmojiSpriteMeta[] = [
  // Trái cây & Đồ ăn (9)
  {
    emoji: "🍎",
    slug: "apple",
    nameVi: "Táo đỏ",
    svgPath: "/sprites/emoji/apple.svg",
    heroWebpPath: "/sprites/hero/apple.webp",
    tier: "hero_webp",
  },
  {
    emoji: "🍌",
    slug: "banana",
    nameVi: "Chuối vàng",
    svgPath: "/sprites/emoji/banana.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🍊",
    slug: "orange",
    nameVi: "Quả cam",
    svgPath: "/sprites/emoji/orange.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🍓",
    slug: "strawberry",
    nameVi: "Dâu tây",
    svgPath: "/sprites/emoji/strawberry.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🍉",
    slug: "watermelon",
    nameVi: "Dưa hấu",
    svgPath: "/sprites/emoji/watermelon.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🍇",
    slug: "grapes",
    nameVi: "Chùm nho",
    svgPath: "/sprites/emoji/grapes.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🥕",
    slug: "carrot",
    nameVi: "Cà rốt",
    svgPath: "/sprites/emoji/carrot.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🌽",
    slug: "corn",
    nameVi: "Bắp ngô",
    svgPath: "/sprites/emoji/corn.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🧁",
    slug: "cupcake",
    nameVi: "Bánh kem nhỏ",
    svgPath: "/sprites/emoji/cupcake.svg",
    tier: "vector_craft",
  },

  // Động vật đáng yêu (9)
  {
    emoji: "🐟",
    slug: "fish",
    nameVi: "Con cá",
    svgPath: "/sprites/emoji/fish.svg",
    heroWebpPath: "/sprites/hero/fish.webp",
    tier: "hero_webp",
  },
  {
    emoji: "🐰",
    slug: "rabbit",
    nameVi: "Con thỏ",
    svgPath: "/sprites/emoji/rabbit.svg",
    heroWebpPath: "/sprites/hero/rabbit.webp",
    tier: "hero_webp",
  },
  {
    emoji: "🐻",
    slug: "bear",
    nameVi: "Con gấu",
    svgPath: "/sprites/emoji/bear.svg",
    heroWebpPath: "/sprites/hero/bear.webp",
    tier: "hero_webp",
  },
  {
    emoji: "🐱",
    slug: "cat",
    nameVi: "Con mèo",
    svgPath: "/sprites/emoji/cat.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🐶",
    slug: "dog",
    nameVi: "Con chó",
    svgPath: "/sprites/emoji/dog.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🦆",
    slug: "duck",
    nameVi: "Con vịt",
    svgPath: "/sprites/emoji/duck.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🐸",
    slug: "frog",
    nameVi: "Con ếch",
    svgPath: "/sprites/emoji/frog.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🦋",
    slug: "butterfly",
    nameVi: "Con bướm",
    svgPath: "/sprites/emoji/butterfly.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🐢",
    slug: "turtle",
    nameVi: "Con rùa",
    svgPath: "/sprites/emoji/turtle.svg",
    tier: "vector_craft",
  },

  // Hình học khối gỗ 3D & Ngôi sao (5)
  {
    emoji: "🔴",
    slug: "red-circle",
    nameVi: "Hình tròn đỏ",
    svgPath: "/sprites/emoji/red-circle.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🟦",
    slug: "blue-square",
    nameVi: "Hình vuông xanh",
    svgPath: "/sprites/emoji/blue-square.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🟥",
    slug: "red-square",
    nameVi: "Hình vuông đỏ",
    svgPath: "/sprites/emoji/red-square.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🔺",
    slug: "red-triangle",
    nameVi: "Hình tam giác đỏ",
    svgPath: "/sprites/emoji/red-triangle.svg",
    tier: "vector_craft",
  },
  {
    emoji: "⭐",
    slug: "star",
    nameVi: "Ngôi sao vàng",
    svgPath: "/sprites/emoji/star.svg",
    tier: "vector_craft",
  },

  // Đồ vật & Thiên nhiên (4)
  {
    emoji: "🌻",
    slug: "sunflower",
    nameVi: "Hoa hướng dương",
    svgPath: "/sprites/emoji/sunflower.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🎈",
    slug: "balloon",
    nameVi: "Bóng bay",
    svgPath: "/sprites/emoji/balloon.svg",
    tier: "vector_craft",
  },
  {
    emoji: "🚗",
    slug: "car",
    nameVi: "Ô tô",
    svgPath: "/sprites/emoji/car.svg",
    tier: "vector_craft",
  },
  {
    emoji: "⚽",
    slug: "soccer-ball",
    nameVi: "Quả bóng đá",
    svgPath: "/sprites/emoji/soccer-ball.svg",
    tier: "vector_craft",
  },
];

const VARIATION_SELECTOR_16_RE = /\uFE0F/g;

function stripVariationSelector(value: string): string {
  return value.replace(VARIATION_SELECTOR_16_RE, "");
}

function buildCanonicalMap(): ReadonlyMap<string, EmojiSpriteMeta> {
  const map = new Map<string, EmojiSpriteMeta>();
  for (const meta of CUSTOM_SPRITE_LIST) {
    map.set(meta.emoji.normalize("NFC"), meta);
  }
  return map;
}

function buildLookupMap(): ReadonlyMap<string, EmojiSpriteMeta> {
  const map = new Map<string, EmojiSpriteMeta>();
  for (const meta of CUSTOM_SPRITE_LIST) {
    const nfc = meta.emoji.normalize("NFC");
    map.set(nfc, meta);
    const stripped = stripVariationSelector(nfc);
    if (!map.has(stripped)) {
      map.set(stripped, meta);
    }
  }
  return map;
}

export const CUSTOM_EMOJI_SPRITES: ReadonlyMap<string, EmojiSpriteMeta> =
  buildCanonicalMap();

const SPRITE_LOOKUP_MAP: ReadonlyMap<string, EmojiSpriteMeta> =
  buildLookupMap();

/**
 * Tra cứu metadata sprite custom theo emoji (hỗ trợ chuẩn hoá NFC và bỏ VS16 \uFE0F).
 */
export function resolveCustomEmojiSprite(
  emoji: string
): EmojiSpriteMeta | null {
  if (!emoji) {
    return null;
  }
  const normalized = emoji.normalize("NFC");
  return (
    SPRITE_LOOKUP_MAP.get(normalized) ??
    SPRITE_LOOKUP_MAP.get(stripVariationSelector(normalized)) ??
    null
  );
}

/**
 * Kiểm tra emoji có sprite custom trong thư viện hay không.
 */
export function hasCustomEmojiSprite(emoji: string): boolean {
  return resolveCustomEmojiSprite(emoji) !== null;
}

/**
 * Liệt kê toàn bộ 27 sprite custom theo thứ tự khai báo.
 */
export function listCustomEmojiSprites(): readonly EmojiSpriteMeta[] {
  return CUSTOM_SPRITE_LIST;
}
