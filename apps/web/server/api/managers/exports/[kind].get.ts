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
  writeAudit,
} from "@mindkid/db";
import { getPrivateSignedUrl, uploadPrivateAsset } from "@mindkid/storage";
import { desc, eq, sql } from "drizzle-orm";
import { createError, defineEventHandler, getQuery, getRouterParam } from "h3";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

const CLOSED_EXPORT_KINDS = [
  "revenue",
  "subscriptions",
  "content_kpi",
  "skill_coverage",
  "curriculum_health",
  "audit",
];

const MAX_EXPORT_ROWS = 100_000; // BR-EXP-05

// In-memory rate limiter: 5 exports/day per manager (BR-EXP-07)
const exportRateLimitMap = new Map<number, { count: number; date: string }>();

function checkExportRateLimit(managerId: number): void {
  const today = new Date().toISOString().slice(0, 10);
  const record = exportRateLimitMap.get(managerId);

  if (record && record.date === today) {
    if (record.count >= 5) {
      throw createError({
        statusCode: 429,
        statusMessage: "RATE_LIMIT_EXCEEDED",
        message:
          "Giới hạn xuất dữ liệu tối đa 5 lần/ngày mỗi Manager (BR-EXP-07)",
      });
    }
    record.count++;
  } else {
    exportRateLimitMap.set(managerId, { count: 1, date: today });
  }
}

function redactEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) {
    return "***";
  }
  const name = parts[0];
  const domain = parts[1];
  const redactedName =
    name.length <= 2
      ? `${name[0]}*`
      : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${redactedName}@${domain}`;
}

async function exportRevenueCsv(db: ReturnType<typeof getOwnerDb>) {
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
    .orderBy(desc(paymentOrders.createdAt))
    .limit(MAX_EXPORT_ROWS);

  let csvContent =
    "\uFEFFMã đơn,Gói,Số tiền (VNĐ),Trạng thái,Email Người dùng,Thời gian tạo\n";
  for (const r of rows) {
    csvContent += `"${r.orderCode || ""}","${r.packageCode}",${r.amountVnd},"${r.status}","${r.userEmail || ""}","${r.createdAt.toISOString()}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportSubscriptionsCsv(db: ReturnType<typeof getOwnerDb>) {
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(MAX_EXPORT_ROWS);

  let csvContent = "\uFEFFUser ID,Email (Rút gọn),Ngày đăng ký\n";
  for (const r of rows) {
    const redacted = r.email ? redactEmail(r.email) : "";
    csvContent += `${r.userId},"${redacted}","${r.createdAt.toISOString()}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportContentKpiCsv(db: ReturnType<typeof getOwnerDb>) {
  const rows = await db
    .select({
      code: gameLevels.code,
      version: gameLevels.contentVersion,
      title: gameLevels.title,
      accessTier: gameLevels.accessTier,
      status: gameLevels.status,
    })
    .from(gameLevels)
    .orderBy(desc(gameLevels.updatedAt))
    .limit(MAX_EXPORT_ROWS);

  let csvContent =
    "\uFEFFMã màn chơi,Phiên bản,Tiêu đề,Gói truy cập,Trạng thái\n";
  for (const r of rows) {
    csvContent += `"${r.code}",${r.version},"${r.title}","${r.accessTier}","${r.status}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportSkillCoverageCsv(db: ReturnType<typeof getOwnerDb>) {
  const rows = await db
    .select({
      code: skills.code,
      name: skills.name,
      difficulty: skills.difficulty,
      status: skills.status,
    })
    .from(skills)
    .orderBy(skills.code)
    .limit(MAX_EXPORT_ROWS);

  let csvContent = "\uFEFFMã kỹ năng,Tên kỹ năng,Độ khó,Trạng thái\n";
  for (const r of rows) {
    csvContent += `"${r.code}","${r.name}",${r.difficulty},"${r.status}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportAuditCsv(db: ReturnType<typeof getOwnerDb>) {
  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(MAX_EXPORT_ROWS);

  let csvContent =
    "\uFEFFUUID,Actor Type,Actor ID,Action,Entity Type,Entity ID,Reason,Created At\n";
  for (const r of rows) {
    csvContent += `"${r.uuid}","${r.actorType}",${r.actorId || ""},"${r.action}","${r.entityType}","${r.entityId}","${r.reason || ""}","${r.createdAt.toISOString()}"\n`;
  }
  return { csvContent, rowCount: rows.length };
}

async function exportCurriculumHealthCsv(db: ReturnType<typeof getOwnerDb>) {
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
    .orderBy(desc(curricula.createdAt))
    .limit(MAX_EXPORT_ROWS);

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

async function generateCsvData(
  kind: string,
  db: ReturnType<typeof getOwnerDb>
): Promise<{ csvContent: string; rowCount: number }> {
  switch (kind) {
    case "revenue":
      return await exportRevenueCsv(db);
    case "subscriptions":
      return await exportSubscriptionsCsv(db);
    case "content_kpi":
      return await exportContentKpiCsv(db);
    case "skill_coverage":
      return await exportSkillCoverageCsv(db);
    case "curriculum_health":
      return await exportCurriculumHealthCsv(db);
    case "audit":
      return await exportAuditCsv(db);
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
    throw createError({
      statusCode: 403,
      statusMessage: "INSUFFICIENT_ROLE",
      message: "Chỉ super_admin mới có quyền trích xuất dữ liệu (BR-EXP-06)",
    });
  }

  const kind = getRouterParam(event, "kind");
  if (!(kind && CLOSED_EXPORT_KINDS.includes(kind))) {
    throw createError({
      statusCode: 404,
      statusMessage: "EXPORT_KIND_NOT_FOUND",
      message: `Loại xuất dữ liệu '${kind}' không thuộc danh sách đóng cho phép (BR-EXP-01)`,
    });
  }

  const query =
    ((event as Record<string, unknown>)._query as Record<string, unknown>) ||
    getQuery(event);
  const reason = typeof query.reason === "string" ? query.reason.trim() : "";
  if (!reason || reason.length < 10) {
    throw createError({
      statusCode: 422,
      statusMessage: "REASON_REQUIRED",
      message: "Xuất dữ liệu bắt buộc lý do tối thiểu 10 ký tự (BR-EXP-03)",
    });
  }

  const managerId = manager.manager_id || manager.id || 1;
  checkExportRateLimit(managerId);

  const db = getOwnerDb();
  const { csvContent, rowCount } = await generateCsvData(kind, db);

  if (rowCount > MAX_EXPORT_ROWS) {
    throw createError({
      statusCode: 422,
      statusMessage: "EXPORT_ROW_LIMIT_EXCEEDED",
      message:
        "Số lượng dòng xuất vượt quá giới hạn 100.000 dòng. Vui lòng thu hẹp khoảng thời gian (BR-EXP-05)",
    });
  }

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
  await writeAudit(db, {
    actor_type: "manager",
    actor_id: managerId,
    action: "data_exported",
    reason,
    entity_type: "data_export",
    entity_id: kind,
    after_data: {
      kind,
      from: query.from || null,
      to: query.to || null,
      row_count: rowCount,
      expires_at: signedUrlRes.expiresAt.toISOString(),
    },
  });

  return {
    url: signedUrlRes.url,
    expires_at: signedUrlRes.expiresAt.toISOString(),
    row_count: rowCount,
  };
});
