import { writeAudit } from "@mindkid/audit";
import { curricula, getOwnerDb } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { ContentImmutableError } from "@mindkid/errors/content";
import { CurriculumNotFoundError } from "@mindkid/errors/curriculum";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");
  const version = Number(versionParam) || 1;

  if (!code) {
    throw new ValidationError("Thiếu tham số mã chương trình");
  }

  const db = getOwnerDb();
  const managerId = session.manager_id;

  const [curr] = await db
    .select()
    .from(curricula)
    .where(
      and(eq(curricula.code, code), eq(curricula.contentVersion, version))
    );

  if (!curr) {
    throw new CurriculumNotFoundError(
      `Không tìm thấy chương trình ${code} version ${version}`
    );
  }

  if (curr.status !== "draft") {
    throw new ContentImmutableError(
      `Chỉ được xoá chương trình ở trạng thái draft (trạng thái hiện tại: ${curr.status})`
    );
  }

  await db.delete(curricula).where(eq(curricula.id, curr.id));

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      action: "content_deleted",
      actor_type: "manager",
      actor_id: managerId,
      entity_type: "curriculum",
      entity_id: String(curr.id),
      reason: "Manager deleted draft curriculum",
      before_data: {
        code: curr.code,
        version: curr.contentVersion,
        title: curr.title,
      },
    });
  });

  return { ok: true, success: true };
});
