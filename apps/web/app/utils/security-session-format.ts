export interface SecuritySessionItem {
  id: string;
  token?: string;
  userAgent?: string | null;
  deviceLabel?: string | null;
  device_label?: string | null;
  ipAddress?: string | null;
  ip_address?: string | null;
  locationLabel?: string | null;
  location_label?: string | null;
  authMethod?: string | null;
  auth_method?: string | null;
  updatedAt?: string | Date | null;
  lastUsedAt?: string | null;
  last_used_at?: string | null;
  createdAt?: string | Date | null;
  created_at?: string | null;
  isCurrent?: boolean;
  is_current?: boolean;
}

const IPV4_FULL_REGEX = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/;
const BROWSER_MATCHERS: readonly [string, string][] = [
  ["Edg/", "Edge"],
  ["Chrome/", "Chrome"],
  ["Firefox/", "Firefox"],
  ["Safari/", "Safari"],
];
const OS_MATCHERS: readonly [string, string][] = [
  ["Android", "Android"],
  ["iPhone", "iOS"],
  ["iPad", "iOS"],
  ["Mac OS", "macOS"],
  ["Windows", "Windows"],
  ["Linux", "Linux"],
];

export function formatSecurityDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function isCurrentSecuritySession(sess: SecuritySessionItem): boolean {
  return Boolean(sess.isCurrent ?? sess.is_current);
}

export function formatSecurityAuthMethod(sess: SecuritySessionItem): string {
  const raw = (sess.authMethod ?? sess.auth_method ?? "password")
    .toLowerCase()
    .trim();
  if (raw === "google") {
    return "Google";
  }
  if (raw === "facebook") {
    return "Facebook";
  }
  if (raw === "social") {
    return "Mạng xã hội";
  }
  if (raw === "passkey") {
    return "Passkey";
  }
  return "Mật khẩu";
}

function matchToken(
  raw: string,
  pairs: readonly [string, string][],
  fallback: string
): string {
  const hit = pairs.find(([token]) => raw.includes(token));
  return hit ? hit[1] : fallback;
}

export function formatSecurityDeviceLabel(sess: SecuritySessionItem): string {
  const raw = (
    sess.deviceLabel ??
    sess.device_label ??
    sess.userAgent ??
    ""
  ).trim();
  if (!raw) {
    return "Trình duyệt web";
  }
  if (!raw.includes("Mozilla/")) {
    return raw;
  }
  const browser = matchToken(raw, BROWSER_MATCHERS, "Trình duyệt");
  const os = matchToken(raw, OS_MATCHERS, "Thiết bị");
  return `${browser} trên ${os}`;
}

export function formatSecurityLocation(sess: SecuritySessionItem): string {
  const loc = (sess.locationLabel ?? sess.location_label ?? "").trim();
  if (loc) {
    return loc;
  }
  const ip = (sess.ipAddress ?? sess.ip_address ?? "").trim();
  if (!ip) {
    return "Không xác định";
  }
  const match = IPV4_FULL_REGEX.exec(ip);
  if (match) {
    return `${match[1]}.${match[2]}.x.x`;
  }
  return ip.includes(":") ? "Mạng IPv6" : ip;
}
