import {
  CHILD_STATUS,
  type ChildProfileEntity,
  type OwnerDb,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { NoActiveChildError } from "@mindkid/errors/child";
import { deleteCookie, type H3Event } from "h3";
import { getActiveChildUuid } from "#server/utils/auth-runtime";
import { requireCurrentConsent } from "#server/utils/consent-guard";
import { useOwnerRepositories } from "#server/utils/repositories";

/**
 * Hồ sơ trẻ trong cookie `active_child_id`, thuộc đúng user và còn hoạt động
 * (`BR-PEN-02`). Cookie trỏ hồ sơ không hợp lệ thì xoá cookie rồi báo
 * `NO_ACTIVE_CHILD`, giống luồng gợi ý chơi.
 */
export async function requireOwnedActiveChild(
  event: H3Event,
  userId: number
): Promise<ChildProfileEntity>;
export async function requireOwnedActiveChild(
  event: H3Event,
  db: OwnerDb,
  userId: number
): Promise<ChildProfileEntity>;
export async function requireOwnedActiveChild(
  event: H3Event,
  dbOrUserId: OwnerDb | number,
  maybeUserId?: number
): Promise<ChildProfileEntity> {
  const userId =
    typeof dbOrUserId === "number" ? dbOrUserId : (maybeUserId as number);
  const childUuid = getActiveChildUuid(event);
  await requireCurrentConsent(userId, "child_data");
  const { childProfiles } =
    typeof dbOrUserId === "number"
      ? useOwnerRepositories()
      : createRepositories(dbOrUserId);

  const child = await childProfiles.findByUuidForUser(childUuid, userId);

  if (child?.status !== CHILD_STATUS.ACTIVE) {
    deleteCookie(event, "active_child_id", { path: "/" });
    throw new NoActiveChildError(
      "Hồ sơ trẻ không tồn tại hoặc đã bị lưu trữ. Vui lòng chọn lại."
    );
  }
  return child;
}
