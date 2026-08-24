import { LessonExemplarService } from "@mindkid/db";
import { defineEventHandler } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);
  const matrix = await LessonExemplarService.getExemplarMatrix();
  return {
    success: true,
    data: matrix,
  };
});
