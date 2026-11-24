import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import {
  generateAdminExport,
  isAdminExportKind,
  MAX_EXPORT_ROWS as SERVICE_MAX_EXPORT_ROWS,
  assertRowCountWithinLimit as serviceAssertRowCountWithinLimit,
  checkExportRateLimit as serviceCheckExportRateLimit,
  parseExportDateRange as serviceParseExportDateRange,
} from "#server/services/admin-export-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export type { ExportFilterOptions } from "#server/services/admin-export-service";

export const MAX_EXPORT_ROWS = SERVICE_MAX_EXPORT_ROWS;

export function checkExportRateLimit(managerId: number): Promise<void> {
  return serviceCheckExportRateLimit(managerId);
}

export function parseExportDateRange(
  rawFromValue: string | undefined,
  rawToValue: string | undefined
) {
  return serviceParseExportDateRange(rawFromValue, rawToValue);
}

export function assertRowCountWithinLimit(
  totalCount: number,
  maxRows = MAX_EXPORT_ROWS
): void {
  serviceAssertRowCountWithinLimit(totalCount, maxRows);
}

export default defineEventHandler(async (event) => {
  const manager = requireSuperAdminSession(event);

  const kind = getRouterParam(event, "kind");
  if (!(kind && isAdminExportKind(kind))) {
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

  return await generateAdminExport({
    kind,
    managerId: manager.manager_id,
    reason,
    from,
    to,
    rawFrom,
    rawTo,
    maxRows,
  });
});
