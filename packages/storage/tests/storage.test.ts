import { Buffer } from "node:buffer";
import { beforeAll, describe, expect, it } from "vitest";
import {
  deletePublicImage,
  detectImageMimeType,
  getPublicImage,
  isSvgContent,
  uploadPublicImage,
  url,
} from "#src/index";

// `url()` đọc STORAGE_BASE_URL qua requireFirstEnv, và cổng lint:env-names cho
// phép ghim giá trị xác định trong file test (production thì cấm fallback).
const BASE_URL = "https://assets.example.test";

beforeAll(() => {
  process.env.STORAGE_BASE_URL = BASE_URL;
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

describe("url (BR-IMG-05)", () => {
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
});

describe("kho ảnh public trong bộ nhớ", () => {
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
});
