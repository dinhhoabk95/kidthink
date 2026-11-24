import { defineEventHandler, setHeader } from "h3";
import { listPublishedThemesCatalog } from "#server/services/catalog-service";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=3600");
  return await listPublishedThemesCatalog();
});
