import { curricula, getOwnerDb, writeAudit } from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const session = await requireManagerSession(event);
    const code = getRouterParam(event, "code");
    const versionParam = getRouterParam(event, "version");
    const version = Number(versionParam) || 1;

    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: "BAD_REQUEST",
        message: "Thiếu tham số mã chương trình",
      });
    }

    const db = getOwnerDb();
    const managerId = session.manager_id || session.id || 1;

    const [curr] = await db
      .select()
      .from(curricula)
      .where(
        and(eq(curricula.code, code), eq(curricula.contentVersion, version))
      );

    if (!curr) {
      throw createError({
        statusCode: 404,
        statusMessage: "CURRICULUM_NOT_FOUND",
        message: `Không tìm thấy chương trình ${code} version ${version}`,
      });
    }

    if (curr.status !== "draft") {
      throw createError({
        statusCode: 409,
        statusMessage: "CANNOT_DELETE_NON_DRAFT",
        message: `Chỉ được xoá chương trình ở trạng thái draft (trạng thái hiện tại: ${curr.status})`,
      });
    }

    await db.delete(curricula).where(eq(curricula.id, curr.id));

    await writeAudit(db, {
      action: "content_deleted",
      actor_type: "manager",
      actor_id: managerId,
      entity_type: "curriculum",
      entity_id: String(curr.id),
      reason: "Manager deleted draft curriculum",
      before_data: {
        code: curr.code,
        version: curr.contentVersion,
        title: curr.titleVi,
      },
    });

    return { ok: true };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
