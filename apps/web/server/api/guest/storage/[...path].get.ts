import { getPublicImage } from "@mindkid/storage";
import { createError, defineEventHandler, getRouterParam, setHeader } from "h3";

export default defineEventHandler((event) => {
  const rawPath = getRouterParam(event, "path");
  if (!rawPath) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const normalized = decodeURIComponent(rawPath);
  const found = getPublicImage(normalized);

  if (!found) {
    throw createError({
      statusCode: 404,
      statusMessage: "ASSET_NOT_FOUND",
      message: `Asset at path '${normalized}' not found`,
    });
  }

  setHeader(event, "Content-Type", found.contentType || "image/webp");
  setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");

  return found.body;
});
