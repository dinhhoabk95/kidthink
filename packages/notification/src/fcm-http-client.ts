import type { FcmAdminMessaging } from "#src/fcm-driver";

export interface FcmServiceAccountConfig {
  readonly projectId: string;
  readonly clientEmail: string;
  readonly privateKeyPem: string;
  readonly fetchFn?: typeof fetch;
}

function toBase64Url(input: string | Uint8Array): string {
  const buf =
    typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.from(input);
  return buf.toString("base64url");
}

function pemToDerArrayBuffer(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");
  const buf = Buffer.from(clean, "base64");
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return ab;
}

async function signServiceAccountJwt(
  clientEmail: string,
  privateKeyPem: string,
  nowEpochSeconds: number
): Promise<string> {
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowEpochSeconds,
      exp: nowEpochSeconds + 3600,
    })
  );
  const signingInput = `${header}.${payload}`;
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "pkcs8",
    pemToDerArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await globalThis.crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${toBase64Url(new Uint8Array(sig))}`;
}

/**
 * FCM HTTP v1 Client dùng WebCrypto RS256 thuần khiết (0 phụ thuộc `firebase-admin` gRPC),
 * chạy đồng nhất trên cả Cloudflare Workers Free và Node.js VPS.
 */
export function createFcmHttpV1Messaging(
  config: FcmServiceAccountConfig
): FcmAdminMessaging {
  let cachedAccessToken: { token: string; expiresAtMs: number } | undefined;
  const fetchImpl = config.fetchFn ?? fetch;

  async function getAccessToken(): Promise<string> {
    if (
      cachedAccessToken &&
      cachedAccessToken.expiresAtMs - 60_000 > Date.now()
    ) {
      return cachedAccessToken.token;
    }
    const jwt = await signServiceAccountJwt(
      config.clientEmail,
      config.privateKeyPem,
      Math.floor(Date.now() / 1000)
    );
    const tokenRes = await fetchImpl("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });
    if (!tokenRes.ok) {
      throw new Error(`FCM OAuth2 token exchange failed: ${tokenRes.status}`);
    }
    const tokenBody = (await tokenRes.json()) as {
      access_token: string;
      expires_in: number;
    };
    cachedAccessToken = {
      token: tokenBody.access_token,
      expiresAtMs: Date.now() + tokenBody.expires_in * 1000,
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
        const errText = await res.text();
        throw new Error(`FCM HTTP v1 send failed (${res.status}): ${errText}`);
      }
      const body = (await res.json()) as { name?: string };
      return body.name ?? `fcm-${Date.now()}`;
    },
  };
}
