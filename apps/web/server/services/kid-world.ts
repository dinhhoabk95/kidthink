import type { DbExecutor } from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import { ValidationError } from "@mindkid/errors/common";
import {
  type AccessTier,
  type AdventureStepItem,
  type DailyAdventureResponse,
  MAX_ADVENTURE_STEPS,
  type MascotGearPutInput,
  type MascotGearPutResponse,
  type MascotGearResponse,
  resolveUnlockedMascotGear,
  type StickerDioramaPlacementItem,
  type StickerDioramaPutInput,
  type StickerDioramaPutResponse,
  type StickerDioramaResponse,
} from "@mindkid/shared";
import { checkLevelIntroRequired } from "#server/utils/concept-intro-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";
import {
  getRecommendationsForChild,
  resolveThumbnailEmoji,
} from "./recommendation.js";

export interface GetDailyAdventureInput {
  readonly userId: number;
  readonly childId: number;
  readonly childUuid: string;
  readonly childDisplayName: string;
  readonly allowedTiers: AccessTier[];
  readonly guestDeviceId?: string;
}

export interface GetStickerDioramaInput {
  readonly childId: number;
  readonly themeCode?: string;
}

function isRepositories(
  target: DbExecutor | MindKidRepositories
): target is MindKidRepositories {
  return "kidWorld" in target;
}

function toRepositories(
  target?: DbExecutor | MindKidRepositories
): MindKidRepositories {
  if (!target) {
    return useOwnerRepositories();
  }
  return isRepositories(target) ? target : createRepositories(target);
}

async function prependRequiredIntroStep(
  repos: MindKidRepositories,
  firstLevelCode: string,
  input: GetDailyAdventureInput
): Promise<AdventureStepItem | null> {
  const targetRow = await repos.gameLevels.findByCode(firstLevelCode);
  if (!targetRow || targetRow.templateCode === "GT-000") {
    return null;
  }

  const introStatus = await checkLevelIntroRequired(
    targetRow,
    {
      kind: "user",
      user_id: String(input.userId),
      active_child_id: input.childUuid,
    },
    { guestDeviceId: input.guestDeviceId }
  );

  const introCode =
    introStatus.intro_level_code ??
    introStatus.intro_queue?.[0]?.intro_level_code ??
    null;
  if (!(introStatus.intro_required && introCode)) {
    return null;
  }

  const introLevel = await repos.gameLevels.findByCode(introCode);
  if (!introLevel) {
    return null;
  }

  return {
    step_index: 0,
    level_code: introLevel.code,
    title: introLevel.title,
    thumbnail_emoji: resolveThumbnailEmoji(introLevel.thumbnailEmoji),
    kind: "intro",
  };
}

/**
 * Chuỗi phiêu lưu một chạm hợp ZPD (`daily-adventure-flow.md`, `BR-DAV-01..06`).
 * Không chứa bất kỳ bộ đếm chuỗi ngày (streak) hay đồng hồ đếm ngược nào.
 */
export async function getDailyAdventure(
  input: GetDailyAdventureInput
): Promise<DailyAdventureResponse>;
export async function getDailyAdventure(
  dbOrRepos: DbExecutor | MindKidRepositories,
  input: GetDailyAdventureInput
): Promise<DailyAdventureResponse>;
export async function getDailyAdventure(
  first: DbExecutor | MindKidRepositories | GetDailyAdventureInput,
  maybeInput?: GetDailyAdventureInput
): Promise<DailyAdventureResponse> {
  const isLegacyCall = maybeInput !== undefined;
  const repos = isLegacyCall
    ? toRepositories(first as DbExecutor | MindKidRepositories)
    : useOwnerRepositories();
  const input = isLegacyCall ? maybeInput : (first as GetDailyAdventureInput);

  const recPayload = await getRecommendationsForChild(repos, {
    childId: input.childId,
    allowedTiers: input.allowedTiers,
    limit: MAX_ADVENTURE_STEPS,
  });

  const candidateItems = [
    recPayload.primary,
    ...recPayload.alternatives,
  ].filter((item) => !item.locked);

  const rawSteps: Omit<AdventureStepItem, "step_index">[] = [];
  const seenCodes = new Set<string>();

  const firstItem = candidateItems[0];
  if (firstItem) {
    const introStep = await prependRequiredIntroStep(
      repos,
      firstItem.level_code,
      input
    );
    if (introStep) {
      rawSteps.push({
        level_code: introStep.level_code,
        title: introStep.title,
        thumbnail_emoji: introStep.thumbnail_emoji,
        kind: "intro",
      });
      seenCodes.add(introStep.level_code);
    }
  }

  for (const item of candidateItems) {
    if (rawSteps.length >= MAX_ADVENTURE_STEPS) {
      break;
    }
    if (seenCodes.has(item.level_code)) {
      continue;
    }
    seenCodes.add(item.level_code);
    rawSteps.push({
      level_code: item.level_code,
      title: item.title,
      thumbnail_emoji: resolveThumbnailEmoji(item.thumbnail_emoji),
      kind: "play",
    });
  }

  const steps: AdventureStepItem[] = rawSteps.map((step, index) => ({
    step_index: index,
    level_code: step.level_code,
    title: step.title,
    thumbnail_emoji: step.thumbnail_emoji,
    kind: step.kind,
  }));

  return {
    child_uuid: input.childUuid,
    greeting_vi: `Gấu Con chào ${input.childDisplayName}! Mình cùng đi phiêu lưu hôm nay nhé!`,
    steps,
  };
}

