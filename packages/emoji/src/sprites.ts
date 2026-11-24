/**
 * @mindkid/emoji — Custom 2.5D Realistic Vector SVG & Tier-3 Hero Sprite Registry
 * Phủ 100% danh mục ALL_EMOJIS + kho emoji nội dung toàn hệ thống.
 */

import {
  buildGlyphLookupMap,
  normalizeGlyph,
  resolveFromGlyphMap,
} from "#src/glyph-utils";
import { hero, sprite } from "#src/sprite-helpers";
import { BATCH_2_SPRITES } from "#src/sprites-batch2";
import { BATCH_3A_SPRITES } from "#src/sprites-batch3a";
import { BATCH_3B_SPRITES } from "#src/sprites-batch3b";
import { BATCH_4_SPRITES } from "#src/sprites-batch4";
import type { EmojiSpriteMeta } from "#src/types";

export type { CustomSpriteTier, EmojiSpriteMeta } from "#src/types";

const BATCH_1_SPRITES: readonly EmojiSpriteMeta[] = [
  // Core PoC — Trái cây & Đồ ăn (9)
  hero("🍎", "apple", "Táo đỏ"),
  sprite("🍌", "banana", "Chuối vàng"),
  sprite("🍊", "orange", "Quả cam"),
  sprite("🍓", "strawberry", "Dâu tây"),
  sprite("🍉", "watermelon", "Dưa hấu"),
  sprite("🍇", "grapes", "Chùm nho"),
  sprite("🥕", "carrot", "Cà rốt"),
  sprite("🌽", "corn", "Bắp ngô"),
  sprite("🧁", "cupcake", "Bánh kem nhỏ"),

  // Core PoC — Động vật thân thuộc (9)
  hero("🐟", "fish", "Con cá"),
  hero("🐰", "rabbit", "Con thỏ"),
  hero("🐻", "bear", "Con gấu"),
  sprite("🐱", "cat", "Con mèo"),
  sprite("🐶", "dog", "Con chó"),
  sprite("🦆", "duck", "Con vịt"),
  sprite("🐸", "frog", "Con ếch"),
  sprite("🦋", "butterfly", "Con bướm"),
  sprite("🐢", "turtle", "Con rùa"),

  // Core PoC — Hình học khối gỗ 3D & Ngôi sao (5)
  sprite("🔴", "red-circle", "Hình tròn đỏ"),
  sprite("🟦", "blue-square", "Hình vuông xanh"),
  sprite("🟥", "red-square", "Hình vuông đỏ"),
  sprite("🔺", "red-triangle", "Hình tam giác đỏ"),
  sprite("⭐", "star", "Ngôi sao vàng"),

  // Core PoC — Đồ vật & Thiên nhiên (4)
  sprite("🌻", "sunflower", "Hoa hướng dương"),
  sprite("🎈", "balloon", "Bóng bay"),
  sprite("🚗", "car", "Ô tô"),
  sprite("⚽", "soccer-ball", "Quả bóng đá"),

  // Đợt 1.1 — Động vật & 12 Avatar bé (23)
  hero("🦊", "fox", "Cáo đỏ"),
  hero("🐼", "panda", "Gấu trúc"),
  hero("🦁", "lion", "Sư tử"),
  hero("🐯", "tiger", "Hổ con"),
  hero("🐨", "koala", "Gấu túi"),
  hero("🐧", "penguin", "Chim cánh cụt"),
  hero("🦉", "owl", "Chim cú"),
  hero("🐘", "elephant", "Voi con"),
  hero("🐮", "cow", "Bò sữa"),
  sprite("🐦", "bird", "Chim non"),
  sprite("🐔", "hen", "Gà mái"),
  sprite("🐷", "pig", "Heo hồng"),
  sprite("🐑", "sheep", "Cừu bông"),
  sprite("🐒", "monkey", "Khỉ con"),
  sprite("🦒", "giraffe", "Hươu cao cổ"),
  sprite("🐝", "bee", "Ong vàng"),
  sprite("🐞", "ladybug", "Bọ rùa"),
  sprite("🐛", "caterpillar", "Sâu xanh"),
  sprite("🐜", "ant", "Kiến nhỏ"),
  sprite("🐌", "snail", "Ốc sên"),
  sprite("🦀", "crab", "Cua đỏ"),
  sprite("🐠", "tropical-fish", "Cá nhiệt đới"),
  sprite("🐬", "dolphin", "Cá heo"),

  // Đợt 1.2 — Trái cây, Rau củ & Thực phẩm (12)
  hero("🍒", "cherry", "Quả anh đào"),
  sprite("🍐", "pear", "Quả lê"),
  sprite("🍋", "lemon", "Quả chanh vàng"),
  sprite("🍑", "peach", "Quả đào"),
  sprite("🍍", "pineapple", "Quả dứa"),
  sprite("🥭", "mango", "Quả xoài"),
  sprite("🍅", "tomato", "Cà chua"),
  sprite("🍄", "mushroom", "Cây nấm"),
  sprite("🍬", "candy", "Viên kẹo"),
  sprite("🍪", "cookie", "Bánh quy"),
  sprite("🥚", "egg", "Quả trứng"),
  sprite("🥛", "milk", "Ly sữa"),

  // Đợt 1.3 — Thiên nhiên, Hoa lá & Thời tiết (16)
  hero("🌸", "cherry-blossom", "Hoa anh đào"),
  sprite("🌹", "rose", "Hoa hồng"),
  sprite("🌷", "tulip", "Hoa tulip"),
  sprite("🌳", "tree", "Cây xanh"),
  sprite("🌱", "seedling", "Mầm cây"),
  sprite("🍃", "fluttering-leaf", "Lá bay"),
  sprite("🌿", "herb", "Nhành lá"),
  sprite("🍀", "four-leaf-clover", "Cỏ bốn lá"),
  hero("☀️", "sun", "Mặt trời"),
  sprite("🌙", "crescent-moon", "Trăng lưỡi liềm"),
  sprite("🌟", "glowing-star", "Sao sáng"),
  sprite("☁️", "cloud", "Đám mây"),
  sprite("🌧️", "rain-cloud", "Mây mưa"),
  sprite("🌈", "rainbow", "Cầu vồng"),
  sprite("💧", "droplet", "Giọt nước"),
  sprite("❄️", "snowflake", "Bông tuyết"),

  // Đợt 1.4 — Phương tiện giao thông (7)
  sprite("🚂", "locomotive", "Đầu tàu hoả"),
  sprite("🚌", "bus", "Xe buýt"),
  sprite("🚒", "fire-engine", "Xe cứu hoả"),
  sprite("🚲", "bicycle", "Xe đạp"),
  sprite("✈️", "airplane", "Máy bay"),
  sprite("⛵", "sailboat", "Thuyền buồm"),
  sprite("🚀", "rocket", "Tên lửa"),

  // Đợt 1.5 — Trường học, Nghệ thuật, Đồ chơi & 6 Năng lực C1–C6 (20)
  sprite("🔢", "input-numbers", "Bảng số 1234"),
  sprite("📐", "triangular-ruler", "Thước ê-ke"),
  sprite("🧩", "puzzle-piece", "Mảnh ghép hình"),
  sprite("🔍", "magnifying-glass", "Kính lúp khám phá"),
  sprite("💬", "speech-balloon", "Bong bóng trò chuyện"),
  sprite("🎯", "bullseye", "Bảng mục tiêu"),
  sprite("🎮", "video-game", "Tay cầm trò chơi"),
  sprite("🎲", "game-die", "Xúc xắc"),
  sprite("🖐️", "hand-splayed", "Bàn tay năm ngón"),
  sprite("✏️", "pencil", "Bút chì"),
  sprite("🖍️", "crayon", "Bút sáp màu"),
  sprite("📏", "straight-ruler", "Thước kẻ"),
  sprite("✂️", "scissors", "Cái kéo"),
  sprite("📖", "open-book", "Sách mở"),
  sprite("🎒", "backpack", "Ba lô đi học"),
  sprite("🔔", "bell", "Cái chuông"),
  sprite("🎨", "palette", "Bảng pha màu"),
  sprite("🧸", "teddy-bear", "Gấu bông"),
  sprite("🎁", "gift", "Hộp quà"),
  sprite("🥁", "drum", "Cái trống"),

  // Đợt 1.6 — Hình khối gỗ Montessori, Mũi tên & Đồ vật quen thuộc (15)
  sprite("🎸", "guitar", "Đàn ghi-ta"),
  sprite("🏀", "basketball", "Bóng rổ"),
  sprite("🔵", "blue-circle", "Hình tròn xanh dương"),
  sprite("🟢", "green-circle", "Hình tròn xanh lá"),
  sprite("⚫", "black-circle", "Hình tròn than ấm"),
  sprite("⚪", "white-circle", "Hình tròn kem trắng"),
  sprite("❤️", "red-heart", "Trái tim ấm"),
  sprite("💎", "gem", "Viên ngọc"),
  sprite("🪙", "coin", "Đồng xu vàng"),
  sprite("⬆️", "up-arrow", "Mũi tên lên"),
  sprite("➡️", "right-arrow", "Mũi tên sang phải"),
  sprite("🏠", "house", "Ngôi nhà"),
  sprite("🧱", "brick", "Khối gạch xếp hình"),
  sprite("📦", "package-box", "Chiếc hộp"),
  sprite("💡", "light-bulb", "Bóng đèn sáng kiến"),
];

