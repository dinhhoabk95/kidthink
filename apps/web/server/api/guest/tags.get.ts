import { defineEventHandler, setHeader } from "h3";
import { listActiveContentTagsGrouped } from "#server/services/catalog-service";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=3600");
  return await listActiveContentTagsGrouped();
});
