import { randomUUID } from "node:crypto";
import {
  ACCESS_TIER_CODEC,
  CHILD_STATUS,
  type ChildProfileEntity,
  type GameLevelEntity,
  type JsonRecord,
} from "@mindkid/db";
import type { MindKidRepositories } from "@mindkid/db/repositories";
import { isAppError, type JsonValue } from "@mindkid/errors/base";
import { ChildNotFoundError } from "@mindkid/errors/child";
import { PayloadTooLargeError } from "@mindkid/errors/common";
import {
  ContentPackInvalidError,
  GameLevelNotFoundError,
  TemplateNotSupportedError,
} from "@mindkid/errors/game-level";
import { DailyPlayCapReachedError } from "@mindkid/errors/play";
import {
  type GameTemplate,
  getGameTemplate,
  validateContentPack,
} from "@mindkid/game-engine/registry";
import {
  assertContentAccess,
  type CallerIdentity,
  type ContentAccessResult,
  computeRemainingPlaySeconds,
  type EntitlementKey,
  getDateIct,
  MAX_PAYLOAD_BYTES_GZIPPED,
  measureRoundSetPayloadBytes,
  resolveAssets,
} from "@mindkid/shared";
import { type H3Event, setHeader } from "h3";
import { checkLevelIntroRequired } from "#server/utils/concept-intro-runtime";
import { requireCurrentConsent } from "#server/utils/consent-guard";
import { useOwnerRepositories } from "#server/utils/repositories";
import {
  loadRoundSet,
  RUNTIME_SCORING_MODE,
} from "#server/utils/round-set-runtime";

export interface GameConfigDeliveryOptions {
  caller: CallerIdentity;
  version?: number;
  isManagerPreview?: boolean;
  requiresChild?: boolean;
  guestDeviceId?: string;
  callerChildAge?: number;
  activeKeys?: EntitlementKey[];
}

interface LevelTemplateRow {
  level: GameLevelEntity;
  template: GameTemplate;
}

async function resolveOwnedChild(
  repos: MindKidRepositories,
  caller: CallerIdentity
): Promise<ChildProfileEntity | null> {
  if (caller.kind !== "user" || !caller.active_child_id) {
    return null;
  }
  const userId = Number(caller.user_id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ChildNotFoundError();
  }
  const child = await repos.childProfiles.findByUuidForUser(
    caller.active_child_id,
    userId
  );
  if (child?.status !== CHILD_STATUS.ACTIVE) {
    throw new ChildNotFoundError(caller.active_child_id);
  }
  await requireCurrentConsent(userId, "child_data");
  return child;
}

async function fetchLevelAndTemplate(
  repos: MindKidRepositories,
  code: string
): Promise<LevelTemplateRow> {
  const levelRow = await repos.gameLevels.findByCode(code);
  if (!levelRow) {
    throw new GameLevelNotFoundError(code);
  }

  const template = getGameTemplate(levelRow.templateCode);
  if (!template) {
    throw new TemplateNotSupportedError({
      template_code: levelRow.templateCode,
    });
  }

  return { level: levelRow, template };
}

function isExemptFromDailyPlayCap(
  options: GameConfigDeliveryOptions,
  template: GameTemplate,
  ownedChild: ChildProfileEntity | null
): boolean {
  if (
    options.isManagerPreview ||
    options.caller.kind !== "user" ||
    !ownedChild
  ) {
    return true;
  }
  return template.kind === "teach";
}

export async function assertChildDailyPlayQuota(
  repos: MindKidRepositories,
  ownedChild: ChildProfileEntity
): Promise<boolean> {
  const dateIct = getDateIct();
  const stats = await repos.analyticsRollup.getChildDailyStat(
    ownedChild.id,
    dateIct
  );
  const remainingSeconds = computeRemainingPlaySeconds(
    stats,
    ownedChild.dailyPlayCapMinutes
  );
  if (remainingSeconds <= 0) {
    throw new DailyPlayCapReachedError();
  }
  return true;
}

