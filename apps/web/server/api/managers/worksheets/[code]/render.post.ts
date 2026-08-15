import { getWorksheetByCode, renderWorksheetArtifact } from "@kidthink/db";
import { createError, defineEventHandler, getQuery, getRouterParam } from "h3";
import { requireManagerSession } from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "CODE_REQUIRED",
      message: "Worksheet code is required",
    });
  }

  const query = getQuery(event);
  const version = query.version ? Number(query.version) : undefined;

  const ws = await getWorksheetByCode(code, version);
  if (!ws) {
    throw createError({
      statusCode: 404,
      statusMessage: "WORKSHEET_NOT_FOUND",
      message: `Worksheet with code ${code} not found`,
    });
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
    throw createError({
      statusCode: errorObj.statusCode || 500,
      statusMessage: errorObj.message || "RENDER_FAILED",
      message: errorObj.message,
      data: errorObj.details,
    });
  }
});
