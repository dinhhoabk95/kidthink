import { isCloudflareRuntime, requireEnv } from "@mindkid/config";

const TRAILING_SLASHES = /\/+$/;
const DEV_SITE_URL = "http://localhost:3000";

/**
 * BR-ENV-17: origin công khai của site. Production/Cloudflare thiếu `SITE_URL` thì ném
 * lỗi rõ ràng thay vì lặng lẽ phát link `http://localhost:3000` (email xác thực, OAuth
 * callback, trusted origin). Chỉ dev/test mới được fallback localhost.
 */
export function resolveSiteUrl(): string {
  const configured = process.env.SITE_URL?.trim();
  if (configured) {
    return configured.replace(TRAILING_SLASHES, "");
  }
  if (isCloudflareRuntime() || process.env.NODE_ENV === "production") {
    return requireEnv("SITE_URL").replace(TRAILING_SLASHES, "");
  }
  return DEV_SITE_URL;
}
