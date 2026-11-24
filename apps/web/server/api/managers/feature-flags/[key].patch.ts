import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { updateFeatureFlag } from "#server/services/feature-flags";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const scopeExtraValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.number()),
  z.array(z.string()),
  z.null(),
]);

const scopeValueSchema = z
  .object({
    user_ids: z.array(z.number().int()).optional(),
    percentage: z.number().min(0).max(100).optional(),
  })
  .catchall(scopeExtraValueSchema);

const patchFlagSchema = z.object({
  reason: z.string().min(10),
  enabled: z.boolean().optional().default(false),
  scope: z
    .enum(["global", "user_ids", "percentage"])
    .optional()
    .default("global"),
  scope_value: scopeValueSchema.nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const manager = requireSuperAdminSession(event);
  requireReauth(event);

  const key = getRouterParam(event, "key");
  if (!key) {
    throw new NotFoundError("FLAG_NOT_FOUND");
  }

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));
  const parsedResult = patchFlagSchema.safeParse(raw);
  if (!parsedResult.success) {
    throw new AdminNoteRequiredError(
      "Đổi cờ tính năng bắt buộc lý do tối thiểu 10 ký tự (BR-FFA-01)"
    );
  }

  const { reason, enabled, scope, scope_value: scopeValue } = parsedResult.data;

  return await updateFeatureFlag(key, {
    reason,
    enabled,
    scope,
    scopeValue,
    managerId: manager.manager_id,
  });
});
