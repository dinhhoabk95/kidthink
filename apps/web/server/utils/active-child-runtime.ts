import { childProfiles, type getOwnerDb } from "@mindkid/db";
import { NoActiveChildError } from "@mindkid/errors/child";
import { and, eq } from "drizzle-orm";
import { deleteCookie, type H3Event } from "h3";
import { getActiveChildUuid } from "#server/utils/auth-runtime";

type ChildProfileRow = typeof childProfiles.$inferSelect;

/**
 * Hồ sơ trẻ trong cookie `active_child_id`, thuộc đúng user và còn hoạt động
 * (`BR-PEN-02`). Cookie trỏ hồ sơ không hợp lệ thì xoá cookie rồi báo
 * `NO_ACTIVE_CHILD`, giống luồng gợi ý chơi.
 */
export async function requireOwnedActiveChild(
  event: H3Event,
  db: ReturnType<typeof getOwnerDb>,
  userId: number
): Promise<ChildProfileRow> {
  const childUuid = getActiveChildUuid(event);
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, childUuid),
        eq(childProfiles.userId, userId),
        eq(childProfiles.status, "active")
      )
    )
    .limit(1);
  if (!child) {
    deleteCookie(event, "active_child_id", { path: "/" });
    throw new NoActiveChildError(
      "Hồ sơ trẻ không tồn tại hoặc đã bị lưu trữ. Vui lòng chọn lại."
    );
  }
  return child;
}
