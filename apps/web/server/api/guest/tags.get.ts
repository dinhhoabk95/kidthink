import { contentTags, getOwnerDb } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const db = getOwnerDb();
  const activeTags = await db
    .select({
      id: contentTags.id,
      code: contentTags.code,
      axis: contentTags.axis,
      label: contentTags.label,
    })
    .from(contentTags)
    .where(eq(contentTags.status, "active"));

  const grouped = {
    what: activeTags.filter((t) => t.axis === "what"),
    thinking: activeTags.filter((t) => t.axis === "thinking"),
    mechanic: activeTags.filter((t) => t.axis === "mechanic"),
    theme: activeTags.filter((t) => t.axis === "theme"),
  };

  return grouped;
});
