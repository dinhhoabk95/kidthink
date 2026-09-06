import { getOwnerDb } from "@mindkid/db";
import { defineEventHandler } from "h3";
import { getOrSetGuestDeviceId } from "#server/utils/auth-runtime";
import { findCompletedLevelCodes } from "#server/utils/concept-intro-runtime";

/**
 * Đường khách trả danh sách mã level mà thiết bị khách này đã hoàn thành.
 * Task #254 (WP254.4) / BR-CIG-08.
 */
export default defineEventHandler(async (event) => {
  const guestDeviceId = getOrSetGuestDeviceId(event);
  const db = getOwnerDb();
  const completedCodes = await findCompletedLevelCodes(db, null, guestDeviceId);

  return {
    completed_level_codes: completedCodes,
  };
});
