import type { OAuthProvider } from "@mindkid/auth";
import { defineApiRoute } from "#server/utils/define-api-route";
import { readOAuthTicketProfile } from "#server/utils/oauth-ticket";

interface SocialTicketResponse {
  readonly provider: OAuthProvider;
  readonly email: string | null;
  readonly display_name: string;
}

export default defineApiRoute({
  auth: "guest",
  handler({ event }): { ticket: SocialTicketResponse | null } {
    const profile = readOAuthTicketProfile(event);
    if (!profile) {
      return { ticket: null };
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
