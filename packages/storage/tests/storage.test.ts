import { Buffer } from "node:buffer";
import { beforeAll, describe, expect, it } from "vitest";
import {
  deletePublicImage,
  detectImageMimeType,
  getPublicImage,
  isSvgContent,
  normalizeImageAsset,
  signedUrl,
  uploadPublicImage,
  url,
  verifySignedUrlToken,
} from "#src/index";

// `url()` đọc STORAGE_BASE_URL qua requireFirstEnv, và cổng lint:env-names cho
// phép ghim giá trị xác định trong file test (production thì cấm fallback).
const BASE_URL = "https://assets.example.test";

beforeAll(() => {
  process.env.STORAGE_BASE_URL = BASE_URL;
  process.env.STORAGE_SIGNING_SECRET =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

/** Header thật của từng định dạng — `detectImageMimeType` đọc magic bytes. */
function header(bytes: number[]): Buffer {
  return Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);
}

function makePngWithDimensions(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  buf.writeUInt32BE(13, 8);
  Buffer.from("IHDR", "ascii").copy(buf, 12);
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

function makeJpegWithDimensions(width: number, height: number): Buffer {
  const buf = Buffer.alloc(20);
  // SOI: FF D8
  buf[0] = 0xff;
  buf[1] = 0xd8;
  // SOF0 marker: FF C0, length 11, precision 8, height, width
  buf[2] = 0xff;
  buf[3] = 0xc0;
  buf.writeUInt16BE(11, 4);
  buf[6] = 8;
  buf.writeUInt16BE(height, 7);
  buf.writeUInt16BE(width, 9);
  return buf;
}

describe("detectImageMimeType (BR-IMG-03)", () => {
  it("nhận JPEG theo magic bytes FF D8 FF", () => {
    expect(detectImageMimeType(header([0xff, 0xd8, 0xff]))).toBe("image/jpeg");
  });

  it("nhận PNG theo magic bytes 89 50 4E 47 0D 0A 1A 0A", () => {
    const png = header([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectImageMimeType(png)).toBe("image/png");
  });

  it("nhận WebP theo RIFF....WEBP", () => {
    const webp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectImageMimeType(webp)).toBe("image/webp");
  });

  it("trả null khi payload ngắn hơn 12 byte", () => {
    expect(detectImageMimeType(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull();
  });

  it("trả null cho định dạng không nằm trong danh sách cho phép", () => {
    // GIF87a — ảnh thật nhưng không thuộc ba định dạng được nhận.
    const gif = header([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
    expect(detectImageMimeType(gif)).toBeNull();
  });
});

describe("isSvgContent (BR-IMG-02)", () => {
  it("bắt SVG khai bằng thẻ svg", () => {
    expect(
      isSvgContent(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">'))
    ).toBe(true);
  });

  it("bắt SVG giấu sau khai báo XML", () => {
    expect(isSvgContent(Buffer.from('<?xml version="1.0"?><svg />'))).toBe(
      true
    );
  });

  it("không báo nhầm trên payload nhị phân của PNG", () => {
    const png = header([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(isSvgContent(png)).toBe(false);
  });
});

describe("normalizeImageAsset (BR-IMG-07, §5, §7.2, §9)", () => {
  it("chuẩn hoá ảnh JPEG 3000×2000 về WebP cạnh lớn nhất ≤ 960px và thumbnail 160×160", () => {
    const jpeg3000x2000 = makeJpegWithDimensions(3000, 2000);
    const normalized = normalizeImageAsset(jpeg3000x2000);

    expect(normalized.detectedMimeType).toBe("image/jpeg");
    expect(normalized.outputMimeType).toBe("image/webp");
    expect(normalized.outputExtension).toBe("webp");
    expect(normalized.width).toBe(960);
    expect(normalized.height).toBe(640);
    expect(Math.max(normalized.width, normalized.height)).toBeLessThanOrEqual(
      960
    );
    expect(normalized.thumbWidth).toBe(160);
    expect(normalized.thumbHeight).toBe(160);
    expect(normalized.quality).toBe(82);
  });

  it("chấp nhận ảnh nhỏ hơn 160×160 và không phóng to (§5)", () => {
    const smallPng = makePngWithDimensions(100, 80);
    const normalized = normalizeImageAsset(smallPng);

    expect(normalized.width).toBe(100);
    expect(normalized.height).toBe(80);
    expect(normalized.thumbWidth).toBe(100);
    expect(normalized.thumbHeight).toBe(80);
  });
});

describe("url & signedUrl (BR-IMG-05, BR-IMG-10)", () => {
  it("trả chuỗi rỗng cho đường dẫn rỗng", () => {
    expect(url("")).toBe("");
  });

  it("giữ nguyên URL tuyệt đối", () => {
    expect(url("https://cdn.example.test/a.png")).toBe(
      "https://cdn.example.test/a.png"
    );
  });

  it("bỏ dấu / đầu để không sinh URL hai gạch", () => {
    expect(url("/images/a.png")).toBe(`${BASE_URL}/images/a.png`);
  });

  it("đổi đuôi sang _thumb.webp khi xin variant thumb", () => {
    expect(url("images/a.png", { variant: "thumb" })).toBe(
      `${BASE_URL}/images/a_thumb.webp`
    );
  });

  it("không nối _thumb hai lần khi đường dẫn đã là thumb", () => {
    expect(url("images/a_thumb.webp", { variant: "thumb" })).toBe(
      `${BASE_URL}/images/a_thumb.webp`
    );
  });

  it("sinh signed URL có hạn cho tài nguyên riêng tư và xác thực chữ ký (BR-IMG-10)", () => {
    const signed = signedUrl("proofs/2026/08/order_10.webp", 900);
    const parsed = new URL(signed);
    const expires = Number(parsed.searchParams.get("expires"));
    const signature = parsed.searchParams.get("signature") ?? "";

    expect(
      verifySignedUrlToken("proofs/2026/08/order_10.webp", expires, signature)
    ).toBe(true);
    expect(
      verifySignedUrlToken(
        "proofs/2026/08/order_10.webp",
        Date.now() - 1000,
        signature
      )
    ).toBe(false);
    expect(
      verifySignedUrlToken("proofs/../../etc/passwd", expires, signature)
    ).toBe(false);
  });
});

describe("kho ảnh public trong bộ nhớ (BR-IMG-05, BR-IMG-06)", () => {
  it("đọc lại được ảnh vừa ghi, bất kể dấu / đầu", async () => {
    const body = Buffer.from([1, 2, 3]);
    await uploadPublicImage({
      key: "/images/round-trip.png",
      body,
      contentType: "image/png",
    });

    const stored = getPublicImage("images/round-trip.png");

    expect(stored?.contentType).toBe("image/png");
    expect(Buffer.from(stored?.body ?? []).equals(body)).toBe(true);
  });

  it("xoá xong thì không đọc lại được", async () => {
    await uploadPublicImage({
      key: "images/gone.png",
      body: Buffer.from([9]),
      contentType: "image/png",
    });

    expect(deletePublicImage("/images/gone.png")).toBe(true);
    expect(getPublicImage("images/gone.png")).toBeUndefined();
  });

  it("từ chối đường dẫn tuyệt đối http/https (BR-IMG-05)", async () => {
    await expect(
      uploadPublicImage({
        key: "https://cdn.example.test/images/abs.webp",
        body: Buffer.from([1]),
        contentType: "image/webp",
      })
    ).rejects.toThrow("BR-IMG-05");
  });

  it("cấm ghi đè file cùng path (BR-IMG-06)", async () => {
    await uploadPublicImage({
      key: "content/2026/08/immutable_hash.webp",
      body: Buffer.from([1, 2]),
      contentType: "image/webp",
    });

    await expect(
      uploadPublicImage({
        key: "content/2026/08/immutable_hash.webp",
        body: Buffer.from([3, 4]),
        contentType: "image/webp",
      })
    ).rejects.toThrow("BR-IMG-06");
  });
});
