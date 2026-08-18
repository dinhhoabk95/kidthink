import { requireManagerAuth } from "@mindkid/auth";
import { defineEventHandler } from "h3";
import { ensureManagerCsrfCookie } from "../../../utils/auth-runtime";

export default defineEventHandler((event) => {
  ensureManagerCsrfCookie(event);
  return requireManagerAuth(event);
});
