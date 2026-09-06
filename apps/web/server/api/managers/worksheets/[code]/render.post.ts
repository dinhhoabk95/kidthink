import { InternalError, ValidationError } from "@mindkid/errors/common";
import { WorksheetNotFoundError } from "@mindkid/errors/content";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import {
  getWorksheetByCode,
  renderWorksheetArtifact,
} from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new ValidationError("Worksheet code is required");
  }

  const query = getQuery(event);
  const version = query.version ? Number(query.version) : undefined;

  const ws = await getWorksheetByCode(code, version);
  if (!ws) {
    throw new WorksheetNotFoundError(`Worksheet with code ${code} not found`);
  }

  try {
    const result = await renderWorksheetArtifact(ws.id, session.manager_id);
    return {
      success: true,
      worksheet: result.worksheet,
      render_evidence: {
        render_status: result.worksheet.renderStatus,
        render_job_id: result.worksheet.renderJobId,
        render_input_hash: result.worksheet.renderInputHash,
        source_content_version: result.worksheet.sourceContentVersion,
        render_page_count: result.worksheet.renderPageCount,
        render_grayscale_passed: result.worksheet.renderGrayscalePassed,
        pdf_path: result.worksheet.pdfPath,
      },
      inspection: result.inspection,
    };
  } catch (err: unknown) {
    const errorObj = err as {
      statusCode?: number;
      message?: string;
      details?: unknown;
    };
    throw new InternalError(errorObj.message);
  }
});
