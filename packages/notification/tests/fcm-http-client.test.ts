import { describe, expect, it, vi } from "vitest";
import { classifyFcmError, sendFcmWebPush } from "#src/fcm-driver";
import {
  createFcmHttpV1Messaging,
  signServiceAccountJwt,
} from "#src/fcm-http-client";
import { FcmSendError } from "#src/fcm-types";

interface TestKeys {
  readonly pem: string;
  readonly publicKey: CryptoKey;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function fromBase64Url(input: string): Uint8Array<ArrayBuffer> {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function makeKeys(): Promise<TestKeys> {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );
  const der = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey)
  );
  const body =
    toBase64(der)
      .match(/.{1,64}/g)
      ?.join("\n") ?? "";
  return {
    pem: `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`,
    publicKey: pair.publicKey,
  };
}

const CLIENT_EMAIL = "svc@test-project.iam.gserviceaccount.com";
const DEVICE_TOKEN = "device-token-SECRET-xyz";

function oauthOk(): Response {
  return new Response(
    JSON.stringify({ access_token: "ya29.ACCESS-SECRET", expires_in: 3600 }),
    { status: 200 }
  );
}

function fcmErr(status: number, errorCode: string, grpc: string): Response {
  return new Response(
    JSON.stringify({
      error: { status: grpc, details: [{ errorCode }] },
    }),
    { status }
  );
}

describe("signServiceAccountJwt (BR-BPS-10)", () => {
  it("tạo JWT RS256 mà public key xác minh được", async () => {
    const keys = await makeKeys();
    const jwt = await signServiceAccountJwt(
      CLIENT_EMAIL,
      keys.pem,
      1_700_000_000
    );
    const [h, p, sig] = jwt.split(".");
    expect(h && p && sig).toBeTruthy();
    const header = JSON.parse(new TextDecoder().decode(fromBase64Url(h ?? "")));
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(p ?? "")));
    expect(header).toEqual({ alg: "RS256", typ: "JWT" });
    expect(claims).toMatchObject({
      iss: CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      keys.publicKey,
      fromBase64Url(sig ?? ""),
      new TextEncoder().encode(`${h}.${p}`)
    );
    expect(ok).toBe(true);
  });

  it("chấp nhận PEM với `\\n` literal (secret một dòng)", async () => {
    const keys = await makeKeys();
    const oneLine = keys.pem.trim().replace(/\n/g, "\\n");
    await expect(
      signServiceAccountJwt(CLIENT_EMAIL, oneLine, 1)
    ).resolves.toContain(".");
  });
});

