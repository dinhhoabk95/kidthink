import type { OAuthProvider } from "@mindkid/auth";
import { UnauthenticatedError } from "@mindkid/errors/auth";
import { defineApiRoute } from "#server/utils/define-api-route";
import { readOAuthTicketProfile } from "#server/utils/oauth-ticket";

interface SocialTicketResponse {
  readonly provider: OAuthProvider;
  readonly email: string | null;
  readonly display_name: string;
}

export default defineApiRoute({
  auth: "guest",
  handler({ event }): { ticket: SocialTicketResponse } {
    const profile = readOAuthTicketProfile(event);
    if (!profile) {
      throw new UnauthenticatedError(
        "Phiên đăng ký mạng xã hội không hợp lệ hoặc đã hết hạn."
      );
    }

    return {
      ticket: {
        provider: profile.provider,
        email: profile.email_at_provider,
        display_name: profile.display_name_at_provider,
      },
    };
  },
});
