import { describe, expect, it } from "vitest";
import {
  checkSecondKitInLockfile,
  runLintTokensOnContent,
  runTokenGate,
} from "#src/lint-tokens";

describe("Task 2: Expanded lint:tokens Rules & Negative Fixtures (D-FC)", () => {
  it("BR-DSC-01: flags hex literals in .vue files (template, style, inline style)", () => {
    const fixtureTemplate = `<template><div style="color: #ff0000;">Hello</div></template>`;
    const fixtureStyle =
      "<template><div>Hello</div></template><style> .box { background: #00ff00; } </style>";

    const findingsTemplate = runLintTokensOnContent(
      fixtureTemplate,
      "components/TestComponent.vue"
    );
    const findingsStyle = runLintTokensOnContent(
      fixtureStyle,
      "components/TestComponent.vue"
    );

    expect(findingsTemplate.some((f) => f.rule === "BR-DSC-01")).toBe(true);
    expect(findingsStyle.some((f) => f.rule === "BR-DSC-01")).toBe(true);
  });

  it("BR-DSC-02: flags hex literals in game-engine outside designTokens.ts", () => {
    const fixtureCode = `export const renderScore = () => { ctx.fillStyle = "#123456"; };`;
    const findings = runLintTokensOnContent(
      fixtureCode,
      "packages/game-engine/src/systems/render.ts"
    );
    expect(findings.some((f) => f.rule === "BR-DSC-02")).toBe(true);
  });

  it("BR-DSC-03: flags second kit imports, cn(), and components/ui/", () => {
    const fixtureImport = `import { clsx } from "clsx";`;
    const fixtureCva = `import { cva } from "class-variance-authority";`;
    const fixtureCn = `const className = cn("p-4", "m-2");`;
    const fixtureUiPath = `import Button from "../components/ui/Button.vue";`;

    expect(
      runLintTokensOnContent(fixtureImport, "apps/web/app/Component.vue").some(
        (f) => f.rule === "BR-DSC-03"
      )
    ).toBe(true);
    expect(
      runLintTokensOnContent(fixtureCva, "apps/web/app/Component.vue").some(
        (f) => f.rule === "BR-DSC-03"
      )
    ).toBe(true);
    expect(
      runLintTokensOnContent(fixtureCn, "apps/web/app/Component.vue").some(
        (f) => f.rule === "BR-DSC-03"
      )
    ).toBe(true);
    expect(
      runLintTokensOnContent(fixtureUiPath, "apps/web/app/Component.vue").some(
        (f) => f.rule === "BR-DSC-03"
      )
    ).toBe(true);
  });

  it("BR-DSC-03: checks pnpm-lock.yaml for forbidden second kit packages", () => {
    const mockLockfile = `
packages:
  /lucide-vue-next@0.300.0:
    resolution: {integrity: sha512-...}
`;
    const result = checkSecondKitInLockfile(mockLockfile);
    expect(result.some((f) => f.rule === "BR-DSC-03")).toBe(true);
  });

  it("BR-DSC-05: flags emoji in aria-label or label affordance position", () => {
    const fixtureAria = `<button aria-label="Home 🏠">Click</button>`;
    const fixtureLabel = `<UButton label="Play 🎮" />`;

    expect(
      runLintTokensOnContent(fixtureAria, "apps/web/app/Component.vue").some(
        (f) => f.rule === "BR-DSC-05"
      )
    ).toBe(true);
    expect(
      runLintTokensOnContent(fixtureLabel, "apps/web/app/Component.vue").some(
        (f) => f.rule === "BR-DSC-05"
      )
    ).toBe(true);
  });

  it("BR-DSC-06: flags dark: modifier on kid surface", () => {
    const fixtureKid = `<div class="bg-white dark:bg-black">Kid Content</div>`;
    expect(
      runLintTokensOnContent(
        fixtureKid,
        "apps/web/app/components/kid/Card.vue"
      ).some((f) => f.rule === "BR-DSC-06")
    ).toBe(true);
    expect(
      runLintTokensOnContent(
        fixtureKid,
        "apps/web/app/pages/play/index.vue"
      ).some((f) => f.rule === "BR-DSC-06")
    ).toBe(true);
  });

  it("BR-DSC-13: flags .vue files with > 800 lines", () => {
    const longVueFile =
      "<template>\n<div>\n" +
      "  <p>Line</p>\n".repeat(801) +
      "</div>\n</template>";
    expect(
      runLintTokensOnContent(longVueFile, "apps/web/app/BigComponent.vue").some(
        (f) => f.rule === "BR-DSC-13"
      )
    ).toBe(true);
  });

  it("BR-DSC-14: flags rounded-md and rounded-lg classes", () => {
    const fixtureRoundedMd = `<button class="p-4 rounded-md">Click</button>`;
    const fixtureRoundedLg = `<div class="bg-card rounded-lg">Panel</div>`;

    expect(
      runLintTokensOnContent(
        fixtureRoundedMd,
        "apps/web/app/Component.vue"
      ).some((f) => f.rule === "BR-DSC-14")
    ).toBe(true);
    expect(
      runLintTokensOnContent(
        fixtureRoundedLg,
        "apps/web/app/Component.vue"
      ).some((f) => f.rule === "BR-DSC-14")
    ).toBe(true);
  });

  it("BR-A11-09: flags uppercase transformation applied on Vietnamese elements", () => {
    const fixtureCss = ".btn-vi { text-transform: uppercase; }";
    const fixtureClass = `<span class="uppercase">Tiếng Việt</span>`;

    expect(
      runLintTokensOnContent(fixtureCss, "apps/web/app/assets/style.css").some(
        (f) => f.rule === "BR-A11-09"
      )
    ).toBe(true);
    expect(
      runLintTokensOnContent(fixtureClass, "apps/web/app/Component.vue").some(
        (f) => f.rule === "BR-A11-09"
      )
    ).toBe(true);
  });
});

describe("Cổng lint:tokens trên repo thật", () => {
  it("không còn giá trị design token viết cứng trong apps/ và packages/", () => {
    expect(runTokenGate()).toEqual([]);
  });
});
