import { and, desc, eq, inArray, not, type SQL, sql } from "drizzle-orm";
import {
  type AccessTier,
  type ContentEntityType,
  CURRICULUM_PROGRESS_STATUS,
  type CurriculumProgressStatus,
  ENROLLMENT_STATUS,
  type EnrollmentStatus,
  PERSONAL_CURRICULUM_STATUS,
  type PersonalCurriculumStatus,
  type ProgramType,
} from "#src/constants/learning-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  andConditions,
  ciLike,
  ciSearchAny,
  clampLimit,
  dateRangeConditions,
  firstOrNull,
  type PaginatedResult,
  requireFirst,
  runOffsetPagination,
  toIdArray,
  uniq,
} from "#src/repositories/utils";
import {
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  type curriculumWeeks,
  personalCurricula,
  personalCurriculumEnrollments,
  personalCurriculumItemProgress,
  personalCurriculumItems,
} from "#src/schema/index";

export type CurriculumEntity = typeof curricula.$inferSelect;
export type CurriculumWeekEntity = typeof curriculumWeeks.$inferSelect;
export type CurriculumItemEntity = typeof curriculumItems.$inferSelect;
export type CurriculumEnrollmentEntity =
  typeof curriculumEnrollments.$inferSelect;
export type CurriculumItemProgressEntity =
  typeof curriculumItemProgress.$inferSelect;
export type PersonalCurriculumEntity = typeof personalCurricula.$inferSelect;
export type PersonalCurriculumItemEntity =
  typeof personalCurriculumItems.$inferSelect;
export type PersonalCurriculumEnrollmentEntity =
  typeof personalCurriculumEnrollments.$inferSelect;
export type PersonalCurriculumItemProgressEntity =
  typeof personalCurriculumItemProgress.$inferSelect;

export type CurriculumEnrollmentWithCurriculumEntity =
  CurriculumEnrollmentEntity & {
    readonly curriculum: CurriculumEntity;
  };

export type PersonalCurriculumWithItemsEntity = PersonalCurriculumEntity & {
  readonly items: readonly PersonalCurriculumItemEntity[];
};

export type PersonalCurriculumEnrollmentWithCurriculumEntity =
  PersonalCurriculumEnrollmentEntity & {
    readonly personalCurriculum: PersonalCurriculumEntity;
  };

export interface ListCurriculaFilter {
  readonly programType?: ProgramType;
  readonly accessTier?: AccessTier;
}

export interface ListCurriculaPaginatedFilter extends ListCurriculaFilter {
  readonly search?: string;
  readonly isKoguma?: boolean;
  readonly kogumaTrack?: "core_12w" | "year_36w";
  readonly kogumaStage?: 1 | 2;
  readonly kogumaVariant?: "01" | "02" | "year-01" | "year-02";
  readonly page?: number;
  readonly limit?: number;
}

export interface UpsertCurriculumItemProgressInput {
  readonly enrollmentId: number;
  readonly childId: number;
  readonly curriculumItemId: number;
  readonly status?: CurriculumProgressStatus;
  readonly completedAt?: Date | null;
  readonly updatedAt?: Date;
}

export interface PersonalCurriculumItemInput {
  readonly weekNo: number;
  readonly sessionNo: number;
  readonly position: number;
  readonly entityType: ContentEntityType;
  readonly entityId: number;
  readonly isRequired?: boolean;
}

export interface PersonalCurriculumFields {
  readonly title: string;
  readonly ageMin?: number | null;
  readonly ageMax?: number | null;
  readonly durationWeeks?: number;
  readonly sessionsPerWeek?: number;
  readonly status?: PersonalCurriculumStatus;
  readonly items?: readonly PersonalCurriculumItemInput[];
}

export interface CreatePersonalCurriculumInput
  extends PersonalCurriculumFields {
  readonly userId: number;
  readonly createdAt?: Date;
}

export interface UpdatePersonalCurriculumInput
  extends Partial<PersonalCurriculumFields> {
  readonly updatedAt?: Date;
}

const COUNT_SQL = sql<number>`COUNT(*)`;

