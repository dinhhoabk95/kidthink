import crypto from "node:crypto";
import { writeAudit } from "@mindkid/audit";
import { checkRateLimit } from "@mindkid/cache";
import {
  ACCESS_TIER_CODEC,
  ACTOR_TYPE_CODEC,
  PAYMENT_ORDER_STATUS_CODEC,
  PROGRAM_TYPE_CODEC,
  SKILL_TIER_CODEC,
} from "@mindkid/db";
import { RateLimitedError, ValidationError } from "@mindkid/errors/common";
import { getPrivateSignedUrl, uploadPrivateAsset } from "@mindkid/storage";
import { escapeCsvField } from "#server/services/audit-log-service";
import { useOwnerRepositories } from "#server/utils/repositories";

export const CLOSED_EXPORT_KINDS = [
  "revenue",
  "subscriptions",
  "content_kpi",
  "skill_coverage",
  "curriculum_health",
  "audit",
] as const;

export type AdminExportKind = (typeof CLOSED_EXPORT_KINDS)[number];

export const MAX_EXPORT_ROWS = 100_000;
const MAX_EXPORT_RANGE_DAYS = 366;
const EXPORT_RATE_LIMIT = 5;
const EXPORT_RATE_WINDOW_SECONDS = 86_400;
const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface ExportFilterOptions {
  readonly from?: Date;
  readonly to?: Date;
  readonly maxRows?: number;
}

export interface GenerateAdminExportInput {
  readonly kind: AdminExportKind;
  readonly managerId: number;
  readonly reason: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly rawFrom?: string;
  readonly rawTo?: string;
  readonly maxRows?: number;
}

export interface GenerateAdminExportResult {
  readonly url: string;
  readonly export_url: string;
  readonly expires_at: string;
  readonly row_count: number;
}

export function isAdminExportKind(val: string): val is AdminExportKind {
  return (CLOSED_EXPORT_KINDS as readonly string[]).includes(val);
}

export async function checkExportRateLimit(managerId: number): Promise<void> {
  const result = await checkRateLimit(
    `acc:data-export:manager:${managerId}`,
    EXPORT_RATE_LIMIT,
    EXPORT_RATE_WINDOW_SECONDS,
    false
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

function csvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) {
    return "";
  }
  if (typeof val === "number") {
    return String(val);
  }
  return escapeCsvField(val.replace(/[\r\n]+/g, " "));
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

async function exportRevenueCsv(options: ExportFilterOptions) {
  const repos = useOwnerRepositories();
  const totalCount = await repos.orders.countAll({
    from: options.from,
    to: options.to,
  });
  const maxRows = options.maxRows ?? MAX_EXPORT_ROWS;
  assertRowCountWithinLimit(totalCount, maxRows);

  const rows = await repos.orders.listForExport(
    { from: options.from, to: options.to },
    maxRows + 1
  );

  const lines = [
    "\uFEFFMã đơn,Gói,Số tiền (VNĐ),Trạng thái,Email Người dùng,Thời gian tạo",
  ];
  for (const r of rows) {
    const redactedEmail = r.user.email ? redactEmail(r.user.email) : "";
    lines.push(
      [
        csvCell(r.transferNote),
        csvCell(r.packageCode),
        csvCell(r.amountVnd),
        csvCell(PAYMENT_ORDER_STATUS_CODEC.toLabel(r.status)),
        csvCell(redactedEmail),
        csvCell(r.createdAt.toISOString()),
      ].join(",")
    );
  }
  return { csvContent: `${lines.join("\n")}\n`, rowCount: rows.length };
}

async function exportSubscriptionsCsv(options: ExportFilterOptions) {
  const repos = useOwnerRepositories();
  const totalCount = await repos.users.countCreatedInRange({
    from: options.from,
    to: options.to,
  });
  const maxRows = options.maxRows ?? MAX_EXPORT_ROWS;
  assertRowCountWithinLimit(totalCount, maxRows);

  const rows = await repos.users.listForExport(
    { from: options.from, to: options.to },
    maxRows + 1
  );

  const lines = ["\uFEFFUser ID,Email (Rút gọn),Ngày đăng ký"];
  for (const r of rows) {
    const redacted = r.email ? redactEmail(r.email) : "";
    lines.push(
      [
        csvCell(r.id),
        csvCell(redacted),
        csvCell(r.createdAt.toISOString()),
      ].join(",")
    );
  }
  return { csvContent: `${lines.join("\n")}\n`, rowCount: rows.length };
}

async function exportContentKpiCsv(options: ExportFilterOptions) {
  const repos = useOwnerRepositories();
  const totalCount = await repos.gameLevels.countAll({
    from: options.from,
    to: options.to,
  });
  const maxRows = options.maxRows ?? MAX_EXPORT_ROWS;
  assertRowCountWithinLimit(totalCount, maxRows);

  const rows = await repos.gameLevels.listForExport(
    { from: options.from, to: options.to },
    maxRows + 1
  );

  const lines = ["\uFEFFMã màn chơi,Phiên bản,Tiêu đề,Gói truy cập,Trạng thái"];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.code),
        "1",
        csvCell(r.title),
        csvCell(ACCESS_TIER_CODEC.toLabel(r.accessTier)),
        csvCell("published"),
      ].join(",")
    );
  }
  return { csvContent: `${lines.join("\n")}\n`, rowCount: rows.length };
}

