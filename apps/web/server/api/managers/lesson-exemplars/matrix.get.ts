import { LessonExemplarService } from "@mindkid/db";
import { defineEventHandler } from "h3";
import { requireSuperAdminAuth } from "../../../../utils/auth.ts";

export default defineEventHandler(async (event) => {
  requireSuperAdminAuth(event);
  const matrix = await LessonExemplarService.getExemplarMatrix();
  return {
    success: true,
    data: matrix,
  };
});
