import {
  readPrivateAsset,
  sanitizeRelativeStoragePath,
  storage,
} from "@mindkid/storage";
import {
  defineEventHandler,
  getQuery,
  getRouterParam,
  send,
  setResponseHeaders,
  setResponseStatus,
} from "h3";

/**
 * Đọc tệp private (chứng từ, PDF) qua URL ký — `BR-IMG-10`, `BR-IMG-12`.
 * Route ngoài `/api/*`: không dùng body lỗi `/api`, chỉ trả mã trạng thái.
 */
const NON_NEGATIVE_INT = /^\d+$/;
const INLINE_IMAGE_TYPE = /^image\/(?!svg)/;

function firstQueryValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function isSafePath(rawPath: string): boolean {
  if (rawPath.length === 0) {
    return false;
  }
  try {
    sanitizeRelativeStoragePath(rawPath);
    return true;
  } catch {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  const rawPath = getRouterParam(event, "path", { decode: true }) ?? "";
  const query = getQuery<{ expires?: string; signature?: string }>(event);
  const expiresRaw = firstQueryValue(query.expires);
  const signature = firstQueryValue(query.signature);

  const signedOk =
    isSafePath(rawPath) &&
    NON_NEGATIVE_INT.test(expiresRaw) &&
    storage.verifySignedUrlToken(rawPath, Number(expiresRaw), signature);

  setResponseHeaders(event, {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });

  if (!signedOk) {
    setResponseStatus(event, 403);
    return await send(event, "", "text/plain");
  }

  const asset = await readPrivateAsset(rawPath);
  if (!asset) {
    setResponseStatus(event, 404);
    return await send(event, "", "text/plain");
  }

  if (!INLINE_IMAGE_TYPE.test(asset.contentType)) {
    setResponseHeaders(event, { "Content-Disposition": "attachment" });
  }
  return await send(event, Buffer.from(asset.body), asset.contentType);
});
