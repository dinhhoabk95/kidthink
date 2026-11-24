import { NotFoundError } from "@mindkid/errors/common";
import { getRouterParam } from "h3";
import { z } from "zod";
import { resolveErrorGroup } from "#server/services/error-log-service";
import { defineApiRoute } from "#server/utils/define-api-route";

const patchErrorLogSchema = z.object({
  status: z
    .enum(["open", "ack", "resolved", "new", "in_progress", "ignored"])
    .optional()
    .default("resolved"),
  notes: z.string().nullable().optional(),
});

export default defineApiRoute({
  auth: "super_admin",
  body: patchErrorLogSchema,
  async handler({ event, auth, body }) {
    const fingerprint = getRouterParam(event, "fingerprint");
    if (!fingerprint) {
      throw new NotFoundError("FINGERPRINT_NOT_FOUND");
    }

    return await resolveErrorGroup(fingerprint, {
      status: body.status,
      notes: body.notes,
      managerId: auth.manager_id,
    });
  },
});
