import { eq } from "drizzle-orm";
import {
  CONSENT_ACTION,
  CONSENT_TYPE,
  type ConsentAction,
  type ConsentType,
  USER_STATUS,
} from "#src/constants/identity-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import { clampLimit, requireFirst, toDate } from "#src/repositories/utils";
import { consentLogs, consentRequirements } from "#src/schema/index";

export type ConsentLogEntity = typeof consentLogs.$inferSelect;
export type ConsentRequirementEntity = typeof consentRequirements.$inferSelect;

export interface RecordConsentInput {
  readonly userId: number;
  readonly consentType: ConsentType;
  readonly action?: ConsentAction;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly createdAt?: Date;
}

export interface ForceReconsentInput {
  readonly consentType: ConsentType;
  readonly reconsentRequiredAt: Date | string;
  readonly notice?: string | null;
  readonly updatedAt?: Date;
}

export interface ListConsentsFilter {
  readonly userId?: number;
  readonly consentType?: ConsentType;
  readonly action?: ConsentAction;
  readonly limit?: number;
}

export class ConsentsRepository extends BaseRepository {
  async recordConsent(input: RecordConsentInput): Promise<ConsentLogEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(consentLogs)
        .values({
          userId: input.userId,
          consentType: input.consentType,
          action: input.action ?? CONSENT_ACTION.ACCEPTED,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to insert consent log"
    );
  }

  async recordBatchConsents(
    inputs: readonly RecordConsentInput[]
  ): Promise<ConsentLogEntity[]> {
    if (inputs.length === 0) {
      return [];
    }
    const defaultNow = new Date();
    return await this.db
      .insert(consentLogs)
      .values(
        inputs.map((item) => {
          const ts = item.createdAt ?? defaultNow;
          return {
            userId: item.userId,
            consentType: item.consentType,
            action: item.action ?? CONSENT_ACTION.ACCEPTED,
            ipAddress: item.ipAddress,
            userAgent: item.userAgent,
            createdAt: ts,
            updatedAt: ts,
          };
        })
      )
      .returning();
  }

  async listByUser(
    userId: number,
    consentType?: ConsentType
  ): Promise<ConsentLogEntity[]> {
    return await this.db.query.consentLogs.findMany({
      where: {
        userId,
        ...(consentType === undefined ? {} : { consentType }),
      },
      orderBy: { createdAt: "desc", id: "desc" },
    });
  }

  async listFilteredForManager(
    filter: ListConsentsFilter = {}
  ): Promise<ConsentLogEntity[]> {
    const limit = clampLimit(filter.limit, 50, 200);
    return await this.db.query.consentLogs.findMany({
      where: {
        ...(filter.userId === undefined ? {} : { userId: filter.userId }),
        ...(filter.consentType === undefined
          ? {}
          : { consentType: filter.consentType }),
        ...(filter.action === undefined ? {} : { action: filter.action }),
      },
      orderBy: { createdAt: "desc", id: "desc" },
      limit,
    });
  }

  async getLatestByUser(
    userId: number
  ): Promise<Record<ConsentType, ConsentLogEntity | null>> {
    const allLogs = await this.listByUser(userId);
    const latest: Record<ConsentType, ConsentLogEntity | null> = {
      [CONSENT_TYPE.TERMS]: null,
      [CONSENT_TYPE.PRIVACY]: null,
      [CONSENT_TYPE.CHILD_DATA]: null,
    };
    for (const entry of allLogs) {
      if (latest[entry.consentType] === null) {
        latest[entry.consentType] = entry;
      }
    }
    return latest;
  }

  async getRequirements(
    types?: readonly ConsentType[]
  ): Promise<ConsentRequirementEntity[]> {
    if (types && types.length === 0) {
      return [];
    }
    return await this.db.query.consentRequirements.findMany({
      ...(types && types.length > 0
        ? { where: { consentType: { in: [...types] } } }
        : {}),
      orderBy: { consentType: "asc" },
    });
  }

  async forceReconsent(
    input: ForceReconsentInput
  ): Promise<ConsentRequirementEntity> {
    const now = input.updatedAt ?? new Date();
    const requiredAt = toDate(input.reconsentRequiredAt);
    return await requireFirst(
      this.db
        .insert(consentRequirements)
        .values({
          consentType: input.consentType,
          reconsentRequiredAt: requiredAt,
          notice: input.notice ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: consentRequirements.consentType,
          set: {
            reconsentRequiredAt: requiredAt,
            notice: input.notice ?? null,
            updatedAt: now,
          },
        })
        .returning(),
      "Failed to upsert consent requirement"
    );
  }

  async findLatestByUserAndType(
    userId: number,
    consentType: ConsentType
  ): Promise<ConsentLogEntity | null> {
    return (
      (await this.db.query.consentLogs.findFirst({
        where: { userId, consentType },
        orderBy: { createdAt: "desc", id: "desc" },
      })) ?? null
    );
  }

  async countUsersMissingActiveConsent(
    consentType: ConsentType,
    requirementAt?: Date | null
  ): Promise<number> {
    const activeUsers = await this.db.query.users.findMany({
      columns: { id: true },
      where: { status: { ne: USER_STATUS.DELETED } },
      with: {
        consentLogs: {
          columns: { action: true, createdAt: true },
          where: { consentType },
          orderBy: { createdAt: "desc", id: "desc" },
          limit: 1,
        },
      },
    });

    let missingCount = 0;
    const reqMs = requirementAt?.getTime() ?? null;
    for (const user of activeUsers) {
      const latest = user.consentLogs[0];
      if (!latest || latest.action !== CONSENT_ACTION.ACCEPTED) {
        missingCount += 1;
        continue;
      }
      if (reqMs !== null && latest.createdAt.getTime() < reqMs) {
        missingCount += 1;
      }
    }
    return missingCount;
  }

  async forceReconsentChecked(input: {
    readonly consentType: ConsentType;
    readonly expectedRequirementAt: Date | null;
    readonly notice: string;
    readonly now?: Date;
  }): Promise<{
    readonly matched: boolean;
    readonly previousRequirementAt: Date | null;
    readonly previousNotice: string | null;
    readonly requirement: ConsentRequirementEntity;
  }> {
    const now = input.now ?? new Date();
    return await this.transaction(async (tx) => {
      await tx
        .insert(consentRequirements)
        .values({
          consentType: input.consentType,
          reconsentRequiredAt: null,
          notice: null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({ target: consentRequirements.consentType });

      const current = await tx.query.consentRequirements.findFirst({
        where: { consentType: input.consentType },
      });
      if (!current) {
        throw new Error("Consent requirement missing after ensure");
      }

      const currentMs = current.reconsentRequiredAt?.getTime() ?? null;
      const expectedMs = input.expectedRequirementAt?.getTime() ?? null;
      if (currentMs !== expectedMs) {
        return {
          matched: false,
          previousRequirementAt: current.reconsentRequiredAt,
          previousNotice: current.notice,
          requirement: current,
        };
      }

      const nextAt = new Date(Math.max(now.getTime(), (currentMs ?? 0) + 1));
      const updated = await requireFirst(
        tx
          .update(consentRequirements)
          .set({
            reconsentRequiredAt: nextAt,
            notice: input.notice,
            updatedAt: now,
          })
          .where(eq(consentRequirements.consentType, input.consentType))
          .returning(),
        "Failed to update consent requirement"
      );
      return {
        matched: true,
        previousRequirementAt: current.reconsentRequiredAt,
        previousNotice: current.notice,
        requirement: updated,
      };
    });
  }
}
