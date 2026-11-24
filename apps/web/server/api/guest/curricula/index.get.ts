import { defineEventHandler, setHeader } from "h3";
import { listPublicCurriculaShowcase } from "#server/services/curriculum-showcase-service";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=600");
  return await listPublicCurriculaShowcase();
});
