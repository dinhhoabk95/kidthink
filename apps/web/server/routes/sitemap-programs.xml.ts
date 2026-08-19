import { requireEnv } from "@mindkid/config";
import { curricula, getOwnerDb } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const siteUrl = requireEnv("SITE_URL");
  const now = new Date().toISOString().split("T")[0];

  let programs: Array<{ code: string; updatedAt: Date | null }> = [];
  try {
    const db = getOwnerDb();
    programs = await db
      .select({
        code: curricula.code,
        updatedAt: curricula.updatedAt,
      })
      .from(curricula)
      .where(eq(curricula.status, "published"));
  } catch (_err) {
    programs = [];
  }

  const programUrls = programs.map(
    (p) => `  <url>
    <loc>${siteUrl}/programs/${p.code}</loc>
    <lastmod>${(p.updatedAt || new Date()).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  );

  const mainUrl = `  <url>
    <loc>${siteUrl}/programs</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

  const allUrlsXml = [mainUrl, ...programUrls].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrlsXml}
</urlset>`;

  return xml.trim();
});
