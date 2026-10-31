import { defineEventHandler, getRequestHeader, handleCors } from "h3";
import { resolveAllowedOrigins } from "#server/utils/auth-runtime-factory";

const CORS_METHODS = [
  "GET",
  "HEAD",
  "OPTIONS",
  "PUT",
  "PATCH",
  "POST",
  "DELETE",
] as const;

const CORS_ALLOW_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-csrf-token",
] as const;

// Chạy đầu chuỗi middleware để xử lý OPTIONS preflight trước auth/rate-limit
// và không return boolean của handleCors (tránh h3 ghi tiếp body "true" sau
// khi sendNoContent đã đóng response 204).
export default defineEventHandler((event) => {
  const origin = getRequestHeader(event, "origin");
  if (!origin) {
    return;
  }

  handleCors(event, {
    origin: [...resolveAllowedOrigins()],
    credentials: true,
    methods: [...CORS_METHODS],
    allowHeaders: [...CORS_ALLOW_HEADERS],
    preflight: {
      statusCode: 204,
    },
  });
});
