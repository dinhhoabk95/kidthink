import { appError } from "@mindkid/auth";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import { z } from "zod";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "../../../utils/admin-auth-runtime.ts";
import { throwValidationError } from "../../../utils/api-error.js";
import { revokeUserEntitlementById } from "../../../utils/entitlements-runtime.ts";

const revokeEntitlementSchema = z.object({
  reason: z
    .string({ required_error: "Lý do thu hồi là bắt buộc." })
    .min(10, "Lý do thu hồi bắt buộc tối thiểu 10 ký tự."),
});

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const idParam = getRouterParam(event, "id");
  const entitlementId = Number(idParam);
  if (!idParam || Number.isNaN(entitlementId) || entitlementId <= 0) {
    throw appError("VALIDATION_FAILED", "Mã entitlement không hợp lệ.");
  }

  const customEvent = event as unknown as {
    _body?: unknown;
    context?: { body?: unknown };
  };
  const rawBody =
    (await readBody(event).catch(() => undefined)) ??
    customEvent._body ??
    customEvent.context?.body;

  const parsed = revokeEntitlementSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const result = await revokeUserEntitlementById(
    entitlementId,
    parsed.data.reason,
    {
      type: "manager",
      id: session.manager_id,
      ip: getManagerRemoteIp(event),
      userAgent: getHeader(event, "user-agent") || null,
    }
  );

  return {
    status: "cancelled",
    id: result.id,
    key: result.key,
  };
});
