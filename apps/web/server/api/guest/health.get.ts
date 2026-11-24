import { defineEventHandler, setHeader } from "h3";

/**
 * BR-HLT-07: probe công khai chỉ trả liveness nông — không chạm D1, DO auth hay queue DO.
 * Kiểm sâu nằm ở `/api/guest/health/deep` sau `x-health-token`.
 */
export default defineEventHandler((event) => {
  setHeader(event, "Cache-Control", "no-store");
  return { status: "ok" };
});
