// @vitest-environment happy-dom

import BrandEmoji from "@mindkid/ui/brand-emoji";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

describe("BrandEmoji component (@mindkid/ui)", () => {
  it("renders custom 2.5D SVG sprite by default for registered emoji and preserves DOM text", () => {
    const wrapper = mount(BrandEmoji, {
      props: {
        emoji: "🍎",
      },
    });

    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("/sprites/emoji/apple.svg");
    expect(img.attributes("aria-hidden")).toBe("true");
    expect(img.attributes("alt")).toBe("");
    expect(img.attributes("loading")).toBe("lazy");
    expect(img.attributes("decoding")).toBe("async");

    const hiddenGlyph = wrapper.find(".sr-only");
    expect(hiddenGlyph.exists()).toBe(true);
    expect(wrapper.text()).toBe("🍎");
  });

  it("renders Tier-3 3D Soft Clay WebP when hero=true and degrades hero -> svg -> glyph on error", async () => {
    const wrapper = mount(BrandEmoji, {
      props: {
        emoji: "🐟",
        hero: true,
        size: 64,
      },
    });

    const firstImg = wrapper.find("img");
    expect(firstImg.exists()).toBe(true);
    expect(firstImg.attributes("src")).toBe("/sprites/hero/fish.webp");
    expect(firstImg.attributes("width")).toBe("64");
    expect(firstImg.attributes("height")).toBe("64");

    await firstImg.trigger("error");
    const fallbackSvgImg = wrapper.find("img");
    expect(fallbackSvgImg.exists()).toBe(true);
    expect(fallbackSvgImg.attributes("src")).toBe("/sprites/emoji/fish.svg");

    await fallbackSvgImg.trigger("error");
    expect(wrapper.find("img").exists()).toBe(false);
    const glyph = wrapper.find(".brand-emoji__glyph");
    expect(glyph.exists()).toBe(true);
    expect(glyph.text()).toBe("🐟");
  });

  it("falls back directly to vector_craft SVG when hero=true on an emoji without heroWebpPath", () => {
    const wrapper = mount(BrandEmoji, {
      props: {
        emoji: "🍌",
        hero: true,
      },
    });

    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("/sprites/emoji/banana.svg");
  });

  it("renders native emoji glyph cleanly when emoji is not yet in custom sprite registry", () => {
    const wrapper = mount(BrandEmoji, {
      props: {
        emoji: "🛸",
      },
    });

    expect(wrapper.find("img").exists()).toBe(false);
    const glyph = wrapper.find(".brand-emoji__glyph");
    expect(glyph.exists()).toBe(true);
    expect(glyph.attributes("aria-hidden")).toBe("true");
    expect(wrapper.text()).toBe("🛸");
  });

  it("exposes accessible alt text and removes aria-hidden when alt is provided", () => {
    const wrapper = mount(BrandEmoji, {
      props: {
        alt: "Quả táo đỏ",
        eager: true,
        emoji: "🍎\uFE0F",
      },
    });

    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("/sprites/emoji/apple.svg");
    expect(img.attributes("alt")).toBe("Quả táo đỏ");
    expect(img.attributes("aria-hidden")).toBeUndefined();
    expect(img.attributes("loading")).toBe("eager");
  });

  it("resets error state when emoji prop changes dynamically", async () => {
    const wrapper = mount(BrandEmoji, {
      props: {
        emoji: "🍎",
      },
    });

    await wrapper.find("img").trigger("error");
    expect(wrapper.find("img").exists()).toBe(false);

    await wrapper.setProps({ emoji: "🐰" });
    const nextImg = wrapper.find("img");
    expect(nextImg.exists()).toBe(true);
    expect(nextImg.attributes("src")).toBe("/sprites/emoji/rabbit.svg");
  });
});
