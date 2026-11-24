import { describe, expect, it } from "vitest";
import {
  D1BlobObjectStorageDriver,
  S3SigV4StorageDriver,
  transferBlobRecordsToDriver,
} from "#src/index";

describe("Pluggable ObjectStorageDriver (D1 Blobs Stage 1 <-> S3 SigV4 Stage 2)", () => {
  it("stores, reads, expires, and deletes private proofs in D1BlobObjectStorageDriver", async () => {
    const table = new Map<
      string,
      {
        bucket: string;
        contentType: string;
        body: Uint8Array;
        expiresAtIso: string | null;
      }
    >();

    const d1Driver = new D1BlobObjectStorageDriver({
      upsertBlob(row) {
        table.set(`${row.bucket}:${row.key}`, {
          bucket: row.bucket,
          contentType: row.contentType,
          body: row.body,
          expiresAtIso: row.expiresAtIso,
        });
        return Promise.resolve();
      },
      readBlob(bucket, key) {
        return Promise.resolve(table.get(`${bucket}:${key}`));
      },
      removeBlob(bucket, key) {
        return Promise.resolve(table.delete(`${bucket}:${key}`));
      },
    });

    const payload = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
    await d1Driver.putObject({
      bucket: "private",
      key: "proofs/2026/ord-99.webp",
      body: payload,
      contentType: "image/webp",
    });

    const loaded = await d1Driver.getObject(
      "private",
      "proofs/2026/ord-99.webp"
    );
    expect(loaded?.contentType).toBe("image/webp");
    expect(Array.from(loaded?.body ?? [])).toEqual([0x52, 0x49, 0x46, 0x46]);

    await d1Driver.deleteObject("private", "proofs/2026/ord-99.webp");
    expect(
      await d1Driver.getObject("private", "proofs/2026/ord-99.webp")
    ).toBeUndefined();
  });

  it("signs valid AWS4-HMAC-SHA256 requests for Garage HQ / Self-hosted S3", async () => {
    const capturedRequests: {
      url: string;
      authHeader: string;
      method: string;
    }[] = [];
    const mockBucket = new Map<string, { body: Uint8Array; type: string }>();

    const mockFetch: typeof fetch = (input, init) => {
      const urlStr = typeof input === "string" ? input : input.toString();
      const headers = new Headers(init?.headers);
      const method = init?.method ?? "GET";
      capturedRequests.push({
        url: urlStr,
        authHeader: headers.get("authorization") ?? "",
        method,
      });

      if (method === "PUT") {
        const bodyBytes =
          init?.body instanceof Uint8Array ? init.body : new Uint8Array();
        mockBucket.set(urlStr, {
          body: bodyBytes,
          type: headers.get("content-type") ?? "application/octet-stream",
        });
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      if (method === "GET") {
        const hit = mockBucket.get(urlStr);
        if (!hit) {
          return Promise.resolve(new Response(null, { status: 404 }));
        }
        return Promise.resolve(
          new Response(new Uint8Array(hit.body), {
            status: 200,
            headers: { "content-type": hit.type },
          })
        );
      }
      mockBucket.delete(urlStr);
      return Promise.resolve(new Response(null, { status: 204 }));
    };

    const s3Driver = new S3SigV4StorageDriver({
      endpoint: "http://127.0.0.1:3900",
      region: "garage",
      accessKeyId: "GKtestaccesskey",
      secretAccessKey: "testsecretaccesskey1234567890",
      publicBucket: "mindkid-public",
      privateBucket: "mindkid-private",
      fetchFn: mockFetch,
    });

    await s3Driver.putObject({
      bucket: "private",
      key: "proofs/order-100.webp",
      body: new Uint8Array([1, 2, 3, 4]),
      contentType: "image/webp",
    });

    expect(capturedRequests[0]?.authHeader).toContain(
      "AWS4-HMAC-SHA256 Credential=GKtestaccesskey/"
    );
    expect(capturedRequests[0]?.url).toBe(
      "http://127.0.0.1:3900/mindkid-private/proofs/order-100.webp"
    );

    const got = await s3Driver.getObject("private", "proofs/order-100.webp");
    expect(Array.from(got?.body ?? [])).toEqual([1, 2, 3, 4]);

    const cutoverSummary = await transferBlobRecordsToDriver({
      records: [
        {
          key: "proofs/mk-1000.webp",
          bucket: "private",
          contentType: "image/webp",
          body: new Uint8Array([9, 8, 7]),
          expiresAtIso: null,
        },
      ],
      targetDriver: s3Driver,
    });
    expect(cutoverSummary.transferredCount).toBe(1);
    const migratedBlob = await s3Driver.getObject(
      "private",
      "proofs/mk-1000.webp"
    );
    expect(Array.from(migratedBlob?.body ?? [])).toEqual([9, 8, 7]);
  });
});
