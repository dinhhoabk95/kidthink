import {
  isOAuthProvider,
  type NormalizedProfile,
  type OAuthProvider,
} from "@mindkid/auth";
import { UnauthenticatedError } from "@mindkid/errors/auth";
import { getCookie, type H3Event } from "h3";
import { OAUTH_TICKET_COOKIE_NAME } from "#server/api/guest/auth/oauth/[provider]/callback.get";
import { defineApiRoute } from "#server/utils/define-api-route";

interface SocialTicketPayload {
  readonly profile: NormalizedProfile;
  readonly created_at: number;
}

interface SocialTicketResponse {
  readonly provider: OAuthProvider;
  readonly email: string | null;
  readonly display_name: string;
}

function parseTicketFromCookie(event: H3Event): SocialTicketPayload | null {
  const ticketCookie = getCookie(event, OAUTH_TICKET_COOKIE_NAME);
  if (!ticketCookie) {
    return null;
  }

  try {
    const raw = Buffer.from(ticketCookie, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as Partial<SocialTicketPayload>;
    if (
      parsed.profile &&
      typeof parsed.profile.provider === "string" &&
      isOAuthProvider(parsed.profile.provider) &&
      typeof parsed.created_at === "number"
    ) {
      return parsed as SocialTicketPayload;
    }
  } catch {
    return null;
  }

  return null;
}

export default defineApiRoute({
  auth: "guest",
  handler({ event }): { ticket: SocialTicketResponse } {
    const payload = parseTicketFromCookie(event);
    if (!payload) {
      throw new UnauthenticatedError(
        "Phiên đăng ký mạng xã hội không hợp lệ hoặc đã hết hạn."
      );
    }

    return {
      ticket: {
        provider: payload.profile.provider,
        email: payload.profile.email_at_provider,
        display_name: payload.profile.display_name_at_provider,
      },
    };
  },
});
