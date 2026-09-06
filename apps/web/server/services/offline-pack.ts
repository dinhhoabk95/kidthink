import { createHash } from "node:crypto";
import { writeAudit } from "@mindkid/audit";
import {
  childProfiles,
  curricula,
  curriculumItems,
  gameLevels,
  getDb,
  getOwnerDb,
  lessons,
  personalCurricula,
  personalCurriculumItems,
  playSessions,
  telemetryEvents,
} from "@mindkid/db";
import { PersonalCurriculumNotFoundError } from "@mindkid/errors/curriculum";
import {
  OFFLINE_PACK_MAX_LEASE_DAYS,
  type OfflineAssetItem,
  type OfflineCurriculumPackManifest,
  type OfflineSyncEventItem,
  type OfflineSyncResponse,
} from "@mindkid/shared";
import { and, eq, inArray } from "drizzle-orm";

export interface OfflinePackCallerContext {
  userId: number;
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
  const secret = "mindkid_offline_lease_secret_v1";
  return calculateSha256(
    `${userId}:${curriculumCode}:${weekNo}:${expiresAtIso}:${secret}`
  );
}

interface ResolvedCurriculumData {
  curriculumCode: string;
  contentVersion: number;
  rawItems: Array<{ entityType: string; entityId: number }>;
}

async function resolveSystemCurriculum(
  db: ReturnType<typeof getDb>,
  code: string,
  weekNo: number
): Promise<ResolvedCurriculumData | null> {
  const [systemCurriculum] = await db
    .select()
    .from(curricula)
    .where(and(eq(curricula.code, code), eq(curricula.status, "published")));

  if (!systemCurriculum) {
    return null;
  }

  const sysItems = await db
    .select({
      entityType: curriculumItems.entityType,
      entityId: curriculumItems.entityId,
    })
    .from(curriculumItems)
    .where(
      and(
        eq(curriculumItems.curriculumId, systemCurriculum.id),
        eq(curriculumItems.weekNo, weekNo)
      )
    );

  return {
    curriculumCode: systemCurriculum.code,
    contentVersion: systemCurriculum.contentVersion,
    rawItems: sysItems,
  };
}

async function resolvePersonalCurriculum(
  db: ReturnType<typeof getDb>,
  uuid: string,
  userId: number,
  weekNo: number
): Promise<ResolvedCurriculumData | null> {
  if (!UUID_REGEX.test(uuid)) {
    return null;
  }

  const [personalCurr] = await db
    .select()
    .from(personalCurricula)
    .where(
      and(
        eq(personalCurricula.uuid, uuid),
        eq(personalCurricula.userId, userId)
      )
    );

  if (!personalCurr) {
    return null;
  }

  const persItems = await db
    .select({
      entityType: personalCurriculumItems.entityType,
      entityId: personalCurriculumItems.entityId,
    })
    .from(personalCurriculumItems)
    .where(
      and(
        eq(personalCurriculumItems.personalCurriculumId, personalCurr.id),
        eq(personalCurriculumItems.weekNo, weekNo)
      )
    );

  return {
    curriculumCode: `CUR-P${String(personalCurr.id).padStart(3, "0")}`,
    contentVersion: personalCurr.version,
    rawItems: persItems,
  };
}

