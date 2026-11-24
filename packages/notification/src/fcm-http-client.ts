import { type FcmAdminMessaging, FcmSendError } from "#src/fcm-types";

export interface FcmServiceAccountConfig {
  readonly projectId: string;
  readonly clientEmail: string;
  readonly privateKeyPem: string;
  readonly fetchFn?: typeof fetch;
  /** Đồng hồ tiêm được để test; mặc định `Date.now`. */
  readonly nowMs?: () => number;
}

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_EXPIRY_SKEW_MS = 60_000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/[=]+$/g, "");
}

function textToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

function pemToDer(pem: string): Uint8Array<ArrayBuffer> {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");
  const binary = atob(clean);
  const der = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) {
    der[i] = binary.charCodeAt(i);
  }
  return der;
}

/** Ký JWT service account RS256 bằng WebCrypto (`BR-BPS-10`). */
export async function signServiceAccountJwt(
  clientEmail: string,
  privateKeyPem: string,
  nowEpochSeconds: number
): Promise<string> {
  const header = textToBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = textToBase64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: FCM_SCOPE,
      aud: OAUTH_TOKEN_URL,
      iat: nowEpochSeconds,
      exp: nowEpochSeconds + 3600,
    })
  );
  const signingInput = `${header}.${payload}`;
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

interface OAuthTokenBody {
  access_token?: string;
  expires_in?: number;
}

interface FcmErrorBody {
  error?: {
    status?: string;
    details?: ReadonlyArray<{ errorCode?: string }>;
  };
}

interface FcmSuccessBody {
  name?: string;
}

async function readFcmErrorCode(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body: FcmErrorBody = JSON.parse(text);
    const detailCode = body.error?.details?.find((d) => d.errorCode)?.errorCode;
    return detailCode ?? body.error?.status ?? "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

/**
 * FCM HTTP v1 client: `fetch` + WebCrypto RS256, không `firebase-admin`, không API
 * chỉ có ở Node — chạy đồng nhất trên workerd và Node dev (`BR-BPS-10`).
 */
export function createFcmHttpV1Messaging(
  config: FcmServiceAccountConfig
): FcmAdminMessaging {
  let cachedAccessToken: { token: string; expiresAtMs: number } | undefined;
  const fetchImpl = config.fetchFn ?? fetch;
  const now = config.nowMs ?? Date.now;

  async function getAccessToken(): Promise<string> {
    if (
      cachedAccessToken &&
      cachedAccessToken.expiresAtMs - TOKEN_EXPIRY_SKEW_MS > now()
    ) {
      return cachedAccessToken.token;
    }
    const jwt = await signServiceAccountJwt(
      config.clientEmail,
      config.privateKeyPem,
      Math.floor(now() / 1000)
    );
    const tokenRes = await fetchImpl(OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });
    if (!tokenRes.ok) {
      // 5xx/429 từ OAuth là tạm thời; 4xx (invalid_grant…) là cấu hình sai nhưng vẫn
      // báo như 401 để queue thử lại sau khi người vận hành sửa secret.
      throw new FcmSendError(
        tokenRes.status >= 500 || tokenRes.status === 429
          ? tokenRes.status
          : 401,
        "OAUTH_TOKEN_EXCHANGE_FAILED"
      );
    }
    const tokenBody: OAuthTokenBody = await tokenRes.json();
    if (!tokenBody.access_token || typeof tokenBody.expires_in !== "number") {
      throw new FcmSendError(502, "OAUTH_TOKEN_MALFORMED");
    }
    cachedAccessToken = {
      token: tokenBody.access_token,
      expiresAtMs: now() + tokenBody.expires_in * 1000,
    };
    return cachedAccessToken.token;
  }

  return {
    async send(message): Promise<string> {
      const accessToken = await getAccessToken();
      const url = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/messages:send`;
      const res = await fetchImpl(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: message.token,
            notification: message.notification,
            data: message.data,
          },
        }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          cachedAccessToken = undefined;
        }
        throw new FcmSendError(res.status, await readFcmErrorCode(res));
      }
      const body: FcmSuccessBody = await res.json();
      return body.name ?? `fcm-${now()}`;
    },
  };
}