function mapPersonalCurriculumItemValues(
  personalCurriculumId: number,
  items: readonly PersonalCurriculumItemInput[],
  now: Date
): (typeof personalCurriculumItems.$inferInsert)[] {
  return items.map((item) => ({
    personalCurriculumId,
    weekNo: item.weekNo,
    sessionNo: item.sessionNo,
    position: item.position,
    entityType: item.entityType,
    entityId: item.entityId,
    isRequired: item.isRequired ?? true,
    createdAt: now,
    updatedAt: now,
  }));
}

export class CurriculaRepository extends BaseRepository {
  async findByCode(
    codeOrCodes: string | readonly string[]
  ): Promise<CurriculumEntity | null> {
    if (Array.isArray(codeOrCodes) && codeOrCodes.length === 0) {
      return null;
    }
    const where =
      typeof codeOrCodes === "string"
        ? { code: codeOrCodes }
        : { code: { in: uniq(codeOrCodes) } };
    return (await this.db.query.curricula.findFirst({ where })) ?? null;
  }

  async mapByIds(
    ids: readonly number[]
  ): Promise<Map<number, CurriculumEntity>> {
    const uniqueIds = uniq(ids);
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const rows = await this.db.query.curricula.findMany({
      where: { id: { in: uniqueIds } },
    });
    return new Map(rows.map((row) => [row.id, row]));
  }

  async listPublished(
    filter: ListCurriculaFilter = {}
  ): Promise<CurriculumEntity[]> {
    return await this.db.query.curricula.findMany({
      where: {
        ...(filter.programType === undefined
          ? {}
          : { programType: filter.programType }),
        ...(filter.accessTier === undefined
          ? {}
          : { accessTier: filter.accessTier }),
      },
      orderBy: { targetAgeMin: "asc", code: "asc" },
    });
  }

  private buildManagerConditions(
    filter: ListCurriculaPaginatedFilter
  ): SQL | undefined {
    const isKogumaCode = ciLike(curricula.code, "%koguma%");
    const isKogumaYear = ciLike(curricula.code, "%koguma-year%");
    const isKogumaStage2 = ciLike(curricula.code, "%koguma%-02");
    return andConditions([
      ciSearchAny([curricula.code, curricula.title], filter.search),
      filter.programType === undefined
        ? null
        : eq(curricula.programType, filter.programType),
      filter.accessTier === undefined
        ? null
        : eq(curricula.accessTier, filter.accessTier),
      filter.isKoguma === true ? isKogumaCode : null,
      filter.isKoguma === false ? not(isKogumaCode) : null,
      filter.kogumaTrack === "year_36w" ? isKogumaYear : null,
      filter.kogumaTrack === "core_12w"
        ? and(isKogumaCode, not(isKogumaYear))
        : null,
      filter.kogumaStage === 2 ? isKogumaStage2 : null,
      filter.kogumaStage === 1 ? and(isKogumaCode, not(isKogumaStage2)) : null,
      filter.kogumaVariant === undefined
        ? null
        : ciLike(curricula.code, `%-koguma-${filter.kogumaVariant}`),
    ]);
  }

  async listPaginatedForManager(
    filter: ListCurriculaPaginatedFilter = {}
  ): Promise<PaginatedResult<CurriculumEntity>> {
    const whereClause = this.buildManagerConditions(filter);
    return await runOffsetPagination({
      page: filter.page,
      limit: filter.limit,
      defaultLimit: 50,
      maxLimit: 100,
      countQuery: async () => {
        const [row] = await this.db
          .select({ total: COUNT_SQL })
          .from(curricula)
          .where(whereClause);
        return Number(row?.total ?? 0);
      },
      rowsQuery: async (limit, offset) =>
        await this.db
          .select()
          .from(curricula)
          .where(whereClause)
          .orderBy(desc(curricula.createdAt))
          .limit(limit)
          .offset(offset),
    });
  }

  private rangeWhere(filter?: {
    readonly from?: Date | string;
    readonly to?: Date | string;
  }): SQL | undefined {
    return filter
      ? andConditions(
          dateRangeConditions(curricula.createdAt, filter.from, filter.to)
        )
      : undefined;
  }

  async listForExport(
    filter: { readonly from?: Date | string; readonly to?: Date | string },
    maxLimit = 100_000
  ): Promise<CurriculumEntity[]> {
    return await this.db
      .select()
      .from(curricula)
      .where(this.rangeWhere(filter))
      .orderBy(desc(curricula.createdAt))
      .limit(clampLimit(maxLimit, 100_000, 100_000));
  }

