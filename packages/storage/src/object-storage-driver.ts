import { createHash, createHmac } from "node:crypto";

export interface ObjectPutInput {
  readonly bucket: "public" | "private";
  readonly key: string;
  readonly body: Uint8Array;
  readonly contentType: string;
  readonly expiresAt?: Date;
}

export interface ObjectGetResult {
  readonly body: Uint8Array;
  readonly contentType: string;
}

export interface ObjectStorageDriver {
  putObject(input: ObjectPutInput): Promise<{ readonly key: string }>;
  getObject(
    bucket: "public" | "private",
    key: string
  ): Promise<ObjectGetResult | undefined>;
  deleteObject(bucket: "public" | "private", key: string): Promise<boolean>;
}

export interface MinimalBlobSqlPort {
  upsertBlob(row: {
    readonly key: string;
    readonly bucket: string;
    readonly contentType: string;
    readonly byteSize: number;
    readonly bodyBase64: string;
    readonly expiresAtIso: string | null;
  }): Promise<void>;
  readBlob(
    bucket: string,
    key: string
  ): Promise<
    | {
        readonly contentType: string;
        readonly bodyBase64: string;
        readonly expiresAtIso: string | null;
      }
    | undefined
  >;
  removeBlob(bucket: string, key: string): Promise<boolean>;
}

/**
 * Driver Giai đoạn 1 (`STORAGE_DRIVER=d1-blobs` - $0, không cần thẻ tín dụng):
 * Lưu biên lai thanh toán WebP (<= 150 KB) và PDF tạm vào bảng `stored_blobs` trên `mindkid-blobs`.
 */
export class D1BlobObjectStorageDriver implements ObjectStorageDriver {
  private readonly port: MinimalBlobSqlPort;

  constructor(port: MinimalBlobSqlPort) {
    this.port = port;
  }

  async putObject(input: ObjectPutInput): Promise<{ readonly key: string }> {
    const bodyBase64 = Buffer.from(input.body).toString("base64");
    await this.port.upsertBlob({
      key: input.key,
      bucket: input.bucket,
      contentType: input.contentType,
      byteSize: input.body.byteLength,
      bodyBase64,
      expiresAtIso: input.expiresAt ? input.expiresAt.toISOString() : null,
    });
    return { key: input.key };
  }

  async getObject(
    bucket: "public" | "private",
    key: string
  ): Promise<ObjectGetResult | undefined> {
    const row = await this.port.readBlob(bucket, key);
    if (!row) {
      return undefined;
    }
    if (row.expiresAtIso && Date.parse(row.expiresAtIso) <= Date.now()) {
      await this.port.removeBlob(bucket, key);
      return undefined;
    }
    return {
      body: new Uint8Array(Buffer.from(row.bodyBase64, "base64")),
      contentType: row.contentType,
    };
  }

  async deleteObject(
    bucket: "public" | "private",
    key: string
  ): Promise<boolean> {
    return await this.port.removeBlob(bucket, key);
  }
}

export interface S3SigV4DriverConfig {
  readonly endpoint: string;
  readonly region: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly publicBucket: string;
  readonly privateBucket: string;
  readonly fetchFn?: typeof fetch;
}

