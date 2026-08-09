import { requireManagerAuth } from "@kidthink/auth";
import { defineEventHandler } from "h3";
import {
  ensureManagerCsrfCookie,
  respondToManagerAuthError,
} from "../../../utils/auth-runtime";

export default defineEventHandler((event) => {
  ensureManagerCsrfCookie(event);
  try {
    return requireManagerAuth(event);
  } catch (error) {
    return respondToManagerAuthError(event, error);
  }
});
