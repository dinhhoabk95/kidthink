import { describe, expect, it } from "vitest";
import { resolveAssets } from "../src/asset-resolver";

describe("Task 1 — Server Asset Resolution (BR-CFG-07)", () => {
  it("resolves emoji reference to glyph from registry", () => {
    const contentPack = {
      prompt_vi: "Chọn quả táo đỏ",
      target_item: {
        item_id: "i1",
        asset: { kind: "emoji", ref: "EMJ-red-apple" },
      },
    };

    const assets = resolveAssets(contentPack);
    expect(assets).toEqual([
      { ref: "EMJ-red-apple", kind: "emoji", glyph: "🍎" },
    ]);
  });

  it("resolves image and audio references via lookup functions", () => {
    const contentPack = {
      prompt_vi: "Nghe và xem hình",
      prompt_audio_ref: "AUD-instr-001",
      image: { kind: "image", ref: "IMG-farm-bg" },
    };

    const assets = resolveAssets(contentPack, {
      imageStorageLookup: (ref) =>
        ref === "IMG-farm-bg"
          ? {
              url: "https://storage.kidthink.vn/images/farm.png",
              width: 800,
              height: 600,
            }
          : null,
      audioStorageLookup: (ref) =>
        ref === "AUD-instr-001"
          ? {
              url: "https://storage.kidthink.vn/audio/instr1.mp3",
              duration_ms: 2500,
            }
          : null,
    });

    expect(assets).toEqual([
      {
        ref: "AUD-instr-001",
        kind: "audio",
        url: "https://storage.kidthink.vn/audio/instr1.mp3",
        duration_ms: 2500,
      },
      {
        ref: "IMG-farm-bg",
        kind: "image",
        url: "https://storage.kidthink.vn/images/farm.png",
        width: 800,
        height: 600,
      },
    ]);
  });

  it("handles missing asset gracefully with error: not_found (BR-CFG-07 failure mode)", () => {
    const contentPack = {
      target_item: {
        item_id: "i1",
        asset: { kind: "emoji", ref: "EMJ-nonexistent-999" },
      },
      image: { kind: "image", ref: "IMG-deleted-image" },
    };

    const assets = resolveAssets(contentPack, {
      imageStorageLookup: () => null,
    });

    expect(assets).toEqual([
      { ref: "EMJ-nonexistent-999", kind: "emoji", error: "not_found" },
      { ref: "IMG-deleted-image", kind: "image", error: "not_found" },
    ]);
  });
});