async function exportSkillCoverageCsv(options: ExportFilterOptions) {
  const repos = useOwnerRepositories();
  const totalCount = await repos.taxonomy.countSkills({
    from: options.from,
    to: options.to,
  });
  const maxRows = options.maxRows ?? MAX_EXPORT_ROWS;
  assertRowCountWithinLimit(totalCount, maxRows);

  const rows = await repos.taxonomy.listSkillsForExport(
    { from: options.from, to: options.to },
    maxRows + 1
  );

  const lines = ["\uFEFFMã kỹ năng,Tên kỹ năng,Độ khó,Bậc"];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.code),
        csvCell(r.name),
        csvCell(r.difficulty),
        csvCell(SKILL_TIER_CODEC.toLabel(r.tier)),
      ].join(",")
    );
  }
  return { csvContent: `${lines.join("\n")}\n`, rowCount: rows.length };
}

async function exportAuditCsv(options: ExportFilterOptions) {
  const repos = useOwnerRepositories();
  const totalCount = await repos.auditLogs.countAll({
    from: options.from,
    to: options.to,
  });
  const maxRows = options.maxRows ?? MAX_EXPORT_ROWS;
  assertRowCountWithinLimit(totalCount, maxRows);

  const rows = await repos.auditLogs.listForExport(
    { from: options.from, to: options.to },
    maxRows + 1
  );

  const lines = [
    "\uFEFFUUID,Actor Type,Actor ID,Action,Entity Type,Entity ID,Reason,Created At",
  ];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.uuid),
        csvCell(ACTOR_TYPE_CODEC.toLabel(r.actorType)),
        csvCell(r.actorId ?? ""),
        csvCell(r.action),
        csvCell(r.entityType),
        csvCell(r.entityId),
        csvCell(r.reason),
        csvCell(r.createdAt.toISOString()),
      ].join(",")
    );
  }
  return { csvContent: `${lines.join("\n")}\n`, rowCount: rows.length };
}

async function exportCurriculumHealthCsv(options: ExportFilterOptions) {
  const repos = useOwnerRepositories();
  const totalCount = await repos.curricula.countAll({
    from: options.from,
    to: options.to,
  });
  const maxRows = options.maxRows ?? MAX_EXPORT_ROWS;
  assertRowCountWithinLimit(totalCount, maxRows);

  const rows = await repos.curricula.listForExport(
    { from: options.from, to: options.to },
    maxRows + 1
  );

  const header =
    "\uFEFFMã chương trình,Phiên bản,Tiêu đề,Loại hình,Trạng thái,Số tuần,Số buổi/tuần,Số hoạt động,Số học sinh đang học,Thời gian tạo";

  if (rows.length === 0) {
    return { csvContent: `${header}\n`, rowCount: 0 };
  }

  const curriculumIds = rows.map((r) => r.id);
  const [itemCountMap, enrollmentCountMap] = await Promise.all([
    repos.curricula.countItemsByCurricula(curriculumIds),
    repos.curricula.countActiveEnrollmentsByCurricula(curriculumIds),
  ]);

  const lines = [header];
  for (const r of rows) {
    const itemsCount = itemCountMap.get(r.id) ?? 0;
    const activeEnrollments = enrollmentCountMap.get(r.id) ?? 0;

    lines.push(
      [
        csvCell(r.code),
        "1",
        csvCell(r.title),
        csvCell(PROGRAM_TYPE_CODEC.toLabel(r.programType)),
        csvCell("published"),
        csvCell(r.durationWeeks),
        csvCell(r.sessionsPerWeek),
        csvCell(itemsCount),
        csvCell(activeEnrollments),
        csvCell(r.createdAt.toISOString()),
      ].join(",")
    );
  }

  return { csvContent: `${lines.join("\n")}\n`, rowCount: rows.length };
}

export async function generateCsvData(
  kind: string,
  options: ExportFilterOptions = {}
): Promise<{ csvContent: string; rowCount: number }> {
  switch (kind) {
    case "revenue":
      return await exportRevenueCsv(options);
    case "subscriptions":
      return await exportSubscriptionsCsv(options);
    case "content_kpi":
      return await exportContentKpiCsv(options);
    case "skill_coverage":
      return await exportSkillCoverageCsv(options);
    case "curriculum_health":
      return await exportCurriculumHealthCsv(options);
    case "audit":
      return await exportAuditCsv(options);
    default:
      return {
        csvContent: "\uFEFFTuần,Mã bài học,Số hoạt động,Trạng thái\n",
        rowCount: 0,
      };
  }
}

export async function generateAdminExport(
  input: GenerateAdminExportInput
): Promise<GenerateAdminExportResult> {
  await checkExportRateLimit(input.managerId);

  const { csvContent, rowCount } = await generateCsvData(input.kind, {
    from: input.from,
    to: input.to,
    maxRows: input.maxRows,
  });

  const exportKey = `exports/${input.kind}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.csv`;
  await uploadPrivateAsset({
    key: exportKey,
    body: Buffer.from(csvContent, "utf-8"),
    contentType: "text/csv; charset=utf-8",
  });

  const signedUrlRes = await getPrivateSignedUrl({
    path: exportKey,
    expiresInMinutes: 15,
  });

  const repos = useOwnerRepositories();
  await repos.auditLogs.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: input.managerId,
      action: "data_exported",
      reason: input.reason,
      entity_type: "data_export",
      entity_id: input.kind,
      after_data: {
        row_count: rowCount,
        export_key: exportKey,
        from: input.rawFrom ?? null,
        to: input.rawTo ?? null,
      },
    });
  });

  return {
    url: signedUrlRes.url,
    export_url: signedUrlRes.url,
    expires_at: signedUrlRes.expiresAt.toISOString(),
    row_count: rowCount,
  };
}
