import { defineEventHandler, readBody } from "h3";

// Fixture ca âm cho lint:route-validation — đọc body, KHÔNG parse.
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  return { received: body };
});
