import { describe, expect, it } from "vitest";
import {
  CLOUDFLARE_HEADERS_MAX_LINE_LENGTH,
  dropOversizedHeaderLines,
} from "../../../cloudflare/headers.js";

describe("cloudflare/headers — dòng _headers vượt giới hạn wrangler", () => {
  it("bỏ dòng dài hơn 2000 ký tự, giữ nguyên header khác và tên rule", () => {
    const long = `  content-security-policy: ${"a".repeat(CLOUDFLARE_HEADERS_MAX_LINE_LENGTH)}`;
    const input = [
      "/guide",
      "  x-frame-options: DENY",
      long,
      "  x-content-type-options: nosniff",
      "/*",
      "  Referrer-Policy: no-referrer",
    ].join("\n");

    const { text, dropped } = dropOversizedHeaderLines(input);

    expect(dropped).toEqual(["content-security-policy"]);
    expect(text.split("\n")).toEqual([
      "/guide",
      "  x-frame-options: DENY",
      "  x-content-type-options: nosniff",
      "/*",
      "  Referrer-Policy: no-referrer",
    ]);
  });

  it("dòng đúng 2000 ký tự được giữ", () => {
    const edge = "x".repeat(CLOUDFLARE_HEADERS_MAX_LINE_LENGTH);
    expect(dropOversizedHeaderLines(edge)).toEqual({ text: edge, dropped: [] });
  });
});
