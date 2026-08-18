import { defineEventHandler, readBody } from "h3";
import { z } from "zod";

const schema = z.object({ title: z.string().min(1) });

export default defineEventHandler(async (event) => {
  const parsed = schema.safeParse(await readBody(event));
  return { ok: parsed.success };
});
