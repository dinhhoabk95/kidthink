import {
  and,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { CHILD_STATUS } from "#src/constants/identity-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  andConditions,
  clampLimit,
  firstOrNull,
  requireFirst,
  toDate,
  uniq,
} from "#src/repositories/utils";
import {
  childMascotGear,
  childProfiles,
  childStickerPlacements,
  childStickers,
} from "#src/schema/index";

export type ChildRelationship = typeof childProfiles.$inferSelect.relationship;
export type ChildStatus = typeof childProfiles.$inferSelect.status;
export type ChildProfileEntity = typeof childProfiles.$inferSelect;
export type ChildStickerEntity = typeof childStickers.$inferSelect;
export type ChildStickerPlacementEntity =
  typeof childStickerPlacements.$inferSelect;
export type ChildMascotGearEntity = typeof childMascotGear.$inferSelect;

export interface CreateChildProfileInput {
  readonly uuid?: string;
  readonly userId: number;
  readonly displayName: string;
  readonly birthYear: number;
  readonly avatarId: string;
  readonly relationship?: ChildRelationship;
  readonly currentCurriculumId?: number | null;
  readonly dailyPlayCapMinutes?: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface UpdateChildProfileInput {
  readonly displayName?: string;
  readonly birthYear?: number;
  readonly avatarId?: string;
  readonly relationship?: ChildRelationship;
  readonly currentCurriculumId?: number | null;
  readonly dailyPlayCapMinutes?: number;
  readonly updatedAt?: Date;
}

export interface AwardStickerInput {
  readonly childProfileId: number;
  readonly playSessionId: number | null;
  readonly themeCode: string;
  readonly emoji: string;
  readonly label: string;
  readonly awardedAt?: Date;
}

export interface StickerPlacementInput {
  readonly emoji: string;
  readonly instanceIndex: number;
  readonly normX: number;
  readonly normY: number;
  readonly scale: number;
}

export class ChildProfilesRepository extends BaseRepository {
  async findById(id: number): Promise<ChildProfileEntity | null> {
    return (
      (await this.db.query.childProfiles.findFirst({
        where: { id },
      })) ?? null
    );
  }

  async findByUuid(uuid: string): Promise<ChildProfileEntity | null> {
    return (
      (await this.db.query.childProfiles.findFirst({
        where: { uuid },
      })) ?? null
    );
  }

  async findByUuidForUser(
    uuid: string,
    userId: number
  ): Promise<ChildProfileEntity | null> {
    return (
      (await this.db.query.childProfiles.findFirst({
        where: { uuid, userId },
      })) ?? null
    );
  }

  async listActiveByUser(userId: number): Promise<ChildProfileEntity[]> {
    return await this.db.query.childProfiles.findMany({
      where: { userId, status: CHILD_STATUS.ACTIVE },
      orderBy: { id: "asc" },
    });
  }

  async listAllByUser(userId: number): Promise<ChildProfileEntity[]> {
    return await this.db.query.childProfiles.findMany({
      where: { userId },
      orderBy: { id: "asc" },
    });
  }

