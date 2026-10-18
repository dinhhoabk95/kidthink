import { writeAudit } from "@mindkid/audit";
import { checkRateLimit } from "@mindkid/cache";
import {
  auditLogs,
  curricula,
  curriculumEnrollments,
  curriculumItems,
  gameLevels,
  getOwnerDb,
  paymentOrders,
  skills,
  users,
} from "@mindkid/db";
import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import {
  NotFoundError,
  RateLimitedError,
  ValidationError,
} from "@mindkid/errors/common";
import { getPrivateSignedUrl, uploadPrivateAsset } from "@mindkid/storage";
import { and, desc, eq, gte, lte, type SQL, sql } from "drizzle-orm";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const CLOSED_EXPORT_KINDS = [
  "revenue",
  "subscriptions",
  "content_kpi",
  "skill_coverage",
  "curriculum_health",
  "audit",
] as const;

export const MAX_EXPORT_ROWS = 100_000; // BR-EXP-05
const MAX_EXPORT_RANGE_DAYS = 366;
const EXPORT_RATE_LIMIT = 5; // BR-EXP-07: 5 exports/day per manager
const EXPORT_RATE_WINDOW_SECONDS = 86_400;
const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface ExportFilterOptions {
  from?: Date;
  to?: Date;
  maxRows?: number;
}

type TimestampColumn =
  | typeof paymentOrders.createdAt
  | typeof users.createdAt
  | typeof gameLevels.updatedAt
  | typeof skills.createdAt
  | typeof curricula.createdAt
  | typeof auditLogs.createdAt;

export async function checkExportRateLimit(managerId: number): Promise<void> {
  const result = await checkRateLimit(
    `rl:acc:data-export:manager:${managerId}`,
    EXPORT_RATE_LIMIT,
    EXPORT_RATE_WINDOW_SECONDS
  );
  if (!result.allowed) {
    throw new RateLimitedError(
      "Giới hạn xuất dữ liệu tối đa 5 lần/ngày mỗi Manager (BR-EXP-07)",
      { retry_after_s: result.resetSeconds }
    );
  }
}

function parseSingleIsoDate(
  raw: string,
  field: "from" | "to",
  endOfDayForDateOnly = false
): Date | undefined {
  if (!raw) {
    return undefined;
  }
  const isoString =
    endOfDayForDateOnly && ISO_DATE_ONLY_REGEX.test(raw)
      ? `${raw}T23:59:59.999Z`
      : raw;
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    throw ValidationError.field(
      field,
      `Trường (${field}) không đúng định dạng ISO 8601`
    );
  }
  return parsed;
}

export function parseExportDateRange(
  rawFromValue: string | undefined,
  rawToValue: string | undefined
): {
  from?: Date;
  to?: Date;
  rawFrom?: string;
  rawTo?: string;
} {
  const rawFrom = rawFromValue ? rawFromValue.trim() : "";
  const rawTo = rawToValue ? rawToValue.trim() : "";

  const fromDate = parseSingleIsoDate(rawFrom, "from", false);
  const toDate = parseSingleIsoDate(rawTo, "to", true);

  if (fromDate && toDate) {
    if (fromDate.getTime() > toDate.getTime()) {
      throw ValidationError.field(
        "from",
        "Ngày bắt đầu (from) phải nhỏ hơn hoặc bằng ngày kết thúc (to)"
      );
    }
    const maxSpanMs = MAX_EXPORT_RANGE_DAYS * 86_400_000;
    if (toDate.getTime() - fromDate.getTime() > maxSpanMs) {
      throw ValidationError.field(
        "to",
        `Khoảng thời gian xuất tối đa không vượt quá ${MAX_EXPORT_RANGE_DAYS} ngày`
      );
    }
  }

  return {
    from: fromDate,
    to: toDate,
    rawFrom: rawFrom || undefined,
    rawTo: rawTo || undefined,
  };
}

