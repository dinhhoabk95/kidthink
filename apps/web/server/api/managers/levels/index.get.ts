import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getQuery } from "h3";
import { listManagerLevelsCatalog } from "#server/services/catalog-service";
import { SearchParamsSchema } from "#server/services/content-search";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const parsed = SearchParamsSchema.safeParse(getQuery(event));
  if (!parsed.success) {
    throw new ValidationError("Tham số tìm kiếm không hợp lệ.");
  }
  return await listManagerLevelsCatalog(parsed.data);
});