const CUSTOM_SPRITE_LIST: readonly EmojiSpriteMeta[] = [
  ...BATCH_1_SPRITES,
  ...BATCH_2_SPRITES,
  ...BATCH_3A_SPRITES,
  ...BATCH_3B_SPRITES,
  ...BATCH_4_SPRITES,
];

export const CUSTOM_EMOJI_SPRITES: ReadonlyMap<string, EmojiSpriteMeta> =
  /* @__PURE__ */ (() => {
    const map = new Map<string, EmojiSpriteMeta>();
    for (const meta of CUSTOM_SPRITE_LIST) {
      map.set(normalizeGlyph(meta.emoji), meta);
    }
    return map;
  })();

let spriteLookupCache: ReadonlyMap<string, EmojiSpriteMeta> | null = null;

function getSpriteLookupMap(): ReadonlyMap<string, EmojiSpriteMeta> {
  if (!spriteLookupCache) {
    spriteLookupCache = buildGlyphLookupMap(
      CUSTOM_SPRITE_LIST,
      (meta) => meta.emoji
    );
  }
  return spriteLookupCache;
}

export function resolveCustomEmojiSprite(
  emoji: string
): EmojiSpriteMeta | null {
  return resolveFromGlyphMap(getSpriteLookupMap(), emoji);
}

export function hasCustomEmojiSprite(emoji: string): boolean {
  return resolveCustomEmojiSprite(emoji) !== null;
}

export function listCustomEmojiSprites(): readonly EmojiSpriteMeta[] {
  return CUSTOM_SPRITE_LIST;
}