/**
 * Đọc phụ kiện kỷ niệm đã mở và phụ kiện đang đội của Gấu Con (`BR-MPR-01..03`).
 */
export async function getChildMascotGear(
  childId: number
): Promise<MascotGearResponse>;
export async function getChildMascotGear(
  dbOrRepos: DbExecutor | MindKidRepositories,
  childId: number
): Promise<MascotGearResponse>;
export async function getChildMascotGear(
  first: DbExecutor | MindKidRepositories | number,
  maybeChildId?: number
): Promise<MascotGearResponse> {
  const isLegacyCall = typeof first !== "number";
  const repos = isLegacyCall ? toRepositories(first) : useOwnerRepositories();
  const childId = isLegacyCall ? (maybeChildId as number) : first;

  const [badgeCodes, gearRow] = await Promise.all([
    repos.badges.listBadgeCodesForChild(childId),
    repos.kidWorld.getEquippedGear(childId),
  ]);

  const unlocked = resolveUnlockedMascotGear(badgeCodes);
  const unlockedCodes = new Set(unlocked.map((item) => item.code));
  const candidateEquipped = gearRow?.equippedGearCode ?? null;
  const equippedGearCode =
    candidateEquipped && unlockedCodes.has(candidateEquipped)
      ? candidateEquipped
      : null;

  return {
    equipped_gear_code: equippedGearCode,
    unlocked_gears: unlocked.map((item) => ({
      code: item.code,
      slot: item.slot,
      label_vi: item.label_vi,
      spoken_vi: item.spoken_vi,
      icon_emoji: item.icon_emoji,
    })),
  };
}

/**
 * Đội hoặc tháo phụ kiện Gấu Con (`BR-MPR-05`).
 * Từ chối 422 nếu phụ kiện chưa được trẻ mở khoá qua huy hiệu.
 */
export async function updateChildMascotGear(
  childId: number,
  input: MascotGearPutInput
): Promise<MascotGearPutResponse>;
export async function updateChildMascotGear(
  dbOrRepos: DbExecutor | MindKidRepositories,
  childId: number,
  input: MascotGearPutInput
): Promise<MascotGearPutResponse>;
export async function updateChildMascotGear(
  first: DbExecutor | MindKidRepositories | number,
  second: number | MascotGearPutInput,
  third?: MascotGearPutInput
): Promise<MascotGearPutResponse> {
  const isLegacyCall = typeof first !== "number";
  const repos = isLegacyCall ? toRepositories(first) : useOwnerRepositories();
  const childId = isLegacyCall ? (second as number) : first;
  const input = isLegacyCall
    ? (third as MascotGearPutInput)
    : (second as MascotGearPutInput);

  if (input.equipped_gear_code !== null) {
    const badgeCodes = await repos.badges.listBadgeCodesForChild(childId);
    const unlocked = resolveUnlockedMascotGear(badgeCodes);
    const isUnlocked = unlocked.some(
      (item) => item.code === input.equipped_gear_code
    );
    if (!isUnlocked) {
      throw new ValidationError([
        {
          path: "equipped_gear_code",
          message: "Bé chưa mở khoá phụ kiện kỷ niệm này.",
        },
      ]);
    }
  }

  await repos.kidWorld.upsertEquippedGear(childId, input.equipped_gear_code);

  return {
    equipped_gear_code: input.equipped_gear_code,
  };
}

