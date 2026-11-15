import {
  childBadges,
  childMascotGear,
  childStickerPlacements,
  childStickers,
  gameLevels,
  type getOwnerDb,
} from "@mindkid/db";
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
import { and, asc, eq } from "drizzle-orm";
import { checkLevelIntroRequired } from "#server/utils/concept-intro-runtime";
import {
  getRecommendationsForChild,
  resolveThumbnailEmoji,
} from "./recommendation.js";

type Db = ReturnType<typeof getOwnerDb>;

export interface GetDailyAdventureInput {
  readonly userId: number;
  readonly childId: number;
  readonly childUuid: string;
  readonly childDisplayName: string;
  readonly allowedTiers: AccessTier[];
  readonly guestDeviceId?: string;
}

async function prependRequiredIntroStep(
  db: Db,
  firstLevelCode: string,
  input: GetDailyAdventureInput
): Promise<AdventureStepItem | null> {
  const [targetRow] = await db
    .select()
    .from(gameLevels)
    .where(eq(gameLevels.code, firstLevelCode))
    .limit(1);
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

  const [introLevel] = await db
    .select({
      code: gameLevels.code,
      title: gameLevels.title,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
    })
    .from(gameLevels)
    .where(eq(gameLevels.code, introCode))
    .limit(1);

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
  db: Db,
  input: GetDailyAdventureInput
): Promise<DailyAdventureResponse> {
  const recPayload = await getRecommendationsForChild(db, {
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
      db,
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
  db: Db,
  childId: number
): Promise<MascotGearResponse> {
  const [badgeRows, [gearRow]] = await Promise.all([
    db
      .select({ badgeCode: childBadges.badgeCode })
      .from(childBadges)
      .where(eq(childBadges.childProfileId, childId)),
    db
      .select({ equippedGearCode: childMascotGear.equippedGearCode })
      .from(childMascotGear)
      .where(eq(childMascotGear.childProfileId, childId))
      .limit(1),
  ]);

  const unlocked = resolveUnlockedMascotGear(
    badgeRows.map((row) => row.badgeCode)
  );
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
  db: Db,
  childId: number,
  input: MascotGearPutInput
): Promise<MascotGearPutResponse> {
  if (input.equipped_gear_code !== null) {
    const badgeRows = await db
      .select({ badgeCode: childBadges.badgeCode })
      .from(childBadges)
      .where(eq(childBadges.childProfileId, childId));
    const unlocked = resolveUnlockedMascotGear(
      badgeRows.map((row) => row.badgeCode)
    );
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

  const now = new Date();
  await db
    .insert(childMascotGear)
    .values({
      childProfileId: childId,
      equippedGearCode: input.equipped_gear_code,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: childMascotGear.childProfileId,
      set: {
        equippedGearCode: input.equipped_gear_code,
        updatedAt: now,
      },
    });

  return {
    equipped_gear_code: input.equipped_gear_code,
  };
}

export interface GetStickerDioramaInput {
  readonly childId: number;
  readonly themeCode?: string;
}

/**
 * Tải bố cục bày sticker bối cảnh của trẻ (`sticker-diorama.md` §8).
 */
export async function getStickerDiorama(
  db: Db,
  input: GetStickerDioramaInput
): Promise<StickerDioramaResponse> {
  const placementFilters = [
    eq(childStickerPlacements.childProfileId, input.childId),
    ...(input.themeCode
      ? [eq(childStickerPlacements.themeCode, input.themeCode)]
      : []),
  ];
  const stickerFilters = [
    eq(childStickers.childProfileId, input.childId),
    ...(input.themeCode ? [eq(childStickers.themeCode, input.themeCode)] : []),
  ];

  const [placementRows, stickerRows] = await Promise.all([
    db
      .select({
        themeCode: childStickerPlacements.themeCode,
        emoji: childStickerPlacements.emoji,
        instanceIndex: childStickerPlacements.instanceIndex,
        normX: childStickerPlacements.normX,
        normY: childStickerPlacements.normY,
        scale: childStickerPlacements.scale,
      })
      .from(childStickerPlacements)
      .where(and(...placementFilters))
      .orderBy(
        asc(childStickerPlacements.themeCode),
        asc(childStickerPlacements.instanceIndex),
        asc(childStickerPlacements.id)
      ),
    db
      .select({
        themeCode: childStickers.themeCode,
        emoji: childStickers.emoji,
        label: childStickers.label,
      })
      .from(childStickers)
      .where(and(...stickerFilters)),
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
  db: Db,
  childId: number,
  payload: StickerDioramaPutInput
): Promise<StickerDioramaPutResponse> {
  const ownedRows = await db
    .select({
      emoji: childStickers.emoji,
      label: childStickers.label,
    })
    .from(childStickers)
    .where(
      and(
        eq(childStickers.childProfileId, childId),
        eq(childStickers.themeCode, payload.theme_code)
      )
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

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .delete(childStickerPlacements)
      .where(
        and(
          eq(childStickerPlacements.childProfileId, childId),
          eq(childStickerPlacements.themeCode, payload.theme_code)
        )
      );

    if (payload.placements.length > 0) {
      await tx.insert(childStickerPlacements).values(
        payload.placements.map((item) => ({
          childProfileId: childId,
          themeCode: payload.theme_code,
          emoji: item.emoji,
          instanceIndex: item.instance_index,
          normX: item.norm_x,
          normY: item.norm_y,
          scale: item.scale,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }
  });

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
