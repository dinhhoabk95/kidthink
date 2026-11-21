import type { H3Event } from "h3";
import {
  requireBetterAuthUser,
  revokeAllBetterAuthSessions,
  revokeOtherBetterAuthSessions,
} from "./better-auth.js";

export async function revokeOtherUserSessions(event: H3Event): Promise<void> {
  const user = await requireBetterAuthUser(event);
  await revokeOtherBetterAuthSessions("user", user.user_id, user.session_id);
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  await revokeAllBetterAuthSessions("user", userId);
}
