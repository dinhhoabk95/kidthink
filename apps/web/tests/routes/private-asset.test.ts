import { getPrivateSignedUrl, uploadPrivateAsset } from "@mindkid/storage";
import { createApp, createRouter, toWebHandler } from "h3";
import { beforeAll, describe, expect, it, vi } from "vitest";
import privateAssetHandler from "#server/routes/private/[...path].get";

const SIGNATURE_FIRST_CHAR = /signature=([0-9a-f])/;

const app = createApp();
const router = createRouter();
router.get("/private/**:path", privateAssetHandler);
app.use(router);
const handle = toWebHandler(app);

function signedPathAndQuery(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

async function fetchPath(pathAndQuery: string): Promise<Response> {
  return await handle(new Request(`http://localhost${pathAndQuery}`));
}

describe("GET /private/<path> (BR-IMG-10, BR-IMG-12)", () => {
  beforeAll(() => {
    // BR-IMG-13: trên Cloudflare STORAGE_BASE_URL = SITE_URL, cùng origin với route.
    vi.stubEnv("STORAGE_BASE_URL", "http://localhost:3000");
  });

  const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3]);

  it("serves the uploaded proof bytes for a valid signed URL", async () => {
    await uploadPrivateAsset({
      key: "proofs/route-test.webp",
      body: bytes,
      contentType: "image/webp",
    });
    const { url } = await getPrivateSignedUrl({
      path: "proofs/route-test.webp",
    });
    const res = await fetchPath(signedPathAndQuery(url));
    expect(res.status).toBe(200);
    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual(
      Array.from(bytes)
    );
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(res.headers.get("content-disposition")).toBeNull();
  });

  it("forces attachment for non-image content", async () => {
    await uploadPrivateAsset({
      key: "exports/a.pdf",
      body: bytes,
      contentType: "application/pdf",
    });
    const { url } = await getPrivateSignedUrl({ path: "exports/a.pdf" });
    const res = await fetchPath(signedPathAndQuery(url));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe("attachment");
  });

  it("returns 403 for a tampered signature", async () => {
    await uploadPrivateAsset({
      key: "proofs/tamper.webp",
      body: bytes,
      contentType: "image/webp",
    });
    const { url } = await getPrivateSignedUrl({ path: "proofs/tamper.webp" });
    const pq = signedPathAndQuery(url);
    const tampered = pq.replace(
      SIGNATURE_FIRST_CHAR,
      (_m, c: string) => `signature=${c === "0" ? "1" : "0"}`
    );
    expect((await fetchPath(tampered)).status).toBe(403);
  });

  it("returns 403 when the signature belongs to another path", async () => {
    const { url } = await getPrivateSignedUrl({ path: "proofs/tamper.webp" });
    const other = signedPathAndQuery(url).replace("tamper", "other");
    expect((await fetchPath(other)).status).toBe(403);
  });

  it("returns 403 for an expired URL", async () => {
    await uploadPrivateAsset({
      key: "proofs/expired.webp",
      body: bytes,
      contentType: "image/webp",
    });
    const { url } = await getPrivateSignedUrl({
      path: "proofs/expired.webp",
      expiresInMinutes: -1,
    });
    expect((await fetchPath(signedPathAndQuery(url))).status).toBe(403);
  });

  it("returns 403 for traversal paths and missing query", async () => {
    expect((await fetchPath("/private/..%2Fsecret")).status).toBe(403);
    expect((await fetchPath("/private/proofs/route-test.webp")).status).toBe(
      403
    );
  });

  it("returns 404 for a validly signed but missing object", async () => {
    const { url } = await getPrivateSignedUrl({ path: "proofs/missing.webp" });
    expect((await fetchPath(signedPathAndQuery(url))).status).toBe(404);
  });
});
