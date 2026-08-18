import { AppError } from "@mindkid/auth";
import {
  createError,
  defineEventHandler,
  getRequestURL,
  setResponseStatus,
} from "h3";
import {
  assertUserTermsAndPrivacyConsent,
  isAllowedConsentExemptPath,
} from "../utils/consent-guard.js";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname;

  // Only gate user api routes
  if (!pathname.startsWith("/api/users/")) {
    return;
  }

  // Exempt data-rights / auth routes per closed allow-list (D-QX)
  if (isAllowedConsentExemptPath(pathname)) {
    return;
  }

  const user = event.context.user as { user_id?: number | string } | undefined;
  if (!user?.user_id) {
    return;
  }

  try {
    const userId = Number(user.user_id);
    await assertUserTermsAndPrivacyConsent(userId);
  } catch (err: unknown) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: err.toResponse(),
      });
    }
    throw err;
  }
});
