import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  if (event.context.manager) {
    await requireManagerSession(event);
  }
  throw new ValidationError(
    "Game templates are Layer 1 code definitions and cannot be created via API (BR-GTC-04)"
  );
});