function buildDateRangeCondition(
  column: TimestampColumn,
  options: ExportFilterOptions
): SQL | undefined {
  const conditions: SQL[] = [];
  if (options.from) {
    conditions.push(gte(column, options.from));
  }
  if (options.to) {
    conditions.push(lte(column, options.to));
  }
  if (conditions.length === 0) {
    return undefined;
  }
  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

export function assertRowCountWithinLimit(
  totalCount: number,
  maxRows = MAX_EXPORT_ROWS
): void {
  if (totalCount > maxRows) {
    throw ValidationError.field(
      "row_count",
      `Số lượng dòng xuất (${totalCount}) vượt quá giới hạn ${maxRows} dòng. Vui lòng thu hẹp khoảng thời gian (BR-EXP-05)`
    );
  }
}

function redactEmail(email: string): string {
  const parts = email.split("@");
  const name = parts[0];
  const domain = parts[1];
  if (!(name && domain) || parts.length !== 2) {
    return "***";
  }
  const redactedName =
    name.length <= 2
      ? `${name[0]}*`
      : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${redactedName}@${domain}`;
}

async function exportRevenueCsv(
  db: ReturnType<typeof getOwnerDb>,
  options: ExportFilterOptions
) {
  const whereCondition = buildDateRangeCondition(
    paymentOrders.createdAt,
    options
  );
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(paymentOrders)
    .where(whereCondition);
  assertRowCountWithinLimit(
    countRow?.count ?? 0,
    options.maxRows ?? MAX_EXPORT_ROWS
  );

  const rows = await db
    .select({
      orderId: paymentOrders.id,
      orderCode: paymentOrders.transferNote,
      packageCode: paymentOrders.packageCode,
      amountVnd: paymentOrders.amountVnd,
      status: paymentOrders.status,
      userEmail: users.email,
      createdAt: paymentOrders.createdAt,
    })
    .from(paymentOrders)
    .leftJoin(users, eq(paymentOrders.userId, users.id))
    .where(whereCondition)
    .orderBy(desc(paymentOrders.createdAt));

  let csvContent =
    "\uFEFFMã đơn,Gói,Số tiền (VNĐ),Trạng thái,Email Người dùng,Thời gian tạo\n";
  for (const r of rows) {
    csvContent += `"${r.orderCode || ""}","${r.packageCode}",${r.amountVnd},"${r.status}","${r.userEmail || ""}","${r.createdAt.toISOString()}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportSubscriptionsCsv(
  db: ReturnType<typeof getOwnerDb>,
  options: ExportFilterOptions
) {
  const whereCondition = buildDateRangeCondition(users.createdAt, options);
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(whereCondition);
  assertRowCountWithinLimit(
    countRow?.count ?? 0,
    options.maxRows ?? MAX_EXPORT_ROWS
  );

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(whereCondition)
    .orderBy(desc(users.createdAt));

  let csvContent = "\uFEFFUser ID,Email (Rút gọn),Ngày đăng ký\n";
  for (const r of rows) {
    const redacted = r.email ? redactEmail(r.email) : "";
    csvContent += `${r.userId},"${redacted}","${r.createdAt.toISOString()}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportContentKpiCsv(
  db: ReturnType<typeof getOwnerDb>,
  options: ExportFilterOptions
) {
  const whereCondition = buildDateRangeCondition(gameLevels.updatedAt, options);
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameLevels)
    .where(whereCondition);
  assertRowCountWithinLimit(
    countRow?.count ?? 0,
    options.maxRows ?? MAX_EXPORT_ROWS
  );

  const rows = await db
    .select({
      code: gameLevels.code,
      version: gameLevels.contentVersion,
      title: gameLevels.title,
      accessTier: gameLevels.accessTier,
      status: gameLevels.status,
    })
    .from(gameLevels)
    .where(whereCondition)
    .orderBy(desc(gameLevels.updatedAt));

  let csvContent =
    "\uFEFFMã màn chơi,Phiên bản,Tiêu đề,Gói truy cập,Trạng thái\n";
  for (const r of rows) {
    csvContent += `"${r.code}",${r.version},"${r.title}","${r.accessTier}","${r.status}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportSkillCoverageCsv(
  db: ReturnType<typeof getOwnerDb>,
  options: ExportFilterOptions
) {
  const whereCondition = buildDateRangeCondition(skills.createdAt, options);
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(skills)
    .where(whereCondition);
  assertRowCountWithinLimit(
    countRow?.count ?? 0,
    options.maxRows ?? MAX_EXPORT_ROWS
  );

  const rows = await db
    .select({
      code: skills.code,
      name: skills.name,
      difficulty: skills.difficulty,
      tier: skills.tier,
    })
    .from(skills)
    .where(whereCondition)
    .orderBy(skills.code);

  let csvContent = "\uFEFFMã kỹ năng,Tên kỹ năng,Độ khó,Bậc\n";
  for (const r of rows) {
    csvContent += `"${r.code}","${r.name}",${r.difficulty},"${r.tier}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportAuditCsv(
  db: ReturnType<typeof getOwnerDb>,
  options: ExportFilterOptions
) {
  const whereCondition = buildDateRangeCondition(auditLogs.createdAt, options);
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(whereCondition);
  assertRowCountWithinLimit(
    countRow?.count ?? 0,
    options.maxRows ?? MAX_EXPORT_ROWS
  );

  const rows = await db
    .select()
    .from(auditLogs)
    .where(whereCondition)
    .orderBy(desc(auditLogs.createdAt));

  let csvContent =
    "\uFEFFUUID,Actor Type,Actor ID,Action,Entity Type,Entity ID,Reason,Created At\n";
  for (const r of rows) {
    csvContent += `"${r.uuid}","${r.actorType}",${r.actorId || ""},"${r.action}","${r.entityType}","${r.entityId}","${r.reason || ""}","${r.createdAt.toISOString()}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportCurriculumHealthCsv(
  db: ReturnType<typeof getOwnerDb>,
  options: ExportFilterOptions
) {
  const whereCondition = buildDateRangeCondition(curricula.createdAt, options);
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(curricula)
    .where(whereCondition);
  assertRowCountWithinLimit(
    countRow?.count ?? 0,
    options.maxRows ?? MAX_EXPORT_ROWS
  );

  const rows = await db
    .select({
      id: curricula.id,
      code: curricula.code,
      version: curricula.contentVersion,
      title: curricula.title,
      programType: curricula.programType,
      status: curricula.status,
      durationWeeks: curricula.durationWeeks,
      sessionsPerWeek: curricula.sessionsPerWeek,
      createdAt: curricula.createdAt,
    })
    .from(curricula)
    .where(whereCondition)
    .orderBy(desc(curricula.createdAt));

  let csvContent =
    "\uFEFFMã chương trình,Phiên bản,Tiêu đề,Loại hình,Trạng thái,Số tuần,Số buổi/tuần,Số hoạt động,Số học sinh đang học,Thời gian tạo\n";

  if (rows.length === 0) {
    return { csvContent, rowCount: 0 };
  }

  const itemCounts = await db
    .select({
      curriculumId: curriculumItems.curriculumId,
      count: sql<number>`count(*)::int`,
    })
    .from(curriculumItems)
    .groupBy(curriculumItems.curriculumId);

  const itemCountMap = new Map<number, number>(
    itemCounts.map((ic) => [ic.curriculumId, ic.count])
  );

  const enrollmentCounts = await db
    .select({
      curriculumId: curriculumEnrollments.curriculumId,
      count: sql<number>`count(*)::int`,
    })
    .from(curriculumEnrollments)
    .where(eq(curriculumEnrollments.status, "active"))
    .groupBy(curriculumEnrollments.curriculumId);

  const enrollmentCountMap = new Map<number, number>(
    enrollmentCounts.map((ec) => [ec.curriculumId, ec.count])
  );

  for (const r of rows) {
    const itemsCount = itemCountMap.get(r.id) ?? 0;
    const activeEnrollments = enrollmentCountMap.get(r.id) ?? 0;

    csvContent += `"${r.code}",${r.version},"${r.title}","${r.programType}","${r.status}",${r.durationWeeks},${r.sessionsPerWeek},${itemsCount},${activeEnrollments},"${r.createdAt.toISOString()}"\n`;
  }

  return { csvContent, rowCount: rows.length };
}

export async function generateCsvData(
  kind: string,
  db: ReturnType<typeof getOwnerDb>,
  options: ExportFilterOptions = {}
): Promise<{ csvContent: string; rowCount: number }> {
  switch (kind) {
    case "revenue":
      return await exportRevenueCsv(db, options);
    case "subscriptions":
      return await exportSubscriptionsCsv(db, options);
    case "content_kpi":
      return await exportContentKpiCsv(db, options);
    case "skill_coverage":
      return await exportSkillCoverageCsv(db, options);
    case "curriculum_health":
      return await exportCurriculumHealthCsv(db, options);
    case "audit":
      return await exportAuditCsv(db, options);
    default:
      return {
        csvContent: "\uFEFFTuần,Mã bài học,Số hoạt động,Trạng thái\n",
        rowCount: 0,
      };
  }
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-EXP-06: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền trích xuất dữ liệu (BR-EXP-06)"
    );
  }

  const kind = getRouterParam(event, "kind");
  if (
    !(
      kind &&
      CLOSED_EXPORT_KINDS.includes(kind as (typeof CLOSED_EXPORT_KINDS)[number])
    )
  ) {
    throw new NotFoundError(
      `Loại xuất dữ liệu '${kind}' không thuộc danh sách đóng cho phép (BR-EXP-01)`
    );
  }

  const query = getQuery(event);
  const reason = typeof query.reason === "string" ? query.reason.trim() : "";
  if (!reason || reason.length < 10) {
    throw new AdminNoteRequiredError(
      "Xuất dữ liệu bắt buộc lý do tối thiểu 10 ký tự (BR-EXP-03)"
    );
  }

  const { from, to, rawFrom, rawTo } = parseExportDateRange(
    typeof query.from === "string" ? query.from : undefined,
    typeof query.to === "string" ? query.to : undefined
  );

  let maxRows = MAX_EXPORT_ROWS;
  if (
    process.env.NODE_ENV === "test" &&
    typeof query.max_rows === "string" &&
    Number.isInteger(Number(query.max_rows)) &&
    Number(query.max_rows) >= 0
  ) {
    maxRows = Number(query.max_rows);
  }

  const managerId = manager.manager_id;
  await checkExportRateLimit(managerId);

  const db = getOwnerDb();
  const { csvContent, rowCount } = await generateCsvData(kind, db, {
    from,
    to,
    maxRows,
  });

  // Save CSV to private storage and create 15-min signed URL (BR-EXP-04)
  const exportKey = `exports/${kind}_${Date.now()}.csv`;
  await uploadPrivateAsset({
    key: exportKey,
    body: Buffer.from(csvContent, "utf-8"),
    contentType: "text/csv; charset=utf-8",
  });

  const signedUrlRes = await getPrivateSignedUrl({
    path: exportKey,
    expiresInMinutes: 15, // 15 minutes TTL (BR-EXP-04)
  });

  // Write audit_logs data_exported (BR-EXP-03)
  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "data_exported",
      reason,
      entity_type: "data_export",
      entity_id: kind,
      after_data: {
        row_count: rowCount,
        export_key: exportKey,
        from: rawFrom ?? null,
        to: rawTo ?? null,
      },
    });
  });

  return {
    url: signedUrlRes.url,
    export_url: signedUrlRes.url,
    expires_at: signedUrlRes.expiresAt.toISOString(),
    row_count: rowCount,
  };
});
