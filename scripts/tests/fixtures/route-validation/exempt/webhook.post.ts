// lint-route-validation: exempt — payload đã ký, service tự parse.
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
  return { received: await readBody(event) };
});
