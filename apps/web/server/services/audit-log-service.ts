import { writeAudit } from "@mindkid/audit";
import {
  ACTOR_TYPE_CODEC,
  type ActorTypeLabel,
  type AuditLogEntity,
  type JsonRecord,
  type ListAuditLogsFilter,
} from "@mindkid/db";
import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { ValidationError } from "@mindkid/errors/common";
import {
  assertRowCountWithinLimit,
  checkExportRateLimit,
} from "#server/services/admin-export-service";
import { useOwnerRepositories } from "#server/utils/repositories";

export const MAX_AUDIT_EXPORT_ROWS = 10_000;
const MAX_AUDIT_LIST_LIMIT = 200;
const MAX_AUDIT_RANGE_DAYS = 90;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;
const IPV4_AUDIT_REGEX = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/;

export function maskAuditIp(ip: string | null): string | null {
  if (!ip) {
    return null;
  }
  const trimmed = ip.trim();
  if (!trimmed) {
    return null;
  }
  const v4 = IPV4_AUDIT_REGEX.exec(trimmed);
  if (v4) {
    return `${v4[1]}.${v4[2]}.x.x`;
  }
  if (trimmed.includes(":")) {
    const segments = trimmed.split(":");
    return `${segments.slice(0, 2).join(":")}:xxxx`;
  }
  return "masked";
}

export type AuditPayloadValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | object;

export type AuditPayloadRecord = Record<string, AuditPayloadValue>;

export interface FormattedAuditItem {
  readonly id: number;
  readonly uuid: string;
  readonly actor_type: string;
  readonly actor_id: number | null;
  readonly actor_name: string;
  readonly action: string;
  readonly entity_type: string;
  readonly entity_id: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly reason: string | null;
  readonly before_data: AuditPayloadRecord | null;
  readonly after_data: AuditPayloadRecord | null;
  readonly ip: string | null;
  readonly user_agent: string | null;
  readonly request_id: string | null;
  readonly created_at: string;
}

export interface AuditListResult {
  readonly items: FormattedAuditItem[];
  readonly total: number;
  readonly limit: number;
}

export interface AuditExportCsvResult {
  readonly csvContent: string;
  readonly filename: string;
  readonly exportedCount: number;
}

function isAuditActorType(val: string): val is ActorTypeLabel {
  return val === "user" || val === "manager" || val === "system";
}

function readQueryString(query: object, key: string): string | undefined {
  const val = Reflect.get(query, key);
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof val === "number" && Number.isFinite(val)) {
    return String(val);
  }
  return undefined;
}