  async countAll(filter?: {
    readonly from?: Date | string;
    readonly to?: Date | string;
  }): Promise<number> {
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(curricula)
      .where(this.rangeWhere(filter));
    return Number(row?.total ?? 0);
  }

  async listWeeks(curriculumId: number): Promise<CurriculumWeekEntity[]> {
    return await this.db.query.curriculumWeeks.findMany({
      where: { curriculumId },
      orderBy: { weekNo: "asc" },
    });
  }

  async listItems(
    curriculumIds: number | readonly number[],
    weekNo?: number
  ): Promise<CurriculumItemEntity[]> {
    const ids = toIdArray(curriculumIds);
    if (ids.length === 0) {
      return [];
    }
    return await this.db.query.curriculumItems.findMany({
      where: {
        curriculumId: { in: ids },
        ...(weekNo === undefined ? {} : { weekNo }),
      },
      orderBy: {
        curriculumId: "asc",
        weekNo: "asc",
        sessionNo: "asc",
        position: "asc",
      },
    });
  }

  async findItemById(
    itemId: number,
    curriculumId: number
  ): Promise<CurriculumItemEntity | null> {
    return (
      (await this.db.query.curriculumItems.findFirst({
        where: { id: itemId, curriculumId },
      })) ?? null
    );
  }

  async countItemsByCurricula(
    curriculumIds: readonly number[]
  ): Promise<Map<number, number>> {
    const uniqueIds = uniq(curriculumIds);
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const rows = await this.db
      .select({
        id: curriculumItems.curriculumId,
        total: COUNT_SQL,
      })
      .from(curriculumItems)
      .where(inArray(curriculumItems.curriculumId, uniqueIds))
      .groupBy(curriculumItems.curriculumId);
    return new Map(rows.map((row) => [row.id, Number(row.total)]));
  }

  async countActiveEnrollmentsByCurricula(
    curriculumIds: readonly number[]
  ): Promise<Map<number, number>> {
    const uniqueIds = uniq(curriculumIds);
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const rows = await this.db
      .select({
        id: curriculumEnrollments.curriculumId,
        total: COUNT_SQL,
      })
      .from(curriculumEnrollments)
      .where(
        and(
          eq(curriculumEnrollments.status, ENROLLMENT_STATUS.ACTIVE),
          inArray(curriculumEnrollments.curriculumId, uniqueIds)
        )
      )
      .groupBy(curriculumEnrollments.curriculumId);
    return new Map(rows.map((row) => [row.id, Number(row.total)]));
  }

  async findEnrollmentForChild(
    childId: number,
    activeOnly = true,
    enrollmentId?: number
  ): Promise<CurriculumEnrollmentWithCurriculumEntity | null> {
    return (
      (await this.db.query.curriculumEnrollments.findFirst({
        where: {
          childId,
          ...(activeOnly ? { status: ENROLLMENT_STATUS.ACTIVE } : {}),
          ...(enrollmentId === undefined ? {} : { id: enrollmentId }),
        },
        with: { curriculum: true },
        orderBy: { enrolledAt: "desc", id: "desc" },
      })) ?? null
    );
  }

  async listEnrollmentsByChild(
    childId: number
  ): Promise<CurriculumEnrollmentEntity[]> {
    return await this.db.query.curriculumEnrollments.findMany({
      where: { childId },
      orderBy: { enrolledAt: "desc" },
    });
  }

