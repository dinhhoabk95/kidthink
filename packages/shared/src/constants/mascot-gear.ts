/**
 * Danh mục phụ kiện kỷ niệm Phòng chơi Gấu Con (`mascot-playroom.md`) và
 * danh mục giáo cụ Hộp đồ chơi tự do Montessori (`montessori-toybox.md`).
 */

export type MascotGearSlot = "hat" | "scarf" | "badge_pin";

export type MascotUnlockBadgeCode =
  | "STRAND_FIRST_COMPLETE"
  | "WEEK_CURRICULUM_COMPLETE"
  | "PLAY_DAYS_5";

export interface MascotGearCatalogItem {
  readonly code: string;
  readonly slot: MascotGearSlot;
  readonly label_vi: string;
  readonly spoken_vi: string;
  readonly icon_emoji: string;
  readonly unlock_badge_code: MascotUnlockBadgeCode | null;
}

export const MASCOT_GEAR_CATALOG: readonly MascotGearCatalogItem[] = [
  {
    code: "flower_pin",
    slot: "badge_pin",
    label_vi: "Cài Hoa Cúc Vàng",
    spoken_vi: "Gấu Con cài bông hoa cúc vàng xinh xắn!",
    icon_emoji: "🌼",
    unlock_badge_code: null,
  },
  {
    code: "explorer_hat",
    slot: "hat",
    label_vi: "Mũ Nhà Thám Hiểm",
    spoken_vi: "Gấu Con đội mũ nhà thám hiểm sẵn sàng khám phá!",
    icon_emoji: "👒",
    unlock_badge_code: "STRAND_FIRST_COMPLETE",
  },
  {
    code: "rainbow_scarf",
    slot: "scarf",
    label_vi: "Khăn Choàng Ấm Áp",
    spoken_vi: "Gấu Con quàng khăn ấm áp đi chơi cùng bé!",
    icon_emoji: "🧣",
    unlock_badge_code: "STRAND_FIRST_COMPLETE",
  },
  {
    code: "leaf_crown",
    slot: "hat",
    label_vi: "Vương Miện Lá Xanh",
    spoken_vi: "Gấu Con đội vương miện lá xanh thật vui!",
    icon_emoji: "🌿",
    unlock_badge_code: "WEEK_CURRICULUM_COMPLETE",
  },
  {
    code: "star_crown",
    slot: "hat",
    label_vi: "Mũ Ngôi Sao Sáng",
    spoken_vi: "Gấu Con đội mũ ngôi sao lấp lánh!",
    icon_emoji: "👑",
    unlock_badge_code: "PLAY_DAYS_5",
  },
  {
    code: "honey_medal",
    slot: "badge_pin",
    label_vi: "Huy Chương Mật Ong",
    spoken_vi: "Gấu Con đeo huy chương mật ong ngọt ngào!",
    icon_emoji: "🍯",
    unlock_badge_code: "PLAY_DAYS_5",
  },
] as const;

export const MASCOT_GEAR_MAP: ReadonlyMap<string, MascotGearCatalogItem> =
  new Map(MASCOT_GEAR_CATALOG.map((item) => [item.code, item]));

export function resolveUnlockedMascotGear(
  earnedBadgeCodes: Iterable<string>
): MascotGearCatalogItem[] {
  const badgeSet = new Set(earnedBadgeCodes);
  return MASCOT_GEAR_CATALOG.filter(
    (item) =>
      item.unlock_badge_code === null || badgeSet.has(item.unlock_badge_code)
  );
}

export type ToyboxToolSlug = "balance-scale" | "number-rods" | "mirror-blocks";

export interface ToyboxToolDefinition {
  readonly slug: ToyboxToolSlug;
  readonly title_vi: string;
  readonly spoken_intro_vi: string;
  readonly icon_emoji: string;
  readonly competency_hint: "C1" | "C2" | "C5";
}

export const TOYBOX_TOOLS: readonly ToyboxToolDefinition[] = [
  {
    slug: "balance-scale",
    title_vi: "Cân Gỗ Bạn Thú",
    spoken_intro_vi:
      "Chào mừng bé đến bàn Cân Gỗ Bạn Thú! Hãy đặt các bạn lên hai đĩa cân xem bên nào nặng hơn nhé!",
    icon_emoji: "⚖️",
    competency_hint: "C5",
  },
  {
    slug: "number-rods",
    title_vi: "Khung 10 & Hạt Số",
    spoken_intro_vi:
      "Cùng Gấu Con thả hạt gỗ vào khung mười và nghe tiếng đàn mộc cầm đếm số vui tai nhé!",
    icon_emoji: "🧮",
    competency_hint: "C1",
  },
  {
    slug: "mirror-blocks",
    title_vi: "Gương Thần Vạn Hoa",
    spoken_intro_vi:
      "Bàn Gương Thần kỳ diệu! Bé đặt hình gỗ bên trái, chiếc gương sẽ tạo hình đối xứng bên phải ngay lập tức!",
    icon_emoji: "🦋",
    competency_hint: "C2",
  },
] as const;

export const TOYBOX_TOOL_SLUGS: ReadonlySet<string> = new Set(
  TOYBOX_TOOLS.map((tool) => tool.slug)
);

export function isToyboxToolSlug(value: string): value is ToyboxToolSlug {
  return TOYBOX_TOOL_SLUGS.has(value);
}

export const MAX_DIORAMA_PLACEMENTS = 24;
export const DIORAMA_NORM_MIN = 0.05;
export const DIORAMA_NORM_MAX = 0.95;
export const DIORAMA_SCALE_MIN = 0.75;
export const DIORAMA_SCALE_MAX = 1.35;
export const MAX_ADVENTURE_STEPS = 3;
