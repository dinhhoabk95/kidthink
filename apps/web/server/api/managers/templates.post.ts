import { createError, defineEventHandler } from "h3";

export default defineEventHandler(() => {
  throw createError({
    statusCode: 405,
    statusMessage: "METHOD_NOT_ALLOWED",
    message:
      "Game templates are Layer 1 code definitions and cannot be created via API (BR-GTC-04)",
  });
});
