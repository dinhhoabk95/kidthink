import { canonicalizeRequestPath } from "@mindkid/shared";
import { defineEventHandler, getRequestURL } from "h3";
import {
  assertUserTermsAndPrivacyConsent,
  isAllowedConsentExemptPath,
} from "#server/utils/consent-guard";

export default defineEventHandler(async (event) => {
  const pathname = canonicalizeRequestPath(
    event.path || getRequestURL(event).pathname
  );

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

  const userId = Number(user.user_id);
  await assertUserTermsAndPrivacyConsent(userId);
});
