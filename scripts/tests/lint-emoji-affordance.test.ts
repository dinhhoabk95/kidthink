import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lintEmojiAffordance } from "../lint-emoji-affordance.ts";

describe("lintEmojiAffordance (BR-EMJ-03)", () => {
  it("passes on clean vue fixture", () => {
    const fixtureDir = path.join(
      import.meta.dirname,
      `fixtures-clean-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    fs.mkdirSync(fixtureDir, { recursive: true });

    const cleanVue = path.join(fixtureDir, "CleanComponent.vue");
    fs.writeFileSync(
      cleanVue,
      `<template>\n  <button aria-label="Close button">Close</button>\n</template>`
    );

    const { violations } = lintEmojiAffordance(fixtureDir);
    expect(violations).toHaveLength(0);

    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });

  it("catches emoji affordance in button label (BR-EMJ-03 negative test)", () => {
    const fixtureDir = path.join(
      import.meta.dirname,
      `fixtures-dirty-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    fs.mkdirSync(fixtureDir, { recursive: true });

    const dirtyVue = path.join(fixtureDir, "DirtyComponent.vue");
    fs.writeFileSync(
      dirtyVue,
      `<template>\n  <button aria-label="Close ❌">Cancel</button>\n</template>`
    );

    const { violations } = lintEmojiAffordance(fixtureDir);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toContain("BR-EMJ-03 violation");

    fs.rmSync(fixtureDir, { recursive: true, force: true });
  });
});
