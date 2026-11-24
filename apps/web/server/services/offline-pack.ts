import { createHash, createHmac } from "node:crypto";
import { writeAudit } from "@mindkid/audit";
import {
  ACCESS_TIER_CODEC,
  CHILD_STATUS,
  CONTENT_ENTITY_TYPE_CODEC,
  type CreateTelemetryEventInput,
  type JsonRecord,
  PLAY_COMPLETION_STATUS,
  type PlaySessionEntity,
} from "@mindkid/db";
import type { MindKidRepositories } from "@mindkid/db/repositories";
import {
  EntitlementRequiredError,
  TierLockedError,
} from "@mindkid/errors/billing";
import { PersonalCurriculumNotFoundError } from "@mindkid/errors/curriculum";
import { UnknownEventNameError } from "@mindkid/errors/play";
import {
  ALLOWED_EVENT_NAMES,
  cleanEventPayload,
  type EventPayload,
  validateSequenceNumbers,
  validateTelemetryEventRecord,
} from "@mindkid/play";
import {
  type AccessTier,
  allowedTiers,
  type EntitlementKey,
  getEffectiveTier,
  OFFLINE_PACK_MAX_LEASE_DAYS,
  type OfflineAssetItem,
  type OfflineCurriculumPackManifest,
  type OfflineSyncEventItem,
  type OfflineSyncResponse,
  redactPii,
  TIER_ENTITLEMENT,
} from "@mindkid/shared";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import {
  useOwnerRepositories,
  useRepositories,
} from "#server/utils/repositories";