async function runContentAccessGuard(
  repos: MindKidRepositories,
  level: GameLevelEntity,
  template: GameTemplate,
  options: GameConfigDeliveryOptions,
  ownedChild: ChildProfileEntity | null
): Promise<ContentAccessResult> {
  const effectiveChildAge =
    options.callerChildAge ??
    (ownedChild
      ? Math.max(
          3,
          Math.min(6, new Date().getFullYear() - ownedChild.birthYear)
        )
      : undefined);

  try {
    return await assertContentAccess(
      {
        code: level.code,
        access_tier: ACCESS_TIER_CODEC.toLabel(level.accessTier),
        status: "published",
        age_min: level.ageMin ?? 3,
        age_max: level.ageMax ?? 6,
        title: level.title,
        thumbnail_emoji: level.thumbnailEmoji ?? undefined,
      },
      {
        caller: options.caller,
        activeKeys: options.activeKeys,
        isManagerPreview: options.isManagerPreview,
        managerAudience: options.isManagerPreview,
        requiresChild: options.requiresChild,
        callerChildAge: effectiveChildAge,
        verifyChildOwnership: async (userId, childUuid) =>
          ownedChild !== null &&
          String(ownedChild.uuid) === childUuid &&
          String(ownedChild.userId) === userId,
        checkIntroRequired: async () =>
          await checkLevelIntroRequired(
            level,
            options.caller,
            {
              guestDeviceId: options.guestDeviceId,
              isManagerPreview: options.isManagerPreview,
              resolvedChildId: ownedChild?.id ?? null,
            },
            ownedChild?.id ?? null
          ),
        checkQuotaRemaining: async () => {
          if (isExemptFromDailyPlayCap(options, template, ownedChild)) {
            return true;
          }
          if (!ownedChild) {
            return true;
          }
          return await assertChildDailyPlayQuota(repos, ownedChild);
        },
      }
    );
  } catch (err) {
    if (isAppError(err)) {
      throw err;
    }
    throw err;
  }
}

/** Bàn của bản xem trước phải lặp lại được, nên nó khoá vào một seed cố định. */
export const PREVIEW_LAYOUT_SEED = 42;

const LAYOUT_SEED_MAX = 0xff_ff_ff_ff;

export function createLayoutSeed(isManagerPreview: boolean): number {
  return isManagerPreview
    ? PREVIEW_LAYOUT_SEED
    : Math.floor(Math.random() * LAYOUT_SEED_MAX);
}

function resolveSessionGuestDeviceId(
  childProfileId: number | null,
  options: GameConfigDeliveryOptions
): string | null {
  if (childProfileId !== null) {
    return null;
  }
  if (options.guestDeviceId) {
    return options.guestDeviceId;
  }
  if (options.caller.kind === "user" && options.caller.user_id) {
    return `user:${options.caller.user_id}`;
  }
  return options.isManagerPreview ? "preview-manager" : "guest-device";
}

async function createPlaySessionRecord(
  repos: MindKidRepositories,
  params: {
    level: Pick<GameLevelEntity, "id" | "accessTier">;
    templateCode: string;
    ownedChild: { id: number } | null;
    options: GameConfigDeliveryOptions;
    isPreview: boolean;
  }
) {
  const sessionUuid = randomUUID();
  const startedAt = new Date();
  const childProfileId = params.ownedChild?.id ?? null;
  const guestDeviceId = resolveSessionGuestDeviceId(
    childProfileId,
    params.options
  );
  const layoutSeed = createLayoutSeed(params.options.isManagerPreview === true);

  await repos.playSessions.startSession({
    sessionUuid,
    childProfileId,
    guestDeviceId,
    gameLevelId: params.level.id,
    templateCode: params.templateCode,
    layoutSeed,
    isPreview: params.isPreview,
    accessTierAtStart: params.level.accessTier,
    startedAt,
  });

  return { sessionUuid, startedAt, layoutSeed };
}

function validateLevelAndRounds(
  templateCode: string,
  level: {
    code: string;
    contentPack: JsonRecord;
  },
  rounds: Array<{
    round_index: number;
    content_pack: JsonRecord;
  }>
): void {
  const validation = validateContentPack(templateCode, level.contentPack);
  if (!validation.success) {
    console.error(
      `[ALERT] CONTENT_PACK_INVALID for level ${level.code} v1:`,
      validation.error
    );
    throw new ContentPackInvalidError(
      `Content pack invalid for level ${level.code}`,
      {
        details: (validation.error?.details ?? null) as JsonValue,
      }
    );
  }

  for (const round of rounds) {
    if (round.content_pack === level.contentPack) {
      continue;
    }
    const roundValidation = validateContentPack(
      templateCode,
      round.content_pack
    );
    if (!roundValidation.success) {
      throw new ContentPackInvalidError(
        `Round ${round.round_index} content pack invalid`,
        {
          round_index: round.round_index,
          details: (roundValidation.error?.details ?? null) as JsonValue,
        }
      );
    }
  }
}