/**
 * Tải bố cục bày sticker bối cảnh của trẻ (`sticker-diorama.md` §8).
 */
export async function getStickerDiorama(
  input: GetStickerDioramaInput
): Promise<StickerDioramaResponse>;
export async function getStickerDiorama(
  dbOrRepos: DbExecutor | MindKidRepositories,
  input: GetStickerDioramaInput
): Promise<StickerDioramaResponse>;
export async function getStickerDiorama(
  first: DbExecutor | MindKidRepositories | GetStickerDioramaInput,
  maybeInput?: GetStickerDioramaInput
): Promise<StickerDioramaResponse> {
  const isLegacyCall = maybeInput !== undefined;
  const repos = isLegacyCall
    ? toRepositories(first as DbExecutor | MindKidRepositories)
    : useOwnerRepositories();
  const input = isLegacyCall ? maybeInput : (first as GetStickerDioramaInput);

  const [placementRows, stickerRows] = await Promise.all([
    repos.kidWorld.listPlacements(input.childId, input.themeCode),
    repos.childStickers.listByChild(input.childId, input.themeCode),
  ]);

  const labelMap = new Map<string, string>();
  for (const row of stickerRows) {
    const key = `${row.themeCode}:${row.emoji}`;
    if (!labelMap.has(key)) {
      labelMap.set(key, row.label);
    }
  }

  const grouped: Record<string, StickerDioramaPlacementItem[]> = {};
  for (const row of placementRows) {
    const label = labelMap.get(`${row.themeCode}:${row.emoji}`);
    if (!label) {
      continue;
    }
    const list = grouped[row.themeCode] ?? [];
    list.push({
      emoji: row.emoji,
      label,
      instance_index: row.instanceIndex,
      norm_x: row.normX,
      norm_y: row.normY,
      scale: row.scale,
    });
    grouped[row.themeCode] = list;
  }

  return { placements_by_theme: grouped };
}

/**
 * Lưu bố cục bày sticker của một bức tranh chủ đề (`BR-SDM-01..03`).
 * Tuyệt đối không UPDATE hay DELETE bảng `child_stickers` (`BR-STK-02`).
 */
export async function saveStickerDiorama(
  childId: number,
  payload: StickerDioramaPutInput
): Promise<StickerDioramaPutResponse>;
export async function saveStickerDiorama(
  dbOrRepos: DbExecutor | MindKidRepositories,
  childId: number,
  payload: StickerDioramaPutInput
): Promise<StickerDioramaPutResponse>;
export async function saveStickerDiorama(
  first: DbExecutor | MindKidRepositories | number,
  second: number | StickerDioramaPutInput,
  third?: StickerDioramaPutInput
): Promise<StickerDioramaPutResponse> {
  const isLegacyCall = typeof first !== "number";
  const repos = isLegacyCall ? toRepositories(first) : useOwnerRepositories();
  const childId = isLegacyCall ? (second as number) : first;
  const payload = isLegacyCall
    ? (third as StickerDioramaPutInput)
    : (second as StickerDioramaPutInput);

  const ownedRows = await repos.childStickers.listByChild(
    childId,
    payload.theme_code
  );

  const ownedLabelByEmoji = new Map<string, string>();
  for (const row of ownedRows) {
    if (!ownedLabelByEmoji.has(row.emoji)) {
      ownedLabelByEmoji.set(row.emoji, row.label);
    }
  }

  for (let i = 0; i < payload.placements.length; i++) {
    const item = payload.placements[i];
    if (!(item && ownedLabelByEmoji.has(item.emoji))) {
      throw new ValidationError([
        {
          path: `placements.${i}.emoji`,
          message: "Sticker chưa có trong bộ sưu tập chủ đề này của bé.",
        },
      ]);
    }
  }

  await repos.kidWorld.replaceThemePlacements(
    childId,
    payload.theme_code,
    payload.placements.map((item) => ({
      emoji: item.emoji,
      instanceIndex: item.instance_index,
      normX: item.norm_x,
      normY: item.norm_y,
      scale: item.scale,
    }))
  );

  return {
    theme_code: payload.theme_code,
    placements: payload.placements.map((item) => ({
      emoji: item.emoji,
      label: ownedLabelByEmoji.get(item.emoji) ?? item.emoji,
      instance_index: item.instance_index,
      norm_x: item.norm_x,
      norm_y: item.norm_y,
      scale: item.scale,
    })),
  };
}
