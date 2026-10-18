import {
  decodeOAuthTicket,
  encodeOAuthTicket,
  type NormalizedProfile,
  OAUTH_TICKET_COOKIE_NAME,
  OAUTH_TICKET_TTL_SECONDS,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import { deleteCookie, getCookie, type H3Event, setCookie } from "h3";

function getTicketSecret(): string {
  return requireEnv("NUXT_SESSION_PASSWORD");
}

/** Đặt vé đăng ký MXH: đã ký HMAC, hạn 10 phút (UC-028, R3 G1). */
export function issueOAuthTicketCookie(
  event: H3Event,
  profile: NormalizedProfile,
  now: number = Date.now()
): void {
  setCookie(
    event,
    OAUTH_TICKET_COOKIE_NAME,
    encodeOAuthTicket({ profile, created_at: now }, getTicketSecret()),
    {
      httpOnly: true,
      maxAge: OAUTH_TICKET_TTL_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    }
  );
}

/** Đọc vé; trả null nếu thiếu, sai chữ ký, quá hạn hoặc sai cấu trúc. */
export function readOAuthTicketProfile(
  event: H3Event
): NormalizedProfile | null {
  const cookie = getCookie(event, OAUTH_TICKET_COOKIE_NAME);
  if (!cookie) {
    return null;
  }
  return decodeOAuthTicket(cookie, getTicketSecret())?.profile ?? null;
}

export function clearOAuthTicketCookie(event: H3Event): void {
  deleteCookie(event, OAUTH_TICKET_COOKIE_NAME, { path: "/" });
}
