import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { suspendUserByManager } from "#server/services/identity-manager-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

const suspendBodySchema = z.object({
  reason: z.string().min(10),
});

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw new NotFoundError();
  }

  const rawBody =
    event.context?.body ?? (await readBody(event).catch(() => ({}))) ?? {};
  const parsed = suspendBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new AdminNoteRequiredError();
  }

  return await suspendUserByManager({
    userUuid,
    managerId: session.manager_id,
    reason: parsed.data.reason.trim(),
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });
});
