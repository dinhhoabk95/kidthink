import { getRouterParam } from "h3";
import { z } from "zod";
import { getPersonalCurriculumDetailWithKoguma } from "#server/services/play-experience-service";
import { defineApiRoute } from "#server/utils/define-api-route";

const UuidParamSchema = z.string().trim().min(1);

export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const parsedParam = UuidParamSchema.safeParse(
      getRouterParam(event, "uuid")
    );
    const uuid = parsedParam.success ? parsedParam.data : "";

    return await getPersonalCurriculumDetailWithKoguma(
      { userId: Number(auth.user_id) },
      uuid
    );
  },
});
