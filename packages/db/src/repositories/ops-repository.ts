import { desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { ActorType } from "#src/constants/billing-ops-enums";
import type { JsonRecord } from "#src/constants/json";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  andConditions,
  ciContains,
  clampLimit,
  dateRangeConditions,
  requireFirst,
} from "#src/repositories/utils";
import { auditLogs } from "#src/schema/index";

export type AuditActorType = ActorType;
export type AuditLogEntity = typeof auditLogs.$inferSelect;

export interface InsertAuditLogInput {
  readonly uuid?: string;
  readonly actorType: AuditActorType;
  readonly actorId?: number | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly beforeData?: JsonRecord | null;
  readonly afterData?: JsonRecord | null;
  readonly reason?: string | null;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
  readonly createdAt?: Date;
}

export interface ListAuditLogsFilter {
  readonly actorType?: AuditActorType;
  readonly actorId?: number;
  readonly action?: string | readonly string[];
  readonly entityType?: string;
  readonly entityId?: string;
  readonly from?: Date | string;
  readonly to?: Date | string;
  readonly q?: string;
  readonly limit?: number;
}

const MAX_AUDIT_LOGS_LIMIT = 200;
const MAX_AUDIT_EXPORT_LIMIT = 100_000;
const COUNT_SQL = sql<number>`COUNT(*)`;

export class AuditLogsRepository extends BaseRepository {
  async insertLog(input: InsertAuditLogInput): Promise<AuditLogEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(auditLogs)
        .values({
          ...(input.uuid ? { uuid: input.uuid } : {}),
          actorType: input.actorType,
          actorId: input.actorId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          beforeData: input.beforeData ?? null,
          afterData: input.afterData ?? null,
          reason: input.reason ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to insert audit log"
    );
  }

  private buildActionCondition(
    action: string | readonly string[] | undefined
  ): SQL | null {
    if (!action) {
      return null;
    }
    if (Array.isArray(action)) {
      const cleaned = action.map((a) => String(a).trim()).filter(Boolean);
      return cleaned.length > 0 ? inArray(auditLogs.action, cleaned) : null;
    }
    const singleAction = String(action);
    if (singleAction.includes(",")) {
      const parts = singleAction
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      return parts.length > 0 ? inArray(auditLogs.action, parts) : null;
    }
    const trimmed = singleAction.trim();
    return trimmed ? eq(auditLogs.action, trimmed) : null;
  }

  private buildAuditConditions(filter: ListAuditLogsFilter): SQL | undefined {
    return andConditions([
      filter.actorType === undefined
        ? null
        : eq(auditLogs.actorType, filter.actorType),
      filter.actorId === undefined
        ? null
        : eq(auditLogs.actorId, filter.actorId),
      this.buildActionCondition(filter.action),
      filter.entityType ? eq(auditLogs.entityType, filter.entityType) : null,
      filter.entityId ? eq(auditLogs.entityId, filter.entityId) : null,
      ...dateRangeConditions(auditLogs.createdAt, filter.from, filter.to),
      filter.q?.trim() ? ciContains(auditLogs.reason, filter.q) : null,
    ]);
  }

  async listFiltered(
    filter: ListAuditLogsFilter = {}
  ): Promise<AuditLogEntity[]> {
    const limit = clampLimit(filter.limit, 50, MAX_AUDIT_LOGS_LIMIT);
    const whereClause = this.buildAuditConditions(filter);
    return await this.db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit);
  }

  async listForExport(
    filter: ListAuditLogsFilter = {},
    maxLimit: number = MAX_AUDIT_EXPORT_LIMIT
  ): Promise<AuditLogEntity[]> {
    const cappedMax = Math.min(
      Math.max(Math.trunc(maxLimit), 1),
      MAX_AUDIT_EXPORT_LIMIT
    );
    const limit = clampLimit(filter.limit, cappedMax, cappedMax);
    const whereClause = this.buildAuditConditions(filter);
    return await this.db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit);
  }

  async countAll(filter: ListAuditLogsFilter = {}): Promise<number> {
    const whereClause = this.buildAuditConditions(filter);
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(auditLogs)
      .where(whereClause);
    return Number(row?.total ?? 0);
  }
}

export class SystemRepository extends BaseRepository {}
