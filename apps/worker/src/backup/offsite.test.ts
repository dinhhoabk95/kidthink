import { describe, expect, it } from "vitest";
import { type OffsiteTarget, objectKey, signPutRequest } from "./offsite.js";

const TARGET: OffsiteTarget = {
  endpoint: "https://s3.example.com",
  bucket: "mindkid-backups",
  region: "ap-southeast-1",
  prefix: "postgres",
  accessKeyId: "AKIAEXAMPLE",
  secretAccessKey: "secret-example-key",
};

const NOW = new Date("2026-08-28T01:02:03Z");
const SHA = "a".repeat(64);

describe("Offsite backup object layout", () => {
  it("uses the prefix/YYYY/MM/DD path from the spec", () => {
    expect(objectKey("postgres", NOW, "db-backup-x.sql.gz.enc")).toBe(
      "postgres/2026/08/28/db-backup-x.sql.gz.enc"
    );
  });

  it("pads single-digit months and days", () => {
    expect(objectKey("p", new Date("2026-01-05T00:00:00Z"), "f")).toBe(
      "p/2026/01/05/f"
    );
  });
});

describe("SigV4 signing for the backup upload", () => {
  const signed = signPutRequest({
    target: TARGET,
    key: "postgres/2026/08/28/db-backup-x.sql.gz.enc",
    payloadSha256: SHA,
    contentLength: 1234,
    now: NOW,
  });

  it("addresses the object inside the bucket", () => {
    expect(signed.url).toBe(
      "https://s3.example.com/mindkid-backups/postgres/2026/08/28/db-backup-x.sql.gz.enc"
    );
  });

  it("signs with the date and region scope of the request", () => {
    expect(signed.headers.authorization).toContain(
      "Credential=AKIAEXAMPLE/20260828/ap-southeast-1/s3/aws4_request"
    );
    expect(signed.headers["x-amz-date"]).toBe("20260828T010203Z");
  });

  it("commits to the payload hash, so a swapped body is rejected upstream", () => {
    expect(signed.headers["x-amz-content-sha256"]).toBe(SHA);
    expect(signed.headers.authorization).toContain(
      "SignedHeaders=content-length;content-type;host;x-amz-content-sha256;x-amz-date;x-amz-server-side-encryption"
    );
  });

  it("asks the bucket to encrypt at rest as well", () => {
    expect(signed.headers["x-amz-server-side-encryption"]).toBe("AES256");
  });

  it("produces a different signature for a different body", () => {
    const other = signPutRequest({
      target: TARGET,
      key: "postgres/2026/08/28/db-backup-x.sql.gz.enc",
      payloadSha256: "b".repeat(64),
      contentLength: 1234,
      now: NOW,
    });
    expect(other.headers.authorization).not.toBe(signed.headers.authorization);
  });

  it("never puts the secret key in a header", () => {
    expect(JSON.stringify(signed)).not.toContain(TARGET.secretAccessKey);
  });
});
