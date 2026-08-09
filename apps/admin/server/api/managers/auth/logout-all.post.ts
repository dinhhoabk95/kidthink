import { requireManagerAuth } from "@kidthink/auth";
import { defineEventHandler, setResponseStatus } from "h3";
import {
  clearManagerAuthCookies,
  getManagerRefreshService,
  respondToManagerAuthError,
  validateManagerCsrf,
} from "../../../utils/auth-runtime";

export default defineEventHandler(async (event) => {
  try {
    validateManagerCsrf(event);
    const manager = requireManagerAuth(event);
    await getManagerRefreshService(event).logoutAll(
      "manager",
      manager.manager_id
    );
    clearManagerAuthCookies(event);
    setResponseStatus(event, 204);
    return null;
  } catch (error) {
    return respondToManagerAuthError(event, error);
  }
});
