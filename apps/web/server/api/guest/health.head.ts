import { defineEventHandler, setHeader, setResponseStatus } from "h3";

/** BR-HLT-07: HEAD liveness nông, 200 không body. */
export default defineEventHandler((event) => {
  setHeader(event, "Cache-Control", "no-store");
  setResponseStatus(event, 200);
  return null;
});
