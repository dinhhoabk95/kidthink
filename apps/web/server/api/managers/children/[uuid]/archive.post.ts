import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { archiveChildProfileByManager } from "#server/services/child-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

const archiveBodySchema = z.object({
  reason: z.string().min(10),
});

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
  const childUuid = getRouterParam(event, "uuid");
  if (!childUuid) {
    throw new NotFoundError();
  }

  const rawBody =
    Reflect.get(event.context, "body") ??
    (await readBody(event).catch(() => ({}))) ??
    {};
  const parsed = archiveBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new AdminNoteRequiredError();
  }

  return await archiveChildProfileByManager({
    managerId: session.manager_id,
    childUuid,
    reason: parsed.data.reason,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });
});
