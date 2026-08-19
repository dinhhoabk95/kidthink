import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler((event) => {
  setHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=86400");

  const siteUrl = process.env.SITE_URL || "https://mindkid.vn";

  return `User-agent: *
Disallow: /play/
Disallow: /me/
Disallow: /api/
Sitemap: ${siteUrl}/sitemap.xml
`.trim();
});