describe("createFcmHttpV1Messaging", () => {
  it("gửi thành công, đổi access token một lần rồi cache (BR-BPS-10)", async () => {
    const keys = await makeKeys();
    let nowMs = 1_000_000;
    const fetchFn = vi.fn<typeof fetch>((input) => {
      const url = String(input);
      if (url === "https://oauth2.googleapis.com/token") {
        return Promise.resolve(oauthOk());
      }
      return Promise.resolve(
        new Response(JSON.stringify({ name: "projects/p/messages/1" }), {
          status: 200,
        })
      );
    });
    const messaging = createFcmHttpV1Messaging({
      projectId: "proj-1",
      clientEmail: CLIENT_EMAIL,
      privateKeyPem: keys.pem,
      fetchFn,
      nowMs: () => nowMs,
    });

    const id = await messaging.send({ token: DEVICE_TOKEN, data: { a: "b" } });
    expect(id).toBe("projects/p/messages/1");
    await messaging.send({ token: DEVICE_TOKEN });

    const urls = fetchFn.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.includes("oauth2"))).toHaveLength(1);
    expect(urls).toContain(
      "https://fcm.googleapis.com/v1/projects/proj-1/messages:send"
    );
    const sendCall = fetchFn.mock.calls.find((c) =>
      String(c[0]).includes("fcm.googleapis.com")
    );
    expect(sendCall?.[1]?.headers).toMatchObject({
      authorization: "Bearer ya29.ACCESS-SECRET",
    });

    // Còn < 60s đến hạn → đổi lại token.
    nowMs += 3600 * 1000 - 30_000;
    await messaging.send({ token: DEVICE_TOKEN });
    expect(
      fetchFn.mock.calls.filter((c) => String(c[0]).includes("oauth2"))
    ).toHaveLength(2);
  });

  it("404 UNREGISTERED → invalid terminal (BR-BPS-12)", async () => {
    const keys = await makeKeys();
    const fetchFn = vi.fn<typeof fetch>((input) =>
      Promise.resolve(
        String(input).includes("oauth2")
          ? oauthOk()
          : fcmErr(404, "UNREGISTERED", "NOT_FOUND")
      )
    );
    const messaging = createFcmHttpV1Messaging({
      projectId: "p",
      clientEmail: CLIENT_EMAIL,
      privateKeyPem: keys.pem,
      fetchFn,
    });
    const result = await sendFcmWebPush(messaging, DEVICE_TOKEN, {
      notificationId: 1,
      title: "t",
      body: "b",
      actionUrl: "/me",
    });
    expect(result).toMatchObject({
      success: false,
      status: "invalid",
      terminal: true,
    });
  });

  it("400 INVALID_ARGUMENT → invalid; 503 → retryable; 403 → non-retryable (BR-BPS-12)", () => {
    expect(
      classifyFcmError(new FcmSendError(400, "INVALID_ARGUMENT"))
    ).toMatchObject({ status: "invalid", terminal: true });
    expect(
      classifyFcmError(new FcmSendError(503, "UNAVAILABLE"))
    ).toMatchObject({ status: "failed", terminal: false });
    expect(
      classifyFcmError(new FcmSendError(429, "QUOTA_EXCEEDED"))
    ).toMatchObject({ status: "failed", terminal: false });
    expect(
      classifyFcmError(new FcmSendError(403, "SENDER_ID_MISMATCH"))
    ).toMatchObject({ status: "failed", terminal: true });
    expect(classifyFcmError(new Error("socket hang up"))).toMatchObject({
      status: "failed",
      terminal: false,
    });
  });

  it("401 xoá cache access token để lần sau đổi lại", async () => {
    const keys = await makeKeys();
    let sends = 0;
    const fetchFn = vi.fn<typeof fetch>((input) => {
      if (String(input).includes("oauth2")) {
        return Promise.resolve(oauthOk());
      }
      sends += 1;
      return Promise.resolve(
        sends === 1
          ? fcmErr(401, "UNAUTHENTICATED", "UNAUTHENTICATED")
          : new Response(JSON.stringify({ name: "n" }), { status: 200 })
      );
    });
    const messaging = createFcmHttpV1Messaging({
      projectId: "p",
      clientEmail: CLIENT_EMAIL,
      privateKeyPem: keys.pem,
      fetchFn,
    });
    await expect(
      messaging.send({ token: DEVICE_TOKEN })
    ).rejects.toBeInstanceOf(FcmSendError);
    await messaging.send({ token: DEVICE_TOKEN });
    expect(
      fetchFn.mock.calls.filter((c) => String(c[0]).includes("oauth2"))
    ).toHaveLength(2);
  });

  it("lỗi và log không chứa token thiết bị, access token hay private key (BR-BPS-13)", async () => {
    const keys = await makeKeys();
    const spies = [
      vi.spyOn(console, "log"),
      vi.spyOn(console, "info"),
      vi.spyOn(console, "warn"),
      vi.spyOn(console, "error"),
    ];
    const fetchFn = vi.fn<typeof fetch>((input) =>
      Promise.resolve(
        String(input).includes("oauth2")
          ? oauthOk()
          : new Response(`boom ${DEVICE_TOKEN} ya29.ACCESS-SECRET`, {
              status: 500,
            })
      )
    );
    const messaging = createFcmHttpV1Messaging({
      projectId: "p",
      clientEmail: CLIENT_EMAIL,
      privateKeyPem: keys.pem,
      fetchFn,
    });
    const result = await sendFcmWebPush(messaging, DEVICE_TOKEN, {
      notificationId: 1,
      title: "t",
      body: "b",
      actionUrl: "/me",
    });
    const dump = JSON.stringify([
      result,
      ...spies.flatMap((s) => s.mock.calls),
    ]);
    expect(dump).not.toContain(DEVICE_TOKEN);
    expect(dump).not.toContain("ACCESS-SECRET");
    expect(dump).not.toContain("BEGIN PRIVATE KEY");
    expect(result).toMatchObject({ status: "failed", terminal: false });
    for (const s of spies) {
      s.mockRestore();
    }
  });
});
