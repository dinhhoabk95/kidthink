import { Buffer } from "node:buffer";
import { beforeAll, describe, expect, it } from "vitest";
import {
  detectImageMimeType,
  isSvgContent,
  signedUrl,
  verifySignedUrlToken,
} from "#src/index";

// `signedUrl()` đọc STORAGE_BASE_URL qua requireFirstEnv, và cổng lint:env-names cho
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

describe("signedUrl (BR-IMG-10)", () => {
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

  it("chỉ chấp nhận chữ ký đúng 64 ký tự hex, không nhận đuôi rác (BR-IMG-10)", () => {
    const signed = signedUrl("proofs/2026/08/order_11.webp", 900);
    const parsed = new URL(signed);
    const expires = Number(parsed.searchParams.get("expires"));
    const signature = parsed.searchParams.get("signature") ?? "";
    const path = "proofs/2026/08/order_11.webp";

    expect(verifySignedUrlToken(path, expires, signature)).toBe(true);
    expect(verifySignedUrlToken(path, expires, `${signature}zz`)).toBe(false);
    expect(verifySignedUrlToken(path, expires, `${signature}00`)).toBe(false);
    expect(verifySignedUrlToken(path, expires, signature.slice(0, 62))).toBe(
      false
    );
    expect(verifySignedUrlToken(path, expires, signature.toUpperCase())).toBe(
      false
    );
  });
});
