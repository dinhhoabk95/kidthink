import { InvalidCodeFormatError } from "@mindkid/errors/content";
import { defineEventHandler, getRouterParam, setHeader } from "h3";
import { getPublicTaxonomySkillDetail } from "#server/services/taxonomy-service";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const code = getRouterParam(event, "code");
  if (!code) {
    throw new InvalidCodeFormatError();
  }

  return await getPublicTaxonomySkillDetail(code);
});
