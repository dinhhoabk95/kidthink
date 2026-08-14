import { INDEXABLE_AGE_BANDS } from "@kidthink/shared";
import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler((event) => {
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || "https://kidthink.vn";
  const now = new Date().toISOString().split("T")[0];

  const urlsXml = INDEXABLE_AGE_BANDS.map(
    (band) => `  <url>
    <loc>${siteUrl}/games?age_band=${band}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  return xml.trim();
});