function sha256Hex(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function formatAmzDate(now: Date): { amzDate: string; dateStamp: string } {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function encodeS3Path(rawKey: string): string {
  return rawKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * Driver Giai đoạn 2 (`STORAGE_DRIVER=s3` trên VPS tự build):
 * Ký chuẩn AWS Signature V4 (path-style) thuần Node/Web crypto, tương thích 100%
 * với Garage HQ, RustFS, MinIO, AWS S3 và Cloudflare R2 mà không cần AWS SDK nặng.
 */
export class S3SigV4StorageDriver implements ObjectStorageDriver {
  private readonly cfg: S3SigV4DriverConfig;

  constructor(cfg: S3SigV4DriverConfig) {
    this.cfg = cfg;
  }

  private resolveBucketName(bucket: "public" | "private"): string {
    return bucket === "public" ? this.cfg.publicBucket : this.cfg.privateBucket;
  }

  private buildSignedHeaders(params: {
    method: "PUT" | "GET" | "DELETE";
    canonicalUri: string;
    payloadHash: string;
    contentType?: string;
    now: Date;
  }): { url: string; headers: Record<string, string> } {
    const endpointUrl = new URL(this.cfg.endpoint);
    const { amzDate, dateStamp } = formatAmzDate(params.now);
    const host = endpointUrl.host;

    const headerEntries: [string, string][] = [
      ["host", host],
      ["x-amz-content-sha256", params.payloadHash],
      ["x-amz-date", amzDate],
    ];
    if (params.contentType) {
      headerEntries.unshift(["content-type", params.contentType]);
    }
    headerEntries.sort((a, b) => a[0].localeCompare(b[0]));

    const canonicalHeaders = headerEntries
      .map(([k, v]) => `${k}:${v.trim()}\n`)
      .join("");
    const signedHeaders = headerEntries.map(([k]) => k).join(";");

    const canonicalRequest = [
      params.method,
      params.canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      params.payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${this.cfg.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");

    const kDate = hmacSha256(`AWS4${this.cfg.secretAccessKey}`, dateStamp);
    const kRegion = hmacSha256(kDate, this.cfg.region);
    const kService = hmacSha256(kRegion, "s3");
    const kSigning = hmacSha256(kService, "aws4_request");
    const signature = createHmac("sha256", kSigning)
      .update(stringToSign, "utf8")
      .digest("hex");

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const headers: Record<string, string> = {
      Authorization: authorization,
      "x-amz-content-sha256": params.payloadHash,
      "x-amz-date": amzDate,
    };
    if (params.contentType) {
      headers["Content-Type"] = params.contentType;
    }

    const baseOrigin = `${endpointUrl.protocol}//${endpointUrl.host}`;
    return {
      url: `${baseOrigin}${params.canonicalUri}`,
      headers,
    };
  }

  async putObject(input: ObjectPutInput): Promise<{ readonly key: string }> {
    const bucketName = this.resolveBucketName(input.bucket);
    const canonicalUri = `/${encodeURIComponent(bucketName)}/${encodeS3Path(input.key)}`;
    const payloadHash = sha256Hex(input.body);
    const signed = this.buildSignedHeaders({
      method: "PUT",
      canonicalUri,
      payloadHash,
      contentType: input.contentType,
      now: new Date(),
    });

    const fetchImpl = this.cfg.fetchFn ?? fetch;
    const response = await fetchImpl(signed.url, {
      method: "PUT",
      headers: signed.headers,
      body: new Uint8Array(input.body),
    });

    if (!response.ok) {
      throw new Error(`S3 PUT failed with status ${response.status}`);
    }
    return { key: input.key };
  }

  async getObject(
    bucket: "public" | "private",
    key: string
  ): Promise<ObjectGetResult | undefined> {
    const bucketName = this.resolveBucketName(bucket);
    const canonicalUri = `/${encodeURIComponent(bucketName)}/${encodeS3Path(key)}`;
    const payloadHash = sha256Hex("");
    const signed = this.buildSignedHeaders({
      method: "GET",
      canonicalUri,
      payloadHash,
      now: new Date(),
    });

    const fetchImpl = this.cfg.fetchFn ?? fetch;
    const response = await fetchImpl(signed.url, {
      method: "GET",
      headers: signed.headers,
    });

    if (response.status === 404) {
      return undefined;
    }
    if (!response.ok) {
      throw new Error(`S3 GET failed with status ${response.status}`);
    }

    const arrayBuf = await response.arrayBuffer();
    return {
      body: new Uint8Array(arrayBuf),
      contentType:
        response.headers.get("content-type") ?? "application/octet-stream",
    };
  }

  async deleteObject(
    bucket: "public" | "private",
    key: string
  ): Promise<boolean> {
    const bucketName = this.resolveBucketName(bucket);
    const canonicalUri = `/${encodeURIComponent(bucketName)}/${encodeS3Path(key)}`;
    const payloadHash = sha256Hex("");
    const signed = this.buildSignedHeaders({
      method: "DELETE",
      canonicalUri,
      payloadHash,
      now: new Date(),
    });

    const fetchImpl = this.cfg.fetchFn ?? fetch;
    const response = await fetchImpl(signed.url, {
      method: "DELETE",
      headers: signed.headers,
    });

    return response.ok || response.status === 204;
  }
}

let activeStorageDriver: ObjectStorageDriver | undefined;

export function setActiveObjectStorageDriver(
  driver: ObjectStorageDriver | undefined
): void {
  activeStorageDriver = driver;
}

export function getActiveObjectStorageDriver():
  | ObjectStorageDriver
  | undefined {
  return activeStorageDriver;
}

export interface BlobCutoverSummary {
  readonly transferredCount: number;
  readonly skippedExpiredCount: number;
  readonly totalBytes: number;
}

export async function transferBlobRecordsToDriver(options: {
  readonly records: readonly {
    readonly key: string;
    readonly bucket: string;
    readonly contentType: string;
    readonly bodyBase64: string;
    readonly expiresAtIso: string | null;
  }[];
  readonly targetDriver: ObjectStorageDriver;
  readonly now?: Date;
}): Promise<BlobCutoverSummary> {
  const nowMs = (options.now ?? new Date()).getTime();
  let transferredCount = 0;
  let skippedExpiredCount = 0;
  let totalBytes = 0;

  for (const row of options.records) {
    if (row.expiresAtIso && Date.parse(row.expiresAtIso) <= nowMs) {
      skippedExpiredCount += 1;
      continue;
    }
    const bucket: "public" | "private" =
      row.bucket === "public" ? "public" : "private";
    const bodyBytes = new Uint8Array(Buffer.from(row.bodyBase64, "base64"));

    await options.targetDriver.putObject({
      bucket,
      key: row.key,
      body: bodyBytes,
      contentType: row.contentType,
      expiresAt: row.expiresAtIso ? new Date(row.expiresAtIso) : undefined,
    });
    transferredCount += 1;
    totalBytes += bodyBytes.byteLength;
  }

  return { transferredCount, skippedExpiredCount, totalBytes };
}
