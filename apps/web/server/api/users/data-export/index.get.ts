import { defineEventHandler, setHeader } from "h3";
import { exportUserPersonalData } from "#server/services/account-lifecycle-service";
import {
  enforceTwoAxisRateLimit,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  requireReauth(event);
  await enforceTwoAxisRateLimit(event, "export:data", String(userId));

  const payload = await exportUserPersonalData(userId);

  setHeader(event, "Content-Type", "application/json");
  setHeader(
    event,
    "Content-Disposition",
    'attachment; filename="mindkid-data-export.json"'
  );

  return payload;
});