async function buildOfflineAssets(
  db: ReturnType<typeof getDb>,
  rawItems: Array<{ entityType: string; entityId: number }>,
  curriculumCode: string,
  weekNo: number
): Promise<OfflineAssetItem[]> {
  const assets: OfflineAssetItem[] = [];
  const lessonIds = rawItems
    .filter((i) => i.entityType === "lesson")
    .map((i) => i.entityId);
  const gameLevelIds = rawItems
    .filter((i) => i.entityType === "game_level")
    .map((i) => i.entityId);

  if (gameLevelIds.length > 0) {
    const glRows = await db
      .select()
      .from(gameLevels)
      .where(inArray(gameLevels.id, gameLevelIds));

    for (const gl of glRows) {
      const configContent = JSON.stringify(gl.contentPack || {});
      assets.push({
        path: `/api/guest/game-levels/${gl.code}/config`,
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

  if (lessonIds.length > 0) {
    const lessonRows = await db
      .select()
      .from(lessons)
      .where(inArray(lessons.id, lessonIds));

    for (const les of lessonRows) {
      const lessonContent = JSON.stringify({
        code: les.code,
        title: les.title,
        guide: les.guide,
      });
      assets.push({
        path: `/api/guest/lessons/${les.code}`,
        size_bytes: Buffer.byteLength(lessonContent, "utf-8") || 2048,
        sha256: calculateSha256(lessonContent),
      });
    }
  }

  if (assets.length === 0) {
    assets.push({
      path: `/curricula/${curriculumCode}/week-${weekNo}.json`,
      size_bytes: 1024,
      sha256: calculateSha256(`empty_week_${curriculumCode}_${weekNo}`),
    });
  }

  return assets;
}

export async function generateOfflineCurriculumPackManifest(
  context: OfflinePackCallerContext,
  curriculumIdOrCode: string,
  weekNo: number
): Promise<OfflineCurriculumPackManifest> {
  const db = getDb();

  const resolved =
    (await resolveSystemCurriculum(db, curriculumIdOrCode, weekNo)) ||
    (await resolvePersonalCurriculum(
      db,
      curriculumIdOrCode,
      context.userId,
      weekNo
    ));

  if (!resolved || resolved.rawItems.length === 0) {
    throw new PersonalCurriculumNotFoundError(curriculumIdOrCode);
  }

  const { curriculumCode, contentVersion, rawItems } = resolved;
  const assets = await buildOfflineAssets(db, rawItems, curriculumCode, weekNo);

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

  const ownerDb = getOwnerDb();
  await ownerDb.transaction(async (tx) => {
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

async function isSessionAuthorized(
  db: ReturnType<typeof getOwnerDb>,
  session: typeof playSessions.$inferSelect,
  userId: number
): Promise<boolean> {
  if (!session.childProfileId) {
    return true;
  }
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.id, Number(session.childProfileId)),
        eq(childProfiles.userId, userId)
      )
    )
    .limit(1);
  return Boolean(child);
}

async function syncSingleSessionEvents(
  db: ReturnType<typeof getOwnerDb>,
  session: typeof playSessions.$inferSelect,
  events: OfflineSyncEventItem[]
): Promise<{ synced: number; skipped: number }> {
  let synced = 0;
  let skipped = 0;

  for (const ev of events) {
    try {
      const [inserted] = await db
        .insert(telemetryEvents)
        .values({
          sessionUuid: session.sessionUuid,
          seq: ev.seq,
          childUuid: null,
          gameLevelId: session.gameLevelId,
          contentVersion: session.contentVersion,
          templateCode: session.templateCode,
          eventName: ev.event_name,
          occurredAtMs: ev.occurred_at_ms ?? null,
          payload: ev.payload || {},
          clientTimestamp: ev.client_timestamp
            ? new Date(ev.client_timestamp)
            : new Date(),
        })
        .onConflictDoNothing()
        .returning({ seq: telemetryEvents.seq });

      if (inserted) {
        synced++;
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  }

  return { synced, skipped };
}

export async function syncOfflinePlayEvents(
  context: OfflinePackCallerContext,
  events: OfflineSyncEventItem[]
): Promise<OfflineSyncResponse> {
  const db = getOwnerDb();
  let syncedCount = 0;
  let duplicatesSkipped = 0;

  const eventsBySession = new Map<string, OfflineSyncEventItem[]>();
  for (const ev of events) {
    const list = eventsBySession.get(ev.session_uuid) || [];
    list.push(ev);
    eventsBySession.set(ev.session_uuid, list);
  }

  for (const [sessionUuid, sessionEvents] of eventsBySession.entries()) {
    const [session] = await db
      .select()
      .from(playSessions)
      .where(eq(playSessions.sessionUuid, sessionUuid))
      .limit(1);

    if (!session) {
      duplicatesSkipped += sessionEvents.length;
      continue;
    }

    const authorized = await isSessionAuthorized(db, session, context.userId);
    if (!authorized) {
      duplicatesSkipped += sessionEvents.length;
      continue;
    }

    const result = await syncSingleSessionEvents(db, session, sessionEvents);
    syncedCount += result.synced;
    duplicatesSkipped += result.skipped;
  }

  await db.transaction(async (tx) => {
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
