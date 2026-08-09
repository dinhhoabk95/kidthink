import { requireUserAuth } from "@kidthink/auth";
import { defineEventHandler } from "h3";
import {
  ensureUserCsrfCookie,
  respondToUserAuthError,
} from "../../../utils/auth-runtime";

export default defineEventHandler((event) => {
  ensureUserCsrfCookie(event);
  try {
    return requireUserAuth(event);
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
