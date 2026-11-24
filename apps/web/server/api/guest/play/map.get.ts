import { defineEventHandler } from "h3";
import { listGuestCompletedPlayMap } from "#server/services/catalog-service";
import { getOrSetGuestDeviceId } from "#server/utils/auth-runtime";

/**
 * Đường khách trả danh sách mã level mà thiết bị khách này đã hoàn thành.
 * BR-CIG-08.
 */
export default defineEventHandler(async (event) => {
  const guestDeviceId = getOrSetGuestDeviceId(event);
  const completedCodes = await listGuestCompletedPlayMap(guestDeviceId);

  return {
    completed_level_codes: completedCodes,
  };
});
