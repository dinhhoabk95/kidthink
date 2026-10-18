import { ValidationError } from "@mindkid/errors/common";
import { WorksheetNotFoundError } from "@mindkid/errors/content";
import { renderWorksheetPdf } from "@mindkid/export";
import { defineEventHandler, getQuery, getRouterParam, setHeader } from "h3";
import { z } from "zod";
import { getWorksheetByCode } from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const WorksheetPreviewQuerySchema = z.object({
  version: z.coerce.number().optional(),
});

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  if (!code) {
    throw new ValidationError("Worksheet code is required");
  }

  const parsedQuery = WorksheetPreviewQuerySchema.safeParse(getQuery(event));
  const version =
    parsedQuery.success && parsedQuery.data.version
      ? Number(parsedQuery.data.version)
      : undefined;

  const ws = await getWorksheetByCode(code, version);
  if (!ws) {
    throw new WorksheetNotFoundError(`Worksheet with code ${code} not found`);
  }

  const renderResult = renderWorksheetPdf({
    code: ws.code,
    version: ws.contentVersion,
    title: ws.title,
    layout_template: ws.layoutTemplate,
    content_blocks: ws.contentBlocks,
    instructions: ws.instructions || "",
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
