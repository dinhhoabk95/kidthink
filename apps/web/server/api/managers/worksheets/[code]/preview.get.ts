import { getWorksheetByCode, renderWorksheetPdf } from "@kidthink/db";
import {
  createError,
  defineEventHandler,
  getQuery,
  getRouterParam,
  setHeader,
} from "h3";
import { requireManagerSession } from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

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

  const renderResult = renderWorksheetPdf({
    code: ws.code,
    version: ws.contentVersion,
    title: ws.titleVi,
    layout_template: ws.layoutTemplate,
    content_blocks: ws.contentBlocks,
    instructions_vi: ws.instructionsVi || "",
  });

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(
    event,
    "Content-Disposition",
    `inline; filename="${ws.code}-v${ws.contentVersion}-preview.pdf"`
  );
  setHeader(event, "Cache-Control", "no-cache, no-store, must-revalidate");

  return renderResult.pdfBuffer;
});