  async enrollChild(
    childId: number,
    curriculumId: number,
    enrolledAt?: Date
  ): Promise<CurriculumEnrollmentEntity> {
    const now = enrolledAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(curriculumEnrollments)
        .values({
          childId,
          curriculumId,
          status: ENROLLMENT_STATUS.ACTIVE,
          enrolledAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to enroll child in curriculum"
    );
  }

  async updateEnrollmentStatus(
    enrollmentId: number,
    status: EnrollmentStatus,
    updatedAt?: Date
  ): Promise<CurriculumEnrollmentEntity | null> {
    return await firstOrNull(
      this.db
        .update(curriculumEnrollments)
        .set({ status, updatedAt: updatedAt ?? new Date() })
        .where(eq(curriculumEnrollments.id, enrollmentId))
        .returning()
    );
  }

  async withdrawEnrollment(
    enrollmentId: number,
    updatedAt?: Date
  ): Promise<CurriculumEnrollmentEntity | null> {
    return await this.updateEnrollmentStatus(
      enrollmentId,
      ENROLLMENT_STATUS.WITHDRAWN,
      updatedAt
    );
  }

  async listCompletedProgress(
    enrollmentIds: number | readonly number[]
  ): Promise<
    Array<{ readonly enrollmentId: number; readonly curriculumItemId: number }>
  > {
    const uniqueIds = toIdArray(enrollmentIds);
    if (uniqueIds.length === 0) {
      return [];
    }
    return await this.db.query.curriculumItemProgress.findMany({
      columns: { enrollmentId: true, curriculumItemId: true },
      where: {
        enrollmentId: { in: uniqueIds },
        status: CURRICULUM_PROGRESS_STATUS.COMPLETED,
      },
    });
  }

  async upsertItemProgress(
    input: UpsertCurriculumItemProgressInput
  ): Promise<CurriculumItemProgressEntity> {
    const now = input.updatedAt ?? new Date();
    const status = input.status ?? CURRICULUM_PROGRESS_STATUS.COMPLETED;
    let completedAt: Date | null =
      status === CURRICULUM_PROGRESS_STATUS.COMPLETED ? now : null;
    if (input.completedAt !== undefined) {
      completedAt = input.completedAt;
    }
    return await requireFirst(
      this.db
        .insert(curriculumItemProgress)
        .values({
          enrollmentId: input.enrollmentId,
          childId: input.childId,
          curriculumItemId: input.curriculumItemId,
          status,
          completedAt,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            curriculumItemProgress.enrollmentId,
            curriculumItemProgress.curriculumItemId,
          ],
          set: { status, completedAt, updatedAt: now },
        })
        .returning(),
      "Upsert progress failed"
    );
  }
}

export class PersonalCurriculaRepository extends BaseRepository {
  async countByUser(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(personalCurricula)
      .where(eq(personalCurricula.userId, userId));
    return Number(row?.total ?? 0);
  }

