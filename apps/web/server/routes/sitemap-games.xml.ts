import { gameLevels, getOwnerDb } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || "https://mindkid.vn";
  const now = new Date().toISOString().split("T")[0];

  let levels: Array<{ code: string; updatedAt: Date | null }> = [];
  try {
    const db = getOwnerDb();
    levels = await db
      .select({
        code: gameLevels.code,
        updatedAt: gameLevels.updatedAt,
      })
      .from(gameLevels)
      .where(eq(gameLevels.status, "published"));
  } catch (_err) {
    // Fallback if db offline or during static compilation
    levels = [];
  }

  const urlsXml = levels
    .map(
      (lvl) => `  <url>
    <loc>${siteUrl}/games/${lvl.code}</loc>
    <lastmod>${(lvl.updatedAt || new Date()).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml || `  <url><loc>${siteUrl}/games</loc><lastmod>${now}</lastmod></url>`}
</urlset>`;

  return xml.trim();
});
