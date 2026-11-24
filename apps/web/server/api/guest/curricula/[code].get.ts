import { CurriculumNotFoundError } from "@mindkid/errors/curriculum";
import { defineEventHandler, getRouterParam, setHeader } from "h3";
import { getPublicCurriculumShowcaseDetail } from "#server/services/curriculum-showcase-service";

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new CurriculumNotFoundError(code);
  }

  setHeader(event, "Cache-Control", "public, max-age=600");
  return await getPublicCurriculumShowcaseDetail(code);
});