  async listByUserWithItems(
    userId: number
  ): Promise<PersonalCurriculumWithItemsEntity[]> {
    return await this.db.query.personalCurricula.findMany({
      where: { userId },
      with: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByUuidForUser(
    uuid: string,
    userId: number
  ): Promise<PersonalCurriculumEntity | null> {
    return (
      (await this.db.query.personalCurricula.findFirst({
        where: { uuid, userId },
      })) ?? null
    );
  }

  async createWithItems(
    input: CreatePersonalCurriculumInput
  ): Promise<PersonalCurriculumEntity> {
    const now = input.createdAt ?? new Date();
    return await this.transaction(async (tx) => {
      const created = await requireFirst(
        tx
          .insert(personalCurricula)
          .values({
            userId: input.userId,
            title: input.title,
            ageMin: input.ageMin ?? null,
            ageMax: input.ageMax ?? null,
            durationWeeks: input.durationWeeks ?? 8,
            sessionsPerWeek: input.sessionsPerWeek ?? 3,
            status: input.status ?? PERSONAL_CURRICULUM_STATUS.DRAFT,
            version: 1,
            createdAt: now,
            updatedAt: now,
          })
          .returning(),
        "Failed to create personal curriculum"
      );
      if (input.items && input.items.length > 0) {
        await tx
          .insert(personalCurriculumItems)
          .values(
            mapPersonalCurriculumItemValues(created.id, input.items, now)
          );
      }
      return created;
    });
  }

  async updateVersioned(
    id: number,
    userId: number,
    expectedVersion: number,
    input: UpdatePersonalCurriculumInput
  ): Promise<PersonalCurriculumEntity | null> {
    const now = input.updatedAt ?? new Date();
    return await this.transaction(async (tx) => {
      const updated = await firstOrNull(
        tx
          .update(personalCurricula)
          .set({
            ...(input.title === undefined ? {} : { title: input.title }),
            ...(input.ageMin === undefined ? {} : { ageMin: input.ageMin }),
            ...(input.ageMax === undefined ? {} : { ageMax: input.ageMax }),
            ...(input.durationWeeks === undefined
              ? {}
              : { durationWeeks: input.durationWeeks }),
            ...(input.sessionsPerWeek === undefined
              ? {}
              : { sessionsPerWeek: input.sessionsPerWeek }),
            ...(input.status === undefined ? {} : { status: input.status }),
            version: expectedVersion + 1,
            updatedAt: now,
          })
          .where(
            and(
              eq(personalCurricula.id, id),
              eq(personalCurricula.userId, userId),
              eq(personalCurricula.version, expectedVersion)
            )
          )
          .returning()
      );
      if (!updated) {
        return null;
      }
      if (input.items !== undefined) {
        await tx
          .delete(personalCurriculumItems)
          .where(eq(personalCurriculumItems.personalCurriculumId, id));
        if (input.items.length > 0) {
          await tx
            .insert(personalCurriculumItems)
            .values(mapPersonalCurriculumItemValues(id, input.items, now));
        }
      }
      return updated;
    });
  }

  async deleteForUser(id: number, userId: number): Promise<boolean> {
    const rows = await this.db
      .delete(personalCurricula)
      .where(
        and(eq(personalCurricula.id, id), eq(personalCurricula.userId, userId))
      )
      .returning({ id: personalCurricula.id });
    return rows.length > 0;
  }

  async listItems(
    personalCurriculumId: number,
    weekNo?: number
  ): Promise<PersonalCurriculumItemEntity[]> {
    return await this.db.query.personalCurriculumItems.findMany({
      where: {
        personalCurriculumId,
        ...(weekNo === undefined ? {} : { weekNo }),
      },
      orderBy: { weekNo: "asc", sessionNo: "asc", position: "asc" },
    });
  }

  async findItemById(
    itemId: number,
    personalCurriculumId: number
  ): Promise<PersonalCurriculumItemEntity | null> {
    return (
      (await this.db.query.personalCurriculumItems.findFirst({
        where: { id: itemId, personalCurriculumId },
      })) ?? null
    );
  }

  async findActiveEnrollmentForChild(
    childId: number
  ): Promise<PersonalCurriculumEnrollmentWithCurriculumEntity | null> {
    return (
      (await this.db.query.personalCurriculumEnrollments.findFirst({
        where: { childId, status: ENROLLMENT_STATUS.ACTIVE },
        with: { personalCurriculum: true },
      })) ?? null
    );
  }

  async enrollChild(
    childId: number,
    personalCurriculumId: number,
    enrolledAt?: Date
  ): Promise<PersonalCurriculumEnrollmentEntity> {
    const now = enrolledAt ?? new Date();
    return await this.transaction(async (tx) => {
      await tx
        .update(personalCurriculumEnrollments)
        .set({ status: ENROLLMENT_STATUS.WITHDRAWN, updatedAt: now })
        .where(
          and(
            eq(personalCurriculumEnrollments.childId, childId),
            eq(personalCurriculumEnrollments.status, ENROLLMENT_STATUS.ACTIVE)
          )
        );
      return await requireFirst(
        tx
          .insert(personalCurriculumEnrollments)
          .values({
            childId,
            personalCurriculumId,
            status: ENROLLMENT_STATUS.ACTIVE,
            enrolledAt: now,
            createdAt: now,
            updatedAt: now,
          })
          .returning(),
        "Failed to enroll child in personal curriculum"
      );
    });
  }

  async listCompletedItemIds(enrollmentId: number): Promise<number[]> {
    const rows = await this.db.query.personalCurriculumItemProgress.findMany({
      columns: { personalCurriculumItemId: true },
      where: {
        enrollmentId,
        status: CURRICULUM_PROGRESS_STATUS.COMPLETED,
      },
    });
    return rows.map((row) => row.personalCurriculumItemId);
  }

  async upsertItemProgress(input: {
    readonly enrollmentId: number;
    readonly childId: number;
    readonly personalCurriculumItemId: number;
    readonly completedAt?: Date;
  }): Promise<PersonalCurriculumItemProgressEntity> {
    const now = input.completedAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(personalCurriculumItemProgress)
        .values({
          enrollmentId: input.enrollmentId,
          childId: input.childId,
          personalCurriculumItemId: input.personalCurriculumItemId,
          status: CURRICULUM_PROGRESS_STATUS.COMPLETED,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            personalCurriculumItemProgress.enrollmentId,
            personalCurriculumItemProgress.personalCurriculumItemId,
          ],
          set: {
            status: CURRICULUM_PROGRESS_STATUS.COMPLETED,
            completedAt: now,
            updatedAt: now,
          },
        })
        .returning(),
      "Upsert progress failed"
    );
  }
}
