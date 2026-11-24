import { NotFoundError } from "@mindkid/errors/common";
import { getRouterParam } from "h3";
import { z } from "zod";
import { listChildCurriculumFlows } from "#server/services/child-curriculum-service";
import { defineApiRoute } from "#server/utils/define-api-route";

const ParamsSchema = z.object({
  uuid: z.string().uuid(),
});

export default defineApiRoute({
  auth: "user",
  handler: async ({ event, auth: user }) => {
    const parsedParams = ParamsSchema.safeParse({
      uuid: getRouterParam(event, "uuid"),
    });
    if (!parsedParams.success) {
      throw new NotFoundError("Không tìm thấy hồ sơ trẻ.");
    }

    return await listChildCurriculumFlows({
      userId: Number(user.user_id),
      childUuid: parsedParams.data.uuid,
    });
  },
});
