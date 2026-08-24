import { defineEventHandler } from "h3";
import {
  ensureManagerCsrfCookie,
  requireManagerSession,
} from "#server/utils/admin-auth-runtime";

export default defineEventHandler((event) => {
  const manager = requireManagerSession(event);
  const csrfToken = ensureManagerCsrfCookie(event);

  return {
    manager,
    csrf_token: csrfToken,
  };
});
