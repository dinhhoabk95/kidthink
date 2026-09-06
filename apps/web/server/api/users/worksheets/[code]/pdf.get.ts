import { TierLockedError } from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import { WorksheetNotFoundError } from "@mindkid/errors/content";
import { renderWorksheetPdf } from "@mindkid/export";
import { canAccessTier } from "@mindkid/shared";
import { defineEventHandler, getRouterParam, setHeader } from "h3";
import { getPublishedWorksheetByCode } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const code = getRouterParam(event, "code");

  if (!code) {
    throw ValidationError.field("code", "Worksheet code is required");
  }

  const ws = await getPublishedWorksheetByCode(code);
  if (!ws) {
    throw new WorksheetNotFoundError(code);
  }

  // Check user active entitlements
  const entitlements = await resolveUserActiveEntitlements(
    Number(user.user_id)
  );

  const hasAccess = canAccessTier(ws.accessTier, entitlements);
  if (!hasAccess) {
    throw new TierLockedError(
      "Cần nâng cấp gói tài khoản để tải phiếu bài tập này."
    );
  }

  // Pure vector PDF rendering (BR-WSM-01..08)
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
    `attachment; filename="${ws.code}-v${ws.contentVersion}.pdf"`
  );
  // Security hard rule: Never cache response containing gated/entitlement content
  setHeader(event, "Cache-Control", "private, no-store, must-revalidate");

  return renderResult.pdfBuffer;
});
