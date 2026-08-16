import { appError } from "@kidthink/auth";
import { getPublishedWorksheetByCode, renderWorksheetPdf } from "@kidthink/db";
import { canAccessTier } from "@kidthink/shared";
import { defineEventHandler, getRouterParam, setHeader } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../../utils/entitlements-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const code = getRouterParam(event, "code");

    if (!code) {
      throw appError("VALIDATION_ERROR", "Worksheet code is required");
    }

    const ws = await getPublishedWorksheetByCode(code);
    if (!ws) {
      throw appError(
        "NOT_FOUND",
        `Worksheet with code ${code} not found or not published`
      );
    }

    // Check user active entitlements
    const entitlements = await resolveUserActiveEntitlements(
      Number(user.user_id)
    );

    const hasAccess = canAccessTier(ws.accessTier, entitlements);
    if (!hasAccess) {
      throw appError(
        "TIER_LOCKED",
        "Cần nâng cấp gói tài khoản để tải phiếu bài tập này."
      );
    }

    // Pure vector PDF rendering (BR-WSM-01..08)
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
      `attachment; filename="${ws.code}-v${ws.contentVersion}.pdf"`
    );
    // Security hard rule: Never cache response containing gated/entitlement content
    setHeader(event, "Cache-Control", "private, no-store, must-revalidate");

    return renderResult.pdfBuffer;
  } catch (error: unknown) {
    return respondToUserAuthError(event, error);
  }
});