  async countActiveByUser(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.userId, userId),
          eq(childProfiles.status, CHILD_STATUS.ACTIVE)
        )
      );
    return Number(row?.total ?? 0);
  }

  async countNonArchivedByUser(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.userId, userId),
          ne(childProfiles.status, CHILD_STATUS.ARCHIVED)
        )
      );
    return Number(row?.total ?? 0);
  }

  async countByUsers(
    userIds: readonly number[]
  ): Promise<Record<number, number>> {
    const uniqueIds = uniq(userIds);
    const counts: Record<number, number> = {};
    for (const uid of uniqueIds) {
      counts[uid] = 0;
    }
    if (uniqueIds.length === 0) {
      return counts;
    }

    const rows = await this.db
      .select({
        userId: childProfiles.userId,
        total: sql<number>`COUNT(*)`,
      })
      .from(childProfiles)
      .where(
        and(
          inArray(childProfiles.userId, uniqueIds),
          ne(childProfiles.status, CHILD_STATUS.PENDING_DELETION)
        )
      )
      .groupBy(childProfiles.userId);

    for (const row of rows) {
      counts[row.userId] = Number(row.total);
    }
    return counts;
  }

  async countAllByUsers(
    userIds: readonly number[]
  ): Promise<Map<number, number>> {
    const uniqueIds = uniq(userIds);
    const counts = new Map<number, number>();
    if (uniqueIds.length === 0) {
      return counts;
    }

    const rows = await this.db
      .select({
        userId: childProfiles.userId,
        total: sql<number>`COUNT(*)`,
      })
      .from(childProfiles)
      .where(inArray(childProfiles.userId, uniqueIds))
      .groupBy(childProfiles.userId);

    for (const row of rows) {
      counts.set(row.userId, Number(row.total));
    }
    return counts;
  }

  async create(input: CreateChildProfileInput): Promise<ChildProfileEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(childProfiles)
        .values({
          ...(input.uuid ? { uuid: input.uuid } : {}),
          userId: input.userId,
          displayName: input.displayName,
          birthYear: input.birthYear,
          avatarId: input.avatarId,
          relationship: input.relationship ?? null,
          currentCurriculumId: input.currentCurriculumId ?? null,
          dailyPlayCapMinutes: input.dailyPlayCapMinutes ?? 60,
          status: CHILD_STATUS.ACTIVE,
          createdAt: now,
          updatedAt: input.updatedAt ?? now,
        })
        .returning(),
      "Failed to insert child profile"
    );
  }

  async update(
    childId: number,
    userId: number,
    input: UpdateChildProfileInput
  ): Promise<ChildProfileEntity | null> {
    return await firstOrNull(
      this.db
        .update(childProfiles)
        .set({
          ...(input.displayName === undefined
            ? {}
            : { displayName: input.displayName }),
          ...(input.birthYear === undefined
            ? {}
            : { birthYear: input.birthYear }),
          ...(input.avatarId === undefined ? {} : { avatarId: input.avatarId }),
          ...(input.relationship === undefined
            ? {}
            : { relationship: input.relationship }),
          ...(input.currentCurriculumId === undefined
            ? {}
            : { currentCurriculumId: input.currentCurriculumId }),
          ...(input.dailyPlayCapMinutes === undefined
            ? {}
            : { dailyPlayCapMinutes: input.dailyPlayCapMinutes }),
          updatedAt: input.updatedAt ?? new Date(),
        })
        .where(
          and(eq(childProfiles.id, childId), eq(childProfiles.userId, userId))
        )
        .returning()
    );
  }

  async archive(
    childId: number,
    userId: number,
    updatedAt: Date = new Date(),
    purgeAt: Date | null = null
  ): Promise<ChildProfileEntity | null> {
    const targetPurgeAt = purgeAt ?? null;
    const statusGuard =
      targetPurgeAt === null
        ? and(
            ne(childProfiles.status, CHILD_STATUS.PENDING_DELETION),
            or(
              eq(childProfiles.status, CHILD_STATUS.ACTIVE),
              isNull(childProfiles.purgeAt)
            )
          )
        : ne(childProfiles.status, CHILD_STATUS.PENDING_DELETION);

    return await firstOrNull(
      this.db
        .update(childProfiles)
        .set({
          status: CHILD_STATUS.ARCHIVED,
          purgeAt: targetPurgeAt,
          updatedAt,
        })
        .where(
          and(
            eq(childProfiles.id, childId),
            eq(childProfiles.userId, userId),
            statusGuard
          )
        )
        .returning()
    );
  }

  async restore(
    childId: number,
    userId: number,
    now: Date = new Date()
  ): Promise<ChildProfileEntity | null> {
    return await firstOrNull(
      this.db
        .update(childProfiles)
        .set({
          status: CHILD_STATUS.ACTIVE,
          purgeAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(childProfiles.id, childId),
            eq(childProfiles.userId, userId),
            eq(childProfiles.status, CHILD_STATUS.ARCHIVED),
            or(isNull(childProfiles.purgeAt), gt(childProfiles.purgeAt, now))
          )
        )
        .returning()
    );
  }

  async tombstoneAllUnscheduledChildren(
    userId: number,
    purgeAt: Date,
    now: Date = new Date()
  ): Promise<number> {
    const rows = await this.db
      .update(childProfiles)
      .set({
        status: CHILD_STATUS.ARCHIVED,
        purgeAt,
        updatedAt: now,
      })
      .where(
        and(
          eq(childProfiles.userId, userId),
          or(
            eq(childProfiles.status, CHILD_STATUS.ACTIVE),
            and(
              eq(childProfiles.status, CHILD_STATUS.ARCHIVED),
              isNull(childProfiles.purgeAt)
            )
          )
        )
      )
      .returning({ id: childProfiles.id });
    return rows.length;
  }

  async markForPurge(
    childId: number,
    userId: number,
    purgeAt: Date | string,
    updatedAt?: Date
  ): Promise<ChildProfileEntity | null> {
    return await firstOrNull(
      this.db
        .update(childProfiles)
        .set({
          status: CHILD_STATUS.PENDING_DELETION,
          purgeAt: toDate(purgeAt),
          updatedAt: updatedAt ?? new Date(),
        })
        .where(
          and(eq(childProfiles.id, childId), eq(childProfiles.userId, userId))
        )
        .returning()
    );
  }

  private async cancelPurgeWithStatus(
    childId: number,
    userId: number,
    nextStatus: ChildStatus,
    now: Date = new Date()
  ): Promise<ChildProfileEntity | null> {
    return await firstOrNull(
      this.db
        .update(childProfiles)
        .set({
          status: nextStatus,
          purgeAt: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(childProfiles.id, childId),
            eq(childProfiles.userId, userId),
            eq(childProfiles.status, CHILD_STATUS.PENDING_DELETION),
            isNotNull(childProfiles.purgeAt),
            gt(childProfiles.purgeAt, now)
          )
        )
        .returning()
    );
  }

  async cancelPurge(
    childId: number,
    userId: number,
    now: Date = new Date()
  ): Promise<ChildProfileEntity | null> {
    return await this.cancelPurgeWithStatus(
      childId,
      userId,
      CHILD_STATUS.ACTIVE,
      now
    );
  }

  async cancelPurgeToArchived(
    childId: number,
    userId: number,
    now: Date = new Date()
  ): Promise<ChildProfileEntity | null> {
    return await this.cancelPurgeWithStatus(
      childId,
      userId,
      CHILD_STATUS.ARCHIVED,
      now
    );
  }

  async listDueForPurge(
    now: Date = new Date(),
    limit = 200
  ): Promise<ChildProfileEntity[]> {
    const capped = clampLimit(limit, 200, 500);
    return await this.db.query.childProfiles.findMany({
      where: {
        status: { in: [CHILD_STATUS.PENDING_DELETION, CHILD_STATUS.ARCHIVED] },
        purgeAt: { lte: now },
      },
      limit: capped,
    });
  }
}