function assertPayloadWithinCap(
  levelCode: string,
  contentPacks: readonly JsonRecord[]
): void {
  const bytes = measureRoundSetPayloadBytes(contentPacks);
  if (bytes <= MAX_PAYLOAD_BYTES_GZIPPED) {
    return;
  }
  console.error(
    `[ALERT] PAYLOAD_TOO_LARGE for level ${levelCode}: ${bytes} bytes gzipped over ${MAX_PAYLOAD_BYTES_GZIPPED}`
  );
  throw new PayloadTooLargeError();
}

function applyGameConfigCacheHeader(event: H3Event): void {
  // Mọi payload cấu hình bàn chơi đều chứa session.uuid (+ guest_device_id cookie),
  // không được phép public cache trên CDN (BR-CFG-05).
  setHeader(event, "Cache-Control", "private, no-store");
}

export async function deliverGameConfig(
  event: H3Event,
  code: string,
  options: GameConfigDeliveryOptions
) {
  const repos = useOwnerRepositories();
  const [{ level, template }, ownedChild] = await Promise.all([
    fetchLevelAndTemplate(repos, code),
    resolveOwnedChild(repos, options.caller),
  ]);

  const accessResult = await runContentAccessGuard(
    repos,
    level,
    template,
    options,
    ownedChild
  );

  // WP167.1: round set Cấm — NEVER rỗng (BR-RSM-09, BR-RSP-02)
  const rounds = await loadRoundSet(level);

  // Validate content_pack using Zod schema (BR-CFG-03 / D-FS)
  validateLevelAndRounds(template.code, level, rounds);

  // WP167.0: trần payload đo trước khi tạo phiên (BR-CFG-08, BR-RSM-10)
  assertPayloadWithinCap(level.code, [
    level.contentPack,
    ...rounds.map((r) => r.content_pack),
  ]);

  // Create minimum play_sessions row (D-FR, BR-RNG-06, BR-RNG-07)
  const { sessionUuid, startedAt, layoutSeed } = await createPlaySessionRecord(
    repos,
    {
      level,
      templateCode: template.code,
      ownedChild,
      options,
      isPreview: accessResult.is_preview,
    }
  );

  // Resolve assets (BR-CFG-07)
  const allContentPacks = [
    level.contentPack,
    ...rounds
      .map((r) => r.content_pack)
      .filter((pack) => pack !== level.contentPack),
  ];
  const assets = allContentPacks.flatMap((pack) => resolveAssets(pack));

  applyGameConfigCacheHeader(event);

  return {
    level_code: level.code,
    content_version: 1,
    template_code: template.code,
    title: level.title,
    instruction: level.instruction || "",
    instruction_audio_url: level.instructionAudioPath || undefined,
    content_pack: level.contentPack,
    difficulty_params: level.difficultyParams,
    layout_seed: layoutSeed,
    theme_id: level.themeId || "general",
    age_band: `${level.ageMin ?? 3}-${level.ageMax ?? 6}`,
    scoring: {
      ...template.scoring,
      mode: RUNTIME_SCORING_MODE,
    },
    rounds: rounds.map((r) => ({
      round_index: r.round_index,
      instruction: r.instruction,
      instruction_audio_path: r.instruction_audio_path,
      content_pack: r.content_pack,
      difficulty_params: r.difficulty_params,
      difficulty: r.difficulty,
    })),
    session: {
      uuid: sessionUuid,
      started_at: startedAt.toISOString(),
    },
    flags: {
      reduced_motion: false,
      audio_enabled: true,
      tap_fallback: template.requires_tap_fallback ?? true,
    },
    assets,
    age_mismatch: accessResult.age_mismatch,
    is_preview: accessResult.is_preview,
  };
}