function parseActionFilter(query: object): string | string[] | undefined {
  const action = Reflect.get(query, "action");
  if (Array.isArray(action)) {
    const actions = action.map((item) => String(item).trim()).filter(Boolean);
    return actions.length > 0 ? actions : undefined;
  }
  if (typeof action === "string") {
    const trimmed = action.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export function validateAuditDateRange(
  fromStr?: string,
  toStr?: string,
  fieldStyle: "summary" | "field" = "summary"
): { fromDate?: Date; toDate?: Date } {
  const fromDate = fromStr ? new Date(fromStr) : undefined;
  const toDate = toStr ? new Date(toStr) : undefined;

  if (fromDate && Number.isNaN(fromDate.getTime())) {
    if (fieldStyle === "field") {
      throw ValidationError.field(
        "from",
        "Ngày bắt đầu (from) không đúng định dạng hợp lệ"
      );
    }
    throw new ValidationError("Tham số thời gian 'from' không hợp lệ");
  }

  if (toDate && Number.isNaN(toDate.getTime())) {
    if (fieldStyle === "field") {
      throw ValidationError.field(
        "to",
        "Ngày kết thúc (to) không đúng định dạng hợp lệ"
      );
    }
    throw new ValidationError("Tham số thời gian 'to' không hợp lệ");
  }

  if (fromDate && toDate) {
    if (toDate.getTime() < fromDate.getTime()) {
      if (fieldStyle === "field") {
        throw ValidationError.field(
          "from",
          "Ngày bắt đầu (from) phải nhỏ hơn hoặc bằng ngày kết thúc (to)"
        );
      }
      throw new ValidationError(
        "Thời gian kết thúc 'to' phải lớn hơn hoặc bằng 'from'"
      );
    }
    const diffDays = (toDate.getTime() - fromDate.getTime()) / MS_PER_DAY;
    if (diffDays > MAX_AUDIT_RANGE_DAYS) {
      throw new ValidationError(
        "Khoảng thời gian tra cứu tối đa là 90 ngày (BR-ALV-03)"
      );
    }
  }

  return { fromDate, toDate };
}

export function buildAuditFilterFromQuery(
  query: object,
  dates: { fromDate?: Date; toDate?: Date },
  limit: number
): ListAuditLogsFilter {
  const actorTypeRaw =
    readQueryString(query, "actor_type") || readQueryString(query, "actorType");
  const actorIdRaw =
    readQueryString(query, "actor_id") || readQueryString(query, "actorId");
  const parsedActorId = actorIdRaw ? Number(actorIdRaw) : Number.NaN;

  return {
    actorType:
      actorTypeRaw && isAuditActorType(actorTypeRaw)
        ? ACTOR_TYPE_CODEC.toCode(actorTypeRaw)
        : undefined,
    actorId: Number.isInteger(parsedActorId) ? parsedActorId : undefined,
    action: parseActionFilter(query),
    entityType:
      readQueryString(query, "entity_type") ||
      readQueryString(query, "entityType"),
    entityId:
      readQueryString(query, "entity_id") || readQueryString(query, "entityId"),
    from: dates.fromDate,
    to: dates.toDate,
    q: readQueryString(query, "q"),
    limit,
  };
}

function toAuditPayloadRecord(
  raw: JsonRecord | null
): AuditPayloadRecord | null {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as AuditPayloadRecord;
  }
  return null;
}

function formatAuditEntity(entity: AuditLogEntity): FormattedAuditItem {
  const beforeObj = toAuditPayloadRecord(entity.beforeData);
  const afterObj = toAuditPayloadRecord(entity.afterData);
  const requestId =
    (beforeObj?.request_id ? String(beforeObj.request_id) : null) ||
    (afterObj?.request_id ? String(afterObj.request_id) : null) ||
    entity.uuid;

  const actorTypeLabel = ACTOR_TYPE_CODEC.toLabel(entity.actorType);

  return {
    id: entity.id,
    uuid: entity.uuid,
    actor_type: actorTypeLabel,
    actor_id: entity.actorId,
    actor_name: `${actorTypeLabel} #${entity.actorId || "0"}`,
    action: entity.action,
    entity_type: entity.entityType,
    entity_id: entity.entityId,
    entityType: entity.entityType,
    entityId: entity.entityId,
    reason: entity.reason,
    before_data: beforeObj,
    after_data: afterObj,
    ip: entity.ipAddress ? `${entity.ipAddress.slice(0, 7)}***` : null,
    user_agent: entity.userAgent,
    request_id: requestId,
    created_at: entity.createdAt.toISOString(),
  };
}

export function escapeCsvField(
  val: string | number | boolean | null | undefined | object
): string {
  if (val === null || val === undefined) {
    return "";
  }
  const rawStr = typeof val === "object" ? JSON.stringify(val) : String(val);
  const str = FORMULA_PREFIX_REGEX.test(rawStr) ? `'${rawStr}` : rawStr;
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.startsWith("'")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function listAuditLogs(query: object): Promise<AuditListResult> {
  const rawLimit = Number(readQueryString(query, "limit"));
  const limit = Math.min(Math.max(rawLimit || 50, 1), MAX_AUDIT_LIST_LIMIT);
  const dates = validateAuditDateRange(
    readQueryString(query, "from"),
    readQueryString(query, "to"),
    "summary"
  );

  const repos = useOwnerRepositories();
  const entities = await repos.auditLogs.listFiltered(
    buildAuditFilterFromQuery(query, dates, limit)
  );
  const items = entities.map((entity) => formatAuditEntity(entity));

  return {
    items,
    total: items.length,
    limit,
  };
}

export async function exportAuditLogsCsv(
  query: object,
  actor: {
    readonly managerId: number;
    readonly ipAddress: string;
    readonly reason?: string;
  }
): Promise<AuditExportCsvResult> {
  const customReason = (
    actor.reason ??
    readQueryString(query, "reason") ??
    ""
  ).trim();
  if (customReason.length < 10) {
    throw new AdminNoteRequiredError(
      "Xuất nhật ký kiểm toán bắt buộc lý do tối thiểu 10 ký tự (BR-ALV-06)."
    );
  }

  await checkExportRateLimit(actor.managerId);

  const rawLimit = Number(readQueryString(query, "limit"));
  const limit = Math.min(
    Math.max(rawLimit || MAX_AUDIT_EXPORT_ROWS, 1),
    MAX_AUDIT_EXPORT_ROWS
  );
  const dates = validateAuditDateRange(
    readQueryString(query, "from"),
    readQueryString(query, "to"),
    "field"
  );

  const repos = useOwnerRepositories();
  const exportFilter = buildAuditFilterFromQuery(query, dates, limit);
  const totalCount = await repos.auditLogs.countAll(exportFilter);
  assertRowCountWithinLimit(totalCount, MAX_AUDIT_EXPORT_ROWS);

  const rows = await repos.auditLogs.listForExport(
    exportFilter,
    MAX_AUDIT_EXPORT_ROWS
  );

  const filterAction = readQueryString(query, "action") ?? null;
  const filterEntityType = readQueryString(query, "entity_type") ?? null;

  await repos.auditLogs.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: actor.managerId,
      action: "data_exported",
      reason: customReason,
      entity_type: "audit_logs",
      entity_id: `export_${Date.now()}`,
      after_data: {
        exported_row_count: rows.length,
        filter_action: filterAction,
        filter_entity_type: filterEntityType,
      },
      ip_address: actor.ipAddress,
    });
  });

  const headers = [
    "ID",
    "UUID",
    "Thời gian",
    "Loại tác nhân",
    "Mã tác nhân",
    "Hành động",
    "Loại Entity",
    "Mã Entity",
    "Lý do",
    "IP Address",
  ];

  const lines: string[] = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        escapeCsvField(r.uuid),
        escapeCsvField(r.createdAt.toISOString()),
        escapeCsvField(ACTOR_TYPE_CODEC.toLabel(r.actorType)),
        escapeCsvField(r.actorId),
        escapeCsvField(r.action),
        escapeCsvField(r.entityType),
        escapeCsvField(r.entityId),
        escapeCsvField(r.reason),
        escapeCsvField(maskAuditIp(r.ipAddress)),
      ].join(",")
    );
  }

  const csvContent = `\uFEFF${lines.join("\r\n")}`;
  const filename = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;

  return {
    csvContent,
    filename,
    exportedCount: rows.length,
  };
}