export class ChildStickersRepository extends BaseRepository {
  async listByChild(
    childProfileId: number,
    themeCode?: string
  ): Promise<ChildStickerEntity[]> {
    return await this.db.query.childStickers.findMany({
      where: {
        childProfileId,
        ...(themeCode === undefined ? {} : { themeCode }),
      },
      orderBy: { awardedAt: "asc", id: "asc" },
    });
  }

  async listOwnedEmojis(
    childProfileId: number,
    themeCode: string
  ): Promise<string[]> {
    const rows = await this.db.query.childStickers.findMany({
      columns: { emoji: true },
      where: { childProfileId, themeCode },
    });
    return rows.map((row) => row.emoji);
  }

  async findByPlaySession(
    childProfileId: number,
    playSessionId: number
  ): Promise<ChildStickerEntity | null> {
    return (
      (await this.db.query.childStickers.findFirst({
        where: { childProfileId, playSessionId },
      })) ?? null
    );
  }

  async awardIfAbsent(input: AwardStickerInput): Promise<ChildStickerEntity> {
    const now = input.awardedAt ?? new Date();
    const created = await firstOrNull(
      this.db
        .insert(childStickers)
        .values({
          childProfileId: input.childProfileId,
          playSessionId: input.playSessionId,
          themeCode: input.themeCode,
          emoji: input.emoji,
          label: input.label,
          awardedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .returning()
    );
    if (created) {
      return created;
    }
    if (input.playSessionId !== null) {
      const existing = await this.findByPlaySession(
        input.childProfileId,
        input.playSessionId
      );
      if (existing) {
        return existing;
      }
    }
    throw new Error("Failed to award or retrieve child sticker");
  }
}

export class KidWorldRepository extends BaseRepository {
  async listPlacements(
    childProfileId: number,
    themeCode?: string
  ): Promise<ChildStickerPlacementEntity[]> {
    return await this.db.query.childStickerPlacements.findMany({
      where: {
        childProfileId,
        ...(themeCode === undefined ? {} : { themeCode }),
      },
      orderBy: { themeCode: "asc", instanceIndex: "asc", id: "asc" },
    });
  }

  async replaceThemePlacements(
    childProfileId: number,
    themeCode: string,
    placements: readonly StickerPlacementInput[],
    now: Date = new Date()
  ): Promise<ChildStickerPlacementEntity[]> {
    return await this.transaction(async (tx) => {
      await tx
        .delete(childStickerPlacements)
        .where(
          andConditions([
            eq(childStickerPlacements.childProfileId, childProfileId),
            eq(childStickerPlacements.themeCode, themeCode),
          ])
        );
      if (placements.length === 0) {
        return [];
      }
      return await tx
        .insert(childStickerPlacements)
        .values(
          placements.map((item) => ({
            childProfileId,
            themeCode,
            emoji: item.emoji,
            instanceIndex: item.instanceIndex,
            normX: item.normX,
            normY: item.normY,
            scale: item.scale,
            createdAt: now,
            updatedAt: now,
          }))
        )
        .returning();
    });
  }

  async getEquippedGear(
    childProfileId: number
  ): Promise<ChildMascotGearEntity | null> {
    return (
      (await this.db.query.childMascotGear.findFirst({
        where: { childProfileId },
      })) ?? null
    );
  }

  async upsertEquippedGear(
    childProfileId: number,
    equippedGearCode: string | null,
    now: Date = new Date()
  ): Promise<ChildMascotGearEntity> {
    return await requireFirst(
      this.db
        .insert(childMascotGear)
        .values({
          childProfileId,
          equippedGearCode,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: childMascotGear.childProfileId,
          set: {
            equippedGearCode,
            updatedAt: now,
          },
        })
        .returning(),
      "Failed to upsert child mascot gear"
    );
  }
}