export interface OfflinePackCallerContext {
  userId: number;
  entitlements?: readonly EntitlementKey[];
  ip?: string;
  userAgent?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function calculateSha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function generateDeterministicLeaseToken(
  userId: number,
  curriculumCode: string,
  weekNo: number,
  expiresAtIso: string
): string {
  const secret =
    process.env.NUXT_SESSION_PASSWORD ||
    (process.env.NODE_ENV === "test" ? "mindkid_offline_lease_secret_v1" : "");
  if (!secret) {
    throw new Error(
      "NUXT_SESSION_PASSWORD is not configured for offline lease token"
    );
  }
  const payload = `${userId}:${curriculumCode}:${weekNo}:${expiresAtIso}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

interface ResolvedCurriculumData {
  kind: "system" | "personal";
  curriculumCode: string;
  curriculumTier: AccessTier | null;
  contentVersion: number;
  rawItems: Array<{ entityType: string; entityId: number }>;
}

async function resolveSystemCurriculum(
  repos: MindKidRepositories,
  code: string,
  weekNo: number
): Promise<ResolvedCurriculumData | null> {
  const systemCurriculum = await repos.curricula.findByCode(code);
  if (!systemCurriculum) {
    return null;
  }

  const sysItems = await repos.curricula.listItems(
    [systemCurriculum.id],
    weekNo
  );

  return {
    kind: "system",
    curriculumCode: systemCurriculum.code,
    curriculumTier: ACCESS_TIER_CODEC.toLabel(systemCurriculum.accessTier),
    contentVersion: 1,
    rawItems: sysItems.map((item) => ({
      entityType: CONTENT_ENTITY_TYPE_CODEC.toLabel(item.entityType),
      entityId: item.entityId,
    })),
  };
}

async function resolvePersonalCurriculum(
  repos: MindKidRepositories,
  uuid: string,
  userId: number,
  weekNo: number
): Promise<ResolvedCurriculumData | null> {
  if (!UUID_REGEX.test(uuid)) {
    return null;
  }

  const personalCurr = await repos.personalCurricula.findByUuidForUser(
    uuid,
    userId
  );
  if (!personalCurr) {
    return null;
  }

  const persItems = await repos.personalCurricula.listItems(
    personalCurr.id,
    weekNo
  );

  return {
    kind: "personal",
    curriculumCode: `CUR-P${String(personalCurr.id).padStart(3, "0")}`,
    curriculumTier: null,
    contentVersion: personalCurr.version,
    rawItems: persItems.map((item) => ({
      entityType: CONTENT_ENTITY_TYPE_CODEC.toLabel(item.entityType),
      entityId: item.entityId,
    })),
  };
}

function assertOfflineTierAllowed(params: {
  levelTier: AccessTier;
  curriculumTier: AccessTier | null;
  userAllowedTiers: readonly AccessTier[];
  entitlements: readonly EntitlementKey[];
}): void {
  const effectiveTier = getEffectiveTier(
    params.levelTier,
    params.curriculumTier
  );
  const canAccessViaPremiumCurr =
    params.curriculumTier === "premium" &&
    params.entitlements.includes("access_premium_curriculum") &&
    params.userAllowedTiers.includes(params.levelTier);

  if (
    !(
      params.userAllowedTiers.includes(effectiveTier) || canAccessViaPremiumCurr
    )
  ) {
    throw new TierLockedError({
      access_tier: effectiveTier,
      required_entitlement: TIER_ENTITLEMENT[effectiveTier],
    });
  }
}

async function buildOfflineAssets(
  repos: MindKidRepositories,
  rawItems: Array<{ entityType: string; entityId: number }>,
  options: {
    kind: "system" | "personal";
    curriculumCode: string;
    curriculumTier: AccessTier | null;
    weekNo: number;
    userAllowedTiers: readonly AccessTier[];
    entitlements: readonly EntitlementKey[];
  }
): Promise<OfflineAssetItem[]> {
  const assets: OfflineAssetItem[] = [];
  const gameLevelIds = rawItems
    .filter((i) => i.entityType === "game_level")
    .map((i) => i.entityId);

  if (gameLevelIds.length > 0) {
    const levelMap = await repos.gameLevels.mapByIds(gameLevelIds);
    const seenIds = new Set<number>();

    for (const item of rawItems) {
      if (item.entityType !== "game_level" || seenIds.has(item.entityId)) {
        continue;
      }
      seenIds.add(item.entityId);
      const gl = levelMap.get(item.entityId);
      if (!gl) {
        if (options.kind === "system") {
          assertOfflineTierAllowed({
            levelTier: "premium",
            curriculumTier: options.curriculumTier,
            userAllowedTiers: options.userAllowedTiers,
            entitlements: options.entitlements,
          });
        }
        continue;
      }

      const glTier = ACCESS_TIER_CODEC.toLabel(gl.accessTier);
      assertOfflineTierAllowed({
        levelTier: glTier,
        curriculumTier: options.curriculumTier,
        userAllowedTiers: options.userAllowedTiers,
        entitlements: options.entitlements,
      });

      const configContent = JSON.stringify(gl.contentPack || {});
      assets.push({
        path: `/api/guest/levels/${gl.code}/config`,
        size_bytes: Buffer.byteLength(configContent, "utf-8") || 4096,
        sha256: calculateSha256(configContent),
      });
      assets.push({
        path: `/assets/games/${gl.code.toLowerCase()}.webp`,
        size_bytes: 18_000,
        sha256: calculateSha256(`asset:${gl.code}`),
      });
    }
  }

  if (assets.length === 0) {
    assets.push({
      path: `/curricula/${options.curriculumCode}/week-${options.weekNo}.json`,
      size_bytes: 1024,
      sha256: calculateSha256(
        `empty_week_${options.curriculumCode}_${options.weekNo}`
      ),
    });
  }

  return assets;
}

export async function generateOfflineCurriculumPackManifest(
  context: OfflinePackCallerContext,
  curriculumIdOrCode: string,
  weekNo: number
): Promise<OfflineCurriculumPackManifest> {
  const repos = useRepositories();
  const entitlements = context.entitlements
    ? [...context.entitlements]
    : await resolveUserActiveEntitlements(context.userId);
  const userAllowedTiers = await allowedTiers(
    { kind: "user", user_id: String(context.userId) },
    entitlements
  );

  const resolved =
    (await resolveSystemCurriculum(repos, curriculumIdOrCode, weekNo)) ||
    (await resolvePersonalCurriculum(
      repos,
      curriculumIdOrCode,
      context.userId,
      weekNo
    ));

  if (!resolved) {
    throw new PersonalCurriculumNotFoundError(curriculumIdOrCode);
  }

  if (resolved.kind === "personal") {
    if (!entitlements.includes("create_custom_curriculum")) {
      throw new EntitlementRequiredError({
        required_entitlement: "create_custom_curriculum",
        message:
          "Tính năng tải ngoại tuyến lộ trình cá nhân yêu cầu gói bổ trợ Add-on Curriculum.",
      });
    }
  } else if (resolved.curriculumTier) {
    const canAccessSystemCurriculum =
      userAllowedTiers.includes(resolved.curriculumTier) ||
      (resolved.curriculumTier === "premium" &&
        entitlements.includes("access_premium_curriculum"));
    if (!canAccessSystemCurriculum) {
      throw new TierLockedError({
        access_tier: resolved.curriculumTier,
        required_entitlement: TIER_ENTITLEMENT[resolved.curriculumTier],
      });
    }
  }

  if (resolved.rawItems.length === 0) {
    throw new PersonalCurriculumNotFoundError(curriculumIdOrCode);
  }

  const { curriculumCode, curriculumTier, contentVersion, rawItems } = resolved;
  const assets = await buildOfflineAssets(repos, rawItems, {
    kind: resolved.kind,
    curriculumCode,
    curriculumTier,
    weekNo,
    userAllowedTiers,
    entitlements,
  });

  const totalSizeBytes = assets.reduce((sum, a) => sum + a.size_bytes, 0);
  const now = new Date();
  const leaseExpiresAt = new Date(
    now.getTime() + OFFLINE_PACK_MAX_LEASE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const leaseToken = generateDeterministicLeaseToken(
    context.userId,
    curriculumCode,
    weekNo,
    leaseExpiresAt
  );

  const packId = `PACK-${curriculumCode}-W${String(weekNo).padStart(2, "0")}`;
  const manifestPayload = `${packId}:${curriculumCode}:${weekNo}:${contentVersion}:${leaseToken}:${totalSizeBytes}:${assets.map((a) => a.sha256).join(",")}`;
  const manifestChecksumSha256 = calculateSha256(manifestPayload);

  const manifest: OfflineCurriculumPackManifest = {
    pack_id: packId,
    curriculum_code: curriculumCode,
    week_number: weekNo,
    content_version: contentVersion,
    lease_token: leaseToken,
    lease_expires_at: leaseExpiresAt,
    total_size_bytes: totalSizeBytes,
    assets,
    manifest_checksum_sha256: manifestChecksumSha256,
  };

  const ownerRepos = useOwnerRepositories();
  await ownerRepos.playSessions.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "pwa.offline_pack.manifest_generated",
      entity_type: "offline_pack",
      entity_id: packId,
      after_data: {
        pack_id: packId,
        curriculum_code: curriculumCode,
        week_no: weekNo,
        assets_count: assets.length,
        total_size_bytes: totalSizeBytes,
      },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  });

  return manifest;
}

function normalizeSyncOccurredAtMs(
  rawMs: number | undefined,
  startedAt: Date | null | undefined
): number | null {
  if (typeof rawMs !== "number") {
    return null;
  }
  let ms = rawMs;
  if (ms > 1_000_000_000_000 && startedAt) {
    ms = Math.max(0, Math.round(ms - new Date(startedAt).getTime()));
  }
  if (ms > 2_147_483_647) {
    return 2_147_483_647;
  }
  return ms < 0 ? 0 : ms;
}

function toTelemetryJsonObject(input: object): JsonRecord {
  const out: Record<string, JsonRecord[string]> = {};
  for (const [k, v] of Object.entries(input)) {
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) => {
        if (
          item === null ||
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
        ) {
          return item;
        }
        if (typeof item === "object") {
          return toTelemetryJsonObject(item);
        }
        return String(item);
      });
    } else if (typeof v === "object") {
      out[k] = toTelemetryJsonObject(v);
    }
  }
  return out;
}

async function syncSingleSessionEvents(
  repos: MindKidRepositories,
  session: PlaySessionEntity,
  childUuid: string,
  events: OfflineSyncEventItem[]
): Promise<{ synced: number; skipped: number }> {
  if (events.length === 0) {
    return { synced: 0, skipped: 0 };
  }

  if (
    session.completionStatus === PLAY_COMPLETION_STATUS.COMPLETED ||
    session.completionStatus === PLAY_COMPLETION_STATUS.ABANDONED
  ) {
    return { synced: 0, skipped: events.length };
  }

  const existingSeqList = await repos.telemetry.listSeqsBySession(
    session.sessionUuid
  );
  const existingSeqs = new Set<number>(existingSeqList);
  const currentMaxSeq = existingSeqList[0] ?? 0;

  validateSequenceNumbers(events, currentMaxSeq, existingSeqs);

  const seenBatchSeqs = new Set<number>();
  const rows: CreateTelemetryEventInput[] = [];
  let skipped = 0;

  for (const ev of events) {
    if (existingSeqs.has(ev.seq) || seenBatchSeqs.has(ev.seq)) {
      skipped++;
      continue;
    }
    seenBatchSeqs.add(ev.seq);

    const occurredAtMs = normalizeSyncOccurredAtMs(
      ev.occurred_at_ms,
      session.startedAt
    );
    const clientTimestamp = ev.client_timestamp
      ? new Date(ev.client_timestamp)
      : new Date();
    const redacted: EventPayload = redactPii(ev.payload ?? {});
    const cleanedPayload = cleanEventPayload(ev.event_name, redacted);

    validateTelemetryEventRecord({
      session_uuid: session.sessionUuid,
      seq: ev.seq,
      event_name: ev.event_name,
      occurred_at_ms: occurredAtMs,
      payload: cleanedPayload,
      client_timestamp: clientTimestamp,
    });

    rows.push({
      sessionUuid: session.sessionUuid,
      seq: ev.seq,
      childUuid,
      gameLevelId: session.gameLevelId,
      templateCode: session.templateCode,
      eventName: ev.event_name,
      occurredAtMs,
      payload: toTelemetryJsonObject(cleanedPayload),
      clientTimestamp,
    });
  }

  if (rows.length === 0) {
    return { synced: 0, skipped };
  }

  const insertedSeqs = await repos.telemetry.insertBatchReturningSeqs(rows);
  const synced = insertedSeqs.length;
  skipped += rows.length - synced;
  return { synced, skipped };
}

async function loadAuthorizedActiveChildMap(
  repos: MindKidRepositories,
  childProfileIds: number[],
  userId: number
): Promise<Map<number, string>> {
  const authorized = new Map<number, string>();
  if (childProfileIds.length === 0) {
    return authorized;
  }
  const requestedSet = new Set(childProfileIds);
  const userChildren = await repos.childProfiles.listActiveByUser(userId);
  for (const c of userChildren) {
    if (c.status === CHILD_STATUS.ACTIVE && requestedSet.has(c.id)) {
      authorized.set(c.id, c.uuid);
    }
  }
  return authorized;
}

export async function syncOfflinePlayEvents(
  context: OfflinePackCallerContext,
  events: OfflineSyncEventItem[]
): Promise<OfflineSyncResponse> {
  for (const ev of events) {
    if (!ALLOWED_EVENT_NAMES.has(ev.event_name)) {
      throw new UnknownEventNameError();
    }
  }

  const ownerRepos = useOwnerRepositories();
  let syncedCount = 0;
  let duplicatesSkipped = 0;

  const eventsBySession = new Map<string, OfflineSyncEventItem[]>();
  for (const ev of events) {
    const list = eventsBySession.get(ev.session_uuid) || [];
    list.push(ev);
    eventsBySession.set(ev.session_uuid, list);
  }

  const sessionUuids = Array.from(eventsBySession.keys());
  if (sessionUuids.length === 0) {
    return { synced_count: 0, duplicates_skipped: 0 };
  }

  const sessionList = await ownerRepos.playSessions.findByUuids(sessionUuids);

  const sessionMap = new Map<string, PlaySessionEntity>();
  const childProfileIds: number[] = [];
  for (const s of sessionList) {
    sessionMap.set(s.sessionUuid, s);
    if (s.childProfileId) {
      childProfileIds.push(Number(s.childProfileId));
    }
  }

  const authorizedChildMap = await loadAuthorizedActiveChildMap(
    ownerRepos,
    childProfileIds,
    context.userId
  );

  for (const [sessionUuid, sessionEvents] of eventsBySession.entries()) {
    const session = sessionMap.get(sessionUuid);
    if (!session) {
      duplicatesSkipped += sessionEvents.length;
      continue;
    }

    const childUuid = session.childProfileId
      ? authorizedChildMap.get(Number(session.childProfileId))
      : undefined;
    if (!childUuid) {
      duplicatesSkipped += sessionEvents.length;
      continue;
    }

    const result = await syncSingleSessionEvents(
      ownerRepos,
      session,
      childUuid,
      sessionEvents
    );
    syncedCount += result.synced;
    duplicatesSkipped += result.skipped;
  }

  await ownerRepos.playSessions.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "user",
      actor_id: context.userId,
      action: "pwa.offline_pack.synced",
      entity_type: "offline_pack",
      entity_id: `sync_${Date.now()}`,
      after_data: {
        synced_count: syncedCount,
        duplicates_skipped: duplicatesSkipped,
        total_received: events.length,
        sessions_count: eventsBySession.size,
      },
      ip_address: context.ip,
      user_agent: context.userAgent,
    });
  });

  return {
    synced_count: syncedCount,
    duplicates_skipped: duplicatesSkipped,
  };
}
