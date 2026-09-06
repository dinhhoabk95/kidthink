import { NotFoundError } from "@mindkid/errors/common";
import { getPublicImage } from "@mindkid/storage";
import { defineEventHandler, getRouterParam, setHeader } from "h3";

export default defineEventHandler((event) => {
  const rawPath = getRouterParam(event, "path");
  if (!rawPath) {
    throw new NotFoundError();
  }

  const normalized = decodeURIComponent(rawPath);
  const found = getPublicImage(normalized);

  if (!found) {
    throw new NotFoundError("Không tìm thấy tệp tin được yêu cầu.");
  }

  setHeader(event, "Content-Type", found.contentType || "image/webp");
  setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");

  return found.body;
});
