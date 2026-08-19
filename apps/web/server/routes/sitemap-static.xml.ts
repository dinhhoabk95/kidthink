import { LEGAL_DOCUMENTS } from "@mindkid/shared";
import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler((event) => {
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const siteUrl = process.env.SITE_URL || "https://mindkid.vn";
  const now = new Date().toISOString().split("T")[0];

  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/games", priority: "0.9", changefreq: "daily" },
    { path: "/faq", priority: "0.7", changefreq: "weekly" },
    { path: "/guide", priority: "0.7", changefreq: "weekly" },
    ...LEGAL_DOCUMENTS.map((doc) => ({
      path: `/${doc.slug}`,
      priority: "0.5",
      changefreq: "monthly",
    })),
  ];

  const urlsXml = staticPages
    .map(
      (page) => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  return xml.trim();
});
